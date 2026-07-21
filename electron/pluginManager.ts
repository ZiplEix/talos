import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { getSetting, getSchedules, createChat, addMessage } from './db';
import { app } from 'electron';
import { exec } from 'child_process';

export interface Plugin {
  id: string;
  name: string;
  description?: string;
  configFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'number' | 'boolean';
    default?: any;
    required?: boolean;
  }>;
  chatConfigFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'number' | 'boolean';
    placeholder?: string;
    default?: any;
    required?: boolean;
  }>;
  initialize?: (config: Record<string, any>, context: any) => Promise<void> | void;
  tools?: any[];
  executeTool?: (name: string, args: any, chatId?: string) => Promise<string | null>;
  slashCommands?: Array<{
    command: string;
    description: string;
    execute: (args: string[]) => Promise<string>;
  }>;
}

let loadedPlugins: Plugin[] = [];

/**
 * Dynamically loads Javascript plugins from the specified folder.
 */
export async function loadPlugins(pluginsDir: string): Promise<void> {
  try {
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }

    const items = fs.readdirSync(pluginsDir);
    loadedPlugins = [];

    for (const item of items) {
      if (item === '.' || item === '..') continue;
      
      const itemPath = path.join(pluginsDir, item);
      const stat = fs.statSync(itemPath);

      let pluginPath = '';
      if (stat.isDirectory()) {
        const pkgPath = path.join(itemPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            const entry = pkg.main || 'index.js';
            pluginPath = path.join(itemPath, entry);
          } catch (e) {
            console.error(`[PluginManager] Failed to read package.json in ${itemPath}:`, e);
            continue;
          }
        } else {
          // If directory has no package.json, default to index.js
          const indexPath = path.join(itemPath, 'index.js');
          if (fs.existsSync(indexPath)) {
            pluginPath = indexPath;
          } else {
            continue;
          }
        }
      } else if (item.endsWith('.js') || item.endsWith('.ts')) {
        pluginPath = itemPath;
      } else {
        continue;
      }

      if (fs.existsSync(pluginPath)) {
        try {
          const fileUrl = pathToFileURL(pluginPath).href;
          // Dynamically import ESM module
          const module = await import(fileUrl);
          const plugin: Plugin = module.default || module;

          if (plugin && plugin.id && plugin.name) {
            loadedPlugins.push(plugin);
            console.log(`[PluginManager] Loaded plugin: ${plugin.name} (${plugin.id})`);
          } else {
            console.warn(`[PluginManager] Skipped invalid plugin from ${pluginPath}: missing 'id' or 'name' property.`);
          }
        } catch (err) {
          console.error(`[PluginManager] Failed to load plugin from ${pluginPath}:`, err);
        }
      }
    }
  } catch (error) {
    console.error(`[PluginManager] Error reading plugins directory:`, error);
  }
}

/**
 * Resolves each plugin's requested configuration settings and triggers the initialize hook.
 */
export async function initializePlugins(): Promise<void> {
  console.log(`[PluginManager] Initializing ${loadedPlugins.length} plugins...`);
  const context = {
    getSetting,
    getSchedules,
    createChat,
    addMessage
  };

  for (const plugin of loadedPlugins) {
    if (plugin.initialize) {
      const configValues: Record<string, any> = {};
      const fields = plugin.configFields || [];

      for (const field of fields) {
        const dbKey = `plugin_${plugin.id}_${field.key}`;
        // Read configuration from the database settings
        const value = await getSetting(dbKey, String(field.default ?? ''));
        
        // Parse types accordingly
        if (field.type === 'boolean') {
          configValues[field.key] = value === 'true';
        } else if (field.type === 'number') {
          configValues[field.key] = parseInt(value, 10) || 0;
        } else {
          configValues[field.key] = value;
        }
      }

      try {
        await plugin.initialize(configValues, context);
        console.log(`[PluginManager] Plugin ${plugin.id} successfully initialized.`);
      } catch (err) {
        console.error(`[PluginManager] Failed to run initialize for plugin ${plugin.id}:`, err);
      }
    }
  }
}

/**
 * Returns all loaded plugin configuration schemas.
 */
export function getPluginConfigSchemas() {
  return loadedPlugins.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    configFields: p.configFields || [],
    chatConfigFields: p.chatConfigFields || []
  }));
}

/**
 * Returns a list of all loaded plugins.
 */
export function getLoadedPlugins(): Plugin[] {
  return loadedPlugins;
}

/**
 * Compiles and returns all tool definitions registered by plugins.
 */
export function getPluginTools(): any[] {
  return loadedPlugins.flatMap(p => p.tools || []);
}

/**
 * Searches loaded plugins for a match and executes the custom tool if found.
 */
export async function executePluginTool(
  name: string,
  args: any,
  chatId?: string
): Promise<string | null> {
  for (const plugin of loadedPlugins) {
    if (plugin.executeTool && plugin.tools?.some(t => t.function.name === name)) {
      if (chatId) {
        const enabled = await getSetting(`chat_${chatId}_plugin_${plugin.id}_enabled`, 'false') === 'true';
        if (!enabled) {
          return `error: Le plugin '${plugin.name}' est désactivé pour cette discussion.`;
        }
      }
      try {
        const result = await plugin.executeTool(name, args, chatId);
        if (result !== null) return result;
      } catch (err: any) {
        console.error(`[PluginManager] Error executing tool ${name} on plugin ${plugin.id}:`, err);
        return `error: Plugin failed executing tool: ${err.message}`;
      }
    }
  }
  return null;
}

/**
 * Compiles a list of custom slash commands registered by plugins.
 */
export function getPluginSlashCommands() {
  return loadedPlugins.flatMap(p => 
    (p.slashCommands || []).map(cmd => ({
      command: cmd.command,
      description: cmd.description
    }))
  );
}

/**
 * Executes a custom slash command from loaded plugins.
 */
export async function executePluginSlashCommand(
  command: string,
  args: string[]
): Promise<string | null> {
  for (const plugin of loadedPlugins) {
    const match = plugin.slashCommands?.find(c => c.command.toLowerCase() === command.toLowerCase());
    if (match) {
      try {
        // Bind the execute function context (this) to the plugin instance
        return await match.execute.call(plugin, args);
      } catch (err: any) {
        console.error(`[PluginManager] Error executing command ${command} on plugin ${plugin.id}:`, err);
        return `Error: command execution failed: ${err.message}`;
      }
    }
  }
  return null;
}

/**
 * Seeds the default plugins from the codebase's root "pluggins" folder to the user's plugin directory.
 */
export async function seedDefaultPlugins(userPluginsDir: string): Promise<void> {
  try {
    if (!fs.existsSync(userPluginsDir)) {
      fs.mkdirSync(userPluginsDir, { recursive: true });
    }

    const srcDir = path.join(app.getAppPath(), 'pluggins');
    if (fs.existsSync(srcDir)) {
      const items = fs.readdirSync(srcDir);
      for (const item of items) {
        if (item === '.' || item === '..') continue;

        const srcPath = path.join(srcDir, item);
        const destPath = path.join(userPluginsDir, item);

        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
          if (!fs.existsSync(destPath)) {
            // Copy folder structure recursively
            fs.cpSync(srcPath, destPath, { recursive: true });
            console.log(`[PluginManager] Seeded default plugin directory: ${item}`);

            // Install dependencies if package.json is present and node_modules is missing
            const pkgPath = path.join(destPath, 'package.json');
            const nodeModulesPath = path.join(destPath, 'node_modules');
            if (fs.existsSync(pkgPath) && !fs.existsSync(nodeModulesPath)) {
              try {
                console.log(`[PluginManager] Installing dependencies for seeded plugin ${item}...`);
                await installPluginDependencies(destPath);
              } catch (err) {
                console.error(`[PluginManager] Failed to install dependencies for seeded plugin ${item}:`, err);
              }
            }
          }
        } else {
          // If it's a standalone file
          if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`[PluginManager] Seeded default plugin file: ${item}`);
          }
        }
      }
    } else {
      console.warn(`[PluginManager] Source default plugins folder not found at ${srcDir}`);
    }
  } catch (e) {
    console.error('[PluginManager] Failed to seed default plugins:', e);
  }
}

/**
 * Runs npm/bun install inside the plugin directory to resolve local package.json dependencies.
 */
export function installPluginDependencies(pluginPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd = 'bun install';
    if (fs.existsSync(path.join(pluginPath, 'package-lock.json'))) {
      cmd = 'npm install';
    } else if (fs.existsSync(path.join(pluginPath, 'pnpm-lock.yaml'))) {
      cmd = 'pnpm install';
    } else if (fs.existsSync(path.join(pluginPath, 'yarn.lock'))) {
      cmd = 'yarn install';
    }

    console.log(`[PluginManager] Running '${cmd}' in ${pluginPath}...`);
    exec(cmd, { cwd: pluginPath }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[PluginManager] Failed to install dependencies in ${pluginPath}:`, error);
        reject(error);
      } else {
        console.log(`[PluginManager] Dependencies installed successfully in ${pluginPath}.`);
        resolve();
      }
    });
  });
}

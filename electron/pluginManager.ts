import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { getSetting } from './db';

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
  initialize?: (config: Record<string, any>) => Promise<void> | void;
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

    const files = fs.readdirSync(pluginsDir);
    loadedPlugins = [];

    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        try {
          const pluginPath = path.join(pluginsDir, file);
          const fileUrl = pathToFileURL(pluginPath).href;
          
          // Dynamically import ESM module
          const module = await import(fileUrl);
          const plugin: Plugin = module.default || module;

          if (plugin && plugin.id && plugin.name) {
            loadedPlugins.push(plugin);
            console.log(`[PluginManager] Loaded plugin: ${plugin.name} (${plugin.id})`);
          } else {
            console.warn(`[PluginManager] Skipped invalid plugin in file ${file}: missing 'id' or 'name' property.`);
          }
        } catch (err) {
          console.error(`[PluginManager] Failed to load plugin file ${file}:`, err);
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
        await plugin.initialize(configValues);
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
    configFields: p.configFields || []
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

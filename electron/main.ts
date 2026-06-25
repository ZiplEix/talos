import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getChats, createChat, deleteChat, getProviders, saveProvider, deleteProvider, getModels, addModel, deleteModel, getMessages, addMessage, getSetting, setSetting } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
        color: '#111827',
        symbolColor: '#747d8c',
        height: 32
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // SvelteKit génère son build dans le dossier /build (et non /dist)
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

// Enregistrement des IPC handlers pour SQLite
ipcMain.handle('chats:get', async () => {
  return await getChats();
});

ipcMain.handle('chats:create', async (_, id: string, title: string) => {
  return await createChat(id, title);
});

ipcMain.handle('chats:delete', async (_, id: string) => {
  return await deleteChat(id);
});

// Handlers pour les Providers et Modèles
ipcMain.handle('providers:get', async () => {
  return await getProviders();
});

ipcMain.handle('providers:save', async (_, id: string, name: string, baseUrl: string, apiKey: string) => {
  return await saveProvider(id, name, baseUrl, apiKey);
});

ipcMain.handle('providers:delete', async (_, id: string) => {
  return await deleteProvider(id);
});

ipcMain.handle('models:get', async (_, providerId: string) => {
  return await getModels(providerId);
});

ipcMain.handle('models:add', async (_, id: string, providerId: string, name: string) => {
  return await addModel(id, providerId, name);
});

ipcMain.handle('models:delete', async (_, id: string) => {
  return await deleteModel(id);
});

// Handlers pour les messages des chats
ipcMain.handle('messages:get', async (_, chatId: string) => {
  return await getMessages(chatId);
});

ipcMain.handle('messages:add', async (_, id: string, chatId: string, role: string, content: string) => {
  return await addMessage(id, chatId, role, content);
});

// Handlers pour les réglages de l'application (modèle actif, etc.)
ipcMain.handle('settings:get', async (_, key: string, defaultValue: string) => {
  return await getSetting(key, defaultValue);
});

ipcMain.handle('settings:set', async (_, key: string, value: string) => {
  return await setSetting(key, value);
});

// Handlers pour le dossier de travail actuel (CWD)
ipcMain.handle('cwd:get', () => {
  return process.cwd();
});

ipcMain.handle('cwd:select', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Choisir le dossier de travail'
  });
  if (result.canceled) return null;
  const selectedPath = result.filePaths[0];
  try {
    process.chdir(selectedPath);
    await setSetting('talos_cwd', selectedPath);
    console.log('Working directory changed to:', selectedPath);
  } catch (err) {
    console.error('Failed to change process directory:', err);
  }
  return selectedPath;
});

// Handler pour l'exécution d'appels d'API OpenAI / Ollama
ipcMain.handle('openai:chat', async (_, providerId: string, model: string, chatMessages: any[]) => {
  const providersList = await getProviders();
  const provider = providersList.find(p => p.id === providerId);
  if (!provider) {
    throw new Error(`Provider introuvable : ${providerId}`);
  }
  
  // S'assurer que le chemin d'Ollama finit par /v1 pour le client officiel
  let baseUrl = provider.base_url;
  if (providerId === 'ollama' && !baseUrl.endsWith('/v1') && !baseUrl.endsWith('/v1/')) {
    baseUrl = baseUrl.replace(/\/$/, '') + '/v1';
  }

  const client = new OpenAI({
    apiKey: provider.api_key || 'dummy-key',
    baseURL: baseUrl,
  });

  const response = await client.chat.completions.create({
    model: model,
    messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
  });

  return response.choices[0].message;
});

// Handler pour le streaming d'appels d'API OpenAI / Ollama
ipcMain.on('openai:chat-stream-start', async (event, providerId: string, model: string, chatMessages: any[], chatId: string, requestId: string) => {
  try {
    const providersList = await getProviders();
    const provider = providersList.find(p => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider introuvable : ${providerId}`);
    }
    
    // S'assurer que le chemin d'Ollama finit par /v1 pour le client officiel
    let baseUrl = provider.base_url;
    if (providerId === 'ollama' && !baseUrl.endsWith('/v1') && !baseUrl.endsWith('/v1/')) {
      baseUrl = baseUrl.replace(/\/$/, '') + '/v1';
    }

    const client = new OpenAI({
      apiKey: provider.api_key || 'dummy-key',
      baseURL: baseUrl,
    });

    const stream = await client.chat.completions.create({
      model: model,
      messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullText += text;
        event.sender.send('openai:chat-stream-chunk', { chatId, requestId, text });
      }
    }

    // Sauvegarder le message complet dans la base de données
    await addMessage(requestId, chatId, 'assistant', fullText);

    // Notifier le renderer de la fin du flux
    event.sender.send('openai:chat-stream-end', { chatId, requestId });
  } catch (err: any) {
    console.error('Error in openai:chat-stream-start:', err);
    event.sender.send('openai:chat-stream-error', { 
      chatId, 
      requestId, 
      error: err instanceof Error ? err.message : String(err) 
    });
  }
});


app.whenReady().then(async () => {
  try {
    await initDb();
    const savedCwd = await getSetting('talos_cwd', '');
    if (savedCwd) {
      try {
        process.chdir(savedCwd);
        console.log('Restored working directory on startup to:', savedCwd);
      } catch (e) {
        console.error('Failed to restore working directory on startup:', e);
      }
    }
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la base de données :', err);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

import { BrowserWindow } from 'electron';

export default {
  id: 'web-browser-plugin',
  name: 'Navigateur Web',
  description: 'Permet à l\'IA de lire et naviguer sur des pages web.',
  tools: [
    {
      type: 'function',
      function: {
        name: 'FetchWebPage',
        description: 'Fetch URL content',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The absolute URL to fetch'
            }
          },
          required: ['url']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'BrowseWebPage',
        description: 'Browse a webpage with a headless Electron browser (JavaScript enabled)',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The absolute URL to load'
            },
            wait_ms: {
              type: 'number',
              description: 'Milliseconds to wait after load'
            },
            extract_mode: {
              type: 'string',
              description: 'Content type: "text" or "html"'
            }
          },
          required: ['url']
        }
      }
    }
  ],
  async executeTool(name, args, chatId) {
    if (name === 'FetchWebPage') {
      const url = args.url;
      if (!url || typeof url !== 'string') {
        return 'error: url parameter is missing or not a string';
      }
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          return `error: fetch request failed with status code ${resp.status}`;
        }
        const text = await resp.text();
        return text;
      } catch (err) {
        return `error fetching page: ${err.message}`;
      }
    }

    if (name === 'BrowseWebPage') {
      const url = args.url;
      if (!url || typeof url !== 'string') {
        return 'error: url parameter is missing or not a string';
      }

      // Block internal/dangerous protocols
      const lowerUrl = url.toLowerCase().trim();
      if (
        lowerUrl.startsWith('file://') ||
        lowerUrl.startsWith('chrome://') ||
        lowerUrl.startsWith('about://') ||
        lowerUrl.startsWith('data:') ||
        lowerUrl.startsWith('javascript:')
      ) {
        return 'error: browsing internal or dangerous protocols is not allowed';
      }

      const waitMs = typeof args.wait_ms === 'number' ? args.wait_ms : 2000;
      const extractMode = typeof args.extract_mode === 'string' ? args.extract_mode : 'text';

      if (extractMode !== 'text' && extractMode !== 'html') {
        return 'error: extract_mode must be either "text" or "html"';
      }

      if (waitMs < 100) {
        return 'error: wait_ms must be at least 100';
      }

      const MAX_WAIT = 30000;
      if (waitMs > MAX_WAIT) {
        return `error: wait_ms cannot exceed ${MAX_WAIT}ms`;
      }

      let win = null;
      let globalTimeout = null;

      try {
        win = new BrowserWindow({
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            javascript: true,
            images: false,
            webSecurity: true,
          },
        });

        // Global timeout security
        const timeoutPromise = new Promise((_, reject) => {
          globalTimeout = setTimeout(() => {
            reject(new Error(`Page load timed out after ${MAX_WAIT}ms`));
          }, MAX_WAIT);
        });

        const loadPromise = win.loadURL(url);

        await Promise.race([loadPromise, timeoutPromise]);

        // Clear the timeout since the page loaded successfully
        if (globalTimeout) {
          clearTimeout(globalTimeout);
          globalTimeout = null;
        }

        // Wait for JavaScript execution to complete
        await new Promise((resolve) => setTimeout(resolve, waitMs));

        // Extract content based on mode
        let content;
        if (extractMode === 'html') {
          content = await win.webContents.executeJavaScript(
            'document.documentElement.outerHTML'
          );
        } else {
          content = await win.webContents.executeJavaScript(
            'document.body ? document.body.innerText : ""'
          );
        }

        return content || '(empty page)';
      } catch (err) {
        return `error browsing page: ${err.message}`;
      } finally {
        if (globalTimeout) {
          clearTimeout(globalTimeout);
        }
        if (win && !win.isDestroyed()) {
          try {
            win.close();
          } catch (e) {
            // ignore close errors
          }
        }
      }
    }
    return null;
  }
};

# Talos

[![Version](https://img.shields.io/badge/version-0.0.1--alpha-blue)](https://github.com/ZiplEix/talos)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![Svelte](https://img.shields.io/badge/Svelte-5-orange)](https://svelte.dev)
[![Electron](https://img.shields.io/badge/Electron-42-blueviolet)](https://www.electronjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)](https://www.typescriptlang.org)

**Talos** is a desktop AI coding assistant built with Electron and SvelteKit. It connects to any OpenAI-compatible LLM provider (Ollama, OpenRouter, OpenAI, etc.) and gives the model powerful tool access — file system operations, shell commands, web search, and more — all through a beautiful native interface.

Talos operates as an intelligent agent that can autonomously read, write, search, and manipulate your project files, execute commands, browse the web, and iterate on tasks through multiple tool-calling cycles.

---

## ✨ Features

- **🧠 Intelligent AI Agent** — The model can read, write, search files, execute shell commands, browse the web, search Google, and more through a tool-calling loop
- **💬 Streaming Chat** — Real-time streaming responses from any OpenAI-compatible API
- **🔄 Multi-Provider** — Seamlessly switch between Ollama, OpenRouter, OpenAI, or any custom provider
- **🔧 Tool-Using Architecture** — Automatic multi-turn tool execution: the model calls tools, receives results, and continues reasoning
- **💾 Local Persistence** — Conversations, providers, and models stored in SQLite3 (with localStorage fallback)
- **📁 Working Directory** — Set a project folder as the AI's working context; the agent operates within it
- **🔍 Gitignore-Aware** — File listing and tree operations respect `.gitignore` rules
- **📝 Markdown Rendering** — Beautiful markdown rendering for all AI responses
- **🎨 Modern UI** — Built with Svelte 5, Tailwind CSS, and a dark theme optimized for long coding sessions
- **⚡ Cross-Platform** — Runs on macOS, Windows, and Linux via Electron

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) (or Node.js >= 18)
- [Ollama](https://ollama.com) (optional, for local models)

### 1. Clone & Install

```bash
git clone https://github.com/ZiplEix/talos.git
cd talos
bun install
```

### 2. Run in Development Mode

```bash
bun run dev
```

This starts Vite + SvelteKit dev server with Electron. The app window will open automatically.

### 3. Configure a Provider

By default, Talos comes with an Ollama provider pre-configured pointing to `http://localhost:11434/v1`.

To add a new provider:

1. Click **Settings** in the sidebar
2. Go to the **Providers** tab
3. Fill in the provider name, base URL, and API key (if required)
4. Add model names under the provider

Alternatively, you can manage providers from within the chat using the model selector in the bottom toolbar.

### 4. Start Chatting

Select a model from the bottom toolbar, set your working directory, and start sending messages! The AI agent will respond and can autonomously use tools to help you.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│                  Electron                     │
│  ┌────────────────────────────────────────┐   │
│  │          Main Process (main.ts)         │   │
│  │  - IPC handlers                        │   │
│  │  - OpenAI API streaming                │   │
│  │  - Tool dispatch engine                │   │
│  │  - SQLite3 database                    │   │
│  └────────────┬───────────────────────────┘   │
│               │          │                     │
│  ┌────────────▼──────────▼────────────────┐   │
│  │         Preload (preload.ts)            │   │
│  │    contextBridge → window.talosAPI      │   │
│  └────────────────┬───────────────────────┘   │
│                   │                            │
│  ┌────────────────▼───────────────────────┐   │
│  │         Renderer (SvelteKit)           │   │
│  │  - Chat UI with streaming             │   │
│  │  - Settings (providers, models)       │   │
│  │  - Markdown rendering                  │   │
│  │  - Sidebar & navigation               │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### Key Components

| Layer | Description |
|---|---|
| **`electron/main.ts`** | Electron main process: window management, IPC handlers, OpenAI API calls with streaming, tool execution loop |
| **`electron/preload.ts`** | Secure bridge exposing `window.talosAPI` to the renderer via `contextBridge` |
| **`electron/db.ts`** | SQLite3 database: chats, messages, providers, models, app settings |
| **`electron/tools.ts`** | Tool implementations: Read, Write, Bash, List, Tree, FetchWebPage, GoogleSearch, FileSearch, ReadRange, ReplaceInFile |
| **`src/routes/`** | SvelteKit pages: chat, settings, agents (WIP) |
| **`src/lib/components/`** | Reusable Svelte components: Sidebar, Header, ModelSelector, ProvidersSettings, DatabaseSettings |

---

## 🛠️ Available Tools

When Talos calls the AI, the model has access to these tools. The agent can use them autonomously in a loop:

| Tool | Description |
|---|---|
| `Read(file_path)` | Read and return the full content of a file |
| `Write(file_path, content)` | Write content to a file (creates it if it doesn't exist) |
| `Mkdir(directory_path)` | Create a directory, including parent directories |
| `Bash(command)` | Execute a shell command and return its output |
| `List(directory)` | List files in a directory (respects `.gitignore`, returns detailed JSON) |
| `Tree(directory, max_depth?)` | Display a visual tree representation of a directory structure (respects `.gitignore`) |
| `FetchWebPage(url)` | Fetch and return the raw content of a webpage |
| `GoogleSearch(query)` | Search Google and return a list of results (titles, URLs, snippets) |
| `FileSearch(pattern, directory)` | Recursively search for a keyword/pattern within a directory or file |
| `ReadRange(file_path, start_line, end_line)` | Read a specific line range from a file (avoids loading the entire file) |
| `ReplaceInFile(file_path, old_content, new_content)` | Replace a uniquely identified block of text in a file |

---

## 📁 Project Structure

```
talos/
├── electron/
│   ├── main.ts          # Electron main process, IPC handlers, streaming, tool loop
│   ├── preload.ts       # contextBridge API exposure
│   ├── db.ts            # SQLite3 database (chats, messages, providers, models, settings)
│   └── tools.ts         # Tool implementations (Read, Write, Bash, etc.)
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Sidebar.svelte           # Chat list sidebar
│   │   │   ├── Header.svelte            # Top window header
│   │   │   ├── ModelSelector.svelte     # Provider/model dropdown
│   │   │   ├── ProvidersSettings.svelte # Provider & model management UI
│   │   │   └── DatabaseSettings.svelte  # Database status monitoring
│   │   ├── assets/
│   │   │   └── favicon.svg
│   │   └── index.ts
│   ├── routes/
│   │   ├── +layout.svelte    # Root layout (sidebar, header)
│   │   ├── +layout.ts
│   │   ├── +page.svelte      # Home page
│   │   ├── layout.css        
│   │   ├── chat/[id]/
│   │   │   └── +page.svelte  # Chat interface
│   │   ├── settings/
│   │   │   └── +page.svelte  # Settings page
│   │   └── agents/
│   │       └── +page.svelte  # Agents page (WIP)
│   ├── app.d.ts              # TypeScript declarations
│   └── app.html              # HTML template
├── old/                      # Legacy Go-based TUI version
├── static/
│   └── robots.txt
├── package.json
├── vite.config.ts
├── tsconfig.json
├── bun.lock
└── README.md
```

---

## 🔧 Configuration

### Providers & Models

Providers and models are managed through the UI at **Settings → Providers** or via the model selector in the chat toolbar.

Each provider needs:
- **Name** — A friendly identifier (e.g., "Ollama", "OpenRouter")
- **Base URL** — The API endpoint (e.g., `http://localhost:11434`)
- **API Key** — Optional, for cloud providers
- **Models** — One or more model names available under that provider

> **Note:** For Ollama, the `/v1` suffix is automatically appended to ensure OpenAI compatibility.

### Working Directory

The current working directory (CWD) is shown in the chat toolbar. Click on it to select a different folder. The AI agent uses this directory as its workspace for file operations and shell commands.

The working directory is persisted across sessions via the `talos_cwd` setting.

---

## 🖥️ Development

```bash
# Install dependencies
bun install

# Start development server (with Electron)
bun run dev

# Build for production
bun run build

# Type checking
bun run check
```

### Build Configuration

- **Adapter:** `@sveltejs/adapter-static` (static export to `build/`)
- **Electron:** `vite-plugin-electron` for seamless integration
- **CSS:** Tailwind CSS v4 with `@tailwindcss/vite`

---

## 🌐 Browser Mode

Talos can also run as a web application outside of Electron:

```bash
bun run dev
# Open http://localhost:5173 in your browser
```

In browser mode, data is persisted to `localStorage` instead of SQLite3, and API calls are simulated. For full functionality (streaming, tool execution, SQLite persistence), run within Electron.

---

## 🧪 Old TUI Version

An earlier version of Talos was built as a Go-based terminal UI using [Bubble Tea](https://github.com/charmbracelet/bubbletea). You can find it in the [`old/`](./old) directory with its own [README](./old/README.md).

---

## 📝 TODO / Roadmap

- [ ] Agent configuration and management (custom system prompts, tool restrictions)
- [ ] Multi-agent chat sessions
- [ ] Conversation search and export
- [ ] File attachment support (drag & drop, syntax highlighting)
- [ ] Code execution with sandboxing
- [ ] Theme customization
- [ ] Plugin system for custom tools

---

## 📄 License

MIT — see the [LICENSE](./LICENSE) file for details.

---

*Built with ❤️ using [Svelte](https://svelte.dev), [Electron](https://www.electronjs.org), [Tailwind CSS](https://tailwindcss.com), and [OpenAI SDK](https://github.com/openai/openai-node).*
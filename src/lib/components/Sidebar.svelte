<script lang="ts">
  import { page } from '$app/stores';
  import { Home, Bot, Settings, Plus, Trash2, PanelLeftClose, MessageSquare } from 'lucide-svelte';

  interface Chat {
    id: string;
    title: string;
    created_at: number;
  }

  let {
    isSidebarOpen = $bindable(true),
    chats = [],
    onCreateChat,
    onDeleteChat
  }: {
    isSidebarOpen: boolean;
    chats: Chat[];
    onCreateChat: () => void;
    onDeleteChat: (id: string, event: Event) => void;
  } = $props();
</script>

<aside
  class="bg-[#0b0f19] border-r border-slate-900 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative z-35 {
    isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
  }"
>
  <!-- macOS traffic light spacer & Header inside sidebar -->
  <div class="h-10 pt-10 flex items-center justify-between px-4 mt-2">
    <span class="font-bold text-sm tracking-wider text-slate-350 font-mono pl-16">TALOS</span>
    <button
      onclick={() => isSidebarOpen = false}
      class="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-900/60 cursor-pointer no-drag"
      title="Masquer la barre"
    >
      <PanelLeftClose size={16} />
    </button>
  </div>

  <!-- Navigation links -->
  <nav class="px-3 mt-6 space-y-1">
    <a
      href="/"
      class="flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-250 {$page.url.pathname === '/' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'}"
    >
      <Home size={16} />
      Accueil
    </a>
    <a
      href="/agents"
      class="flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-250 {$page.url.pathname === '/agents' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'}"
    >
      <Bot size={16} />
      Agents
    </a>
    <a
      href="/settings"
      class="flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-250 {$page.url.pathname === '/settings' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'}"
    >
      <Settings size={16} />
      Paramètres
    </a>
  </nav>

  <!-- Divider -->
  <div class="h-px bg-slate-900/60 mx-4 my-6"></div>

  <!-- Discussions List Section -->
  <div class="flex-1 flex flex-col min-h-0">
    <div class="px-4 flex items-center justify-between mb-2">
      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discussions</span>
      <button
        onclick={onCreateChat}
        class="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-900/60 cursor-pointer transition-colors"
        title="Nouvelle discussion"
      >
        <Plus size={14} />
      </button>
    </div>

    <!-- Chats Scroll Container -->
    <div class="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
      {#if chats.length === 0}
        <div class="text-xs text-slate-600 italic px-4 py-2">Aucune discussion</div>
      {:else}
        {#each chats as chat (chat.id)}
          <a
            href="/chat/{chat.id}"
            class="group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 relative {
              $page.params.id === chat.id
                ? 'bg-indigo-600/10 text-indigo-450 border border-indigo-550/10 shadow-[inset_2px_0_0_#6366f1]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
            }"
          >
            <div class="flex items-center gap-2 overflow-hidden mr-2">
              <MessageSquare size={12} class="shrink-0 {$page.params.id === chat.id ? 'text-indigo-400' : 'text-slate-500'}" />
              <span class="truncate">{chat.title}</span>
            </div>
            <button
              onclick={(e) => onDeleteChat(chat.id, e)}
              class="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/15 rounded transition-all cursor-pointer shrink-0"
              title="Supprimer la discussion"
            >
              <Trash2 size={12} />
            </button>
          </a>
        {/each}
      {/if}
    </div>
  </div>
</aside>

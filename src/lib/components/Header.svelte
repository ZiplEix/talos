<script lang="ts">
  import { PanelLeft } from 'lucide-svelte';

  let {
    isSidebarOpen = $bindable(true),
    toggleSidebar
  }: {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
  } = $props();
</script>

<header
  class="h-10 flex items-center justify-between border-b border-slate-900/60 bg-[#070b15] shrink-0 z-20 relative select-none"
  style="-webkit-app-region: drag;"
>
  <!-- Left side (macOS traffic lights spacer / Toggle button) -->
  <div class="flex items-center gap-2 h-full no-drag">
    <!-- Spacer to clear macOS traffic lights when sidebar is closed -->
    {#if !isSidebarOpen}
      <div class="w-[80px] shrink-0"></div>
      <button
        onclick={toggleSidebar}
        class="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-900/60 cursor-pointer no-drag"
        title="Afficher la barre"
      >
        <PanelLeft size={16} />
      </button>
    {/if}
  </div>

  <!-- Right title/brand -->
  <div class="pr-6 z-10 font-mono text-[9px] tracking-wider text-slate-500 font-semibold pointer-events-none uppercase no-drag">
    Talos
  </div>
</header>

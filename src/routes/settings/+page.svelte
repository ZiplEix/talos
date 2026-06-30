<script lang="ts">
  import ProvidersSettings from '$lib/components/ProvidersSettings.svelte';
  import PromptsSettings from '$lib/components/PromptsSettings.svelte';
  import { onMount } from 'svelte';

  let activeTab = $state<'general' | 'providers' | 'prompts'>('general');
  let subagentsEnabled = $state(true);

  onMount(async () => {
    if (window.talosAPI) {
      try {
        subagentsEnabled = (await window.talosAPI.getSetting('subagents_enabled', 'true')) === 'true';
      } catch (err) {
        console.error(err);
      }
    }
  });

  async function toggleSubagents() {
    subagentsEnabled = !subagentsEnabled;
    if (window.talosAPI) {
      try {
        await window.talosAPI.setSetting('subagents_enabled', String(subagentsEnabled));
      } catch (err) {
        console.error(err);
      }
    }
  }
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
  <!-- Page Header -->
  <div>
    <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Paramètres</h1>
    <p class="text-slate-400 mt-1">Configurez votre environnement Talos, vos modèles et vos templates de prompts.</p>
  </div>

  <!-- Horizontal Tabs Navigation -->
  <nav class="flex border-b border-slate-800/60 gap-8 select-none">
    <button
      onclick={() => activeTab = 'general'}
      class="pb-3 text-sm font-semibold transition-all duration-200 cursor-pointer relative {activeTab === 'general' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'}"
    >
      Général
    </button>
    <button
      onclick={() => activeTab = 'providers'}
      class="pb-3 text-sm font-semibold transition-all duration-200 cursor-pointer relative {activeTab === 'providers' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'}"
    >
      Providers
    </button>
    <button
      onclick={() => activeTab = 'prompts'}
      class="pb-3 text-sm font-semibold transition-all duration-200 cursor-pointer relative {activeTab === 'prompts' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'}"
    >
      Prompts
    </button>
  </nav>

  <!-- Tab Content Container -->
  <div class="pt-6 min-h-[300px] w-full">
    
    <!-- GENERAL TAB (Empty for now) -->
    {#if activeTab === 'general'}
      <div class="bg-[#0b0f19] border border-slate-800/60 rounded-2xl p-6 space-y-6">
        <div class="space-y-1">
          <h2 class="text-lg font-bold text-slate-200">Fonctionnalités Avancées</h2>
          <p class="text-xs text-slate-400">Activez ou désactivez les fonctionnalités agentiques de Talos.</p>
        </div>
        
        <div class="flex items-center justify-between border-t border-slate-900/60 pt-5">
          <div class="space-y-1 max-w-lg">
            <h3 class="text-sm font-semibold text-slate-300">Exécution en Parallèle (Sous-agents)</h3>
            <p class="text-xs text-slate-500 leading-relaxed">
              Permet à l'agent principal de déléguer des tâches complexes et indépendantes à plusieurs sous-agents autonomes s'exécutant simultanément (modèle Fork/Join).
            </p>
            <p class="text-[11px] text-amber-500/85 mt-1.5 flex items-center gap-1.5 font-medium select-none">
              ⚠️ Attention : L'exécution simultanée de plusieurs agents autonomes peut consommer une quantité importante de tokens.
            </p>
          </div>
          
          <button 
            onclick={toggleSubagents}
            title="Activer/Désactiver l'exécution en parallèle"
            aria-label="Toggle parallel sub-agents"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none 
              {subagentsEnabled ? 'bg-indigo-655 bg-indigo-600' : 'bg-slate-850 bg-slate-800'}"
          >
            <span 
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                {subagentsEnabled ? 'translate-x-5' : 'translate-x-0'}"
            ></span>
          </button>
        </div>
      </div>
    {/if}

    <!-- PROVIDERS TAB -->
    {#if activeTab === 'providers'}
      <ProvidersSettings />
    {/if}

    <!-- PROMPTS TAB -->
    {#if activeTab === 'prompts'}
      <PromptsSettings />
    {/if}

  </div>
</div>

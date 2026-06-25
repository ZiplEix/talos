<script lang="ts">
  import DatabaseSettings from '$lib/components/DatabaseSettings.svelte';
  import ProvidersSettings from '$lib/components/ProvidersSettings.svelte';

  let activeTab = $state<'general' | 'providers' | 'database'>('general');
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
  <!-- Page Header -->
  <div>
    <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Paramètres</h1>
    <p class="text-slate-400 mt-1">Configurez votre environnement Talos, vos modèles et la base de données.</p>
  </div>

  <!-- Horizontal Tabs Navigation -->
  <nav class="flex border-b border-slate-800/60 gap-8">
    <button
      onclick={() => activeTab = 'general'}
      class="pb-3 text-sm font-semibold transition-all duration-200 cursor-pointer relative {activeTab === 'general' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'}"
    >
      Général
    </button>
    <button
      onclick={() => activeTab = 'providers'}
      class="pb-3 text-sm font-semibold transition-all duration-200 cursor-pointer relative {activeTab === 'providers' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'}"
    >
      Providers
    </button>
    <button
      onclick={() => activeTab = 'database'}
      class="pb-3 text-sm font-semibold transition-all duration-200 cursor-pointer relative {activeTab === 'database' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'}"
    >
      Base de données
    </button>
  </nav>

  <!-- Tab Content Container -->
  <div class="pt-6 min-h-[300px] w-full">
    
    <!-- GENERAL TAB (Empty for now) -->
    {#if activeTab === 'general'}
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <p class="text-slate-400 text-sm italic">Les paramètres généraux de l'application seront configurés ici.</p>
      </div>
    {/if}

    <!-- PROVIDERS TAB -->
    {#if activeTab === 'providers'}
      <ProvidersSettings />
    {/if}

    <!-- DATABASE TAB -->
    {#if activeTab === 'database'}
      <DatabaseSettings />
    {/if}

  </div>
</div>

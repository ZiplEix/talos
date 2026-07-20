<script lang="ts">
  import { onMount } from 'svelte';
  import { Cpu, Plus, Trash2, Save, AlertCircle, Bot, Globe, Shield, RefreshCw } from 'lucide-svelte';

  interface Provider {
    id: string;
    name: string;
    base_url: string;
    api_key: string;
  }

  interface Model {
    id: string;
    name: string;
  }

  let providers = $state<Provider[]>([]);
  let selectedProviderId = $state<string>('');
  let models = $state<Model[]>([]);
  let isAdding = $state(false);

  // Form fields
  let editName = $state('');
  let editBaseUrl = $state('');
  let editApiKey = $state('');

  // Model input field
  let newModelName = $state('');

  // Selected provider computed state
  let selectedProvider = $derived(providers.find(p => p.id === selectedProviderId));

  onMount(async () => {
    await loadProviders();
    if (providers.length > 0) {
      selectedProviderId = providers[0].id;
    }
  });

  // Track provider change to load models and form data
  $effect(() => {
    if (selectedProviderId && !isAdding) {
      const p = selectedProvider;
      if (p) {
        editName = p.name;
        editBaseUrl = p.base_url;
        editApiKey = p.api_key || '';
        loadModels(p.id);
      }
    }
  });

  async function loadProviders() {
    if (window.talosAPI) {
      try {
        providers = await window.talosAPI.getProviders();
      } catch (e) {
        console.error('SQLite providers fetch error, fallback to localStorage:', e);
        loadProvidersFromLocalStorage();
      }
    } else {
      loadProvidersFromLocalStorage();
    }
  }

  function loadProvidersFromLocalStorage() {
    const saved = localStorage.getItem('talos_providers');
    if (saved) {
      providers = JSON.parse(saved);
    } else {
      // Ollama par défaut
      providers = [{ id: 'ollama', name: 'Ollama', base_url: 'http://localhost:11434', api_key: '' }];
      localStorage.setItem('talos_providers', JSON.stringify(providers));
    }
  }

  async function loadModels(providerId: string) {
    if (window.talosAPI) {
      try {
        models = await window.talosAPI.getModels(providerId);
      } catch (e) {
        console.error('SQLite models fetch error, fallback to localStorage:', e);
        loadModelsFromLocalStorage(providerId);
      }
    } else {
      loadModelsFromLocalStorage(providerId);
    }
  }

  function loadModelsFromLocalStorage(providerId: string) {
    const saved = localStorage.getItem(`talos_models_${providerId}`);
    if (saved) {
      models = JSON.parse(saved);
    } else {
      models = [];
      localStorage.setItem(`talos_models_${providerId}`, JSON.stringify(models));
    }
  }

  function startAdding() {
    isAdding = true;
    selectedProviderId = '';
    editName = '';
    editBaseUrl = 'http://';
    editApiKey = '';
    models = [];
  }

  function cancelAdding() {
    isAdding = false;
    if (providers.length > 0) {
      selectedProviderId = providers[0].id;
    }
  }

  async function handleSaveProvider() {
    const name = editName.trim();
    const baseUrl = editBaseUrl.trim();
    const apiKey = editApiKey.trim();

    if (!name || !baseUrl) {
      alert('Veuillez renseigner le nom et l\'URL de base.');
      return;
    }

    const id = isAdding ? `prov-${Math.random().toString(36).substring(2, 9)}` : selectedProviderId;

    if (window.talosAPI) {
      try {
        await window.talosAPI.saveProvider(id, name, baseUrl, apiKey);
      } catch (e) {
        console.error('Failed to save provider in SQLite, saving in localStorage:', e);
        saveProviderToLocalStorage(id, name, baseUrl, apiKey);
      }
    } else {
      saveProviderToLocalStorage(id, name, baseUrl, apiKey);
    }

    isAdding = false;
    await loadProviders();
    selectedProviderId = id;
  }

  function saveProviderToLocalStorage(id: string, name: string, baseUrl: string, apiKey: string) {
    const existingIndex = providers.findIndex(p => p.id === id);
    const newProv = { id, name, base_url: baseUrl, api_key: apiKey };

    if (existingIndex > -1) {
      providers[existingIndex] = newProv;
    } else {
      providers.push(newProv);
    }

    localStorage.setItem('talos_providers', JSON.stringify(providers));
  }

  async function handleDeleteProvider() {
    if (selectedProviderId === 'ollama') {
      alert('Ollama est le fournisseur par défaut et ne peut pas être supprimé.');
      return;
    }

    const confirmDelete = confirm(`Voulez-vous vraiment supprimer le fournisseur "${selectedProvider?.name}" et tous ses modèles ?`);
    if (!confirmDelete) return;

    if (window.talosAPI) {
      try {
        await window.talosAPI.deleteProvider(selectedProviderId);
      } catch (e) {
        console.error('Failed to delete provider in SQLite, deleting in localStorage:', e);
        deleteProviderFromLocalStorage(selectedProviderId);
      }
    } else {
      deleteProviderFromLocalStorage(selectedProviderId);
    }

    selectedProviderId = 'ollama';
    await loadProviders();
  }

  function deleteProviderFromLocalStorage(id: string) {
    providers = providers.filter(p => p.id !== id);
    localStorage.setItem('talos_providers', JSON.stringify(providers));
    localStorage.removeItem(`talos_models_${id}`);
  }

  async function handleAddModel() {
    const name = newModelName.trim();
    if (!name) return;

    const id = `model-${Math.random().toString(36).substring(2, 9)}`;

    if (window.talosAPI) {
      try {
        await window.talosAPI.addModel(id, selectedProviderId, name);
      } catch (e) {
        console.error('Failed to add model in SQLite, adding to localStorage:', e);
        addModelToLocalStorage(id, name);
      }
    } else {
      addModelToLocalStorage(id, name);
    }

    newModelName = '';
    await loadModels(selectedProviderId);
  }

  function addModelToLocalStorage(id: string, name: string) {
    models.push({ id, name });
    localStorage.setItem(`talos_models_${selectedProviderId}`, JSON.stringify(models));
  }

  async function handleDeleteModel(modelId: string) {
    if (window.talosAPI) {
      try {
        await window.talosAPI.deleteModel(modelId);
      } catch (e) {
        console.error('Failed to delete model in SQLite, deleting in localStorage:', e);
        deleteModelFromLocalStorage(modelId);
      }
    } else {
      deleteModelFromLocalStorage(modelId);
    }

    await loadModels(selectedProviderId);
  }

  function deleteModelFromLocalStorage(id: string) {
    models = models.filter(m => m.id !== id);
    localStorage.setItem(`talos_models_${selectedProviderId}`, JSON.stringify(models));
  }

  function handleModelKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddModel();
    }
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start animate-fade-in">

  <!-- Left Column: Providers List -->
  <div class="col-span-1 bg-slate-900/10 border border-slate-900/60 p-4 rounded-xl space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider">Fournisseurs</h3>
      <button
        onclick={startAdding}
        class="p-1 rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-900/60 transition-colors cursor-pointer"
        title="Ajouter un fournisseur"
      >
        <Plus size={16} />
      </button>
    </div>

    <div class="space-y-1 max-h-[400px] overflow-y-auto pr-1">
      {#each providers as prov (prov.id)}
        <button
          onclick={() => { isAdding = false; selectedProviderId = prov.id; }}
          class="w-full text-left p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex flex-col gap-1 {
            selectedProviderId === prov.id && !isAdding
              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/10 shadow-[inset_2px_0_0_#6366f1]'
              : 'text-slate-400 hover:text-slate-200 bg-transparent border-transparent hover:bg-slate-900/30'
          }"
        >
          <span class="font-bold text-sm block">{prov.name}</span>
          <span class="text-[10px] text-slate-500 font-mono block truncate">{prov.base_url}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Right Column(s): Provider Configuration Panel -->
  <div class="col-span-1 md:col-span-2 space-y-6 bg-slate-900/10 border border-slate-900/60 p-6 rounded-xl">

    <!-- Title -->
    <div>
      <h3 class="text-lg font-bold text-slate-100">
        {#if isAdding}
          Nouveau fournisseur IA
        {:else}
          Modifier : {selectedProvider?.name || 'Sélection'}
        {/if}
      </h3>
      <p class="text-slate-450 text-xs mt-0.5">Configurez l'adresse de connexion et les modèles pour ce fournisseur.</p>
    </div>

    <!-- Form -->
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <!-- Name Field -->
        <div class="space-y-1.5">
          <label for="prov-name" class="text-xs font-bold text-slate-400 uppercase tracking-wider">Nom du fournisseur</label>
          <div class="relative flex items-center">
            <Bot class="absolute left-3 text-slate-500" size={14} />
            <input
              id="prov-name"
              type="text"
              placeholder="Ex: Ollama, OpenRouter"
              bind:value={editName}
              class="w-full bg-slate-950/60 border border-slate-850 focus:border-indigo-500/50 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
            />
          </div>
        </div>

        <!-- Base URL Field -->
        <div class="space-y-1.5">
          <label for="prov-url" class="text-xs font-bold text-slate-400 uppercase tracking-wider">URL de base (Endpoint)</label>
          <div class="relative flex items-center">
            <Globe class="absolute left-3 text-slate-500" size={14} />
            <input
              id="prov-url"
              type="text"
              placeholder="Ex: http://localhost:11434"
              bind:value={editBaseUrl}
              class="w-full bg-slate-950/60 border border-slate-850 focus:border-indigo-500/50 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors font-mono"
            />
          </div>
        </div>

      </div>

      <!-- API Key Field -->
      <div class="space-y-1.5">
        <label for="prov-key" class="text-xs font-bold text-slate-400 uppercase tracking-wider">Clé d'API (si requise)</label>
        <div class="relative flex items-center">
          <Shield class="absolute left-3 text-slate-500" size={14} />
          <input
            id="prov-key"
            type="password"
            placeholder="Clé secrète d'authentification"
            bind:value={editApiKey}
            class="w-full bg-slate-950/60 border border-slate-850 focus:border-indigo-500/50 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
          />
        </div>
      </div>
    </div>

    <!-- Models List Section (Only visible when editing an existing provider) -->
    {#if !isAdding && selectedProviderId}
      <div class="border-t border-slate-900/60 pt-6 space-y-4">
        <div>
          <h4 class="text-sm font-bold text-slate-200">Modèles associés</h4>
          <p class="text-slate-450 text-[11px] mt-0.5">Ajoutez ou supprimez les noms de modèles disponibles pour ce fournisseur.</p>
        </div>

        <!-- Add Model Input -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1 flex items-center">
            <Cpu class="absolute left-3 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Entrez le nom du modèle (ex: llama3:8b)"
              bind:value={newModelName}
              onkeydown={handleModelKeydown}
              class="w-full bg-slate-950/60 border border-slate-850 focus:border-indigo-500/50 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
            />
          </div>
          <button
            onclick={handleAddModel}
            disabled={!newModelName.trim()}
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Ajouter
          </button>
        </div>

        <!-- Models Tags Grid -->
        {#if models.length === 0}
          <p class="text-xs text-slate-500 italic">Aucun modèle configuré pour ce fournisseur.</p>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
            {#each models as model (model.id)}
              <div class="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-900/40 rounded-lg text-xs">
                <span class="font-mono text-slate-300 font-semibold">{model.name}</span>
                <button
                  onclick={() => handleDeleteModel(model.id)}
                  class="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                  title="Supprimer le modèle"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Bottom Actions -->
    <div class="border-t border-slate-900/60 pt-4 flex items-center justify-between">
      <div>
        {#if !isAdding && selectedProviderId !== 'ollama'}
          <button
            onclick={handleDeleteProvider}
            class="px-4 py-2 text-xs font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg border border-red-950/20 hover:border-red-900/30 transition-all cursor-pointer"
          >
            Supprimer le fournisseur
          </button>
        {/if}
      </div>

      <div class="flex items-center gap-3">
        {#if isAdding}
          <button
            onclick={cancelAdding}
            class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Annuler
          </button>
        {/if}
        <button
          onclick={handleSaveProvider}
          disabled={!editName.trim() || !editBaseUrl.trim()}
          class="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save size={12} />
          Sauvegarder
        </button>
      </div>
    </div>

  </div>

</div>

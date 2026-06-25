<script lang="ts">
  import { onMount } from 'svelte';
  import { Cpu, Sparkles, ChevronUp, ChevronDown, Bot, AlertCircle } from 'lucide-svelte';

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

  interface ProviderGroup {
    provider: Provider;
    models: Model[];
  }

  let {
    activeProviderId = $bindable('ollama'),
    activeModel = $bindable(''),
    variant = 'button',
    onSelect
  }: {
    activeProviderId: string;
    activeModel: string;
    variant?: 'button' | 'text';
    onSelect?: (providerId: string, modelName: string) => void;
  } = $props();

  let isOpen = $state(false);
  let groups = $state<ProviderGroup[]>([]);

  onMount(async () => {
    await loadData();
    // Par défaut, si aucun modèle n'est sélectionné mais qu'on a Ollama avec un modèle, on le sélectionne
    initializeDefaultModel();
  });

  async function loadData() {
    if (window.talosAPI) {
      try {
        const provs = await window.talosAPI.getProviders();
        const list: ProviderGroup[] = [];
        for (const p of provs) {
          const mods = await window.talosAPI.getModels(p.id);
          list.push({ provider: p, models: mods });
        }
        groups = list;
      } catch (e) {
        loadDataFromLocalStorage();
      }
    } else {
      loadDataFromLocalStorage();
    }
  }

  function loadDataFromLocalStorage() {
    const savedProvs = localStorage.getItem('talos_providers');
    const provs: Provider[] = savedProvs 
      ? JSON.parse(savedProvs) 
      : [{ id: 'ollama', name: 'Ollama', base_url: 'http://localhost:11434/v1', api_key: '' }];
    
    const list: ProviderGroup[] = [];
    for (const p of provs) {
      const savedMods = localStorage.getItem(`talos_models_${p.id}`);
      const mods: Model[] = savedMods ? JSON.parse(savedMods) : [];
      list.push({ provider: p, models: mods });
    }
    groups = list;
  }

  function initializeDefaultModel() {
    if (!activeModel && groups.length > 0) {
      // Trouver Ollama ou le premier provider qui a des modèles
      const ollamaGroup = groups.find(g => g.provider.id === 'ollama');
      if (ollamaGroup && ollamaGroup.models.length > 0) {
        activeProviderId = 'ollama';
        activeModel = ollamaGroup.models[0].name;
      } else {
        const firstWithModels = groups.find(g => g.models.length > 0);
        if (firstWithModels) {
          activeProviderId = firstWithModels.provider.id;
          activeModel = firstWithModels.models[0].name;
        }
      }
    }
  }

  function selectModel(providerId: string, modelName: string) {
    activeProviderId = providerId;
    activeModel = modelName;
    isOpen = false;
    if (onSelect) {
      onSelect(providerId, modelName);
    }
  }

  async function handleToggle() {
    await loadData();
    isOpen = !isOpen;
  }
</script>

<div class="relative inline-block">
  <!-- Trigger Button -->
  {#if variant === 'text'}
    <button
      onclick={handleToggle}
      class="hover:text-indigo-400 transition-colors cursor-pointer no-drag select-none text-xs text-slate-500 font-medium font-mono flex items-center gap-1.5"
    >
      <Cpu size={11} class="text-slate-500 shrink-0" />
      <span>{activeModel || 'aucun modèle'}</span>
    </button>
  {:else}
    <button
      onclick={handleToggle}
      class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-900/60 hover:border-slate-800 rounded-lg text-xs font-semibold text-slate-350 hover:text-white transition-all cursor-pointer no-drag select-none"
    >
      <Cpu size={12} class="text-slate-500 shrink-0" />
      <span class="truncate max-w-[120px]">
        {activeModel ? activeModel : 'Aucun modèle'}
      </span>
      {#if isOpen}
        <ChevronUp size={12} class="text-slate-500 shrink-0 ml-0.5" />
      {:else}
        <ChevronDown size={12} class="text-slate-500 shrink-0 ml-0.5" />
      {/if}
    </button>
  {/if}

  <!-- Overlay Backdrop for closing -->
  {#if isOpen}
    <button 
      onclick={() => isOpen = false} 
      class="fixed inset-0 z-40 bg-transparent cursor-default no-drag"
      tabindex="-1"
      aria-label="Fermer le menu"
    ></button>
  {/if}

  <!-- Popover Dropdown -->
  {#if isOpen}
    <div 
      class="absolute bottom-full left-0 mb-2 w-64 bg-[#0b0f19] border border-slate-900 rounded-xl shadow-2xl z-50 p-2 space-y-2 animate-fade-in no-drag text-left"
    >
      <div class="px-2 py-1.5 border-b border-slate-900/80">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modèles Disponibles</span>
      </div>

      <div class="max-h-[240px] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-900">
        {#if groups.every(g => g.models.length === 0)}
          <div class="p-3 text-center space-y-2">
            <AlertCircle size={20} class="text-slate-600 mx-auto" />
            <p class="text-[11px] text-slate-500 leading-relaxed">Aucun modèle n'est configuré. Rendez-vous dans les <strong>Paramètres</strong> pour en ajouter.</p>
            <a 
              href="/settings" 
              onclick={() => isOpen = false}
              class="inline-block text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
            >
              Aller aux paramètres
            </a>
          </div>
        {:else}
          {#each groups as group (group.provider.id)}
            {#if group.models.length > 0}
              <div class="space-y-1">
                <!-- Provider Header -->
                <div class="px-2 flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold uppercase tracking-wider font-mono">
                  <Bot size={10} />
                  <span>{group.provider.name}</span>
                </div>
                
                <!-- Models list -->
                <div class="space-y-0.5">
                  {#each group.models as model (model.id)}
                    <button
                      onclick={() => selectModel(group.provider.id, model.name)}
                      class="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 font-semibold {
                        activeProviderId === group.provider.id && activeModel === model.name
                          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 font-bold' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      }"
                    >
                      <Sparkles size={10} class={activeProviderId === group.provider.id && activeModel === model.name ? 'text-indigo-400' : 'text-slate-600'} />
                      <span class="truncate font-mono">{model.name}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

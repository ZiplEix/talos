<script lang="ts">
  import { onMount } from 'svelte';
  import { Sparkles, Save, FileText, CheckCircle2, AlertCircle, RotateCcw, HelpCircle, X, Braces, ToggleRight, Layers, Variable, ChevronDown, ChevronRight, Info, List, ArrowRight } from 'lucide-svelte';

  let prompts = $state<string[]>([]);
  let selectedPrompt = $state<string | null>(null);
  let promptContent = $state('');
  let isLoading = $state(true);
  let isSaving = $state(false);
  let showHelp = $state(false);
  let notification = $state<{ type: 'success' | 'error'; message: string } | null>(null);

  // Template variables state
  let templateVariables = $state<Array<{
    name: string;
    description: string;
    type: 'string' | 'boolean' | 'array';
    children?: Array<{ name: string; description: string; type: string; usage: string }>;
    usage: string;
  }>>([]);

  let templateSyntax = $state<Array<{ syntax: string; description: string }>>([]);
  let expandedVars = $state<Set<string>>(new Set());

  const TYPE_ICONS: Record<string, typeof Braces> = {
    string: Braces,
    boolean: ToggleRight,
    array: Layers
  };

  const TYPE_COLORS: Record<string, string> = {
    string: 'text-emerald-400',
    boolean: 'text-amber-400',
    array: 'text-sky-400'
  };

  onMount(async () => {
    await Promise.all([loadPrompts(), loadTemplateVariables()]);
  });

  async function loadTemplateVariables() {
    if (window.talosAPI) {
      try {
        const data = await window.talosAPI.getTemplateVariables();
        templateVariables = data.variables;
        templateSyntax = data.syntax;
      } catch (err) {
        console.error('Failed to load template variables:', err);
      }
    } else {
      templateVariables = [
        { name: 'currentCwd', description: 'Le dossier de travail actuel (Current Working Directory)', type: 'string', usage: '{{currentCwd}}' },
        { name: 'chatFolder', description: 'Le dossier des artifacts du chat en cours', type: 'string', usage: '{{chatFolder}}' },
        { name: 'hasTools', description: 'Booléen indiquant si des outils sont disponibles dans ce mode', type: 'boolean', usage: '{{#if hasTools}}...{{/if}}' },
        {
          name: 'tools',
          description: 'Liste des outils disponibles dans le mode actuel',
          type: 'array',
          usage: '{{#each tools}}...{{/each}}',
          children: [
            { name: 'name', description: "Nom de l'outil", type: 'string', usage: '{{name}}' },
            { name: 'description', description: "Description de l'outil", type: 'string', usage: '{{description}}' }
          ]
        }
      ];
      templateSyntax = [
        { syntax: '{{variable}}', description: "Affiche la valeur d'une variable simple" },
        { syntax: '{{#if variable}}...{{/if}}', description: 'Affiche le contenu si la variable est définie et non-vide' },
        { syntax: '{{#each list}}...{{/each}}', description: "Itère sur un tableau d'éléments" },
        { syntax: '{{this}}', description: "Référence à l'élément courant dans une boucle #each" }
      ];
    }
  }

  function toggleExpand(name: string) {
    const next = new Set(expandedVars);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    expandedVars = next;
  }

  async function loadPrompts() {
    isLoading = true;
    if (window.talosAPI) {
      try {
        prompts = await window.talosAPI.getPrompts();
        if (prompts.length > 0) {
          await selectPrompt(prompts[0]);
        }
      } catch (err) {
        console.error('Failed to load prompts:', err);
      }
    } else {
      prompts = ['system.md', 'agent.md', 'plan.md', 'ask.md'];
      await selectPrompt(prompts[0]);
    }
    isLoading = false;
  }

  async function selectPrompt(name: string) {
    selectedPrompt = name;
    if (window.talosAPI) {
      try {
        promptContent = await window.talosAPI.readPrompt(name);
      } catch (err) {
        console.error(`Failed to read prompt ${name}:`, err);
      }
    } else {
      promptContent = localStorage.getItem(`talos_mock_prompt_${name}`) || `# Mode: ${name.replace('.md', '').toUpperCase()}\n\nContenu par défaut simulé pour le navigateur.`;
    }
  }

  async function savePrompt() {
    if (!selectedPrompt) return;
    isSaving = true;
    showNotification(null);

    if (window.talosAPI) {
      try {
        await window.talosAPI.savePrompt(selectedPrompt, promptContent);
        showNotification({ type: 'success', message: `Prompt '${selectedPrompt}' enregistré avec succès.` });
      } catch (err: any) {
        showNotification({ type: 'error', message: `Erreur lors de l'enregistrement : ${err.message}` });
      }
    } else {
      localStorage.setItem(`talos_mock_prompt_${selectedPrompt}`, promptContent);
      showNotification({ type: 'success', message: `Prompt '${selectedPrompt}' enregistré en simulation.` });
    }
    isSaving = false;
  }

  async function resetPrompt() {
    if (!selectedPrompt) return;
    if (!confirm(`Êtes-vous sûr de vouloir réinitialiser le prompt '${selectedPrompt}' à sa version par défaut ? Vos modifications locales seront écrasées.`)) {
      return;
    }
    isSaving = true;
    showNotification(null);

    if (window.talosAPI && window.talosAPI.resetPrompt) {
      try {
        const defaultContent = await window.talosAPI.resetPrompt(selectedPrompt);
        promptContent = defaultContent;
        showNotification({ type: 'success', message: `Prompt '${selectedPrompt}' réinitialisé avec succès.` });
      } catch (err: any) {
        showNotification({ type: 'error', message: `Erreur lors de la réinitialisation : ${err.message}` });
      }
    } else {
      promptContent = `# Mode: ${selectedPrompt.replace('.md', '').toUpperCase()}\n\nContenu par défaut restauré en simulation.`;
      localStorage.setItem(`talos_mock_prompt_${selectedPrompt}`, promptContent);
      showNotification({ type: 'success', message: `Prompt '${selectedPrompt}' réinitialisé en simulation.` });
    }
    isSaving = false;
  }

  function showNotification(notif: typeof notification) {
    notification = notif;
    if (notif?.type === 'success') {
      setTimeout(() => {
        if (notification?.message === notif.message) {
          notification = null;
        }
      }, 3000);
    }
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      showHelp = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      showHelp = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="grid grid-cols-4 gap-6 w-full h-[550px]">
  <!-- Left list: available prompts -->
  <div class="col-span-1 bg-[#070b15]/60 border border-slate-900/80 rounded-2xl p-4 flex flex-col gap-2 select-none">
    <h3 class="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2 px-1">Fichiers Prompts</h3>
    
    {#if isLoading}
      <div class="flex-1 flex items-center justify-center">
        <div class="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else}
      <div class="flex-col gap-1 overflow-y-auto pr-1">
        {#each prompts as p}
          <button
            onclick={() => selectPrompt(p)}
            class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition-all text-left cursor-pointer border
              {selectedPrompt === p 
                ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400 font-extrabold' 
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }"
          >
            <FileText size={14} class={selectedPrompt === p ? 'text-indigo-400' : 'text-slate-500'} />
            <span class="truncate">{p}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Right area: Editor -->
  <div class="col-span-3 flex flex-col h-full bg-[#070b15]/60 border border-slate-900/80 rounded-2xl p-6 relative">
    {#if selectedPrompt}
      <div class="flex items-center justify-between mb-4 select-none shrink-0">
        <div>
          <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
            Édition de <span class="text-indigo-400 font-mono">{selectedPrompt}</span>
          </h3>
          <p class="text-[10px] text-slate-500 mt-0.5">Ces templates régissent le comportement de Talos dans ses différents modes.</p>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            onclick={() => showHelp = true}
            class="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800/80 hover:bg-slate-800/70 text-slate-450 hover:text-sky-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
            title="Aide sur le système de templates"
          >
            <HelpCircle size={14} />
            Aide
          </button>

          <button
            onclick={resetPrompt}
            disabled={isSaving}
            class="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800/80 hover:bg-slate-800/70 text-slate-450 hover:text-slate-200 disabled:opacity-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
            title="Restaurer le template par défaut"
          >
            <RotateCcw size={13} />
            Réinitialiser
          </button>

          <button
            onclick={savePrompt}
            disabled={isSaving}
            class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {#if isSaving}
              <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {:else}
              <Save size={14} />
            {/if}
            Enregistrer
          </button>
        </div>
      </div>

      <!-- Editor textarea -->
      <div class="flex-1 min-h-0 relative">
        <textarea
          bind:value={promptContent}
          class="w-full h-full bg-slate-950/80 text-slate-200 border border-slate-900/80 focus:border-indigo-500/30 focus:outline-none rounded-xl p-4 font-mono text-xs leading-relaxed resize-none scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent focus:ring-1 focus:ring-indigo-500/25"
          placeholder="# Écrivez votre prompt ici..."
        ></textarea>
      </div>

      <!-- Floating notification -->
      {#if notification}
        <div class="absolute bottom-4 left-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl border select-none animate-in fade-in slide-in-from-bottom-2 duration-200
          {notification.type === 'success' 
            ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-600/10 border-rose-500/20 text-rose-400'
          }"
        >
          {#if notification.type === 'success'}
            <CheckCircle2 size={16} class="shrink-0" />
          {:else}
            <AlertCircle size={16} class="shrink-0" />
          {/if}
          <span class="text-xs font-semibold leading-none">{notification.message}</span>
        </div>
      {/if}
    {:else}
      <div class="flex-1 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
        <div class="p-3 bg-slate-900/30 rounded-full border border-slate-900/60 text-slate-400">
          <Sparkles size={24} />
        </div>
        <div class="max-w-xs">
          <p class="text-xs font-bold text-slate-350">Aucun prompt sélectionné</p>
          <p class="text-[10px] text-slate-500 mt-1">Sélectionnez un fichier de prompt à gauche pour commencer son édition.</p>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Help Modal -->
{#if showHelp}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    onclick={handleOverlayClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    aria-label="Aide sur le système de templates"
  >
    <div class="relative w-full max-w-xl max-h-[80vh] bg-[#0a0f1e] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 select-none">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20">
            <Variable size={18} class="text-indigo-400" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-100">Système de templates</h2>
            <p class="text-[11px] text-slate-500 mt-0.5">Comprenez comment utiliser les variables dynamiques dans vos prompts</p>
          </div>
        </div>
        <button
          onclick={() => showHelp = false}
          class="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900/60 transition-all cursor-pointer"
          title="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 overflow-y-auto max-h-[calc(80vh-70px)] space-y-6">

        <!-- How it works -->
        <section>
          <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info size={13} />
            Fonctionnement
          </h3>
          <div class="bg-slate-950/50 border border-slate-900/60 rounded-xl p-4 space-y-2.5">
            <p class="text-[13px] text-slate-300 leading-relaxed">
              Les prompts de Talos utilisent un système de templates simple. 
              Avant d'envoyer le prompt à l'IA, les variables sont automatiquement 
              remplacées par les valeurs réelles du contexte.
            </p>
            <div class="bg-slate-950/80 border border-slate-900/60 rounded-lg p-3 font-mono text-xs space-y-1.5">
              <div class="flex items-center gap-2">
                <code class="text-amber-300">Vous travaillez dans {'{'}{'{'}currentCwd{'}'}{'}'}</code>
                <ArrowRight size={12} class="text-slate-600" />
                <code class="text-emerald-400">Vous travaillez dans /Users/me/project</code>
              </div>
            </div>
          </div>
        </section>

        <!-- Syntax reference -->
        <section>
          <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Braces size={13} />
            Syntaxes disponibles
          </h3>
          <div class="space-y-2">
            {#each templateSyntax as s}
              <div class="flex items-start gap-3 bg-slate-950/30 border border-slate-900/60 rounded-xl p-3">
                <code class="text-[12px] font-mono text-amber-300 bg-amber-950/20 px-2 py-1 rounded-lg shrink-0 leading-relaxed">{s.syntax}</code>
                <p class="text-[13px] text-slate-300 leading-relaxed">{s.description}</p>
              </div>
            {/each}
          </div>
        </section>

        <!-- Available variables -->
        <section>
          <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <List size={13} />
            Variables disponibles
          </h3>
          <div class="space-y-2">
            {#each templateVariables as v}
              <div class="bg-slate-950/30 border border-slate-900/60 rounded-xl overflow-hidden">
                <button
                  onclick={() => toggleExpand(v.name)}
                  class="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-slate-900/40 cursor-pointer text-left"
                >
                  {#if v.children}
                    {#if expandedVars.has(v.name)}
                      <ChevronDown size={14} class="text-slate-500 shrink-0" />
                    {:else}
                      <ChevronRight size={14} class="text-slate-500 shrink-0" />
                    {/if}
                  {:else}
                    <span class="w-3.5 shrink-0"></span>
                  {/if}

                  {#if TYPE_ICONS[v.type]}
                    {@const Icon = TYPE_ICONS[v.type]}
                    <Icon size={14} class={`${TYPE_COLORS[v.type] || 'text-slate-400'} shrink-0`} />
                  {/if}

                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-bold text-slate-200">{v.name}</span>
                    <p class="text-[12px] text-slate-400 leading-relaxed mt-0.5">{v.description}</p>
                  </div>

                  <span class="text-[10px] uppercase tracking-wider text-slate-600 font-mono shrink-0">{v.type}</span>
                </button>

                {#if expandedVars.has(v.name) && v.children}
                  <div class="px-4 pb-3 pl-12 space-y-1">
                    {#each v.children as child}
                      <div class="flex items-center gap-3 py-1.5 px-3 bg-slate-950/40 border border-slate-900/50 rounded-lg">
                        <code class="text-[12px] font-mono text-amber-300 shrink-0">{child.name}</code>
                        <span class="text-[12px] text-slate-400">{child.description}</span>
                        <span class="text-[10px] text-slate-600 ml-auto font-mono">{child.type}</span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </section>

        <!-- Example -->
        <section>
          <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText size={13} />
            Exemple complet
          </h3>
          <div class="bg-slate-950/50 border border-slate-900/60 rounded-xl overflow-hidden">
            <div class="px-4 py-3 bg-slate-950/80 border-b border-slate-900/60">
              <p class="text-[11px] text-slate-500 font-medium">system.md</p>
            </div>
            <pre class="p-4 text-[12px] font-mono text-slate-300 leading-relaxed overflow-x-auto"><span class="text-slate-500">#</span> Vous êtes Talos.
<span class="text-slate-500">#</span> Dossier de travail : <span class="text-amber-300">{'{'}{'{currentCwd}{'}'}{'}'}</span>
<span class="text-slate-500">#</span> Dossier artifacts : <span class="text-amber-300">{'{'}{'{chatFolder}{'}'}{'}'}</span>

<span class="text-indigo-400">{'{'}{'{#if hasTools}{'}'}{'}'}</span>
Vous avez accès aux outils suivants :
<span class="text-indigo-400">{'{'}{'{#each tools}{'}'}{'}'}</span>
- <span class="text-amber-300">{'{'}{'{name}{'}'}{'}'}</span> : <span class="text-amber-300">{'{'}{'{description}{'}'}{'}'}</span>
<span class="text-indigo-400">{'{'}{'{/each}{'}'}{'}'}</span>
<span class="text-indigo-400">{'{'}{'{/if}{'}'}{'}'}</span></pre>
          </div>
        </section>

      </div>
    </div>
  </div>
{/if}
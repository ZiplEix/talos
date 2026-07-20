<script lang="ts">
  import ProvidersSettings from '$lib/components/ProvidersSettings.svelte';
  import PromptsSettings from '$lib/components/PromptsSettings.svelte';
  import ModelSelector from '$lib/components/ModelSelector.svelte';
  import { onMount } from 'svelte';

  let activeTab = $state<'general' | 'providers' | 'prompts' | 'smtp'>('general');
  let subagentsEnabled = $state(true);

  let smtpHost = $state('');
  let smtpPort = $state('587');
  let smtpUser = $state('');
  let smtpPass = $state('');
  let smtpFrom = $state('talos@app.com');
  let smtpSecure = $state(false);

  let defaultProviderId = $state('ollama');
  let defaultModel = $state('');
  let defaultSubagentsProviderId = $state('ollama');
  let defaultSubagentsModel = $state('');

  onMount(async () => {
    if (window.talosAPI) {
      try {
        subagentsEnabled = (await window.talosAPI.getSetting('subagents_enabled', 'true')) === 'true';
        defaultProviderId = await window.talosAPI.getSetting('default_provider_id', 'ollama');
        defaultModel = await window.talosAPI.getSetting('default_model_name', '');
        defaultSubagentsProviderId = await window.talosAPI.getSetting('default_subagents_provider_id', 'ollama');
        defaultSubagentsModel = await window.talosAPI.getSetting('default_subagents_model_name', '');
        smtpHost = await window.talosAPI.getSetting('smtp_host', '');
        smtpPort = await window.talosAPI.getSetting('smtp_port', '587');
        smtpUser = await window.talosAPI.getSetting('smtp_user', '');
        smtpPass = await window.talosAPI.getSetting('smtp_pass', '');
        smtpFrom = await window.talosAPI.getSetting('smtp_from', 'talos@app.com');
        smtpSecure = (await window.talosAPI.getSetting('smtp_secure', 'false')) === 'true';
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

  async function handleSelectDefaultModel(providerId: string, modelName: string) {
    defaultProviderId = providerId;
    defaultModel = modelName;
    if (window.talosAPI) {
      try {
        await window.talosAPI.setSetting('default_provider_id', providerId);
        await window.talosAPI.setSetting('default_model_name', modelName);
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function handleSelectDefaultSubagentsModel(providerId: string, modelName: string) {
    defaultSubagentsProviderId = providerId;
    defaultSubagentsModel = modelName;
    if (window.talosAPI) {
      try {
        await window.talosAPI.setSetting('default_subagents_provider_id', providerId);
        await window.talosAPI.setSetting('default_subagents_model_name', modelName);
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function saveSmtpSetting(key: string, value: string) {
    if (window.talosAPI) {
      try {
        await window.talosAPI.setSetting(key, value);
      } catch (err) {
        console.error(`Failed to save SMTP setting ${key}:`, err);
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
    <button
      onclick={() => activeTab = 'smtp'}
      class="pb-3 text-sm font-semibold transition-all duration-200 cursor-pointer relative {activeTab === 'smtp' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'}"
    >
      SMTP
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

        <!-- Modèles par défaut -->
        <div class="border-t border-slate-900/60 pt-5 space-y-4">
          <div class="space-y-1">
            <h3 class="text-sm font-semibold text-slate-350">Modèles par Défaut</h3>
            <p class="text-xs text-slate-500">Définissez les modèles d'IA par défaut à utiliser pour les discussions et les sous-agents.</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <!-- Modèle Master par défaut -->
            <div class="flex items-center justify-between bg-slate-950/20 border border-slate-900/50 p-4 rounded-xl">
              <div class="space-y-1">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Agent Principal (Master)</span>
                <span class="text-[11px] text-slate-500">Modèle par défaut pour les nouvelles discussions</span>
              </div>
              <ModelSelector 
                bind:activeProviderId={defaultProviderId}
                bind:activeModel={defaultModel}
                onSelect={handleSelectDefaultModel}
              />
            </div>

            <!-- Modèle Sub-agents par défaut -->
            <div class="flex items-center justify-between bg-slate-950/20 border border-slate-900/50 p-4 rounded-xl">
              <div class="space-y-1">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sous-Agents</span>
                <span class="text-[11px] text-slate-500">Modèle par défaut pour les sous-agents</span>
              </div>
              <ModelSelector 
                bind:activeProviderId={defaultSubagentsProviderId}
                bind:activeModel={defaultSubagentsModel}
                onSelect={handleSelectDefaultSubagentsModel}
              />
            </div>
          </div>
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

    <!-- SMTP TAB -->
    {#if activeTab === 'smtp'}
      <div class="bg-[#0b0f19] border border-slate-800/60 rounded-2xl p-6 space-y-6">
        <div class="space-y-1">
          <h2 class="text-lg font-bold text-slate-200">Configuration SMTP</h2>
          <p class="text-xs text-slate-400">Configurez les serveurs de messagerie pour permettre l'envoi de mails réels par l'agent.</p>
        </div>

        <div class="border-t border-slate-900/60 pt-5 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- SMTP Host -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Serveur SMTP</label>
              <input
                type="text"
                bind:value={smtpHost}
                onchange={() => saveSmtpSetting('smtp_host', smtpHost)}
                placeholder="smtp.example.com"
                class="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 outline-none transition-all font-mono"
              />
            </div>

            <!-- SMTP Port -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Port SMTP</label>
              <input
                type="text"
                bind:value={smtpPort}
                onchange={() => saveSmtpSetting('smtp_port', smtpPort)}
                placeholder="587 ou 465"
                class="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 outline-none transition-all font-mono"
              />
            </div>

            <!-- SMTP User -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Nom d'utilisateur / Email</label>
              <input
                type="text"
                bind:value={smtpUser}
                onchange={() => saveSmtpSetting('smtp_user', smtpUser)}
                placeholder="utilisateur@example.com"
                class="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 outline-none transition-all font-mono"
              />
            </div>

            <!-- SMTP Pass -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Mot de passe</label>
              <input
                type="password"
                bind:value={smtpPass}
                onchange={() => saveSmtpSetting('smtp_pass', smtpPass)}
                placeholder="••••••••••••••••"
                class="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 outline-none transition-all font-mono"
              />
            </div>

            <!-- SMTP From -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Expéditeur par défaut (From)</label>
              <input
                type="email"
                bind:value={smtpFrom}
                onchange={() => saveSmtpSetting('smtp_from', smtpFrom)}
                placeholder="talos@example.com"
                class="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 outline-none transition-all font-mono"
              />
            </div>

            <!-- SMTP Secure Toggle -->
            <div class="flex items-center justify-between bg-slate-950/20 border border-slate-900/50 p-4 rounded-xl self-end h-[46px]">
              <div class="space-y-0.5">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Connexion Sécurisée (SSL/TLS)</span>
                <span class="text-[10px] text-slate-500">Obligatoire pour le port 465</span>
              </div>
              <button
                onclick={async () => {
                  smtpSecure = !smtpSecure;
                  await saveSmtpSetting('smtp_secure', String(smtpSecure));
                }}
                title="Activer/Désactiver la connexion sécurisée SSL/TLS"
                aria-label="Toggle SMTP SSL/TLS connection"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none
                  {smtpSecure ? 'bg-indigo-600' : 'bg-slate-700'}"
              >
                <span
                  class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    {smtpSecure ? 'translate-x-4' : 'translate-x-0'}"
                ></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}

  </div>
</div>

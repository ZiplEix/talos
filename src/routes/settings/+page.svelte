<script lang="ts">
  import ProvidersSettings from '$lib/components/ProvidersSettings.svelte';
  import PromptsSettings from '$lib/components/PromptsSettings.svelte';
  import ModelSelector from '$lib/components/ModelSelector.svelte';
  import { onMount } from 'svelte';

  let activeTab = $state<'general' | 'providers' | 'prompts' | 'smtp' | 'plugins'>('general');
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

  let pluginSchemas = $state<any[]>([]);
  let pluginSettings = $state<Record<string, Record<string, string>>>({});

  let showInstallModal = $state(false);
  let installType = $state<'folder' | 'zip' | 'git'>('folder');
  let gitUrl = $state('');
  let installing = $state(false);
  let statusMessage = $state('');
  let errorMessage = $state('');

  function closeInstallModal() {
    showInstallModal = false;
    gitUrl = '';
    installing = false;
    statusMessage = '';
    errorMessage = '';
  }

  async function handleInstall() {
    errorMessage = '';
    
    if (installType === 'git' && !gitUrl.trim()) {
      errorMessage = "Veuillez renseigner l'URL du dépôt Git.";
      return;
    }

    try {
      installing = true;
      if (installType === 'folder') {
        statusMessage = "Sélection du dossier local...";
        const res = await window.talosAPI.installPlugin({ type: 'local_folder' });
        if (!res.success) throw new Error(res.error);
      } else if (installType === 'zip') {
        statusMessage = "Sélection de l'archive ZIP...";
        const res = await window.talosAPI.installPlugin({ type: 'local_zip' });
        if (!res.success) throw new Error(res.error);
      } else if (installType === 'git') {
        statusMessage = "Clonage du dépôt Git...";
        const res = await window.talosAPI.installPlugin({ type: 'git', gitUrl: gitUrl.trim() });
        if (!res.success) throw new Error(res.error);
      }

      statusMessage = "Rechargement...";
      await loadPluginsConfig();
      closeInstallModal();
    } catch (e: any) {
      installing = false;
      errorMessage = e.message || "Une erreur est survenue lors de l'installation.";
    }
  }

  async function loadPluginsConfig() {
    if (window.talosAPI && window.talosAPI.getPluginsConfigSchemas) {
      try {
        pluginSchemas = await window.talosAPI.getPluginsConfigSchemas();
        const settingsMap: Record<string, Record<string, string>> = {};
        for (const plugin of pluginSchemas) {
          settingsMap[plugin.id] = {};
          for (const field of plugin.configFields) {
            const dbKey = `plugin_${plugin.id}_${field.key}`;
            const val = await window.talosAPI.getSetting(dbKey, String(field.default ?? ''));
            settingsMap[plugin.id][field.key] = val;
          }
        }
        pluginSettings = settingsMap;
      } catch (err) {
        console.error('Failed to load plugins config:', err);
      }
    }
  }

  async function handleSavePluginField(pluginId: string, fieldKey: string, value: string) {
    if (!pluginSettings[pluginId]) {
      pluginSettings[pluginId] = {};
    }
    pluginSettings[pluginId][fieldKey] = value;
    if (window.talosAPI) {
      const dbKey = `plugin_${pluginId}_${fieldKey}`;
      await window.talosAPI.setSetting(dbKey, value);
    }
  }

  async function handleTogglePluginField(pluginId: string, fieldKey: string) {
    const current = pluginSettings[pluginId]?.[fieldKey] || 'false';
    const nextVal = current === 'true' ? 'false' : 'true';
    await handleSavePluginField(pluginId, fieldKey, nextVal);
  }

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
        await loadPluginsConfig();
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
    <button
      onclick={() => activeTab = 'plugins'}
      class="pb-3 text-sm font-semibold transition-all duration-200 cursor-pointer relative {activeTab === 'plugins' ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold' : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'}"
    >
      Plugins
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

    <!-- PLUGINS TAB -->
    {#if activeTab === 'plugins'}
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <h2 class="text-lg font-bold text-slate-200">Gestion des Plugins</h2>
            <p class="text-xs text-slate-400 font-medium">Configurez ou importez de nouvelles fonctionnalités.</p>
          </div>
          <button
            onclick={() => showInstallModal = true}
            class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
          >
            Installer un plugin
          </button>
        </div>

        {#if pluginSchemas.length === 0}
          <div class="bg-[#0b0f19] border border-slate-800/60 rounded-2xl p-6 text-slate-400 text-sm italic text-center">
            Aucun plugin nécessitant une configuration n'est actuellement chargé dans <code class="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-indigo-400 text-xs">~/.talos/pluggins</code>.
          </div>
        {:else}
          {#each pluginSchemas as plugin}
            <div class="bg-[#0b0f19] border border-slate-800/60 rounded-2xl p-6 space-y-6">
              <div class="space-y-1">
                <h2 class="text-sm font-bold text-slate-200 uppercase tracking-wider">{plugin.name}</h2>
                {#if plugin.description}
                  <p class="text-xs text-slate-400">{plugin.description}</p>
                {/if}
              </div>
              
              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900/60">
                {#each plugin.configFields as field}
                  {#if field.type === 'boolean'}
                    <div class="flex items-center justify-between bg-slate-950/20 border border-slate-900/50 p-4 rounded-xl">
                      <div class="space-y-0.5">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">{field.label}</span>
                      </div>
                      <button
                        type="button"
                        onclick={() => handleTogglePluginField(plugin.id, field.key)}
                        title={`Activer/Désactiver ${field.label}`}
                        aria-label={`Toggle ${field.label}`}
                        class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none
                          {pluginSettings[plugin.id]?.[field.key] === 'true' ? 'bg-indigo-600' : 'bg-slate-700'}"
                      >
                        <span
                          class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                            {pluginSettings[plugin.id]?.[field.key] === 'true' ? 'translate-x-4' : 'translate-x-0'}"
                        ></span>
                      </button>
                    </div>
                  {:else}
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block">{field.label}</label>
                      <input
                        type={field.type === 'password' ? 'password' : 'text'}
                        value={pluginSettings[plugin.id]?.[field.key] || ''}
                        onchange={(e) => handleSavePluginField(plugin.id, field.key, (e.target as HTMLInputElement).value)}
                        placeholder={field.required ? 'Obligatoire' : 'Optionnel'}
                        class="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
                      />
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}

    <!-- PLUGIN INSTALL MODAL -->
    {#if showInstallModal}
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300">
        <div class="bg-[#0b0f19] border border-slate-800/80 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-900/60 pb-3">
            <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider">Installer un nouveau plugin</h3>
            <button 
              onclick={closeInstallModal}
              class="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          {#if !installing}
            <!-- Option selector tabs -->
            <div class="grid grid-cols-3 gap-2">
              <button
                onclick={() => installType = 'folder'}
                class="px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer text-center {installType === 'folder' ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-300'}"
              >
                Dossier
              </button>
              <button
                onclick={() => installType = 'zip'}
                class="px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer text-center {installType === 'zip' ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-300'}"
              >
                Archive ZIP
              </button>
              <button
                onclick={() => installType = 'git'}
                class="px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer text-center {installType === 'git' ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-300'}"
              >
                Dépôt Git
              </button>
            </div>

            <div class="space-y-4">
              {#if installType === 'folder'}
                <p class="text-xs text-slate-400 leading-relaxed">
                  Sélectionnez un dossier de plugin local contenant un fichier `package.json` ou un point d'entrée `index.js`.
                </p>
              {:else if installType === 'zip'}
                <p class="text-xs text-slate-400 leading-relaxed">
                  Sélectionnez un fichier d'archive ZIP du plugin à extraire.
                </p>
              {:else if installType === 'git'}
                <p class="text-xs text-slate-400 leading-relaxed">
                  Renseignez le lien vers le dépôt Git public du plugin pour le cloner et l'installer.
                </p>
              {/if}

              {#if installType === 'git'}
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block">URL du dépôt Git</label>
                  <input
                    type="text"
                    bind:value={gitUrl}
                    placeholder="https://github.com/utilisateur/mon-plugin.git"
                    class="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
                  />
                </div>
              {/if}

              {#if errorMessage}
                <p class="text-xs text-rose-500 bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg">
                  {errorMessage}
                </p>
              {/if}
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-3 border-t border-slate-900/60">
              <button
                onclick={closeInstallModal}
                class="bg-slate-950 border border-slate-800 hover:text-slate-300 text-slate-400 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer font-semibold"
              >
                Annuler
              </button>
              <button
                onclick={handleInstall}
                class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer font-semibold"
              >
                {installType === 'git' ? 'Télécharger & Installer' : 'Parcourir & Installer'}
              </button>
            </div>
          {:else}
            <!-- Installing status -->
            <div class="py-12 flex flex-col items-center justify-center space-y-4">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              <p class="text-xs font-bold text-indigo-400 uppercase tracking-wider animate-pulse">{statusMessage}</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

  </div>
</div>

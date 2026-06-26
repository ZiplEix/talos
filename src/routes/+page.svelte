<script lang="ts">
  import { Bot, MessageSquare, Settings, ArrowRight } from 'lucide-svelte';

  function handleNewChat() {
    window.dispatchEvent(new CustomEvent('talos:trigger-new-chat'));
  }
</script>

<div class="max-w-4xl mx-auto flex flex-col items-center justify-center text-center p-6 py-16 space-y-12 h-full">
  <!-- Brand & Hero -->
  <div class="space-y-4 max-w-2xl">
    <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider animate-pulse">
      Version Alpha 0.0.1
    </div>
    <h1 class="text-5xl font-black tracking-tight text-white sm:text-6xl">
      Bienvenue sur <span class="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Talos</span>
    </h1>
    <p class="text-lg text-slate-400 leading-relaxed">
      L'environnement de bureau unifié pour orchestrer, configurer et discuter avec vos agents d'intelligence artificielle autonomes.
    </p>
  </div>

  <!-- Quick Navigation Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">

    <!-- Chat Card -->
    <button
      onclick={handleNewChat}
      class="group p-6 bg-slate-900/10 border border-slate-800 hover:border-slate-700/60 hover:bg-slate-900/20 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 backdrop-blur-sm shadow-md cursor-pointer w-full h-full text-slate-150"
    >
      <div class="space-y-4">
        <div class="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 class="font-bold text-slate-100 group-hover:text-white transition-colors">Messagerie IA</h3>
          <p class="text-slate-400 text-xs mt-1.5 leading-relaxed">Discutez en temps réel avec vos agents IA pour résoudre des tâches complexes.</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 text-xs font-semibold text-blue-400 mt-6 group-hover:translate-x-1 transition-transform">
        Ouvrir le chat
        <ArrowRight size={12} />
      </div>
    </button>

    <!-- Agents Card -->
    <a
      href="/agents"
      class="group p-6 bg-slate-900/10 border border-slate-800 hover:border-slate-700/60 hover:bg-slate-900/20 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 backdrop-blur-sm shadow-md"
    >
      <div class="space-y-4">
        <div class="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
          <Bot size={20} />
        </div>
        <div>
          <h3 class="font-bold text-slate-100 group-hover:text-white transition-colors">Gérer les Agents</h3>
          <p class="text-slate-400 text-xs mt-1.5 leading-relaxed">Créez et configurez des agents spécialisés avec des instructions personnalisées.</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mt-6 group-hover:translate-x-1 transition-transform">
        Voir les agents
        <ArrowRight size={12} />
      </div>
    </a>

    <!-- Settings Card -->
    <a
      href="/settings"
      class="group p-6 bg-slate-900/10 border border-slate-800 hover:border-slate-700/60 hover:bg-slate-900/20 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 backdrop-blur-sm shadow-md"
    >
      <div class="space-y-4">
        <div class="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
          <Settings size={20} />
        </div>
        <div>
          <h3 class="font-bold text-slate-100 group-hover:text-white transition-colors">Configuration</h3>
          <p class="text-slate-400 text-xs mt-1.5 leading-relaxed">Ajustez vos clés d'API fournisseurs, vérifiez l'état de SQLite3, et plus.</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 text-xs font-semibold text-purple-400 mt-6 group-hover:translate-x-1 transition-transform">
        Paramétrer l'app
        <ArrowRight size={12} />
      </div>
    </a>

  </div>
</div>

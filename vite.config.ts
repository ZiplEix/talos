import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';

export default defineConfig({
	server: {
		watch: {
			// Ignore the .talos symlink (-> ~/.talos) which contains the JSON database.
			// Without this, every addMessage() write during AI streaming triggers Vite HMR,
			// which reloads the page component mid-stream and destroys IPC listeners.
			ignored: ['**/.talos/**']
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false,
				strict: true
			}),
		}),
		electron([
			{
				entry: 'electron/main.ts',
				vite: {
					build: {
						rollupOptions: {
							external: ['sqlite3']
						}
					}
				}
			},
			{
				entry: 'electron/preload.ts',
				onstart(options) {
					options.reload();
				},
				vite: {
					build: {
						lib: {
							entry: 'electron/preload.ts',
							formats: ['cjs']
						},
						rollupOptions: {
							output: {
								entryFileNames: '[name].js'
							}
						}
					}
				}
			}
		]),
	]
});

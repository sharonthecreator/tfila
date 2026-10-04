import { defineConfig } from 'vite';

// Relative base: works on GitHub Pages (/tfila/) and on any static host.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // the 3D engine changes far less often than the app: its own long-cached chunk
        manualChunks: (id) => (/node_modules\/(three|postprocessing)\//.test(id) ? 'engine' : undefined),
      },
    },
  },
  server: { host: true },
});

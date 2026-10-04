import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages (/tfila/) or any static host.
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
  server: { host: true },
});

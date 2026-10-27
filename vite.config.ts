import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Served from the domain root on Vercel; set BASE=/<repo>/ to host under a sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: process.env.BASE ?? '/',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), status: resolve(import.meta.dirname, 'status.html') } },
  },
});

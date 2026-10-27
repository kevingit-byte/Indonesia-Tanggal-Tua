import { defineConfig } from 'vite';

// Served from the domain root on Vercel; set BASE=/<repo>/ to host under a sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: process.env.BASE ?? '/',
  build: { target: 'es2020', assetsInlineLimit: 0 },
});

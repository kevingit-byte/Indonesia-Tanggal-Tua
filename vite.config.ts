import { defineConfig } from 'vite';

// GitHub Pages serves the site from /<repo>/; override with BASE=/ for Vercel or a custom domain.
export default defineConfig({
  base: process.env.BASE ?? '/Indonesia-Tanggal-Tua/',
  build: { target: 'es2020', assetsInlineLimit: 0 },
});

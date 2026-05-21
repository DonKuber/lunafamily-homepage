import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  outDir: './dist',
  site: 'https://lunafamily.online',
  compressHTML: true,
  integrations: [tailwind()],
  build: {
    // Keine Astro-generierten Legal-Pages — werden vom Backend-Webhook verwaltet
    assets: 'assets',
  },
});

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  outDir: './dist',
  site: 'https://lunafamily.online',
  compressHTML: true,
  // Die frühere Übersicht /funktionen ist im Menü der Kopfleiste aufgegangen;
  // alte Links und Suchtreffer landen bei den Funktionen auf der Startseite.
  redirects: {
    '/funktionen': '/#funktionen',
  },
  integrations: [tailwind()],
  build: {
    // Keine Astro-generierten Legal-Pages — werden vom Backend-Webhook verwaltet
    assets: 'assets',
  },
});

#!/usr/bin/env node
// Erzeugt die Teilen-Vorschaubilder (Open Graph, 1200×630) aus der Vorlage
// src/pages/og-vorlage/[slug].astro und legt sie unter public/og/<slug>.jpg ab.
//
// Ablauf: npm run build && npx astro preview   (in einem zweiten Terminal)
//         npm i --no-save playwright
//         node scripts/render-og.mjs            (optional LF_SITE_URL, CHROMIUM_PATH)
// Danach erneut bauen, damit die Seiten die Bilder verlinken.

import { mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.LF_SITE_URL || 'http://localhost:4321').replace(/\/$/, '');
const outDir = join(root, 'public', 'og');
// Nur die Vorlagen-Ordner (die fertigen Bilder liegen getrennt unter /og/).
const slugs = readdirSync(join(root, 'dist', 'og-vorlage'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light' });
for (const slug of slugs) {
  await page.goto(`${SITE}/og-vorlage/${slug}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.locator('#og').screenshot({ type: 'png' });
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(join(outDir, `${slug}.jpg`));
  console.log(`✓ og/${slug}.jpg`);
}
await browser.close();

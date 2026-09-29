#!/usr/bin/env node
// Nimmt die App-Screenshots für die Homepage auf (hell + dunkel) und legt sie
// als WebP unter public/screenshots/ ab. Welche Ansicht wohin gehört, steht in
// src/data/screenshots.json.
//
// NUR gegen den fiktiven Demo-Mandanten laufen lassen (LunaFamily-Repo:
// backend/scripts/seed-demo-social-tenant-{1,2,3}*.ts) — nie gegen ein Konto
// mit echten Daten. Das Skript bricht ab, wenn die Login-Adresse nicht auf
// .invalid endet.
//
// Voraussetzungen (nicht Teil der Homepage-Abhängigkeiten):
//   npm i --no-save playwright
// Aufruf:
//   LF_APP_URL=http://127.0.0.1:6173 LF_DEMO_EMAIL=demo-social@lunafamily.invalid \
//   LF_DEMO_PASSWORD=… node scripts/capture-screenshots.mjs [dateiname …]
// Optional: CHROMIUM_PATH=/pfad/zu/chromium, ONLY_THEME=light|dark

import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'screenshots');
const manifest = JSON.parse(readFileSync(join(root, 'src', 'data', 'screenshots.json'), 'utf8'));

const APP = (process.env.LF_APP_URL || 'http://127.0.0.1:6173').replace(/\/$/, '');
const EMAIL = process.env.LF_DEMO_EMAIL || '';
const PASSWORD = process.env.LF_DEMO_PASSWORD || '';
if (!EMAIL.endsWith('.invalid') || !PASSWORD) {
  console.error('LF_DEMO_EMAIL (…@….invalid) und LF_DEMO_PASSWORD setzen — nur der Demo-Mandant ist erlaubt.');
  process.exit(1);
}

const only = new Set(process.argv.slice(2));
const shots = Object.entries(manifest)
  .filter(([key]) => !key.startsWith('_'))
  .flatMap(([, list]) => list)
  .filter((s) => only.size === 0 || only.has(s.file));
const themes = process.env.ONLY_THEME ? [process.env.ONLY_THEME] : ['light', 'dark'];

// Hinweise, die in der Demo-Umgebung stören, auf echten Konten aber nicht
// erscheinen (Dev-Badge, Aktivierungsbanner) — per CSS ausgeblendet.
const HIDE_CSS = `
  [data-dev-badge], .dev-mode-badge { display: none !important; }
  *, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
`;

async function hideNoise(page) {
  await page.addStyleTag({ content: HIDE_CSS });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const t = el.textContent?.trim() ?? '';
      if (el.children.length < 4 && (t.startsWith('Dev Mode') || t.startsWith('Fast fertig'))) {
        const box = el.closest('[class*="fixed"], [role="alert"], [class*="banner"], div');
        (box ?? el).style.display = 'none';
      }
    }
  });
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

for (const theme of themes) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 3000 }).catch(() => {});
  await page.fill('#identifier', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 });
  // Das App-Theme folgt einer gespeicherten Wahl vor dem System-Schema.
  await page.evaluate((t) => {
    for (const k of ['theme', 'lf-theme', 'vite-ui-theme', 'lunafamily-theme']) localStorage.setItem(k, t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, theme);

  for (const s of shots) {
    await page.goto(`${APP}${s.route}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1500);
    await hideNoise(page);
    const png = await page.screenshot({ type: 'png' });
    const file = join(outDir, `${s.file}-${theme}.webp`);
    await sharp(png).resize(1600, 1000, { fit: 'cover', position: 'top' }).webp({ quality: 82 }).toFile(file);
    console.log(`✓ ${s.file}-${theme}.webp  (${s.route} → ${new URL(page.url()).pathname})`);
  }
  await ctx.close();
}
await browser.close();

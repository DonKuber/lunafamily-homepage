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
  .filter((s) => only.size === 0 || only.has(s.file))
  // Dieselbe Datei darf auf mehreren Seiten stehen, aufgenommen wird sie einmal.
  .filter((s, i, all) => all.findIndex((o) => o.file === s.file) === i);
const themes = process.env.ONLY_THEME ? [process.env.ONLY_THEME] : ['light', 'dark'];

// Hinweise, die in der Demo-Umgebung stören, auf echten Konten aber nicht
// erscheinen (Dev-Badge, Aktivierungsbanner), und das schwebende CRA-Siegel,
// das sonst in jedem Ausschnitt unten rechts im Bild steht — ausgeblendet.
const HIDE_CSS = `
  [data-dev-badge], .dev-mode-badge { display: none !important; }
  *, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
`;

async function hideNoise(page) {
  await page.addStyleTag({ content: HIDE_CSS });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const t = el.textContent?.trim() ?? '';
      if (el.children.length < 4 && (t.startsWith('Dev Mode') || t.startsWith('Fast fertig') || t === 'EU CRA Secure')) {
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
  // Die App legt die Sitzung erst kurz nach der Weiterleitung ab; ein zu
  // früher Seitenwechsel landet wieder auf /login.
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  // Das Farbschema über den Knopf in der Kopfzeile setzen — so wie ein Nutzer.
  await page.waitForSelector('header button[aria-label="Toggle dark mode"]', { timeout: 20000 });
  const isDark = () => page.evaluate(() => document.documentElement.classList.contains('dark'));
  if ((await isDark()) !== (theme === 'dark')) {
    await page.click('header button[aria-label="Toggle dark mode"]');
    await page.waitForTimeout(800);
  }
  if ((await isDark()) !== (theme === 'dark')) throw new Error(`Farbschema ${theme} ließ sich nicht setzen`);

  for (const s of shots) {
    await page.goto(`${APP}${s.route}`, { waitUntil: 'networkidle' }).catch(() => {});
    if (new URL(page.url()).pathname.startsWith('/login')) {
      throw new Error(`${s.route}: Sitzung verloren (auf /login umgeleitet) — Aufnahme abgebrochen`);
    }
    await page.waitForTimeout(1500);
    // Optional je Ansicht: einen Eintrag öffnen (Text) und/oder scrollen.
    if (s.click) {
      await page.getByText(s.click, { exact: true }).filter({ visible: true }).first().click({ timeout: 5000 });
      await page.waitForTimeout(1500);
    }
    if (s.scrollY) {
      await page.evaluate((y) => (document.querySelector('main') ?? document.scrollingElement).scrollBy(0, y), s.scrollY);
      await page.waitForTimeout(600);
    }
    await hideNoise(page);
    // Eine Aufnahme in doppelter Auflösung (2880×1800); daraus entstehen das
    // Vollbild und die Ausschnitte, die dadurch auch vergrößert scharf bleiben.
    const png = await page.screenshot({ type: 'png' });
    const file = join(outDir, `${s.file}-${theme}.webp`);
    await sharp(png).resize(1600, 1000, { fit: 'cover', position: 'top' }).webp({ quality: 82 }).toFile(file);
    console.log(`✓ ${s.file}-${theme}.webp  (${s.route} → ${new URL(page.url()).pathname})`);
    for (const c of s.crops ?? []) {
      const region = { left: c.x * 2, top: c.y * 2, width: c.w * 2, height: c.h * 2 };
      await sharp(png).extract(region).resize({ width: Math.min(region.width, 1800), withoutEnlargement: true })
        .webp({ quality: 84 }).toFile(join(outDir, `${c.file}-${theme}.webp`));
      console.log(`  ↳ ${c.file}-${theme}.webp`);
    }
  }
  await ctx.close();
}
await browser.close();

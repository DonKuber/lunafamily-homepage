#!/usr/bin/env node
// Nimmt kurze, stumme Bedienungs-Loops aus der App auf und legt sie als
// public/screenshots/<slug>.mp4 ab. Die Funktionsseite /funktionen/<slug>
// zeigt ein vorhandenes Video automatisch an.
//
// Wie capture-screenshots.mjs NUR gegen den fiktiven Demo-Mandanten
// (Login auf .invalid). Die Abläufe hinterlassen keine Änderungen: Was
// abgehakt wird, wird am Ende wieder zurückgesetzt.
//
// Voraussetzungen: npm i --no-save playwright ffmpeg-static
// Aufruf wie capture-screenshots.mjs, optional mit Slugs als Argument.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'screenshots');
const APP = (process.env.LF_APP_URL || 'http://127.0.0.1:6173').replace(/\/$/, '');
const EMAIL = process.env.LF_DEMO_EMAIL || '';
const PASSWORD = process.env.LF_DEMO_PASSWORD || '';
if (!EMAIL.endsWith('.invalid') || !PASSWORD) {
  console.error('LF_DEMO_EMAIL (…@….invalid) und LF_DEMO_PASSWORD setzen — nur der Demo-Mandant ist erlaubt.');
  process.exit(1);
}

// Sichtbarer Mauszeiger — im Headless-Screencast gibt es sonst keinen.
const CURSOR = `
  (() => {
    if (document.getElementById('lf-cursor')) return;
    const c = document.createElement('div');
    c.id = 'lf-cursor';
    c.style.cssText = 'position:fixed;z-index:2147483647;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(196,162,101,.35);border:2px solid #a8844a;pointer-events:none;transition:transform .12s ease;';
    document.documentElement.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => { c.style.transform = 'scale(.7)'; }, true);
    addEventListener('mouseup', () => { c.style.transform = 'scale(1)'; }, true);
  })();
`;

async function glide(page, locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Ziel nicht sichtbar');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
  await page.waitForTimeout(250);
}
async function clickSmooth(page, locator) {
  await glide(page, locator);
  await locator.click();
  await page.waitForTimeout(700);
}

// Jede Szene: Startseite + Ablauf + optionales Aufräumen (nicht aufgenommen).
const SCENES = {
  kueche: {
    route: '/app/food/shopping-lists',
    async play(page) {
      await clickSmooth(page, page.getByText('Wocheneinkauf', { exact: true }).filter({ visible: true }).first());
      await page.waitForTimeout(800);
      const boxes = page.locator('main button[role="checkbox"], main input[type="checkbox"]').filter({ visible: true });
      for (let i = 0; i < 3; i++) await clickSmooth(page, boxes.nth(i));
      await page.waitForTimeout(1200);
    },
    async reset(page) {
      const checked = page.locator('main button[role="checkbox"][data-state="checked"], main input[type="checkbox"]:checked').filter({ visible: true });
      for (let i = 0; i < 3 && (await checked.count()) > 0; i++) await checked.first().click();
    },
  },
  kalender: {
    route: '/app/calendar',
    async play(page) {
      await page.waitForTimeout(800);
      const next = page.locator('button:has(svg.lucide-chevron-right)').filter({ visible: true }).first();
      await clickSmooth(page, next);
      await page.waitForTimeout(1200);
      await clickSmooth(page, page.getByRole('button', { name: 'Agenda' }));
      await page.waitForTimeout(1500);
      await clickSmooth(page, page.getByRole('button', { name: 'Monat' }));
      await page.waitForTimeout(1000);
    },
  },
};

const wanted = process.argv.slice(2);
const slugs = wanted.length ? wanted : Object.keys(SCENES);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
const page = await ctx.newPage();
await page.addInitScript(CURSOR);
await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Nur notwendige|Alle akzeptieren/ }).first().click({ timeout: 3000 }).catch(() => {});
await page.fill('#identifier', EMAIL);
await page.fill('#password', PASSWORD);
await page.click('button[type=submit]');
await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3000);

for (const slug of slugs) {
  const scene = SCENES[slug];
  if (!scene) throw new Error(`Unbekannte Szene: ${slug}`);
  await page.goto(`${APP}${scene.route}`, { waitUntil: 'networkidle' });
  if (new URL(page.url()).pathname.startsWith('/login')) throw new Error(`${slug}: Sitzung verloren`);
  await page.waitForTimeout(1500);
  await page.mouse.move(1200, 700);

  const frames = [];
  const cdp = await ctx.newCDPSession(page);
  cdp.on('Page.screencastFrame', (f) => {
    frames.push({ data: f.data, t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1440, maxHeight: 900 });
  await page.waitForTimeout(600);
  await scene.play(page);
  await cdp.send('Page.stopScreencast');
  await cdp.detach();
  if (scene.reset) await scene.reset(page).catch((e) => console.warn(`${slug}: Zurücksetzen unvollständig: ${e.message}`));

  // Frames mit ihren echten Abständen zu einem 30-fps-Video zusammensetzen.
  const dir = mkdtempSync(join(tmpdir(), `lf-${slug}-`));
  const lines = [];
  frames.forEach((f, i) => {
    const file = join(dir, `${String(i).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(f.data, 'base64'));
    const next = frames[i + 1]?.t ?? f.t + 1;
    lines.push(`file '${file}'`, `duration ${Math.max(0.033, next - f.t).toFixed(3)}`);
  });
  lines.push(`file '${join(dir, `${String(frames.length - 1).padStart(5, '0')}.jpg`)}'`);
  writeFileSync(join(dir, 'list.txt'), lines.join('\n'));
  const out = join(outDir, `${slug}.mp4`);
  execFileSync(ffmpegPath, [
    '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'),
    '-vf', 'fps=30,scale=1600:1000:flags=lanczos,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-movflags', '+faststart', '-an', out,
  ]);
  // Vorschaubild, damit vor dem Abspielen keine schwarze Fläche erscheint.
  execFileSync(ffmpegPath, ['-y', '-loglevel', 'error', '-i', out, '-frames:v', '1', '-q:v', '3', join(outDir, `${slug}-poster.jpg`)]);
  rmSync(dir, { recursive: true, force: true });
  console.log(`✓ ${slug}.mp4  (${frames.length} Frames)`);
}
await browser.close();

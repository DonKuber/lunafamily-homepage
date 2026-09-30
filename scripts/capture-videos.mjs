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

// Sichtbarer Mauszeiger — im Headless-Screencast gibt es sonst keinen. Er
// hängt am <html>, nicht am <body>, damit ihn der Kamera-Zoom nicht mitskaliert.
const CURSOR = `
  (() => {
    if (document.getElementById('lf-cursor')) return;
    const c = document.createElement('div');
    c.id = 'lf-cursor';
    c.style.cssText = 'position:fixed;z-index:2147483647;left:-40px;top:-40px;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(196,162,101,.30);border:2px solid #a8844a;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none;transition:transform .15s ease;';
    document.documentElement.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => { c.style.transform = 'scale(.65)'; }, true);
    addEventListener('mouseup', () => { c.style.transform = 'scale(1)'; }, true);
  })();
`;

// Weicher Mauszeiger: Bewegung mit Beschleunigung und Abbremsen (ease-in-out)
// statt linearer Sprünge — wirkt gewollt statt hektisch.
const mouse = { x: 1200, y: 700 };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
async function glideTo(page, x, y, ms = 700) {
  const from = { ...mouse };
  const steps = Math.max(12, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const t = ease(i / steps);
    await page.mouse.move(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
    await page.waitForTimeout(ms / steps);
  }
  mouse.x = x;
  mouse.y = y;
}
async function center(locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Ziel nicht sichtbar');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function glide(page, locator, ms) {
  const c = await center(locator);
  await glideTo(page, c.x, c.y, ms);
  await page.waitForTimeout(200);
}
async function clickSmooth(page, locator, ms) {
  await glide(page, locator, ms);
  await page.mouse.down();
  await page.waitForTimeout(90);
  await page.mouse.up();
  await page.waitForTimeout(650);
}

// Kamera: fährt per CSS-Transform auf einen Punkt heran (der Punkt bleibt an
// seiner Bildschirmstelle, der Zeiger also auf seinem Ziel) und wieder zurück.
async function zoomTo(page, point, scale = 1.6, ms = 900) {
  await page.evaluate(({ x, y, scale, ms }) => {
    const b = document.body;
    b.style.transition = `transform ${ms}ms cubic-bezier(.65,0,.35,1)`;
    b.style.transformOrigin = `${x}px ${y}px`;
    b.style.transform = `scale(${scale})`;
  }, { ...point, scale, ms });
  await page.waitForTimeout(ms + 150);
}
async function zoomOut(page, ms = 900) {
  await page.evaluate((ms) => {
    document.body.style.transition = `transform ${ms}ms cubic-bezier(.65,0,.35,1)`;
    document.body.style.transform = 'none';
  }, ms);
  await page.waitForTimeout(ms + 150);
}

// Jede Szene: Startseite + Ablauf + optionales Aufräumen (nicht aufgenommen).
const SCENES = {
  kueche: {
    route: '/app/food/shopping-lists',
    async play(page) {
      await clickSmooth(page, page.getByText('Wocheneinkauf', { exact: true }).filter({ visible: true }).first(), 900);
      await page.waitForTimeout(700);
      const boxes = page.locator('main button[role="checkbox"]:not([data-state="checked"]), main input[type="checkbox"]:not(:checked)').filter({ visible: true });
      const first = await center(boxes.first());
      await glideTo(page, first.x, first.y, 800);
      // Heranzoomen auf die Liste, drei Artikel abhaken, zurückfahren.
      await zoomTo(page, { x: first.x + 260, y: first.y + 60 }, 1.7);
      for (let i = 0; i < 3; i++) {
        await clickSmooth(page, boxes.first(), 550);
        await page.waitForTimeout(350);
      }
      await page.waitForTimeout(600);
      await glideTo(page, 820, 470, 500);
      await zoomOut(page);
      await page.waitForTimeout(900);
    },
    async reset(page) {
      const checked = page.locator('main button[role="checkbox"][data-state="checked"], main input[type="checkbox"]:checked').filter({ visible: true });
      for (let i = 0; i < 3 && (await checked.count()) > 4; i++) await checked.first().click();
    },
  },
  kalender: {
    route: '/app/calendar',
    async play(page) {
      await page.waitForTimeout(700);
      // Der „Weiter"-Pfeil steht direkt hinter „Heute" (in der Seitenleiste
      // gibt es weitere Pfeile, die ein allgemeiner Selektor träfe).
      const next = page.getByRole('button', { name: 'Heute', exact: true }).locator('xpath=following::button[2]');
      // Geklickt wird ohne Zoom: Mit skaliertem <body> kommt der Klick im
      // Kalender-Kopf nicht an.
      await clickSmooth(page, next, 1000);
      await page.waitForTimeout(1200);
      // In die volle Oktoberwoche hineinfahren und über die Termine gleiten.
      const cells = page.locator('main').getByText(/Kinderarzt|Autowerkstatt|Fußballtraining|Klavierstunde|Schwimmkurs/).filter({ visible: true });
      const target = await center(cells.first());
      await glideTo(page, target.x, target.y, 900);
      await zoomTo(page, target, 1.7);
      const more = await cells.count();
      for (let i = 1; i < Math.min(more, 4); i++) await glide(page, cells.nth(i), 650);
      await page.waitForTimeout(700);
      await glideTo(page, 820, 470, 500);
      await zoomOut(page);
      await page.waitForTimeout(1200);
    },
  },
};

const wanted = process.argv.slice(2);
const slugs = wanted.length ? wanted : Object.keys(SCENES);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
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
  // Wie bei den Screenshots: das schwebende CRA-Siegel stünde sonst im Bild.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length < 4 && el.textContent?.trim() === 'EU CRA Secure') {
        (el.closest('[class*="fixed"], div') ?? el).style.display = 'none';
      }
    }
  });
  await page.mouse.move(1200, 700);
  mouse.x = 1200;
  mouse.y = 700;

  const frames = [];
  const cdp = await ctx.newCDPSession(page);
  cdp.on('Page.screencastFrame', (f) => {
    frames.push({ data: f.data, t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 2880, maxHeight: 1800 });
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
  // Aus der Mitte des Ablaufs (herangezoomt), nicht vom leeren Anfang.
  const posterAt = ((frames.at(-1).t - frames[0].t) * 0.45).toFixed(2);
  execFileSync(ffmpegPath, ['-y', '-loglevel', 'error', '-ss', posterAt, '-i', out, '-frames:v', '1', '-q:v', '3', join(outDir, `${slug}-poster.jpg`)]);
  rmSync(dir, { recursive: true, force: true });
  console.log(`✓ ${slug}.mp4  (${frames.length} Frames)`);
}
await browser.close();

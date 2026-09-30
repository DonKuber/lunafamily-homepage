#!/usr/bin/env node
// Erzeugt das Social-Media-Paket (Instagram, Facebook) aus der Vorlage
// src/pages/social-vorlage/[id].astro — jedes Bild hell und dunkel, in exakter
// Pixelgröße, als JPEG (sRGB). Dazu Reels-Videos (9:16) aus den App-Videos.
//
// Ablauf: npm run build && npx astro preview   (zweites Terminal)
//         npm i --no-save playwright ffmpeg-static
//         node scripts/render-social.mjs  [Zielordner, Vorgabe: social-kit]

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.LF_SITE_URL || 'http://localhost:4321').replace(/\/$/, '');
const out = process.argv[2] || join(root, 'social-kit');
const SIZES = { square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], cover: [1640, 624] };
const FOLDERS = {
  portrait: '1_Feed-Hochformat_4x5_1080x1350',
  square: '2_Feed-Quadrat_1x1_1080x1080',
  story: '3_Story_9x16_1080x1920',
  cover: '4_Facebook-Titelbild_1640x624',
};

const ids = readdirSync(join(root, 'dist', 'social-vorlage'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let n = 0;
for (const theme of process.env.ONLY === 'reels' ? [] : ['hell', 'dunkel']) {
  for (const id of ids) {
    const format = id.split('-').pop();
    const slug = id.slice(0, -(format.length + 1));
    const [w, h] = SIZES[format];
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme === 'dunkel' ? 'dark' : 'light' });
    await page.goto(`${SITE}/social-vorlage/${id}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.locator('#social').screenshot({ type: 'png', animations: 'disabled' });
    const dir = join(out, FOLDERS[format]);
    mkdirSync(dir, { recursive: true });
    await sharp(png).jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' }).withMetadata({ icc: 'srgb' })
      .toFile(join(dir, `LunaFamily_${slug}_${theme}.jpg`));
    await page.close();
    n++;
  }
}
console.log(`✓ ${n} Bilder`);

// Reels: App-Video im Fensterrahmen auf der Story-Vorlage.
const videos = readdirSync(join(root, 'public', 'screenshots')).filter((f) => f.endsWith('.mp4')).map((f) => f.replace('.mp4', ''));
const reelDir = join(out, '5_Reels-Video_9x16_1080x1920');
for (const slug of videos) {
  if (!ids.includes(`${slug}-story`)) continue;
  mkdirSync(reelDir, { recursive: true });
  const tmp = join(tmpdir(), `lf-reel-${slug}`);
  mkdirSync(tmp, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, colorScheme: 'light' });
  await page.goto(`${SITE}/social-vorlage/${slug}-story`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Bildbereich durch ein Video-Fenster ersetzen, Hintergrund und Texte bleiben.
  const box = await page.evaluate(() => {
    const area = document.querySelector('#social .flex-1');
    area.innerHTML = '';
    const r = area.getBoundingClientRect();
    // Fenster (58 px Titelleiste + 14 px Rand) muss ganz in den Bildbereich passen.
    const avail = r.height - 72;
    const vh = Math.round(Math.min(r.width * 1000 / 1600, avail));
    const w = Math.round(vh * 1600 / 1000);
    const x = Math.round(r.left + (r.width - w) / 2), y = Math.round(r.top + 58 + (avail - vh) / 2);
    const frame = document.createElement('div');
    frame.style.cssText = `position:fixed;left:${x - 14}px;top:${y - 58}px;width:${w + 28}px;height:${vh + 72}px;border-radius:28px;background:#f6f1e8;box-shadow:0 50px 100px -30px rgb(60 45 20 / .5);border:1px solid rgb(0 0 0 / .06)`;
    frame.innerHTML = '<div style="display:flex;gap:10px;padding:18px 22px"><i style="width:14px;height:14px;border-radius:50%;background:#f0a1a1"></i><i style="width:14px;height:14px;border-radius:50%;background:#f3cf7a"></i><i style="width:14px;height:14px;border-radius:50%;background:#9fd49a"></i></div>';
    document.querySelector('#social').appendChild(frame);
    return { x, y, w, h: vh };
  });
  await page.locator('#social').screenshot({ path: join(tmp, 'bg.png') });
  await page.close();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${box.w}" height="${box.h}"><rect width="${box.w}" height="${box.h}" rx="16" ry="16" fill="#fff"/></svg>`);
  await sharp(mask).png().toFile(join(tmp, 'mask.png'));
  // Länge des App-Videos: Standbild, Maske und Tonspur laufen sonst endlos.
  let probe = '';
  try { execFileSync(ffmpegPath, ['-i', join(root, 'public', 'screenshots', `${slug}.mp4`)], { stdio: 'pipe' }); } catch (e) { probe = String(e.stderr); }
  const [, hh, mm, ss] = probe.match(/Duration: (\d+):(\d+):([\d.]+)/) ?? [];
  const duration = (Number(hh) * 3600 + Number(mm) * 60 + Number(ss)).toFixed(2);
  execFileSync(ffmpegPath, [
    '-y', '-loglevel', 'error',
    '-loop', '1', '-i', join(tmp, 'bg.png'),
    '-i', join(root, 'public', 'screenshots', `${slug}.mp4`),
    '-loop', '1', '-i', join(tmp, 'mask.png'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-filter_complex',
    `[1:v]scale=${box.w}:${box.h}:flags=lanczos,format=rgba[v];[2:v]format=gray[m];[v][m]alphamerge[vm];[0:v][vm]overlay=${box.x}:${box.y}:shortest=1,fps=30,format=yuv420p[out]`,
    '-map', '[out]', '-map', '3:a', '-t', duration,
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '21', '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart', join(reelDir, `LunaFamily_${slug}_reel.mp4`),
  ]);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`✓ Reel ${slug}`);
}
await browser.close();
if (!existsSync(out)) process.exit(1);

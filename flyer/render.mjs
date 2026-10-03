#!/usr/bin/env node
// Erzeugt die druckfertigen Verkaufsflyer aus flyer/flyer.html:
//   flyer/LunaFamily-Flyer-A4.pdf  (216 × 303 mm = A4 + 3 mm Beschnitt)
//   flyer/LunaFamily-Flyer-A5.pdf  (154 × 216 mm = A5 + 3 mm Beschnitt)
// je zweiseitig (Vorder- und Rückseite), dazu PNG-Vorschauen unter flyer/vorschau/
// und den QR-Code flyer/qr-lunafamily.svg (Vektor, verlustfrei skalierbar).
//
// Die PDFs bekommen exakte Maße sowie TrimBox (Endformat) und BleedBox
// (Beschnitt), damit Online-Druckereien Schnittkante und Beschnitt erkennen.
//
// Ablauf: npm i --no-save playwright qrcode pdf-lib
//         node flyer/render.mjs              (optional LF_FLYER_URL, CHROMIUM_PATH)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';

const dir = dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.LF_FLYER_URL || 'https://lunafamily.online';
const BLEED = 3; // mm je Seite
const pt = (mm) => (mm * 72) / 25.4;
const FORMATS = {
  a4: { trim: [210, 297], file: 'LunaFamily-Flyer-A4.pdf' },
  a5: { trim: [148, 210], file: 'LunaFamily-Flyer-A5.pdf' },
};

// Fehlerkorrektur Q: bleibt auch mit Kratzern oder kleinem Druckversatz lesbar.
const qr = await QRCode.toString(TARGET, { type: 'svg', errorCorrectionLevel: 'Q', margin: 0, color: { dark: '#2b2118', light: '#ffffff' } });
writeFileSync(join(dir, 'qr-lunafamily.svg'), qr);
console.log(`✓ qr-lunafamily.svg → ${TARGET}`);

mkdirSync(join(dir, 'vorschau'), { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const [format, f] of Object.entries(FORMATS)) {
  await page.goto(`${pathToFileURL(join(dir, 'flyer.html'))}?format=${format}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  await page.emulateMedia({ media: 'print' });
  const pdfPath = join(dir, f.file);
  await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });

  // Chromium rundet die Seitengröße auf ganze Punkte; Maße exakt setzen.
  const doc = await PDFDocument.load(readFileSync(pdfPath));
  const [w, h] = f.trim.map((mm) => pt(mm + 2 * BLEED));
  for (const p of doc.getPages()) {
    p.setMediaBox(0, 0, w, h);
    p.setBleedBox(0, 0, w, h);
    p.setTrimBox(pt(BLEED), pt(BLEED), pt(f.trim[0]), pt(f.trim[1]));
  }
  doc.setTitle(`LunaFamily Flyer ${format.toUpperCase()}`);
  doc.setCreator('flyer/render.mjs');
  writeFileSync(pdfPath, await doc.save());
  console.log(`✓ ${f.file}`);

  const sheets = page.locator('.sheet');
  for (const [i, side] of ['vorderseite', 'rueckseite'].entries()) {
    await sheets.nth(i).screenshot({ path: join(dir, 'vorschau', `${format}-${side}.png`) });
  }
  await page.emulateMedia({ media: 'screen' });
}
await browser.close();

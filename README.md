# LunaFamily Homepage

Statische Marketing-Homepage für [lunafamily.online](https://lunafamily.online), gebaut mit [Astro 5](https://astro.build).

## Architektur

```
lunafamily.online
├── index.html          ← Astro (dieses Repo, bei jedem Push rebuilt)
├── 404.html            ← Astro
├── assets/             ← Astro (CSS, Fonts)
├── impressum.html      ← Astro (Build-Time-Fetch aus ControlPanel)
├── datenschutz.html    ← Astro (Build-Time-Fetch aus ControlPanel)
└── agb.html            ← Astro (Build-Time-Fetch aus ControlPanel)
```

**Legal Pages** (`impressum.html`, `datenschutz.html`, `agb.html`) werden von Astro
generiert, aber die Inhalte kommen zur **Build-Zeit** live aus dem ControlPanel:

```
Build (npm run build)
  → GET {CP_API_BASE_URL}/programs/homepage/{LUNAFAMILY_PROGRAM_ID}/legal-pages
      → Programm-Rechtstexte (Datenschutz-Fließtext, AGB, Cookie-Richtlinie)
      → Firmen-Pflichtangaben (Impressum + "Verantwortlicher"-Block), aufgelöst über
        das im ControlPanel hinterlegte Unternehmen dieses Programms
  → src/pages/impressum.astro / datenschutz.astro rendern daraus die Seiten
```

Ändern sich die Rechtsdaten im ControlPanel (Firma **oder** Programm), löst das Backend
einen GitHub `repository_dispatch` (`legal-content-updated`) gegen dieses Repo aus, der
`.github/workflows/deploy.yml` erneut anstößt — kein manueller Push nötig, aber auch kein
Live-Update ohne Rebuild (Verzögerung typischerweise Sekunden bis wenige Minuten).

## Entwicklung

```bash
npm install
npm run dev       # Dev-Server auf http://localhost:4321
npm run check     # TypeScript-Check
npm run build     # Statischer Build → ./dist/
```

## Funktionsseiten & App-Screenshots

Unter `/funktionen` gibt es eine Übersicht und je Bereich eine Unterseite
(`/funktionen/kalender`, `/funktionen/kueche`, …). Texte und Status stehen in
`src/data/features.ts` und gelten zugleich für die Karten auf der Startseite.

Welche App-Ansicht auf welcher Seite gezeigt wird, steht in
`src/data/screenshots.json`. Die Bilder liegen als
`public/screenshots/<datei>-light.webp` und `-dark.webp`. Fehlt eines davon,
lässt die Seite den Eintrag weg. Ein kurzes Video `public/screenshots/<slug>.mp4`
erscheint automatisch auf der passenden Unterseite.

Aufgenommen wird **ausschließlich** im fiktiven Demo-Mandanten (Familie Muster,
`…@lunafamily.invalid`, angelegt mit `backend/scripts/seed-demo-social-tenant-*`
im LunaFamily-Repo):

```bash
npm i --no-save playwright ffmpeg-static
export LF_APP_URL=http://127.0.0.1:6173 LF_DEMO_EMAIL=demo-social@lunafamily.invalid LF_DEMO_PASSWORD=…
node scripts/capture-screenshots.mjs   # Vollbilder + Ausschnitte, hell + dunkel → WebP
node scripts/capture-videos.mjs        # MP4-Loops mit Kamera-Zoom + Vorschaubild
```

Gestaltung (Recherche SaaS-Produktbilder): Die Seiten zeigen vor allem
**Ausschnitte** — je Aussage nur den Bereich, um den es geht (`crops` in
`screenshots.json`, Koordinaten in CSS-Pixeln der 1440×900-Ansicht). Sie
werden aus derselben Aufnahme in doppelter Auflösung geschnitten und stehen
auf einer „Bühne" (`ShotStage.astro`: Verlauf in Markenfarben, Rand, Schatten).
Die Vollbilder folgen darunter als Gesamtansicht. Die Videos zoomen beim
Klick auf die Aktion und führen den Zeiger weich (ease-in-out).

**Marketing-Kompositionen:** Jeder Bereich hat in `src/data/features.ts` eine
Nutzen-Schlagzeile (`claim`) und optional ein `visual`: Ausschnitt, Handy-
Aufnahme und Hinweis-Chips (`callouts`, Position in Prozent). Daraus baut
`MarketingVisual.astro` das Aufmacherbild; die Startseite zeigt Laptop und
Handy (`LaptopFrame`, `PhoneFrame`, neutrale Geräte ohne Herstellerbezug).

**Handy-Aufnahmen austauschen:** Das Handy (`PhoneFrame.astro`) zeigt die
Mobile-Ansicht der Web-App aus den `phone`-Einträgen in `screenshots.json`
(390×844, Statusleiste und Home-Balken zeichnet der Rahmen selbst). Echte
App-Fotos später einfach als `public/screenshots/<datei>-light.webp` und
`-dark.webp` im Hochformat 390:844 ablegen — gleicher Name, keine Code-Änderung.

**Teilen-Vorschaubilder** (WhatsApp, Facebook, LinkedIn …): Vorlage
`src/pages/og-vorlage/[slug].astro`, Bilder unter `public/og/`. Nach
geänderten Texten oder Screenshots: bauen, `npx astro preview`, dann
`node scripts/render-og.mjs`, danach erneut bauen.

Am saubersten wird es mit dem Produktions-Build des Frontends
(`npx vite build && npx vite preview`), weil dann kein Dev-Hinweis im Bild
erscheint. Vor einer neuen Aufnahme die Bilder ansehen — ein leerer Zustand
oder eine Fehlermeldung in der App landet sonst unbemerkt auf der Website.

## Deployment

Automatisch bei jedem Push auf `main`, `workflow_dispatch` oder eingehendem
`repository_dispatch` (`legal-content-updated`) via GitHub Actions:

1. Astro Build → `./dist/` (fetcht dabei live die aktuellen Rechtsdaten aus ControlPanel)
2. `rsync --delete` → Server (alle Seiten, inkl. Impressum/Datenschutz/AGB — es gibt keine
   separate Datei-Quelle mehr, die überschrieben werden müsste)

## BSI / DE Compliance

| Anforderung | Status |
|---|---|
| TLS 1.3 (BSI TR-02102-2) | ✅ Caddy |
| HSTS `includeSubDomains` | ✅ Caddy |
| Impressum § 18 MStV | ✅ Build-Time-Fetch aus ControlPanel |
| Datenschutz DSGVO Art. 13 | ✅ Build-Time-Fetch aus ControlPanel |
| Cookie-Consent TTDSG § 25 | ✅ Nicht nötig (cookielose Analytics) |
| WCAG 2.1 AA (BFSG) | ✅ Semantisches HTML, Kontrastwerte |

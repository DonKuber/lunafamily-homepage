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

# LunaFamily Homepage

Statische Marketing-Homepage für [lunafamily.online](https://lunafamily.online), gebaut mit [Astro 5](https://astro.build).

## Architektur

```
lunafamily.online
├── index.html          ← Astro (dieses Repo, bei jedem Push rebuilt)
├── 404.html            ← Astro
├── assets/             ← Astro (CSS, Fonts)
├── impressum.html      ← Backend-Webhook (LunaFamily App-Repo)
└── datenschutz.html    ← Backend-Webhook (LunaFamily App-Repo)
```

**Legal Pages** (`impressum.html`, `datenschutz.html`) werden **nicht** von Astro generiert.
Sie werden vom ControlPanel über einen S2S-Webhook automatisch aktualisiert:

```
ControlPanel → POST app.lunafamily.online/api/webhooks/controlpanel/legal-update
                                    → schreibt /var/www/lunafamily-home/impressum.html
                                    → schreibt /var/www/lunafamily-home/datenschutz.html
```

## Entwicklung

```bash
npm install
npm run dev       # Dev-Server auf http://localhost:4321
npm run check     # TypeScript-Check
npm run build     # Statischer Build → ./dist/
```

## Deployment

Automatisch bei jedem Push auf `main` via GitHub Actions:

1. Astro Build → `./dist/`
2. `rsync --exclude impressum.html --exclude datenschutz.html` → Server
3. Legal-Page-Placeholder anlegen falls noch nicht vorhanden

## BSI / DE Compliance

| Anforderung | Status |
|---|---|
| TLS 1.3 (BSI TR-02102-2) | ✅ Caddy |
| HSTS `includeSubDomains` | ✅ Caddy |
| Impressum § 18 MStV | ✅ Via Webhook |
| Datenschutz DSGVO Art. 13 | ✅ Via Webhook |
| Cookie-Consent TTDSG § 25 | ✅ Nicht nötig (cookielose Analytics) |
| WCAG 2.1 AA (BFSG) | ✅ Semantisches HTML, Kontrastwerte |

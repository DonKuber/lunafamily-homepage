// Die zwölf Funktionsbereiche — Quelle für die Karten auf der Startseite und
// die Unterseiten unter /funktionen/<slug>.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { IC } from './icons';
import screenshots from './screenshots.json';

export type Status = 'available' | 'partial' | 'coming';

export interface Highlight {
  title: string;
  text: string;
}

/** Hinweis-Chip auf dem Marketing-Bild; x/y in Prozent der Bildfläche. */
export interface Callout {
  text: string;
  x: number;
  y: number;
  icon?: 'check' | 'star' | 'bell' | 'heart' | 'shield' | 'users';
}

/** Marketing-Komposition: Ausschnitt, optional Handy, Hinweise. */
export interface Visual {
  detail: string;
  phone?: string;
  tilt?: 'left' | 'right';
  callouts: Callout[];
}

export interface Category {
  slug: string;
  /** Nutzen in einem Satz — die Schlagzeile der Unterseite. */
  claim: string;
  visual?: Visual;
  icon: string;
  gradient: string;
  status: Status;
  title: string;
  subtitle: string;
  features: string[];
  intro: string;
  highlights: Highlight[];
}

export interface Screenshot {
  file: string;
  caption: string;
  width: number;
  height: number;
}

export const STATUS: Record<Status, { label: string; cls: string }> = {
  available: { label: 'Verfügbar',      cls: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50' },
  partial:   { label: 'In Entwicklung', cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50' },
  coming:    { label: 'Demnächst',      cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50' },
};

export const CATEGORIES: Category[] = [
  {
    slug: 'kalender',
    claim: 'Alle Termine der Familie – auf einen Blick.',
    visual: { detail: 'kalender-raster', phone: 'phone-kalender', tilt: 'left', callouts: [{ text: 'Jede Person in ihrer Farbe', x: 26, y: -8, icon: 'users' }, { text: 'Training jeden Dienstag – einmal angelegt', x: -5, y: 93, icon: 'check' }] }, icon: IC.calendar, gradient: 'from-blue-500 to-cyan-500', status: 'available',
    title: 'Kalender & Planung', subtitle: 'Nie wieder einen Termin verpassen',
    features: ['Familien-Kalender', 'Wiederkehrende Termine', 'Event-Planung & Abstimmungen', 'Erinnerungen & Push-Benachrichtigungen'],
    intro: 'Fußballtraining, Elternabend, Zahnarzt, Omas Geburtstag: Im Familienkalender stehen alle Termine an einem Ort. Jeder sieht, wer wann wo sein muss, und niemand muss mehr fragen, ob der Termin am Dienstag oder am Mittwoch war.',
    highlights: [
      { title: 'Ein Kalender für alle', text: 'Termine lassen sich einzelnen Familienmitgliedern zuordnen. So erkennt ihr auf einen Blick, wer gerade verplant ist.' },
      { title: 'Wiederkehrende Termine', text: 'Training jeden Dienstag, Müllabfuhr alle zwei Wochen: einmal anlegen, fertig.' },
      { title: 'Events planen', text: 'Vom Kindergeburtstag bis zum Hochzeitstag: Gästeliste mit Zu- und Absagen, Budget und To-dos an einem Ort.' },
      { title: 'Erinnerungen', text: 'Push-Benachrichtigungen sorgen dafür, dass kein Termin durchrutscht.' },
    ],
  },
  {
    slug: 'aufgaben',
    claim: 'Nichts rutscht mehr durch.',
    visual: { detail: 'wiedervorlagen-liste', phone: 'phone-aufgaben', tilt: 'right', callouts: [{ text: 'Erinnert rechtzeitig an Fristen', x: 24, y: -9, icon: 'bell' }, { text: 'Wichtiges zuerst', x: -5, y: 94, icon: 'star' }] }, icon: IC.checkCircle, gradient: 'from-green-500 to-emerald-500', status: 'available',
    title: 'Aufgaben & Todos', subtitle: 'Gemeinsam mehr erledigen',
    features: ['Aufgabenlisten für alle', 'Subtasks & Prioritäten', 'Kategorien & Tags', 'Fälligkeitsdaten & Zuweisung'],
    intro: '„Wer kümmert sich eigentlich um …?" Diese Frage stellt sich nicht mehr. Aufgaben bekommen einen Zuständigen, eine Frist und eine Priorität, und große Vorhaben lassen sich in kleine Schritte zerlegen.',
    highlights: [
      { title: 'Klar verteilt', text: 'Jede Aufgabe hat einen Zuständigen. Jeder sieht seine eigene Liste, die Eltern behalten den Gesamtüberblick.' },
      { title: 'Teilaufgaben & Fortschritt', text: 'Große Projekte wie „Kinderzimmer streichen" in Schritte zerlegen und den Fortschritt verfolgen.' },
      { title: 'Wiedervorlagen', text: 'Kündigungsfristen, Garantien, Widerspruchsfristen: LunaFamily erinnert rechtzeitig daran.' },
      { title: 'Kategorien & Tags', text: 'Haushalt, Schule, Finanzen, Behörden: Filter bringen Ordnung in lange Listen.' },
    ],
  },
  {
    slug: 'dokumente',
    claim: 'Jedes Dokument in Sekunden wiedergefunden.', icon: IC.fileText, gradient: 'from-orange-500 to-amber-500', status: 'available',
    title: 'Dokumente (Paperless)', subtitle: 'Papierkram endlich digital',
    features: ['Rechnungen & Verträge', 'Automatische OCR-Erkennung', 'Intelligente Kategorisierung', 'Schnelle Volltextsuche'],
    intro: 'Rechnungen, Bescheide, Zeugnisse, Garantiebelege: einscannen, automatisch erkennen lassen und in Sekunden wiederfinden. Die Dokumentenverwaltung baut auf Paperless-ngx auf, einem bewährten Open-Source-System.',
    highlights: [
      { title: 'Texterkennung (OCR)', text: 'Gescannte Dokumente werden durchsuchbar, auch Fotos vom Handy.' },
      { title: 'Automatisch einsortiert', text: 'Absender, Dokumenttyp und Schlagworte werden erkannt und zugeordnet.' },
      { title: 'Volltextsuche', text: 'Die Stromrechnung von 2023? Ein Suchbegriff genügt.' },
      { title: 'Verknüpft mit Verträgen', text: 'Dokumente hängen direkt am passenden Vertrag, Kontakt oder Inventargegenstand.' },
    ],
  },
  {
    slug: 'kueche',
    claim: 'Sonntag planen, die ganze Woche entspannt essen.',
    visual: { detail: 'essensplan-woche', phone: 'phone-essensplan', tilt: 'left', callouts: [{ text: 'Frühstück bis Abendessen geplant', x: -6, y: -6, icon: 'check' }, { text: 'Auch unterwegs griffbereit', x: 44, y: 104, icon: 'heart' }] }, icon: IC.utensils, gradient: 'from-rose-500 to-pink-500', status: 'available',
    title: 'Küche & Ernährung', subtitle: 'Kochen wird wieder Freude',
    features: ['Rezeptsammlung', 'Mahlzeitenplanung', 'Auto-Einkaufslisten', 'Kalorientracking'],
    intro: 'Die tägliche Frage „Was essen wir heute?" beantwortet der Essensplan schon am Sonntag. Rezepte, Wochenplan und Einkaufsliste greifen ineinander, und im Supermarkt hakt jeder gemeinsam auf derselben Liste ab.',
    highlights: [
      { title: 'Rezeptsammlung', text: 'Familienlieblinge mit Zutaten, Schritten, Zubereitungszeit und Bewertungen, alles an einem Ort statt verstreut auf Zetteln.' },
      { title: 'Essensplan', text: 'Frühstück, Mittag- und Abendessen für die Woche planen und die Portionen an die Familie anpassen.' },
      { title: 'Einkaufslisten', text: 'Zutaten aus dem Essensplan landen auf der Liste. Mehrere Listen, etwa für Drogerie oder Baumarkt, gleichzeitig.' },
      { title: 'Gemeinsam abhaken', text: 'Wer gerade im Laden steht, hakt ab, und alle anderen sehen es sofort.' },
    ],
  },
  {
    slug: 'familie',
    claim: 'Alle an Bord – und Kinderdaten bleiben geschützt.',
    visual: { detail: 'familie-einwilligung', tilt: 'right', callouts: [{ text: 'Einwilligung der Eltern (Art. 8 DSGVO)', x: 52, y: -7, icon: 'shield' }, { text: 'Jeder mit eigenem Zugang', x: -5, y: 97, icon: 'users' }] }, icon: IC.users, gradient: 'from-violet-500 to-purple-500', status: 'available',
    title: 'Familie & Kontakte', subtitle: 'Alle Verbindungen an einem Ort',
    features: ['Familienmitglieder verwalten', 'Stammbaum visualisieren', 'Kontaktbuch mit CRM', 'Firmen & Verträge'],
    intro: 'Jedes Familienmitglied hat ein eigenes Profil mit passenden Rechten, vom Elternteil bis zur Oma mit Lesezugriff. Dazu kommen das Kontaktbuch, Firmen, Verträge, das Familientagebuch und das Erfolgsjournal.',
    highlights: [
      { title: 'Rollen & Rechte', text: 'Eltern, Kinder, Großeltern: Jeder sieht, was er sehen soll. Private Bereiche bleiben privat.' },
      { title: 'Kontaktbuch', text: 'Adressen, Telefonnummern und Geburtstage, auf Wunsch mit Erinnerung.' },
      { title: 'Verträge im Blick', text: 'Miete, Strom, Versicherungen, Abos: Kosten, Laufzeiten und Ansprechpartner an einem Ort.' },
      { title: 'Tagebuch & Erfolge', text: 'Schöne Momente festhalten und Erfolge feiern, vom Seepferdchen bis zum Halbmarathon.' },
    ],
  },
  {
    slug: 'haushalt',
    claim: 'Der Haushalt als Teamspiel.',
    visual: { detail: 'haushalt-karten', tilt: 'left', callouts: [{ text: '15 Punkte für geputzte Fenster', x: 74, y: 22, icon: 'star' }, { text: 'Wiederkehrend – plant sich selbst', x: -38, y: 70, icon: 'check' }] }, icon: IC.home, gradient: 'from-teal-500 to-green-500', status: 'available',
    title: 'Haushalt', subtitle: 'Der Haushalt läuft sich fast von selbst',
    features: ['Haushaltsaufgaben & Gamification', 'Inventar verwalten', 'Bedienungsanleitungen', 'Haushaltsplaner'],
    intro: 'Spülmaschine ausräumen, Müll rausbringen, Pflanzen gießen: Haushaltsaufgaben wiederholen sich automatisch und bringen Punkte. Das motiviert die Kinder und entlastet die Eltern. Das Inventar weiß, was ihr besitzt und wann eine Garantie abläuft.',
    highlights: [
      { title: 'Aufgaben mit Punkten', text: 'Für jede erledigte Aufgabe gibt es Punkte, die gegen Belohnungen eingelöst werden können.' },
      { title: 'Wiederkehrend', text: 'Täglich, wöchentlich oder monatlich: Der Plan erstellt sich von selbst.' },
      { title: 'Inventar', text: 'Was steht in welchem Raum? Mit Kaufpreis, Händler und Garantiedatum.' },
      { title: 'Bedienungsanleitungen', text: 'Die Anleitung zur Waschmaschine ist dort, wo man sie sucht: beim Gerät.' },
    ],
  },
  {
    slug: 'finanzen',
    claim: 'Endlich wissen, wohin das Familiengeld fließt.',
    visual: { detail: 'kasse-konten', tilt: 'right', callouts: [{ text: 'Monatsvergleich automatisch', x: 64, y: -9, icon: 'star' }, { text: 'Taschengeld inklusive', x: -5, y: 96, icon: 'heart' }] }, icon: IC.wallet, gradient: 'from-yellow-500 to-orange-500', status: 'partial',
    title: 'Finanzen', subtitle: 'Volle Kontrolle über das Familienbudget',
    features: ['Open Banking (GoCardless)', 'Ausgaben & Budgets', 'Kredite & Investments', 'Steuerübersicht'],
    intro: 'Wohin fließt das Geld? Haushaltskasse, Portemonnaie und Sparschwein sind erfasst, Verträge und Kredite laufen in einer Übersicht je Familienmitglied zusammen. Geteilte Ausgaben und die Anbindung ans Bankkonto per Open Banking sind in Entwicklung.',
    highlights: [
      { title: 'Bargeld & Kassen', text: 'Portemonnaie, Haushaltskasse, Taschengeld: jede Ausgabe mit Kategorie.' },
      { title: 'Übersicht je Person', text: 'Einnahmen, Ausgaben, Verträge und Kredite für jedes Familienmitglied auf einen Blick.' },
      { title: 'Kredite in der Familie', text: 'Das Darlehen an die Tochter für das Fahrrad, mit Tilgungsplan statt Zettel am Kühlschrank.' },
      { title: 'Open Banking', text: 'In Entwicklung: Kontoumsätze sicher über GoCardless abrufen und automatisch kategorisieren.' },
    ],
  },
  {
    slug: 'kommunikation',
    claim: 'Alles Wichtige, ohne Chat-Chaos.', icon: IC.mail, gradient: 'from-sky-500 to-blue-500', status: 'partial',
    title: 'Kommunikation', subtitle: 'Immer verbunden, egal wo',
    features: ['Familien-Nachrichten', 'Integrierter E-Mail-Client', 'Ankündigungen', 'Anrufverlauf'],
    intro: 'Nachrichten an die Familie, wichtige Ankündigungen und das Postfach für die Familien-E-Mails. Aus einer E-Mail wird mit einem Klick eine Aufgabe oder eine Wiedervorlage.',
    highlights: [
      { title: 'Familien-Nachrichten', text: 'Schnelle Absprachen ohne fremden Messenger, die Daten bleiben bei euch.' },
      { title: 'E-Mail-Client', text: 'Familienpostfächer direkt in LunaFamily lesen und beantworten.' },
      { title: 'Aus E-Mail wird Aufgabe', text: 'Rechnung per Mail? Direkt als Wiedervorlage mit Frist anlegen.' },
    ],
  },
  {
    slug: 'schule',
    claim: 'Hausaufgaben, Noten, Termine – gemeinsam im Blick.', icon: IC.graduationCap, gradient: 'from-indigo-500 to-violet-500', status: 'partial',
    title: 'Schule & Bildung', subtitle: 'Lernfortschritt im Blick',
    features: ['Schultermine & Hausaufgaben', 'Noten & Zeugnisse', 'Lernpläne', 'Studienmanagement'],
    intro: 'Stundenplan, Hausaufgaben, Klassenarbeiten und Noten: Eltern und Kinder behalten gemeinsam den Überblick. Die Daten der Kinder sind dabei besonders geschützt.',
    highlights: [
      { title: 'Hausaufgaben & Termine', text: 'Was ist bis wann zu erledigen, und wann ist die nächste Klassenarbeit?' },
      { title: 'Noten & Zeugnisse', text: 'Den Lernfortschritt über die Schuljahre hinweg verfolgen.' },
      { title: 'Kinderdaten geschützt', text: 'Die Verarbeitung ist an die Einwilligung der Eltern gebunden (Art. 8 DSGVO).' },
    ],
  },
  {
    slug: 'ki',
    claim: 'Die Kleinarbeit erledigt sich von selbst.', icon: IC.sparkles, gradient: 'from-pink-500 to-rose-500', status: 'coming',
    title: 'KI-Assistent', subtitle: 'Intelligente Unterstützung im Alltag',
    features: ['Automatische Kategorisierung', 'Smarte Vorschläge', 'E-Mail-Review & Zusammenfassungen', 'Multi-Provider KI'],
    intro: 'Künstliche Intelligenz soll euch die Kleinarbeit abnehmen: Dokumente einsortieren, Vorschläge für den Essensplan machen, lange E-Mails zusammenfassen. Welcher KI-Anbieter dabei zum Einsatz kommt, entscheidet ihr.',
    highlights: [
      { title: 'Automatisch sortiert', text: 'Belege, Dokumente und Ausgaben werden selbstständig kategorisiert.' },
      { title: 'Smarte Vorschläge', text: 'Rezeptideen aus dem, was noch im Kühlschrank ist.' },
      { title: 'Freie Anbieterwahl', text: 'Mehrere KI-Anbieter, auch lokal betriebene Modelle.' },
    ],
  },
  {
    slug: 'mobile',
    claim: 'Immer dabei – auch ohne Netz.', icon: IC.smartphone, gradient: 'from-slate-500 to-gray-600', status: 'coming',
    title: 'Mobile App (Offline)', subtitle: 'Immer dabei, auch ohne Internet',
    features: ['iOS & Android App', 'Offline-First Architektur', 'Automatische Synchronisation', 'Biometrische Absicherung'],
    intro: 'Einkaufsliste im Funkloch, Kalender im Flugzeug: Die mobile App funktioniert auch ohne Verbindung und gleicht Änderungen automatisch ab, sobald wieder Netz da ist.',
    highlights: [
      { title: 'Offline zuerst', text: 'Alle wichtigen Daten liegen verschlüsselt auf dem Gerät.' },
      { title: 'Automatischer Abgleich', text: 'Änderungen werden im Hintergrund synchronisiert.' },
      { title: 'Biometrisch geschützt', text: 'Entsperren per Fingerabdruck oder Gesichtserkennung.' },
    ],
  },
  {
    slug: 'statistiken',
    claim: 'Ein Blick am Morgen, und der Tag ist klar.',
    visual: { detail: 'dashboard-termine', phone: 'phone-dashboard', tilt: 'left', callouts: [{ text: 'Die nächsten Termine aller', x: -6, y: -6, icon: 'users' }] }, icon: IC.barChart, gradient: 'from-cyan-500 to-teal-500', status: 'partial',
    title: 'Statistiken & Insights', subtitle: 'Daten, die wirklich helfen',
    features: ['Familien-Dashboard', 'Aktivitätsberichte', 'Ausgaben-Trends', 'Produktivitäts-Insights'],
    intro: 'Das Dashboard zeigt morgens, was heute ansteht. Die Statistiken zeigen, wie sich Ausgaben entwickeln, wer im Haushalt am fleißigsten war und welche Aufgaben liegen bleiben.',
    highlights: [
      { title: 'Familien-Dashboard', text: 'Termine, offene Aufgaben und Neuigkeiten auf einen Blick.' },
      { title: 'Ausgaben-Trends', text: 'Monatsvergleiche nach Kategorie, damit ihr seht, wo sich Sparen lohnt.' },
      { title: 'Aktivität', text: 'Wer hat diese Woche welche Aufgaben erledigt?' },
    ],
  },
];

// Screenshots werden von scripts/capture-screenshots.mjs erzeugt. Nur Einträge,
// deren Bilddateien tatsächlich vorliegen, erscheinen auf der Seite.
const SCREEN_W = 1600;
const SCREEN_H = 1000;
// Astro baut aus dem Projektverzeichnis; import.meta.url zeigt im Build in
// den gebündelten Ausgabeordner und taugt hier nicht.
const publicDir = join(process.cwd(), 'public', 'screenshots');

function available(file: string): boolean {
  return existsSync(join(publicDir, `${file}-light.webp`)) && existsSync(join(publicDir, `${file}-dark.webp`));
}

interface ManifestCrop {
  file: string;
  x: number;
  y: number;
  w: number;
  h: number;
  caption: string;
}
interface ManifestShot {
  file: string;
  caption: string;
  crops?: ManifestCrop[];
}

const manifest = screenshots as unknown as Record<string, ManifestShot[]>;

/** Eine App-Ansicht: das Vollbild und die daraus geschnittenen Ausschnitte. */
export interface View {
  full: Screenshot | null;
  details: Screenshot[];
}

// Ausschnitte entstehen in doppelter Auflösung, höchstens 1800 px breit
// (siehe capture-screenshots.mjs) — daraus folgen Breite und Höhe fürs <img>.
function cropSize(c: ManifestCrop): { width: number; height: number } {
  const width = Math.min(c.w * 2, 1800);
  return { width, height: Math.round((width * c.h) / c.w) };
}

export function viewsFor(key: string): View[] {
  return (manifest[key] ?? [])
    .map((s) => ({
      full: available(s.file) ? { file: s.file, caption: s.caption, width: SCREEN_W, height: SCREEN_H } : null,
      details: (s.crops ?? [])
        .filter((c) => available(c.file))
        .map((c) => ({ file: c.file, caption: c.caption, ...cropSize(c) })),
    }))
    .filter((v) => v.full || v.details.length > 0);
}

export function screenshotsFor(key: string): Screenshot[] {
  return viewsFor(key).flatMap((v) => (v.full ? [v.full] : []));
}

export function detailsFor(key: string): Screenshot[] {
  return viewsFor(key).flatMap((v) => v.details);
}

export interface Video {
  src: string;
  poster?: string;
}

export function videoFor(slug: string): Video | null {
  if (!existsSync(join(publicDir, `${slug}.mp4`))) return null;
  const poster = existsSync(join(publicDir, `${slug}-poster.jpg`)) ? `/screenshots/${slug}-poster.jpg` : undefined;
  return { src: `/screenshots/${slug}.mp4`, poster };
}

/** Ein Ausschnitt oder eine Handy-Aufnahme per Dateiname, sofern vorhanden. */
export function shotByFile(file: string): Screenshot | null {
  for (const list of Object.values(manifest)) {
    for (const s of list) {
      if (s.file === file && available(s.file)) {
        const phone = (manifest.phone ?? []).includes(s);
        return { file: s.file, caption: s.caption, width: phone ? 780 : SCREEN_W, height: phone ? 1688 : SCREEN_H };
      }
      for (const c of s.crops ?? []) {
        if (c.file === file && available(c.file)) return { file: c.file, caption: c.caption, ...cropSize(c) };
      }
    }
  }
  return null;
}

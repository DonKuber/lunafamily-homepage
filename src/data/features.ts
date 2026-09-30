// Die Funktionsbereiche — Quelle für die Karten auf der Startseite, die
// Roadmap und die Unterseiten unter /funktionen/<slug>.
//
// Freischalten: Ein Bereich bekommt erst dann eine eigene Unterseite, Bilder
// und einen Link, wenn er veröffentlicht ist. Verfügbare und teilweise
// verfügbare Bereiche sind das automatisch; alle anderen erscheinen nur als
// Karte mit Status. Zum Freischalten `published: true` setzen (oder den Status
// ändern) — Bilder und Texte liegen schon bereit.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { IC } from './icons';
import screenshots from './screenshots.json';

export type Status = 'available' | 'partial' | 'soon' | 'planned';

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
  /** Unterseite, Bilder und Link freischalten; siehe Kopfkommentar. */
  published?: boolean;
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

export const STATUS: Record<Status, { label: string; cls: string; dot: string }> = {
  available: { label: 'Verfügbar',           dot: 'bg-green-500',            cls: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50' },
  partial:   { label: 'Teilweise verfügbar', dot: 'bg-amber-500',            cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50' },
  soon:      { label: 'Demnächst',           dot: 'bg-sky-500',              cls: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800/50' },
  planned:   { label: 'In Planung',          dot: 'bg-muted-foreground/50',  cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50' },
};

export const STATUS_ORDER: Status[] = ['available', 'partial', 'soon', 'planned'];

export function isPublished(cat: Category): boolean {
  return cat.published ?? (cat.status === 'available' || cat.status === 'partial');
}

const ALL: Category[] = [
  // ─── Verfügbar ────────────────────────────────────────────────────────────
  {
    slug: 'kalender',
    claim: 'Alle Termine der Familie – auf einen Blick.',
    visual: { detail: 'kalender-raster', phone: 'phone-kalender', tilt: 'left', callouts: [{ text: 'Jede Person in ihrer Farbe', x: 26, y: -8, icon: 'users' }, { text: 'Training jeden Dienstag – einmal angelegt', x: -5, y: 93, icon: 'check' }] }, icon: IC.calendar, gradient: 'from-blue-500 to-cyan-500', status: 'available',
    title: 'Kalender & Planung', subtitle: 'Nie wieder einen Termin verpassen',
    features: ['Familien-Kalender mit Farben je Person', 'Wiederkehrende Termine', 'Abstimmungen & Terminvorlagen', 'Erinnerungen & Push-Benachrichtigungen'],
    intro: 'Fußballtraining, Elternabend, Zahnarzt, Omas Geburtstag: Im Familienkalender stehen alle Termine an einem Ort. Jeder sieht, wer wann wo sein muss, und niemand muss mehr fragen, ob der Termin am Dienstag oder am Mittwoch war.',
    highlights: [
      { title: 'Ein Kalender für alle', text: 'Termine lassen sich einzelnen Familienmitgliedern zuordnen. So erkennt ihr auf einen Blick, wer gerade verplant ist.' },
      { title: 'Wiederkehrende Termine', text: 'Training jeden Dienstag, Müllabfuhr alle zwei Wochen: einmal anlegen, fertig.' },
      { title: 'Gemeinsam abstimmen', text: 'Wohin geht der Sonntagsausflug? Alle stimmen ab, das Ergebnis steht fest – ganz ohne Gruppenchat.' },
      { title: 'Erinnerungen', text: 'Push-Benachrichtigungen sorgen dafür, dass kein Termin durchrutscht.' },
    ],
  },
  {
    slug: 'aufgaben',
    claim: 'Nichts rutscht mehr durch.',
    visual: { detail: 'wiedervorlagen-liste', phone: 'phone-aufgaben', tilt: 'right', callouts: [{ text: 'Erinnert rechtzeitig an Fristen', x: 24, y: -9, icon: 'bell' }, { text: 'Wichtiges zuerst', x: -5, y: 94, icon: 'star' }] }, icon: IC.checkCircle, gradient: 'from-green-500 to-emerald-500', status: 'available',
    title: 'Aufgaben & Todos', subtitle: 'Gemeinsam mehr erledigen',
    features: ['Aufgabenlisten für alle', 'Teilaufgaben & Projekte', 'Prioritäten & Eisenhower-Matrix', 'Wiedervorlagen & wiederkehrende Aufgaben'],
    intro: '„Wer kümmert sich eigentlich um …?" Diese Frage stellt sich nicht mehr. Aufgaben bekommen einen Zuständigen, eine Frist und eine Priorität, und große Vorhaben lassen sich in kleine Schritte zerlegen.',
    highlights: [
      { title: 'Klar verteilt', text: 'Jede Aufgabe hat einen Zuständigen. Jeder sieht seine eigene Liste, die Eltern behalten den Gesamtüberblick.' },
      { title: 'Teilaufgaben & Projekte', text: 'Große Vorhaben wie „Kinderzimmer streichen" in Schritte zerlegen, als Projekt bündeln und den Fortschritt verfolgen.' },
      { title: 'Wiedervorlagen', text: 'Kündigungsfristen, Garantien, Widerspruchsfristen: LunaFamily erinnert rechtzeitig daran.' },
      { title: 'Das Wichtige zuerst', text: 'Prioritäten, Kategorien und die Eisenhower-Matrix bringen Ordnung in lange Listen.' },
    ],
  },
  {
    slug: 'dokumente',
    claim: 'Jedes Dokument in Sekunden wiedergefunden.', icon: IC.fileText, gradient: 'from-orange-500 to-amber-500', status: 'available',
    title: 'Dokumente', subtitle: 'Papierkram endlich digital',
    features: ['Posteingang & Ordnerstruktur', 'Texterkennung (OCR) & KI-Einordnung', 'Schnelle Volltextsuche', 'Sicher teilen per Link'],
    intro: 'Rechnungen, Bescheide, Zeugnisse, Garantiebelege: hochladen oder direkt vom Scanner einlesen, automatisch erkennen lassen und in Sekunden wiederfinden. Jede Datei wird vor dem Speichern auf Schadsoftware geprüft.',
    highlights: [
      { title: 'Texterkennung (OCR)', text: 'Gescannte Dokumente werden durchsuchbar, auch Fotos vom Handy.' },
      { title: 'Automatisch eingeordnet', text: 'Absender, Dokumenttyp und Schlagworte werden vorgeschlagen – ihr bestätigt mit einem Klick.' },
      { title: 'Volltextsuche', text: 'Die Stromrechnung von 2023? Ein Suchbegriff genügt.' },
      { title: 'Sicher geteilt', text: 'Dokumente per Freigabelink weitergeben und den Link jederzeit widerrufen. Gelöschtes landet erst im Papierkorb.' },
    ],
  },
  {
    slug: 'paperless',
    claim: 'Paperless-ngx und LunaFamily arbeiten Hand in Hand.', icon: IC.fileScan, gradient: 'from-lime-500 to-green-600', status: 'available',
    title: 'Paperless-ngx Integration', subtitle: 'Euer Archiv, nahtlos verbunden',
    features: ['Abgleich in beide Richtungen', 'Tags, Dokumenttypen & Felder synchron', 'Aufbewahrungsfristen je Dokumenttyp', 'Vorschau & Download direkt in LunaFamily'],
    intro: 'Ihr nutzt schon Paperless-ngx? Dann verbindet LunaFamily euer bestehendes Archiv, statt es zu ersetzen. Dokumente, Tags und Dokumenttypen bleiben in beiden Systemen auf demselben Stand.',
    highlights: [
      { title: 'Abgleich in beide Richtungen', text: 'Neue Dokumente wandern automatisch hin und her. Konflikte werden angezeigt und lassen sich gezielt auflösen.' },
      { title: 'Alles bleibt sortiert', text: 'Tags, Dokumenttypen, Speicherpfade und eigene Felder werden mit abgeglichen, Korrespondenten übernommen.' },
      { title: 'Aufbewahrung geregelt', text: 'Für jeden Dokumenttyp eine Frist festlegen – abgelaufene Dokumente werden automatisch und protokolliert gelöscht.' },
      { title: 'Umzug jederzeit', text: 'Bestehende Dokumente lassen sich nach Paperless-ngx übertragen oder von dort übernehmen.' },
    ],
  },
  {
    slug: 'familie',
    claim: 'Alle an Bord – und Kinderdaten bleiben geschützt.',
    visual: { detail: 'familie-einwilligung', tilt: 'right', callouts: [{ text: 'Einwilligung der Eltern (Art. 8 DSGVO)', x: 52, y: -7, icon: 'shield' }, { text: 'Jeder mit eigenem Zugang', x: -5, y: 97, icon: 'users' }] }, icon: IC.users, gradient: 'from-violet-500 to-purple-500', status: 'available',
    title: 'Familie & Kontakte', subtitle: 'Alle Verbindungen an einem Ort',
    features: ['Familienmitglieder & Rollen', 'Stammbaum visualisieren', 'Kontaktbuch & Firmen', 'Tagebuch & Erfolgsjournal'],
    intro: 'Jedes Familienmitglied hat ein eigenes Profil mit passenden Rechten, vom Elternteil bis zur Oma mit Lesezugriff. Dazu kommen der Stammbaum, das Kontaktbuch, Firmen, das Familientagebuch und das Erfolgsjournal.',
    highlights: [
      { title: 'Rollen & Rechte', text: 'Eltern, Kinder, Großeltern: Jeder sieht, was er sehen soll. Private Bereiche bleiben privat.' },
      { title: 'Kontaktbuch', text: 'Adressen, Telefonnummern und Geburtstage – dazu Firmen wie Hausarzt, Handwerker oder Vermieter.' },
      { title: 'Stammbaum', text: 'Wer ist mit wem verwandt? Der Stammbaum zeigt die ganze Familie über Generationen.' },
      { title: 'Tagebuch & Erfolge', text: 'Schöne Momente festhalten und Erfolge feiern, vom Seepferdchen bis zum Halbmarathon.' },
    ],
  },
  {
    slug: 'vertraege',
    claim: 'Nie wieder eine Kündigungsfrist verpassen.',
    visual: { detail: 'vertraege-karten', tilt: 'left', callouts: [{ text: 'Kosten und Laufzeit auf einen Blick', x: 48, y: -8, icon: 'star' }, { text: 'Erinnert vor Fristende', x: -5, y: 96, icon: 'bell' }] }, icon: IC.fileSignature, gradient: 'from-amber-500 to-orange-600', status: 'available',
    title: 'Verträge', subtitle: 'Alle Verträge der Familie im Griff',
    features: ['Kosten, Laufzeiten & Kündigungsfristen', 'Erinnerung vor Fristende', 'Kündigungsschreiben mit berechnetem Termin', 'Dokumente zum Vertrag & CSV-Export'],
    intro: 'Miete, Strom, Handy, Versicherungen, Streaming-Abos: Alle Verträge stehen mit Kosten, Laufzeit und Ansprechpartner an einem Ort. LunaFamily rechnet die Kündigungsfrist aus und erinnert, bevor sich ein Vertrag still verlängert.',
    highlights: [
      { title: 'Was kostet uns das?', text: 'Monatliche und jährliche Kosten aller Verträge auf einen Blick – ideal, um Sparpotenzial zu finden.' },
      { title: 'Rechtzeitig erinnert', text: 'Wie viele Tage vor Fristende ihr erinnert werdet, legt ihr selbst fest. Automatische Verlängerungen sind berücksichtigt.' },
      { title: 'Kündigen in Minuten', text: 'Kündigung, Adressänderung nach dem Umzug oder Vertragsübernahme: Das Schreiben entsteht mit dem richtigen Termin, samt Unterschrift.' },
      { title: 'Alles beisammen', text: 'Vertragsunterlagen hängen direkt am Vertrag. Per CSV lassen sich Verträge importieren und exportieren.' },
    ],
  },
  // ─── Teilweise verfügbar ──────────────────────────────────────────────────
  {
    slug: 'kommunikation',
    claim: 'Alles Wichtige, ohne Chat-Chaos.', icon: IC.mail, gradient: 'from-sky-500 to-blue-500', status: 'partial',
    title: 'Kommunikation', subtitle: 'Immer verbunden, egal wo',
    features: ['Familien-Messenger mit Sprachnachrichten', 'Integrierter E-Mail-Client', 'Ankündigungen & Umfragen', 'Anrufliste & Briefe'],
    intro: 'Nachrichten an die Familie, wichtige Ankündigungen und das Postfach für die Familien-E-Mails. Aus einer E-Mail wird mit einem Klick eine Aufgabe oder eine Wiedervorlage. Einige Funktionen sind bereits nutzbar, weitere folgen schrittweise.',
    highlights: [
      { title: 'Familien-Messenger', text: 'Schnelle Absprachen ohne fremden Messenger – mit Erwähnungen, Sprachnachrichten und geplanten Nachrichten. Die Daten bleiben bei euch.' },
      { title: 'E-Mail-Client', text: 'Familienpostfächer direkt in LunaFamily lesen und beantworten, Anhänge gleich bei den Dokumenten ablegen.' },
      { title: 'Ankündigungen & Umfragen', text: 'Wichtiges für alle mit Lesebestätigung – und schnelle Umfragen, wenn die Familie entscheiden soll.' },
      { title: 'Aus E-Mail wird Aufgabe', text: 'Rechnung per Mail? Direkt als Wiedervorlage mit Frist anlegen.' },
    ],
  },
  {
    slug: 'ki',
    claim: 'Die Kleinarbeit erledigt sich von selbst.', icon: IC.sparkles, gradient: 'from-pink-500 to-rose-500', status: 'partial',
    title: 'KI-Assistent', subtitle: 'Intelligente Unterstützung im Alltag',
    features: ['Freie Anbieterwahl – auch lokal', 'Dokumente automatisch einordnen', 'E-Mails formulieren lassen', 'Datenfreigabe je Kategorie'],
    intro: 'Künstliche Intelligenz nimmt euch die Kleinarbeit ab: Dokumente einordnen, E-Mails formulieren, Fragen im Assistenten-Chat beantworten. Welcher KI-Anbieter zum Einsatz kommt und welche Daten er sehen darf, entscheidet ihr. Weitere Funktionen folgen schrittweise.',
    highlights: [
      { title: 'Freie Anbieterwahl', text: 'OpenAI, Anthropic, Google, Mistral und weitere – oder ein selbst betriebenes Modell über Ollama.' },
      { title: 'Ihr behaltet die Kontrolle', text: 'Welche Daten die KI sehen darf, legt ihr je Kategorie fest. Besonders schützenswerte Daten brauchen eine eigene Freigabe.' },
      { title: 'Automatisch einsortiert', text: 'Dokumente und E-Mails werden vorsortiert. Ihr bestätigt oder verwerft die Vorschläge im KI-Dashboard – per Wisch.' },
      { title: 'Schreibhilfe', text: 'E-Mails verbessern oder entwerfen lassen, samt Betreffvorschlag.' },
    ],
  },
  {
    slug: 'caldav',
    claim: 'Eure Termine und Kontakte auf jedem Gerät.', icon: IC.calendarSync, gradient: 'from-indigo-500 to-blue-500', status: 'partial',
    title: 'CalDAV & CardDAV', subtitle: 'Synchron mit Handy, PC und Co.',
    features: ['Kalender & Aufgaben auf Handy und PC', 'Adressbuch-Abgleich (CardDAV)', 'Google-Kalender & externe Server', 'Kalender-Abo, Import & Export (ICS)'],
    intro: 'LunaFamily spricht die offenen Standards CalDAV und CardDAV. Kalender, Aufgaben und Kontakte erscheinen so in den Apps, die ihr ohnehin nutzt – auf dem iPhone, unter Android, in Thunderbird oder Outlook. Einige Anbindungen sind bereits nutzbar, weitere folgen.',
    highlights: [
      { title: 'In euren Lieblings-Apps', text: 'Termine und Aufgaben landen per CalDAV direkt in der Kalender-App auf Handy und PC – mit eigenen App-Passwörtern.' },
      { title: 'Kontakte überall', text: 'Das Adressbuch gleicht sich per CardDAV ab. Für jeden Kontakt entscheidet ihr, ob er synchronisiert wird.' },
      { title: 'Bestehende Kalender verbinden', text: 'Google-Kalender und andere CalDAV-Server einbinden und regelmäßig abgleichen.' },
      { title: 'Abo, Import, Export', text: 'Kalender als Abo-Link teilen und ICS-Dateien mit Vorschau importieren oder exportieren.' },
    ],
  },
  // ─── Demnächst ────────────────────────────────────────────────────────────
  {
    slug: 'kueche',
    claim: 'Sonntag planen, die ganze Woche entspannt essen.',
    visual: { detail: 'essensplan-woche', phone: 'phone-essensplan', tilt: 'left', callouts: [{ text: 'Frühstück bis Abendessen geplant', x: -6, y: -6, icon: 'check' }, { text: 'Auch unterwegs griffbereit', x: 44, y: 104, icon: 'heart' }] }, icon: IC.utensils, gradient: 'from-rose-500 to-pink-500', status: 'soon',
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
    slug: 'mobile',
    claim: 'Immer dabei – auch ohne Netz.', icon: IC.smartphone, gradient: 'from-slate-500 to-gray-600', status: 'soon',
    title: 'Mobile App', subtitle: 'Immer dabei, auch ohne Internet',
    features: ['iOS & Android App', 'Offline-First Architektur', 'Automatische Synchronisation', 'Biometrische Absicherung'],
    intro: 'Einkaufsliste im Funkloch, Kalender im Flugzeug: Die mobile App funktioniert auch ohne Verbindung und gleicht Änderungen automatisch ab, sobald wieder Netz da ist.',
    highlights: [
      { title: 'Offline zuerst', text: 'Alle wichtigen Daten liegen verschlüsselt auf dem Gerät.' },
      { title: 'Automatischer Abgleich', text: 'Änderungen werden im Hintergrund synchronisiert.' },
      { title: 'Biometrisch geschützt', text: 'Entsperren per Fingerabdruck oder Gesichtserkennung.' },
    ],
  },
  // ─── In Planung ───────────────────────────────────────────────────────────
  {
    slug: 'haushalt',
    claim: 'Der Haushalt als Teamspiel.',
    visual: { detail: 'haushalt-karten', tilt: 'left', callouts: [{ text: '15 Punkte für geputzte Fenster', x: 74, y: 22, icon: 'star' }, { text: 'Wiederkehrend – plant sich selbst', x: -38, y: 70, icon: 'check' }] }, icon: IC.home, gradient: 'from-teal-500 to-green-500', status: 'planned',
    title: 'Haushalt', subtitle: 'Der Haushalt läuft sich fast von selbst',
    features: ['Haushaltsaufgaben mit Punkten', 'Inventar verwalten', 'Bedienungsanleitungen', 'Haushaltsplaner'],
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
    visual: { detail: 'kasse-konten', tilt: 'right', callouts: [{ text: 'Monatsvergleich automatisch', x: 64, y: -9, icon: 'star' }, { text: 'Taschengeld inklusive', x: -5, y: 96, icon: 'heart' }] }, icon: IC.wallet, gradient: 'from-yellow-500 to-orange-500', status: 'planned',
    title: 'Finanzen', subtitle: 'Volle Kontrolle über das Familienbudget',
    features: ['Bargeld & Haushaltskasse', 'Ausgaben & Budgets', 'Kredite in der Familie', 'Open Banking'],
    intro: 'Wohin fließt das Geld? Haushaltskasse, Portemonnaie und Sparschwein sind erfasst, Verträge und Kredite laufen in einer Übersicht je Familienmitglied zusammen.',
    highlights: [
      { title: 'Bargeld & Kassen', text: 'Portemonnaie, Haushaltskasse, Taschengeld: jede Ausgabe mit Kategorie.' },
      { title: 'Übersicht je Person', text: 'Einnahmen, Ausgaben, Verträge und Kredite für jedes Familienmitglied auf einen Blick.' },
      { title: 'Kredite in der Familie', text: 'Das Darlehen an die Tochter für das Fahrrad, mit Tilgungsplan statt Zettel am Kühlschrank.' },
      { title: 'Open Banking', text: 'Kontoumsätze sicher abrufen und automatisch kategorisieren.' },
    ],
  },
  {
    slug: 'schule',
    claim: 'Hausaufgaben, Noten, Termine – gemeinsam im Blick.', icon: IC.graduationCap, gradient: 'from-indigo-500 to-violet-500', status: 'planned',
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
    slug: 'statistiken',
    claim: 'Ein Blick am Morgen, und der Tag ist klar.',
    visual: { detail: 'dashboard-termine', phone: 'phone-dashboard', tilt: 'left', callouts: [{ text: 'Die nächsten Termine aller', x: -6, y: -6, icon: 'users' }] }, icon: IC.barChart, gradient: 'from-cyan-500 to-teal-500', status: 'planned',
    title: 'Statistiken & Insights', subtitle: 'Daten, die wirklich helfen',
    features: ['Familien-Dashboard', 'Aktivitätsberichte', 'Ausgaben-Trends', 'Produktivitäts-Insights'],
    intro: 'Das Dashboard zeigt morgens, was heute ansteht. Die Statistiken zeigen, wie sich Ausgaben entwickeln, wer im Haushalt am fleißigsten war und welche Aufgaben liegen bleiben.',
    highlights: [
      { title: 'Familien-Dashboard', text: 'Termine, offene Aufgaben und Neuigkeiten auf einen Blick.' },
      { title: 'Ausgaben-Trends', text: 'Monatsvergleiche nach Kategorie, damit ihr seht, wo sich Sparen lohnt.' },
      { title: 'Aktivität', text: 'Wer hat diese Woche welche Aufgaben erledigt?' },
    ],
  },
  {
    slug: 'kfz',
    claim: 'TÜV, Service und Kosten jedes Autos im Blick.', icon: IC.car, gradient: 'from-zinc-500 to-slate-600', status: 'planned',
    title: 'Kfz-Verwaltung', subtitle: 'Alle Fahrzeuge der Familie',
    features: ['Fahrzeuge der Familie', 'TÜV- & Service-Termine', 'Tank- & Werkstattkosten', 'Versicherung & Kfz-Steuer'],
    intro: 'Familienauto, Zweitwagen, Roller: Jedes Fahrzeug bekommt ein eigenes Profil mit Hauptuntersuchung, Inspektion, Reifenwechsel und allen Kosten.',
    highlights: [
      { title: 'Termine im Griff', text: 'Hauptuntersuchung, Inspektion und Reifenwechsel rechtzeitig im Familienkalender.' },
      { title: 'Was kostet das Auto?', text: 'Tanken, Werkstatt, Versicherung und Steuer zusammengerechnet.' },
      { title: 'Unterlagen dabei', text: 'Fahrzeugschein, Versicherungspolice und Rechnungen direkt am Fahrzeug.' },
    ],
  },
  {
    slug: 'haustiere',
    claim: 'Gut versorgt – vom Impfpass bis zum Tierarzttermin.', icon: IC.pawPrint, gradient: 'from-amber-500 to-yellow-500', status: 'planned',
    title: 'Haustiere', subtitle: 'Auch die Vierbeiner gehören zur Familie',
    features: ['Tierprofile mit Chipnummer', 'Impfungen & Tierarzttermine', 'Medikamente & Parasitenschutz', 'Gewichtsverlauf & Erinnerungen'],
    intro: 'Hund, Katze, Kaninchen: Jedes Tier bekommt ein Profil mit Rasse, Chipnummer und Versicherung. Impfungen, Wurmkuren und Tierarzttermine vergisst niemand mehr.',
    highlights: [
      { title: 'Impfpass digital', text: 'Alle Impfungen mit Datum und nächster Auffrischung.' },
      { title: 'Tierarzt & Medikamente', text: 'Termine, Medikamente sowie Floh-, Zecken- und Wurmschutz an einem Ort.' },
      { title: 'Automatisch erinnert', text: 'Die nächste Auffrischung oder Wurmkur meldet sich von selbst.' },
    ],
  },
  {
    slug: 'events',
    claim: 'Vom Kindergeburtstag bis zur Hochzeit – entspannt geplant.',
    visual: { detail: 'kalender-eventkarten', tilt: 'right', callouts: [{ text: 'Gäste, Budget und To-dos an einem Ort', x: 30, y: -8, icon: 'users' }] }, icon: IC.partyPopper, gradient: 'from-fuchsia-500 to-pink-500', status: 'planned',
    title: 'Events', subtitle: 'Feste feiern statt Listen jonglieren',
    features: ['Gästeliste mit Zu- und Absagen', 'Budget & Ausgaben', 'Checklisten & To-dos', 'Geschenkideen'],
    intro: 'Kindergeburtstag, Einschulung, Sommerfest: Gästeliste, Budget, To-dos und Geschenkideen stehen für jedes Event an einem Ort.',
    highlights: [
      { title: 'Gästeliste', text: 'Wer kommt, wer sagt ab? Zu- und Absagen auf einen Blick, auch für große Runden.' },
      { title: 'Budget', text: 'Alle Ausgaben des Events mit Zusammenfassung – keine bösen Überraschungen.' },
      { title: 'Geschenkideen', text: 'Ideen sammeln und abhaken, was schon gekauft ist.' },
    ],
  },
];

/** Alle Bereiche, sortiert nach Status (verfügbar zuerst). */
export const CATEGORIES: Category[] = STATUS_ORDER.flatMap((s) => ALL.filter((c) => c.status === s));

/** Nur die freigeschalteten Bereiche — sie haben Unterseite, Bilder und Link. */
export const PUBLISHED: Category[] = CATEGORIES.filter(isPublished);

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

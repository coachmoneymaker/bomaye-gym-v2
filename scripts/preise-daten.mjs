/* ═══════════════════════════════════════════════════════════════════════════
   ALLE PREISE DER SEITE /preise, AN EINER STELLE
   ═══════════════════════════════════════════════════════════════════════════

   WOFUER
   Dieselben Preise standen bisher an bis zu vier Stellen im Repo, mit bis zu
   drei verschiedenen Zahlen fuer dasselbe Produkt (siehe PR #166 und #167).
   /preise schreibt keine Zahl von Hand: scripts/preise-bauen.mjs rendert die
   Karten, die Tabellen und das Schema aus dieser Datei zwischen die Marken
   <!-- PREISE:* --> in preise.html.

   AENDERN
     1. Zahl hier aendern
     2. node scripts/preise-bauen.mjs
     3. node scripts/preise-pruefen.mjs   (vergleicht Seite gegen diese Datei)

   WAS HIER NICHT HINEINGEHOERT
   Keine erfundene Zahl. Jeder Wert steht entweder schon sichtbar im Repo
   oder wurde vom Betreiber ausdruecklich bestaetigt; wo etwas fehlt, steht
   ein TODO-OWNER und NICHT eine geschaetzte Zahl.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Formatierung ────────────────────────────────────────────────────────
   Deutsche Schreibweise mit Komma, Tausenderpunkt und geschuetztem
   Leerzeichen vor dem Euro. Der Betrag soll nie am Zeilenende umbrechen. */
const NB = ' ';
export function euro(n) {
  const s = Number(n).toLocaleString('de-DE',
    { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
  return s + NB + '€';
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. MITGLIEDSCHAFTEN
   ═══════════════════════════════════════════════════════════════════════════

   WOCHENPREISE stehen seit jeher sichtbar auf /mitglied-werden und auf der
   Startseite. Sie sind die Grundlage: die AGB (§ 4 Abs. 1) sagt, der
   Mitgliedsbeitrag wird WOECHENTLICH berechnet und monatlich im Voraus
   entrichtet.

   TODO-OWNER, UND ZWAR EIN WICHTIGER: DIE MONATSBETRAEGE UNTEN PASSEN
   NICHT ZUR AGB.
   Die Monatsbetraege hat der Betreiber am 01.11.2026 so vorgegeben. Sie
   sind das VIERFACHE des Wochenpreises:
       18,90 x 4 = 75,60      15,90 x 4 = 63,60      14,90 x 4 = 59,60
   § 4 Abs. 1 der AGB rechnet aber mit dem FAKTOR 4,33:
       18,90 x 4,33 = 81,84   15,90 x 4,33 = 68,85   14,90 x 4,33 = 64,52
   Das sind 6 bis 7 Euro Unterschied im Monat. Steht auf der Seite ein
   Monatsbetrag, der niedriger ist als der, der abgebucht wird, ist das eine
   irrefuehrende Preisangabe.

   BIS DAS GEKLAERT IST, macht die Seite zweierlei:
     - sie nennt den Wochenpreis gleichwertig neben dem Monatsbetrag, denn
       der Wochenpreis ist der Wert, der in der AGB und in bsport steht
     - sie nennt KEINEN Rechenfaktor, weil jeder genannte Faktor einer der
       beiden Angaben widersprechen wuerde
   Zu klaeren ist: gilt 4 oder 4,33? Danach gehoert entweder diese Datei
   oder § 4 Abs. 1 der AGB angepasst.

   ZWEITER TODO-OWNER, DERSELBE RECHTLICHE PUNKT: DER WOCHENPREIS HAENGT
   AN DER LAUFZEIT.
   assets/js/pricing.js fuehrt je Paket VIER Early-Bird-Wochenpreise, einen
   je Laufzeit. Fuer Kids zum Beispiel:
       1 Monat 19,90   3 Monate 17,90   6 Monate 15,90   12 Monate 14,90
   Sichtbar ist auf /mitglied-werden und auf der Startseite seit jeher nur
   die 12-Monats-Spalte, also 14,90. Diese Seite zeigt dieselbe Zahl, damit
   beide Seiten nicht auseinanderlaufen.

   Daneben steht hier aber "Laufzeit nach Wahl: 1, 3, 6 oder 12 Monate"
   (AGB § 3 Abs. 2). Zusammengelesen heisst das: 14,90 bei jeder Laufzeit.
   Nach pricing.js stimmt das nicht.

   HIER IST BEWUSST NICHTS ERFUNDEN WORDEN. Weder ist ein Zusatz wie "bei
   12 Monaten Laufzeit" ergaenzt (er stuende dann nur auf dieser einen
   Seite und widerspraeche der Darstellung auf /mitglied-werden), noch ist
   die Laufzeitzeile weggelassen (sie steht so in der AGB). Zu klaeren
   ist: gilt der Early-Bird-Preis unabhaengig von der Laufzeit, oder
   gehoert die Staffel auf beide Seiten? Danach gehoert entweder diese
   Datei oder /mitglied-werden angepasst.
   ═══════════════════════════════════════════════════════════════════════ */

export const AUFNAHME = 100;          /* AGB § 3 Abs. 3, einmalig, inkl. MwSt. */

export const MITGLIEDSCHAFTEN = [
  {
    id:        'erwachsene',
    name:      'Unlimited',
    gruppe:    'Erwachsene',
    alter:     'ab 18 Jahren',
    monat:     75.60,
    woche:     18.90,
    regulaer:  22.90,          /* sichtbar auf /mitglied-werden als "Regulär" */
    contract:  '45433',        /* data-abo-contract, wie auf /mitglied-werden */
    leistungen: [
      'Unbegrenzter Zugang zu allen Kursen',
      'Olympic Boxing, Kickboxing, Frauenkurs und mehr',
      'Training mit Struktur und echten Coaches',
    ],
  },
  {
    id:        'youth',
    name:      'Youth',
    gruppe:    'Jugendliche',
    alter:     '10 bis 17 Jahre',
    monat:     63.60,
    woche:     15.90,
    regulaer:  18.90,
    contract:  '45434',
    leistungen: [
      'Kursplan für Jugendliche',
      'Echte Technik, echter Sport',
      'Eigene Gruppen, keine gemischten Erwachsenenkurse',
    ],
  },
  {
    id:        'kids',
    name:      'Kids',
    gruppe:    'Kinder',
    alter:     '6 bis 9 Jahre',
    monat:     59.60,
    woche:     14.90,
    regulaer:  17.90,
    contract:  '45432',
    leistungen: [
      'Kursplan speziell für Kinder',
      'Kleingruppen für individuelle Förderung',
      'Sicheres, geführtes Boxen lernen',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2. PERSONAL TRAINING
   ═══════════════════════════════════════════════════════════════════════════
   Stand 01.11.2026, gleichlautend mit der sichtbaren Preistabelle auf
   /personal-training-boxen-muenchen und mit assets/js/pricing.js.

   TODO-OWNER: In bsport steht fuer die Zehnerkarte der Nichtmitglieder noch
   1.090 €. Der Betreiber zieht das dort nach. Bis dahin weicht der Preis im
   Buchungsfenster von dem auf dieser Seite ab.                            */
export const PT = {
  nicht: {
    label: 'Nichtmitglieder',
    zeilen: [
      { id: 'einzel', name: 'Einzelsession', preis: 125,  einheiten: 1,  proEinheit: 125 },
      { id: 'fuenf',  name: '5er Karte',     preis: 575,  einheiten: 5,  proEinheit: 115 },
      { id: 'zehn',   name: '10er Karte',    preis: 1050, einheiten: 10, proEinheit: 105 },
    ],
  },
  mitglied: {
    label: 'Mitglieder',
    zeilen: [
      { id: 'einzel', name: 'Einzelsession', preis: 90,  einheiten: 1,  proEinheit: 90 },
      { id: 'fuenf',  name: '5er Karte',     preis: 425, einheiten: 5,  proEinheit: 85 },
      { id: 'zehn',   name: '10er Karte',    preis: 800, einheiten: 10, proEinheit: 80 },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. WEITERE OPTIONEN
   ═══════════════════════════════════════════════════════════════════════════
   WELCHES PRODUKT IST WELCHES. Die drei heissen in bsport anders als im
   Alltag, und zwei von ihnen kosten fast dasselbe. Deshalb hier einmal
   sauber auseinandergehalten:

     "Bomaye Day Pass"   20 €   ein Tag, alle Kurse dieses Tages
     "Open Gym Pass"     18 €   ein Credit fuer freies Training, kein Kurs
     "Bomaye 10er Pass" 150 €   zehn Gruppenkurse, freie Kurswahl

   Der Day Pass stand im Repo mit zwei falschen Zahlen: 18 € im FAQ und
   15 € in der Preistabelle der Startseite. Der Betreiber hat am 01.11.2026
   20 € bestaetigt; beide Stellen sind nachgezogen.

   TODO-OWNER: Fuer diese drei gibt es keinen bekannten Kauf-Link in bsport.
   Die Knoepfe fuehren deshalb in den Stundenplan, wo der Kalender steht.
   Sobald es je Produkt eine Kaufadresse gibt, gehoert sie in das Feld
   "ziel" und der Knopftext auf "Kaufen".                                  */
export const WEITERE = [
  { id: 'daypass', name: 'Tageskarte',             bsport: 'Bomaye Day Pass',
    preis: 20,  dazu: 'Ein Tag, alle Kurse dieses Tages.',
    ziel: '/stundenplan', knopf: 'Zum Stundenplan' },
  { id: 'opengym', name: 'Open Gym',               bsport: 'Open Gym Pass',
    preis: 18,  dazu: 'Ein Credit für freies Training.',
    ziel: '/stundenplan', knopf: 'Zum Stundenplan' },
  { id: 'zehner', name: '10er Karte Gruppenkurse', bsport: 'Bomaye 10er Pass',
    preis: 150, dazu: 'Zehn Kurse, freie Kurswahl.',
    ziel: '/stundenplan', knopf: 'Zum Stundenplan' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   4. VERTRAGSBEDINGUNGEN, WOERTLICH AUS DER AGB
   ═══════════════════════════════════════════════════════════════════════════
   Keine Zusammenfassung aus dem Kopf, sondern die Punkte, die § 3, § 4 und
   § 6 der AGB nennen. Wer die AGB aendert, aendert diese Zeilen mit.       */
export const BEDINGUNGEN = [
  'Abrechnung monatlich im Voraus per SEPA-Lastschrift.',
  'Laufzeit nach Wahl: 1, 3, 6 oder 12 Monate.',
  'Danach läuft der Vertrag monatlich weiter, Kündigung mit einem Monat Frist zum Laufzeitende.',
  `Einmalig ${euro(AUFNAHME)} Aufnahmegebühr bei Vertragsabschluss, inklusive Fighter-Kit.`,
  'Early Bird gilt für die gesamte Vertragslaufzeit.',
];

/* ═══════════════════════════════════════════════════════════════════════════
   5. DIE FUENF FRAGEN
   ═══════════════════════════════════════════════════════════════════════════
   Jede Antwort steht so oder sinngleich schon im Repo. In Klammern, wo.
   Nichts hinzuerfunden, keine Zahl, die nicht aus der AGB oder aus
   MITGLIEDSCHAFTEN oben kommt.                                            */
export const FRAGEN = [
  {
    f: 'Wie wird der Beitrag abgerechnet?',
    /* AGB § 4 Abs. 1 und Abs. 2 */
    a: 'Der Mitgliedsbeitrag wird wöchentlich berechnet und ist monatlich im Voraus zu '
     + 'entrichten. Die Zahlung läuft per SEPA-Lastschrift.',
  },
  {
    f: 'Kommt zum Beitrag noch etwas dazu?',
    /* AGB § 3 Abs. 3, Fighter-Kit von /mitglied-werden */
    a: `Einmalig ${euro(AUFNAHME)} Aufnahmegebühr bei Vertragsabschluss, inklusive `
     + 'Fighter-Kit. Sie ist nicht erstattungsfähig.',
  },
  {
    f: 'Wie lange läuft der Vertrag und wie kündige ich?',
    /* AGB § 3 Abs. 2 und § 6 Abs. 1 */
    a: 'Du wählst 1, 3, 6 oder 12 Monate. Danach verlängert sich der Vertrag jeweils um '
     + 'einen Monat, wenn du nicht mit einer Frist von einem Monat zum Laufzeitende '
     + 'kündigst. Die Kündigung geht schriftlich per E-Mail oder Brief.',
  },
  {
    f: 'Wie lange gilt der Early-Bird-Preis?',
    /* AGB § 5 Abs. 2 */
    a: 'Für die gesamte Vertragslaufzeit, sofern die Mitgliedschaft nicht unterbrochen '
     + 'wird. Zu haben ist er nur solange Plätze frei sind.',
  },
  {
    f: 'Kann ich vorher kostenlos testen?',
    /* steht so auf /probetraining und im FAQ */
    a: 'Ja. Das erste Training ist kostenlos und unverbindlich. Du wählst online einen '
     + 'Termin, meldest dich kurz an und kommst vorbei.',
    verweis: { text: 'Zur Buchung: Probetraining', ziel: '/probetraining' },
  },
];

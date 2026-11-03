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
   Startseite. Sie sind die Grundlage: § 3 Abs. 1 der AGB sagt, der
   Mitgliedsbeitrag wird WOECHENTLICH berechnet und monatlich im Voraus
   entrichtet.

   MONATSBETRAG: DAS IST DER BETRAG, DER ABGEBUCHT WIRD.
   Vom Betreiber am 01.11.2026 bestaetigt: in bsport stehen je Paket
   75,60 / 63,60 / 59,60 € im Monat, also der Wochenpreis mal vier. Das
   ist der Betrag, den das Mitglied tatsaechlich zahlt, und deshalb steht
   er auf der Seite gross.

   AUF DER SEITE STEHT KEIN RECHENFAKTOR, und das ist Absicht. § 3 Abs. 1
   der AGB nennt den Faktor 4,33; der Betreiber hat die Formulierung
   rechtlich pruefen lassen, sie bleibt unveraendert. Ein zweiter Faktor
   auf der Preisseite wuerde dem nur widersprechen. Die Seite nennt
   deshalb Monatsbetrag und Wochenpreis, beide als Zahl, und rechnet
   nichts vor. Die AGB wird von hier aus nicht angefasst.

   LAUFZEIT: ES GIBT NUR ZWOELF MONATE.
   Verkauft werden ausschliesslich die drei Vertraege mit 12 Rechnungen
   und automatischer Verlaengerung. Die Early-Bird-Preise oben gelten fuer
   genau diese Laufzeit. § 2 Abs. 2 der AGB zaehlt zwar vier moegliche
   Laufzeiten auf (1, 3, 6, 12 Monate), im Verkauf steht aber nur die
   zwoelfmonatige; die Seite nennt deshalb keine andere. Belegt ist das
   auch im Repo: das Angebots-Schema auf /mitglied-werden traegt je Paket
   "Mindestlaufzeit 12 Monate" und eligibleQuantity 12 MON, und
   /boxtraining-muenchen schreibt "bei 12-monatiger Laufzeit".

   Der Vertrag "Bomaye Fighter" (50 €) wird nicht verkauft und kommt auf
   dieser Seite nicht vor.

   AUCH DIE PARAGRAPHEN STIMMEN JETZT. Hier stand vorher "§ 4 Abs. 1" fuer
   die Beitragsregel und "§ 3 Abs. 3" fuer die Aufnahmegebuehr. In agb.html
   sind es § 3 Abs. 1 (Beitrag, Faktor 4,33), § 2 Abs. 3 (Aufnahmegebuehr),
   § 2 Abs. 2 (Laufzeit und Verlaengerung), § 4 Abs. 2 (Early Bird) und
   § 6 Abs. 1 (Kuendigung).
   ═══════════════════════════════════════════════════════════════════════ */

export const AUFNAHME = 100;          /* AGB § 2 Abs. 3, einmalig, inkl. MwSt. */

/* Woertlich aus § 2 Abs. 2 und § 6 Abs. 1 der AGB, nur in die du-Form
   gebracht. Nichts dazuerfunden, nichts weggelassen ausser den drei
   Laufzeiten, die nicht verkauft werden. */
export const LAUFZEIT = {
  kurz:        'bei 12 Monaten Laufzeit',
  rechnungen:  '12 monatliche Rechnungen.',
  verlaengerung:
    'Danach verlängert sich der Vertrag automatisch um jeweils einen Monat, '
    + 'sofern du nicht mit einer Frist von einem Monat zum Laufzeitende kündigst.',
  kuendigung:
    'Die Kündigung geht schriftlich per E-Mail oder Brief.',
};

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

   Die Zehnerkarte der Nichtmitglieder lief viermal: 950 € im alten
   pricing.js, 1.090 € auf der PT-Seite, dann 1.150 €, dann 1.050 €.
   Am 01.11.2026 hat der Betreiber zurueck auf 1.090 € entschieden, also
   109 € je Einheit, weil bsport auf 1.090 € stehen bleibt. Damit stimmen
   Buchungsfenster und Seite wieder ueberein. Die Mitgliederzehnerkarte
   bleibt bei 800 €.                                                      */
export const PT = {
  nicht: {
    label: 'Nichtmitglieder',
    zeilen: [
      { id: 'einzel', name: 'Einzelsession', preis: 125,  einheiten: 1,  proEinheit: 125 },
      { id: 'fuenf',  name: '5er Karte',     preis: 575,  einheiten: 5,  proEinheit: 115 },
      { id: 'zehn',   name: '10er Karte',    preis: 1090, einheiten: 10, proEinheit: 109 },
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
  `Laufzeit 12 Monate, ${LAUFZEIT.rechnungen.replace(/\.$/, '')}.`,
  LAUFZEIT.verlaengerung,
  LAUFZEIT.kuendigung,
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
    /* AGB § 2 Abs. 2 und § 6 Abs. 1. Die drei kuerzeren Laufzeiten, die
       § 2 Abs. 2 ebenfalls nennt, stehen hier nicht: verkauft wird nur
       der Zwoelfmonatsvertrag. */
    a: `Die Laufzeit beträgt 12 Monate, abgerechnet in 12 monatlichen Rechnungen. `
     + `${LAUFZEIT.verlaengerung} ${LAUFZEIT.kuendigung}`,
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

/* ═══════════════════════════════════════════════════════════════════════════
   5. BOMAYE FLEX, MONATLICH KUENDBAR
   ═══════════════════════════════════════════════════════════════════════════
   Zweiter Weg neben Early Bird, bewusst NACHRANGIG. Early Bird bleibt der
   Hauptweg: drei schwarze Karten mit goldenem Knopf. Flex steht darunter,
   kleiner, mit Umrissknopf.

   DER SCHALTER
   FLEX_AKTIV steuert, ob irgendetwas davon gerendert wird. Steht er auf
   false, schreibt preise-bauen.mjs an allen Flex-Stellen nichts, und
   preise.html wie index.html sind byte-gleich mit dem Stand ohne Flex. Der
   Betreiber schaltet ihn um, nicht das Bauskript.

   DIE ERSPARNIS WIRD GERECHNET, NIE GETIPPT
   ersparnis() nimmt den Monatsbetrag von Flex minus den von Early Bird mal
   zwoelf. Damit kann die Zahl nicht veralten, wenn ein Preis sich aendert.
   Gerundet wird auf Cent, weil 129 - 75.60 in Gleitkomma 53.400000000000006
   ergibt und daraus 640.8000000000001 wuerde.

   DIE DREI KAUFADRESSEN
   Vom Betreiber geliefert, Vertragskennungen 59649, 59651 und 59650. Sie
   stehen hier wortgleich und werden von preise-pruefen.mjs gegen die
   gerenderte Seite geprueft. Nicht raten, nicht ableiten: die Kennungen der
   Early-Bird-Vertraege (45432 bis 45434) haben mit diesen nichts zu tun.  */
export const FLEX_AKTIV = true;

/* ZIEL IST DIE EIGENE SEITE, NICHT DAS BACKOFFICE
   Bis PR #178 stand hier je eine Adresse auf backoffice.bsport.io. Das war
   richtig, solange die drei Flex-Vertraege im Widget auf "fuer Kunden
   unsichtbar" standen - sichtbar waren sie nur ueber ihre eigene
   Kassenseite. Der Eigentuemer hat den Schalter im Backoffice umgelegt,
   seitdem stehen sie im Widget neben Early Bird.

   Damit gilt wieder die Regel, mit der die ganze Abo-Buchung angefangen
   hat: die Adresszeile verlaesst bomayegym.com nie. Der Klick oeffnet das
   Overlay, genau wie bei Early Bird. Das href ist nur noch der Weg ohne
   JavaScript und zeigt auf den Flex-Block dieser Seite. */
export const FLEX_ZIEL = '/preise#flex';
export const FLEX_ZIEL_ABS = 'https://www.bomayegym.com/preise#flex';

export const FLEX = [
  { id: 'unlimited-flex', name: 'Unlimited Flex', bezug: 'erwachsene', monat: 129,
    contract: '59649' },
  { id: 'youth-flex',     name: 'Youth Flex',     bezug: 'youth',      monat: 109,
    contract: '59651' },
  { id: 'kids-flex',      name: 'Kids Flex',      bezug: 'kids',       monat: 99,
    contract: '59650' },
];

/* Was Early Bird gegenueber Flex im Jahr spart. Immer gerechnet. */
export function ersparnis(f) {
  const eb = MITGLIEDSCHAFTEN.find((m) => m.id === f.bezug);
  if (!eb) throw new Error(`Flex "${f.id}" verweist auf kein Early-Bird-Paket: ${f.bezug}`);
  return Math.round((f.monat - eb.monat) * 12 * 100) / 100;
}

/* Die Flex-Bedingungen, Wort fuer Wort vom Betreiber. */
export const FLEX_BEDINGUNGEN = [
  'Keine Mindestlaufzeit.',
  'Der Vertrag verlängert sich jeweils um einen Monat.',
  'Kündbar jederzeit mit einer Frist von 14 Tagen zum Monatsende.',
  `Aufnahmegebühr ${euro(AUFNAHME)} einmalig, bei Kündigung nicht erstattbar.`,
  'Die Ausstattung bleibt dein Eigentum.',
];

/* Die FAQ-Antwort nennt alle drei Betraege aus den Daten oben. */
export const FLEX_FRAGE = {
  f: 'Gibt es auch eine Mitgliedschaft ohne Bindung?',
  get a() {
    const b = (id) => euro(FLEX.find((x) => x.id === id).monat);
    return `Ja, Bomaye Flex, monatlich kündbar, ab ${b('kids-flex')} im Monat (Kids), `
         + `${b('youth-flex')} (Youth), ${b('unlimited-flex')} (Unlimited), plus `
         + `${euro(AUFNAHME)} einmalig. Early Bird ist günstiger, solange Plätze frei sind.`;
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. GOOGLE-ADS-MIKROKONVERSION AUF DEN CHECKOUT-KLICK
   ═══════════════════════════════════════════════════════════════════════════
   Leer heisst AUS. Solange hier nichts steht, ruft plan-tracking.js kein
   gtag auf, und zwar gar nicht, nicht einmal einen leeren Aufruf.

   Eintragen ist die vollstaendige Kennung aus Google Ads, Form
   "AW-18136756611/XXXXXXXXXXXXXXXXXXX". Die Conversion-Action legt der
   Betreiber in Google Ads an; aus dem Repo laesst sie sich nicht ableiten.

   EINWILLIGUNG
   Wir rufen hier NIEMALS gtag("consent", ...) und setzen ad_storage nicht
   selbst. Die Vorgabe steht im Kopf jeder Seite auf denied, dazu
   ads_data_redaction true. Googles Tag entscheidet daraufhin selbst, ob es
   eine vollstaendige Konversion oder nur einen cookielosen Ping sendet.   */
export const ADS_CHECKOUT_SEND_TO = 'AW-18136756611/qeVXCKXiobAdEIPjo8hD';
/* Conversion-Action "Checkout gestartet", Konto 679-214-0688, Kategorie
   "Bezahlvorgang starten", SEKUNDAER und nicht in den Kontozielen. Damit
   zaehlt sie in Berichten mit, steuert aber kein Gebot. Eingetragen am
   01.11.2026 vom Betreiber geliefert, zeichenweise gegengeprueft:
   nach "qeVXCKX" folgt "iobA", und das I in "EIP" ist ein grosses I
   (U+0049), kein kleines L. */

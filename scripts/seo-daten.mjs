/* ═══════════════════════════════════════════════════════════════════════════
   EINE QUELLE FUER ALLE STRUKTURIERTEN DATEN UND DEN MARKENNAMEN
   ═══════════════════════════════════════════════════════════════════════════

   WOFUER
   Vorher stand derselbe LocalBusiness-Knoten in 20 HTML-Dateien, mit zwei
   verschiedenen Schreibweisen des Orts ("Munich" und "München") und mit
   Kennungen OHNE www, waehrend jede canonical-URL MIT www zeigt. Fuer
   Suchmaschinen sind das zwei verschiedene Dinge.

   Jetzt steht alles hier. scripts/seo-bauen.mjs schreibt daraus den
   gemeinsamen @graph in jede Seite, zwischen die Marken
   <!-- SEO:GRAPH --> und <!-- /SEO:GRAPH -->. Wer etwas aendert, aendert es
   hier und laesst das Skript laufen:

     node scripts/seo-bauen.mjs
     node scripts/seo-pruefen.mjs

   WAS HIER NICHT HINEINGEHOERT
   Keine Bewertungen (AggregateRating, Review), keine Mitgliederzahlen,
   keine Aussagen ueber einzelne Trainer, keine Preise, die nicht schon im
   Repo stehen. Erfundene Zahlen in strukturierten Daten sind ein Verstoss
   gegen Googles Richtlinien und koennen die Darstellung in der Suche
   kosten.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Der Markenname, an EINER Stelle ──────────────────────────────────────
   Steht so in Titeln, og:title und im Schema. Nicht in Grossbuchstaben:
   "BOMAYE GYM MUNICH" ist Gestaltung, kein Name, und Google zeigt Titel in
   Versalien oft gekuerzt an. Wer die Marke umbenennt, aendert diese eine
   Zeile und laesst scripts/seo-bauen.mjs laufen. */
export const MARKE = 'Bomaye Boxgym Munich';

/* Die eingetragene Firma, aus dem Impressum (HRB 310038, Amtsgericht
   Muenchen). Nicht der Markenname und nicht austauschbar. */
export const FIRMA = 'Bomaye Gym GmbH';

/* Alles mit www, genau wie jede canonical-URL und wie die sitemap. */
export const BASIS = 'https://www.bomayegym.com';
export const ORG_ID = BASIS + '/#organization';
export const GYM_ID = BASIS + '/#gym';

/* ── Adresse, Kontakt ────────────────────────────────────────────────────
   "Tiefhof Pineapple Park" ist der Zusatz, der auch im ersten Bildschirm
   der Startseite steht. addressLocality ist ueberall "München" - vorher
   stand im Gym-Knoten "Munich" und im Organization-Knoten "München". */
export const ADRESSE = {
  '@type': 'PostalAddress',
  streetAddress: 'Wilhelm-Hale-Straße 44, Tiefhof Pineapple Park',
  addressLocality: 'München',
  postalCode: '80639',
  addressCountry: 'DE',
};
export const TELEFON = '+491737513627';
export const EMAIL = 'support@bomayegym.com';

/* ── Oeffnungszeiten ─────────────────────────────────────────────────────
   TODO-OWNER: Die Zeiten unten stehen unveraendert so, wie sie im Repo
   standen, und sind NICHT gegen das Google-Unternehmensprofil geprueft.
   Weichen Schema und Profil voneinander ab, zeigt Google die Profilzeiten
   und wertet die Abweichung als Zeichen fuer veraltete Daten.

   Die Koordinaten sind seit dem 01.11.2026 geklaert, siehe GEO_BREITE und
   GEO_LAENGE am Ende dieser Datei. */
export const GEO = { '@type': 'GeoCoordinates',
  get latitude() { return GEO_BREITE; },
  get longitude() { return GEO_LAENGE; } };

export const OEFFNUNGSZEITEN = [
  { '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '13:00', closes: '22:00' },
  { '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Saturday'], opens: '10:00', closes: '14:00' },
];

/* Der Eintrag im Google-Unternehmensprofil. Dieselbe URL steht im
   Bewertungsblock der Startseite. */
export const KARTE = 'https://www.google.com/maps/place/?q=place_id:ChIJS-tzVKp3nkcRbCHhKzfqVQQ';

export const LOGO = BASIS + '/assets/images/bomaye-logo.webp';
export const BILD = BASIS + '/assets/images/gym-hall.webp';

/* ── sameAs ──────────────────────────────────────────────────────────────
   Die Profile, die zur Marke gehoeren. Google nutzt sie, um das
   Unternehmen den Profilen zuzuordnen.

   HIER STAND https://www.youtube.com/@bomayegym UND DAS WAR EIN 404. Der
   Betreiber hat am 01.11.2026 den richtigen Kanal geliefert:
   @BomayeGymMunich. Gross- und Kleinschreibung ist bei YouTube-Handles
   Teil der Adresse, also genau so uebernehmen.

   Dieselbe Liste steht sichtbar im Fuss jeder Seite. Wer hier etwas
   aendert, aendert auch die Icon-Reihe .footer-socials in den HTML-Dateien;
   das Skript schreibt nur den @graph, nicht den Fuss. */
export const SAME_AS = [
  'https://www.instagram.com/bomayegym_munich',
  'https://www.tiktok.com/@bomayegym_munich',
  'https://www.youtube.com/@BomayeGymMunich',
  'https://apps.apple.com/de/app/bomaye-gym-munich/id6784623484',
  'https://play.google.com/store/apps/details?id=com.bsport_799__5473',
];

export const BESCHREIBUNG =
  'Boxgym in München für Anfänger, Fitnesssportler und Wettkämpfer. '
  + 'Boxen, Kickboxen und Kurse für Kinder und Jugendliche.';

/* ── Der gemeinsame @graph ───────────────────────────────────────────────
   Zwei Knoten, zwei Kennungen, und alles andere im Repo zeigt per @id
   darauf statt den Knoten zu wiederholen:

     #organization  die Firma als Herausgeber (WebPage.publisher,
                    Person.worksFor)
     #gym           der Ort mit Adresse, Zeiten und Karte
                    (Course.provider, Service.provider)

   parentOrganization verbindet den Ort mit der Firma. */
export function graph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: MARKE,
        legalName: FIRMA,
        alternateName: ['Bomaye Gym Munich', 'Bomaye Boxgym München'],
        url: BASIS + '/',
        logo: LOGO,
        image: BILD,
        email: EMAIL,
        telephone: TELEFON,
        address: ADRESSE,
        sameAs: SAME_AS,
      },
      {
        '@type': ['LocalBusiness', 'SportsActivityLocation'],
        '@id': GYM_ID,
        name: MARKE,
        description: BESCHREIBUNG,
        url: BASIS + '/',
        logo: LOGO,
        image: BILD,
        email: EMAIL,
        telephone: TELEFON,
        address: ADRESSE,
        geo: GEO,
        hasMap: KARTE,
        openingHoursSpecification: OEFFNUNGSZEITEN,
        priceRange: '€€',
        parentOrganization: { '@id': ORG_ID },
        sameAs: SAME_AS,
      },
    ],
  };
}

/* ── Alte Kennungen, die ersetzt werden muessen ──────────────────────────
   Jede ohne www. Links die alte, rechts die neue. */
export const ALTE_IDS = [
  ['https://bomayegym.com/#gym', GYM_ID],
  ['https://bomayegym.com/#organization', ORG_ID],
  ['https://bomayegym.com/coaches#', BASIS + '/coaches#'],
];

/* ═══════════════════════════════════════════════════════════════════════════
   TITEL UND BESCHREIBUNGEN JE SEITE
   ═══════════════════════════════════════════════════════════════════════════

   titel    ohne Marke. seo-bauen.mjs haengt " | " + marke an.
   marke    nur wenn eine kuerzere Fassung gebraucht wird, weil die lange
            ueber 60 Zeichen hinausliefe.
   beschr   120 bis 155 Zeichen, deutsch, du-Form, und ausschliesslich mit
            Angaben, die schon im Repo stehen.

   WAS HIER BEWUSST NICHT STEHT
   Keine erfundene Zahl, kein Preis, der nicht auf der Seite steht, und keine
   Aussage ueber einen einzelnen Trainer. Zwei Beschreibungen tragen solche
   Aussagen noch (kickboxen-muenchen und personal-training-boxen-muenchen,
   beide mit Namen und Titel eines Trainers). Sie stammen nicht von hier,
   liegen in der Laenge und bleiben deshalb unangetastet - siehe TODO-OWNER
   in der PR-Beschreibung.
   ═══════════════════════════════════════════════════════════════════════════ */
export const SEITEN = {
  'index.html': {
    titel: 'Boxgym und Boxtraining München',
    beschr: 'Bomaye ist dein Boxgym in München für Anfänger, Fitnesssportler und Wettkämpfer. Boxtraining, Kickboxen und Personal Training im Pineapple Park.',
  },
  'about.html': {
    titel: 'Über uns: DNA, Philosophie und Story',
    beschr: 'Die Geschichte hinter dem Bomaye Boxgym in München. Unsere DNA, unsere Philosophie und das Warum hinter dem Gym im Pineapple Park.',
  },
  'coaches.html': {
    /* Der alte Titel nannte "Landestrainer & Weltmeister" und die alte
       Beschreibung zwei Trainer mit Namen und Titeln. Beides sind Aussagen
       ueber einzelne Personen; sie sind hier nicht nachpruefbar und fallen
       deshalb weg. Die Seite selbst stellt die Trainer weiter vor. */
    titel: 'Coaches und Trainer',
    beschr: 'Lerne das Trainerteam im Bomaye Boxgym München kennen. Wer dich im Boxen, Kickboxen und im Jugendtraining betreut und wie du uns erreichst.',
  },
  'kurse.html': {
    titel: 'Kurse: Boxen und Kickboxen München',
    beschr: 'Alle Kurse im Bomaye Boxgym München: Boxen, Kickboxen, Youth Boxing, olympisches Boxen und Mental Coaching. Für jedes Level, vom Anfang an.',
  },
  'stundenplan.html': {
    titel: 'Stundenplan Boxen und Kickboxen',
    beschr: 'Alle Kurse und Zeiten des Bomaye Boxgym München auf einen Blick: Boxen, Kickboxen, Youth, Sparring und Open Gym. Buche deinen Platz direkt online.',
  },
  'probetraining.html': {
    titel: 'Probetraining Boxen München: gratis testen',
    marke: 'Bomaye',
    /* TODO-OWNER: Die Beschreibung nennt nur, was heute auf der Seite steht -
       kostenlos, Termin online waehlen, unverbindlich. Zwei Angaben, die
       sich gut lesen wuerden, stehen dort NICHT belastbar und fehlen deshalb:
         1. an welchen Wochentagen ein Probetraining moeglich ist
            (pt-einstieg.js kennt eine Tabelle, die aber aus dem Stundenplan
            abgeleitet und nicht gegen bsport geprueft ist)
         2. dass Handschuhe gestellt werden - das steht so nur im FAQ
            ("beim ersten Training kostenlos leihen"), nicht auf dieser Seite
       Beides vor der Aufnahme bestaetigen. */
    beschr: 'Buche dein kostenloses Probetraining im Bomaye Boxgym München. Termin online wählen, kurz anmelden, loslegen. Unverbindlich und in wenigen Minuten.',
  },
  'faq.html': {
    titel: 'FAQ zum Boxtraining in München',
    beschr: 'Antworten auf die häufigsten Fragen zum Bomaye Boxgym München: Standort und Anfahrt, Buchung, Mitgliedschaft, Training, Ausstattung und Kontakt.',
  },
  'mitglied-werden.html': {
    titel: 'Mitglied werden',
    beschr: 'Sichere dir deinen Early-Bird-Preis im Bomaye Boxgym München, dauerhaft und unwiderruflich. Mitgliedschaften für Kids, Youth und Unlimited im Überblick.',
  },
  'boxgym-muenchen.html': {
    titel: 'Boxgym München',
    beschr: 'Bomaye ist dein Boxgym in München für Anfänger und Fortgeschrittene. Boxen, Kickboxen und Kurse für Kinder im Pineapple Park. Erstes Training kostenlos.',
  },
  'boxtraining-muenchen.html': {
    titel: 'Boxtraining München',
    beschr: 'Boxtraining in München für Anfänger und Fortgeschrittene. Technik, Beinarbeit und Kondition im Bomaye Boxgym. Dein erstes Training ist kostenlos.',
  },
  'boxen-lernen-muenchen.html': {
    titel: 'Boxen lernen München',
    beschr: 'Boxen lernen in München: Im Bomaye Boxgym startest du als Anfänger mit Technik und Beinarbeit. Erstes Training kostenlos, danach Early-Bird-Platz sichern.',
  },
  'fitnessboxen-muenchen.html': {
    titel: 'Fitnessboxen München',
    beschr: 'Fitnessboxen in München im Bomaye Boxgym: ein Box-Workout für Kraft, Ausdauer und Kondition, ohne Vorkenntnisse. Dein erstes Training ist kostenlos.',
  },
  'frauenboxen-muenchen.html': {
    titel: 'Frauenboxen München',
    beschr: 'Boxen für Frauen in München: Bomaye Queens ist unser reiner Frauenkurs für jedes Level. Erstes Training im Bomaye Boxgym kostenlos und unverbindlich.',
  },
  'kickboxen-muenchen.html': {
    titel: 'Kickboxen München',
    beschr: 'Kickboxen in München für Anfänger und Fortgeschrittene — Training mit Kickbox-Weltmeister Alfonso Fusco. Jetzt Early-Bird-Platz im Bomaye Gym sichern.',
  },
  'personal-training-boxen-muenchen.html': {
    titel: 'Personal Training Boxen München',
    beschr: 'Personal Training Boxen München: 1:1 Boxtraining mit Olympic Coach und Kickbox-Weltmeister. 60 Minuten 125 €, Mitglieder 90 €. Termin online buchen.',
  },
  'downloads.html': {
    titel: 'Downloads',
    beschr: 'Alle wichtigen Dokumente des Bomaye Boxgym München zum Download: Hausordnung, Einverständniserklärungen und Anmeldeformulare für Minderjährige.',
  },
  'u18.html': {
    titel: 'Eltern-Dokumente (U18)',
    beschr: 'Alle Dokumente für die Anmeldung von Minderjährigen im Bomaye Boxgym München: Einverständniserklärung, Sparring-Freigabe und Wettkampf-Anmeldung.',
  },
  'hausordnung.html': {
    titel: 'Hausordnung',
    beschr: 'Die Hausordnung des Bomaye Boxgym München. Regeln für ein respektvolles Miteinander, sicheres Training und ein professionelles Boxgym-Erlebnis.',
  },
  /* Auf den drei Rechtsseiten wird NUR das Meta angefasst, kein Wort im
     Fliesstext. */
  'impressum.html': {
    titel: 'Impressum',
    beschr: 'Impressum der Bomaye Gym GmbH, Wilhelm-Hale-Straße 44 in München: Anbieterkennzeichnung nach § 5 TMG, Geschäftsführung, Handelsregister und Kontakt.',
  },
  'datenschutz.html': {
    titel: 'Datenschutzerklärung',
    beschr: 'Datenschutzerklärung des Bomaye Boxgym München: welche Daten bei Buchung, Mitgliedschaft und Websitebesuch verarbeitet werden und welche Rechte du hast.',
  },
  'agb.html': {
    titel: 'AGB',
    beschr: 'Die Allgemeinen Geschäftsbedingungen des Bomaye Boxgym München: Vertragsschluss, Beiträge, Early-Bird-Angebote, Kündigung, Pause und Haftung.',
  },
};

/* Die zwei neuen Seiten aus diesem Durchgang. /boxen-muenchen ist die
   Uebersicht und verlinkt alle Themenseiten; /kinderboxen-muenchen haengt
   darunter (dreistufige BreadcrumbList). */
SEITEN['boxen-muenchen.html'] = {
  titel: 'Boxen München: Boxgym in Neuhausen',
  beschr: 'Boxen in München: Bomaye Boxgym im Pineapple Park, Neuhausen-Nymphenburg. Boxen, Kickboxen, Kinderboxen und Personal Training. Erstes Training kostenlos.',
};
SEITEN['kinderboxen-muenchen.html'] = {
  titel: 'Kinder Boxen München: Kids Boxing ab 6',
  marke: 'Bomaye Boxgym',
  beschr: 'Kinderboxen in München: Kids Boxing ab 6 Jahren, Youth ab 10. Altersgerechtes Training in Kleingruppen im Bomaye Boxgym. Erstes Training kostenlos.',
};

/* ═══════════════════════════════════════════════════════════════════════════
   ZWEI WERTE, DIE DER BETREIBER SETZT
   ═══════════════════════════════════════════════════════════════════════════
   Beide standen vorher an mehreren Stellen im Markup und liefen auseinander.
   Hier stehen sie einmal; scripts/seo-bauen.mjs traegt sie ueberall ein.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── 1. Der Standort ─────────────────────────────────────────────────────
   Die Stecknadel aus dem Google-Unternehmensprofil, vom Betreiber am
   01.11.2026 geliefert. Das Profil ist die maßgebliche Quelle: weicht das
   Schema davon ab, wertet Google das als Zeichen fuer veraltete Daten.

   HIER STANDEN DREI VERSCHIEDENE ORTE, UND ZWEI WAREN FALSCH:
     48.1472   / 11.5235      im Schema, auf 23 Seiten
     48.147356 / 11.5224959   im Kartenlink der Startseite, 30 m daneben
     48.1408   / 11.5358      in assets/js/config.js, Stecknadel der
                              OpenStreetMap-Karte - 1,2 km daneben
   Jetzt steht der Wert an genau einer Stelle, und alle drei Orte holen ihn
   sich von hier. Wer ihn aendert, laesst danach
   "node scripts/seo-bauen.mjs" laufen - das schreibt Schema und
   Kartenlink; config.js wird von Hand nachgezogen, dort steht der Wert im
   Kommentar als Verweis. */
export const GEO_BREITE = 48.145755;
export const GEO_LAENGE = 11.5227558;

/* ── 2. Die Google-Bewertung ─────────────────────────────────────────────
   Vom Betreiber am 01.11.2026 geliefert.

   DIESE ZAHLEN WERDEN VON HAND GEPFLEGT. Nichts im Repo ruft das
   Google-Unternehmensprofil ab, und niemand aktualisiert sie automatisch.
   Wer sie aendert, aendert die drei Zeilen unten - wert, anzahl UND stand -
   und laesst danach "node scripts/seo-bauen.mjs" laufen. Das Datum ohne die
   Zahl nachzuziehen ist schlimmer als ein altes Datum: dann behauptet die
   Seite Aktualitaet, die sie nicht hat.

   Vorher stand die Bewertung an zwei Stellen mit zwei verschiedenen Zahlen:
   die Startseite zeigte 4.9 ohne sichtbares Datum, /probetraining
   "5,0 · 204 Bewertungen auf Google". Mindestens eine davon war falsch, und
   gemerkt haette es niemand.

   Der Stand steht auf BEIDEN Seiten sichtbar: eine Bewertung ohne Datum
   liest sich wie ein Live-Wert, und das ist sie nicht.

   Deutsche Schreibweise mit Komma. KEIN AggregateRating im Schema: dafuer
   muesste die Zahl nachpruefbar aus einer Quelle kommen, und sie kommt von
   Hand.                                                                   */
export const BEWERTUNG = {
  wert:   '5,0',          /* Durchschnitt im Google-Unternehmensprofil */
  anzahl: '218',          /* Anzahl der Bewertungen */
  stand:  '01.11.2026',   /* Tag, an dem beides abgelesen wurde */
};

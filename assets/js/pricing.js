/* ============================================================
   BOMAYE GYM MUNICH — pricing.js
   ============================================================
   BOMAYE_PRICING — Membership & pricing module.
   Supersedes BOMAYE.pricing in config.js.

   All prices are weekly prices (€/week).
   Duration keys: '1M' '3M' '6M' '12M'
   ============================================================ */

const BOMAYE_PRICING = {

  /* ── Enrollment Fee ────────────────────────────────────── */
  enrollmentFee: {
    amount:          100,            // € — one-time Aufnahmegebühr
    label:           'Aufnahmegebühr',
    note:            'einmalig bei Vertragsabschluss',
    earlyBirdWaived: false,          // true = fee waived for early-bird members
  },

  /* ── Membership Tiers ──────────────────────────────────── */
  memberships: [
    {
      id:         'kids',
      name:       'Kids Boxing',
      tag:        'KIDS',
      icon:       'fa-child',
      ageGroups:  ['kids'],
      note:       'Für Kinder von 6–9 Jahren',
      earlyBird: {
        weekly: { '1M': 19.90, '3M': 17.90, '6M': 15.90, '12M': 14.90 },
      },
      regular: {
        weekly:        { '1M': 22.90, '3M': 20.90, '6M': 18.90, '12M': 17.90 },
        compareWeekly: null,
        savingsText:   null,
      },
    },
    {
      id:         'youth',
      name:       'Youth Boxing',
      tag:        'U18',
      icon:       'fa-child-reaching',
      ageGroups:  ['jugend'],
      note:       'Für Jugendliche von 10–17 Jahren',
      earlyBird: {
        weekly: { '1M': 21.90, '3M': 19.90, '6M': 16.90, '12M': 15.90 },
      },
      regular: {
        weekly:        { '1M': 24.90, '3M': 22.90, '6M': 19.90, '12M': 18.90 },
        compareWeekly: null,
        savingsText:   null,
      },
    },
    {
      id:         'olympic',
      name:       'Olympic Boxing',
      tag:        'VEREIN',
      icon:       'fa-trophy',
      ageGroups:  ['erwachsene'],
      note:       null,
      earlyBird: {
        weekly: { '1M': 23.90, '3M': 21.90, '6M': 19.90, '12M': 18.90 },
      },
      regular: {
        weekly:        { '1M': 26.90, '3M': 24.90, '6M': 22.90, '12M': 21.90 },
        compareWeekly: null,
        savingsText:   null,
      },
    },
    {
      id:         'kickboxing',
      name:       'Kickboxing',
      tag:        'WELTMEISTER',
      icon:       'fa-fire',
      ageGroups:  ['erwachsene'],
      note:       null,
      earlyBird: {
        weekly: { '1M': 23.90, '3M': 21.90, '6M': 19.90, '12M': 18.90 },
      },
      regular: {
        weekly:        { '1M': 26.90, '3M': 24.90, '6M': 22.90, '12M': 21.90 },
        compareWeekly: null,
        savingsText:   null,
      },
    },
    {
      id:         'women',
      name:       "Women's Boxing",
      tag:        'EMPOWERMENT',
      icon:       'fa-venus',
      ageGroups:  ['erwachsene'],
      note:       null,
      earlyBird: {
        weekly: { '1M': 23.90, '3M': 21.90, '6M': 19.90, '12M': 18.90 },
      },
      regular: {
        weekly:        { '1M': 26.90, '3M': 24.90, '6M': 22.90, '12M': 21.90 },
        compareWeekly: null,
        savingsText:   null,
      },
    },
    {
      id:         'mind',
      name:       'Mind & Body',
      tag:        'MENTAL',
      icon:       'fa-brain',
      ageGroups:  ['erwachsene', 'jugend'],
      note:       null,
      earlyBird: {
        weekly: { '1M': 23.90, '3M': 21.90, '6M': 19.90, '12M': 18.90 },
      },
      regular: {
        weekly:        { '1M': 26.90, '3M': 24.90, '6M': 22.90, '12M': 21.90 },
        compareWeekly: null,
        savingsText:   null,
      },
    },
  ],

  /* ── Flex Passes ───────────────────────────────────────── */
  flexPasses: {
    dayPass: {
      enabled: false,
      label:   'Tageskarte',
      price:   null,
      note:    null,
    },
    tenCard: {
      enabled:      false,
      label:        '10er-Karte',
      price:        null,
      pricePerVisit: null,
      note:         null,
    },
    twentyCard: {
      enabled:      false,
      label:        '20er-Karte',
      price:        null,
      pricePerVisit: null,
      note:         null,
    },
  },

  /* ── Personal Training ───────────────────────────────────
     STAND 01.11.2026, vom Betreiber bestaetigt, und gleichlautend mit der
     sichtbaren Preistabelle auf /personal-training-boxen-muenchen. Diese
     Seite ist die massgebliche Quelle, nicht diese Datei.

     HIER STANDEN FUER NICHTMITGLIEDER ANDERE ZAHLEN. Viermal angefasst,
     alle vier Male am 01.11.2026 und jedes Mal vom Betreiber bestaetigt:
       pricePerSession      110  ->  125
       tenCardPrice         950  ->  1090  ->  1150  ->  1050  ->  1090
       tenCardPricePerUnit   95  ->   109  ->   115  ->   105  ->   109
     Die Mitgliederpreise (90 / 800 / 80) stimmten von Anfang an.

     Warum viermal:
       1. Lauf  Die Datei trug 110 / 950 / 95 und stimmte mit keiner
                sichtbaren Stelle ueberein. Nachgezogen auf die PT-Seite:
                125 / 1090 / 109.
       2. Lauf  Dann fiel auf, dass die Zehnerkarte an zwei sichtbaren
                Stellen verschieden stand - 1.090 € auf der PT-Seite,
                1.150 € in der Preistabelle der Startseite. Bestaetigt
                wurde 1.150 €, die PT-Seite wurde nachgezogen. Fuer die
                Mitglieder-Zehnerkarte lief es andersherum: Startseite
                1.000 €, PT-Seite 800 €, richtig ist 800 €.
       3. Lauf  Entscheidung des Betreibers: 1.050 €, also 105 € je
                Einheit. Beide sichtbaren Tabellen wurden darauf gesetzt.
       4. Lauf  Zurueck auf 1.090 €, also 109 € je Einheit: bsport
                bleibt auf 1.090 € stehen, und ein Preis im
                Buchungsfenster, der von der Seite abweicht, ist
                schlimmer als eine runde Zahl. Damit ist der Wert
                wieder derselbe wie nach dem 1. Lauf.

     DER GUELTIGE STAND, gleichlautend auf der PT-Seite, in der
     Preistabelle der Startseite und auf /preise:
       Einzelsession    125 €  |  Mitglieder  90 €
       Fuenferkarte     575 €  (115 € je Einheit)  |  425 €  (85 €)
       Zehnerkarte    1.090 €  (109 € je Einheit)  |  800 €  (80 €)

     ZWEI DINGE, DIE MAN WISSEN MUSS:
     1. DIESE WERTE WERDEN VON NICHTS GELESEN. BOMAYE_PRICING wird nur in
        index.html eingebunden, und kein Skript im Repo greift darauf zu.
        Die Preise auf index.html und /mitglied-werden stehen fest im HTML.
        Die Datei ist damit Dokumentation, keine Quelle - die falschen
        Zahlen sind nie jemandem aufgefallen, weil sie nie jemand gesehen
        hat.
     2. Die Fuenferkarte (575 € / 115 € je Einheit, Mitglieder 425 € / 85 €)
        steht auf der Seite, aber nicht hier. Nicht ergaenzt, weil der
        Auftrag nur die Zahlen oben nannte.                                */
  personalTraining: {
    label: 'Personal Training',
    icon:  'fa-user-check',
    forMembers: {
      pricePerSession:     90,
      comparePrice:        null,
      savingsText:         null,
      tenCardPrice:        800,
      tenCardPricePerUnit: 80,
      note:                'Individuelle Terminbuchung',
    },
    forNonMembers: {
      pricePerSession:     125,
      comparePrice:        null,
      tenCardPrice:        1090,
      tenCardPricePerUnit: 109,
      note:                null,
    },
  },

  /* ── Corporate (label only) ────────────────────────────── */
  corporate: {
    label:      'Corporate Boxing',
    icon:       'fa-building',
    priceLabel: 'Auf Anfrage',
    note:       'Pakete für Teams ab 5 Personen',
  },

};

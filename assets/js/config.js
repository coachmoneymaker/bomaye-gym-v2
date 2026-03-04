/* ============================================================
   BOMAYE GYM MUNICH — config.js
   ============================================================
   This file controls all editable content for the site.
   Edit values here without touching the main layout files.
   ============================================================ */

const BOMAYE = {

  /* ── Opening Status ─────────────────────────────────────── */
  openingStatus: 'Opening Soon',

  /* ── Early Bird Counter ──────────────────────────────────
     Change `remaining` to show how many spots are left.
     Change `total` if the overall limit changes.
  ─────────────────────────────────────────────────────────── */
  earlyBird: {
    total:     150,    // ← Edit: total spots ever offered
    remaining: 150,    // ← Edit: current remaining spots
  },

  /* ── Contact ─────────────────────────────────────────────── */
  contact: {
    phoneDisplay:  '0176 2193 2243',
    phoneHref:     '+4917621932243',
    whatsappHref:  '4917621932243',
    email:         'info@bomayegym.com',
    instagram:     'https://www.instagram.com/bomayegym',
    youtube:       'https://www.youtube.com/@bomayegym',
    tiktok:        'https://www.tiktok.com/@bomayegym',
  },

  /* ── Address ─────────────────────────────────────────────── */
  address: {
    street:    'Wilhelm-Hale-Straße 44',
    area:      'Tiefhof Pineapple Park',
    city:      '80639 München',
    transport: 'S-Bahn Hirschgarten (5 Min.)',
    mapLat:    48.1408,
    mapLon:    11.5358,
  },

  /* ── Opening Hours ───────────────────────────────────────── */
  hours: {
    weekdays: '07:00 – 22:00 Uhr',
    saturday: '09:00 – 16:00 Uhr',
    sunday:   'Geschlossen',
  },

  /* ── Pricing ─────────────────────────────────────────────
     All prices are weekly prices (52 weeks/year).
     enrollmentFee is charged once at signup.
     Duration keys: '1M' '3M' '6M' '12M'
  ─────────────────────────────────────────────────────────── */
  pricing: {
    enrollmentFee: 100, // € — one-time Aufnahmegebühr

    programs: [
      {
        id:    'olympic',
        name:  'Olympic Boxing',
        tag:   'VEREIN',
        icon:  'fa-trophy',
        prices: { '1M': 20.90, '3M': 18.90, '6M': 16.90, '12M': 15.90 },
      },
      {
        id:    'kickboxing',
        name:  'Kickboxing',
        tag:   'WELTMEISTER',
        icon:  'fa-fire',
        prices: { '1M': 20.90, '3M': 18.90, '6M': 16.90, '12M': 15.90 },
      },
      {
        id:    'women',
        name:  "Women's Boxing",
        tag:   'EMPOWERMENT',
        icon:  'fa-venus',
        prices: { '1M': 20.90, '3M': 18.90, '6M': 16.90, '12M': 15.90 },
      },
      {
        id:    'youth',
        name:  'Youth Boxing',
        tag:   'U18',
        icon:  'fa-child',
        prices: { '1M': 18.90, '3M': 16.90, '6M': 13.90, '12M': 12.90 },
        note:  'Für Jugendliche ab 6 Jahren',
      },
      {
        id:    'mind',
        name:  'Mind & Body',
        tag:   'MENTAL',
        icon:  'fa-brain',
        prices: { '1M': 20.90, '3M': 18.90, '6M': 16.90, '12M': 15.90 },
      },
    ],

    // Special programs (custom pricing)
    personal: {
      name:     'Personal Training',
      tag:      '1:1',
      icon:     'fa-user-check',
      priceLabel: 'ab 90€',
      priceUnit:  '/ Session',
      note:     'Individuelle Terminbuchung',
    },
    corporate: {
      name:    'Corporate Boxing',
      tag:     'TEAMBUILDING',
      icon:    'fa-building',
      priceLabel: 'Auf Anfrage',
      note:    'Pakete für Teams ab 5 Personen',
    },
  },

};

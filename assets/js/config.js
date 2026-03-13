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
        id:              'kids',
        name:            'Kids Boxing',
        tag:             'KIDS',
        icon:            'fa-child',
        ageGroups:       ['kids'],
        earlyBirdPrices: { '1M': 19.90, '3M': 17.90, '6M': 15.90, '12M': 14.90 },
        regularPrices:   { '1M': 22.90, '3M': 20.90, '6M': 18.90, '12M': 17.90 },
        note:            'Für Kinder von 6–9 Jahren',
      },
      {
        id:              'youth',
        name:            'Youth Boxing',
        tag:             'U18',
        icon:            'fa-child-reaching',
        ageGroups:       ['jugend'],
        earlyBirdPrices: { '1M': 21.90, '3M': 19.90, '6M': 16.90, '12M': 15.90 },
        regularPrices:   { '1M': 24.90, '3M': 22.90, '6M': 19.90, '12M': 18.90 },
        note:            'Für Jugendliche von 10–17 Jahren',
      },
      {
        id:              'olympic',
        name:            'Olympic Boxing',
        tag:             'VEREIN',
        icon:            'fa-trophy',
        ageGroups:       ['erwachsene'],
        earlyBirdPrices: { '1M': 23.90, '3M': 21.90, '6M': 19.90, '12M': 18.90 },
        regularPrices:   { '1M': 26.90, '3M': 24.90, '6M': 22.90, '12M': 21.90 },
      },
      {
        id:              'kickboxing',
        name:            'Kickboxing',
        tag:             'WELTMEISTER',
        icon:            'fa-fire',
        ageGroups:       ['erwachsene'],
        earlyBirdPrices: { '1M': 23.90, '3M': 21.90, '6M': 19.90, '12M': 18.90 },
        regularPrices:   { '1M': 26.90, '3M': 24.90, '6M': 22.90, '12M': 21.90 },
      },
      {
        id:              'women',
        name:            "Women's Boxing",
        tag:             'EMPOWERMENT',
        icon:            'fa-venus',
        ageGroups:       ['erwachsene'],
        earlyBirdPrices: { '1M': 23.90, '3M': 21.90, '6M': 19.90, '12M': 18.90 },
        regularPrices:   { '1M': 26.90, '3M': 24.90, '6M': 22.90, '12M': 21.90 },
      },
      {
        id:              'mind',
        name:            'Mind & Body',
        tag:             'MENTAL',
        icon:            'fa-brain',
        ageGroups:       ['erwachsene', 'jugend'],
        earlyBirdPrices: { '1M': 23.90, '3M': 21.90, '6M': 19.90, '12M': 18.90 },
        regularPrices:   { '1M': 26.90, '3M': 24.90, '6M': 22.90, '12M': 21.90 },
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

/* ─────────────────────────────────────────────────────────────
   DATA SOURCE ABSTRACTION — Early Bird Spots
   ─────────────────────────────────────────────────────────────
   MODE A (automatic): fetches from /data/earlybird.json
   MODE B (manual fallback): reads BOMAYE.earlyBird.remaining

   To plug in B-Sport or any API later, replace the fetch URL
   or the entire try-block with your endpoint.
   The rest of the site reads ONLY from getEarlyBirdSpotsLeft().
───────────────────────────────────────────────────────────── */
async function getEarlyBirdSpotsLeft() {
  // MODE A — dynamic JSON (update /data/earlybird.json on your server)
  try {
    const res = await fetch('/data/earlybird.json', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.spots_left === 'number') return data.spots_left;
    }
  } catch (_) { /* fall through */ }

  // MODE B — manual fallback: change BOMAYE.earlyBird.remaining in this file
  return BOMAYE.earlyBird.remaining;
}

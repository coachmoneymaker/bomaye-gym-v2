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

  /* ── Personal Training ─────────────────────────────────── */
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
      pricePerSession:     110,
      comparePrice:        null,
      tenCardPrice:        950,
      tenCardPricePerUnit: 95,
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

/* ============================================================
   BOMAYE GYM MUNICH — homepage-content.js
   ============================================================
   BOMAYE_HOMEPAGE — Homepage content singleton.
   Every editable section on the homepage lives here.
   No section copy is hard-coded in HTML — all text, labels,
   and toggle flags come from this object.

   Depends on: BOMAYE_FAMILY.enabled, BOMAYE_CORPORATE.enabled
   Load AFTER pricing.js, family-benefit.js, corporate-boxing.js
   and BEFORE main.js.
   ============================================================ */

const BOMAYE_HOMEPAGE = {

  /* ── Hero ──────────────────────────────────────────────── */
  hero: {
    badge:        'NOW OPEN · EARLY BIRD ACTIVE',
    headline:     'Boxen. Leben. München.',
    subheadline:  'Das Boxgym im Pineapple Park — für Anfänger, Fortgeschrittene und Wettkämpfer. Sichere dir jetzt deinen Early-Bird-Preis.',
    ctaPrimary:   { label: 'JETZT EARLY BIRD SICHERN', href: '#pricing' },
    ctaSecondary: { label: 'MEHR ERFAHREN',            href: '#dna' },
  },

  /* ── Announcement Bar ──────────────────────────────────── */
  announcement: {
    enabled:  false,
    text:     '',
    linkHref: null,
  },

  /* ── Early Bird Section ────────────────────────────────── */
  earlyBird: {
    enabled:         true,
    sectionBadge:    'EARLY BIRD OFFER',
    headline:        'Sichere dir deinen Early-Bird-Preis – für immer.',
    subtext:         'Early-Bird-Mitglieder zahlen den Gründerpreis dauerhaft — auch wenn unsere regulären Preise später steigen. Limitiert auf 300 Plätze.',
    spotsLabel:      'Noch {n} Early-Bird-Plätze verfügbar',
    spotsBarEnabled: true,
    cta:             { label: 'Jetzt Mitglied werden', href: '#membership' },
  },

  /* ── Membership Intro ──────────────────────────────────── */
  membershipIntro: {
    sectionBadge: 'MITGLIEDSCHAFT',
    headline:     'Dein Training. Dein Preis.',
    subtext:      'Von Kids bis Erwachsene, von Anfänger bis Wettkämpfer — wähle das Programm, das zu dir passt, und profitiere von fairen Wochenpreisen ohne versteckte Kosten.',
    cta:          { label: 'Alle Mitgliedschaften', href: '#pricing' },
  },

  /* ── Family Benefit Teaser ─────────────────────────────── */
  familyBenefitTeaser: {
    // Note: also requires BOMAYE_FAMILY.enabled === true
    enabled:      typeof BOMAYE_FAMILY !== 'undefined' ? BOMAYE_FAMILY.enabled : false,
    sectionBadge: 'FAMILIEN-VORTEIL',
    headline:     'Gemeinsam trainieren. Gemeinsam sparen.',
    subtext:      'Mehrere Familienmitglieder bei Bomaye? Fragt nach unserem exklusiven Familienrabatt.',
    ctaLabel:     'Familien-Vorteil anfragen',
  },

  /* ── Personal Training Teaser ──────────────────────────── */
  personalTrainingTeaser: {
    sectionBadge: 'PERSONAL TRAINING',
    headline:     '1:1 Training mit Profi-Coach.',
    subtext:      'Individuelles Training, das sich deinen Zielen anpasst. Für Mitglieder und Nicht-Mitglieder buchbar.',
    bulletPoints: [
      'Individuelle Trainingsplanung',
      'Flexible Terminbuchung',
      'Für alle Levels geeignet',
      'Für Mitglieder & Nicht-Mitglieder',
    ],
    cta: { label: 'Personal Training buchen', href: '#personal-training' },
  },

  /* ── Corporate Boxing Teaser ───────────────────────────── */
  corporateBoxingTeaser: {
    // Note: also requires BOMAYE_CORPORATE.enabled === true
    enabled:      typeof BOMAYE_CORPORATE !== 'undefined' ? BOMAYE_CORPORATE.enabled : false,
    sectionBadge: 'CORPORATE BOXING',
    headline:     'Teambuilding auf einem anderen Level.',
    subtext:      'Maßgeschneiderte Boxprogramme für Unternehmen. Gruppen ab 5 Personen, einmalig oder regelmäßig.',
    ctaLabel:     'Corporate Paket anfragen',
  },

  /* ── FAQ Teaser & SEO ──────────────────────────────────── */
  faqTeaser: {
    sectionBadge:  'FAQ',
    headline:      'Häufig gestellte Fragen.',
    subtext:       'Alles Wichtige zu Mitgliedschaft, Training, Standort und mehr — übersichtlich auf unserer FAQ-Seite.',
    cta:           { label: 'Alle FAQs ansehen', href: '/faq.html' },
    seoFooterText: 'Bomaye Gym Munich ist ein modernes Boxgym in München Neuhausen-Nymphenburg, direkt im Pineapple Park an der Wilhelm-Hale-Straße. Wir bieten Olympic Boxing, Kickboxen, Women\'s Boxing, Kids & Youth Boxing, Personal Training und Corporate Boxing für alle Leistungsstufen — vom Anfänger bis zum Wettkämpfer. Gut erreichbar mit der S-Bahn (Hirschgarten, 5 Minuten).',
  },

};

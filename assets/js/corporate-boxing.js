/* ============================================================
   BOMAYE GYM MUNICH — corporate-boxing.js
   ============================================================
   BOMAYE_CORPORATE — Corporate boxing module.
   Controls the homepage teaser tile and the full modal + form.

   Set enabled: false to hide the teaser and disable the modal
   entirely — no form submissions will be possible.
   ============================================================ */

const BOMAYE_CORPORATE = {

  /* ── Master Switch ─────────────────────────────────────── */
  enabled: false,   // ← set to true to activate the corporate boxing feature

  /* ── Teaser (Homepage Tile) ────────────────────────────── */
  teaser: {
    title: 'Corporate Boxing',
    text:  'Teambuilding auf einem anderen Level. Maßgeschneiderte Boxprogramme für Unternehmen – inkl. Catering & Getränken buchbar.',
  },

  /* ── Modal Content ─────────────────────────────────────── */
  modal: {
    title:       'Corporate Boxing',
    supportText: 'Boxen verbindet, motiviert und stärkt den Teamgeist. Wir bieten maßgeschneiderte Programme für Teams jeder Größe – von einem einmaligen Event bis zum regelmäßigen Unternehmensangebot.',
    benefits: [
      'Teambuilding & Unternehmensevents',
      'Professionelle Trainer & strukturiertes Programm',
      'Flexible Buchung – einmalig oder regelmäßig',
      'Gruppen ab 5 Personen',
      'Individuelle Pakete nach Bedarf',
    ],
    cateringOption: {
      enabled:     false,
      label:       'Catering & Getränke buchbar',
      description: 'Auf Wunsch organisieren wir Getränke und Snacks für euer Event direkt im Gym.',
    },
    formTitle: 'Paket anfragen',
  },

  /* ── Form ──────────────────────────────────────────────── */
  form: {
    fields: [
      {
        id:          'name',
        label:       'Ansprechpartner*in',
        type:        'text',
        placeholder: 'Vor- und Nachname',
        required:    true,
        order:       1,
      },
      {
        id:          'company',
        label:       'Unternehmen',
        type:        'text',
        placeholder: 'Firmenname',
        required:    true,
        order:       2,
      },
      {
        id:          'email',
        label:       'E-Mail-Adresse',
        type:        'email',
        placeholder: 'kontakt@unternehmen.de',
        required:    true,
        order:       3,
      },
      {
        id:          'phone',
        label:       'Telefon',
        type:        'tel',
        placeholder: '+49 …',
        required:    false,
        order:       4,
      },
      {
        id:          'teamSize',
        label:       'Teamgröße',
        type:        'select',
        placeholder: null,
        options:     ['5–10 Personen', '11–20 Personen', '21–50 Personen', '50+ Personen'],
        required:    true,
        order:       5,
      },
      {
        id:          'frequency',
        label:       'Art der Buchung',
        type:        'select',
        placeholder: null,
        options:     ['Einmaliges Event', 'Regelmäßig (monatlich)', 'Regelmäßig (wöchentlich)', 'Noch offen'],
        required:    true,
        order:       6,
      },
      {
        id:          'message',
        label:       'Weitere Infos oder Wünsche',
        type:        'textarea',
        placeholder: 'Was ist euch besonders wichtig? Gibt es besondere Anforderungen?',
        required:    false,
        order:       7,
      },
      {
        id:          'privacy',
        label:       'Ich habe die Datenschutzerklärung gelesen und stimme zu.',
        type:        'checkbox',
        placeholder: null,
        required:    true,
        order:       8,
      },
    ],
    submitLabel:    'Paket anfragen',
    recipientEmail: 'info@bomayegym.com',
  },

  /* ── Success Message ───────────────────────────────────── */
  successMessage: {
    title: 'Anfrage erhalten!',
    text:  'Vielen Dank für dein Interesse! Wir melden uns in Kürze mit einem individuellen Angebot für euer Team.',
  },

};

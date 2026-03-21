/* ============================================================
   BOMAYE GYM MUNICH — family-benefit.js
   ============================================================
   BOMAYE_FAMILY — Family benefit module.
   Controls the homepage teaser tile and the full modal + form.

   Set enabled: false to hide the teaser and disable the modal
   entirely — no form submissions will be possible.
   ============================================================ */

const BOMAYE_FAMILY = {

  /* ── Master Switch ─────────────────────────────────────── */
  enabled: false,   // ← set to true to activate the family benefit feature

  /* ── Teaser (Homepage Tile) ────────────────────────────── */
  teaser: {
    label: 'FAMILIEN-VORTEIL',
    text:  'Mehrere Familienmitglieder trainieren zusammen? Fragt nach unserem exklusiven Familienrabatt und spart gemeinsam.',
  },

  /* ── Modal Content ─────────────────────────────────────── */
  modal: {
    title:       'Familien-Vorteil',
    supportText: 'Wenn zwei oder mehr Personen aus einer Familie bei uns Mitglied werden, profitiert ihr von attraktiven Sonderkonditionen. Füllt das Formular aus – wir melden uns persönlich bei euch.',
    bulletPoints: [
      'Rabatt für jedes weitere Familienmitglied',
      'Flexible Laufzeiten – von 1 bis 12 Monaten',
      'Gemeinsam trainieren & gemeinsam sparen',
      'Persönliche Beratung durch unser Team',
    ],
    formTitle: 'Jetzt anfragen',
  },

  /* ── Form ──────────────────────────────────────────────── */
  form: {
    fields: [
      {
        id:          'firstName',
        label:       'Vorname',
        type:        'text',
        placeholder: 'Dein Vorname',
        required:    true,
        order:       1,
      },
      {
        id:          'lastName',
        label:       'Nachname',
        type:        'text',
        placeholder: 'Dein Nachname',
        required:    true,
        order:       2,
      },
      {
        id:          'email',
        label:       'E-Mail-Adresse',
        type:        'email',
        placeholder: 'deine@email.de',
        required:    true,
        order:       3,
      },
      {
        id:          'phone',
        label:       'Telefon / WhatsApp',
        type:        'tel',
        placeholder: '0176 …',
        required:    false,
        order:       4,
      },
      {
        id:          'members',
        label:       'Anzahl Familienmitglieder',
        type:        'select',
        placeholder: null,
        options:     ['2 Personen', '3 Personen', '4 Personen', '5+ Personen'],
        required:    true,
        order:       5,
      },
      {
        id:          'message',
        label:       'Nachricht (optional)',
        type:        'textarea',
        placeholder: 'Weitere Infos oder Fragen …',
        required:    false,
        order:       6,
      },
      {
        id:          'privacy',
        label:       'Ich habe die Datenschutzerklärung gelesen und stimme zu.',
        type:        'checkbox',
        placeholder: null,
        required:    true,
        order:       7,
      },
    ],
    submitLabel:    'Anfrage senden',
    recipientEmail: 'info@bomayegym.com',
  },

  /* ── Success Message ───────────────────────────────────── */
  successMessage: {
    title: 'Anfrage gesendet!',
    text:  'Vielen Dank! Wir melden uns so schnell wie möglich bei dir. Bis bald im Bomaye Gym.',
  },

};

/**
 * ============================================================
 *  BOMAYE GYM — FAQ Content File
 *  Edit this file to add, remove or reorder FAQ items.
 *
 *  HOW TO EDIT (no developer needed):
 *
 *  ▸ Each CATEGORY looks like this:
 *      {
 *        category: "Training",     ← label shown as a pill
 *        id:       "training",     ← unique identifier (no spaces)
 *        items: [
 *          {
 *            q: "Your question here?",
 *            a: "Your answer here."
 *          },
 *          ...more items...
 *        ]
 *      }
 *
 *  ▸ To ADD a question: copy a { q: "...", a: "..." } block
 *    and paste it inside the correct category's items array.
 *    Make sure you put a comma after each block (except the last one).
 *
 *  ▸ To DELETE a question: remove the entire { q: "...", a: "..." }
 *    block including the surrounding curly braces.
 *
 *  ▸ To REORDER: cut a block and paste it in the new position.
 *
 *  ▸ To ADD a new category: copy an entire category block
 *    { category: "...", id: "...", items: [...] } and paste it
 *    at the end of the array (before the final closing bracket).
 *
 *  ▸ Answers can include line breaks: use \n for a new paragraph
 *    (the page renders this automatically).
 *
 *  IMPORTANT: Keep valid syntax — commas between items and blocks.
 * ============================================================
 */

const BOMAYE_FAQ = [

  /* ── TRAINING ─────────────────────────────────────────── */
  {
    category: "Training",
    id: "training",
    items: [
      {
        q: "Brauche ich Vorerfahrung für das Boxtraining?",
        a: "Nein — überhaupt nicht. Bei Bomaye holen wir jeden genau dort ab, wo er steht. Deine erste Stunde ist kostenlos und unverbindlich. Ob du noch nie einen Handschuh angezogen hast oder bereits Erfahrung mitbringst — du bist herzlich willkommen."
      },
      {
        q: "Was muss ich zum ersten Training mitbringen?",
        a: "Sportkleidung, saubere Hallenschuhe und ein Handtuch. Für das Probetraining leihen wir dir Boxhandschuhe kostenlos. Wenn du regelmäßig trainierst, empfehlen wir eigene Handschuhe (10–14 Oz) und Bandagen."
      },
      {
        q: "Wie lange dauert eine Trainingseinheit?",
        a: "Eine Standard-Einheit dauert 60 Minuten inklusive Aufwärmen und Cool-down. Personal Training und spezielle Kurse können abweichen — das besprichst du direkt mit deinem Coach."
      },
      {
        q: "Für welches Alter sind die Programme geeignet?",
        a: "Wir haben Programme für alle Altersgruppen: Kids Boxing (6–9 Jahre), Youth Boxing (10–17 Jahre) und Erwachsene (18+). Jede Gruppe trainiert separat in einem auf sie zugeschnittenen Umfeld."
      },
      {
        q: "Gibt es spezielle Programme für Frauen?",
        a: "Ja. Unser Women's Boxing Programm ist ein exklusiver Safe Space für Frauen — speziell zugeschnittenes Training, erfahrene Coaches und eine starke Community. Kein Vorwissen nötig."
      }
    ]
  },

  /* ── MITGLIEDSCHAFT ───────────────────────────────────── */
  {
    category: "Mitgliedschaft",
    id: "membership",
    items: [
      {
        q: "Welche Mitgliedschaftsmodelle gibt es?",
        a: "Wir bieten Laufzeiten von 1, 3, 6 und 12 Monaten an. Je länger die Laufzeit, desto günstiger der Wochenpreis. Unsere Early-Bird-Mitglieder sichern sich zudem einen dauerhaft garantierten Preis — auch wenn die Preise nach Eröffnung steigen."
      },
      {
        q: "Was ist die Early-Bird-Mitgliedschaft?",
        a: "Die ersten 150 Mitglieder erhalten einen Sonderpreis, der für die gesamte Vertragslaufzeit garantiert gilt. Du zahlst erst ab Opening, sicherst dir deinen Platz aber jetzt. Dieser Preis steigt nie — egal wie viele Preiserhöhungen danach kommen."
      },
      {
        q: "Was ist die einmalige Aufnahmegebühr?",
        a: "Einmalig fällt eine Aufnahmegebühr von 100€ an. Diese deckt Ersteinrichtung und Mitgliedsverwaltung ab. Es gibt keine weiteren versteckten Kosten."
      },
      {
        q: "Gibt es Rabatte für aktive Wettkämpfer?",
        a: "Ja. Aktive Wettkämpfer im Vereinssport können unter bestimmten Voraussetzungen von einem ermäßigten Beitrag profitieren. Voraussetzung ist aktive Vereinsmitgliedschaft und regelmäßige Wettkampfteilnahme. Sprich uns direkt an — wir finden gemeinsam eine faire Lösung."
      }
    ]
  },

  /* ── STUDIO & STANDORT ────────────────────────────────── */
  {
    category: "Studio & Standort",
    id: "location",
    items: [
      {
        q: "Wo befindet sich das Bomaye Gym?",
        a: "Wir sind im Pineapple Park in München: Wilhelm-Hale-Straße 44, Tiefhof Pineapple Park, 80639 München. Optimal erreichbar mit der S-Bahn (Hirschgarten, 5 Minuten zu Fuß) und mit dem Auto (Parkplätze im Pineapple Park Areal vorhanden)."
      },
      {
        q: "Wie sind die Öffnungszeiten?",
        a: "Montag bis Freitag: 07:00 – 22:00 Uhr. Samstag: 09:00 – 16:00 Uhr. Sonntag: geschlossen. Zu Feiertagen können die Zeiten abweichen — wir informieren rechtzeitig über unsere Social-Media-Kanäle."
      }
    ]
  },

  /* ── BUCHUNG & PROBETRAINING ──────────────────────────── */
  {
    category: "Buchung & Probetraining",
    id: "booking",
    items: [
      {
        q: "Wie buche ich ein kostenloses Probetraining?",
        a: "Über den Button „Kostenloses Probetraining" auf unserer Website oder direkt via WhatsApp unter 0176 2193 2243. Das Probetraining ist kostenlos, ohne Vertrag und ohne jeglichen Druck — du entscheidest danach in Ruhe."
      },
      {
        q: "Wann öffnet Bomaye Gym?",
        a: "Bomaye Gym Munich eröffnet in Kürze. Wer jetzt Early-Bird Mitglied wird, sichert sich den besten Preis mit Lifetime-Garantie und zahlt erst ab Opening. Aktuelle Infos auf Instagram: @bomayegym."
      }
    ]
  }

];

/**
 * ============================================================
 *  BOMAYE GYM — FAQ Content File
 *  Edit this file to add, remove, or reorder FAQ items.
 *
 *  HOW TO EDIT (no developer knowledge needed):
 *
 *  Each CATEGORY block looks like:
 *    {
 *      category: "Label shown as pill",
 *      id: "unique-id-no-spaces",
 *      items: [
 *        { q: "Question?", a: "Answer." },
 *        { q: "Another question?", a: "Another answer." }
 *      ]
 *    }
 *
 *  ▸ ADD a question  → copy a { q: "...", a: "..." } block
 *    and paste it inside the correct category's items array.
 *    Put a comma after each block except the last one.
 *
 *  ▸ DELETE a question → remove the entire { q: "...", a: "..." }
 *    block (and the comma before it if it was the last one).
 *
 *  ▸ REORDER → cut a block and paste it in the new position.
 *
 *  ▸ ADD a new category → copy an entire category block and
 *    paste it at the end of the array (before the final ]);).
 *
 *  IMPORTANT: Keep valid syntax — commas between items/blocks.
 * ============================================================
 */

const BOMAYE_FAQ = [

  /* ── STANDORT & ANFAHRT ─────────────────────────────────── */
  {
    category: "Standort & Anfahrt",
    id: "standort",
    items: [
      {
        q: "Wo ist Bomaye Gym Munich und wie finde ich euch?",
        a: "Bomaye Gym Munich liegt im Pineapple Park – einer der spannendsten Locations Münchens. Die genaue Adresse und eine Routenplanung per Google Maps findest du direkt auf unserer Website. Wir sind mit dem ÖPNV (S-Bahn Hirschgarten, ca. 5 Minuten zu Fuß) und dem Auto gut erreichbar – Parkplätze im Areal sind vorhanden."
      }
    ]
  },

  /* ── BUCHUNG & MITGLIEDSCHAFT ───────────────────────────── */
  {
    category: "Buchung & Mitgliedschaft",
    id: "buchung",
    items: [
      {
        q: "Wie werde ich Mitglied und starte mit dem Training?",
        a: "Ganz einfach online über unsere Buchungsseite (powered by Bsport). Wähle dein Programm, trag dich ein – fertig. Early-Bird-Mitglieder sichern sich den Gründerpreis dauerhaft. Alternativ kannst du uns auch direkt per WhatsApp oder E-Mail anfragen."
      },
      {
        q: "Welche Mitgliedschaften gibt es und welche Laufzeiten bietet ihr an?",
        a: "Aktuelle Wochenpreise (Early Bird): Kids Boxing ab 14,90 €/Woche · Jugend Boxing ab 15,90 €/Woche · Erwachsene Kurse ab 18,90 €/Woche. Hinzu kommt eine einmalige Aufnahmegebühr von 100€."
      },
      {
        q: "Gibt es Tageskarten oder 10er/Blockkarten ohne lange Bindung?",
        a: "Tageskarten und klassische Blockkarten bieten wir aktuell nicht als Standardprodukt an. Schau auf unserer Website vorbei oder frag direkt bei uns an – wir informieren dich über aktuelle Optionen ohne lange Bindung."
      },
      {
        q: "Kann ich meine Mitgliedschaft pausieren (z. B. bei Umzug oder Verletzung)?",
        a: "Ja. Eine Pause ist in begründeten Ausnahmefällen möglich – zum Beispiel bei einer nachgewiesenen Verletzung oder einem vorübergehenden Umzug. Melde dich einfach bei unserem Team, wir finden gemeinsam eine faire Lösung."
      }
    ]
  },

  /* ── TRAINING & ANGEBOTE ────────────────────────────────── */
  {
    category: "Training & Angebote",
    id: "training",
    items: [
      {
        q: "Welche Trainingsangebote gibt es bei Bomaye (Boxen, Kickboxen, Strength & Conditioning)?",
        a: "Bomaye Gym Munich bietet Olympic Boxing, Kickboxen, Women's Boxing, Youth Boxing (Kids 6–9 und Jugend 10–17), Executive Boxing, Personal Training, Corporate Boxing und Mind & Body. Ob du Anfänger oder Wettkämpfer bist – für jedes Ziel und jeden Level ist das passende Programm dabei."
      },
      {
        q: "Ist Bomaye für Anfänger geeignet oder nur für Fortgeschrittene?",
        a: "Absolut für Anfänger. Kein Vorwissen nötig – wir holen dich genau dort ab, wo du stehst. Dein erster Kurs ist der ideale Einstieg, ganz ohne Erwartungen oder Druck. Gleichzeitig bieten wir anspruchsvolles Training für erfahrene Boxerinnen und Boxer bis hin zu Wettkämpfern."
      },
      {
        q: "Was muss ich zum Training mitbringen (Handschuhe, Bandagen, Schuhe)?",
        a: "Sportkleidung, saubere Hallenschuhe, ein Handtuch und deine eigene Trinkflasche. Boxhandschuhe kannst du dir beim ersten Training kostenlos leihen. Wenn du regelmäßig trainierst, empfehlen wir eigene Handschuhe (10–14 Oz). Hinweis: Getränke stehen aktuell noch nicht zur Verfügung — bitte nimm deine eigene Trinkflasche mit."
      }
    ]
  },

  /* ── AUSSTATTUNG & SERVICES ─────────────────────────────── */
  {
    category: "Ausstattung & Services",
    id: "ausstattung",
    items: [
      {
        q: "Gibt es Umkleiden und Duschen?",
        a: "Ja, Umkleiden sind vorhanden. Detaillierte Informationen zur Ausstattung des Gyms findest du auf unserer Website."
      },
      {
        q: "Kann ich mit Bargeld bezahlen?",
        a: "In der Regel cashless (Karte / Apple Pay / Google Pay). Für aktuelle Zahlungsoptionen wende dich an unser Team – wir helfen gerne weiter."
      }
    ]
  },

  /* ── KONTAKT & SUPPORT ──────────────────────────────────── */
  {
    category: "Kontakt & Support",
    id: "kontakt",
    items: [
      {
        q: "Wie erreiche ich euch bei Fragen (Kontakt / Support)?",
        a: "Am schnellsten per WhatsApp unter +49 173 7513627 – wir antworten in der Regel sehr schnell. Alternativ per E-Mail an info@bomayegym.com oder auf Instagram unter @bomayegym_munich. Alle Kontaktmöglichkeiten findest du auch auf unserer Website."
      }
    ]
  }

];

# Design-Skills: Herkunft und Regeln

Installiert im November 2026 auf Wunsch des Inhabers. Die Ordner liegen
unter `.claude/`, das laut `.vercelignore` nicht ausgeliefert wird. Sie
dienen nur Claude Code beim Arbeiten an diesem Repo.

| Ordner | Quelle | Stand (Commit) | Lizenz |
|---|---|---|---|
| `emil-design-eng`, `review-animations`, `mobile-native`, `remove-animations` | github.com/emilkowalski/skill | c8a7962 | MIT |
| `impeccable` | github.com/pbakaus/impeccable | c3bb418 | Apache 2.0 (siehe `NOTICE.md`) |
| `taste-skill` | github.com/Leonxlnx/taste-skill | 9b4bf93 | MIT |

Dazu als Vorlage fuer `DESIGN.md` im Repo-Stamm: github.com/VoltAgent/awesome-design-md
(Commit fcc7028, MIT). Von dort ist nur das Format uebernommen, keine fremde Marke.

## Was bewusst NICHT mitkopiert ist

- `impeccable/scripts/`: Startprogramm, das beim ersten Lauf ein fertiges
  Programm aus dem Netz laedt, und der Live-Modus. Der Skill hat dafuer
  einen eigenen Ersatzweg ("Launcher unavailable") und liest dann
  `DESIGN.md` direkt.
- `taste-skill/assets/`, `scripts/`, `library/`: 38 MB Fotos, Startvorlagen
  und Pruefskripte. Die Vorlagen sind fuer neue Seiten gedacht, nicht fuer
  eine bestehende Marke. Uebernommen sind die Regeln (`SKILL.md`,
  `references/`).
- Die uebrigen Skills aus Emil Kowalskis Sammlung (Swift, Expo, Sonner usw.)
  passen nicht zu dieser statischen Seite.

Aenderungen an den kopierten Dateien: keine.

## Rangfolge, wenn sich Regeln widersprechen

1. Die Vorgaben des Inhabers (Markenfarben Dunkel `#0A0A08`, Creme
   `#F5F0E8`, Gold `#C9A84C`, kein Reinweiss, Deutsch in Du-Form, keine
   Gedankenstriche als Satzzeichen, keine erfundenen Fakten, Tracking
   unberuehrt).
2. `DESIGN.md` im Repo-Stamm: das bestehende System.
3. Die Skills. Sie sind Pruefmassstab und Werkzeug, kein Auftrag zum
   Umbau. Beispiele: taste-skill sieht dunkle Seiten nur fuer Technik vor,
   Bomaye ist bewusst dunkel und bleibt es. impeccable verbietet kleine
   Ueberschriften-Etiketten ueber H2; die Premium-Ebene (premium.css)
   blendet sie auf ihren drei Seiten aus, auf den uebrigen Seiten stehen
   sie noch.

/* ══════════════════════════════════════════════════════════════════════════
   ENTWICKLERKOMMENTARE AUS DEM AUSGELIEFERTEN HTML ENTFERNEN
   ══════════════════════════════════════════════════════════════════════════

   Laeuft als letzter Schritt von bauen:seo, nach den drei Generatoren. Was
   sie schreiben, wird also mitgesaeubert, und die Kommentare koennen nicht
   ueber einen Neubau zurueckkommen.

   WAS BLEIBT, UND WARUM

   1. Bedingte Kommentare (<!--[if ...]> ... <![endif]-->). Die sind kein
      Kommentar, sondern Anweisung an alte Browser.

   2. DIE MARKEN DER GENERATOREN. Das ist kein Schoenheitsfehler, sondern
      zwingend: seo-bauen.mjs schreibt den JSON-LD-Graph zwischen
      <!-- SEO:GRAPH --> und <!-- /SEO:GRAPH --> und findet die Stelle nur
      daran. Genauso faq-bauen.mjs mit <!-- FAQ:HTML --> und
      <!-- FAQ:SCHEMA -->, und preise-bauen.mjs mit <!-- PREISE:* -->.
      Wer diese Marken loescht, macht bauen:seo dauerhaft unbrauchbar: die
      Generatoren finden ihre Stelle nicht mehr, und Preise, FAQ und
      JSON-LD sind nur noch von Hand pflegbar.

   3. Die ERZEUGT-Hinweise INNERHALB der erzeugten Bloecke. Die Generatoren
      schreiben sie bei jedem Lauf mit; wuerden sie hier entfernt, meldete
      der naechste Lauf mit --pruefen einen Unterschied und pruefen:alles
      waere dauerhaft rot.

   4. Alles, was mit <!--! beginnt. Das ist die Handbremse: wer einen
      Kommentar im ausgelieferten HTML braucht, schreibt <!--! ... -->.

   WAS NICHT ANGEFASST WIRD
   Der Inhalt von <script>, <style>, <textarea> und <pre>, und der Inhalt
   des Attributs data-bsport-srcdoc. Dort stehen Kommentare der Sprachen
   JavaScript und CSS, kein HTML, und im srcdoc steckt ein eigenes
   Dokument. Ein Muster wie --> kann dort voellig harmlos vorkommen.

   WAS VERLOREN GEHT
   Es gibt keinen getrennten Bauordner: Vercel liefert dieses Verzeichnis
   direkt aus. Entfernen heisst hier also loeschen. Die 2190 Zeilen
   Begruendung, die vorher im Markup standen, liegen deshalb einmalig in
   docs/html-kommentare-archiv.md. Dieses Skript schreibt das Archiv NICHT
   fort, es ist eine Momentaufnahme vom 05.11.2026.
   ══════════════════════════════════════════════════════════════════════════ */
import { readFile, writeFile, readdir } from 'node:fs/promises';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const NUR_PRUEFEN = process.argv.includes('--pruefen');

/* Marken der Generatoren, oeffnend und schliessend. */
const MARKEN = /^<!--\s*\/?(SEO:GRAPH|FAQ:HTML|FAQ:SCHEMA|PREISE:[A-Z0-9_]+)\s*-->$/;

export function behalten(kommentar) {
  if (/^<!--\s*\[if/i.test(kommentar)) return 'bedingt';
  if (/^<!--!/.test(kommentar)) return 'handbremse';
  if (MARKEN.test(kommentar.trim())) return 'generator-marke';
  if (/ERZEUGT\s*-\s*NICHT VON HAND/i.test(kommentar)) return 'erzeugt-hinweis';
  return null;
}

/* Bereiche, die unangetastet bleiben: andere Sprachen und ein eigenes
   Dokument im Attribut. */
const GESCHUETZT = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<style\b[^>]*>[\s\S]*?<\/style>/gi,
  /<textarea\b[^>]*>[\s\S]*?<\/textarea>/gi,
  /<pre\b[^>]*>[\s\S]*?<\/pre>/gi,
  /data-bsport-srcdoc='[^']*'/g,
  /data-bsport-srcdoc="[^"]*"/g,
];

function schutzbereiche(html) {
  const bereiche = [];
  for (const re of GESCHUETZT) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(html)) !== null) bereiche.push([m.index, m.index + m[0].length]);
  }
  return bereiche;
}

export function saeubern(html) {
  const tabu = schutzbereiche(html);
  const imTabu = (i) => tabu.some(([a, b]) => a <= i && i < b);

  const stuecke = [];
  let letzte = 0;
  let entfernt = 0, behalten_ = 0;
  const re = /<!--[\s\S]*?-->/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (imTabu(m.index)) continue;
    if (behalten(m[0])) { behalten_++; continue; }
    stuecke.push(html.slice(letzte, m.index));
    letzte = m.index + m[0].length;
    entfernt++;
  }
  stuecke.push(html.slice(letzte));
  let raus = stuecke.join('');

  /* Was die Loecher hinterlassen: Zeilen, die nur noch aus Leerraum
     bestehen, und Laeufe von Leerzeilen. Beides wird eingezogen, sonst
     stehen 2000 leere Zeilen im Markup. */
  raus = raus.replace(/[ \t]+\n/g, '\n');
  raus = raus.replace(/\n{3,}/g, '\n\n');
  return { html: raus, entfernt, behalten: behalten_ };
}

const dateien = (await readdir(WURZEL)).filter((d) => d.endsWith('.html')).sort();
let gesamtEntfernt = 0, gesamtBehalten = 0, geschrieben = 0;
const offen = [];

for (const datei of dateien) {
  const vorher = await readFile(WURZEL + '/' + datei, 'utf8');
  const { html, entfernt, behalten: b } = saeubern(vorher);
  gesamtEntfernt += entfernt;
  gesamtBehalten += b;
  if (entfernt === 0) continue;
  if (NUR_PRUEFEN) { offen.push(`${datei}: ${entfernt}`); continue; }
  await writeFile(WURZEL + '/' + datei, html);
  geschrieben++;
  console.log(`${datei.padEnd(40)} ${String(entfernt).padStart(4)} entfernt, `
            + `${String(b).padStart(3)} behalten`);
}

if (NUR_PRUEFEN) {
  if (offen.length) {
    console.log('\nHTML-Kommentare im ausgelieferten Markup:');
    offen.forEach((z) => console.log('  • ' + z));
    console.log(`\n═══ ${offen.length} Seite(n) mit Kommentaren. `
              + 'npm run bauen:seo entfernt sie.');
    process.exit(1);
  }
  console.log(`${dateien.length} Seiten, ${gesamtBehalten} Marken behalten, keine `
            + 'Entwicklerkommentare.');
  console.log('\n═══ 0 Befunde');
} else {
  console.log(`\n${geschrieben} von ${dateien.length} Dateien gesaeubert: `
            + `${gesamtEntfernt} Kommentare entfernt, ${gesamtBehalten} behalten.`);
}

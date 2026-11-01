/* ═══════════════════════════════════════════════════════════════════════════
   /preise GEGEN scripts/preise-daten.mjs PRUEFEN
   ═══════════════════════════════════════════════════════════════════════════
   Sechs Pruefungen. Jede bricht mit Datei und Fundstelle ab:

     1. Jeder Preis aus preise-daten.mjs steht auf der Seite.
     2. Auf der Seite steht KEIN Eurobetrag, der nicht aus den Daten kommt.
        Das ist die eigentliche Absicherung: eine von Hand eingetippte Zahl
        faellt sofort auf.
     3. Die Vertrags-Kennungen der Knoepfe stimmen mit den Daten ueberein.
     4. /preise steht in der sitemap.
     5. Kein TODO-OWNER ausserhalb von Kommentaren.
     6. Die fuenf Fragen stehen im HTML und im FAQPage-Schema gleichlautend.

     node scripts/preise-pruefen.mjs
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFile } from 'node:fs/promises';
import { MITGLIEDSCHAFTEN, PT, WEITERE, FRAGEN, AUFNAHME, euro } from './preise-daten.mjs';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const befunde = [];
const melde = (s) => befunde.push(s);

const seite = await readFile(WURZEL + '/preise.html', 'utf8');
const karte = await readFile(WURZEL + '/sitemap.xml', 'utf8');

/* Nur der eigene Inhalt: Kopf, Kopfleiste, Burger und Fuss stehen auf jeder
   Seite und tragen eigene Betraege (der Gold-Knopf nennt 14,90 €). */
const inhalt = seite.slice(seite.indexOf('<main>'), seite.indexOf('\n  <footer>'));
/* Kommentare raus, sonst zaehlen die Erklaerungen als Seiteninhalt mit. */
const sichtbar = inhalt.replace(/<!--[\s\S]*?-->/g, '');

/* ── 1. Jeder Preis aus den Daten steht auf der Seite ──────────────────── */
const erwartet = new Set();
for (const m of MITGLIEDSCHAFTEN) { erwartet.add(euro(m.monat)); erwartet.add(euro(m.woche)); erwartet.add(euro(m.regulaer)); }
for (const g of [PT.nicht, PT.mitglied]) for (const z of g.zeilen) { erwartet.add(euro(z.preis)); erwartet.add(euro(z.proEinheit)); }
for (const w of WEITERE) erwartet.add(euro(w.preis));
erwartet.add(euro(AUFNAHME));

for (const p of erwartet) {
  if (!sichtbar.includes(p)) melde(`Preis ${p.replace(/ /g, ' ')} aus preise-daten.mjs fehlt auf der Seite`);
}

/* ── 2. Kein fremder Eurobetrag auf der Seite ──────────────────────────── */
const gefunden = sichtbar.match(/[\d][\d.]*(?:,\d{2})? €/g) || [];
for (const g of new Set(gefunden)) {
  if (!erwartet.has(g)) melde(`Eurobetrag ${g.replace(/ /g, ' ')} steht auf der Seite, aber nicht in preise-daten.mjs`);
}
/* Ein Betrag ohne geschuetztes Leerzeichen waere von Hand getippt. */
const lose = sichtbar.match(/[\d][\d.]*(?:,\d{2})? €/g) || [];
for (const l of new Set(lose)) melde(`Eurobetrag "${l}" ohne geschuetztes Leerzeichen, also nicht ueber euro() erzeugt`);

/* ── 3. Vertrags-Kennungen ─────────────────────────────────────────────── */
const kennungen = [...sichtbar.matchAll(/data-abo-contract="(\d+)"/g)].map((m) => m[1]).sort();
const sollen = MITGLIEDSCHAFTEN.map((m) => m.contract).sort();
if (kennungen.join(',') !== sollen.join(',')) {
  melde(`Vertrags-Kennungen auf der Seite [${kennungen}] weichen von preise-daten.mjs [${sollen}] ab`);
}

/* ── 4. sitemap ────────────────────────────────────────────────────────── */
if (!karte.includes('<loc>https://www.bomayegym.com/preise</loc>')) {
  melde('/preise fehlt in sitemap.xml');
}

/* ── 5. TODO-OWNER nur in Kommentaren ──────────────────────────────────── */
if (sichtbar.includes('TODO-OWNER')) melde('TODO-OWNER steht ausserhalb eines Kommentars in preise.html');

/* ── 6. Fragen im HTML und im Schema ───────────────────────────────────── */
const entity = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
/* Das <summary> traegt seit der Gestaltungsrunde am 01.11.2026 hinter dem
   Fragetext noch das Plus-Symbol der Startseite. Vor dem Vergleich fliegen
   deshalb alle Marken heraus, sonst liest die Pruefung "undefined". */
const imHtml = [...sichtbar.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)]
  .map((m) => entity(m[1].replace(/<[^>]*>/g, '').trim()));
let fragenSchema = null;
for (const m of seite.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
  let d; try { d = JSON.parse(m[1]); } catch { continue; }
  const knoten = d['@graph'] ? d['@graph'] : [d];
  for (const k of (Array.isArray(knoten) ? knoten : [knoten])) if (k['@type'] === 'FAQPage') fragenSchema = k;
}
if (!fragenSchema) melde('FAQPage-Schema fehlt auf /preise');
else {
  const imSchema = fragenSchema.mainEntity.map((q) => q.name);
  FRAGEN.forEach((q, i) => {
    if (imHtml[i] !== q.f)   melde(`Frage ${i + 1} im HTML lautet "${imHtml[i]}", in preise-daten.mjs "${q.f}"`);
    if (imSchema[i] !== q.f) melde(`Frage ${i + 1} im Schema lautet "${imSchema[i]}", in preise-daten.mjs "${q.f}"`);
  });
  if (imHtml.length !== FRAGEN.length) melde(`${imHtml.length} Fragen im HTML, ${FRAGEN.length} in preise-daten.mjs`);
}

console.log(`/preise: ${erwartet.size} Preise, ${kennungen.length} Kaufknoepfe, ${imHtml.length} Fragen geprueft.`);
if (befunde.length) {
  console.log('\n' + befunde.map((b) => '  • ' + b).join('\n'));
  console.log(`\n═══ ${befunde.length} Befund(e)`);
  process.exitCode = 1;
} else {
  console.log('\n═══ 0 Befunde');
}

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
     6. Die Fragen stehen im HTML und im FAQPage-Schema gleichlautend.
     7. Flex: Betraege, gerechnete Ersparnis, Vertragskennungen und die drei
        Kaufadressen stimmen mit den Daten. Steht FLEX_AKTIV auf false, darf
        von Flex nichts auf der Seite stehen.

     node scripts/preise-pruefen.mjs
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFile } from 'node:fs/promises';
import { MITGLIEDSCHAFTEN, PT, WEITERE, FRAGEN, AUFNAHME, euro,
         FLEX_AKTIV, FLEX, FLEX_FRAGE, ersparnis } from './preise-daten.mjs';

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
/* Flex zaehlt nur mit, wenn es auch gerendert wird. Die Ersparnis ist
   gerechnet, nicht getippt - genau deshalb steht sie hier mit drin. */
if (FLEX_AKTIV) for (const f of FLEX) { erwartet.add(euro(f.monat)); erwartet.add(euro(ersparnis(f))); }

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
const sollen = MITGLIEDSCHAFTEN.map((m) => m.contract)
  .concat(FLEX_AKTIV ? FLEX.map((f) => f.contract) : []).sort();
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
  const sollFragen = FLEX_AKTIV ? FRAGEN.concat([{ f: FLEX_FRAGE.f }]) : FRAGEN;
  sollFragen.forEach((q, i) => {
    if (imHtml[i] !== q.f)   melde(`Frage ${i + 1} im HTML lautet "${imHtml[i]}", in preise-daten.mjs "${q.f}"`);
    if (imSchema[i] !== q.f) melde(`Frage ${i + 1} im Schema lautet "${imSchema[i]}", in preise-daten.mjs "${q.f}"`);
  });
  if (imHtml.length !== sollFragen.length) melde(`${imHtml.length} Fragen im HTML, ${sollFragen.length} erwartet`);
}

/* ── 7. Flex ───────────────────────────────────────────────────────────────
   Mit ausgeschaltetem Schalter darf keine Spur von Flex auf der Seite sein,
   auch keine Marke und kein Stilblock: nur dann ist preise.html byte-gleich
   mit dem Stand ohne Flex. Mit eingeschaltetem Schalter muessen die drei
   Kaufadressen WORTGLEICH so dastehen, wie der Betreiber sie geliefert hat.
   Nicht "enthaelt", sondern gleich: eine abgewandelte Adresse fuehrt in ein
   fremdes Produkt, und das faellt sonst niemandem auf.                    */
const startseite = await readFile(WURZEL + '/index.html', 'utf8');
if (!FLEX_AKTIV) {
  if (seite.includes('PREISE:FLEX')) melde('FLEX_AKTIV ist false, aber preise.html traegt noch eine PREISE:FLEX-Marke');
  if (/pr-flex|Flex STARTEN|FLEX STARTEN/i.test(sichtbar)) melde('FLEX_AKTIV ist false, aber auf /preise steht noch Flex-Markup');
  if (startseite.includes('PREISE:FLEX')) melde('FLEX_AKTIV ist false, aber index.html traegt noch eine PREISE:FLEX-Marke');
  for (const f of FLEX) {
    if (seite.includes(f.url)) melde(`FLEX_AKTIV ist false, aber die Kaufadresse von ${f.name} steht auf /preise`);
    if (sichtbar.includes(`data-abo-contract="${f.contract}"`)) melde(`FLEX_AKTIV ist false, aber die Kennung ${f.contract} steht auf /preise`);
  }
} else {
  for (const f of FLEX) {
    const knopf = new RegExp(`<a href="${f.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*data-abo-contract="${f.contract}"`);
    if (!knopf.test(sichtbar)) melde(`${f.name}: Knopf mit genau dieser Adresse und Kennung ${f.contract} fehlt auf /preise`);
    if (!/rel="noopener"/.test(sichtbar.slice(Math.max(0, sichtbar.indexOf(f.url) - 10), sichtbar.indexOf(f.url) + f.url.length + 120)))
      melde(`${f.name}: rel="noopener" fehlt am Knopf`);
    if (!sichtbar.includes(euro(ersparnis(f)))) melde(`${f.name}: die gerechnete Ersparnis ${euro(ersparnis(f))} fehlt auf der Seite`);
    if (!startseite.includes(euro(f.monat))) melde(`${f.name}: ${euro(f.monat)} fehlt in der Preistabelle der Startseite`);
  }
  if (!sichtbar.includes(FLEX_FRAGE.f)) melde('Die Flex-Frage fehlt im sichtbaren FAQ');
}

console.log(`/preise: ${erwartet.size} Preise, ${kennungen.length} Kaufknoepfe, ${imHtml.length} Fragen`
  + `, Flex ${FLEX_AKTIV ? 'an (' + FLEX.length + ' Angebote)' : 'aus'} geprueft.`);
if (befunde.length) {
  console.log('\n' + befunde.map((b) => '  • ' + b).join('\n'));
  console.log(`\n═══ ${befunde.length} Befund(e)`);
  process.exitCode = 1;
} else {
  console.log('\n═══ 0 Befunde');
}

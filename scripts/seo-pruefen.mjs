/* ═══════════════════════════════════════════════════════════════════════════
   SEO-PRUEFUNG - BRICHT AB, WENN ETWAS NICHT STIMMT
   ═══════════════════════════════════════════════════════════════════════════

     node scripts/seo-pruefen.mjs       oder     npm run pruefen:seo

   Geprueft wird, was man beim Bearbeiten von Hand uebersieht und was in der
   Suche sofort sichtbar ist:

     1. Jeder JSON-LD-Block muss sich parsen lassen. Ein Komma zu viel, und
        Google liest den ganzen Block nicht - ohne Fehlermeldung irgendwo.
     2. Jede indexierbare Seite traegt genau einen #organization- und einen
        #gym-Knoten, beide MIT www.
     3. Keine Kennung ohne www, nirgends.
     4. Jede @id-Verweisung zeigt auf einen Knoten, den es gibt.
     5. Kein sameAs auf den YouTube-Kanal (404).
     6. Titel hoechstens 60 Zeichen, Beschreibung 120 bis 155.
     7. og:title und og:description gleichlautend mit title und description.
     8. Auf /faq stimmen die Fragen im HTML mit denen im FAQPage-Schema
        ueberein - Zeichen fuer Zeichen, beide aus faq-data.js erzeugt.

   Die Grenzen bei 6: 60 Zeichen sind die Breite, ab der Google Titel auf
   dem Handy regelmaessig kuerzt; unter 120 Zeichen bleibt Platz liegen, und
   ueber 155 wird abgeschnitten. Das sind Erfahrungswerte, keine Zusage von
   Google - aber sie sind pruefbar, und ohne Pruefung wachsen sie zurueck.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { BASIS, ORG_ID, GYM_ID } from './seo-daten.mjs';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const TITEL_MAX = 60;
const BESCHR_MIN = 120;
const BESCHR_MAX = 155;

const befunde = [];
const melde = (datei, text) => befunde.push(`${datei}: ${text}`);

function entity(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&szlig;/g, 'ß').replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö')
    .replace(/&uuml;/g, 'ü').replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö')
    .replace(/&Uuml;/g, 'Ü').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&shy;/g, '');
}

const dateien = readdirSync(WURZEL).filter((f) => f.endsWith('.html')).sort();
let geprueft = 0;

for (const name of dateien) {
  const text = await readFile(WURZEL + '/' + name, 'utf8');
  const robots = (text.match(/name="robots"\s+content="([^"]*)"/) || [])[1] || '';
  const indexierbar = !/noindex/i.test(robots);

  /* ── 1. JSON-LD parst ───────────────────────────────────────────────── */
  const bloecke = [...text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const knoten = [];
  bloecke.forEach((m, i) => {
    let d;
    try { d = JSON.parse(m[1]); }
    catch (e) { melde(name, `JSON-LD-Block ${i + 1} parst nicht: ${e.message}`); return; }
    const liste = d['@graph'] ? d['@graph'] : [d];
    for (const k of (Array.isArray(liste) ? liste : [liste])) knoten.push(k);
  });
  geprueft += bloecke.length;

  /* ── 2. Die zwei Pflichtknoten ──────────────────────────────────────── */
  if (indexierbar) {
    for (const [id, was] of [[ORG_ID, 'Organization'], [GYM_ID, 'SportsActivityLocation']]) {
      const n = knoten.filter((k) => k['@id'] === id).length;
      if (n !== 1) melde(name, `${was} (${id}) ${n}x statt 1x`);
    }
  }

  /* ── 3. Kennungen ohne www ──────────────────────────────────────────── */
  const ohneWww = text.match(/https:\/\/bomayegym\.com\/[^"'\s]*/g);
  if (ohneWww) melde(name, `Kennung ohne www: ${[...new Set(ohneWww)].join(', ')}`);

  /* ── 4. Verweisungen zeigen auf vorhandene Knoten ───────────────────── */
  const vorhanden = new Set(knoten.map((k) => k['@id']).filter(Boolean));
  for (const k of knoten) {
    for (const feld of ['publisher', 'provider', 'worksFor', 'parentOrganization', 'isPartOf']) {
      const v = k[feld];
      if (v && typeof v === 'object' && v['@id'] && Object.keys(v).length === 1) {
        if (!vorhanden.has(v['@id'])) melde(name, `${k['@type']}.${feld} zeigt auf ${v['@id']}, den es auf dieser Seite nicht gibt`);
      }
    }
  }

  /* ── 5. Kein toter YouTube-Kanal in sameAs ──────────────────────────────
     Geprueft wird NUR sameAs, nicht die ganze Seite: derselbe Link steht auf
     20 Seiten auch als Symbol im Fuss. Der ist ein 404 und gehoert weg, aber
     das ist eine sichtbare Aenderung am Seitenfuss und gehoerte nicht zum
     Auftrag - siehe TODO-OWNER in der PR-Beschreibung. */
  for (const k of knoten) {
    const sa = k.sameAs;
    const liste = Array.isArray(sa) ? sa : (sa ? [sa] : []);
    if (liste.some((u) => /youtube\.com\/@bomayegym/.test(String(u)))) {
      melde(name, `sameAs von ${k['@type']} zeigt auf den YouTube-Kanal (404)`);
    }
  }

  if (!indexierbar) continue;

  /* ── 6. und 7. Titel, Beschreibung, og ──────────────────────────────── */
  const titel = entity(((text.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim());
  const beschr = entity(((text.match(/name="description"\s+content="([\s\S]*?)"\s*\/?>/) || [])[1] || '').trim());
  if (!titel) melde(name, 'kein <title>');
  else if ([...titel].length > TITEL_MAX) melde(name, `Titel ${[...titel].length} Zeichen (hoechstens ${TITEL_MAX}): "${titel}"`);
  if (!beschr) melde(name, 'keine meta description');
  else {
    const l = [...beschr].length;
    if (l < BESCHR_MIN || l > BESCHR_MAX) melde(name, `Beschreibung ${l} Zeichen (${BESCHR_MIN} bis ${BESCHR_MAX})`);
  }
  const ogT = entity(((text.match(/property="og:title"\s+content="([\s\S]*?)"\s*\/?>/) || [])[1] || '').trim());
  const ogB = entity(((text.match(/property="og:description"\s+content="([\s\S]*?)"\s*\/?>/) || [])[1] || '').trim());
  if (ogT && ogT !== titel) melde(name, `og:title weicht ab:\n      title "${titel}"\n      og    "${ogT}"`);
  if (ogB && ogB !== beschr) melde(name, `og:description weicht von der Beschreibung ab`);
}

/* ── 8. FAQ: HTML und Schema aus derselben Quelle ─────────────────────── */
{
  const faq = await readFile(WURZEL + '/faq.html', 'utf8');
  const fragenHtml = [...faq.matchAll(/<summary[^>]*>\s*<span class="[^"]*\bfaq-q\b[^"]*">([\s\S]*?)<\/span>/g)]
    .map((m) => entity(m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()));
  const schema = [...faq.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => { try { return JSON.parse(m[1]); } catch (e) { return null; } })
    .flatMap((d) => (d && d['@graph'] ? d['@graph'] : [d]))
    .find((k) => k && k['@type'] === 'FAQPage');
  if (!schema) melde('faq.html', 'kein FAQPage-Schema gefunden');
  else {
    const fragenLd = (schema.mainEntity || []).map((e) => entity(String(e.name).replace(/\s+/g, ' ').trim()));
    if (!fragenHtml.length) melde('faq.html', 'keine Fragen im HTML gefunden - ist die Seite noch serverseitig gebaut?');
    if (fragenHtml.join('\u0001') !== fragenLd.join('\u0001')) {
      melde('faq.html', `Fragen in HTML und Schema stimmen nicht ueberein (${fragenHtml.length} im HTML, ${fragenLd.length} im Schema)`);
      for (let i = 0; i < Math.max(fragenHtml.length, fragenLd.length); i++) {
        if (fragenHtml[i] !== fragenLd[i]) melde('faq.html', `  ${i + 1}. HTML "${fragenHtml[i] || '-'}" / Schema "${fragenLd[i] || '-'}"`);
      }
    }
  }
}

console.log(`${dateien.length} Seiten, ${geprueft} JSON-LD-Bloecke geprueft.`);
if (!befunde.length) { console.log('\n═══ 0 Befunde'); process.exit(0); }
console.log('');
for (const b of befunde) console.log('  ' + b);
console.log(`\n═══ ${befunde.length} Befund(e)`);
process.exit(1);

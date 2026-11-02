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
     9. Die Kassenvorlage in abo-embed.js stimmt mit den Flex-Adressen
        aus preise-daten.mjs ueberein.
     8. Jeder Paketknopf traegt die Messattribute, und die Zahlen darin
        stimmen mit preise-daten.mjs ueberein.

     node scripts/preise-pruefen.mjs
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFile } from 'node:fs/promises';
import { MITGLIEDSCHAFTEN, PT, WEITERE, FRAGEN, AUFNAHME, euro,
         FLEX_AKTIV, FLEX, FLEX_FRAGE, ersparnis,
         ADS_CHECKOUT_SEND_TO } from './preise-daten.mjs';

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

/* ── 8. Messattribute an den Paketknoepfen ────────────────────────────────
   plan-tracking.js tippt keine Zahl selbst, es liest diese Attribute. Fehlt
   eines oder weicht es ab, meldet die Seite stillschweigend falsche Preise
   an GA4 und Meta - und das faellt sonst erst in der Auswertung auf, wenn
   die Zahlen schon gesammelt sind.                                       */
const knopfVon = (html, kennung) => {
  const m = html.match(new RegExp(`<a[^>]*data-abo-contract="${kennung}"[^>]*>`, 's'));
  return m ? m[0] : null;
};
const attrVon = (tag, name) => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
};
const SEITEN_MIT_KNOEPFEN = [['preise.html', sichtbar], ['index.html', startseite],
                             ['mitglied-werden.html', await readFile(WURZEL + '/mitglied-werden.html', 'utf8')]];
let geprueftAttr = 0;
for (const [datei, html] of SEITEN_MIT_KNOEPFEN) {
  for (const m of MITGLIEDSCHAFTEN) {
    const tag = knopfVon(html, m.contract);
    if (!tag) { melde(`${datei}: Paketknopf ${m.contract} nicht gefunden`); continue; }
    const soll = {
      'data-item-category': 'membership_earlybird',
      'data-item-name': m.name,
      'data-price': m.monat.toFixed(2),
      'data-first-payment': (m.monat + AUFNAHME).toFixed(2),
      'data-offer': 'earlybird',
      'data-ga-event': 'begin_checkout',
    };
    for (const [k, v] of Object.entries(soll)) {
      const ist = attrVon(tag, k);
      if (ist !== v) melde(`${datei}, Knopf ${m.contract}: ${k} ist "${ist}", erwartet "${v}"`);
      else geprueftAttr++;
    }
  }
}
if (FLEX_AKTIV) {
  for (const f of FLEX) {
    const tag = knopfVon(sichtbar, f.contract);
    if (!tag) { melde(`preise.html: Flex-Knopf ${f.contract} nicht gefunden`); continue; }
    const soll = {
      'data-item-category': 'membership_flex',
      'data-item-name': f.name,
      'data-price': f.monat.toFixed(2),
      'data-first-payment': (f.monat + AUFNAHME).toFixed(2),
      'data-offer': 'flex',
      'data-ga-event': 'begin_checkout',
    };
    for (const [k, v] of Object.entries(soll)) {
      const ist = attrVon(tag, k);
      if (ist !== v) melde(`preise.html, Flex-Knopf ${f.contract}: ${k} ist "${ist}", erwartet "${v}"`);
      else geprueftAttr++;
    }
  }
}
/* Die Pass-Knoepfe tragen den bsport-Namen, nicht den Alltagsnamen. */
for (const w of WEITERE) {
  const m = sichtbar.match(new RegExp(`<a[^>]*data-item-id="${w.id}"[^>]*>`, 's'));
  if (!m) { melde(`preise.html: Pass-Knopf "${w.id}" ohne Messattribute`); continue; }
  if (attrVon(m[0], 'data-ga-event') !== 'select_item')
    melde(`preise.html, Pass "${w.id}": data-ga-event ist "${attrVon(m[0], 'data-ga-event')}", erwartet "select_item" (der Knopf fuehrt auf ${w.ziel}, nicht in einen Checkout)`);
  else if (attrVon(m[0], 'data-item-name') !== w.bsport)
    melde(`preise.html, Pass "${w.id}": data-item-name ist "${attrVon(m[0], 'data-item-name')}", erwartet "${w.bsport}"`);
  else if (attrVon(m[0], 'data-price') !== w.preis.toFixed(2))
    melde(`preise.html, Pass "${w.id}": data-price ist "${attrVon(m[0], 'data-price')}", erwartet "${w.preis.toFixed(2)}"`);
  else geprueftAttr += 2;
}

/* Die Ads-Kennung steht entweder nirgends oder ueberall gleich.
   Hier zaehlt die GANZE Datei, nicht nur <main>: der Skript-Tag steht
   darunter, am Ende des Rumpfes. */
const GANZ = [['preise.html', seite], ['index.html', startseite],
              ['mitglied-werden.html', await readFile(WURZEL + '/mitglied-werden.html', 'utf8')]];
for (const [datei, html] of GANZ) {
  const tag = html.match(/<script src="\/assets\/js\/plan-tracking\.js"[^>]*>/);
  if (!tag) { melde(`${datei}: plan-tracking.js wird nicht geladen`); continue; }
  const ist = attrVon(tag[0], 'data-ads-send-to');
  if (ADS_CHECKOUT_SEND_TO && ist !== ADS_CHECKOUT_SEND_TO)
    melde(`${datei}: data-ads-send-to ist "${ist}", erwartet "${ADS_CHECKOUT_SEND_TO}"`);
  if (!ADS_CHECKOUT_SEND_TO && ist !== null)
    melde(`${datei}: ADS_CHECKOUT_SEND_TO ist leer, am Skript-Tag steht aber "${ist}"`);
}

/* ── 9. Die Kassenadresse in abo-embed.js darf nicht abdriften ────────────
   abo-embed.js baut aus der Vertragskennung die Kassenadresse des Pakets:
   fuer den Streifen im Overlay, fuer den Rueckfall im neuen Tab und fuer
   ?abo=kasse. Dieselbe Adresse steht fuer Flex hier in den Daten. Zwei
   Stellen, eine Wahrheit - also wird sie hier gegengerechnet. Driften sie
   auseinander, fuehrt ein Knopf woandershin als der Streifen daneben. */
const abo = await readFile(WURZEL + '/assets/js/abo-embed.js', 'utf8');
const vorlage = abo.match(/var KASSE = '([^']+)';/);
if (!vorlage) melde('abo-embed.js: die Vorlage KASSE wurde nicht gefunden');
else {
  for (const f of FLEX) {
    const gebaut = vorlage[1].replace('%ID%', f.contract);
    if (gebaut !== f.url)
      melde(`abo-embed.js baut fuer ${f.contract} "${gebaut}", in den Daten steht "${f.url}"`);
  }
  if (vorlage[1].indexOf('%ID%') === -1)
    melde('abo-embed.js: die Vorlage KASSE enthaelt keinen Platzhalter %ID%');
}

console.log(`/preise: ${erwartet.size} Preise, ${kennungen.length} Kaufknoepfe, ${imHtml.length} Fragen`
  + `, ${geprueftAttr} Messattribute`
  + `, Flex ${FLEX_AKTIV ? 'an (' + FLEX.length + ' Angebote)' : 'aus'} geprueft.`);
if (befunde.length) {
  console.log('\n' + befunde.map((b) => '  • ' + b).join('\n'));
  console.log(`\n═══ ${befunde.length} Befund(e)`);
  process.exitCode = 1;
} else {
  console.log('\n═══ 0 Befunde');
}

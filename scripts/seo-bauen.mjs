/* ═══════════════════════════════════════════════════════════════════════════
   SCHREIBT DEN GEMEINSAMEN @graph IN JEDE SEITE
   ═══════════════════════════════════════════════════════════════════════════

     node scripts/seo-bauen.mjs            schreibt
     node scripts/seo-bauen.mjs --pruefen  meldet nur, was sich aendern wuerde

   Quelle ist scripts/seo-daten.mjs. Der Block landet zwischen den Marken
   <!-- SEO:GRAPH --> und <!-- /SEO:GRAPH -->; beim zweiten Lauf wird genau
   dieser Bereich ersetzt, nichts verdoppelt. Das Skript ist also
   wiederholbar, und ein Lauf ohne Aenderung aendert keine Datei.

   Was es sonst tut:
     - den alten, in 20 Dateien wiederholten LocalBusiness-Knoten entfernen
     - auf der Startseite den separaten Organization-Knoten entfernen
       (er steht jetzt im @graph)
     - jede Kennung ohne www auf die Fassung mit www ziehen
     - WebPage.publisher von einem wiederholten Knoten auf eine Verweisung
       umstellen
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFile, writeFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { graph, ALTE_IDS, ORG_ID, ADRESSE, SEITEN, MARKE } from './seo-daten.mjs';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const NUR_PRUEFEN = process.argv.includes('--pruefen');

/* Diese zwei Seiten stehen auf noindex - sie brauchen keine strukturierten
   Daten, und auf mitgliederbereich (noindex, nofollow) waere es sogar
   irrefuehrend. */
const OHNE = new Set(['mitgliederbereich.html', 'wochenplan.html']);

const AUF = '<!-- SEO:GRAPH -->';
const ZU = '<!-- /SEO:GRAPH -->';

const HINWEIS = `  ${AUF}
  <!-- ERZEUGT - NICHT VON HAND AENDERN.
       Quelle: scripts/seo-daten.mjs, geschrieben von scripts/seo-bauen.mjs.
       Aenderungen hier gehen beim naechsten Lauf verloren. Dort aendern,
       dann "node scripts/seo-bauen.mjs" und "node scripts/seo-pruefen.mjs".

       Ein @graph fuer die ganze Seite: #organization ist die Firma,
       #gym der Ort. Alles andere im Repo verweist per @id darauf, statt
       die Knoten zu wiederholen. -->`;

function block() {
  const json = JSON.stringify(graph(), null, 2)
    .split('\n').map((z) => '  ' + z).join('\n');
  return HINWEIS + '\n  <script type="application/ld+json">\n'
    + json + '\n  </script>\n  ' + ZU;
}

/* Findet die JSON-LD-Bloecke einer Datei als Textbereiche. */
function ldBloecke(text) {
  const raus = [];
  const re = /[ \t]*<script type="application\/ld\+json">([\s\S]*?)<\/script>\n?/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let daten = null;
    try { daten = JSON.parse(m[1]); } catch (e) { /* Pruefung meldet das */ }
    raus.push({ von: m.index, bis: m.index + m[0].length, roh: m[0], daten });
  }
  return raus;
}

function istGym(d) {
  if (!d || d['@graph']) return false;
  const t = d['@type'];
  const liste = Array.isArray(t) ? t : [t];
  return liste.includes('SportsActivityLocation') && liste.includes('LocalBusiness');
}
function istOrganisation(d) {
  return !!d && !d['@graph'] && d['@type'] === 'Organization';
}

const berichte = [];
const dateien = readdirSync(WURZEL).filter((f) => f.endsWith('.html')).sort();

for (const name of dateien) {
  const pfad = WURZEL + '/' + name;
  let text = await readFile(pfad, 'utf8');
  const vorher = text;
  const tat = [];

  if (OHNE.has(name)) {
    if (text.includes(AUF)) tat.push('FEHLER: noindex-Seite traegt einen @graph');
    if (tat.length) berichte.push([name, tat]);
    continue;
  }

  /* 1. Einen vorhandenen erzeugten Block herausnehmen, damit der Lauf
        wiederholbar ist. Die Einfuegestelle wird gemerkt. */
  let stelle = -1;
  const markeAuf = text.indexOf(AUF);
  if (markeAuf !== -1) {
    const markeZu = text.indexOf(ZU, markeAuf);
    const zeilenAnfang = text.lastIndexOf('\n', markeAuf) + 1;
    let ende = markeZu + ZU.length;
    if (text[ende] === '\n') ende++;
    stelle = zeilenAnfang;
    text = text.slice(0, zeilenAnfang) + text.slice(ende);
  }

  /* 2. Alten Gym-Knoten und alten Organization-Knoten entfernen. */
  for (;;) {
    const bloecke = ldBloecke(text);
    const treffer = bloecke.find((b) => istGym(b.daten) || istOrganisation(b.daten));
    if (!treffer) break;
    if (stelle === -1 || treffer.von < stelle) stelle = treffer.von;
    tat.push(istGym(treffer.daten) ? 'alten Gym-Knoten entfernt'
                                   : 'alten Organization-Knoten entfernt');
    text = text.slice(0, treffer.von) + text.slice(treffer.bis);
  }

  /* 3. Den gemeinsamen Block einsetzen: dort, wo der alte Knoten stand,
        sonst vor dem ersten JSON-LD, sonst vor </head>. */
  if (stelle === -1) {
    const erstes = ldBloecke(text)[0];
    if (erstes) stelle = erstes.von;
    else {
      const kopf = text.lastIndexOf('</head>');
      stelle = text.lastIndexOf('\n', kopf) + 1;
    }
    tat.push('@graph neu aufgenommen');
  } else {
    tat.push('@graph geschrieben');
  }
  text = text.slice(0, stelle) + block() + '\n' + text.slice(stelle);

  /* 4. Kennungen ohne www nachziehen. */
  for (const [alt, neu] of ALTE_IDS) {
    if (text.includes(alt)) {
      const n = text.split(alt).length - 1;
      text = text.split(alt).join(neu);
      tat.push(`${n}x ${alt} -> ${neu}`);
    }
  }

  /* 5. WebPage.publisher: aus dem wiederholten Knoten wird eine Verweisung.
        Der Herausgeber einer Seite ist die Firma, also #organization.

        HIER STAND EIN REGEX UEBER DEN ROHTEXT, UND DER HAT DREI DATEIEN
        ZERLEGT: er hoerte an der ersten schliessenden Klammer auf, also an
        der des address-Knotens, und liess die beiden aeusseren stehen. Das
        JSON parste danach nicht mehr - gemeldet von seo-pruefen.mjs, und
        genau dafuer gibt es die Pruefung. Jetzt wird der Block geparst, das
        Feld gesetzt und der Block neu geschrieben: Klammern zaehlt der
        JSON-Parser, nicht ein Regex. */
  for (;;) {
    const treffer = ldBloecke(text).find((b) => {
      const d = b.daten;
      return d && d['@type'] === 'WebPage' && d.publisher
        && typeof d.publisher === 'object'
        && !(Object.keys(d.publisher).length === 1 && d.publisher['@id']);
    });
    if (!treffer) break;
    const d = treffer.daten;
    d.publisher = { '@id': ORG_ID };
    const einrueckung = (treffer.roh.match(/^[ \t]*/) || [''])[0];
    const neuerBlock = einrueckung + '<script type="application/ld+json">\n'
      + JSON.stringify(d, null, 2).split('\n').map((z) => einrueckung + z).join('\n')
      + '\n' + einrueckung + '</script>\n';
    text = text.slice(0, treffer.von) + neuerBlock + text.slice(treffer.bis);
    tat.push('WebPage.publisher auf #organization verwiesen');
  }
  /* 6. Die alte Strassenschreibweise auch in den restlichen Knoten. */
  const altStrasse = 'Wilhelm-Hale-Straße 44, Pineapple Park';
  if (text.includes('"streetAddress": "' + altStrasse + '"')) {
    const n = text.split('"streetAddress": "' + altStrasse + '"').length - 1;
    text = text.split('"streetAddress": "' + altStrasse + '"')
               .join('"streetAddress": "' + ADRESSE.streetAddress + '"');
    tat.push(`${n}x streetAddress ergaenzt`);
  }


  /* 7. Titel, Beschreibung und die og-Entsprechungen aus SEITEN setzen.
        Eine Quelle fuer vier Stellen: vorher standen title und og:title
        getrennt im Markup und wichen auf vier Seiten voneinander ab. */
  const seite = SEITEN[name];
  if (seite) {
    const marke = seite.marke || MARKE;
    const titel = `${seite.titel} | ${marke}`;
    const beschr = seite.beschr;
    const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

    const vorTitel = text;
    text = text.replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(titel)}</title>`);
    if (text !== vorTitel && !vorTitel.includes(`<title>${attr(titel)}</title>`)) tat.push('Titel gesetzt');

    const setzeMeta = (muster, ersatz, was) => {
      const davor = text;
      text = text.replace(muster, ersatz);
      if (text === davor) tat.push(`ACHTUNG: ${was} nicht gefunden`);
      else if (!davor.includes(ersatz)) tat.push(`${was} gesetzt`);
    };
    setzeMeta(/<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/,
      `<meta name="description" content="${attr(beschr)}" />`, 'description');
    if (/property="og:title"/.test(text)) {
      setzeMeta(/<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/,
        `<meta property="og:title" content="${attr(titel)}" />`, 'og:title');
    }
    if (/property="og:description"/.test(text)) {
      setzeMeta(/<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/,
        `<meta property="og:description" content="${attr(beschr)}" />`, 'og:description');
    }
  }

  if (text !== vorher) {
    if (!NUR_PRUEFEN) await writeFile(pfad, text);
    berichte.push([name, tat]);
  }
}

if (!berichte.length) console.log('Nichts zu tun - alle Seiten sind auf dem Stand von seo-daten.mjs.');
for (const [name, tat] of berichte) console.log(`${name}\n    ${tat.join('\n    ')}`);
console.log(`\n${berichte.length} von ${dateien.length} Dateien ${NUR_PRUEFEN ? 'wuerden sich aendern' : 'geschrieben'}.`);

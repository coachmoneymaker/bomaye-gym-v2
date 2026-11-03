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
     5. Der alte YouTube-Kanal @bomayegym (404) kommt nirgends mehr vor.
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

  /* ── 5. Der alte, tote YouTube-Kanal kommt nirgends mehr vor ────────────
     youtube.com/@bomayegym war ein 404 und stand an zwei Stellen: in sameAs
     und als Symbol im Fuss. Der richtige Kanal ist @BomayeGymMunich.

     Geprueft wird die ganze Datei, nicht nur sameAs - der Fuss ist die
     Stelle, an der ein Besucher den toten Link anklickt.

     Das Muster ist genauer, als es aussieht, und das ist Absicht. Es gibt
     drei Handles, die mit denselben Zeichen anfangen:
       @bomayegym          der alte, tote Kanal        -> Befund
       @bomayegym_munich   Instagram und TikTok        -> kein Befund
       @BomayeGymMunich    der richtige YouTube-Kanal  -> kein Befund
     Deshalb: nach "@bomayegym" darf kein weiteres Wortzeichen folgen, und
     verglichen wird GROSS/klein-genau. Ein schlichtes grep auf "@bomayegym"
     meldet alle drei. */
  if (/youtube\.com\/@bomayegym(?![A-Za-z0-9_-])/.test(text)) {
    melde(name, 'der alte YouTube-Kanal @bomayegym (404) steht noch in der Datei');
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

/* ── Umleitungen in vercel.json zeigen auf eine Seite, die es gibt ────────
   Eine dauerhafte Umleitung auf eine Adresse ohne Seite ist schlimmer als
   gar keine: Suchmaschinen merken sich das Ziel, und der Besucher landet
   auf 404. Geprueft wird deshalb jedes Ziel.

   Anlass: /alle-preise zeigte dauerhaft auf /mitglied-werden. Seit es
   /preise gibt, war das die falsche Seite - aufgefallen ist es nur, weil
   jemand von Hand nachgesehen hat.

   Zusaetzlich wird auf Ketten geachtet. Eine Umleitung, deren Ziel selbst
   wieder umgeleitet wird, kostet einen zweiten Sprung und verwaessert das
   Signal. Umleitungen mit einer Bedingung (has) zaehlen dabei nicht als
   Kettenglied: sie greifen nur, wenn die Bedingung zutrifft.           */
{
  const roh = await readFile(WURZEL + '/vercel.json', 'utf8');
  let conf = null;
  try { conf = JSON.parse(roh); } catch (e) {
    melde('vercel.json', 'laesst sich nicht als JSON lesen: ' + e.message);
  }
  const umleitungen = (conf && conf.redirects) || [];
  const datei = (ziel) => (ziel === '/' ? 'index.html' : ziel.replace(/^\//, '').replace(/[?#].*$/, '') + '.html');
  /* Ohne Bedingung greift eine Umleitung immer, mit Bedingung nur manchmal. */
  const immer = new Map();
  for (const r of umleitungen) if (!r.has && !r.missing) immer.set(r.source, r.destination);

  for (const r of umleitungen) {
    const ziel = String(r.destination || '');
    if (!ziel.startsWith('/')) continue;       /* fremde Adresse, nicht unsere Sache */
    if (!dateien.includes(datei(ziel))) {
      melde('vercel.json', `Umleitung ${r.source} zeigt auf ${ziel}, dazu gibt es keine Seite (${datei(ziel)})`);
    }
    if (immer.has(ziel)) {
      melde('vercel.json', `Umleitung ${r.source} zeigt auf ${ziel}, und ${ziel} wird selbst weitergeleitet `
                         + `auf ${immer.get(ziel)} - das sind zwei Spruenge`);
    }
    if (r.source === ziel) melde('vercel.json', `Umleitung ${r.source} zeigt auf sich selbst`);
  }
  /* Und nichts auf der Seite darf auf eine umgeleitete Adresse verweisen:
     sonst zahlt jeder Besucher den Umweg mit. */
  const quellen = umleitungen.map((r) => r.source).filter((q) => q && q !== '/' && q !== '/index');
  for (const d of dateien.concat(['sitemap.xml'])) {
    let html;
    try { html = await readFile(WURZEL + '/' + d, 'utf8'); } catch { continue; }
    for (const q of quellen) {
      if (new RegExp(`(?:href|loc>)="?${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:["/#?<]|$)`).test(html)) {
        melde(d, `verweist auf ${q}, das umgeleitet wird - bitte direkt auf das Ziel zeigen`);
      }
    }
  }
}

/* ── Verbotene Versprechen und das Leerzeichen vor dem Euro ──────────────
   Der Early-Bird-Preis bleibt, solange jemand Mitglied bleibt. Er bleibt
   nicht "dauerhaft", er ist keine "Lifetime Garantie" und er ist nicht
   "unwiderruflich": wer kuendigt und spaeter neu abschliesst, zahlt den
   dann gueltigen Preis. Genau diese drei Woerter standen auf der Seite und
   versprachen mehr, als der Vertrag hergibt.

   "Kein Vertrag" stand neben Mitgliedschaftstexten, obwohl die
   Mitgliedschaft 12 Monate laeuft. Auch das ist raus.

   "Founding Member" war ein zweiter Name fuer dieselbe Gruppe. Es gibt nur
   noch einen Namen: Early Bird.

   Prozentangaben wie "spare 17 %" rechnen gegen den Regulaerpreis und
   gelten nur so lange, wie dieser Regulaerpreis gilt. Sie stehen nicht
   mehr auf den Early-Bird-Karten. Der Flex-Vergleich auf /preise
   ("Early Bird spart dir 640,80 Euro im Jahr") bleibt: er rechnet gegen
   einen Preis, den es wirklich gibt, und wird gerechnet, nicht getippt.

   Verglichen wird ohne Ruecksicht auf Gross- und Kleinschreibung. Grund:
   eine Suche mit "grep -i" und einer Klammer wie [uae] faellt im
   C-Gebietsschema bei Grossumlauten stillschweigend aus. Genau so blieben
   "DEIN PREIS. FUER DIE LAUFZEIT." auf /about und /kurse unentdeckt.
   JavaScript faltet Unicode richtig, also faellt das hier auf.

   Dazu die Schreibweise: im Deutschen steht ein geschuetztes oder normales
   Leerzeichen vor dem Euro-Zeichen. "14,90€" ist falsch, "14,90 €" richtig.
   Das gilt fuer ganze Betraege genauso: "20€" ist falsch, "20 €" richtig.

   Geprueft werden die GEBAUTEN Seiten, also das, was ein Besucher sieht.
   Kommentare und Skripte bleiben aussen vor: dort darf das Wort in einer
   Begruendung stehen, so wie hier.                                      */
{
  const VERBOTEN = [
    ['Lifetime',                'verspricht mehr als der Vertrag hergibt'],
    ['unwiderruflich',          'verspricht mehr als der Vertrag hergibt'],
    ['Kein Vertrag',            'die Mitgliedschaft laeuft 12 Monate'],
    ['Founding Member',         'der Early Bird hat nur einen Namen'],
    ['für die Laufzeit',        'der Preis bleibt, solange jemand Mitglied bleibt'],
    ['gesamte Vertragslaufzeit', 'der Preis bleibt, solange jemand Mitglied bleibt'],
  ];
  for (const datei of dateien) {
    const roh = await readFile(WURZEL + '/' + datei, 'utf8');
    const sicht = roh
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    for (const [wort, grund] of VERBOTEN) {
      const treffer = new RegExp(wort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (treffer.test(sicht)) melde(datei, `"${wort}" steht im sichtbaren Text: ${grund}`);
    }
    /* Prozent-Ersparnis auf einer Early-Bird-Karte. Zwei Wege, weil die
       Angabe in der Plakette stand und auch im Fliesstext stehen koennte. */
    for (const m of sicht.matchAll(/<span class="mw-card-savings">([\s\S]*?)<\/span>/g)) {
      if (m[1].includes('%')) melde(datei, `Prozent-Ersparnis auf der Early-Bird-Karte: "${m[1].trim()}"`);
    }
    const prozent = [...sicht.replace(/<[^>]+>/g, ' ').matchAll(/spar\w*\s+\d+\s*%/gi)].map((m) => m[0]);
    if (prozent.length) melde(datei, `Prozent-Ersparnis im Text: ${[...new Set(prozent)].join(', ')}`);
    /* Preis ohne Leerzeichen vor dem Euro. &nbsp; zaehlt als Leerzeichen. */
    const text = sicht.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ');
    /* Auch ganze Betraege: "20€" und "1.090€" sind genauso falsch wie
       "14,90€". Die erste Fassung verlangte Nachkommastellen und liess
       damit acht Preise auf der Startseite durch.                      */
    const eng = [...text.matchAll(/\d[\d.]*(?:,\d{2})?€/g)].map((m) => m[0]);
    if (eng.length) melde(datei, `Preis ohne Leerzeichen vor dem Euro: ${[...new Set(eng)].join(', ')}`);
  }
}

/* ── Striche als Satzzeichen ─────────────────────────────────────────────
   Geviert- und Halbgeviertstrich sowie der freistehende Bindestrich sind im
   deutschen Text dieser Seite keine Satzzeichen. Gesetzt wird Komma, Punkt
   oder Doppelpunkt. Zahlenbereiche heissen "6 bis 9", nicht "6–9".

   Geprueft werden Textknoten, die Meta-Beschreibungen, der Titel, die
   JSON-LD-Werte und das data-time Attribut der Startseite. Letzteres steht
   hier, weil der Stundenplan-Dialog es als Text anzeigt.

   Wortbindestriche (Early-Bird, Wilhelm-Hale-Strasse, 6- bis 9-Jaehrige),
   der Mittelpunkt in "MITGLIED WERDEN · AB", Adressen, Telefonnummern,
   Kommentare, Skripte und Styles bleiben aussen vor.

   AUSNAHMEN, drei Stellen, bewusst so:
   1. Die vier Aufzaehlungszeichen des Fighter-Kits auf /mitglied-werden
      (span.mw-fk-dot). Das ist ein Listenpunkt, kein Satzzeichen.
   2. Die zwei Kundenstimmen auf der Startseite. Das sind woertliche
      Zitate von Besuchern, an denen nichts geaendert wird.            */
{
  const AUSNAHMEN = [
    /<span class="mw-fk-dot">[\u2014\u2013]<\/span>/g,
    /"Klare Empfehlung f\u00fcr JEDEN[^"]*"/g,
    /"Gro\u00dfes Boxstudio mit erfahrenen[^"]*"/g,
  ];
  const STRICH = /[\u2014\u2013]|(?<=\s)-(?=\s)/;

  const leeren = (t) => t.replace(/[^\n]/g, ' ');

  for (const datei of dateien) {
    let roh = await readFile(WURZEL + '/' + datei, 'utf8');
    for (const a of AUSNAHMEN) roh = roh.replace(a, leeren);

    /* Styles, Kommentare und Skripte raus, Zeilen bleiben erhalten.
       sicht behaelt die JSON-LD-Bloecke, damit deren Werte geprueft werden
       koennen. nurText blendet sie zusaetzlich aus, sonst meldet die
       Textknoten-Suche jeden JSON-LD-Fund ein zweites Mal und mit einem
       unbrauchbaren Ausschnitt.                                        */
    const sicht = roh
      .replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/g, leeren)
      .replace(/<style[\s\S]*?<\/style>/g, leeren)
      .replace(/<!--[\s\S]*?-->/g, leeren);
    const nurText = sicht.replace(/<script[^>]*ld\+json[\s\S]*?<\/script>/g, leeren);

    const zeile = (i) => sicht.slice(0, i).split('\n').length;
    const fund = [];

    /* 1. Textknoten */
    for (const m of nurText.matchAll(/>([^<]+)</g)) {
      const t = STRICH.exec(m[1]);
      if (t) fund.push([zeile(m.index + 1 + t.index), m[1].trim().slice(0, 70)]);
    }
    /* 2. Meta-Beschreibungen, Titel, Social-Titel */
    for (const m of nurText.matchAll(/<meta[^>]*>/g)) {
      if (!/(?:name|property)="(?:description|og:description|og:title|twitter:description|twitter:title)"/.test(m[0])) continue;
      const c = /content="([^"]*)"/.exec(m[0]);
      if (c && STRICH.test(c[1])) fund.push([zeile(m.index), c[1].slice(0, 70)]);
    }
    /* 3. JSON-LD Werte */
    for (const blk of sicht.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
      for (const m of blk[1].matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)) {
        if (STRICH.test(m[1])) fund.push([zeile(blk.index + m.index), m[1].slice(0, 70)]);
      }
    }
    /* 4. data-time, weil der Dialog es als Text ausgibt */
    for (const m of sicht.matchAll(/data-time="([^"]*)"/g)) {
      if (STRICH.test(m[1])) fund.push([zeile(m.index), 'data-time="' + m[1] + '"']);
    }

    for (const [z, text] of fund) {
      melde(datei, `Strich als Satzzeichen, Zeile ${z}: "${text}"`);
    }
  }

  /* Sichtbarer Text in Inline-Datenobjekten. Die Startseite baut den
     Stundenplan-Dialog aus SLOT_COACHES und SLOT_CLASS_TYPES, /kurse das
     Karussell aus COURSES, /wochenplan die Zeilen aus einer Vorlage. Alles
     Felder, die per textContent, innerHTML oder alt in die Seite gehen.

     Der Check oben sieht sie nicht, weil er <script> ausblendet. Genau so
     ueberlebten 24 Striche auf der Startseite, 7 auf /kurse und der
     Zeittrenner auf /wochenplan die Strich-Bereinigung.

     Geprueft werden nur Felder, die erfahrungsgemaess angezeigt werden.
     Eine Suche ueber alle Zeichenketten eines Inline-Skripts findet
     dagegen jeden Kommentar und jeden Selektor.                      */
  {
    /* Als Literal geschrieben. Die erste Fassung baute dasselbe Muster mit
       new RegExp aus Zeichenketten zusammen und verdoppelte dabei die
       Rueckstriche einmal zu oft: aus \b wurde ein echter Rueckstrich
       plus b, der Check fand nichts und meldete 0 Befunde.
       Gruppe 3 ist der Inhalt in einfachen, Gruppe 4 der in doppelten
       Anfuehrungszeichen.                                            */
    const feldMuster = /\b(alt|name|body|desc|tags|subtitle|headline|discipline|imgAlt|title|titleMob|strong|span|text)\s*:\s*('((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;

    for (const datei of dateien) {
      const roh = await readFile(WURZEL + '/' + datei, 'utf8');
      for (const blk of roh.matchAll(/<script(?![^>]*src=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
        /* Kommentare im Skript raus, Zeilen bleiben erhalten. */
        const code = blk[1]
          .replace(/\/\*[\s\S]*?\*\//g, leeren)
          .replace(/(^|\n)([ \t]*)\/\/[^\n]*/g, (m, a, b) => a + b);
        for (const m of code.matchAll(feldMuster)) {
          const wert = m[3] !== undefined ? m[3] : m[4];
          if (!wert || !/[A-Za-zÀ-ɏ]/.test(wert)) continue;
          if (!/[—–]|(?<=\s)-(?=\s)/.test(wert)) continue;
          const z = roh.slice(0, blk.index + blk[0].indexOf(blk[1]) + m.index).split('\n').length;
          melde(datei, `Strich in angezeigten Dialogdaten, Zeile ${z}: ${m[1]} = "${wert.slice(0, 60)}"`);
        }
        /* Der Zeittrenner auf /wochenplan steht in einer Vorlage, nicht in
           einem Feld. Deshalb zusaetzlich die Zeichenketten, die wie ein
           blanker Trenner aussehen.                                    */
        for (const m of code.matchAll(/'([—–])'|"([—–])"/g)) {
          const z = roh.slice(0, blk.index + blk[0].indexOf(blk[1]) + m.index).split('\n').length;
          melde(datei, `blanker Strich als Trenner im Skript, Zeile ${z}`);
        }
      }
    }
  }

  /* Die Datenquellen gleich mit. /faq wird aus faq-data.js erzeugt, die
     Startseite holt ihre Texte zur Laufzeit aus homepage-content.js. Ein
     Strich dort steht spaeter auf der Seite, taucht aber in keiner
     gebauten Datei auf: beim ersten Durchgang wurden genau diese zwoelf
     Stellen vom naechsten "bauen:seo" wieder hereingeschrieben.      */
  for (const quelle of ['assets/js/faq-data.js', 'assets/js/homepage-content.js']) {
    const roh = await readFile(WURZEL + '/' + quelle, 'utf8');
    /* Kommentare raus, Zeilen bleiben. Dort darf ein Strich stehen. */
    const code = roh
      .replace(/\/\*[\s\S]*?\*\//g, leeren)
      .replace(/(^|\n)([ \t]*)\/\/[^\n]*/g, (m, a, b) => a + b);
    for (const m of code.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g)) {
      const wert = m[1] !== undefined ? m[1] : m[2];
      const t = /[\u2014\u2013]|(?<=\s)-(?=\s)/.exec(wert);
      if (!t) continue;
      const z = code.slice(0, m.index).split('\n').length;
      melde(quelle, `Strich als Satzzeichen, Zeile ${z}: "${wert.slice(0, 70)}"`);
    }
  }
}

console.log(`${dateien.length} Seiten, ${geprueft} JSON-LD-Bloecke geprueft.`);
if (!befunde.length) { console.log('\n═══ 0 Befunde'); process.exit(0); }
console.log('');
for (const b of befunde) console.log('  ' + b);
console.log(`\n═══ ${befunde.length} Befund(e)`);
process.exit(1);

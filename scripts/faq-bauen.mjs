/* ═══════════════════════════════════════════════════════════════════════════
   /faq AUS assets/js/faq-data.js BAUEN - HTML UND SCHEMA AUS EINER QUELLE
   ═══════════════════════════════════════════════════════════════════════════

     node scripts/faq-bauen.mjs            schreibt
     node scripts/faq-bauen.mjs --pruefen  meldet nur

   WAS VORHER FALSCH WAR
   Die Fragen und Antworten standen nur in faq-data.js und wurden per
   JavaScript in die Seite geschrieben. Im ausgelieferten HTML stand an
   ihrer Stelle ein leeres <div> mit dem Kommentar "Populated by the script
   below". Suchmaschinen, die kein JavaScript ausfuehren, sahen also eine
   FAQ-Seite ohne eine einzige Frage.

   Das FAQPage-Schema stand dafuer FEST im Quelltext - mit einem Kommentar in
   faq-data.js, der jeden ermahnte, jede Aenderung von Hand nachzuziehen.
   Zwei Stellen, eine Hand: das laeuft auseinander, und niemand merkt es.

   JETZT
   Beides wird hier erzeugt, aus derselben Datei, im selben Lauf. Das HTML
   steht vollstaendig im Quelltext, und scripts/seo-pruefen.mjs vergleicht
   die Fragen im HTML Zeichen fuer Zeichen mit denen im Schema.

   WARUM details/summary
   Es klappt ohne JavaScript auf und zu. Die Antworten sind also auch ohne
   JavaScript lesbar - bei dem Knopf-Aufklapper davor waeren sie per CSS auf
   max-height: 0 unsichtbar geblieben, selbst wenn der Text im HTML steht.
   Das JavaScript macht nur noch eines: es schliesst die anderen Eintraege,
   wenn einer geoeffnet wird. Faellt es aus, laesst sich alles trotzdem
   bedienen - dann eben mehrere gleichzeitig offen.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFile, writeFile } from 'node:fs/promises';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const NUR_PRUEFEN = process.argv.includes('--pruefen');
const BASIS = 'https://www.bomayegym.com';

/* faq-data.js ist ein klassisches Skript, kein Modul: es setzt ein const auf
   oberster Ebene. Deshalb wird es gelesen und ausgewertet, statt importiert.
   Eigene Datei aus dem eigenen Repo - nichts Fremdes. */
const quelle = await readFile(WURZEL + '/assets/js/faq-data.js', 'utf8');
const FAQ = new Function(quelle + '\n;return BOMAYE_FAQ;')();
if (!Array.isArray(FAQ) || !FAQ.length) throw new Error('BOMAYE_FAQ ist leer oder kein Array');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Eine Antwort kann mehrere Absaetze haben, getrennt durch \n. */
function absaetze(a) {
  const teile = String(a).split('\n').map((p) => p.trim()).filter(Boolean);
  return (teile.length ? teile : [String(a)]).map((p) => `<p>${esc(p)}</p>`);
}

/* ── Das HTML ────────────────────────────────────────────────────────────
   h2 je Kategorie, damit die Seite eine Gliederung hat und nicht nur eine
   Reihe gleichwertiger Zeilen. Die Pille bleibt als span darin, damit die
   vorhandene Gestaltung unveraendert greift. */
function html() {
  const z = [];
  for (const abschnitt of FAQ) {
    z.push('        <div class="faqp-section">');
    z.push(`          <h2 class="faqp-category"><span class="faqp-category-pill">${esc(abschnitt.category)}</span></h2>`);
    z.push('          <div class="faqp-list">');
    abschnitt.items.forEach((item, i) => {
      const id = `faqp-${abschnitt.id}-${i}`;
      z.push(`            <details class="faqp-item" id="${id}">`);
      z.push('              <summary class="faqp-item-btn">');
      z.push(`                <span class="faqp-question faq-q">${esc(item.q)}</span>`);
      z.push('              </summary>');
      z.push('              <div class="faqp-panel">');
      z.push(`                <div class="faqp-answer">${absaetze(item.a).join('')}</div>`);
      z.push('              </div>');
      z.push('            </details>');
    });
    z.push('          </div>');
    z.push('        </div>');
  }
  return z.join('\n');
}

/* ── Das Schema ──────────────────────────────────────────────────────────
   Dieselbe Reihenfolge, dieselben Texte. acceptedAnswer.text traegt die
   Antwort als Text, ohne Markup. */
function schema() {
  const fragen = [];
  for (const abschnitt of FAQ) {
    for (const item of abschnitt.items) {
      fragen.push({
        '@type': 'Question',
        name: String(item.q),
        acceptedAnswer: { '@type': 'Answer', text: String(item.a).replace(/\s+/g, ' ').trim() },
      });
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': BASIS + '/faq#faqpage',
    mainEntity: fragen,
  };
}

const pfad = WURZEL + '/faq.html';
let text = await readFile(pfad, 'utf8');
const vorher = text;
const tat = [];

/* ── 1. Das Aufklapp-Markup ──────────────────────────────────────────── */
{
  const AUF = '<!-- FAQ:HTML -->';
  const ZU = '<!-- /FAQ:HTML -->';
  const neu = `      ${AUF}
      <!-- ERZEUGT - NICHT VON HAND AENDERN.
           Quelle: assets/js/faq-data.js, geschrieben von
           scripts/faq-bauen.mjs. Dort aendern, dann
           "node scripts/faq-bauen.mjs". -->
      <div id="faqp-accordion" class="faqp-accordion">
${html()}
      </div>
      ${ZU}`;
  const a = text.indexOf(AUF);
  if (a !== -1) {
    const e = text.indexOf(ZU, a) + ZU.length;
    const zeile = text.lastIndexOf('\n', a) + 1;
    text = text.slice(0, zeile) + neu + text.slice(e);
    tat.push('Aufklapp-Markup neu geschrieben');
  } else {
    const re = /[ \t]*<div id="faqp-accordion"[\s\S]*?<\/div>\n/;
    if (!re.test(text)) throw new Error('#faqp-accordion nicht gefunden');
    text = text.replace(re, neu + '\n');
    tat.push('Aufklapp-Markup erstmals in den Quelltext geschrieben');
  }
}

/* ── 2. Das FAQPage-Schema ───────────────────────────────────────────── */
{
  const AUF = '<!-- FAQ:SCHEMA -->';
  const ZU = '<!-- /FAQ:SCHEMA -->';
  const json = JSON.stringify(schema(), null, 2).split('\n').map((z) => '  ' + z).join('\n');
  const neu = `  ${AUF}
  <!-- ERZEUGT - NICHT VON HAND AENDERN. Dieselbe Quelle wie das Markup
       unten: assets/js/faq-data.js. seo-pruefen.mjs vergleicht beide. -->
  <script type="application/ld+json">
${json}
  </script>
  ${ZU}`;
  const a = text.indexOf(AUF);
  if (a !== -1) {
    const e = text.indexOf(ZU, a) + ZU.length;
    const zeile = text.lastIndexOf('\n', a) + 1;
    text = text.slice(0, zeile) + neu + text.slice(e);
    tat.push('FAQPage-Schema neu geschrieben');
  } else {
    /* Den fest eingetragenen Block finden und ersetzen. */
    const bloecke = [...text.matchAll(/[ \t]*<script type="application\/ld\+json">([\s\S]*?)<\/script>\n?/g)];
    const treffer = bloecke.find((m) => {
      try { return JSON.parse(m[1])['@type'] === 'FAQPage'; } catch (e) { return false; }
    });
    if (!treffer) throw new Error('fest eingetragenes FAQPage-Schema nicht gefunden');
    text = text.slice(0, treffer.index) + neu + '\n' + text.slice(treffer.index + treffer[0].length);
    tat.push('fest eingetragenes FAQPage-Schema ersetzt');
  }
}

if (text !== vorher && !NUR_PRUEFEN) await writeFile(pfad, text);
const anzahl = FAQ.reduce((n, a) => n + a.items.length, 0);
console.log(`faq.html: ${FAQ.length} Kategorien, ${anzahl} Fragen`);
console.log(tat.length ? '    ' + tat.join('\n    ') : '    nichts zu tun');
if (NUR_PRUEFEN && text !== vorher) { console.log('\nfaq.html ist nicht auf dem Stand von faq-data.js.'); process.exit(1); }

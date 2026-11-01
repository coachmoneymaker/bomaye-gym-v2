/* ═══════════════════════════════════════════════════════════════════════════
   KRITISCHES CSS FUER /probetraining AUSMESSEN
   ═══════════════════════════════════════════════════════════════════════════

   WOFUER
   Im Kopf von probetraining.html steht ein <style>-Block mit genau den
   Regeln, die der erste Bildschirm braucht. style.css (270 KB) und
   probetraining-page.css (43 KB) werden dafuer ohne Blockade geladen. Wer am
   ersten Bildschirm etwas aendert, muss diesen Block neu erzeugen - sonst
   zeichnet die Seite kurz falsch und ruckt dann zurecht.

   AUSFUEHREN
     node scripts/kritisches-css.mjs

   Das Ergebnis landet in /tmp/kritisch.css und wird NICHT automatisch
   eingebaut: der Block in probetraining.html wird von Hand ersetzt, zwischen
   <style> und </style> hinter dem Kommentar "KRITISCHES CSS FUER DEN ERSTEN
   BILDSCHIRM".

   DANACH PRUEFEN, UND ZWAR RICHTIG
   Ein Vergleich der fertigen Seite genuegt NICHT. Entscheidend ist der
   Zustand, in dem NUR das kritische CSS gilt - den sieht der Besucher in der
   ersten Sekunde. Dafuer die beiden grossen Stylesheets im Testserver leer
   ausliefern und Lage, Hoehe und Breite der Elemente des ersten Bildschirms
   mit dem vollen CSS vergleichen, bei 320, 390 und 430 px. Weicht etwas ab,
   fehlt eine Regel, und die Seite rueckt beim Nachladen sichtbar zurecht
   (CLS).

   WARUM HIER DER ROHTEXT GELESEN WIRD UND NICHT cssText
   Erster Versuch: die Regeln ueber document.styleSheets einsammeln und ihr
   rule.cssText ausgeben. Das hat eine Regel stillschweigend zerstoert:

     .pt-hero { padding: calc(var(--nav-h, 72px) + 24px) 20px 32px;
                padding-bottom: max(32px, env(safe-area-inset-bottom)); }

   Chromium serialisiert die Kurzform neben der Langform zu Langformen und
   kann calc(var(...)) dabei nicht zurueckschreiben. Herausgekommen ist
   "padding-top: ; padding-right: ; padding-left: ;" - also gar kein
   Polster. Die Ueberschrift stand dadurch im ersten Augenblick eine Zeile
   hoch statt zwei und sprang beim Nachladen um 33 px: CLS 0,34 statt 0,004.

   Deshalb wird jetzt der ROHTEXT der Dateien geparst und wortgleich
   uebernommen. Der Browser entscheidet nur noch, WELCHE Regel mitkommt,
   nicht, wie sie aussieht.
   ═══════════════════════════════════════════════════════════════════════════ */
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const WURZEL = '/home/user/bomaye-gym-v2';
const DATEIEN = ['/assets/css/style.css', '/assets/css/probetraining-page.css'];
const BREITEN = [320, 390, 430];
const ZIEL = '/tmp/kritisch.css';

/* ── Rohtext in Regeln zerlegen ────────────────────────────────────────────
   Kein vollstaendiger CSS-Parser, sondern genau so viel, wie diese beiden
   Dateien brauchen: Kommentare weg, dann Klammern zaehlen. Verschachtelte
   At-Regeln (@media, @supports) werden eine Ebene tief geoeffnet; alles
   andere (@font-face, @keyframes, @import) bleibt als Ganzes stehen. */
function ohneKommentare(t) {
  let out = '', i = 0;
  while (i < t.length) {
    const a = t.indexOf('/*', i);
    if (a === -1) { out += t.slice(i); break; }
    out += t.slice(i, a);
    const b = t.indexOf('*/', a + 2);
    if (b === -1) break;
    i = b + 2;
  }
  return out;
}

function bloecke(text) {
  /* Liefert die Bloecke der obersten Ebene als { kopf, koerper, quelle }. */
  const raus = [];
  let i = 0;
  while (i < text.length) {
    const auf = text.indexOf('{', i);
    if (auf === -1) break;
    let tiefe = 1, j = auf + 1;
    while (j < text.length && tiefe > 0) {
      if (text[j] === '{') tiefe++;
      else if (text[j] === '}') tiefe--;
      j++;
    }
    raus.push({
      kopf: text.slice(i, auf).trim(),
      koerper: text.slice(auf + 1, j - 1),
      quelle: text.slice(i, j).trim(),
    });
    i = j;
  }
  return raus;
}

function regeln(text) {
  const raus = [];
  for (const b of bloecke(ohneKommentare(text))) {
    if (b.kopf.startsWith('@media') || b.kopf.startsWith('@supports')) {
      for (const inner of bloecke(b.koerper)) {
        raus.push({ bedingung: b.kopf, kopf: inner.kopf, quelle: inner.quelle,
                    immer: inner.kopf.startsWith('@') });
      }
      continue;
    }
    raus.push({ bedingung: '', kopf: b.kopf, quelle: b.quelle,
                immer: b.kopf.startsWith('@') });
  }
  return raus;
}

/* ── Testserver ───────────────────────────────────────────────────────────── */
const T = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg',
  '.ico':'image/x-icon', '.woff2':'font/woff2', '.mp4':'video/mp4' };
const srv = createServer(async (q, r) => {
  const p = decodeURIComponent(q.url.split('?')[0]);
  try {
    const f = join(WURZEL, p === '/' ? 'index.html' : (p.includes('.') ? p : p + '.html'));
    const c = await readFile(f);
    r.writeHead(200, { 'content-type': T[extname(f)] || 'application/octet-stream' });
    r.end(c);
  } catch { r.writeHead(404); r.end('x'); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const basis = `http://127.0.0.1:${srv.address().port}/`;

/* Alle Regeln beider Dateien, in Reihenfolge. Die Reihenfolge ist die
   Kaskade - sie darf nicht durcheinandergeraten. */
const alleRegeln = [];
for (const d of DATEIEN) {
  const text = await readFile(join(WURZEL, d), 'utf8');
  for (const r of regeln(text)) alleRegeln.push(r);
}

const pw = await import('/opt/node22/lib/node_modules/playwright/index.js');
const { chromium, devices } = pw.default ?? pw;
const b = await chromium.launch();

const nehmen = new Set();
for (const breite of BREITEN) {
  const ctx = await b.newContext({ viewport: { width: breite, height: 700 },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: devices['iPhone 13'].userAgent });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Cookiebot = { consent: { marketing: false }, renew() {}, submitCustomConsent() {} };
    window.BsportWidget = { mount() {} }; window.MountBsportWidget = window.BsportWidget.mount;
  });
  await page.route('**/*', (r) => (r.request().url().startsWith(basis) ? r.continue() : r.abort()));
  await page.goto(basis + 'probetraining', { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const treffer = await page.evaluate((liste) => {
    /* ZWEI Bildschirme, nicht einer.
       Die grossen Stylesheets kommen jetzt mit niedrigster Prioritaet und
       sind gemessen erst bei rund 4 s vollstaendig da. Was im ersten
       Bildschirm steht, traegt der Block hier - aber der Buchungsabschnitt
       beginnt schon bei 0,78 Bildschirmen, und genau dorthin fuehrt der
       goldene Knopf. Ungestylt darf er nicht sein. Deshalb reicht der
       Ausschnitt bis zum doppelten Fenster. */
    const H = window.innerHeight * 2;
    /* Nur der GANZE Selektor darf einer dieser Faelle sein. "body:not(...)
       .cleanslate" faengt sonst an "body" an und kommt mit, obwohl im ersten
       Bildschirm kein .cleanslate steht. */
    const IMMER = /^(:root|html|body|\*|::selection|::-moz-selection|\[hidden\])$/;
    function imBild(sel) {
      /* Pseudo-Klassen, die beim ersten Zeichnen nie gelten, wegnehmen -
         sonst findet querySelectorAll nichts und die Regel faellt weg,
         obwohl ihr Grundselektor sichtbar ist. */
      const sauber = sel
        .replace(/::?(hover|focus|focus-visible|active|visited|target|focus-within)(\([^)]*\))?/g, '')
        .replace(/::?(before|after|placeholder|marker|selection|-webkit-[a-z-]+)(\([^)]*\))?/g, '');
      let el;
      try { el = document.querySelectorAll(sauber || '*'); } catch (e) { return true; }
      if (!el.length) return false;
      for (const e of el) {
        const r = e.getBoundingClientRect();
        if (r.top < H && r.bottom > -1) return true;
      }
      return false;
    }
    const raus = [];
    for (let i = 0; i < liste.length; i++) {
      const { bedingung, kopf, immer } = liste[i];
      if (bedingung) {
        const frage = bedingung.replace(/^@media\s*/, '').replace(/^@supports\s*/, '');
        if (bedingung.startsWith('@media')) {
          let passt; try { passt = window.matchMedia(frage).matches; } catch (e) { passt = false; }
          if (!passt) continue;
        } else {
          let passt; try { passt = CSS.supports(frage.replace(/^\(|\)$/g, '')); } catch (e) { passt = true; }
          if (!passt) continue;
        }
      }
      /* @font-face bleibt draussen: die 18 Regeln aus fonts.css stehen als
         eigener Block im Kopf. @keyframes und alles andere kommt mit. */
      if (immer) {
        if (/^@font-face/i.test(kopf)) continue;
        raus.push(i);
        continue;
      }
      if (kopf.split(',').some((s) => { s = s.trim(); return IMMER.test(s) || imBild(s); })) raus.push(i);
    }
    return raus;
  }, alleRegeln.map(({ bedingung, kopf, immer }) => ({ bedingung, kopf, immer })));

  for (const i of treffer) nehmen.add(i);
  await ctx.close();
}
await b.close(); srv.close();

/* Zusammensetzen: in Originalreihenfolge, gleiche Bedingungen gebuendelt,
   aber nur solange sie direkt aufeinanderfolgen - sonst verschoebe sich die
   Kaskade. */
const sortiert = [...nehmen].sort((a, c) => a - c);
const teile = [];
let offen = null;
for (const i of sortiert) {
  const r = alleRegeln[i];
  if (r.bedingung !== offen) {
    if (offen) teile.push('}');
    if (r.bedingung) teile.push(r.bedingung + ' {');
    offen = r.bedingung;
  }
  teile.push(r.quelle);
}
if (offen) teile.push('}');

const css = teile.join('\n');
await writeFile(ZIEL, css);
console.log(`${ZIEL}  ${sortiert.length} Regeln | ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB`);

/* Dazu die @font-face-Regeln aus fonts.css. Sie stehen in probetraining.html
   in einem EIGENEN <style>-Block, direkt vor dem kritischen CSS: eine eigene
   Datei dafuer hat im Kopf eine ganze Rundreise gekostet, bevor der Browser
   wusste, welche Schriftdateien er braucht. Vollstaendig, damit kein Gewicht
   fehlt - auch die drei massgleichen Rueckfallschriften. */
const fontQuelle = await readFile(join(WURZEL, '/assets/css/fonts.css'), 'utf8');
const ff = regeln(fontQuelle)
  .filter((r) => /^@font-face/i.test(r.kopf))
  .map((r) => r.quelle.replace(/\s*\n\s*/g, ' ').trim());
await writeFile('/tmp/fontface.css', ff.join('\n'));
console.log(`/tmp/fontface.css  ${ff.length} @font-face-Regeln | `
  + `${(Buffer.byteLength(ff.join('\n')) / 1024).toFixed(1)} KB`);

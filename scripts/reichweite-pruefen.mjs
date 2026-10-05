#!/usr/bin/env node
/**
 * REICHWEITEN-PRUEFUNG: ist jeder Knopf auf dem Handy per Scrollen erreichbar?
 * ───────────────────────────────────────────────────────────────────────────
 *
 * WOZU
 * Zweimal hat ein unscheinbares Stueck CSS eine Buchungsstrecke blockiert:
 *   - Probetraining: overflow-y: visible neben overflow-x: auto. Der Standard
 *     rechnet daraus overflow-y: auto, aus einem harmlosen Kasten wurde eine
 *     Scroll-Falle ohne Scrollweg.
 *   - Personal Training: ein iframe mit height: 100% in einem Wrapper mit
 *     overflow: hidden. iOS Safari ignoriert die Hoehe eines iframes und macht
 *     ihn so hoch wie seinen Inhalt - der Rest wurde abgeschnitten, und darin
 *     lag der Bezahlknopf.
 * Beides war am Schreibtisch unsichtbar und ist erst am Gerät aufgefallen,
 * beim Kunden. Diese Pruefung faengt die Fehlerklasse vorher.
 *
 * AUFRUF
 *   node scripts/reichweite-pruefen.mjs              # alle *.html im Projekt
 *   node scripts/reichweite-pruefen.mjs kurse.html   # nur bestimmte Seiten
 *   node scripts/reichweite-pruefen.mjs --breit      # zusaetzlich 1440px
 * Rueckgabewert 1, wenn etwas unerreichbar ist - damit laesst sich die
 * Pruefung vor einen Deploy haengen.
 *
 * VORAUSSETZUNG
 *   npm i -D playwright && npx playwright install chromium
 * Fehlt Playwright, sagt das Skript das und endet mit Code 2 (kein Fehlalarm).
 *
 *
 * WAS GEPRUEFT WIRD
 *
 * Teil 1 - unsere eigenen Knoepfe. Jeder wird ANGEFAHREN, nicht gerechnet: die
 *   Seite wird gescrollt, bis er im Bild liegt, dann wird an seiner Mitte
 *   elementFromPoint gefragt. Nur ein echter Treffer zaehlt. Damit faellt auch
 *   auf, wenn eine feste Leiste oder ein Overlay darueberliegt.
 *
 * Teil 2 - die Bsport-Widget-Container. Die Widgets selbst laden ohne
 *   Einwilligung nicht, ihre Kassenknoepfe sind also nicht direkt pruefbar.
 *   Stattdessen wird in jeden Container ein 1975px hoher Pruefkoerper mit
 *   einem Knopf am Ende gelegt - genau das, was eine Kasse tut - und derselbe
 *   Reichweitentest gefahren. Beim iframe wird die Hoehe zusaetzlich auf die
 *   Inhaltshoehe gesetzt, weil iOS Safari sich so verhaelt.
 *
 *
 * ACHT DINGE, DIE DIESE PRUEFUNG WISSEN MUSS
 * Sie stehen hier, weil jedes einzelne davon im ersten Entwurf eine
 * Falschmeldung erzeugt hat - zusammen 39 von 40 "Befunden" waren Messfehler:
 *  1. scroll-behavior: smooth. Ohne behavior: 'instant' werden Koordinaten
 *     mitten in der Animation gelesen, und JEDE Fassung gilt als kaputt.
 *  2. CSS-Uebergaenge. .sp-convbar hat transition auf transform, .faq-a eine
 *     auf max-height; zwei Frames nach dem Umschalten stehen sie noch halb
 *     ausserhalb. Animationen werden global abgeschaltet.
 *  3. .reveal startet mit opacity 0 und wird erst beim Scrollen eingeblendet.
 *  4. Akkordeons: .faq-a steht auf max-height: 0, und erst das Seiten-JS setzt
 *     beim Klick style.maxHeight. Die Klasse .open allein genuegt nicht.
 *  5. Modale: manche Seiten blenden mit .is-open ein, andere mit .open.
 *  6. Ein geoeffnetes position:fixed-Overlay verdeckt die ganze Seite - Seiten-
 *     knoepfe und Overlay-Inhalt muessen in GETRENNTEN Durchgaengen geprueft
 *     werden.
 *  7. Geschachtelte Scroller: ein Knopf im Modal wird nicht vom Fenster
 *     erreicht, sondern vom inneren Scroller. Der naechste scrollbare Vorfahr
 *     wird gescrollt; bei etwas Festem wird das Fenster gar nicht angefasst.
 *  8. Der iframe selbst hat overflow: clip von Haus aus, und <html> ist der
 *     Dokument-Scroller. Beide zaehlen nicht als klammernde Vorfahren.
 */

import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const HANDY = { width: 390, height: 844 };   /* iPhone 14 */
const BREIT = { width: 1440, height: 900 };

/* ── Playwright finden ──────────────────────────────────────────────────── */
async function chromiumHolen() {
  const wege = ['playwright', 'playwright-core',
                '/opt/node22/lib/node_modules/playwright/index.mjs'];
  for (const w of wege) {
    try { return (await import(w)).chromium; } catch { /* naechster */ }
  }
  console.error('Playwright nicht gefunden. Einmalig einrichten:');
  console.error('  npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

/* ── Kleiner Server fuer das Projektverzeichnis ─────────────────────────── */
const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.xml': 'application/xml' };

async function serverStarten() {
  const srv = createServer(async (req, res) => {
    const pfad = decodeURIComponent(req.url.split('?')[0]);
    /* Kein Ausbrechen aus dem Projektverzeichnis. */
    if (pfad.includes('..')) { res.writeHead(400); return res.end(); }
    try {
      const datei = join(WURZEL, pfad === '/' ? 'index.html' : pfad);
      const inhalt = await readFile(datei);
      res.writeHead(200, { 'content-type': TYPEN[extname(datei)] || 'application/octet-stream' });
      res.end(inhalt);
    } catch { res.writeHead(404); res.end('nicht gefunden'); }
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { srv, basis: `http://127.0.0.1:${srv.address().port}/` };
}

/* ── Die Pruefmechanik, laeuft IN der Seite ─────────────────────────────── */
const LOGIK = (overlayWahl) => {
  const warten = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const kurz = (e) => e ? e.tagName.toLowerCase() +
    (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : '') : 'nichts';

  const A = {
    warten, kurz,
    overlays: () => [...document.querySelectorAll(overlayWahl)],

    grundzustand() {
      /* Punkt 2 der Liste oben: ohne das wird mitten in Animationen gemessen. */
      if (!document.getElementById('__keineAnimation')) {
        const st = document.createElement('style');
        st.id = '__keineAnimation';
        st.textContent = '*,*::before,*::after{transition:none !important;animation:none !important;}';
        document.head.appendChild(st);
      }
      document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visible'));   /* Punkt 3 */
      document.querySelectorAll('.faq-item, [class*=accordion], details').forEach((e) => {
        e.classList.add('open');
        if (e.tagName === 'DETAILS') e.open = true;
      });
      /* Punkt 4: die Klasse setzt nur das Polster, die Hoehe setzt sonst das JS. */
      document.querySelectorAll('.faq-a, [class*=panel]').forEach((e) => {
        if (getComputedStyle(e).maxHeight !== 'none') e.style.maxHeight = 'none';
      });
      A.overlays().forEach((o) => A.schliessen(o));
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
    },

    /* Punkt 5: verschiedene Seiten benutzen verschiedene Klassen. */
    oeffnen(o) { o.classList.add('is-open', 'open', 'active', 'show'); o.setAttribute('aria-hidden', 'false'); },
    schliessen(o) { o.classList.remove('is-open', 'open', 'active', 'show'); o.setAttribute('aria-hidden', 'true'); },

    gerendert(el) {
      if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(el.tagName)) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    },
    imOverlay(el) { return A.overlays().find((o) => o.contains(el)) || null; },

    text(el) {
      const t = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
      return (t || el.tagName.toLowerCase()).slice(0, 46);
    },

    /* Punkt 8: nur Vorfahren DAZWISCHEN, und nur wenn sie wirklich kuerzer
       sind als ihr Inhalt. Ein overflow:hidden an einer Box, die alles
       umfasst, schneidet nichts ab. */
    klammern(el) {
      const out = [];
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        if (p.scrollHeight > p.clientHeight + 2) {
          const scrollbar = /(auto|scroll)/.test(cs.overflowY);
          out.push(`${kurz(p)} (${cs.overflowY}${scrollbar ? ', scrollbar' : ', KLAMMERT'}, ${p.clientHeight}<${p.scrollHeight})`);
        }
      }
      return out;
    },

    /* Punkt 7 */
    scroller(el) {
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 2) return p;
      }
      return null;
    },
    festerVorfahr(el) {
      for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
        if (getComputedStyle(p).position === 'fixed') return p;
      }
      return null;
    },

    async anfahren(el) {
      const h = window.innerHeight;
      const sc = A.scroller(el);
      const fest = A.festerVorfahr(el);
      /* Eine ausgeblendete feste Leiste (z. B. translateY(101%) plus das
         Attribut hidden) in den eingeblendeten Zustand bringen - und hinterher
         zuruecksetzen. */
      let merke = null;
      if (fest) {
        merke = { tf: fest.style.transform, hid: fest.hasAttribute('hidden') };
        fest.style.transform = 'none';
        if (merke.hid) fest.removeAttribute('hidden');
        await warten();
      }
      const zurueck = () => {
        if (!fest || !merke) return;
        fest.style.transform = merke.tf;
        if (merke.hid) fest.setAttribute('hidden', '');
      };

      let letzter = null;
      for (const anteil of [0.5, 0.75, 0.3]) {
        if (sc) {
          const sb = sc.getBoundingClientRect(), rb = el.getBoundingClientRect();
          sc.scrollTop = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight,
            sc.scrollTop + (rb.top - sb.top) - sb.height * anteil + rb.height / 2));
          await warten();
        }
        /* Punkt 1 und 7: instant, und bei etwas Festem gar kein Fensterscroll. */
        if (!fest) {
          const bezug = sc || el, rb2 = bezug.getBoundingClientRect();
          const max = document.documentElement.scrollHeight - h;
          window.scrollTo({ left: 0, behavior: 'instant', top: Math.max(0, Math.min(max,
            window.scrollY + rb2.top - h * (sc ? 0.5 : anteil) + Math.min(rb2.height, h) / 2)) });
          await warten();
        }
        const r = el.getBoundingClientRect();
        if (r.top < 0 || r.bottom > h || r.height < 1) { letzter = letzter || 'nie ganz im Bild'; continue; }
        const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (t && (t === el || el.contains(t) || t.contains(el))) {
          zurueck();
          return { erreichbar: true, beiY: Math.round(window.scrollY), scroller: sc ? kurz(sc) : null };
        }
        letzter = kurz(t);
      }
      zurueck();
      return { erreichbar: false, verdeckt: letzter, scroller: sc ? kurz(sc) : null };
    },

    knopfKandidaten(wurzel) {
      const m = new Set();
      wurzel.querySelectorAll('button, input[type=submit], [role=button]').forEach((e) => m.add(e));
      wurzel.querySelectorAll('a').forEach((e) => {
        const k = typeof e.className === 'string' ? e.className : '';
        if (/btn|cta|knopf|card-|trial|member|mitglied|buchen|-link\b/i.test(k)) { m.add(e); return; }
        /* Auch Links ohne sprechende Klasse, die wie eine Schaltflaeche aussehen. */
        const cs = getComputedStyle(e);
        const flaeche = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
        const rahmen = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0;
        if ((flaeche || rahmen) && parseFloat(cs.paddingTop) >= 6) m.add(e);
      });
      return [...m];
    },

    widgetContainer(wurzel) {
      return [...wurzel.querySelectorAll('[id^=bsport-widget-]'),
              ...wurzel.querySelectorAll('iframe[data-bsport-hoehe], iframe[data-bsport-srcdoc]')]
        .filter((c) => c.tagName === 'IFRAME' || A.gerendert(c));
    },

    async widgetPruefen(c) {
      const KASSE = '<div style="height:1900px;background:#eee"></div>'
                  + '<button id="__pk" style="height:56px;width:200px;margin:16px">KASSE</button>';
      if (c.tagName === 'IFRAME') {
        const d = c.contentDocument;
        if (!d) return { ziel: 'iframe', art: 'iframe', uebersprungen: 'contentDocument nicht lesbar' };
        d.open();
        d.write('<!DOCTYPE html><html><head><style>html,body{margin:0}</style></head><body>'
                + KASSE + '<div style="height:40px"></div></body></html>');
        d.close();
        const inhalt = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
        c.style.height = inhalt + 'px';     /* so verhaelt sich iOS Safari */
        await warten();
        const k = d.getElementById('__pk');
        const h = window.innerHeight, max = document.documentElement.scrollHeight - h;
        let erreichbar = false, beiY = null, verdeckt = null;
        for (const anteil of [0.5, 0.75, 0.3]) {
          const rb0 = c.getBoundingClientRect(), kb0 = k.getBoundingClientRect();
          window.scrollTo({ left: 0, behavior: 'instant',
            top: Math.max(0, Math.min(max, window.scrollY + rb0.top + kb0.top - h * anteil)) });
          await warten();
          const rb = c.getBoundingClientRect(), kb = k.getBoundingClientRect();
          const top = rb.top + kb.top;
          if (top < 0 || top + kb.height > h) { verdeckt = verdeckt || 'nie ganz im Bild'; continue; }
          const t = document.elementFromPoint(rb.left + kb.left + kb.width / 2, top + kb.height / 2);
          if (t === c) { erreichbar = true; beiY = Math.round(window.scrollY); break; }
          verdeckt = kurz(t);
        }
        return { ziel: 'iframe', art: 'iframe', inhalt, erreichbar, beiY, verdeckt, klammern: A.klammern(c) };
      }
      const probe = document.createElement('div');
      probe.innerHTML = KASSE;
      c.appendChild(probe);
      await warten();
      const k = document.getElementById('__pk');
      const r = await A.anfahren(k);
      const kl = A.klammern(k);
      probe.remove();
      return { ziel: c.id, art: 'inline', inhalt: 1975, ...r, klammern: kl };
    },
  };
  window.__reichweite = A;
};

/* ── Eine Seite pruefen ─────────────────────────────────────────────────── */
const OVERLAY_WAHL = '.bsport-modal-overlay, [role=dialog], .modal-overlay, [class*=modal][class*=overlay]';

async function seitePruefen(browser, basis, datei, viewport) {
  const page = await browser.newPage({ viewport });
  const jsFehler = [];
  page.on('pageerror', (e) => jsFehler.push(e.message.slice(0, 110)));
  /* Nichts Externes laden: deterministisch, offline, und ohne Tracker. */
  await page.route('**/*', (r) => r.request().url().startsWith(basis) ? r.continue() : r.abort());
  try { await page.goto(basis + datei, { waitUntil: 'domcontentloaded' }); }
  catch (e) { await page.close(); return { datei, ladefehler: e.message }; }
  await page.waitForTimeout(450);
  await page.evaluate(LOGIK, OVERLAY_WAHL);

  const erg = await page.evaluate(async () => {
    const A = window.__reichweite;
    A.grundzustand();
    await A.warten();

    /* Durchgang 1: Normalzustand, alle Overlays zu. */
    const seite = [];
    for (const el of A.knopfKandidaten(document)) {
      if (A.imOverlay(el)) continue;                       /* Punkt 6 */
      /* Nicht gerendert = nicht pruefbar, und das ist richtig so: die
         geschlossene Mobil-Navigation ist eine position:fixed-Schublade mit
         acht Links darin. Wer sie hier mitnimmt, bekommt auf jeder Seite acht
         Falschmeldungen - dieser eine Zusatz hat in der Portierung aus 1
         Befund 214 gemacht. Eine ausgeblendete feste LEISTE hat dagegen
         weiterhin eine Geometrie (transform verschiebt nur) und wird von
         anfahren() korrekt eingeblendet. */
      if (!A.gerendert(el)) continue;
      seite.push({ text: A.text(el), ...(await A.anfahren(el)), klammern: A.klammern(el) });
    }
    const widgets = [];
    for (const c of A.widgetContainer(document)) {
      if (!A.imOverlay(c)) widgets.push(await A.widgetPruefen(c));
    }

    /* Durchgang 2: je Overlay einzeln - ein offenes Overlay verdeckt sonst
       alles dahinter und erzeugt lauter Scheinbefunde. */
    const overlays = [];
    const alleOverlays = A.overlays();
    for (const o of alleOverlays) {
      /* Nur EIN Overlay zur Zeit - so verhaelt sich die Seite auch. Ohne diese
         Isolierung liegen Geschwister-Overlays weiter bei inset: 0 im Layout;
         #family-modal und #corporate-modal sind optische Zwillinge und teilen
         die Klasse .family-modal-close, ihre Schliessen-Knoepfe liegen also an
         identischer Stelle. Der Trefferpunkt landete dann auf dem Knopf des
         ANDEREN Modals und meldete einen Fehler, den kein Besucher haben kann. */
      const versteckt = [];
      for (const x of alleOverlays) {
        if (x === o || x.contains(o) || o.contains(x)) continue;
        versteckt.push([x, x.style.display]);
        x.style.display = 'none';
      }
      A.oeffnen(o);
      await A.warten();
      window.scrollTo({ top: 0, behavior: 'instant' });
      await A.warten();
      /* Haelt das Overlay seinen geoeffneten Zustand? Wenn nicht, ist mein
         Testzustand falsch - nicht die Seite. Dann nicht bewerten. */
      const sichtbar = getComputedStyle(o).display !== 'none' && o.getBoundingClientRect().height > 1;
      const knoepfe = [], w = [];
      for (const el of A.knopfKandidaten(o)) {
        if (!A.gerendert(el)) continue;
        const r = await A.anfahren(el);
        knoepfe.push({ text: A.text(el), ...r, klammern: A.klammern(el), fraglich: !r.erreichbar && !sichtbar });
      }
      for (const c of A.widgetContainer(o)) {
        const x = await A.widgetPruefen(c);
        w.push({ ...x, fraglich: x.erreichbar === false && !sichtbar });
      }
      A.schliessen(o);
      versteckt.forEach(([x, d]) => { x.style.display = d; });
      await A.warten();
      overlays.push({ name: o.id || A.kurz(o), knoepfe, widgets: w });
    }
    return { seite, widgets, overlays };
  });

  await page.close();
  return { datei, ...erg, jsFehler };
}

/* ── Hauptlauf ──────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('node scripts/reichweite-pruefen.mjs [seite.html …] [--breit]');
  process.exit(0);
}
const auchBreit = argv.includes('--breit');
let seiten = argv.filter((a) => !a.startsWith('-'));
if (!seiten.length) {
  seiten = (await readdir(WURZEL)).filter((f) => f.endsWith('.html')).sort();
}

const chromium = await chromiumHolen();
const { srv, basis } = await serverStarten();
const browser = await chromium.launch();

let befunde = 0, knoepfe = 0, container = 0;
for (const viewport of auchBreit ? [HANDY, BREIT] : [HANDY]) {
  console.log(`\n━━━ ${viewport.width}×${viewport.height} ━━━`);
  for (const datei of seiten) {
    const s = await seitePruefen(browser, basis, datei, viewport);
    if (s.ladefehler) { console.log(`✗  ${datei}: laedt nicht - ${s.ladefehler}`); befunde++; continue; }

    const zeilen = [];
    const knopf = (b, pre) => {
      if (!b.erreichbar && b.fraglich) {
        zeilen.push(`${pre}?  "${b.text}" - Overlay liess sich im Test nicht sichtbar schalten, nicht bewertbar`);
        return;
      }
      if (b.erreichbar) {
        if (b.klammern.some((k) => k.includes('KLAMMERT'))) {
          zeilen.push(`${pre}~  "${b.text}" erreichbar, aber in klammerndem Kasten: ${b.klammern.join(' | ')}`);
        }
        return;
      }
      befunde++;
      zeilen.push(`${pre}✗  NICHT ERREICHBAR  "${b.text}"  (verdeckt von ${b.verdeckt}${b.scroller ? `, Scroller ${b.scroller}` : ''})`);
      if (b.klammern.length) zeilen.push(`${pre}     klammernd: ${b.klammern.join(' | ')}`);
    };
    const widget = (b, pre) => {
      if (b.uebersprungen) { zeilen.push(`${pre}?  Widget ${b.ziel}: ${b.uebersprungen}`); return; }
      if (b.erreichbar === false && b.fraglich) {
        zeilen.push(`${pre}?  Widget ${b.ziel}: Overlay nicht sichtbar schaltbar, nicht bewertbar`); return;
      }
      if (b.erreichbar) {
        zeilen.push(`${pre}✓  Widget ${b.ziel} (${b.art}, ${b.inhalt}px): Kassenknopf erreichbar bei y=${b.beiY}${b.scroller ? ` über ${b.scroller}` : ''}`);
        return;
      }
      befunde++;
      zeilen.push(`${pre}✗  Widget ${b.ziel} (${b.art}, ${b.inhalt}px): KASSENKNOPF NICHT ERREICHBAR, verdeckt von ${b.verdeckt}`);
      if (b.klammern.length) zeilen.push(`${pre}     klammernd: ${b.klammern.join(' | ')}`);
    };

    s.seite.forEach((b) => knopf(b, '      '));
    s.widgets.forEach((b) => widget(b, '      '));
    for (const o of s.overlays) {
      const vorher = zeilen.length;
      o.knoepfe.forEach((b) => knopf(b, '         '));
      o.widgets.forEach((b) => widget(b, '         '));
      if (zeilen.length > vorher) zeilen.splice(vorher, 0, `      ↳ Overlay "${o.name}"`);
    }

    knoepfe += s.seite.length + s.overlays.reduce((n, o) => n + o.knoepfe.length, 0);
    container += s.widgets.length + s.overlays.reduce((n, o) => n + o.widgets.length, 0);
    const schlimm = zeilen.some((z) => z.includes('✗'));
    console.log(`${schlimm ? '!!' : 'ok'}  ${datei.padEnd(40)} ${String(s.seite.length).padStart(3)} Knöpfe`);
    zeilen.forEach((z) => console.log(z));
    if (s.jsFehler.length) console.log(`      JS-Fehler: ${s.jsFehler.slice(0, 2).join(' / ')}`);
  }
}

await browser.close();
srv.close();
console.log(`\n═══ ${knoepfe} Knöpfe, ${container} Widget-Container · ${befunde} Befund(e)`);
if (befunde) {
  console.log('\nEin "✗" heißt: dieser Knopf ist durch Scrollen nicht zu erreichen.');
  console.log('Erster Blick: hat ein Vorfahr overflow: hidden mit fester Höhe?');
}
process.exit(befunde ? 1 : 0);

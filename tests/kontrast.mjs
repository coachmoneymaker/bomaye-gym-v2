/* Lesbarkeit und Touch-Verhalten nach dem Design-Audit (November 2026).
 *
 *   node tests/kontrast.mjs                  gegen den Arbeitsstand
 *   node tests/kontrast.mjs /pfad/zu/main    gegen einen anderen Baum
 *
 * WORUM ES GEHT
 * Ein Audit nach den Regeln der Design-Skills (impeccable, Emil Kowalski,
 * taste-skill) hat auf der Startseite 71 Textstellen unter WCAG AA
 * gefunden, darunter einen Satz, der Creme auf Creme stand und damit
 * unsichtbar war, und das Kleingedruckte der Preiskarten mit 2,9:1.
 * Dazu Knoepfe, die auf dem Handy nach dem Tippen angehoben stehen
 * bleiben. Diese Suite haelt das fest.
 *
 *   A  Jeder Text auf einfarbigem Grund erreicht 4,5:1 (gross 3:1),
 *      Startseite bei 320, 390 und 430 px, dazu der Footer jeder Seite.
 *
 * STAND NACH PREMIUM v3 (PR #206)
 * Die Premium-Ebene (premium.css, nur mit <html class="pr">) hat auf
 * ihren drei Seiten den groessten Teil schon geloest. Diese Suite prueft
 * das Ergebnis, egal aus welcher Datei die Farbe kommt.
 *   B  Der Satz unter ALLE PROGRAMME ist lesbar.
 *   C  Auf Touchgeraeten bleibt ein Knopf nach dem Tippen nicht
 *      angehoben stehen; mit Maus hebt er sich weiter.
 *   D  Kein Inline-JavaScript fuer Hover, kein "transition: all".
 *   E  Markierter Text traegt die Markenfarben.
 *   F  Die helle Anfragekarte auf /corporate-boxing (320/390/430 px).
 *   G  Etiketten und Umriss-Knoepfe in hellen Abschnitten.
 *   H  Die Seiten ausserhalb der Premium-Ebene, die das Audit vom
 *      7.11.2026 mit kleiner Gold- und Grauschrift unter AA gefunden hat
 *      (/about, /coaches, /kurse, /stundenplan, /mitgliederbereich,
 *      /preise, /faq): jeder Text bei 320, 390 und 430 px.
 *   I  /coaches: die Instagram- und TikTok-Symbole erreichen als
 *      Bedienelement 3:1 gegen ihren Grund (WCAG 1.4.11).
 *   J  Kleine Schrift auf Fotos (Nummer ueber dem Kurstitel auf /kurse,
 *      Angaben im Coachfoto auf /coaches): gemessen gegen die echten
 *      Bildpunkte hinter der Schrift, nicht gegen eine Farbe.
 *
 * AUSGENOMMEN
 * Text, der auf einem Foto steht (die Programmkarten der Startseite, der
 * Hero), in A und H. Dort entscheidet das Bild, nicht die Farbe darunter;
 * wo es kleine Schrift ist, misst J die Bildpunkte.
 * Abgeschaltete Knoepfe ([disabled]): WCAG nimmt inaktive Bedienelemente
 * aus. Das betrifft den Knopf "Einwilligungsdialog wird geladen", der im
 * Test stehen bleibt, weil Cookiebot hier nicht laedt.
 */
import {
  chromiumHolen, wurzelBestimmen, serverStarten, zaehler,
} from './gemeinsam.mjs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const chromium = await chromiumHolen();
const wurzel = wurzelBestimmen();
const { srv, basis } = await serverStarten(wurzel);
const browser = await chromium.launch();
const { pruef, abschluss } = zaehler();

console.log('Baum: ' + wurzel + '\n');

/* Ohne Cookiebot und bsport: fuer Farben braucht es beides nicht. */
async function laden(pfad, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts });
  const page = await ctx.newPage();
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(basis)) return route.continue();
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  await page.goto(basis + pfad, { waitUntil: 'load' });
  /* Einmal durchscrollen, damit die Einblendungen durch sind. */
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
  return { ctx, page };
}

/* Misst alle sichtbaren Textstellen in `bereich`. Gibt die Verstoesse
   zurueck. Hintergrund: der erste deckende Farbgrund nach aussen; steht
   ein Bild oder Verlauf im Weg, wird die Stelle uebersprungen. */
function messen(bereich) {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mix = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
  const AUF_FOTO = '.disc-panel, .hero, #hero, .vfacade, .dna-visual, .coach-full-photo';
  function sichtbar(el) {
    let deck = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      deck *= Number(s.opacity);
    }
    const r = el.getBoundingClientRect();
    return deck > 0.05 && r.width > 0 && r.height > 0;
  }
  function grund(el) {
    const schichten = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== 'none') return null;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) { schichten.push(c); if (c.a >= 1) break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = schichten.length - 1; i >= 0; i--) bg = mix(schichten[i], bg);
    return bg;
  }
  /* Deckkraft der Vorfahren wirkt auf die Schrift wie auf ihren Grund;
     innerhalb desselben Grundes zaehlt nur die Deckkraft bis dorthin. */
  function deckkraftBisGrund(el) {
    let d = 1;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      d *= Number(s.opacity);
      const c = parse(s.backgroundColor);
      if (c && c.a >= 1) break;
    }
    return d;
  }
  const raus = [];
  const gesehen = new Set();
  const root = document.querySelector(bereich);
  if (!root) return [{ fehlt: bereich }];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = w.currentNode;
    if (!t.textContent.trim()) continue;
    const el = t.parentElement;
    if (gesehen.has(el)) continue;
    gesehen.add(el);
    if (el.closest('script, style, noscript, [aria-hidden="true"], #booking-modal, #family-modal, .slot-modal, ' + AUF_FOTO)) continue;
    if (el.closest('[disabled]')) continue;
    if (!sichtbar(el)) continue;
    const bg = grund(el);
    if (!bg) continue;
    const s = getComputedStyle(el);
    const fg = parse(s.color);
    const vorne = mix({ ...fg, a: fg.a * deckkraftBisGrund(el) }, bg);
    const r = ratio(vorne, bg);
    const px = parseFloat(s.fontSize);
    const gross = px >= 24 || (px >= 18.66 && Number(s.fontWeight) >= 700);
    const soll = gross ? 3 : 4.5;
    if (r < soll) raus.push(`${r.toFixed(2)}:1 statt ${soll}:1, ${px}px "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}"`);
  }
  return raus;
}

/* ─── A  Kontrast ─────────────────────────────────────────────── */
for (const breite of [320, 390, 430]) {
  const { ctx, page } = await laden('', { viewport: { width: breite, height: 844 } });
  const raus = await page.evaluate(messen, 'body');
  pruef(`A  Startseite ${breite}px: jeder Text auf Farbgrund erreicht WCAG AA`,
        raus.length === 0, raus.length ? '\n     ' + raus.join('\n     ') : '');
  await ctx.close();
}
/* Der Footer auf jeder Seite, die ihn hat. Die drei Premium-Seiten
   (index, probetraining, mitglied-werden) bekommen ihre Footerfarben aus
   premium.css, alle anderen aus style.css und den Inline-Stilen.
   /mitgliederbereich hat einen eigenen Footer (.mw-footer); bis zum
   7.11.2026 war er hier ausgenommen (schwaechste Stelle 1,58:1). */
{
  const seiten = (await readdir(wurzel)).filter((d) => d.endsWith('.html')).sort();
  for (const d of seiten) {
    const pfad = d === 'index.html' ? '' : d.replace(/\.html$/, '');
    const { ctx, page } = await laden(pfad);
    const hat = await page.evaluate(() => !!document.querySelector('footer'));
    if (hat) {
      const raus = await page.evaluate(messen, 'footer');
      pruef(`A  /${pfad}: Footer erreicht WCAG AA`, raus.length === 0,
            raus.length ? '\n     ' + raus.join('\n     ') : '');
    }
    await ctx.close();
  }
}

/* ─── H  Seiten ausserhalb der Premium-Ebene, ganze Seite ───────── */
/* ─── I  Social-Symbole auf /coaches ─────────────────────────────── */
/* ─── J  Kleine Schrift auf Fotos, gegen die Bildpunkte ──────────── */

/* Kontrast eines Symbols (Bedienelement, kein Text): seine Farbe gegen
   den ersten deckenden Grund. Soll 3:1. */
function symbolKontrast(sel) {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const mix = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
  return [...document.querySelectorAll(sel)].filter((a) => a.getBoundingClientRect().width > 0).map((a) => {
    let bg = null;
    for (let e = a; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a >= 1) { bg = c; break; } }
    bg = bg || { r: 255, g: 255, b: 255, a: 1 };
    const fg = mix(parse(getComputedStyle(a.querySelector('svg') || a).color), bg);
    const x = lum(fg), y = lum(bg);
    return { name: a.getAttribute('aria-label'), r: (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) };
  });
}

/* Misst Schrift auf einem Foto: Schrift kurz unsichtbar machen, die Flaeche
   hinter ihr abfotografieren und jeden Bildpunkt gegen die Schriftfarbe
   rechnen. Massgeblich ist der Bildpunkt beim 95. Perzentil der Helligkeit:
   einzelne Glanzlichter zaehlen nicht, eine helle Bildzone schon. */
async function aufFotoMessen(page, el) {
  await el.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center' }));
  await page.waitForTimeout(500);
  const farbe = await el.evaluate((e) => {
    const s = getComputedStyle(e);
    const farbe = s.color;
    let d = 1;
    for (let x = e; x && x !== document.documentElement; x = x.parentElement) d *= Number(getComputedStyle(x).opacity);
    e.dataset.vorher = e.style.cssText;
    e.style.setProperty('color', 'transparent', 'important');
    e.style.setProperty('text-shadow', 'none', 'important');
    return { farbe, deck: d };
  });
  await page.waitForTimeout(50);
  const bild = (await el.screenshot()).toString('base64');
  await el.evaluate((e) => { e.style.cssText = e.dataset.vorher; delete e.dataset.vorher; });
  return page.evaluate(async ({ bild, farbe }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + bild;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, c.width, c.height).data;
    const m = farbe.farbe.match(/rgba?\(([^)]+)\)/)[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    const a = (m.length > 3 ? m[3] : 1) * farbe.deck;
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (r, gg, b) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
    const werte = [];
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], gg = px[i + 1], b = px[i + 2];
      const fr = m[0] * a + r * (1 - a), fg = m[1] * a + gg * (1 - a), fb = m[2] * a + b * (1 - a);
      const x = lum(fr, fg, fb), y = lum(r, gg, b);
      werte.push({ hell: y, r: (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) });
    }
    werte.sort((p, q) => p.hell - q.hell);
    return werte[Math.min(werte.length - 1, Math.floor(werte.length * 0.95))].r;
  }, { bild, farbe });
}

const AUSSERHALB_PREMIUM = ['about', 'coaches', 'kurse', 'stundenplan', 'mitgliederbereich', 'preise', 'faq'];
for (const pfad of AUSSERHALB_PREMIUM) {
  for (const breite of [320, 390, 430]) {
    const { ctx, page } = await laden(pfad, { viewport: { width: breite, height: 844 } });
    const raus = await page.evaluate(messen, 'body');
    pruef(`H  /${pfad} ${breite}px: jeder Text auf Farbgrund erreicht WCAG AA`,
          raus.length === 0, raus.length ? '\n     ' + raus.join('\n     ') : '');

    if (pfad === 'coaches') {
      const sym = await page.evaluate(symbolKontrast, '.coach-social-link');
      const schwach = sym.filter((s) => s.r < 3);
      pruef(`I  /coaches ${breite}px: ${sym.length} Social-Symbole erreichen 3:1`
            + (sym.length ? ` (schwaechstes ${Math.min(...sym.map((s) => s.r)).toFixed(2)}:1)` : ''),
            sym.length >= 5 && schwach.length === 0,
            schwach.map((s) => `${s.name} ${s.r.toFixed(2)}:1`).join(', '));
    }

    const fotoSel = { kurse: '.carousel-card__num', coaches: '.coach-full-cred' }[pfad];
    if (fotoSel) {
      const els = await page.locator(fotoSel).all();
      const werte = [];
      for (const el of els) if (await el.isVisible()) werte.push(await aufFotoMessen(page, el));
      const min = werte.length ? Math.min(...werte) : 0;
      pruef(`J  /${pfad} ${breite}px: ${werte.length}x ${fotoSel} auf dem Foto erreicht 4,5:1`
            + ` (schwaechste ${min.toFixed(2)}:1)`, werte.length > 0 && min >= 4.5,
            werte.map((w) => w.toFixed(2)).join(' '));
    }
    await ctx.close();
  }
}

/* ─── B  Der Satz unter ALLE PROGRAMME ──────────────────────────── */
{
  const { ctx, page } = await laden('');
  const raus = await page.evaluate(messen, '#disciplines .disciplines-cta');
  const text = await page.locator('#disciplines .disciplines-cta p').innerText();
  pruef('B  "Du suchst ein bestimmtes Thema?" steht da', /Du suchst ein bestimmtes Thema\?/.test(text));
  pruef('B  ... und ist lesbar (samt Link)', raus.length === 0, raus.join('; '));
  await ctx.close();
}

/* ─── F  Helle Karte im dunklen Abschnitt: Corporate-Formular ──────
   Die Anfragekarte auf /corporate-boxing ist hell (#faf9f6), der
   Abschnitt drumherum dunkel. Die Creme-Regeln des Abschnitts schlugen
   die Formularfarben: Ueberschrift 1,08:1, Einleitung und Hinweise
   1,05:1. Gemessen wird jede Textstelle in der Karte. */
for (const breite of [320, 390, 430]) {
  const { ctx, page } = await laden('corporate-boxing', { viewport: { width: breite, height: 844 } });
  const raus = await page.evaluate(messen, '.cb-anfrage__panel');
  const zahl = await page.evaluate(() => document.querySelectorAll('.cb-anfrage__panel label, .cb-anfrage__panel p, .cb-anfrage__panel h2').length);
  pruef(`F  /corporate-boxing ${breite}px: jeder Text in der Anfragekarte erreicht WCAG AA`,
        raus.length === 0 && zahl > 10, raus.length ? '\n     ' + raus.join('\n     ') : `${zahl} Elemente`);
  await ctx.close();
}

/* ─── G  Creme-Schrift in hellen Abschnitten ────────────────────────
   Etiketten und Umriss-Knoepfe, die fuer dunklen Grund gebaut sind und
   in einem hellen Abschnitt standen: unsichtbar (1,0:1). */
const HELL = [
  ['boxen-muenchen', '.seo-section--light span.tag', 'FÜR WEN'],
  ['kinderboxen-muenchen', '.seo-section--light span.tag', 'FÜR ELTERN'],
  ['frauenboxen-muenchen', '.seo-section--light a.btn[href="/stundenplan"]', 'ZUM STUNDENPLAN'],
  ['kickboxen-muenchen', '.seo-section--light a.btn[href="/probetraining"]', 'PROBETRAINING'],
];
for (const [pfad, sel, text] of HELL) {
  const { ctx, page } = await laden(pfad);
  const da = await page.evaluate(([sel, text]) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(text));
    if (!el) return false;
    el.setAttribute('data-kontrast-pruef', '');
    return true;
  }, [sel, text]);
  const raus = da ? await page.evaluate(messen, '[data-kontrast-pruef]') : ['fehlt: ' + sel];
  pruef(`G  /${pfad}: "${text}" im hellen Abschnitt lesbar`, da && raus.length === 0, raus.join('; '));
  await ctx.close();
}

/* ─── C  Hover auf Touch und Maus ─────────────────────────────── */
/* Eine CDP-Sitzung je Seite: eine zweite wuerde die Knotennummern der
   ersten ungueltig machen. */
const sitzungen = new WeakMap();
async function hoverTransform(page, sel) {
  let cdp = sitzungen.get(page);
  if (!cdp) {
    cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    sitzungen.set(page, cdp);
  }
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
  if (!nodeId) return 'fehlt: ' + sel;
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
  await page.waitForTimeout(700);
  return page.evaluate((s) => getComputedStyle(document.querySelector(s)).transform, sel);
}
const KNOPF = '#disciplines .disciplines-cta .btn--gold';
{
  const { ctx, page } = await laden('', { hasTouch: true, isMobile: true });
  const keinHover = await page.evaluate(() => matchMedia('(hover: none)').matches);
  pruef('C  Touch-Emulation meldet (hover: none)', keinHover);
  const t = await hoverTransform(page, KNOPF);
  pruef('C  Touch: Knopf bleibt nach dem Tippen nicht angehoben', t === 'none', t);
  const eb = await hoverTransform(page, '#early-bird .eb-cta');
  pruef('C  Touch: Early-Bird-Knopf ebenso', eb === 'none', eb);
  await ctx.close();
}
{
  const { ctx, page } = await laden('', { viewport: { width: 1280, height: 900 } });
  const t = await hoverTransform(page, KNOPF);
  pruef('C  Maus: derselbe Knopf hebt sich weiter', t !== 'none' && !t.startsWith('fehlt'), t);
  const eb = await hoverTransform(page, '#early-bird .eb-cta');
  pruef('C  Maus: Early-Bird-Knopf hebt sich', eb !== 'none' && !eb.startsWith('fehlt'), eb);
  const ebFarbe = await page.evaluate(() => { const e = document.querySelector('#early-bird .eb-cta'); return e ? getComputedStyle(e).backgroundColor : 'fehlt'; });
  pruef('C  Maus: Early-Bird-Knopf bleibt beim Ueberfahren gold (verschwindet nicht im Schwarz)',
        ebFarbe !== 'rgb(10, 10, 8)' && ebFarbe !== 'fehlt', ebFarbe);
  await ctx.close();
}

/* ─── D  Kein Inline-Hover, kein transition: all ─────────────── */
{
  const seiten = (await readdir(wurzel)).filter((d) => d.endsWith('.html'));
  const mitHandler = [];
  for (const d of seiten) {
    const html = await readFile(join(wurzel, d), 'utf8');
    if (/\son(mouseover|mouseout|mouseenter|mouseleave)=/i.test(html)) mitHandler.push(d);
  }
  pruef('D  keine Seite steuert Hover ueber onmouseover/onmouseout', mitHandler.length === 0, mitHandler.join(', '));

  const { ctx, page } = await laden('');
  const alle = await page.evaluate(() => {
    const raus = [];
    const lauf = (liste) => {
      for (const r of liste) {
        if (r.cssRules && !r.selectorText) { lauf(r.cssRules); continue; }
        if (!r.style) continue;
        const t = r.style.getPropertyValue('transition') || r.style.getPropertyValue('transition-property');
        if (/(^|[\s,])all(\s|,|$)/.test(t)) raus.push(r.selectorText);
      }
    };
    for (const sh of document.styleSheets) { try { lauf(sh.cssRules); } catch (e) { /* fremd */ } }
    return raus;
  });
  pruef('D  Startseite: keine Regel mit "transition: all"', alle.length === 0, alle.join(', '));

/* ─── E  Markierung ───────────────────────────────────────────── */
  const sel = await page.evaluate(() => {
    const p = document.querySelector('#dna p');
    const s = getComputedStyle(p, '::selection');
    return s.backgroundColor;
  });
  pruef('E  markierter Text in Markengold', sel === 'rgb(201, 168, 76)', sel);
  await ctx.close();
}

await browser.close();
srv.close();
process.exit(abschluss() ? 1 : 0);

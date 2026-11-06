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
 *      Startseite bei 320, 390 und 430 px, dazu der Footer von /preise.
 *   B  Der Satz unter ALLE PROGRAMME ist lesbar.
 *   C  Auf Touchgeraeten bleibt ein Knopf nach dem Tippen nicht
 *      angehoben stehen; mit Maus hebt er sich weiter.
 *   D  Kein Inline-JavaScript fuer Hover, kein "transition: all".
 *   E  Markierter Text traegt die Markenfarben.
 *
 * AUSGENOMMEN
 * Text, der auf einem Foto steht (die Programmkarten, der Hero). Dort
 * entscheidet das Bild, nicht die Farbe darunter; das wird per Auge
 * geprueft, nicht hier.
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
  const AUF_FOTO = '.disc-panel, .hero, #hero, .vfacade, .dna-visual';
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
{
  const { ctx, page } = await laden('preise');
  const raus = await page.evaluate(messen, 'footer');
  pruef('A  /preise: Footer erreicht WCAG AA', raus.length === 0,
        raus.length ? '\n     ' + raus.join('\n     ') : '');
  await ctx.close();
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

/* Die Sticky-Buchungsleiste am Handy.
 *
 *   node tests/sticky.mjs                  gegen den Arbeitsstand
 *   node tests/sticky.mjs /pfad/zu/main    gegen einen anderen Baum
 *
 * Geprueft wird:
 *   A  Oben nicht da, nach dem Preisblock da, in der Abschluss-Sektion
 *      wieder weg.
 *   B  Am Schreibtisch nie.
 *   C  Auf den ausgeschlossenen Seiten gar nicht.
 *   D  Stumm, solange ein Dialog offen ist oder ein Feld den Fokus hat.
 *   E  Das Kreuz haelt die Sitzung durch, auch ueber ein Neuladen.
 *   F  Tippflaechen, Aussehen, kein Ueberlappen von Fusstext und
 *      Cookiebot-Abzeichen, kein waagerechtes Schieben.
 *   G  Ohne Bewegung (prefers-reduced-motion) und ohne sessionStorage.
 *   H  Der Klick fuehrt auf /probetraining.
 */
import {
  chromiumHolen, wurzelBestimmen, serverStarten, zaehler,
  seiteOeffnen, STAND_ALLES,
} from './gemeinsam.mjs';

const chromium = await chromiumHolen();
const wurzel = wurzelBestimmen();
const { srv, basis } = await serverStarten(wurzel);
const browser = await chromium.launch();
const { pruef, abschluss } = zaehler();

console.log('Baum: ' + wurzel + '\n');

const MIT = ['index.html', 'preise.html', 'kurse.html', 'about.html', 'coaches.html',
             'boxen-lernen-muenchen.html', 'boxen-muenchen.html', 'boxgym-muenchen.html',
             'boxtraining-muenchen.html', 'fitnessboxen-muenchen.html',
             'frauenboxen-muenchen.html', 'kickboxen-muenchen.html',
             'kinderboxen-muenchen.html'];
const OHNE = ['probetraining.html', 'mitglied-werden.html', 'stundenplan.html',
              'wochenplan.html', 'mitgliederbereich.html', 'downloads.html', 'faq.html',
              'impressum.html', 'datenschutz.html', 'agb.html', 'hausordnung.html',
              'u18.html'];

const OPT = { stand: STAND_ALLES, sperre: false, spaet: false, warten: 1500 };

async function zustand(page) {
  return page.evaluate(() => {
    const l = document.getElementById('sticky-buchung');
    if (!l) return { da: false };
    const cs = getComputedStyle(l);
    const r = l.getBoundingClientRect();
    const k = l.querySelector('.sticky-buchung__knopf');
    const x = l.querySelector('.sticky-buchung__zu');
    const kr = k ? k.getBoundingClientRect() : null;
    const xr = x ? x.getBoundingClientRect() : null;
    return {
      da: true,
      sichtbar: l.classList.contains('ist-sichtbar') && cs.display !== 'none'
                && parseFloat(cs.opacity) > 0.5,
      anzeige: cs.display,
      deckkraft: cs.opacity,
      hintergrund: cs.backgroundColor,
      randOben: cs.borderTopWidth + ' ' + cs.borderTopColor,
      hoehe: Math.round(r.height),
      unten: Math.round(r.bottom),
      knopfText: k ? k.textContent.trim() : null,
      knopfZiel: k ? k.getAttribute('href') : null,
      knopfH: kr ? Math.round(kr.height) : 0,
      xB: xr ? Math.round(xr.width) : 0,
      xH: xr ? Math.round(xr.height) : 0,
      uebergang: cs.transitionDuration,
      datenAttribute: k ? [...k.attributes].map((a) => a.name).filter((n) => n.indexOf('data-') === 0) : [],
    };
  });
}

/* EINE STELLE SUCHEN, AN DER DIE LEISTE STEHEN DARF

   Eine feste Position taugt nicht: auf der Startseite folgt direkt hinter
   dem Preisblock schon die Abschluss-Sektion, auf /kurse liegt dort der
   Buchungsbereich. Beides sind Gruende, die Leiste zu verbergen, und beide
   sind richtig. Der Test sucht deshalb ab der Unterkante des Ankers in
   Schritten nach der ersten Stelle, an der die Leiste erscheint, und sagt
   im Fehlerfall, wo er ueberall war. */
async function hinterDenPreisblock(page) {
  const start = await page.evaluate(() => {
    const ab = document.querySelector('[data-sticky-ab]');
    return Math.round(ab.getBoundingClientRect().bottom + window.scrollY + 8);
  });
  const hoehe = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  const schritt = await page.evaluate(() => Math.round(window.innerHeight * 0.5));
  const besucht = [];
  for (let y = start; y <= hoehe; y += schritt) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(450);
    const sichtbar = await page.evaluate(() => {
      const l = document.getElementById('sticky-buchung');
      return !!l && l.classList.contains('ist-sichtbar');
    });
    besucht.push(y + (sichtbar ? '*' : ''));
    if (sichtbar) return { gefunden: true, y, besucht };
  }
  return { gefunden: false, besucht };
}

async function zumAbschluss(page) {
  await page.evaluate(() => {
    const aus = document.querySelector('[data-sticky-aus]');
    if (aus) aus.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await page.waitForTimeout(900);
}

/* ═══════════ A. Der Ablauf auf allen eingeschlossenen Seiten ═══════════ */
console.log('── A. Oben weg, nach dem Anker da, im Abschluss wieder weg (390x844) ──');
for (const pfad of MIT) {
  const { ctx, page, logs } = await seiteOeffnen(browser, basis, pfad, { ...OPT, breite: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  const name = pfad.replace('.html', '');

  let z = await zustand(page);
  pruef(name + ': oben nicht sichtbar', z.da && !z.sichtbar,
        z.da ? 'Deckkraft ' + z.deckkraft : 'Leiste fehlt ganz');

  const stelle = await hinterDenPreisblock(page);
  z = await zustand(page);
  pruef(name + ': nach dem Anker sichtbar', z.sichtbar === true,
        stelle.gefunden ? 'ab y=' + stelle.y
                        : 'nirgends sichtbar, geprueft bei ' + stelle.besucht.join(', '));

  await zumAbschluss(page);
  z = await zustand(page);
  pruef(name + ': im Abschluss wieder weg', z.sichtbar === false, 'Deckkraft ' + z.deckkraft);

  pruef(name + ': keine Fehler', logs.filter((l) => /ERROR/.test(l)).length === 0,
        JSON.stringify(logs.filter((l) => /ERROR/.test(l))).slice(0, 140));
  await ctx.close();
}

/* ═══════════ B. Am Schreibtisch nie ═══════════ */
console.log('\n── B. 1440x900: niemals ──');
for (const pfad of ['index.html', 'preise.html', 'kurse.html']) {
  const { ctx, page } = await seiteOeffnen(browser, basis, pfad, { ...OPT, breite: 1440 });
  await page.setViewportSize({ width: 1440, height: 900 });
  await hinterDenPreisblock(page);
  const z = await zustand(page);
  const name = pfad.replace('.html', '');
  pruef(name + ' (Schreibtisch): keine Leiste oder unsichtbar',
        !z.da || z.anzeige === 'none' || !z.sichtbar,
        z.da ? 'Anzeige ' + z.anzeige : 'gar nicht gebaut');
  await ctx.close();
}

/* ═══════════ C. Ausgeschlossene Seiten ═══════════ */
console.log('\n── C. Ausgeschlossene Seiten: kein Markup, kein Skript ──');
for (const pfad of OHNE) {
  const { ctx, page } = await seiteOeffnen(browser, basis, pfad, { ...OPT, breite: 390 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(700);
  const d = await page.evaluate(() => ({
    leiste: !!document.getElementById('sticky-buchung'),
    skript: !!document.querySelector('script[src*="sticky-buchung"]'),
    anker: document.querySelectorAll('[data-sticky-ab], [data-sticky-aus]').length,
  }));
  const name = pfad.replace('.html', '');
  pruef(name + ': keine Leiste', d.leiste === false);
  pruef(name + ': kein Skript und kein Anker', !d.skript && d.anker === 0,
        'Skript ' + d.skript + ', Anker ' + d.anker);
  await ctx.close();
}

/* ═══════════ D. Stoerer ═══════════ */
console.log('\n── D. Dialog offen und Feld im Fokus ──');
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'index.html', { ...OPT, breite: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await hinterDenPreisblock(page);
  let z = await zustand(page);
  pruef('Grundlage: Leiste ist sichtbar', z.sichtbar === true, 'Deckkraft ' + z.deckkraft);

  /* Cookiebots Dialog, nachgebaut mit seiner echten Kennung. */
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'CybotCookiebotDialog';
    d.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:9999;';
    d.textContent = 'Cookie-Dialog';
    document.body.appendChild(d);
  });
  await page.waitForTimeout(700);
  z = await zustand(page);
  pruef('Cookiebot-Dialog offen: Leiste weg', z.sichtbar === false, 'Deckkraft ' + z.deckkraft);

  await page.evaluate(() => document.getElementById('CybotCookiebotDialog').remove());
  await page.waitForTimeout(700);
  z = await zustand(page);
  pruef('Dialog zu: Leiste wieder da', z.sichtbar === true, 'Deckkraft ' + z.deckkraft);

  /* Ein Feld im Fokus heisst Tastatur. */
  /* Das Feld fest oben platzieren. Haengt es im Fluss, scrollt focus() die
     Seite dorthin, und dann verschwindet die Leiste aus dem richtigen
     Grund (Anker wieder im Bild) statt aus dem geprueften. */
  await page.evaluate(() => {
    const i = document.createElement('input');
    i.type = 'text'; i.id = 'test-feld';
    i.style.cssText = 'position:fixed;top:8px;left:8px;z-index:5;';
    document.body.appendChild(i);
    i.focus();
  });
  await page.waitForTimeout(700);
  z = await zustand(page);
  pruef('Feld im Fokus: Leiste weg', z.sichtbar === false, 'Deckkraft ' + z.deckkraft);
  await page.evaluate(() => document.getElementById('test-feld').blur());
  await page.waitForTimeout(700);
  z = await zustand(page);
  pruef('Fokus weg: Leiste wieder da', z.sichtbar === true, 'Deckkraft ' + z.deckkraft);
  await ctx.close();
}

/* ═══════════ E. Das Kreuz ═══════════ */
console.log('\n── E. Zumachen haelt die Sitzung durch ──');
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'index.html', { ...OPT, breite: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await hinterDenPreisblock(page);
  let z = await zustand(page);
  pruef('vor dem Zumachen sichtbar', z.sichtbar === true);

  await page.click('.sticky-buchung__zu');
  await page.waitForTimeout(700);
  z = await zustand(page);
  pruef('nach dem Zumachen weg', z.sichtbar === false, 'Deckkraft ' + z.deckkraft);

  const gespeichert = await page.evaluate(() => {
    try { return window.sessionStorage.getItem('bomaye:sticky-zu'); } catch (e) { return 'wirft'; }
  });
  pruef('Merker im Sitzungsspeicher', gespeichert === '1', String(gespeichert));

  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await hinterDenPreisblock(page);
  z = await zustand(page);
  pruef('nach dem Neuladen bleibt sie weg', z.sichtbar === false, 'Deckkraft ' + z.deckkraft);
  await ctx.close();
}

/* ═══════════ F. Aussehen, Tippflaechen, kein Ueberlappen ═══════════ */
console.log('\n── F. Aussehen, Tippflaechen, Fuss und Cookiebot-Abzeichen ──');
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'index.html', { ...OPT, breite: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  /* Cookiebots Abzeichen nachbauen, damit sich die Regel pruefen laesst. */
  await page.evaluate(() => {
    const w = document.createElement('div');
    w.id = 'CookiebotWidget';
    w.style.cssText = 'position:fixed;left:12px;bottom:12px;width:48px;height:48px;'
                    + 'background:#123;z-index:950;';
    document.body.appendChild(w);
  });
  await hinterDenPreisblock(page);
  const z = await zustand(page);

  pruef('Hintergrund ist das dunkle Token', z.hintergrund === 'rgb(10, 10, 8)', z.hintergrund);
  pruef('eine Goldlinie oben', /^1px rgb\(201, 168, 76\)$/.test(z.randOben), z.randOben);
  pruef('Hoehe um die 56 px', z.hoehe >= 54 && z.hoehe <= 72, z.hoehe + ' px');
  pruef('Knopf heisst PROBETRAINING SICHERN', z.knopfText === 'PROBETRAINING SICHERN', z.knopfText);
  pruef('Knopf zeigt auf /probetraining', z.knopfZiel === '/probetraining', z.knopfZiel);
  pruef('Knopf mindestens 44 px hoch', z.knopfH >= 44, z.knopfH + ' px');
  pruef('Kreuz mindestens 44x44', z.xB >= 44 && z.xH >= 44, z.xB + 'x' + z.xH);
  pruef('kein Messattribut am Knopf', z.datenAttribute.length === 0,
        JSON.stringify(z.datenAttribute));

  const d = await page.evaluate(() => {
    const l = document.getElementById('sticky-buchung').getBoundingClientRect();
    const w = document.getElementById('CookiebotWidget').getBoundingClientRect();
    const ueberlappt = !(w.right < l.left || w.left > l.right || w.bottom < l.top || w.top > l.bottom);
    return {
      ueberlappt,
      abzeichenUnten: Math.round(w.bottom),
      leisteOben: Math.round(l.top),
      quer: document.documentElement.scrollWidth > window.innerWidth + 1,
      breiteDoc: document.documentElement.scrollWidth,
      breiteFenster: window.innerWidth,
    };
  });
  pruef('kein Ueberlappen mit dem Cookiebot-Abzeichen', d.ueberlappt === false,
        'Abzeichen endet bei ' + d.abzeichenUnten + ', Leiste beginnt bei ' + d.leisteOben);
  pruef('kein waagerechtes Schieben', d.quer === false,
        d.breiteDoc + ' zu ' + d.breiteFenster);

  /* Fusstext: die letzte Zeile im Fuss darf nicht unter der Leiste liegen. */
  const f = await page.evaluate(() => {
    const fuss = document.querySelector('footer');
    if (!fuss) return { kein: true };
    fuss.scrollIntoView({ block: 'end', behavior: 'instant' });
    const cs = getComputedStyle(fuss);
    return { polster: cs.paddingBottom, kein: false };
  });
  pruef('Fuss hat Platz fuer die Leiste',
        f.kein || parseFloat(f.polster) >= 56, f.kein ? 'kein footer' : f.polster);
  await ctx.close();
}

/* ═══════════ G. Reduzierte Bewegung und Speicher, der wirft ═══════════ */
console.log('\n── G. Reduzierte Bewegung und blockierter Speicher ──');
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(basis + 'index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await hinterDenPreisblock(page);
  const z = await zustand(page);
  pruef('ohne Bewegung: trotzdem sichtbar', z.sichtbar === true, 'Deckkraft ' + z.deckkraft);
  pruef('ohne Bewegung: keine Uebergangsdauer', /^0s(, 0s)*$/.test(z.uebergang), z.uebergang);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(((e && e.stack) || String(e)).slice(0, 220)));
  /* sessionStorage wirft, wie im privaten Fenster mit blockierten Daten. */
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() { throw new Error('Zugriff blockiert'); },
    });
  });
  await page.goto(basis + 'index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await hinterDenPreisblock(page);
  const z = await zustand(page);
  pruef('ohne Speicher: Leiste erscheint trotzdem', z.sichtbar === true, 'Deckkraft ' + z.deckkraft);
  /* Nur die eigene Datei zaehlt. Die Startseite greift an zwei weiteren
     Stellen ungeschuetzt auf sessionStorage zu (index.html, Vorschalt-
     Abkuerzung, und main.js beim Merker introShown). Das ist ein
     vorbestehender Befund und gehoert nicht in dieses Paket, wird aber
     hier sichtbar gemacht statt stillschweigend uebergangen. */
  const eigene = fehler.filter((f) => /sticky-buchung/.test(f));
  pruef('ohne Speicher: keine Ausnahme aus sticky-buchung.js', eigene.length === 0,
        eigene.length ? JSON.stringify(eigene).slice(0, 140)
                      : 'fremde Ausnahmen: ' + fehler.length);
  /* Zumachen muss auch ohne Speicher wirken, nur eben nur fuer diesen Aufruf. */
  await page.click('.sticky-buchung__zu');
  await page.waitForTimeout(600);
  const z2 = await zustand(page);
  pruef('ohne Speicher: Zumachen wirkt im Seitenaufruf', z2.sichtbar === false);
  await ctx.close();
}

/* ═══════════ H. Der Klick ═══════════ */
console.log('\n── H. Der Klick fuehrt auf /probetraining ──');
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'index.html', { ...OPT, breite: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await hinterDenPreisblock(page);
  await page.click('.sticky-buchung__knopf');
  await page.waitForTimeout(1500);
  const u = new URL(page.url());
  pruef('nach dem Klick auf /probetraining', /probetraining/.test(u.pathname), u.pathname);
  await ctx.close();
}

await browser.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

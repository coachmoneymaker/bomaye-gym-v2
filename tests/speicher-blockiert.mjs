/* Die Seite muss laufen, wenn sessionStorage wirft.
 *
 *   node tests/speicher-blockiert.mjs                  gegen den Arbeitsstand
 *   node tests/speicher-blockiert.mjs /pfad/zu/main    gegen einen anderen Baum
 *
 * WORUM ES GEHT
 * sessionStorage ist nicht nur manchmal leer, es WIRFT: im privaten Fenster,
 * bei blockierten Seitendaten und in manchen App-Browsern. Auf der Startseite
 * standen zwei Zugriffe ungeschuetzt da:
 *
 *   index.html, Vorschalter-Abkuerzung:  sessionStorage.getItem('introShown')
 *   assets/js/main.js, initPreloader:    sessionStorage.setItem('introShown', ...)
 *
 * Der zweite ist der schlimmere. Er steht im 1300-ms-Zeitgeber ZWISCHEN dem
 * Start der Ueberblendung und dem Einblenden des Helden:
 *
 *     pre.classList.add('loader-exit');
 *     sessionStorage.setItem('introShown', 'true');   <- wirft
 *     if (hero) { ... hero-revealed ... }             <- laeuft nie
 *     pre.addEventListener('transitionend', ...)      <- laeuft nie
 *
 * Ergebnis ohne Schutz: der Vorschalter bleibt im Layout stehen und der
 * Held bleibt auf opacity 0. Die Seite ist unbenutzbar.
 *
 * Diese Suite stellt genau das nach und prueft, dass es nicht mehr passiert.
 */
import {
  chromiumHolen, wurzelBestimmen, serverStarten, zaehler,
} from './gemeinsam.mjs';

const chromium = await chromiumHolen();
const wurzel = wurzelBestimmen();
const { srv, basis } = await serverStarten(wurzel);
const browser = await chromium.launch();
const { pruef, abschluss } = zaehler();

console.log('Baum: ' + wurzel + '\n');

const GROESSEN = [[1440, 900, 'schreibtisch'], [390, 844, 'handy']];
const SEITEN = ['index.html', 'preise.html', 'kurse.html', 'boxen-muenchen.html'];

/* Ein Speicher, dessen drei Zugriffe werfen, gesetzt BEVOR irgendein
   Seitenskript laeuft. Nicht das ganze Objekt ersetzen, sondern die
   Methoden: so bleibt sessionStorage lesbar als Objekt, und es wirft erst
   beim Zugriff. Genau so verhalten sich Browser mit blockierten
   Seitendaten. */
const WERFENDER_SPEICHER = () => {
  const werfen = () => { throw new DOMException('Zugriff verweigert', 'SecurityError'); };
  try {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        return {
          getItem: werfen, setItem: werfen, removeItem: werfen,
          clear: werfen, key: werfen, length: 0,
        };
      },
    });
  } catch (e) { /* laesst der Browser das nicht zu, laeuft der Test normal */ }
};

async function laden(pfad, breite, hoehe, { blockiert = true, ctxVorher = null } = {}) {
  const ctx = ctxVorher || await browser.newContext({ viewport: { width: breite, height: hoehe } });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(((e && e.stack) || String(e)).slice(0, 300)));
  if (blockiert) await page.addInitScript(WERFENDER_SPEICHER);
  await page.goto(basis + pfad, { waitUntil: 'load' });
  return { ctx, page, fehler };
}

async function zustand(page) {
  return page.evaluate(() => {
    const p = document.getElementById('preloader');
    const h = document.getElementById('hero');
    const kopf = document.querySelector('#header .nav-links a.btn');
    const sichtbar = (el) => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (parseFloat(cs.opacity) < 0.05) return false;
      return el.getClientRects().length > 0;
    };
    return {
      vorschalterDa: !!p,
      vorschalterSichtbar: sichtbar(p),
      heldDa: !!h,
      heldEingeblendet: h ? h.classList.contains('hero-revealed') : null,
      heldDeckkraft: h ? getComputedStyle(h.querySelector('.hero-ctas') || h).opacity : null,
      /* Unter 768px ist der Knopf im Kopf zu Recht aus, dort fuehrt der
         Burger durch die Navigation. Geprueft wird deshalb, was auf der
         jeweiligen Breite wirklich bedienbar sein muss. */
      kopfSichtbar: window.innerWidth > 768 ? sichtbar(kopf)
                                            : sichtbar(document.querySelector('#header .burger')),
      kopfText: window.innerWidth > 768
        ? (kopf ? kopf.textContent.replace(/\s+/g, ' ').trim() : null)
        : 'Burger',
    };
  });
}

/* Wartet, bis der Vorschalter WIRKLICH weg ist, hoechstens so lange.
   Nicht bloss durchsichtig: loader-exit setzt opacity auf 0, das Element
   bleibt dabei aber im Layout stehen. Genau dieser halbe Zustand war der
   gemeldete Fehler, also zaehlt nur display:none oder gar keine Flaeche. */
async function wartenBisWeg(page, ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const weg = await page.evaluate(() => {
      const p = document.getElementById('preloader');
      if (!p) return true;
      /* Nur display zaehlt. getClientRects() kann direkt nach load kurz 0
         liefern, bevor zum ersten Mal gezeichnet wurde, und meldete die
         Leiste dann faelschlich als weg. */
      return getComputedStyle(p).display === 'none';
    });
    if (weg) return Date.now() - start;
    await page.waitForTimeout(150);
  }
  return null;
}

/* ═══════════ A. Speicher wirft ═══════════ */
for (const [b, h, kennung] of GROESSEN) {
  console.log(`\n── A. Speicher wirft, ${b}x${h} ──`);
  for (const pfad of SEITEN) {
    const { ctx, page, fehler } = await laden(pfad, b, h);
    const name = pfad.replace('.html', '') + ' / ' + kennung;

    const dauer = await wartenBisWeg(page, 5000);
    pruef(name + ': Vorschalter binnen 5 s weg', dauer !== null,
          dauer === null ? 'steht nach 5 s noch' : dauer + ' ms');

    await page.waitForTimeout(400);
    const z = await zustand(page);
    if (z.heldDa) {
      pruef(name + ': Held ist eingeblendet', z.heldEingeblendet === true,
            'Klasse hero-revealed ' + z.heldEingeblendet + ', Deckkraft ' + z.heldDeckkraft);
    }
    pruef(name + ': Kopfknopf sichtbar', z.kopfSichtbar === true, z.kopfText);

    /* Nur Ausnahmen aus den zwei Dateien, um die es hier geht. */
    const eigene = fehler.filter((f) => /index\.html|main\.js/.test(f));
    pruef(name + ': keine Ausnahme aus index.html oder main.js', eigene.length === 0,
          eigene.length ? JSON.stringify(eigene).slice(0, 220) : undefined);
    pruef(name + ': ueberhaupt keine Ausnahme', fehler.length === 0,
          fehler.length ? JSON.stringify(fehler).slice(0, 220) : undefined);
    await ctx.close();
  }
}

/* ═══════════ B. Speicher funktioniert: Intro und Wiederbesuch ═══════════ */
console.log('\n── B. Speicher funktioniert: erster Besuch zeigt das Intro ──');
{
  /* Am Schreibtisch, denn unter 768px ist der Vorschalter per CSS aus. */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(String(e).slice(0, 200)));
  await page.goto(basis + 'index.html', { waitUntil: 'load' });

  /* Kurz nach dem Laden muss der Vorschalter noch stehen. */
  await page.waitForTimeout(250);
  let z = await zustand(page);
  pruef('erster Besuch: Vorschalter ist zuerst da', z.vorschalterSichtbar === true,
        'sichtbar ' + z.vorschalterSichtbar);

  const dauer = await wartenBisWeg(page, 5000);
  pruef('erster Besuch: Vorschalter geht von selbst weg', dauer !== null,
        dauer === null ? 'steht nach 5 s noch' : dauer + ' ms');
  pruef('erster Besuch: weg nach etwa 1,3 s, nicht erst durch das Netz',
        dauer !== null && dauer < 3000, dauer + ' ms');

  await page.waitForTimeout(400);
  z = await zustand(page);
  pruef('erster Besuch: Held eingeblendet', z.heldEingeblendet === true);
  const merker = await page.evaluate(() => {
    try { return window.sessionStorage.getItem('introShown'); } catch (e) { return 'wirft'; }
  });
  pruef('erster Besuch: Merker gesetzt', merker === 'true', String(merker));

  /* Zweiter Besuch: dieselbe Seite neu laden, NICHT einen zweiten Tab
     oeffnen. sessionStorage gilt je Tab, ein neuer Tab im selben Kontext
     startet mit leerem Speicher und zeigte das Intro zu Recht erneut. */
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(250);
  const z2 = await zustand(page);
  pruef('zweiter Besuch: Vorschalter sofort weg', z2.vorschalterSichtbar === false,
        'sichtbar ' + z2.vorschalterSichtbar);
  /* Der Knopf im Kopf wird hier am Schreibtisch geprueft. */
  pruef('zweiter Besuch: Kopfknopf sichtbar', z2.kopfSichtbar === true, z2.kopfText);
  pruef('zweiter Besuch: Held sofort eingeblendet', z2.heldEingeblendet === true);
  pruef('Speicher funktioniert: keine Ausnahme', fehler.length === 0,
        JSON.stringify(fehler).slice(0, 200));
  await ctx.close();
}

/* ═══════════ C. Das Netz greift auch ohne main.js ═══════════ */
console.log('\n── C. Das Netz: ohne main.js verschwindet der Vorschalter trotzdem ──');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  /* main.js gar nicht ausliefern. Dann gibt es kein initPreloader, und nur
     das Netz im Markup kann den Vorschalter noch wegnehmen. */
  await page.route('**/assets/js/main.js', (route) => route.abort('failed'));
  await page.goto(basis + 'index.html', { waitUntil: 'load' });
  const dauer = await wartenBisWeg(page, 6000);
  pruef('ohne main.js: Vorschalter verschwindet', dauer !== null,
        dauer === null ? 'steht nach 6 s noch' : dauer + ' ms');
  pruef('ohne main.js: das Netz greift nach etwa 4 s',
        dauer !== null && dauer >= 3000, dauer + ' ms');
  const z = await zustand(page);
  pruef('ohne main.js: Held wird trotzdem eingeblendet', z.heldEingeblendet === true);
  await ctx.close();
}

/* ═══════════ D. /mitgliederbereich: der Nachrichten-Behandler ═══════════ */
console.log('\n── D. /mitgliederbereich, Anmelde-Nachricht bei werfendem Speicher ──');

/* WORUM ES HIER GEHT
   Der Behandler fuer die Anmelde-Nachricht von Bsport las die gemerkte
   Sektion ungeschuetzt:

       var pending = sessionStorage.getItem('bsport_pending_section');
       sessionStorage.removeItem('bsport_pending_section');

   Wirft der Speicher, brach die Ausnahme den ganzen Behandler ab, also auch
   alles, was danach noch kommen sollte. Jetzt steht ein try/catch darum und
   es entfaellt nur die Rueckkehr zur gemerkten Sektion.

   Die Nachricht wird als MessageEvent mit gesetztem origin erzeugt. Nur so
   kommt sie durch die Herkunftspruefung: der Behandler vergleicht
   event.origin zeichengenau gegen https://backoffice.bsport.io. */
async function nachrichtSenden(page, origin) {
  await page.evaluate((o) => {
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'IFRAME_LOGIN_SUCCESS' }, origin: o,
    }));
  }, origin);
  await page.waitForTimeout(500);
}

for (const [b, h, kennung] of GROESSEN) {
  const { ctx, page, fehler } = await laden('mitgliederbereich.html', b, h);
  const name = 'mitgliederbereich / ' + kennung;
  const vorher = page.url();

  await nachrichtSenden(page, 'https://backoffice.bsport.io');

  const eigene = fehler.filter((f) => /mitgliederbereich/.test(f));
  pruef(name + ': keine Ausnahme aus mitgliederbereich.html', eigene.length === 0,
        eigene.length ? JSON.stringify(eigene).slice(0, 220) : undefined);
  pruef(name + ': ueberhaupt keine Ausnahme', fehler.length === 0,
        fehler.length ? JSON.stringify(fehler).slice(0, 220) : undefined);
  pruef(name + ': keine Umleitung ohne gemerkte Sektion', page.url() === vorher,
        page.url().replace(basis, ''));

  /* Die Seite bleibt bedienbar: der Kopf steht, und ein Klick kommt an.
     /mitgliederbereich hat einen eigenen Kopf, <header class="mw-header">
     ohne id, nicht den #header der uebrigen Seiten. Darum hier ein eigener
     Blick statt zustand(). */
  const b2 = await page.evaluate(() => {
    const kopf = document.querySelector('.mw-header');
    const el = window.innerWidth > 768
      ? document.querySelector('.mw-header .nav-links a')
      : document.querySelector('.mw-header .burger');
    const sichtbar = (n) => {
      if (!n) return false;
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (parseFloat(cs.opacity) < 0.05) return false;
      return n.getClientRects().length > 0;
    };
    let an = 'kein Element';
    if (el) {
      an = false;
      const h = () => { an = true; };
      el.addEventListener('click', h, { once: true });
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      el.removeEventListener('click', h);
    }
    return {
      kopfDa: sichtbar(kopf),
      elementDa: sichtbar(el),
      marke: el ? (el.textContent.replace(/\s+/g, ' ').trim() || el.getAttribute('aria-label')) : null,
      klickt: an,
    };
  });
  pruef(name + ': Kopf bleibt bedienbar', b2.kopfDa === true && b2.elementDa === true,
        b2.marke + ', Kopf ' + b2.kopfDa + ', Element ' + b2.elementDa);
  pruef(name + ': Klick kommt an', b2.klickt === true, String(b2.klickt));
  await ctx.close();
}

/* Gegenprobe: mit funktionierendem Speicher fuehrt dieselbe Nachricht
   genau wie vorher auf die gemerkte Sektion. Das Verhalten aendert sich
   also nur dann, wenn der Speicher ohnehin nicht zu gebrauchen ist. */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(basis + 'mitgliederbereich.html', { waitUntil: 'load' });
  await page.evaluate(() => window.sessionStorage.setItem('bsport_pending_section', 'abos'));
  await nachrichtSenden(page, 'https://backoffice.bsport.io');
  pruef('Speicher funktioniert: Nachricht fuehrt zur gemerkten Sektion',
        /mitglied-werden#abos$/.test(page.url()), page.url().replace(basis, ''));
  const rest = await page.evaluate(() => {
    try { return window.sessionStorage.getItem('bsport_pending_section'); } catch (e) { return 'wirft'; }
  });
  pruef('Speicher funktioniert: Merker ist danach geleert', rest === null, String(rest));
  await ctx.close();
}

/* Fremde Herkunft bleibt wirkungslos, mit und ohne Speicher. */
{
  const { ctx, page, fehler } = await laden('mitgliederbereich.html', 390, 844);
  const vorher = page.url();
  await nachrichtSenden(page, 'https://backoffice.bsport.io.angreifer.example');
  pruef('fremde Herkunft loest nichts aus', page.url() === vorher,
        page.url().replace(basis, ''));
  pruef('fremde Herkunft wirft nichts', fehler.length === 0,
        JSON.stringify(fehler).slice(0, 200));
  await ctx.close();
}

await browser.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

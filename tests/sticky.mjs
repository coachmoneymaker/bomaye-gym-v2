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
 *   I  Die Leiste auf jeder Telefonbreite.
 *   J  Stille Zonen: ein Formular im Bild legt die Leiste schlafen.
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
      knopfB: kr ? Math.round(kr.width) : 0,
      /* Luft zwischen Goldlinie und Knopf, oben und unten. Die Linie ist
         1px, sie zaehlt nicht als Luft. */
      luftOben: kr ? Math.round((kr.top - r.top - 1) * 10) / 10 : null,
      luftUnten: kr ? Math.round((r.bottom - kr.bottom) * 10) / 10 : null,
      knopfSchrift: k ? getComputedStyle(k).fontSize : null,
      knopfSperrung: k ? getComputedStyle(k).letterSpacing : null,
      /* EINE ZEILE: der Inhalt ist nicht hoeher als eine Zeilenhoehe.
         scrollHeight waechst mit, sobald der Text umbricht. */
      knopfZeilen: k ? Math.round(k.scrollHeight / parseFloat(getComputedStyle(k).lineHeight)) : null,
      /* NICHT BESCHNITTEN: der Text braucht nicht mehr Platz als da ist.
         Ist er breiter, setzt text-overflow Punkte; das waere der
         Notausgang, nicht der Normalfall. */
      knopfTextBreit: k ? k.scrollWidth : null,
      knopfKastenBreit: k ? Math.round(k.clientWidth) : null,
      xB: xr ? Math.round(xr.width) : 0,
      xH: xr ? Math.round(xr.height) : 0,
      xFarbe: x ? getComputedStyle(x).color : null,
      xFuellfarbe: x ? getComputedStyle(x)['-webkit-text-fill-color'] : null,
      xSvg: x ? x.querySelectorAll('svg line').length : 0,
      xTextinhalt: x ? x.textContent.trim() : null,
      xMarke: x ? x.getAttribute('aria-label') : null,
      farbschema: cs.colorScheme,
      textAnpassung: cs.webkitTextSizeAdjust || cs.textSizeAdjust || null,
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
console.log('\n── F. Aussehen, Tippflaechen, Fuss ──');
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'index.html', { ...OPT, breite: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await hinterDenPreisblock(page);
  const z = await zustand(page);

  pruef('Hintergrund ist das dunkle Token', z.hintergrund === 'rgb(10, 10, 8)', z.hintergrund);
  pruef('eine Goldlinie oben', /^1px rgb\(201, 168, 76\)$/.test(z.randOben), z.randOben);
  /* 64px, nicht mehr 56: der Knopf hat feste 44px und braucht oben und
     unten Luft. */
  pruef('Hoehe ist 64 px', z.hoehe === 64, z.hoehe + ' px');
  pruef('Farbschema ist erklaert als dark', z.farbschema === 'dark', String(z.farbschema));
  pruef('Schriftgroesse wird nicht nachskaliert', z.textAnpassung === '100%',
        String(z.textAnpassung));
  pruef('Knopf heisst PROBETRAINING SICHERN', z.knopfText === 'PROBETRAINING SICHERN', z.knopfText);
  pruef('Knopf zeigt auf /probetraining', z.knopfZiel === '/probetraining', z.knopfZiel);
  pruef('Knopf ist genau 44 px hoch', z.knopfH === 44, z.knopfH + ' px');
  pruef('Luft ueber dem Knopf mindestens 8 px', z.luftOben >= 8, z.luftOben + ' px');
  pruef('Luft unter dem Knopf mindestens 8 px', z.luftUnten >= 8, z.luftUnten + ' px');
  pruef('Knopftext steht auf einer Zeile', z.knopfZeilen === 1, z.knopfZeilen + ' Zeilen');
  pruef('Knopftext wird nicht beschnitten',
        z.knopfTextBreit <= z.knopfKastenBreit + 1,
        z.knopfTextBreit + ' in ' + z.knopfKastenBreit + ' px');
  pruef('kein Messattribut am Knopf', z.datenAttribute.length === 0,
        JSON.stringify(z.datenAttribute));

  /* DAS KREUZ
     Zwei Striche als SVG, kein Schriftzeichen mehr. Die Farbe ist die
     erklaerte, nicht die vom Browser gewaehlte Knopffarbe: Chrome iOS malt
     Knopftext blau (rgb(0, 122, 255)), aeltere Browser nehmen das alte
     Linkblau rgb(0, 0, 238). */
  pruef('Kreuz mindestens 44x44', z.xB >= 44 && z.xH >= 44, z.xB + 'x' + z.xH);
  pruef('Kreuz ist ein SVG mit zwei Strichen', z.xSvg === 2, z.xSvg + ' Striche');
  pruef('kein Schriftzeichen mehr im Kreuz', z.xTextinhalt === '',
        JSON.stringify(z.xTextinhalt));
  pruef('Kreuz traegt die erklaerte Farbe', z.xFarbe === 'rgba(245, 240, 232, 0.55)', z.xFarbe);
  pruef('Kreuzfarbe ist nicht blau',
        z.xFarbe !== 'rgb(0, 0, 238)' && z.xFarbe !== 'rgb(0, 122, 255)', z.xFarbe);
  pruef('Beschriftung des Kreuzes unveraendert', z.xMarke === 'Leiste ausblenden', z.xMarke);

  const d = await page.evaluate(() => ({
    quer: document.documentElement.scrollWidth > window.innerWidth + 1,
    breiteDoc: document.documentElement.scrollWidth,
    breiteFenster: window.innerWidth,
  }));
  pruef('kein waagerechtes Schieben', d.quer === false,
        d.breiteDoc + ' zu ' + d.breiteFenster);

  /* Fusstext: die letzte Zeile im Fuss darf nicht unter der Leiste liegen.
     ENTFALLEN: die Pruefung gegen Cookiebots Abzeichen. Das Abzeichen ist
     in Cookiebot abgeschaltet, die Regel, die es anhob, ist aus style.css
     entfernt, und ein nachgebautes Abzeichen wuerde nur noch die eigene
     Attrappe messen. */
  const f = await page.evaluate(() => {
    const fuss = document.querySelector('footer');
    if (!fuss) return { kein: true };
    fuss.scrollIntoView({ block: 'end', behavior: 'instant' });
    const cs = getComputedStyle(fuss);
    return { polster: cs.paddingBottom, kein: false };
  });
  pruef('Fuss hat Platz fuer die Leiste',
        f.kein || parseFloat(f.polster) >= 64, f.kein ? 'kein footer' : f.polster);
  pruef('die alte Cookiebot-Regel ist weg',
        !(await page.evaluate(() => [...document.styleSheets].some((sh) => {
          try {
            return [...sh.cssRules].some((r) => /CookiebotWidget/.test(r.cssText)
                                                && /hat-sticky-buchung/.test(r.cssText));
          } catch (e) { return false; }
        }))));
  await ctx.close();
}

/* ═══════════ I. Jede Telefonbreite, Querformat, grosse Systemschrift ═══════════ */
console.log('\n── I. Die Leiste auf jeder Breite ──');
{
  /* Hochkant inklusive der beiden Faltmasse 280 und 344, dazu ein
     Querformat und zweimal Systemschrift 130%. Gemessen wird bei frisch
     geladener Seite, nicht durch Umstellen des Fensters. */
  const FAELLE = [
    [280, 653, 100], [320, 568, 100], [344, 882, 100], [360, 640, 100],
    [375, 667, 100], [390, 844, 100], [412, 915, 100], [430, 932, 100],
    [667, 375, 100], [320, 568, 130], [390, 844, 130],
  ];
  for (const [b, h, lupe] of FAELLE) {
    const { ctx, page } = await seiteOeffnen(browser, basis, 'index.html', { ...OPT, breite: b });
    await page.setViewportSize({ width: b, height: h });
    if (lupe !== 100) await page.addStyleTag({ content: 'html { font-size: ' + lupe + '% }' });
    await page.waitForTimeout(500);
    /* Nicht suchen, sondern den schlimmsten Fall herstellen: die Leiste
       dort messen, wo sie liegen WUERDE. hinterDenPreisblock() braucht auf
       elf Groessen zu lange und haengt am Scrollweg der jeweiligen Hoehe. */
    await page.evaluate(() => {
      const l = document.getElementById('sticky-buchung');
      if (l) { l.style.opacity = '1'; l.style.transform = 'none'; }
    });
    await page.waitForTimeout(200);
    const z = await zustand(page);
    const name = b + 'x' + h + ' @' + lupe + '%';
    if (!z.da) { pruef(name + ': Leiste gebaut', false, 'keine Leiste im Markup'); continue; }

    const sollHoehe = h < 450 ? 56 : 64;
    const sollLuft = h < 450 ? 4 : 8;
    pruef(name + ': Hoehe ' + sollHoehe + ' px', z.hoehe === sollHoehe, z.hoehe + ' px');
    pruef(name + ': Knopf genau 44 px hoch', z.knopfH === 44, z.knopfH + ' px');
    pruef(name + ': Knopf liegt vollstaendig in der Leiste',
          z.luftOben >= sollLuft && z.luftUnten >= sollLuft,
          z.luftOben + ' / ' + z.luftUnten + ' px');
    pruef(name + ': Text auf einer Zeile', z.knopfZeilen === 1,
          z.knopfZeilen + ' Zeilen, ' + z.knopfSchrift + ' / ' + z.knopfSperrung);
    pruef(name + ': Text passt ohne Punkte',
          z.knopfTextBreit <= z.knopfKastenBreit + 1,
          z.knopfTextBreit + ' in ' + z.knopfKastenBreit + ' px');
    pruef(name + ': Kreuz 44x44', z.xB >= 44 && z.xH >= 44, z.xB + 'x' + z.xH);
    pruef(name + ': Kreuzfarbe nicht blau',
          z.xFarbe !== 'rgb(0, 0, 238)' && z.xFarbe !== 'rgb(0, 122, 255)', z.xFarbe);
    const quer = await page.evaluate(() => ({
      quer: document.documentElement.scrollWidth > window.innerWidth + 1,
      doc: document.documentElement.scrollWidth, f: window.innerWidth,
    }));
    pruef(name + ': kein waagerechtes Schieben', quer.quer === false, quer.doc + ' zu ' + quer.f);
    await ctx.close();
  }
}

/* Sehr flaches Fenster: die Leiste wuerde mehr als ein Fuenftel verdecken. */
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'index.html', { ...OPT, breite: 390 });
  await page.setViewportSize({ width: 390, height: 260 });
  await page.waitForTimeout(400);
  const z = await zustand(page);
  pruef('bei 260 px Fensterhoehe ist die Leiste aus', z.anzeige === 'none', String(z.anzeige));
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

/* ═══════════ J. Stille Zonen: Formulare ═══════════ */
console.log('\n── J. Ein Formular im Bild legt die Leiste schlafen ──');

/* WARUM ES DIESEN ABSCHNITT GIBT
   Auf /kurse steht die Corporate-Anfrage UNTER der Abschluss-Sektion.
   data-sticky-aus greift dort also nicht mehr, die Leiste kam zurueck und
   lag ueber den unteren Feldern. Jedes <form> und jedes Element mit
   data-sticky-still ist darum jetzt eine stille Zone. */
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'kurse.html', { ...OPT, breite: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);

  const lage = await page.evaluate(() => {
    const m = (sel) => {
      const e = document.querySelector(sel);
      return e ? Math.round(e.getBoundingClientRect().top + window.scrollY) : null;
    };
    return { still: m('[data-sticky-still]'), form: m('#cbi-form'), aus: m('[data-sticky-aus]') };
  });
  pruef('kurse: die Corporate-Sektion traegt data-sticky-still', lage.still !== null,
        'bei y=' + lage.still);
  pruef('kurse: sie steht unter der Abschluss-Sektion',
        lage.still !== null && lage.aus !== null && lage.still > lage.aus,
        'still ' + lage.still + ', aus ' + lage.aus);

  /* Mitten ins Formular. */
  await page.evaluate(() => {
    document.getElementById('cbi-form').scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  let z = await zustand(page);
  const imBild = await page.evaluate(() => {
    const r = document.getElementById('cbi-form').getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  pruef('kurse: das Formular ist wirklich im Bild', imBild === true);
  pruef('kurse: die Leiste schweigt ueber dem Formular', z.sichtbar === false,
        'Deckkraft ' + z.deckkraft);

  /* Und wieder hinauf: oberhalb des Formulars, hinter dem Anker, muss sie
     zurueckkommen. Gesucht wird die erste Stelle von oben, an der sie
     steht, damit der Test nicht an einer festen Zahl haengt. */
  const stellen = [];
  let zurueck = null;
  for (let y = 300; y < lage.still - 400; y += 400) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(400);
    const da = await page.evaluate(() => {
      const l = document.getElementById('sticky-buchung');
      return !!l && l.classList.contains('ist-sichtbar');
    });
    stellen.push(y + (da ? '*' : ''));
    if (da) { zurueck = y; break; }
  }
  pruef('kurse: oberhalb des Formulars steht sie wieder da', zurueck !== null,
        'gefunden bei y=' + zurueck + ', besucht ' + stellen.join(' '));

  /* Die Punkte des Karussells tragen jetzt einen Namen. */
  const punkte = await page.evaluate(() => {
    const d = [...document.querySelectorAll('.carousel-dot')];
    const behaelter = document.getElementById('carousel-dots');
    return {
      anzahl: d.length,
      marken: d.map((x) => x.getAttribute('aria-label')),
      jetzt: d.map((x) => x.getAttribute('aria-current')),
      aktiv: d.map((x) => x.classList.contains('active')),
      versteckt: behaelter ? behaelter.getAttribute('aria-hidden') : 'kein Behaelter',
    };
  });
  pruef('kurse: jeder Punkt des Karussells hat eine Beschriftung',
        punkte.anzahl > 0 && punkte.marken.every((m) => !!m),
        JSON.stringify(punkte.marken));
  pruef('kurse: die Beschriftung nennt Nummer und Anzahl',
        punkte.marken.every((m, i) => m === 'Slide ' + (i + 1) + ' von ' + punkte.anzahl),
        JSON.stringify(punkte.marken));
  pruef('kurse: genau ein Punkt traegt aria-current',
        punkte.jetzt.filter((x) => x === 'true').length === 1, JSON.stringify(punkte.jetzt));
  pruef('kurse: und zwar der aktive',
        punkte.jetzt.findIndex((x) => x === 'true') === punkte.aktiv.indexOf(true),
        JSON.stringify({ jetzt: punkte.jetzt, aktiv: punkte.aktiv }));
  pruef('kurse: die Punkte sind nicht mehr vor Vorlesern versteckt',
        punkte.versteckt === null, String(punkte.versteckt));
  await ctx.close();
}

/* EIN GESCHLOSSENES MODAL IST KEINE STILLE ZONE
   Das Family-Formular auf /preise steckt in einem Modal, das immer im
   Markup steht, position: fixed ist und damit IMMER im Bild liegt. Zu ist
   es nur ueber opacity 0 und pointer-events: none. Zaehlte es als stille
   Zone, waere die Leiste auf /preise fuer immer stumm. Genau das wird
   hier geprueft, in beide Richtungen. */
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'preise.html', { ...OPT, breite: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const gefunden = await hinterDenPreisblock(page);
  pruef('preise: die Leiste erscheint trotz des geschlossenen Modals',
        gefunden.gefunden === true, 'besucht ' + gefunden.besucht.join(' '));

  if (gefunden.gefunden) {
    await page.evaluate(() => window.openFamilyModal());
    await page.waitForTimeout(800);
    const offen = await page.evaluate(() => ({
      modal: document.getElementById('family-modal').classList.contains('open'),
      leiste: document.getElementById('sticky-buchung').classList.contains('ist-sichtbar'),
    }));
    pruef('preise: das Modal ist offen', offen.modal === true);
    pruef('preise: die Leiste schweigt, solange das Formular offen ist',
          offen.leiste === false);

    await page.evaluate(() => window.closeFamilyModal());
    await page.waitForTimeout(900);
    const zu = await page.evaluate(() =>
      document.getElementById('sticky-buchung').classList.contains('ist-sichtbar'));
    pruef('preise: nach dem Schliessen ist sie wieder da', zu === true);
  }
  await ctx.close();
}

await browser.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

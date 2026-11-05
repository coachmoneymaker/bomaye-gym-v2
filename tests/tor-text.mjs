/* Der Text im Buchungstor, auf allen 26 Seiten.
 *
 *   node tor-text.mjs [WURZEL]
 *
 * Geprueft wird:
 *   A  Auf JEDER Seite, ohne Einwilligung: der Absatz "Lieber ohne Cookies
 *      buchen? Ruf uns an ... WhatsApp" ist weg, und zwar sowohl als
 *      Element mit der Klasse __alt wie als Text.
 *   B  Wo ein Tor gezeichnet wird, steht der Einwilligungshinweis
 *      unveraendert da, Wort fuer Wort.
 *   C  Der Rueckfall nach zwei gescheiterten Ladeversuchen ist noch da:
 *      "Das Buchungssystem laedt gerade nicht. Buche direkt bei uns ..."
 *      Verhalten, nicht nur Zeichenkette.
 *   D  Was bleiben soll, bleibt: die Zeile unter dem Kalender auf
 *      /probetraining und die Kontaktdaten im Fuss.
 *   E  Die Video-Fassade auf der Startseite behaelt ihren eigenen Absatz
 *      samt Tippflaechen - sie teilt die CSS-Klasse mit dem Buchungstor.
 */
import { readdir } from 'node:fs/promises';
import {
  chromiumHolen, wurzelBestimmen, serverStarten, zaehler,
  BACKOFFICE, BUNDLE, cookiebotSperrt, TOR_HINWEIS, TOR_RUECKFALL,
  STAND_ABGELEHNT, STAND_NUR_MARKETING, torKnopfDruecken, nachricht,
} from './gemeinsam.mjs';

const chromium = await chromiumHolen();
const WURZEL = wurzelBestimmen();
const { srv, basis } = await serverStarten(WURZEL);
const b = await chromium.launch();
console.log('Baum: ' + WURZEL + '\n');

const { pruef, abschluss } = zaehler();

/* Wort fuer Wort, so wie es stehen bleiben soll. */
const HINWEIS = 'Mit Tippen lädst du unseren Buchungskalender von bsport '
              + 'und stimmst Marketing-Cookies zu. Mehr in den Cookie-Einstellungen.';
const RUECKFALL = 'Das Buchungssystem laedt gerade nicht. Buche direkt bei uns:';
/* Die Wendungen, die nicht mehr vorkommen duerfen. */
const WEG = ['Lieber ohne Cookies buchen', 'oder schreib uns per WhatsApp'];


async function seite(pfad, { cdnKaputt = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('ERROR: ' + String(e).slice(0, 160)));

  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (/cdn\.bsport\.io/.test(u)) {
      if (cdnKaputt) return route.abort('failed');
      return route.fulfill({ status: 200, contentType: 'text/javascript',
        body: 'window.BsportWidget={mount:function(c){window.__montiert=1;}};' });
    }
    if (/consent\.cookiebot\.com/.test(u)) {
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    }
    if (!u.startsWith(basis)) return route.continue();
    const res = await route.fetch();
    if (!/text\/html/.test(res.headers()['content-type'] || '')) {
      return route.fulfill({ response: res });
    }
    return route.fulfill({ response: res, body: cookiebotSperrt(await res.text()),
      headers: { ...res.headers(), 'content-type': 'text/html' } });
  });

  /* Der live gemessene Startzustand: Cookiebot kommt erst nach 2,5 s und
     meldet dann alles aus. */
  await page.addInitScript(() => {
    window.__cookiebotSpaet = function () {
      window.Cookiebot = {
        consent: { stamp: '0', necessary: true, preferences: false,
                   statistics: false, marketing: false, method: null },
        consented: false,
        renew: function () {},
      };
      window.dispatchEvent(new Event('CookiebotOnConsentReady'));
    };
  });

  await page.goto(basis + pfad, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__cookiebotSpaet());
  await page.waitForTimeout(1500);
  return { ctx, page, logs };
}

async function marketingErlauben(page) {
  await page.evaluate(() => {
    window.Cookiebot.consent = { stamp: '1', necessary: true, preferences: false,
                                 statistics: false, marketing: true, method: 'explicit' };
    window.Cookiebot.consented = true;
    window.dispatchEvent(new Event('CookiebotOnAccept'));
  });
}

const seiten = (await readdir(WURZEL)).filter((d) => d.endsWith('.html')).sort();

console.log(`── A/B. Tor-Text auf allen ${seiten.length} Seiten, ohne Einwilligung ──`);
let mitTor = 0, ohneTor = [];
for (const datei of seiten) {
  const { ctx, page, logs } = await seite(datei);
  const d = await page.evaluate((hinweisSoll) => {
    const text = (document.body.innerText || '').replace(/\s+/g, ' ');
    const kaesten = [...document.querySelectorAll('.bomaye-consent-gate')];
    /* Die Video-Fassade benutzt dieselbe Klasse. Das Buchungstor erkennt
       man am Knopf "... BUCHUNG LADEN", die Fassade an "... VIDEO LADEN". */
    const buchung = kaesten.filter((k) => {
      const b = k.querySelector('.bomaye-consent-gate__btn');
      return !b || !/VIDEO LADEN/i.test(b.textContent || '');
    });
    const hinweise = buchung
      .map((k) => k.querySelector('.bomaye-consent-gate__hinweis'))
      .filter(Boolean)
      .map((h) => (h.innerText || '').replace(/\s+/g, ' ').trim());
    return {
      text,
      buchungsTore: buchung.length,
      altInBuchung: buchung.reduce(
        (n, k) => n + k.querySelectorAll('.bomaye-consent-gate__alt').length, 0),
      hinweise,
      hinweisStimmt: hinweise.length > 0 && hinweise.every((h) => h === hinweisSoll),
    };
  }, HINWEIS);

  const name = datei.replace('.html', '');
  const gefunden = WEG.filter((w) => d.text.indexOf(w) !== -1);
  pruef(name + ': Absatz "Lieber ohne Cookies buchen" nicht im Text',
        gefunden.length === 0, gefunden.length ? JSON.stringify(gefunden) : undefined);
  pruef(name + ': kein __alt im Buchungstor', d.altInBuchung === 0, 'Anzahl ' + d.altInBuchung);
  if (d.buchungsTore > 0) {
    mitTor++;
    pruef(name + ': Einwilligungshinweis Wort fuer Wort unveraendert', d.hinweisStimmt,
          d.hinweisStimmt ? d.buchungsTore + ' Tor(e)' : JSON.stringify(d.hinweise).slice(0, 180));
  } else {
    ohneTor.push(name);
  }
  pruef(name + ': keine Fehler', logs.length === 0, JSON.stringify(logs).slice(0, 140));
  await ctx.close();
}
console.log(`     ${mitTor} Seiten zeichnen ein Buchungstor, ${ohneTor.length} nicht: `
          + ohneTor.join(', '));

console.log('\n── C. Der Rueckfall nach zwei Fehlversuchen ist noch da ──');
for (const pfad of ['probetraining.html', 'index.html', 'preise.html']) {
  const { ctx, page } = await seite(pfad, { cdnKaputt: true });
  const name = pfad.replace('.html', '');
  /* Tor-Knopf, dann Einwilligung: jetzt versucht die Sperre zu laden und
     scheitert, weil cdn.bsport.io abgewiesen wird. */
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')]
      .filter((x) => /BUCHUNG LADEN|TERMINE ANZEIGEN/i.test(x.textContent || ''));
    if (b.length) b[0].click();
  });
  await marketingErlauben(page);

  /* Zweimal "Erneut versuchen" druecken, sobald es erscheint. */
  let klicks = 0;
  for (let runde = 0; runde < 12 && klicks < 2; runde++) {
    await page.waitForTimeout(2500);
    const geklickt = await page.evaluate(() => {
      const a = document.querySelector('.bomaye-consent-gate__reload a');
      if (!a) return false;
      a.click();
      return true;
    });
    if (geklickt) klicks++;
  }
  await page.waitForTimeout(12000);

  const d = await page.evaluate(() => {
    const p = document.querySelector('.bomaye-consent-gate__reload');
    return {
      text: p ? (p.innerText || '').replace(/\s+/g, ' ').trim() : '(kein Hinweis)',
      telefon: !!(p && p.querySelector('a[href^="tel:"]')),
      whatsapp: !!(p && p.querySelector('a[href*="wa.me"]')),
    };
  });
  pruef(name + ': Rueckfalltext steht da', d.text.indexOf(RUECKFALL) !== -1,
        JSON.stringify(d.text).slice(0, 150) + ' (' + klicks + ' Klicks)');
  pruef(name + ': Rueckfall nennt Telefon und WhatsApp', d.telefon && d.whatsapp,
        'tel ' + d.telefon + ', wa ' + d.whatsapp);
  await ctx.close();
}

console.log('\n── D. Was bleiben soll, bleibt ──');
{
  const { ctx, page } = await seite('probetraining.html');
  const d = await page.evaluate(() => {
    const t = (document.body.innerText || '').replace(/\s+/g, ' ');
    return {
      unterKalender: /Kein passender Termin\?\s*Schreib uns auf WhatsApp/i.test(t),
      waLinks: document.querySelectorAll('a[href*="wa.me"]').length,
    };
  });
  pruef('/probetraining: "Kein passender Termin? Schreib uns auf WhatsApp" steht noch da',
        d.unterKalender === true);
  pruef('/probetraining: WhatsApp-Link unter dem Kalender unberuehrt', d.waLinks >= 1,
        'Anzahl ' + d.waLinks);
  await ctx.close();
}
{
  /* tel:-Links stehen im Markup nur auf der Startseite. Auf den uebrigen
     Seiten gibt es sie gar nicht - eine Pruefung auf "mindestens einer"
     waere dort von Anfang an falsch gewesen. Geaendert wurde ohnehin keine
     einzige HTML-Datei, nur die zwei JS-Dateien des Tors. */
  const { ctx, page } = await seite('index.html');
  const d = await page.evaluate(() => ({
    telLinks: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')),
    waLinks: document.querySelectorAll('a[href*="wa.me"]').length,
  }));
  pruef('/index: Telefonlink im Markup unberuehrt',
        d.telLinks.indexOf('tel:+491737513627') !== -1, JSON.stringify(d.telLinks));
  pruef('/index: WhatsApp-Links unberuehrt', d.waLinks >= 1, 'Anzahl ' + d.waLinks);
  await ctx.close();
}

console.log('\n── E. Video-Fassade auf der Startseite behaelt ihren Absatz ──');
{
  const { ctx, page } = await seite('index.html');
  /* Die Fassade zeigt erst Poster und Play. Ihr Einwilligungstor baut sie
     in renderConsentNotice, und das laeuft erst nach dem Klick auf Play. */
  await page.evaluate(() => {
    const b = document.querySelector('.vfacade__play');
    if (b) b.click();
  });
  await page.waitForTimeout(1200);
  const d = await page.evaluate(() => {
    const kaesten = [...document.querySelectorAll('.bomaye-consent-gate')];
    const video = kaesten.find((k) => {
      const b = k.querySelector('.bomaye-consent-gate__btn');
      return b && /VIDEO LADEN/i.test(b.textContent || '');
    });
    if (!video) return { da: false };
    const alt = video.querySelector('.bomaye-consent-gate__alt');
    if (!alt) return { da: true, alt: false };
    const a = alt.querySelector('a[href^="tel:"]');
    const r = a ? a.getBoundingClientRect() : null;
    return {
      da: true, alt: true,
      text: (alt.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 70),
      hoehe: r ? Math.round(r.height) : 0,
    };
  });
  if (!d.da) {
    pruef('Video-Fassade auf /index gezeichnet', false, 'kein Video-Tor gefunden');
  } else {
    pruef('Video-Fassade hat ihren Absatz noch', d.alt === true, d.text);
    pruef('Tippflaeche im Video-Absatz mindestens 44px', d.hoehe >= 44, d.hoehe + 'px');
  }
  await ctx.close();
}

await b.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

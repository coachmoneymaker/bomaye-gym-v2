/* Der Weg, der bisher ungeprueft war: Einwilligung ERST NACH dem Tor-Knopf,
 * und ein erster Anlauf, der scheitert.
 *
 *   node tor-knopf.mjs [WURZEL]
 *
 * Alle Tests bis PR #190 setzten die Einwilligung schon beim Seitenaufbau.
 * Genau deshalb ist der Rueckfall auf /probetraining durchgerutscht.
 *
 * Nachgebaut wird das echte Cookiebot:
 *   - jedes <script> ohne data-cookieconsent="ignore" wird beim Ausliefern
 *     auf type="text/plain" gestellt, solange Statistik nicht eingewilligt
 *     ist;
 *   - der gespeicherte Stand kommt mit CookiebotOnConsentReady, hier auf
 *     "abgelehnt", so wie nach einem Klick auf Ablehnen;
 *   - die Einwilligung kommt ueber den Tor-Knopf und danach
 *     CookiebotOnAccept, nur Marketing.
 *
 * Abschnitt B und C sind der Kern: der erste Anlauf scheitert. Auf main
 * bleibt der Kalender danach fuer immer leer, weil _ptMounted ganz oben im
 * Rueckruf gesetzt wurde und jeder spaetere Anlauf daran abprallt.
 */
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



/* cdnVerhalten: 'gut' liefert das Bundle immer,
   'ersterFehlschlag' laesst die ERSTE Anfrage scheitern,
   'ersterHaenger' laesst die erste Anfrage ohne Antwort haengen. */
async function seite(pfad, { cdnVerhalten = 'gut', cookiebot = 'spaet' } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  const page = await ctx.newPage();
  const bsport = [];
  const logs = [];
  let cdnZaehler = 0;
  page.on('console', (m) => { if (m.type() !== 'error') logs.push(m.type() + ': ' + m.text().slice(0, 160)); });
  page.on('pageerror', (e) => logs.push('ERROR: ' + String(e).slice(0, 160)));
  page.on('request', (r) => { if (/bsport\.io/.test(r.url())) bsport.push(r.url()); });

  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (/cdn\.bsport\.io/.test(u)) {
      cdnZaehler++;
      if (cdnZaehler === 1 && cdnVerhalten === 'ersterFehlschlag') {
        return route.abort('failed');
      }
      if (cdnZaehler === 1 && cdnVerhalten === 'ersterHaenger') {
        /* Haengen lassen, bis der Zaehler im Lader aufgegeben hat (15 s),
           dann abbrechen. Offen lassen geht nicht: der Browser haengt eine
           zweite Anfrage auf dieselbe URL an die noch offene erste, und
           dann wartet auch der zweite Anlauf ewig - ein Artefakt des
           Nachbaus, kein Verhalten der Seite. */
        await new Promise((r) => setTimeout(r, 17000));
        return route.abort('failed');
      }
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: BUNDLE });
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

  /* DER ECHTE STARTZUSTAND, live gemessen am 05.11.2026 auf /probetraining
     mit geloeschtem Keks, vor jedem Klick im Banner:

       bei DOMContentLoaded   window.Cookiebot ist undefined
       etwa 2,5 s spaeter     Cookiebot.consent = {stamp:"0", necessary:true,
                              preferences:false, statistics:false,
                              marketing:false, method:null}
       dabei                  null Anfragen an cdn.bsport.io,
                              kein script#bsport-widget-cdn

     uc.js kommt von consent.cookiebot.com, also ueber das Netz. Auf einer
     Mobilverbindung sind mehrere Sekunden normal. Die Sperre deckt das mit
     whenCookiebotReady ab und entsperrt ihren Knopf erst, wenn
     Cookiebot.renew eine Funktion ist - genau das macht der Stub hier nach.

     cookiebot = 'da'     Cookiebot steht schon beim Aufbau (alles aus)
     cookiebot = 'spaet'  der gemessene Fall: erst nach 2,5 s da */
  await page.addInitScript((wann) => {
    var echterStand = { stamp: '0', necessary: true, preferences: false,
                        statistics: false, marketing: false, method: null };
    function cookiebotBauen() {
      window.Cookiebot = {
        consent: echterStand,
        consented: false,
        renew: function () { window.__renew = (window.__renew || 0) + 1; },
      };
    }
    if (wann === 'da') { cookiebotBauen(); return; }
    window.__cookiebotSpaet = function () {
      cookiebotBauen();
      window.dispatchEvent(new Event('CookiebotOnConsentReady'));
    };
  }, cookiebot);

  await page.goto(basis + pfad, { waitUntil: 'load' });
  if (cookiebot === 'da') {
    await page.evaluate(() => window.dispatchEvent(new Event('CookiebotOnConsentReady')));
    await page.waitForTimeout(1800);
  } else {
    /* 2,5 Sekunden ohne Cookiebot, so wie gemessen. */
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.__cookiebotSpaet());
    await page.waitForTimeout(1800);
  }
  return { ctx, page, bsport, logs };
}


/* Die Einwilligung so geben, wie das Banner sie gibt: nur Marketing. */
async function marketingErlauben(page) {
  await page.evaluate(() => {
    window.Cookiebot.consent = { marketing: true, statistics: false, preferences: false };
    window.Cookiebot.consented = true;
    window.dispatchEvent(new Event('CookiebotOnAccept'));
  });
}

const HINWEIS_SOLL = 'Mit Tippen lädst du unseren Buchungskalender von bsport '
                  + 'und stimmst Marketing-Cookies zu. Mehr in den Cookie-Einstellungen.';

async function stand(page) {
  return page.evaluate((hinweisSoll) => {
    const kaesten = [...document.querySelectorAll('.bomaye-consent-gate')];
    /* Die Video-Fassade auf der Startseite teilt die Klasse mit dem
       Buchungstor. Unterschieden wird am Knopf. */
    const buchung = kaesten.filter((k) => {
      const b = k.querySelector('.bomaye-consent-gate__btn');
      return !b || !/VIDEO LADEN/i.test(b.textContent || '');
    });
    const hinweise = buchung
      .map((k) => k.querySelector('.bomaye-consent-gate__hinweis'))
      .filter(Boolean)
      .map((h) => (h.innerText || '').replace(/\s+/g, ' ').trim());
    return {
      cdnSkript: !!document.getElementById('bsport-widget-cdn'),
      widget: typeof window.BsportWidget,
      montiert: window.__montiert || 0,
      elternteil: window.__letzteConfig ? window.__letzteConfig.parentElement : '(nie montiert)',
      hinweis: !!document.querySelector('.bomaye-consent-gate__reload'),
      /* Seit dem 05.11.2026 entfernt: der Absatz mit Telefon und WhatsApp
         im Tor selbst. Der Rueckfall nach zwei Fehlversuchen bleibt. */
      altImTor: buchung.reduce(
        (n, k) => n + k.querySelectorAll('.bomaye-consent-gate__alt').length, 0),
      telefonAbsatz: /Lieber ohne Cookies buchen/.test(document.body.innerText || ''),
      hinweisStimmt: hinweise.length === 0 || hinweise.every((h) => h === hinweisSoll),
      hinweisTexte: hinweise,
    };
  }, HINWEIS_SOLL);
}


async function konversionen(page) {
  return page.evaluate(() => {
    const dl = window.dataLayer || [];
    let k = 0, bu = 0;
    for (const e of dl) {
      if (e && e.event === 'probetraining_booking_completed') bu++;
      if (e && typeof e === 'object' && e.length >= 3 && e[0] === 'event' && e[1] === 'conversion') k++;
    }
    return { k, bu };
  });
}

/* ═══════════ A. Der gemeldete Weg: Knopf, dann nur Marketing ═══════════ */
for (const cookiebot of ['spaet', 'da']) {
  console.log(`\n── A. /probetraining: Tor-Knopf, dann nur Marketing `
            + `(Cookiebot ${cookiebot === 'spaet' ? 'erst nach 2,5 s, wie gemessen' : 'schon beim Aufbau'}) ──`);
  const { ctx, page, bsport, logs } = await seite('probetraining.html', { cookiebot });
  const m = cookiebot === 'spaet' ? 'spaet' : 'da';
  pruef(m + ': vor dem Knopf keine Anfrage an bsport.io', bsport.length === 0,
        'Anzahl ' + bsport.length + (bsport.length ? ' ' + JSON.stringify(bsport) : ''));
  const vor = await stand(page);
  pruef(m + ': vor dem Knopf kein script#bsport-widget-cdn', vor.cdnSkript === false);
  pruef(m + ': kein Telefon-Absatz im Tor', vor.altImTor === 0 && vor.telefonAbsatz === false,
        'altImTor ' + vor.altImTor + ', Text ' + vor.telefonAbsatz);
  pruef(m + ': Einwilligungshinweis Wort fuer Wort unveraendert', vor.hinweisStimmt,
        JSON.stringify(vor.hinweisTexte).slice(0, 170));
  const geklickt = await torKnopfDruecken(page);
  pruef(m + ': ein Tor-Knopf ist da und nicht gesperrt',
        geklickt.indexOf('kein Tor-Knopf') === -1 && geklickt.indexOf('GESPERRT') === -1, geklickt);
  await marketingErlauben(page);
  await page.waitForTimeout(4000);

  const d = await stand(page);
  pruef(m + ': script#bsport-widget-cdn existiert', d.cdnSkript === true, String(d.cdnSkript));
  pruef(m + ': window.BsportWidget geladen', d.widget === 'object', d.widget);
  pruef(m + ': mount gerufen mit parentElement bsport-widget-172485',
        d.montiert === 1 && d.elternteil === 'bsport-widget-172485',
        d.montiert + 'x, ' + d.elternteil);
  pruef(m + ': kein "Erneut versuchen"', d.hinweis === false);

  await nachricht(page, BACKOFFICE, { type: 'API_SUCCESS', data: { message: 'success' } });
  await nachricht(page, BACKOFFICE, { type: 'PAYMENT_SUCCESS', source: 'bsport' });
  await nachricht(page, BACKOFFICE, { type: 'PAYMENT_SUCCESS', source: 'bsport' });
  const z = await konversionen(page);
  pruef(m + ': PAYMENT_SUCCESS ergibt genau eine Konversion', z.k === 1, 'Anzahl ' + z.k);
  pruef(m + ': genau ein Buchungsereignis', z.bu === 1, 'Anzahl ' + z.bu);
  pruef(m + ': Bruecke geladen, keine Fehler',
        logs.filter((l) => /ERROR|Consent-Bruecke nicht geladen/.test(l)).length === 0,
        JSON.stringify(logs.filter((l) => /ERROR|Bruecke nicht/.test(l))).slice(0, 150));
  await ctx.close();
}

/* ═══════ B. Erster Anlauf scheitert am Netz, dann noch eine Chance ═════ */
console.log('\n── B. Erste CDN-Anfrage scheitert, danach erneute Einwilligung ──');
{
  const { ctx, page } = await seite('probetraining.html', { cdnVerhalten: 'ersterFehlschlag' });
  await torKnopfDruecken(page);
  await marketingErlauben(page);
  await page.waitForTimeout(3000);

  let d = await stand(page);
  pruef('nach dem Fehlschlag ist noch nicht montiert', d.montiert === 0, 'Anzahl ' + d.montiert);

  /* Cookiebot meldet den Stand noch einmal - zum Beispiel, weil der
     Besucher die Einstellungen erneut bestaetigt. Jetzt muss ein zweiter
     Anlauf starten. Auf main prallt er an _ptMounted ab. */
  await page.evaluate(() => {
    const s = document.getElementById('bsport-widget-cdn');
    if (s && s.parentNode) s.parentNode.removeChild(s);   /* wie ein harter Fehlschlag */
    window.dispatchEvent(new Event('CookiebotOnAccept'));
  });
  await page.waitForTimeout(4000);
  d = await stand(page);
  pruef('zweiter Anlauf laedt das Bundle', d.widget === 'object', d.widget);
  pruef('zweiter Anlauf montiert den Kalender',
        d.montiert === 1 && d.elternteil === 'bsport-widget-172485',
        d.montiert + 'x, ' + d.elternteil);
  await ctx.close();
}

/* ═══════ C. Erster Anlauf haengt, der Lader gibt auf, dann neu ═════════ */
console.log('\n── C. Erste CDN-Anfrage haengt, Lader gibt nach 15 s auf ──');
{
  const { ctx, page, logs } = await seite('probetraining.html', { cdnVerhalten: 'ersterHaenger' });
  await torKnopfDruecken(page);
  await marketingErlauben(page);
  /* 15 s Zaehler plus Luft. */
  await page.waitForTimeout(18000);

  let d = await stand(page);
  pruef('nach dem Haenger ist nicht montiert', d.montiert === 0, 'Anzahl ' + d.montiert);
  pruef('der Lader meldet das Aufgeben in der Konsole',
        logs.some((l) => /Anlauf gescheitert/.test(l)),
        JSON.stringify(logs.filter((l) => /pt\]/.test(l))).slice(0, 150));

  await page.evaluate(() => {
    const s = document.getElementById('bsport-widget-cdn');
    if (s && s.parentNode) s.parentNode.removeChild(s);
    window.dispatchEvent(new Event('CookiebotOnAccept'));
  });
  await page.waitForTimeout(4000);
  d = await stand(page);
  pruef('nach dem Aufgeben laeuft ein neuer Anlauf', d.widget === 'object', d.widget);
  pruef('und montiert den Kalender', d.montiert === 1, 'Anzahl ' + d.montiert);
  await ctx.close();
}

/* ═══ E. "Erneut versuchen" muss auf /probetraining etwas tun ═══════════ */
console.log('\n── E. Der Knopf "Erneut versuchen" loest einen neuen Anlauf aus ──');
{
  /* Erster Anlauf scheitert am Netz. Dann drueckt der Besucher den Knopf,
     den die Sperre anbietet. Auf main laedt der nur ab, was die Sperre
     abgefangen hat - und auf dieser Seite hat sie nichts abgefangen, weil
     der Rueckruf das Script selbst anlegt. Der Knopf dreht sich im Leeren. */
  const { ctx, page } = await seite('probetraining.html', { cdnVerhalten: 'ersterFehlschlag' });
  await torKnopfDruecken(page);
  await marketingErlauben(page);
  await page.waitForTimeout(3000);
  let d = await stand(page);
  pruef('nach dem Fehlschlag nicht montiert', d.montiert === 0, 'Anzahl ' + d.montiert);

  /* Die Sperre zeigt ihren Hinweis erst nach ihrer eigenen Wartezeit.
     Steht er nicht, wird er hier nachgebaut - geprueft wird der Horcher,
     nicht der Zeitpunkt der Sperre. */
  const hatHinweis = await page.evaluate(() => {
    if (document.querySelector('.bomaye-consent-gate__reload')) return 'echt';
    const b = document.createElement('button');
    b.className = 'bomaye-consent-gate__reload';
    b.textContent = 'ERNEUT VERSUCHEN';
    (document.getElementById('bsport-widget-172485') || document.body).appendChild(b);
    return 'nachgebaut';
  });
  await page.evaluate(() => {
    const s = document.getElementById('bsport-widget-cdn');
    if (s && s.parentNode) s.parentNode.removeChild(s);
    document.querySelector('.bomaye-consent-gate__reload').click();
  });
  await page.waitForTimeout(4000);
  d = await stand(page);
  pruef('nach "Erneut versuchen" laedt das Bundle', d.widget === 'object', d.widget + ' (' + hatHinweis + ')');
  pruef('nach "Erneut versuchen" ist der Kalender montiert',
        d.montiert === 1 && d.elternteil === 'bsport-widget-172485',
        d.montiert + 'x, ' + d.elternteil);
  await ctx.close();
}

/* ═══════════════ D. Die anderen Buchungsseiten, gleicher Weg ═══════════ */
console.log('\n── D. Regression: /stundenplan, /preise, /mitglied-werden ──');
for (const pfad of ['stundenplan.html', 'preise.html', 'mitglied-werden.html']) {
  const { ctx, page, bsport, logs } = await seite(pfad);
  const name = pfad.replace('.html', '');
  pruef(name + ': vor dem Knopf keine Anfrage an bsport.io', bsport.length === 0,
        'Anzahl ' + bsport.length);
  const vorD = await stand(page);
  const geklickt = await torKnopfDruecken(page);
  pruef(name + ': ein Tor-Knopf ist da und nicht gesperrt',
        geklickt.indexOf('kein Tor-Knopf') === -1 && geklickt.indexOf('GESPERRT') === -1, geklickt);
  await marketingErlauben(page);
  await page.waitForTimeout(4000);
  const d = await page.evaluate(() => ({
    widget: typeof window.BsportWidget,
    hinweis: !!document.querySelector('.bomaye-consent-gate__reload'),
    tote: [...document.querySelectorAll('script[type="text/plain"]')]
      .filter((s) => {
        const u = s.getAttribute('src') || '';
        return (u && u.indexOf('assets/js/') !== -1
                && u.indexOf('pixel-events') === -1 && u.indexOf('plan-tracking') === -1)
            || (!u && /MountBsportWidget|cdn\.bsport\.io/.test(s.textContent || ''));
      }).length,
  }));
  pruef(name + ': window.BsportWidget geladen', d.widget === 'object', d.widget);
  pruef(name + ': nach dem Knopf Anfrage an bsport.io', bsport.length >= 1, 'Anzahl ' + bsport.length);
  pruef(name + ': kein "Erneut versuchen"', d.hinweis === false);
  pruef(name + ': kein eigenes Skript stillgelegt', d.tote === 0, 'Anzahl ' + d.tote);
  pruef(name + ': kein Telefon-Absatz im Tor', vorD.altImTor === 0 && vorD.telefonAbsatz === false,
        'altImTor ' + vorD.altImTor + ', Text ' + vorD.telefonAbsatz);
  pruef(name + ': Einwilligungshinweis unveraendert', vorD.hinweisStimmt,
        JSON.stringify(vorD.hinweisTexte).slice(0, 170));
  pruef(name + ': keine Fehler', logs.filter((l) => /ERROR/.test(l)).length === 0,
        JSON.stringify(logs.filter((l) => /ERROR/.test(l))).slice(0, 150));
  await ctx.close();
}

await b.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

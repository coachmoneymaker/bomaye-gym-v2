/* Gemeinsame Grundlage aller Suiten in diesem Ordner.
 *
 * Hier steht, was jede Suite braucht: ein kleiner Dateiserver, Cookiebots
 * Blockade als Nachbau, ein Platzhalter fuer Bsports Bundle, und die
 * Zaehlerei fuer OK und FEHL.
 *
 * WARUM DIESE DATEI EXISTIERT
 * Die Suiten lagen bis zum 05.11.2026 in einem Sitzungsordner und waren
 * nach jeder Sitzung weg. Drei von ihnen sind dabei verloren gegangen.
 * Jetzt liegen sie im Repo, und damit sie auf jedem Rechner laufen, steht
 * hier kein absoluter Pfad mehr.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ─────────────────────────── Playwright finden ───────────────────────────
   Erste Wahl ist das normale Auflösen: dann genuegt ein npm i -D playwright
   im Projekt. Scheitert das, wird die globale Installation versucht, die in
   der Cloud-Umgebung dieses Projekts unter /opt liegt. Hilft auch das
   nicht, soll die Meldung sagen, was zu tun ist, statt einen Stapel
   Modulfehler auszugeben. */
export async function chromiumHolen() {
  const wege = ['playwright', '/opt/node22/lib/node_modules/playwright/index.js'];
  let letzter = null;
  for (const weg of wege) {
    try {
      const pw = await import(weg);
      const { chromium } = pw.default ?? pw;
      if (chromium) return chromium;
    } catch (e) { letzter = e; }
  }
  console.error('Playwright nicht gefunden. Entweder "npm i -D playwright" im '
              + 'Projekt, oder eine globale Installation.\nZuletzt: '
              + (letzter && letzter.message));
  process.exit(2);
}

/* ──────────────────────── Welcher Baum wird geprueft ─────────────────────
   Ohne Argument der Baum, in dem diese Datei liegt. Mit Argument ein
   anderer, zum Beispiel ein Auszug von main:

     git archive origin/main | tar -x -C /tmp/main
     node tests/zahlung.mjs /tmp/main

   So laesst sich zeigen, dass eine Pruefung auf main scheitert und mit der
   Aenderung besteht. */
export function wurzelBestimmen() {
  const hier = dirname(fileURLToPath(import.meta.url));
  return process.argv[2] ? resolve(process.argv[2]) : resolve(hier, '..');
}

const TYP = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain',
  '.xml': 'application/xml', '.pdf': 'application/pdf',
};

/* Der Dateiserver. Ohne Endung wird .html angenommen, damit /preise
   genauso funktioniert wie /preise.html - so liefert Vercel es auch aus. */
export async function serverStarten(wurzel) {
  const srv = createServer(async (req, res) => {
    let pfad = decodeURIComponent(req.url.split('?')[0]);
    if (pfad === '/') pfad = '/index.html';
    if (!extname(pfad)) pfad += '.html';
    try {
      const buf = await readFile(join(wurzel, pfad));
      res.writeHead(200, { 'content-type': TYP[extname(pfad)] || 'application/octet-stream' });
      res.end(buf);
    } catch (e) { res.writeHead(404); res.end('nicht da'); }
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { srv, basis: `http://127.0.0.1:${srv.address().port}/` };
}

/* ─────────────────────────── Zaehlerei ─────────────────────────── */
export function zaehler() {
  let ok = 0, fehler = 0;
  return {
    pruef(name, gut, zusatz) {
      if (gut) { ok++; console.log('OK   ' + name + (zusatz !== undefined ? '  ' + zusatz : '')); }
      else { fehler++; console.log('FEHL ' + name + (zusatz !== undefined ? '  ' + zusatz : '')); }
    },
    abschluss() {
      console.log(`\n${ok}/${ok + fehler} bestanden, ${fehler} Fehler`);
      return fehler;
    },
  };
}

/* ───────────────────────── Bsport und Cookiebot ───────────────────────── */

/* Von hier kommt PAYMENT_SUCCESS, zeichengenau. Live gemessen am
   04.11.2026 und von Bsport (Luca) bestaetigt. */
export const BACKOFFICE = 'https://backoffice.bsport.io';
export const CDN = 'https://cdn.bsport.io';

/* Platzhalter fuer cdn.bsport.io/scripts/widget.js. Das echte Bundle ist
   aus dieser Umgebung nicht erreichbar (403 am Proxy). Montieren heisst
   hier: mitschreiben, dass montiert wurde, und mit welcher Konfiguration. */
export const BUNDLE =
  'window.BsportWidget={mount:function(c){window.__montiert=(window.__montiert||0)+1;'
  + 'window.__letzteConfig=c;}};';

/* Der Einwilligungshinweis im Tor, Wort fuer Wort. Er soll unveraendert
   bleiben; der Absatz mit Telefon und WhatsApp wurde am 05.11.2026
   entfernt (PR #192). */
export const TOR_HINWEIS =
  'Mit Tippen lädst du unseren Buchungskalender von bsport '
  + 'und stimmst Marketing-Cookies zu. Mehr in den Cookie-Einstellungen.';

/* Der Rueckfall, der erst nach dem ZWEITEN gescheiterten Ladeversuch
   erscheint. Der bleibt, mit Telefon und WhatsApp. */
export const TOR_RUECKFALL = 'Das Buchungssystem laedt gerade nicht. Buche direkt bei uns:';

/* COOKIEBOTS AUTOMATISCHE BLOCKADE, NACHGEBAUT
   Mit data-blockingmode="auto" stellt Cookiebot jedes <script> ohne
   data-cookieconsent="ignore" auf type="text/plain", solange die passende
   Kategorie nicht eingewilligt ist. Das trifft auch erstklassige eigene
   Skripte, nicht nur fremde - zweimal live gemessen (PR #189, #190).

   Cookiebots eigenes uc.js bleibt aussen vor, das laeuft bei ihm immer.
   Nachgespielt wird hier nichts: Cookiebot fuehrt cdn.bsport.io wegen
   RudderStack unter Statistik, und bei reiner Marketing-Einwilligung gibt
   es die Skripte deshalb nie zurueck. Genau daran hing die Buchungsschleife. */
export function cookiebotSperrt(html, { statistics = false } = {}) {
  if (statistics) return html;
  return html.replace(/<script([^>]*)>/gi, (ganz, attr) => {
    if (/data-cookieconsent\s*=\s*["']ignore["']/i.test(attr)) return ganz;
    if (/type\s*=\s*["'](application\/ld\+json|text\/plain)/i.test(attr)) return ganz;
    if (/consent\.cookiebot\.com/i.test(attr)) return ganz;
    return '<script' + attr + ' type="text/plain">';
  });
}

/* Der Einwilligungsstand, den das echte Cookiebot meldet. Live gemessen am
   05.11.2026 auf /probetraining mit geloeschtem Keks: bei DOMContentLoaded
   ist window.Cookiebot undefined, etwa 2,5 Sekunden spaeter steht dieses
   Objekt da. */
export const STAND_ABGELEHNT = {
  stamp: '0', necessary: true, preferences: false,
  statistics: false, marketing: false, method: null,
};
export const STAND_NUR_MARKETING = {
  stamp: '1', necessary: true, preferences: false,
  statistics: false, marketing: true, method: 'explicit',
};
export const STAND_ALLES = {
  stamp: '1', necessary: true, preferences: true,
  statistics: true, marketing: true, method: 'explicit',
};

/* Eine Seite oeffnen, mit Cookiebot-Nachbau und Bsport-Platzhalter.
 *
 *   stand       der Einwilligungsstand, den Cookiebot meldet
 *   sperre      true: Cookiebots Blockade beim Ausliefern anwenden
 *   spaet       true: window.Cookiebot gibt es beim Aufbau noch nicht,
 *               es erscheint erst nach cookiebotNachMs (der gemessene Fall)
 *   cdnVerhalten 'gut' | 'ersterFehlschlag' | 'ersterHaenger' | 'kaputt'
 */
export async function seiteOeffnen(browser, basis, pfad, {
  stand = STAND_ABGELEHNT,
  sperre = true,
  spaet = true,
  cookiebotNachMs = 600,
  cdnVerhalten = 'gut',
  breite = 390,
  warten = 1800,
} = {}) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: 900 } });
  const page = await ctx.newPage();
  const bsport = [];
  const logs = [];
  let cdnZaehler = 0;
  page.on('console', (m) => { if (m.type() !== 'error') logs.push(m.type() + ': ' + m.text().slice(0, 180)); });
  page.on('pageerror', (e) => logs.push('ERROR: ' + String(e).slice(0, 180)));
  page.on('request', (r) => { if (/bsport\.io/.test(r.url())) bsport.push(r.url()); });

  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (/cdn\.bsport\.io/.test(u)) {
      cdnZaehler++;
      if (cdnVerhalten === 'kaputt') return route.abort('failed');
      if (cdnZaehler === 1 && cdnVerhalten === 'ersterFehlschlag') return route.abort('failed');
      if (cdnZaehler === 1 && cdnVerhalten === 'ersterHaenger') {
        /* Haengen lassen, bis der Zaehler im Lader aufgegeben hat (15 s),
           dann abbrechen. Offen lassen geht nicht: der Browser haengt eine
           zweite Anfrage auf dieselbe URL an die noch offene erste. */
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
    const html = sperre
      ? cookiebotSperrt(await res.text(), { statistics: !!stand.statistics })
      : await res.text();
    return route.fulfill({ response: res, body: html,
      headers: { ...res.headers(), 'content-type': 'text/html' } });
  });

  await page.addInitScript(({ s, sp }) => {
    function bauen() {
      window.Cookiebot = {
        consent: s,
        consented: !!(s.marketing || s.statistics || s.preferences),
        renew: function () { window.__renew = (window.__renew || 0) + 1; },
      };
    }
    if (!sp) { bauen(); return; }
    /* Der gemessene Fall: uc.js kommt ueber das Netz und ist beim Aufbau
       noch nicht durch. Die Suite ruft __cookiebotSpaet(), wenn es soweit
       ist. bsport-gate.js wartet darauf mit whenCookiebotReady und
       entsperrt seinen Knopf erst, wenn Cookiebot.renew eine Funktion
       ist - darum muss der Platzhalter die Funktion haben. */
    window.__cookiebotSpaet = function () {
      bauen();
      window.dispatchEvent(new Event('CookiebotOnConsentReady'));
    };
  }, { s: stand, sp: spaet });

  await page.goto(basis + pfad, { waitUntil: 'load' });
  if (spaet) {
    await page.waitForTimeout(cookiebotNachMs);
    await page.evaluate(() => window.__cookiebotSpaet());
  } else {
    await page.evaluate(() => window.dispatchEvent(new Event('CookiebotOnConsentReady')));
  }
  await page.waitForTimeout(warten);
  return { ctx, page, bsport, logs };
}

/* Die Einwilligung so geben, wie das Banner sie gibt. */
export async function einwilligen(page, stand = STAND_NUR_MARKETING) {
  await page.evaluate((s) => {
    window.Cookiebot.consent = s;
    window.Cookiebot.consented = !!(s.marketing || s.statistics || s.preferences);
    window.dispatchEvent(new Event('CookiebotOnAccept'));
  }, stand);
}

/* Den Knopf im Einwilligungstor druecken. Gibt zurueck, was gedrueckt
   wurde, damit eine fehlende oder gesperrte Schaltflaeche im Protokoll
   sichtbar ist statt stillschweigend durchzugehen. */
export async function torKnopfDruecken(page) {
  return page.evaluate(() => {
    const b = [...document.querySelectorAll('button')]
      .filter((x) => /TERMINE ANZEIGEN|MARKETING|BUCHUNG LADEN/i.test(x.textContent || ''));
    if (!b.length) return '(kein Tor-Knopf gefunden)';
    b[0].click();
    return b[0].className.trim() + (b[0].disabled ? ' [GESPERRT]' : '');
  });
}

/* Eine Nachricht so schicken, wie ein fremder Origin sie schickt.
   window.postMessage aus der Seite selbst traegt den Origin der Seite; der
   Origin-Vergleich im Code wuerde das zu Recht abweisen. Darum ein echtes
   MessageEvent mit gesetztem origin. */
export async function nachricht(page, origin, daten, ruhe = 200) {
  await page.evaluate(({ o, d }) => {
    window.dispatchEvent(new MessageEvent('message', { origin: o, data: d }));
  }, { o: origin, d: daten });
  await page.waitForTimeout(ruhe);
}

/* Was im dataLayer angekommen ist. gtag ist auf diesen Seiten der kleine
   Stub aus dem Seitenkopf: gtag(...) schiebt die Argumente in den
   dataLayer. Die Ads-Konversion ist dort also nachweisbar, ohne dass
   googletagmanager.com erreichbar sein muss. */
export async function dataLayerZaehlen(page) {
  return page.evaluate(() => {
    const dl = window.dataLayer || [];
    let konversionen = 0, buchungen = 0;
    for (const e of dl) {
      if (e && e.event === 'probetraining_booking_completed') buchungen++;
      if (e && typeof e === 'object' && e.length >= 3
          && e[0] === 'event' && e[1] === 'conversion') konversionen++;
    }
    let gespeichert = null;
    try { gespeichert = window.sessionStorage.getItem('bomaye:pt-konversion-gesendet'); }
    catch (x) { /* privates Fenster */ }
    return { konversionen, buchungen, gespeichert };
  });
}

/* Die Buchungstore auf der Seite. Die Video-Fassade auf der Startseite
   benutzt dieselbe CSS-Klasse; unterschieden wird am Knopf. */
export async function torZustand(page, hinweisSoll = TOR_HINWEIS) {
  return page.evaluate((soll) => {
    const kaesten = [...document.querySelectorAll('.bomaye-consent-gate')];
    const buchung = kaesten.filter((k) => {
      const b = k.querySelector('.bomaye-consent-gate__btn');
      return !b || !/VIDEO LADEN/i.test(b.textContent || '');
    });
    const hinweise = buchung
      .map((k) => k.querySelector('.bomaye-consent-gate__hinweis'))
      .filter(Boolean)
      .map((h) => (h.innerText || '').replace(/\s+/g, ' ').trim());
    return {
      tore: buchung.length,
      altImTor: buchung.reduce(
        (n, k) => n + k.querySelectorAll('.bomaye-consent-gate__alt').length, 0),
      telefonAbsatz: /Lieber ohne Cookies buchen/.test(document.body.innerText || ''),
      hinweise,
      hinweisStimmt: hinweise.length === 0 || hinweise.every((h) => h === soll),
      reload: !!document.querySelector('.bomaye-consent-gate__reload'),
    };
  }, hinweisSoll);
}

/* Die Buchungserkennung: nur PAYMENT_SUCCESS, genau einmal je Buchung.
 *
 *   node tests/zahlung.mjs                  gegen den Arbeitsstand
 *   node tests/zahlung.mjs /pfad/zu/main    gegen einen anderen Baum
 *
 * WORUM ES GEHT
 * Bsport sendet genau eine Nachricht, die eine abgeschlossene Buchung
 * bedeutet: {"type":"PAYMENT_SUCCESS","source":"bsport"} vom Origin
 * https://backoffice.bsport.io. Von Bsport (Luca) bestaetigt: sie kommt auf
 * der Bestaetigungsseite des Checkouts, auch bei Gratisbuchungen und beim
 * Express-Checkout. Eine dokumentierte Schnittstelle ist das nicht.
 *
 * Vom selben Origin kommen waehrend des Ladens und Buchens reihenweise
 * andere Nachrichten: API_ACKNOWLEDGE, API_SUCCESS (mit Nutzdaten),
 * bsport-widget-resize, CLOSE_MODAL, IFRAME_LOGIN_SUCCESS,
 * intercom-snippet__ready. Keine davon bedeutet eine Buchung.
 *
 * DER FEHLER, DEN DIESE SUITE VERHINDERT (live gemessen am 04.11.2026)
 * Vorher suchte probetraining-page.js im zusammengesetzten Text der
 * Nachricht nach "booking", "success", "confirmed", "buchung" und
 * "viel spa". API_SUCCESS enthaelt "success". Folge: das dataLayer-Ereignis
 * probetraining_booking_completed und die Google-Ads-Konversion feuerten
 * zehn Sekunden nach dem Laden des Widgets, etwa sieben Minuten vor der
 * echten Buchung. Danach sperrte die Flagge im sessionStorage die echte
 * Buchung. Jeder, der nur den Kalender aufmachte, erzeugte eine Konversion,
 * und jede echte Buchung ging verloren.
 */
import {
  chromiumHolen, wurzelBestimmen, serverStarten, zaehler,
  seiteOeffnen, einwilligen, torKnopfDruecken, nachricht, dataLayerZaehlen,
  BACKOFFICE, STAND_ABGELEHNT, STAND_NUR_MARKETING, STAND_ALLES,
} from './gemeinsam.mjs';

const chromium = await chromiumHolen();
const wurzel = wurzelBestimmen();
const { srv, basis } = await serverStarten(wurzel);
const browser = await chromium.launch();
const { pruef, abschluss } = zaehler();

console.log('Baum: ' + wurzel + '\n');

/* Die Folge, die Bsport live gesendet hat. API_SUCCESS traegt absichtlich
   "booking", "confirmed" und "success" im Rumpf: genau daran ist die alte
   Textsuche gescheitert. */
const LAERM = [
  { type: 'API_ACKNOWLEDGE' },
  { type: 'API_SUCCESS', data: { id: 1234, booking: { status: 'confirmed' }, message: 'success' } },
  { type: 'bsport-widget-resize', height: 1975 },
  { type: 'CLOSE_MODAL' },
  { type: 'IFRAME_LOGIN_SUCCESS' },
  { type: 'intercom-snippet__ready' },
];
const ZAHLUNG = { type: 'PAYMENT_SUCCESS', source: 'bsport' };

/* Den Kalender bis zum laufenden Horcher bringen: Tor-Knopf, dann nur
   Marketing. Vorher laeuft kein Horcher, denn der startet erst, wenn das
   Widget montiert ist. */
async function kalenderStarten(opt = {}) {
  const s = await seiteOeffnen(browser, basis, 'probetraining.html', opt);
  await torKnopfDruecken(s.page);
  await einwilligen(s.page, opt.nachStand || STAND_NUR_MARKETING);
  await s.page.waitForTimeout(4000);
  return s;
}

/* ═══════════ A. Die echte Nachrichtenfolge ═══════════ */
console.log('── A. Die echte Nachrichtenfolge, nur Marketing ──');
{
  const { ctx, page, logs } = await kalenderStarten();
  const start = await page.evaluate(() => typeof window.BsportWidget);
  pruef('Widget geladen, Horcher haengt', start === 'object', start);

  for (const m of LAERM) await nachricht(page, BACKOFFICE, m);
  let z = await dataLayerZaehlen(page);
  pruef('API_ACKNOWLEDGE, API_SUCCESS, resize, CLOSE_MODAL, IFRAME_LOGIN_SUCCESS: '
      + 'keine Konversion', z.konversionen === 0, 'Anzahl ' + z.konversionen);
  pruef('dieselbe Folge: kein Buchungsereignis', z.buchungen === 0, 'Anzahl ' + z.buchungen);

  await nachricht(page, BACKOFFICE, ZAHLUNG);
  z = await dataLayerZaehlen(page);
  pruef('erstes PAYMENT_SUCCESS: genau eine Konversion', z.konversionen === 1, 'Anzahl ' + z.konversionen);
  pruef('erstes PAYMENT_SUCCESS: genau ein Buchungsereignis', z.buchungen === 1, 'Anzahl ' + z.buchungen);

  /* Bsport sendet es zweimal, etwa vier Sekunden auseinander. */
  await page.waitForTimeout(4000);
  await nachricht(page, BACKOFFICE, ZAHLUNG);
  z = await dataLayerZaehlen(page);
  pruef('zweites PAYMENT_SUCCESS nach 4 s: weiterhin eine Konversion',
        z.konversionen === 1, 'Anzahl ' + z.konversionen);
  pruef('zweites PAYMENT_SUCCESS nach 4 s: weiterhin ein Buchungsereignis',
        z.buchungen === 1, 'Anzahl ' + z.buchungen);

  pruef('die Sperre ist ein Zeitstempel, keine Flagge "1"',
        !!z.gespeichert && String(z.gespeichert) !== '1' && Number(z.gespeichert) > 1700000000000,
        String(z.gespeichert));
  pruef('keine Fehler in der Konsole', logs.filter((l) => /ERROR/.test(l)).length === 0,
        JSON.stringify(logs.filter((l) => /ERROR/.test(l))).slice(0, 150));
  await ctx.close();
}

/* ═══════════ B. Origin und Form, zeichengenau ═══════════ */
console.log('\n── B. Origin und Form: zeichengenau, kein Teilstring ──');
{
  const { ctx, page } = await kalenderStarten();
  await nachricht(page, BACKOFFICE, ZAHLUNG);
  let z = await dataLayerZaehlen(page);
  pruef('Grundlage: eine Konversion nach der echten Nachricht',
        z.konversionen === 1, 'Anzahl ' + z.konversionen);

  /* Dieser Origin haette das alte indexOf('bsport.io') passiert. */
  await nachricht(page, 'https://backoffice.bsport.io.angreifer.example', ZAHLUNG);
  await nachricht(page, 'https://evil.example', ZAHLUNG);
  await nachricht(page, 'http://backoffice.bsport.io', ZAHLUNG);
  await nachricht(page, 'https://bsport.io', ZAHLUNG);
  z = await dataLayerZaehlen(page);
  pruef('fremde und aehnliche Origins feuern nicht', z.konversionen === 1, 'Anzahl ' + z.konversionen);

  /* Gross- und Kleinschreibung: Bsport sendet Grossbuchstaben. */
  await nachricht(page, BACKOFFICE, { type: 'payment_success', source: 'bsport' });
  await nachricht(page, BACKOFFICE, { type: 'Payment_Success', source: 'bsport' });
  await nachricht(page, BACKOFFICE, { type: ' PAYMENT_SUCCESS', source: 'bsport' });
  z = await dataLayerZaehlen(page);
  pruef('klein, gemischt oder mit Leerzeichen feuert nicht',
        z.konversionen === 1, 'Anzahl ' + z.konversionen);

  /* Form: es muss ein Objekt sein. */
  await nachricht(page, BACKOFFICE, 'PAYMENT_SUCCESS');
  await nachricht(page, BACKOFFICE, JSON.stringify(ZAHLUNG));
  await nachricht(page, BACKOFFICE, null);
  await nachricht(page, BACKOFFICE, { typ: 'PAYMENT_SUCCESS' });
  await nachricht(page, BACKOFFICE, { data: { type: 'PAYMENT_SUCCESS' } });
  z = await dataLayerZaehlen(page);
  pruef('Zeichenkette, JSON-Text, null, falscher Schluessel, verschachtelt: feuert nicht',
        z.konversionen === 1, 'Anzahl ' + z.konversionen);
  await ctx.close();
}

/* ═══════════ C. Entprellung je Buchung, nicht je Sitzung ═══════════ */
console.log('\n── C. Entprellung je Buchung, nicht je Sitzung ──');
{
  /* Die alte Fassung sperrte mit einer Flagge die ganze Sitzung. Hier wird
     der Zeitstempel auf zwei Minuten in die Vergangenheit gesetzt und neu
     geladen: eine zweite echte Buchung muss gezaehlt werden. */
  const { ctx, page } = await kalenderStarten();
  await nachricht(page, BACKOFFICE, ZAHLUNG);
  let z = await dataLayerZaehlen(page);
  pruef('erste Buchung gezaehlt', z.konversionen === 1, 'Anzahl ' + z.konversionen);

  await page.evaluate(() => {
    window.sessionStorage.setItem('bomaye:pt-konversion-gesendet',
                                  String(Date.now() - 2 * 60 * 1000));
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__cookiebotSpaet && window.__cookiebotSpaet());
  await einwilligen(page, STAND_NUR_MARKETING);
  await page.waitForTimeout(4000);
  await nachricht(page, BACKOFFICE, ZAHLUNG);
  z = await dataLayerZaehlen(page);
  pruef('zweite echte Buchung nach Ablauf der Entprellung wird gezaehlt',
        z.konversionen === 1, 'Anzahl ' + z.konversionen);

  /* Und innerhalb der 60 Sekunden bleibt es bei einer. */
  await nachricht(page, BACKOFFICE, ZAHLUNG);
  z = await dataLayerZaehlen(page);
  pruef('direkt danach keine dritte Konversion', z.konversionen === 1, 'Anzahl ' + z.konversionen);
  await ctx.close();
}

/* ═══════════ D. Ohne Einwilligung wird nichts gemeldet ═══════════ */
console.log('\n── D. Ohne Einwilligung wird nichts geladen und nichts gemeldet ──');
{
  const { ctx, page, bsport } = await seiteOeffnen(browser, basis, 'probetraining.html',
    { stand: STAND_ABGELEHNT });
  for (const m of LAERM) await nachricht(page, BACKOFFICE, m);
  await nachricht(page, BACKOFFICE, ZAHLUNG);
  const z = await dataLayerZaehlen(page);
  pruef('abgelehnt: keine Anfrage an bsport.io', bsport.length === 0, 'Anzahl ' + bsport.length);
  pruef('abgelehnt: keine Konversion', z.konversionen === 0, 'Anzahl ' + z.konversionen);
  pruef('abgelehnt: kein Buchungsereignis', z.buchungen === 0, 'Anzahl ' + z.buchungen);
  await ctx.close();
}

/* ═══════════ E. Mit allen Einwilligungen unveraendert ═══════════ */
console.log('\n── E. Mit allen Einwilligungen unveraendert ──');
{
  const { ctx, page, bsport } = await kalenderStarten({
    stand: STAND_ALLES, nachStand: STAND_ALLES, sperre: true,
  });
  pruef('Widget laedt', bsport.length >= 1, 'Anfragen ' + bsport.length);
  for (const m of LAERM) await nachricht(page, BACKOFFICE, m);
  let z = await dataLayerZaehlen(page);
  pruef('Laerm meldet auch hier nichts', z.konversionen === 0, 'Anzahl ' + z.konversionen);
  await nachricht(page, BACKOFFICE, ZAHLUNG);
  z = await dataLayerZaehlen(page);
  pruef('PAYMENT_SUCCESS meldet genau einmal', z.konversionen === 1, 'Anzahl ' + z.konversionen);
  await ctx.close();
}

await browser.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

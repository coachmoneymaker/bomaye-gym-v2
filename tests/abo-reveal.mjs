/* Abo-Overlay, Origin-Pruefungen, Anmeldeumleitung, Sichtbarkeit.
 *
 *   node tests/abo-reveal.mjs                  gegen den Arbeitsstand
 *   node tests/abo-reveal.mjs /pfad/zu/main    gegen einen anderen Baum
 *
 * WORUM ES GEHT
 *
 * A  Das Abo-Overlay. Ein Klick auf einen Paketknopf darf NIE navigieren,
 *    sondern muss das Overlay oeffnen und das gewaehlte Paket im Streifen
 *    nennen - auch ohne Einwilligung und auch unter Cookiebots Blockade.
 *    Der gemeldete Rueckschritt aus PR #177: bereit() verlangte
 *    MountBsportWidget, und ohne Einwilligung gab es die Funktion nicht,
 *    also wurde der Klick nicht abgefangen und der Besucher landete auf
 *    /mitglied-werden#packages.
 *
 * B  Der Origin-Vergleich in abo-embed.js. Dort stand bis zum 04.11.2026
 *    GAR KEINE Pruefung: jedes Fenster und jeder iframe konnte
 *    {type:"bsport-irgendwas"} senden und den Nachsendeplan abbrechen.
 *
 * C  Der Anmeldehorcher auf /mitgliederbereich. Dort stand ebenfalls keine
 *    Origin-Pruefung, dazu vier Teilstring-Zeilen. {type:"logged_in"} von
 *    einem beliebigen Origin setzte bsport_auth_complete und leitete auf
 *    /mitglied-werden#packages um. Der echte Name ist
 *    IFRAME_LOGIN_SUCCESS, in Grossbuchstaben, live gemessen.
 *
 * D  Sichtbarkeit unter Cookiebots Blockade. Auf index.html steckt der
 *    Reveal-Beobachter in main.js; ohne data-cookieconsent="ignore" war
 *    main.js stillgelegt und Inhalte blieben bei opacity 0 stehen.
 */
import {
  chromiumHolen, wurzelBestimmen, serverStarten, zaehler,
  seiteOeffnen, einwilligen, nachricht,
  BACKOFFICE, STAND_ABGELEHNT, STAND_NUR_MARKETING, STAND_ALLES,
} from './gemeinsam.mjs';

const chromium = await chromiumHolen();
const wurzel = wurzelBestimmen();
const { srv, basis } = await serverStarten(wurzel);
const browser = await chromium.launch();
const { pruef, abschluss } = zaehler();

console.log('Baum: ' + wurzel + '\n');

/* ═══════════ A. Abo-Overlay: Klick auf einen Paketknopf ═══════════ */
console.log('── A. Abo-Overlay: Klick auf einen Paketknopf ──');
for (const [name, stand] of [
  ['alle Einwilligungen', STAND_ALLES],
  ['nur Marketing', STAND_NUR_MARKETING],
  ['abgelehnt', STAND_ABGELEHNT],
]) {
  for (const pfad of ['preise.html', 'mitglied-werden.html']) {
    const { ctx, page, logs } = await seiteOeffnen(browser, basis, pfad, { stand });
    const marke = `${pfad.replace('.html', '')} / ${name}`;
    const knopf = await page.$('[data-abo-contract]');
    if (!knopf) { pruef(marke + ': Paketknopf da', false); await ctx.close(); continue; }
    const id = await page.evaluate((e) => e.getAttribute('data-abo-contract'), knopf);

    const vorher = page.url();
    await page.evaluate((s) => document.querySelector(s).click(),
                        `[data-abo-contract="${id}"]`);
    await page.waitForTimeout(1200);
    const z = await page.evaluate(() => ({
      offen: !!document.querySelector('.bsport-modal-overlay.is-open'),
      name: (document.querySelector('.bomaye-abo-wahl__text strong') || {}).textContent || '',
      pfad: location.pathname + location.hash,
    }));
    pruef(marke + ': Overlay offen', z.offen === true);
    pruef(marke + ': Streifen nennt ein Paket', z.name.length > 0, JSON.stringify(z.name));
    pruef(marke + ': keine Navigation, kein #packages',
          page.url() === vorher && z.pfad.indexOf('#packages') === -1, z.pfad);
    pruef(marke + ': keine Fehler', logs.filter((l) => /ERROR/.test(l)).length === 0,
          JSON.stringify(logs.filter((l) => /ERROR/.test(l))).slice(0, 140));
    await ctx.close();
  }
}

/* ═══════════ B. Origin-Vergleich in abo-embed.js ═══════════ */
console.log('\n── B. Origin-Vergleich in abo-embed.js ──');
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'preise.html',
    { stand: STAND_ALLES });
  const d = await page.evaluate(async () => {
    const k = document.querySelector('[data-abo-contract]');
    if (k) k.click();
    await new Promise((r) => setTimeout(r, 500));
    return { abo: typeof window.bomayeAbo };
  });
  pruef('bomayeAbo ist da', d.abo === 'object', d.abo);

  /* Eine Antwort von einem fremden Origin darf den Nachsendeplan nicht
     beenden und das Overlay nicht stoeren. */
  await nachricht(page, 'https://backoffice.bsport.io.angreifer.example',
                  { type: 'bsport-widget-resize', height: 100 });
  await nachricht(page, 'https://evil.example', { type: 'bsport-irgendwas' });
  let z = await page.evaluate(() => ({
    offen: !!document.querySelector('.bsport-modal-overlay.is-open'),
  }));
  pruef('fremder Origin bricht das Overlay nicht ab', z.offen === true);

  await nachricht(page, BACKOFFICE, { type: 'bsport-widget-resize', height: 1975 });
  z = await page.evaluate(() => ({
    offen: !!document.querySelector('.bsport-modal-overlay.is-open'),
  }));
  pruef('Antwort von Bsport laesst das Overlay offen', z.offen === true);
  await ctx.close();
}

/* ═══════════ C. Anmeldehorcher auf /mitgliederbereich ═══════════ */
console.log('\n── C. Anmeldehorcher auf /mitgliederbereich ──');
{
  const { ctx, page } = await seiteOeffnen(browser, basis, 'mitgliederbereich.html',
    { stand: STAND_ALLES });
  await page.evaluate(() => {
    try { sessionStorage.setItem('bsport_pending_section', 'packages'); } catch (e) {}
  });

  /* Fremde Origins: nichts darf passieren. */
  for (const [origin, daten] of [
    ['https://evil.example', { type: 'logged_in' }],
    ['https://evil.example', { type: 'IFRAME_LOGIN_SUCCESS' }],
    ['https://backoffice.bsport.io.angreifer.example', { type: 'IFRAME_LOGIN_SUCCESS' }],
    ['http://backoffice.bsport.io', { type: 'IFRAME_LOGIN_SUCCESS' }],
    ['https://evil.example', { token: 'abc', user: { id: 1 } }],
  ]) {
    await nachricht(page, origin, daten);
  }
  await page.waitForTimeout(600);
  let z = await page.evaluate(() => ({
    pfad: location.pathname,
    auth: (function () { try { return sessionStorage.getItem('bsport_auth_complete'); }
                        catch (e) { return null; } })(),
  }));
  pruef('fremder Origin leitet nicht um', z.pfad === '/mitgliederbereich.html', z.pfad);
  pruef('fremder Origin setzt bsport_auth_complete nicht', !z.auth, String(z.auth));

  /* Und von Bsport selbst, mit dem echten Namen in Grossbuchstaben, muss
     es weiter funktionieren. */
  await nachricht(page, BACKOFFICE, { type: 'IFRAME_LOGIN_SUCCESS' });
  await page.waitForTimeout(1000);
  z = await page.evaluate(() => ({ pfad: location.pathname + location.hash }));
  pruef('IFRAME_LOGIN_SUCCESS von Bsport leitet auf den gemerkten Abschnitt',
        z.pfad === '/mitglied-werden#packages', z.pfad);
  await ctx.close();
}
{
  /* Ein neuer Nutzer soll NICHT umgeleitet werden, er soll die
     Registrierung zu Ende fuehren. */
  const { ctx, page } = await seiteOeffnen(browser, basis, 'mitgliederbereich.html',
    { stand: STAND_ALLES });
  await page.evaluate(() => {
    try { sessionStorage.setItem('bsport_pending_section', 'packages'); } catch (e) {}
  });
  await nachricht(page, BACKOFFICE, { type: 'IFRAME_LOGIN_SUCCESS', isNewUser: true });
  await page.waitForTimeout(1000);
  const z = await page.evaluate(() => ({ pfad: location.pathname }));
  pruef('neuer Nutzer wird nicht umgeleitet', z.pfad === '/mitgliederbereich.html', z.pfad);
  await ctx.close();
}

/* ═══════════ D. Sichtbarkeit unter Cookiebots Blockade ═══════════ */
console.log('\n── D. Sichtbarkeit unter Cookiebots Blockade ──');
for (const pfad of ['index.html', 'coaches.html', 'kurse.html', 'preise.html',
                    'probetraining.html', 'stundenplan.html']) {
  const { ctx, page, logs } = await seiteOeffnen(browser, basis, pfad,
    { stand: STAND_NUR_MARKETING });
  /* Erst durch die ganze Seite scrollen. Ein Abschnitt unterhalb des
     Falzes steht zu Recht noch auf opacity 0 - er wurde nur noch nicht
     gesehen. Gezaehlt wird, was danach immer noch blass ist. */
  await page.evaluate(async () => {
    const schritt = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += schritt) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(3000);
  const d = await page.evaluate(() => {
    const blass = [...document.querySelectorAll('.reveal, [class*="reveal"]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.height === 0 || r.width === 0) return false;
        if (getComputedStyle(el).display === 'none') return false;
        return parseFloat(getComputedStyle(el).opacity) < 0.1;
      })
      .map((el) => el.tagName + '.' + (el.className + '').slice(0, 40));
    return { anzahl: blass.length, wer: blass.slice(0, 4) };
  });
  const name = pfad.replace('.html', '');
  pruef(name + ': kein Abschnitt bleibt unsichtbar', d.anzahl === 0,
        'Anzahl ' + d.anzahl + (d.anzahl ? ' ' + JSON.stringify(d.wer) : ''));
  pruef(name + ': keine Fehler', logs.filter((l) => /ERROR/.test(l)).length === 0,
        JSON.stringify(logs.filter((l) => /ERROR/.test(l))).slice(0, 140));
  await ctx.close();
}

await browser.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

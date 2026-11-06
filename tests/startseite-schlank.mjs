/* Die schlanke Startseite, und was dafuer umgezogen ist.
 *
 *   node tests/startseite-schlank.mjs                  gegen den Arbeitsstand
 *   node tests/startseite-schlank.mjs /pfad/zu/main    gegen einen anderen Baum
 *
 * WORUM ES GEHT
 * Die Startseite hatte vierzehn Abschnitte. Vier sind weg, zwei Anfragen
 * sind auf die Seiten umgezogen, auf denen sie hingehoeren. Diese Suite
 * prueft beides: dass die Startseite wirklich schlank ist UND dass an der
 * neuen Stelle nichts verloren ging. Ein Umzug, bei dem das Formular am
 * Ziel nicht absendet, waere schlimmer als gar kein Umzug.
 *
 *   A  Die Startseite hat genau zehn Abschnitte, und keinen der entfernten.
 *   B  Kein Verweis mehr auf #ort, der Videoknopf steht jetzt in #location.
 *   C  Die Family-Anfrage auf /preise: oeffnen, pruefen, absenden.
 *   D  Der Weg zur Corporate-Anfrage: die Karte auf /kurse. Das
 *      Formular selbst steht auf /corporate-boxing und wird in
 *      tests/corporate-seite.mjs durchgespielt.
 *   E  Wortwahl: kein "echt" ausserhalb der Google-Zitate, der
 *      Early-Bird-Satz genau einmal je Seite, keine Frage "Wann oeffnet".
 *   F  Kickboxing und Queens sind auf ihren Seiten unveraendert da.
 *
 * KEINE ECHTE ANFRAGE
 * /api/contact wird abgefangen und mit 200 beantwortet. Was gesendet
 * wuerde, steht danach im Protokoll und wird geprueft; das Netz sieht
 * nichts davon.
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

/* DIE REIHENFOLGE IST DER INHALT
   Neu ab Paket B: die Positionierung (#dna) steht gleich hinter dem
   Hero, der Stundenplan direkt hinter den Kursen. Wer hier etwas
   umstellt, aendert den Weg durch die Seite, nicht nur das Markup. */
const SOLL = ['hero', 'dna', 'reviews', 'disciplines', 'schedule-preview',
              'pricing', 'early-bird', 'faq', 'location', 'anfahrt-video'];
const WEG  = ['money-slots', 'ort', 'bomaye-app', 'pt-teaser', 'family-modal',
              'corporate-modal', 'corporate-boxing-form'];

/* Laedt eine Seite ohne alles, was von aussen kommt. Fuer Markup und
   Formulare braucht es weder Cookiebot noch das bsport-Bundle. */
async function laden(pfad, { breite = 390, hoehe = 844, kontakt = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe } });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(String(e).slice(0, 200)));
  await page.route('**/*', (route) => {
    const u = route.request().url();
    /* Die Anfrage wird abgefangen, nicht gesendet. */
    if (/\/api\/contact/.test(u)) {
      if (kontakt) {
        let rumpf = null;
        try { rumpf = JSON.parse(route.request().postData() || 'null'); } catch (e) { rumpf = 'kein JSON'; }
        kontakt.push({ methode: route.request().method(), rumpf });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    }
    if (u.startsWith(basis)) return route.continue();
    return route.abort('failed');
  });
  await page.goto(basis + pfad, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  return { ctx, page, fehler };
}

/* ═══════════ A. Zehn Abschnitte, keiner mehr ═══════════ */
console.log('── A. Die Abschnitte der Startseite ──');
{
  const { ctx, page, fehler } = await laden('index.html');
  const da = await page.evaluate(() => {
    /* Nur die Abschnitte der Startseite selbst, nicht die der zweiten
       Ansicht #view-mehr-preise. */
    const heim = document.getElementById('view-home');
    return [...heim.querySelectorAll('section[id]')].map((s) => s.id);
  });
  pruef('genau zehn Abschnitte', da.length === SOLL.length, da.length + ': ' + da.join(', '));
  pruef('die zehn sind es, in dieser Reihenfolge',
        JSON.stringify(da) === JSON.stringify(SOLL), JSON.stringify(da));

  for (const id of WEG) {
    const weg = await page.evaluate((x) => !document.getElementById(x), id);
    pruef('#' + id + ' ist weg', weg === true);
  }

  /* Die beiden Anker der Buchungsleiste muessen bleiben. */
  const anker = await page.evaluate(() => ({
    ab:  (document.querySelector('[data-sticky-ab]')  || {}).id || null,
    aus: (document.querySelector('[data-sticky-aus]') || {}).id || null,
  }));
  pruef('data-sticky-ab sitzt weiter auf #pricing', anker.ab === 'pricing', String(anker.ab));
  pruef('data-sticky-aus sitzt weiter auf #early-bird', anker.aus === 'early-bird', String(anker.aus));

  /* DER LETZTE KNOPF
     Die Seite endete mit FAQ, Standort und Anfahrtsvideo, ohne eine
     einzige Handlung. Jetzt steht am Ende genau ein Probetrainings-
     Knopf, und zwar nur einer. */
  const schluss = await page.evaluate(() => {
    const heim = document.getElementById('view-home');
    const alle = [...heim.querySelectorAll('a[href="/probetraining"]')];
    const letzter = alle[alle.length - 1];
    const video = document.getElementById('anfahrt-video');
    return {
      anzahl: alle.length,
      text: letzter ? letzter.textContent.replace(/\s+/g, ' ').trim() : null,
      imLetztenAbschnitt: !!(letzter && video && video.contains(letzter)),
      stilleZone: !!(letzter && letzter.closest('[data-sticky-still]')),
      /* Nach ihm darf kein weiterer Abschnitt mehr kommen. */
      danach: letzter ? [...heim.querySelectorAll('section[id]')]
        .filter((s2) => s2.compareDocumentPosition(letzter) & Node.DOCUMENT_POSITION_PRECEDING)
        .map((s2) => s2.id) : null,
    };
  });
  pruef('am Ende steht ein Probetrainings-Knopf',
        schluss.imLetztenAbschnitt === true, JSON.stringify(schluss));
  pruef('er heisst PROBETRAINING SICHERN',
        schluss.text === 'PROBETRAINING SICHERN', String(schluss.text));
  pruef('nach ihm kommt kein Abschnitt mehr',
        Array.isArray(schluss.danach) && schluss.danach.length === 0,
        JSON.stringify(schluss.danach));
  pruef('er liegt in einer stillen Zone, damit die Leiste dort schweigt',
        schluss.stilleZone === true);

  /* Die Gruenderzeile. Eine Zeile, kein Block. */
  const gruender = await page.evaluate(() => {
    const e = document.querySelector('.dna-gruender');
    const dna = document.getElementById('dna');
    return e ? {
      text: e.textContent.replace(/\s+/g, ' ').trim(),
      imDna: !!(dna && dna.contains(e)),
      farbe: getComputedStyle(e).color,
      groesse: parseFloat(getComputedStyle(e).fontSize),
      bilder: dna ? dna.querySelectorAll('.dna-text img').length : null,
    } : null;
  });
  pruef('die Gruenderzeile steht im DNA-Abschnitt',
        gruender !== null && gruender.imDna === true);
  if (gruender) {
    pruef('und zwar wortgenau',
          gruender.text === 'Gegründet von Raschad Pekpassi und Alfonso Fusco. '
            + 'Beide BABV Landestrainer, Alfonso Kickbox-Weltmeister.',
          gruender.text);
    pruef('kleiner als der Fliesstext', gruender.groesse < 16,
          gruender.groesse + ' px');
    pruef('kein Bild dazu', gruender.bilder === 0, String(gruender.bilder));
  }

  pruef('keine Ausnahme beim Laden', fehler.length === 0, JSON.stringify(fehler).slice(0, 200));
  await ctx.close();
}

/* ═══════════ A2. Die Bewertungen sind hell ═══════════ */
console.log('\n── A2. Der Bewertungsabschnitt ist hell und lesbar ──');
{
  const { ctx, page } = await laden('index.html');
  const r = await page.evaluate(() => {
    const zahl = (f) => (f.match(/\d+/g) || []).map(Number);
    const hell = (f) => {
      const [rr, gg, bb] = zahl(f);
      /* Wahrgenommene Helligkeit, grob nach BT.601. Reicht, um dunkel
         von hell zu unterscheiden. */
      return (0.299 * rr + 0.587 * gg + 0.114 * bb) > 140;
    };
    const sek = document.getElementById('reviews');
    const karte = document.querySelector('.bom-review-card');
    const zitat = document.querySelector('.bom-review-card__text');
    const sekBg = getComputedStyle(sek).backgroundColor;
    const karteBg = getComputedStyle(karte).backgroundColor;
    return {
      sekBg, karteBg,
      sekHell: hell(sekBg),
      karteHell: hell(karteBg),
      zitatDunkel: !hell(getComputedStyle(zitat).color),
      /* Reines Weiss ist verboten, auch als Karte. */
      weiss: [sekBg, karteBg].some((f) => {
        const [rr, gg, bb] = zahl(f);
        return rr === 255 && gg === 255 && bb === 255;
      }),
      /* Die Texte, die Anzahl und das Datum bleiben, wie sie sind. */
      karten: document.querySelectorAll('.bom-review-card').length,
      stand: (document.querySelector('.bom-reviews__stand') || {}).textContent,
      namen: [...document.querySelectorAll('.bom-review-card__name')]
        .map((e) => e.textContent.trim()),
      nachbarn: {
        dna: getComputedStyle(document.getElementById('dna')).backgroundColor,
        disciplines: getComputedStyle(document.getElementById('disciplines')).backgroundColor,
      },
    };
  });
  pruef('der Abschnitt ist nicht mehr dunkel', r.sekHell === true, r.sekBg);
  pruef('die Karten sind heller als der Grund', r.karteHell === true, r.karteBg);
  pruef('der Zitattext ist dunkel', r.zitatDunkel === true);
  pruef('kein reines Weiss', r.weiss === false, r.sekBg + ' / ' + r.karteBg);
  pruef('drei Bewertungen, unveraendert', r.karten === 3, r.karten + ' Karten');
  pruef('das Datum steht unveraendert da',
        (r.stand || '').trim() === 'Google-Bewertung, Stand 01.11.2026', r.stand);
  pruef('die drei Namen stehen unveraendert da',
        JSON.stringify(r.namen) === JSON.stringify(['Emanuele C.', 'Christopher M.', 'Lilian H.']),
        JSON.stringify(r.namen));
  pruef('die Nachbarn sind weiter hell, der Uebergang bleibt weich',
        r.nachbarn.dna === 'rgb(245, 240, 232)' && r.nachbarn.disciplines === 'rgb(245, 240, 232)',
        JSON.stringify(r.nachbarn));
  await ctx.close();
}

/* ═══════════ B. Kein #ort mehr, Videoknopf im Standortblock ═══════════ */
console.log('\n── B. #ort ist nirgends mehr, der Videoknopf steht in #location ──');
{
  const { ctx, page } = await laden('index.html');
  const b = await page.evaluate(() => {
    const verweise = [...document.querySelectorAll('[href*="#ort"], [aria-controls="ort"], [data-ziel="ort"]')]
      .map((el) => el.outerHTML.slice(0, 80));
    const knopf = document.querySelector('.ort-video-btn');
    const inLocation = !!(knopf && knopf.closest('#location'));
    const video = document.getElementById('anfahrt-video');
    return {
      verweise,
      knopfDa: !!knopf,
      inLocation,
      knopfText: knopf ? knopf.textContent.replace(/\s+/g, ' ').trim() : null,
      videoDa: !!video,
      fassade: !!(video && video.querySelector('.vfacade')),
    };
  });
  pruef('kein Element verweist auf #ort', b.verweise.length === 0, JSON.stringify(b.verweise));
  pruef('der Videoknopf ist da', b.knopfDa === true);
  pruef('und steht in #location', b.inLocation === true);
  pruef('mit unveraenderter Beschriftung',
        b.knopfText === 'VIDEO: WEG ZUR TÜR', String(b.knopfText));
  pruef('#anfahrt-video mit Fassade ist weiter da', b.videoDa && b.fassade);

  /* Der Knopf muss wirklich zum Video fuehren. */
  await page.evaluate(() => document.querySelector('.ort-video-btn').click());
  await page.waitForTimeout(700);
  const sprung = await page.evaluate(() => {
    const r = document.getElementById('anfahrt-video').getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  pruef('der Klick springt zum Video', sprung === true);
  await ctx.close();
}

/* ═══════════ C. Family-Anfrage auf /preise ═══════════ */
console.log('\n── C. Die Family-Anfrage steht jetzt auf /preise ──');
{
  const kontakt = [];
  const { ctx, page, fehler } = await laden('preise.html', { kontakt });

  const vorher = await page.evaluate(() => {
    const modal = document.getElementById('family-modal');
    const zeile = document.querySelector('.pr-familie');
    return {
      modalDa: !!modal,
      offen: modal ? modal.classList.contains('open') : null,
      zeileDa: !!zeile,
      zeileText: zeile ? zeile.textContent.replace(/\s+/g, ' ').trim() : null,
      knopfDa: !!(zeile && zeile.querySelector('button')),
    };
  });
  pruef('das Family-Modal liegt auf /preise', vorher.modalDa === true);
  pruef('es ist zuerst zu', vorher.offen === false);
  pruef('die Textzeile steht bei den Preisen', vorher.zeileDa === true, vorher.zeileText);
  pruef('die Zeile traegt keinen zweiten grossen Knopf, nur einen Textknopf',
        vorher.knopfDa === true);

  await page.click('.pr-familie button');
  await page.waitForTimeout(500);
  const offen = await page.evaluate(() => {
    const m = document.getElementById('family-modal');
    const cs = getComputedStyle(m);
    return { klasse: m.classList.contains('open'), deckkraft: cs.opacity, zeiger: cs.pointerEvents };
  });
  pruef('der Klick oeffnet das Modal', offen.klasse === true
        && parseFloat(offen.deckkraft) > 0.5 && offen.zeiger !== 'none',
        JSON.stringify(offen));

  /* Pflichtfelder: leer absenden darf nichts senden. */
  await page.evaluate(() => document.getElementById('family-inquiry-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await page.waitForTimeout(400);
  const leer = await page.evaluate(() => ({
    meldungen: [...document.querySelectorAll('#family-inquiry-form .fif-error')]
      .map((e) => e.textContent.trim()).filter(Boolean),
    erfolgOffen: !document.getElementById('fif-success').hidden,
  }));
  pruef('leer abgesendet: Pflichtfeldmeldungen stehen da', leer.meldungen.length >= 3,
        JSON.stringify(leer.meldungen));
  pruef('leer abgesendet: nichts gesendet', kontakt.length === 0, JSON.stringify(kontakt));
  pruef('leer abgesendet: keine Erfolgsmeldung', leer.erfolgOffen === false);

  /* Die Namensfelder wachsen mit der Anzahl. */
  await page.selectOption('#fif-count', '3');
  await page.waitForTimeout(300);
  const felder = await page.evaluate(() =>
    document.querySelectorAll('#fif-member-names input').length);
  pruef('drei Mitglieder ergeben drei Namensfelder', felder === 3, felder + ' Felder');

  /* Adresse erscheint nur, wenn der Haushalt NICHT derselbe ist. */
  /* Das Eingabefeld selbst liegt unter der gestalteten Karte. Geklickt
     wird darum die Karte, genau wie ein Besucher es tut. */
  await page.click('#family-inquiry-form .fif-radio-card:has(input[value="Nein"]) .fif-radio-card__box');
  await page.waitForTimeout(300);
  const adresseAn = await page.evaluate(() =>
    !document.getElementById('fif-address-section').hidden);
  pruef('Haushalt Nein blendet die Adressfelder ein', adresseAn === true);
  await page.click('#family-inquiry-form .fif-radio-card:has(input[value="Ja"]) .fif-radio-card__box');
  await page.waitForTimeout(300);
  const adresseAus = await page.evaluate(() =>
    document.getElementById('fif-address-section').hidden);
  pruef('Haushalt Ja blendet sie wieder aus', adresseAus === true);

  await page.fill('#fif-name', 'Testfamilie Meier');
  await page.fill('#fif-email', 'familie@example.de');
  await page.fill('#fif-phone', '0176 0000000');
  await page.fill('#fif-member-1', 'Anna Meier');
  await page.fill('#fif-member-2', 'Ben Meier');
  await page.fill('#fif-member-3', 'Carla Meier');
  await page.fill('#fif-message', 'Testnachricht aus der Testsuite');
  await page.click('#family-inquiry-form button[type="submit"]');
  await page.waitForTimeout(900);

  pruef('ausgefuellt abgesendet: genau eine Anfrage', kontakt.length === 1,
        JSON.stringify(kontakt).slice(0, 200));
  if (kontakt.length === 1) {
    const r = kontakt[0].rumpf || {};
    pruef('die Anfrage geht per POST', kontakt[0].methode === 'POST', kontakt[0].methode);
    pruef('type ist family', r.type === 'family', String(r.type));
    pruef('Name, E-Mail und Telefon sind dabei',
          r.name === 'Testfamilie Meier' && r.email === 'familie@example.de' && !!r.phone,
          JSON.stringify({ n: r.name, e: r.email, t: r.phone }));
    pruef('die drei Namen sind dabei',
          Array.isArray(r.members) && r.members.length === 3 && r.members[0] === 'Anna Meier',
          JSON.stringify(r.members));
    pruef('der Haushalt ist dabei', r.household === 'Ja', String(r.household));
  }
  const erfolg = await page.evaluate(() => ({
    sichtbar: !document.getElementById('fif-success').hidden,
    formWeg: getComputedStyle(document.getElementById('family-inquiry-form')).display === 'none',
  }));
  pruef('die Erfolgsmeldung steht da', erfolg.sichtbar === true);
  pruef('das Formular ist weg', erfolg.formWeg === true);

  /* Zumachen setzt zurueck. */
  await page.click('.family-modal-close');
  await page.waitForTimeout(500);
  const zu = await page.evaluate(() => {
    const m = document.getElementById('family-modal');
    return {
      offen: m.classList.contains('open'),
      erfolg: !document.getElementById('fif-success').hidden,
      name: document.getElementById('fif-name').value,
    };
  });
  pruef('das Kreuz schliesst das Modal', zu.offen === false);
  pruef('und setzt Formular und Erfolgsmeldung zurueck',
        zu.erfolg === false && zu.name === '', JSON.stringify(zu));

  pruef('/preise: keine Ausnahme', fehler.length === 0, JSON.stringify(fehler).slice(0, 200));
  await ctx.close();
}

/* ═══════════ D. Corporate: die Karte auf /kurse ═══════════ */
console.log('\n── D. Auf /kurse fuehrt eine Karte zur Corporate-Anfrage ──');

/* Das Formular stand nach Paket A unten auf /kurse. Es hat inzwischen eine
   eigene Seite, /corporate-boxing; dort wird es vollstaendig durchgespielt
   (tests/corporate-seite.mjs). Hier bleibt die Frage, ob der Weg dorthin
   steht und auf /kurse nichts Halbes zurueckblieb. */
{
  const { ctx, page, fehler } = await laden('kurse.html#corporate');
  const d = await page.evaluate(() => {
    const sek = document.getElementById('corporate');
    const knopf = sek ? sek.querySelector('a.btn') : null;
    return {
      sektionDa: !!sek,
      formulare: document.querySelectorAll('form').length,
      text: sek ? sek.textContent.replace(/\s+/g, ' ').trim() : '',
      knopfText: knopf ? knopf.textContent.replace(/\s+/g, ' ').trim() : null,
      knopfZiel: knopf ? knopf.getAttribute('href') : null,
      imBild: sek ? sek.getBoundingClientRect().top < window.innerHeight * 3 : false,
    };
  });
  pruef('die Sektion #corporate gibt es weiterhin', d.sektionDa === true);
  pruef('der Anker fuehrt wirklich dorthin', d.imBild === true);
  pruef('das Formular ist weg', d.formulare === 0, d.formulare + ' Formulare');
  pruef('die Karte nennt Teams und Firmen',
        /Für Teams und Firmen/.test(d.text), d.text.slice(0, 80));
  pruef('der Knopf heisst ZUR ANFRAGE', d.knopfText === 'ZUR ANFRAGE', String(d.knopfText));
  pruef('und fuehrt auf /corporate-boxing', d.knopfZiel === '/corporate-boxing',
        String(d.knopfZiel));
  pruef('/kurse: keine Ausnahme', fehler.length === 0, JSON.stringify(fehler).slice(0, 200));
  await ctx.close();
}

/* ═══════════ E. Wortwahl ═══════════ */
console.log('\n── E. Wortwahl ──');
{
  const { ctx, page } = await laden('index.html');
  const e = await page.evaluate(() => {
    const wort = /\becht(e|er|es|en)?\b/gi;
    const text = document.getElementById('view-home').innerText;
    const treffer = text.match(wort) || [];
    /* Die Google-Zitate sind woertlich und bleiben, wie sie sind. Sie
       werden getrennt gezaehlt, damit sichtbar ist, was uebrig ist. */
    const zitate = document.getElementById('reviews');
    const imZitat = zitate ? (zitate.innerText.match(wort) || []) : [];
    const satz = 'Dein Early Bird Preis bleibt, solange du Mitglied bleibst';
    const teile = text.split(satz).length - 1;
    return {
      treffer: treffer.length,
      imZitat: imZitat.length,
      earlyBird: teile,
      wannOeffnet: /Wann öffnet/i.test(document.body.innerHTML),
    };
  });
  pruef('"echt" steht nur noch in den Google-Zitaten',
        e.treffer === e.imZitat, e.treffer + ' insgesamt, ' + e.imZitat + ' in Zitaten');
  pruef('ausserhalb der Zitate kein "echt"', e.treffer - e.imZitat === 0,
        (e.treffer - e.imZitat) + ' uebrig');
  pruef('der Early-Bird-Satz steht genau einmal', e.earlyBird === 1, e.earlyBird + ' mal');
  pruef('keine Frage "Wann öffnet" im Markup', e.wannOeffnet === false);
  await ctx.close();
}
{
  const { ctx, page } = await laden('mitglied-werden.html');
  const m = await page.evaluate(() => {
    const satz = 'Dein Early Bird Preis bleibt, solange du Mitglied bleibst';
    return document.body.innerText.split(satz).length - 1;
  });
  pruef('/mitglied-werden: der Satz steht genau einmal im sichtbaren Text',
        m === 1, m + ' mal');
  await ctx.close();
}
{
  const { ctx, page } = await laden('faq.html');
  const f = await page.evaluate(() => {
    const schemen = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((s) => s.textContent).join(' ');
    return {
      imText: /Wann öffnet/i.test(document.body.innerText),
      imSchema: /Wann öffnet/i.test(schemen),
    };
  });
  pruef('/faq: die Frage steht nicht im Text', f.imText === false);
  pruef('/faq: und nicht im FAQPage-Schema', f.imSchema === false);
  await ctx.close();
}

/* ═══════════ F. Kickboxing und Queens sind geblieben ═══════════ */
console.log('\n── F. Kickboxing und Queens auf ihren eigenen Seiten ──');
for (const [pfad, worte] of [
  ['kurse.html', ['Kickbox', 'Queens']],
  ['kickboxen-muenchen.html', ['Kickbox']],
  ['frauenboxen-muenchen.html', ['Queens']],
]) {
  const { ctx, page } = await laden(pfad);
  const name = pfad.replace('.html', '');
  const f = await page.evaluate(() => {
    const text = document.body.innerText;
    const knoepfe = [...document.querySelectorAll('a[href="/probetraining"], a[href$="/probetraining"]')]
      .filter((a) => {
        const cs = getComputedStyle(a);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      })
      .map((a) => a.textContent.replace(/\s+/g, ' ').trim().slice(0, 40));
    return { text: text, knoepfe: knoepfe };
  });
  for (const w of worte) {
    pruef(name + ': "' + w + '" steht weiter auf der Seite',
          new RegExp(w, 'i').test(f.text));
  }
  pruef(name + ': es gibt Knoepfe auf /probetraining', f.knoepfe.length > 0,
        f.knoepfe.length + ': ' + JSON.stringify(f.knoepfe).slice(0, 160));
  await ctx.close();
}

await browser.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

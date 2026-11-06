/* Die eigene Seite /corporate-boxing.
 *
 *   node tests/corporate-seite.mjs                  gegen den Arbeitsstand
 *   node tests/corporate-seite.mjs /pfad/zu/main    gegen einen anderen Baum
 *
 * WORUM ES GEHT
 * Die Corporate-Anfrage stand unten auf /kurse. Jetzt hat sie eine eigene
 * Seite: ein klares Ziel fuer Verlinkungen, eine eigene Seite in der Suche
 * und eine Landeseite fuer Anzeigen. Geprueft wird der Umzug in beide
 * Richtungen: dass die neue Seite vollstaendig ist UND dass auf /kurse
 * nichts Halbes stehen bleibt.
 *
 *   A  Die Seite: Antwortstatus, genau eine H1, die vier Abschnitte,
 *      Schema parst, keine Buchungsleiste, kein waagerechtes Schieben.
 *   B  Das Formular: Felder da, leer abgesendet geht nichts raus,
 *      ausgefuellt genau EINE Anfrage mit denselben Schluesseln wie vorher.
 *   C  /kurse: die Karte steht da, das Formular nicht mehr.
 *   D  Die Wege dorthin: Fusslinks, Preistabelle, sitemap.
 *
 * ES GEHT KEINE ECHTE ANFRAGE RAUS. /api/contact wird abgefangen und mit
 * 200 beantwortet; was gesendet wuerde, steht danach im Protokoll.
 */
import { readFile } from 'node:fs/promises';
import {
  chromiumHolen, wurzelBestimmen, serverStarten, zaehler,
} from './gemeinsam.mjs';

const chromium = await chromiumHolen();
const wurzel = wurzelBestimmen();
const { srv, basis } = await serverStarten(wurzel);
const browser = await chromium.launch();
const { pruef, abschluss } = zaehler();

console.log('Baum: ' + wurzel + '\n');

/* Dieselben Breiten wie in tests/breiten.mjs, damit die neue Seite nicht
   durch ein anderes Raster faellt als der Rest. */
const BREITEN = [280, 320, 344, 360, 375, 390, 412, 430, 480, 600, 768];

async function laden(pfad, { breite = 390, hoehe = 844, kontakt = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe } });
  const page = await ctx.newPage();
  const fehler = [];
  const antworten = [];
  page.on('pageerror', (e) => fehler.push(String(e).slice(0, 200)));
  page.on('response', (r) => { if (r.url() === basis + pfad.split('#')[0]) antworten.push(r.status()); });
  await page.route('**/*', (route) => {
    const u = route.request().url();
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
  return { ctx, page, fehler, antworten };
}

/* ═══════════ A. Die Seite ═══════════ */
console.log('── A. Die Seite /corporate-boxing ──');
{
  const { ctx, page, fehler, antworten } = await laden('corporate-boxing.html');
  pruef('die Seite antwortet mit 200', antworten[0] === 200, String(antworten[0]));

  const a = await page.evaluate(() => {
    const h1 = [...document.querySelectorAll('h1')];
    const schemen = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((s) => s.textContent);
    return {
      h1Anzahl: h1.length,
      /* WELCHER TEXT IST "DIE H1"?
         Die Ueberschrift traegt ein <br> zwischen "Corporate Boxing" und
         "München", wie auf allen Landingpages. textContent klebt beides
         ohne Leerzeichen zusammen, innerText liefert die ANGEZEIGTE
         Fassung, und die steht wegen text-transform in Versalien. Im
         Quelltext steht der Satz richtig; genau der wird geprueft, indem
         die Auszeichnung durch ein Leerzeichen ersetzt wird. Die
         Versalien sind Gestaltung und werden getrennt nachgesehen. */
      h1Text: h1.length ? h1[0].innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null,
      h1Angezeigt: h1.length ? h1[0].innerText.replace(/\s+/g, ' ').trim() : null,
      titel: document.title,
      beschr: (document.querySelector('meta[name="description"]') || {}).content || null,
      ogTitel: (document.querySelector('meta[property="og:title"]') || {}).content || null,
      kanonisch: (document.querySelector('link[rel="canonical"]') || {}).href || null,
      hero: !!document.querySelector('.seo-hero'),
      heroKnopf: (() => {
        const k = document.querySelector('.seo-hero-btns a');
        return k ? { text: k.textContent.replace(/\s+/g, ' ').trim(), ziel: k.getAttribute('href') } : null;
      })(),
      heroKnopfAnzahl: document.querySelectorAll('.seo-hero-btns a, .seo-hero-btns button').length,
      heroSatz: (() => {
        const e = document.querySelector('.seo-hero-sub');
        return e ? e.textContent.replace(/\s+/g, ' ').trim() : null;
      })(),
      team: !!document.getElementById('team-h2'),
      punkte: document.querySelectorAll('.seo-feature-card').length,
      /* Die Ueberschriften der Karten stehen in Versalien im Markup, der
         Text darunter normal. Beides wird mitgenommen, damit eine
         Textaenderung auffaellt und nicht nur die Anzahl stimmt. */
      kartenTitel: [...document.querySelectorAll('.seo-feature-card h3')]
        .map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
      kartenText: [...document.querySelectorAll('.seo-feature-card p')]
        .map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
      einleitung: (() => {
        const e = document.querySelector('#team-h2').closest('.seo-section-inner').querySelector('p');
        return e ? e.textContent.replace(/\s+/g, ' ').trim() : null;
      })(),
      anfrage: !!document.getElementById('anfrage'),
      faqFragen: [...document.querySelectorAll('.faq-q span')].map((s) => s.textContent.trim()),
      schemen,
      leiste: !!document.getElementById('sticky-buchung'),
      stickyAnker: !!document.querySelector('[data-sticky-ab]'),
      probetraining: [...document.querySelectorAll('.seo-hero a')].filter((a2) => /probetraining/.test(a2.getAttribute('href') || '')).length,
    };
  });

  pruef('genau eine H1', a.h1Anzahl === 1, a.h1Anzahl + ': ' + a.h1Text);
  pruef('die H1 heisst Corporate Boxing München',
        a.h1Text === 'Corporate Boxing München', String(a.h1Text));
  pruef('und wird wie auf den anderen Landingpages in Versalien gezeigt',
        a.h1Angezeigt === 'CORPORATE BOXING MÜNCHEN', String(a.h1Angezeigt));
  pruef('Titel hoechstens 60 Zeichen', [...a.titel].length <= 60,
        [...a.titel].length + ': ' + a.titel);
  pruef('og:title gleich dem Titel', a.ogTitel === a.titel, String(a.ogTitel));
  pruef('Beschreibung zwischen 120 und 155 Zeichen',
        a.beschr && [...a.beschr].length >= 120 && [...a.beschr].length <= 155,
        a.beschr ? [...a.beschr].length + ' Zeichen' : 'keine');
  pruef('canonical zeigt auf /corporate-boxing',
        a.kanonisch === 'https://www.bomayegym.com/corporate-boxing', String(a.kanonisch));

  pruef('Abschnitt 1: Hero', a.hero === true);
  pruef('im Hero genau ein Knopf', a.heroKnopfAnzahl === 1, a.heroKnopfAnzahl + ' Knoepfe');
  pruef('und der heisst ANFRAGE SENDEN und zeigt auf #anfrage',
        a.heroKnopf && a.heroKnopf.text === 'ANFRAGE SENDEN' && a.heroKnopf.ziel === '#anfrage',
        JSON.stringify(a.heroKnopf));
  pruef('kein Probetraining-Knopf im Hero', a.probetraining === 0, a.probetraining + ' gefunden');
  pruef('der Satz im Hero nennt Teamtraining und ab 5 Personen',
        a.heroSatz === 'Boxen als Teamtraining für Firmen. Ab 5 Personen, auf Anfrage.',
        String(a.heroSatz));
  pruef('Abschnitt 2: Was dein Team bekommt, mit drei Punkten',
        a.team === true && a.punkte === 3, a.punkte + ' Punkte');
  pruef('die Einleitung nennt die zwei Formate',
        a.einleitung === 'Zwei Formate, ein Ziel: Ein Team, das zusammen stärker wird.',
        String(a.einleitung));
  /* DIE ZWEI FORMATE SIND DER KERN DIESER SEITE
     60 oder 90 Minuten reines Training, oder rund drei Stunden mit 90
     Minuten Theorie und 90 Minuten Praxis. Beide Zahlen kommen vom
     Betreiber; faellt eine aus dem Text, steht die Seite im Widerspruch
     zur FAQ und zur Beschreibung in der Suche. */
  pruef('die drei Karten heissen wie abgestimmt',
        JSON.stringify(a.kartenTitel) ===
          JSON.stringify(['TRAINING', 'TRAINING PLUS THEORIE', 'AB 5 PERSONEN']),
        JSON.stringify(a.kartenTitel));
  pruef('Karte 1 nennt 60 oder 90 Minuten',
        /60 oder 90 Minuten/.test(a.kartenText[0] || ''), a.kartenText[0]);
  pruef('Karte 2 nennt rund 3 Stunden, 90 Theorie und 90 Praxis',
        /rund 3 Stunden/i.test(a.kartenText[1] || '')
        && /90 Minuten Theorie/.test(a.kartenText[1] || '')
        && /90 Minuten Praxis/.test(a.kartenText[1] || ''), a.kartenText[1]);
  pruef('Karte 3 nennt die Gruppengroesse und Catering',
        /ab 5 Personen|AB 5 PERSONEN/.test(a.kartenTitel[2] || '')
        && /Catering ist optional/.test(a.kartenText[2] || ''), a.kartenText[2]);
  pruef('Abschnitt 3: das Formular unter #anfrage', a.anfrage === true);
  pruef('Abschnitt 4: FAQ mit fuenf Fragen', a.faqFragen.length === 5,
        JSON.stringify(a.faqFragen));
  pruef('darunter die Frage nach den Umkleiden',
        a.faqFragen.includes('Gibt es Umkleiden?'), JSON.stringify(a.faqFragen));
  pruef('darunter die Frage nach der Theorie',
        a.faqFragen.includes('Was passiert in der Theorie?'),
        JSON.stringify(a.faqFragen));
  pruef('und die Frage nach der Dauer', a.faqFragen.includes('Wie lange dauert ein Termin?'));

  /* Schema: jeder Block muss parsen, und die FAQ-Fragen im Schema muessen
     Zeichen fuer Zeichen denen im HTML entsprechen. Genau das prueft
     scripts/seo-pruefen.mjs sonst nur fuer /faq. */
  let kaputt = [];
  let faqSchema = null;
  a.schemen.forEach((t, i) => {
    try {
      const j = JSON.parse(t);
      if (j['@type'] === 'FAQPage') faqSchema = j;
    } catch (e) { kaputt.push((i + 1) + ': ' + e.message); }
  });
  pruef('alle JSON-LD-Bloecke parsen', kaputt.length === 0, JSON.stringify(kaputt));
  pruef('ein FAQPage-Schema ist dabei', faqSchema !== null);
  if (faqSchema) {
    const imSchema = faqSchema.mainEntity.map((f) => f.name);
    pruef('die Fragen im Schema sind die im HTML',
          JSON.stringify(imSchema) === JSON.stringify(a.faqFragen),
          JSON.stringify(imSchema));
    pruef('jede Frage hat eine Antwort',
          faqSchema.mainEntity.every((f) => f.acceptedAnswer && f.acceptedAnswer.text.length > 20));
  }

  pruef('keine Buchungsleiste auf dieser Seite', a.leiste === false);
  pruef('und kein Anker, der eine ausloesen wuerde', a.stickyAnker === false);
  pruef('keine Ausnahme beim Laden', fehler.length === 0, JSON.stringify(fehler).slice(0, 200));
  await ctx.close();
}

/* Kein waagerechtes Schieben, auf allen Breiten aus tests/breiten.mjs. */
{
  const schlecht = [];
  for (const b of BREITEN) {
    const { ctx, page } = await laden('corporate-boxing.html', { breite: b, hoehe: 800 });
    const m = await page.evaluate(() => ({
      quer: document.documentElement.scrollWidth > window.innerWidth + 1,
      doc: document.documentElement.scrollWidth, f: window.innerWidth,
    }));
    if (m.quer) schlecht.push(b + 'px (' + m.doc + '/' + m.f + ')');
    await ctx.close();
  }
  pruef('kein waagerechtes Schieben auf ' + BREITEN.length + ' Breiten',
        schlecht.length === 0, schlecht.join(', '));
}

/* ═══════════ B. Das Formular ═══════════ */
console.log('\n── B. Das Formular auf /corporate-boxing ──');
{
  const kontakt = [];
  const { ctx, page, fehler } = await laden('corporate-boxing.html#anfrage', { kontakt });

  const felder = await page.evaluate(() => {
    const f = document.getElementById('cbi-form');
    if (!f) return null;
    return {
      namen: [...f.querySelectorAll('[name]')].map((e) => e.getAttribute('name')),
      knopf: (f.querySelector('[type="submit"]') || {}).textContent.replace(/\s+/g, ' ').trim(),
      versprechen: [...document.querySelectorAll('.fif-trust, .family-sub, .fif-success-text')]
        .map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
    };
  });
  pruef('das Formular #cbi-form steht auf der Seite', felder !== null);
  if (felder) {
    const SOLL = ['name', 'email', 'phone', 'company', 'persons', 'date', 'time', 'catering', 'event', 'message'];
    for (const n of SOLL) {
      pruef('Feld "' + n + '" ist da', felder.namen.includes(n),
            felder.namen.includes(n) ? undefined : JSON.stringify(felder.namen));
    }
    pruef('der Absendeknopf heisst wie vorher',
          felder.knopf === 'CORPORATE ANFRAGE SENDEN', felder.knopf);
    pruef('das Antwortversprechen ist ueberall dasselbe',
          felder.versprechen.every((t) => !/schnellstmöglich/i.test(t)),
          JSON.stringify(felder.versprechen));
    pruef('und nennt 24 Stunden',
          felder.versprechen.some((t) => /innerhalb von 24 Stunden/.test(t)),
          JSON.stringify(felder.versprechen));
  }

  /* Leer abgesendet: sechs Meldungen, nichts geht raus. */
  await page.evaluate(() => document.getElementById('cbi-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await page.waitForTimeout(400);
  const leer = await page.evaluate(() =>
    [...document.querySelectorAll('#cbi-form .fif-error')].map((e) => e.textContent.trim()).filter(Boolean));
  pruef('leer abgesendet: sechs Pflichtfeldmeldungen', leer.length === 6, JSON.stringify(leer));
  pruef('leer abgesendet: nichts gesendet', kontakt.length === 0, JSON.stringify(kontakt));

  await page.fill('#cbi-name', 'Testfirma Schmidt');
  await page.fill('#cbi-email', 'team@example.de');
  await page.fill('#cbi-phone', '0176 0000000');
  await page.fill('#cbi-company', 'Beispiel GmbH');
  await page.selectOption('#cbi-persons', { index: 1 });
  await page.fill('#cbi-date', '2027-03-15');
  await page.fill('#cbi-time', '18:00 bis 20:00 Uhr');
  await page.click('#cbi-form .fif-radio-card:has(input[value="Ja"]) .fif-radio-card__box');
  await page.fill('#cbi-event', 'Teambuilding');
  await page.fill('#cbi-message', 'Testnachricht aus der Testsuite');
  await page.click('#cbi-form button[type="submit"]');
  await page.waitForTimeout(900);

  pruef('ausgefuellt abgesendet: genau eine Anfrage', kontakt.length === 1,
        JSON.stringify(kontakt).slice(0, 200));
  if (kontakt.length === 1) {
    const r = kontakt[0].rumpf || {};
    pruef('per POST', kontakt[0].methode === 'POST', kontakt[0].methode);
    pruef('type ist corporate', r.type === 'corporate', String(r.type));
    /* Dieselben Schluessel wie vorher auf /kurse, keiner mehr, keiner
       weniger. Gingen welche verloren, kaeme die Anfrage zwar an, aber
       ohne das, was dranhing. */
    const SCHLUESSEL = ['type', 'name', 'email', 'phone', 'company', 'persons',
                        'date', 'time', 'catering', 'event', 'message'];
    pruef('dieselben Schluessel wie vorher',
          JSON.stringify(Object.keys(r).sort()) === JSON.stringify(SCHLUESSEL.slice().sort()),
          JSON.stringify(Object.keys(r).sort()));
    pruef('und die Werte stehen drin',
          r.company === 'Beispiel GmbH' && r.date === '2027-03-15'
          && r.catering === 'Ja' && r.event === 'Teambuilding' && !!r.persons,
          JSON.stringify({ f: r.company, d: r.date, c: r.catering, e: r.event, p: r.persons }));
  }
  const erfolg = await page.evaluate(() => ({
    sichtbar: !document.getElementById('cbi-success').hidden,
    formWeg: getComputedStyle(document.getElementById('cbi-form')).display === 'none',
  }));
  pruef('die Erfolgsmeldung steht da', erfolg.sichtbar === true);
  pruef('das Formular ist weg', erfolg.formWeg === true);
  pruef('keine Ausnahme', fehler.length === 0, JSON.stringify(fehler).slice(0, 200));
  await ctx.close();
}

/* ═══════════ C. /kurse: Karte statt Formular ═══════════ */
console.log('\n── C. Auf /kurse steht nur noch die Karte ──');
{
  const { ctx, page } = await laden('kurse.html#corporate');
  const c = await page.evaluate(() => {
    const sek = document.getElementById('corporate');
    const knopf = sek ? sek.querySelector('a.btn') : null;
    return {
      sektion: !!sek,
      formulare: document.querySelectorAll('form').length,
      cbi: !!document.getElementById('cbi-form'),
      text: sek ? sek.textContent.replace(/\s+/g, ' ').trim() : null,
      knopf: knopf ? { text: knopf.textContent.replace(/\s+/g, ' ').trim(), ziel: knopf.getAttribute('href') } : null,
      still: sek ? sek.hasAttribute('data-sticky-still') : null,
      imBild: sek ? sek.getBoundingClientRect().top < window.innerHeight * 3 : false,
      skript: [...document.querySelectorAll('script[src]')]
        .some((s) => /anfrage-formulare/.test(s.getAttribute('src'))),
    };
  });
  pruef('der Anker #corporate fuehrt weiter irgendwohin', c.sektion === true);
  pruef('und zwar an eine Stelle auf der Seite', c.imBild === true);
  pruef('das Formular ist weg', c.cbi === false && c.formulare === 0,
        c.formulare + ' Formulare');
  pruef('die Karte nennt Teams und Firmen',
        /Für Teams und Firmen/.test(c.text || ''), (c.text || '').slice(0, 90));
  pruef('der Knopf heisst ZUR ANFRAGE und fuehrt auf /corporate-boxing',
        c.knopf && c.knopf.text === 'ZUR ANFRAGE' && c.knopf.ziel === '/corporate-boxing',
        JSON.stringify(c.knopf));
  pruef('data-sticky-still ist mit dem Formular entfallen', c.still === false);
  pruef('und die Formularlogik wird hier nicht mehr geladen', c.skript === false);

  /* DIE AUFKLAPPSTELLE IM KURSTEXT
     Sie beschrieb Corporate Boxing, hatte aber keinen Knopf: wer dort
     landete, musste selbst weitersuchen. Jetzt fuehrt sie direkt zum
     Formular, und ihr Text nennt dieselben zwei Formate wie die Seite. */
  const slide = await page.evaluate(() => {
    const el = document.getElementById('kursdetail-firmenfitness');
    if (!el) return null;
    const knopf = el.querySelector('a.btn');
    return {
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      knopf: knopf ? { text: knopf.textContent.replace(/\s+/g, ' ').trim(),
                       ziel: knopf.getAttribute('href') } : null,
    };
  });
  pruef('die Aufklappstelle im Kurstext gibt es noch', slide !== null);
  if (slide) {
    pruef('sie hat jetzt einen Knopf',
          slide.knopf !== null && slide.knopf.text === 'ANFRAGE SENDEN',
          JSON.stringify(slide.knopf));
    pruef('der auf /corporate-boxing#anfrage fuehrt',
          slide.knopf && slide.knopf.ziel === '/corporate-boxing#anfrage',
          slide.knopf ? slide.knopf.ziel : 'kein Knopf');
    pruef('ihr Text nennt beide Formate',
          /60 oder 90 Minuten/.test(slide.text) && /90 Minuten Theorie/.test(slide.text),
          slide.text.slice(0, 160));
  }

  /* Die Detailansicht am Schreibtisch holte ihre Knoepfe aus einer
     Datentabelle. Fuer Corporate stand dort ein mailto; jetzt der Link. */
  const daten = await page.evaluate(() => {
    const el = document.getElementById('detail-cta-btn');
    return { knopfDa: !!el, mailto: document.documentElement.innerHTML.includes("type: 'email', text: 'ANFRAGE SENDEN'") };
  });
  pruef('kein mailto mehr fuer die Corporate-Anfrage', daten.mailto === false);
  await ctx.close();
}

/* ═══════════ D. Die Wege dorthin ═══════════ */
console.log('\n── D. Fusslinks, Preistabelle, sitemap ──');
{
  const { readdir } = await import('node:fs/promises');
  const dateien = (await readdir(wurzel)).filter((f) => f.endsWith('.html')).sort();
  const fehlende = [];
  const alte = [];
  let mitFuss = 0;
  for (const d of dateien) {
    const t = await readFile(wurzel + '/' + d, 'utf8');
    if (!/class="footer-col"/.test(t)) continue;
    mitFuss++;
    if (/href="\/kurse#corporate"/.test(t)) alte.push(d);
    if (!/href="\/corporate-boxing"/.test(t)) fehlende.push(d);
  }
  pruef('jede Seite mit Fussmenue verlinkt /corporate-boxing',
        fehlende.length === 0, mitFuss + ' Seiten, fehlt bei ' + JSON.stringify(fehlende));
  pruef('kein Fusslink zeigt mehr auf /kurse#corporate',
        alte.length === 0, JSON.stringify(alte));

  const start = await readFile(wurzel + '/index.html', 'utf8');
  pruef('der Tabellenlink in der Preisuebersicht zeigt auf die Anfrage',
        /href="\/corporate-boxing#anfrage"/.test(start),
        /kurse#corporate/.test(start) ? 'zeigt noch auf /kurse#corporate' : undefined);

  /* Kein Eintrag zeigt mehr auf die Aufklappstelle: wer "Corporate
     Boxing" im Menue anklickt, landet auf der Seite, nicht in einem
     Akkordeon mitten in der Kursliste. */
  const altZiel = [];
  for (const d of dateien) {
    const t = await readFile(wurzel + '/' + d, 'utf8');
    if (/href="\/kurse#kursdetail-firmenfitness"/.test(t)) altZiel.push(d);
  }
  pruef('kein Eintrag zeigt mehr auf /kurse#kursdetail-firmenfitness',
        altZiel.length === 0, JSON.stringify(altZiel));

  /* Jede Seite mit Fussmenue hat GENAU EINEN Corporate-Eintrag. Vorher
     standen auf drei Seiten zwei nebeneinander, beide mit demselben
     Ziel. */
  const doppelt = [];
  for (const d of dateien) {
    const t = await readFile(wurzel + '/' + d, 'utf8');
    if (!/class="footer-col"/.test(t)) continue;
    const n = (t.match(/<li><a href="\/corporate-boxing">/g) || []).length;
    if (n !== 1) doppelt.push(d + ': ' + n);
  }
  pruef('je Seite genau ein Corporate-Eintrag im Fuss',
        doppelt.length === 0, JSON.stringify(doppelt));

  /* Das Antwortversprechen ist auf beiden Formularen dasselbe. */
  const preise = await readFile(wurzel + '/preise.html', 'utf8');
  pruef('auch die Erfolgsmeldung auf /preise nennt 24 Stunden',
        !/schnellstmöglich/.test(preise)
        && /Wir melden uns innerhalb von 24 Stunden/.test(preise),
        /schnellstmöglich/.test(preise) ? 'sagt noch schnellstmoeglich' : undefined);
  let nochVage = [];
  for (const d of dateien) {
    const t = await readFile(wurzel + '/' + d, 'utf8');
    if (/schnellstmöglich/.test(t)) nochVage.push(d);
  }
  pruef('"schnellstmöglich" steht auf keiner Seite mehr',
        nochVage.length === 0, JSON.stringify(nochVage));

  const karte = await readFile(wurzel + '/sitemap.xml', 'utf8');
  pruef('die sitemap kennt die Seite',
        karte.includes('<loc>https://www.bomayegym.com/corporate-boxing</loc>'));
  pruef('und nennt sie genau einmal',
        (karte.match(/corporate-boxing/g) || []).length === 1,
        (karte.match(/corporate-boxing/g) || []).length + ' mal');
}

await browser.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

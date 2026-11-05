/* Die ganze Seite auf jeder Telefonbreite.
 *
 *   node tests/breiten.mjs                  gegen den Arbeitsstand
 *   node tests/breiten.mjs /pfad/zu/main    gegen einen anderen Baum
 *
 * WORUM ES GEHT
 * Ein Fehler, der nur auf einem Geraet auftritt, faellt niemandem auf, bis
 * ein Besucher mit genau diesem Geraet kommt. Diese Suite faehrt jede Seite
 * durch dreizehn Fenstergroessen, von der Faltbreite 280px bis zum
 * Hochkant-Tablet 768px und durch drei Querformate, und prueft an jeder
 * Stelle vier Dinge:
 *
 *   1  Die Seite laesst sich nicht waagerecht schieben.
 *   2  Kein Element ist breiter als das Fenster.
 *   3  Die Sticky-Leiste verdeckt keinen Fusslink, keinen Rechtslink und
 *      kein Eingabefeld.
 *   4  Der letzte Inhalt im Fuss bleibt oberhalb der Leiste erreichbar.
 *
 * WARUM GROESSE AENDERN UND NICHT NEU LADEN
 * Sechsundzwanzig Seiten mal dreizehn Groessen sind 338 Ladevorgaenge, das
 * dauert Minuten. Stattdessen wird jede Seite EINMAL geladen und danach das
 * Fenster umgestellt. Fuer Ueberlauf und Ueberlappung ist das gleichwertig:
 * beides entsteht beim Neuberechnen des Layouts, und genau das loest eine
 * Groessenaenderung aus. Was sie NICHT nachstellt, sind Masse, die ein
 * Skript einmal beim Laden ausrechnet. Die ausfuehrlichen Messungen der
 * Leiste bei frisch geladener Seite stehen darum in tests/sticky.mjs.
 *
 * ELEMENTE IN EINEM SCHIEBEKASTEN ZAEHLEN NICHT
 * Die Preistabelle ist absichtlich breiter als das Fenster und liegt in
 * einem Kasten mit overflow-x. Die Pruefung ueberspringt deshalb alles,
 * was einen Vorfahren mit overflow-x auto, scroll oder hidden hat.
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

const SEITEN = [
  'index.html', 'preise.html', 'kurse.html', 'about.html', 'coaches.html',
  'probetraining.html', 'mitglied-werden.html', 'mitgliederbereich.html',
  'stundenplan.html', 'wochenplan.html', 'downloads.html', 'faq.html', 'u18.html',
  'personal-training-boxen-muenchen.html',
  'boxen-lernen-muenchen.html', 'boxen-muenchen.html', 'boxgym-muenchen.html',
  'boxtraining-muenchen.html', 'fitnessboxen-muenchen.html',
  'frauenboxen-muenchen.html', 'kickboxen-muenchen.html', 'kinderboxen-muenchen.html',
  'impressum.html', 'datenschutz.html', 'agb.html', 'hausordnung.html',
];

/* Hochkant: Faltgeraete zu, Faltgeraete offen, die ueblichen Telefone, bis
   zum Hochkant-Tablet. Querformat: dieselben Geraete gedreht. */
const GROESSEN = [
  [280, 800, 'hoch'], [320, 800, 'hoch'], [344, 800, 'hoch'], [360, 800, 'hoch'],
  [375, 800, 'hoch'], [390, 800, 'hoch'], [412, 800, 'hoch'], [430, 800, 'hoch'],
  [480, 800, 'hoch'], [600, 800, 'hoch'], [768, 800, 'hoch'],
  [667, 375, 'quer'], [844, 390, 'quer'], [915, 412, 'quer'],
];

/* Alles, was nicht aus dem eigenen Baum kommt, wird abgebrochen. Cookiebot
   und das bsport-Bundle sind von hier aus nicht erreichbar, und fuer die
   Breitenmessung braucht es sie nicht. */
async function seiteLaden(ctx, pfad) {
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(String(e).slice(0, 160)));
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(basis)) return route.continue();
    return route.abort('failed');
  });
  await page.goto(basis + pfad, { waitUntil: 'load' });
  await page.waitForTimeout(350);
  return { page, fehler };
}

/* MESSEN
   Erst oben, dann ganz unten. Oben, weil dort der Held und der Kopf stehen;
   unten, weil dort der Fuss steht und die Leiste ihn verdecken koennte.

   Die Leiste wird zum Messen ueber style sichtbar gemacht, nicht ueber die
   Klasse: die Klasse nimmt das Skript im naechsten Rahmen wieder weg, weil
   die Abschluss-Sektion im Bild ist. Gemessen werden soll aber der
   schlimmste Fall, naemlich die Leiste genau dort, wo sie liegen WUERDE. */
async function messen(page) {
  return page.evaluate(() => {
    const fenster = window.innerWidth;

    /* GESCHLOSSENE DIALOGE SIND NICHT SICHTBAR, AUCH WENN SIE ES SCHEINEN

       Dieselbe Falle wie in sticky-buchung.js: #family-modal und
       #corporate-modal stehen immer im Markup, position: fixed, display:
       flex, visibility: visible. Zu sind sie ueber opacity: 0 und
       pointer-events: none. Am Element selbst sieht man davon nichts, denn
       die Felder darin haben opacity 1 und eigene Masse mitten im Bild.
       Ein Test, der nur das Element ansieht, meldete darum die Leiste als
       "verdeckt ein Eingabefeld", und zwar auf der Startseite in jeder
       Breite. Darum laeuft jede Pruefung die Vorfahren mit ab. */
    const verborgen = (el) => {
      let p = el;
      while (p && p !== document.body) {
        const cs = getComputedStyle(p);
        if (cs.display === 'none' || cs.visibility === 'hidden'
            || cs.opacity === '0' || cs.pointerEvents === 'none') return true;
        p = p.parentElement;
      }
      return false;
    };

    const zuBreit = () => {
      const treffer = [];
      const alle = document.querySelectorAll('body *');
      for (const el of alle) {
        if (verborgen(el)) continue;
        const r = el.getBoundingClientRect();
        /* Nicht nur breiter als das Fenster, sondern auch ueber den rechten
           Rand hinausgeschoben: auf /u18 war die Karte genau fenstergross,
           lag aber 20px eingerueckt und ragte darum rechts hinaus. */
        if (r.width <= fenster + 1 && r.right <= fenster + 1) continue;
        /* In einem Schiebekasten ist Breite erlaubt. */
        let p = el.parentElement, drin = false;
        while (p && p !== document.body) {
          const pcs = getComputedStyle(p);
          if (/auto|scroll|hidden/.test(pcs.overflowX)) { drin = true; break; }
          p = p.parentElement;
        }
        if (drin) continue;
        treffer.push((el.tagName.toLowerCase()
          + (el.id ? '#' + el.id : '')
          + (el.className && typeof el.className === 'string'
             ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''))
          + ' ' + Math.round(r.width) + 'px, rechts bei ' + Math.round(r.right));
      }
      return treffer.slice(0, 6);
    };

    const oben = {
      quer: document.documentElement.scrollWidth > fenster + 1,
      docBreit: document.documentElement.scrollWidth,
      fenster,
      breiter: zuBreit(),
    };

    window.scrollTo(0, document.documentElement.scrollHeight);
    const l = document.getElementById('sticky-buchung');
    let leiste = null;
    if (l) {
      l.style.opacity = '1';
      l.style.transform = 'none';
      const r = l.getBoundingClientRect();
      leiste = { oben: r.top, unten: r.bottom, hoehe: Math.round(r.height),
                 anzeige: getComputedStyle(l).display };
    }
    const unten = {
      quer: document.documentElement.scrollWidth > fenster + 1,
      breiter: zuBreit(),
      leiste,
      verdeckt: [],
      fussUnten: null,
    };

    if (leiste && leiste.anzeige !== 'none') {
      const schuetzen = document.querySelectorAll(
        'footer a, .site-footer a, .legal-links a, a[href$="impressum"], '
        + 'a[href$="datenschutz"], a[href$="agb"], a[href$="hausordnung"], '
        + 'input, select, textarea, button[type="submit"]');
      for (const el of schuetzen) {
        if (el.closest('.sticky-buchung')) continue;
        if (verborgen(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        if (r.top >= window.innerHeight || r.bottom <= 0) continue;   /* nicht im Bild */
        const ueber = r.bottom > leiste.oben + 1 && r.top < leiste.unten - 1;
        if (ueber) {
          unten.verdeckt.push((el.tagName.toLowerCase()
            + (el.id ? '#' + el.id : ''))
            + ' "' + (el.textContent || el.getAttribute('name') || '').replace(/\s+/g, ' ').trim().slice(0, 24) + '"');
        }
      }
      unten.verdeckt = unten.verdeckt.slice(0, 6);

      const fuss = document.querySelector('footer') || document.querySelector('.site-footer');
      if (fuss) {
        const kinder = [...fuss.children].filter((c) => {
          const cs = getComputedStyle(c);
          return cs.display !== 'none' && c.getBoundingClientRect().height > 0;
        });
        const letzte = kinder[kinder.length - 1];
        if (letzte) unten.fussUnten = letzte.getBoundingClientRect().bottom;
      }
    }
    return { oben, unten };
  });
}

/* ═══════════ A. Jede Seite in jeder Groesse ═══════════ */
/* EINE AUSSAGE JE SEITE UND JE PRUEFUNG, NICHT JE PAARUNG

   Sechsundzwanzig Seiten mal vierzehn Groessen mal fuenf Pruefungen sind
   ueber tausend Zeilen Protokoll, in denen niemand etwas findet. Darum
   sammelt die Schleife die Fundstellen und meldet je Seite EINE Zeile pro
   Pruefung, mit der Liste der Groessen, an denen es klemmt. */
console.log('── A. Jede Seite durch ' + GROESSEN.length + ' Fenstergroessen ──');
let geprueft = 0;
const tabelle = [];

for (const pfad of SEITEN) {
  const name = pfad.replace('.html', '');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const { page, fehler } = await seiteLaden(ctx, pfad);
  const f = { schieben: [], breit: [], verdeckt: [], fuss: [], hoehe: [] };
  const schlecht = new Set();
  let mitLeiste = 0;

  for (const [b, h] of GROESSEN) {
    await page.setViewportSize({ width: b, height: h });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const m = await messen(page);
    const g = `${b}x${h}`;

    if (m.oben.quer || m.unten.quer) f.schieben.push(g + ' (' + m.oben.docBreit + '/' + m.oben.fenster + ')');
    const breiter = [...new Set([...m.oben.breiter, ...m.unten.breiter])];
    if (breiter.length) f.breit.push(g + ': ' + breiter.join(' | '));

    if (m.unten.leiste && m.unten.leiste.anzeige !== 'none') {
      mitLeiste++;
      if (m.unten.verdeckt.length) f.verdeckt.push(g + ': ' + m.unten.verdeckt.join(' | '));
      if (m.unten.fussUnten !== null && m.unten.fussUnten > m.unten.leiste.oben + 1) {
        f.fuss.push(g + ' (Fuss endet ' + Math.round(m.unten.fussUnten)
                    + ', Leiste ab ' + Math.round(m.unten.leiste.oben) + ')');
      }
      /* Hochkant 64px, Querformat 56px, beides plus sicherer Bereich, der
         im Test 0 ist. */
      const soll = h < 450 ? 56 : 64;
      if (m.unten.leiste.hoehe !== soll) f.hoehe.push(g + ': ' + m.unten.leiste.hoehe + ' statt ' + soll);
    }
    geprueft++;
  }

  for (const k of Object.keys(f)) if (f[k].length) f[k].forEach((e) => schlecht.add(e.split(':')[0].split(' ')[0]));

  pruef(name + ': nirgends waagerecht schiebbar', f.schieben.length === 0, f.schieben.join(' / '));
  pruef(name + ': nirgends ein Element breiter als das Fenster', f.breit.length === 0,
        f.breit.join(' / ').slice(0, 300));
  if (mitLeiste) {
    pruef(name + ': Leiste verdeckt nirgends Link oder Feld', f.verdeckt.length === 0,
          f.verdeckt.join(' / ').slice(0, 300));
    pruef(name + ': Fussinhalt bleibt ueberall ueber der Leiste', f.fuss.length === 0,
          f.fuss.join(' / '));
    pruef(name + ': Leiste hat ueberall die vorgesehene Hoehe', f.hoehe.length === 0,
          f.hoehe.join(' / '));
  }
  pruef(name + ': keine Ausnahme beim Laden', fehler.length === 0,
        JSON.stringify(fehler).slice(0, 200));

  tabelle.push({ name, schlecht: [...schlecht], mitLeiste });
  await ctx.close();
}

/* ═══════════ B. Systemschrift auf 130% ═══════════ */
console.log('\n── B. Systemschrift 130%, 320 und 390 px ──');
for (const pfad of ['index.html', 'preise.html', 'probetraining.html']) {
  const name = pfad.replace('.html', '');
  for (const b of [320, 390]) {
    const ctx = await browser.newContext({ viewport: { width: b, height: 800 } });
    const { page } = await seiteLaden(ctx, pfad);
    await page.addStyleTag({ content: 'html { font-size: 130% }' });
    await page.waitForTimeout(350);
    const m = await messen(page);
    const marke = `${name} / ${b}px @130%`;
    pruef(marke + ': kein waagerechtes Schieben',
          m.oben.quer === false, m.oben.docBreit + ' zu ' + m.oben.fenster);
    pruef(marke + ': kein Element breiter als das Fenster',
          m.oben.breiter.length === 0, JSON.stringify(m.oben.breiter));
    if (m.unten.leiste && m.unten.leiste.anzeige !== 'none') {
      pruef(marke + ': Leiste bleibt 64 px', m.unten.leiste.hoehe === 64,
            m.unten.leiste.hoehe + ' px');
      pruef(marke + ': Leiste verdeckt keinen Link und kein Feld',
            m.unten.verdeckt.length === 0, JSON.stringify(m.unten.verdeckt));
    }
    await ctx.close();
  }
}

console.log('\n── Tabelle: Seite x Groesse ──');
for (const z of tabelle) {
  console.log(z.name.padEnd(32)
    + (z.schlecht.length ? 'FEHLER bei ' + z.schlecht.join(', ')
                         : 'alle ' + GROESSEN.length + ' Groessen gut')
    + (z.mitLeiste ? '   (Leiste in ' + z.mitLeiste + ')' : '   (ohne Leiste)'));
}
console.log('\n' + geprueft + ' Seiten-Groessen-Paare gemessen.');

await browser.close(); srv.close();
process.exit(abschluss() ? 1 : 0);

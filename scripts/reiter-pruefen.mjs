#!/usr/bin/env node
/**
 * REITER-PRUEFUNG: schaltet der Kaufschritt auf den Gratis-Pass um?
 * ───────────────────────────────────────────────────────────────────────────
 *
 * WOZU
 * Nach der Anmeldung oeffnet Bsport "Neuen Kurspass kaufen" mit einer
 * Reiterleiste und zeigt zuerst "Empfehlungen" - dort steht ein Abo. Das
 * Modul _ptGratisReiter in assets/js/probetraining-page.js schaltet einmal
 * auf den Reiter mit dem Gratis-Pass um. Diese Pruefung faehrt alle Faelle,
 * in denen es NICHTS tun darf, genauso hart wie den Fall, in dem es wirken
 * soll - denn ein falscher Klick in ein fremdes Buchungssystem ist schlimmer
 * als kein Klick.
 *
 * WARUM MIT ATTRAPPE
 * Das Bsport-Widget laedt in dieser Umgebung nicht (cdn.bsport.io ist
 * gesperrt) und braucht ausserdem die Marketing-Einwilligung. Geprueft wird
 * deshalb das echte, ausgelieferte Seitenskript gegen eine Attrappe des
 * Dialogs: MUI-artige Klassennamen mit Zahlensuffix, role="tab", aria-
 * selected, und ein Wechsel der Markierung beim Klick. Genau die Struktur,
 * an der das Modul scheitern wuerde, wenn es sich auf Klassennamen stuetzte.
 *
 * AUFRUF
 *   node scripts/reiter-pruefen.mjs
 * Rueckgabewert 1, wenn ein Fall fehlschlaegt. 2, wenn Playwright fehlt.
 *
 * VORAUSSETZUNG
 *   npm i -D playwright && npx playwright install chromium
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const HANDY  = { width: 390, height: 844 };   /* iPhone 14 */

async function chromiumHolen() {
  const wege = ['playwright', 'playwright-core',
                '/opt/node22/lib/node_modules/playwright/index.mjs'];
  for (const w of wege) {
    try { return (await import(w)).chromium; } catch { /* naechster */ }
  }
  console.error('Playwright nicht gefunden. Einmalig einrichten:');
  console.error('  npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.xml': 'application/xml' };

async function serverStarten() {
  const srv = createServer(async (req, res) => {
    const pfad = decodeURIComponent(req.url.split('?')[0]);
    if (pfad.includes('..')) { res.writeHead(400); return res.end(); }
    try {
      /* Erst lesen, dann den Kopf schreiben - sonst endet ein fehlender
         Pfad in ERR_HTTP_HEADERS_SENT statt in einem 404. */
      const datei = join(WURZEL, pfad === '/' ? 'index.html' : pfad);
      const inhalt = await readFile(datei);
      res.writeHead(200, { 'content-type': TYPEN[extname(datei)] || 'application/octet-stream' });
      res.end(inhalt);
    } catch { res.writeHead(404); res.end('nicht gefunden'); }
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { srv, basis: `http://127.0.0.1:${srv.address().port}/` };
}

/* ── Die Attrappe, laeuft IN der Seite ───────────────────────────────────── */
const ATTRAPPE = () => {
  window.__klicks = {};          /* Text -> Anzahl Klicks */
  window.__vorher = document.getElementsByTagName('*').length;

  /* MUI-artig: Klassennamen mit Zahlensuffix, Text in einem inneren span.
     Wer sich auf die Klasse stuetzt, findet hier nichts. */
  function reiter(text, opt) {
    const b = document.createElement(opt.tag || 'button');
    b.className = 'MuiTab-root-' + (800 + Math.floor(Math.random() * 99)) + ' jss' + (400 + Math.floor(Math.random() * 99));
    if (opt.rolle !== false) b.setAttribute('role', 'tab');
    if (opt.rolle !== false) b.setAttribute('aria-selected', opt.aktiv ? 'true' : 'false');
    const s = document.createElement('span');
    s.className = 'MuiTab-wrapper-' + (900 + Math.floor(Math.random() * 99));
    s.textContent = text;
    b.appendChild(s);
    b.addEventListener('click', () => {
      window.__klicks[text] = (window.__klicks[text] || 0) + 1;
      /* Wie ein echter Reiter: die Markierung wandert mit. */
      const leiste = b.parentElement;
      for (const g of leiste.children) {
        if (g.hasAttribute('aria-selected')) g.setAttribute('aria-selected', g === b ? 'true' : 'false');
      }
    });
    return b;
  }

  window.__bauen = function (opt) {
    const halter = document.createElement('div');
    halter.id = 'bsport-widget-880939';
    const dlg = document.createElement('div');
    dlg.id = 'bs-activity--dialog';
    dlg.className = 'MuiDialog-root-1104';
    const papier = document.createElement('div');
    papier.className = 'MuiPaper-root-1121 MuiDialog-paper-1108';
    const kopf = document.createElement('h2');
    kopf.textContent = 'Neuen Kurspass kaufen';
    papier.appendChild(kopf);

    if (opt.leiste) {
      const leiste = document.createElement('div');
      leiste.className = 'jss417';
      if (opt.rolle !== false) leiste.setAttribute('role', 'tablist');
      for (const n of opt.namen) {
        leiste.appendChild(reiter(n.text, { aktiv: !!n.aktiv, rolle: opt.rolle, tag: opt.tag }));
      }
      papier.appendChild(leiste);
    }

    if (opt.fliesstext) {
      const p = document.createElement('p');
      p.textContent = opt.fliesstext;
      papier.appendChild(p);
    }

    /* Die Abo-Karte und ein Kaufknopf, genau wie im echten Schritt. Beide
       duerfen NIE geklickt werden. */
    const karte = document.createElement('div');
    karte.textContent = 'Bomaye Unlimited (Early Bird) 75,60 EUR / Monat';
    papier.appendChild(karte);
    const kauf = document.createElement('button');
    kauf.type = 'submit';
    kauf.textContent = 'Jetzt kaufen';
    kauf.addEventListener('click', () => {
      window.__klicks['Jetzt kaufen'] = (window.__klicks['Jetzt kaufen'] || 0) + 1;
    });
    papier.appendChild(kauf);

    /* Ein Eingabefeld, damit der Schritt dem Anmeldeschritt gleicht. */
    const feld = document.createElement('input');
    feld.type = 'email';
    papier.appendChild(feld);

    dlg.appendChild(papier);
    halter.appendChild(dlg);
    (document.getElementById('pt-cal-view') || document.body).appendChild(halter);
    return true;
  };

  window.__abbauen = function () {
    const h = document.getElementById('bsport-widget-880939');
    if (h) h.remove();
  };

  window.__aktiver = function () {
    const l = document.querySelectorAll('[role="tab"][aria-selected="true"]');
    return [...l].map((e) => e.textContent.trim()).join(',');
  };
};

/* ── Faelle ──────────────────────────────────────────────────────────────── */
const LEISTE_NORMAL = {
  leiste: true,
  namen: [
    { text: 'Empfehlungen', aktiv: true },
    { text: 'Alle' },
    { text: 'Verträge' },
    { text: 'Free Training' },
    { text: 'Andere Kurspässe' }
  ]
};

const FAELLE = [
  {
    name: 'Leerlauf: keine Attrappe, nichts darf passieren',
    async lauf(page) {
      await page.waitForTimeout(1400);
      const k = await page.evaluate(() => window.__klicks);
      const neu = await page.evaluate(() => document.getElementsByTagName('*').length - window.__vorher);
      return [
        [Object.keys(k).length === 0, `keine Klicks (war: ${JSON.stringify(k)})`],
        [neu === 0, `keine neuen Elemente (war: ${neu})`]
      ];
    }
  },
  {
    name: 'Reiterleiste mit "Free Training": wird genau einmal geklickt',
    async lauf(page) {
      await page.evaluate((o) => window.__bauen(o), LEISTE_NORMAL);
      await page.waitForTimeout(1400);
      const k = await page.evaluate(() => window.__klicks);
      const aktiv = await page.evaluate(() => window.__aktiver());
      return [
        [k['Free Training'] === 1, `"Free Training" einmal geklickt (war: ${k['Free Training']})`],
        [Object.keys(k).length === 1, `nichts sonst geklickt (war: ${JSON.stringify(k)})`],
        [aktiv === 'Free Training', `"Free Training" ist aktiv (war: ${aktiv})`]
      ];
    }
  },
  {
    name: 'Reiterleiste mit "Gratis Probetraining": der neue Name wirkt auch',
    async lauf(page) {
      await page.evaluate(() => window.__bauen({
        leiste: true,
        namen: [
          { text: 'Empfehlungen', aktiv: true },
          { text: 'Alle' },
          { text: 'Verträge' },
          { text: 'Gratis Probetraining' },
          { text: 'Andere Kurspässe' }
        ]
      }));
      await page.waitForTimeout(1400);
      const k = await page.evaluate(() => window.__klicks);
      return [
        [k['Gratis Probetraining'] === 1, `einmal geklickt (war: ${k['Gratis Probetraining']})`],
        [Object.keys(k).length === 1, `nichts sonst geklickt (war: ${JSON.stringify(k)})`]
      ];
    }
  },
  {
    name: 'Dialog ohne Reiterleiste: nichts passiert',
    async lauf(page) {
      await page.evaluate(() => window.__bauen({ leiste: false }));
      await page.waitForTimeout(1400);
      const k = await page.evaluate(() => window.__klicks);
      return [[Object.keys(k).length === 0, `keine Klicks (war: ${JSON.stringify(k)})`]];
    }
  },
  {
    name: 'Name nur im Fliesstext, keine Leiste: nichts passiert',
    async lauf(page) {
      await page.evaluate(() => window.__bauen({
        leiste: false,
        fliesstext: 'Free Training'
      }));
      await page.waitForTimeout(1400);
      const k = await page.evaluate(() => window.__klicks);
      return [[Object.keys(k).length === 0, `keine Klicks (war: ${JSON.stringify(k)})`]];
    }
  },
  {
    name: 'Reiter umbenannt: nichts passiert',
    async lauf(page) {
      await page.evaluate(() => window.__bauen({
        leiste: true,
        namen: [
          { text: 'Empfehlungen', aktiv: true },
          { text: 'Alle' },
          { text: 'Verträge' },
          { text: 'Kurspässe Spezial' },
          { text: 'Andere Kurspässe' }
        ]
      }));
      await page.waitForTimeout(1400);
      const k = await page.evaluate(() => window.__klicks);
      const aktiv = await page.evaluate(() => window.__aktiver());
      return [
        [Object.keys(k).length === 0, `keine Klicks (war: ${JSON.stringify(k)})`],
        [aktiv === 'Empfehlungen', `"Empfehlungen" bleibt aktiv (war: ${aktiv})`]
      ];
    }
  },
  {
    name: 'Reiter schon aktiv: kein Klick',
    async lauf(page) {
      await page.evaluate(() => window.__bauen({
        leiste: true,
        namen: [
          { text: 'Empfehlungen' },
          { text: 'Free Training', aktiv: true },
          { text: 'Andere Kurspässe' }
        ]
      }));
      await page.waitForTimeout(1400);
      const k = await page.evaluate(() => window.__klicks);
      return [[Object.keys(k).length === 0, `keine Klicks (war: ${JSON.stringify(k)})`]];
    }
  },
  {
    name: 'Zwei Reiter mit demselben Namen: mehrdeutig, nichts passiert',
    async lauf(page) {
      await page.evaluate(() => window.__bauen({
        leiste: true,
        namen: [
          { text: 'Empfehlungen', aktiv: true },
          { text: 'Free Training' },
          { text: 'Free Training' }
        ]
      }));
      await page.waitForTimeout(1400);
      const k = await page.evaluate(() => window.__klicks);
      return [[Object.keys(k).length === 0, `keine Klicks (war: ${JSON.stringify(k)})`]];
    }
  },
  {
    name: 'Leiste ohne ARIA, nur <div>: wird ueber den Text gefunden',
    async lauf(page) {
      await page.evaluate(() => window.__bauen({
        leiste: true, rolle: false, tag: 'div',
        namen: [
          { text: 'Empfehlungen' },
          { text: 'Alle' },
          { text: 'Free Training' }
        ]
      }));
      await page.waitForTimeout(1400);
      const k = await page.evaluate(() => window.__klicks);
      return [
        [k['Free Training'] === 1, `einmal geklickt (war: ${k['Free Training']})`],
        [Object.keys(k).length === 1, `nichts sonst geklickt (war: ${JSON.stringify(k)})`]
      ];
    }
  },
  {
    name: 'Leiste ohne ARIA neben einem Absatz mit demselben Text: Reiter gewinnt',
    async lauf(page) {
      await page.evaluate(() => window.__bauen({
        leiste: true, rolle: false, tag: 'div',
        fliesstext: 'Free Training',
        namen: [
          { text: 'Empfehlungen' },
          { text: 'Alle' },
          { text: 'Free Training' }
        ]
      }));
      await page.waitForTimeout(1600);
      const k = await page.evaluate(() => window.__klicks);
      return [
        [k['Free Training'] === 1, `der Reiter wurde geklickt (war: ${k['Free Training']})`],
        [Object.keys(k).length === 1, `nichts sonst geklickt (war: ${JSON.stringify(k)})`]
      ];
    }
  },
  {
    name: 'Besucher tippt danach selbst auf "Empfehlungen": bleibt dort',
    async lauf(page) {
      await page.evaluate((o) => window.__bauen(o), LEISTE_NORMAL);
      await page.waitForTimeout(1400);
      /* Echter Tipp auf den ersten Reiter, danach darf nicht
         zurueckgeschaltet werden. */
      await page.evaluate(() => {
        const r = [...document.querySelectorAll('[role="tab"]')]
          .find((e) => e.textContent.trim() === 'Empfehlungen');
        r.click();
      });
      await page.waitForTimeout(1600);
      const k = await page.evaluate(() => window.__klicks);
      const aktiv = await page.evaluate(() => window.__aktiver());
      return [
        [k['Free Training'] === 1, `nur der eine Klick von uns (war: ${k['Free Training']})`],
        [k['Empfehlungen'] === 1, `der Tipp des Besuchers zaehlt einmal (war: ${k['Empfehlungen']})`],
        [aktiv === 'Empfehlungen', `"Empfehlungen" bleibt aktiv (war: ${aktiv})`]
      ];
    }
  },
  {
    name: 'Leiste kommt erst spaeter im offenen Dialog: wird dann gefunden',
    async lauf(page) {
      await page.evaluate(() => window.__bauen({ leiste: false }));
      await page.waitForTimeout(1200);
      const vorher = await page.evaluate(() => Object.keys(window.__klicks).length);

      /* Derselbe Dialog, neuer Inhalt - so verhaelt sich der Kaufschritt
         nach der Anmeldung. */
      await page.evaluate((o) => {
        window.__abbauen();
        window.__bauen(o);
      }, LEISTE_NORMAL);
      await page.waitForTimeout(1600);
      const k = await page.evaluate(() => window.__klicks);
      return [
        [vorher === 0, `vor der Leiste kein Klick (war: ${vorher})`],
        [k['Free Training'] === 1, `nach der Leiste ein Klick (war: ${k['Free Training']})`]
      ];
    }
  },
  {
    name: 'Zu und wieder auf: wirkt erneut, aber nie zweimal pro Oeffnung',
    async lauf(page) {
      await page.evaluate((o) => window.__bauen(o), LEISTE_NORMAL);
      await page.waitForTimeout(1400);
      const nach1 = await page.evaluate(() => window.__klicks['Free Training'] || 0);

      await page.evaluate(() => window.__abbauen());
      await page.waitForTimeout(900);

      await page.evaluate((o) => window.__bauen(o), LEISTE_NORMAL);
      await page.waitForTimeout(1400);
      const nach2 = await page.evaluate(() => window.__klicks['Free Training'] || 0);

      /* Noch einmal warten, ohne etwas zu veraendern: es darf nichts
         nachkommen. */
      await page.waitForTimeout(1200);
      const nach3 = await page.evaluate(() => window.__klicks['Free Training'] || 0);
      const k = await page.evaluate(() => window.__klicks);

      return [
        [nach1 === 1, `erste Oeffnung: ein Klick (war: ${nach1})`],
        [nach2 === 2, `zweite Oeffnung: ein weiterer Klick (war: ${nach2 - nach1})`],
        [nach3 === 2, `danach kein Nachschlag (war: ${nach3 - nach2})`],
        [!k['Jetzt kaufen'], `Kaufknopf nie geklickt (war: ${k['Jetzt kaufen'] || 0})`]
      ];
    }
  }
];

/* ── Lauf ────────────────────────────────────────────────────────────────── */
const chromium = await chromiumHolen();
const { srv, basis } = await serverStarten();
const browser = await chromium.launch();

let fehler = 0;
let pruefungen = 0;

for (const fall of FAELLE) {
  const ctx = await browser.newContext({ viewport: HANDY });

  /* Alles Fremde bleibt draussen: GTM und Cookiebot sind aus dieser Umgebung
     ohnehin nicht erreichbar, und ihre Ladefehler wuerden jede Pruefung auf
     Konsolenfehler unbrauchbar machen. */
  await ctx.route('**/*', (route) =>
    route.request().url().startsWith(basis) ? route.continue() : route.abort());

  const page = await ctx.newPage();
  const konsolenFehler = [];
  const egal = /Failed to load resource|net::ERR_|ERR_FAILED/;
  page.on('console', (m) => {
    if (m.type() === 'error' && !egal.test(m.text())) konsolenFehler.push(m.text());
  });
  page.on('pageerror', (e) => konsolenFehler.push('pageerror: ' + e.message));

  await page.goto(basis + 'probetraining.html', { waitUntil: 'load' });
  await page.evaluate(ATTRAPPE);

  const ergebnisse = await fall.lauf(page);
  ergebnisse.push([konsolenFehler.length === 0,
                   `keine Konsolenfehler (war: ${konsolenFehler.slice(0, 3).join(' | ')})`]);

  const schlecht = ergebnisse.filter(([ok]) => !ok);
  pruefungen += ergebnisse.length;
  console.log(`${schlecht.length ? '✗' : '✓'} ${fall.name}`);
  for (const [ok, text] of ergebnisse) {
    if (!ok) { console.log(`    FEHLER: ${text}`); fehler++; }
  }

  await ctx.close();
}

await browser.close();
srv.close();

console.log(`\n${FAELLE.length} Faelle, ${pruefungen} Pruefungen, ${fehler} Fehler`);
process.exit(fehler ? 1 : 0);

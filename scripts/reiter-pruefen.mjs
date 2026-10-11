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

  /* Die Gestalt, die am Geraet wirklich dasteht (Bericht vom 11.10.2026):
     zwei Reihen Chips, KEIN role="tab", der aktive Reiter allein an seiner
     goldenen Fuellung zu erkennen, Text in einem inneren span, Klassennamen
     mit Zahlensuffix. Genau daran ist PR #112 gescheitert. */
  window.__bauenChips = function (opt) {
    const chip = (txt, aktiv) => {
      const c = document.createElement('div');
      c.className = 'MuiChip-root-612 jss88';
      c.style.cssText = 'display:inline-flex;padding:6px 12px;border-radius:16px;'
        + (aktiv ? 'background:#C9A84C;color:#0A0A08;' : 'background:#F5F0E8;color:#0A0A08;');
      const s = document.createElement('span');
      s.className = 'MuiChip-label-620';
      s.textContent = txt;
      c.appendChild(s);
      c.addEventListener('click', () => {
        window.__klicks[txt] = (window.__klicks[txt] || 0) + 1;
        /* Wie am Geraet: die goldene Fuellung wandert mit. */
        const bar = c.closest('.bs-chipbar');
        for (const k of bar.querySelectorAll('.MuiChip-root-612')) {
          k.style.background = k === c ? '#C9A84C' : '#F5F0E8';
        }
      });
      return c;
    };

    const dlg = document.createElement('div');
    if (opt.id !== false) dlg.id = 'bs-activity--dialog';
    const kopf = document.createElement('h2');
    kopf.textContent = 'Neuen Kurspass kaufen';
    dlg.appendChild(kopf);

    const bar = document.createElement('div');
    bar.className = 'bs-chipbar jss417';
    bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
    const namen = opt.namen || [
      ['Empfehlungen', true], ['Alle', false], ['Verträge', false],
      ['Gratis Probetraining', false], ['Andere Kurspässe', false]
    ];
    if (opt.reihen) {
      /* Zwei echte DOM-Reihen, das Ziel ALLEIN in der zweiten - der Fall,
         in dem PR #112 die Reihe statt des Chips getroffen hat. */
      const r1 = document.createElement('div');
      const r2 = document.createElement('div');
      namen.forEach(([t, a], i) => (i === 3 ? r2 : r1).appendChild(chip(t, a)));
      bar.appendChild(r1);
      bar.appendChild(r2);
    } else {
      namen.forEach(([t, a]) => bar.appendChild(chip(t, a)));
    }
    dlg.appendChild(bar);

    const karte = document.createElement('div');
    karte.textContent = 'Bomaye Unlimited (Early Bird) 75,60 EUR / Monat';
    dlg.appendChild(karte);
    const kauf = document.createElement('button');
    kauf.type = 'submit';
    kauf.textContent = 'Jetzt kaufen';
    kauf.addEventListener('click', () => {
      window.__klicks['Jetzt kaufen'] = (window.__klicks['Jetzt kaufen'] || 0) + 1;
    });
    dlg.appendChild(kauf);

    if (opt.amBody) {
      /* Nicht im Widget-Halter, so wie Bsports alter Dialog. */
      document.body.appendChild(dlg);
      window.__weg = () => dlg.remove();
    } else {
      const h = document.createElement('div');
      h.id = 'bsport-widget-880939';
      h.appendChild(dlg);
      document.getElementById('pt-cal-view').appendChild(h);
      window.__weg = () => h.remove();
    }
    return true;
  };

  window.__goldener = function () {
    const gold = [...document.querySelectorAll('.MuiChip-root-612')]
      .filter((e) => getComputedStyle(e).backgroundColor === 'rgb(201, 168, 76)');
    return gold.map((e) => e.textContent.trim()).join(',');
  };

  window.__abbauen = function () {
    if (window.__weg) { window.__weg(); window.__weg = null; return; }
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
  /* ── Die Gestalt vom Geraet: Chips, zwei Reihen, Fuellung statt ARIA ──── */
  {
    name: 'CHIPS einreihig: wird genau einmal getippt',
    async lauf(page) {
      await page.evaluate(() => window.__bauenChips({}));
      await page.waitForTimeout(1800);
      const k = await page.evaluate(() => window.__klicks);
      const gold = await page.evaluate(() => window.__goldener());
      return [
        [k['Gratis Probetraining'] === 1, `einmal getippt (war: ${k['Gratis Probetraining']})`],
        [Object.keys(k).length === 1, `nichts sonst getippt (war: ${JSON.stringify(k)})`],
        [gold === 'Gratis Probetraining', `goldene Fuellung ist gewandert (war: ${gold})`]
      ];
    }
  },
  {
    name: 'CHIPS zweireihig, Ziel allein in Reihe 2: wird getippt (Fehler aus #112)',
    async lauf(page) {
      await page.evaluate(() => window.__bauenChips({ reihen: true }));
      await page.waitForTimeout(1800);
      const k = await page.evaluate(() => window.__klicks);
      const gold = await page.evaluate(() => window.__goldener());
      return [
        [k['Gratis Probetraining'] === 1, `einmal getippt (war: ${k['Gratis Probetraining']})`],
        [gold === 'Gratis Probetraining', `goldene Fuellung ist gewandert (war: ${gold})`]
      ];
    }
  },
  {
    name: 'CHIPS am <body>, ohne die bekannte Dialog-ID: wird trotzdem gefunden',
    async lauf(page) {
      await page.evaluate(() => window.__bauenChips({ amBody: true, id: false }));
      await page.waitForTimeout(1800);
      const k = await page.evaluate(() => window.__klicks);
      return [[k['Gratis Probetraining'] === 1, `einmal getippt (war: ${k['Gratis Probetraining']})`]];
    }
  },
  {
    name: 'CHIPS: Ziel ist schon der goldene, kein ARIA: kein Tipp',
    async lauf(page, protokoll) {
      await page.evaluate(() => window.__bauenChips({
        namen: [
          ['Empfehlungen', false], ['Alle', false], ['Verträge', false],
          ['Gratis Probetraining', true], ['Andere Kurspässe', false]
        ]
      }));
      await page.waitForTimeout(1800);
      const k = await page.evaluate(() => window.__klicks);
      const gruende = protokoll;
      return [
        [Object.keys(k).length === 0, `keine Klicks (war: ${JSON.stringify(k)})`],
        [gruende.some((g) => /schon aktiv/.test(g)), `Grund "schon aktiv" gemeldet (war: ${gruende.join(' | ')})`]
      ];
    }
  },
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
    name: 'Protokoll nennt jeden Ausgang mit Grund',
    async lauf(page, protokoll) {
      /* 1. nichts da */
      await page.waitForTimeout(700);
      /* 2. Name nur im Fliesstext */
      await page.evaluate(() => window.__bauen({ leiste: false, fliesstext: 'Free Training' }));
      await page.waitForTimeout(900);
      /* 3. zwei gleich benannte Reiter */
      await page.evaluate(() => {
        window.__abbauen();
        window.__bauen({ leiste: true, namen: [
          { text: 'Empfehlungen', aktiv: true }, { text: 'Free Training' }, { text: 'Free Training' }
        ] });
      });
      await page.waitForTimeout(900);
      /* 4. schon aktiv */
      await page.evaluate(() => {
        window.__abbauen();
        window.__bauen({ leiste: true, namen: [
          { text: 'Empfehlungen' }, { text: 'Free Training', aktiv: true }, { text: 'Alle' }
        ] });
      });
      await page.waitForTimeout(900);
      /* 5. echter Wechsel, mit Wirkungskontrolle */
      await page.evaluate((o) => { window.__abbauen(); window.__bauen(o); }, LEISTE_NORMAL);
      await page.waitForTimeout(1600);

      const p = protokoll.join(' | ');
      return [
        [/kein Reiter mit diesem Text im Dokument/.test(p), 'Grund "kein Reiter im Dokument"'],
        [/in keiner Reiterleiste/.test(p), 'Grund "in keiner Reiterleiste"'],
        [/mehrdeutig/.test(p), 'Grund "mehrdeutig"'],
        [/schon aktiv/.test(p), 'Grund "schon aktiv"'],
        [/getippt auf "free training"/.test(p), 'Meldung des Tipps'],
        [/Wirkung: Leiste hat umgeschaltet/.test(p), 'Wirkungskontrolle bestaetigt den Wechsel'],
        [protokoll.filter((z) => /kein Reiter mit diesem Text/.test(z)).length <= 3,
         `kein Protokollfluten (Zeilen: ${protokoll.length})`]
      ].map(([ok, text]) => [ok, `${text} (Protokoll: ${p.slice(0, 400)})`]);
    }
  },
  {
    name: 'Wirkungskontrolle meldet einen Tipp ohne Wirkung',
    async lauf(page, protokoll) {
      /* Eine Leiste ohne jeden Hoerer: der Tipp kann nichts bewirken. Genau
         das muss das Protokoll sagen, statt Erfolg zu melden. */
      await page.evaluate(() => {
        const dlg = document.createElement('div');
        dlg.id = 'bs-activity--dialog';
        const bar = document.createElement('div');
        bar.style.cssText = 'display:flex;gap:8px;';
        for (const t of ['Empfehlungen', 'Alle', 'Free Training']) {
          const c = document.createElement('div');
          c.style.cssText = 'padding:6px;background:#F5F0E8;';
          const s = document.createElement('span');
          s.textContent = t;
          c.appendChild(s);
          bar.appendChild(c);
        }
        dlg.appendChild(bar);
        document.body.appendChild(dlg);
      });
      await page.waitForTimeout(1800);
      const p = protokoll.join(' | ');
      return [
        [/getippt auf "free training"/.test(p), `Tipp gemeldet (Protokoll: ${p.slice(0, 300)})`],
        [/KEIN Wechsel erkennbar/.test(p), `kein Erfolg behauptet (Protokoll: ${p.slice(0, 300)})`]
      ];
    }
  },
  {
    name: 'Klickgrenze: nach 3 Oeffnungen ist Schluss, mit Meldung',
    async lauf(page, protokoll) {
      for (let i = 0; i < 4; i++) {
        await page.evaluate((o) => { window.__abbauen(); window.__bauenChips(o); }, {});
        await page.waitForTimeout(1200);
        await page.evaluate(() => window.__abbauen());
        await page.waitForTimeout(700);
      }
      const k = await page.evaluate(() => window.__klicks);
      const p = protokoll.join(' | ');
      return [
        [k['Gratis Probetraining'] === 3, `genau 3 Tipps (war: ${k['Gratis Probetraining']})`],
        [/Grenze von 3 Klicks erreicht/.test(p), `Grenze gemeldet (Protokoll: ${p.slice(-200)})`]
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
  const protokoll = [];
  const egal = /Failed to load resource|net::ERR_|ERR_FAILED/;
  page.on('console', (m) => {
    const t = m.text();
    if (t.indexOf('[pt-gratis-reiter]') === 0) protokoll.push(t.replace('[pt-gratis-reiter] ', ''));
    if (m.type() === 'error' && !egal.test(t)) konsolenFehler.push(t);
  });
  page.on('pageerror', (e) => konsolenFehler.push('pageerror: ' + e.message));

  /* ?ptdebug=1, damit die Gruende mitgeschrieben werden - jeder Ausgang des
     Moduls muss sich benennen lassen. */
  await page.goto(basis + 'probetraining.html?ptdebug=1', { waitUntil: 'load' });
  await page.evaluate(ATTRAPPE);

  const ergebnisse = await fall.lauf(page, protokoll);
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

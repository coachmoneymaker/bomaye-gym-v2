/* ══════════════════════════════════════════════════════════════════════════
   WAS OHNE EINWILLIGUNG LAUFEN MUSS, DARF NICHT BLOCKIERT SEIN
   ══════════════════════════════════════════════════════════════════════════

   Cookiebots automatische Blockade stellt Skripte bis zur
   Marketing-Einwilligung auf type="text/plain". Sie laufen dann nie.
   data-cookieconsent="ignore" nimmt ein Skript davon aus.

   Das ist kein Freibrief, sondern eine enge Ausnahme fuer Skripte, die
   WEDER einen Keks setzen NOCH in einen Speicher schreiben NOCH etwas von
   fremden Servern laden - also fuer reine Darstellung und Bedienung.
   Messung und Marketing bleiben hinter der Einwilligung, immer.

   WARUM ES DIESE PRUEFUNG GIBT
   Zweimal in Folge ging genau das schief:

     PR #177  abo-embed.js und der Inline-Aufruf von bomayeAbo.init trugen
              die Ausnahme nicht. Ohne Einwilligung gab es keinen
              Klick-Horcher, und ein Klick auf einen Paket-Knopf landete
              auf /mitglied-werden#packages statt im Overlay.
     #174     Der Reveal-Block trug sie nicht. Ohne Einwilligung bleibt der
              Inhalt bei opacity 0 stehen, bis die Wache nach 2500 ms
              eingreift - also sichtbar, aber ohne Ueberblendung und mit
              spuerbarer Verzoegerung. Auf /coaches wurde genau das
              gemeldet und war von hier aus nie nachstellbar, weil
              consent.cookiebot.com nicht erreichbar ist.

   Geprueft wird deshalb am Markup, nicht im Browser: jedes Skript, das
   eine Seite zum ANSEHEN braucht, traegt die Ausnahme. Umgekehrt darf sie
   kein Skript tragen, das misst.
   ══════════════════════════════════════════════════════════════════════════ */
import { readFile, readdir } from 'node:fs/promises';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const befunde = [];
const melde = (s) => befunde.push(s);

/* Ein <script>-Tag samt Rumpf. */
const SKRIPTE = /<script\b([^>]*)>((?:(?!<\/script>)[\s\S])*?)<\/script>/g;
const frei = (attr) => /data-cookieconsent="ignore"/.test(attr);

/* MUSS die Ausnahme tragen. Jeder Eintrag sagt, woran das Skript zu
   erkennen ist und warum die Seite es zum Ansehen braucht. */
const BRAUCHT_FREIGABE = [
  { name: 'Reveal-Wache',
    grund: 'macht den Inhalt nach 2500 ms sichtbar, falls der Beobachter ausfaellt',
    trifft: (attr, rumpf) => /__revealWache\s*=\s*setTimeout/.test(rumpf) },
  { name: 'Reveal-Beobachter',
    grund: 'blendet jeden Abschnitt der Seite ein; ohne ihn bleibt der Inhalt bei opacity 0',
    trifft: (attr, rumpf) => /clearTimeout\(window\.__revealWache\)/.test(rumpf) },
  { name: 'bsport-gate.js',
    grund: 'ist die Sperre selbst und zeigt den Einwilligungshinweis an',
    trifft: (attr) => /bsport-gate\.js/.test(attr) },
  { name: 'consent-bridge.js',
    grund: 'reicht den Einwilligungsstand weiter und misst selbst nichts',
    trifft: (attr) => /consent-bridge\.js/.test(attr) },
  { name: 'abo-embed.js',
    grund: 'faengt den Klick auf einen Paket-Knopf ab und oeffnet das Overlay',
    trifft: (attr) => /abo-embed\.js/.test(attr) },
  { name: 'Aufruf von bomayeAbo.init',
    grund: 'verdrahtet das Overlay; ohne ihn gibt es keinen Klick-Horcher',
    trifft: (attr, rumpf) => /bomayeAbo/.test(rumpf) },
];

/* DARF die Ausnahme nicht tragen: alles, was selbst misst.

   NICHT in dieser Liste steht der gtag-Lader samt Consent-Mode-Vorgaben.
   Der MUSS vor der Einwilligung laufen und traegt die Ausnahme zu Recht:
   genau dort stehen die Vorgaben auf denied und ads_data_redaction auf
   true. Blockiert man ihn, gibt es gar keine Vorgaben mehr, und das ist
   schlechter als keine Blockade. Was danach wirklich gemessen wird,
   entscheidet Consent Mode, nicht dieses Attribut.

   Eine erste Fassung dieser Pruefung hatte googletagmanager.com hier
   stehen und meldete daraufhin 26 Befunde auf 26 Seiten - alle falsch. */
const DARF_NICHT = [
  { name: 'plan-tracking.js', trifft: (attr) => /plan-tracking\.js/.test(attr) },
  { name: 'pixel-events.js',  trifft: (attr) => /pixel-events\.js/.test(attr) },
  { name: 'Meta-Pixel-Lader', trifft: (attr) => /connect\.facebook\.net/.test(attr) },
];

let geprueft = 0, freigegeben = 0;
const dateien = (await readdir(WURZEL)).filter((d) => d.endsWith('.html')).sort();

for (const datei of dateien) {
  const html = await readFile(WURZEL + '/' + datei, 'utf8');
  /* Nur echte Vorkommen der Klasse reveal, nicht ab-reveal und Verwandte. */
  const hatReveal = /class="[^"]*(?:^|\s)reveal(?:\s|")/.test(html)
                 || /class="[^"]*\breveal\b/.test(html) && /\.reveal\b/.test(html);

  for (const m of html.matchAll(SKRIPTE)) {
    const [ganz, attr, rumpf] = m;
    if (/type="text\/plain"/.test(attr)) continue;   /* bewusst stillgelegt */
    geprueft++;
    if (frei(attr)) freigegeben++;

    for (const r of BRAUCHT_FREIGABE) {
      if (!r.trifft(attr, rumpf)) continue;
      if (!frei(attr)) {
        melde(`${datei}: ${r.name} ohne data-cookieconsent="ignore" - `
            + `Cookiebot blockiert es ohne Marketing-Einwilligung. ${r.grund}`);
      }
    }
    for (const r of DARF_NICHT) {
      if (r.trifft(attr, rumpf) && frei(attr)) {
        melde(`${datei}: ${r.name} traegt data-cookieconsent="ignore" - `
            + `Messung gehoert hinter die Einwilligung`);
      }
    }
  }

  /* Eine Seite mit .reveal braucht beides: Beobachter und Wache. Auf der
     Startseite steckt der Beobachter in main.js, dort zaehlt die Wache. */
  if (hatReveal) {
    const bloecke = [...html.matchAll(SKRIPTE)];
    const wache = bloecke.find((m) => /__revealWache\s*=\s*setTimeout/.test(m[2]));
    const beobachter = bloecke.find((m) => /clearTimeout\(window\.__revealWache\)/.test(m[2]));
    const mainJs = /<script[^>]*src="[^"]*main\.js"/.test(html);
    if (!wache) melde(`${datei}: Seite nutzt .reveal, aber die Reveal-Wache fehlt`);
    if (!beobachter && !mainJs)
      melde(`${datei}: Seite nutzt .reveal, aber weder ein Reveal-Block noch main.js ist eingebunden`);
  }
}

console.log(`${dateien.length} Seiten, ${geprueft} Skripte, davon ${freigegeben} einwilligungsfrei geprueft.`);
if (befunde.length) {
  console.log('');
  befunde.forEach((b) => console.log('  • ' + b));
  console.log(`\n═══ ${befunde.length} Befund(e)`);
  process.exit(1);
}
console.log('\n═══ 0 Befunde');

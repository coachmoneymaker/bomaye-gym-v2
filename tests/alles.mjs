/* Startet alle Suiten in diesem Ordner.
 *
 *   npm run test:alles
 *   node tests/alles.mjs
 *   node tests/alles.mjs /pfad/zu/main     alle Suiten gegen einen anderen Baum
 *
 * Es wird NICHT beim ersten Fehler abgebrochen: jede Suite laeuft, und am
 * Ende steht eine Zusammenfassung. Sonst verdeckt die erste scheiternde
 * Suite alle uebrigen, und man braucht mehrere Durchgaenge fuer ein Bild.
 *
 * Rueckgabewert ist 1, sobald irgendeine Suite scheitert.
 */
import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const NICHT_SUITE = new Set(['gemeinsam.mjs', 'alles.mjs']);
const wurzelArg = process.argv[2] ? [process.argv[2]] : [];

const suiten = (await readdir(HIER))
  .filter((d) => d.endsWith('.mjs') && !NICHT_SUITE.has(d))
  .sort();

if (!suiten.length) {
  console.error('Keine Suiten in ' + HIER + ' gefunden.');
  process.exit(2);
}

function laufen(datei) {
  return new Promise((fertig) => {
    const start = Date.now();
    const kind = spawn(process.execPath, [join(HIER, datei), ...wurzelArg],
                       { stdio: ['ignore', 'pipe', 'pipe'] });
    let ausgabe = '';
    kind.stdout.on('data', (d) => { ausgabe += d; process.stdout.write(d); });
    kind.stderr.on('data', (d) => { ausgabe += d; process.stderr.write(d); });
    kind.on('close', (code) => {
      /* Die Schlusszeile jeder Suite lautet "N/M bestanden, F Fehler". */
      const m = /(\d+)\/(\d+) bestanden, (\d+) Fehler/.exec(ausgabe);
      fertig({
        datei,
        code,
        bestanden: m ? Number(m[1]) : null,
        gesamt: m ? Number(m[2]) : null,
        fehler: m ? Number(m[3]) : null,
        sekunden: Math.round((Date.now() - start) / 1000),
      });
    });
  });
}

console.log(`${suiten.length} Suiten: ${suiten.join(', ')}`);
if (wurzelArg.length) console.log(`gegen den Baum ${wurzelArg[0]}`);
console.log('');

const ergebnisse = [];
for (const datei of suiten) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ' + datei);
  console.log('═══════════════════════════════════════════════════════');
  ergebnisse.push(await laufen(datei));
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  ZUSAMMENFASSUNG');
console.log('═══════════════════════════════════════════════════════');
let schlimm = 0;
for (const e of ergebnisse) {
  const zahl = e.gesamt === null
    ? '(keine Schlusszeile gefunden)'
    : `${e.bestanden}/${e.gesamt} bestanden, ${e.fehler} Fehler`;
  const marke = e.code === 0 ? 'OK  ' : 'FEHL';
  if (e.code !== 0) schlimm++;
  console.log(`${marke}  ${e.datei.padEnd(20)} ${zahl.padEnd(34)} ${e.sekunden}s`);
}
const summe = ergebnisse.reduce((n, e) => n + (e.gesamt || 0), 0);
const fehlerSumme = ergebnisse.reduce((n, e) => n + (e.fehler || 0), 0);
console.log(`\n${summe} Pruefungen, ${fehlerSumme} Fehler, `
          + `${schlimm} von ${ergebnisse.length} Suiten gescheitert.`);
process.exit(schlimm ? 1 : 0);

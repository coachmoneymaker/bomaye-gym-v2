/* ═══════════════════════════════════════════════════════════════════════════
   /preise AUS scripts/preise-daten.mjs SCHREIBEN
   ═══════════════════════════════════════════════════════════════════════════
   Schreibt die Preisbloecke zwischen die Marken <!-- PREISE:* --> in
   preise.html. Keine Zahl steht zweimal: das Markup kommt von hier, die
   Zahlen aus preise-daten.mjs.

     node scripts/preise-bauen.mjs            schreibt
     node scripts/preise-bauen.mjs --pruefen  meldet nur, was sich aendern wuerde
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFile, writeFile } from 'node:fs/promises';
import { MITGLIEDSCHAFTEN, PT, WEITERE, BEDINGUNGEN, FRAGEN, AUFNAHME, euro }
  from './preise-daten.mjs';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DATEI = WURZEL + '/preise.html';
const NUR_PRUEFEN = process.argv.includes('--pruefen');
const BASIS = 'https://www.bomayegym.com';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* JSON-LD liest JSON, kein HTML: dort bleibt das kaufmaennische Und stehen,
   das geschuetzte Leerzeichen wird zum gewoehnlichen. */
const text = (s) => String(s).replace(/ /g, ' ');

function ersetze(t, marke, inhalt) {
  const auf = `<!-- PREISE:${marke} -->`;
  const zu = `<!-- /PREISE:${marke} -->`;
  const a = t.indexOf(auf), b = t.indexOf(zu);
  if (a < 0 || b < 0) throw new Error(`Marke ${marke} fehlt in preise.html`);
  return t.slice(0, a + auf.length) + '\n' + inhalt + '\n        ' + t.slice(b);
}

/* ── Mitgliedschaftskarten ─────────────────────────────────────────────── */
function karten() {
  return '        <div class="pr-karten">\n' + MITGLIEDSCHAFTEN.map((m, i) => `          <article class="pr-karte${i === 0 ? ' pr-karte--top' : ''} reveal" id="${m.id}" aria-labelledby="k-${m.id}">
            <div class="pr-karte__kopf">
              <h3 class="pr-karte__name" id="k-${m.id}">${esc(m.name)}</h3>
              <span class="pr-karte__alter">${esc(m.gruppe)}, ${esc(m.alter)}</span>
            </div>
            <p class="pr-karte__preis">
              <span class="pr-karte__monat">${esc(euro(m.monat))}</span>
              <span class="pr-karte__proMonat">im Monat</span>
            </p>
            <p class="pr-karte__woche">
              ${esc(euro(m.woche))} pro Woche,
              <span class="pr-karte__alt">regulär ${esc(euro(m.regulaer))} pro Woche</span>
            </p>
            <p class="pr-karte__zusatz">+ ${esc(euro(AUFNAHME))} einmalig, inkl. Fighter-Kit</p>
            <span class="pr-karte__marke">EARLY BIRD, DAUERHAFT</span>
            <ul>
${m.leistungen.map((l) => `              <li>${esc(l)}</li>`).join('\n')}
            </ul>
            <div class="pr-karte__btnwrap">
              <a href="/mitglied-werden#packages" data-abo-contract="${esc(m.contract)}"
                 class="btn btn--gold" style="text-decoration:none;">EARLY BIRD SICHERN</a>
            </div>
          </article>`).join('\n') + '\n        </div>';
}

/* ── Vertragsbedingungen ───────────────────────────────────────────────── */
function bedingungen() {
  return '        <ul class="pr-bedingungen reveal" aria-label="Vertragsbedingungen">\n'
    + BEDINGUNGEN.map((b) => `          <li>${esc(b)}</li>`).join('\n')
    + '\n        </ul>\n'
    + '        <p class="pr-hinweis" style="color:rgba(245,240,232,0.55);">'
    + 'Alle Preise inklusive Mehrwertsteuer. Die vollständigen Bedingungen stehen in den '
    + '<a href="/agb" style="color:var(--gold);">AGB</a>.</p>';
}

/* ── Personal Training ─────────────────────────────────────────────────── */
function ptTabelle(gruppe, art) {
  return `          <div class="pr-pttabelle pr-pttabelle--${art}">
            <table class="pr-tab" aria-label="Personal Training, Preise für ${esc(gruppe.label)}">
              <thead>
                <tr><th scope="col">Paket</th><th scope="col">Preis</th><th scope="col">pro Einheit</th><th scope="col"><span class="pr-nur-sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">Buchen</span></th></tr>
              </thead>
              <tbody>
${gruppe.zeilen.map((z) => `                <tr>
                  <th scope="row">${esc(z.name)}</th>
                  <td data-spalte="Preis">${esc(euro(z.preis))}</td>
                  <td data-spalte="pro Einheit">${esc(euro(z.proEinheit))}</td>
                  <td class="pr-tab__btn"><a href="/personal-training-boxen-muenchen#pt-booking" class="btn btn--gold btn--sm" style="text-decoration:none;">BUCHEN</a></td>
                </tr>`).join('\n')}
              </tbody>
            </table>
          </div>`;
}
function pt() {
  return `        <div class="pr-ptschalter reveal" role="group" aria-label="Preise für Mitglieder oder Nichtmitglieder">
          <input type="radio" name="pt-wahl" id="pt-wahl-nicht" checked>
          <label for="pt-wahl-nicht">${esc(PT.nicht.label)}</label>
          <input type="radio" name="pt-wahl" id="pt-wahl-mitglied">
          <label for="pt-wahl-mitglied">${esc(PT.mitglied.label)}</label>
          <div class="pr-pttabellen">
${ptTabelle(PT.nicht, 'nicht')}
${ptTabelle(PT.mitglied, 'mitglied')}
          </div>
        </div>
        <p class="pr-hinweis" style="color:rgba(8,8,8,0.6);">
          Mitglieder zahlen automatisch ihren Preis, sobald sie eingeloggt buchen.
          Alles zum Ablauf steht auf
          <a href="/personal-training-boxen-muenchen" style="color:var(--gold-dark);">Personal Training</a>.
        </p>`;
}

/* ── Weitere Optionen ──────────────────────────────────────────────────── */
function weitere() {
  return `        <table class="pr-tab pr-tab--dunkel reveal" aria-label="Einzelne Karten ohne Mitgliedschaft">
          <thead>
            <tr><th scope="col">Angebot</th><th scope="col">Preis</th><th scope="col">Enthalten</th><th scope="col"><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">Buchen</span></th></tr>
          </thead>
          <tbody>
${WEITERE.map((w) => `            <tr>
              <th scope="row">${esc(w.name)}</th>
              <td data-spalte="Preis">${esc(euro(w.preis))}</td>
              <td data-spalte="Enthalten">${esc(w.dazu)}</td>
              <td class="pr-tab__btn"><a href="${esc(w.ziel)}" class="btn btn--outline-gold btn--sm" style="text-decoration:none;">${esc(w.knopf.toUpperCase())}</a></td>
            </tr>`).join('\n')}
          </tbody>
        </table>`;
}

/* ── FAQ ───────────────────────────────────────────────────────────────── */
function faq() {
  return '        <div class="pr-faq reveal">\n' + FRAGEN.map((q) => `          <details>
            <summary>${esc(q.f)}</summary>
            <div class="pr-faq__a">${esc(q.a)}${q.verweis ? ` <a href="${esc(q.verweis.ziel)}">${esc(q.verweis.text)}</a>.` : ''}</div>
          </details>`).join('\n') + '\n        </div>';
}

/* ── Schema ────────────────────────────────────────────────────────────── */
function schema() {
  const krumen = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: BASIS + '/' },
      { '@type': 'ListItem', position: 2, name: 'Preise', item: BASIS + '/preise' },
    ],
  };
  const fragen = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FRAGEN.map((q) => ({
      '@type': 'Question', name: text(q.f),
      acceptedAnswer: { '@type': 'Answer', text: text(q.a) },
    })),
  };
  const j = (o) => '  <script type="application/ld+json">\n  '
    + JSON.stringify(o, null, 2).split('\n').join('\n  ') + '\n  </script>';
  return j(krumen) + '\n' + j(fragen);
}

/* ── Lauf ──────────────────────────────────────────────────────────────── */
let t = await readFile(DATEI, 'utf8');
const vorher = t;
t = ersetze(t, 'SCHEMA', schema());
t = ersetze(t, 'KARTEN', karten());
t = ersetze(t, 'BEDINGUNGEN', bedingungen());
t = ersetze(t, 'PT', pt());
t = ersetze(t, 'WEITERE', weitere());
t = ersetze(t, 'FAQ', faq());

if (t === vorher) {
  console.log('preise.html ist auf dem Stand von preise-daten.mjs.');
} else if (NUR_PRUEFEN) {
  console.log('preise.html WUERDE sich aendern - "node scripts/preise-bauen.mjs" laufen lassen.');
  process.exitCode = 1;
} else {
  await writeFile(DATEI, t);
  console.log(`preise.html geschrieben: ${MITGLIEDSCHAFTEN.length} Karten, `
    + `${PT.nicht.zeilen.length + PT.mitglied.zeilen.length} PT-Zeilen, `
    + `${WEITERE.length} weitere Angebote, ${FRAGEN.length} Fragen.`);
}

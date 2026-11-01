/* ═══════════════════════════════════════════════════════════════════════════
   /preise AUS scripts/preise-daten.mjs SCHREIBEN
   ═══════════════════════════════════════════════════════════════════════════
   Schreibt die Preisbloecke zwischen die Marken <!-- PREISE:* --> in
   preise.html. Keine Zahl steht zweimal: das Markup kommt von hier, die
   Zahlen aus preise-daten.mjs.

     node scripts/preise-bauen.mjs            schreibt
     node scripts/preise-bauen.mjs --pruefen  meldet nur, was sich aendern wuerde

   GESTALTUNG, STAND 01.11.2026
   Die Karten tragen dieselben Klassen wie der Preisblock der Startseite
   (.mw-cards-inner, .mw-card, .mw-card-label, .mw-card-name, .mw-card-age,
   .mw-card-divider, .mw-card-reg-price, .mw-card-price-row, .mw-card-price,
   .mw-card-fee, .mw-card-features, .mw-card-btn). Damit ist /preise kein
   zweites Gestaltungssystem, sondern dieselbe Komponente mit den Zahlen
   dieser Seite. Was /preise zusaetzlich braucht, traegt das Vorzeichen pr-.

   WAS HIER BEWUSST ANDERS IST ALS AUF DER STARTSEITE
   Die Startseite zeigt den WOCHENPREIS gross, /preise den MONATSBETRAG,
   weil das der Betrag ist, der abgebucht wird. Der Wochenpreis steht klein
   darunter. Beide Zahlen kommen aus derselben Quelle.

   DER VERTRAGSTEXT STEHT EINMAL
   Vorher trug jede der drei Karten denselben langen Absatz. Jetzt steht er
   einmal unter den Karten (BEDINGUNGEN), und jede Karte traegt nur noch die
   kurze Zeile "bei 12 Monaten Laufzeit" samt Verweis dorthin. Kein Wort ist
   weggefallen: die drei Saetze aus LAUFZEIT stehen als Punkte 2 bis 4 in
   BEDINGUNGEN, wortgleich.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFile, writeFile } from 'node:fs/promises';
import { MITGLIEDSCHAFTEN, PT, WEITERE, BEDINGUNGEN, FRAGEN, AUFNAHME, LAUFZEIT, euro }
  from './preise-daten.mjs';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DATEI = WURZEL + '/preise.html';
const NUR_PRUEFEN = process.argv.includes('--pruefen');
const BASIS = 'https://www.bomayegym.com';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* JSON-LD liest JSON, kein HTML: dort bleibt das kaufmaennische Und stehen,
   das geschuetzte Leerzeichen wird zum gewoehnlichen. */
/* \u00A0 als Escape, nicht als Zeichen: beim Neuschreiben dieser Datei am
   01.11.2026 wurde das geschuetzte Leerzeichen still zu einem gewoehnlichen,
   und der Helfer ersetzte Leerzeichen durch Leerzeichen. Im Schema stand
   danach "100\u00A0\u20AC" statt "100 \u20AC". */
const text = (s) => String(s).replace(/\u00A0/g, ' ');

/* "Fighter-Kit" brach auf schmalen Karten am Trennstrich um. U+2011 ist ein
   Bindestrich, der nicht umbricht; er sieht aus wie der gewoehnliche. */
const FIGHTER_KIT = 'Fighter‑Kit';

/* Welche Karte welche Zusatzklasse bekommt. Die Reihenfolge im Raster
   steuert CSS (order), nicht die Reihenfolge im Markup: auf dem Rechner
   Kids, Unlimited, Youth, auf dem Handy Unlimited, Youth, Kids. */
const KLASSE = { erwachsene: 'mw-card--popular', youth: 'mw-card--youth', kids: 'mw-card--kids' };

function ersetze(t, marke, inhalt) {
  const auf = `<!-- PREISE:${marke} -->`;
  const zu = `<!-- /PREISE:${marke} -->`;
  const a = t.indexOf(auf), b = t.indexOf(zu);
  if (a < 0 || b < 0) throw new Error(`Marke ${marke} fehlt in preise.html`);
  return t.slice(0, a + auf.length) + '\n' + inhalt + '\n        ' + t.slice(b);
}

/* ── Mitgliedschaftskarten ─────────────────────────────────────────────── */
function karten() {
  return '        <div class="mw-cards-inner">\n' + MITGLIEDSCHAFTEN.map((m) => {
    const beliebt = m.id === 'erwachsene';
    return `          <article class="mw-card ${KLASSE[m.id]} reveal" id="${m.id}" aria-labelledby="k-${m.id}">
${beliebt ? '            <span class="mw-popular-badge" aria-label="Beliebtestes Paket">Most Popular</span>\n' : ''}            <p class="mw-card-label">${esc(m.gruppe.toUpperCase())}</p>
            <h3 class="mw-card-name" id="k-${m.id}">${esc(m.name.toUpperCase())}</h3>
            <p class="mw-card-age">${esc(m.alter)}</p>
            <hr class="mw-card-divider" />
            <p class="mw-card-reg-price">Regulär ${esc(euro(m.regulaer))} pro Woche</p>
            <div class="mw-card-price-row">
              <span class="mw-card-price">${esc(euro(m.monat))}</span>
              <span class="mw-card-price-unit">im Monat</span>
            </div>
            <p class="pr-karte__laufzeit">${esc(LAUFZEIT.kurz)}<a class="pr-karte__vertraglink" href="#vertrag">Vertragsbedingungen</a></p>
            <p class="pr-karte__woche">${esc(euro(m.woche))} pro Woche</p>
            <p class="mw-card-fee">+ ${esc(euro(AUFNAHME))} einmalig, inkl. ${FIGHTER_KIT}</p>
            <span class="mw-card-savings">EARLY BIRD, FÜR DIE LAUFZEIT</span>
            <ul class="mw-card-features">
${m.leistungen.map((l) => `              <li>${esc(l)}</li>`).join('\n')}
            </ul>
            <a href="/mitglied-werden#packages" data-abo-contract="${esc(m.contract)}"
               class="mw-card-btn">EARLY BIRD SICHERN</a>
          </article>`;
  }).join('\n') + '\n        </div>';
}

/* ── Vertragsbedingungen, einmal unter den Karten ──────────────────────── */
function bedingungen() {
  return '        <div class="pr-vertrag reveal" id="vertrag">\n'
    + '          <h3 class="pr-vertrag__h3">So läuft dein Vertrag</h3>\n'
    + '          <ul class="pr-vertrag__liste">\n'
    + BEDINGUNGEN.map((b) => `            <li>${esc(b)}</li>`).join('\n')
    + '\n          </ul>\n'
    + '          <p class="pr-vertrag__fuss">'
    + 'Alle Preise inklusive Mehrwertsteuer. Die vollständigen Bedingungen stehen in den '
    + '<a href="/agb">AGB</a>.</p>\n'
    + '        </div>';
}

/* ── Personal Training ─────────────────────────────────────────────────── */
function ptTabelle(gruppe, art) {
  return `          <div class="pr-pttabelle pr-pttabelle--${art}">
            <table class="pr-tab" aria-label="Personal Training, Preise für ${esc(gruppe.label)}">
              <thead>
                <tr><th scope="col">Paket</th><th scope="col">Preis</th><th scope="col">pro Einheit</th><th scope="col"><span class="pr-nur-sr">Buchen</span></th></tr>
              </thead>
              <tbody>
${gruppe.zeilen.map((z) => `                <tr>
                  <th scope="row">${esc(z.name)}</th>
                  <td class="pr-tab__preis" data-spalte="Preis">${esc(euro(z.preis))}</td>
                  <td data-spalte="pro Einheit">${esc(euro(z.proEinheit))}</td>
                  <td class="pr-tab__btn"><a href="/personal-training-boxen-muenchen#pt-booking" class="pr-zeilenknopf">PERSONAL TRAINING BUCHEN</a></td>
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
        <p class="pr-hinweis pr-hinweis--dunkel">
          Mitglieder zahlen automatisch ihren Preis, sobald sie eingeloggt buchen.
          Alles zum Ablauf steht auf
          <a href="/personal-training-boxen-muenchen">Personal Training</a>.
        </p>`;
}

/* ── Weitere Optionen: schlanke Zeilen, Preis rechts in Gold ───────────── */
function weitere() {
  return '        <ul class="pr-optionen reveal" aria-label="Einzelne Karten ohne Mitgliedschaft">\n'
    + WEITERE.map((w) => `          <li class="pr-option">
            <div class="pr-option__text">
              <h3 class="pr-option__name">${esc(w.name)}</h3>
              <p class="pr-option__dazu">${esc(w.dazu)}</p>
            </div>
            <p class="pr-option__preis">${esc(euro(w.preis))}</p>
            <a href="${esc(w.ziel)}" class="pr-zeilenknopf pr-zeilenknopf--hell">${esc(w.knopf.toUpperCase())}</a>
          </li>`).join('\n')
    + '\n        </ul>';
}

/* ── FAQ ───────────────────────────────────────────────────────────────────
   Aufklappen mit <details>, nicht mit einem Knopf und JavaScript wie auf der
   Startseite: ohne JavaScript bliebe dort jede Antwort zu. Das Aussehen ist
   dasselbe, die Mechanik die robustere.                                   */
function faq() {
  return '        <div class="pr-faq faq-list faq-list--light reveal">\n' + FRAGEN.map((q) => `          <details class="faq-item">
            <summary class="faq-q faq-q--light">${esc(q.f)}<i class="icon faq-icon" aria-hidden="true"><svg><use href="#i-plus"/></svg></i></summary>
            <div class="faq-a-inner">${esc(q.a)}${q.verweis ? ` <a href="${esc(q.verweis.ziel)}">${esc(q.verweis.text)}</a>.` : ''}</div>
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

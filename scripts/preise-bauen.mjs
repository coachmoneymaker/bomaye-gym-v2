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
import { createHash } from 'node:crypto';
import { MITGLIEDSCHAFTEN, PT, WEITERE, BEDINGUNGEN, FRAGEN, AUFNAHME, LAUFZEIT, euro,
         FLEX_ZIEL, FLEX_ZIEL_ABS,
         FLEX_AKTIV, FLEX, FLEX_BEDINGUNGEN, FLEX_FRAGE, ersparnis,
         ADS_CHECKOUT_SEND_TO }
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

/* ── Messattribute ─────────────────────────────────────────────────────────
   plan-tracking.js liest diese Attribute und tippt keine Zahl selbst. Was
   hier nicht steht, wird nicht gemeldet.

     data-item-category  membership_earlybird | membership_flex
                         | personal_training | pass
     data-item-name      Produktname
     data-price          laufender Preis (Monat bzw. Einmalpreis)
     data-first-payment  erste Abbuchung inkl. Aufnahmegebuehr, nur Abos
     data-plan           unlimited | youth | kids
     data-offer          earlybird | flex
     data-item-id        Kennung, wenn kein data-abo-contract da ist     */
/* Welches GA4-Ereignis ein Knopf ausloest.

   begin_checkout gehoert nur Knoepfen, die wirklich einen bsport-Checkout
   oeffnen: die mit data-abo-contract, und solche, deren Ziel auf eine
   bsport-Kaufadresse zeigt. Die PT- und Pass-Knoepfe fuehren heute auf
   /personal-training-boxen-muenchen und /stundenplan, also auf Seiten mit
   einem Kalender. Sie als Checkout zu zaehlen mischte Navigationen unter
   Kaufabsichten; sie melden deshalb select_item.

   Bekommt einer dieser Knoepfe spaeter eine echte Kaufadresse, schaltet
   diese Funktion ihn von selbst auf begin_checkout um.                  */
function gaEreignis({ contract, ziel }) {
  if (contract) return 'begin_checkout';
  if (ziel && /bsport\.io|\/checkout\/|\/subscription\//.test(ziel)) return 'begin_checkout';
  return 'select_item';
}

const PLAN_SCHLUESSEL = { erwachsene: 'unlimited', youth: 'youth', kids: 'kids',
                          'unlimited-flex': 'unlimited', 'youth-flex': 'youth',
                          'kids-flex': 'kids' };
function messen(o) {
  return Object.keys(o)
    .filter((k) => o[k] !== null && o[k] !== undefined && o[k] !== '')
    .map((k) => `${k}="${esc(o[k])}"`).join(' ');
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
            <p class="mw-card-fee">abgerechnet als ${esc(euro(m.monat))} monatlich, ${LAUFZEIT.monate} Monate Laufzeit, einmalig ${esc(euro(AUFNAHME))} Aufnahmegebühr (inklusive ${FIGHTER_KIT})</p>
            <span class="mw-card-savings">EARLY BIRD</span>
            <ul class="mw-card-features">
${m.leistungen.map((l) => `              <li>${esc(l)}</li>`).join('\n')}
            </ul>
            <a href="/mitglied-werden#packages" data-abo-contract="${esc(m.contract)}"
               ${messen({ 'data-ga-event': gaEreignis({ contract: m.contract }),
                          'data-item-category': 'membership_earlybird',
                          'data-item-name': m.name,
                          'data-price': m.monat.toFixed(2),
                          'data-first-payment': (m.monat + AUFNAHME).toFixed(2),
                          'data-plan': PLAN_SCHLUESSEL[m.id],
                          'data-offer': 'earlybird' })}
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
    + (FLEX_AKTIV
        ? '          <h4 class="pr-vertrag__h4">Flex</h4>\n'
          + '          <ul class="pr-vertrag__liste">\n'
          + FLEX_BEDINGUNGEN.map((b) => `            <li>${esc(b)}</li>`).join('\n')
          + '\n          </ul>\n'
        : '')
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
                  <td class="pr-tab__btn"><a href="/personal-training-boxen-muenchen#pt-booking" ${messen({ 'data-ga-event': gaEreignis({ ziel: '/personal-training-boxen-muenchen#pt-booking' }), 'data-item-category': 'personal_training', 'data-item-id': `pt-${art}-${z.id}`, 'data-item-name': `Personal Training ${z.name} (${gruppe.label})`, 'data-price': z.preis.toFixed(2) })} class="pr-zeilenknopf">PERSONAL TRAINING BUCHEN</a></td>
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
            <a href="${esc(w.ziel)}" ${messen({ 'data-ga-event': gaEreignis({ ziel: w.ziel }), 'data-item-category': 'pass',
                 'data-item-id': w.id, 'data-item-name': w.bsport,
                 'data-price': w.preis.toFixed(2) })} class="pr-zeilenknopf pr-zeilenknopf--hell">${esc(w.knopf.toUpperCase())}</a>
          </li>`).join('\n')
    + '\n        </ul>';
}

/* Die Fragenliste, einmal fuer sichtbares HTML und Schema. Mit Flex kommt
   genau eine Frage dazu, und zwar am Ende. */
function fragenAlle() {
  return FLEX_AKTIV ? FRAGEN.concat([{ f: FLEX_FRAGE.f, a: FLEX_FRAGE.a }]) : FRAGEN;
}

/* ── FAQ ───────────────────────────────────────────────────────────────────
   Aufklappen mit <details>, nicht mit einem Knopf und JavaScript wie auf der
   Startseite: ohne JavaScript bliebe dort jede Antwort zu. Das Aussehen ist
   dasselbe, die Mechanik die robustere.

   ACHTUNG BEIM AENDERN DES AUSSEHENS
   Ein <summary> traegt KEIN aria-expanded; der Browser fuehrt den Zustand
   ueber das Attribut open am <details>. Jede Regel in style.css, die am
   aufgeklappten Zustand haengt, braucht deshalb beide Selektoren:

     .faq-q--light[aria-expanded="true"]   fuer die Knopf-Variante
     .faq-item[open] .faq-q--light         fuer dieses Markup hier

   Genau das fehlte bis zum 03.11. bei der Deckkraft der Antwort: die
   Antwort klappte auf, war 71px hoch und blieb bei opacity 0 unsichtbar.
   Der dritte Teil von reichweite-pruefen.mjs klappt seitdem jede Antwort
   jeder Seite im Browser auf und misst nach; er laeuft in
   "npm run pruefen:alles" mit.                                           */
function faq() {
  return '        <div class="pr-faq faq-list faq-list--light reveal">\n' + fragenAlle().map((q) => `          <details class="faq-item">
            <summary class="faq-q faq-q--light">${esc(q.f)}<i class="icon faq-icon" aria-hidden="true"><svg><use href="#i-plus"/></svg></i></summary>
            <div class="faq-a-inner">${esc(q.a)}${q.verweis ? ` <a href="${esc(q.verweis.ziel)}">${esc(q.verweis.text)}</a>.` : ''}</div>
          </details>`).join('\n') + '\n        </div>';
}

/* ── Bomaye Flex ───────────────────────────────────────────────────────────
   NACHRANGIG, mit Absicht. Early Bird behaelt die drei schwarzen Karten mit
   goldenem Knopf; Flex steht darunter als schmale Zeilen mit Umrissknopf,
   damit beide Wege nicht um denselben Blick streiten.

   WIEDERVERWENDET, NICHTS NEU ERFUNDEN
   Die Zeilen tragen .pr-option, .pr-option__name, .pr-option__preis und
   .pr-zeilenknopf - dieselben Klassen wie die Einzelangebote weiter unten
   auf derselben Seite. Dazu kommen genau zwei Zeilen, die es dort nicht
   gibt: die Aufnahmegebuehr und die gerechnete Ersparnis.

   DER KNOPF ARBEITET WIE DIE EARLY-BIRD-KNOEPFE
   data-abo-contract traegt die Vertragskennung, abo-embed.js faengt den
   Klick ab und oeffnet das Overlay auf unserer Domain. Das href ist der
   Weg ohne JavaScript und zeigt auf den Flex-Block DIESER Seite.

   ZWISCHENSTAND PR #178, JETZT ERLEDIGT
   Dort trug der Knopf data-abo-direkt und fuehrte unmittelbar auf
   backoffice.bsport.io, weil die drei Flex-Vertraege im Widget auf "fuer
   Kunden unsichtbar" standen: 59649 meldete "Vertrag nicht gefunden",
   59651 zeigte die Early-Bird-Liste. Der Eigentuemer hat den Schalter im
   Backoffice umgelegt, seitdem stehen sie im Widget neben Early Bird.
   Damit gilt wieder: die Adresszeile verlaesst bomayegym.com nie.      */
function flex() {
  if (!FLEX_AKTIV) return '';
  return `        <!-- PREISE:FLEX -->
        <style>
        /* Kommt und geht mit dem Block. Steht der Schalter auf false, ist
           auch diese Regel weg und preise.html byte-gleich mit dem Stand
           ohne Flex. Deshalb hier und nicht im Seitenkopf.

           Jede Regel hat ".seo-section" vorangestellt: die Vorlage traegt
           ".seo-section p" (0,1,1), eine einzelne Klasse (0,1,0) verliert
           dagegen und die Textfarben kippten. */
        .seo-section .pr-flex {
          max-width: 1100px;
          margin: clamp(36px, 5vw, 60px) auto 0;
          padding-top: clamp(28px, 4vw, 44px);
          border-top: 1px solid rgba(8,8,8,0.12);
        }
        /* Dasselbe Mass wie ".seo-section h2" der Vorlage. Vorher stand hier
           clamp(1.9rem, 5vw, 2.6rem); gemessen war die Flex-Ueberschrift
           dadurch bei 390px mit 30,4px GROESSER als die Early-Bird-
           Ueberschrift mit 25,6px, und das kehrt die Rangfolge um. */
        .seo-section .pr-flex__h2 {
          font-family: var(--font-display);
          font-size: clamp(1.6rem, 4vw, 2.6rem);
          letter-spacing: 0.02em;
          line-height: 1.1;
          text-transform: uppercase;
          color: var(--ink);
          margin: 1rem 0 0;
        }
        .seo-section .pr-flex__sub {
          font-family: var(--font-body);
          font-size: 0.92rem;
          line-height: 1.75;
          color: var(--grau-auf-hell);
          margin: 10px 0 0;
          max-width: 640px;
        }
        .seo-section .pr-flex__liste { margin-top: 22px; }
        /* Zwischenueberschrift im Vertragsblock. Steht dort nur, solange
           Flex laeuft, deshalb auch die Regel nur hier. */
        .seo-section .pr-vertrag__h4 {
          font-family: var(--font-head);
          font-size: 0.74rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold-auf-hell);
          margin: 22px 0 10px;
        }
        /* Early Bird bleibt der lautere Weg: die Flex-Zeile traegt einen
           kleineren Betrag als die Kartenpreise (1,6rem gegen 2,6rem). */
        .seo-section .pr-flex .pr-option__preis {
          font-size: 1.6rem;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.05;
          white-space: nowrap;
        }
        .seo-section .pr-flex .pr-option__promonat {
          font-family: var(--font-body);
          font-size: 0.74rem;
          letter-spacing: 0.02em;
          color: var(--grau-auf-hell);
          margin-top: 2px;
          white-space: nowrap;
        }
        .seo-section .pr-flex .pr-option__zusatz {
          font-family: var(--font-body);
          font-size: 0.82rem;
          line-height: 1.6;
          color: var(--grau-auf-hell);
          margin: 4px 0 0;
          white-space: nowrap;
        }
        .seo-section .pr-flex .pr-option__spar {
          font-family: var(--font-body);
          font-size: 0.82rem;
          line-height: 1.6;
          color: var(--gold-auf-hell);
          margin: 2px 0 0;
        }
        /* 48px Tiefe statt der 44px der uebrigen Zeilenknoepfe. */
        .seo-section .pr-flex .pr-zeilenknopf { min-height: 48px; }
        @media (max-width: 379px) {
          .seo-section .pr-flex .pr-option__zusatz { white-space: normal; }
        }
        </style>
        <div class="pr-flex reveal" id="flex">
          <span class="tag tag--light-inv">FLEXIBEL</span>
          <h2 class="pr-flex__h2" id="flex-h2">LIEBER OHNE <span class="gold-dark">BINDUNG?</span></h2>
          <p class="pr-flex__sub">Monatlich kündbar. Keine Mindestlaufzeit.</p>
          <ul class="pr-optionen pr-flex__liste" aria-labelledby="flex-h2">
${FLEX.map((f) => `            <li class="pr-option">
              <div class="pr-option__text">
                <h3 class="pr-option__name">${esc(f.name)}</h3>
                <p class="pr-option__zusatz">+ ${esc(euro(AUFNAHME))} einmalig, inkl. ${FIGHTER_KIT}</p>
                <p class="pr-option__spar">Early Bird spart dir ${esc(euro(ersparnis(f)))} im Jahr</p>
              </div>
              <p class="pr-option__preis">${esc(euro(f.monat))}<span class="pr-option__promonat">im Monat</span></p>
              <a href="${esc(FLEX_ZIEL)}" data-abo-contract="${esc(f.contract)}"
                 ${messen({ 'data-ga-event': gaEreignis({ contract: f.contract }),
                            'data-item-category': 'membership_flex',
                            'data-item-name': f.name,
                            'data-price': f.monat.toFixed(2),
                            'data-first-payment': (f.monat + AUFNAHME).toFixed(2),
                            'data-plan': PLAN_SCHLUESSEL[f.id],
                            'data-offer': 'flex' })}
                 class="pr-zeilenknopf pr-zeilenknopf--hell">FLEX STARTEN</a>
            </li>`).join('\n')}
          </ul>
        </div>
        <!-- /PREISE:FLEX -->
`;
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
    mainEntity: fragenAlle().map((q) => ({
      '@type': 'Question', name: text(q.f),
      acceptedAnswer: { '@type': 'Answer', text: text(q.a) },
    })),
  };
  /* Die Flex-Angebote kommen als eigener Block dazu, damit die beiden
     bestehenden Bloecke byte-gleich bleiben, solange der Schalter aus ist. */
  const angebote = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: 'Bomaye Flex',
    itemListElement: FLEX.map((f, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: {
        '@type': 'Offer', name: text(f.name),
        price: f.monat.toFixed(2), priceCurrency: 'EUR', url: FLEX_ZIEL_ABS,
      },
    })),
  };
  const j = (o) => '  <script type="application/ld+json">\n  '
    + JSON.stringify(o, null, 2).split('\n').join('\n  ') + '\n  </script>';
  return j(krumen) + '\n' + j(fragen) + (FLEX_AKTIV ? '\n' + j(angebote) : '');
}

/* ── Flex ein- und ausbauen ────────────────────────────────────────────────
   Flex arbeitet NICHT mit einer festen Marke in der Datei, anders als die
   uebrigen Bloecke. Grund: eine Marke waere auch dann vorhanden, wenn der
   Schalter aus ist, und preise.html waere nicht mehr byte-gleich mit dem
   Stand ohne Flex. Stattdessen wird der ganze Block samt seiner Marken
   eingesetzt oder restlos entfernt. Schalter aus heisst: keine Spur.     */
function flexEinbauen(t, block, vorMarke) {
  const auf = '        <!-- PREISE:FLEX -->';
  const zu = '        <!-- /PREISE:FLEX -->\n';
  const a = t.indexOf(auf);
  if (a >= 0) {
    const b = t.indexOf(zu, a);
    if (b < 0) throw new Error('PREISE:FLEX ist geoeffnet, aber nicht geschlossen');
    t = t.slice(0, a) + t.slice(b + zu.length);
  }
  if (!block) return t;
  const i = t.indexOf(vorMarke);
  if (i < 0) throw new Error(`Einfuegepunkt fehlt: ${vorMarke}`);
  return t.slice(0, i) + block + t.slice(i);
}

/* ── Preistabelle der Startseite ───────────────────────────────────────────
   #view-mehr-preise ist von Hand gepflegt. Die drei Flex-Zeilen kommen aus
   derselben Quelle wie alles andere, damit kein Betrag zweimal getippt
   wird. Gleiche Technik wie oben: eingesetzt oder restlos entfernt.      */
function startseiteFlex() {
  if (!FLEX_AKTIV) return '';
  return '            <!-- PREISE:FLEX -->\n'
    + FLEX.map((f) => `            <tr>
              <td><strong>${esc(f.name)}</strong></td>
              <td><span class="price-em">${esc(euro(f.monat))}</span> / Monat</td>
              <td>Monatlich kündbar</td>
              <td>${esc(f.name.replace(/ Flex$/, ''))} ohne Mindestlaufzeit</td>
              <td>Auf Anfrage</td>
            </tr>`).join('\n')
    + '\n            <!-- /PREISE:FLEX -->\n';
}
function startseiteEinbauen(t) {
  const auf = '            <!-- PREISE:FLEX -->';
  const zu = '            <!-- /PREISE:FLEX -->\n';
  const a = t.indexOf(auf);
  if (a >= 0) {
    const b = t.indexOf(zu, a);
    if (b < 0) throw new Error('PREISE:FLEX in index.html ist nicht geschlossen');
    t = t.slice(0, a) + t.slice(b + zu.length);
  }
  const block = startseiteFlex();
  if (!block) return t;
  /* Vor die Zeile "Day Pass", damit Flex oben in der Tabelle steht. */
  const anker = '            <tr>\n              <td><strong>Day Pass</strong></td>';
  const i = t.indexOf(anker);
  if (i < 0) throw new Error('Zeile "Day Pass" in index.html nicht gefunden');
  return t.slice(0, i) + block + t.slice(i);
}

/* ── Messattribute auf den Paketknoepfen anderer Seiten ───────────────────
   Die drei Knoepfe auf index.html und mitglied-werden.html stehen von Hand
   im HTML. Statt die Zahlen dort zu tippen, setzt dieses Skript die
   Messattribute anhand der Vertragskennung aus derselben Quelle. Der Lauf
   ist wiederholbar: vorhandene Attribute werden ersetzt, nicht gestapelt. */
function knoepfeMessbar(t) {
  for (const m of MITGLIEDSCHAFTEN) {
    const attr = messen({ 'data-ga-event': gaEreignis({ contract: m.contract }),
                          'data-item-category': 'membership_earlybird',
                          'data-item-name': m.name,
                          'data-price': m.monat.toFixed(2),
                          'data-first-payment': (m.monat + AUFNAHME).toFixed(2),
                          'data-plan': PLAN_SCHLUESSEL[m.id],
                          'data-offer': 'earlybird' });
    const muster = new RegExp(
      `(data-abo-contract="${m.contract}")((?:\\s+data-[a-z-]+="[^"]*")*)(\\s*\\n(\\s*))`, 'g');
    t = t.replace(muster, (_, kennung, __, ___, einzug) =>
      `${kennung}\n${einzug}${attr}\n${einzug}`);
  }
  return t;
}

/* ── Ads-Kennung an den Skript-Tag ────────────────────────────────────────
   plan-tracking.js liest sie von seinem eigenen <script>-Tag. Damit steht
   die Kennung an genau einer Stelle im Repo, naemlich in
   ADS_CHECKOUT_SEND_TO, und nicht in JavaScript. Leer heisst: das Attribut
   faellt ganz weg und das Skript ruft kein gtag.                        */
function adsKennung(t) {
  const attr = ADS_CHECKOUT_SEND_TO ? ` data-ads-send-to="${esc(ADS_CHECKOUT_SEND_TO)}"` : '';
  return t.replace(
    /(<script src="\/assets\/js\/plan-tracking\.js")(?: data-ads-send-to="[^"]*")?( defer><\/script>)/g,
    `$1${attr}$2`);
}

/* ── Die Buchung darf nie an der Einwilligung haengen ────────────────────
   Cookiebots automatische Blockade stellt jedes Skript, das sie fuer
   Marketing haelt, bis zur Einwilligung auf type="text/plain". Das traf
   auch abo-embed.js und den Inline-Aufruf von bomayeAbo.init: ohne
   Einwilligung gab es dann gar keinen Klick-Horcher, und ein Klick auf
   einen Paket-Knopf landete auf dem href statt im Overlay.

   data-cookieconsent="ignore" nimmt beide von der Blockade aus. Das ist
   zulaessig und keine Umgehung: abo-embed.js laedt NICHTS von bsport.io,
   setzt keinen Keks und schreibt in keinen Speicher. Es oeffnet ein
   Overlay auf unserer Seite und schickt eine postMessage. Alles, was
   wirklich von bsport kommt, haengt weiterhin an bsport-gate.js und am
   Einwilligungshinweis.

   Dasselbe Vorgehen wie bei bsport-gate.js selbst, das aus genau diesem
   Grund schon immer data-cookieconsent="ignore" traegt: die Sperre darf
   nie blockiert werden, und das Fenster, das sie anzeigt, auch nicht.

   Idempotent: schon vorhandene Attribute bleiben, es entsteht kein
   zweites. preise-pruefen.mjs prueft es fuer JEDE Seite nach. */
function einwilligungFrei(t) {
  /* 1. Die Datei selbst. */
  t = t.replace(
    /<script src="(\/assets\/js\/abo-embed\.js(?:\?v=[0-9a-f]{8})?)"(?! [^>]*data-cookieconsent=)/g,
    '<script src="$1" data-cookieconsent="ignore"');
  /* 2. Der Inline-Aufruf. Gesucht wird der oeffnende Tag des Blocks, der
     bomayeAbo nennt - ohne alles davor mitzunehmen, deshalb der
     Negativ-Blick auf ein zwischenzeitliches </script>. */
  t = t.replace(
    /<script(?![^>]*data-cookieconsent=)([^>]*)>((?:(?!<\/script>)[\s\S])*?bomayeAbo(?:(?!<\/script>)[\s\S])*?)<\/script>/g,
    '<script data-cookieconsent="ignore"$1>$2</script>');
  return t;
}

/* ── Versionskennung an abo-embed.js ─────────────────────────────────────
   Die Datei wird mit "Cache-Control: public, max-age=600,
   stale-while-revalidate=86400" ausgeliefert. Ein Browser darf sie damit
   bis zu einen Tag lang in der alten Fassung weiterbenutzen - beobachtet
   nach der Ruecknahme von PR #175, wo das alte Skript noch lief, obwohl
   auf dem Server das neue lag.

   Deshalb haengt an jedem Verweis eine Kennung aus dem INHALT der Datei.
   Aendert sich die Datei, aendert sich die Adresse, und der Browser muss
   neu laden. Aendert sie sich nicht, bleibt die Adresse gleich und der
   Zwischenspeicher taugt weiter.

   Acht Zeichen aus sha256 genuegen: es geht um das Erkennen einer
   Aenderung, nicht um Faelschungssicherheit. preise-pruefen.mjs rechnet
   sie nach. */
const ABO_DATEI = WURZEL + '/assets/js/abo-embed.js';
const ABO_VERSION = createHash('sha256')
  .update(await readFile(ABO_DATEI))
  .digest('hex')
  .slice(0, 8);

function aboVersion(t) {
  return t.replace(
    /(<script src="\/assets\/js\/abo-embed\.js)(\?v=[0-9a-f]{8})?(")/g,
    `$1?v=${ABO_VERSION}$3`);
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
t = flexEinbauen(t, flex(), '        <!-- PREISE:BEDINGUNGEN -->');
t = adsKennung(t);
t = einwilligungFrei(t);
t = aboVersion(t);

/* Die Startseite wird nur angefasst, wenn sich dort wirklich etwas
   aendert. Mit ausgeschaltetem Flex ist das nie der Fall. */
const STARTSEITE = WURZEL + '/index.html';
let h = await readFile(STARTSEITE, 'utf8');
const hVorher = h;
h = startseiteEinbauen(h);
h = knoepfeMessbar(h);
h = adsKennung(h);
h = einwilligungFrei(h);
h = aboVersion(h);
if (h !== hVorher) {
  if (NUR_PRUEFEN) {
    console.log('index.html WUERDE sich aendern - "node scripts/preise-bauen.mjs" laufen lassen.');
    process.exitCode = 1;
  } else {
    await writeFile(STARTSEITE, h);
    console.log(`index.html: ${FLEX_AKTIV ? FLEX.length + ' Flex-Zeilen geschrieben' : 'Flex-Zeilen entfernt'}.`);
  }
}

/* /mitglied-werden traegt dieselben drei Knoepfe. */
const MITGLIED = WURZEL + '/mitglied-werden.html';
let mw = await readFile(MITGLIED, 'utf8');
const mwVorher = mw;
mw = knoepfeMessbar(mw);
mw = adsKennung(mw);
mw = einwilligungFrei(mw);
mw = aboVersion(mw);
if (mw !== mwVorher) {
  if (NUR_PRUEFEN) {
    console.log('mitglied-werden.html WUERDE sich aendern - "node scripts/preise-bauen.mjs" laufen lassen.');
    process.exitCode = 1;
  } else {
    await writeFile(MITGLIED, mw);
    console.log('mitglied-werden.html: Messattribute auf den Paketknoepfen gesetzt.');
  }
}

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

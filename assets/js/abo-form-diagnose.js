/**
 * ?ptdom=1 - WIE SIEHT DAS REGISTRIERUNGSFORMULAR WIRKLICH AUS?
 * ────────────────────────────────────────────────────────────
 *
 * WOZU
 * Das Formular im Abo-Overlay traegt noch Bsports Voreinstellung: helle
 * Karte, Roboto, Material-Felder, runder Bildplatzhalter. Es soll dunkel
 * werden, in Creme und Gold. Bevor dafuer eine einzige Regel geschrieben
 * wird, muss das echte Markup auf dem Tisch liegen.
 *
 * DIE LEHRE AUS PR #133
 * In probetraining-page.css standen rund fuenfzig Zeilen auf
 * #pt-cal-view .MuiButton-*, .MuiCard-root und .MuiPaper-root. Sie haben
 * NICHTS getroffen: MUI haengt laufende Nummern an (MuiPaper-root-889,
 * nicht MuiPaper-root). Die Regeln wurden ersatzlos entfernt. Genau das
 * soll sich nicht wiederholen, und darum misst dieser Bericht zuerst.
 *
 * Deshalb nennt er zu jedem Element ZWEI Dinge: die Klasse, wie sie
 * wirklich dasteht - mit Nummern -, und daneben einen Vorschlag fuer
 * einen Haken, der die Nummern nicht braucht. Dazu, wie viele Elemente
 * dieser Haken trifft. Nur was genau eines trifft, ist als Haken fuer
 * eine einzelne Stelle brauchbar.
 *
 * BEDIENUNG
 * /mitglied-werden?ptdom=1 aufrufen, Cookies annehmen, einen Tarif
 * antippen, warten bis das Formular steht, dann DIAGNOSE und KOPIEREN.
 * Nach jedem weiteren Schritt noch einmal - jeder Bericht nennt oben,
 * welcher Schritt gerade zu sehen ist.
 *
 * NICHTS WIRD ABGESCHICKT. Der Bericht liest nur und bleibt im Browser.
 *
 * Ohne ?ptdom=1 kehrt die Datei in der ersten Zeile des Koerpers um:
 * kein Element, kein Hoerer, kein Beobachter, kein Takt.
 */
(function () {
  'use strict';
  if (!/[?&]ptdom=1/.test(window.location.search)) return;
  var BASIS = window.bomayeDiagnoseBasis;
  if (!BASIS) { try { console.warn('[ptdom] bsport-diagnose-basis.js fehlt'); } catch (e) {} return; }

  var kurz         = BASIS.hilfen.kurz;
  var vollKlasse   = BASIS.hilfen.vollKlasse;
  var stabileTeile = BASIS.hilfen.stabileTeile;
  var idKurz       = BASIS.hilfen.idKurz;
  var eigenerText  = BASIS.hilfen.eigenerText;

  /* Genau die Eigenschaften, die eine spaetere Regel ueberschreiben muesste. */
  var STILE = ['color', 'background-color', 'background-image', 'font-family',
               'font-size', 'font-weight', 'border', 'border-radius',
               'padding', 'width', 'height'];

  var BAUM_TIEF = 12;      /* Schachtelung, die noch lesbar bleibt */
  var BAUM_MAX  = 400;     /* Zeilen im Baum */
  var STIL_MAX  = 70;      /* Elemente mit vollem Stil */

  function huelle() { return document.querySelector('.bsport-modal-overlay'); }
  function rahmen() { return document.querySelector('.bsport-modal-frame'); }
  function inhalt() { return document.querySelector('.bsport-modal-content'); }

  function offen() {
    var o = huelle();
    return !!(o && o.classList.contains('is-open'));
  }

  /* ── Haken-Vorschlag ──────────────────────────────────────────────────
     Gebaut wird aus dem, was KEINE laufende Nummer traegt: eine stabile id,
     stabile Klassenteile als [class*="..."], dazu role, type und name. Was
     eine Ziffernfolge am Ende hat, kommt nicht hinein. */
  function hakenVorschlag(el) {
    var teile = [];
    var tag = el.tagName.toLowerCase();

    try {
      if (el.id && !/\d{3,}$/.test(el.id)) teile.push('#' + el.id);
    } catch (e) {}

    var stabil = stabileTeile(el);
    if (stabil !== '-' && stabil !== '(alle mit Nummer)') {
      var klassen = stabil.split(/\s+/).slice(0, 2);
      for (var i = 0; i < klassen.length; i++) teile.push('[class*="' + klassen[i] + '"]');
    }

    try {
      var rolle = el.getAttribute('role');
      if (rolle) teile.push('[role="' + rolle + '"]');
      var typ = el.getAttribute('type');
      if (typ) teile.push('[type="' + typ + '"]');
      var name = el.getAttribute('name');
      if (name && !/\d{3,}$/.test(name)) teile.push('[name="' + name + '"]');
      /* Bei Beschriftungen traegt oft NUR for etwas Stabiles - alle Klassen
         haben dort eine laufende Nummer. Ohne diese Zeile blieben die Labels
         die einzigen Elemente ganz ohne Haken. */
      var fuer = el.getAttribute('for');
      if (fuer && !/\d{3,}$/.test(fuer)) teile.push('[for="' + fuer + '"]');
    } catch (e) {}

    if (!teile.length) return { sel: '(kein Haken ohne Nummer moeglich)', treffer: -1 };

    var sel = tag + teile.join('');
    var n = -1;
    try { n = document.querySelectorAll(sel).length; } catch (e) { n = -1; }
    return { sel: sel, treffer: n };
  }

  function stilZeile(el) {
    var c;
    try { c = window.getComputedStyle(el); } catch (e) { return 'nicht lesbar'; }
    var aus = [];
    for (var i = 0; i < STILE.length; i++) {
      var v = c.getPropertyValue(STILE[i]);
      if (STILE[i] === 'background-image' && v === 'none') continue;
      if (v && v.length > 60) v = v.slice(0, 60) + '…';
      aus.push(STILE[i] + '=' + v);
    }
    return aus.join('  ');
  }

  /* ── Der Baum ─────────────────────────────────────────────────────── */
  function attrKurz(el) {
    var t = [];
    try {
      var w = ['role', 'type', 'name', 'placeholder', 'aria-label', 'aria-labelledby',
               'aria-hidden', 'disabled', 'required', 'for', 'href'];
      for (var i = 0; i < w.length; i++) {
        var v = el.getAttribute(w[i]);
        if (v !== null && v !== '') {
          if (v.length > 40) v = v.slice(0, 40) + '…';
          t.push(w[i] + '="' + v + '"');
        }
      }
      for (var j = 0; j < el.attributes.length; j++) {
        var a = el.attributes[j];
        if (a.name.indexOf('data-') === 0) {
          var dv = a.value.length > 30 ? a.value.slice(0, 30) + '…' : a.value;
          t.push(a.name + '="' + dv + '"');
        }
      }
    } catch (e) {}
    return t.length ? '  ' + t.join(' ') : '';
  }

  function baum(wurzel, z) {
    var zahl = 0, gedeckelt = false;
    function gehe(el, tief) {
      if (gedeckelt) return;
      if (zahl >= BAUM_MAX) { gedeckelt = true; return; }
      zahl++;
      var ein = new Array(tief + 1).join('  ');
      var eigen = eigenerText(el);
      z.push('    ' + ein + '<' + el.tagName.toLowerCase() + '>'
        + (idKurz(el, 50) ? ' #' + idKurz(el, 50) : '')
        + ' .' + vollKlasse(el)
        + attrKurz(el)
        + (eigen ? '   "' + (eigen.length > 50 ? eigen.slice(0, 50) + '…' : eigen) + '"' : ''));
      if (tief >= BAUM_TIEF) return;
      var k;
      try { k = el.children; } catch (e) { return; }
      for (var i = 0; i < k.length; i++) gehe(k[i], tief + 1);
    }
    gehe(wurzel, 0);
    if (gedeckelt) z.push('    … Deckel ' + BAUM_MAX + ' Zeilen erreicht');
    return zahl;
  }

  /* ── Welche Elemente bekommen den vollen Stil? ────────────────────── */
  function artVon(el) {
    var tag = el.tagName.toLowerCase();
    if (tag === 'input') return 'Feld (' + (el.getAttribute('type') || 'text') + ')';
    if (tag === 'select') return 'Auswahlliste';
    if (tag === 'textarea') return 'Textfeld';
    if (tag === 'label') return 'Beschriftung';
    if (tag === 'button') return 'Knopf';
    if (tag === 'a') return 'Link';
    if (tag === 'img') return 'Bild';
    if (/^h[1-6]$/.test(tag)) return 'Ueberschrift';
    var rolle = '';
    try { rolle = el.getAttribute('role') || ''; } catch (e) {}
    if (rolle === 'button') return 'Knopf (role)';
    if (rolle === 'checkbox') return 'Haken (role)';
    if (rolle === 'tab' || rolle === 'tablist') return 'Reiter';
    return null;
  }

  function stilAbschnitt(wurzel, z) {
    var liste;
    try { liste = wurzel.querySelectorAll('*'); } catch (e) { return; }
    var n = 0;
    for (var i = 0; i < liste.length && n < STIL_MAX; i++) {
      var el = liste[i];
      var art = artVon(el);
      if (!art) continue;
      var c;
      try { c = window.getComputedStyle(el); } catch (e) { continue; }
      if (c.display === 'none' || c.visibility === 'hidden') continue;
      n++;
      var h = hakenVorschlag(el);
      var r;
      try { r = el.getBoundingClientRect(); } catch (e) { r = { width: 0, height: 0 }; }
      var txt = eigenerText(el);
      z.push('');
      z.push('  [' + n + '] ' + art + (txt ? '   "' + (txt.length > 40 ? txt.slice(0, 40) + '…' : txt) + '"' : ''));
      z.push('      class="' + vollKlasse(el) + '"');
      z.push('      stabil: ' + stabileTeile(el));
      z.push('      Haken: ' + h.sel
        + '   trifft ' + (h.treffer < 0 ? '?' : h.treffer)
        + (h.treffer === 1 ? '  << EINDEUTIG' : (h.treffer > 1 ? '  (mehrdeutig)' : '')));
      z.push('      ' + Math.round(r.width) + 'x' + Math.round(r.height) + '  ' + stilZeile(el));
    }
    if (!n) z.push('  Keine sichtbaren Formularelemente gefunden.');
    else if (n >= STIL_MAX) z.push('');
    if (n >= STIL_MAX) z.push('  (Deckel ' + STIL_MAX + ' erreicht - es gibt mehr)');
  }

  /* ── Welcher Schritt ist gerade zu sehen? ─────────────────────────── */
  function schrittName(wurzel) {
    try {
      var k = wurzel.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
      for (var i = 0; i < k.length; i++) {
        var c = window.getComputedStyle(k[i]);
        if (c.display === 'none' || c.visibility === 'hidden') continue;
        var t = (k[i].textContent || '').replace(/\s+/g, ' ').trim();
        if (t) return t.length > 60 ? t.slice(0, 60) + '…' : t;
      }
    } catch (e) {}
    return '(keine Ueberschrift gefunden)';
  }

  function machBericht() {
    var z = [];
    var s = function (t) { z.push(t); };

    s('ABO-FORMULAR, BERICHT');
    s('  ' + new Date().toISOString());
    s('  Seite: ' + window.location.pathname + window.location.search);
    s('  Fenster: ' + window.innerWidth + 'x' + window.innerHeight
      + (window.visualViewport ? '  visualViewport ' + Math.round(window.visualViewport.width)
         + 'x' + Math.round(window.visualViewport.height) : ''));

    var o = huelle(), fr = rahmen(), inh = inhalt();
    s('');
    s('RAHMEN');
    if (!o) { s('  Kein .bsport-modal-overlay auf dieser Seite.'); return z.join('\n'); }
    s('  Overlay offen: ' + (offen() ? 'ja' : 'NEIN - erst einen Tarif antippen'));
    [['Overlay', o], ['Rahmen', fr], ['Inhalt', inh]].forEach(function (paar) {
      var el = paar[1];
      if (!el) { s('  ' + paar[0] + ': fehlt'); return; }
      var r = el.getBoundingClientRect();
      s('  ' + paar[0] + ': ' + kurz(el));
      s('      ' + Math.round(r.width) + 'x' + Math.round(r.height)
        + ' bei ' + Math.round(r.left) + ',' + Math.round(r.top) + '   ' + stilZeile(el));
    });

    if (!inh) { s(''); s('  Kein .bsport-modal-content - ohne ihn kein Formular.'); return z.join('\n'); }
    if (!offen()) {
      s('');
      s('  Das Overlay ist zu. Tarif antippen, warten bis das Formular steht,');
      s('  dann noch einmal DIAGNOSE.');
      return z.join('\n');
    }

    s('');
    s('SCHRITT: ' + schrittName(inh));
    var felder = 0;
    try { felder = inh.querySelectorAll('input, select, textarea').length; } catch (e) {}
    s('  sichtbare Eingabeelemente insgesamt: ' + felder);

    s('');
    s('BAUM (ab .bsport-modal-content, Tiefe ' + BAUM_TIEF + ')');
    var zahl = baum(inh, z);
    s('    (' + zahl + ' Knoten)');

    s('');
    s('ELEMENTE, KLASSEN, HAKEN UND STILE');
    s('  "Haken" ist ein Vorschlag OHNE laufende Nummern. Nur was genau eines');
    s('  trifft, taugt fuer eine Regel an einer einzelnen Stelle.');
    stilAbschnitt(inh, z);

    s('');
    s('SCHRITT DANACH');
    s('  Dieser Bericht zeigt immer den Schritt, der gerade offen ist.');
    s('  Fuer den naechsten: im Formular weitergehen, OHNE abzuschicken und');
    s('  ohne echte Daten, dann wieder DIAGNOSE und KOPIEREN.');
    s('  Was erst nach dem Absenden erscheint, steht hier nicht - das waere');
    s('  eine echte Registrierung.');

    return z.join('\n');
  }

  BASIS.leisteBauen({ bericht: machBericht });
}());

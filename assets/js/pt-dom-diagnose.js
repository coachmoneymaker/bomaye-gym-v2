/**
 * ?ptdom=1 — DEN WOCHENPLAN IM BSPORT-RAHMEN AUSLESEN
 * ──────────────────────────────────────────────────
 *
 * WOZU
 * Die Zeitfenster-Kaesten im Wochenplan beruehren einander. Diese Gestaltung
 * entsteht in Bsports eigenem Dokument im <iframe srcdoc>, und unser CSS
 * kaskadiert dort NICHT hinein - gleiche Herkunft ist nicht dasselbe Dokument.
 * Unser JavaScript kommt hinein (kein sandbox-Attribut), aber ohne die echten
 * Klassennamen und Rasterwerte waere jede Regel geraten. Bsport erzeugt seine
 * Klassen mit MUI, samt wechselnder Zahlensuffixe - auf Probetraining ist
 * genau dieses Raten zweimal gescheitert.
 *
 * Also wird hier nichts geraten, sondern abgelesen und auf den Schirm
 * geschrieben, wo ein Screenshot es einfangen kann.
 *
 * WIE DER WOCHENPLAN GEFUNDEN WIRD
 * NICHT ueber Klassennamen. Gesucht wird nach dem, was Bsport als TEXT
 * rendert: Wochentage und Tageszeiten. Vom ersten Treffer aus geht es nach
 * oben, bis ein Vorfahr mindestens zwei verschiedene Tage enthaelt - das ist
 * das Raster. Diese Suche ueberlebt jede Umbenennung.
 *
 * ZWEITER TEIL: DAS MODAL
 * Der Buchungsdialog oeffnet am oberen Rand des Rahmens, nicht am oberen
 * Rand des Fensters - der Rahmen ist hoeher als das Fenster (900px gegen
 * 800px bei 1280 Breite), und gescrollt wird die SEITE, nicht der Rahmen.
 * Wer in der Terminliste weiter unten tippt, steht damit zwangslaeufig
 * unterhalb der Rahmenoberkante und sieht nur den Ladekringel.
 *
 * Um das zu beheben, muss ein Beobachter den Dialog ERKENNEN. Woran, ist
 * ohne Messung geraten - und Raten ist auf Probetraining zweimal
 * gescheitert. Deshalb schreibt diese Datei mit, was im Rahmen auftaucht:
 * Rolle, ARIA, errechnete Position, Kasten, z-index, Klassen, dazu die Lage
 * des Rahmens und der Scrollstand im selben Augenblick.
 *
 * BEDIENUNG
 * /personal-training-boxen-muenchen?ptdom=1 aufrufen.
 *   WOCHENPLAN  liest das Terminraster aus (wie bisher)
 *   MODAL       zeigt, was seit dem Seitenaufruf im Rahmen erschienen ist
 *   KOPIEREN    legt den angezeigten Bericht in die Zwischenablage
 *
 * Ohne den Parameter laedt und tut diese Datei nichts. Sie laedt nichts von
 * bsport.io und misst nur unser eigenes iframe - deshalb ungated.
 */
(function () {
  'use strict';
  if (!/[?&]ptdom=1/.test(window.location.search)) return;

  var TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  var ZEITEN = ['Morgens', 'Vormittags', 'Mittags', 'Nachmittags', 'Abends'];

  /* ── Oberflaeche ───────────────────────────────────────────────────── */
  var leiste = document.createElement('div');
  leiste.id = 'pt-dom-leiste';
  var knopfLesen = document.createElement('button');
  knopfLesen.type = 'button';
  knopfLesen.textContent = 'WOCHENPLAN';
  var knopfModal = document.createElement('button');
  knopfModal.type = 'button';
  knopfModal.textContent = 'MODAL';
  var knopfKopie = document.createElement('button');
  knopfKopie.type = 'button';
  knopfKopie.textContent = 'KOPIEREN';
  var knopfZu = document.createElement('button');
  knopfZu.type = 'button';
  knopfZu.textContent = '×';
  knopfZu.setAttribute('aria-label', 'Diagnose schliessen');
  leiste.appendChild(knopfLesen);
  leiste.appendChild(knopfModal);
  leiste.appendChild(knopfKopie);
  leiste.appendChild(knopfZu);

  var bericht = document.createElement('pre');
  bericht.id = 'pt-dom-bericht';
  bericht.hidden = true;

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(bericht);
    document.body.appendChild(leiste);
  });

  var letzterText = '';

  /* ── Hilfen ────────────────────────────────────────────────────────── */
  function kurz(el) {
    if (!el) return '-';
    var k = (typeof el.className === 'string' && el.className)
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '';
    /* Klassennamen koennen bei MUI sehr lang werden - gekuerzt, aber mit
       Laengenangabe, damit erkennbar bleibt, dass da mehr steht. */
    if (k.length > 54) k = k.slice(0, 54) + '…';
    return el.tagName.toLowerCase() + k;
  }

  function masse(el, fenster) {
    var c = fenster.getComputedStyle(el);
    var r = el.getBoundingClientRect();
    var t = [];
    t.push(c.display);
    if (/grid/.test(c.display) && c.gridTemplateColumns !== 'none') {
      t.push('cols=' + c.gridTemplateColumns.replace(/\s+/g, ' ').slice(0, 34));
    }
    var gap = (c.rowGap === c.columnGap) ? c.rowGap : (c.rowGap + '/' + c.columnGap);
    if (gap && gap !== 'normal' && gap !== '0px') t.push('gap=' + gap);
    else t.push('gap=' + (gap || '0px'));
    var m = [c.marginTop, c.marginRight, c.marginBottom, c.marginLeft].join(' ');
    if (m !== '0px 0px 0px 0px') t.push('m=' + m);
    var p = [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft].join(' ');
    if (p !== '0px 0px 0px 0px') t.push('p=' + p);
    if (parseFloat(c.borderTopWidth) || parseFloat(c.borderLeftWidth)) {
      t.push('border=' + c.borderTopWidth + ' ' + c.borderTopStyle + ' ' + c.borderTopColor);
    }
    t.push(Math.round(r.width) + 'x' + Math.round(r.height));
    return t.join(' ');
  }

  function textVon(el) {
    return (el.textContent || '').trim().replace(/\s+/g, ' ');
  }

  /* Enthaelt der Knoten mindestens zwei VERSCHIEDENE Wochentage? Das
     unterscheidet das Raster von einer einzelnen Tagesspalte. */
  function tageDrin(el) {
    var t = textVon(el);
    var n = 0;
    for (var i = 0; i < TAGE.length; i++) if (t.indexOf(TAGE[i]) !== -1) n++;
    return n;
  }

  /* ── Der eigentliche Bericht ───────────────────────────────────────── */
  function auslesen() {
    var z = [];
    function schreib(s) { z.push(s); }

    schreib('PTDOM  ' + new Date().toLocaleTimeString('de-DE'));
    schreib('Fenster ' + window.innerWidth + 'x' + window.innerHeight +
            '  dpr ' + (window.devicePixelRatio || 1));

    var rahmen = document.querySelector('.pt-widget-wrapper iframe');
    if (!rahmen) { schreib('KEIN iframe gefunden.'); return z.join('\n'); }
    var rb = rahmen.getBoundingClientRect();
    schreib('Rahmen ' + Math.round(rb.width) + 'x' + Math.round(rb.height) +
            ' bei x=' + Math.round(rb.left));

    var d;
    try { d = rahmen.contentDocument; } catch (e) { d = null; }
    if (!d) {
      schreib('contentDocument NICHT lesbar - fremde Herkunft oder noch nicht geladen.');
      return z.join('\n');
    }
    var w = rahmen.contentWindow;
    var koerper = d.body;
    if (!koerper || !textVon(koerper)) {
      schreib('Rahmen ist LEER. Einwilligung erteilt? Widget geladen?');
      return z.join('\n');
    }
    schreib('Inhalt ' + Math.max(d.documentElement.scrollHeight, koerper.scrollHeight) + 'px hoch');

    /* Startpunkt suchen: ein Element, dessen eigener Text eine Tageszeit
       oder ein Wochentag IST (nicht nur enthaelt) - das ist ein Blatt. */
    var alle = d.querySelectorAll('*');
    var treffer = null, wort = '';
    for (var i = 0; i < alle.length && !treffer; i++) {
      var t = textVon(alle[i]);
      if (t.length > 24) continue;
      for (var j = 0; j < ZEITEN.length; j++) {
        if (t === ZEITEN[j]) { treffer = alle[i]; wort = t; break; }
      }
      if (!treffer) for (var k = 0; k < TAGE.length; k++) {
        if (t === TAGE[k]) { treffer = alle[i]; wort = t; break; }
      }
    }
    if (!treffer) {
      schreib('KEIN Wochenplan sichtbar. Erst im Widget bis zur');
      schreib('Terminauswahl navigieren, dann erneut auslesen.');
      schreib('Gesucht: ' + ZEITEN.join('/') + ' oder ' + TAGE.slice(0, 3).join('/') + '…');
      return z.join('\n');
    }
    schreib('Gefunden ueber Text: "' + wort + '"');

    /* Nach oben, bis zwei verschiedene Tage drin sind. */
    var raster = treffer, hoch = 0;
    while (raster.parentElement && tageDrin(raster) < 2 && hoch < 12) {
      raster = raster.parentElement; hoch++;
    }
    schreib('Raster ' + hoch + ' Ebenen ueber dem Fund, ' + tageDrin(raster) + ' Tage drin');
    schreib('');

    /* Kette vom Raster abwaerts, zwei Ebenen - mehr passt nicht aufs Bild. */
    schreib('RASTER');
    schreib('  ' + kurz(raster));
    schreib('  ' + masse(raster, w));
    var kinder = raster.children;
    schreib('  Kinder: ' + kinder.length);
    for (var c = 0; c < kinder.length && c < 4; c++) {
      schreib('');
      schreib('  [' + (c + 1) + '] ' + kurz(kinder[c]) + '  "' + textVon(kinder[c]).slice(0, 26) + '"');
      schreib('      ' + masse(kinder[c], w));
      var enkel = kinder[c].children;
      for (var e = 0; e < enkel.length && e < 3; e++) {
        schreib('      > ' + kurz(enkel[e]) + '  "' + textVon(enkel[e]).slice(0, 20) + '"');
        schreib('        ' + masse(enkel[e], w));
      }
      if (enkel.length > 3) schreib('      > … ' + (enkel.length - 3) + ' weitere');
    }
    if (kinder.length > 4) schreib('  … ' + (kinder.length - 4) + ' weitere Kinder');

    /* Beruehren sich zwei benachbarte Kaesten wirklich? Nachgemessen statt
       vermutet: der Abstand zwischen Unterkante und Oberkante. */
    schreib('');
    schreib('ABSTAENDE zwischen benachbarten Kaesten');
    var kaesten = [];
    for (var q = 0; q < alle.length; q++) {
      var tx = textVon(alle[q]);
      for (var zz = 0; zz < ZEITEN.length; zz++) {
        if (tx === ZEITEN[zz]) { kaesten.push(alle[q]); break; }
      }
    }
    if (kaesten.length < 2) { schreib('  weniger als zwei gefunden'); }
    else {
      /* Nur echte Nachbarn vergleichen. In Dokumentreihenfolge folgt auf den
         letzten Kasten einer Spalte der erste der naechsten - deren Abstand
         ist bedeutungslos und hat den Bericht im ersten Entwurf unlesbar
         gemacht. Senkrechte Nachbarn teilen die linke Kante, waagerechte die
         obere. */
      var r = kaesten.map(function (el) {
        var b3 = el.getBoundingClientRect();
        return { el: el, t: Math.round(b3.top), l: Math.round(b3.left),
                 b: Math.round(b3.bottom), r: Math.round(b3.right) };
      });
      /* Je Kasten NUR den naechstliegenden Nachbarn. Ohne das meldet der
         Bericht auch uebernaechste Kaesten ("Morgens/Nachmittags 37px") und
         wird wieder unlesbar. */
      var zeilen = 0;
      for (var x = 0; x < r.length && zeilen < 6; x++) {
        var untenBest = null, rechtsBest = null;
        for (var y = 0; y < r.length; y++) {
          if (x === y) continue;
          if (Math.abs(r[y].l - r[x].l) <= 2 && r[y].t >= r[x].b - 2) {
            if (!untenBest || r[y].t < untenBest.t) untenBest = r[y];
          }
          if (Math.abs(r[y].t - r[x].t) <= 2 && r[y].l >= r[x].r - 2) {
            if (!rechtsBest || r[y].l < rechtsBest.l) rechtsBest = r[y];
          }
        }
        if (untenBest) {
          schreib('  unter  "' + textVon(r[x].el).slice(0, 12) + '" / "' +
                  textVon(untenBest.el).slice(0, 12) + '"  ' + (untenBest.t - r[x].b) + 'px');
          zeilen++;
        }
        if (rechtsBest && zeilen < 6) {
          schreib('  rechts "' + textVon(r[x].el).slice(0, 12) + '" / "' +
                  textVon(rechtsBest.el).slice(0, 12) + '"  ' + (rechtsBest.l - r[x].r) + 'px');
          zeilen++;
        }
      }
      if (!zeilen) schreib('  keine direkten Nachbarn erkannt');
    }

    schreib('');
    schreib('Stylesheets im Rahmen: ' + (d.styleSheets ? d.styleSheets.length : '?'));
    return z.join('\n');
  }


  /* ══════════════════ MODAL-BEOBACHTER IM RAHMEN ══════════════════════
     Schreibt mit, was im inneren Dokument auftaucht. Laeuft nur unter
     ?ptdom=1 - diese Datei kehrt sonst schon in Zeile 1 um.

     Der Zugriff auf contentDocument ist moeglich, weil der Rahmen mit
     srcdoc aus unserem eigenen Dokument stammt und kein sandbox-Attribut
     traegt. bsport-frame-hoehe.js nutzt denselben Zugang, um die Hoehe
     nachzuziehen.

     Erfasst wird NICHT nach Klassennamen. Bsport baut mit MUI, die Klassen
     tragen wechselnde Zahlensuffixe. Erkannt wird an Rolle, ARIA, der
     errechneten Position und der Groesse - und genau diese Werte stehen
     dann im Bericht, damit die spaetere Erkennung auf Gemessenem steht. */
  var MODAL_MAX = 14;        /* so viele Ereignisse werden behalten */
  var modalLog  = [];
  var beobachtet = null;     /* das Dokument, an dem der Beobachter haengt */
  var mo = null;

  function attrListe(el) {
    var aus = [];
    try {
      for (var i = 0; i < el.attributes.length; i++) {
        var a = el.attributes[i];
        if (a.name === 'role' || a.name.indexOf('aria-') === 0) {
          aus.push(a.name + '="' + a.value + '"');
        }
      }
    } catch (e) { /* egal */ }
    return aus.join(' ');
  }

  function istSpinner(el) {
    var n = (el.tagName + ' ' + (typeof el.className === 'string' ? el.className : '')).toLowerCase();
    if (/spinner|loader|loading|circular|progressbar/.test(n)) return true;
    try { if (el.getAttribute('role') === 'progressbar') return true; } catch (e) {}
    return false;
  }

  /* Dialogverdacht, in dieser Reihenfolge: ausgesprochene Rolle, dann ARIA,
     dann eine feste Lage mit Flaeche, zuletzt ein neues oberstes Element.
     Die Groessenschranken halten Knoepfe und Kringel heraus. */
  function dialogGrund(el, c) {
    var rolle = '';
    try { rolle = el.getAttribute('role') || ''; } catch (e) {}
    if (rolle === 'dialog' || rolle === 'alertdialog') return 'role=' + rolle;
    try { if (el.hasAttribute('aria-modal')) return 'aria-modal'; } catch (e) {}
    var r = el.getBoundingClientRect();
    if (c.position === 'fixed' && r.width > 120 && r.height > 120) return 'position:fixed';
    if (el.parentElement && el.parentElement.tagName === 'BODY'
        && r.width > 160 && r.height > 160) return 'neues Element an <body>';
    return '';
  }

  function erfassen(art, grund, el, w, rahmen) {
    if (modalLog.length >= MODAL_MAX) return;
    if (el.__ptdomGesehen) return;
    el.__ptdomGesehen = true;
    var c, r;
    try { c = w.getComputedStyle(el); r = el.getBoundingClientRect(); }
    catch (e) { return; }
    var rb = rahmen.getBoundingClientRect();
    modalLog.push({
      zeit: new Date().toLocaleTimeString('de-DE'),
      art: art, grund: grund,
      tag: el.tagName.toLowerCase(),
      klassen: (typeof el.className === 'string' ? el.className : '') || '-',
      aria: attrListe(el) || '-',
      position: c.position,
      z: c.zIndex,
      display: c.display,
      /* Koordinaten IM RAHMEN - der Rahmen ist das Fenster dieses Dokuments. */
      top: Math.round(r.top), left: Math.round(r.left),
      breite: Math.round(r.width), hoehe: Math.round(r.height),
      eltern: el.parentElement ? el.parentElement.tagName.toLowerCase() : '-',
      /* Lage des Rahmens und Scrollstand im selben Augenblick. */
      rTop: Math.round(rb.top), rLeft: Math.round(rb.left),
      rBreite: Math.round(rb.width), rHoehe: Math.round(rb.height),
      scrollY: Math.round(window.scrollY || 0),
      innerH: window.innerHeight, innerW: window.innerWidth
    });
  }

  function pruefen(el, w, rahmen) {
    if (!el || el.nodeType !== 1) return;
    var c;
    try { c = w.getComputedStyle(el); } catch (e) { return; }
    if (c.display === 'none' || c.visibility === 'hidden') return;
    if (istSpinner(el)) { erfassen('SPINNER', 'Name/Rolle', el, w, rahmen); return; }
    var grund = dialogGrund(el, c);
    if (grund) erfassen('DIALOG', grund, el, w, rahmen);
  }

  function anmelden() {
    var rahmen = document.querySelector('.pt-widget-wrapper iframe');
    if (!rahmen) return;
    var d;
    try { d = rahmen.contentDocument; } catch (e) { return; }
    if (!d || !d.body) return;
    if (beobachtet === d) return;          /* schon dran */
    beobachtet = d;
    var w = rahmen.contentWindow;
    if (mo) { try { mo.disconnect(); } catch (e) {} }
    try {
      mo = new MutationObserver(function (listen) {
        for (var i = 0; i < listen.length; i++) {
          var hinzu = listen[i].addedNodes;
          for (var j = 0; j < hinzu.length; j++) pruefen(hinzu[j], w, rahmen);
        }
      });
      mo.observe(d.body, { childList: true, subtree: true });
    } catch (e) { beobachtet = null; }
  }

  /* Der Rahmen ist bis zur Einwilligung inert (data-bsport-srcdoc) und laedt
     danach neu. Deshalb wird in Ruhe weiter nachgesehen, statt einmal zu
     versuchen. Nur unter ?ptdom=1, also kein Dauerlauf im Normalbetrieb. */
  function wacheStarten() {
    anmelden();
    var rahmen = document.querySelector('.pt-widget-wrapper iframe');
    if (rahmen) rahmen.addEventListener('load', function () { beobachtet = null; anmelden(); });
    setInterval(anmelden, 1000);
  }

  function modalBericht() {
    var z = [];
    function schreib(s) { z.push(s); }
    schreib('PTDOM MODAL  ' + new Date().toLocaleTimeString('de-DE'));
    schreib('Fenster ' + window.innerWidth + 'x' + window.innerHeight +
            '  scrollY ' + Math.round(window.scrollY || 0) +
            '  dpr ' + (window.devicePixelRatio || 1));

    var rahmen = document.querySelector('.pt-widget-wrapper iframe');
    if (rahmen) {
      var rb = rahmen.getBoundingClientRect();
      schreib('Rahmen jetzt  top=' + Math.round(rb.top) + '  ' +
              Math.round(rb.width) + 'x' + Math.round(rb.height));
    } else {
      schreib('KEIN iframe gefunden.');
    }
    schreib('Beobachter ' + (beobachtet ? 'AKTIV' : 'NICHT aktiv'));
    if (!beobachtet) {
      schreib('  Einwilligung erteilt? Widget geladen? Erst dann greift er.');
    }
    schreib('Ereignisse: ' + modalLog.length + (modalLog.length >= MODAL_MAX ? ' (Deckel erreicht)' : ''));
    if (!modalLog.length) {
      schreib('');
      schreib('Noch nichts erfasst. Im Widget einen Termin antippen,');
      schreib('warten bis Dialog oder Kringel erscheint, dann erneut MODAL.');
      return z.join('\n');
    }

    for (var i = 0; i < modalLog.length; i++) {
      var e = modalLog[i];
      schreib('');
      schreib('[' + (i + 1) + '] ' + e.art + '  ' + e.zeit + '   (' + e.grund + ')');
      schreib('    <' + e.tag + '> in <' + e.eltern + '>');
      schreib('    class="' + String(e.klassen).slice(0, 90) + '"');
      schreib('    ' + e.aria);
      schreib('    position=' + e.position + '  z-index=' + e.z + '  display=' + e.display);
      schreib('    im Rahmen: top=' + e.top + ' left=' + e.left +
              '  ' + e.breite + 'x' + e.hoehe);
      schreib('    Rahmen damals: top=' + e.rTop + ' ' + e.rBreite + 'x' + e.rHoehe +
              '   scrollY=' + e.scrollY + '  Fenster ' + e.innerW + 'x' + e.innerH);
      /* Die Zahl, auf die es ankommt: wo stand das Element im FENSTER?
         Rahmenoberkante plus Lage im Rahmen. Negativ heisst oberhalb der
         sichtbaren Kante - genau der gemeldete Fehler. */
      var imFenster = e.rTop + e.top;
      schreib('    >> im Fenster bei y=' + imFenster +
              (imFenster < 0 ? '  ALSO ' + Math.abs(imFenster) + 'px UEBER der Kante'
                             : '  (sichtbarer Bereich beginnt bei 0)'));
    }
    return z.join('\n');
  }

  /* ── Verdrahtung ───────────────────────────────────────────────────── */
  knopfModal.addEventListener('click', function () {
    try { letzterText = modalBericht(); }
    catch (e) { letzterText = 'FEHLER im Modal-Bericht: ' + (e && e.message); }
    bericht.textContent = letzterText;
    bericht.hidden = false;
  });

  knopfLesen.addEventListener('click', function () {
    try { letzterText = auslesen(); }
    catch (e) { letzterText = 'FEHLER beim Auslesen: ' + (e && e.message); }
    bericht.textContent = letzterText;
    bericht.hidden = false;
  });

  knopfKopie.addEventListener('click', function () {
    if (!letzterText) { knopfKopie.textContent = 'ERST AUSLESEN'; return; }
    var fertig = function (ok) {
      knopfKopie.textContent = ok ? 'KOPIERT' : 'NICHT KOPIERT';
      setTimeout(function () { knopfKopie.textContent = 'KOPIEREN'; }, 1800);
    };
    try {
      navigator.clipboard.writeText(letzterText).then(function () { fertig(true); },
                                                      function () { fertig(false); });
    } catch (e) { fertig(false); }
  });

  /* Erst den Bericht einklappen, erst beim zweiten Tipp alles entfernen.
     Sonst muss man neu laden, nur um im Widget weiterzunavigieren. */
  knopfZu.addEventListener('click', function () {
    if (!bericht.hidden) { bericht.hidden = true; return; }
    if (mo) { try { mo.disconnect(); } catch (e) {} }
    leiste.remove();
    bericht.remove();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wacheStarten);
  } else {
    wacheStarten();
  }
})();

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
 * BEDIENUNG
 * /personal-training-boxen-muenchen?ptdom=1 aufrufen, im Widget bis zum
 * Wochenplan navigieren, dann unten auf AUSLESEN tippen. Der Bericht laesst
 * sich abfotografieren oder ueber KOPIEREN in die Zwischenablage legen.
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
  knopfLesen.textContent = 'WOCHENPLAN AUSLESEN';
  var knopfKopie = document.createElement('button');
  knopfKopie.type = 'button';
  knopfKopie.textContent = 'KOPIEREN';
  var knopfZu = document.createElement('button');
  knopfZu.type = 'button';
  knopfZu.textContent = '×';
  knopfZu.setAttribute('aria-label', 'Diagnose schliessen');
  leiste.appendChild(knopfLesen);
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

  /* ── Verdrahtung ───────────────────────────────────────────────────── */
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
    leiste.remove();
    bericht.remove();
  });
})();

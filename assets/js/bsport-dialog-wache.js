/**
 * BSPORT-DIALOG: KOPFLEISTE WEG, SEITE FESTSTELLEN
 * ───────────────────────────────────────────────
 *
 * DAS PROBLEM
 * Am Schreibtisch deckte die feste Kopfleiste den oberen Rand des
 * Buchungsdialogs zu: Titel und Kopfbild steckten dahinter, und die
 * Scrollleiste des Dialogs begann erst darunter.
 *
 * Die Mechanik dagegen gibt es seit jeher und sie ist richtig: sobald ein
 * Dialog offen ist, bekommt <body> die Klasse bsport-modal-open, style.css
 * legt die Kopfleiste darueber auf visibility: hidden und z-index: -1, und
 * die Seite wird festgestellt, damit sie nicht unter dem Dialog wegscrollt.
 *
 * WARUM SIE TROTZDEM NICHT GRIFF
 * Nachgemessen mit nachgebauten Dialogen auf beiden Seiten, bei 1280x720,
 * 1440x800, 1920x1080 und 1024x700:
 *
 *   Bauart A  .bsport-user-interaction-modal__container, direktes Kind von
 *             <body>, z-index 1300
 *             -> erkannt, Kopfleiste weg, nichts verdeckt
 *   Bauart B  bs-activity--dialog, eine Ebene tiefer, z-index 900
 *             -> NICHT erkannt, Kopfleiste blieb stehen und deckte den
 *                Dialog bei ALLEN vier Fenstergroessen zu
 *
 * Die alte Wache suchte genau einen Klassennamen und nur unter den
 * DIREKTEN Kindern von <body> (childList ohne subtree). Beides ist zu
 * eng. Dass der Anmeldeschritt in Wahrheit bs-activity--dialog heisst,
 * stand seit dem Geraetetest sogar schon als Kommentar in
 * probetraining-page.css - nur hatte es nie jemand in die Wache getragen.
 *
 * WIE JETZT ERKANNT WIRD
 * Erst die bekannten Klassennamen, dann die Bauart: fest positioniert,
 * gestapelt, mindestens halb so gross wie das Fenster und als Dialog
 * ausgewiesen (role oder aria-modal, oder ein [role=dialog] darin).
 * Damit ueberlebt die Erkennung ein Umbenennen bei Bsport - MUI vergibt
 * laufende Nummern, auf Klassennamen allein ist kein Verlass.
 *
 * WAS AUSDRUECKLICH NICHT ALS DIALOG GILT
 * Unsere eigenen festen Ebenen und der Einwilligungsbanner. Ohne diese
 * Ausnahmen wuerde die Rauschebene (fest, z-index 9999) die Wache dauerhaft
 * auf "offen" stellen, und die Kopfleiste verschwaende, sobald Cookiebot
 * fragt. An Cookiebot wird nichts geaendert, auch nicht mittelbar.
 *
 * EINE DATEI FUER BEIDE SEITEN
 * /probetraining und /stundenplan hatten je eine eigene Kopie. Sie sind
 * damit auseinandergelaufen, und der Fehler steckte in beiden. Jetzt gibt
 * es nur noch diese.
 */
(function () {
  'use strict';

  /* ?ptfix=1 gehoert zu /probetraining: dort schaltet er den alten Stand
     zurueck, und dessen eigene Wache setzt die Klasse selbst. Zwei Waechter
     auf derselben Klasse wuerden sich gegenseitig ueberschreiben. Auf
     /stundenplan hat der Schalter keine Bedeutung und schadet nicht. */
  if (/[?&]ptfix=1/.test(window.location.search)) return;

  var BEKANNT = '.bsport-user-interaction-modal__container, .bs-activity--dialog,'
              + ' [class*="bsport-user-interaction-modal"]';
  /* WO GESUCHT WIRD, STATT WO ENTLANGGEGANGEN WIRD
     Am Geraet gemessen (Chrome 155, 1440x726, beide Seiten gleich): der
     echte Kursdialog ist

       div#bs-activity--dialog.MuiDialog-root-NNNN  role="presentation"
       position: fixed, inset 0, z-index 1300, 1440x726
       TIEFE UNTER <body>: 11

     Die Bauart-Regeln unten passen auf ihn, alle. Gescheitert ist die
     Reichweite: die alte Fassung ging nur die Kinder von <body>, deren
     Kinder und von den Enkeln die ersten 24 ab. Tiefe 11 kam dort nie
     vor, die Pruefung fand also nie statt.

     Jetzt wird gesucht statt gegangen. Die Zahlensuffixe der MUI-Klassen
     (MuiDialog-root-1104) sind unbrauchbar, deshalb Teiltreffer. Die
     Kennung bs-activity--dialog ist laut Messung stabil, steht aber
     nicht allein: [id$="--dialog"] faengt auch eine Umbenennung in
     derselben Schreibweise. */
  var SUCHE = '#bs-activity--dialog, [id$="--dialog"],'
            + ' [class*="MuiDialog-root"], [class*="MuiModal-root"],'
            + ' [role="presentation"], [role="dialog"], [role="alertdialog"],'
            + ' [aria-modal="true"]';
  /* Deckel, damit ein Umbau bei Bsport nie zu einer teuren Schleife wird.
     Gemessen auf beiden Seiten mit offenem Dialog: die Suche liefert eine
     einstellige Zahl von Treffern. */
  var SUCHE_MAX = 200;
  var BODY_KLASSE = 'bsport-modal-open';
  /* Nicht unsere eigenen festen Ebenen, und nicht der Einwilligungsbanner. */
  var FREMD = '#header, .noise, .wa-float, #page-mobile-nav, #mobile-nav,'
            + ' #pt-dom-leiste, #pt-dom-bericht, #pt-touch-debug,'
            + ' [id^="Cybot"], [id^="Cookiebot"], #CookiebotWidget';

  var _scrollY = 0;
  var _locked = false;

  function unsers(el) {
    try {
      if (el.matches && el.matches(FREMD)) return true;
      return !!(el.closest && el.closest(FREMD));
    } catch (e) { return false; }
  }

  function istDialog(el) {
    if (!el || el.nodeType !== 1) return false;
    if (unsers(el)) return false;
    try {
      if (el.matches && el.matches(BEKANNT)) return true;
      var c = window.getComputedStyle(el);
      if (c.position !== 'fixed') return false;
      if (c.display === 'none' || c.visibility === 'hidden') return false;
      var z = parseInt(c.zIndex, 10);
      if (!(z >= 100)) return false;
      var r = el.getBoundingClientRect();
      /* Mindestens halb so gross wie das Fenster: haelt Knoepfe,
         Hinweisfaehnchen und Ladekringel heraus. */
      if (r.width < window.innerWidth * 0.5) return false;
      if (r.height < window.innerHeight * 0.5) return false;
      var rolle = el.getAttribute('role');
      if (rolle === 'dialog' || rolle === 'alertdialog' || rolle === 'presentation') return true;
      if (el.getAttribute('aria-modal') === 'true') return true;
      return !!el.querySelector('[role="dialog"], [role="alertdialog"], [aria-modal="true"]');
    } catch (e) { return false; }
  }

  function offen() {
    /* Erst die bekannten Klassennamen - billigster Treffer zuerst. */
    var kandidaten;
    try { kandidaten = document.querySelectorAll(BEKANNT); } catch (e) { kandidaten = []; }
    for (var i = 0; i < kandidaten.length; i++) {
      if (!unsers(kandidaten[i])) {
        var cc;
        try { cc = window.getComputedStyle(kandidaten[i]); } catch (e) { cc = null; }
        if (!cc || (cc.display !== 'none' && cc.visibility !== 'hidden')) return true;
      }
    }
    /* Dann die Bauart, ueberall im Dokument und in jeder Tiefe. */
    var liste;
    try { liste = document.querySelectorAll(SUCHE); } catch (e) { return false; }
    for (var k = 0; k < liste.length && k < SUCHE_MAX; k++) {
      if (istDialog(liste[k])) return true;
    }
    return false;
  }

  function sperren() {
    if (_locked) return;
    _locked = true;
    _scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _scrollY + 'px';
    document.body.style.width = '100%';
  }

  function loesen() {
    if (!_locked) return;
    _locked = false;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: _scrollY, behavior: 'instant' });
  }

  var _takt = null;
  function pruefen() {
    var auf = offen();
    document.body.classList.toggle(BODY_KLASSE, auf);
    if (auf) { sperren(); } else { loesen(); }
  }

  function angestossen() {
    /* Entprellt auf einen Bild pro Bild.
       Das Widget zeichnet sich oft neu, und jede Pruefung liest
       errechnete Stile - also Layout. Ohne Entprellung liefe sie bei
       jedem einzelnen Knoten, den React anfasst.

       requestAnimationFrame statt eines Zeitgebers: oefter als einmal je
       Bild kann sich ohnehin nichts sichtbar aendern, und in einem
       Hintergrundregister ruht die Pruefung ganz - dort gibt es keinen
       Dialog zu sehen. */
    if (_takt) return;
    /* Losgeloest von window aufgerufen wirft requestAnimationFrame in
       Chrome "Illegal invocation" - deshalb gebunden. */
    var planen = window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : function (f) { return window.setTimeout(f, 16); };
    _takt = planen(function () { _takt = null; pruefen(); });
  }

  function starten() {
    if (!document.body) return;
    /* subtree: true ist der Kern der Korrektur. Die alte Wache sah nur
       direkte Kinder von <body> und verpasste damit jeden Dialog, den
       Bsport eine Ebene tiefer einhaengt. */
    new MutationObserver(angestossen).observe(document.body,
      { childList: true, subtree: true, attributes: true,
        attributeFilter: ['class', 'style'] });
    window.addEventListener('resize', angestossen, { passive: true });
    pruefen();
    /* ZULETZT, und nur wenn bis hierher alles stand: die Marke, an der
       der CSS-Rueckfall erkennt, dass er nicht gebraucht wird. Siehe
       style.css beim Abschnitt "ZWEITE REIHE". Faellt dieses Skript aus
       oder wirft es vorher, bleibt die Marke weg und das CSS uebernimmt. */
    document.documentElement.classList.add('bomaye-dialogwache-aktiv');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', starten);
  } else {
    starten();
  }
}());

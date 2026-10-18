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
    var kandidaten;
    try { kandidaten = document.querySelectorAll(BEKANNT); } catch (e) { kandidaten = []; }
    for (var i = 0; i < kandidaten.length; i++) {
      if (!unsers(kandidaten[i])) {
        var cc;
        try { cc = window.getComputedStyle(kandidaten[i]); } catch (e) { cc = null; }
        if (!cc || (cc.display !== 'none' && cc.visibility !== 'hidden')) return true;
      }
    }
    /* Nach Bauart suchen: nur feste Ebenen, und die sind selten. Um die
       Liste klein zu halten, wird nicht der ganze Baum befragt, sondern
       die Kinder von <body> und deren Kinder - tiefer haengt ein
       bildschirmfuellender fester Kasten in der Praxis nicht. */
    try {
      var b = document.body;
      for (var k = 0; k < b.children.length; k++) {
        var kind = b.children[k];
        if (istDialog(kind)) return true;
        for (var e2 = 0; e2 < kind.children.length && e2 < 24; e2++) {
          if (istDialog(kind.children[e2])) return true;
        }
      }
    } catch (e) { /* egal */ }
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
    /* Entprellt: Bsport baut seinen Dialog in mehreren Schritten auf, und
       die Pruefung liest Layoutwerte. Ohne Entprellung liefe sie bei jedem
       einzelnen Knoten. */
    if (_takt) return;
    _takt = setTimeout(function () { _takt = null; pruefen(); }, 60);
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', starten);
  } else {
    starten();
  }
}());

/**
 * ?ptdom=1 - MESSLEISTE FUER DAS BSPORT-WIDGET
 * ───────────────────────────────────────────
 *
 * Zwei Fragen stehen in diesem Bericht, beide nur lesend:
 *
 *   1. KOPFLEISTE UEBER DEM DIALOG (urspruenglicher Anlass, siehe unten)
 *   2. BUTTONS UND LABELS - welches Element zeichnet eigentlich den
 *      sichtbaren Buchungsknopf? Die Beschriftungen im Widget sollen
 *      golden werden, und bevor dafuer eine Regel geschrieben wird, muss
 *      das echte Markup auf dem Tisch liegen. Im Rechenzentrum laedt das
 *      Widget nicht (cdn.bsport.io ist gesperrt), gemessen wird also auf
 *      dem Geraet des Eigentuemers. Der Abschnitt steht weiter unten bei
 *      knopfAbschnitt().
 *
 * BEFUND VOM GERAET (MacBook, Chrome, privates Fenster, nach PR #135)
 * Auf /probetraining oeffnet der Kursdialog, aber die feste Kopfleiste
 * bleibt darueber stehen und deckt seinen oberen Rand zu. Rund um den
 * Dialog ist die Seite im Bereich der Kopfleiste nicht abgedunkelt.
 *
 * Zwei Moeglichkeiten, und sie sehen auf einem Bild gleich aus:
 *   a) Die Wache erkennt den echten Dialog nicht. Dann waere er eine
 *      dritte Bauart - weder einer der bekannten Klassennamen noch die
 *      Bauart-Regel aus PR #135 trifft zu.
 *   b) Die Wache erkennt ihn, aber die Kopfleiste verschwindet trotzdem
 *      nicht. Dann liegt es an der Klasse an <body> oder am CSS.
 *
 * Was davon zutrifft, entscheidet eine einzige Zahl: steht
 * bsport-modal-open an <body> oder nicht. Dazu kommt, WAS die Wache
 * ueberhaupt zu sehen bekommt. Beides schreibt dieser Bericht auf.
 *
 * WARUM DIE REGELN HIER NOCH EINMAL STEHEN
 * Die Wache in bsport-dialog-wache.js merkt sich nichts und gibt nichts
 * nach aussen. Sie zu befragen hiesse, sie zu aendern - und in einem
 * Untersuchungs-PR wird am Gegenstand der Untersuchung nichts geaendert.
 * Stattdessen steht hier eine LESENDE KOPIE ihrer Regeln. Sie urteilt
 * ueber dieselbe Seite im selben Augenblick, also faellt sie dasselbe
 * Urteil - nur schreibt sie auf, welche Bedingung gescheitert ist.
 *
 * Weicht die Kopie je vom Original ab, ist der Bericht wertlos. Deshalb
 * ist sie wortgetreu uebernommen und mit KOPIE markiert.
 *
 * BEDIENUNG
 * /probetraining?ptdom=1 oder /stundenplan?ptdom=1 aufrufen, Kurs
 * antippen, dann DIAGNOSE und KOPIEREN.
 *
 * Ohne den Parameter kehrt diese Datei in der ersten Zeile um: kein
 * Element, kein Hoerer, kein Beobachter, kein Takt.
 *
 * Leiste, Berichtskasten und das Kopieren stehen seit dem Abo-Bericht in
 * assets/js/bsport-diagnose-basis.js - diese Datei baut nur noch ihren
 * eigenen Inhalt. Die Grundlage muss davor geladen sein.
 *
 * Die Leiste traegt die Kennungen pt-dom-leiste und pt-dom-bericht.
 * Das ist Absicht: genau die stehen in der Ausnahmeliste der Wache, also
 * kann sie sich nicht selbst fuer einen Dialog halten - ohne dass an der
 * Wache eine Zeile geaendert werden muesste.
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
  var attrZeile    = BASIS.hilfen.attrZeile;

  /* ══════════ KOPIE DER REGELN AUS bsport-dialog-wache.js ══════════
     Wortgetreu. Nur lesend. Nicht veraendern, ohne das Original
     mitzuaendern - sonst misst der Bericht etwas anderes als die Wache
     entscheidet. */
  var BEKANNT = '.bsport-user-interaction-modal__container, .bs-activity--dialog,'
              + ' [class*="bsport-user-interaction-modal"]';
  var SUCHE = '#bs-activity--dialog, [id$="--dialog"],'
            + ' [class*="MuiDialog-root"], [class*="MuiModal-root"],'
            + ' [role="presentation"], [role="dialog"], [role="alertdialog"],'
            + ' [aria-modal="true"]';
  var SUCHE_MAX = 200;
  var FREMD = '#header, .noise, .wa-float, #page-mobile-nav, #mobile-nav,'
            + ' #pt-dom-leiste, #pt-dom-bericht, #pt-touch-debug,'
            + ' [id^="Cybot"], [id^="Cookiebot"], #CookiebotWidget';
  var BODY_KLASSE = 'bsport-modal-open';

  function unsers(el) {
    try {
      if (el.matches && el.matches(FREMD)) return true;
      return !!(el.closest && el.closest(FREMD));
    } catch (e) { return false; }
  }

  /* Wie istDialog in der Wache, nur gibt sie hier Rechenschaft ab:
     welche Bedingung hat entschieden. */
  function urteil(el) {
    if (!el || el.nodeType !== 1) return { ja: false, grund: 'kein Element' };
    if (unsers(el)) return { ja: false, grund: 'steht in der Ausnahmeliste (FREMD)' };
    try {
      if (el.matches && el.matches(BEKANNT)) return { ja: true, grund: 'Klassenname trifft (BEKANNT)' };
      var c = window.getComputedStyle(el);
      if (c.position !== 'fixed') return { ja: false, grund: 'position=' + c.position + ', verlangt fixed' };
      if (c.display === 'none') return { ja: false, grund: 'display: none' };
      if (c.visibility === 'hidden') return { ja: false, grund: 'visibility: hidden' };
      var z = parseInt(c.zIndex, 10);
      if (!(z >= 100)) return { ja: false, grund: 'z-index=' + c.zIndex + ', verlangt >= 100' };
      var r = el.getBoundingClientRect();
      if (r.width < window.innerWidth * 0.5) {
        return { ja: false, grund: 'Breite ' + Math.round(r.width) + ' < halbes Fenster ('
                 + Math.round(window.innerWidth * 0.5) + ')' };
      }
      if (r.height < window.innerHeight * 0.5) {
        return { ja: false, grund: 'Hoehe ' + Math.round(r.height) + ' < halbes Fenster ('
                 + Math.round(window.innerHeight * 0.5) + ')' };
      }
      var rolle = el.getAttribute('role');
      if (rolle === 'dialog' || rolle === 'alertdialog' || rolle === 'presentation') {
        return { ja: true, grund: 'Bauart + role=' + rolle };
      }
      if (el.getAttribute('aria-modal') === 'true') return { ja: true, grund: 'Bauart + aria-modal' };
      if (el.querySelector('[role="dialog"], [role="alertdialog"], [aria-modal="true"]')) {
        return { ja: true, grund: 'Bauart + [role=dialog] darin' };
      }
      return { ja: false, grund: 'Bauart passt, aber keine Dialogrolle (role=' + (rolle || '-')
               + ', aria-modal=' + (el.getAttribute('aria-modal') || '-') + ', kein [role=dialog] darin)' };
    } catch (e) { return { ja: false, grund: 'Fehler: ' + (e && e.message) }; }
  }

  /* Wie offen() in der Wache: Kinder von <body> und deren Kinder, mehr
     nicht. Genau diese Reichweite ist einer der Verdaechtigen. */
  function wacheWuerdeFinden() {
    try {
      var k = document.querySelectorAll(BEKANNT);
      for (var i = 0; i < k.length; i++) {
        if (!unsers(k[i])) {
          var cc = window.getComputedStyle(k[i]);
          if (cc.display !== 'none' && cc.visibility !== 'hidden') {
            return { el: k[i], grund: 'Klassenname trifft (BEKANNT)' };
          }
        }
      }
    } catch (e) { /* weiter */ }
    /* Seit PR #137 sucht die Wache im ganzen Dokument statt die Kinder
       von <body> abzugehen. Die Kopie muss das mitmachen, sonst meldet
       sie "NICHTS", waehrend die Wache laengst zugegriffen hat - genau
       das ist beim Testen passiert und waere im Bericht ein falscher
       Befund gewesen. */
    try {
      var liste = document.querySelectorAll(SUCHE);
      for (var k2 = 0; k2 < liste.length && k2 < SUCHE_MAX; k2++) {
        var u = urteil(liste[k2]);
        if (u.ja) return { el: liste[k2], grund: u.grund };
      }
    } catch (e) { /* weiter */ }
    return null;
  }

  /* ════════════════ ENDE DER KOPIE ════════════════ */

  /* ── Hilfen ──────────────────────────────────────────────────────── */
  function kette(el) {
    var t = [], n = el.parentElement, i = 0;
    while (n && n.tagName !== 'BODY' && i < 10) { t.push(kurz(n)); n = n.parentElement; i++; }
    t.push('body');
    return t.join(' < ');
  }

  function tiefe(el) {
    var n = el, d = 0;
    while (n && n !== document.body && d < 60) { n = n.parentElement; d++; }
    return n === document.body ? d : -1;
  }

  /* Welche Vorfahren bilden einen Stapelkontext, und mit welchem
     z-index? Daran entscheidet sich, ob ein z-index ueberhaupt gegen die
     Kopfleiste antritt oder in einem fremden Kontext gefangen ist. */
  function stapelt(el) {
    var c;
    try { c = window.getComputedStyle(el); } catch (e) { return null; }
    var g = [];
    if (c.position === 'fixed' || c.position === 'sticky') g.push('position:' + c.position);
    if (c.position !== 'static' && c.zIndex !== 'auto') g.push('z-index:' + c.zIndex);
    if (parseFloat(c.opacity) < 1) g.push('opacity:' + c.opacity);
    if (c.transform && c.transform !== 'none') g.push('transform');
    if (c.filter && c.filter !== 'none') g.push('filter');
    if (c.perspective && c.perspective !== 'none') g.push('perspective');
    if (c.isolation === 'isolate') g.push('isolation');
    if (c.mixBlendMode && c.mixBlendMode !== 'normal') g.push('mix-blend-mode');
    if (c.willChange && /transform|opacity|filter/.test(c.willChange)) g.push('will-change:' + c.willChange);
    if (c.contain && /paint|layout|strict|content/.test(c.contain)) g.push('contain:' + c.contain);
    return g.length ? { g: g.join(' '), z: c.zIndex } : null;
  }

  function stapelKette(el) {
    var t = [], n = el, i = 0;
    while (n && n !== document.documentElement && i < 14) {
      var s = stapelt(n);
      if (s) t.push(kurz(n) + ' {' + s.g + '}');
      n = n.parentElement; i++;
    }
    return t.length ? t.join('\n        < ') : '(keiner)';
  }

  function masse(el) {
    var c, r;
    try { c = window.getComputedStyle(el); r = el.getBoundingClientRect(); }
    catch (e) { return 'nicht lesbar'; }
    return 'rect l=' + Math.round(r.left) + ' t=' + Math.round(r.top)
         + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height)
         + '  position=' + c.position + ' z-index=' + c.zIndex
         + ' display=' + c.display + ' visibility=' + c.visibility
         + ' opacity=' + c.opacity + ' pointer-events=' + c.pointerEvents;
  }

  /* Alle Elemente einsammeln - auch aus offenen Schattenwurzeln und aus
     gleichherkuenftigen iframes. Bsport koennte seinen Dialog in beidem
     verstecken, und dann faende ihn kein querySelectorAll des
     Hauptdokuments. */
  function alleElemente() {
    var aus = [];
    function gehe(wurzel, herkunft, tiefeRest) {
      if (!wurzel || tiefeRest < 0) return;
      var liste;
      try { liste = wurzel.querySelectorAll('*'); } catch (e) { return; }
      for (var i = 0; i < liste.length && i < 6000; i++) {
        var el = liste[i];
        aus.push({ el: el, herkunft: herkunft });
        if (el.shadowRoot) gehe(el.shadowRoot, herkunft + ' > shadow(' + kurz(el) + ')', tiefeRest - 1);
        if (el.tagName === 'IFRAME') {
          var d = null;
          try { d = el.contentDocument; } catch (e) { d = null; }
          if (d) gehe(d, herkunft + ' > iframe(' + kurz(el) + ')', tiefeRest - 1);
        }
      }
    }
    gehe(document, 'Hauptdokument', 3);
    return aus;
  }

  function interessant(el) {
    var c, r;
    try { c = window.getComputedStyle(el); r = el.getBoundingClientRect(); }
    catch (e) { return false; }
    if (c.display === 'none' || c.visibility === 'hidden') return false;
    var flaeche = (r.width * r.height) / (window.innerWidth * window.innerHeight);
    if ((c.position === 'fixed' || c.position === 'sticky') && flaeche > 0.15) return true;
    var name = (el.id + ' ' + vollKlasse(el));
    if (r.width < 1 || r.height < 1) return false;
    return /dialog|modal|bs-|bsport|Mui|overlay|backdrop/i.test(name);
  }

  /* ── Mitschnitt: wann wechselt die Klasse an <body>? ─────────────── */
  var KLASSE_MAX = 10;
  var klassenLog = [];
  var letzteKlasse = null;

  function klasseMerken() {
    var jetzt = document.body.classList.contains(BODY_KLASSE);
    if (jetzt === letzteKlasse) return;
    letzteKlasse = jetzt;
    var f = wacheWuerdeFinden();
    klassenLog.push({
      zeit: new Date().toLocaleTimeString('de-DE'),
      an: jetzt,
      kandidat: f ? kurz(f.el) : '(keiner)',
      grund: f ? f.grund : 'die Kopie der Regeln findet nichts',
      tiefe: f ? tiefe(f.el) : -1
    });
    if (klassenLog.length > KLASSE_MAX) klassenLog.shift();
  }

  /* ── Der Bericht ─────────────────────────────────────────────────── */
  function dialogWurzel() {
    /* Was WIR fuer den Dialog halten - absichtlich grosszuegiger als die
       Wache, damit der Bericht ihn auch dann beschreibt, wenn die Wache
       ihn verfehlt. */
    var treffer = null, groesste = 0;
    var alle = alleElemente();
    for (var i = 0; i < alle.length; i++) {
      var el = alle[i].el;
      if (unsers(el)) continue;
      var c, r;
      try { c = window.getComputedStyle(el); r = el.getBoundingClientRect(); } catch (e) { continue; }
      if (c.display === 'none' || c.visibility === 'hidden') continue;
      var name = el.id + ' ' + vollKlasse(el);
      var rolle = el.getAttribute('role');
      var dialogartig = /dialog|modal/i.test(name) || rolle === 'dialog'
        || rolle === 'alertdialog' || el.getAttribute('aria-modal') === 'true';
      if (!dialogartig) continue;
      var f = r.width * r.height;
      if (f > groesste) { groesste = f; treffer = el; }
    }
    return treffer;
  }

  function papier(wurzel) {
    if (!wurzel) return null;
    var wr = wurzel.getBoundingClientRect();
    var d = wurzel.querySelector('[role="dialog"], [class*="Paper"], [class*="paper"]');
    if (d && d !== wurzel) return d;
    var k = wurzel.querySelectorAll('*');
    for (var i = 0; i < k.length && i < 300; i++) {
      var r = k[i].getBoundingClientRect();
      if (r.width < 100 || r.height < 100) continue;
      if (r.height <= wr.height * 0.95 || r.width <= wr.width * 0.95) return k[i];
    }
    return null;
  }

  function punkte(x, y, name, z) {
    var l = [];
    try { l = document.elementsFromPoint(x, y) || []; } catch (e) {}
    z.push('  ' + name + '  (' + Math.round(x) + ', ' + Math.round(y) + ')');
    if (!l.length) { z.push('    nichts'); return; }
    for (var i = 0; i < l.length && i < 10; i++) z.push('    ' + (i + 1) + '. ' + kurz(l[i]));
  }

  /* ══════════ BUTTONS UND LABELS ══════════
     Die Buchungsknoepfe im Widget sollen golden werden. Bevor dafuer
     eine Regel geschrieben wird, muss klar sein, WELCHES Element den
     sichtbaren Knopf zeichnet.

     Die Falle: in der Kursliste ist die ganze KARTE selbst ein
     <button> (button#bs-offer-list-item::offer_id-...). Eine Regel wie
     "alle Knoepfe im Widget" faerbte damit ganze Karten golden. Deshalb
     wird hier nicht nach Knoepfen gesucht, sondern nach BESCHRIFTUNGEN -
     und zu jeder Beschriftung die Kette nach oben mitgeschrieben, samt
     der Frage, welcher Vorfahr ein Knopf ist und welchen Hintergrund er
     zeichnet.

     MUI-Klassen tragen laufende Nummern (MuiButton-root-575, jss571).
     Der Bericht trennt deshalb die stabil aussehenden Teile ab - alles
     ohne angehaengte Ziffernfolge, vor allem die bs-...-Namen. Nur auf
     die darf eine spaetere Regel sich stuetzen. */
  var LABELS = ['BUCHEN', 'JETZT BUCHEN', 'WEITER', 'ANMELDEN', 'REGISTRIEREN',
                'EINLOGGEN', 'LOGIN', 'BESTÄTIGEN', 'SCHLIESSEN', 'ABBRECHEN',
                'ZURÜCK', 'SPEICHERN', 'KAUFEN', 'ZAHLEN'];
  var LABEL_MAX = 40;

  function istKnopf(el) {
    try {
      return el.tagName === 'BUTTON' || el.tagName === 'A'
          || el.getAttribute('role') === 'button';
    } catch (e) { return false; }
  }

  function stile(el) {
    var c;
    try { c = window.getComputedStyle(el); } catch (e) { return 'nicht lesbar'; }
    var rand = [c.borderTopWidth + ' ' + c.borderTopStyle + ' ' + c.borderTopColor,
                c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].join(' / ');
    return [
      'color=' + c.color,
      'background-color=' + c.backgroundColor,
      'background-image=' + (c.backgroundImage === 'none' ? 'none' : c.backgroundImage.slice(0, 60)),
      'border=' + rand,
      'border-radius=' + c.borderRadius,
      'font=' + c.fontFamily.split(',')[0] + ' ' + c.fontSize + ' ' + c.fontWeight,
      'letter-spacing=' + c.letterSpacing,
      'text-transform=' + c.textTransform,
      'text-align=' + c.textAlign,
      'padding=' + c.padding,
      'min-height=' + c.minHeight,
      'cursor=' + c.cursor,
      'opacity=' + c.opacity
    ].join('  ');
  }

  /* Begehung eines Baumes, die in offene Shadow Roots hineingeht.
     Bsport nutzt heute keine, der Bericht soll es aber melden statt
     stillschweigend daran vorbeizulaufen. Der Deckel haelt die Begehung
     bei sehr grossen Baeumen kurz; wird er erreicht, steht es im Bericht. */
  var SCAN_MAX = 6000;
  var TIEF_MAX = 60;

  /* Abstieg in Dokumentreihenfolge. Der Inhalt eines offenen Shadow Roots
     kommt direkt hinter seinen Wirt, dort steht er auch auf dem Schirm. */
  function tiefGehen(n, aus, z, tief) {
    if (z.gedeckelt || tief > TIEF_MAX) return;
    var kinder;
    try { kinder = n.children; } catch (e) { return; }
    for (var i = 0; i < kinder.length; i++) {
      if (aus.length >= SCAN_MAX) { z.gedeckelt = true; return; }
      var k = kinder[i];
      aus.push(k);
      try {
        if (k.shadowRoot) { z.shadow++; tiefGehen(k.shadowRoot, aus, z, tief + 1); }
      } catch (e) { /* geschlossen oder nicht lesbar */ }
      tiefGehen(k, aus, z, tief + 1);
    }
  }

  function sammleElemente(wurzel) {
    var aus = [], z = { shadow: 0, gedeckelt: false };
    tiefGehen(wurzel, aus, z, 0);
    return { liste: aus, shadow: z.shadow, gedeckelt: z.gedeckelt };
  }

  /* Alles im Widget - und, falls der Dialog ausserhalb des Mountpunkts
     haengt, auch dort. */
  function knopfQuellen() {
    var q = [];
    var w = document.getElementById('bsport-widget-172485');
    if (w) q.push({ wurzel: w, woher: 'Widget' });
    var d = dialogWurzel();
    if (d && (!w || !w.contains(d))) q.push({ wurzel: d, woher: 'Dialog (ausserhalb des Widgets)' });
    return q;
  }

  function umfeld(el, grenze) {
    /* Dialog zuerst: liegt die Beschriftung in einem Dialog, zaehlt das,
       auch wenn sie zugleich im Widget haengt. */
    var n = el, i = 0;
    while (n && i < 24) {
      try {
        var r = n.getAttribute && n.getAttribute('role');
        if (r === 'dialog' || r === 'alertdialog') return 'Dialog';
        var k = vollKlasse(n);
        if (/MuiDialog/.test(k) || (n.id && /--dialog$/.test(n.id))) return 'Dialog';
        if (/bs-offer-list-item/.test(k) || (n.id && /bs-offer-list-item/.test(n.id))) {
          return 'Karte in der Liste';
        }
      } catch (e) { /* weiter */ }
      if (n === grenze) break;
      n = n.parentElement; i++;
    }
    return 'anderes';
  }

  function knopfAbschnitt(z) {
    function s(t) { z.push(t); }
    s('');
    s('BUTTONS UND LABELS');
    var quellen = knopfQuellen();
    if (!quellen.length) {
      s('  Kein Widget und kein Dialog gefunden.');
      return;
    }
    s('  Durchsucht: ' + quellen.map(function (q) { return q.woher; }).join(' + '));

    var funde = [], gesehen = [], shadow = 0, gedeckelt = false, besucht = 0;
    for (var q = 0; q < quellen.length; q++) {
      var g = sammleElemente(quellen[q].wurzel);
      var liste = g.liste;
      shadow += g.shadow;
      if (g.gedeckelt) gedeckelt = true;
      besucht += liste.length;
      for (var i = 0; i < liste.length && funde.length < LABEL_MAX; i++) {
        var el = liste[i];
        if (gesehen.indexOf(el) !== -1) continue;
        /* Erst der Text: billig, und er siebt fast alles aus. Der
           Stil wird nur fuer die Treffer gelesen, sonst kostete ein
           Klick auf DIAGNOSE tausende Layout-Abfragen. */
        var t = eigenerText(el);
        if (!t || t.length > 40) continue;
        var oben = t.toUpperCase();
        var treffer = LABELS.indexOf(oben) !== -1;
        /* Dazu: jeder Knopf, dessen eigener Text ein kurzes einzelnes
           Wort ist. Faengt Beschriftungen, die oben fehlen. <button>
           zaehlt mit, es ist von sich aus role=button. */
        if (!treffer && t.length <= 20 && t.indexOf(' ') === -1
            && (el.tagName === 'BUTTON'
                || (el.getAttribute && el.getAttribute('role') === 'button'))) {
          treffer = true;
        }
        if (!treffer) continue;
        var c;
        try { c = window.getComputedStyle(el); } catch (e) { continue; }
        if (c.display === 'none' || c.visibility === 'hidden') continue;
        gesehen.push(el);
        funde.push({ el: el, text: t, grenze: quellen[q].wurzel });
      }
    }

    s('  ' + besucht + ' Elemente durchgegangen'
      + (gedeckelt ? ' (Begehungsdeckel ' + SCAN_MAX + ' erreicht)' : '')
      + ', Shadow Roots: ' + shadow);
    s('  ' + funde.length + ' Beschriftung(en)'
      + (funde.length >= LABEL_MAX ? ' (Deckel ' + LABEL_MAX + ' erreicht)' : ''));
    if (!funde.length) {
      s('  Nichts gefunden. Zeigt der Kalender schon Kurse? Ist ein Dialog offen?');
      return;
    }

    for (var f = 0; f < funde.length; f++) {
      var e2 = funde[f].el;
      var r2;
      try { r2 = e2.getBoundingClientRect(); } catch (e) { r2 = { left: 0, top: 0, width: 0, height: 0 }; }
      s('');
      s('  [' + (f + 1) + '] "' + funde[f].text + '"   Umfeld: ' + umfeld(e2, funde[f].grenze));
      s('      <' + e2.tagName.toLowerCase() + '>'
        + (idKurz(e2) ? '  id=' + idKurz(e2) : '')
        + '  role=' + (e2.getAttribute('role') || '-')
        + '  type=' + (e2.getAttribute('type') || '-')
        + '  disabled=' + (e2.hasAttribute && e2.hasAttribute('disabled') ? 'ja' : 'nein'));
      s('      class="' + vollKlasse(e2) + '"');
      s('      stabil: ' + stabileTeile(e2));
      s('      rect l=' + Math.round(r2.left) + ' t=' + Math.round(r2.top)
        + ' w=' + Math.round(r2.width) + ' h=' + Math.round(r2.height));
      s('      ' + stile(e2));
      /* Kette nach oben, bis zur Grenze, mit Knopfmarkierung. */
      s('      Kette nach oben:');
      var n2 = e2.parentElement, tief = 0, naechsterKnopf = null, knopfZahl = 0;
      if (istKnopf(e2)) { naechsterKnopf = e2; knopfZahl++; }
      while (n2 && tief < 12) {
        var k2 = istKnopf(n2);
        if (k2) knopfZahl++;
        if (k2 && !naechsterKnopf) naechsterKnopf = n2;
        /* Der Hintergrund JEDES Vorfahren, nicht nur des naechsten Knopfes.
           Der Buchungsblock in der Kursliste (div.bs-book-button-card) ist
           kein Knopf, sondern ein div - seine Flaeche stuende sonst in
           keiner Zeile des Berichts, und genau sie ist die goldene. */
        var hg2 = '?';
        try { hg2 = window.getComputedStyle(n2).backgroundColor; } catch (e) {}
        s('        ' + (k2 ? '[KNOPF] ' : '        ')
          + n2.tagName.toLowerCase() + (idKurz(n2) ? '#' + idKurz(n2) : '')
          + '  class="' + vollKlasse(n2).slice(0, 80) + '"'
          + '  bg=' + hg2
          + '  stabil: ' + stabileTeile(n2));
        if (n2 === funde[f].grenze) break;
        n2 = n2.parentElement; tief++;
      }
      /* Die Zahl ist der Warnhinweis fuer die spaetere Regel: steht hier
         mehr als 1, haengt die Beschriftung in einem Knopf, der selbst in
         einem Knopf steckt - die ganze Karte. Eine Regel darf dann nur den
         innersten treffen. */
      s('      Knoepfe in der Kette (die Beschriftung mitgezaehlt): ' + knopfZahl
        + (knopfZahl > 1 ? '   << ACHTUNG: Knopf im Knopf' : ''));
      if (naechsterKnopf) {
        var ck;
        try { ck = window.getComputedStyle(naechsterKnopf); } catch (e) { ck = null; }
        s('      Naechster Knopf in der Kette: '
          + naechsterKnopf.tagName.toLowerCase()
          + (idKurz(naechsterKnopf) ? '#' + idKurz(naechsterKnopf) : '')
          + '  disabled=' + (naechsterKnopf.hasAttribute
              && naechsterKnopf.hasAttribute('disabled') ? 'ja' : 'nein')
          + (naechsterKnopf === e2 ? '  (die Beschriftung SELBST ist der Knopf)' : ''));
        if (ck) {
          s('        background-color=' + ck.backgroundColor
            + '  background-image=' + (ck.backgroundImage === 'none' ? 'none' : 'gesetzt')
            + '  border=' + ck.borderTopWidth + ' ' + ck.borderTopStyle + ' ' + ck.borderTopColor
            + '  border-radius=' + ck.borderRadius);
        }
      } else {
        s('      Kein Knopf in der Kette - die Flaeche zeichnet etwas anderes.');
      }
    }
  }

  /* ══════════ MODAL RAHMEN ══════════
     Der Schritt "Neuen Kurspass kaufen" zeigt drei Fehler, und sie haben
     nicht dieselbe Ursache:

       1. Die Reiterzeile liegt ueber der Ueberschrift, die unten
          abgeschnitten ist. Darueber ein leeres Band mit dem X.
       2. Die ganze Flaeche wirkt koernig und ausgewaschen.
       3. Der Knopf "Alle Produkte ansehen" ist unten abgeschnitten.

     DIE TRENNLINIE IST DIE HERKUNFT
     Was in Bsports eigenem Rahmen steht, koennen wir nicht anfassen -
     weder mit CSS noch mit JS, der Browser laesst es nicht zu. Was in
     UNSEREM Dokument darueber liegt, koennen wir sehr wohl anfassen.
     Dieser Abschnitt zieht genau diese Linie, statt sie zu raten.

     WARUM .noise NICHT IN elementsFromPoint AUFTAUCHT
     Die Rauschschicht traegt pointer-events: none. Solche Elemente
     liefert elementsFromPoint grundsaetzlich nicht mit - sie sind fuer
     die Treffersuche durchsichtig. Ihr Fehlen in der Liste ist also
     KEIN Beleg dafuer, dass sie unter dem Modal laege. Entschieden wird
     das ueber den Stapelkontext, und zum Nachsehen mit eigenen Augen
     gibt es den Knopf RAUSCHEN AUS. */
  var MODAL_SUCHE = '.bsport-user-interaction-modal__container,'
                  + ' [class*="bsport-user-interaction-modal__container"]';

  function zahlZ(c) {
    /* z-index als Zahl. auto zaehlt bei positionierten Elementen wie 0. */
    if (!c) return 0;
    var n = parseInt(c.zIndex, 10);
    return isNaN(n) ? 0 : n;
  }

  /* Der naechste Vorfahr, der einen Stapelkontext aufmacht. Nur innerhalb
     DESSELBEN Kontextes sagt ein Vergleich zweier z-index etwas aus. */
  function stapelWurzel(el) {
    var n = el.parentElement;
    while (n && n !== document.documentElement) {
      if (stapelt(n)) return n;
      n = n.parentElement;
    }
    return document.documentElement;
  }

  function malUrteil(oben, unten) {
    if (!oben || !unten) return 'nicht zu beurteilen, ein Element fehlt';
    var wo, wu, co, cu;
    try {
      wo = stapelWurzel(oben); wu = stapelWurzel(unten);
      co = window.getComputedStyle(oben); cu = window.getComputedStyle(unten);
    } catch (e) { return 'nicht lesbar'; }
    if (wo !== wu) {
      return 'verschiedene Stapelkontexte (' + kurz(wo) + ' gegen ' + kurz(wu)
           + ') - ein z-index-Vergleich sagt hier nichts';
    }
    var zo = zahlZ(co), zu = zahlZ(cu);
    if (zo === zu) return 'gleicher z-index (' + zo + '), es entscheidet die Reihenfolge im Dokument';
    return zo > zu
      ? 'RAUSCHEN LIEGT DARUEBER (z-index ' + zo + ' gegen ' + zu + ', gleicher Kontext)'
      : 'Rauschen liegt darunter (z-index ' + zo + ' gegen ' + zu + ')';
  }

  function quelle(rahmen) {
    var src = rahmen.getAttribute('src');
    if (!src) return rahmen.hasAttribute('srcdoc') ? '(srcdoc, kein src)' : '(kein src)';
    /* Nur Host und Pfad. Eine Abfrage kann Kennungen tragen und hat in
       einem Bericht nichts verloren, der verschickt wird. */
    try {
      var u = new URL(src, window.location.href);
      return u.host + u.pathname;
    } catch (e) { return '(nicht lesbar)'; }
  }

  function innenDok(rahmen) {
    var d = null;
    try { d = rahmen.contentDocument; } catch (e) { d = null; }
    if (d) return { d: d, text: 'zugaenglich (gleiche Herkunft)' };
    var h = '?';
    try { h = new URL(rahmen.getAttribute('src') || '', window.location.href).host; } catch (e) {}
    return { d: null, text: 'gesperrt (fremde Herkunft: ' + (h || 'unbekannt') + ')' };
  }

  function kastenZeile(el) {
    var c, r;
    try { c = window.getComputedStyle(el); r = el.getBoundingClientRect(); }
    catch (e) { return 'nicht lesbar'; }
    return 'rect l=' + Math.round(r.left) + ' t=' + Math.round(r.top)
         + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height)
         + '  position=' + c.position + '  z-index=' + c.zIndex
         + '  overflow=' + c.overflowX + '/' + c.overflowY
         + '  max-height=' + c.maxHeight + '  height=' + c.height
         + '  transform=' + (c.transform === 'none' ? 'none' : c.transform.slice(0, 40));
  }

  /* Punkt 4: nur falls der Rahmen wider Erwarten gleichherkuenftig ist. */
  function innenMessen(d, z) {
    function zeile(name, el) {
      if (!el) { z.push('      ' + name + ': nicht gefunden'); return; }
      var c = d.defaultView.getComputedStyle(el);
      var r = el.getBoundingClientRect();
      z.push('      ' + name + ': ' + kurz(el));
      z.push('        rect l=' + Math.round(r.left) + ' t=' + Math.round(r.top)
        + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height)
        + '  position=' + c.position + '  overflow=' + c.overflowX + '/' + c.overflowY
        + '  line-height=' + c.lineHeight + '  margin=' + c.margin + '  padding=' + c.padding);
    }
    var reiter = null, ueber = null;
    try {
      reiter = d.querySelector('[role="tablist"]');
      if (!reiter) {
        var alle = d.querySelectorAll('*');
        for (var i = 0; i < alle.length && i < 4000; i++) {
          var t = eigenerText(alle[i]);
          if (/^(Empfehlungen|Alle|Verträge|Kurspässe)$/i.test(t)) {
            reiter = alle[i].parentElement; break;
          }
        }
      }
      var k = d.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="Title"]');
      for (var j = 0; j < k.length; j++) {
        if (/kursp/i.test(k[j].textContent || '')) { ueber = k[j]; break; }
      }
      if (!ueber) ueber = k[0] || null;
    } catch (e) { z.push('      (Innenmessung fehlgeschlagen: ' + (e && e.message) + ')'); return; }
    z.push('    GLEICHE HERKUNFT - Innenmessung moeglich:');
    zeile('Reiterzeile', reiter);
    zeile('Ueberschrift', ueber);
  }

  function modalAbschnitt(z) {
    function s(t) { z.push(t); }
    s('');
    s('MODAL RAHMEN');

    var vv = window.visualViewport;
    s('  Fenster: innerWidth=' + window.innerWidth + ' innerHeight=' + window.innerHeight
      + '  visualViewport=' + (vv ? Math.round(vv.width) + 'x' + Math.round(vv.height)
                                    + ' (scale ' + (Math.round(vv.scale * 1000) / 1000) + ')'
                                  : 'nicht vorhanden'));

    var rausch = document.querySelector('.noise');
    s('');
    s('  RAUSCHSCHICHT .noise: ' + (rausch ? kurz(rausch) : 'nicht vorhanden'));
    if (rausch) {
      s('    ' + kastenZeile(rausch));
      var cr = window.getComputedStyle(rausch);
      s('    opacity=' + cr.opacity + '  pointer-events=' + cr.pointerEvents
        + '  display=' + cr.display
        + '  Tiefe unter body: ' + tiefe(rausch));
      s('    Stapelkette: ' + stapelKette(rausch));
    }

    var beh = null;
    try { beh = document.querySelector(MODAL_SUCHE); } catch (e) {}
    s('');
    if (!beh) {
      s('  BEHAELTER .bsport-user-interaction-modal__container: NICHT GEFUNDEN.');
      s('  Ist der Schritt "Neuen Kurspass kaufen" wirklich offen?');
      return;
    }
    s('  BEHAELTER: ' + kurz(beh));
    s('    class="' + vollKlasse(beh) + '"');
    s('    stabil: ' + stabileTeile(beh));
    s('    ' + kastenZeile(beh));
    s('    Tiefe unter body: ' + tiefe(beh));
    s('    Stapelkette: ' + stapelKette(beh));

    /* Das Urteil, auf das es ankommt. */
    s('');
    s('  LIEGT DAS RAUSCHEN UEBER DEM MODAL?');
    s('    ' + malUrteil(rausch, beh));
    s('    (.noise hat pointer-events:none und kann in der Trefferliste unten');
    s('     gar nicht erscheinen. Zum Nachsehen: Knopf RAUSCHEN AUS.)');

    var br = beh.getBoundingClientRect();
    var sichtbar = Math.max(0, Math.min(br.bottom, window.innerHeight) - Math.max(br.top, 0));
    s('');
    s('  Sichtbare Hoehe des Behaelters: ' + Math.round(sichtbar) + 'px'
      + ' (von ' + Math.round(br.height) + 'px Gesamthoehe)');

    var rahmen = [];
    try { rahmen = beh.querySelectorAll('iframe'); } catch (e) {}
    s('  iframes im Behaelter: ' + rahmen.length);
    for (var i = 0; i < rahmen.length && i < 5; i++) {
      var f = rahmen[i];
      var fr = f.getBoundingClientRect();
      s('');
      s('    [' + (i + 1) + '] ' + kurz(f));
      s('        class="' + vollKlasse(f) + '"');
      s('        stabil: ' + stabileTeile(f));
      s('        ' + kastenZeile(f));
      s('        src (nur Host und Pfad): ' + quelle(f));
      s('        sandbox=' + (f.getAttribute('sandbox') === null ? '(nicht gesetzt)' : '"' + f.getAttribute('sandbox') + '"')
        + '  scrolling=' + (f.getAttribute('scrolling') || '(nicht gesetzt)')
        + '  allow=' + (f.getAttribute('allow') || '(nicht gesetzt)'));
      var inn = innenDok(f);
      s('        contentDocument: ' + inn.text);
      var zuviel = Math.round(fr.height - sichtbar);
      s('        Hoehenvergleich: Rahmen ' + Math.round(fr.height) + 'px gegen sichtbare'
        + ' Behaelterhoehe ' + Math.round(sichtbar) + 'px -> '
        + (zuviel > 1 ? zuviel + 'px RAGEN HINAUS' : 'passt'));
      if (inn.d) innenMessen(inn.d, z);
    }

    s('');
    s('  ELEMENTE AM PUNKT (ohne pointer-events:none, also ohne .noise)');
    punkte(br.left + br.width / 2, br.top + br.height / 2, 'Mitte des Behaelters', z);
    punkte(br.left + br.width / 2, Math.min(br.bottom, window.innerHeight) - 2,
           'Unterkante des Behaelters', z);
  }

  function machBericht() {
    var z = [];
    function s(t) { z.push(t); }
    var iw = window.innerWidth, ih = window.innerHeight;

    s('PTDOM DIALOG  ' + new Date().toLocaleTimeString('de-DE'));
    s('  Seite ' + window.location.pathname);
    s('  Fenster ' + iw + 'x' + ih + '  scroll ' + Math.round(window.scrollX) + '/'
      + Math.round(window.scrollY) + '  dpr ' + (window.devicePixelRatio || 1));
    s('  ptfix: ' + (/[?&]ptfix=1/.test(window.location.search) ? 'AN (alter Weg)' : 'aus'));
    s('  UA  ' + navigator.userAgent);

    s('');
    s('BODY UND KOPFLEISTE');
    s('  body class="' + (document.body.className || '-') + '"');
    s('  ' + BODY_KLASSE + ' gesetzt: ' + (document.body.classList.contains(BODY_KLASSE) ? 'JA' : 'NEIN'));
    s('  body style position=' + (document.body.style.position || '-')
      + ' top=' + (document.body.style.top || '-')
      + ' overflow=' + (document.body.style.overflow || '-'));
    var kopf = document.getElementById('header');
    if (!kopf) { s('  #header nicht gefunden.'); }
    else {
      s('  #header  ' + masse(kopf));
      s('  #header Stapelkontexte:');
      s('        ' + stapelKette(kopf));
    }

    s('');
    s('WACHE');
    var skript = document.querySelector('script[src*="bsport-dialog-wache"]');
    s('  Modul eingebunden: ' + (skript ? 'JA (' + skript.getAttribute('src') + ')' : 'NEIN'));
    var f = wacheWuerdeFinden();
    s('  Die Kopie der Regeln findet gerade: ' + (f ? kurz(f.el) : 'NICHTS'));
    if (f) s('    Grund: ' + f.grund + '   Tiefe unter body: ' + tiefe(f.el));
    s('  Letzte ' + KLASSE_MAX + ' Wechsel der Klasse an <body>:');
    if (!klassenLog.length) s('    keiner seit dem Seitenaufruf.');
    for (var q = 0; q < klassenLog.length; q++) {
      var e2 = klassenLog[q];
      s('    [' + (q + 1) + '] ' + e2.zeit + '  ' + (e2.an ? 'AN ' : 'AUS')
        + '  Kandidat: ' + e2.kandidat + '  (Tiefe ' + e2.tiefe + ')');
      s('        ' + e2.grund);
    }

    /* ── Was es alles gibt ── */
    s('');
    s('FESTE EBENEN UND DIALOGVERDAECHTIGE');
    s('  (fixed/sticky mit mehr als 15% Fensterflaeche, oder Name mit');
    s('   dialog/modal/bs-/bsport/Mui/overlay/backdrop, und sichtbar)');
    var alle = alleElemente();
    var treffer = [];
    for (var i = 0; i < alle.length; i++) {
      if (interessant(alle[i].el)) treffer.push(alle[i]);
    }
    s('  ' + treffer.length + ' gefunden' + (treffer.length > 40 ? ', die ersten 40' : ''));
    for (var t = 0; t < treffer.length && t < 40; t++) {
      var el = treffer[t].el;
      var u = urteil(el);
      s('');
      s('  [' + (t + 1) + '] ' + kurz(el) + '   (' + treffer[t].herkunft + ')');
      s('      class="' + vollKlasse(el) + '"');
      s('      role=' + (el.getAttribute('role') || '-')
        + '  aria-modal=' + (el.getAttribute('aria-modal') || '-')
        + '  aria-label=' + (el.getAttribute('aria-label') || '-'));
      s('      ' + masse(el));
      s('      Tiefe unter body: ' + tiefe(el));
      s('      Kette: ' + kette(el));
      s('      Stapelkontexte:');
      s('        ' + stapelKette(el));
      s('      URTEIL DER WACHE: ' + (u.ja ? 'DIALOG' : 'kein Dialog') + ' - ' + u.grund);
    }

    knopfAbschnitt(z);
    modalAbschnitt(z);

    /* ── Treffer unter dem Finger ── */
    s('');
    s('ELEMENTS FROM POINT (von oben nach unten)');
    var kr = kopf ? kopf.getBoundingClientRect() : { bottom: 0, height: 0, left: 0, width: iw };
    var wurzel = dialogWurzel();
    var pap = papier(wurzel);
    punkte(iw / 2, ih / 2, 'Fenstermitte', z);
    punkte(iw / 2, Math.round(kr.bottom) + 4, 'knapp unter der Kopfleiste', z);
    punkte(iw / 2, Math.round(kr.height / 2), 'Mitte der Kopfleiste', z);
    if (pap) {
      var pr = pap.getBoundingClientRect();
      punkte(pr.left + 6, pr.top + 6, 'linke obere Ecke des Dialogpapiers', z);
    } else {
      s('  linke obere Ecke des Dialogpapiers: kein Papier gefunden');
    }

    /* ── Der Dialog selbst ── */
    s('');
    s('DIALOG');
    if (!wurzel) {
      s('  Keine Dialogwurzel gefunden. Ist der Dialog offen?');
    } else {
      s('  Wurzel: ' + kurz(wurzel));
      s('    class="' + vollKlasse(wurzel) + '"');
      s('    ' + masse(wurzel));
      s('    Tiefe unter body: ' + tiefe(wurzel));
      s('    Kette: ' + kette(wurzel));
      var uw = urteil(wurzel);
      s('    URTEIL DER WACHE: ' + (uw.ja ? 'DIALOG' : 'kein Dialog') + ' - ' + uw.grund);
      s('');
      s('  Markup, zwei Ebenen, nur Attribute (kein Text, keine Daten):');
      s('    ' + attrZeile(wurzel));
      try {
        for (var a = 0; a < wurzel.children.length && a < 8; a++) {
          var k1 = wurzel.children[a];
          s('      ' + attrZeile(k1));
          for (var b2 = 0; b2 < k1.children.length && b2 < 8; b2++) {
            s('        ' + attrZeile(k1.children[b2]));
          }
        }
      } catch (e) { s('    (Markup nicht lesbar: ' + (e && e.message) + ')'); }

      s('');
      if (!pap) { s('  Kein Dialogpapier gefunden.'); }
      else {
        var pr2 = pap.getBoundingClientRect();
        s('  Papier: ' + kurz(pap));
        s('    ' + masse(pap));
        var abstand = Math.round(pr2.top - kr.bottom);
        s('    Papieroberkante ' + Math.round(pr2.top)
          + '  Kopfleistenunterkante ' + Math.round(kr.bottom)
          + '  Abstand ' + abstand + 'px'
          + (abstand < 0 ? '   << VERDECKT' : '   (frei)'));
      }
      var rahmen = wurzel.querySelectorAll('iframe');
      s('');
      s('  iframes im Dialog: ' + rahmen.length);
      for (var r2 = 0; r2 < rahmen.length && r2 < 5; r2++) {
        var lesbar = false;
        try { lesbar = !!rahmen[r2].contentDocument; } catch (e) { lesbar = false; }
        s('    ' + (r2 + 1) + '. ' + kurz(rahmen[r2]) + '  src=' + (rahmen[r2].getAttribute('src') || '(srcdoc/leer)')
          + '  contentDocument lesbar: ' + lesbar);
      }
    }
    return z.join('\n');
  }

  /* ── Verdrahtung ─────────────────────────────────────────────────── */
  var mo = null;

  BASIS.leisteBauen({
    bericht: machBericht,
    zusatz: [{
      /* Die Rauschschicht zum Vergleich abschalten. Nur fuer das Auge, nichts
         wird gemerkt: beim naechsten Laden ist sie wieder da. Geschaltet wird
         die Anzeige am Element selbst, damit an style.css keine Zeile
         angefasst werden muss. */
      text: 'RAUSCHEN AUS',
      klick: function (b) {
        var n = document.querySelector('.noise');
        if (!n) { b.textContent = 'KEIN RAUSCHEN';
          setTimeout(function () { b.textContent = 'RAUSCHEN AUS'; }, 1800); return; }
        var aus = n.style.display === 'none';
        n.style.display = aus ? '' : 'none';
        b.textContent = aus ? 'RAUSCHEN AUS' : 'RAUSCHEN AN';
      }
    }],
    beimStart: function () {
      letzteKlasse = document.body.classList.contains(BODY_KLASSE);
      /* Nur die Klasse an <body> wird beobachtet - ein schmaler Hoerer, der
         das Gemessene nicht stoert. */
      mo = new MutationObserver(klasseMerken);
      mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    },
    beimSchliessen: function () {
      if (mo) { try { mo.disconnect(); } catch (e) {} }
    }
  });

}());

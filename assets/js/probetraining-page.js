/* Bomaye Gym — Probetraining als eigene Seite
 *
 * WARUM ES DIESE DATEI GIBT (statt probetraining-modal.js)
 *
 * Das Probetraining lag bis hierher in einem eigenen Overlay: ein fest
 * positionierter Kasten mit eigener Scroll-Flaeche, dazu eine Sperre des
 * Seiten-Scrollens (body { position: fixed; overflow: hidden }).
 *
 * ACHTUNG, HIER STAND JAHRELANG ETWAS FALSCHES:
 * "Bsport haengt sein Anmeldeformular NICHT in den Container, den wir ihm
 * geben, sondern rendert es als direktes Kind von <body>." Das galt fuer den
 * alten Dialog (.bsport-user-interaction-modal__container). Der Geraetetest
 * zu PR #90 hat die vollstaendige Kette geliefert, und heute liegt das
 * Formular MITTEN IN #pt-cal-view - in unserem eigenen Container. Aus der
 * falschen Annahme folgte zweimal hintereinander eine Erkennung, die genau
 * dort nicht hingesehen hat.
 *
 * Deshalb wird der Dialog jetzt weder ueber seinen Namen noch ueber seinen
 * Ort gesucht, sondern ueber seine Bauart: fest positioniert, nicht von uns,
 * mit sichtbarem Inhalt. Einzelheiten beim Abschnitt "BSPORTS DIALOG FINDEN".
 *
 * Zusammen ergab das die gemeldete Randleiste: Bsports Formular lag mittig auf
 * dem Schirm, sein Scrollen war durch unsere body-Sperre lahmgelegt, und das
 * Einzige, was noch scrollte, war unser eigenes Overlay ringsherum.
 *
 * Deshalb faellt die Konstruktion ersatzlos weg. Das Widget haengt jetzt
 * inline im Seitenfluss - genau wie auf stundenplan, kurse und coaches, die
 * nie Scroll-Probleme hatten. Es gibt kein Overlay, keine Hoehendeckelung und
 * keine Scroll-Sperre von uns. Bsports Formular bekommt den Schirm fuer sich
 * und bringt sein eigenes Scrollen mit, so wie ueberall sonst auf der Seite.
 */
(function () {
  'use strict';

  /* ─────────────────── Buchungs-Tracking ───────────────────
     Unveraendert aus probetraining-modal.js uebernommen. Die Ereignisnamen
     muessen exakt bleiben, an ihnen haengen die GTM-Trigger. */
  var _ptBookingTracked = false;
  var _ptMessageListener = null;
  var _ptDataLayerUnwatch = null;
  var _ptTrackingTimeout = null;

  function _ptFireBookingConfirmed(source) {
    if (_ptBookingTracked) return;
    _ptBookingTracked = true;
    _ptStopBookingTracking();
    console.log('🎯 Probetraining booking tracked via:', source);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'probetraining_booking_completed',
      booking_type: 'probetraining'
      /* Kein value/currency mehr: das Probetraining ist kostenlos, die
         frueheren 30 EUR waren erfunden. Der Ereignisname bleibt exakt
         gleich - daran haengen die GTM-Trigger. Falls in GTM ein Tag den
         Wert ausgelesen hat, sendet es jetzt keinen - was fuer eine
         Gratisbuchung richtig ist. */
    });
  }

  function _ptStopBookingTracking() {
    if (_ptMessageListener) { window.removeEventListener('message', _ptMessageListener); _ptMessageListener = null; }
    if (_ptDataLayerUnwatch) { _ptDataLayerUnwatch(); _ptDataLayerUnwatch = null; }
    if (_ptTrackingTimeout) { clearTimeout(_ptTrackingTimeout); _ptTrackingTimeout = null; }
  }

  function _ptStartBookingTracking() {
    _ptStopBookingTracking();
    _ptBookingTracked = false;

    _ptMessageListener = function (e) {
      if (_ptBookingTracked) return;
      var fromBsport = typeof e.origin === 'string' && e.origin.indexOf('bsport.io') !== -1;
      var d = e.data;
      var isConfirmation = false;
      if (typeof d === 'string') {
        isConfirmation = d.indexOf('booking') !== -1 || d.indexOf('success') !== -1 ||
                         d.indexOf('confirmed') !== -1 || d.indexOf('Viel Spa') !== -1;
      } else if (d && typeof d === 'object') {
        var ds = JSON.stringify(d).toLowerCase();
        isConfirmation = ds.indexOf('booking') !== -1 || ds.indexOf('success') !== -1 ||
                         ds.indexOf('confirmed') !== -1 || ds.indexOf('buchung') !== -1 ||
                         ds.indexOf('viel spa') !== -1;
      }
      if (fromBsport && isConfirmation) { _ptFireBookingConfirmed('postMessage:' + e.origin); }
    };
    window.addEventListener('message', _ptMessageListener);

    window.dataLayer = window.dataLayer || [];
    var _origPush = window.dataLayer.push;
    window.dataLayer.push = function () {
      var args = Array.prototype.slice.call(arguments);
      var result = _origPush.apply(window.dataLayer, args);
      if (!_ptBookingTracked && args[0] && typeof args[0] === 'object') {
        var ev = (args[0].event || '').toLowerCase();
        var ds = JSON.stringify(args[0]).toLowerCase();
        if (ev.indexOf('booking') !== -1 || ev.indexOf('purchase') !== -1 ||
            ev.indexOf('conversion') !== -1 || ds.indexOf('viel spa') !== -1 ||
            ds.indexOf('buchung wurde erfolgreich') !== -1) {
          _ptFireBookingConfirmed('dataLayer.push:' + args[0].event);
        }
      }
      return result;
    };
    _ptDataLayerUnwatch = function () { window.dataLayer.push = _origPush; };

    /* Auf der Seite ist die Sitzung laenger als im alten Overlay - das
       Formular wird hier in Ruhe ausgefuellt. 30 statt 10 Minuten. */
    _ptTrackingTimeout = setTimeout(_ptStopBookingTracking, 30 * 60 * 1000);
  }

  /* ─────────────────── Einwilligung + Widget ───────────────────
     Das Bsport-Widget bringt RudderStack mit und liegt deshalb hinter der
     Marketing-Einwilligung (PR #29). Ohne Einwilligung erscheint im Container
     ein Hinweis; wird sie erteilt, laedt das Widget nach. */
  var PT_CDN = 'https://cdn.bsport.io/scripts/widget.js';

  function _ptLoadBsport(cb) {
    if (window.BsportWidget) { cb(); return; }
    if (!document.getElementById('bsport-cdn')) {
      var sc = document.createElement('script');
      sc.id = 'bsport-cdn';
      sc.src = PT_CDN;
      document.head.appendChild(sc);
    }
    var tries = 0;
    var t = setInterval(function () {
      if (window.BsportWidget) { clearInterval(t); cb(); return; }
      if (++tries > 100) clearInterval(t);   /* 100 x 150 ms = 15 s */
    }, 150);
  }

  var _ptMounted = false;

  function _ptMountCalendar() {
    if (_ptMounted) return;
    var view = document.getElementById('pt-cal-view');
    if (!view) return;

    if (typeof window.bomayeGateBsport !== 'function') {
      console.warn('[consent] Consent-Bruecke nicht geladen - Bsport bleibt aus.');
      return;
    }

    window.bomayeGateBsport(view, function () {
      if (_ptMounted) return;
      _ptMounted = true;

      var holderId = 'bsport-widget-880939';
      if (!document.getElementById(holderId)) {
        var holder = document.createElement('div');
        holder.id = holderId;
        view.appendChild(holder);
      }

      _ptLoadBsport(function () {
        _ptStartBookingTracking();
        window.BsportWidget.mount({
          parentElement: holderId,
          companyId: 5473,
          franchiseId: null,
          /* 3 = DIALOG_MODE_DEACTIVATED. Belegt aus Bsports eigenem Paket
             @bsport/common, src/master-data/widget-dialog-mode.ts:
             TAB 0 / IFRAME 1 / POPUP 2 / DEACTIVATED 3. Mit 1 wuerde Bsport
             den Buchungsdialog in ein iframe legen - Beruehrungen landeten
             dann in einem fremden Dokument und das Scrollen auf iOS waere
             wieder kaputt (WebKit 149264). */
          dialogMode: 3,
          widgetType: 'calendar',
          showFab: false,
          fullScreenPopup: false,
          styles: undefined,
          config: {
            calendar: {
              coaches: [],
              establishments: [],
              /* Die meta_activity-IDs dieses Studios. Sie waren im Backoffice
                 nicht auffindbar und wurden ueber die temporaere Debug-Seite
                 aus den Termin-Objekten des Kalender-Widgets ausgelesen
                 (PR #46 / #47). Damit das nicht noch einmal jemand suchen
                 muss, hier die vollstaendige Zuordnung samt Begruendung:

                   236749  Bomaye Boxing Advanced   raus - Fortgeschrittene
                   236751  Bomaye Kickboxing        DRIN
                   244420  BOXING KIDS (6-9 Jahre)  DRIN
                   244426  BOXING BASICS            DRIN
                   244431  YOUTH FIGHT TEAM         raus - Wettkampf
                   244432  BOMAYE FIGHT TEAM        raus - Wettkampf, Profi
                   244539  BOMAYE QUEENS            DRIN
                   244563  BOXING YOUTH (10-17)     DRIN
                   245265  OPEN GYM                 raus - freies Training fuer
                                                    Mitglieder, kein angeleiteter
                                                    Einstieg
                   249398  POWER LAUNCH             raus - Kurs eingestellt,
                                                    auch im Bsport-Backoffice
                                                    geloescht

                 Die fuenf verbleibenden Kurse sind genau die, die der Text
                 ueber dem Kalender zusagt. Wer den Filter aendert, muss den
                 Text in probetraining.html mitaendern - sonst verspricht die
                 Seite etwas, das nicht buchbar ist, oder umgekehrt. */
              metaActivities: [
                236751,   /* Bomaye Kickboxing        - "Kickboxing" */
                244420,   /* BOXING KIDS (6-9 Jahre)  - "Kids"       */
                244426,   /* BOXING BASICS            - "Basic"      */
                244539,   /* BOMAYE QUEENS            - "Queens"     */
                244563    /* BOXING YOUTH (10-17)     - "Youth"      */
              ],
              levels: [],
              variant: 'time',
              groupSessionByPeriod: true,
              todayOnly: false,
              cardMode: false
            }
          }
        });
      });
    });
  }

  /* ─────────────────── Bsports Dialog in den Seitenfluss holen ───────────
     BEFUND AUS DEM GERAETETEST
     Der Kalenderschritt scrollt einwandfrei mit der Seite - dort gibt es
     naemlich gar keinen Bsport-Dialog: die Terminliste haengt in #pt-cal-view,
     also in unserem eigenen Markup, mitten im Dokument. Erst beim Tippen auf
     einen Termin baut Bsport seinen Dialog auf und haengt ihn als direktes
     Kind an <body>. Genau ab da klemmte das Scrollen.

     Es ist also kein verpasster Zustandswechsel, sondern schlicht der
     Zustand, in dem dieser Dialog auf die Welt kommt: fest positioniert,
     mit eigener Scroll-Flaeche, ausserhalb von allem, was uns gehoert.

     WARUM JETZT NICHT MEHR ERKANNT, SONDERN ERZWUNGEN WIRD
     Die bisherige Fassung hat Bsports Positionierung gemessen und darauf
     reagiert. Das ist ein Wettlauf, den man nicht gewinnt: es gibt beliebig
     viele Zwischenzustaende, und jeder verpasste kostet eine Buchung. Statt
     hinterherzumessen wird der Dialog jetzt in den Seitenfluss GEZWUNGEN -
     in jedem Schritt, unabhaengig davon, was Bsports JavaScript setzt:

       1. Der Dialog wandert aus <body> in denselben Container wie der
          Kalender. Ohne das stuende er als letztes Kind von <body> unterhalb
          des Footers.
       2. CSS zwingt ihn per !important in den Fluss (siehe
          probetraining-page.css) - keine feste Positionierung, keine
          Hoehendeckelung, keine eigene Scroll-Flaeche.
       3. Nachfahren, die selbst fest positioniert sind (Hintergrund-
          abdunklung, klebende Kopf- oder Fusszeile des Dialogs), werden
          eingereiht. Das laesst sich in CSS nicht ausdruecken - man kann
          nicht nach berechneter Positionierung selektieren -, deshalb hier.
       4. Der Kalender darunter wird ausgeblendet, solange der Dialog offen
          ist. So steht das Formular genau dort, wo eben noch die Terminliste
          stand: gleicher Container, gleiche Breite, gleiches Scrollen.

     Es wird NICHTS mehr gesperrt. Das Dokument ist in jedem Schritt der eine
     Scroll-Container - im Kalenderschritt war es das ohnehin schon, und
     genau der funktioniert. Der Formularschritt verhaelt sich jetzt gleich.

     Der Kalenderschritt bleibt unberuehrt: solange kein Dialog da ist, tut
     diese Funktion nichts. */
  /* Was die Eingriffe am Bsport-Dialog tatsaechlich zu tun hatten. Wird von
     ?ptdebug=1 angezeigt - siehe _ptSetupTouchDebug. */
  var _ptZaehler = { fest: 0, schein: 0, geste: 0, schleier: 0, marke: 0, wisch: 0, deckel: 0 };

  /* Der erkannte Dialog, als ELEMENT. Siehe dialogFinden(). */
  var _ptDialog = null;

  /* Erlaubt der Wert senkrechtes Wischen? auto und manipulation ja, none und
     ein reines pan-x nein. Steht hier oben, weil sowohl der Eingriff als auch
     die Diagnose danach fragen. */
  function senkrechtErlaubt(ta) {
    var v = String(ta || 'auto');
    if (v === 'auto' || v === 'manipulation') return true;
    return /pan-y|pan-up|pan-down/.test(v);
  }

  function _ptAdoptBsportDialog() {
    var MODAL_SEL = '.bsport-user-interaction-modal__container';
    var BODY_CLASS = 'bsport-modal-open';
    var MARKER = 'ptFlowFixed';
    var MARKER_SCROLL = 'ptScrollFrei';
    var MARKER_GESTE  = 'ptGesteFrei';
    var _huelle = null;   /* Bsports Wurzel, aus der wir den Dialog holen */
    var HAKEN  = 'pt-bsport-dialog';   /* unsere eigene Marke am Dialog */

    /* ── BSPORTS DIALOG FINDEN ────────────────────────────────────────────
       DIE ANNAHME, DIE SEIT PR #43 IM CODE STAND, IST FALSCH
       Oben in dieser Datei steht seit jeher: "Bsport haengt sein
       Anmeldeformular NICHT in den Container, den wir ihm geben. Es rendert
       es als direktes Kind von <body>." Der zweite Geraetetest hat die
       vollstaendige Kette geliefert, und sie endet woanders:

         div.bs-activity__middle__coach__description
         > div.bs-activity__middle__coach > div.bs-activity__middle
         > div.bs-activity
         > div#bs-activity--dialog__content.MuiDialogContent-root-1149 [735px]
         > div.MuiPaper-root-1121.MuiDialog-paper-1108  [SCHEINSCROLLER 0px]
         > div.MuiDialog-container-1107.MuiDialog-scrollPaper-1105
         > div#bs-activity--dialog.MuiDialog-root-1104  [FEST]
         > div#bs-setup-derived-variable.bs-setup-variable
         > div > div.jss2 > div.jss1
         > div.cleanslate                               [SCHEINSCROLLER 0px]
         > div#bsport-widget-880939
         > div#pt-cal-view
         > div.container

       Der Dialog haengt IN UNSEREM EIGENEN Container. Und die Suche aus
       PR #89 hat genau dort nicht hingesehen: sie ging die Kinder von <body>
       durch und uebersprang alles, was #pt-cal-view enthaelt, damit nicht
       versehentlich die Terminliste eingesammelt wird. Diese Ausnahme war
       der Fehler - sie schloss ausgerechnet den Ort aus, an dem der Dialog
       steht. Deshalb wieder: kein Dialog gefunden, alle Zaehler auf 0.

       WAS DIESMAL ANDERS IST
       Gesucht wird ausschliesslich nach einer Eigenschaft, die weder ein
       Klassenname noch eine Schachtelungstiefe ist:

         position: fixed + gehoert uns nicht + hat sichtbaren Inhalt

       Das genuegt und traegt ueber alle Unterschritte hinweg: die
       Terminliste steht im normalen Fluss, nur der Dialog ist fest
       positioniert. Damit braucht es die Ausnahme fuer #pt-cal-view nicht
       mehr - und die Namen dazwischen (bs-setup-derived-variable, jss1,
       jss2, MuiDialog-container-1107) duerfen sich aendern, so oft sie
       wollen. Sie werden nicht mehr gelesen.

       Gesucht wird an den beiden Orten, die ueberhaupt vorkommen: in
       unseren Widget-Containern und an <body>. Genommen wird der
       AEUSSERSTE feste Treffer - bei MUI ist das die Dialogwurzel, die
       Blende darin ist ihr Kind.

       WARUM DER DIALOG NICHT MEHR UMGEHAENGT WIRD
       Frueher wurde er neben die Terminliste gehaengt. Bei dieser Gestalt
       waere das schaedlich: .cleanslate liegt als Vorfahre ueber ihm, und
       Bsports gesamte Gestaltung haengt an genau diesem Vorfahren. Wer den
       Dialog dort herausholt, nimmt ihm sein Aussehen. Er bleibt also
       stehen, wo er ist - fest positioniert wird er trotzdem nicht mehr,
       siehe probetraining-page.css bei .pt-bsport-dialog.

       Einmal erkannt, traegt er UNSERE Marke. Ab da haengt weder CSS noch
       JS an etwas, das Bsport gehoert. */

    function sichtbar(el) {
      if (!el || !el.getBoundingClientRect) return false;
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      var cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      return true;
    }

    /* Was WIR gebaut haben. Diese Namen sind stabil - wir vergeben sie
       selbst. Ueber Bsports Namen wird nichts mehr angenommen. */
    function unserEigen(el) {
      if (!el || el.nodeType !== 1) return true;
      var t = el.tagName;
      if (t === 'SCRIPT' || t === 'STYLE' || t === 'LINK' || t === 'NOSCRIPT'
          || t === 'TEMPLATE' || t === 'IFRAME') return true;
      switch (el.id) {
        case 'pt-touch-debug': case 'pt-edge-hint': case 'header':
        case 'mobile-nav': case 'preloader': case 'pt-cal-view':
          return true;
      }
      if (el.classList && el.classList.contains('noise')) return true;
      if (el.classList && el.classList.contains('bomaye-consent-gate')) return true;
      if (el.id && el.id.indexOf('bsport-widget-') === 0) return true;  /* unser Halter */
      return false;
    }

    /* Bsports Handschrift. Wird NUR gebraucht, um an <body> eine fremde
       feste Ebene von Bsports zu unterscheiden - im Test hat sonst
       Cookiebots Einwilligungsdialog den Zuschlag bekommen, und mit ihm
       verschwand die Terminliste.

       Innerhalb unserer Widget-Container wird sie NICHT verlangt: was dort
       steht, hat Bsport gebaut, da genuegt "fest positioniert". Genau dort
       lagen beide gemeldeten Fehler, und genau dort wird weiterhin nichts
       ueber Namen angenommen. */
    function bsportHandschrift(el) {
      if (el.id && /^(bs-|bsport)/.test(el.id)) return true;
      var k = el.classList;
      for (var i = 0; i < k.length; i++) {
        if (k[i] === 'cleanslate' || /^bs-/.test(k[i]) || /bsport/.test(k[i])) return true;
      }
      return !!el.querySelector('.cleanslate,[id^="bs-"],[id^="bsport"],[class^="bs-"],[class*=" bs-"],[class*="bsport"]');
    }

    /* Ein Dialog hat etwas zu zeigen - Bedienelemente oder ordentlich Text.
       Das unterscheidet ihn von einer leeren Blende. */
    function hatInhalt(el) {
      if (el.querySelector('input,select,textarea,button,a,[role="button"]')) return true;
      return String(el.textContent || '').trim().length > 20;
    }

    /* Die beiden Orte, an denen ueberhaupt ein Dialog stehen kann. Mehr
       Suchraum kostet Rechenzeit und bringt nichts. */
    function suchraeume() {
      var raeume = [];
      var halter = document.querySelectorAll('[id^="bsport-widget-"]');
      for (var i = 0; i < halter.length; i++) {
        /* unser eigener Halter: alles darin gehoert Bsport */
        if (halter[i].tagName !== 'SCRIPT') raeume.push({ el: halter[i], unser: true });
      }
      var view = document.getElementById('pt-cal-view');
      var kinder = document.body.children;
      for (var j = 0; j < kinder.length; j++) {
        var el = kinder[j];
        if (unserEigen(el)) continue;
        if (view && el.contains(view)) continue;   /* ueber die Halter abgedeckt */
        raeume.push({ el: el, unser: false });
      }
      return raeume;
    }

    /* Fest positioniert? Bei fixed ist offsetParent immer null, und das ist
       billiger zu lesen als der ganze berechnete Stil - erst der Vorfilter,
       dann die teure Frage. */
    function festUndFremd(el) {
      if (el.offsetParent !== null) return false;
      if (unserEigen(el)) return false;
      return window.getComputedStyle(el).position === 'fixed';
    }

    function festerDialog() {
      var raeume = suchraeume();
      for (var i = 0; i < raeume.length; i++) {
        var raum = raeume[i].el;
        var imEigenen = raeume[i].unser;
        function taugt(el) {
          if (!festUndFremd(el)) return false;
          if (!sichtbar(el) || !hatInhalt(el)) return false;
          /* Nur ausserhalb unserer Halter: es muss auch Bsports sein. */
          return imEigenen || bsportHandschrift(el);
        }
        if (taugt(raum)) return raum;
        /* getElementsByTagName liefert in Dokumentreihenfolge - der erste
           Treffer ist damit der aeusserste. */
        var alle = raum.getElementsByTagName('*');
        for (var j = 0; j < alle.length; j++) {
          if (taugt(alle[j])) return alle[j];
        }
      }
      return null;
    }

    /* ── WARUM HIER EIN ELEMENT GEHALTEN WIRD UND NICHT NUR EINE KLASSE ───
       Die Marke pt-bsport-dialog ist ein Klassenname, und className gehoert
       im Dialog React. Baut es das Formular fuer den naechsten Schritt neu
       auf, schreibt es className neu - unsere Marke ist weg, obwohl dasselbe
       Element noch dasteht.

       Genau das stand im dritten Geraetetest: Zeile 1 meldete "Kein
       Bsport-Dialog offen", waehrend die Kette unter dem Finger
       div#bs-activity--dialog.pt-bsport-dialog zeigte. Kein Widerspruch,
       sondern zwei Momentaufnahmen - dazwischen hatte React die Klasse
       einmal abgeraeumt.

       Das Element selbst kann uns niemand wegnehmen. Es wird hier gehalten
       und bei jedem Takt nur noch geprueft; die Klasse wird neu gesetzt,
       wenn sie fehlt, damit das CSS weiter greift. Der Zaehler "marke" sagt
       auf dem Geraet, wie oft das noetig war. */
    /* ── WARUM AUFGEBEN NUR EIN AUSWEG UND KEIN REFLEX IST ────────────────
       Die vorige Fassung gab den Dialog auf, sobald er einmal unsichtbar
       oder leer war - und das ist ein Einbahnweg: beim Aufgeben faellt die
       Marke, und festerDialog() findet ihn nie wieder, weil wir ihm selbst
       gerade das position: fixed genommen haben, nach dem gesucht wird.
       Ein einziger Wimpernschlag beim Neuzeichnen - React haengt den Inhalt
       kurz aus - reichte also, um bis zum Seitenneuladen blind zu sein. Ab
       da lief kein Eingriff mehr, und die Zustandszeile meldete wieder
       "Kein Bsport-Dialog offen", obwohl der Dialog dastand.

       Verlassen wird sich jetzt nur noch auf eine Tatsache, die nicht
       flackert: steht das Element noch im Dokument? Unsichtbar oder leer
       darf es sein, solange es das nicht laenger als ZU_VERZUG bleibt. */
    var ZU_VERZUG = 1500;
    var _ptLeerSeit = 0;

    function dialogFinden() {
      if (_ptDialog && document.contains(_ptDialog)) {
        if (sichtbar(_ptDialog) && hatInhalt(_ptDialog)) {
          _ptLeerSeit = 0;
          if (!_ptDialog.classList.contains(HAKEN)) {
            _ptDialog.classList.add(HAKEN);
            _ptZaehler.marke++;
          }
          return _ptDialog;
        }
        if (!_ptLeerSeit) _ptLeerSeit = Date.now();
        if (Date.now() - _ptLeerSeit < ZU_VERZUG) return _ptDialog;
      }
      _ptDialog = null;
      _ptLeerSeit = 0;

      /* Ein Ueberbleibsel von vorhin? Dann ist es zu. */
      var da = document.querySelector('.' + HAKEN);
      if (da) da.classList.remove(HAKEN);

      var gefunden = festerDialog();
      /* Letztes Netz: der alte, fest verdrahtete Name. Kostet nichts und
         faengt die Gestalt ab, gegen die PR #43 gebaut wurde. */
      if (!gefunden) gefunden = document.querySelector(MODAL_SEL);
      if (!gefunden) return null;
      gefunden.classList.add(HAKEN);
      _ptDialog = gefunden;
      return gefunden;
    }

    /* Wohin der Dialog gehoert: direkt neben den Kalender, in denselben
       Container - damit er dessen Breite und Raender erbt. */
    function ziel() {
      var view = document.getElementById('pt-cal-view');
      return view && view.parentElement ? view.parentElement : null;
    }

    /* ── Drei chirurgische Eingriffe am Dialog ────────────────────────────
       Jeder greift nur dort, wo er nachweislich noetig ist, und jeder zaehlt
       mit. Die Zaehler stehen in ?ptdebug=1 - damit laesst sich auf dem
       Geraet ablesen, WELCHER Eingriff ueberhaupt etwas zu tun hatte. Bei
       diesem Fehler ist schon oft genug geraten worden.

       1. AUS DEM FLUSS GENOMMEN -> WIEDER EINGEREIHT
          Fest positionierte Nachfahren werden relativ, damit absolut
          positionierte Kinder darin (Schliessen-Kreuz, Auswahllisten) ihren
          Bezugsrahmen behalten.

          Dazu ein Fall, den der Versuchsaufbau aufgedeckt hat: ein absolut
          positioniertes Element, bei dem SOWOHL top ALS AUCH bottom gesetzt
          sind, wird an seinem Container festgezurrt. Solange die Dialog-
          wurzel fest positioniert war, war dieser Container der Schirm und
          alles stimmte. Sobald sie im Fluss steht und ihre Hoehe sich nach
          dem Inhalt richtet, spannt sich das Kind zwischen Ober- und
          Unterkante eines Kastens auf, der genau deshalb null hoch ist - der
          Dialog verschwand im Test spurlos, obwohl er im Baum stand.
          Deshalb wird auch das eingereiht. Dekorative Absolute (top und
          right gesetzt, bottom auto) bleiben unberuehrt - die Bedingung
          trifft sie nicht.

       2. SCHEINSCROLLER -> ENTSCHAERFT
          Ein Element, dessen overflow-y auf auto oder scroll steht, dessen
          Inhalt aber gar nicht ueberlaeuft. Es faengt den Wisch und bewegt
          sich um 0 px; auf iOS endet die Geste damit im Nichts, statt an das
          Dokument weitergereicht zu werden. Genau das erzeugte die
          Randleiste: in der Mitte lagen diese Kaesten, am Rand nicht.

          Woher sie kamen, steht in probetraining-page.css beim Abschnitt
          "WARUM HIER KEIN overflow MEHR STEHT". Kurz: overflow-y: visible
          wird neben einem nicht-sichtbaren overflow-x zu auto.

          In CSS ist das nicht zu loesen - ein Element kann nicht waagerecht
          scrollen und senkrecht kein Scroll-Container sein. Hier entscheidet
          der TATSAECHLICHE Scrollweg:

            kein echter Scrollweg, auch nicht waagerecht -> overflow: visible
              auf beiden Achsen. Nichts wird beschnitten, nichts faengt mehr.
            echter WAAGERECHTER Scrollweg -> nur die senkrechte Achse still-
              legen. hidden ist kein beruehrungsscrollbarer Zustand, die
              Querleiste bleibt also bedienbar und die Geste faellt trotzdem
              an das Dokument durch.
            echter SENKRECHTER Scrollweg -> unangetastet. Dort will jemand
              wirklich scrollen, und das darf er.

       3. GESTE VERBOTEN -> WIEDER ERLAUBT
          touch-action: none (oder nur pan-x) verbietet dem Browser das
          senkrechte Wischen ueber diesem Element. Ob Bsport das irgendwo
          setzt, konnte von hier aus niemand pruefen - der Zaehler beantwortet
          es auf dem Geraet. Ueberschrieben wird nur, was senkrechtes Wischen
          tatsaechlich verbietet. */

    /* ── DIE LEERE HUELLE, DIE UEBER DER SEITE LIEGEN BLEIBT ──────────────
       Bsports Dialog ist zweistoeckig: aussen eine feste Wurzel ueber dem
       ganzen Schirm (bei MUI mitsamt .MuiBackdrop-root), innen der
       Container mit dem Formular. Umgehaengt wird nur der Container - die
       Wurzel bleibt, wo sie war: fest positioniert, ueber der ganzen Seite,
       und damit ueber dem Formular, das jetzt weiter unten im Seitenfluss
       steht.

       Damit liegt bei jeder Beruehrung in der Schirmmitte nicht das Formular
       unter dem Finger, sondern ein leerer, fest positionierter Schleier.
       Im Versuchsaufbau war genau das der Fall: elementFromPoint lieferte
       div.MuiBackdrop-root, nicht das Eingabefeld.

       Entfernt wird der Schleier nicht - React baut ihn beim naechsten
       Neuzeichnen wieder auf. Er wird durchlaessig gemacht: pointer-events
       none faengt nichts mehr, transparent verdunkelt nichts mehr.

       Die Bedingung ist gemessen, nicht geraten: nur fest positioniert UND
       fast schirmfuellend. Ein echtes Inhaltselement erfuellt das nicht, und
       weil bei jedem Takt neu geprueft wird, heilt sich das von selbst,
       falls Bsport dort spaeter doch etwas Sinnvolles hinsetzt. */
    function schleierEntschaerfen(wurzel) {
      if (!wurzel || wurzel === document.body || wurzel === document.documentElement) return;
      var alle = [wurzel].concat([].slice.call(wurzel.querySelectorAll('*')));
      for (var i = 0; i < alle.length; i++) {
        var el = alle[i];
        var cs = window.getComputedStyle(el);
        if (cs.position !== 'fixed' || cs.pointerEvents === 'none') continue;
        var r = el.getBoundingClientRect();
        if (r.width < window.innerWidth * 0.8) continue;
        if (r.height < window.innerHeight * 0.8) continue;
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('backdrop-filter', 'none', 'important');
        el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        _ptZaehler.schleier++;
      }
    }

    /* ── WELCHE ELEMENTE UEBERHAUPT BEHANDELT WERDEN ──────────────────────
       DER FEHLER, DEN DER DRITTE GERAETETEST GEZEIGT HAT
       Am Ende des Formulars (Notfallkontakt, Haken) lautete die Kette:

         ... > div#bs-activity--dialog.pt-bsport-dialog   <- unsere Marke
         > div#bs-setup-derived-variable > div > div.jss2 > div.jss1
         > div.cleanslate  [SCHEINSCROLLER 0px]  <- hat den Wisch gefangen
         > div#bsport-widget-880939

       .cleanslate ist kein NACHFAHRE des Dialogs, sondern sein VORFAHRE.
       Behandelt wurden bisher nur Nachfahren (querySelectorAll geht nach
       unten), und dieselbe Blindstelle hatte auch der Versuchsaufbau: er
       zaehlte die Scheinscroller ebenfalls nur unterhalb des Dialogs. Beide
       haben in dieselbe Richtung nicht geschaut.

       Gefangen wird ein Wisch aber vom NAECHSTEN scrollbaren Vorfahren -
       egal, ob er ueber oder unter der Marke sitzt. Deshalb laeuft die
       Behandlung jetzt in beide Richtungen: alle Nachfahren, und der Weg
       nach oben bis einschliesslich unseres Widget-Halters. Weiter nach oben
       nicht: dort beginnt unsere eigene Seite, und die scrollt richtig. */
    function zuBehandeln(root) {
      var liste = [root];
      var unten = root.querySelectorAll('*');
      for (var i = 0; i < unten.length; i++) liste.push(unten[i]);
      var n = root.parentElement;
      while (n && n !== document.body) {
        if (n.id === 'pt-cal-view') break;          /* ab hier gehoert es uns */
        liste.push(n);
        if (n.id && n.id.indexOf('bsport-widget-') === 0) break;   /* Halter mitnehmen, dann Schluss */
        n = n.parentElement;
      }
      return liste;
    }

    /* ── DIE BEHANDLUNG WIEDERHOLT SICH, STATT SICH ETWAS ZU MERKEN ───────
       Bisher trug jedes behandelte Element eine Merkmarke und wurde danach
       uebersprungen. Das haelt nicht: Bsports Formular baut sich pro Schritt
       neu auf, und React schreibt dabei style und class der Elemente neu -
       die Marke bleibt, der Eingriff ist weg, und uebersprungen wird er
       trotzdem. Genau dazu passt der Befund: Zaehler ungleich null, Falle
       trotzdem offen.

       Deshalb wird bei jedem Takt neu GEMESSEN und nur dann geschrieben,
       wenn der berechnete Wert tatsaechlich falsch ist. Das ist von sich aus
       wiederholbar, ueberlebt jedes Neuzeichnen - und loest keine
       Endlosschleife aus, weil nach dem ersten Durchgang nichts mehr zu
       schreiben ist und der Beobachter nichts mehr zu melden hat. */
    function einreihen(root) {
      var liste = zuBehandeln(root);
      for (var i = 0; i < liste.length; i++) {
        var el = liste[i];
        if (!el.style) continue;
        var cs = window.getComputedStyle(el);

        /* 1. aus dem Fluss genommen -> wieder eingereiht */
        var gespannt = cs.position === 'absolute'
                    && cs.top !== 'auto' && cs.bottom !== 'auto';
        if (cs.position === 'fixed' || gespannt) {
          el.style.setProperty('position', 'relative', 'important');
          el.style.setProperty('inset', 'auto', 'important');
          _ptZaehler.fest++;
        }

        /* 2. Scheinscroller -> entschaerft */
        if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll')
            && el.scrollHeight - el.clientHeight <= 4) {
          if (el.scrollWidth - el.clientWidth > 4) {
            el.style.setProperty('overflow-y', 'hidden', 'important');
          } else {
            el.style.setProperty('overflow', 'visible', 'important');
          }
          _ptZaehler.schein++;
        }

        /* 3. ABGESCHNITTENER INHALT -> wieder sichtbar
           Ein Element mit overflow: hidden, dessen Inhalt hoeher ist als es
           selbst, schneidet den Rest ab. Daran kann kein Finger ziehen, und
           kein Scrollen der Seite holt ihn zurueck - der untere Teil des
           Formulars waere schlicht weg. Unsere max-height-Regel im CSS
           greift nur bei Nachfahren des Dialogs; die Vorfahren (.cleanslate,
           die jss-Schichten) erreicht sie nicht. Deshalb hier, gemessen am
           tatsaechlichen Ueberhang. */
        if (cs.overflowY === 'hidden' && el.scrollHeight - el.clientHeight > 4) {
          el.style.setProperty('overflow', 'visible', 'important');
          el.style.setProperty('max-height', 'none', 'important');
          _ptZaehler.deckel++;
        }

        /* 4. Geste verboten -> wieder erlaubt */
        if (!senkrechtErlaubt(cs.touchAction)) {
          el.style.setProperty('touch-action', 'pan-y', 'important');
          _ptZaehler.geste++;
        }
      }
    }

    /* DIE SPERRE, DIE DREI ANLAEUFE UEBERSEHEN HABEN
       Bsports Widget ist MUI-basiert, und MUIs ModalManager sperrt das
       Seiten-Scrollen SELBST, sobald ein Dialog aufgeht. Er schreibt dazu
       overflow: hidden als Inline-Stil auf den Scroll-Container - im
       Normalfall <body>, auf iOS auf <html> - und legt sich die alten Werte
       fuer overflow, overflow-x und overflow-y zum Zuruecksetzen beiseite.
       Belegt in MUIs Quelltext (packages/mui-material/src/Modal/ModalManager)
       und in der Modal-Dokumentation.

       Bis hierher hat der Code nur die Sperre aufgeraeumt, die wir selbst
       einmal gesetzt hatten - und das auch nur, wenn position: fixed am body
       stand:

         if (document.body.style.position === 'fixed') { ... overflow = '' }

       MUI setzt aber overflow: hidden OHNE position: fixed. Die Bedingung war
       damit nie erfuellt, die Sperre blieb liegen. Beim letzten Anlauf war das
       besonders bitter: der Dialog lag da bereits im Seitenfluss, das Dokument
       war also der einzige Weg zum Absende-Button - und genau dieser Weg war
       von MUI zugesperrt. Was noch scrollte, war die Randleiste.

       Deshalb wird hier gezielt und wiederholt entsperrt, auf body UND html.
       Nur Werte, die tatsaechlich auf hidden oder fixed stehen, werden
       angefasst - fremde, legitime Stile bleiben unberuehrt. */
    function entsperren() {
      var knoten = [document.body, document.documentElement];
      for (var i = 0; i < knoten.length; i++) {
        var st = knoten[i].style;
        if (st.overflow === 'hidden') st.overflow = '';
        if (st.overflowY === 'hidden') st.overflowY = '';
        if (st.overflowX === 'hidden') st.overflowX = '';
        if (st.position === 'fixed') {
          st.position = '';
          st.top = '';
          st.width = '';
        }
        /* MUI gleicht die verschwundene Scrollleiste mit paddingRight aus.
           Ohne Sperre gibt es nichts auszugleichen. */
        if (st.paddingRight) st.paddingRight = '';
      }
    }

    /* ── NOTBEHELF: Hinweis auf das Wischen am Rand ────────────────────────
       STAND DER DINGE, damit das in einer spaeteren Sitzung niemand neu
       herleiten muss:

       Auf dem Anmeldeformular laesst sich auf iOS je nach Zustand nur am
       Bildschirmrand scrollen. Die Ursache liegt nicht bei uns, sondern in
       der Kombination aus Bsports MUI-Dialog und WebKit. PR #43 hat das in
       fuenf Anlaeufen verfolgt:

         1. CSS auf #pt-cal-view          - falsches Element, Bsport rendert
                                            das Formular in ein Portal an <body>
         2. dasselbe klassenbasiert       - ebenfalls falsches Element
         3. Umbau Overlay -> eigene Seite - richtig und behalten, reichte nicht
         4. Dialog in den Seitenfluss     - richtig und behalten, reichte nicht
         5. MUIs eigene Scroll-Sperre     - siehe entsperren(), belegt und
            (overflow:hidden auf <html>)    reproduziert, half aber nur teilweise

       Die Punkte 3 bis 5 bleiben in Kraft, sie sind nachweislich richtig.
       Was danach noch klemmt, ist ungeklaert. Der Kunde hat entschieden, den
       Umweg vorerst zu ERKLAEREN statt einen sechsten Anlauf zu nehmen.

       WARUM DIE ERSTE FASSUNG DES HINWEISES UNSICHTBAR BLIEB
       Sie hat den Hinweis per insertBefore in Bsports Dialog gehaengt. Der
       ist aber eine React-Portal-Wurzel: React gleicht die Kinder dieses
       Containers bei jedem Neuzeichnen mit seinem eigenen Baum ab und
       entfernt dabei, was es nicht kennt. Der Hinweis wurde also eingesetzt,
       sofort wieder weggeraeumt, vom 500-ms-Takt erneut eingesetzt, und so
       fort - sichtbar war davon nichts. Nur das Scrollen an den
       Formularanfang ist aufgefallen, weil es beim ersten Einsetzen einmal
       wirklich gesprungen ist.

       Deshalb steht der Hinweis jetzt als festes Markup in probetraining.html,
       ausserhalb von allem, was Bsport oder React gehoert. Hier wird nur noch
       eine Klasse am <body> gesetzt.

       WARUM DER HINWEIS BIS ZUM FORMULARSCHRITT WEGBLEIBT
       Aus dem Portal-Fehler wurde einmal die falsche Lehre gezogen: weil der
       Hinweis unsichtbar geblieben war, wurde er anschliessend ueberhaupt
       nicht mehr abgeriegelt - er stand von der ersten Sekunde an ueber der
       Terminliste. Jeder Besucher las "Falls sich das Formular nicht scrollen
       laesst", bevor es ueberhaupt ein Formular gab. Der Hinweis beschreibt
       einen Umweg, den die meisten nie brauchen, und saete Zweifel an einer
       Buchung, die noch gar nicht begonnen hatte.

       Der Fehler von damals lag aber nicht am Abriegeln, sondern am ORT: der
       Hinweis hing IN Bsports Portal. Daran aendert sich nichts - er steht
       weiter als festes Markup in probetraining.html, ausserhalb von allem,
       was Bsport oder React gehoert. Umgeschaltet wird ausschliesslich ueber
       eine Klasse am <body>, und <body> gehoert keinem React-Baum. React kann
       diesen Schalter also gar nicht anfassen.

       WORAN "Formularschritt" ERKANNT WIRD - drei Signale, absteigend sicher

         1. Bsports Dialog ist da (MODAL_SEL). Sicher, solange Bsport seinen
            Klassennamen behaelt.
         2. Es steht ein sichtbares Eingabefeld ausserhalb der Terminliste.
            KLASSENUNABHAENGIG und damit das Netz unter Signal 1:
            probetraining.html hat selbst kein einziges Formularfeld, jedes
            Feld im Dokument gehoert Bsport. Felder INNERHALB von #pt-cal-view
            zaehlen nicht - dort sitzt die Terminliste mit ihren eigenen
            Filtern, das ist noch nicht der Anmeldeschritt.
         3. Kurze Frist nach einem Tipp in die Terminliste. Nur eine Bruecke,
            bis eines der beiden echten Signale nachkommt - keine Dauerzusage,
            denn getippt haben kann man auch auf den Wochenpfeil.

       Die Richtung der Unsicherheit bleibt dieselbe wie bisher: lieber einmal
       zu frueh eingeblendet als im entscheidenden Moment gar nicht. Deshalb
       reicht EIN Signal zum Einblenden, waehrend zum Ausblenden alle drei
       fehlen muessen - und das auch erst, nachdem sie AUS_VERZUG lang
       durchgehend gefehlt haben.

       Faellt der Umweg irgendwann weg, koennen dieser Block, die Klasse und
       das Markup ersatzlos verschwinden. Der naechste sinnvolle Schritt waere
       aber ohnehin kein weiterer CSS-Eingriff, sondern Bsports gehosteter
       Buchungslink - ihre Seite, ihr Scrollen. */
    var FORM_CLASS = 'pt-form-step';
    var TIPP_FRIST = 8000;   /* Bruecke nach einem Tipp in die Terminliste */
    var AUS_VERZUG = 600;    /* so lange muss jedes Signal fehlen, bevor aus */
    var _gesprungen = false;
    var _tippBis    = 0;
    var _fehltSeit  = 0;

    /* Signal 2. Bewusst am ganzen Dokument, nicht nur im Buchungsbereich:
       faellt Signal 1 aus, weil Bsport umbenannt hat, wird der Dialog auch
       nicht mehr in den Seitenfluss geholt und steht dann dort, wo Bsports
       Portal ihn hinlegt - meist direkt an <body>. */
    function formularfeldSichtbar() {
      var liste = document.getElementById('pt-cal-view');
      var felder = document.querySelectorAll(
        'input:not([type="hidden"]), textarea, select');
      for (var i = 0; i < felder.length; i++) {
        var f = felder[i];
        if (liste && liste.contains(f)) continue;
        var r = f.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return true;
      }
      return false;
    }

    /* an     - irgendein Signal liegt an, der Hinweis gehoert eingeblendet
       sicher - es ist eines der beiden ECHTEN Signale (Dialog oder Feld),
                nicht bloss die Tipp-Bruecke. Nur darauf wird gesprungen:
                ein Tipp auf den Wochenpfeil soll die Seite nicht bewegen. */
    function formSchritt(an, sicher) {
      if (an) {
        _fehltSeit = 0;
        document.body.classList.add(FORM_CLASS);
        /* Sobald ein echtes Signal da ist, hat die Bruecke ihren Dienst
           getan. Sie muss weg, sonst haengt sie nach: wer den Dialog
           innerhalb der Frist wieder schliesst, saehe den Hinweis sonst
           noch sekundenlang ueber der Terminliste stehen - genau der
           Zustand, den diese Aenderung abstellt. */
        if (sicher) _tippBis = 0;
        if (sicher && !_gesprungen) {
          _gesprungen = true;
          /* Einmal an den Anfang des Buchungsbereichs. Wer gerade einen
             Termin ausgesucht hat, steht weiter unten - und das Formular
             beginnt oben. Der Abzug haelt Abstand zur Kopfzeile. */
          var anker = document.getElementById('pt-booking');
          if (anker) {
            var y = anker.getBoundingClientRect().top + window.scrollY - 84;
            window.scrollTo({ top: y > 0 ? y : 0, behavior: 'smooth' });
          }
        }
        return;
      }

      if (!document.body.classList.contains(FORM_CLASS)) return;

      /* Nicht im selben Bildaufbau ausblenden. React haengt seinen Dialog
         beim Neuzeichnen kurz aus dem Baum; wer darauf sofort reagiert,
         laesst den Hinweis flackern und den Abstand darunter springen. */
      if (!_fehltSeit) { _fehltSeit = Date.now(); return; }
      if (Date.now() - _fehltSeit < AUS_VERZUG) return;
      document.body.classList.remove(FORM_CLASS);
      _fehltSeit = 0;
    }

    /* Signal 3. Setzt nur eine Frist, keine Dauerzusage - kommt der Dialog
       nach, uebernimmt sein eigenes Signal; bleibt er aus, war es eben der
       Wochenpfeil und der Hinweis geht von selbst wieder weg. */
    function ausloeserRuesten() {
      var view = document.getElementById('pt-cal-view');
      if (!view) return;
      view.addEventListener('click', function () {
        _tippBis = Date.now() + TIPP_FRIST;
        schedule();
      }, true);
    }

    /* ── NUR DER DIALOG BLEIBT STEHEN ─────────────────────────────────────
       Frueher verschwand die Terminliste per CSS: body.bsport-modal-open
       #pt-cal-view { display: none }. Das war richtig, solange der Dialog an
       <body> hing. Jetzt haengt er IN #pt-cal-view - die Regel wuerde ihn
       mit ausblenden und den Buchungsbereich leer lassen.

       Stattdessen wird der Weg vom Dialog nach oben abgegangen und auf jeder
       Stufe ausgeblendet, was DANEBEN steht. Was uebrig bleibt, ist genau
       die Kette bis zum Dialog - das Formular steht dort, wo eben noch die
       Terminliste stand. Kein Klassenname, keine Tiefe, keine Annahme
       darueber, wo Bsport die Liste hinbaut. */
    function nurDialogZeigen(dialog, stop) {
      var n = dialog;
      while (n && n !== stop && n.parentElement) {
        var g = n.parentElement.children;
        for (var i = 0; i < g.length; i++) {
          var s = g[i];
          if (s === n || unserEigen(s)) continue;
          if (s.dataset && s.dataset.ptVersteckt) continue;
          if (s.dataset) s.dataset.ptVersteckt = '1';
          s.style.setProperty('display', 'none', 'important');
        }
        n = n.parentElement;
      }
    }

    function wiederZeigen() {
      var v = document.querySelectorAll('[data-pt-versteckt]');
      for (var i = 0; i < v.length; i++) {
        v[i].style.removeProperty('display');
        v[i].removeAttribute('data-pt-versteckt');
      }
    }

    /* MUIs Blende ist ein fest positioniertes, schirmfuellendes Kind der
       Dialogwurzel ohne eigenen Inhalt. Im Seitenfluss ergibt sie keinen
       Sinn mehr, und sobald einreihen() ihre feste Lage aufhebt, wuerde sie
       als leerer Block von Schirmhoehe die Seite aufblaehen. Deshalb weg -
       und zwar VOR einreihen(), solange "fest" noch ablesbar ist.
       Bedingung gemessen, nicht geraten: fest + fast schirmfuellend + nichts
       drin. Ein echtes Inhaltselement erfuellt das nicht. */
    function blendenAusblenden(dialog) {
      var alle = dialog.querySelectorAll('*');
      for (var i = 0; i < alle.length; i++) {
        var el = alle[i];
        if (el.dataset && el.dataset.ptBlende) continue;
        if (window.getComputedStyle(el).position !== 'fixed') continue;
        var r = el.getBoundingClientRect();
        if (r.width < window.innerWidth * 0.8) continue;
        if (r.height < window.innerHeight * 0.8) continue;
        if (hatInhalt(el)) continue;
        el.style.setProperty('display', 'none', 'important');
        if (el.dataset) el.dataset.ptBlende = '1';
        _ptZaehler.schleier++;
      }
    }

    function check() {
      var el = dialogFinden();
      document.body.classList.toggle(BODY_CLASS, !!el);

      var sicher = !!el || formularfeldSichtbar();
      formSchritt(sicher || Date.now() < _tippBis, sicher);

      if (!el) { wiederZeigen(); entsperren(); return; }

      var view = document.getElementById('pt-cal-view');
      if (view && view.contains(el)) {
        /* Der Fall vom Geraet: der Dialog steht schon in unserem Fluss. */
        nurDialogZeigen(el, view);
      } else {
        /* Die alte Gestalt: Portal an <body>. Dann wird umgehaengt und die
           Terminliste tritt als Ganzes zurueck. */
        var ziel_ = ziel();
        if (ziel_ && el.parentElement !== ziel_) {
          if (el.parentElement) _huelle = el.parentElement;
          ziel_.appendChild(el);
        }
        if (_huelle) schleierEntschaerfen(_huelle);
        if (view && !view.dataset.ptVersteckt) {
          view.dataset.ptVersteckt = '1';
          view.style.setProperty('display', 'none', 'important');
        }
      }
      blendenAusblenden(el);
      einreihen(el);
      entsperren();
    }

    /* ── DER WISCH, DER AUF EINEM KNOPF BEGINNT ───────────────────────────
       Vierter Geraetetest, Wisch auf VERSENDEN/ZURUECK:

         button.bs-button_base__container.ripple | ... | kein Faenger
         Seite bewegt 0px | preventDefault: nein

       Kein Scroll-Kasten in der Kette, kein abgefangenes Ereignis - und
       trotzdem bewegt sich nichts. Daneben gewischt geht es. Es liegt also
       am Startpunkt der Geste, nicht am Weg nach oben.

       Zwei Ursachen kommen dafuer in Frage, und beide werden hier
       abgedeckt, weil sich von hier aus nicht entscheiden laesst, welche es
       ist (Bsports Quelltext ist nicht erreichbar):

       a) touch-action auf dem Knopf verbietet dem Browser das Schieben.
          Dagegen hilft CSS - siehe probetraining-page.css, .pt-bsport-dialog.

       b) Bsports eigener Ripple hoert auf touchmove und ruft dort
          preventDefault, um Geisterklicks zu vermeiden. Dagegen hilft kein
          CSS: einmal abgefangen, ist die Geste verloren.

       Gegen b) hilft nur, dass ihr Hoerer das Ereignis gar nicht erst
       bekommt. Deshalb ein Hoerer in der EINFANGPHASE, also vor allen
       anderen, der die Weitergabe stoppt - sobald klar ist, dass gewischt
       und nicht getippt wird.

       Eng gefasst, damit nichts kaputtgeht:
         - nur Beruehrungen, die im Dialog beginnen,
         - erst ab SCHWELLE Bewegung, also nie beim Tippen,
         - nur wenn die Bewegung ueberwiegend senkrecht ist; ein seitliches
           Ziehen bleibt unangetastet,
         - preventDefault rufen wir selbst NICHT. Wir nehmen der Geste nur
           die Zuhoerer, damit der Browser sie wie gewohnt ausfuehrt.
       touchstart, touchend und click laufen unveraendert weiter - Ripple
       und Klick bleiben also, wie sie sind. */
    /* ── WARUM DER SCHUTZ AB DER ERSTEN BEWEGUNG GREIFT ───────────────────
       Fuenfter Geraetetest, Wisch auf VERSENDEN: touch-action stand richtig
       auf pan-y, kein Scroll-Kasten in der Kette, der Wischschutz hat
       gegriffen ("wisch 1") - und die Seite bewegte sich trotzdem nicht.

       Der Grund ist eine Eigenschaft der Beruehrungsereignisse, die keine
       zweite Chance kennt: wird das erste touchmove einer Geste abgefangen,
       gilt die GANZE Geste als nicht-scrollend. Wer die stoerenden Hoerer
       danach abhaengt, kommt zu spaet - zurueckgenommen wird nichts mehr.

       Die vorige Fassung wartete auf SCHWELLE Bewegung, um Tippen von
       Wischen zu unterscheiden. In dieser Zeit sind ein, zwei touchmove
       durchgegangen - und genau die hat Bsports Ripple abgefangen. Der
       Schutz griff danach korrekt und vollkommen wirkungslos.

       Jetzt wird ab der ERSTEN Bewegung gestoppt, ohne Schwelle und ohne
       Richtungsfrage. Warten kostet die Geste.

       UND WAS IST MIT SEITLICHEM ZIEHEN?
       Die Richtung wird weiter bestimmt - nur nicht mehr, um mit dem Stoppen
       anzufangen, sondern um damit AUFZUHOEREN. Stellt sich die Geste als
       ueberwiegend waagerecht heraus, bekommt Bsport seine Ereignisse ab da
       wieder. Ein seitliches Ziehen beginnt dann minimal spaeter; eine
       senkrechte Geste ist gerettet. Bei zwei Fingern wird sofort
       losgelassen, damit Zoomen unberuehrt bleibt.

       Getippt wird ohne jedes touchmove - Tippen merkt von alledem nichts.
       preventDefault rufen wir weiterhin selbst nicht. */
    var SCHWELLE = 8;
    var _startX = 0, _startY = 0, _imDialog = false, _blocken = false, _richtung = '';

    function wischschutz() {
      document.addEventListener('touchstart', function (e) {
        var t = e.touches && e.touches[0];
        if (!t) return;
        _startX = t.clientX; _startY = t.clientY;
        _richtung = '';
        var ziel = e.target;
        _imDialog = !!(_ptDialog && ziel && _ptDialog.contains(ziel));
        /* Ab hier blockiert - nicht erst, wenn die Richtung feststeht. */
        _blocken = _imDialog;
        if (_blocken) _ptZaehler.wisch++;
      }, { passive: true, capture: true });

      document.addEventListener('touchmove', function (e) {
        if (!_imDialog) return;
        if (e.touches && e.touches.length > 1) { _blocken = false; return; }
        var t = e.touches && e.touches[0];
        if (!t || _richtung) return;
        var dx = Math.abs(t.clientX - _startX);
        var dy = Math.abs(t.clientY - _startY);
        if (dx < SCHWELLE && dy < SCHWELLE) return;
        _richtung = dy > dx ? 'senkrecht' : 'waagerecht';
        /* Waagerecht gehoert Bsport - ab jetzt wieder durchlassen. */
        if (_richtung === 'waagerecht') _blocken = false;
      }, { passive: true, capture: true });

      /* Der eigentliche Schutz. Getrennt vom Messen oben, damit im selben
         Ereignis erst entschieden und dann gestoppt wird. */
      document.addEventListener('touchmove', function (e) {
        if (_blocken) e.stopPropagation();
      }, { passive: true, capture: true });

      document.addEventListener('touchend', function () {
        _imDialog = false; _blocken = false; _richtung = '';
      }, { passive: true, capture: true });
      document.addEventListener('touchcancel', function () {
        _imDialog = false; _blocken = false; _richtung = '';
      }, { passive: true, capture: true });
    }

    /* Mutationen kommen in Schueben, sobald React das Formular aufbaut.
       Auf einen Bildaufbau zusammenfassen. */
    var _pending = false;
    function schedule() {
      if (_pending) return;
      _pending = true;
      window.requestAnimationFrame(function () { _pending = false; check(); });
    }

    /* Am ganzen Dokument beobachten, nicht nur an <body>/childList: der
       Dialog wechselt seinen Inhalt und seine Stile, ohne dass ein Kind von
       <body> dazukommt. Dazu ein ruhiger Takt fuer Aenderungen, die gar
       keine Mutation ausloesen - etwa eine Regel aus einem nachgeladenen
       Stylesheet. */
    ausloeserRuesten();
    wischschutz();
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['style', 'class']
    });
    setInterval(schedule, 500);
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });
    check();
  }

  /* ─────────────────── Diagnose ───────────────────
     Nur mit ?ptdebug=1. Drei Zeilen am unteren Rand, gedacht zum Abfoto-
     grafieren auf dem Geraet:

       Zeile 1  laufender Zustand des Dialogs und die drei Eingriffszaehler.
       Zeile 2  was die letzte Beruehrung getroffen hat, die Kette darueber
                und wer den Wisch faengt.
       Zeile 3  was aus dem letzten Wisch geworden ist: hat jemand
                preventDefault gerufen, und wie weit hat sich die Seite
                wirklich bewegt.

     WARUM DIE ALTE FASSUNG DEN TAETER NICHT ZEIGEN KONNTE
     Sie meldete nur Scroll-Kaesten mit scrollHeight - clientHeight > 4 -
     also ausgerechnet NICHT den Scheinscroller mit null Scrollweg, der die
     Randleiste verursacht hat. Ein Kasten, der die Geste frisst und sich
     dabei nicht bewegt, sah in Zeile 2 aus wie "kein innerer Scroll-Kasten".
     Genau dieser Fall heisst jetzt beim Namen.

     Zeile 3 ist der eigentliche Beweis: "Seite bewegt 0px" bei einem langen
     Wisch heisst, die Geste ist verpufft. Steht daneben "preventDefault JA",
     hat ein Skript sie abgefangen; steht dort "nein", hat sie ein
     Scroll-Kasten geschluckt.

     Bleibt der Tippzaehler bei #0, waehrend der Finger auf dem Formular
     liegt, landet die Beruehrung in einem fremden Dokument (iframe) - das
     waere dann Bsports Sache und von uns nicht loesbar. */
  function _ptSetupTouchDebug() {
    if (!/[?&]ptdebug=1/.test(window.location.search)) return;
    var box = document.createElement('div');
    box.id = 'pt-touch-debug';
    document.body.appendChild(box);
    var zeile1 = document.createElement('div');
    var zeile2 = document.createElement('div');
    var zeile3 = document.createElement('div');
    var zeile4 = document.createElement('div');
    var zeile5 = document.createElement('div');
    zeile2.style.opacity = '0.8';
    zeile3.style.opacity = '0.8';
    zeile4.style.opacity = '0.65';
    zeile5.style.color = '#F5F0E8';
    box.appendChild(zeile1);
    box.appendChild(zeile2);
    box.appendChild(zeile3);
    box.appendChild(zeile4);
    box.appendChild(zeile5);
    var tipps = 0;
    var verlauf = [];
    var letzter = '';
    var startY = 0;
    var abgefangen = false;
    /* Je Geste: wie viele Bewegungen kamen an, wie viele davon haben Bsports
       Hoerer erreicht, und bei der wievielten wurde zuerst abgefangen. Erst
       diese drei Zahlen zusammen unterscheiden die Fehlerarten. */
    var bewegungen = 0, durchgelassen = 0, ersterBlock = 0, schutzAktiv = false;

    function describe(el) {
      if (!el) return '-';
      var cls = (el.className && typeof el.className === 'string')
        ? '.' + el.className.split(' ').slice(0, 2).join('.') : '';
      return (el.tagName || '?').toLowerCase() + (el.id ? '#' + el.id : '') + cls;
    }

    /* auto oder scroll = der Browser darf hier scrollen. hidden zaehlt
       bewusst nicht: daran kann kein Finger ziehen. */
    function scrollbar(cs) {
      return cs.overflowY === 'auto' || cs.overflowY === 'scroll';
    }

    /* Zaehlt die Scheinscroller, die gerade noch im Dialog stehen. Nach dem
       Eingriff muss hier 0 stehen - tut es das nicht, greift der Eingriff
       nicht oder Bsport baut sie schneller nach, als wir sie entschaerfen. */
    /* Zaehlt in BEIDE Richtungen. Die erste Fassung zaehlte nur nach unten -
       und meldete deshalb "offeneScheinscroller=0", waehrend .cleanslate als
       VORFAHRE des Dialogs den Wisch fing. Dieselbe Blindstelle hatte der
       Eingriff selbst; sie ist jetzt an beiden Stellen zu. */
    function scheinImDialog(el) {
      var n = 0;
      function pruefe(k) {
        if (!scrollbar(window.getComputedStyle(k))) return;
        if (k.scrollHeight - k.clientHeight <= 4) n++;
      }
      pruefe(el);
      var alle = el.querySelectorAll('*');
      for (var i = 0; i < alle.length; i++) pruefe(alle[i]);
      var v = el.parentElement;
      while (v && v !== document.body) {
        pruefe(v);
        if (v.id === 'pt-cal-view') break;
        v = v.parentElement;
      }
      return n;
    }

    function echterScrollerIn(el) {
      if (el.scrollHeight - el.clientHeight > 4) return 'selbst';
      var kids = el.querySelectorAll('*');
      for (var i = 0; i < kids.length; i++) {
        var k = kids[i];
        if (k.scrollHeight - k.clientHeight <= 4) continue;
        if (scrollbar(window.getComputedStyle(k))) return describe(k);
      }
      return 'KEINER';
    }

    function zaehlerText() {
      return 'Eingriffe: fest ' + _ptZaehler.fest
           + ' | schein ' + _ptZaehler.schein
           + ' | geste ' + _ptZaehler.geste
           + ' | schleier ' + _ptZaehler.schleier
           + ' | marke ' + _ptZaehler.marke
           + ' | wisch ' + _ptZaehler.wisch
           + ' | deckel ' + _ptZaehler.deckel;
    }

    function zustand() {
      /* Dieselbe Quelle wie der Eingriff: das gehaltene Element. Die Klasse
         allein hat im dritten Geraetetest gelogen, weil React sie zwischen
         zwei Takten abgeraeumt hatte. */
      var el = _ptDialog && document.body.contains(_ptDialog) ? _ptDialog : null;
      var doc = document.scrollingElement || document.documentElement;
      var gesperrt = document.body.style.position === 'fixed'
                  || document.documentElement.style.overflow === 'hidden'
                  || document.body.style.overflow === 'hidden';
      var seite = doc.scrollHeight - doc.clientHeight;
      if (!el) {
        letzter = 'kein Dialog';
        zeile1.textContent = 'Kein Bsport-Dialog offen | Seite scrollbar ' + seite
          + 'px | Sperre ' + (gesperrt ? 'AN' : 'aus')
          + ' | iframes: ' + document.querySelectorAll('iframe').length
          + ' | ' + zaehlerText();
        return;
      }
      var pos = window.getComputedStyle(el).position;
      var h = Math.round(el.getBoundingClientRect().height);
      var offen = scheinImDialog(el);
      var kurz = pos + ' ' + h + '/' + window.innerHeight + ' ' + (gesperrt ? 'gesperrt' : 'frei');
      if (kurz !== letzter) {
        letzter = kurz;
        verlauf.push(kurz);
        if (verlauf.length > 3) verlauf.shift();
      }
      zeile1.textContent = 'Dialog ' + pos + ' h=' + h + '/' + window.innerHeight
        + ' echterScroller=' + echterScrollerIn(el)
        + ' offeneScheinscroller=' + offen
        + ' | Sperre ' + (gesperrt ? 'AN' : 'aus')
        + ' | Seite ' + seite + 'px'
        + ' | ' + zaehlerText()
        + ' | Verlauf: ' + verlauf.join(' -> ');
    }
    /* ── DIE LANDKARTE ───────────────────────────────────────────────────
       Was haengt ausser unserer Seite noch an <body>? Genau diese Frage war
       beim letzten Geraetetest nicht zu beantworten: der Dialog war offen,
       aber der gesuchte Klassenname kam im Protokoll nicht vor, und damit
       blieb unklar, WIE er stattdessen heisst. Diese Zeile beantwortet das
       beim naechsten Mal ohne Rueckfrage. */
    function landkarte() {
      var aus = [];
      var kinder = document.body.children;
      for (var i = 0; i < kinder.length; i++) {
        var el = kinder[i];
        var t = el.tagName;
        if (t === 'SCRIPT' || t === 'STYLE' || t === 'LINK' || t === 'NOSCRIPT') continue;
        if (el.id === 'pt-touch-debug') continue;
        var cs = window.getComputedStyle(el);
        var r = el.getBoundingClientRect();
        /* Zeiger und Sichtbarkeit gehoeren dazu: eine feste Vollbildebene
           sieht ohne sie nach Taeter aus, obwohl sie mit pointer-events none
           keine einzige Beruehrung anfasst - .noise und #mobile-nav sind
           genau solche Faelle auf dieser Seite. */
        aus.push(describe(el) + '{' + cs.position
          + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)
          + (cs.display === 'none' ? ' aus' : '')
          + (cs.visibility === 'hidden' ? ' unsichtbar' : '')
          + (cs.pointerEvents === 'none' ? ' durchlaessig' : ' FAENGT')
          + (el.classList.contains('pt-bsport-dialog') ? ' HAKEN' : '')
          + '}');
      }
      zeile4.textContent = 'body: ' + aus.join(' ');
    }

    /* Wirft eine der beiden Funktionen, bliebe ihre Zeile sonst auf dem
       letzten geglueckten Stand stehen - und zeigte eine Lage, die es
       laengst nicht mehr gibt. Lieber der Fehler im Klartext. */
    /* ── REICHT DIE SEITE BIS ZUM ABSENDEN-KNOPF? ────────────────────────
       Die entscheidende Frage, wenn nach oben schieben geht und nach unten
       nicht: ist der untere Teil des Formulars ueberhaupt im scrollbaren
       Bereich des Dokuments - oder endet das Dokument vorher? Das eine ist
       ein Gestenproblem, das andere ein Hoehenproblem, und die beiden
       brauchen entgegengesetzte Loesungen.

       Dazu: klemmt einer der Vorfahren? Ein Element mit overflow: hidden,
       dessen Inhalt hoeher ist als es selbst, schneidet den Rest einfach ab
       - unerreichbar, egal wie weit man scrollt. Genau danach wird hier
       gesucht, samt Namen und Fehlbetrag. */
    function reichweite() {
      var doc = document.scrollingElement || document.documentElement;
      var teile = ['Seite bei ' + Math.round(window.scrollY)
                 + ' von ' + (doc.scrollHeight - doc.clientHeight) + 'px'
                 + ' (Fenster ' + window.innerHeight + ')'];
      var d = _ptDialog;
      if (!d || !document.contains(d)) {
        zeile5.textContent = teile.join(' | ') + ' | kein Dialog';
        return;
      }
      var endeDoc = doc.scrollHeight;
      var unten = Math.round(d.getBoundingClientRect().bottom + window.scrollY);
      teile.push('Dialog ' + d.offsetHeight + '/' + d.scrollHeight + 'px');
      teile.push('Unterkante ' + unten + ', Dokument endet ' + endeDoc);

      var knoepfe = d.querySelectorAll('button,[role="button"],input[type="submit"]');
      if (knoepfe.length) {
        var letzter = knoepfe[knoepfe.length - 1];
        var lb = Math.round(letzter.getBoundingClientRect().bottom + window.scrollY);
        var txt = String(letzter.textContent || '').trim().slice(0, 12) || '(ohne Text)';
        teile.push('letzter Knopf "' + txt + '" bei ' + lb
          + (lb <= endeDoc + 2 ? ' — erreichbar' : ' — NICHT ERREICHBAR, fehlen ' + (lb - endeDoc) + 'px'));
      }

      /* Wer schneidet ab? */
      var schuldig = '';
      var n = d;
      while (n && n !== document.body) {
        var cs = window.getComputedStyle(n);
        if ((cs.overflowY === 'hidden' || cs.overflowX === 'hidden')
            && n.scrollHeight - n.clientHeight > 4) {
          schuldig = describe(n) + ' schneidet ' + (n.scrollHeight - n.clientHeight) + 'px ab';
          break;
        }
        if (n.id === 'pt-cal-view') break;
        n = n.parentElement;
      }
      teile.push(schuldig || 'nichts schneidet ab');
      zeile5.textContent = teile.join(' | ');
    }

    function takt() {
      try { zustand(); } catch (e) { zeile1.textContent = 'zustand() Fehler: ' + e.message; }
      try { landkarte(); } catch (e) { zeile4.textContent = 'landkarte() Fehler: ' + e.message; }
      try { reichweite(); } catch (e) { zeile5.textContent = 'reichweite() Fehler: ' + e.message; }
    }
    takt();
    setInterval(takt, 500);

    zeile2.textContent = 'Noch nicht getippt (#0). Bleibt die Zahl stehen, waehrend '
      + 'der Finger auf dem Formular liegt: fremdes Dokument (iframe).';
    zeile3.textContent = 'Noch nicht gewischt.';
    zeile4.textContent = 'Landkarte folgt.';
    zeile5.textContent = 'Reichweite folgt.';

    document.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; if (!t) return;
      tipps++;
      startY = window.scrollY;
      abgefangen = false;
      bewegungen = 0; durchgelassen = 0; ersterBlock = 0;
      /* Je Geste, nicht kumulativ: die vorige Fassung meldete "ab #1" auch
         fuer Beruehrungen ausserhalb des Dialogs, wo der Schutz gar nicht
         zustaendig ist. */
      schutzAktiv = !!(_ptDialog && e.target && _ptDialog.contains(e.target));
      var el = document.elementFromPoint(t.clientX, t.clientY);
      if (el && el.tagName === 'IFRAME') {
        zeile2.textContent = '#' + tipps + ' IFRAME — fremdes Dokument, nicht von uns loesbar.';
        return;
      }

      /* Die GANZE Kette nach oben, nicht nur die auffaelligen Glieder.
         Genau daran ist der letzte Geraetetest gescheitert: die Kette endete
         bei div.cleanslate, und was darueber lag - die feste Huelle, an der
         die Erkennung haengt - blieb unsichtbar. Unauffaellige Glieder
         stehen jetzt kurz drin, auffaellige ausfuehrlich. */
      var n = el, kette = [], faenger = null, tiefe = 0;
      while (n && n !== document.body && tiefe++ < 16) {
        var cs = window.getComputedStyle(n);
        var weg = n.scrollHeight - n.clientHeight;
        var fest = cs.position === 'fixed' ? ',fixed' : '';
        if (scrollbar(cs)) {
          var art = weg > 4 ? 'scrollt ' + weg + 'px' : 'SCHEINSCROLLER 0px';
          kette.push(describe(n) + '[' + art + fest + ']');
          if (!faenger) faenger = { el: n, weg: weg };
        } else if (!senkrechtErlaubt(cs.touchAction)) {
          kette.push(describe(n) + '[touch-action:' + cs.touchAction + fest + ']');
          if (!faenger) faenger = { el: n, weg: -1 };
        } else {
          kette.push(describe(n) + (fest ? '[fixed]' : ''));
        }
        n = n.parentElement;
      }

      /* touch-action des beruehrten Elements: der Wert, der entscheidet, ob
         der Browser die Geste ueberhaupt als Schieben annimmt. */
      var ta = el ? window.getComputedStyle(el).touchAction : '-';
      zeile2.textContent = '#' + tipps + ' ' + describe(el) + ' {ta:' + ta + '}'
        + ' | Kette: ' + (kette.length ? kette.join(' > ') : 'nichts Auffaelliges bis <body>')
        + (faenger
            ? ' | faengt: ' + describe(faenger.el)
              + (faenger.weg === -1 ? ' (verbietet Wischen)'
                 : faenger.weg > 4 ? ' (echt, ' + faenger.weg + 'px)'
                 : ' (SCHEIN, 0px — das ist die Falle)')
            : ' | kein Faenger');
    }, { passive: true });

    /* AM FENSTER, NICHT AM DOKUMENT - und das ist der Unterschied zwischen
       einer Auskunft und einer Falschauskunft.

       Die vorige Fassung hing am Dokument. React 16, und darauf laeuft
       Bsports MUI mit seinen JSS-Klassen, haengt SEINE Hoerer ebenfalls ans
       Dokument. Unserer war zuerst da, lief also zuerst - und las
       defaultPrevented, bevor Bsports Hoerer ueberhaupt die Gelegenheit
       hatte, es zu setzen. "preventDefault: nein" war damit kein Befund,
       sondern eine zu frueh gestellte Frage.

       Am Fenster laeuft der Hoerer nach allen Hoerern des Dokuments. Erst
       dort ist die Antwort belastbar. */
    /* In der EINFANGPHASE kommt jede Bewegung an, auch die, die der
       Wischschutz gleich darauf stoppt. stopPropagation haelt nur andere
       KNOTEN auf, nicht weitere Hoerer am selben. */
    document.addEventListener('touchmove', function () {
      bewegungen++;
    }, { passive: true, capture: true });

    /* Am Fenster, also hinter allen Hoerern des Dokuments - dort ist
       defaultPrevented erst belastbar. Stoppt der Wischschutz die Geste,
       laeuft dieser Hoerer gar nicht: genau daran ist ablesbar, dass Bsport
       sie nie zu sehen bekommen hat. */
    window.addEventListener('touchmove', function (e) {
      durchgelassen++;
      if (e.defaultPrevented) {
        abgefangen = true;
        if (!ersterBlock) ersterBlock = durchgelassen;
      }
    }, { passive: true });

    /* ── WARUM touchcancel HIER DAZUGEHOERT ───────────────────────────────
       Zwei Geraetetests hintereinander meldeten "Bewegungen 0", obwohl
       gewischt wurde - einmal auf unserem eigenen Seitentext, weit
       ausserhalb von Bsports Dialog. Ein Zaehler, der dort null zaehlt,
       misst nichts.

       Die Ursache lag nicht im Zaehlen, sondern im Ablesen. Sobald iOS eine
       Geste als Schieben uebernimmt, hoert Safari auf, touchmove zu
       schicken, und beendet die Folge mit touchcancel statt touchend. Die
       Zeile wurde aber nur bei touchend geschrieben - also nie nach genau
       den Gesten, die tatsaechlich gescrollt haben. Abgelesen hat man die
       bei touchstart genullten Zaehler einer spaeteren, folgenlosen
       Beruehrung.

       Jetzt schliesst beides die Geste ab, und die Zeile sagt dazu, womit
       sie geendet hat. touchcancel ist dabei die beste Nachricht, die es
       gibt: iOS hat das Schieben uebernommen. */
    function gesteFertig(art) {
      var weg = Math.round(window.scrollY - startY);
      var urteil;
      if (weg !== 0) urteil = 'in Ordnung';
      else if (ersterBlock === 1) urteil = 'ERSTES touchmove schon abgefangen — Wischschutz kam zu spaet';
      else if (ersterBlock) urteil = 'ab Bewegung #' + ersterBlock + ' abgefangen — Wischschutz zu spaet';
      else if (bewegungen === 0 && /touchcancel/.test(art)) urteil = 'iOS hat das Schieben uebernommen — das ist der Normalfall';
      else if (bewegungen === 0) urteil = 'gar keine Bewegung angekommen';
      else if (durchgelassen === 0) urteil = 'Bsport hat nichts gesehen — dann war es touch-action oder ein Scroll-Kasten';
      else urteil = 'nichts abgefangen — dann war es touch-action oder ein Scroll-Kasten';

      zeile3.textContent = 'Wisch: Seite bewegt ' + weg + 'px'
        + ' | Bewegungen ' + bewegungen + ', an Bsport ' + durchgelassen
        + ' | erstes Abfangen ' + (ersterBlock ? '#' + ersterBlock : 'keins')
        + ' | Wischschutz ' + (schutzAktiv ? 'ab #1' : 'nicht aktiv')
        + ' | Ende durch ' + art
        + ' | ' + urteil;
    }
    document.addEventListener('touchend',    function () { gesteFertig('touchend'); },    { passive: true });
    document.addEventListener('touchcancel', function () { gesteFertig('touchcancel — iOS hat uebernommen'); }, { passive: true });
  }

  /* ─────────────────── Start ─────────────────── */
  function _ptBoot() {
    /* Falls von einer vorherigen Seite eine Scroll-Sperre haengen geblieben
       ist: hier wird ausschliesslich im Seitenfluss gescrollt. */
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';

    _ptMountCalendar();
    _ptAdoptBsportDialog();
    _ptSetupTouchDebug();

    /* Genau ein Ereignis pro Seitenaufruf. Der Name bleibt
       ProbetrainingModalOpen, weil der bestehende GTM-Trigger
       "Probetraining Modal Open" darauf matcht - inhaltlich ist es jetzt der
       Aufruf der Probetraining-Seite. */
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'ProbetrainingModalOpen' });

    /* Den Buchungsweg zu oeffnen ist Absicht, keine Buchung. Der Lead wird
       serverseitig aus /api/bsport-webhook gemeldet, sobald die Rechnung
       finalisiert ist. content_name ist noetig, weil ViewContent auch auf
       /kurse, /coaches und /about feuert. */
    if (window.fbq) fbq('track', 'ViewContent', { content_name: 'Probetraining Seite' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _ptBoot);
  } else {
    _ptBoot();
  }
})();

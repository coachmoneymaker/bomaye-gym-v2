/* Bomaye Gym — Probetraining als eigene Seite
 *
 * WARUM ES DIESE DATEI GIBT (statt probetraining-modal.js)
 *
 * Das Probetraining lag bis hierher in einem eigenen Overlay: ein fest
 * positionierter Kasten mit eigener Scroll-Flaeche, dazu eine Sperre des
 * Seiten-Scrollens (body { position: fixed; overflow: hidden }).
 *
 * Bsport haengt sein Anmeldeformular aber NICHT in den Container, den wir ihm
 * geben. Es rendert es als direktes Kind von <body>, in einem eigenen
 * Portal-Container (.bsport-user-interaction-modal__container). Genau darum
 * ist keine der CSS-Korrekturen aus PR #43 je angekommen: sie waren alle auf
 * #pt-cal-view begrenzt, und das Formular lag nie darin.
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
      booking_type: 'probetraining',
      value: 30,
      currency: 'EUR'
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
              metaActivities: [244432, 244539, 244426, 244420, 244563, 244431, 245265],
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

  /* ─────────────────── Bsports eigenes Modal ───────────────────
     Bsport haengt seinen Buchungs- und Anmeldedialog als direktes Kind an
     <body>. Nach dem Vorbild von stundenplan.html, wo dieses Muster seit jeher
     laeuft: waehrend der Dialog offen ist, tritt unser Header zurueck und der
     Hintergrund scrollt nicht mit. Anders als dort ist die Sperre hier an eine
     Bedingung geknuepft - siehe check() weiter unten.

     Wichtig ist, was hier NICHT passiert: der Dialog bekommt keine
     Hoehendeckelung, kein overflow und keinen zweiten Scroll-Container von
     uns. Er scrollt selbst - das konnte er im alten Overlay nur deshalb
     nicht, weil unsere body-Sperre schon aktiv war, bevor er ueberhaupt
     aufging. */
  function _ptWatchBsportModal() {
    var MODAL_SEL = '.bsport-user-interaction-modal__container';
    var BODY_CLASS = 'bsport-modal-open';
    var _scrollY = 0;
    var _locked = false;
    var _dialog = null;
    var _dialogObserver = null;
    var _tick = null;

    function lockScroll() {
      if (_locked) return;
      _locked = true;
      _scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + _scrollY + 'px';
      document.body.style.width = '100%';
    }

    function unlockScroll() {
      if (!_locked) return;
      _locked = false;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo({ top: _scrollY, behavior: 'instant' });
    }

    /* Hat der Dialog selbst eine Scroll-Flaeche - er selbst oder ein Kind? */
    function hasOwnScroller(el) {
      if (el.scrollHeight - el.clientHeight > 4) return true;
      var kids = el.querySelectorAll('*');
      for (var i = 0; i < kids.length; i++) {
        var k = kids[i];
        if (k.scrollHeight - k.clientHeight <= 4) continue;
        var oy = window.getComputedStyle(k).overflowY;
        if (oy === 'auto' || oy === 'scroll') return true;
      }
      return false;
    }

    /* Die Hintergrundsperre darf nur greifen, wenn Bsports Dialog das Scrollen
       selbst uebernimmt. Im Zweifel wird NICHT gesperrt - eine mitscrollende
       Seite hinter dem Dialog ist ein Schoenheitsfehler, eine faelschlich
       gesetzte Sperre kostet die Buchung.

         im Dokumentfluss          -> nie sperren, das Dokument IST sein Scroller
         fest und passt auf den
           Schirm                  -> sperren, er braucht kein Scrollen
         fest mit eigener
           Scroll-Flaeche          -> sperren, er scrollt selbst
         fest, laenger als der
           Schirm, ohne Scroller   -> nicht sperren                              */
    function shouldLock(el) {
      var pos = window.getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') return false;
      if (el.getBoundingClientRect().height <= window.innerHeight + 1) return true;
      return hasOwnScroller(el);
    }

    function check() {
      var el = document.querySelector(MODAL_SEL);
      document.body.classList.toggle(BODY_CLASS, !!el);
      if (el !== _dialog) { _dialog = el; bindDialog(el); }
      if (el && shouldLock(el)) { lockScroll(); } else { unlockScroll(); }
    }

    /* Mutationen kommen in Schueben, sobald React das Formular aufbaut.
       Auf einen Bildaufbau zusammenfassen, sonst rechnen wir umsonst. */
    var _pending = false;
    function schedule() {
      if (_pending) return;
      _pending = true;
      window.requestAnimationFrame(function () { _pending = false; check(); });
    }

    /* DER PUNKT, AN DEM DIE VORIGE FASSUNG SCHEITERTE
       Sie beobachtete ausschliesslich body/childList. Das meldet nur, dass ein
       Kind von <body> dazukommt oder verschwindet - also genau einmal, wenn
       der Dialog aufgeht. Wechselt DERSELBE Dialog danach seine Positionierung,
       weil aus der Kalenderauswahl das Anmeldeformular wird, feuert dort nichts
       mehr. Die Sperre vom Kalenderschritt blieb liegen und legte den
       Formularschritt still. Nachgestellt:

         Schritt 1 Kalender:  pos=fixed    -> gesperrt   (richtig)
         Schritt 2 Formular:  pos=absolute -> gesperrt   (falsch)
         Ergebnis: Dokument scrollbar 0px, Absende-Button unerreichbar

       Deshalb haengt jetzt zusaetzlich ein Beobachter am Dialog selbst, auf
       style, class und seinen ganzen Inhalt - plus ein ruhiger Takt als Netz
       fuer Aenderungen, die keine Mutation ausloesen (etwa eine Regel aus
       einem nachgeladenen Stylesheet). */
    function bindDialog(el) {
      if (_dialogObserver) { _dialogObserver.disconnect(); _dialogObserver = null; }
      if (_tick) { clearInterval(_tick); _tick = null; }
      if (!el) return;
      _dialogObserver = new MutationObserver(schedule);
      _dialogObserver.observe(el, {
        attributes: true, attributeFilter: ['style', 'class'],
        childList: true, subtree: true
      });
      _tick = setInterval(schedule, 500);
    }

    new MutationObserver(schedule).observe(document.body, { childList: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });
    check();
  }

  /* ─────────────────── Diagnose ───────────────────
     Nur mit ?ptdebug=1. Zwei Zeilen am unteren Rand:

       Zeile 1  laufender Zustand von Bsports Dialog - Positionierung, Hoehe
                gegen Schirmhoehe, eigener Scroller, ob wir gesperrt haben, wie
                weit die Seite scrollen kann. Dazu die letzten Zustandswechsel,
                damit auch der Formularschritt ablesbar ist und nicht nur der
                Kalenderschritt.
       Zeile 2  was der letzte Wisch getroffen hat und wer ihn geschluckt hat.

     Bleibt der Tippzaehler bei #0, waehrend der Finger auf dem Formular liegt,
     landet die Beruehrung in einem fremden Dokument (iframe) - das waere dann
     Bsports Sache und von uns nicht loesbar. */
  function _ptSetupTouchDebug() {
    if (!/[?&]ptdebug=1/.test(window.location.search)) return;
    var box = document.createElement('div');
    box.id = 'pt-touch-debug';
    document.body.appendChild(box);
    var zeile1 = document.createElement('div');
    var zeile2 = document.createElement('div');
    zeile2.style.opacity = '0.75';
    box.appendChild(zeile1);
    box.appendChild(zeile2);
    var tipps = 0;
    var verlauf = [];
    var letzter = '';

    function describe(el) {
      if (!el) return '-';
      var cls = (el.className && typeof el.className === 'string')
        ? '.' + el.className.split(' ').slice(0, 2).join('.') : '';
      return (el.tagName || '?').toLowerCase() + (el.id ? '#' + el.id : '') + cls;
    }

    function scrollerIn(el) {
      if (el.scrollHeight - el.clientHeight > 4) return 'selbst';
      var kids = el.querySelectorAll('*');
      for (var i = 0; i < kids.length; i++) {
        var k = kids[i];
        if (k.scrollHeight - k.clientHeight <= 4) continue;
        var oy = window.getComputedStyle(k).overflowY;
        if (oy === 'auto' || oy === 'scroll') return describe(k);
      }
      return 'KEINER';
    }

    function zustand() {
      var el = document.querySelector('.bsport-user-interaction-modal__container');
      var doc = document.scrollingElement || document.documentElement;
      var gesperrt = document.body.style.position === 'fixed';
      var seite = doc.scrollHeight - doc.clientHeight;
      if (!el) {
        letzter = 'kein Dialog';
        zeile1.textContent = 'Kein Bsport-Dialog offen | Seite scrollbar ' + seite
          + 'px | Sperre ' + (gesperrt ? 'AN' : 'aus')
          + ' | iframes: ' + document.querySelectorAll('iframe').length;
        return;
      }
      var pos = window.getComputedStyle(el).position;
      var h = Math.round(el.getBoundingClientRect().height);
      var kurz = pos + ' ' + h + '/' + window.innerHeight + ' ' + (gesperrt ? 'gesperrt' : 'frei');
      if (kurz !== letzter) {
        letzter = kurz;
        verlauf.push(kurz);
        if (verlauf.length > 3) verlauf.shift();
      }
      zeile1.textContent = 'Dialog ' + pos + ' h=' + h + '/' + window.innerHeight
        + ' Scroller=' + scrollerIn(el)
        + ' | Sperre ' + (gesperrt ? 'AN' : 'aus')
        + ' | Seite ' + seite + 'px'
        + ' | Verlauf: ' + verlauf.join(' -> ');
    }
    zustand();
    setInterval(zustand, 500);

    zeile2.textContent = 'Noch nicht getippt (#0). Bleibt die Zahl stehen, waehrend '
      + 'der Finger auf dem Formular liegt: fremdes Dokument (iframe).';

    document.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; if (!t) return;
      tipps++;
      var el = document.elementFromPoint(t.clientX, t.clientY);
      if (el && el.tagName === 'IFRAME') {
        zeile2.textContent = '#' + tipps + ' IFRAME — fremdes Dokument, nicht von uns loesbar.';
        return;
      }
      var n = el, treffer = null;
      while (n && n !== document.body) {
        var cs = window.getComputedStyle(n);
        if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && n.scrollHeight - n.clientHeight > 4) {
          treffer = n; break;
        }
        n = n.parentElement;
      }
      zeile2.textContent = '#' + tipps + ' ' + describe(el)
        + (treffer
            ? ' | schluckt: ' + describe(treffer) + ' (' + (treffer.scrollHeight - treffer.clientHeight) + 'px)'
            : ' | kein innerer Scroll-Kasten');
    }, { passive: true });
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
    _ptWatchBsportModal();
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

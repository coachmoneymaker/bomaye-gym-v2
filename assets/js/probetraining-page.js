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

    /* Die Hintergrundsperre darf NUR greifen, wenn Bsports Dialog ein fest
       positioniertes Overlay ist. Dann scrollt er selbst, und die Sperre
       verhindert nur, dass die Seite darunter mitwandert.

       Haengt der Dialog dagegen im Dokumentfluss, ist das Dokument sein
       Scroll-Container - eine Sperre wuerde dann genau ihn stilllegen. Gemessen
       mit einem 22-Feld-Formular und zwoelf echten Wischgesten:

         Sperre an  -> Dokument scrollbar 0px,    Absende-Button unerreichbar
         Sperre aus -> Dokument scrollbar 1953px, Absende-Button erreichbar

       Genau diese Sperre lag im alten Overlay schon aktiv auf der Seite, bevor
       Bsports Dialog ueberhaupt aufging. */
    function ownScroller(el) {
      var pos = window.getComputedStyle(el).position;
      return pos === 'fixed' || pos === 'sticky';
    }

    function check() {
      var el = document.querySelector(MODAL_SEL);
      var open = el !== null;
      document.body.classList.toggle(BODY_CLASS, open);
      if (open && ownScroller(el)) { lockScroll(); } else { unlockScroll(); }
    }

    new MutationObserver(check).observe(document.body, { childList: true, subtree: false });
    check();
  }

  /* ─────────────────── Diagnose ───────────────────
     Nur mit ?ptdebug=1. Sagt am Geraet, wo das Formular tatsaechlich haengt
     und wer den Wisch bekommt. Bleibt der Zaehler bei #0, waehrend der Finger
     auf dem Formular liegt, liegt es in einem fremden Dokument (iframe) - das
     waere dann Bsports Sache. */
  function _ptSetupTouchDebug() {
    if (!/[?&]ptdebug=1/.test(window.location.search)) return;
    var box = document.createElement('div');
    box.id = 'pt-touch-debug';
    document.body.appendChild(box);
    var tipps = 0;

    function describe(el) {
      if (!el) return '-';
      var cls = (el.className && typeof el.className === 'string')
        ? '.' + el.className.split(' ').slice(0, 2).join('.') : '';
      return (el.tagName || '?').toLowerCase() + (el.id ? '#' + el.id : '') + cls;
    }

    function leerlauf() {
      if (tipps) return;
      box.textContent = 'Bereit. Tippe auf das Formular. Bleibt die Zahl bei #0, '
        + 'liegt es in einem fremden Dokument (iframe). Bsport-Dialog offen: '
        + (document.querySelector('.bsport-user-interaction-modal__container') ? 'ja' : 'nein')
        + ' | iframes: ' + document.querySelectorAll('iframe').length;
    }
    leerlauf();
    setInterval(leerlauf, 1000);

    document.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; if (!t) return;
      tipps++;
      var el = document.elementFromPoint(t.clientX, t.clientY);
      if (el && el.tagName === 'IFRAME') {
        box.textContent = '#' + tipps + ' IFRAME — fremdes Dokument, nicht von uns loesbar.';
        return;
      }
      /* Naechster senkrecht scrollender Vorfahr - der Kasten, der den Wisch
         tatsaechlich schluckt. */
      var n = el, treffer = null;
      while (n && n !== document.body) {
        var cs = window.getComputedStyle(n);
        if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && n.scrollHeight - n.clientHeight > 4) {
          treffer = { el: n, cs: cs }; break;
        }
        n = n.parentElement;
      }
      var doc = document.scrollingElement || document.documentElement;
      box.textContent = '#' + tipps + ' ' + describe(el)
        + (treffer
            ? ' | scrollt: ' + describe(treffer.el) + ' (' + (treffer.el.scrollHeight - treffer.el.clientHeight) + 'px)'
            : ' | kein innerer Scroll-Kasten')
        + ' | Seite scrollbar um ' + (doc.scrollHeight - doc.clientHeight) + 'px'
        + ' | body fixiert: ' + (document.body.style.position === 'fixed' ? 'JA' : 'nein');
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

(function () {
  'use strict';

  /* ── Body scroll lock ── */
  var _ptScrollY = 0;
  function _ptLockBody() {
    _ptScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _ptScrollY + 'px';
    document.body.style.width = '100%';
  }
  function _ptUnlockBody() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: _ptScrollY, behavior: 'instant' });
  }

  /* ── Booking confirmation tracking ── */
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

    /* ── postMessage listener: log everything, check for Bsport confirmation ── */
    _ptMessageListener = function (e) {
      console.log('📨 postMessage from:', e.origin, '| data:', JSON.stringify(e.data));
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

    /* ── dataLayer.push interceptor: log every push, catch Bsport events ── */
    window.dataLayer = window.dataLayer || [];
    var _origPush = window.dataLayer.push;
    window.dataLayer.push = function () {
      var args = Array.prototype.slice.call(arguments);
      console.log('📊 dataLayer.push:', JSON.stringify(args[0]));
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

    /* ── auto-stop after 10 min ── */
    _ptTrackingTimeout = setTimeout(_ptStopBookingTracking, 10 * 60 * 1000);
  }

  /* ── Bsport-Widget: direkter Mount, ohne iframe ──────────────────────────
     Frueher lag das Widget in einem srcdoc-iframe, nur damit sich die
     Bsport-Oberflaeche per eingeschleustem <style> umfaerben liess. Der Preis
     dafuer war ein zweites Dokument mitten im Modal - und genau daran ist das
     Scrollen auf iOS gescheitert: Beruehrungen landen im iframe-Dokument,
     scrollen muesste aber das Elterndokument. WebKit reicht das nicht weiter
     (bugs.webkit.org/show_bug.cgi?id=149264), und die Umgehungen dafuer gelten
     bis heute als unzuverlaessig. Deshalb wurde ueber die Randleiste gewischt:
     die liegt im Elterndokument und war damit die einzige Stelle, die
     funktionierte.

     Jetzt wird das Widget direkt in den Container gehaengt - genauso wie auf
     allen anderen Seiten dieser Website (kurse, coaches, stundenplan ...), die
     nie Scroll-Probleme hatten, und genauso, wie Bsport es vorsieht:
     BsportWidget.mount({ parentElement: ... }).

     Damit gibt es im Modal nur noch EIN Dokument und genau EINEN Scroll-
     Container. Die Marken-Optik steht jetzt in probetraining-modal.css. */

  /* Das Bsport-Widget laedt RudderStack mit und liegt deshalb hinter der
     Marketing-Einwilligung (PR #29). Ohne Einwilligung erscheint im jeweiligen
     View ein Hinweis; wird sie erteilt, laedt das Widget nach. */
  function _ptGate(view, mountBody) {
    if (typeof window.bomayeGateBsport !== 'function') {
      console.warn('[consent] Consent-Bruecke nicht geladen - Bsport bleibt aus.');
      return;
    }
    window.bomayeGateBsport(view, mountBody);
  }

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

  function _ptMountInto(view, holderId, config) {
    var holder = document.getElementById(holderId);
    if (!holder) {
      holder = document.createElement('div');
      holder.id = holderId;
      view.appendChild(holder);
    }
    _ptLoadBsport(function () {
      try { window.BsportWidget.mount(config); } catch (e) {}
    });
  }

  var _ptWidgetMounted = false;
  function _ptMountWidget() {
    if (_ptWidgetMounted) return;
    var view = document.getElementById('pt-pass-view');
    if (!view) return;
    _ptGate(view, function () {
      if (_ptWidgetMounted) return;
      _ptWidgetMounted = true;
      _ptMountInto(view, 'bsport-widget-458519', {
        parentElement: 'bsport-widget-458519',
        companyId: 5473, franchiseId: null,
        dialogMode: 3, widgetType: 'pass',
        showFab: false, fullScreenPopup: false, styles: undefined,
        config: { pass: { paymentPackCategories: [25328], privatePassCategories: [],
                          hideFilters: true, hidePaymentCombo: true, hidePrivatePass: false } }
      });
    });
  }

  var _ptCalMounted = false;
  function _ptMountCalendarWidget() {
    if (_ptCalMounted) return;
    var view = document.getElementById('pt-cal-view');
    if (!view) return;
    _ptGate(view, function () {
      if (_ptCalMounted) return;
      _ptCalMounted = true;
      _ptMountInto(view, 'bsport-widget-880939', {
        parentElement: 'bsport-widget-880939',
        companyId: 5473, franchiseId: null,
        dialogMode: 3, widgetType: 'calendar',
        showFab: false, fullScreenPopup: false, styles: undefined,
        config: { calendar: { coaches: [], establishments: [],
                              metaActivities: [244432, 244539, 244426, 244420, 244563, 244431, 245265],
                              levels: [], variant: 'time', groupSessionByPeriod: true,
                              todayOnly: false, cardMode: false } }
      });
    });
  }

  /* ── Scroll-Diagnose fuer den Geraetetest ────────────────────────────────
     Sichtbar nur mit ?ptdebug=1 in der URL. Zeigt direkt auf dem Telefon an,
     welches Element die Beruehrung bekommt, ob sie in einem fremden Dokument
     landet und welcher Container tatsaechlich scrollt. Damit ist der naechste
     Test auch dann auswertbar, wenn es immer noch klemmt - ohne Mac, ohne
     angestoepseltes Safari. */
  function _ptSetupTouchDebug() {
    if (!/[?&]ptdebug=1/.test(window.location.search)) return;
    var box = document.createElement('div');
    box.id = 'pt-touch-debug';
    document.body.appendChild(box);
    var startY = 0, startScroll = 0, target = '';

    function describe(el) {
      if (!el) return '-';
      return (el.tagName || '?').toLowerCase()
        + (el.id ? '#' + el.id : '')
        + (el.className && typeof el.className === 'string'
            ? '.' + el.className.split(' ')[0] : '');
    }
    function scroller() {
      var m = document.getElementById('pt-booking-modal');
      var b = m && m.querySelector('.pt-modal-body');
      return { modal: m ? m.scrollTop : -1, body: b ? b.scrollTop : -1, win: window.scrollY };
    }
    document.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; if (!t) return;
      startY = t.clientY;
      var el = document.elementFromPoint(t.clientX, t.clientY);
      target = describe(el);
      var s = scroller();
      startScroll = s.modal + s.body + s.win;
      box.textContent = 'Beruehrt: ' + target + ' | iframes im Modal: '
        + document.querySelectorAll('#pt-booking-modal iframe').length;
    }, { passive: true });
    document.addEventListener('touchend', function () {
      var s = scroller();
      var moved = (s.modal + s.body + s.win) - startScroll;
      box.textContent = 'Beruehrt: ' + target
        + ' | gescrollt: ' + moved + 'px'
        + ' | modal ' + s.modal + ' body ' + s.body + ' seite ' + s.win
        + ' | iframes: ' + document.querySelectorAll('#pt-booking-modal iframe').length;
    }, { passive: true });
  }

  /* ── Global API (exposed for onclick= attributes) ── */
  window.ptSwitchTab = function (tab) {
    var passView = document.getElementById('pt-pass-view');
    var calView  = document.getElementById('pt-cal-view');
    var tabPass  = document.getElementById('pt-tab-pass');
    var tabCal   = document.getElementById('pt-tab-cal');
    if (tab === 'pass') {
      passView.className = 'pt-modal-view pt-modal-view--active';
      calView.className  = 'pt-modal-view';
      tabPass.className  = 'pt-modal-tab active';
      tabPass.setAttribute('aria-selected', 'true');
      tabCal.className   = 'pt-modal-tab';
      tabCal.setAttribute('aria-selected', 'false');
    } else {
      calView.className  = 'pt-modal-view pt-modal-view--active';
      passView.className = 'pt-modal-view';
      tabCal.className   = 'pt-modal-tab active';
      tabCal.setAttribute('aria-selected', 'true');
      tabPass.className  = 'pt-modal-tab';
      tabPass.setAttribute('aria-selected', 'false');
      _ptMountCalendarWidget();
    }
  };

  window.ptOpenModal = function () {
    var modal = document.getElementById('pt-booking-modal');
    if (!modal) return;
    _ptMountWidget();
    _ptMountCalendarWidget();
    document.body.classList.add('pt-modal-open');
    modal.classList.add('open');
    _ptLockBody();
    _ptStartBookingTracking();
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      var mb = modal.querySelector('.pt-modal-body');
      if (mb) { mb.style.webkitOverflowScrolling = 'touch'; mb.style.overflowY = 'auto'; }
    }
    // Exactly one modal-open event per open, pushed only once the modal is
    // actually on screen. Two names used to be pushed here —
    // ProbetrainingModalOpen and probetraining_modal_open — so any GTM trigger
    // that matched both fired twice for a single open. The CamelCase name is
    // the one the existing GTM trigger "Probetraining Modal Open" matches, so
    // that is the one kept.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'ProbetrainingModalOpen' });
    // Opening the booking modal is intent, not a booking. The actual Lead is
    // sent server-side from /api/bsport-webhook once the invoice is finalized.
    // content_name is required here: ViewContent also fires on /kurse, /coaches
    // and /about, so without it a modal-open audience cannot be separated from
    // ordinary page views.
    if (window.fbq) fbq('track', 'ViewContent', { content_name: 'Probetraining Modal' });
    modal.dispatchEvent(new Event('pt-modal-open', { bubbles: true }));
  };

  window.ptCloseModal = function () {
    var modal = document.getElementById('pt-booking-modal');
    if (!modal || !modal.classList.contains('open')) return;
    modal.classList.remove('open');
    _ptStopBookingTracking();
    document.body.classList.remove('pt-modal-open');
    _ptUnlockBody();
  };

  /* ── Modal HTML injection — runs once per page ── */
  function _ptInjectModal() {
    if (document.getElementById('pt-booking-modal')) return;
    var el = document.createElement('div');
    el.id = 'pt-booking-modal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Probetraining buchen');
    el.setAttribute('data-event', 'probetraining-modal-opened');
    el.innerHTML =
      '<div class="pt-modal-card">'
      + '<div class="pt-modal-header">'
      + '<div class="pt-modal-header-text">'
      + '<p class="pt-modal-eyebrow">DEIN PROBETRAINING</p>'
      + '<h2 class="pt-modal-title">Wähle deinen Termin</h2>'
      + '</div>'
      + '<button class="pt-modal-close" onclick="ptCloseModal()" aria-label="Schließen" type="button"><i class="fa-solid fa-xmark"></i></button>'
      + '<button id="pt-continue-button" class="pt-continue-button" onclick="ptSwitchTab(\'cal\')" aria-label="Weiter zu Schritt 2" type="button">'
      + '<span class="pt-continue-text">✓ KURS BUCHEN</span>'
      + '<span class="pt-continue-subtitle">Klicke hier nach Pass-Kauf</span>'
      + '</button>'
      + '</div>'
      + '<div class="pt-modal-tabs" role="tablist">'
      + '<button class="pt-modal-tab active" id="pt-tab-pass" onclick="ptSwitchTab(\'pass\')" role="tab" aria-selected="true" type="button">1. PASS HOLEN</button>'
      + '<button class="pt-modal-tab" id="pt-tab-cal" onclick="ptSwitchTab(\'cal\')" role="tab" aria-selected="false" type="button">2. KURS WÄHLEN</button>'
      + '</div>'
      + '<div class="pt-modal-body">'
      + '<div id="pt-pass-view" class="pt-modal-view pt-modal-view--active"></div>'
      + '<div id="pt-cal-view" class="pt-modal-view"></div>'
      + '</div>'
      + '<div class="pt-modal-footer"><p>Du wirst sicher über bsport.io abgewickelt — kostenlos, unverbindlich.</p></div>'
      + '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) { if (e.target === this) ptCloseModal(); });
  }

  /* True only when the query string carries a parameter actually NAMED
     "probetraining". A campaign parameter whose VALUE happens to contain the
     word does not match. */
  function _ptHasProbetrainingParam(search) {
    var qs = String(search || '').replace(/^\?/, '');
    if (!qs) return false;
    if (typeof URLSearchParams === 'function') {
      try { return new URLSearchParams(qs).has('probetraining'); } catch (e) {}
    }
    var parts = qs.split('&');
    for (var i = 0; i < parts.length; i++) {
      var name = parts[i].split('=')[0];
      try { name = decodeURIComponent(name.replace(/\+/g, ' ')); } catch (e) {}
      if (name === 'probetraining') return true;
    }
    return false;
  }

  /* ── Boot ── */
  function _ptBoot() {
    /* Defensive reset: clear any stuck scroll-lock state from a previous page load */
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    _ptInjectModal();
    _ptSetupTouchDebug();
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ptCloseModal(); });
    /* Auto-open only on an explicit ?probetraining parameter, which is what
       the /probetraining redirect in vercel.json points at. This was a
       substring search over the whole query string, so any campaign URL
       carrying the word — say ?utm_campaign=probetraining-september — opened
       the modal on every ad click and reported an intent that never happened. */
    if (_ptHasProbetrainingParam(window.location.search)) {
      setTimeout(window.ptOpenModal, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _ptBoot);
  } else {
    _ptBoot();
  }
})();

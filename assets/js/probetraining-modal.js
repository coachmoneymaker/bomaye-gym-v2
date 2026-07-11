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

  /* ── Bomaye brand CSS for the directly-mounted Bsport widget ──
     Official Bsport embed = script mount into a page element (no iframe,
     no nested scroll context). Branding is scoped to the modal; Bsport
     dialogs portal to <body>, so they get a z-index above the modal. */
  function _ptInjectBrandCSS() {
    if (document.getElementById('pt-bsport-brand-css')) return;
    var s = document.createElement('style');
    s.id = 'pt-bsport-brand-css';
    s.textContent = ''
      + '#pt-booking-modal button,#pt-booking-modal .MuiButton-root,#pt-booking-modal .MuiButtonBase-root{border-radius:0!important;text-transform:uppercase!important;letter-spacing:.5px!important;font-weight:600!important;box-shadow:none!important;}'
      + '#pt-booking-modal .MuiButton-contained,#pt-booking-modal .MuiButton-containedPrimary{background-color:#C9A84C!important;color:#0A0A08!important;border:2px solid #C9A84C!important;}'
      + '#pt-booking-modal .MuiButton-text,#pt-booking-modal .MuiButton-outlined{color:#0A0A08!important;background:transparent!important;border:2px solid rgba(10,10,8,.2)!important;}'
      + '#pt-booking-modal .MuiCard-root,#pt-booking-modal .MuiPaper-root{border-radius:0!important;box-shadow:none!important;}'
      + '#pt-booking-modal .MuiInputBase-root,#pt-booking-modal .MuiOutlinedInput-root{border-radius:0!important;}'
      + '#pt-booking-modal .MuiChip-root{border-radius:0!important;background-color:rgba(201,168,76,.1)!important;color:#0A0A08!important;border:1px solid #C9A84C!important;}'
      /* Bsport checkout dialogs render in a body-level portal: keep them above the modal (z-index 9000) */
      + '.bsport-user-interaction-modal__container{z-index:99999!important;}'
      + 'body.pt-modal-open [class*="bsport"][class*="modal"]{z-index:99999;}';
    document.head.appendChild(s);
  }

  /* ── Bsport widget.js loader (main document, loaded once) ── */
  function _ptLoadBsportCDN() {
    if (typeof window.BsportWidget !== 'undefined' || document.getElementById('bsport-widget-cdn')) return;
    var m = document.createElement('script');
    m.id = 'bsport-widget-cdn';
    m.src = 'https://cdn.bsport.io/scripts/widget.js';
    document.getElementsByTagName('head')[0].appendChild(m);
  }

  function _ptMountBsportWidget(config, repeat) {
    repeat = repeat || 1;
    if (repeat > 50) return;
    if (!window.BsportWidget) {
      return setTimeout(function () { _ptMountBsportWidget(config, repeat + 1); }, 100 * repeat);
    }
    window.BsportWidget.mount(config);
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

  /* ── Bsport widget lazy-mounting (official direct mount, no iframe) ── */
  var _ptWidgetMounted = false;
  function _ptMountWidget() {
    if (_ptWidgetMounted) return;
    _ptWidgetMounted = true;
    var view = document.getElementById('pt-pass-view');
    if (!view) return;
    _ptInjectBrandCSS();
    _ptLoadBsportCDN();
    var target = document.createElement('div');
    target.id = 'bsport-widget-458519';
    target.className = 'pt-widget-host';
    view.appendChild(target);
    _ptMountBsportWidget({
      parentElement: 'bsport-widget-458519',
      companyId: 5473,
      franchiseId: null,
      dialogMode: 3,
      widgetType: 'pass',
      showFab: false,
      fullScreenPopup: false,
      styles: undefined,
      config: { pass: { paymentPackCategories: [25328], privatePassCategories: [], hideFilters: true, hidePaymentCombo: true, hidePrivatePass: false } }
    });
  }

  var _ptCalMounted = false;
  function _ptMountCalendarWidget() {
    if (_ptCalMounted) return;
    _ptCalMounted = true;
    var view = document.getElementById('pt-cal-view');
    if (!view) return;
    _ptInjectBrandCSS();
    _ptLoadBsportCDN();
    var target = document.createElement('div');
    target.id = 'bsport-widget-880939';
    target.className = 'pt-widget-host';
    view.appendChild(target);
    _ptMountBsportWidget({
      parentElement: 'bsport-widget-880939',
      companyId: 5473,
      franchiseId: null,
      dialogMode: 3,
      widgetType: 'calendar',
      showFab: false,
      fullScreenPopup: false,
      styles: undefined,
      config: { calendar: { coaches: [], establishments: [], metaActivities: [244432, 244539, 244426, 244420, 244563, 244431, 245265], levels: [], variant: 'time', groupSessionByPeriod: true, todayOnly: false, cardMode: false } }
    });
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
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({event: 'ProbetrainingModalOpen'});
    var modal = document.getElementById('pt-booking-modal');
    if (!modal) return;
    _ptMountWidget();
    _ptMountCalendarWidget();
    document.body.classList.add('pt-modal-open');
    modal.classList.add('open');
    _ptLockBody();
    _ptStartBookingTracking();
    if (window.dataLayer) dataLayer.push({ event: 'probetraining_modal_open' });
    if (window.fbq) fbq('track', 'Lead');
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

  /* ── Boot ── */
  function _ptBoot() {
    /* Defensive reset: clear any stuck scroll-lock state from a previous page load */
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    _ptInjectModal();
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ptCloseModal(); });
    if (window.location.search.indexOf('probetraining') !== -1) {
      setTimeout(window.ptOpenModal, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _ptBoot);
  } else {
    _ptBoot();
  }
})();

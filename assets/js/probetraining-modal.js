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

  /* ── Bomaye brand CSS injected into Bsport srcdoc iframes ── */
  var _ptBomayeWidgetCSS = '<style>'
    + 'html,body{margin:0!important;padding:0!important;overflow:visible!important;height:auto!important;min-height:0!important;max-height:none!important;-webkit-overflow-scrolling:auto!important;}'
    + '[id^="bsport-widget-"]{overflow:visible!important;height:auto!important;min-height:0!important;}'
    + '*{overflow:visible!important;max-height:none!important;}'
    + 'div[style*="overflow"]{overflow:visible!important;max-height:none!important;height:auto!important;}'
    + 'button,.MuiButton-root,[role="button"],.MuiButtonBase-root{border-radius:0!important;text-transform:uppercase!important;letter-spacing:.5px!important;font-weight:600!important;box-shadow:none!important;overflow:hidden!important;}'
    + '.MuiButton-contained,.MuiButton-containedPrimary{background-color:#C9A84C!important;color:#0A0A08!important;border:2px solid #C9A84C!important;}'
    + '.MuiButton-text,.MuiButton-outlined{color:#0A0A08!important;background:transparent!important;border:2px solid rgba(10,10,8,.2)!important;}'
    + '.MuiCard-root,.MuiPaper-root{border-radius:0!important;box-shadow:none!important;}'
    + '.MuiInputBase-root,.MuiOutlinedInput-root{border-radius:0!important;}'
    + '.MuiChip-root{border-radius:0!important;background-color:rgba(201,168,76,.1)!important;color:#0A0A08!important;border:1px solid #C9A84C!important;}'
    + '</style>';

  /* ── Iframe auto-resize (same-origin srcdoc iframes) ── */
  function _ptResizeIframeToContent(iframe) {
    if (typeof iframe === 'string') iframe = document.getElementById(iframe);
    if (!iframe) return false;
    var doc;
    try { doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document); } catch (e) { return false; }
    if (!doc || !doc.body) return false;
    var body = doc.body, html = doc.documentElement;
    var bodyRect = body.getBoundingClientRect().height, htmlRect = html.getBoundingClientRect().height;
    var contentH = Math.max(body.scrollHeight, body.offsetHeight, bodyRect, html.clientHeight, html.scrollHeight, html.offsetHeight, htmlRect);
    var deepest = 0;
    try {
      var els = body.querySelectorAll('*');
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        var b = r.top + r.height;
        if (b > deepest && r.height > 0) deepest = b;
      }
    } catch (e) {}
    var finalH = Math.max(contentH, deepest);
    var currentH = parseInt(iframe.style.height) || 0;
    if (finalH > 50 && Math.abs(finalH - currentH) > 20) { iframe.style.height = finalH + 'px'; return true; }
    return false;
  }

  function _ptStartIframeAutoResize(iframeId) {
    _ptStopIframeAutoResize(iframeId);
    var iframe = document.getElementById(iframeId);
    if (!iframe) return;
    var startTime = Date.now();
    function tick() {
      if (!document.getElementById(iframeId)) return;
      var elapsed = Date.now() - startTime;
      _ptResizeIframeToContent(iframe);
      var next = elapsed < 5000 ? 100 : elapsed < 15000 ? 300 : elapsed < 30000 ? 1000 : -1;
      if (next === -1) return;
      iframe._ptResizeTimer = setTimeout(tick, next);
    }
    tick();
    iframe.addEventListener('load', function () {
      setTimeout(function () { _ptResizeIframeToContent(iframe); }, 100);
      setTimeout(function () { _ptResizeIframeToContent(iframe); }, 500);
      setTimeout(function () { _ptResizeIframeToContent(iframe); }, 1500);
      try {
        var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
        if (!doc || !doc.body) return;
        if (typeof ResizeObserver !== 'undefined') {
          var ro = new ResizeObserver(function () { _ptResizeIframeToContent(iframe); });
          ro.observe(doc.body); ro.observe(doc.documentElement);
          Array.prototype.forEach.call(doc.body.children, function (c) { try { ro.observe(c); } catch (e) {} });
          iframe._ptResizeObserver = ro;
        }
        var mo = new MutationObserver(function () {
          if (iframe._ptResizeObserver) {
            Array.prototype.forEach.call(doc.body.children, function (c) { try { iframe._ptResizeObserver.observe(c); } catch (e) {} });
          }
          _ptResizeIframeToContent(iframe);
        });
        mo.observe(doc.body, { childList: true, subtree: true });
        iframe._ptMutationObserver = mo;
      } catch (e) {}
    });
  }

  function _ptStopIframeAutoResize(iframeId) {
    var iframe = document.getElementById(iframeId);
    if (!iframe) return;
    if (iframe._ptResizeTimer) { clearTimeout(iframe._ptResizeTimer); delete iframe._ptResizeTimer; }
    if (iframe._ptResizeObserver) { iframe._ptResizeObserver.disconnect(); delete iframe._ptResizeObserver; }
    if (iframe._ptMutationObserver) { iframe._ptMutationObserver.disconnect(); delete iframe._ptMutationObserver; }
  }

  /* ── Bsport widget lazy-mounting ── */
  var _ptWidgetMounted = false;
  function _ptMountWidget() {
    if (_ptWidgetMounted) return;
    _ptWidgetMounted = true;
    var view = document.getElementById('pt-pass-view');
    if (!view) return;
    var wrap = document.createElement('div');
    wrap.className = 'pt-iframe-wrapper';
    var iframe = document.createElement('iframe');
    iframe.id = 'pt-pass-iframe';
    iframe.className = 'pt-bsport-iframe';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('scrolling', 'no');
    iframe.srcdoc = _ptBomayeWidgetCSS
      + '<script id="insert-bsport-widget-cdn">!function(b,s,p,o,r,t){typeof window.BsportWidget==="undefined"&&!document.getElementById("bsport-widget-cdn")&&!function(){m=b.createElement(s),m.id="bsport-widget-cdn",m.src=p,b.getElementsByTagName("head")[0].appendChild(m)}()}(document,"script","https://cdn.bsport.io/scripts/widget.js")<\/script>'
      + '<script id="bsport-widget-mount">function MountBsportWidget(config,repeat){repeat=repeat||1;if(repeat>50)return;if(!window.BsportWidget)return setTimeout(function(){MountBsportWidget(config,repeat+1)},100*repeat||1);BsportWidget.mount(config)}<\/script>'
      + '<script>MountBsportWidget({"parentElement":"bsport-widget-458519","companyId":5473,"franchiseId":null,"dialogMode":3,"widgetType":"pass","showFab":false,"fullScreenPopup":false,"styles":undefined,"config":{"pass":{"paymentPackCategories":[25328],"privatePassCategories":[],"hideFilters":true,"hidePaymentCombo":true,"hidePrivatePass":false}}})<\/script>'
      + '<div id="bsport-widget-458519"></div>';
    wrap.appendChild(iframe);
    view.appendChild(wrap);
    _ptStartIframeAutoResize('pt-pass-iframe');
  }

  var _ptCalMounted = false;
  function _ptMountCalendarWidget() {
    if (_ptCalMounted) return;
    _ptCalMounted = true;
    var view = document.getElementById('pt-cal-view');
    if (!view) return;
    var wrap = document.createElement('div');
    wrap.className = 'pt-iframe-wrapper';
    var iframe = document.createElement('iframe');
    iframe.id = 'pt-cal-iframe';
    iframe.className = 'pt-bsport-iframe';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('scrolling', 'no');
    iframe.srcdoc = _ptBomayeWidgetCSS
      + '<script id="insert-bsport-widget-cdn">!function(b,s,p,o,r,t){typeof window.BsportWidget==="undefined"&&!document.getElementById("bsport-widget-cdn")&&!function(){m=b.createElement(s),m.id="bsport-widget-cdn",m.src=p,b.getElementsByTagName("head")[0].appendChild(m)}()}(document,"script","https://cdn.bsport.io/scripts/widget.js")<\/script>'
      + '<script id="bsport-widget-mount">function MountBsportWidget(config,repeat){repeat=repeat||1;if(repeat>50)return;if(!window.BsportWidget)return setTimeout(function(){MountBsportWidget(config,repeat+1)},100*repeat||1);BsportWidget.mount(config)}<\/script>'
      + '<script>MountBsportWidget({"parentElement":"bsport-widget-880939","companyId":5473,"franchiseId":null,"dialogMode":3,"widgetType":"calendar","showFab":false,"fullScreenPopup":false,"styles":undefined,"config":{"calendar":{"coaches":[],"establishments":[],"metaActivities":[244432,244539,244426,244420,244563,244431,245265],"levels":[],"variant":"time","groupSessionByPeriod":true,"todayOnly":false,"cardMode":false}}})<\/script>'
      + '<div id="bsport-widget-880939"></div>';
    wrap.appendChild(iframe);
    view.appendChild(wrap);
    _ptStartIframeAutoResize('pt-cal-iframe');
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
    modal.classList.add('open');
    _ptLockBody();
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      var mb = modal.querySelector('.pt-modal-body');
      if (mb) { mb.style.webkitOverflowScrolling = 'touch'; mb.style.overflowY = 'auto'; }
    }
    if (window.dataLayer) dataLayer.push({ event: 'probetraining_modal_open' });
    if (window.fbq) fbq('track', 'Lead');
    modal.dispatchEvent(new Event('pt-modal-open', { bubbles: true }));
  };

  window.ptCloseModal = function () {
    var modal = document.getElementById('pt-booking-modal');
    if (!modal || !modal.classList.contains('open')) return;
    modal.classList.remove('open');
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

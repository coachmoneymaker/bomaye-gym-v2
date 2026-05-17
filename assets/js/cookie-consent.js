(function () {
  'use strict';

  var CONSENT_KEY = 'bomaye_cookie_consent';
  var CONSENT_VERSION = '1.0';
  var CONSENT_TTL = 365 * 24 * 60 * 60 * 1000;

  /* ── Storage ──────────────────────────────────────────────── */
  function getConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (d.version !== CONSENT_VERSION) return null;
      if (Date.now() - new Date(d.timestamp).getTime() > CONSENT_TTL) return null;
      return d;
    } catch (e) { return null; }
  }

  function saveConsent(marketing, statistics) {
    var d = {
      essential: true,
      statistics: !!statistics,
      marketing: !!marketing,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(d));
    return d;
  }

  /* ── Meta Pixel conditional loader ───────────────────────── */
  window.loadMetaPixel = function () {
    if (window._metaPixelLoaded) return;
    window._metaPixelLoaded = true;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    fbq('init', '1989119321999811');
    fbq('track', 'PageView');
  };

  /* Apply stored marketing consent immediately on load */
  var _existing = getConsent();
  if (_existing && _existing.marketing) window.loadMetaPixel();

  /* ── DOM ready ────────────────────────────────────────────── */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {

    /* ── Inject HTML ──────────────────────────────────────────── */
    var html = [
      /* Banner */
      '<div id="cookie-banner" role="region" aria-label="Cookie-Hinweis">',
        '<div class="cb-text-block">',
          '<p class="cb-title">WIR RESPEKTIEREN DEINE PRIVATSPHÄRE.</p>',
          '<p class="cb-text">Wir nutzen Cookies für ein besseres Erlebnis. Mehr in der <a href="/datenschutz">Datenschutzerklärung</a>.</p>',
        '</div>',
        '<div class="cb-buttons">',
          '<div class="cb-buttons-primary">',
            '<button class="cb-btn cb-btn--accept" id="cb-accept">ALLE AKZEPTIEREN</button>',
            '<button class="cb-btn cb-btn--reject" id="cb-reject">ABLEHNEN</button>',
          '</div>',
          '<button class="cb-btn cb-btn--settings" id="cb-open-settings">EINSTELLUNGEN</button>',
        '</div>',
      '</div>',
      /* Modal backdrop */
      '<div id="cookie-modal-backdrop" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen" class="cb-hidden">',
        '<div id="cookie-modal">',
          '<button class="cm-close" id="cm-close" aria-label="Schließen">&#x2715;</button>',
          '<p class="cm-title">COOKIE-EINSTELLUNGEN</p>',
          '<p class="cm-subtitle">Wähle, welche Cookies du zulassen möchtest. Deine Auswahl kannst du jederzeit anpassen.</p>',
          '<div class="cm-categories">',
            /* Essenziell */
            '<div class="cm-category">',
              '<div class="cm-category-header">',
                '<div>',
                  '<span class="cm-category-title">ESSENZIELL</span>',
                  '<span class="cm-category-status">Immer aktiv</span>',
                '</div>',
                '<label class="cm-toggle" aria-label="Essenziell (immer aktiv)">',
                  '<input type="checkbox" id="toggle-essential" checked disabled>',
                  '<span class="cm-toggle-track"></span>',
                '</label>',
              '</div>',
              '<p class="cm-category-desc">Diese Cookies sind für den Betrieb der Website notwendig und können nicht deaktiviert werden. Sie speichern zum Beispiel deine Cookie-Auswahl.</p>',
            '</div>',
            /* Statistik */
            '<div class="cm-category">',
              '<div class="cm-category-header">',
                '<div><span class="cm-category-title">STATISTIK</span></div>',
                '<label class="cm-toggle" aria-label="Statistik-Cookies">',
                  '<input type="checkbox" id="toggle-statistics">',
                  '<span class="cm-toggle-track"></span>',
                '</label>',
              '</div>',
              '<p class="cm-category-desc">Hilft uns zu verstehen, wie die Website genutzt wird — komplett anonym. Aktuell nicht aktiv, wird ggf. später ergänzt.</p>',
            '</div>',
            /* Marketing */
            '<div class="cm-category">',
              '<div class="cm-category-header">',
                '<div><span class="cm-category-title">MARKETING</span></div>',
                '<label class="cm-toggle" aria-label="Marketing-Cookies">',
                  '<input type="checkbox" id="toggle-marketing">',
                  '<span class="cm-toggle-track"></span>',
                '</label>',
              '</div>',
              '<p class="cm-category-desc">Ermöglicht personalisierte Werbung auf Plattformen wie Meta (Facebook, Instagram). Wir nutzen dafür den Meta Pixel.</p>',
            '</div>',
          '</div>',
          '<div class="cm-footer">',
            '<button class="cb-btn cm-btn--essential" id="cm-essential-only">NUR ESSENZIELLE</button>',
            '<button class="cb-btn cm-btn--save" id="cm-save">AUSWAHL SPEICHERN</button>',
          '</div>',
        '</div>',
      '</div>',
      /* Floating button */
      '<button id="cookie-settings-btn" aria-label="Cookie-Einstellungen öffnen" title="Cookie-Einstellungen">&#x1F36A;</button>'
    ].join('');

    document.body.insertAdjacentHTML('beforeend', html);

    /* ── Element refs ─────────────────────────────────────────── */
    var banner   = document.getElementById('cookie-banner');
    var backdrop = document.getElementById('cookie-modal-backdrop');
    var floatBtn = document.getElementById('cookie-settings-btn');
    var tMktg    = document.getElementById('toggle-marketing');
    var tStat    = document.getElementById('toggle-statistics');

    /* ── Initial state ────────────────────────────────────────── */
    var consent = getConsent();
    if (consent) {
      banner.classList.add('cb-hidden');
    } else {
      floatBtn.classList.add('cb-hidden');
    }

    /* ── Banner helpers ───────────────────────────────────────── */
    function closeBanner() {
      banner.classList.add('cb-hidden');
      floatBtn.classList.remove('cb-hidden');
    }

    /* ── Modal helpers ────────────────────────────────────────── */
    function openModal() {
      var c = getConsent();
      tMktg.checked = !!(c && c.marketing);
      tStat.checked = !!(c && c.statistics);
      backdrop.classList.remove('cb-hidden');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { document.getElementById('cm-close').focus(); }, 50);
    }

    function closeModal() {
      backdrop.classList.add('cb-hidden');
      document.body.style.overflow = '';
    }

    /* ── Banner button handlers ───────────────────────────────── */
    document.getElementById('cb-accept').addEventListener('click', function () {
      saveConsent(true, true);
      window.loadMetaPixel();
      closeBanner();
    });

    document.getElementById('cb-reject').addEventListener('click', function () {
      saveConsent(false, false);
      closeBanner();
    });

    document.getElementById('cb-open-settings').addEventListener('click', openModal);
    floatBtn.addEventListener('click', openModal);

    /* ── Modal button handlers ────────────────────────────────── */
    document.getElementById('cm-close').addEventListener('click', closeModal);

    document.getElementById('cm-essential-only').addEventListener('click', function () {
      saveConsent(false, false);
      closeModal();
      closeBanner();
    });

    document.getElementById('cm-save').addEventListener('click', function () {
      var mktg = tMktg.checked;
      var stats = tStat.checked;
      var prev = getConsent();
      var prevMktg = !!(prev && prev.marketing);
      saveConsent(mktg, stats);
      closeModal();
      closeBanner();
      if (mktg && !prevMktg) {
        window.loadMetaPixel();
      } else if (!mktg && prevMktg) {
        var notice = document.createElement('div');
        notice.style.cssText = [
          'position:fixed;bottom:72px;left:50%;transform:translateX(-50%);',
          'background:#0A0A08;color:#F5F0E8;padding:12px 24px;',
          'font-size:13px;letter-spacing:0.06em;z-index:10000;',
          'border:1px solid #C9A84C;white-space:nowrap;'
        ].join('');
        notice.textContent = 'Seite wird neu geladen\u2026';
        document.body.appendChild(notice);
        setTimeout(function () { window.location.reload(); }, 1000);
      }
    });

    /* ── Backdrop click closes modal ──────────────────────────── */
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal();
    });

    /* ── Keyboard: Escape closes modal ───────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !backdrop.classList.contains('cb-hidden')) closeModal();
    });

    /* ── Focus trap inside modal ──────────────────────────────── */
    document.getElementById('cookie-modal').addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var modal = document.getElementById('cookie-modal');
      var focusable = modal.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* ── Footer "Cookie-Einstellungen" links ─────────────────── */
    document.querySelectorAll('.cookie-settings-link').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });

  }); // ready
})();

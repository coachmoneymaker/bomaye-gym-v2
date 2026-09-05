/* Bomaye Gym — Cookiebot-Bruecke
 *
 * Loest assets/js/cookie-consent.js ab. Banner, Einwilligungsspeicher und der
 * Consent-Mode-Update laufen jetzt vollstaendig ueber Cookiebot
 * (CBID 0712dfb0-9e83-4255-b8c9-0bf0dcb228af, data-blockingmode="auto").
 *
 * Cookiebot blockiert die Drittanbieter-<script src>-Tags im <head> (GTM,
 * gtag.js) selbst. Diese Datei kuemmert sich um genau das, was das
 * automatische Blocking NICHT zuverlaessig erwischt, weil wir es selbst zur
 * Laufzeit einhaengen:
 *
 *   1. Meta Pixel inkl. Advanced Matching (frueher window.loadMetaPixel)
 *   2. Das Bsport-Widget, das RudderStack mitbringt (siehe unten)
 *   3. Den Footer-Link "Cookie-Einstellungen", der jetzt Cookiebot.renew() ruft
 *
 * Warum das Bsport-Widget ueberhaupt hier auftaucht: cdn.bsport.io/scripts/
 * widget.js laedt RudderStack (rl_anonymous_id, rl_session, ...) und lief
 * bisher voellig ungated. Bsport bietet keinen dokumentierten Consent-Schalter
 * an - BsportWidget.mount() kennt keinen entsprechenden Parameter -, und der
 * RudderStack-Teil laesst sich aus dem fremden, minifizierten Bundle nicht
 * herausloesen. Deshalb wird das Widget als Ganzes hinter die
 * Marketing-Einwilligung gelegt und ohne Einwilligung ein Hinweis mit
 * Freigabe-Button angezeigt.
 */
(function () {
  'use strict';

  var META_PIXEL_ID = '1989119321999811';

  /* Alter Einwilligungssatz des abgeloesten Eigenbau-Moduls. Er wird nicht
     mehr gelesen und wuerde bei einer spaeteren Pruefung nur den Eindruck
     erwecken, es gaebe zwei parallele Einwilligungsquellen. */
  try { localStorage.removeItem('bomaye_cookie_consent'); } catch (e) {}

  /* ─────────────────────────── Consent-Status ─────────────────────────── */

  function marketingConsented() {
    var cb = window.Cookiebot;
    return !!(cb && cb.consent && cb.consent.marketing);
  }
  window.bomayeMarketingConsented = marketingConsented;

  var _waiting = [];
  var _flushed = false;

  function flush() {
    if (!marketingConsented()) return;
    _flushed = true;
    var queue = _waiting;
    _waiting = [];
    for (var i = 0; i < queue.length; i++) {
      try { queue[i](); } catch (e) { /* ein Callback darf die anderen nicht mitreissen */ }
    }
  }

  /* Fuehrt fn aus, sobald die Marketing-Einwilligung vorliegt: sofort, wenn sie
     schon da ist, sonst beim naechsten Cookiebot-Ereignis. Wird die
     Einwilligung nie erteilt, laeuft fn nie - das ist der Sinn der Sache. */
  function whenMarketingConsent(fn) {
    if (typeof fn !== 'function') return;
    if (marketingConsented()) { try { fn(); } catch (e) {} return; }
    _waiting.push(fn);
  }
  window.bomayeWhenMarketingConsent = whenMarketingConsent;

  /* Cookiebot feuert CookiebotOnConsentReady bei jedem Seitenaufruf, sobald der
     gespeicherte Stand steht, und CookiebotOnAccept nach einer Zustimmung.
     Beide werden abgehoert, damit sowohl der wiederkehrende Besucher mit
     bestehender Einwilligung als auch die Zustimmung im laufenden Seitenaufruf
     abgedeckt sind. */
  window.addEventListener('CookiebotOnConsentReady', flush);
  window.addEventListener('CookiebotOnAccept', flush);

  /* ───────────────────────────── Meta Pixel ───────────────────────────── */

  var _amUserData = null;   /* gehashtes Advanced Matching, nur im Speicher */
  var _pixelLoaded = false;

  function normalizeEmail(v) {
    v = String(v == null ? '' : v).trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
  }

  /* Deutsche Rufnummern in die Form, die Meta erwartet: nur Ziffern mit
     Laendervorwahl, ohne Plus und ohne Trenner. Gleiche Regel wie in
     api/bsport-webhook.js, damit Browser- und Server-Ereignis denselben Hash
     erzeugen. */
  function normalizePhone(v) {
    var d = String(v == null ? '' : v).replace(/\D/g, '');
    if (!d) return null;
    if (d.indexOf('00') === 0) d = d.slice(2);
    else if (d.charAt(0) === '0') d = '49' + d.slice(1);
    return d.length >= 8 ? d : null;
  }

  function amPayload() {
    if (!_amUserData) return null;
    var o = {};
    if (_amUserData.em) o.em = _amUserData.em;
    if (_amUserData.ph) o.ph = _amUserData.ph;
    return (o.em || o.ph) ? o : null;
  }

  function loadMetaPixel() {
    if (_pixelLoaded) return;
    if (!marketingConsented()) return;   /* harte Sperre, zweite Verteidigungslinie */
    _pixelLoaded = true;
    window._metaPixelLoaded = true;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    var am = amPayload();
    if (am) fbq('init', META_PIXEL_ID, am);
    else    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }
  window.loadMetaPixel = loadMetaPixel;
  whenMarketingConsent(loadMetaPixel);

  /* Oeffentlicher Haken fuer echte Nutzerdaten aus einem Formular. Die
     Einwilligungspruefung steht bewusst VOR jeder Verarbeitung: schon das
     Ablegen im Speicher waere eine Erhebung ohne Rechtsgrundlage. Damit bleibt
     _amUserData null, solange keine Einwilligung vorliegt - es gibt also auch
     nichts, was bei einer spaeteren Einwilligung nachtraeglich verwendet
     werden koennte. */
  window.bomayeSetPixelUserData = function (data) {
    if (!marketingConsented()) return;
    data = data || {};
    var em = normalizeEmail(data.email);
    var ph = normalizePhone(data.phone);
    if (!em && !ph) return;
    _amUserData = {
      em: em || (_amUserData && _amUserData.em) || null,
      ph: ph || (_amUserData && _amUserData.ph) || null
    };
    if (_pixelLoaded && typeof window.fbq === 'function') {
      var am = amPayload();
      if (am) fbq('init', META_PIXEL_ID, am);   /* AM fuer Folgeereignisse nachziehen */
    }
  };

  /* Erfasst echte Nutzerdaten in dem Moment, in dem ein Formular abgeschickt
     wird. Laeuft in der Capture-Phase, damit es auch mit onsubmit=-Handlern
     funktioniert.

     Die Einwilligungspruefung ist die allererste Anweisung - vor querySelector
     und vor jedem Lesen von .value. Ohne Einwilligung fasst der Handler die
     Formulardaten gar nicht erst an. Die Pruefung liegt im Handler und nicht
     bei der Registrierung, damit ein Besucher, der spaeter im selben
     Seitenaufruf einwilligt, ab dann normal erfasst wird - aber eben nur mit
     Absendungen NACH der Einwilligung.

     Dieser Handler dient ausschliesslich dem Advanced Matching. Das Absenden
     der Formulare laeuft unabhaengig davon ueber assets/js/main.js. */
  document.addEventListener('submit', function (e) {
    if (!marketingConsented()) return;
    var form = e.target;
    if (!form || !form.querySelector) return;
    var emailEl = form.querySelector('input[type="email"], input[name="email"]');
    var phoneEl = form.querySelector('input[type="tel"], input[name="phone"]');
    if (!emailEl && !phoneEl) return;
    window.bomayeSetPixelUserData({
      email: emailEl && emailEl.value,
      phone: phoneEl && phoneEl.value
    });
  }, true);

  /* ──────────────────── Bsport-Widget hinter Einwilligung ──────────────── */

  var PLACEHOLDER_CLASS = 'bomaye-consent-gate';

  function renderPlaceholder(container) {
    if (!container) return;
    if (container.querySelector('.' + PLACEHOLDER_CLASS)) return;
    var box = document.createElement('div');
    box.className = PLACEHOLDER_CLASS;
    box.setAttribute('role', 'note');

    var h = document.createElement('p');
    h.className = PLACEHOLDER_CLASS + '__title';
    h.textContent = 'Buchungssystem benötigt deine Einwilligung';

    var p = document.createElement('p');
    p.className = PLACEHOLDER_CLASS + '__text';
    p.textContent = 'Unser Buchungssystem wird von bsport bereitgestellt und setzt dabei '
      + 'Marketing-Cookies. Wir laden es erst, wenn du dem zugestimmt hast.';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = PLACEHOLDER_CLASS + '__btn';
    btn.textContent = 'MARKETING-COOKIES ERLAUBEN UND BUCHUNG LADEN';
    btn.addEventListener('click', function () {
      if (window.Cookiebot && typeof window.Cookiebot.renew === 'function') {
        window.Cookiebot.renew();
      }
    });

    var alt = document.createElement('p');
    alt.className = PLACEHOLDER_CLASS + '__alt';
    alt.innerHTML = 'Lieber ohne Cookies buchen? Ruf uns an: '
      + '<a href="tel:+491737513627">+49 173 7513627</a> '
      + 'oder schreib uns per <a href="https://wa.me/491737513627" '
      + 'target="_blank" rel="noopener">WhatsApp</a>.';

    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(btn);
    box.appendChild(alt);
    container.appendChild(box);
  }

  function removePlaceholder(container) {
    if (!container) return;
    var el = container.querySelector('.' + PLACEHOLDER_CLASS);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /* Einziger Einstiegspunkt fuer alle Bsport-Einbindungen: mit Einwilligung
     wird mount() ausgefuehrt, ohne Einwilligung erscheint der Hinweis im
     Zielcontainer. Wird die Einwilligung spaeter erteilt, verschwindet der
     Hinweis und mount() laeuft nach - ohne Neuladen der Seite. */
  window.bomayeGateBsport = function (containerId, mount) {
    var container = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : containerId;

    if (marketingConsented()) {
      removePlaceholder(container);
      try { mount(); } catch (e) {}
      return;
    }

    renderPlaceholder(container);
    whenMarketingConsent(function () {
      removePlaceholder(container);
      try { mount(); } catch (e) {}
    });
  };

  /* ────────────────── Footer-Link "Cookie-Einstellungen" ───────────────── */

  function wireSettingsLinks() {
    var links = document.querySelectorAll('.cookie-settings-link');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        if (window.Cookiebot && typeof window.Cookiebot.renew === 'function') {
          window.Cookiebot.renew();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireSettingsLinks);
  } else {
    wireSettingsLinks();
  }

  /* Falls Cookiebot bereits stand, bevor diese Datei lief (Cache, sehr
     schneller Start), holen wir den Zustand einmal aktiv nach - sonst warten
     wir auf ein Ereignis, das schon vorbei ist. */
  if (marketingConsented() && !_flushed) flush();

})();

/* PAKETKLICKS MESSEN. Checkout -> begin_checkout, blosse Navigation ->
   select_item. Meta und Ads nur beim Checkout und nur, wenn fbq bzw. gtag
   schon da sind. Kein preventDefault, kein Cookie, nie gtag("consent").
   Alles weitere: docs/tracking-events.md */
(function () {
  'use strict';

  var SPERRE_MS = 1500;   /* zweiter Klick auf denselben Knopf: verworfen */
  var zuletzt = new WeakMap();

  /* Liegt pixel-events.js hier, gehoert Meta ihm. */
  var fremderPixelHoerer = !!document.querySelector('script[src*="pixel-events"]');

  /* Ads-Kennung vom eigenen Skript-Tag, aus ADS_CHECKOUT_SEND_TO. Leer = aus. */
  var eigenes = document.querySelector('script[src*="plan-tracking"]');
  var ADS = (eigenes && eigenes.getAttribute('data-ads-send-to')) || '';

  function dl() {
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
  }

  /* Pfad ohne Abfragezeichenfolge: utm und fbclid bleiben draussen. */
  function ort() {
    try { return location.origin + location.pathname; } catch (e) { return ''; }
  }

  /* Eigene Kennung je Klick; der Webhook sendet nie InitiateCheckout. */
  function kennung() {
    try {
      if (window.crypto && window.crypto.randomUUID) return 'ic-' + window.crypto.randomUUID();
    } catch (e) {}
    return 'ic-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }

  function zahl(s) {
    var n = parseFloat(String(s == null ? '' : s).replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  function melde(el) {
    var jetzt = Date.now();
    var vorher = zuletzt.get(el);
    if (vorher && jetzt - vorher < SPERRE_MS) return;
    zuletzt.set(el, jetzt);

    var id    = el.getAttribute('data-abo-contract') || el.getAttribute('data-item-id') || '';
    var name  = el.getAttribute('data-item-name') || '';
    var kat   = el.getAttribute('data-item-category') || '';
    var preis = zahl(el.getAttribute('data-price'));
    var erst  = zahl(el.getAttribute('data-first-payment'));
    var plan  = el.getAttribute('data-plan') || '';
    var art   = el.getAttribute('data-offer') || '';
    var wert  = erst == null ? preis : erst;
    /* Ohne Angabe die vorsichtige Lesart: kein Checkout. */
    var name2 = el.getAttribute('data-ga-event') || 'select_item';
    var checkout = name2 === 'begin_checkout';

    dl().push({
      event: name2,
      ecommerce: {
        currency: 'EUR',
        value: wert,
        items: [{ item_id: id, item_name: name, item_category: kat, price: preis }]
      },
      page_location: ort(),
      plan: plan,
      offer_type: art
    });

    /* Meta nur beim Checkout, nur wenn der Pixel laeuft und sonst niemand. */
    if (checkout && !fremderPixelHoerer && typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        value: wert,
        currency: 'EUR',
        content_ids: [id],
        content_name: name,
        content_category: kat
      }, { eventID: kennung() });
    }

    /* Ads-Mikrokonversion. Ueber die Einwilligung entscheidet allein
       Consent Mode (Vorgabe denied, ads_data_redaction an). */
    if (checkout && ADS && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: ADS, value: wert, currency: 'EUR' });
    }
  }

  document.addEventListener('click', function (e) {
    var z = e.target;
    if (!z || typeof z.closest !== 'function') return;
    var el = z.closest('[data-abo-contract], [data-item-category]');
    if (!el) return;
    if (!el.getAttribute('data-item-category')) return;
    melde(el);
  }, { capture: true, passive: true });

  /* Overlay offen: abo-embed.js setzt "is-open", von aussen beobachtbar. */
  var auf = document.querySelector('.bsport-modal-overlay');
  if (auf && window.MutationObserver) {
    var warOffen = auf.classList.contains('is-open');
    new MutationObserver(function () {
      var offen = auf.classList.contains('is-open');
      if (offen && !warOffen) dl().push({ event: 'plan_overlay_opened', page_location: ort() });
      warOffen = offen;
    }).observe(auf, { attributes: true, attributeFilter: ['class'] });
  }
}());

/* PAKETKLICKS MESSEN. begin_checkout in den dataLayer; InitiateCheckout an
   Meta nur, wenn window.fbq existiert (also nach Einwilligung) und
   pixel-events.js nicht auf der Seite liegt. Kein preventDefault, kein
   Nachladen, kein Cookie. Felder und GTM: docs/tracking-events.md */
(function () {
  'use strict';

  var SPERRE_MS = 1500;   /* zweiter Klick auf denselben Knopf: verworfen */
  var zuletzt = new WeakMap();

  /* Liegt pixel-events.js hier, gehoert Meta ihm. */
  var fremderPixelHoerer = !!document.querySelector('script[src*="pixel-events"]');

  function dl() {
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
  }

  /* Pfad ohne Abfragezeichenfolge: utm und fbclid bleiben draussen. */
  function ort() {
    try { return location.origin + location.pathname; } catch (e) { return ''; }
  }

  /* Eigene Kennung je Klick. Der Webhook sendet nie InitiateCheckout. */
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

    dl().push({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'EUR',
        value: wert,
        items: [{ item_id: id, item_name: name, item_category: kat, price: preis }]
      },
      page_location: ort(),
      plan: plan,
      offer_type: art
    });

    /* Meta nur, wenn der Pixel laeuft und sonst niemand feuert. */
    if (!fremderPixelHoerer && typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        value: wert,
        currency: 'EUR',
        content_ids: [id],
        content_name: name,
        content_category: kat
      }, { eventID: kennung() });
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

  /* Overlay offen: abo-embed.js setzt "is-open". Von aussen beobachtbar,
     ohne abo-embed.js anzufassen. Nur der Wechsel zaehlt. */
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

/* Meta Pixel – standard event tracking
 * Lead           → clicks on /mitglied-werden or /mitgliederbereich
 * InitiateCheckout → clicks on any backoffice.bsport.io link/button
 * ViewContent    → fired inline on /kurse, /coaches, /about page load
 */
(function () {
  document.addEventListener('click', function (e) {
    if (typeof fbq !== 'function') return;

    var el = e.target.closest('a, button');
    if (!el) return;

    var href    = el.getAttribute('href')    || '';
    var onclick = el.getAttribute('onclick') || '';

    // Lead: MITGLIED WERDEN or LOGIN / MEIN KONTO
    if (href === '/mitglied-werden' || href === '/mitgliederbereich') {
      fbq('track', 'Lead');
      return;
    }

    // InitiateCheckout: direct bsport booking links
    // Prevent default so the pixel event fires before opening the new tab
    if (href.indexOf('backoffice.bsport.io') !== -1) {
      e.preventDefault();
      fbq('track', 'InitiateCheckout');
      setTimeout(function () {
        window.open(href, '_blank');
      }, 200);
      return;
    }

    // InitiateCheckout: bsport buttons (onclick-based, navigation cannot be delayed)
    if (onclick.indexOf('backoffice.bsport.io') !== -1) {
      fbq('track', 'InitiateCheckout');
    }
  });
})();

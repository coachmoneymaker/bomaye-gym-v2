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

    // InitiateCheckout: direct bsport booking links / buttons
    if (href.indexOf('backoffice.bsport.io') !== -1 ||
        onclick.indexOf('backoffice.bsport.io') !== -1) {
      fbq('track', 'InitiateCheckout');
    }
  });
})();

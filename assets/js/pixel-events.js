/* Meta Pixel – standard event tracking
 * Lead             → clicks on /mitglied-werden or /mitgliederbereich
 * InitiateCheckout → clicks on any bsport.io / checkout / subscription link or button
 * ViewContent      → fired inline on /kurse, /coaches, /about page load
 */
(function () {

  // All URL patterns that signal a Bsport checkout / subscription flow
  var BSPORT_PATTERNS = [
    'backoffice.bsport.io',
    'bsport.io',
    '/checkout/',
    '/subscription/'
  ];

  function containsBsport(str) {
    if (!str) return false;
    for (var i = 0; i < BSPORT_PATTERNS.length; i++) {
      if (str.indexOf(BSPORT_PATTERNS[i]) !== -1) return true;
    }
    return false;
  }

  // Try to extract a destination URL from an onclick attribute string.
  // Handles: window.open('URL'), window.location.href='URL', window.location='URL',
  // and any quoted string that contains a known Bsport pattern.
  function extractUrlFromOnclick(onclick) {
    var m;

    // window.open('URL', ...)
    m = onclick.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/);
    if (m) return { url: m[1], newTab: true };

    // window.location.href = 'URL'  or  window.location = 'URL'
    m = onclick.match(/window\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/);
    if (m) return { url: m[1], newTab: false };

    // Any quoted string that contains a Bsport-pattern URL
    m = onclick.match(/['"]([^'"]*(?:bsport\.io|\/checkout\/|\/subscription\/)[^'"]*)['"]/);
    if (m) return { url: m[1], newTab: false };

    return null;
  }

  document.addEventListener('click', function (e) {
    if (typeof fbq !== 'function') return;

    // Walk up from the clicked element to the nearest <a> or <button>
    var el = e.target.closest('a, button');
    if (!el) return;

    var href     = el.getAttribute('href')    || '';
    var onclick  = el.getAttribute('onclick') || '';
    // Also check common data-* attributes used for programmatic navigation
    var dataHref = (el.getAttribute('data-href') ||
                    el.getAttribute('data-url')  ||
                    el.getAttribute('data-link') || '');

    // ── Lead: membership / login pages ──────────────────────────────────
    if (href === '/mitglied-werden' || href === '/mitgliederbereich') {
      fbq('track', 'Lead');
      return;
    }

    // ── InitiateCheckout ─────────────────────────────────────────────────
    // Match when ANY of href / onclick / data-* contains a Bsport pattern
    var hrefMatch    = containsBsport(href);
    var onclickMatch = containsBsport(onclick);
    var dataMatch    = containsBsport(dataHref);

    if (hrefMatch || onclickMatch || dataMatch) {
      console.log('INITIATECHECKOUT MATCH', { href: href, onclick: onclick, dataHref: dataHref });

      // Prevent the browser from navigating immediately so the pixel
      // request has time to leave the browser before the page unloads.
      e.preventDefault();
      fbq('track', 'InitiateCheckout');

      setTimeout(function () {

        // ── href-based or data-attribute-based navigation ────────────────
        if (hrefMatch || dataMatch) {
          var dest   = href || dataHref;
          var newTab = el.getAttribute('target') === '_blank' ||
                       (el.getAttribute('rel') || '').indexOf('noopener') !== -1;

          if (newTab) {
            var win = window.open(dest, '_blank');
            // Replicate rel="noopener" security behaviour
            if (win) win.opener = null;
          } else {
            window.location.href = dest;
          }
          return;
        }

        // ── onclick-based navigation ─────────────────────────────────────
        var extracted = extractUrlFromOnclick(onclick);
        if (extracted) {
          if (extracted.newTab) {
            window.open(extracted.url, '_blank');
          } else {
            window.location.href = extracted.url;
          }
        } else {
          // Last resort: re-execute the onclick handler in the element's context
          try {
            new Function(onclick).call(el);
          } catch (err) {
            console.warn('INITIATECHECKOUT: failed to replay onclick handler', err);
          }
        }

      }, 250);

      return;
    }
  });

})();

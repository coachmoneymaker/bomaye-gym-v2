/* Meta Pixel – standard event tracking
 * Lead             → clicks on /mitglied-werden or /mitgliederbereich
 * InitiateCheckout → clicks on any bsport.io / checkout / subscription link or button,
 *                    OR buttons whose visible text matches checkout keywords
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

  // Visible button text that signals a checkout / sign-up intent (lowercase)
  var CHECKOUT_KEYWORDS = [
    'mitglied werden',
    'jetzt starten',
    'buy',
    'join'
  ];

  function containsBsport(str) {
    if (!str) return false;
    for (var i = 0; i < BSPORT_PATTERNS.length; i++) {
      if (str.indexOf(BSPORT_PATTERNS[i]) !== -1) return true;
    }
    return false;
  }

  function containsCheckoutKeyword(str) {
    if (!str) return false;
    var lower = str.toLowerCase().trim();
    for (var i = 0; i < CHECKOUT_KEYWORDS.length; i++) {
      if (lower.indexOf(CHECKOUT_KEYWORDS[i]) !== -1) return true;
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

    // Walk up from the clicked element to the nearest <a> or <button>.
    // Fall back to the raw target so onclick/text checks still work on
    // elements like <div onclick="..."> that aren't wrapped in a/button.
    var el = e.target.closest('a, button') || e.target;
    if (!el) return;

    var href      = el.getAttribute('href')    || '';
    var onclick   = el.getAttribute('onclick') || '';
    // Also check common data-* attributes used for programmatic navigation
    var dataHref  = (el.getAttribute('data-href') ||
                     el.getAttribute('data-url')  ||
                     el.getAttribute('data-link') || '');
    var innerText = (el.innerText || el.textContent || '');

    // ── Lead: membership / login pages ──────────────────────────────────
    if (href === '/mitglied-werden' || href === '/mitgliederbereich') {
      fbq('track', 'Lead');
      return;
    }

    // ── InitiateCheckout detection ────────────────────────────────────────
    var hrefMatch    = containsBsport(href);
    var onclickMatch = containsBsport(onclick);
    var dataMatch    = containsBsport(dataHref);
    var textMatch    = containsCheckoutKeyword(innerText);

    // Guard: fire InitiateCheckout at most once per click event
    if (!(hrefMatch || onclickMatch || dataMatch || textMatch)) return;

    console.log('INITIATE CHECKOUT TRIGGERED', el);
    fbq('track', 'InitiateCheckout');

    // ── Navigation handling ───────────────────────────────────────────────
    // For URL-based matches we intercept the navigation so the pixel request
    // has time to leave the browser before the page unloads (250 ms grace).
    // For text-only matches we let the original event / handler proceed
    // naturally, because we cannot safely reconstruct an unknown destination.
    var urlMatch = hrefMatch || onclickMatch || dataMatch;
    if (!urlMatch) return;

    e.preventDefault();

    setTimeout(function () {

      // ── href-based or data-attribute-based navigation ──────────────────
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

      // ── onclick-based navigation ───────────────────────────────────────
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
  });

})();

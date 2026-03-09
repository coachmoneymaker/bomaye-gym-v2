/* ============================================================
   BOMAYE GYM MUNICH — main.js
   ============================================================ */

/* ── Bsport: load CDN once, declare helper once ────────────── */
(function () {
  if (!document.getElementById('bsport-widget-cdn')) {
    var s = document.createElement('script');
    s.id  = 'bsport-widget-cdn';
    s.src = 'https://cdn.bsport.io/scripts/widget.js';
    document.head.appendChild(s);
  }
})();

function MountBsportWidget(config, repeat) {
  repeat = repeat || 1;
  if (repeat > 50) { return; }
  if (typeof window.BsportWidget === 'undefined') {
    return setTimeout(function () { MountBsportWidget(config, repeat + 1); }, 100 * repeat || 1);
  }
  BsportWidget.mount(config);
}

/* ── Mount widgets on DOM ready ────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  // Calendar widget — Free Trial section
  MountBsportWidget({
    parentElement:   'bsport-widget-226833',
    companyId:       5473,
    franchiseId:     null,
    dialogMode:      1,
    widgetType:      'calendar',
    showFab:         false,
    fullScreenPopup: false,
    styles:          undefined,
    config: {
      calendar: {
        coaches:            [],
        establishments:     [],
        metaActivities:     [],
        levels:             [],
        variant:            null,
        groupSessionByPeriod: true
      }
    }
  });

  // Subscription widget — Membership section
  MountBsportWidget({
    parentElement:   'bsport-widget-727621',
    companyId:       5473,
    franchiseId:     null,
    dialogMode:      1,
    widgetType:      'subscription',
    showFab:         false,
    fullScreenPopup: false,
    styles:          undefined,
    config: {
      subscription: {}
    }
  });
});

/* ── Preloader ─────────────────────────────────────────────── */
(function () {
  var pre  = document.getElementById('preloader');
  var line = document.getElementById('loader-line');
  if (!pre) return;
  if (line) setTimeout(function () { line.style.width = '220px'; }, 50);
  window.addEventListener('load', function () {
    setTimeout(function () { pre.classList.add('hidden'); }, 600);
  });
})();

/* ── Header scroll state ───────────────────────────────────── */
(function () {
  var header = document.getElementById('header');
  if (!header) return;
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 20); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Mobile nav ────────────────────────────────────────────── */
function toggleMenu() {
  var nav = document.getElementById('mobile-nav');
  var btn = document.getElementById('burger-btn');
  if (!nav) return;
  var open = nav.classList.toggle('open');
  document.body.style.overflow = open ? 'hidden' : '';
  if (btn) btn.setAttribute('aria-expanded', open);
}

function mobileNav(view, section) {
  toggleMenu();
  setTimeout(function () { nav(view, section); }, 300);
}

/* ── SPA view routing ──────────────────────────────────────── */
function nav(viewId, sectionId) {
  // Hide all views
  document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
  // Show target
  var target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');
  // Update back button visibility
  var backBtn = document.querySelector('.back-btn');
  if (backBtn) backBtn.style.display = viewId === 'home' ? 'none' : 'flex';
  // Scroll to section or top
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (sectionId) {
    setTimeout(function () {
      var el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
  // Re-run reveal for new view
  setTimeout(runReveal, 150);
}

/* ── Pricing tabs ──────────────────────────────────────────── */
function switchPricingTab(group, btn) {
  document.querySelectorAll('.ptab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.price-panel').forEach(function (p) { p.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var panel = document.getElementById('panel-' + group);
  if (panel) panel.classList.add('active');
}

/* ── FAQ accordion ─────────────────────────────────────────── */
function toggleFaq(btn) {
  var expanded = btn.getAttribute('aria-expanded') === 'true';
  // Close all
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.setAttribute('aria-expanded', 'false');
    var a = q.nextElementSibling;
    if (a) a.style.maxHeight = null;
  });
  // Open clicked (if it was closed)
  if (!expanded) {
    btn.setAttribute('aria-expanded', 'true');
    var ans = btn.nextElementSibling;
    if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
  }
}

/* ── Map consent gate ──────────────────────────────────────── */
function loadMap() {
  var gate  = document.getElementById('map-gate');
  var frame = document.getElementById('map-frame');
  if (!frame) return;
  frame.src = 'https://www.openstreetmap.org/export/embed.html?bbox=11.535%2C48.138%2C11.555%2C48.148&layer=mapnik&marker=48.143%2C11.545';
  if (gate) gate.classList.add('hidden');
}

/* ── Scroll reveal ─────────────────────────────────────────── */
function runReveal() {
  var els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (el) { observer.observe(el); });
}
document.addEventListener('DOMContentLoaded', runReveal);

/* ── Service card keyboard accessibility ───────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.service-card[tabindex]').forEach(function (card) {
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
});

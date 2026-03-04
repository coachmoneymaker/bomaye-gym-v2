/* ============================================================
   BOMAYE GYM MUNICH — main.js
   ============================================================ */

/* ── Preloader ─────────────────────────────────────────────── */
(function () {
  const pre  = document.getElementById('preloader');
  const line = document.getElementById('loader-line');
  if (!pre) return;
  if (line) setTimeout(() => { line.style.width = '220px'; }, 50);
  window.addEventListener('load', () => {
    setTimeout(() => { pre.classList.add('hidden'); }, 600);
  });
})();

/* ── Header scroll state ───────────────────────────────────── */
(function () {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Mobile nav ────────────────────────────────────────────── */
function toggleMenu() {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('burger-btn');
  if (!nav) return;
  const open = nav.classList.toggle('open');
  document.body.style.overflow = open ? 'hidden' : '';
  if (btn) btn.setAttribute('aria-expanded', open);
}

function mobileNav(view, section) {
  toggleMenu();
  setTimeout(() => nav(view, section), 300);
}

/* ── SPA view routing ──────────────────────────────────────── */
function nav(viewId, sectionId) {
  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  // Show target
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');
  // Update back button visibility
  const backBtn = document.querySelector('.back-btn');
  if (backBtn) backBtn.style.display = viewId === 'home' ? 'none' : 'flex';
  // Scroll to section or top
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (sectionId) {
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
  // Re-run reveal for new view
  setTimeout(runReveal, 150);
}

/* ── Pricing tabs ──────────────────────────────────────────── */
function switchPricingTab(group, btn) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.price-panel').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const panel = document.getElementById('panel-' + group);
  if (panel) panel.classList.add('active');
}

/* ── FAQ accordion ─────────────────────────────────────────── */
function toggleFaq(btn) {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  // Close all
  document.querySelectorAll('.faq-q').forEach(q => {
    q.setAttribute('aria-expanded', 'false');
    const a = q.nextElementSibling;
    if (a) a.style.maxHeight = null;
  });
  // Open clicked (if it was closed)
  if (!expanded) {
    btn.setAttribute('aria-expanded', 'true');
    const ans = btn.nextElementSibling;
    if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
  }
}

/* ── Map consent gate ──────────────────────────────────────── */
function loadMap() {
  const gate  = document.getElementById('map-gate');
  const frame = document.getElementById('map-frame');
  if (!frame) return;
  frame.src = 'https://www.openstreetmap.org/export/embed.html?bbox=11.535%2C48.138%2C11.555%2C48.148&layer=mapnik&marker=48.143%2C11.545';
  if (gate) gate.classList.add('hidden');
}

/* ── Booking modal (Bsport) ────────────────────────────────── */
let bsportMounted = false;

function openBooking(source) {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Mount Bsport widget once
  if (!bsportMounted) {
    mountBsport();
    bsportMounted = true;
  }
}

function closeBooking() {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function mountBsport() {
  // Load CDN if not present
  if (!document.getElementById('bsport-widget-cdn')) {
    const s = document.createElement('script');
    s.id  = 'bsport-widget-cdn';
    s.src = 'https://cdn.bsport.io/scripts/widget.js';
    document.head.appendChild(s);
  }
  waitForBsport(1);
}

function waitForBsport(attempt) {
  if (attempt > 50) return;
  if (typeof window.BsportWidget === 'undefined') {
    return setTimeout(() => waitForBsport(attempt + 1), 100 * attempt || 1);
  }
  BsportWidget.mount({
    parentElement:    'bsport-widget-464090',
    companyId:        5473,
    franchiseId:      null,
    dialogMode:       1,
    widgetType:       'calendar',
    showFab:          false,
    fullScreenPopup:  false,
    styles:           undefined,
    config:           { calendar: {} }
  });
}

// Close modal on backdrop click
document.addEventListener('click', function (e) {
  const modal = document.getElementById('booking-modal');
  if (modal && e.target === modal) closeBooking();
});

// Close modal on Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeBooking();
});

/* ── Scroll reveal ─────────────────────────────────────────── */
function runReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}
document.addEventListener('DOMContentLoaded', runReveal);

/* ── Service card keyboard accessibility ───────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.service-card[tabindex]').forEach(card => {
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
});

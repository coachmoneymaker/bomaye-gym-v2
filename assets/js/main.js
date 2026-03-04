/* ============================================================
   BOMAYE GYM MUNICH — main.js
   Depends on: config.js (loaded before this file)
   ============================================================ */

/* ── Init on DOM ready ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initPreloader();
  initHeader();
  initLogoImage();
  initEarlyBirdCounter();
  initPricingSection();
  runReveal();
});

/* ── Preloader ─────────────────────────────────────────────── */
function initPreloader() {
  const pre  = document.getElementById('preloader');
  const line = document.getElementById('loader-line');
  if (!pre) return;
  if (line) setTimeout(() => { line.style.width = '220px'; }, 50);
  window.addEventListener('load', () => {
    setTimeout(() => { pre.classList.add('hidden'); }, 500);
  });
}

/* ── Header scroll ─────────────────────────────────────────── */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Logo image with fallback ──────────────────────────────── */
function initLogoImage() {
  document.querySelectorAll('.logo-img').forEach(img => {
    img.addEventListener('load',  () => {
      img.classList.add('loaded');
      const sib = img.nextElementSibling;
      if (sib && sib.classList.contains('logo-text')) sib.style.display = 'none';
    });
    img.addEventListener('error', () => { img.style.display = 'none'; });
    // Trigger load check if already cached
    if (img.complete && img.naturalWidth) {
      img.classList.add('loaded');
      const sib = img.nextElementSibling;
      if (sib && sib.classList.contains('logo-text')) sib.style.display = 'none';
    }
  });
}

/* ── Mobile nav ────────────────────────────────────────────── */
function toggleMenu() {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('burger-btn');
  if (!nav) return;
  const open = nav.classList.toggle('open');
  document.body.style.overflow = open ? 'hidden' : '';
  if (btn) btn.setAttribute('aria-expanded', String(open));
}

function mobileNav(view, section) {
  toggleMenu();
  setTimeout(() => nav(view, section), 320);
}

/* ── SPA view routing ──────────────────────────────────────── */
function nav(viewId, sectionId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');

  const backBtn = document.querySelector('.back-btn');
  if (backBtn) backBtn.classList.toggle('visible', viewId !== 'home');

  window.scrollTo({ top: 0, behavior: 'instant' });

  if (sectionId) {
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
  setTimeout(runReveal, 120);
}

/* ── Pricing section — duration toggle ─────────────────────── */
function initPricingSection() {
  if (typeof BOMAYE === 'undefined') return;
  renderPricingCards('12M'); // default: best value

  document.querySelectorAll('.dtab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.dtab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderPricingCards(this.dataset.duration);
    });
  });
}

function renderPricingCards(duration) {
  if (typeof BOMAYE === 'undefined') return;
  const grid = document.getElementById('programs-grid');
  if (!grid) return;

  let html = '';

  // Group programs
  BOMAYE.pricing.programs.forEach(prog => {
    const price = prog.prices[duration];
    html += `
      <div class="prog-card reveal">
        <div class="prog-icon"><i class="fa-solid ${prog.icon}"></i></div>
        <div class="prog-name">${prog.name}</div>
        ${prog.tag ? `<span class="tag tag--dark" style="font-size:0.58rem;padding:3px 10px;width:fit-content;">${prog.tag}</span>` : ''}
        <div class="prog-price">
          <span class="prog-price-amount">${price.toFixed(2).replace('.', ',')}€</span>
          <span class="prog-price-unit">/ Woche</span>
        </div>
        ${prog.note ? `<p class="prog-note">${prog.note}</p>` : ''}
        <button onclick="openBooking('${prog.name}')" class="btn btn--outline-light btn--sm btn--full" type="button" style="margin-top:1rem;">ANMELDEN</button>
      </div>`;
  });

  // Personal Training card
  const pt = BOMAYE.pricing.personal;
  html += `
    <div class="prog-card special reveal">
      <div class="prog-icon"><i class="fa-solid ${pt.icon}"></i></div>
      <div class="prog-name">${pt.name}</div>
      <span class="tag tag--dark" style="font-size:0.58rem;padding:3px 10px;width:fit-content;">${pt.tag}</span>
      <div class="prog-price">
        <span class="prog-price-label">${pt.priceLabel}</span>
        <span class="prog-price-unit">${pt.priceUnit}</span>
      </div>
      <p class="prog-note">${pt.note}</p>
      <button onclick="openBooking('Personal Training')" class="btn btn--gold btn--sm btn--full" type="button" style="margin-top:1rem;">TERMIN BUCHEN</button>
    </div>`;

  // Corporate card
  const corp = BOMAYE.pricing.corporate;
  html += `
    <div class="prog-card special reveal">
      <div class="prog-icon"><i class="fa-solid ${corp.icon}"></i></div>
      <div class="prog-name">${corp.name}</div>
      <span class="tag tag--dark" style="font-size:0.58rem;padding:3px 10px;width:fit-content;">${corp.tag}</span>
      <div class="prog-price">
        <span class="prog-price-label">${corp.priceLabel}</span>
      </div>
      <p class="prog-note">${corp.note}</p>
      <button onclick="openBooking('Corporate Boxing')" class="btn btn--outline-light btn--sm btn--full" type="button" style="margin-top:1rem;">ANFRAGE SENDEN</button>
    </div>`;

  grid.innerHTML = html;
  runReveal();
}

/* ── Early Bird counter ────────────────────────────────────── */
function initEarlyBirdCounter() {
  if (typeof BOMAYE === 'undefined') return;
  const { total, remaining } = BOMAYE.earlyBird;

  // Update card display
  const numEl  = document.getElementById('eb-remaining');
  const totalEl = document.getElementById('eb-total-label');
  const badgeEl = document.getElementById('spots-badge-text');

  if (numEl)   numEl.textContent = remaining;
  if (totalEl) totalEl.textContent = `VON ${total} PLÄTZEN NOCH VERFÜGBAR`;
  if (badgeEl) badgeEl.textContent = `Early Bird — noch ${remaining} Plätze`;

  // Early bird status
  const btn = document.getElementById('eb-cta-btn');
  if (btn && remaining <= 0) {
    btn.textContent = 'AUSVERKAUFT';
    btn.disabled = true;
    btn.classList.remove('btn--gold');
    btn.classList.add('btn--outline-dark');
  }
}

/* ── FAQ ───────────────────────────────────────────────────── */
function toggleFaq(btn) {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.faq-q').forEach(q => {
    q.setAttribute('aria-expanded', 'false');
    const a = q.nextElementSibling;
    if (a) a.style.maxHeight = null;
  });
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
  const lat = (typeof BOMAYE !== 'undefined') ? BOMAYE.address.mapLat : 48.1408;
  const lon = (typeof BOMAYE !== 'undefined') ? BOMAYE.address.mapLon : 11.5358;
  const bboxW = (lon - 0.01).toFixed(4);
  const bboxE = (lon + 0.01).toFixed(4);
  const bboxS = (lat - 0.005).toFixed(4);
  const bboxN = (lat + 0.005).toFixed(4);
  frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bboxW}%2C${bboxS}%2C${bboxE}%2C${bboxN}&layer=mapnik&marker=${lat}%2C${lon}`;
  if (gate) gate.classList.add('hidden');
}

/* ── Booking modal ─────────────────────────────────────────── */
let bsportMounted = false;

function openBooking() {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (!bsportMounted) { mountBsport(); bsportMounted = true; }
}

function closeBooking() {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function mountBsport() {
  if (!document.getElementById('bsport-cdn')) {
    const s = document.createElement('script');
    s.id = 'bsport-cdn';
    s.src = 'https://cdn.bsport.io/scripts/widget.js';
    document.head.appendChild(s);
  }
  waitForBsport(1);
}

function waitForBsport(attempt) {
  if (attempt > 50) return;
  if (typeof window.BsportWidget === 'undefined') {
    return setTimeout(() => waitForBsport(attempt + 1), 150);
  }
  BsportWidget.mount({
    parentElement: 'bsport-widget-464090',
    companyId: 5473,
    franchiseId: null,
    dialogMode: 1,
    widgetType: 'calendar',
    showFab: false,
    fullScreenPopup: false,
  });
}

// Close on backdrop / Escape
document.addEventListener('click', e => { if (e.target.id === 'booking-modal') closeBooking(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBooking(); });

/* ── Scroll reveal ─────────────────────────────────────────── */
function runReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => io.observe(el));
}

/* ── Service card keyboard ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.service-card[tabindex]').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
});

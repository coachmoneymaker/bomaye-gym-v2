/* ============================================================
   BOMAYE GYM MUNICH — main.js
   Depends on: config.js (loaded before this file)
   ============================================================ */

/* ── Init on DOM ready ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initPreloader();
  initHeader();
  initLogoImage();
  initPricingSection();
  initSliderDots();
  runReveal();
  initEarlyBirdFOMO(); // async — does not block rendering
});

/* ── Preloader ─────────────────────────────────────────────── */
function initPreloader() {
  const pre  = document.getElementById('preloader');
  const line = document.getElementById('loader-line');
  if (!pre) return;
  if (line) setTimeout(() => { line.style.width = '220px'; }, 50);
  window.addEventListener('load', () => {
    setTimeout(() => { pre.classList.add('hidden'); }, 400);
  });
}

/* ── Header scroll + active nav ────────────────────────────── */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
    updateActiveNav();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function updateActiveNav() {
  const sections = ['dna', 'services', 'team', 'pricing', 'faq'];
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  const navMap   = { dna: 0, services: 1, team: 2, pricing: 3, faq: 4 };
  let current = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top <= 120 && r.bottom > 120) current = id;
    }
  });
  navLinks.forEach((link, i) => link.classList.toggle('active', i === navMap[current]));
}

/* ── Logo image with fallback ──────────────────────────────── */
function initLogoImage() {
  document.querySelectorAll('.logo-img').forEach(img => {
    function onLoaded() {
      img.classList.remove('hidden');
      const sib = img.nextElementSibling;
      if (sib && sib.classList.contains('logo-text')) sib.classList.remove('visible');
    }
    function onFailed() {
      img.classList.add('hidden');
      const sib = img.nextElementSibling;
      if (sib && sib.classList.contains('logo-text')) sib.classList.add('visible');
    }
    img.addEventListener('load',  onLoaded);
    img.addEventListener('error', onFailed);
    if (img.complete) { img.naturalWidth > 0 ? onLoaded() : onFailed(); }
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
  renderPricingCards('12M');
  document.querySelectorAll('.dtab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.dtab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderPricingCards(this.dataset.duration);
      setTimeout(initSliderDots, 60);
    });
  });
}

function renderPricingCards(duration) {
  if (typeof BOMAYE === 'undefined') return;
  const grid = document.getElementById('programs-grid');
  if (!grid) return;

  let html = '';
  BOMAYE.pricing.programs.forEach(prog => {
    const price = prog.prices[duration];
    html += `
      <div class="prog-card reveal">
        <div class="prog-icon"><i class="fa-solid ${prog.icon}" aria-hidden="true"></i></div>
        <div class="prog-name">${prog.name}</div>
        ${prog.tag ? `<span class="tag tag--dark prog-tag">${prog.tag}</span>` : ''}
        <div class="prog-price">
          <span class="prog-price-amount">${price.toFixed(2).replace('.', ',')}€</span>
          <span class="prog-price-unit">/ Woche</span>
        </div>
        ${prog.note ? `<p class="prog-note">${prog.note}</p>` : ''}
        <button onclick="openBooking('${prog.name}')" class="btn btn--outline-light btn--sm btn--full prog-cta" type="button">ANMELDEN</button>
      </div>`;
  });

  const pt = BOMAYE.pricing.personal;
  html += `
    <div class="prog-card special reveal">
      <div class="prog-icon"><i class="fa-solid ${pt.icon}" aria-hidden="true"></i></div>
      <div class="prog-name">${pt.name}</div>
      <span class="tag tag--dark prog-tag">${pt.tag}</span>
      <div class="prog-price">
        <span class="prog-price-label">${pt.priceLabel}</span>
        <span class="prog-price-unit">${pt.priceUnit}</span>
      </div>
      <p class="prog-note">${pt.note}</p>
      <button onclick="openBooking('Personal Training')" class="btn btn--gold btn--sm btn--full prog-cta" type="button">TERMIN BUCHEN</button>
    </div>`;

  const corp = BOMAYE.pricing.corporate;
  html += `
    <div class="prog-card special reveal">
      <div class="prog-icon"><i class="fa-solid ${corp.icon}" aria-hidden="true"></i></div>
      <div class="prog-name">${corp.name}</div>
      <span class="tag tag--dark prog-tag">${corp.tag}</span>
      <div class="prog-price">
        <span class="prog-price-label">${corp.priceLabel}</span>
      </div>
      <p class="prog-note">${corp.note}</p>
      <button onclick="openBooking('Corporate Boxing')" class="btn btn--outline-light btn--sm btn--full prog-cta" type="button">ANFRAGE SENDEN</button>
    </div>`;

  grid.innerHTML = html;
  runReveal();
}

/* ── Early Bird FOMO (async, non-blocking) ─────────────────── */
async function initEarlyBirdFOMO() {
  if (typeof BOMAYE === 'undefined') return;

  // Resolve live count — MODE A: JSON endpoint / MODE B: config fallback
  let spotsLeft = BOMAYE.earlyBird.remaining;
  if (typeof getEarlyBirdSpotsLeft === 'function') {
    try { spotsLeft = await getEarlyBirdSpotsLeft(); } catch (_) {}
  }

  const total = BOMAYE.earlyBird.total;
  const taken = total - spotsLeft;
  const pct   = Math.max(0, Math.min(100, Math.round((taken / total) * 100)));

  // Badge text
  const badgeEl = document.getElementById('spots-badge-text');
  if (badgeEl) badgeEl.textContent = `Early Bird — noch ${spotsLeft} Plätze`;

  // Sub-label
  const totalEl = document.getElementById('eb-total-label');
  if (totalEl) totalEl.textContent = `VON ${total} PLÄTZEN NOCH VERFÜGBAR`;

  // Progress bar
  const barFill = document.getElementById('eb-progress-fill');
  const barPct  = document.getElementById('eb-progress-pct');
  if (barPct) barPct.textContent = pct + '% BELEGT';
  if (barFill) setTimeout(() => { barFill.style.width = pct + '%'; }, 700);

  // CTA state
  const btn = document.getElementById('eb-cta-btn');
  if (btn && spotsLeft <= 0) {
    btn.textContent = 'AUSVERKAUFT';
    btn.disabled = true;
    btn.classList.replace('btn--gold', 'btn--outline-dark');
  }

  // Animated counter: triggers when section scrolls into view
  const numEl = document.getElementById('eb-remaining');
  if (numEl) {
    numEl.textContent = total;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateCounter(numEl, total, spotsLeft, 1600);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(numEl);
  }
}

/* ── Smooth number animation ───────────────────────────────── */
function animateCounter(el, from, to, duration) {
  const t0 = performance.now();
  (function update(now) {
    const p = Math.min((now - t0) / duration, 1);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(update);
  })(performance.now());
}

/* ── Slider dots (services + pricing) ─────────────────────── */
function initSliderDots() {
  setupSliderDots('services-slider', 'services-dots');
  setupSliderDots('programs-grid',   'pricing-dots');
}

function setupSliderDots(sliderId, dotsId) {
  const slider = document.getElementById(sliderId);
  const dotsEl = document.getElementById(dotsId);
  if (!slider || !dotsEl) return;

  if (window.innerWidth > 768) { dotsEl.innerHTML = ''; return; }

  const items = Array.from(slider.children);
  if (items.length < 2) { dotsEl.innerHTML = ''; return; }

  dotsEl.innerHTML = items.map((_, i) =>
    `<button class="slider-dot${i === 0 ? ' active' : ''}" aria-label="Slide ${i + 1}" data-idx="${i}" type="button"></button>`
  ).join('');

  dotsEl.querySelectorAll('.slider-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const item = items[+dot.dataset.idx];
      if (item) slider.scrollTo({ left: item.offsetLeft - slider.offsetLeft, behavior: 'smooth' });
    });
  });

  let ticking = false;
  slider.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const sl = slider.scrollLeft;
      let closest = 0, minD = Infinity;
      items.forEach((item, i) => {
        const d = Math.abs(item.offsetLeft - slider.offsetLeft - sl);
        if (d < minD) { minD = d; closest = i; }
      });
      dotsEl.querySelectorAll('.slider-dot').forEach((d, i) =>
        d.classList.toggle('active', i === closest)
      );
      ticking = false;
    });
  }, { passive: true });
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
  const lat   = (typeof BOMAYE !== 'undefined') ? BOMAYE.address.mapLat : 48.1408;
  const lon   = (typeof BOMAYE !== 'undefined') ? BOMAYE.address.mapLon : 11.5358;
  const bboxW = (lon - 0.01).toFixed(4), bboxE = (lon + 0.01).toFixed(4);
  const bboxS = (lat - 0.005).toFixed(4), bboxN = (lat + 0.005).toFixed(4);
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
  if (typeof window.BsportWidget === 'undefined')
    return setTimeout(() => waitForBsport(attempt + 1), 150);
  BsportWidget.mount({
    parentElement: 'bsport-widget-464090',
    companyId: 5473, franchiseId: null,
    dialogMode: 1, widgetType: 'calendar',
    showFab: false, fullScreenPopup: false,
  });
}

document.addEventListener('click', e => { if (e.target.id === 'booking-modal') closeBooking(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBooking(); });

/* ── Weitere Preise toggle ─────────────────────────────────── */
function toggleMehrPreise() {
  const btn   = document.getElementById('mehr-preise-btn');
  const panel = document.getElementById('mehr-preise-panel');
  if (!btn || !panel) return;
  const open = panel.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
  btn.querySelector('span').textContent = open ? 'Weniger anzeigen' : 'Weitere Preise anzeigen';
}

/* ── Scroll reveal ─────────────────────────────────────────── */
function runReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  els.forEach(el => io.observe(el));
}

/* ── Keyboard: service cards + resize ──────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.service-card[tabindex]').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initSliderDots, 200);
  });
});

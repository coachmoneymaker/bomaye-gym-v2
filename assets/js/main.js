/* ============================================================
   BOMAYE GYM MUNICH — main.js
   Depends on: config.js (loaded before this file)
   ============================================================ */

/* ── Body scroll lock (iOS-compatible) ─────────────────────────
   Plain overflow:hidden does NOT prevent background scroll on iOS
   Safari. The position:fixed + negative-top technique does.
   Both openBooking() and toggleMenu() use these helpers.
──────────────────────────────────────────────────────────── */
let _scrollLockY = 0;
let _navFromPopstate = false;

function lockBodyScroll() {
  _scrollLockY = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top      = `-${_scrollLockY}px`;
  document.body.style.width    = '100%';
}

function unlockBodyScroll() {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top      = '';
  document.body.style.width    = '';
  window.scrollTo({ top: _scrollLockY, behavior: 'instant' });
}

/* ── Init on DOM ready ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  // Seed the initial browser history entry so popstate can identify the home state
  history.replaceState({ view: 'home', sectionId: null, scrollBeforeDetail: 0 }, '');

  initPreloader();
  initHeader();
  initLogoImage();
  initImageFallbacks(); // Android/WebP safety net — runs immediately
  initPricingSection();
  initSliderDots();
  initTeamSliderDots();
  runReveal();
  initEarlyBirdFOMO(); // async — does not block rendering
  initAutoCarousels();
  initQuoteMobileReveal();
  // Bsport schedule widget is mounted by inline script at bottom of page.
  // Back-button for Bsport detail view initialised after widget has had time to render.
  setTimeout(initScheduleBackBtn, 2500);
});

/* ── Android / WebP image fallback ──────────────────────────
   Catches images that fail to load (e.g. older Android WebView)
   and gracefully hides the broken img / falls back to bg-color.
   Also ensures CSS background-image elements with inline styles
   are checked for load success.
──────────────────────────────────────────────────────────── */
function initImageFallbacks() {
  // 1. <img> tag onerror: hide broken image, keep layout stable
  //    Also trigger .loaded class for lazy-load fade-in animation
  document.querySelectorAll('img[src]').forEach(img => {
    if (!img.getAttribute('onerror')) {
      img.addEventListener('error', function () {
        this.style.opacity = '0';
        this.closest('.coach-photo') && (this.closest('.coach-photo').style.background = 'var(--smoke)');
      }, { once: true });
    }
    // Fade-in on load for lazy content images (logos excluded to prevent invisible-until-JS)
    if (img.getAttribute('loading') === 'lazy' &&
        !img.classList.contains('logo-img') &&
        !img.classList.contains('intro-brand-logo') &&
        !img.classList.contains('dna-visual-logo')) {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function () { this.classList.add('loaded'); }, { once: true });
      }
    }
  });

  // 2. CSS background-image elements: verify each src loads
  //    Covers service cards, discipline cards (inline style)
  document.querySelectorAll('[style*="background-image"]').forEach(el => {
    const match = el.style.backgroundImage.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (!match) return;
    const src = match[1];
    const probe = new Image();
    probe.onerror = () => {
      // Strip failed bg, reveal fallback bg-color
      el.style.backgroundImage = '';
      el.style.background = 'rgba(255,255,255,0.04)';
    };
    probe.src = src;
  });
}

/* ── Preloader ─────────────────────────────────────────────── */
function initPreloader() {
  const pre  = document.getElementById('preloader');
  const line = document.getElementById('loader-line');
  if (!pre) return;

  // Show intro only once per browser session
  if (sessionStorage.getItem('introShown')) {
    pre.classList.add('hidden');
    return;
  }

  if (line) setTimeout(() => { line.style.width = '220px'; }, 50);
  window.addEventListener('load', () => {
    setTimeout(() => {
      pre.classList.add('hidden');
      sessionStorage.setItem('introShown', 'true');
    }, 400);
  });
}

/* ── Header scroll + active nav ────────────────────────────── */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
    updateActiveNav();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function updateActiveNav() {
  const sections = ['disciplines', 'schedule', 'team', 'faq'];
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  // nav order: HOME(0), KURSE(1), STUNDENPLAN(2), COACHES(3), FAQ(4)
  const navMap   = { disciplines: 1, schedule: 2, team: 3, faq: 4 };
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
  if (open) { lockBodyScroll(); } else { unlockBodyScroll(); }
  if (btn) {
    btn.setAttribute('aria-expanded', String(open));
    btn.classList.toggle('open', open);
  }
}

function mobileNav(view, section) {
  toggleMenu();
  setTimeout(() => nav(view, section), 320);
}

/* ── SPA view routing ──────────────────────────────────────── */
function nav(viewId, sectionId, restoreY) {
  // Auto-save scroll position whenever leaving the home view for a detail
  const homeView = document.getElementById('view-home');
  if (homeView && homeView.classList.contains('active') && viewId !== 'home') {
    window._scrollYBeforeDetail = window.scrollY;
  }

  // Push browser history entry so the back button works.
  // Skipped when this call originates from the popstate handler itself.
  if (!_navFromPopstate) {
    history.pushState(
      { view: viewId, sectionId: sectionId || null, scrollBeforeDetail: window._scrollYBeforeDetail || 0 },
      ''
    );
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');

  const backBtn = document.querySelector('.back-btn');
  if (backBtn) backBtn.classList.toggle('visible', viewId !== 'home');

  if (restoreY !== undefined) {
    window.scrollTo({ top: restoreY, behavior: 'instant' });
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  if (sectionId) {
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 80);
  }
  setTimeout(runReveal, 120);
}

/* ── Browser back/forward button support ─────────────────── */
window.addEventListener('popstate', function (e) {
  const state = e.state;
  _navFromPopstate = true;
  if (!state || state.view === 'home') {
    // Returning to home — restore scroll position saved when we left it
    nav('home', null, window._scrollYBeforeDetail || 0);
  } else {
    // Going to a detail/pricing view (e.g. via forward button)
    // Restore the scroll-save-point so a subsequent back still works
    if (state.scrollBeforeDetail !== undefined) {
      window._scrollYBeforeDetail = state.scrollBeforeDetail;
    }
    nav(state.view, state.sectionId || null, undefined);
  }
  _navFromPopstate = false;
});

/* ── Back navigation — returns to the exact scroll position ── */
function navBack() {
  nav('home', null, window._scrollYBeforeDetail || 0);
}

/* ── Weitere Preise navigation ─────────────────────────────── */
function navToMehrPreise() {
  window._returnScrollY = window.scrollY;
  nav('mehr-preise');
}

function navFromMehrPreise() {
  nav('home', null, window._returnScrollY || 0);
}

/* ── Stundenplan ─────────────────────────────────────────────
   The Bsport calendar widget is mounted by the inline script
   block at the bottom of index.html (bsport-widget-172485).
   No JS mount logic needed here.
──────────────────────────────────────────────────────────── */

/* ── Pricing section — age + duration selectors ─────────────── */
function initPricingSection() {
  if (typeof BOMAYE === 'undefined') return;
  renderPricingDisplay('erwachsene', '12M');
  document.querySelectorAll('.atab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.atab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderPricingDisplay(this.dataset.age, '12M');
    });
  });
}

function getPrimaryProgram(ageGroup) {
  // Prefer a program exclusively for this age group
  return BOMAYE.pricing.programs.find(p =>
    p.ageGroups && p.ageGroups.length === 1 && p.ageGroups[0] === ageGroup
  ) || BOMAYE.pricing.programs.find(p =>
    p.ageGroups && p.ageGroups.includes(ageGroup)
  );
}

function renderPricingDisplay(ageGroup, duration) {
  if (typeof BOMAYE === 'undefined') return;
  const display = document.getElementById('pricing-display');
  if (!display) return;

  const prog = getPrimaryProgram(ageGroup);
  if (!prog) return;

  const price        = prog.earlyBirdPrices ? prog.earlyBirdPrices[duration] : prog.prices[duration];
  const regularPrice = prog.regularPrices   ? prog.regularPrices[duration]   : null;
  const basePrice    = prog.earlyBirdPrices ? prog.earlyBirdPrices['1M'] : prog.prices['1M'];
  const savings      = duration === '1M' ? 0 : Math.round((basePrice - price) * 12);

  const durs = [
    { key: '1M',  label: '1 Monat' },
    { key: '3M',  label: '3 Monate' },
    { key: '6M',  label: '6 Monate' },
    { key: '12M', label: '12 Monate ⭐' },
  ];
  const tabsHtml = durs.map(d =>
    `<button class="dtab-inner${d.key === duration ? ' active' : ''}" data-dur="${d.key}" type="button">${d.label}</button>`
  ).join('');

  const benefits = [
    'Alle Kurse inklusive',
    'Community Events &amp; Sparring',
    'Zugang Mo–Fr 07–22 Uhr, Sa 09–16 Uhr',
    'Professionelles Coaching',
    'Kostenloses Probetraining',
  ];
  const benefitsHtml = benefits.map(b =>
    `<li><i class="fa-solid fa-check" aria-hidden="true"></i><span>${b}</span></li>`
  ).join('');

  const isFeatured = duration === '12M';
  let html = `
    <div class="membership-card reveal${isFeatured ? ' membership-card--featured' : ''}">
      ${isFeatured ? '<div class="membership-featured-badge">BELIEBTESTE WAHL</div>' : ''}
      <div class="membership-duration-tabs">${tabsHtml}</div>
      <div class="membership-price-display">
        ${regularPrice ? `<div class="mp-regular-price-row"><span class="mp-regular-price">${regularPrice.toFixed(2).replace('.', ',')} €</span><span class="mp-regular-unit">/ Monat</span></div>` : ''}
        <div class="membership-price-main">
          <span class="mp-amount">${price.toFixed(2).replace('.', ',')} €</span>
          <span class="mp-unit">/ Monat</span>
          <span class="mp-early-bird-label">Early Bird Preis</span>
        </div>
        ${savings > 0 ? `<div class="mp-savings"><i class="fa-solid fa-bolt" aria-hidden="true"></i> Du sparst ${savings}€/Jahr vs. monatlich</div>` : '<div class="mp-savings-empty"></div>'}
      </div>
      <ul class="membership-benefits" aria-label="Leistungen">${benefitsHtml}</ul>
      <div class="membership-enrollment" onclick="toggleEnrollmentInfo(this)" style="cursor:pointer;color:#000000;font-weight:600;" title="Klicken für Details">
        <i class="fa-solid fa-circle-plus enrollment-toggle-icon" aria-hidden="true"></i>
        <span>+ 100€ Aufnahmegebühr einmalig</span>
      </div>
      <div class="enrollment-info-panel" style="display:none;background:rgba(197,160,89,0.07);border:1px solid rgba(197,160,89,0.2);border-radius:6px;padding:1rem 1.1rem;margin-top:0.5rem;font-size:0.82rem;color:#000000;line-height:1.6;">
        <p style="margin:0 0 0.65rem;font-family:var(--font-head);font-size:0.6rem;letter-spacing:3px;color:var(--gold);">IM STARTER KIT ENTHALTEN</p>
        <ul style="margin:0;padding:0 0 0 1rem;list-style:disc;">
          <li>Bomaye Boxhandschuhe</li>
          <li>Bandagen (Hand Wraps)</li>
          <li>Springseil</li>
          <li>Bomaye T-Shirt</li>
        </ul>
        <p style="margin:0.75rem 0 0;font-size:0.78rem;color:#000000;">Die Aufnahmegebühr wird einmalig bei Vertragsstart fällig und beinhaltet dein komplettes Starter Kit im Bomaye-Design.</p>
      </div>
      <button onclick="openBooking()" class="btn btn--gold btn--full" type="button">
        <i class="fa-solid fa-fist-raised"></i> JETZT MITGLIED WERDEN
      </button>
    </div>`;

  if (ageGroup === 'erwachsene') {
    const pt   = BOMAYE.pricing.personal;
    const corp = BOMAYE.pricing.corporate;
    html += `
      <div class="membership-addon-grid">
        <div class="addon-card">
          <div class="addon-icon"><i class="fa-solid ${pt.icon}" aria-hidden="true"></i></div>
          <div class="addon-name">${pt.name}</div>
          <div class="addon-price">${pt.priceLabel} <span>${pt.priceUnit}</span></div>
          <p>${pt.note}</p>
          <button onclick="openBooking('Personal Training')" class="btn btn--gold btn--sm btn--full" type="button">TERMIN BUCHEN</button>
        </div>
        <div class="addon-card">
          <div class="addon-icon"><i class="fa-solid ${corp.icon}" aria-hidden="true"></i></div>
          <div class="addon-name">${corp.name}</div>
          <div class="addon-price">${corp.priceLabel}</div>
          <p>${corp.note}</p>
          <a href="mailto:info@bomayegym.com" class="btn btn--outline-light btn--sm btn--full" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">ANFRAGE SENDEN</a>
        </div>
      </div>`;
  }

  display.innerHTML = html;

  // Bind duration tab clicks
  display.querySelectorAll('.dtab-inner').forEach(tab => {
    tab.addEventListener('click', function () {
      renderPricingDisplay(ageGroup, this.dataset.dur);
    });
  });

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

  // Hero mini counter
  const heroNum = document.getElementById('hero-eb-num');
  if (heroNum) heroNum.textContent = spotsLeft;

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

/* ── Slider dots (services + testimonials) ──────────────────── */
function initSliderDots() {
  setupSliderDots('services-slider',     'services-dots');
  setupSliderDots('testimonials-slider', 'testimonials-dots');
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

/* ── Enrollment info panel toggle ──────────────────────────── */
function toggleEnrollmentInfo(row) {
  var panel = row.nextElementSibling;
  if (!panel || !panel.classList.contains('enrollment-info-panel')) return;
  var isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  var icon = row.querySelector('.enrollment-toggle-icon');
  if (icon) {
    icon.className = isOpen
      ? 'fa-solid fa-circle-plus enrollment-toggle-icon'
      : 'fa-solid fa-circle-minus enrollment-toggle-icon';
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
  const lat   = (typeof BOMAYE !== 'undefined') ? BOMAYE.address.mapLat : 48.1408;
  const lon   = (typeof BOMAYE !== 'undefined') ? BOMAYE.address.mapLon : 11.5358;
  const bboxW = (lon - 0.01).toFixed(4), bboxE = (lon + 0.01).toFixed(4);
  const bboxS = (lat - 0.005).toFixed(4), bboxN = (lat + 0.005).toFixed(4);
  frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bboxW}%2C${bboxS}%2C${bboxE}%2C${bboxN}&layer=mapnik&marker=${lat}%2C${lon}`;
  if (gate) gate.classList.add('hidden');
}

/* ── Booking modal ─────────────────────────────────────────────
   Opens the modal overlay and lazy-mounts the Bsport calendar
   widget into it on first call. Uses MountBsportWidget (defined
   by the inline script block at the bottom of index.html) — same
   helper and same config as the schedule-section widget, but
   targeting a different container (bsport-widget-464090) so both
   instances can coexist independently.

   EARLY BIRD / MITGLIED WERDEN CTAs:
   All buttons that call openBooking() lead here. When a final
   Bsport membership-signup URL is available, replace the
   MountBsportWidget call below with a direct link/redirect —
   no other page structure changes needed.
──────────────────────────────────────────────────────────── */
let _bsportModalMounted = false;

function openBooking() {
  const modal = document.getElementById('booking-modal');
  if (!modal || modal.classList.contains('open')) return;
  modal.classList.add('open');
  lockBodyScroll();

  if (!_bsportModalMounted) {
    _bsportModalMounted = true;
    // MountBsportWidget is defined by the inline Bsport script block
    if (typeof MountBsportWidget === 'function') {
      MountBsportWidget({
        parentElement: 'bsport-widget-464090',
        companyId: 5473,
        franchiseId: null,
        dialogMode: 1,
        widgetType: 'calendar',
        showFab: false,
        fullScreenPopup: false,
        config: { calendar: {} },
      });
    }
  }
}

function closeBooking() {
  const modal = document.getElementById('booking-modal');
  if (!modal || !modal.classList.contains('open')) return; /* guard: only unlock if we locked */
  modal.classList.remove('open');
  unlockBodyScroll();
}

/* Click backdrop (modal element itself, not its children) */
document.addEventListener('click', e => {
  if (e.target.id === 'booking-modal') closeBooking();
  if (e.target.id === 'family-modal')  closeFamilyModal();
});

/* ESC closes booking modal OR family modal OR mobile nav, whichever is open */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const bookingModal = document.getElementById('booking-modal');
  const familyModal  = document.getElementById('family-modal');
  const mobileNav    = document.getElementById('mobile-nav');
  if (bookingModal && bookingModal.classList.contains('open')) { closeBooking();      return; }
  if (familyModal  && familyModal.classList.contains('open'))  { closeFamilyModal(); return; }
  if (mobileNav    && mobileNav.classList.contains('open'))    { toggleMenu();       return; }
});

/* ── Family Membership Modal ──────────────────────────────── */
function openFamilyModal() {
  const modal = document.getElementById('family-modal');
  if (!modal || modal.classList.contains('open')) return;
  modal.classList.add('open');
  lockBodyScroll();
}

function closeFamilyModal() {
  const modal = document.getElementById('family-modal');
  if (!modal || !modal.classList.contains('open')) return;
  modal.classList.remove('open');
  unlockBodyScroll();
}

function submitFamilyInquiry(e) {
  e.preventDefault();
  const form      = e.target;
  const name      = form.querySelector('[name="name"]').value.trim();
  const email     = form.querySelector('[name="email"]').value.trim();
  const phone     = form.querySelector('[name="phone"]').value.trim();
  const count     = form.querySelector('[name="count"]').value;
  const household = (form.querySelector('[name="household"]:checked') || {}).value || '';
  const message   = form.querySelector('[name="message"]').value.trim();

  const lines = [
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Telefon: ${phone || '–'}`,
    `Anzahl Familienmitglieder: ${count}`,
    `Gleicher Haushalt: ${household}`,
  ];
  if (message) lines.push(`Nachricht: ${message}`);

  const subject = encodeURIComponent('Neue Family Membership Anfrage');
  const body    = encodeURIComponent(lines.join('\n'));
  window.location.href = `mailto:info@bomayegym.com?subject=${subject}&body=${body}`;
}

/* ── Weitere Preise (removed — now navigates to separate view) ─ */

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
    resizeTimer = setTimeout(() => { initSliderDots(); initTeamSliderDots(); runReveal(); }, 200);
  });
});

/* ── Team slider dots (mobile only) ────────────────────────── */
function initTeamSliderDots() {
  // Team slider is horizontal at ≤900px, so show dots up to that width
  const slider = document.getElementById('team-slider');
  const dotsEl = document.getElementById('team-dots');
  if (!slider || !dotsEl) return;
  if (window.innerWidth > 900) { dotsEl.innerHTML = ''; return; }
  const items = Array.from(slider.children);
  if (items.length < 2) { dotsEl.innerHTML = ''; return; }
  dotsEl.innerHTML = items.map((_, i) =>
    `<button class="dot${i===0?' active':''}" data-idx="${i}" aria-label="Trainer ${i+1}"></button>`
  ).join('');
  const dots = dotsEl.querySelectorAll('.dot');
  const onScroll = () => {
    const idx = Math.round(slider.scrollLeft / slider.offsetWidth);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  };
  slider.removeEventListener('scroll', slider._teamDotScroll || null);
  slider._teamDotScroll = onScroll;
  slider.addEventListener('scroll', onScroll, { passive: true });
  dots.forEach(btn => btn.addEventListener('click', () => {
    slider.scrollTo({ left: parseInt(btn.dataset.idx) * slider.offsetWidth, behavior: 'smooth' });
  }));
}

/* ══════════════════════════════════════════════════════════════
   AUTO-CAROUSELS
   Calm automatic sliding for team cards and testimonials.
   Pauses on hover/touch. Respects prefers-reduced-motion.
══════════════════════════════════════════════════════════════ */
function initAutoCarousels() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  // Services: slow premium advance — 9 s interval, 1100 ms eased transition
  autoSlider('services-slider',     9000, 768,  1100);
  // Team: slow premium advance — 9 s interval, 1000 ms ease (only 2 coaches, so be gentle)
  autoSlider('team-slider',         9000, 900,  1000);
  // Testimonials: slow premium advance — 8 s interval, 1000 ms ease
  autoSlider('testimonials-slider', 8000, 1024, 1000);
}

/* premiumScrollTo(el, targetLeft, duration)
   Eased RAF scroll — gives full control over speed & feel.
   Stores the RAF id on el._premiumRaf so callers can cancel it. */
function premiumScrollTo(el, targetLeft, duration) {
  if (el._premiumRaf) cancelAnimationFrame(el._premiumRaf);
  const start  = el.scrollLeft;
  const change = targetLeft - start;
  const t0     = performance.now();
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function step(now) {
    const progress = Math.min((now - t0) / duration, 1);
    el.scrollLeft = start + change * easeInOutCubic(progress);
    if (progress < 1) { el._premiumRaf = requestAnimationFrame(step); }
    else              { el._premiumRaf = null; }
  }
  el._premiumRaf = requestAnimationFrame(step);
}

/* autoSlider(id, intervalMs, maxWidth, scrollDuration)
   maxWidth — auto-start only when viewport ≤ maxWidth.
   scrollDuration — ms for custom eased animation; omit for native smooth.
   advance() skips silently when the container is not scrollable.  */
function autoSlider(sliderId, intervalMs, maxWidth, scrollDuration) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;
  if (maxWidth === undefined) maxWidth = 1024;

  let timer = null;
  let paused = false;

  function advance() {
    if (paused) return;
    // Skip if container has no scrollable overflow (e.g. desktop grid)
    if (slider.scrollWidth <= slider.clientWidth + 2) return;

    const items = Array.from(slider.children);
    if (items.length < 2) return;

    const sl = slider.scrollLeft;
    let closest = 0, minD = Infinity;
    items.forEach((item, i) => {
      const d = Math.abs(item.offsetLeft - slider.offsetLeft - sl);
      if (d < minD) { minD = d; closest = i; }
    });

    const next = (closest + 1) % items.length;
    const target = items[next];
    if (!target) return;
    const left = target.offsetLeft - slider.offsetLeft;
    if (scrollDuration) {
      premiumScrollTo(slider, left, scrollDuration);
    } else {
      slider.scrollTo({ left, behavior: 'smooth' });
    }
  }

  function start() { timer = setInterval(advance, intervalMs); }
  function stop()  { clearInterval(timer); }

  // Pause on hover (desktop) or touch (mobile) — always attach listeners
  slider.addEventListener('mouseenter', () => { paused = true;  stop(); });
  slider.addEventListener('mouseleave', () => { paused = false; if (window.innerWidth <= maxWidth) start(); });
  slider.addEventListener('touchstart',  () => {
    paused = true;
    stop();
    if (slider._premiumRaf) cancelAnimationFrame(slider._premiumRaf);
  }, { passive: true });
  slider.addEventListener('touchend',    () => {
    setTimeout(() => { paused = false; if (window.innerWidth <= maxWidth) start(); }, 2500);
  }, { passive: true });

  if (window.innerWidth <= maxWidth) start();

  let resizeDebounce;
  window.addEventListener('resize', () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
      stop();
      if (window.innerWidth <= maxWidth) { paused = false; start(); }
    }, 200);
  });
}

/* ══════════════════════════════════════════════════════════════
   QUOTE SECTION — MOBILE SCROLL REVEAL
   On mobile (no hover/parallax), triggers a premium
   fade + scale animation via IntersectionObserver when
   the section scrolls into view.
══════════════════════════════════════════════════════════════ */
function initQuoteMobileReveal() {
  const quote = document.getElementById('quote');
  if (!quote) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        quote.classList.add('quote-visible');
        io.unobserve(quote);
      }
    });
  }, { threshold: 0.25 });

  io.observe(quote);
}

/* ══════════════════════════════════════════════════════════════
   SCHEDULE BACK BUTTON
   Watches the Bsport calendar widget for navigation into a
   detail/booking view and surfaces a "← Zurück" button so
   mobile users can always return to the calendar in one tap.
══════════════════════════════════════════════════════════════ */
function initScheduleBackBtn() {
  const wrapEl   = document.getElementById('schedule-section-wrap');
  const widgetEl = document.getElementById('bsport-widget-172485');
  if (!wrapEl || !widgetEl) return;

  /* Create the button and inject it just before the widget card */
  const btn = document.createElement('button');
  btn.type      = 'button';
  btn.id        = 'schedule-back-btn';
  btn.className = 'schedule-back-btn';
  btn.setAttribute('aria-label', 'Zurück zum Stundenplan');
  btn.innerHTML = '<i class="fa-solid fa-arrow-left-long" aria-hidden="true"></i>&nbsp; ZURÜCK ZUM STUNDENPLAN';
  wrapEl.insertBefore(btn, wrapEl.firstChild);

  /* Baseline element count — set once the widget has rendered */
  let baselineCount = widgetEl.querySelectorAll('*').length;
  let debounceId    = null;

  /* Ordered list of selectors to try when clicking the widget's own back control */
  const BACK_SELECTORS = [
    'button[class*="back"]',   'button[class*="Back"]',
    'button[class*="return"]', 'button[class*="Return"]',
    'button[class*="close"]',  'button[class*="Close"]',
    '[class*="back-btn"]',     '[class*="backBtn"]',
    '[class*="close-btn"]',    '[class*="closeBtn"]',
    '[aria-label*="back"]',    '[aria-label*="retour"]',
    '[aria-label*="close"]',   '[aria-label*="fermer"]',
    '[class*="chevron-left"]', '[class*="ChevronLeft"]',
    '[class*="arrow-left"]',   '[class*="ArrowLeft"]',
  ];

  btn.addEventListener('click', () => {
    let handled = false;
    for (const sel of BACK_SELECTORS) {
      const target = widgetEl.querySelector(sel);
      if (target) { target.click(); handled = true; break; }
    }
    /* Fallback: if we couldn't find the widget's own control, hide our button
       so the user knows the tap registered, then re-check state after a moment */
    if (!handled) {
      btn.classList.remove('schedule-back-btn--visible');
    }
  });

  /* Determine whether the widget is showing a "deep" view vs the calendar root */
  function evaluateState() {
    /* Signal 1: recognised detail/booking view element present */
    const detailEl = widgetEl.querySelector(
      '[class*="detail"],[class*="Detail"],' +
      '[class*="event-view"],[class*="EventView"],' +
      '[class*="booking-panel"],[class*="BookingPanel"],' +
      '[class*="session-view"],[class*="SessionView"],' +
      '[class*="activity-detail"],[class*="ActivityDetail"],' +
      '[role="dialog"],[aria-modal="true"]'
    );
    /* Signal 2: DOM significantly grew from baseline (view change) */
    const currentCount = widgetEl.querySelectorAll('*').length;
    const grew = baselineCount > 0 && currentCount > baselineCount * 1.6;
    const show = !!(detailEl || grew);
    btn.classList.toggle('schedule-back-btn--visible', show);
    /* Update baseline if DOM shrank back (user returned to calendar via widget UI) */
    if (!show && currentCount < baselineCount) baselineCount = currentCount;
  }

  /* MutationObserver — debounced so rapid DOM updates don't thrash */
  const observer = new MutationObserver(() => {
    clearTimeout(debounceId);
    debounceId = setTimeout(evaluateState, 180);
  });
  observer.observe(widgetEl, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','aria-hidden','style'] });

  /* Update baseline once (called after the 2.5 s delay from DOMContentLoaded) */
  baselineCount = widgetEl.querySelectorAll('*').length;
}

/* ══════════════════════════════════════════════════════════════
   FLOATING SOCIAL PROOF NOTIFICATIONS
══════════════════════════════════════════════════════════════ */
(function initSocialProof() {
  const messages = [
    { name: 'Ahmed aus München',  msg: 'hat gerade ein Probetraining gebucht' },
    { name: 'Lisa',               msg: 'ist dem Bomaye Gym beigetreten' },
    { name: 'Neues Mitglied',     msg: 'hat sich der Fighter Community angeschlossen' },
    { name: 'Marco aus München',  msg: 'hat sein Probetraining gesichert' },
    { name: 'Sarah',              msg: 'hat heute mit Boxing angefangen' },
    { name: 'Kevin aus Schwabing',msg: 'hat gerade ein Early-Bird-Abo gebucht' },
  ];

  const toast  = document.getElementById('social-proof-toast');
  const elName = document.getElementById('sp-name');
  const elMsg  = document.getElementById('sp-msg');
  if (!toast || !elName || !elMsg) return;

  let idx = 0;

  function show() {
    const item = messages[idx % messages.length];
    idx++;
    elName.textContent = item.name;
    elMsg.textContent  = item.msg;
    toast.classList.add('sp-visible');
    setTimeout(() => toast.classList.remove('sp-visible'), 4500);
  }

  // First appearance after 8s, then every 12–15s
  setTimeout(() => {
    show();
    setInterval(show, 13000);
  }, 8000);
}());

/* ══════════════════════════════════════════════════════════════
   HERO PARALLAX — subtle background drift (3–5% of scroll)
══════════════════════════════════════════════════════════════ */
(function initHeroParallax() {
  const heroBg = document.querySelector('#hero .hero-bg');
  if (!heroBg) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      // Base position is 30% (matches CSS); drift 4% of scroll speed
      heroBg.style.backgroundPositionY = `calc(30% + ${(y * 0.04).toFixed(1)}px)`;
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}());

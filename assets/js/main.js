/* ============================================================
   BOMAYE GYM MUNICH — main.js
   Depends on: config.js (loaded before this file)
   ============================================================ */

/* ── Body scroll lock (iOS-compatible) ─────────────────────────
   Plain overflow:hidden does NOT prevent background scroll on iOS
   Safari. The position:fixed + negative-top technique does.
   toggleMenu() uses these helpers.
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
  initSliderDots();
  initTeamSliderDots();
  runReveal();
  initEarlyBirdFOMO(); // async — does not block rendering
  initAutoCarousels();
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
  const hero = document.getElementById('hero');

  // Repeat visit — preloader already hidden by inline script; reveal hero instantly
  if (!pre || pre.style.display === 'none') {
    if (hero) hero.classList.add('hero-revealed');
    return;
  }

  // Trigger line animation on next paint (GPU-accelerated scaleX)
  if (line) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { line.style.transform = 'scaleX(1)'; });
    });
  }

  // Fixed 1300ms timer — independent of page load
  setTimeout(() => {
    // Start loader fade-out and hero reveal simultaneously — one continuous motion
    pre.classList.add('loader-exit');
    sessionStorage.setItem('introShown', 'true');
    if (hero) {
      requestAnimationFrame(() => { hero.classList.add('hero-revealed'); });
    }
    // Remove from layout after CSS transition completes
    pre.addEventListener('transitionend', () => {
      pre.style.display = 'none';
    }, { once: true });
  }, 1300);
}

/* ── Header scroll + active nav ────────────────────────────── */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const progressBar = document.getElementById('scroll-progress');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
    updateActiveNav();
    if (progressBar) {
      const docEl = document.documentElement;
      const scrolled = docEl.scrollTop || document.body.scrollTop;
      const total = docEl.scrollHeight - docEl.clientHeight;
      progressBar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function updateActiveNav() {
  const sections = ['disciplines', 'pricing', 'faq'];
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  // nav order: HOME(0), KURSE(1), COACHES(2), ÜBER UNS(3), FAQ(4)
  const navMap   = { disciplines: 1, pricing: 4, faq: 4 };
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
      if (!el) return;
      // scrollIntoView({ behavior:'instant' }) is unreliable on iOS Safari <15.4.
      // Manually compute the target scroll position accounting for the fixed header.
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      const top = el.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo(0, Math.max(0, top));
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

/* ── Membership tab selector ──────────────────────────────────
   Tabs (Kids / Jugend / Erwachsene) visually indicate the selected
   age group and update the direct Bsport checkout button URL.
──────────────────────────────────────────────────────────── */
function selectMembershipTab(btn) {
  // Update active tab
  document.querySelectorAll('.mtab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');

  // Show matching plan panel
  const group = btn.dataset.group;
  document.querySelectorAll('.plan-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + group);
  if (panel) panel.classList.add('active');
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
  const btn = document.getElementById('sanity-eb-cta');
  if (btn && spotsLeft <= 0) {
    btn.textContent = 'AUSVERKAUFT';
    btn.disabled = true;
    btn.classList.replace('btn--gold', 'btn--outline-dark');
  }

  // Animated counter: triggers when section scrolls into view
  const numEl = document.getElementById('eb-remaining');
  if (numEl) {
    numEl.textContent = spotsLeft;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateCounter(numEl, 0, spotsLeft, 1600);
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

  // Remove previous scroll handler before adding a new one to prevent listener leak on resize
  if (slider._dotScrollHandler) slider.removeEventListener('scroll', slider._dotScrollHandler);

  let ticking = false;
  slider._dotScrollHandler = () => {
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
  };
  slider.addEventListener('scroll', slider._dotScrollHandler, { passive: true });
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
    if (a) a.style.maxHeight = '';
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

/* Click backdrop (modal element itself, not its children) */
document.addEventListener('click', e => {
  if (e.target.id === 'family-modal')    closeFamilyModal();
  if (e.target.id === 'corporate-modal') closeCorporateModal();
});

/* ESC closes any open modal or mobile nav */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const familyModal    = document.getElementById('family-modal');
  const corporateModal = document.getElementById('corporate-modal');
  const mobileNav      = document.getElementById('mobile-nav');
  if (familyModal    && familyModal.classList.contains('open'))    { closeFamilyModal();    return; }
  if (corporateModal && corporateModal.classList.contains('open')) { closeCorporateModal(); return; }
  if (mobileNav      && mobileNav.classList.contains('open'))      { toggleMenu();          return; }
});

/* ── Modal Scroll Fade ────────────────────────────────────── */
function initModalScrollFade(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const card    = modal.querySelector('.family-modal-card');
  const wrapper = modal.querySelector('.modal-card-wrapper');
  if (!card || !wrapper) return;

  card.scrollTop = 0;

  function check() {
    const atBottom = card.scrollTop + card.clientHeight >= card.scrollHeight - 30;
    wrapper.classList.toggle('at-bottom', atBottom);
  }

  if (card._scrollFadeHandler) card.removeEventListener('scroll', card._scrollFadeHandler);
  card._scrollFadeHandler = check;
  card.addEventListener('scroll', check, { passive: true });
  requestAnimationFrame(check);
}

/* ── Family Membership Modal ──────────────────────────────── */
function openFamilyModal() {
  const modal = document.getElementById('family-modal');
  if (!modal || modal.classList.contains('open')) return;
  modal.classList.add('open');
  lockBodyScroll();
  initModalScrollFade('family-modal');
}

function closeFamilyModal() {
  const modal = document.getElementById('family-modal');
  if (!modal || !modal.classList.contains('open')) return;
  modal.classList.remove('open');
  unlockBodyScroll();
  // Reset form and success state on close
  const form = document.getElementById('family-inquiry-form');
  const success = document.getElementById('fif-success');
  if (form) {
    form.reset();
    form.style.display = '';
    form.querySelectorAll('.fif-error').forEach(el => { el.textContent = ''; });
    form.querySelectorAll('.fif-input-error').forEach(el => el.classList.remove('fif-input-error'));
    // Reset dynamic fields
    const memberNames = document.getElementById('fif-member-names');
    if (memberNames) memberNames.innerHTML = '';
    const addressSection = document.getElementById('fif-address-section');
    if (addressSection) addressSection.hidden = true;
  }
  if (success) success.hidden = true;
}

/* Dynamic family member name fields */
function updateFamilyMemberFields() {
  const select    = document.getElementById('fif-count');
  const container = document.getElementById('fif-member-names');
  if (!select || !container) return;

  const val   = select.value;
  container.innerHTML = '';
  if (!val) return;

  const count = parseInt(val) || 0; // '6' = 6 (label shown as "6+")
  for (let i = 1; i <= count; i++) {
    const div = document.createElement('div');
    div.className = 'fif-field';
    div.innerHTML =
      `<label for="fif-member-${i}">Name Familienmitglied ${i} <span class="fif-required">*</span></label>` +
      `<input type="text" id="fif-member-${i}" name="member_${i}" placeholder="Vor- und Nachname">` +
      `<span class="fif-error" id="fif-member-${i}-error" aria-live="polite"></span>`;
    container.appendChild(div);
  }

  // Re-check scroll fade after fields are added
  requestAnimationFrame(() => initModalScrollFade('family-modal'));
}

/* Household conditional address fields */
function handleHouseholdChange(value) {
  const section = document.getElementById('fif-address-section');
  if (!section) return;
  section.hidden = (value !== 'Nein');
  // Re-check scroll fade after address fields appear/disappear
  requestAnimationFrame(() => initModalScrollFade('family-modal'));
}

async function submitFamilyInquiry(e) {
  e.preventDefault();
  const form = e.target;

  // Clear previous errors
  form.querySelectorAll('.fif-error').forEach(el => { el.textContent = ''; });
  form.querySelectorAll('.fif-input-error').forEach(el => el.classList.remove('fif-input-error'));

  const nameEl  = form.querySelector('[name="name"]');
  const emailEl = form.querySelector('[name="email"]');
  const phoneEl = form.querySelector('[name="phone"]');

  const name  = nameEl.value.trim();
  const email = emailEl.value.trim();
  const phone = phoneEl.value.trim();

  let valid = true;

  if (!name) {
    document.getElementById('fif-name-error').textContent = 'Bitte gib deinen Namen ein';
    nameEl.classList.add('fif-input-error');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('fif-email-error').textContent = 'Bitte gib eine gültige E-Mail-Adresse ein';
    emailEl.classList.add('fif-input-error');
    valid = false;
  }
  if (!phone) {
    document.getElementById('fif-phone-error').textContent = 'Bitte gib deine Telefonnummer ein';
    phoneEl.classList.add('fif-input-error');
    valid = false;
  }

  // Validate dynamic member name fields
  const countSelect = form.querySelector('[name="count"]');
  const countVal    = countSelect ? countSelect.value : '';
  const count       = parseInt(countVal) || 0;
  const memberNames = [];
  for (let i = 1; i <= count; i++) {
    const el  = form.querySelector(`[name="member_${i}"]`);
    const val = el ? el.value.trim() : '';
    memberNames.push(val);
    if (!val) {
      const errEl = document.getElementById(`fif-member-${i}-error`);
      if (errEl) errEl.textContent = 'Bitte Namen eingeben';
      if (el) el.classList.add('fif-input-error');
      valid = false;
    }
  }

  if (!valid) return;

  const household = (form.querySelector('[name="household"]:checked') || {}).value || '';
  const message   = form.querySelector('[name="message"]').value.trim();
  const street    = household === 'Nein' ? (form.querySelector('[name="address_street"]') || {}).value?.trim() || '' : '';
  const plz       = household === 'Nein' ? (form.querySelector('[name="address_plz"]')    || {}).value?.trim() || '' : '';
  const city      = household === 'Nein' ? (form.querySelector('[name="address_city"]')   || {}).value?.trim() || '' : '';

  const btn      = form.querySelector('[type="submit"]');
  const origHtml = btn.innerHTML;
  btn.disabled   = true;
  btn.innerHTML  = 'Wird gesendet…';

  try {
    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type: 'family',
        name, email, phone,
        count: countVal,
        members: memberNames,
        household, street, plz, city, message,
      }),
    });

    if (!res.ok) throw new Error('Request failed');

    form.style.display = 'none';
    document.getElementById('fif-success').hidden = false;
  } catch {
    btn.disabled  = false;
    btn.innerHTML = origHtml;
    document.getElementById('fif-name-error').textContent =
      'Fehler beim Senden. Bitte versuche es erneut.';
  }
}

/* ── Corporate Boxing Modal ───────────────────────────────── */
function openCorporateModal() {
  const modal = document.getElementById('corporate-modal');
  if (!modal || modal.classList.contains('open')) return;
  modal.classList.add('open');
  lockBodyScroll();
  initModalScrollFade('corporate-modal');
}

function closeCorporateModal() {
  const modal = document.getElementById('corporate-modal');
  if (!modal || !modal.classList.contains('open')) return;
  modal.classList.remove('open');
  unlockBodyScroll();
  const form    = document.getElementById('corporate-inquiry-form');
  const success = document.getElementById('cbf-success');
  if (form) {
    form.reset();
    form.style.display = '';
    form.querySelectorAll('.fif-error').forEach(el => { el.textContent = ''; });
    form.querySelectorAll('.fif-input-error').forEach(el => el.classList.remove('fif-input-error'));
  }
  if (success) success.hidden = true;
}

async function submitCorporateInquiry(e) {
  e.preventDefault();
  const form = e.target;

  form.querySelectorAll('.fif-error').forEach(el => { el.textContent = ''; });
  form.querySelectorAll('.fif-input-error').forEach(el => el.classList.remove('fif-input-error'));

  const nameEl    = form.querySelector('[name="name"]');
  const emailEl   = form.querySelector('[name="email"]');
  const phoneEl   = form.querySelector('[name="phone"]');
  const personsEl = form.querySelector('[name="persons"]');
  const dateEl    = form.querySelector('[name="date"]');
  const timeEl    = form.querySelector('[name="time"]');

  const name    = nameEl.value.trim();
  const email   = emailEl.value.trim();
  const phone   = phoneEl.value.trim();
  const persons = personsEl.value;
  const date    = dateEl.value;
  const time    = timeEl.value.trim();

  let valid = true;

  if (!name) {
    document.getElementById('cbf-name-error').textContent = 'Bitte gib deinen Namen ein';
    nameEl.classList.add('fif-input-error');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('cbf-email-error').textContent = 'Bitte gib eine gültige E-Mail-Adresse ein';
    emailEl.classList.add('fif-input-error');
    valid = false;
  }
  if (!phone) {
    document.getElementById('cbf-phone-error').textContent = 'Bitte gib deine Telefonnummer ein';
    phoneEl.classList.add('fif-input-error');
    valid = false;
  }
  if (!persons) {
    document.getElementById('cbf-persons-error').textContent = 'Bitte wähle die Anzahl der Personen';
    personsEl.classList.add('fif-input-error');
    valid = false;
  }
  if (!date) {
    document.getElementById('cbf-date-error').textContent = 'Bitte wähle ein gewünschtes Datum';
    dateEl.classList.add('fif-input-error');
    valid = false;
  }
  if (!time) {
    document.getElementById('cbf-time-error').textContent = 'Bitte gib eine gewünschte Uhrzeit an';
    timeEl.classList.add('fif-input-error');
    valid = false;
  }

  if (!valid) return;

  const company  = form.querySelector('[name="company"]').value.trim();
  const catering = (form.querySelector('[name="catering"]:checked') || {}).value || '';
  const event    = form.querySelector('[name="event"]').value.trim();
  const message  = form.querySelector('[name="message"]').value.trim();

  const btn      = form.querySelector('[type="submit"]');
  const origHtml = btn.innerHTML;
  btn.disabled   = true;
  btn.innerHTML  = 'Wird gesendet…';

  try {
    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type: 'corporate',
        name, email, phone, company,
        persons, date, time, catering, event, message,
      }),
    });

    if (!res.ok) throw new Error('Request failed');

    form.style.display = 'none';
    document.getElementById('cbf-success').hidden = false;
  } catch {
    btn.disabled  = false;
    btn.innerHTML = origHtml;
    document.getElementById('cbf-name-error').textContent =
      'Fehler beim Senden. Bitte versuche es erneut.';
  }
}

/* ── Corporate Boxing Inline Form ──────────────────────────── */
async function submitCorporateInquiryInline(e) {
  e.preventDefault();
  const form = e.target;

  form.querySelectorAll('.fif-error').forEach(el => { el.textContent = ''; });
  form.querySelectorAll('.fif-input-error').forEach(el => el.classList.remove('fif-input-error'));

  const nameEl    = form.querySelector('[name="name"]');
  const emailEl   = form.querySelector('[name="email"]');
  const phoneEl   = form.querySelector('[name="phone"]');
  const personsEl = form.querySelector('[name="persons"]');
  const dateEl    = form.querySelector('[name="date"]');
  const timeEl    = form.querySelector('[name="time"]');

  const name    = nameEl.value.trim();
  const email   = emailEl.value.trim();
  const phone   = phoneEl.value.trim();
  const persons = personsEl.value;
  const date    = dateEl.value;
  const time    = timeEl.value.trim();

  let valid = true;

  const showErr = (el, msg) => {
    el.nextElementSibling.textContent = msg;
    el.classList.add('fif-input-error');
    valid = false;
  };

  if (!name)    showErr(nameEl,    'Bitte gib deinen Namen ein');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                showErr(emailEl,   'Bitte gib eine gültige E-Mail-Adresse ein');
  if (!phone)   showErr(phoneEl,   'Bitte gib deine Telefonnummer ein');
  if (!persons) showErr(personsEl, 'Bitte wähle die Anzahl der Personen');
  if (!date)    showErr(dateEl,    'Bitte wähle ein gewünschtes Datum');
  if (!time)    showErr(timeEl,    'Bitte gib eine gewünschte Uhrzeit an');

  if (!valid) return;

  const company  = form.querySelector('[name="company"]').value.trim();
  const catering = (form.querySelector('[name="catering"]:checked') || {}).value || '';
  const event    = form.querySelector('[name="event"]').value.trim();
  const message  = form.querySelector('[name="message"]').value.trim();

  const btn      = form.querySelector('[type="submit"]');
  const origHtml = btn.innerHTML;
  btn.disabled   = true;
  btn.innerHTML  = 'Wird gesendet…';

  try {
    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type: 'corporate',
        name, email, phone, company,
        persons, date, time, catering, event, message,
      }),
    });

    if (!res.ok) throw new Error('Request failed');

    form.style.display = 'none';
    document.getElementById('cbi-success').hidden = false;
  } catch {
    btn.disabled  = false;
    btn.innerHTML = origHtml;
    nameEl.nextElementSibling.textContent = 'Fehler beim Senden. Bitte versuche es erneut.';
  }
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
   FLOATING SOCIAL PROOF NOTIFICATIONS
══════════════════════════════════════════════════════════════ */
(function initSocialProof() {
  const messages = [
    { name: 'Ahmed aus München',  msg: 'hat gerade seinen Early-Bird-Platz gesichert' },
    { name: 'Lisa',               msg: 'ist dem Bomaye Gym beigetreten' },
    { name: 'Neues Mitglied',     msg: 'hat sich der Fighter Community angeschlossen' },
    { name: 'Marco aus München',  msg: 'hat sich seinen Early-Bird-Preis gesichert' },
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


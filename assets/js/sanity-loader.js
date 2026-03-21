/* ============================================================
   BOMAYE GYM MUNICH — sanity-loader.js
   ============================================================
   Fetches all content from Sanity and patches the existing
   global objects + re-triggers render functions.

   Load order: AFTER main.js (all render functions must exist).
   Depends on: sanity-client.js (window.sanityFetch)

   Pattern: progressive enhancement.
   Static JS files render instantly; Sanity data overlays on
   arrival. Silently falls back to static data on any error.
   ============================================================ */

/* ── GROQ Queries ──────────────────────────────────────────── */

var QUERY_SITE_SETTINGS = '*[_type == "siteSettings"][0]{'
  + 'openingStatus,'
  + 'earlyBird{ total, remaining }'
  + '}';

var QUERY_HOMEPAGE = '*[_type == "homepage"][0]{'
  + 'hero{ badge, headline, subheadline,'
  + '      ctaPrimary{ label, href }, ctaSecondary{ label, href } },'
  + 'announcement{ enabled, text, linkHref },'
  + 'earlyBird{ enabled, sectionBadge, headline, subtext,'
  + '           spotsLabel, spotsBarEnabled, cta{ label, href } },'
  + 'membershipIntro{ sectionBadge, headline, subtext, cta{ label, href } },'
  + 'familyBenefitTeaser{ enabled, sectionBadge, headline, subtext, ctaLabel },'
  + 'personalTrainingTeaser{ sectionBadge, headline, subtext,'
  + '                        bulletPoints, cta{ label, href } },'
  + 'corporateBoxingTeaser{ enabled, sectionBadge, headline, subtext, ctaLabel },'
  + 'faqTeaser{ sectionBadge, headline, subtext,'
  + '           cta{ label, href }, seoFooterText }'
  + '}';

var QUERY_PRICING = '*[_type == "pricing"][0]{'
  + 'enrollmentFee{ amount, label, note, earlyBirdWaived },'
  + 'membershipTiers[]{'
  + '  id, name, tag, icon, ageGroups, note,'
  + '  earlyBirdPrices{ oneMonth, threeMonths, sixMonths, twelveMonths },'
  + '  regularPrices{ oneMonth, threeMonths, sixMonths, twelveMonths }'
  + '},'
  + 'personalTraining{ name, tag, icon, priceLabel, priceUnit, note },'
  + 'corporate{ name, tag, icon, priceLabel, note }'
  + '}';

var QUERY_FAMILY = '*[_type == "familyBenefit"][0]{'
  + 'enabled,'
  + 'teaser{ label, text },'
  + 'modal{ title, supportText, bulletPoints, formTitle },'
  + 'form{ submitLabel, recipientEmail },'
  + 'successMessage{ title, text }'
  + '}';

var QUERY_CORPORATE = '*[_type == "corporateBoxing"][0]{'
  + 'enabled,'
  + 'teaser{ title, text },'
  + 'modal{ title, supportText, benefits, formTitle,'
  + '       cateringOption{ enabled, label, description } },'
  + 'form{ submitLabel, recipientEmail },'
  + 'successMessage{ title, text }'
  + '}';

/* ── Helpers ───────────────────────────────────────────────── */

function setText(id, value) {
  if (!value) return;
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHtml(id, value) {
  if (!value) return;
  var el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function setAttr(id, attr, value) {
  if (!value) return;
  var el = document.getElementById(id);
  if (el) el.setAttribute(attr, value);
}

/* Map Sanity verbose duration keys → short keys used by main.js */
function mapWeeklyPrices(p) {
  if (!p) return null;
  return {
    '1M':  p.oneMonth    || 0,
    '3M':  p.threeMonths || 0,
    '6M':  p.sixMonths   || 0,
    '12M': p.twelveMonths || 0,
  };
}

/* ── Apply: siteSettings ───────────────────────────────────── */

function applySiteSettings(data) {
  if (!data || typeof BOMAYE === 'undefined') return;

  if (data.openingStatus) {
    BOMAYE.openingStatus = data.openingStatus;
  }

  if (data.earlyBird) {
    if (typeof data.earlyBird.total     === 'number') BOMAYE.earlyBird.total     = data.earlyBird.total;
    if (typeof data.earlyBird.remaining === 'number') BOMAYE.earlyBird.remaining = data.earlyBird.remaining;
  }

  /* Re-run the early bird FOMO render with updated counts */
  if (typeof initEarlyBirdFOMO === 'function') {
    initEarlyBirdFOMO();
  }
}

/* ── Apply: pricing ────────────────────────────────────────── */

function applyPricing(data) {
  if (!data || typeof BOMAYE === 'undefined') return;

  /* Enrollment fee */
  if (data.enrollmentFee && typeof data.enrollmentFee.amount === 'number') {
    BOMAYE.pricing.enrollmentFee = data.enrollmentFee.amount;
  }

  /* Membership tiers → programs array (shape expected by renderPricingDisplay) */
  if (Array.isArray(data.membershipTiers) && data.membershipTiers.length > 0) {
    BOMAYE.pricing.programs = data.membershipTiers.map(function (t) {
      return {
        id:              t.id,
        name:            t.name,
        tag:             t.tag,
        icon:            t.icon,
        ageGroups:       t.ageGroups || [],
        note:            t.note || '',
        earlyBirdPrices: mapWeeklyPrices(t.earlyBirdPrices),
        regularPrices:   mapWeeklyPrices(t.regularPrices),
      };
    });
  }

  /* Personal training */
  if (data.personalTraining) {
    BOMAYE.pricing.personal = data.personalTraining;
  }

  /* Corporate add-on in pricing card */
  if (data.corporate) {
    BOMAYE.pricing.corporate = data.corporate;
  }

  /* Re-render the pricing display with whatever age tab is active */
  if (typeof renderPricingDisplay === 'function') {
    var activeTab = document.querySelector('.atab.active');
    var currentAge = activeTab ? activeTab.dataset.age : 'erwachsene';
    renderPricingDisplay(currentAge, '12M');
  }
}

/* ── Apply: homepage ───────────────────────────────────────── */

function applyHomepage(data) {
  if (!data) return;

  /* Hero */
  if (data.hero) {
    setText('sanity-hero-headline',    data.hero.headline);
    setText('sanity-hero-subheadline', data.hero.subheadline);
    setText('sanity-hero-badge',       data.hero.badge);
    if (data.hero.ctaPrimary) {
      setText('sanity-hero-cta-primary', data.hero.ctaPrimary.label);
      setAttr('sanity-hero-cta-primary', 'href', data.hero.ctaPrimary.href);
    }
    if (data.hero.ctaSecondary) {
      setText('sanity-hero-cta-secondary', data.hero.ctaSecondary.label);
      setAttr('sanity-hero-cta-secondary', 'href', data.hero.ctaSecondary.href);
    }
  }

  /* Announcement bar */
  if (data.announcement) {
    var bar = document.getElementById('sanity-announcement-bar');
    if (bar) {
      bar.style.display = data.announcement.enabled ? '' : 'none';
      if (data.announcement.text) {
        setText('sanity-announcement-text', data.announcement.text);
      }
    }
  }

  /* Early bird section */
  if (data.earlyBird) {
    var ebSection = document.getElementById('early-bird');
    if (ebSection && data.earlyBird.enabled === false) {
      ebSection.style.display = 'none';
    }
    setText('sanity-eb-badge',    data.earlyBird.sectionBadge);
    setText('sanity-eb-headline', data.earlyBird.headline);
    setText('sanity-eb-subtext',  data.earlyBird.subtext);
    if (data.earlyBird.cta) {
      setText('sanity-eb-cta', data.earlyBird.cta.label);
    }
  }

  /* Membership intro */
  if (data.membershipIntro) {
    setText('sanity-membership-badge',    data.membershipIntro.sectionBadge);
    setText('sanity-membership-headline', data.membershipIntro.headline);
    setText('sanity-membership-subtext',  data.membershipIntro.subtext);
  }

  /* Personal training teaser */
  if (data.personalTrainingTeaser) {
    setText('sanity-pt-badge',    data.personalTrainingTeaser.sectionBadge);
    setText('sanity-pt-headline', data.personalTrainingTeaser.headline);
    setText('sanity-pt-subtext',  data.personalTrainingTeaser.subtext);
  }

  /* FAQ teaser */
  if (data.faqTeaser) {
    setText('sanity-faq-badge',    data.faqTeaser.sectionBadge);
    setText('sanity-faq-headline', data.faqTeaser.headline);
    setText('sanity-faq-subtext',  data.faqTeaser.subtext);
    if (data.faqTeaser.cta) {
      setText('sanity-faq-cta', data.faqTeaser.cta.label);
      setAttr('sanity-faq-cta', 'href', data.faqTeaser.cta.href);
    }
    setText('sanity-seo-footer', data.faqTeaser.seoFooterText);
  }

  /* Family benefit teaser visibility */
  if (data.familyBenefitTeaser) {
    var famTeaser = document.getElementById('sanity-family-teaser-section');
    if (famTeaser) {
      famTeaser.style.display = data.familyBenefitTeaser.enabled ? '' : 'none';
    }
    setText('sanity-family-teaser-badge',    data.familyBenefitTeaser.sectionBadge);
    setText('sanity-family-teaser-headline', data.familyBenefitTeaser.headline);
    setText('sanity-family-teaser-subtext',  data.familyBenefitTeaser.subtext);
    if (data.familyBenefitTeaser.ctaLabel) {
      setText('sanity-family-teaser-cta', data.familyBenefitTeaser.ctaLabel);
    }
  }

  /* Corporate boxing teaser visibility */
  if (data.corporateBoxingTeaser) {
    var corpTeaser = document.getElementById('sanity-corporate-teaser-section');
    if (corpTeaser) {
      corpTeaser.style.display = data.corporateBoxingTeaser.enabled ? '' : 'none';
    }
    setText('sanity-corporate-teaser-headline', data.corporateBoxingTeaser.headline);
    setText('sanity-corporate-teaser-subtext',  data.corporateBoxingTeaser.subtext);
    if (data.corporateBoxingTeaser.ctaLabel) {
      setText('sanity-corporate-teaser-cta', data.corporateBoxingTeaser.ctaLabel);
    }
  }
}

/* ── Apply: familyBenefit ──────────────────────────────────── */

function applyFamilyBenefit(data) {
  if (!data || typeof BOMAYE_FAMILY === 'undefined') return;

  BOMAYE_FAMILY.enabled = !!data.enabled;

  if (data.teaser) {
    if (data.teaser.label) BOMAYE_FAMILY.teaser.label = data.teaser.label;
    if (data.teaser.text)  BOMAYE_FAMILY.teaser.text  = data.teaser.text;
  }

  if (data.modal) {
    if (data.modal.title)        BOMAYE_FAMILY.modal.title       = data.modal.title;
    if (data.modal.supportText)  BOMAYE_FAMILY.modal.supportText = data.modal.supportText;
    if (Array.isArray(data.modal.bulletPoints) && data.modal.bulletPoints.length > 0) {
      BOMAYE_FAMILY.modal.bulletPoints = data.modal.bulletPoints;
    }
    if (data.modal.formTitle) BOMAYE_FAMILY.modal.formTitle = data.modal.formTitle;
  }

  if (data.successMessage) {
    if (data.successMessage.title) BOMAYE_FAMILY.successMessage.title = data.successMessage.title;
    if (data.successMessage.text)  BOMAYE_FAMILY.successMessage.text  = data.successMessage.text;
  }

  /* Patch visible modal DOM */
  setText('family-modal-title',   data.modal && data.modal.title);
  setText('family-modal-support', data.modal && data.modal.supportText);
  setText('fif-success-title',    data.successMessage && data.successMessage.title);
  setText('fif-success-text',     data.successMessage && data.successMessage.text);

  /* Bullet points */
  if (data.modal && Array.isArray(data.modal.bulletPoints)) {
    var bulletsEl = document.getElementById('family-modal-bullets');
    if (bulletsEl) {
      bulletsEl.innerHTML = data.modal.bulletPoints.map(function (b) {
        return '<li><i class="fa-solid fa-check"></i> ' + escHtmlSafe(b) + '</li>';
      }).join('');
    }
  }

  /* Show/hide family modal trigger based on enabled flag */
  var modalTriggers = document.querySelectorAll('.family-benefit-trigger');
  modalTriggers.forEach(function (el) {
    el.style.display = data.enabled ? '' : 'none';
  });
}

/* ── Apply: corporateBoxing ────────────────────────────────── */

function applyCorporateBoxing(data) {
  if (!data || typeof BOMAYE_CORPORATE === 'undefined') return;

  BOMAYE_CORPORATE.enabled = !!data.enabled;

  if (data.teaser) {
    if (data.teaser.title) BOMAYE_CORPORATE.teaser.title = data.teaser.title;
    if (data.teaser.text)  BOMAYE_CORPORATE.teaser.text  = data.teaser.text;
  }

  if (data.modal) {
    if (data.modal.title)       BOMAYE_CORPORATE.modal.title       = data.modal.title;
    if (data.modal.supportText) BOMAYE_CORPORATE.modal.supportText = data.modal.supportText;
    if (Array.isArray(data.modal.benefits) && data.modal.benefits.length > 0) {
      BOMAYE_CORPORATE.modal.benefits = data.modal.benefits;
    }
  }

  if (data.successMessage) {
    if (data.successMessage.title) BOMAYE_CORPORATE.successMessage.title = data.successMessage.title;
    if (data.successMessage.text)  BOMAYE_CORPORATE.successMessage.text  = data.successMessage.text;
  }

  /* Patch visible modal DOM */
  setText('corporate-modal-title',   data.modal && data.modal.title);
  setText('corporate-modal-support', data.modal && data.modal.supportText);
  setText('cbf-success-title',       data.successMessage && data.successMessage.title);
  setText('cbf-success-text',        data.successMessage && data.successMessage.text);

  /* Benefits list */
  if (data.modal && Array.isArray(data.modal.benefits)) {
    var benefitsEl = document.getElementById('corporate-modal-benefits');
    if (benefitsEl) {
      benefitsEl.innerHTML = data.modal.benefits.map(function (b) {
        return '<li><i class="fa-solid fa-check"></i> ' + escHtmlSafe(b) + '</li>';
      }).join('');
    }
  }
}

/* ── Safe HTML escape (for user-supplied strings inserted as HTML) */
function escHtmlSafe(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Boot: fetch all data in parallel on DOM ready ─────────── */

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.sanityFetch !== 'function') return;

  Promise.all([
    window.sanityFetch(QUERY_SITE_SETTINGS).catch(function () { return null; }),
    window.sanityFetch(QUERY_HOMEPAGE).catch(function ()      { return null; }),
    window.sanityFetch(QUERY_PRICING).catch(function ()       { return null; }),
    window.sanityFetch(QUERY_FAMILY).catch(function ()        { return null; }),
    window.sanityFetch(QUERY_CORPORATE).catch(function ()     { return null; }),
  ]).then(function (results) {
    var settingsData  = results[0];
    var homepageData  = results[1];
    var pricingData   = results[2];
    var familyData    = results[3];
    var corporateData = results[4];

    if (settingsData)  applySiteSettings(settingsData);
    if (pricingData)   applyPricing(pricingData);
    if (homepageData)  applyHomepage(homepageData);
    if (familyData)    applyFamilyBenefit(familyData);
    if (corporateData) applyCorporateBoxing(corporateData);

    /* Signal for any code that needs to react post-Sanity load */
    window.sanityLoaded = true;
    document.dispatchEvent(new CustomEvent('sanityReady', {
      detail: { settings: settingsData, homepage: homepageData,
                pricing: pricingData, family: familyData, corporate: corporateData }
    }));
  });
});

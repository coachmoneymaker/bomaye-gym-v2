/* ============================================================
   BOMAYE GYM MUNICH — sanity-faq-loader.js
   ============================================================
   Fetches FAQ content from Sanity and re-renders the FAQ page
   accordion + JSON-LD schema.

   Load order: AFTER faq-data.js and the inline build scripts
   in faq.html. Depends on: sanity-client.js (window.sanityFetch)
   ============================================================ */

var QUERY_FAQ = '*[_type == "faq"][0]{'
  + 'categories[]{ label, id },'
  + 'items[]{ question, answer, categoryId }'
  + '}';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.sanityFetch !== 'function') return;

  window.sanityFetch(QUERY_FAQ).then(function (data) {
    if (!data) return;

    /* Build BOMAYE_FAQ shape from Sanity document */
    var grouped = {};
    var order   = [];

    /* Build category order map */
    if (Array.isArray(data.categories)) {
      data.categories.forEach(function (cat) {
        grouped[cat.id] = { category: cat.label, id: cat.id, items: [] };
        order.push(cat.id);
      });
    }

    /* Group items into their categories */
    if (Array.isArray(data.items)) {
      data.items.forEach(function (item) {
        var catId = item.categoryId;
        if (grouped[catId]) {
          grouped[catId].items.push({ q: item.question, a: item.answer });
        }
      });
    }

    /* Produce the same array shape as faq-data.js */
    var newFaqData = order.map(function (id) { return grouped[id]; })
                         .filter(function (s) { return s.items.length > 0; });

    if (newFaqData.length === 0) return;

    /* Override global */
    // eslint-disable-next-line no-global-assign
    BOMAYE_FAQ = newFaqData;

    /* Re-render accordion */
    rebuildFaqAccordion(newFaqData);

    /* Re-inject JSON-LD */
    rebuildFaqJsonLd(newFaqData);

  }).catch(function () { /* silent fallback to static faq-data.js */ });
});

function rebuildFaqAccordion(faqData) {
  var root = document.getElementById('faqp-accordion');
  if (!root) return;

  var html = '';
  faqData.forEach(function (section) {
    html += '<div class="faqp-section">';
    html += '<div class="faqp-category">';
    html += '<span class="faqp-category-pill">' + escFaq(section.category) + '</span>';
    html += '</div>';
    html += '<div class="faqp-list" role="list">';

    section.items.forEach(function (item, idx) {
      var panelId = 'faqp-' + section.id + '-' + idx;
      var btnId   = 'faqpbtn-' + section.id + '-' + idx;
      var answerHtml = escFaq(item.a)
        .split('\\n')
        .map(function (p) { return p.trim(); })
        .filter(Boolean)
        .map(function (p) { return '<p>' + p + '</p>'; })
        .join('');
      if (!answerHtml) answerHtml = '<p>' + escFaq(item.a) + '</p>';

      html += '<div class="faqp-item" role="listitem" data-open="false">';
      html += '<button class="faqp-item-btn" id="' + btnId + '"'
            + ' aria-expanded="false" aria-controls="' + panelId + '"'
            + ' type="button">';
      html += '<span class="faqp-question">' + escFaq(item.q) + '</span>';
      html += '<span class="faqp-icon" aria-hidden="true">'
            + '<i class="fa-solid fa-plus  faqp-icon-plus"></i>'
            + '<i class="fa-solid fa-minus faqp-icon-minus"></i>'
            + '</span>';
      html += '</button>';
      html += '<div class="faqp-panel" id="' + panelId + '"'
            + ' role="region" aria-labelledby="' + btnId + '">';
      html += '<div class="faqp-answer">' + answerHtml + '</div>';
      html += '</div>';
      html += '</div>';
    });

    html += '</div></div>';
  });

  root.innerHTML = html;

  /* Re-attach accordion click listeners */
  root.querySelectorAll('.faqp-item-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item      = btn.closest('.faqp-item');
      var panel     = document.getElementById(btn.getAttribute('aria-controls'));
      var isOpen    = item.dataset.open === 'true';
      var newState  = !isOpen;

      item.dataset.open           = newState;
      btn.setAttribute('aria-expanded', newState);
      if (panel) panel.style.maxHeight = newState ? panel.scrollHeight + 'px' : '';
    });
  });

  /* Rebuild category filter pills if they exist */
  rebuildCategoryFilter(faqData);
}

function rebuildCategoryFilter(faqData) {
  var nav = document.getElementById('faqp-category-nav');
  if (!nav) return;

  var html = '<button class="faqp-cat-btn active" data-cat="all" type="button">Alle</button>';
  faqData.forEach(function (section) {
    html += '<button class="faqp-cat-btn" data-cat="' + escFaq(section.id) + '" type="button">'
          + escFaq(section.category) + '</button>';
  });
  nav.innerHTML = html;

  /* Re-attach filter listeners */
  nav.querySelectorAll('.faqp-cat-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      nav.querySelectorAll('.faqp-cat-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      var cat      = btn.dataset.cat;
      var sections = document.querySelectorAll('.faqp-section');
      sections.forEach(function (sec) {
        sec.style.display = (cat === 'all' || sec.dataset.cat === cat) ? '' : 'none';
      });
    });
  });

  /* Tag each section with its category id for filtering */
  var sections = document.querySelectorAll('.faqp-section');
  sections.forEach(function (sec, i) {
    if (faqData[i]) sec.dataset.cat = faqData[i].id;
  });
}

function rebuildFaqJsonLd(faqData) {
  var qas = [];
  faqData.forEach(function (section) {
    section.items.forEach(function (item) {
      qas.push({
        '@type': 'Question',
        'name':  item.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': item.a }
      });
    });
  });
  var schema = {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    'mainEntity': qas
  };
  var el = document.getElementById('faq-jsonld');
  if (el) el.textContent = JSON.stringify(schema);
}

function escFaq(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

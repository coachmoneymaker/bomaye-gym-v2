/* ============================================================
   BOMAYE GYM MUNICH — sanity-coaches-loader.js
   ============================================================
   Fetches coach profiles from Sanity and rebuilds the coach
   cards on coaches.html.

   Load order: AFTER sanity-client.js (window.sanityFetch).
   Fallback: if Sanity returns no coaches the existing
   hardcoded cards remain visible.
   ============================================================ */

var QUERY_COACHES = '*[_type == "coach"] | order(order asc) {'
  + '_id,'
  + 'name,'
  + 'role,'
  + '"photoUrl": photo.asset->url,'
  + 'bio,'
  + 'specialties,'
  + 'certifications,'
  + 'experience,'
  + 'instagram,'
  + 'featured'
  + '}';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.sanityFetch !== 'function') return;

  window.sanityFetch(QUERY_COACHES).then(function (coaches) {
    if (!Array.isArray(coaches) || coaches.length === 0) return;
    rebuildCoachCards(coaches);
  }).catch(function () { /* silent — keep static cards */ });
});

/* ── Build Sanity image URL with basic transforms ── */
function coachImgUrl(baseUrl) {
  if (!baseUrl) return '';
  return baseUrl + '?auto=format&w=800&q=80';
}

/* ── Escape for safe HTML insertion ── */
function escCoach(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Rebuild all coach cards from Sanity data ── */
function rebuildCoachCards(coaches) {
  var container = document.querySelector('.coaches-page-section .container');
  if (!container) return;

  var html = '';

  coaches.forEach(function (coach, idx) {
    var isReverse  = idx % 2 === 1;
    var delayClass = idx > 0 ? ' delay-' + idx : '';
    var reverseClass = isReverse ? ' reverse' : '';

    /* Photo block */
    var photoSrc = coach.photoUrl ? coachImgUrl(coach.photoUrl) : '';
    var photoAlt = escCoach(coach.name) + ' — ' + escCoach(coach.role);

    var credsHtml = '';
    if (Array.isArray(coach.certifications) && coach.certifications.length > 0) {
      /* Show up to 3 credential badges */
      coach.certifications.slice(0, 3).forEach(function (cert) {
        credsHtml += '<span class="coach-full-cred">' + escCoach(cert).toUpperCase() + '</span>';
      });
    }
    if (coach.experience) {
      credsHtml += '<span class="coach-full-cred">' + escCoach(String(coach.experience)) + '+ JAHRE</span>';
    }

    /* Specialty badges */
    var badgesHtml = '';
    if (Array.isArray(coach.specialties)) {
      coach.specialties.forEach(function (s) {
        badgesHtml += '<span class="coach-trust-badge">'
          + '<em class="badge-emoji">🥊</em> '
          + escCoach(s)
          + '</span>';
      });
    }

    /* Bio — preserve line breaks */
    var bioHtml = '';
    if (coach.bio) {
      var lines = coach.bio.split('\n').filter(function (l) { return l.trim(); });
      bioHtml = lines.map(function (l) { return escCoach(l); }).join('<br>');
    }

    /* Socials */
    var socialsHtml = '';
    if (coach.instagram) {
      socialsHtml += '<a href="' + escCoach(coach.instagram)
        + '" class="coach-social-link" target="_blank" rel="noopener noreferrer"'
        + ' aria-label="' + escCoach(coach.name) + ' auf Instagram">'
        + '<i class="fa-brands fa-instagram"></i></a>';
    }

    /* CTA button label */
    var ctaLabel = 'TRAINING BEI ' + escCoach(coach.name.split(' ')[0]).toUpperCase() + ' BUCHEN';

    html += '<div class="coach-card-full' + reverseClass + ' reveal' + delayClass + '">';

    /* Photo column */
    html += '<div class="coach-full-photo">';
    if (photoSrc) {
      html += '<img src="' + escCoach(photoSrc) + '" alt="' + photoAlt + '" loading="eager" decoding="async" />';
    }
    if (credsHtml) {
      html += '<div class="coach-full-creds">' + credsHtml + '</div>';
    }
    html += '</div>';

    /* Info column */
    html += '<div class="coach-full-info">';
    html += '<h3>' + escCoach(coach.name).toUpperCase() + '</h3>';
    html += '<p class="coach-full-title">' + escCoach(coach.role).toUpperCase() + '</p>';
    if (badgesHtml) {
      html += '<div class="coach-trust-badges">' + badgesHtml + '</div>';
    }
    if (bioHtml) {
      html += '<p class="coach-full-bio">' + bioHtml + '</p>';
    }
    if (socialsHtml) {
      html += '<div class="coach-full-socials">' + socialsHtml + '</div>';
    }
    html += '<button onclick="openBooking()" class="btn btn--gold" type="button">'
      + '<i class="fa-solid fa-calendar-plus"></i> ' + ctaLabel
      + '</button>';
    html += '</div>'; /* /coach-full-info */

    html += '</div>'; /* /coach-card-full */
  });

  container.innerHTML = html;

  /* Re-run scroll reveal for newly created elements */
  var revealEls = container.querySelectorAll('.reveal');
  if (revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }
}

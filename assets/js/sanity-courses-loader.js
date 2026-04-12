/* ============================================================
   BOMAYE GYM MUNICH — sanity-courses-loader.js
   ============================================================
   Fetches course data from Sanity and merges it into the
   existing COURSES object used by kurse.html.

   Strategy: non-destructive merge — only overrides fields
   that Sanity provides. Static fallback values remain for
   any field not set in the CMS.

   Load order: AFTER sanity-client.js AND the inline
   <script> block in kurse.html (which defines COURSES).
   ============================================================ */

var QUERY_COURSES = '*[_type == "course" && enabled != false] | order(order asc) {'
  + '"slug": slug.current,'
  + 'name,'
  + 'tag,'
  + 'shortDescription,'
  + 'description,'
  + '"imageUrl": image.asset->url,'
  + 'highlights,'
  + 'scheduleNote,'
  + '"coachName": coach->name'
  + '}';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.sanityFetch !== 'function') return;
  /* COURSES is defined in kurse.html inline <script> */
  if (typeof COURSES === 'undefined') return;

  window.sanityFetch(QUERY_COURSES).then(function (courses) {
    if (!Array.isArray(courses) || courses.length === 0) return;
    mergeSanityCourses(courses);
  }).catch(function () { /* silent — keep static COURSES */ });
});

/* ── Build optimised Sanity CDN image URL ── */
function courseImgUrl(baseUrl) {
  if (!baseUrl) return '';
  return baseUrl + '?auto=format&w=1200&q=80';
}

/* ── Merge Sanity courses into the existing COURSES object ── */
function mergeSanityCourses(sanityCourses) {
  sanityCourses.forEach(function (sc) {
    var key = sc.slug;
    if (!key || typeof COURSES[key] === 'undefined') return;

    var entry = COURSES[key];

    /* Tag / badge label */
    if (sc.tag) {
      entry.tag = sc.tag;
    }

    /* Full description (shown in detail panel) */
    if (sc.description) {
      entry.desc = sc.description;
    }

    /* Course image */
    if (sc.imageUrl) {
      entry.img    = courseImgUrl(sc.imageUrl);
      entry.imgAlt = sc.name || entry.imgAlt;
    }

    /* Highlights → feats array */
    if (Array.isArray(sc.highlights) && sc.highlights.length > 0) {
      entry.feats = sc.highlights.map(function (h) {
        /* Allow "Strong text | detail text" separator in CMS */
        var parts = h.split('|');
        return {
          strong: (parts[0] || h).trim(),
          span:   (parts[1] || '').trim()
        };
      });
    }
  });

  /* If a detail panel is already open, refresh it with updated data */
  var visiblePanel = document.getElementById('course-detail');
  if (visiblePanel && visiblePanel.classList.contains('visible')) {
    /* Find which course is currently highlighted */
    var activeCard = document.querySelector('.course-card.active, [data-active-course]');
    var activeCourse = activeCard
      ? (activeCard.dataset.activeCourse || activeCard.dataset.course)
      : null;
    if (activeCourse && typeof openCourse === 'function') {
      openCourse(activeCourse);
    }
  }
}

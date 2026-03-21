/* ============================================================
   BOMAYE GYM MUNICH — sanity-client.js
   ============================================================
   Thin fetch wrapper for Sanity's public CDN HTTP API.
   No npm package, no build step — pure browser fetch().

   Project: 1in3t0lk  |  Dataset: production
   API:     https://1in3t0lk.apicdn.sanity.io
   ============================================================ */

(function () {
  var SANITY_PROJECT_ID  = '1in3t0lk';
  var SANITY_DATASET     = 'production';
  var SANITY_API_VERSION = '2023-01-01';
  var SANITY_BASE_URL    = 'https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io'
                         + '/v' + SANITY_API_VERSION
                         + '/data/query/' + SANITY_DATASET;

  /**
   * sanityFetch(query)
   * Sends a GROQ query to the Sanity CDN and returns the result.
   * @param  {string} query  GROQ query string
   * @return {Promise<any>}  Resolves with result, rejects on HTTP error
   */
  window.sanityFetch = function sanityFetch(query) {
    var url = SANITY_BASE_URL + '?query=' + encodeURIComponent(query);
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) return Promise.reject('Sanity HTTP ' + r.status);
        return r.json();
      })
      .then(function (r) {
        return r.result !== undefined ? r.result : null;
      });
  };
}());

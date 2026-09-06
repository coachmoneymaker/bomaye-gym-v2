/* Bomaye Gym — Video-Fassade
 *
 * Zeigt statt eines eingebetteten Players zunaechst nur ein eigenes
 * Standbild mit Abspielknopf. Vor dem ersten Klick geht KEINE Anfrage an
 * YouTube oder einen anderen Fremdanbieter raus — weder ein Skript noch
 * ein Vorschaubild, weder ein Cookie noch ein Fingerabdruck.
 *
 * Zwei Quellen, umschaltbar ueber ein einziges Attribut am Container:
 *
 *   data-video-source="youtube"     -> YouTube-Einbettung, erst nach
 *                                      Marketing-Einwilligung (Cookiebot).
 *   data-video-source="selfhosted"  -> eigene MP4-Datei aus /assets/videos.
 *                                      Erstanbieter, keine Einwilligung
 *                                      noetig, daher auch kein Hinweis.
 *
 * Der Wechsel auf die eigene Datei ist damit: Datei nach
 * /assets/videos/ legen, im HTML data-video-source auf "selfhosted"
 * stellen. Sonst nichts.
 *
 * Warum ueberhaupt eine Einwilligung fuer YouTube: youtube.com setzt beim
 * Laden des Players Kennungen zu Werbezwecken. Auch youtube-nocookie.com
 * verhindert das nur bis zum ersten Abspielen. Das ist eine Speicherung
 * bzw. ein Zugriff auf Endgeraeteinformationen im Sinne von
 * § 25 Abs. 1 TDDDG und braucht damit dieselbe Einwilligung wie das
 * bsport-Widget (siehe assets/js/bsport-gate.js).
 */
(function () {
  'use strict';

  var SEL = '.vfacade';

  function marketingConsented() {
    if (typeof window.bomayeMarketingConsented === 'function') {
      return !!window.bomayeMarketingConsented();
    }
    /* Ohne die Consent-Bruecke gibt es keine belastbare Aussage. Dann
       bleibt der Player zu — fail closed, wie beim bsport-Gate. */
    return false;
  }

  function clearPlayer(box) {
    var old = box.querySelector('.vfacade__player');
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function stage(box) {
    clearPlayer(box);
    var d = document.createElement('div');
    d.className = 'vfacade__player';
    box.appendChild(d);
    return d;
  }

  function hideFacade(box) {
    var p = box.querySelector('.vfacade__poster');
    var b = box.querySelector('.vfacade__play');
    if (p) p.hidden = true;
    if (b) b.hidden = true;
  }

  function showFacade(box) {
    var p = box.querySelector('.vfacade__poster');
    var b = box.querySelector('.vfacade__play');
    if (p) p.hidden = false;
    if (b) b.hidden = false;
  }

  /* ── YouTube ──────────────────────────────────────────────────────── */

  function mountYouTube(box) {
    var id = box.getAttribute('data-video-id');
    if (!id) return;
    hideFacade(box);
    var host = stage(box);
    var f = document.createElement('iframe');
    /* nocookie-Variante, autoplay weil der Nutzer gerade auf Play geklickt
       hat, rel=0 haelt die Abspann-Empfehlungen bei diesem Kanal. */
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id)
          + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    f.title = box.getAttribute('data-video-title') || 'Video';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen = true;
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.loading = 'lazy';
    host.appendChild(f);
  }

  function renderConsentNotice(box) {
    var host = stage(box);
    var gate = document.createElement('div');
    gate.className = 'bomaye-consent-gate vfacade__gate';
    gate.setAttribute('role', 'note');

    var h = document.createElement('p');
    h.className = 'bomaye-consent-gate__title';
    h.textContent = 'Video benötigt deine Einwilligung';

    var p = document.createElement('p');
    p.className = 'bomaye-consent-gate__text';
    p.textContent = 'Das Video liegt bei YouTube. Beim Abspielen setzt YouTube '
      + 'Cookies und verarbeitet Daten in den USA. Wir laden es erst, wenn du '
      + 'dem zugestimmt hast.';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bomaye-consent-gate__btn';
    btn.textContent = 'MARKETING-COOKIES ERLAUBEN UND VIDEO LADEN';
    btn.addEventListener('click', function () {
      if (window.Cookiebot && typeof window.Cookiebot.renew === 'function') {
        window.Cookiebot.renew();
      }
    });

    var alt = document.createElement('p');
    alt.className = 'bomaye-consent-gate__alt';
    alt.innerHTML = 'Lieber ohne Cookies? '
      + '<a href="https://www.google.com/maps/dir/?api=1&destination=Wilhelm-Hale-Stra%C3%9Fe+44%2C+80639+M%C3%BCnchen" '
      + 'target="_blank" rel="noopener">Route in Google Maps öffnen</a> '
      + 'oder anrufen: <a href="tel:+491737513627">+49 173 7513627</a>.';

    gate.appendChild(h); gate.appendChild(p); gate.appendChild(btn); gate.appendChild(alt);
    host.appendChild(gate);

    /* Wird die Einwilligung im selben Seitenaufruf erteilt, laeuft das
       Video nach, ohne dass jemand ein zweites Mal klicken muss. */
    if (typeof window.bomayeWhenMarketingConsent === 'function') {
      window.bomayeWhenMarketingConsent(function () { mountYouTube(box); });
    }
  }

  /* ── Eigene Datei ─────────────────────────────────────────────────── */

  function mountSelfHosted(box) {
    var src = box.getAttribute('data-video-mp4');
    if (!src) return;
    hideFacade(box);
    var host = stage(box);
    var v = document.createElement('video');
    v.src = src;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.preload = 'metadata';
    var poster = box.getAttribute('data-video-poster');
    if (poster) v.poster = poster;
    /* Fehlt die Datei noch, faellt die Fassade zurueck statt schwarz zu
       bleiben — damit ist der Umstieg gefahrlos vorbereitet. */
    v.addEventListener('error', function () {
      clearPlayer(box);
      showFacade(box);
      var msg = box.querySelector('.vfacade__error');
      if (msg) msg.hidden = false;
    }, { once: true });
    host.appendChild(v);
  }

  /* ── Einstieg ─────────────────────────────────────────────────────── */

  function play(box) {
    var source = (box.getAttribute('data-video-source') || 'youtube').toLowerCase();
    if (source === 'selfhosted') { mountSelfHosted(box); return; }
    if (marketingConsented()) { mountYouTube(box); return; }
    renderConsentNotice(box);
  }

  function wire() {
    var boxes = document.querySelectorAll(SEL);
    for (var i = 0; i < boxes.length; i++) {
      (function (box) {
        if (box.getAttribute('data-vfacade-wired') === '1') return;
        box.setAttribute('data-vfacade-wired', '1');
        var btn = box.querySelector('.vfacade__play');
        if (btn) btn.addEventListener('click', function () { play(box); });
      })(boxes[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();

/* ══════════════════════════════════════════════════════════════════════════
   STICKY BUCHUNGSLEISTE, NUR AM HANDY
   ══════════════════════════════════════════════════════════════════════════

   Eine ruhige Leiste am unteren Rand mit genau einem Weg: Probetraining.
   Kein Zaehler, kein Dringlichkeitstext, kein Glanz.

   WANN SIE ERSCHEINT
   Erst wenn das Element mit data-sticky-ab nach oben aus dem Bild gelaufen
   ist. Jede Seite sagt im Markup selbst, welches das ist: dort, wo es einen
   Preisblock gibt (Startseite, /preise), ist es der Preisblock; sonst der
   erste Schirm. Ein Satz je Seite, nachlesbar, kein Rateselektor.

   WANN SIE VERSCHWINDET
     - das Element mit data-sticky-aus ist im Bild. Das ist die eigene
       Abschluss-Sektion der Seite: die Leiste soll keinen Knopf doppeln,
       der ohnehin schon dasteht.
     - ein Dialog ist offen: Cookiebot, das Buchungs-Overlay, das
       Buchungs-Modal oder irgendein aria-modal.
     - der Besucher tippt in ein Feld, die Bildschirmtastatur ist also oben.
     - ein Bsport-Bereich ist im Bild.
     - der Besucher hat sie zugemacht. Dann bleibt sie es fuer die Sitzung.

   WIE GEMESSEN WIRD
   Ausschliesslich ueber IntersectionObserver. Kein scroll-Horcher, nichts,
   was bei jedem Pixel laeuft. Dazu ein MutationObserver, damit ein Dialog,
   der mitten im Bild aufgeht, sofort bemerkt wird.

   WAS BEIM KLICK PASSIERT
   Nichts ausser der Navigation. Der Knopf traegt kein data-ga-event, keine
   Vertragskennung und kein Messattribut. pixel-events.js feuert nicht:
   das Ziel /probetraining steht in keinem seiner BSPORT_PATTERNS, und
   "PROBETRAINING SICHERN" enthaelt keines der vier CHECKOUT_KEYWORDS
   ("mitglied werden", "jetzt starten", "buy", "join"). plan-tracking.js
   braucht data-abo-contract oder data-item-category, beides fehlt hier.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SCHLUESSEL = 'bomaye:sticky-zu';
  var HANDY = '(max-width: 768px)';

  /* Der Speicher kann werfen: privates Fenster, blockierte Seitendaten.
     Dann traegt nur die Variable, und die Seite laeuft weiter. */
  var zugemacht = false;
  try {
    zugemacht = window.sessionStorage.getItem(SCHLUESSEL) === '1';
  } catch (e) { /* ohne Speicher gilt: nicht zugemacht */ }

  var ab = document.querySelector('[data-sticky-ab]');
  var aus = document.querySelector('[data-sticky-aus]');
  if (!ab) return;                       /* Seite will keine Leiste */

  var leiste = null, knopf = null;
  var vorbei = false;                    /* data-sticky-ab ist durchgelaufen */
  var imAbschluss = false;               /* data-sticky-aus ist im Bild */
  var bsportSichtbar = false;
  var tastatur = false;

  /* ── Bauen ──────────────────────────────────────────────────────────── */
  function bauen() {
    if (leiste) return;
    leiste = document.createElement('div');
    leiste.className = 'sticky-buchung';
    leiste.id = 'sticky-buchung';

    knopf = document.createElement('a');
    knopf.className = 'btn btn--gold btn--sm sticky-buchung__knopf';
    knopf.href = '/probetraining';
    knopf.textContent = 'PROBETRAINING SICHERN';

    /* DAS KREUZ IST EIN SVG, KEIN SCHRIFTZEICHEN
       Vorher stand hier textContent = '×'. Auf echten Telefonen kam das
       Zeichen in verschiedenen Farben und Formen heraus: Chrome iOS faerbt
       Knopftext blau, andere Browser nehmen ihre eigene Knopffarbe, und
       welche Schrift das Zeichen zeichnet, entscheidet der Rueckfall der
       Schriftfamilie. Zwei Striche mit stroke="currentColor" sehen ueberall
       gleich aus; die Farbe steht in style.css.
       aria-label bleibt unveraendert, das SVG ist aria-hidden. */
    var zu = document.createElement('button');
    zu.type = 'button';
    zu.className = 'sticky-buchung__zu';
    zu.setAttribute('aria-label', 'Leiste ausblenden');
    zu.innerHTML = '<svg viewBox="0 0 14 14" width="14" height="14" '
                 + 'aria-hidden="true" focusable="false">'
                 + '<line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" '
                 + 'stroke-width="2" stroke-linecap="round" fill="none"></line>'
                 + '<line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" '
                 + 'stroke-width="2" stroke-linecap="round" fill="none"></line>'
                 + '</svg>';
    zu.addEventListener('click', function () {
      zugemacht = true;
      try { window.sessionStorage.setItem(SCHLUESSEL, '1'); } catch (e) {}
      pruefen();
    });

    leiste.appendChild(knopf);
    leiste.appendChild(zu);
    document.body.appendChild(leiste);
    document.body.classList.add('hat-sticky-buchung');
  }

  /* ── Stoerer: alles, was die Leiste schweigen laesst ─────────────────── */
  var DIALOGE = '#CybotCookiebotDialog, .bsport-modal-overlay.is-open, '
              + '#booking-modal.open, [role="dialog"][aria-modal="true"], '
              + '.bomaye-consent-gate__fail:not([hidden])';

  /* OFFEN HEISST: WIRKLICH IM WEG

     Die erste Fassung war zu lasch und hat die Leiste auf zwoelf von
     dreizehn Seiten dauerhaft stumm gestellt. Der Grund: #booking-modal
     steht im Markup IMMER da, geschlossen mit display:flex, opacity:1 und
     visibility:visible. Es liegt nur ausserhalb des Bildes und hat
     pointer-events:none. Nach Anzeige, Sichtbarkeit und Deckkraft allein
     sah es also offen aus.

     Darum zusaetzlich: es muss Flaeche im Bild haben und Klicks annehmen. */
  function sichtbar(el) {
    if (!el) return false;
    if (el.hidden) return false;
    var cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    if (cs.pointerEvents === 'none') return false;
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    return r.top < (window.innerHeight || 0) && r.bottom > 0;
  }

  function dialogOffen() {
    var n = document.querySelectorAll(DIALOGE);
    for (var i = 0; i < n.length; i++) if (sichtbar(n[i])) return true;
    return false;
  }

  function sollSichtbar() {
    if (zugemacht) return false;
    if (!vorbei) return false;
    if (imAbschluss) return false;
    if (bsportSichtbar) return false;
    if (tastatur) return false;
    if (dialogOffen()) return false;
    return true;
  }

  var geplant = false;
  function pruefen() {
    if (geplant) return;
    geplant = true;
    window.requestAnimationFrame(function () {
      geplant = false;
      if (!window.matchMedia(HANDY).matches) return;
      bauen();
      if (sollSichtbar()) leiste.classList.add('ist-sichtbar');
      else leiste.classList.remove('ist-sichtbar');
    });
  }

  /* ── Beobachter ─────────────────────────────────────────────────────── */
  function beobachten() {
    /* DER OFFENE UNTERE RAND IST DER KERN DIESER STELLE

       Ein IntersectionObserver meldet nur UEBERGAENGE. Wer mit einer
       Sprungmarke oder einem schnellen Wisch an einem Element vorbeispringt,
       erzeugt gar keinen: davor war es nicht im Bild, danach ist es nicht im
       Bild, isIntersecting bleibt durchgehend falsch, und die Leiste waere
       nie erschienen. Genau das ist beim ersten Entwurf passiert und der
       Test hat es gefunden.

       Mit rootMargin unten 100000px reicht der Beobachtungsraum vom oberen
       Bildrand bis weit unter das Dokument. Damit gilt:
         schneidet  = der Anker liegt noch irgendwo unter dem oberen Rand,
                      ist also noch nicht durchgelaufen
         schneidet nicht = er ist oben hinaus, die Leiste darf kommen
       Der Uebergang von wahr nach falsch passiert auch bei einem Sprung,
       weil der Zustand sich wirklich aendert. */
    new IntersectionObserver(function (eintraege) {
      for (var i = 0; i < eintraege.length; i++) vorbei = !eintraege[i].isIntersecting;
      pruefen();
    }, { threshold: 0, rootMargin: '0px 0px 100000px 0px' }).observe(ab);

    if (aus) {
      new IntersectionObserver(function (eintraege) {
        for (var i = 0; i < eintraege.length; i++) imAbschluss = eintraege[i].isIntersecting;
        pruefen();
      }, { threshold: 0 }).observe(aus);
    }

    /* div, nicht script: die Schnipsel heissen bsport-widget-cdn und
       bsport-widget-mount und wuerden sonst mitbeobachtet. */
    var bsport = document.querySelectorAll(
      'div[id^="bsport-widget-"], .bsport-modal-overlay, iframe[data-bsport-hoehe]');
    if (bsport.length) {
      var gesehen = new WeakSet ? new WeakSet() : null;
      var bo = new IntersectionObserver(function (eintraege) {
        for (var i = 0; i < eintraege.length; i++) {
          var e = eintraege[i];
          if (gesehen) { if (e.isIntersecting) gesehen.add(e.target); else gesehen.delete(e.target); }
          else { bsportSichtbar = e.isIntersecting; }
        }
        if (gesehen) {
          bsportSichtbar = false;
          for (var j = 0; j < bsport.length; j++) if (gesehen.has(bsport[j])) bsportSichtbar = true;
        }
        pruefen();
      }, { threshold: 0 });
      for (var k = 0; k < bsport.length; k++) bo.observe(bsport[k]);
    }
  }

  /* Tastatur: ein Feld im Fokus heisst am Handy, dass die Tastatur oben ist. */
  function feld(el) {
    if (!el || !el.tagName) return false;
    var t = el.tagName;
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable;
  }
  document.addEventListener('focusin', function (e) {
    if (feld(e.target)) { tastatur = true; pruefen(); }
  }, { passive: true });
  document.addEventListener('focusout', function (e) {
    if (feld(e.target)) { tastatur = false; pruefen(); }
  }, { passive: true });

  /* Ein Dialog, der mitten im Bild aufgeht, loest keinen Beobachter aus.
     Darum ein Blick auf Aenderungen am Baum, gedrosselt ueber pruefen(). */
  new MutationObserver(pruefen).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'hidden', 'style', 'aria-modal', 'open'],
  });

  /* Am Schreibtisch wird nichts gebaut. Wird das Fenster schmal, kommt die
     Leiste nach; andersherum blendet die Regel in style.css sie aus. */
  var mq = window.matchMedia(HANDY);
  if (mq.addEventListener) mq.addEventListener('change', pruefen);
  else if (mq.addListener) mq.addListener(pruefen);

  beobachten();
  pruefen();
}());

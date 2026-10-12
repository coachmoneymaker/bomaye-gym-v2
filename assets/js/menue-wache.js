/* ═══════════════════════════════════════════════════════════════════════════
   MENUEWACHE: das Burger-Menue ueberlebt das Drehen nicht
   ═══════════════════════════════════════════════════════════════════════════

   DER FEHLER
   Das Burger-Menue sperrt beim Oeffnen den Seiten-Scroll (body position fixed
   plus overflow hidden, die einzige Technik, die auf iOS wirklich haelt).
   Geschlossen wird es ueber denselben Knopf. Der Knopf verschwindet aber ab
   901px (style.css, @media (max-width: 900px) { .burger { display: flex } }),
   und das Menue selbst kennt keine Breitengrenze.

   Wer also auf einem iPad im Hochformat (768px) das Menue oeffnet und dann
   dreht (1024px), steht vor einem Schirm, auf dem das Menue offen ueber der
   Seite liegt, der Schliessknopf fehlt und die Seite gesperrt bleibt. Gemessen
   auf allen Seiten mit Burger: Klasse "open" steht noch am Menue, der Burger
   hat display none, der Body traegt die Sperre, Scrollen tot. Herauszukommen
   ist nur ueber einen Menuepunkt oder Neuladen.

   WAS DIESE DATEI TUT
   Beim Drehen oder Groesseaendern: ist der Burger unsichtbar UND das Menue
   offen, wird das Menue geschlossen und die Sperre geloest.

   WARUM SIE NICHT WEISS, WIE DIE SEITE IHR MENUE NENNT
   Die Seiten heissen ihre Umschaltfunktion unterschiedlich (toggleMobileMenu,
   togglePageMenu, toggleKurseMenu, toggleAboutMenu, toggleCoachesMenu,
   toggleFaqMenu, dazu toggleMenu in main.js). Diese Wache ruft deshalb keine
   davon auf, sondern arbeitet an dem, was auf ALLEN Seiten gleich ist:

     das Menue      hat eine ID auf "mobile-nav"  und die Klasse "open"
     der Burger     hat eine ID auf "burger-btn"

   Die Sperre wird genauso geloest, wie jede Seite es selbst tut, und die
   Scrollhoehe kommt aus body.style.top - dort hat die Seite sie beim Sperren
   abgelegt. Damit braucht es keine Kenntnis ihrer internen Variablen.

   WAS SIE BEWUSST NICHT ANFASST
   Jede andere Sperre. Ein Abo-Overlay oder ein Buchungsfenster sperrt
   ebenfalls den Body, und das soll so bleiben - auch oberhalb von 900px.
   Darum ist die offene Menueklasse die einzige Bedingung zum Eingreifen, nicht
   die Sperre selbst.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function menue() { return document.querySelector('[id$="mobile-nav"]'); }
  function burger() { return document.querySelector('[id$="burger-btn"]'); }

  function burgerSichtbar(el) {
    if (!el) return false;
    var cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  /* Dieselben vier Zeilen, die jede Seite in ihrem unlockBodyScroll stehen
     hat, plus die Rueckkehr an die gemerkte Stelle. */
  function freigeben() {
    var oben = document.body.style.top;
    var y = 0;
    if (oben) {
      var n = parseInt(oben, 10);
      if (!isNaN(n)) y = -n;
    }
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    if (y > 0) window.scrollTo(0, y);
  }

  function wache() {
    var nav = menue();
    if (!nav || !nav.classList.contains('open')) return;
    var b = burger();
    if (burgerSichtbar(b)) return;      /* schliessen kann der Besucher selbst */

    nav.classList.remove('open');
    if (b) {
      b.classList.remove('open');
      b.setAttribute('aria-expanded', 'false');
    }
    freigeben();
  }

  window.addEventListener('resize', wache, { passive: true });
  window.addEventListener('orientationchange', wache, { passive: true });
  /* Einmal beim Laden: falls eine Seite mit offenem Menue neu gezeichnet wird. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wache);
  } else {
    wache();
  }
}());

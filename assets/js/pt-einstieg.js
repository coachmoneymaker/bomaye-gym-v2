/* ═══════════════════════════════════════════════════════════════════════════
   Probetraining: Einstieg auf dem Handy
   ═══════════════════════════════════════════════════════════════════════════

   Zwei Dinge, beide nur auf dieser Seite:

   1. WOCHENENDE
      Samstag und Sonntag gibt es kein Probetraining. Der Kalender oeffnet
      aber auf heute und zeigt dann nichts. Wer am Samstag aus einer Anzeige
      kommt, sieht einen leeren Tag und geht wieder.

      Also: am Wochenende einen Hinweis einblenden und den Kalender auf den
      naechsten Tag mit Probetraining stellen.

      WELCHE TAGE DAS SIND, steht in unserem eigenen Wochenplan
      (stundenplan.html, die Panels .sp-day[data-day]). Dort tragen genau die
      Zeilen einen BUCHEN-Link, die buchbar sind, und ihr ?kurs=-Kuerzel sagt
      welcher Kurs:

        Mo  kids, youth, basics      (dazu advanced, nicht probetrainierbar)
        Di  kickboxing
        Mi  basics, kids, queens, youth
        Do  kickboxing               (dazu advanced)
        Fr  basics, kids, youth
        Sa  keine buchbare Zeile
        So  kein Panel

      Probetraining gilt fuer Basic, Kids, Youth, Queens und Kickboxing - das
      ist genau Montag bis Freitag. Deshalb die Liste unten. Aendert sich der
      Wochenplan, muss sie mitwandern; sie steht an einer Stelle und wird vom
      Hinweistext nicht wiederholt, der nennt nur "ab Montag".

      WIE DER KALENDER UMGESTELLT WIRD: ueber /assets/js/kalender-tag.js, das
      auf /stundenplan seit PR #80 genau das tut. Nicht ueber die
      Konfiguration - der Versuch aus PR #79, den Starttag als
      config.calendar.date mitzugeben, ist im Livetest durchgefallen, das
      Widget ignoriert den Schluessel. Ein offizieller Weg ist nicht
      belegbar: api-docs.dev.bsport.io und cdn.bsport.io sind aus unserer
      Bauumgebung nicht erreichbar.

      Jeder unsichere Ausgang in kalender-tag.js endet in "nichts tun". Dann
      bleibt der Kalender auf heute, und der Hinweis sagt trotzdem, woran man
      ist. Der Hinweistext behauptet deshalb NICHT, der Kalender sei schon
      umgestellt.

   2. KLEBENDER KNOPF
      Unter 768px haengt ein goldener Knopf am unteren Rand, solange der
      Kalender NICHT im Bild ist. Sobald er im Bild ist, verschwindet der
      Knopf - sonst verdeckt er die Terminkarten, und genau das war der
      Grund, aus dem die Reichweitenpruefung eingefuehrt wurde.

      Ohne JavaScript bleibt die Leiste hidden. Ohne IntersectionObserver
      ebenfalls: dann gibt es keinen Knopf statt eines Knopfes, der nie
      weggeht.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WIDGET_ID   = 'bsport-widget-172485';
  var PROBE_TAGE  = [1, 2, 3, 4, 5];          /* Mo bis Fr, 0 = Sonntag */
  var MAX_VORLAUF = 7;                        /* Sicherheitsnetz, in Tagen */

  function istProbetag(d) { return PROBE_TAGE.indexOf(d.getDay()) !== -1; }

  /* Mittags rechnen: um Mitternacht landet +1 Tag an Zeitumstellungstagen
     auf 23:00 des Vortags. Gleiche Begruendung wie in kurs-datum.js. */
  function mittags(d) {
    var k = new Date(d.getTime());
    k.setHours(12, 0, 0, 0);
    return k;
  }

  /* Der naechste Tag mit Probetraining, heute eingeschlossen. Ist heute
     schon einer, kommt heute zurueck - dann wird nichts umgestellt. */
  function naechsterProbetag(heute) {
    var d = mittags(heute || new Date());
    for (var i = 0; i <= MAX_VORLAUF; i++) {
      if (istProbetag(d)) return d;
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  function debugAn() {
    try {
      var v = new URLSearchParams(window.location.search).get('bsdebug');
      return !!v && v !== '0' && v !== 'false';
    } catch (e) { return false; }
  }

  /* ── 1. Wochenende ───────────────────────────────────────────────────── */
  function wochenende() {
    var heute = new Date();
    var ziel  = naechsterProbetag(heute);
    if (!ziel) return;
    if (ziel.getDay() === heute.getDay() && istProbetag(heute)) return;   /* heute passt */

    var hinweis = document.getElementById('pt-wochenend-hinweis');
    if (hinweis) hinweis.hidden = false;

    if (!window.bomayeKalenderTag || typeof window.bomayeKalenderTag.starte !== 'function') return;

    /* Erst anstossen, wenn das Widget wirklich etwas gebaut hat. kalender-tag
       haelt einen leeren Container selbst aus, aber seine Frist laeuft ab dem
       Aufruf - und das Widget laedt erst nach der Einwilligung. */
    var wurzel = document.getElementById(WIDGET_ID);
    if (!wurzel) return;

    var gestartet = false;
    function los() {
      if (gestartet) return;
      gestartet = true;
      try { window.bomayeKalenderTag.starte(WIDGET_ID, ziel, debugAn()); } catch (e) {}
    }

    if (wurzel.children.length) { los(); return; }
    if (typeof MutationObserver !== 'function') return;
    var wache = new MutationObserver(function () {
      if (!wurzel.children.length) return;
      wache.disconnect();
      los();
    });
    wache.observe(wurzel, { childList: true });
  }

  /* ── 2. Klebender Knopf ──────────────────────────────────────────────── */
  function klebeKnopf() {
    var leiste = document.getElementById('pt-sticky');
    var kalender = document.getElementById('pt-booking');
    if (!leiste || !kalender) return;
    if (typeof IntersectionObserver !== 'function') return;

    leiste.hidden = false;
    var sichtbar = false;
    function setzen(an) {
      if (an === sichtbar) return;
      sichtbar = an;
      leiste.classList.toggle('pt-sticky--an', an);
    }

    /* Der Kalender ist im Bild -> Leiste weg. Sonst: erst zeigen, wenn der
       Besucher ein Stueck gescrollt hat; im ersten Schirm steht der goldene
       Knopf schon im Bild, zwei gleiche Knoepfe uebereinander sind Unsinn. */
    var kalenderImBild = false;
    new IntersectionObserver(function (eintraege) {
      kalenderImBild = eintraege[eintraege.length - 1].isIntersecting;
      pruefen();
    }, { rootMargin: '0px 0px -10% 0px' }).observe(kalender);

    var marke = document.getElementById('pt-hero-cta');
    var heldImBild = true;
    if (marke) {
      new IntersectionObserver(function (eintraege) {
        heldImBild = eintraege[eintraege.length - 1].isIntersecting;
        pruefen();
      }).observe(marke);
    }

    function pruefen() { setzen(!kalenderImBild && !heldImBild); }
    pruefen();
  }

  function start() {
    try { wochenende(); } catch (e) {}
    try { klebeKnopf(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}());

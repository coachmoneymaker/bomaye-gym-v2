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

  /* ── 3. Leerer Tag trotz allem ────────────────────────────────────────
     Der Livetest vom 25.10. zeigt zwei Faelle, die der Wochenend-Weg oben
     nicht abdeckt:

       - Das Widget oeffnet auf heute, und heute ist leer, weil die Kurse
         des Tages schon gelaufen sind.
       - Ein Wochensprung landet wieder auf einem leeren Tag, weil das
         Widget seinen gewaehlten Wochentag ueber den Sprung mitnimmt.

     Deshalb diese Wache: bleibt die Terminliste leer, obwohl der
     Datumswaehler steht, wird EINMAL auf den naechsten Tag mit
     Probetraining gestellt. Danach hoechstens noch ein zweites Mal, und
     nur innerhalb der ersten halben Minute nach dem Mounten - wer danach
     selbst blaettert, soll in Ruhe gelassen werden.

     Gegriffen wird nur in einen Zustand, in dem nichts zu verlieren ist:
     eine leere Liste. Ist ein Bsport-Dialog offen, passiert gar nichts.

     Die beiden Klassenmuster sind belegt: .bs-offer-list-item steht seit
     PR #46 in unserem CSS, der Datumswaehler
     (.bs-marketplace-date-picker__placeholder) stammt aus der Livediagnose
     in kalender-tag.js. */
  var MAX_KORREKTUREN = 2;
  var WACHE_FENSTER_MS = 30000;

  function leereListeWache() {
    var wurzel = document.getElementById(WIDGET_ID);
    if (!wurzel || typeof MutationObserver !== 'function') return;
    if (!window.bomayeKalenderTag || typeof window.bomayeKalenderTag.starte !== 'function') return;

    var korrekturen = 0;
    var beginn = 0;
    var ruhe = null;

    function listeLeer() {
      var waehler = wurzel.querySelector('[class*="date-picker"], [class*="datePicker"]');
      if (!waehler) return false;                       /* noch nicht fertig */
      return wurzel.querySelectorAll('[class*="offer-list-item"]').length === 0;
    }

    function pruefen() {
      if (korrekturen >= MAX_KORREKTUREN) return;
      if (beginn && Date.now() - beginn > WACHE_FENSTER_MS) return;
      if (document.body.classList.contains('bsport-modal-open')) return;
      if (!listeLeer()) return;

      /* Ist heute selbst ein Probetag, ist er offenbar durch - dann zaehlt
         erst der naechste Tag. */
      var ab = mittags(new Date());
      if (istProbetag(ab)) ab.setDate(ab.getDate() + 1);
      var ziel = naechsterProbetag(ab);
      if (!ziel) return;

      korrekturen++;
      try { window.bomayeKalenderTag.starte(WIDGET_ID, ziel, debugAn()); } catch (e) {}
    }

    new MutationObserver(function () {
      if (!beginn && wurzel.children.length) beginn = Date.now();
      clearTimeout(ruhe);
      ruhe = setTimeout(pruefen, 600);
    }).observe(wurzel, { childList: true, subtree: true });
  }

  /* ── 4. Filterleiste und Teilnehmerzaehler ausblenden ─────────────────
     WAS OFFIZIELL MOEGLICH WAERE, WEISS NIEMAND HIER
     api-docs.dev.bsport.io, cdn.bsport.io und das Hilfecenter sind aus der
     Bauumgebung nicht erreichbar (alle HTTP 000). Ob die Konfiguration
     Schalter fuer Filter oder Zaehler kennt, ist damit nicht feststellbar.
     Belegt ist nur das Gegenteil fuer einen anderen Schluessel:
     config.calendar.date wird ignoriert (PR #79, Livetest).

     DESHALB DIESER WEG, und zwar so vorsichtig wie moeglich:

     Filterleiste: gesucht werden die Beschriftungen aus dem Livetest vom
     25.10. - Suche, Aktivitaet, Niveau, Lehrkraft, Einrichtung. Versteckt
     wird der kleinste gemeinsame Kasten, der MINDESTENS ZWEI davon
     enthaelt und weder den Datumswaehler noch eine Terminkarte. Damit
     kann die Regel nicht den halben Kalender mitnehmen, wenn Bsport
     umbaut. Findet sie nichts, passiert nichts.

     Zaehler: Elemente, deren ganzer Text wie "0/20" aussieht. Nur
     exakt dieses Muster, nichts in der Naehe, und nur wenn kein Knopf
     darin steckt.

     Die Geschlechterzaehler aus dem Bericht sind NICHT abgedeckt: wie sie
     im Markup aussehen, ist von hier nicht zu sehen. Dafuer braucht es
     einmal den Bericht aus /probetraining?ptdom=1 von einem echten Geraet.

     Abschalten zum Nachsehen: /probetraining?ptfilter=0 */
  var FILTER_WOERTER = ['suche', 'aktivität', 'aktivitaet', 'niveau', 'lehrkraft', 'einrichtung'];
  var ZAEHLER = /^\d{1,3}\s*\/\s*\d{1,3}$/;

  function ausblendenAn() {
    try {
      return new URLSearchParams(window.location.search).get('ptfilter') !== '0';
    } catch (e) { return true; }
  }

  function istGeschuetzt(el) {
    return !!(el.querySelector('[class*="date-picker"], [class*="datePicker"], [class*="offer-list-item"]'));
  }

  function filterleisteVerstecken(wurzel) {
    var treffer = [];
    var alle = wurzel.querySelectorAll('label, span, p, div, input, button');
    for (var i = 0; i < alle.length && i < 600; i++) {
      var el = alle[i];
      var txt = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      var platz = (el.getAttribute && el.getAttribute('placeholder') || '').toLowerCase();
      var wort = txt.length <= 16 ? txt : '';
      if (FILTER_WOERTER.indexOf(wort) === -1 && FILTER_WOERTER.indexOf(platz) === -1) continue;
      treffer.push(el);
    }
    if (treffer.length < 2) return false;

    /* Kleinster Kasten, der mindestens zwei der Beschriftungen traegt. */
    var kandidat = treffer[0];
    while (kandidat && kandidat !== wurzel) {
      var drin = 0;
      for (var j = 0; j < treffer.length; j++) if (kandidat.contains(treffer[j])) drin++;
      if (drin >= 2) break;
      kandidat = kandidat.parentElement;
    }
    if (!kandidat || kandidat === wurzel) return false;
    if (istGeschuetzt(kandidat)) return false;
    if (kandidat.classList.contains('pt-aus')) return true;
    kandidat.classList.add('pt-aus');
    return true;
  }

  function zaehlerVerstecken(wurzel) {
    var alle = wurzel.querySelectorAll('span, div, p, small, b, strong');
    for (var i = 0; i < alle.length && i < 800; i++) {
      var el = alle[i];
      if (el.classList.contains('pt-aus')) continue;
      var txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!ZAEHLER.test(txt)) continue;
      if (el.querySelector('button, a, input')) continue;
      el.classList.add('pt-aus');
    }
  }

  function aufraeumen() {
    if (!ausblendenAn()) return;
    var wurzel = document.getElementById(WIDGET_ID);
    if (!wurzel || typeof MutationObserver !== 'function') return;
    var ruhe = null;
    function lauf() {
      try { filterleisteVerstecken(wurzel); } catch (e) {}
      try { zaehlerVerstecken(wurzel); } catch (e) {}
    }
    new MutationObserver(function () {
      clearTimeout(ruhe);
      ruhe = setTimeout(lauf, 250);
    }).observe(wurzel, { childList: true, subtree: true });
    lauf();
  }

  function start() {
    try { aufraeumen(); } catch (e) {}
    try { wochenende(); } catch (e) {}
    try { leereListeWache(); } catch (e) {}
    try { klebeKnopf(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}());

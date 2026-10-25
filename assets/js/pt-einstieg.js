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
  var MAX_VORLAUF = 14;                       /* Sicherheitsnetz, in Tagen */

  /* ── An welchen Tagen welcher Kurs stattfindet ─────────────────────────
     DER FEHLER AUS DEM LIVETEST VOM 26.10.: der Rueckfall nahm den
     naechsten allgemeinen Probetag. Mit ?kurs=queens landete er damit auf
     Dienstag, und Queens gibt es nur mittwochs. Der Kalender blieb leer.

     Diese Tabelle steht in unserem eigenen Wochenplan (stundenplan.html,
     die Panels .sp-day[data-day] und die ?kurs=-Kuerzel an den
     BUCHEN-Links):

       Mo  kids, youth, basics        Di  kickboxing
       Mi  basics, kids, queens, youth   Do  kickboxing
       Fr  basics, kids, youth        Sa, So  nichts

     Aendert sich der Plan, muss sie mitwandern. Sie ist die einzige
     Stelle, an der das steht.

     Bsports eigener Datumsstreifen markiert Tage mit Terminen angeblich
     mit einem Punkt. Das waere die Quelle aus erster Hand, aber wie
     dieser Punkt im Markup aussieht, ist von hier nicht einsehbar
     (cdn.bsport.io gesperrt). Darauf zu raten hiesse, denselben Fehler
     noch einmal zu machen; die Tabelle ist pruefbar, der Punkt nicht. */
  var KURS_TAGE = {
    kickboxing: [2, 4],
    kids:       [1, 3, 5],
    basics:     [1, 3, 5],
    basic:      [1, 3, 5],
    queens:     [3],
    youth:      [1, 3, 5]
  };

  /* Welcher Kurs ist gerade gefiltert? Dieselben Kuerzel wie in
     probetraining-page.js und auf /stundenplan. */
  function aktiverKurs() {
    try {
      var roh = new URLSearchParams(window.location.search).get('kurs');
      if (!roh) return null;
      roh = String(roh).toLowerCase();
      return Object.prototype.hasOwnProperty.call(KURS_TAGE, roh) ? roh : null;
    } catch (e) { return null; }
  }

  /* Tage, an denen es etwas zu buchen gibt: fuer den gefilterten Kurs nur
     dessen Tage, sonst alle Probetage. */
  function tageFuerFilter() {
    var kurs = aktiverKurs();
    return kurs ? KURS_TAGE[kurs] : PROBE_TAGE;
  }

  function istProbetag(d, tage) {
    return (tage || tageFuerFilter()).indexOf(d.getDay()) !== -1;
  }

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
    var tage = tageFuerFilter();
    var d = mittags(heute || new Date());
    for (var i = 0; i <= MAX_VORLAUF; i++) {
      if (istProbetag(d, tage)) return d;
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
    if (istProbetag(heute)) return;   /* heute hat den gesuchten Kurs */

    /* Der Hinweis gilt dem Wochenende. Wer mit ?kurs=queens an einem
       Montag kommt, bekommt keinen falschen Satz ueber das Wochenende zu
       lesen - der Kalender springt trotzdem auf den richtigen Tag. */
    var amWochenende = heute.getDay() === 0 || heute.getDay() === 6;
    var hinweis = document.getElementById('pt-wochenend-hinweis');
    if (hinweis && amWochenende) hinweis.hidden = false;

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
  var MAX_KORREKTUREN = 8;
  var ABKUEHLUNG_MS = 2500;
  var NACHFASSEN_MS = 3500;

  function leereListeWache() {
    var wurzel = document.getElementById(WIDGET_ID);
    if (!wurzel || typeof MutationObserver !== 'function') return;
    if (!window.bomayeKalenderTag || typeof window.bomayeKalenderTag.starte !== 'function') return;

    var korrekturen = 0;
    var ruhe = null;
    var nachfassen = null;
    var zuletzt = null;        /* zuletzt gesetzter Zieltag, als JJJJ-MM-TT */
    var zuletztMs = 0;
    var versucheProZiel = 0;

    function listeLeer() {
      var waehler = wurzel.querySelector('[class*="date-picker"], [class*="datePicker"]');
      if (!waehler) return false;                       /* noch nicht fertig */
      return wurzel.querySelectorAll('[class*="offer-list-item"]').length === 0;
    }

    function iso(d) {
      function z(n) { return (n < 10 ? '0' : '') + n; }
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
    }

    function pruefen() {
      if (korrekturen >= MAX_KORREKTUREN) return;
      if (Date.now() - zuletztMs < ABKUEHLUNG_MS) return;
      if (document.body.classList.contains('bsport-modal-open')) return;
      if (!listeLeer()) return;

      /* Ab wann gesucht wird:
           - noch nichts versucht: ab morgen, wenn heute selbst ein
             Probetag ist (dann sind seine Kurse offenbar durch), sonst ab
             heute;
           - schon versucht und immer noch leer: ab dem Tag NACH dem
             zuletzt gesetzten Ziel. So wandert die Suche vorwaerts, statt
             denselben leeren Tag erneut anzusteuern. Genau das deckt den
             Fall ab, dass in der angezeigten Woche nichts mehr kommt.

         Zweimal dasselbe Ziel ist die Grenze: greift es dann immer noch
         nicht, liegt es nicht am Tag, und weitere Klicks helfen nicht. */
      var ziel;
      if (!zuletzt) {
        var ab = mittags(new Date());
        if (istProbetag(ab)) ab.setDate(ab.getDate() + 1);
        ziel = naechsterProbetag(ab);
      } else if (versucheProZiel < 2) {
        ziel = mittags(new Date(zuletzt + 'T12:00:00'));      /* noch einmal */
      } else {
        var weiter = mittags(new Date(zuletzt + 'T12:00:00'));
        weiter.setDate(weiter.getDate() + 1);
        ziel = naechsterProbetag(weiter);
      }
      if (!ziel) return;

      var zielIso = iso(ziel);
      versucheProZiel = (zielIso === zuletzt) ? versucheProZiel + 1 : 1;
      zuletzt = zielIso;
      zuletztMs = Date.now();
      korrekturen++;
      try { window.bomayeKalenderTag.starte(WIDGET_ID, ziel, debugAn()); } catch (e) {}

      /* NACHFASSEN, und zwar mit der Uhr statt mit dem Beobachter.

         Der Livetest vom 26.10. zeigt den Fall: der Kalender stand ueber
         50 Sekunden auf einem leeren Tag und ruehrte sich nicht mehr.
         Bleibt der Versuch wirkungslos, aendert sich auch nichts im Baum,
         der MutationObserver schweigt, und es gab keinen zweiten Anlauf.
         Jetzt kommt der naechste Blick von selbst. */
      clearTimeout(nachfassen);
      nachfassen = setTimeout(pruefen, NACHFASSEN_MS);
    }

    /* Laeuft weiter, solange die Seite offen ist: ein Wochensprung ist
       eine Aenderung im Baum wie jede andere, und genau danach steht der
       Kalender wieder auf einem Tag, den das Widget sich selbst gemerkt
       hat. Die Abkuehlung und der Deckel oben halten das in Grenzen. */
    new MutationObserver(function () {
      clearTimeout(ruhe);
      ruhe = setTimeout(pruefen, 600);
    }).observe(wurzel, { childList: true, subtree: true });

    /* Und ein erster Blick von der Uhr aus, falls das Widget schon fertig
       war, bevor diese Wache stand. */
    nachfassen = setTimeout(pruefen, NACHFASSEN_MS);
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

     Teilnehmer- und Geschlechterzaehler stehen hier NICHT mehr: der
     Betreiber schaltet sie in den Bsport-Einstellungen ab. Das ist der
     richtige Ort dafuer - eine Einstellung an der Quelle schlaegt jede
     Regel, die im Nachhinein etwas versteckt. Die frueheren Zeilen dazu
     sind ersatzlos raus.

     Abschalten zum Nachsehen: /probetraining?ptfilter=0 */
  var FILTER_WOERTER = ['suche', 'aktivität', 'aktivitaet', 'niveau', 'lehrkraft', 'einrichtung'];

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

  function aufraeumen() {
    if (!ausblendenAn()) return;
    var wurzel = document.getElementById(WIDGET_ID);
    if (!wurzel || typeof MutationObserver !== 'function') return;
    var ruhe = null;
    function lauf() {
      try { filterleisteVerstecken(wurzel); } catch (e) {}
    }
    new MutationObserver(function () {
      clearTimeout(ruhe);
      ruhe = setTimeout(lauf, 250);
    }).observe(wurzel, { childList: true, subtree: true });
    lauf();
  }

  /* ── 5. "Termine werden geladen" ──────────────────────────────────────
     Zwischen dem Tipp auf den Einwilligungsknopf und dem ersten Termin
     liegen im Livetest 15 bis 25 Sekunden. In dieser Zeit stand dort
     nichts. Der Hinweis erscheint, sobald der Platzhalter weg ist, und
     verschwindet, sobald der Kalender etwas zeigt.

     Nach 40 Sekunden geht er auch ohne Kalender weg: ein Hinweis, der
     ewig steht, ist selbst eine Fehlermeldung, nur eine unehrliche. */
  var LADE_DECKEL_MS = 40000;

  function ladeHinweis() {
    var hinweis = document.getElementById('pt-laedt');
    var wurzel = document.getElementById(WIDGET_ID);
    var rahmen = document.getElementById('pt-cal-view');
    if (!hinweis || !wurzel || !rahmen) return;
    if (typeof MutationObserver !== 'function') return;

    var fertig = false;
    function aus() {
      if (fertig) return;
      fertig = true;
      hinweis.hidden = true;
    }
    function pruefen() {
      if (fertig) return;
      var sperreSteht = !!rahmen.querySelector('.bomaye-consent-gate');
      var kalenderDa = wurzel.children.length > 0;
      hinweis.hidden = sperreSteht || kalenderDa;
      if (kalenderDa) aus();
    }

    new MutationObserver(pruefen).observe(rahmen, { childList: true, subtree: true });
    pruefen();
    setTimeout(aus, LADE_DECKEL_MS);
  }

  function start() {
    try { ladeHinweis(); } catch (e) {}
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

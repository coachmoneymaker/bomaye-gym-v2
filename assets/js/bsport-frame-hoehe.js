/**
 * BSPORT-RAHMEN AUF INHALTSHOEHE HALTEN
 * ─────────────────────────────────────
 *
 * DAS PROBLEM, DAS DIESE DATEI LOEST
 * Auf Personal Training steckt das Bsport-Widget in einem <iframe srcdoc>.
 * Der Rahmen hatte eine feste Hoehe, und der Wrapper darum hatte
 * overflow: hidden. iOS Safari ignoriert die Hoehe eines iframes aber
 * grundsaetzlich und macht ihn so hoch wie seinen Inhalt - er scrollt innen
 * nicht. Die Kasse ist hoeher als der reservierte Platz; alles darunter wurde
 * abgeschnitten, und darin lag der Bezahlknopf. Am Schreibtisch fiel das nie
 * auf, weil Desktop-Browser die feste Hoehe respektieren und dem Rahmen eine
 * eigene Scrollleiste geben.
 *
 * ZWEI SCHICHTEN, UNABHAENGIG VONEINANDER
 * 1. CSS. Der Wrapper klammert nicht mehr und hat keine feste Hoehe, der
 *    Rahmen steht im normalen Fluss. Damit waechst auf iOS der Wrapper mit
 *    dem aufgeblasenen Rahmen - ohne eine Zeile JavaScript. Das ist die
 *    tragende Schicht.
 * 2. Diese Datei. Sie zieht die Rahmenhoehe auf die gemessene Inhaltshoehe
 *    nach, damit auch Desktop-Browser die Seite scrollen statt einen
 *    verschachtelten Bereich. Faellt sie aus, bleibt Schicht 1 - der Knopf
 *    ist erreichbar, nur die Kante sitzt weniger sauber.
 *
 * Bewusst so gebaut, weil nicht entschieden werden kann, WELCHER Mechanismus
 * auf dem Gerät greift: ob iOS den Rahmen aufblaest oder die Geste in einem
 * Unterscroller haengt. Beide Schichten wirken in beiden Faellen.
 *
 * WARUM DAS VON AUSSEN MESSBAR IST
 * srcdoc-Rahmen erben die Herkunft des Elterndokuments, und es steht kein
 * sandbox-Attribut daran. contentDocument ist also lesbar. Sollte sich das je
 * aendern, faengt der try/catch es auf und Schicht 1 traegt weiter.
 *
 * KEINE EINWILLIGUNG NOETIG
 * Diese Datei laedt nichts von bsport.io und misst nur unser eigenes Element.
 * Sie laeuft deshalb ungated - und wartet von sich aus, bis die
 * Einwilligungs-Bruecke das srcdoc scharf geschaltet hat (dann feuert load).
 *
 * ANMELDUNG
 * Ein iframe nimmt teil, sobald es data-bsport-hoehe traegt. Bewusst ein
 * eigenes Attribut und nicht data-bsport-srcdoc: letzteres entfernt die
 * Bruecke beim Freischalten, der Rahmen waere danach nicht mehr findbar.
 */
(function () {
  'use strict';

  var MARKE      = 'iframe[data-bsport-hoehe]';
  /* Unter diesem Wert gilt eine Messung als "noch nicht fertig" - ein leeres
     about:blank meldet ein paar Pixel, und darauf darf der Rahmen nicht
     zusammenfallen. */
  var MIN_ERNST  = 200;
  /* Hysterese. Die gesetzte Hoehe aendert die Hoehe des inneren Fensters, was
     den Inhalt neu umbrechen kann. Ohne Schwelle koennen sich beide
     gegenseitig um ein Pixel hin und her schieben. */
  var SCHWELLE   = 3;
  var TAKT_MS    = 750;

  function hoeheMessen(rahmen) {
    try {
      var d = rahmen.contentDocument;
      if (!d || !d.documentElement) return 0;
      var b = d.body;
      return Math.max(
        d.documentElement.scrollHeight || 0,
        d.documentElement.offsetHeight || 0,
        b ? (b.scrollHeight || 0) : 0,
        b ? (b.offsetHeight || 0) : 0
      );
    } catch (e) {
      /* Fremde Herkunft oder noch nicht ladbar - Schicht 1 traegt. */
      return 0;
    }
  }

  /**
   * NUR WACHSEN, NIE SCHRUMPFEN - und das ist Absicht.
   *
   * documentElement.scrollHeight ist nie kleiner als das innere Fenster. Die
   * Messung kann die aktuelle Rahmenhoehe also gar nicht unterschreiten;
   * schrumpfen liesse sich nur, indem man den Rahmen vorher auf 0 setzt und
   * dann misst. Dieser Griff ist verbreitet, aber er bricht jedes Widget, das
   * mit vh-Einheiten rechnet - bei Hoehe 0 fallen diese Teile mit zusammen.
   * In einer Bezahlstrecke ist das kein Risiko, das sich fuer etwas rein
   * Kosmetisches lohnt.
   *
   * Die Folge: geht jemand von der Kasse einen Schritt zurueck, bleibt die
   * grosse Hoehe stehen und darunter ist Leerraum. Genau so verhaelt sich die
   * Seite heute auch (fester Rahmen), also keine Verschlechterung - und die
   * Richtung, auf die es ankommt, ist ohnehin die andere.
   */
  function anpassen(rahmen) {
    var gemessen = hoeheMessen(rahmen);
    if (gemessen < MIN_ERNST) return;
    var jetzt = parseFloat(rahmen.style.height) || rahmen.getBoundingClientRect().height || 0;
    if (gemessen <= jetzt + SCHWELLE) return;
    rahmen.style.height = gemessen + 'px';
  }

  function beobachten(rahmen) {
    /* ResizeObserver IM inneren Dokument: Bsport baut bei jedem Schritt neu
       auf - Coach, Slot, Adresse, Kasse sind vier verschiedene Hoehen. Ohne
       das wuerde nur der erste Schritt passen. */
    try {
      var w = rahmen.contentWindow;
      if (!w || typeof w.ResizeObserver !== 'function') return;
      if (rahmen.__bomayeRO) rahmen.__bomayeRO.disconnect();
      var ro = new w.ResizeObserver(function () { anpassen(rahmen); });
      ro.observe(rahmen.contentDocument.documentElement);
      if (rahmen.contentDocument.body) ro.observe(rahmen.contentDocument.body);
      rahmen.__bomayeRO = ro;
    } catch (e) { /* Takt unten faengt es auf. */ }
  }


  /* ══════════════ DEN GEOEFFNETEN DIALOG INS BILD HOLEN ═══════════════
     Bsport oeffnet seinen Buchungsdialog am oberen Rand des RAHMENS, nicht
     am oberen Rand des Fensters. Der Rahmen ist hoeher als das Fenster und
     gescrollt wird die SEITE - wer in der Terminliste weiter unten tippt,
     steht damit zwangslaeufig unterhalb der Rahmenoberkante und sieht nur
     den Ladekringel.

     AM GERAET GEMESSEN (Chrome, Fenster 1400x726, ?ptdom=1):
       <div class="widget-3 bsport-user-interaction-modal__container"
            role="presentation">  position:fixed  z-index:1300
            1152x1321 bei top=0 left=0 IM RAHMEN
       Rahmen damals bei top=-421, scrollY 2524
       -> der Dialog stand 421px ueber der sichtbaren Kante.

     Diese Werte stehen hier, weil sie die Erkennung tragen. Geraten wird
     nichts: weder Klassennamen allein (MUI vergibt Zahlensuffixe) noch
     Zahlen ohne Messung - beides ist auf Probetraining gescheitert.

     WAS HIER BEWUSST NICHT PASSIERT
     Keine Aenderung an overflow, Hoehe oder CSS. Die Lehre aus PR #104
     steht oben in dieser Datei: jedes overflow am Wrapper holt die
     Scroll-Falle zurueck. Hier wird ausschliesslich die SEITE gescrollt. */

  var DLG_WAHL  = '.bsport-user-interaction-modal__container';
  var DLG_FRIST = 1500;   /* so lange wird auf den inneren Kasten gewartet */
  var DLG_RAND  = 12;     /* Luft unter der Kopfleiste */

  function kopfHoehe() {
    try {
      var h = document.getElementById('header');
      if (!h) return 0;
      var c = window.getComputedStyle(h);
      if (c.position !== 'fixed' && c.position !== 'sticky') return 0;
      return Math.round(h.getBoundingClientRect().height) || 0;
    } catch (e) { return 0; }
  }

  function sanft() {
    try {
      return !(window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return true; }
  }

  /* Ist der Knoten der Dialogbehaelter? Erst der gemessene Klassenname,
     sonst die Bauart: fest positioniert, hoch gestapelt, als Dialog
     ausgewiesen. Die zweite Regel traegt, falls Bsport umbenennt. */
  function istBehaelter(el, w) {
    if (!el || el.nodeType !== 1) return false;
    try {
      if (el.matches && el.matches(DLG_WAHL)) return true;
      var c = w.getComputedStyle(el);
      if (c.position !== 'fixed') return false;
      var z = parseInt(c.zIndex, 10);
      if (!(z >= 1000)) return false;
      var rolle = el.getAttribute('role');
      return rolle === 'presentation' || rolle === 'dialog'
          || el.getAttribute('aria-modal') === 'true';
    } catch (e) { return false; }
  }

  /* Der sichtbare Kasten im Behaelter. Der Behaelter selbst ist so gross wie
     der Rahmen (gemessen 1152x1321) - auf ihn zu zentrieren hiesse, auf den
     Rahmen zu zentrieren. Gesucht ist das Fenster darin. */
  function dialogKasten(behaelter) {
    try {
      var d = behaelter.querySelector('[role="dialog"], [aria-modal="true"]');
      if (d && d !== behaelter) return d;
      var br = behaelter.getBoundingClientRect();
      var kinder = behaelter.querySelectorAll('*');
      for (var i = 0; i < kinder.length && i < 400; i++) {
        var r = kinder[i].getBoundingClientRect();
        if (r.width < 80 || r.height < 80) continue;
        /* Deutlich kleiner als der Behaelter - das ist das Fenster. */
        if (r.height <= br.height * 0.9 || r.width <= br.width * 0.9) return kinder[i];
      }
    } catch (e) { /* Rueckfall unten */ }
    return null;
  }

  /* Die eigentliche Rechnung. Alles in Koordinaten des AEUSSEREN Fensters:
     der Kasten liegt im Rahmen, der Rahmen liegt im Fenster. */
  function hinscrollen(rahmen, behaelter) {
    var kasten = dialogKasten(behaelter) || behaelter;
    var rb, kb;
    try {
      rb = rahmen.getBoundingClientRect();
      kb = kasten.getBoundingClientRect();
    } catch (e) { return; }
    if (!kb.height) return;

    var kopf    = kopfHoehe();
    var oben    = rb.top + kb.top;              /* Oberkante im Fenster */
    var unten   = oben + kb.height;
    var sicht   = window.innerHeight;

    /* Schon ganz zu sehen? Dann nichts tun - der Besucher soll nicht
       grundlos verschoben werden. */
    if (oben >= kopf + DLG_RAND && unten <= sicht) return;

    var scrollY = window.scrollY || window.pageYOffset || 0;
    var seite   = scrollY + oben;               /* Oberkante im Dokument */

    /* Senkrecht mittig, aber nie so weit, dass die Oberkante unter die
       Kopfleiste rutscht - und nie ueber die Oberkante hinaus. */
    var ziel = seite - (sicht - kb.height) / 2;
    var deckel = seite - kopf - DLG_RAND;
    if (ziel > deckel) ziel = deckel;
    if (ziel < 0) ziel = 0;

    if (Math.abs(ziel - scrollY) < 8) return;   /* lohnt nicht */

    try {
      window.scrollTo({ top: Math.round(ziel), behavior: sanft() ? 'smooth' : 'instant' });
    } catch (e) {
      window.scrollTo(0, Math.round(ziel));     /* aeltere Browser */
    }
  }

  /* Einmal je geoeffnetem Dialog. Der Behaelter bleibt stehen, waehrend
     Bsport seinen Inhalt austauscht (Laden, Anmeldung, Formular) - ohne
     diese Marke wuerde die Seite bei jedem Schritt erneut springen.
     Verschwindet er und kommt spaeter ein neuer, traegt der keine Marke und
     wird wieder angefahren. */
  function dialogPruefen(el, rahmen, w) {
    if (!istBehaelter(el, w)) return;
    if (el.__bomayeDialog) return;
    el.__bomayeDialog = true;

    var versuche = 0;
    (function warten() {
      if (!el.isConnected) return;
      var kasten = dialogKasten(el);
      if (kasten || versuche * 300 >= DLG_FRIST) { hinscrollen(rahmen, el); return; }
      versuche++;
      setTimeout(warten, 300);
    }());
  }

  function dialogWacheSetzen(rahmen) {
    try {
      var w = rahmen.contentWindow;
      var d = rahmen.contentDocument;
      if (!w || !d || !d.body) return;
      if (rahmen.__bomayeDlgDoc === d) return;      /* schon an diesem Dokument */
      rahmen.__bomayeDlgDoc = d;
      if (rahmen.__bomayeDlgMO) rahmen.__bomayeDlgMO.disconnect();
      var mo = new MutationObserver(function (listen) {
        for (var i = 0; i < listen.length; i++) {
          var neu = listen[i].addedNodes;
          for (var j = 0; j < neu.length; j++) dialogPruefen(neu[j], rahmen, w);
        }
      });
      /* Nur direkte Kinder von <body>: dort haengt Bsport den Behaelter ein
         (gemessen). Ohne subtree bleibt es ein billiger Hoerer. */
      mo.observe(d.body, { childList: true });
      rahmen.__bomayeDlgMO = mo;
    } catch (e) { /* fremde Herkunft oder noch nicht geladen */ }
  }

  function anmelden(rahmen) {
    if (rahmen.__bomayeHoehe) return;
    rahmen.__bomayeHoehe = true;
    rahmen.addEventListener('load', function () {
      anpassen(rahmen);
      beobachten(rahmen);
      dialogWacheSetzen(rahmen);
    });
    /* Schon geladen (z. B. bereits erteilte Einwilligung, Rahmen aus dem
       Cache) - das load-Ereignis kommt dann nicht mehr. */
    anpassen(rahmen);
    beobachten(rahmen);
    dialogWacheSetzen(rahmen);
  }

  function alleAnmelden() {
    var liste = document.querySelectorAll(MARKE);
    for (var i = 0; i < liste.length; i++) anmelden(liste[i]);
    return liste;
  }

  function start() {
    var liste = alleAnmelden();
    if (!liste.length) return;

    /* Rueckfall-Takt. Der ResizeObserver deckt den Normalfall ab; dieser Takt
       faengt die Faelle, in denen er nicht greift: das innere Dokument wird
       beim Freischalten komplett ersetzt, Bilder im Widget laden nach, oder
       der Browser kennt ResizeObserver im iframe-Fenster nicht. Ein
       scrollHeight-Lesen je Rahmen, und nur wenn der Tab sichtbar ist. */
    setInterval(function () {
      if (document.hidden) return;
      var l = document.querySelectorAll(MARKE);
      for (var i = 0; i < l.length; i++) {
        anmelden(l[i]); anpassen(l[i]);
        /* Der Rahmen wird beim Freischalten komplett ersetzt - dann haengt
           die Wache am alten Dokument und muss umziehen. */
        dialogWacheSetzen(l[i]);
      }
    }, TAKT_MS);

    /* Breitenwechsel aendert den Umbruch und damit die Hoehe. */
    window.addEventListener('resize', function () {
      var l = document.querySelectorAll(MARKE);
      for (var i = 0; i < l.length; i++) anpassen(l[i]);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

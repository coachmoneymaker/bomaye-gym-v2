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

  function anmelden(rahmen) {
    if (rahmen.__bomayeHoehe) return;
    rahmen.__bomayeHoehe = true;
    rahmen.addEventListener('load', function () {
      anpassen(rahmen);
      beobachten(rahmen);
    });
    /* Schon geladen (z. B. bereits erteilte Einwilligung, Rahmen aus dem
       Cache) - das load-Ereignis kommt dann nicht mehr. */
    anpassen(rahmen);
    beobachten(rahmen);
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
      for (var i = 0; i < l.length; i++) { anmelden(l[i]); anpassen(l[i]); }
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

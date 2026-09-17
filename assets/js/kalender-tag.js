/* ═══════════════════════════════════════════════════════════════════════════
   Kalender auf den Tag des Deep-Links bringen
   ═══════════════════════════════════════════════════════════════════════════

   WARUM DIESER UMWEG
   PR #79 hat versucht, den Starttag ueber config.calendar.date mitzugeben.
   Der Livetest zeigt: das Widget ignoriert den Schluessel. Ein anderer
   Schluessel laesst sich nicht erraten - cdn.bsport.io ist aus unserer
   Bauumgebung nicht erreichbar, @bsport/common enthaelt kein Config-Schema.

   Also der Weg, den auch ein Mensch nimmt: nach dem Mounten im Widget zum
   Zieltag blaettern. Das Widget rendert in unser Dokument (unser CSS greift
   per Nachfahren-Selektor auf .bs-offer-list-item, unser MutationObserver
   beobachtet seinen Teilbaum) - die Bedienelemente sind also erreichbar.

   WAS HIER BEWUSST NICHT STEHT
   Ein fester Selektor fuer "naechster Tag". Den kennen wir nicht, und raten
   waere derselbe Fehler noch einmal - diesmal mit Klicks in ein fremdes
   Buchungssystem. Stattdessen wird das Bedienelement zur Laufzeit gesucht
   und jeder Schritt am angezeigten Datum ueberprueft:

     Schritt 1  Steht der Zieltag schon im DOM? Dann nur hinscrollen,
                kein Klick. Das deckt die Wochenlisten-Darstellung ab
                (bs-week__listMode__content__day).
     Schritt 2  Sonst: aktuelles Datum auslesen. Nicht lesbar -> Abbruch.
     Schritt 3  Sonst: EIN Kandidat wird geklickt und geprueft, ob das
                Datum genau einen Tag weiter steht. Tut es das nicht ->
                sofort Abbruch, kein zweiter Klick.

   Jeder unsichere Ausgang endet also in "nichts tun". Dann bleibt es beim
   heutigen Tag, richtig gefiltert - genau wie ohne dieses Modul. Die
   Hinweiszeile ueber dem Kalender nennt den Tag ohnehin.

   DIAGNOSE
   /stundenplan?kurs=...&datum=...&bsdebug=1 schreibt die Struktur des
   gemounteten Widgets in die Konsole. Damit laesst sich der richtige
   Selektor einmal ablesen, statt ihn zu raten.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MAX_TAGE      = 14;    /* realistischer Buchungshorizont */
  var MAX_MS        = 15000; /* Gesamtdeckel, danach ist Schluss */
  var RUHE_MS       = 400;   /* so lange muss der DOM still sein = fertig */
  var RUHE_MAX_MS   = 4000;  /* falls er nie still wird */

  function iso(d) {
    function z(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }

  function tagesAbstand(a, b) {
    var x = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    var y = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((y - x) / 86400000);
  }

  /* ── Datum aus einem Element lesen ────────────────────────────────────────
     Reihenfolge nach Verlaesslichkeit: erst maschinenlesbar, dann Text. */
  var MONATE = ['januar','februar','maerz','märz','april','mai','juni','juli',
                'august','september','oktober','november','dezember'];

  function monatsNummer(wort) {
    var w = wort.toLowerCase();
    for (var i = 0; i < MONATE.length; i++) {
      if (MONATE[i].indexOf(w) === 0 || w.indexOf(MONATE[i].slice(0, 3)) === 0) {
        return i > 3 ? i - 1 : (i === 3 ? 2 : i);   /* maerz/März doppelt */
      }
    }
    return -1;
  }

  function datumAusText(text, bezug) {
    if (!text) return null;
    var t = String(text).replace(/\s+/g, ' ').trim();
    var m;

    /* 2026-09-18 */
    m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0, 0);

    /* 18.09.2026 oder 18.9.26 */
    m = t.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (m) {
      var j = +m[3]; if (j < 100) j += 2000;
      return new Date(j, +m[2] - 1, +m[1], 12, 0, 0, 0);
    }

    /* 18. September  (Jahr aus dem Bezugsdatum) */
    m = t.match(/(\d{1,2})\.?\s+([A-Za-zÄÖÜäöü]{3,})/);
    if (m) {
      var mn = monatsNummer(m[2]);
      if (mn >= 0) {
        var jahr = bezug ? bezug.getFullYear() : new Date().getFullYear();
        var d = new Date(jahr, mn, +m[1], 12, 0, 0, 0);
        /* Jahreswechsel: liegt das mehr als ein halbes Jahr zurueck,
           ist das naechste Jahr gemeint. */
        if (bezug && tagesAbstand(bezug, d) < -180) d.setFullYear(jahr + 1);
        return d;
      }
    }

    /* 18.09. ohne Jahr */
    m = t.match(/\b(\d{1,2})\.(\d{1,2})\.(?!\d)/);
    if (m) {
      var jahr2 = bezug ? bezug.getFullYear() : new Date().getFullYear();
      var d2 = new Date(jahr2, +m[2] - 1, +m[1], 12, 0, 0, 0);
      if (bezug && tagesAbstand(bezug, d2) < -180) d2.setFullYear(jahr2 + 1);
      return d2;
    }
    return null;
  }

  /* Das aktuell angezeigte Datum. Erst <time datetime>, dann Kopfzeilen-
     verdaechtige Elemente. Widersprechen sich die Funde, gilt keiner. */
  function angezeigtesDatum(wurzel, bezug) {
    var zeiten = wurzel.querySelectorAll('time[datetime]');
    for (var i = 0; i < zeiten.length; i++) {
      var d = datumAusText(zeiten[i].getAttribute('datetime'), bezug);
      if (d) return d;
    }
    var kandidaten = wurzel.querySelectorAll(
      '[class*="date"],[class*="Date"],[class*="day"],[class*="Day"],' +
      '[class*="header"],[class*="Header"],[class*="toolbar"],[class*="Toolbar"]');
    var gefunden = null;
    for (var k = 0; k < kandidaten.length && k < 200; k++) {
      var el = kandidaten[k];
      if (el.children.length > 3) continue;            /* Container, kein Label */
      var d2 = datumAusText(el.textContent, bezug);
      if (!d2) continue;
      if (!gefunden) { gefunden = d2; continue; }
      if (iso(d2) !== iso(gefunden)) return null;      /* widerspruechlich */
    }
    return gefunden;
  }

  /* ── Ist der Zieltag schon sichtbar? (Wochenliste) ─────────────────────── */
  function elementFuerTag(wurzel, ziel) {
    var alle = wurzel.querySelectorAll('time[datetime],[class*="day"],[class*="Day"],[class*="date"],[class*="Date"]');
    for (var i = 0; i < alle.length && i < 300; i++) {
      var el = alle[i];
      var roh = el.getAttribute && el.getAttribute('datetime');
      var d = datumAusText(roh || el.textContent, ziel);
      if (d && iso(d) === iso(ziel) && el.getBoundingClientRect().height > 0) return el;
    }
    return null;
  }

  /* ── Bedienelemente: streng gefiltert ─────────────────────────────────────
     Nichts, was in einer Termin-Karte liegt (dort wuerde ein Klick buchen),
     nichts Breites (Buchungsknoepfe sind breit, Pfeile sind klein). */
  var VOR  = /(next|suivant|weiter|vorwaerts|vorwärts|forward|›|→|»|>)/i;
  var ZURUECK = /(prev|previous|precedent|précédent|zurueck|zurück|back|‹|←|«|<)/i;

  function istInKarte(el) {
    return !!(el.closest && el.closest(
      '.bs-offer-list-item, .bs-card-offer, [class*="offer"], [class*="Offer"], ' +
      '[class*="booking"], [class*="Booking"], [class*="checkout"]'));
  }

  function merkmale(el) {
    return [el.getAttribute('aria-label') || '', el.getAttribute('title') || '',
            el.className && el.className.baseVal !== undefined ? el.className.baseVal : (el.className || ''),
            (el.textContent || '').trim().slice(0, 20)].join(' ');
  }

  function navKandidaten(wurzel, muster) {
    var roh = wurzel.querySelectorAll('button, [role="button"], a:not([href]), [class*="arrow"], [class*="Arrow"]');
    var out = [];
    for (var i = 0; i < roh.length && i < 300; i++) {
      var el = roh[i];
      if (istInKarte(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width > 120) continue;                     /* kein Buchungsknopf */
      if (!muster.test(merkmale(el))) continue;
      out.push(el);
    }
    return out;
  }

  /* ── Warten, bis der DOM zur Ruhe kommt ──────────────────────────────── */
  function wennRuhig(wurzel, fertig) {
    var timer = null, deckel = null, fertigGerufen = false;
    function schluss() {
      if (fertigGerufen) return;
      fertigGerufen = true;
      clearTimeout(timer); clearTimeout(deckel);
      try { mo.disconnect(); } catch (e) {}
      fertig();
    }
    var mo = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(schluss, RUHE_MS);
    });
    try {
      mo.observe(wurzel, { childList: true, subtree: true, characterData: true });
    } catch (e) { return fertig(); }
    timer  = setTimeout(schluss, RUHE_MS);
    deckel = setTimeout(schluss, RUHE_MAX_MS);
  }

  /* ── Diagnose ─────────────────────────────────────────────────────────── */
  function diagnose(wurzel) {
    var zeile = function (el) {
      var r = el.getBoundingClientRect();
      return { tag: el.tagName, klasse: String(el.className).slice(0, 80),
               aria: el.getAttribute('aria-label') || '', titel: el.getAttribute('title') || '',
               text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
               breite: Math.round(r.width), hoehe: Math.round(r.height) };
    };
    var klick = [], i;
    var roh = wurzel.querySelectorAll('button, [role="button"], a');
    for (i = 0; i < roh.length && i < 60; i++) if (!istInKarte(roh[i])) klick.push(zeile(roh[i]));
    var daten = [];
    var dr = wurzel.querySelectorAll('time[datetime],[class*="date"],[class*="Date"],[class*="day"],[class*="Day"]');
    for (i = 0; i < dr.length && i < 40; i++) daten.push(zeile(dr[i]));
    /* eslint-disable no-console */
    console.log('[bomaye] Widget-Diagnose - bitte diese zwei Tabellen kopieren:');
    console.log('[bomaye] Bedienelemente ausserhalb der Termin-Karten:');
    if (console.table) console.table(klick); else console.log(klick);
    console.log('[bomaye] Datumsverdaechtige Elemente:');
    if (console.table) console.table(daten); else console.log(daten);
    console.log('[bomaye] gelesenes Datum:', angezeigtesDatum(wurzel, new Date()));
  }

  /* ── Ablauf ───────────────────────────────────────────────────────────── */
  function starte(wurzelId, ziel, debug) {
    var wurzel = document.getElementById(wurzelId);
    if (!wurzel || !ziel) return;

    var start = Date.now();
    var abstand = tagesAbstand(new Date(), ziel);
    if (abstand === 0 && !debug) return;                  /* heute: nichts zu tun */
    if (abstand < 0 || abstand > MAX_TAGE) return;        /* ausserhalb des Horizonts */

    /* Auf Inhalt warten - ohne Einwilligung kommt nie einer, dann endet es hier. */
    var wartete = 0;
    (function aufInhalt() {
      if (wurzel.children.length === 0) {
        if (Date.now() - start > MAX_MS) return;
        wartete = setTimeout(aufInhalt, 250);
        return;
      }
      wennRuhig(wurzel, function () {
        if (debug) diagnose(wurzel);
        losBlaettern();
      });
    }());

    function losBlaettern() {
      /* Schritt 1: Zieltag schon da? Dann nur hinscrollen. */
      var treffer = elementFuerTag(wurzel, ziel);
      if (treffer) {
        try { treffer.scrollIntoView({ block: 'center' }); } catch (e) {}
        return;
      }

      /* Schritt 2: aktuelles Datum lesen. */
      var jetzt = angezeigtesDatum(wurzel, ziel);
      if (!jetzt) return;                                  /* nicht lesbar -> nichts tun */

      schritt(jetzt, 0);
    }

    function schritt(jetzt, runde) {
      var rest = tagesAbstand(jetzt, ziel);
      if (rest === 0) return;                              /* angekommen */
      if (runde >= MAX_TAGE || Date.now() - start > MAX_MS) return;

      var kandidaten = navKandidaten(wurzel, rest > 0 ? VOR : ZURUECK);
      if (!kandidaten.length) return;                      /* nichts gefunden -> nichts tun */

      var knopf = kandidaten[0];
      try { knopf.click(); } catch (e) { return; }

      wennRuhig(wurzel, function () {
        /* Zuerst: ist der Zieltag jetzt sichtbar? */
        var da = elementFuerTag(wurzel, ziel);
        if (da) { try { da.scrollIntoView({ block: 'center' }); } catch (e) {} return; }

        var neu = angezeigtesDatum(wurzel, ziel);
        if (!neu) return;                                  /* nicht mehr lesbar -> Abbruch */

        var bewegt = tagesAbstand(jetzt, neu);
        var erwartet = rest > 0 ? 1 : -1;
        /* Nur weiterklicken, wenn der Klick nachweislich genau einen Tag
           in die richtige Richtung bewegt hat. Alles andere: Abbruch. */
        if (bewegt !== erwartet) return;

        schritt(neu, runde + 1);
      });
    }
  }

  window.bomayeKalenderTag = { starte: starte };
}());

/**
 * ?ptdom=1 — DEN WOCHENPLAN IM BSPORT-RAHMEN AUSLESEN
 * ──────────────────────────────────────────────────
 *
 * WOZU
 * Die Zeitfenster-Kaesten im Wochenplan beruehren einander. Diese Gestaltung
 * entsteht in Bsports eigenem Dokument im <iframe srcdoc>, und unser CSS
 * kaskadiert dort NICHT hinein - gleiche Herkunft ist nicht dasselbe Dokument.
 * Unser JavaScript kommt hinein (kein sandbox-Attribut), aber ohne die echten
 * Klassennamen und Rasterwerte waere jede Regel geraten. Bsport erzeugt seine
 * Klassen mit MUI, samt wechselnder Zahlensuffixe - auf Probetraining ist
 * genau dieses Raten zweimal gescheitert.
 *
 * Also wird hier nichts geraten, sondern abgelesen und auf den Schirm
 * geschrieben, wo ein Screenshot es einfangen kann.
 *
 * WIE DER WOCHENPLAN GEFUNDEN WIRD
 * NICHT ueber Klassennamen. Gesucht wird nach dem, was Bsport als TEXT
 * rendert: Wochentage und Tageszeiten. Vom ersten Treffer aus geht es nach
 * oben, bis ein Vorfahr mindestens zwei verschiedene Tage enthaelt - das ist
 * das Raster. Diese Suche ueberlebt jede Umbenennung.
 *
 * ZWEITER TEIL: DAS MODAL
 * Der Buchungsdialog oeffnet am oberen Rand des Rahmens, nicht am oberen
 * Rand des Fensters - der Rahmen ist hoeher als das Fenster (900px gegen
 * 800px bei 1280 Breite), und gescrollt wird die SEITE, nicht der Rahmen.
 * Wer in der Terminliste weiter unten tippt, steht damit zwangslaeufig
 * unterhalb der Rahmenoberkante und sieht nur den Ladekringel.
 *
 * Um das zu beheben, muss ein Beobachter den Dialog ERKENNEN. Woran, ist
 * ohne Messung geraten - und Raten ist auf Probetraining zweimal
 * gescheitert. Deshalb schreibt diese Datei mit, was im Rahmen auftaucht:
 * Rolle, ARIA, errechnete Position, Kasten, z-index, Klassen, dazu die Lage
 * des Rahmens und der Scrollstand im selben Augenblick.
 *
 * DRITTER TEIL: DIE BREITE
 * Auf einem echten iPhone 16 (Chrome iOS, Inkognito) ist die Seite nach der
 * Terminwahl BREITER als der Schirm: der Burger in der Kopfleiste ist rechts
 * halb abgeschnitten, die Preisknoepfe im Widget laufen ueber die rechte
 * Kante, und das Uhrensymbol links vom Datum ist links halb weg.
 *
 * Beide Kanten gleichzeitig beschnitten heisst: es wird nicht einfach nach
 * rechts gescrollt, sondern der SICHTBARE Ausschnitt liegt woanders als der
 * gerechnete. Was davon zutrifft, entscheidet sich an vier Zahlen, die kein
 * Screenshot zeigt: visualViewport.offsetLeft, visualViewport.scale,
 * window.scrollX und die scrollWidth der beiden Dokumente. Genau die
 * schreibt BREITE auf, zusammen mit jedem Element, das rechts oder links
 * heraussteht.
 *
 * Gemessen wird in BEIDEN Dokumenten. Das aeussere kann durch unser eigenes
 * Markup zu breit sein, das innere durch Bsports Inhalt - und der Rahmen
 * gibt die Breite des inneren nach aussen weiter, weil er im Fluss steht
 * und keine feste Breite hat. Welches von beiden drueckt, ist ohne Messung
 * geraten.
 *
 * WAS DIE ERSTE MESSUNG ERGEBEN HAT
 * Keines von beiden. Das Telefon meldete scrollWidth = clientWidth = 402,
 * also gar keinen Ueberlauf, dafuer visualViewport.scale 1.1418 und
 * innerWidth 352. Die Seite war GEZOOMT, nicht verbreitert, und 1.1418 ist
 * 16/14: der Fokuszoom von iOS auf ein Feld mit 14px Schrift.
 *
 * Der Bericht hatte daraus "50px zu breit" und 181 herausstehende Elemente
 * gemacht, weil er gegen innerWidth gemessen hat - und innerWidth schrumpft
 * beim Zoom. Falscher Massstab, lauter Fehlalarm. Jetzt zaehlt bei Zoom
 * allein documentElement.clientWidth, und der Bericht nennt den Faktor
 * samt der Schriftgroesse, die ihn ausgeloest hat.
 *
 * Dazu zwei Abschnitte, die auf das Feld zeigen statt auf die Breite: das
 * fokussierte Element in beiden Dokumenten samt errechneter Schriftgroesse,
 * und die letzten fuenf Zoomspruenge mit dem Feld, das jeweils im Fokus
 * stand.
 *
 * BEDIENUNG
 * /personal-training-boxen-muenchen?ptdom=1 aufrufen.
 *   BREITE      Massstab, beide Dokumente, fokussiertes Feld, Zoomspruenge
 *   MODAL       zeigt, was seit dem Seitenaufruf im Rahmen erschienen ist
 *   KOPIEREN    legt den angezeigten Bericht in die Zwischenablage
 *
 * Der frueher erste Knopf WOCHENPLAN ist entfallen. Begruendung steht
 * unten bei der Oberflaeche.
 *
 * Ohne den Parameter laedt und tut diese Datei nichts. Sie laedt nichts von
 * bsport.io und misst nur unser eigenes iframe - deshalb ungated.
 */
(function () {
  'use strict';
  if (!/[?&]ptdom=1/.test(window.location.search)) return;

  /* ── Oberflaeche ──────────────────────────────────────────────────── */
  /* DREI TEXTKNOEPFE, NICHT VIER.
     Nachgemessen bei 320px mit dem echten CSS dieser Seite: fuenf Knoepfe
     (WOCHENPLAN MODAL BREITE KOPIEREN x) ergeben 87+50+51+67+48 = 303px,
     dazu vier Luecken und 12px Polster, macht 319 von 320. Abgeschnitten
     wird nichts - aber ein Pixel Luft ist keine Luft. Eine Spur andere
     Schriftmetrik auf dem echten Geraet, und die Leiste bricht um; das
     faellt dann genau auf dem Telefon auf, auf dem gemessen werden soll.

     WOCHENPLAN ist der richtige Verzicht: das Terminraster ist vermessen,
     der Knopf hat seine Arbeit getan. Sein Code ist mit ihm entfallen,
     damit nichts Unerreichbares stehenbleibt. Wer ihn zurueck will, holt
     ihn aus der Historie. */
  var leiste = document.createElement('div');
  leiste.id = 'pt-dom-leiste';
  var knopfBreite = document.createElement('button');
  knopfBreite.type = 'button';
  knopfBreite.textContent = 'BREITE';
  var knopfScroll = document.createElement('button');
  knopfScroll.type = 'button';
  knopfScroll.textContent = 'SCROLL';
  var knopfKopie = document.createElement('button');
  knopfKopie.type = 'button';
  knopfKopie.textContent = 'KOPIEREN';
  var knopfZu = document.createElement('button');
  knopfZu.type = 'button';
  knopfZu.textContent = '×';
  knopfZu.setAttribute('aria-label', 'Diagnose schliessen');
  leiste.appendChild(knopfBreite);
  leiste.appendChild(knopfScroll);
  leiste.appendChild(knopfKopie);
  /* x MUSS letztes Kind bleiben: #pt-dom-leiste button:last-child gibt ihm
     seine feste Breite und die groessere Schrift. */
  leiste.appendChild(knopfZu);

  var bericht = document.createElement('pre');
  bericht.id = 'pt-dom-bericht';
  bericht.hidden = true;

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(bericht);
    document.body.appendChild(leiste);
  });

  var letzterText = '';

  /* ── Hilfen ────────────────────────────────────────────────────────── */
  function kurz(el) {
    if (!el) return '-';
    var k = (typeof el.className === 'string' && el.className)
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '';
    /* Klassennamen koennen bei MUI sehr lang werden - gekuerzt, aber mit
       Laengenangabe, damit erkennbar bleibt, dass da mehr steht. */
    if (k.length > 54) k = k.slice(0, 54) + '…';
    return el.tagName.toLowerCase() + k;
  }

  /* WIE WEIT STEHT ES RAUS?
     Positiv = ueber der rechten Kante, negativ = links davor. Gemessen
     gegen innerWidth, nicht gegen scrollWidth: gesucht ist, was NICHT
     mehr auf den Schirm passt. */
  function ueberstand(r, fensterBreite) {
    var rechts = r.right - fensterBreite;
    var links  = -r.left;
    return Math.max(rechts > 0 ? rechts : 0, links > 0 ? links : 0);
  }

  /* UEBERSTAND UEBER DIE ELTERN, nicht ueber das Fenster.
     Das ist der Unterschied zwischen Taeter und Mitgezogenem. Ein
     Element mit width: 100% in einem bereits zu breiten Elternteil steht
     ueber das FENSTER hinaus, aber nicht ueber seine Eltern - es ist nur
     mitgewachsen. Wer die Liste nach Fensterueberstand sortiert, bekommt
     oben die Kopfleiste und sieben Menuepunkte und ganz unten die
     Ursache. Genau dieser Fehler ist beim u18-Raster schon einmal
     passiert: gemeldet war div.nav-inner, schuld war ein Rastermass.

     Fuer fest und absolut positionierte Elemente ergibt der Vergleich
     keinen Sinn - deren Bezugsrahmen sind nicht die Eltern. Die bekommen
     -1 und werden als "Bezug anders" ausgewiesen. */
  function ueberEltern(el, r, fenster) {
    var p = el.parentElement;
    if (!p) return -1;
    var c;
    try { c = fenster.getComputedStyle(el); } catch (e) { return -1; }
    if (c.position === 'fixed' || c.position === 'absolute') return -1;
    var pr = p.getBoundingClientRect();
    var pc;
    try { pc = fenster.getComputedStyle(p); } catch (e) { return -1; }
    var links  = pr.left  + (parseFloat(pc.borderLeftWidth)  || 0) + (parseFloat(pc.paddingLeft)  || 0);
    var rechts = pr.right - (parseFloat(pc.borderRightWidth) || 0) - (parseFloat(pc.paddingRight) || 0);
    var raus = Math.max(r.right - rechts, links - r.left);
    return raus > 0 ? raus : 0;
  }

  function rechteck(r) {
    return 'l=' + Math.round(r.left) + ' r=' + Math.round(r.right) +
           ' w=' + Math.round(r.width);
  }

  /* Die Breitenangaben aus der Rechnung des Browsers. min-width: auto ist
     der haeufigste Taeter in einem Flex- oder Rasterkind: es verhindert
     das Schrumpfen unter die Inhaltsbreite. */
  function breiteVon(c) {
    return 'width=' + c.width + ' min-width=' + c.minWidth +
           ' max-width=' + c.maxWidth + ' position=' + c.position;
  }

  /* DAS FOKUSSIERTE FELD.
     iOS zoomt beim Fokus in jedes Feld hinein, dessen errechnete Schrift
     unter 16px liegt, und zwar genau auf 16px. Welches Feld das war,
     steht in keinem Screenshot - hier steht es.

     Beide Dokumente werden gefragt: das aeussere kann ein eigenes
     Formular im Fokus haben, das innere eines von Bsport. Im inneren ist
     activeElement oft <body>, solange nichts fokussiert ist. */
  function feldInfo(d, w) {
    var el;
    try { el = d && d.activeElement; } catch (e) { return 'nicht lesbar'; }
    if (!el || el === d.body || el === d.documentElement) return 'nichts fokussiert';
    var t = [];
    t.push('<' + el.tagName.toLowerCase() + '>');
    try { if (el.type) t.push('type=' + el.type); } catch (e) {}
    try { if (el.name) t.push('name=' + el.name); } catch (e) {}
    if (el.id) t.push('#' + el.id);
    if (typeof el.className === 'string' && el.className) {
      t.push('.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'));
    }
    var px = null;
    try { px = parseFloat(w.getComputedStyle(el).fontSize); } catch (e) {}
    if (px !== null && !isNaN(px)) {
      t.push('font-size=' + (Math.round(px * 100) / 100) + 'px');
      if (px < 16) t.push('<< UNTER 16px, iOS ZOOMT HIER');
    } else {
      t.push('font-size=?');
    }
    return t.join(' ');
  }

  function rahmenJetzt() {
    var wr = document.querySelector('.pt-widget-wrapper');
    return wr ? wr.querySelector('iframe') : null;
  }

  /* ── ZOOM-EREIGNISSE ───────────────────────────
     visualViewport feuert resize, wenn sich Zoom oder Ausschnitt aendern.
     Wer im selben Augenblick den Fokus hat, ist der Ausloeser. Die letzten
     fuenf reichen: mehr passt nicht auf einen Handyschirm, und der erste
     Sprung ist ohnehin der interessante.

     Nur unter ?ptdom=1 - diese Datei kehrt sonst in der ersten Zeile des
     Rumpfs um, der Hoerer wird also nie angemeldet. */
  var ZOOM_MAX = 5;
  var zoomLog = [];

  function zoomMerken() {
    var vv = window.visualViewport;
    if (!vv) return;
    var rahmen = rahmenJetzt();
    var id = null, iw = null;
    try { id = rahmen && rahmen.contentDocument; iw = rahmen && rahmen.contentWindow; }
    catch (e) { id = null; }
    zoomLog.push({
      zeit: new Date().toLocaleTimeString('de-DE'),
      skala: Math.round(vv.scale * 10000) / 10000,
      breite: Math.round(vv.width),
      offsetLeft: Math.round(vv.offsetLeft),
      aussen: feldInfo(document, window),
      innen: (id && iw) ? feldInfo(id, iw) : 'Rahmen nicht lesbar'
    });
    if (zoomLog.length > ZOOM_MAX) zoomLog.shift();
  }

  function zoomWacheStarten() {
    if (!window.visualViewport) return;
    window.visualViewport.addEventListener('resize', zoomMerken);
  }

  /* ── BREITE: WER MACHT DIE SEITE BREITER ALS DEN SCHIRM? ────────────
     Gemeldet vom iPhone 16 (Chrome iOS, Inkognito): nach der Terminwahl ist
     der Burger rechts halb abgeschnitten, die Preisknoepfe laufen rechts
     heraus, das Uhrensymbol ist links halb weg.

     BEIDE Kanten gleichzeitig beschnitten unterscheidet zwei Faelle, die
     auf einem Screenshot gleich aussehen:
       a) Das Dokument ist breiter als das Fenster und steht nach rechts
          gescrollt. Dann ist scrollX > 0 und scrollWidth > clientWidth.
       b) Der sichtbare Ausschnitt ist gezoomt oder verschoben. Dann ist
          visualViewport.scale ungleich 1 oder offsetLeft ungleich 0,
          waehrend scrollX bei 0 bleibt.
     Die Kopfleiste steht fest (position: fixed). Im Fall b wandert sie mit
     dem Ausschnitt, im Fall a nicht. Genau deshalb stehen hier beide
     Koordinatensysteme nebeneinander. */
  function breitenBericht() {
    var z = [];
    function schreib(s) { z.push(s); }
    var vv = window.visualViewport;
    var de = document.documentElement, bo = document.body;

    /* WELCHE BREITE IST "DER SCHIRM"?
       Die erste Fassung nahm den kleinsten aus innerWidth, clientWidth
       und visualViewport.width. Das Telefon hat gezeigt, warum das falsch
       ist: bei scale 1.1418 meldete innerWidth 352 statt 402, und der
       Bericht schloss daraus "50px zu breit" und listete 181 angeblich
       herausstehende Elemente. Alles Fehlalarm. Die Seite war nicht
       breiter, sie war GEZOOMT - documentElement.scrollWidth und
       clientWidth standen beide bei 402.

       Beim Zoom schrumpfen innerWidth und visualViewport.width um genau
       den Zoomfaktor, waehrend documentElement.clientWidth die
       Layoutbreite behaelt. Also: sobald gezoomt ist, zaehlt clientWidth
       und sonst nichts. */
    var iw = window.innerWidth;
    var cw = de.clientWidth;
    var vw = vv ? Math.round(vv.width) : iw;
    var skala = vv && vv.scale ? vv.scale : 1;
    var gezoomt = skala > 1.01;
    var bezug = gezoomt ? cw : Math.min(iw, cw, vw);

    schreib('PTDOM BREITE  ' + new Date().toLocaleTimeString('de-DE'));
    schreib('');
    schreib('FENSTER');
    schreib('  innerWidth/innerHeight   ' + iw + ' x ' + window.innerHeight);
    if (vv) {
      schreib('  visualViewport           w=' + Math.round(vv.width * 100) / 100 +
              ' h=' + Math.round(vv.height * 100) / 100 + ' scale=' + vv.scale);
      schreib('                           offsetLeft=' + vv.offsetLeft +
              ' pageLeft=' + vv.pageLeft + ' offsetTop=' + vv.offsetTop);
    } else {
      schreib('  visualViewport           NICHT vorhanden');
    }
    schreib('  scrollX/scrollY          ' + Math.round(window.scrollX || 0) +
            ' / ' + Math.round(window.scrollY || 0));
    schreib('  scrollLeft (de/body)     ' + Math.round(de.scrollLeft) +
            ' / ' + Math.round(bo.scrollLeft));
    schreib('  devicePixelRatio         ' + (window.devicePixelRatio || 1));
    /* Der Inline-Block im Kopf schreibt auf iPhone und iPod
       maximum-scale=1 hinein. Hier steht, was tatsaechlich drinsteht -
       sonst bleibt offen, ob er gelaufen ist. */
    var vm = document.querySelector('meta[name="viewport"]');
    schreib('  VIEWPORT META: content=' +
            (vm ? (vm.getAttribute('content') || '(leer)') : '(kein meta)'));
    schreib('  UA  ' + navigator.userAgent);
    schreib('');
    if (gezoomt) {
      schreib('  ZOOM: ' + (Math.round(skala * 10000) / 10000) +
              ', Seite ist gezoomt, nicht verbreitert');
      schreib('  Gemessen wird gegen documentElement.clientWidth (' + cw + 'px).');
      schreib('  innerWidth ' + iw + ' und visualViewport ' + vw +
              ' sind der gezoomte Ausschnitt, kein Massstab.');
      /* 16 geteilt durch den Faktor ergibt die Schriftgroesse, die den
         Zoom ausgeloest hat - iOS zoomt genau so weit, dass das Feld bei
         16px steht. 1.1418 ergibt 14.01, also ein 14px-Feld. */
      var quelle = Math.round((16 / skala) * 100) / 100;
      schreib('  16 / ' + (Math.round(skala * 10000) / 10000) + ' = ' + quelle +
              'px  <- so gross war die Schrift im fokussierten Feld');
    } else {
      schreib('  MASSSTAB ' + bezug + 'px   (innerWidth ' + iw +
              ', documentElement.clientWidth ' + cw + ', visualViewport ' + vw + ')');
      /* Ohne Zoom darf clientWidth nicht von der Layoutbreite abweichen.
         Tut sie es doch, hat der Browser die Flaeche geweitet - das ist
         ein echter Befund und kein Zoomartefakt. */
      if (iw !== cw) {
        schreib('  !! clientWidth weicht ohne Zoom von innerWidth ab. Der');
        schreib('     Browser hat die Layoutflaeche geweitet. Gemessen wird');
        schreib('     gegen den kleineren Wert.');
      }
    }

    schreib('');
    schreib('AEUSSERES DOKUMENT');
    schreib('  documentElement  scrollWidth=' + de.scrollWidth +
            ' clientWidth=' + de.clientWidth + ' offsetWidth=' + de.offsetWidth);
    schreib('  body             scrollWidth=' + bo.scrollWidth +
            ' clientWidth=' + bo.clientWidth + ' offsetWidth=' + bo.offsetWidth);
    var ueber = Math.max(de.scrollWidth, bo.scrollWidth) - bezug;
    schreib('  >> ' + (ueber > 1 ? ueber + 'px BREITER als der Massstab'
                                 : 'passt (' + ueber + 'px)'));

    schreib('');
    schreib('FOKUSSIERTES FELD');
    schreib('  aussen  ' + feldInfo(document, window));

    schreib('');
    schreib('RAHMEN');
    var wrapper = document.querySelector('.pt-widget-wrapper');
    var rahmen = wrapper ? wrapper.querySelector('iframe') : null;
    if (!rahmen) {
      schreib('  KEIN iframe gefunden.');
    } else {
      schreib('  iframe    ' + rechteck(rahmen.getBoundingClientRect()));
      schreib('            ' + breiteVon(window.getComputedStyle(rahmen)));
      var cw = window.getComputedStyle(wrapper);
      schreib('  wrapper   ' + rechteck(wrapper.getBoundingClientRect()));
      schreib('            ' + breiteVon(cw));
      schreib('            margin=' + cw.marginLeft + '/' + cw.marginRight +
              ' overflow-x=' + cw.overflowX);
    }

    schreib('');
    schreib('INNERES DOKUMENT (contentDocument)');
    var d = null, w = null;
    try { d = rahmen && rahmen.contentDocument; w = rahmen && rahmen.contentWindow; }
    catch (e) { d = null; }
    if (!d || !d.body || !w) {
      schreib('  nicht lesbar oder leer. Einwilligung erteilt? Widget geladen?');
    } else {
      var ide = d.documentElement, ibo = d.body;
      schreib('  fokussiert im Rahmen: ' + feldInfo(d, w));
      schreib('  documentElement  scrollWidth=' + ide.scrollWidth +
              ' clientWidth=' + ide.clientWidth);
      schreib('  body             scrollWidth=' + ibo.scrollWidth +
              ' clientWidth=' + ibo.clientWidth);
      var iUeber = Math.max(ide.scrollWidth, ibo.scrollWidth) - ide.clientWidth;
      schreib('  >> ' + (iUeber > 1 ? iUeber + 'px breiter als der Rahmen'
                                    : 'passt in den Rahmen (' + iUeber + 'px)'));
      /* Rangfolge nach Ueberstand ueber EINE der beiden Kanten, erst
         danach nach Breite. Nur nach der rechten Kante zu sortieren
         wuerde einen Kasten uebersehen, der links heraushaengt - und
         genau der ist gemeldet (Uhrensymbol links halb weg). */
      schreib('  Die 8 weitesten Elemente (Ueberstand, dann Breite):');
      var innen = [];
      var alle = d.querySelectorAll('*');
      for (var i = 0; i < alle.length && i < 4000; i++) {
        var rr = alle[i].getBoundingClientRect();
        if (rr.width < 1 || rr.height < 1) continue;
        innen.push({ el: alle[i], r: rr, u: ueberstand(rr, ide.clientWidth) });
      }
      innen.sort(function (a2, b2) {
        return (b2.u - a2.u) || (b2.r.width - a2.r.width) || (b2.r.right - a2.r.right);
      });
      /* Eine Kette aus Huellen hat dieselbe rechte Kante und dieselbe
         Breite. Ohne diese Zusammenfassung gingen alle acht Plaetze an ein
         und denselben Kasten in acht Ebenen. */
      var gewaehlt = [];
      for (var g = 0; g < innen.length && gewaehlt.length < 8; g++) {
        var k = innen[g], doppelt = false;
        for (var h = 0; h < gewaehlt.length; h++) {
          var v = gewaehlt[h];
          if (Math.abs(v.r.right - k.r.right) <= 1 &&
              Math.abs(v.r.width - k.r.width) <= 1 &&
              (v.el.contains(k.el) || k.el.contains(v.el))) { doppelt = true; break; }
        }
        if (!doppelt) gewaehlt.push(k);
      }
      for (var n = 0; n < gewaehlt.length; n++) {
        schreib('   ' + (n + 1) + '. ' +
                (gewaehlt[n].u > 1 ? '+' + Math.round(gewaehlt[n].u) + 'px  ' : '') +
                kurz(gewaehlt[n].el));
        schreib('      ' + rechteck(gewaehlt[n].r) + '  ' +
                breiteVon(w.getComputedStyle(gewaehlt[n].el)));
      }
      if (!gewaehlt.length) schreib('   nichts messbar');
    }

    schreib('');
    schreib('UEBERLAUF AUSSEN (rechts > ' + (bezug + 1) + ' oder links < -1)');
    var raus = [];
    var aalle = document.querySelectorAll('body *');
    for (var q = 0; q < aalle.length; q++) {
      var el = aalle[q];
      /* Unsere eigene Leiste und unser Bericht bleiben draussen: sie
         gehoeren nicht zur Seite, die gemessen wird. */
      if (el.id === 'pt-dom-leiste' || el.id === 'pt-dom-bericht') continue;
      if (el.closest && el.closest('#pt-dom-leiste, #pt-dom-bericht')) continue;
      var r2 = el.getBoundingClientRect();
      if (r2.width < 1 && r2.height < 1) continue;
      if (!(r2.right > bezug + 1 || r2.left < -1)) continue;
      raus.push({ el: el, r: r2,
                  u: ueberstand(r2, bezug),
                  e: ueberEltern(el, r2, window) });
    }
    /* Erst nach Elternueberstand, dann nach Fensterueberstand. Oben steht
       damit, was die Breite MACHT, nicht was sie erbt. */
    raus.sort(function (a3, b3) { return (b3.e - a3.e) || (b3.u - a3.u); });
    if (!raus.length) {
      schreib('  nichts steht heraus.');
    } else {
      schreib('  ' + raus.length + ' Element(e), die 15 mit dem groessten');
      schreib('  Ueberstand ueber die EIGENEN Eltern zuerst:');
      for (var t = 0; t < raus.length && t < 15; t++) {
        var x = raus[t];
        var marke = x.e < 0 ? 'Eltern: Bezug anders'
                  : (x.e > 1 ? 'Eltern +' + Math.round(x.e) + 'px'
                             : 'nur mitgezogen');
        schreib('   ' + (t + 1) + '. Fenster +' + Math.round(x.u) + 'px, ' + marke);
        schreib('      ' + kurz(x.el) + (x.el.id ? ' #' + x.el.id : ''));
        schreib('      ' + rechteck(x.r) + '  ' +
                breiteVon(window.getComputedStyle(x.el)));
      }
    }

    schreib('');
    schreib('DIALOG');
    var beh = null;
    try { beh = d && d.querySelector('.bsport-user-interaction-modal__container'); }
    catch (e2) { beh = null; }
    if (!beh || !w) {
      schreib('  kein .bsport-user-interaction-modal__container im Rahmen.');
    } else {
      schreib('  ' + kurz(beh));
      schreib('  ' + rechteck(beh.getBoundingClientRect()) + '  ' +
              breiteVon(w.getComputedStyle(beh)));
      var kasten = beh.querySelector('[role="dialog"], [aria-modal="true"]');
      if (kasten && kasten !== beh) {
        schreib('  darin ' + kurz(kasten));
        schreib('  ' + rechteck(kasten.getBoundingClientRect()) + '  ' +
                breiteVon(w.getComputedStyle(kasten)));
      }
    }

    schreib('');
    schreib('ZOOM-EREIGNISSE (letzte ' + ZOOM_MAX + ')');
    if (!window.visualViewport) {
      schreib('  visualViewport gibt es hier nicht, nichts aufgezeichnet.');
    } else if (!zoomLog.length) {
      schreib('  keine. Der Ausschnitt hat sich seit dem Aufruf nicht geaendert.');
    } else {
      for (var zz = 0; zz < zoomLog.length; zz++) {
        var ev = zoomLog[zz];
        schreib('  [' + (zz + 1) + '] ' + ev.zeit + '  scale=' + ev.skala +
                '  Breite=' + ev.breite + '  offsetLeft=' + ev.offsetLeft);
        schreib('      aussen: ' + ev.aussen);
        schreib('      innen:  ' + ev.innen);
      }
    }

    return z.join('\n');
  }


  /* ═════════ GESTEN UND HOEHENWECHSEL MITSCHREIBEN ═════════
     Gemeldet von einem echten iPhone, NUR in Safari, nicht in Chrome iOS:
     im Buchungsbereich bewegt ein senkrechter Wisch die Seite manchmal
     nicht. Erst ein Wisch seitlich oder an anderer Stelle loest es.
     Layout ist in Ordnung (scrollX 0, scrollWidth = clientWidth = 402,
     kein Zoom), es ist also keine Breitenfrage, sondern eine Frage, WER
     die Beruehrung bekommt.

     Drei Verdaechtige, und dieser Mitschnitt trennt sie:

       a) Scroll-Falle am Rahmen. Safari gibt die Beruehrung an das innere
          Dokument und scrollt dort - wenn dort nichts zu scrollen ist,
          passiert gar nichts. Erkennbar daran, dass der Startpunkt im
          Rahmen liegt, dy gross ist und WEDER window.scrollY NOCH der
          innere scrollTop sich bewegt. Das ist die Marke STUCK.
       b) Hoehenwechsel waehrend der Geste. bsport-frame-hoehe.js zieht
          die Rahmenhoehe nach, getrieben von einem ResizeObserver im
          inneren Dokument und einem 750ms-Takt. Faellt das mitten in
          einen Wisch, bricht Safari das Scrollen ab. Erkennbar an der
          Marke HOEHE WAEHREND GESTE.
       c) Nebenwirkung von heute. touch-action: manipulation im srcdoc
          (#130) und maximum-scale=1 auf dem iPhone (#131). Beides steht
          im Bericht, das errechnete touch-action des beruehrten Elements
          ebenso.

     ALLES PASSIV. capture: true, passive: true, nirgends
     preventDefault, kein Schreibzugriff auf Stile, keine Verhaltens-
     aenderung. Ein Mitschnitt, der das Gemessene veraendert, ist
     wertlos.

     Darum liest touchmove auch NICHTS aus dem Layout - nur die
     Koordinaten des Fingers. getComputedStyle und
     getBoundingClientRect erzwingen eine Layoutberechnung; in einem
     touchmove, das sechzigmal je Sekunde feuert, waere genau das die
     Stockung, die gesucht wird. Gemessen wird am Anfang und am Ende. */
  var GESTEN_MAX = 25;
  var gesten = [];
  var laufend = null;          /* die Geste, die gerade im Gang ist */
  var hoehenLog = [];
  var HOEHEN_MAX = 25;
  var letzteQuelle = { was: '', zeit: 0 };

  function pfad(el) {
    var teile = [], n = el, i = 0;
    try {
      while (n && n.nodeType === 1 && i < 4) {
        teile.push(kurz(n));
        n = n.parentElement; i++;
      }
    } catch (e) { /* egal */ }
    return teile.join(' < ') || '-';
  }

  function innenDok() {
    try {
      var wr = document.querySelector('.pt-widget-wrapper');
      var f = wr && wr.querySelector('iframe');
      if (!f) return null;
      var d = f.contentDocument;
      return (d && d.body) ? { f: f, d: d, w: f.contentWindow } : { f: f, d: null, w: null };
    } catch (e) { return null; }
  }

  function innenOben(r) {
    try {
      if (!r || !r.d) return null;
      var se = r.d.scrollingElement || r.d.documentElement;
      return se ? Math.round(se.scrollTop) : null;
    } catch (e) { return null; }
  }

  function start(ev, woher) {
    var t = ev.touches && ev.touches[0];
    if (!t) return;
    /* In Chromium feuert bei einer Beruehrung IM Rahmen nur der Hoerer des
       inneren Dokuments, nicht beide - gemessen. Sollte eine andere Engine
       beide feuern, gewinnt der erste: sonst ueberschriebe der zweite
       Aufruf die gerade begonnene Geste und der Mitschnitt verloere
       Anfangswerte. */
    if (laufend && Date.now() - laufend.ms < 50) return;
    var r = innenDok();
    var rb = null;
    try { rb = r && r.f ? r.f.getBoundingClientRect() : null; } catch (e) {}
    /* Bei einer Beruehrung im inneren Dokument sind die Koordinaten auf
       dessen Fenster bezogen; fuer den Vergleich mit dem Rahmen muessen
       sie in das aeussere Fenster umgerechnet werden. */
    var x = t.clientX, y = t.clientY;
    if (woher === 'innen' && rb) { x += rb.left; y += rb.top; }
    var ta = '-';
    try { ta = (woher === 'innen' && r && r.w ? r.w : window)
                 .getComputedStyle(ev.target).touchAction; } catch (e) {}
    laufend = {
      zeit: new Date().toLocaleTimeString('de-DE'),
      ms: Date.now(),
      woher: woher,
      x0: Math.round(x), y0: Math.round(y),
      rx0: t.clientX, ry0: t.clientY,   /* roh, fuer den Versatz */
      dx: 0, dy: 0,
      imRahmen: !!(rb && x >= rb.left && x <= rb.right && y >= rb.top && y <= rb.bottom),
      zielAussen: woher === 'aussen' ? pfad(ev.target) : '(Beruehrung kam im Rahmen an)',
      zielInnen:  woher === 'innen'  ? pfad(ev.target) : '-',
      yVor: Math.round(window.scrollY || 0),
      innenVor: innenOben(r),
      cancelable: !!ev.cancelable,
      verhindert: false,
      touchAction: ta,
      hoehen: [],
      ende: '-'
    };
  }

  /* Nur Rechnen, kein Layoutzugriff. Die touchmove-Ereignisse einer Geste
     kommen aus demselben Dokument wie ihr touchstart, also ist die rohe
     Differenz der Koordinaten bereits der Versatz - ohne Umrechnung. */
  function bewegen(ev) {
    if (!laufend) return;
    var t = ev.touches && ev.touches[0];
    if (!t) return;
    laufend.dx = Math.round(t.clientX - laufend.rx0);
    laufend.dy = Math.round(t.clientY - laufend.ry0);
  }

  function schliessen(ev, art) {
    if (!laufend) return;
    var g = laufend;
    laufend = null;
    var r = innenDok();
    g.ende = art;
    if (ev && ev.defaultPrevented) g.verhindert = true;
    g.yNach = Math.round(window.scrollY || 0);
    g.innenNach = innenOben(r);
    var bewegtAussen = g.yNach !== g.yVor;
    var bewegtInnen = (g.innenVor !== null && g.innenNach !== null && g.innenNach !== g.innenVor);
    g.marken = [];
    if (Math.abs(g.dy) > 30 && !bewegtAussen && !bewegtInnen) g.marken.push('STUCK');
    if (Math.abs(g.dx) > Math.abs(g.dy)) g.marken.push('SEITLICH');
    if (g.hoehen.length) g.marken.push('HOEHE WAEHREND GESTE');
    gesten.push(g);
    if (gesten.length > GESTEN_MAX) gesten.shift();
  }

  function gestenWacheSetzen() {
    var o = { capture: true, passive: true };
    document.addEventListener('touchstart', function (e) { start(e, 'aussen'); }, o);
    document.addEventListener('touchmove',  function (e) { bewegen(e); }, o);
    document.addEventListener('touchend',   function (e) { schliessen(e, 'touchend'); }, o);
    document.addEventListener('touchcancel',function (e) { schliessen(e, 'touchcancel'); }, o);
    window.addEventListener('scroll', function () {
      if (laufend) laufend.scrollGesehen = true;
    }, o);
  }

  var innenVerdrahtet = null;
  function innenWacheSetzen() {
    var r = innenDok();
    if (!r || !r.d) return;
    if (innenVerdrahtet === r.d) return;
    innenVerdrahtet = r.d;
    var o = { capture: true, passive: true };
    try {
      r.d.addEventListener('touchstart', function (e) { start(e, 'innen'); }, o);
      r.d.addEventListener('touchmove',  function (e) { bewegen(e); }, o);
      r.d.addEventListener('touchend',   function (e) { schliessen(e, 'touchend'); }, o);
      r.d.addEventListener('scroll', function () {
        if (laufend) laufend.innenScrollGesehen = true;
      }, o);
    } catch (e) { innenVerdrahtet = null; }
  }

  /* HOEHENWECHSEL AM RAHMEN
     Ein MutationObserver auf dem style-Attribut des iframes faengt jeden
     Schreibzugriff von bsport-frame-hoehe.js. Wer geschrieben hat, laesst
     sich von aussen nicht sehen; unterscheidbar sind nur load und resize,
     weil deren Hoerer hier eine Marke setzen. Alles andere ist
     ResizeObserver ODER der 750ms-Takt, und das steht dann auch so da
     statt einer Vermutung. */
  var hoehenMO = null;
  function hoehenWacheSetzen() {
    var r = innenDok();
    if (!r || !r.f || hoehenMO) return;
    var letzte = r.f.style.height || '(nicht gesetzt)';
    try {
      hoehenMO = new MutationObserver(function () {
        var neu = r.f.style.height || '(nicht gesetzt)';
        if (neu === letzte) return;
        var jetzt = Date.now();
        var quelle = (jetzt - letzteQuelle.zeit < 300 && letzteQuelle.was)
          ? letzteQuelle.was
          : 'ResizeObserver oder 750ms-Takt (von aussen nicht unterscheidbar)';
        var e = { zeit: new Date().toLocaleTimeString('de-DE'),
                  alt: letzte, neu: neu, quelle: quelle, inGeste: !!laufend };
        letzte = neu;
        hoehenLog.push(e);
        if (hoehenLog.length > HOEHEN_MAX) hoehenLog.shift();
        if (laufend) laufend.hoehen.push(e.alt + ' -> ' + e.neu);
      });
      hoehenMO.observe(r.f, { attributes: true, attributeFilter: ['style'] });
      r.f.addEventListener('load', function () {
        letzteQuelle = { was: 'load des Rahmens', zeit: Date.now() };
        innenVerdrahtet = null; innenWacheSetzen();
      });
      window.addEventListener('resize', function () {
        letzteQuelle = { was: 'resize des Fensters', zeit: Date.now() };
      }, { passive: true });
    } catch (e) { hoehenMO = null; }
  }

  /* ── Der Bericht ──────────────────────────────── */
  function eigen(el, w) {
    var c;
    try { c = w.getComputedStyle(el); } catch (e) { return 'nicht lesbar'; }
    var t = ['overflow=' + c.overflowX + '/' + c.overflowY];
    if (c.overscrollBehavior && c.overscrollBehavior !== 'auto') t.push('overscroll=' + c.overscrollBehavior);
    t.push('touch-action=' + (c.touchAction || '-'));
    var wos = c.webkitOverflowScrolling || c['-webkit-overflow-scrolling'];
    if (wos) t.push('-webkit-overflow-scrolling=' + wos);
    t.push('position=' + c.position);
    if (c.transform && c.transform !== 'none') t.push('transform=' + c.transform);
    t.push('height=' + c.height);
    return t.join('  ');
  }

  function scrollBericht() {
    var z = [];
    function schreib(s) { z.push(s); }
    schreib('PTDOM SCROLL  ' + new Date().toLocaleTimeString('de-DE'));
    var vm = document.querySelector('meta[name="viewport"]');
    schreib('  VIEWPORT META: content=' +
            (vm ? (vm.getAttribute('content') || '(leer)') : '(kein meta)'));
    schreib('  UA  ' + navigator.userAgent);

    var r = innenDok();
    var rb = null;
    try { rb = r && r.f ? r.f.getBoundingClientRect() : null; } catch (e) {}
    schreib('  window.innerHeight=' + window.innerHeight +
            '  Rahmenhoehe=' + (rb ? Math.round(rb.height) : '?') +
            (rb && rb.height > window.innerHeight
              ? '  (Rahmen ist hoeher als das Fenster)' : ''));

    /* ── Gesten ── */
    schreib('');
    schreib('GESTEN (letzte ' + GESTEN_MAX + ', ' + gesten.length + ' aufgezeichnet)');
    if (!gesten.length) {
      schreib('  keine. Erst im Buchungsbereich wischen, dann SCROLL.');
    } else {
      for (var i = 0; i < gesten.length; i++) {
        var g = gesten[i];
        schreib('');
        schreib('  [' + (i + 1) + '] ' + g.zeit + '  ' + g.ende +
                (g.marken.length ? '   >>> ' + g.marken.join(' + ') : ''));
        schreib('      Start x=' + g.x0 + ' y=' + g.y0 +
                '  im Rahmen: ' + (g.imRahmen ? 'JA' : 'nein') +
                '  Beruehrung kam ' + (g.woher === 'innen' ? 'im RAHMEN an' : 'aussen an'));
        schreib('      dx=' + g.dx + '  dy=' + g.dy);
        schreib('      Seite  scrollY ' + g.yVor + ' -> ' + g.yNach +
                (g.yNach === g.yVor ? '  (unbewegt)' : '  (bewegt ' + (g.yNach - g.yVor) + 'px)'));
        schreib('      Rahmen scrollTop ' +
                (g.innenVor === null ? 'nicht lesbar'
                  : g.innenVor + ' -> ' + g.innenNach +
                    (g.innenNach === g.innenVor ? '  (unbewegt)' : '  (bewegt)')));
        schreib('      cancelable=' + g.cancelable + '  defaultPrevented=' + g.verhindert +
                '  touch-action(Ziel)=' + g.touchAction);
        schreib('      Ziel aussen: ' + g.zielAussen);
        if (g.zielInnen !== '-') schreib('      Ziel innen:  ' + g.zielInnen);
        if (g.hoehen.length) schreib('      Hoehe waehrend der Geste: ' + g.hoehen.join(' , '));
      }
    }

    /* ── Hoehenwechsel ── */
    schreib('');
    schreib('HOEHENWECHSEL AM RAHMEN (letzte ' + HOEHEN_MAX + ', ' + hoehenLog.length + ')');
    if (!hoehenLog.length) {
      schreib('  keiner aufgezeichnet.');
    } else {
      for (var h = 0; h < hoehenLog.length; h++) {
        var e2 = hoehenLog[h];
        schreib('  [' + (h + 1) + '] ' + e2.zeit + '  ' + e2.alt + ' -> ' + e2.neu +
                (e2.inGeste ? '   >>> HOEHE WAEHREND GESTE' : ''));
        schreib('      Quelle: ' + e2.quelle);
      }
    }

    /* ── Scrollbehaelter aussen ── */
    schreib('');
    schreib('SCROLLBEHAELTER AUSSEN (Rahmen und alle Vorfahren bis html)');
    if (!r || !r.f) {
      schreib('  kein iframe gefunden.');
    } else {
      var n = r.f, tiefe = 0;
      while (n && tiefe < 12) {
        schreib('  ' + kurz(n));
        schreib('    ' + eigen(n, window));
        if (n.tagName === 'HTML') break;
        n = n.parentElement; tiefe++;
      }
    }

    /* ── Inneres Dokument ── */
    schreib('');
    schreib('INNERES DOKUMENT');
    if (!r || !r.d || !r.w) {
      schreib('  nicht lesbar oder leer. Einwilligung erteilt? Widget geladen?');
    } else {
      var paare = [['html', r.d.documentElement], ['body', r.d.body]];
      for (var q = 0; q < paare.length; q++) {
        var el = paare[q][1];
        if (!el) continue;
        schreib('  ' + paare[q][0] + '  ' + eigen(el, r.w));
        schreib('      scrollHeight=' + el.scrollHeight +
                ' clientHeight=' + el.clientHeight +
                ' scrollTop=' + Math.round(el.scrollTop) +
                (el.scrollHeight > el.clientHeight + 1
                  ? '   << scrollbar, hier kann Safari die Geste hinleiten' : ''));
      }

      schreib('');
      schreib('  DIALOGBEHAELTER');
      var beh = null;
      try { beh = r.d.querySelector('.bsport-user-interaction-modal__container'); } catch (e3) {}
      if (!beh) {
        schreib('    keiner offen.');
      } else {
        schreib('    ' + kurz(beh));
        schreib('    ' + eigen(beh, r.w));
      }

      schreib('');
      schreib('  EIGENE SCROLLFLAECHEN IM RAHMEN (scrollHeight > clientHeight, overflow auto/scroll)');
      var gefunden = 0;
      try {
        var alle = r.d.querySelectorAll('*');
        for (var k = 0; k < alle.length && gefunden < 10; k++) {
          var x = alle[k];
          if (x.scrollHeight <= x.clientHeight + 1) continue;
          var cx = r.w.getComputedStyle(x);
          if (!/auto|scroll/.test(cx.overflowY) && !/auto|scroll/.test(cx.overflowX)) continue;
          gefunden++;
          schreib('    ' + gefunden + '. ' + kurz(x));
          schreib('       ' + eigen(x, r.w) +
                  '  scrollHeight=' + x.scrollHeight + ' clientHeight=' + x.clientHeight +
                  ' scrollTop=' + Math.round(x.scrollTop));
        }
      } catch (e4) { schreib('    Fehler beim Durchsuchen: ' + (e4 && e4.message)); }
      if (!gefunden) schreib('    keine.');
    }

    return z.join('\n');
  }

  /* ── Verdrahtung ───────────────────────────────────────────────────── */
  knopfScroll.addEventListener('click', function () {
    try { letzterText = scrollBericht(); }
    catch (e) { letzterText = 'FEHLER im Scroll-Bericht: ' + (e && e.message); }
    bericht.textContent = letzterText;
    bericht.hidden = false;
  });

  knopfBreite.addEventListener('click', function () {
    try { letzterText = breitenBericht(); }
    catch (e) { letzterText = 'FEHLER im Breiten-Bericht: ' + (e && e.message); }
    bericht.textContent = letzterText;
    bericht.hidden = false;
  });

  knopfKopie.addEventListener('click', function () {
    if (!letzterText) { knopfKopie.textContent = 'ERST MESSEN'; return; }
    var fertig = function (ok) {
      knopfKopie.textContent = ok ? 'KOPIERT' : 'NICHT KOPIERT';
      setTimeout(function () { knopfKopie.textContent = 'KOPIEREN'; }, 1800);
    };
    try {
      navigator.clipboard.writeText(letzterText).then(function () { fertig(true); },
                                                      function () { fertig(false); });
    } catch (e) { fertig(false); }
  });

  /* Erst den Bericht einklappen, erst beim zweiten Tipp alles entfernen.
     Sonst muss man neu laden, nur um im Widget weiterzunavigieren. */
  knopfZu.addEventListener('click', function () {
    if (!bericht.hidden) { bericht.hidden = true; return; }
    if (hoehenMO) { try { hoehenMO.disconnect(); } catch (e) {} }
    if (window.visualViewport) {
      try { window.visualViewport.removeEventListener('resize', zoomMerken); } catch (e) {}
    }
    leiste.remove();
    bericht.remove();
  });

  /* Der Rahmen ist bis zur Einwilligung inert (data-bsport-srcdoc) und
     laedt danach neu. Die Hoerer im inneren Dokument muessen also
     umziehen koennen - darum wird in Ruhe nachgesehen statt einmal
     versucht. Nur unter ?ptdom=1. */
  function wacheStarten() {
    /* Die Zoomwache aus PR #130 haengt hier mit dran. Sie stand frueher im
       Block des MODAL-Knopfes; beim Entfernen waere sie sonst still
       verschwunden und ZOOM-EREIGNISSE im BREITE-Bericht blieben fuer
       immer leer. Beim Testen genau so aufgefallen: null Hoerer auf
       visualViewport. */
    zoomWacheStarten();
    gestenWacheSetzen();
    innenWacheSetzen();
    hoehenWacheSetzen();
    setInterval(function () {
      innenWacheSetzen();
      hoehenWacheSetzen();
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wacheStarten);
  } else {
    wacheStarten();
  }
})();

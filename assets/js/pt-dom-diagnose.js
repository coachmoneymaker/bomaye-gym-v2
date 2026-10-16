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
  var knopfModal = document.createElement('button');
  knopfModal.type = 'button';
  knopfModal.textContent = 'MODAL';
  var knopfKopie = document.createElement('button');
  knopfKopie.type = 'button';
  knopfKopie.textContent = 'KOPIEREN';
  var knopfZu = document.createElement('button');
  knopfZu.type = 'button';
  knopfZu.textContent = '×';
  knopfZu.setAttribute('aria-label', 'Diagnose schliessen');
  leiste.appendChild(knopfBreite);
  leiste.appendChild(knopfModal);
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


  /* ══════════════════ MODAL-BEOBACHTER IM RAHMEN ══════════════════════
     Schreibt mit, was im inneren Dokument auftaucht. Laeuft nur unter
     ?ptdom=1 - diese Datei kehrt sonst schon in Zeile 1 um.

     Der Zugriff auf contentDocument ist moeglich, weil der Rahmen mit
     srcdoc aus unserem eigenen Dokument stammt und kein sandbox-Attribut
     traegt. bsport-frame-hoehe.js nutzt denselben Zugang, um die Hoehe
     nachzuziehen.

     Erfasst wird NICHT nach Klassennamen. Bsport baut mit MUI, die Klassen
     tragen wechselnde Zahlensuffixe. Erkannt wird an Rolle, ARIA, der
     errechneten Position und der Groesse - und genau diese Werte stehen
     dann im Bericht, damit die spaetere Erkennung auf Gemessenem steht. */
  var MODAL_MAX = 14;        /* so viele Ereignisse werden behalten */
  var modalLog  = [];
  var beobachtet = null;     /* das Dokument, an dem der Beobachter haengt */
  var mo = null;

  function attrListe(el) {
    var aus = [];
    try {
      for (var i = 0; i < el.attributes.length; i++) {
        var a = el.attributes[i];
        if (a.name === 'role' || a.name.indexOf('aria-') === 0) {
          aus.push(a.name + '="' + a.value + '"');
        }
      }
    } catch (e) { /* egal */ }
    return aus.join(' ');
  }

  function istSpinner(el) {
    var n = (el.tagName + ' ' + (typeof el.className === 'string' ? el.className : '')).toLowerCase();
    if (/spinner|loader|loading|circular|progressbar/.test(n)) return true;
    try { if (el.getAttribute('role') === 'progressbar') return true; } catch (e) {}
    return false;
  }

  /* Dialogverdacht, in dieser Reihenfolge: ausgesprochene Rolle, dann ARIA,
     dann eine feste Lage mit Flaeche, zuletzt ein neues oberstes Element.
     Die Groessenschranken halten Knoepfe und Kringel heraus. */
  function dialogGrund(el, c) {
    var rolle = '';
    try { rolle = el.getAttribute('role') || ''; } catch (e) {}
    if (rolle === 'dialog' || rolle === 'alertdialog') return 'role=' + rolle;
    try { if (el.hasAttribute('aria-modal')) return 'aria-modal'; } catch (e) {}
    var r = el.getBoundingClientRect();
    if (c.position === 'fixed' && r.width > 120 && r.height > 120) return 'position:fixed';
    if (el.parentElement && el.parentElement.tagName === 'BODY'
        && r.width > 160 && r.height > 160) return 'neues Element an <body>';
    return '';
  }

  function erfassen(art, grund, el, w, rahmen) {
    if (modalLog.length >= MODAL_MAX) return;
    if (el.__ptdomGesehen) return;
    el.__ptdomGesehen = true;
    var c, r;
    try { c = w.getComputedStyle(el); r = el.getBoundingClientRect(); }
    catch (e) { return; }
    var rb = rahmen.getBoundingClientRect();
    modalLog.push({
      zeit: new Date().toLocaleTimeString('de-DE'),
      art: art, grund: grund,
      tag: el.tagName.toLowerCase(),
      klassen: (typeof el.className === 'string' ? el.className : '') || '-',
      aria: attrListe(el) || '-',
      position: c.position,
      z: c.zIndex,
      display: c.display,
      /* Koordinaten IM RAHMEN - der Rahmen ist das Fenster dieses Dokuments. */
      top: Math.round(r.top), left: Math.round(r.left),
      breite: Math.round(r.width), hoehe: Math.round(r.height),
      eltern: el.parentElement ? el.parentElement.tagName.toLowerCase() : '-',
      /* Lage des Rahmens und Scrollstand im selben Augenblick. */
      rTop: Math.round(rb.top), rLeft: Math.round(rb.left),
      rBreite: Math.round(rb.width), rHoehe: Math.round(rb.height),
      scrollY: Math.round(window.scrollY || 0),
      innerH: window.innerHeight, innerW: window.innerWidth
    });
  }

  function pruefen(el, w, rahmen) {
    if (!el || el.nodeType !== 1) return;
    var c;
    try { c = w.getComputedStyle(el); } catch (e) { return; }
    if (c.display === 'none' || c.visibility === 'hidden') return;
    if (istSpinner(el)) { erfassen('SPINNER', 'Name/Rolle', el, w, rahmen); return; }
    var grund = dialogGrund(el, c);
    if (grund) erfassen('DIALOG', grund, el, w, rahmen);
  }

  function anmelden() {
    var rahmen = document.querySelector('.pt-widget-wrapper iframe');
    if (!rahmen) return;
    var d;
    try { d = rahmen.contentDocument; } catch (e) { return; }
    if (!d || !d.body) return;
    if (beobachtet === d) return;          /* schon dran */
    beobachtet = d;
    var w = rahmen.contentWindow;
    if (mo) { try { mo.disconnect(); } catch (e) {} }
    try {
      mo = new MutationObserver(function (listen) {
        for (var i = 0; i < listen.length; i++) {
          var hinzu = listen[i].addedNodes;
          for (var j = 0; j < hinzu.length; j++) pruefen(hinzu[j], w, rahmen);
        }
      });
      mo.observe(d.body, { childList: true, subtree: true });
    } catch (e) { beobachtet = null; }
  }

  /* Der Rahmen ist bis zur Einwilligung inert (data-bsport-srcdoc) und laedt
     danach neu. Deshalb wird in Ruhe weiter nachgesehen, statt einmal zu
     versuchen. Nur unter ?ptdom=1, also kein Dauerlauf im Normalbetrieb. */
  function wacheStarten() {
    zoomWacheStarten();
    anmelden();
    var rahmen = document.querySelector('.pt-widget-wrapper iframe');
    if (rahmen) rahmen.addEventListener('load', function () { beobachtet = null; anmelden(); });
    setInterval(anmelden, 1000);
  }

  function modalBericht() {
    var z = [];
    function schreib(s) { z.push(s); }
    schreib('PTDOM MODAL  ' + new Date().toLocaleTimeString('de-DE'));
    schreib('Fenster ' + window.innerWidth + 'x' + window.innerHeight +
            '  scrollY ' + Math.round(window.scrollY || 0) +
            '  dpr ' + (window.devicePixelRatio || 1));

    var rahmen = document.querySelector('.pt-widget-wrapper iframe');
    if (rahmen) {
      var rb = rahmen.getBoundingClientRect();
      schreib('Rahmen jetzt  top=' + Math.round(rb.top) + '  ' +
              Math.round(rb.width) + 'x' + Math.round(rb.height));
    } else {
      schreib('KEIN iframe gefunden.');
    }
    schreib('Beobachter ' + (beobachtet ? 'AKTIV' : 'NICHT aktiv'));
    if (!beobachtet) {
      schreib('  Einwilligung erteilt? Widget geladen? Erst dann greift er.');
    }
    schreib('Ereignisse: ' + modalLog.length + (modalLog.length >= MODAL_MAX ? ' (Deckel erreicht)' : ''));
    if (!modalLog.length) {
      schreib('');
      schreib('Noch nichts erfasst. Im Widget einen Termin antippen,');
      schreib('warten bis Dialog oder Kringel erscheint, dann erneut MODAL.');
      return z.join('\n');
    }

    for (var i = 0; i < modalLog.length; i++) {
      var e = modalLog[i];
      schreib('');
      schreib('[' + (i + 1) + '] ' + e.art + '  ' + e.zeit + '   (' + e.grund + ')');
      schreib('    <' + e.tag + '> in <' + e.eltern + '>');
      schreib('    class="' + String(e.klassen).slice(0, 90) + '"');
      schreib('    ' + e.aria);
      schreib('    position=' + e.position + '  z-index=' + e.z + '  display=' + e.display);
      schreib('    im Rahmen: top=' + e.top + ' left=' + e.left +
              '  ' + e.breite + 'x' + e.hoehe);
      schreib('    Rahmen damals: top=' + e.rTop + ' ' + e.rBreite + 'x' + e.rHoehe +
              '   scrollY=' + e.scrollY + '  Fenster ' + e.innerW + 'x' + e.innerH);
      /* Die Zahl, auf die es ankommt: wo stand das Element im FENSTER?
         Rahmenoberkante plus Lage im Rahmen. Negativ heisst oberhalb der
         sichtbaren Kante - genau der gemeldete Fehler. */
      var imFenster = e.rTop + e.top;
      schreib('    >> im Fenster bei y=' + imFenster +
              (imFenster < 0 ? '  ALSO ' + Math.abs(imFenster) + 'px UEBER der Kante'
                             : '  (sichtbarer Bereich beginnt bei 0)'));
    }
    return z.join('\n');
  }

  /* ── Verdrahtung ───────────────────────────────────────────────────── */
  knopfBreite.addEventListener('click', function () {
    try { letzterText = breitenBericht(); }
    catch (e) { letzterText = 'FEHLER im Breiten-Bericht: ' + (e && e.message); }
    bericht.textContent = letzterText;
    bericht.hidden = false;
  });

  knopfModal.addEventListener('click', function () {
    try { letzterText = modalBericht(); }
    catch (e) { letzterText = 'FEHLER im Modal-Bericht: ' + (e && e.message); }
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
    if (mo) { try { mo.disconnect(); } catch (e) {} }
    if (window.visualViewport) {
      try { window.visualViewport.removeEventListener('resize', zoomMerken); } catch (e) {}
    }
    leiste.remove();
    bericht.remove();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wacheStarten);
  } else {
    wacheStarten();
  }
})();

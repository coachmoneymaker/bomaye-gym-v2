/* ═══════════════════════════════════════════════════════════════════════════
   Abo-Buchung auf der eigenen Domain
   ═══════════════════════════════════════════════════════════════════════════

   Die drei Paket-Knoepfe fuehrten auf backoffice.bsport.io - die Adresszeile
   verliess bomayegym.com. Stattdessen oeffnet ein Klick jetzt das
   Subscription-Widget in einem Overlay auf der Seite und schickt Bsport die
   dokumentierte Nachricht, die das gewaehlte Paket gleich in den Warenkorb
   legt:

     window.postMessage({
       type: 'bsport:subscription:add-to-cart:contract',
       data: { contract_id: '<id>', uniqueWidgetId: '<id>' }
     }, '*')

   WARUM DAS WIDGET SICHTBAR IST UND NICHT display:none
   Bsports Beispiel zeigt einen unsichtbaren Container. Fuer eine Zahlung ist
   das die falsche Wahl: von hier aus ist weder die Doku lesbar noch das
   Backoffice einsehbar noch das Widget testbar - intercom.help,
   backoffice.bsport.io und cdn.bsport.io sind alle nicht erreichbar. Ob
   45432/45433/45434 wirklich contract_ids im Sinne dieser Nachricht sind,
   ist damit UNBESTAETIGT. Waere das Widget unsichtbar, wuerde eine falsche
   ID still das falsche Produkt in den Warenkorb legen. Sichtbar kann das
   nicht passieren: der Kunde sieht Paket und Preis in Bsports eigener
   Oberflaeche, bevor er bestaetigt. Greift die Nachricht nicht, waehlt er
   einmal selbst - der Rueckfallweg, der ohnehin freigegeben war.

   ───────────────────────────────────────────────────────────────────────────
   WARUM EARLY BIRD AUF DER LISTE LANDETE (Meldung vom 02.11.)
   ───────────────────────────────────────────────────────────────────────────
   Gemeldet: EARLY BIRD SICHERN (Unlimited, 45433) oeffnete das Overlay mit
   der GANZEN Early-Bird-Liste. FLEX STARTEN (59649) sprang dagegen direkt in
   das Formular des Pakets, in einem Browser mit aktiver Bsport-Sitzung.

   Die Abbruchbedingung des Sendens war zu frueh:

     hatInhalt = behaelter.children.length > 0
     if (hatInhalt && ++nachInhalt >= 2) return

   children.length > 0 ist wahr, sobald Bsport sein erstes <div> einhaengt -
   also sobald das Widget MONTIERT ist, nicht sobald es BEREIT ist. Zwei
   Runden spaeter war Schluss, bei 500 ms Abstand also rund eine Sekunde nach
   dem Klick: von zwoelf vorgesehenen Versuchen wurden regelmaessig drei
   verbraucht. Wer laenger braucht - Liste nachladen, Anmeldestand pruefen,
   langsames Netz, kaltes CDN -, bekam die Nachricht nie zu sehen und blieb
   auf der Vorgabeansicht des Widgets: der Liste. Wer schneller bereit war,
   sah den Deeplink wirken. Genau diese Zweiteilung wurde gemeldet.

   WAS DARAUS NICHT FOLGT
   Dass die Nachricht bei 45433 ueberhaupt greift, ist damit nicht bewiesen.
   Moeglich bleibt, dass die Early-Bird-IDs im Sinne dieser Nachricht keine
   contract_ids sind. Beides laesst sich von hier aus nicht trennen, weil
   cdn.bsport.io und backoffice.bsport.io nicht erreichbar sind. Darum tut
   diese Datei zwei Dinge statt einem: sie schickt die Nachricht robust nach,
   UND sie nennt dem Besucher sichtbar das gewaehlte Paket samt Direktweg zur
   Kasse. Der zweite Weg braucht keine Annahme ueber Bsports Inneres.

   SO WIRD JETZT GESENDET
     - alle 300 ms, bis zu 15 s lang, solange das Overlay offen ist
     - zusaetzlich bei jeder Neuzeichnung im Container (MutationObserver):
       jede Neuzeichnung ist eine neue Gelegenheit, dass ein Hoerer steht
     - zusaetzlich sofort, wenn ueberhaupt eine bsport:*-Nachricht eintrifft
     - Schluss bei: Overlay zu, 15 s um, oder Besucher tippt im Overlay
   Der letzte Punkt ist der wichtige: waehlt der Besucher dort selbst ein
   anderes Paket, darf ihm das Nachschicken nicht hineinreden.

   DER SICHTBARE STREIFEN
   Oben im Overlay steht eine Zeile: das gewaehlte Paket (aus data-item-name
   des geklickten Knopfes) und ein Link DIREKT ZUR KASSE auf

     https://backoffice.bsport.io/checkout/5473/subscription/<id>?force=true

   Diese Adresse ist nicht geraten. Die Flex-Pakete tragen sie seit PR #170
   als href, vom Eigentuemer geliefert; die Early-Bird-Pakete trugen genau
   dieselbe Form bis Commit 2e33108 als href auf allen drei Seiten (siehe
   Git-Verlauf zu 45433). Fuer alle sechs IDs ist sie also belegt.

   Der Streifen nennt immer nur EIN Paket, naemlich das geklickte. Er baut
   nie eine Liste. Verborgene Flex-Pakete koennen dort nicht auftauchen.

   DER RUECKFALL OHNE OVERLAY
   Fehlt die ID, fehlt das Overlay oder fehlt MountBsportWidget, wird der
   Klick nicht mehr abgefangen. Stattdessen oeffnet die Kasse des Pakets in
   einem neuen Tab (opener gekappt). Laesst der Browser das Fenster nicht zu,
   bleibt es beim gewoehnlichen href - wie ohne JavaScript.

   DIAGNOSEMODUS ?abo=kasse
   Damit zeigt das Overlay statt des Widgets die Kassenseite des Pakets in
   einem iframe - der einzige Weg, der ohne jede Annahme ueber Bsports
   Nachrichten auf GENAU ein Paket zeigt. Ob backoffice.bsport.io sich
   einbetten laesst, ist von hier aus nicht pruefbar (X-Frame-Options,
   Content-Security-Policy). Darum ein Schalter und nicht die Vorgabe: auf
   der Vorschau ist das in einer Minute beantwortet. Bleibt das Feld leer,
   laesst Bsport das Einbetten nicht zu und der Schalter ist erledigt.

   DIAGNOSE
   ?bsdebug=1 protokolliert unter [bomaye-abo], was gesendet wurde und was
   Bsport zurueckmeldet.

   DIALOGMODUS: 1 IST DER STANDARD, ?dm=3 IST DER RUECKWEG
   Das Abo-Widget laeuft mit dialogMode 1 - also mit Bsports EIGENEM
   Dialog, so wie /probetraining und /stundenplan es fahren. Mit ?dm=3
   kommt der alte Ablauf zurueck (dialogMode 3, Bsports Dialog aus).
   Jeder andere Wert und kein Parameter bedeuten 1.

   WARUM 1 GEWONNEN HAT
   Auf dem iPhone scrollt ein Wisch nicht, der mitten auf dem Formular
   beginnt: der Rahmen ist so hoch wie sein Inhalt, gescrollt wird
   ausserhalb, und iOS reicht eine Beruehrung, die auf einem fremden
   Rahmen beginnt, nicht an den Elternteil weiter (Lehre aus #104). Mit
   dialogMode 1 deckelt Bsport die Hoehe seines Rahmens selbst, und
   gescrollt wird INNEN - dort funktioniert derselbe Wisch.

   Der Eigentuemer hat 1 auf echten Geraeten durchgespielt, iPhone Safari
   und Android Chrome, abgemeldet und mit Testkonto: Anmeldung und
   Registrierung scrollen aus der Mitte, der Detailschirm ist vollstaendig
   erreichbar (PR #148), Bsports X schliesst unser Overlay (PR #149).
   Mit 3 war der Ablauf sichtbar schlechter.

   Der Schalter wird nirgends gemerkt: kein Speicher, kein Cookie. Er
   steht in der Adresse und sonst nirgends.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PREFIX   = '[bomaye-abo]';
  var NACHRICHT = 'bsport:subscription:add-to-cart:contract';
  var TAKT     = 300;      /* ms zwischen zwei Sendungen */
  var FENSTER  = 15000;    /* ms, danach ist Schluss */
  var MIN_ABSTAND = 100;   /* ms, damit eine Zeichensalve nicht Dutzende sendet */

  /* Die Kasse EINES Pakets. Belegte Form, siehe Kopf der Datei: die
     Flex-Knoepfe tragen sie als href, die Early-Bird-Knoepfe trugen sie
     bis Commit 2e33108. companyId steht schon im Mount darunter. */
  var KASSE = 'https://backoffice.bsport.io/checkout/5473/subscription/%ID%?force=true';

  /* Bsports eigenes Anmelde- und Profilfenster bei dialogMode 1. Belegt
     im Repository sind nur __container und __iframe. */
  var FREMD_FENSTER = '.bsport-user-interaction-modal__container,'
                    + ' [class*="bsport-user-interaction-modal__container"]';
  /* Breit gefasst, weil der Name des Schliessen-Knopfes nirgends belegt
     ist. Siehe die ausfuehrliche Begruendung bei der Verdrahtung. */
  var SCHLIESSER = '[class*="closeIcon"], [class*="CloseIcon"],'
                 + ' [class*="close"], [class*="Close"],'
                 + ' [aria-label*="close" i], [aria-label*="schlie" i]';

  var einst = null;       /* Einstellungen der Seite */
  var montiert = false;
  var scrollY = 0;
  var lauf = null;        /* der laufende Deeplink-Lauf, siehe laufStarten */

  function debug() {
    try {
      var v = new URLSearchParams(window.location.search).get('bsdebug');
      return !!v && v !== '0' && v !== 'false';
    } catch (e) { return false; }
  }
  /* 1 = DIALOG_MODE_IFRAME, 3 = DIALOG_MODE_DEACTIVATED. Belegt aus
     Bsports eigenem Paket @bsport/common, siehe probetraining-page.js.

     1 ist der Standard. NUR ?dm=3 bringt den alten Ablauf zurueck; jeder
     andere Wert und kein Parameter bedeuten 1. Auch der Fehlerfall faellt
     deshalb auf 1 zurueck - laesst sich die Adresse nicht lesen, soll der
     geprueftere Weg laufen, nicht der verworfene.

     Diese eine Funktion ist die einzige Stelle, die den Parameter liest.
     Wer wissen will, welcher Modus gilt, ruft sie - sonst laufen
     Konfiguration und Hoerer irgendwann auseinander. */
  function dialogModus() {
    try {
      var v = new URLSearchParams(window.location.search).get('dm');
      return v === '3' ? 3 : 1;
    } catch (e) { return 1; }
  }

  /* ?abo=kasse: Kassenseite im iframe statt Widget. Reiner Diagnoseweg,
     siehe Kopf der Datei. Vorgabe ist aus. */
  function kasseModus() {
    try {
      return new URLSearchParams(window.location.search).get('abo') === 'kasse';
    } catch (e) { return false; }
  }

  function kasse(contractId) {
    return KASSE.replace('%ID%', encodeURIComponent(String(contractId)));
  }

  var spurAn = false;

  function spur() {
    if (!spurAn) return;
    var a = Array.prototype.slice.call(arguments);
    a.unshift(PREFIX);
    /* eslint-disable no-console */
    console.log.apply(console, a);
  }

  /* ── Overlay ────────────────────────────────────────────────────────────── */
  function overlay() { return document.getElementById(einst.modalId); }

  /* bsport-modal-open ist die Klasse, an der die Kopfleiste haengt
     (style.css: #header und der Block daneben fuer .mw-header). Gesetzt
     wird sie hier und nirgends sonst: sperren() und entsperren() sind die
     beiden einzigen Engstellen, durch die jedes Oeffnen und JEDES
     Schliessen laeuft - X, ESC und Klick daneben enden alle in
     schliessen(), und das ruft entsperren(). Haengenbleiben kann sie
     damit nicht. Die Dialogwache setzt dieselbe Klasse, ist auf diesen
     Seiten aber nicht geladen - es gibt keinen zweiten Schreiber. */
  var BODY_KLASSE = 'bsport-modal-open';

  function sperren() {
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.classList.add(BODY_KLASSE);
  }

  function entsperren() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.body.classList.remove(BODY_KLASSE);
    window.scrollTo(0, scrollY);
  }

  function schliessen() {
    var o = overlay();
    if (!o) return;
    laufBeenden('Overlay geschlossen');
    o.classList.remove('is-open');
    o.setAttribute('aria-hidden', 'true');
    entsperren();
    spur('Overlay geschlossen');
  }

  /* ── Der sichtbare Streifen: welches Paket, und der Direktweg ───────────
     Immer nur EIN Paket, naemlich das geklickte. Nie eine Liste - sonst
     koennten verborgene Flex-Pakete dort auftauchen.

     Gebaut wird er hier und nicht im HTML der drei Seiten: so bleibt die
     Wahrheit darueber, welches Paket gemeint ist, an genau einer Stelle. */
  function streifen(contractId, el) {
    var o = overlay();
    if (!o) return;
    var inhalt = o.querySelector('.bsport-modal-content');
    if (!inhalt) return;

    var s = document.getElementById('bomaye-abo-wahl');
    if (!s) {
      s = document.createElement('p');
      s.id = 'bomaye-abo-wahl';
      s.className = 'bomaye-abo-wahl';
      inhalt.insertBefore(s, inhalt.firstChild);
    }

    var name = (el && el.getAttribute('data-item-name')) || '';
    var teile = [];
    if (name) {
      /* Sichtbarer Text, also mit Umlaut - anders als die Kommentare. */
      teile.push('<span class="bomaye-abo-wahl__text">Gew\u00E4hlt: <strong></strong></span>');
    }
    teile.push('<a class="bomaye-abo-wahl__link" target="_blank" rel="noopener">'
             + 'Direkt zur Kasse</a>');
    s.innerHTML = teile.join('');

    /* Der Name kommt aus dem Dokument, wird aber nicht als HTML gesetzt. */
    if (name) { s.querySelector('strong').textContent = name; }
    s.querySelector('a').setAttribute('href', kasse(contractId));
  }

  /* ── Widget montieren (erst beim ersten Klick) ──────────────────────────── */
  function montieren() {
    if (montiert) return;
    var ziel = document.getElementById(einst.containerId);
    if (!ziel) { spur('FEHLER: Container', einst.containerId, 'fehlt'); return; }
    if (typeof window.MountBsportWidget !== 'function') {
      spur('FEHLER: MountBsportWidget fehlt - Bsport-Loader nicht eingebunden?');
      return;
    }
    montiert = true;
    spur('montiere Subscription-Widget in', einst.containerId,
         '| uniqueWidgetId =', einst.uniqueWidgetId);
    window.MountBsportWidget({
      parentElement:   einst.containerId,
      companyId:       5473,
      franchiseId:     null,
      /* 1 = DIALOG_MODE_IFRAME, Bsports eigener Dialog, ist der Standard.
         Mit ?dm=3 steht hier 3 - siehe den Abschnitt DIALOGMODUS oben.
         Alle uebrigen Schluessel sind in beiden Faellen dieselben.

         Die alte Begruendung fuer 3 lautete: mit 1 legte Bsport seinen
         Dialog in ein iframe, Beruehrungen landeten in einem fremden
         Dokument, und das Scrollen auf iOS sei kaputt (WebKit 149264).
         Das war eine Vorhersage, keine Messung - zuerst auf
         /probetraining in PR #133 widerlegt, jetzt auch hier: der
         Eigentuemer hat 1 auf iPhone und Android durchgespielt. */
      dialogMode:      dialogModus(),
      widgetType:      'subscription',
      showFab:         false,
      fullScreenPopup: false,
      styles:          undefined,
      uniqueWidgetId:  einst.uniqueWidgetId,
      config:          { subscription: { uniqueWidgetId: einst.uniqueWidgetId } }
    });
  }

  /* ?abo=kasse: die Kassenseite EINES Pakets, ohne Widget und ohne
     Nachricht. Diagnoseweg, siehe Kopf der Datei. */
  function kasseRahmen(contractId) {
    var ziel = document.getElementById(einst.containerId);
    if (!ziel) { spur('FEHLER: Container', einst.containerId, 'fehlt'); return; }
    var alt = ziel.querySelector('iframe[data-abo-kasse]');
    var url = kasse(contractId);
    if (alt) { if (alt.getAttribute('src') !== url) alt.setAttribute('src', url); return; }
    var f = document.createElement('iframe');
    f.setAttribute('data-abo-kasse', '');
    f.setAttribute('src', url);
    f.setAttribute('title', 'Kasse');
    f.setAttribute('frameborder', '0');
    f.className = 'bomaye-abo-kasse';
    ziel.appendChild(f);
    spur('?abo=kasse: Kassenseite eingebettet:', url);
  }

  /* ── Die Nachricht senden ───────────────────────────────────────────────── */
  function senden(contractId) {
    var nutzlast = {
      type: NACHRICHT,
      data: { contract_id: String(contractId), uniqueWidgetId: einst.uniqueWidgetId }
    };

    /* An das eigene Fenster: das Widget laeuft in unserem Dokument und hoert
       dort. window.parent ist im obersten Rahmen dasselbe Fenster - Bsports
       Beispiel steht in einem iframe, unser Knopf nicht. Zusaetzlich an JEDES
       iframe im Dokument, nicht nur an die im Container: wo das Widget seine
       Oberflaeche baut, ist nicht belegt, und postMessage kann von sich aus
       nichts ausloesen ausser einem Ereignis - mehrere Empfaenger sind daher
       unbedenklich. */
    var ziele = 0;
    try { window.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
    }
    if (window.top && window.top !== window && window.top !== window.parent) {
      try { window.top.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
    }
    var rahmen = document.querySelectorAll('iframe');
    for (var i = 0; i < rahmen.length; i++) {
      try { rahmen[i].contentWindow.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
    }
    spur('gesendet an', ziele, 'Ziel(e):', JSON.stringify(nutzlast));
  }

  /* ── Nachschicken, bis einer zuhoert ───────────────────────────────────────
     Die alte Fassung hoerte zwei Runden nach dem ersten Kindknoten auf -
     also rund eine Sekunde nach dem Klick, lange bevor Bsports Oberflaeche
     fertig war. Das war die Ursache der Meldung; siehe Kopf der Datei.

     Jetzt gilt: Takt plus jede Neuzeichnung plus jede eingehende
     bsport-Nachricht, gedeckelt auf FENSTER Millisekunden, und sofort
     Schluss, wenn der Besucher im Overlay selbst etwas tippt. Der letzte
     Punkt ist kein Detail: ohne ihn redete das Nachschicken einem
     Besucher hinein, der sich dort gerade fuer ein anderes Paket
     entscheidet. */
  function laufBeenden(grund) {
    if (!lauf) return;
    var l = lauf;
    lauf = null;
    clearTimeout(l.uhr);
    if (l.beobachter) { l.beobachter.disconnect(); }
    spur('Deeplink beendet:', grund, '| Sendungen:', l.anzahl);
  }

  function nachschicken(l) {
    if (lauf !== l) return;
    var jetzt = Date.now();
    if (jetzt > l.bis) { laufBeenden('Fenster abgelaufen'); return; }
    if (jetzt - l.zuletzt < MIN_ABSTAND) return;
    l.zuletzt = jetzt;
    l.anzahl++;
    senden(l.id);
  }

  function laufStarten(contractId) {
    laufBeenden('neuer Lauf');
    var l = { id: String(contractId), anzahl: 0, zuletzt: 0, uhr: null,
              beobachter: null, bis: Date.now() + FENSTER };
    lauf = l;

    (function runde() {
      if (lauf !== l) return;
      if (Date.now() > l.bis) { laufBeenden('Fenster abgelaufen'); return; }
      nachschicken(l);
      l.uhr = setTimeout(runde, TAKT);
    }());

    /* Jede Neuzeichnung im Container ist eine neue Gelegenheit, dass
       gerade jetzt ein Hoerer steht. Unsere eigenen Sendungen aendern
       den Container nicht, es gibt also keine Rueckkopplung. */
    var behaelter = document.getElementById(einst.containerId);
    if (behaelter && window.MutationObserver) {
      l.beobachter = new MutationObserver(function () { nachschicken(l); });
      l.beobachter.observe(behaelter, { childList: true, subtree: true });
    }
  }

  /* ── Oeffnen ────────────────────────────────────────────────────────────── */
  function oeffnen(contractId, el) {
    if (!einst) { return; }
    var o = overlay();
    if (!o) { spur('FEHLER: Overlay', einst.modalId, 'fehlt'); return; }
    spur('oeffne fuer contract_id =', contractId);
    o.classList.add('is-open');
    o.setAttribute('aria-hidden', 'false');
    sperren();
    streifen(contractId, el);
    if (kasseModus()) { kasseRahmen(contractId); return; }
    montieren();
    laufStarten(contractId);
  }

  /* Alles da, was das Overlay braucht? Sonst uebernimmt der Rueckfall. */
  function bereit(contractId) {
    if (!contractId) return false;
    if (!overlay()) return false;
    if (kasseModus()) return true;
    return typeof window.MountBsportWidget === 'function';
  }

  /* ── Verdrahtung ────────────────────────────────────────────────────────── */
  function init(einstellungen) {
    einst  = einstellungen;
    spurAn = debug();

    /* Klicks auf alles mit data-abo-contract abfangen - aber nur, wenn das
       Overlay das Paket wirklich zeigen kann. Kann es das nicht, bleibt der
       Klick ein Klick: dann oeffnet die Kasse DIESES Pakets in einem neuen
       Tab, und laesst der Browser auch das nicht zu, greift das href der
       Seite. Ausgestiegen wird damit nie ins Leere. */
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-abo-contract]') : null;
      if (!el) return;
      var id = el.getAttribute('data-abo-contract');

      if (!bereit(id)) {
        if (id) {
          var w = null;
          /* Ohne "noopener" im dritten Argument, weil der Rueckgabewert
             sonst null ist und wir nicht erkennen koennten, ob das Fenster
             aufging. Gekappt wird der opener gleich danach. */
          try { w = window.open(kasse(id), '_blank'); } catch (err) {}
          if (w) {
            try { w.opener = null; } catch (err2) {}
            e.preventDefault();
            spur('Rueckfall: Kasse im neuen Tab, contract', id);
            return;
          }
        }
        spur('Rueckfall: gewoehnlicher Link (href), contract', id || '(fehlt)');
        return;   /* kein preventDefault - das href der Seite uebernimmt */
      }

      e.preventDefault();
      oeffnen(id, el);
    });

    var o = overlay();
    if (o) {
      o.addEventListener('click', function (e) {
        if (e.target === o || (e.target.closest && e.target.closest('[data-abo-close]'))) {
          schliessen();
        }
      });
      /* Tippt oder tastet der Besucher im Overlay, hoert das Nachschicken
         auf. Seine eigene Wahl wiegt mehr als unsere Abkuerzung. Klicks in
         einem fremden iframe erreichen uns nie - dort greift dafuer das
         Zeitfenster. */
      o.addEventListener('pointerdown', function () {
        laufBeenden('Besucher tippt im Overlay');
      }, true);
      o.addEventListener('keydown', function () {
        laufBeenden('Besucher tastet im Overlay');
      }, true);
    }
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && o && o.classList.contains('is-open')) {
        schliessen();
      }
    });

    /* ── Das X von Bsports Anmeldefenster schliesst auch unser Overlay ──
       Mit dialogMode 1 legt Bsport sein eigenes Fenster
       (.bsport-user-interaction-modal__container, z-index 1300) ueber
       unseres. Wer dort auf das X tippt, schloss bisher nur dieses Fenster
       und landete auf der Tarifliste dahinter - einem Schritt, der im
       Ablauf erst NACH der Anmeldung kommt. Jetzt geht unser Overlay mit
       zu und der Besucher steht wieder auf der Seite.

       NUR EIN KLICK, KEIN BEOBACHTER
       Verschwindet das Fenster von selbst - nach erfolgreicher Anmeldung,
       wenn Bsport zur Vertragsansicht oder zur Kasse weitergeht -, bleibt
       unser Overlay offen. Genau deshalb wird hier auf das Tippen gehoert
       und nicht auf das Verschwinden des Knotens.

       DER SELEKTOR IST NICHT BELEGT
       Im Repository steht zu diesem Fenster nur __container und __iframe.
       Wie der Schliessen-Knopf heisst, ist nirgends festgehalten. Darum
       wird breit gesucht: irgendetwas mit close im Klassennamen oder ein
       aria-label, das nach Schliessen klingt, UND innerhalb des Fensters.
       Das Formular selbst steckt in einem fremden iframe, dessen Klicks
       uns nie erreichen - anklickbar ist in unserem Dokument also nur
       Bsports eigene Leiste. Trifft der Selektor daneben, passiert
       schlicht nichts und es bleibt beim heutigen Verhalten.

       NICHT ABGEFANGEN
       Kein preventDefault, kein stopPropagation: Bsports eigener Hoerer
       soll laufen und aufraeumen. Geschlossen wird erst im naechsten Takt
       (setTimeout 0), weil unser Overlay beim Schliessen display:none
       bekommt - laege Bsports Fenster darin, waere es sonst mitten im
       eigenen Handler verschwunden. */
    if (dialogModus() === 1) {
      document.addEventListener('click', function (e) {
        var auf = overlay();
        if (!auf || !auf.classList.contains('is-open')) return;
        var ziel = e.target;
        if (!ziel || typeof ziel.closest !== 'function') return;
        var fenster = ziel.closest(FREMD_FENSTER);
        if (!fenster) return;
        var knopf = ziel.closest(SCHLIESSER);
        if (!knopf || !fenster.contains(knopf)) return;
        spur('X im Bsport-Anmeldefenster getippt - Overlay geht mit zu');
        setTimeout(schliessen, 0);
      }, true);
    }

    /* Eine eingehende bsport-Nachricht ist der einzige harte Beleg, dass
       auf der anderen Seite ueberhaupt jemand lebt. Dann sofort noch
       einmal nachschicken, statt auf den naechsten Takt zu warten. */
    window.addEventListener('message', function (e) {
      var t = e && e.data && e.data.type;
      if (typeof t !== 'string' || t.indexOf('bsport') !== 0 || t === NACHRICHT) return;
      if (lauf) { nachschicken(lauf); }
      spur('Antwort von Bsport:', t, JSON.stringify(e.data).slice(0, 300));
    });

    spur('bereit | Knoepfe:', document.querySelectorAll('[data-abo-contract]').length);
  }

  window.bomayeAbo = { init: init, oeffnen: oeffnen, schliessen: schliessen };
}());

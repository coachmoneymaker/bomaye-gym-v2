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

   ───────────────────────────────────────────────────────────────────────────
   DAS FLIMMERN (Meldung zu PR #175) UND WARUM ES JETZT DREI SENDUNGEN SIND
   ───────────────────────────────────────────────────────────────────────────
   PR #175 sendete im Takt von 300 ms ueber 15 s, zusaetzlich bei jeder
   Neuzeichnung im Container und zusaetzlich bei jeder eingehenden
   bsport-Nachricht. Gemeldet wurde daraufhin: abgemeldete Besucher sahen die
   Anmeldeansicht des Widgets endlos flackern, mit rohen
   Uebersetzungsschluesseln (signin.connection, ACTIONS.SIGNIN,
   actions.forgottenPassword). Angemeldete merkten nichts.

   Der Kommentar in PR #175 behauptete, unsere Sendungen aenderten den
   Container nicht, es gebe also keine Rueckkopplung. Das war falsch. Das
   Widget ZEICHNET auf eine Nachricht hin neu; bei abgemeldeten Besuchern ist
   diese Neuzeichnung die Anmeldemaske. Neuzeichnung loeste die naechste
   Sendung aus, die Antwort des Widgets ebenso - zwei Schleifen zugleich.

   SO WIRD JETZT GESENDET
     - gewartet wird, bis das Widget zum ersten Mal selbst etwas zeichnet,
       hoechstens 8 s. Das heilt den Grund der ersten Meldung (die Nachricht
       kam frueher an, als ueberhaupt jemand zuhoerte), ohne im Takt zu senden
     - dann genau drei Sendungen: 500 ms, 1500 ms, 3500 ms - und aus
     - der MutationObserver sendet NIE. Er schaut nur hin und beendet
     - Schluss bei: Anmeldeansicht sichtbar, erster bsport-Antwort nach
       unserer ersten Sendung, Flimmerbremse (mehr als 20 Aenderungen in
       einer Sekunde nach einer Sendung), Besucher tippt im Overlay,
       Overlay zu
     - gesendet wird an window, window.parent und die Rahmen IM OVERLAY,
       nicht mehr an jedes iframe des Dokuments

   DER PREIS, UND WARUM ER RICHTIG IST
   Zeichnet das Widget erst nach acht Sekunden, bekommt es nichts mehr, und
   der Besucher sieht die Liste. Eine Liste ist aergerlich. Eine flackernde
   Anmeldemaske mit rohen Uebersetzungsschluesseln ist schlimmer, und der
   sichtbare Streifen fuehrt in beiden Faellen direkt zum richtigen Paket.

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
  /* HOECHSTENS DREI SENDUNGEN, mit wachsendem Abstand, gezaehlt ab dem
     Augenblick, in dem das Widget zum ersten Mal etwas zeichnet. Mehr nicht
     - siehe den Abschnitt FLIMMERN im Kopf der Datei. */
  var SENDEPLAN   = [500, 1500, 3500];
  var WARTEN_MAX  = 8000;  /* ms Geduld, bis das Widget ueberhaupt zeichnet */
  var WARTE_TAKT  = 200;   /* ms zwischen zwei Blicken in den Container */
  /* Flimmerbremse: so viele Aenderungen in diesem Zeitfenster nach einer
     Sendung, und es wird nicht mehr gesendet. Faengt auch den Fall, den
     kein Selektor trifft. */
  var FLIMMER_FENSTER = 1000;
  var FLIMMER_GRENZE  = 20;

  /* Die Kasse EINES Pakets. Belegte Form, siehe Kopf der Datei: die
     Flex-Knoepfe tragen sie als href, die Early-Bird-Knoepfe trugen sie
     bis Commit 2e33108. companyId steht schon im Mount darunter. */
  var KASSE = 'https://backoffice.bsport.io/checkout/5473/subscription/%ID%?force=true';

  /* Bsports eigenes Anmelde- und Profilfenster bei dialogMode 1. Belegt
     im Repository sind nur __container und __iframe. */
  var FREMD_FENSTER = '.bsport-user-interaction-modal__container,'
                    + ' [class*="bsport-user-interaction-modal__container"]';
  /* Die Anmelde- oder Registrierungsansicht des Widgets. Taucht sie auf,
     wird nicht mehr gesendet: genau dort entstand das Flimmern.

     Belegt ist im Repository nur __container. Der Rest ist bewusst breit
     geraten, denn ein Fehlalarm kostet hier nichts: dann bleibt es beim
     Verhalten von vor dieser Datei, der Besucher waehlt einmal selbst.
     Ein uebersehener Treffer dagegen kostet das Flimmern. */
  var ANMELDEN = '.bsport-user-interaction-modal__container,'
               + ' [class*="bsport-user-interaction-modal"],'
               + ' [class*="signin" i], [class*="sign-in" i],'
               + ' [class*="signup" i], [class*="sign-up" i],'
               + ' [class*="login" i], [class*="log-in" i],'
               + ' [class*="connection" i], [class*="password" i],'
               + ' input[type="password"]';
  /* Die rohen Uebersetzungsschluessel aus der Meldung vom 02.11. plus die
     Woerter, die eine Anmeldemaske in beiden Sprachen traegt. */
  var ANMELDE_TEXT = /signin\.|actions?\.signin|forgottenpassword|passwort|password|anmelden|einloggen|registrieren|sign in|log in/i;

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
       Beispiel steht in einem iframe, unser Knopf nicht. Dazu die Rahmen IM
       OVERLAY, falls das Widget seine Oberflaeche dort baut.

       Nicht mehr an jedes iframe des Dokuments: das war in PR #175 zu breit
       gefasst. Fremde Rahmen anderswo auf der Seite haben mit der Buchung
       nichts zu tun, und je mehr Empfaenger, desto mehr Stellen, die auf
       eine Nachricht hin neu zeichnen koennen. */
    var ziele = 0;
    try { window.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
    }
    var auf = overlay();
    var rahmen = auf ? auf.querySelectorAll('iframe') : [];
    for (var i = 0; i < rahmen.length; i++) {
      try { rahmen[i].contentWindow.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
    }
    spur('gesendet an', ziele, 'Ziel(e):', JSON.stringify(nutzlast));
  }

  /* ── Der Sendelauf ────────────────────────────────────────────────────────
     Erste Fassung (vor PR #175): zwei Runden nach dem ersten Kindknoten war
     Schluss, also rund eine Sekunde nach dem Klick - zu frueh, das Widget war
     da oft noch nicht bereit. Das war die Ursache der Listenansicht.

     Zweite Fassung (PR #175): Takt von 300 ms ueber 15 s, PLUS eine Sendung
     bei jeder Neuzeichnung, PLUS eine bei jeder eingehenden bsport-Nachricht.
     Das war die Ursache des Flimmerns. Die Annahme im Kommentar, unsere
     Sendungen aenderten den Container nicht, war falsch: das Widget ZEICHNET
     auf eine Nachricht hin neu. Bei abgemeldeten Besuchern ist diese
     Neuzeichnung die Anmeldemaske - und die loeste die naechste Sendung aus.
     Rueckkopplung.

     Diese Fassung sendet HOECHSTENS DREIMAL und niemals als Antwort auf
     etwas, das das Widget tut:

       - die Uhr laeuft erst, wenn das Widget zum ersten Mal etwas zeichnet
         (hoechstens WARTEN_MAX gewartet); damit bleibt der Grund der ersten
         Meldung geheilt, ohne dass im Takt gesendet wird
       - dann SENDEPLAN: 500 ms, 1500 ms, 3500 ms - und aus
       - der Beobachter sendet NIE. Er schaut nur hin und beendet den Lauf
       - Schluss bei: Anmeldemaske sichtbar, erster bsport-Nachricht nach
         unserer ersten Sendung, zu vielen Aenderungen (Flimmerbremse),
         Besucher tippt im Overlay, Overlay zu

     Der Preis dieser Fassung ist bekannt und gewollt: zeichnet das Widget
     erst nach WARTEN_MAX, bekommt es nichts mehr und der Besucher sieht die
     Liste. Eine Liste ist aergerlich, eine flackernde Anmeldemaske mit
     rohen Uebersetzungsschluesseln ist schlimmer. */
  function laufBeenden(grund) {
    if (!lauf) return;
    var l = lauf;
    lauf = null;
    clearTimeout(l.uhr);
    clearInterval(l.warteUhr);
    if (l.beobachter) { l.beobachter.disconnect(); }
    spur('Deeplink beendet:', grund, '| Sendungen:', l.anzahl);
  }

  /* Kinder, die vom Widget stammen. Der Hinweis von bsport-gate.js zaehlt
     nicht: er steht schon da, bevor ueberhaupt etwas geladen wird. */
  function hatWidgetInhalt(behaelter) {
    if (!behaelter) return false;
    var k = behaelter.children;
    for (var i = 0; i < k.length; i++) {
      if (!/bomaye-consent-gate/.test(k[i].className || '')) return true;
    }
    return false;
  }

  /* Zeigt der Container gerade eine Anmelde- oder Registrierungsansicht?
     Erst der Selektor, dann der Text - der Text, weil die Meldung vom 02.11.
     rohe Schluessel wie "signin.connection" zeigte, also eine Ansicht, deren
     Klassennamen wir nicht kennen muessen, um sie zu erkennen. */
  function zeigtAnmeldung(behaelter) {
    if (!behaelter) return false;
    try { if (behaelter.querySelector(ANMELDEN)) return true; } catch (e) {}
    if (document.querySelector('.bsport-user-interaction-modal__container')) return true;
    var t = '';
    try { t = (behaelter.textContent || '').slice(0, 2000); } catch (e) {}
    return ANMELDE_TEXT.test(t);
  }

  function senden1(l) {
    if (lauf !== l) return;
    l.anzahl++;
    l.letzteSendung = Date.now();
    senden(l.id);
  }

  /* Der naechste Punkt aus SENDEPLAN, gemessen ab dem ersten Inhalt. */
  function planen(l) {
    if (lauf !== l) return;
    if (l.schritt >= SENDEPLAN.length) { laufBeenden('Sendeplan abgearbeitet'); return; }
    var vorher = l.schritt === 0 ? 0 : SENDEPLAN[l.schritt - 1];
    var wartet = SENDEPLAN[l.schritt] - vorher;
    l.schritt++;
    l.uhr = setTimeout(function () {
      if (lauf !== l) return;
      var behaelter = document.getElementById(einst.containerId);
      if (zeigtAnmeldung(behaelter)) { laufBeenden('Anmeldeansicht sichtbar'); return; }
      senden1(l);
      planen(l);
    }, wartet);
  }

  function laufStarten(contractId) {
    laufBeenden('neuer Lauf');
    var l = { id: String(contractId), anzahl: 0, schritt: 0, uhr: null,
              warteUhr: null, beobachter: null, letzteSendung: 0,
              aenderungen: [], bis: Date.now() + WARTEN_MAX };
    lauf = l;

    var behaelter = document.getElementById(einst.containerId);

    /* Der Beobachter SENDET NICHT. Er beendet nur - das ist der ganze
       Unterschied zu PR #175. */
    if (behaelter && window.MutationObserver) {
      l.beobachter = new MutationObserver(function (eintraege) {
        if (lauf !== l) return;
        if (zeigtAnmeldung(behaelter)) { laufBeenden('Anmeldeansicht sichtbar'); return; }
        /* Flimmerbremse, und zwar erst nach der ersten eigenen Sendung:
           waehrend das Widget zum ersten Mal aufbaut, darf es ruhig viel
           zeichnen. */
        if (!l.letzteSendung) return;
        var jetzt = Date.now();
        for (var i = 0; i < eintraege.length; i++) l.aenderungen.push(jetzt);
        while (l.aenderungen.length && jetzt - l.aenderungen[0] > FLIMMER_FENSTER) {
          l.aenderungen.shift();
        }
        if (l.aenderungen.length > FLIMMER_GRENZE) {
          laufBeenden('Flimmerbremse: ' + l.aenderungen.length + ' Aenderungen in '
                      + FLIMMER_FENSTER + ' ms');
        }
      });
      l.beobachter.observe(behaelter, { childList: true, subtree: true });
    }

    /* Warten, bis das Widget zum ersten Mal zeichnet. Dieser Blick ist eine
       reine Abfrage im Takt und haengt an nichts, was das Widget tut. */
    function losgehen() {
      if (lauf !== l) return;
      if (zeigtAnmeldung(behaelter)) { laufBeenden('Anmeldeansicht sichtbar'); return; }
      clearInterval(l.warteUhr);
      l.warteUhr = null;
      planen(l);
    }
    if (hatWidgetInhalt(behaelter)) { losgehen(); return; }
    l.warteUhr = setInterval(function () {
      if (lauf !== l) { clearInterval(l.warteUhr); return; }
      if (hatWidgetInhalt(behaelter)) { losgehen(); return; }
      if (Date.now() > l.bis) { laufBeenden('nichts gezeichnet in ' + WARTEN_MAX + ' ms'); }
    }, WARTE_TAKT);
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

    /* Eine eingehende bsport-Nachricht ist der harte Beleg, dass auf der
       anderen Seite jemand lebt und unsere Nachricht gehoert hat. Dann ist
       der Lauf FERTIG - nicht Anlass, noch einmal zu senden. In PR #175
       stand hier das Gegenteil, und das war die zweite Haelfte der
       Rueckkopplung: Nachricht, Neuzeichnung, Antwort, naechste Nachricht.

       Vor der ersten eigenen Sendung sagt eine Antwort nichts ueber unser
       Paket aus - dann laeuft der Plan weiter. */
    window.addEventListener('message', function (e) {
      var t = e && e.data && e.data.type;
      if (typeof t !== 'string' || t.indexOf('bsport') !== 0 || t === NACHRICHT) return;
      spur('Antwort von Bsport:', t, JSON.stringify(e.data).slice(0, 300));
      if (lauf && lauf.anzahl > 0) { laufBeenden('Bsport hat geantwortet'); }
    });

    spur('bereit | Knoepfe:', document.querySelectorAll('[data-abo-contract]').length);
  }

  window.bomayeAbo = { init: init, oeffnen: oeffnen, schliessen: schliessen };
}());

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
   das die falsche Wahl, und zwar aus einem Grund, der nichts mit Technik zu
   tun hat: wir koennen von hier aus weder die Doku lesen noch das Backoffice
   einsehen noch das Widget testen - intercom.help, backoffice.bsport.io und
   cdn.bsport.io sind alle nicht erreichbar. Ob 45432/45433/45434 wirklich
   contract_ids im Sinne dieser Nachricht sind, ist damit UNBESTAETIGT.

   Waere das Widget unsichtbar, wuerde eine falsche ID still das falsche
   Produkt in den Warenkorb legen - der Kunde zahlte fuer etwas anderes, als
   auf der Karte stand. Sichtbar kann das nicht passieren: der Kunde sieht
   Paket und Preis in Bsports eigener Oberflaeche, bevor er bestaetigt.

   Damit ist der Kurzschluss eine Abkuerzung auf einem sicheren Weg, kein
   Blindflug: greift die Nachricht, steht das richtige Paket schon im
   Warenkorb. Greift sie nicht, waehlt der Kunde einmal selbst - genau der
   Rueckfallweg, der ohnehin freigegeben war. In beiden Faellen bleibt die
   Adresszeile auf bomayegym.com.

   DIAGNOSE
   ?bsdebug=1 protokolliert unter [bomaye-abo], was gesendet wurde und was
   Bsport zurueckmeldet.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PREFIX   = '[bomaye-abo]';
  var NACHRICHT = 'bsport:subscription:add-to-cart:contract';
  var VERSUCHE = 12;      /* Sendeversuche, bis das Widget bereit ist */
  var ABSTAND  = 500;     /* ms zwischen den Versuchen */

  var einst = null;       /* Einstellungen der Seite */
  var montiert = false;
  var scrollY = 0;

  function debug() {
    try {
      var v = new URLSearchParams(window.location.search).get('bsdebug');
      return !!v && v !== '0' && v !== 'false';
    } catch (e) { return false; }
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

  function sperren() {
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  function entsperren() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
  }

  function schliessen() {
    var o = overlay();
    if (!o) return;
    o.classList.remove('is-open');
    o.setAttribute('aria-hidden', 'true');
    entsperren();
    spur('Overlay geschlossen');
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
      /* 3 = DIALOG_MODE_DEACTIVATED, wie auf /probetraining. Mit 1 legte
         Bsport seinen Dialog in ein iframe - Beruehrungen landeten dann in
         einem fremden Dokument und das Scrollen auf iOS war kaputt
         (WebKit 149264). */
      dialogMode:      3,
      widgetType:      'subscription',
      showFab:         false,
      fullScreenPopup: false,
      styles:          undefined,
      uniqueWidgetId:  einst.uniqueWidgetId,
      config:          { subscription: { uniqueWidgetId: einst.uniqueWidgetId } }
    });
  }

  /* ── Die Nachricht senden ───────────────────────────────────────────────── */
  function senden(contractId) {
    var nutzlast = {
      type: NACHRICHT,
      data: { contract_id: String(contractId), uniqueWidgetId: einst.uniqueWidgetId }
    };

    /* An das eigene Fenster: das Widget laeuft in unserem Dokument und hoert
       dort. window.parent ist im obersten Rahmen dasselbe Fenster - Bsports
       Beispiel steht in einem iframe, unser Knopf nicht. Zusaetzlich an jedes
       iframe im Container, falls das Widget seine Oberflaeche doch dort baut.
       postMessage kann von sich aus nichts ausloesen ausser einem Ereignis -
       mehrere Empfaenger sind daher unbedenklich. */
    var ziele = 0;
    try { window.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
    }
    var behaelter = document.getElementById(einst.containerId);
    if (behaelter) {
      var rahmen = behaelter.querySelectorAll('iframe');
      for (var i = 0; i < rahmen.length; i++) {
        try { rahmen[i].contentWindow.postMessage(nutzlast, '*'); ziele++; } catch (e) {}
      }
    }
    spur('gesendet an', ziele, 'Ziel(e):', JSON.stringify(nutzlast));
  }

  /* Mehrfach senden, weil das Widget erst nachlaedt. Sobald es Inhalt hat,
     noch zweimal - danach ist Schluss. */
  function sendenBisBereit(contractId) {
    var n = 0, nachInhalt = 0;
    (function runde() {
      if (n++ >= VERSUCHE) { spur('Sendeversuche aufgebraucht'); return; }
      var behaelter = document.getElementById(einst.containerId);
      var hatInhalt = behaelter && behaelter.children.length > 0;
      senden(contractId);
      if (hatInhalt && ++nachInhalt >= 2) { spur('Widget hat Inhalt, fertig gesendet'); return; }
      setTimeout(runde, ABSTAND);
    }());
  }

  /* ── Oeffnen ────────────────────────────────────────────────────────────── */
  function oeffnen(contractId) {
    if (!einst) { return; }
    var o = overlay();
    if (!o) { spur('FEHLER: Overlay', einst.modalId, 'fehlt'); return; }
    spur('oeffne fuer contract_id =', contractId);
    o.classList.add('is-open');
    o.setAttribute('aria-hidden', 'false');
    sperren();
    montieren();
    sendenBisBereit(contractId);
  }

  /* ── Verdrahtung ────────────────────────────────────────────────────────── */
  function init(einstellungen) {
    einst  = einstellungen;
    spurAn = debug();

    /* Klicks auf alles mit data-abo-contract abfangen. Das href der Knoepfe
       bleibt als Rueckfall ohne JavaScript erhalten und zeigt auf die eigene
       Domain - ausgestiegen wird also auch dann nicht. */
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-abo-contract]') : null;
      if (!el) return;
      e.preventDefault();
      oeffnen(el.getAttribute('data-abo-contract'));
    });

    var o = overlay();
    if (o) {
      o.addEventListener('click', function (e) {
        if (e.target === o || (e.target.closest && e.target.closest('[data-abo-close]'))) {
          schliessen();
        }
      });
    }
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && o && o.classList.contains('is-open')) {
        schliessen();
      }
    });

    /* Antworten von Bsport mitschreiben - nur zur Diagnose. */
    if (spurAn) {
      window.addEventListener('message', function (e) {
        var t = e && e.data && e.data.type;
        if (typeof t === 'string' && t.indexOf('bsport') === 0 && t !== NACHRICHT) {
          spur('Antwort von Bsport:', t, JSON.stringify(e.data).slice(0, 300));
        }
      });
    }

    spur('bereit | Knoepfe:', document.querySelectorAll('[data-abo-contract]').length);
  }

  window.bomayeAbo = { init: init, oeffnen: oeffnen, schliessen: schliessen };
}());

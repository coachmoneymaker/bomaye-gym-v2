/* Bomaye Gym — zentrale Sperre fuer das Bsport-Widget
 *
 * Muss als ERSTES Skript im <head> laufen, vor jedem Markup und jedem
 * Seitenskript, das Bsport laden koennte, und traegt
 * data-cookieconsent="ignore" — die Sperre selbst darf nie blockiert werden.
 *
 * WARUM
 * cdn.bsport.io/scripts/widget.js bringt RudderStack mit (rl_anonymous_id,
 * rl_session, ...). Bsport bietet keinen Schalter, um nur diesen Teil
 * abzuschalten, und aus dem fremden, minifizierten Bundle laesst er sich nicht
 * herausloesen. Ohne Marketing-Einwilligung darf deshalb ueberhaupt nichts von
 * bsport.io geladen werden (§ 25 Abs. 1 TDDDG).
 *
 * WIE
 * Statt vier Ladewege einzeln zu flicken, wird an den zwei Stellen abgefangen,
 * durch die am Ende jeder Ladeweg muss:
 *
 *   1. HTMLScriptElement.prototype.src  — deckt jedes per JS eingehaengte
 *      <script src="…bsport…"> ab (Ladeweg A: Klick-Handler, Ladeweg C:
 *      MountBsportWidget beim Seitenaufbau)
 *   2. HTMLIFrameElement.prototype.srcdoc / .src — deckt die srcdoc-iframes ab,
 *      die das Probetraining-Modal zur Laufzeit baut (Ladeweg B)
 *
 * Beide Eingriffe sind SYNCHRON: der Wert wird gar nicht erst gesetzt, es
 * entsteht also kein Request, den man hinterher noch abfangen muesste. Ein
 * MutationObserver kaeme dafuer zu spaet — er laeuft asynchron, das Laden
 * haette schon begonnen.
 *
 * Ladeweg D (statisches <iframe srcdoc> direkt im Markup) kann JavaScript
 * grundsaetzlich nicht synchron abfangen: das Attribut setzt der HTML-Parser,
 * kein Setter wird aufgerufen. Diese iframes tragen deshalb einmalig
 * data-bsport-srcdoc statt srcdoc — sie sind damit von Haus aus inert, und
 * diese Datei ist die einzige Stelle, die sie wieder scharf schaltet.
 *
 * Fail-closed: solange keine Einwilligung vorliegt, passiert nichts. Faellt
 * diese Datei aus, kommt Bsport ebenfalls nicht — dann greift keiner der
 * Ladewege, weil sie alle ueber die hier gesetzten Container laufen.
 */
(function () {
  'use strict';

  var BSPORT = /(^|[./])bsport\.io/i;
  var GATE_CLASS = 'bomaye-consent-gate';

  function isBsport(v) { return BSPORT.test(String(v == null ? '' : v)); }

  function consented() {
    var cb = window.Cookiebot;
    return !!(cb && cb.consent && cb.consent.marketing);
  }

  /* Alles, was ohne Einwilligung abgefangen wurde, wartet hier auf die
     Freigabe. */
  var blockedScripts = [];   /* { el, url } */
  var blockedFrames  = [];   /* { el, prop, value } */
  var released = false;

  /* ───────────────────── 1. script.src abfangen ───────────────────── */

  var scriptSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  if (scriptSrc && scriptSrc.set) {
    Object.defineProperty(HTMLScriptElement.prototype, 'src', {
      configurable: true,
      enumerable: scriptSrc.enumerable,
      get: function () {
        return this.__bomayeBlockedSrc || scriptSrc.get.call(this);
      },
      set: function (value) {
        if (!consented() && isBsport(value)) {
          /* Nicht setzen. Ein Script-Element ohne src laedt nichts. */
          this.__bomayeBlockedSrc = String(value);
          blockedScripts.push({ el: this, url: String(value) });
          return;
        }
        scriptSrc.set.call(this, value);
      }
    });
  }

  /* ──────────────── 2. iframe.srcdoc und iframe.src abfangen ──────────────── */

  ['srcdoc', 'src'].forEach(function (prop) {
    var d = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, prop);
    if (!d || !d.set) return;
    Object.defineProperty(HTMLIFrameElement.prototype, prop, {
      configurable: true,
      enumerable: d.enumerable,
      get: function () {
        return this['__bomayeBlocked_' + prop] || d.get.call(this);
      },
      set: function (value) {
        if (!consented() && isBsport(value)) {
          this['__bomayeBlocked_' + prop] = String(value);
          blockedFrames.push({ el: this, prop: prop, value: String(value) });
          /* Der Platzhalter kommt dorthin, wo das iframe haette stehen sollen.
             Zum Setz-Zeitpunkt haengt es oft noch nicht im DOM, deshalb wird
             der Container beim naechsten Durchlauf nachgereicht. */
          setTimeout(function () { paintAll(); }, 0);
          return;
        }
        d.set.call(this, value);
      }
    });
  });

  /* ─────────── 3. setAttribute als zweite Verteidigungslinie ─────────── */

  var setAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (!consented() && isBsport(value)) {
      var n = String(name).toLowerCase();
      var tag = this.tagName;
      if (tag === 'SCRIPT' && n === 'src') {
        this.__bomayeBlockedSrc = String(value);
        blockedScripts.push({ el: this, url: String(value) });
        return;
      }
      if (tag === 'IFRAME' && (n === 'srcdoc' || n === 'src')) {
        this['__bomayeBlocked_' + n] = String(value);
        blockedFrames.push({ el: this, prop: n, value: String(value) });
        setTimeout(function () { paintAll(); }, 0);
        return;
      }
    }
    return setAttr.call(this, name, value);
  };

  /* ───────── 4. MutationObserver als Netz fuer alles Uebersehene ───────── */

  function sweep(root) {
    if (consented() || !root || !root.querySelectorAll) return;
    var scripts = root.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      if (isBsport(scripts[i].getAttribute('src'))) {
        var u = scripts[i].getAttribute('src');
        setAttr.call(scripts[i], 'data-bomaye-blocked-src', u);
        scripts[i].removeAttribute('src');
        blockedScripts.push({ el: scripts[i], url: u });
      }
    }
    var frames = root.querySelectorAll('iframe[srcdoc], iframe[src]');
    for (var j = 0; j < frames.length; j++) {
      var f = frames[j];
      ['srcdoc', 'src'].forEach(function (p) {
        var v = f.getAttribute(p);
        if (v && isBsport(v)) {
          setAttr.call(f, 'data-bsport-' + p, v);
          f.removeAttribute(p);
          blockedFrames.push({ el: f, prop: p, value: v });
        }
      });
    }
  }

  if (typeof MutationObserver === 'function') {
    var mo = new MutationObserver(function (records) {
      if (consented()) return;
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.tagName === 'SCRIPT' && isBsport(n.getAttribute('src'))) {
            var u = n.getAttribute('src');
            setAttr.call(n, 'data-bomaye-blocked-src', u);
            n.removeAttribute('src');
            blockedScripts.push({ el: n, url: u });
          } else {
            sweep(n);
          }
        }
      }
      paintAll();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ──────────────── 4b. Cookiebot-Verfuegbarkeit und Modal ──────────────── */

  var lastFailure = null;
  var reopenModalAfterConsent = false;

  function cookiebotReady() {
    return !!(window.Cookiebot && typeof window.Cookiebot.renew === 'function');
  }

  /* Wartet, bis Cookiebot da ist. Es wird asynchron von consent.cookiebot.com
     geladen; auf einer langsamen Mobilverbindung vergehen dabei leicht mehrere
     Sekunden, in denen window.Cookiebot noch nicht existiert. */
  function whenCookiebotReady(onReady, onTimeout) {
    if (cookiebotReady()) { onReady(); return; }
    var waited = 0;
    var step = 150;
    var limit = 8000;
    var t = window.setInterval(function () {
      if (cookiebotReady()) { window.clearInterval(t); onReady(); return; }
      waited += step;
      if (waited >= limit) { window.clearInterval(t); if (onTimeout) onTimeout(); }
    }, step);
  }

  /* ── Vollflaechige Overlays wirklich aus dem Render-Tree nehmen ──
     Das Schliessen des Modals entfernt nur die Klasse .open. Das Element bleibt
     als bildschirmfuellendes position:fixed mit aktivem -webkit-backdrop-filter
     im Render-Tree stehen - visibility:hidden und opacity:0 beenden weder den
     Layer noch das Compositing. Auf dieser Seite sind das nach dem Schliessen
     gleich mehrere:

       #pt-booking-modal  z 9000  390x844  display:flex   backdrop-filter
       #family-modal      z 2100  390x844  visible,op:0   backdrop-filter
       #corporate-modal   z 2100  390x844  visible,op:0   backdrop-filter
       #mobile-nav        z  999  390x844  hidden         backdrop-filter
       #header            z 1000                          transform+backdrop-filter+isolation

     Auf iOS Safari ist genau das der bekannte Grund dafuer, dass ein danach
     geoeffneter fixed-Dialog zwar im DOM steht, aber nicht sichtbar oder nicht
     antippbar wird. display:none beendet Layer und Compositing zuverlaessig;
     backdrop-filter:none nimmt den Rest dort weg, wo das Element sichtbar
     bleiben muss (Kopfzeile). Alles wird danach wieder hergestellt. */

  var suppressed = [];

  function suppressOverlays() {
    if (suppressed.length) return;
    var all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed') continue;
      var hasLayer = (cs.backdropFilter && cs.backdropFilter !== 'none') ||
                     (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none');
      if (!hasLayer) continue;
      var r = el.getBoundingClientRect();
      var fullScreen = r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9;
      var rec = { el: el, display: el.style.display, backdrop: el.style.backdropFilter,
                  webkitBackdrop: el.style.webkitBackdropFilter };
      if (fullScreen) {
        /* Ganzflaechige Overlays komplett aus dem Render-Tree. */
        el.style.display = 'none';
      } else {
        /* Sichtbare Elemente (Kopfzeile) bleiben stehen, verlieren aber den
           Compositing-Layer. */
        el.style.backdropFilter = 'none';
        el.style.webkitBackdropFilter = 'none';
      }
      suppressed.push(rec);
    }
    /* Sicherheitsnetz: nichts darf dauerhaft unterdrueckt bleiben, auch wenn
       der Besucher den Dialog einfach wegtippt. */
    window.setTimeout(restoreOverlays, 60000);
  }

  function restoreOverlays() {
    for (var i = 0; i < suppressed.length; i++) {
      var r = suppressed[i];
      r.el.style.display = r.display || '';
      r.el.style.backdropFilter = r.backdrop || '';
      r.el.style.webkitBackdropFilter = r.webkitBackdrop || '';
    }
    suppressed = [];
  }

  /* Schliesst das Probetraining-Modal, falls es offen ist, und meldet zurueck,
     ob es wieder geoeffnet werden soll. */
  function closeBookingModal() {
    var m = document.getElementById('pt-booking-modal');
    if (!m || !m.classList.contains('open')) return false;
    if (typeof window.ptCloseModal === 'function') {
      try { window.ptCloseModal(); return true; } catch (e) {}
    }
    /* Notfalls von Hand, damit der Body-Scroll-Lock auf keinen Fall stehen bleibt. */
    m.classList.remove('open');
    document.body.classList.remove('pt-modal-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    return true;
  }

  function reopenBookingModal() {
    restoreOverlays();
    if (!reopenModalAfterConsent) return;
    reopenModalAfterConsent = false;
    if (typeof window.ptOpenModal === 'function') {
      try { window.ptOpenModal(); } catch (e) {}
    }
  }

  /* Zustandsbericht fuer den naechsten Test am echten Geraet. */
  window.bomayeConsentDebug = function () {
    return {
      cookiebotObject: typeof window.Cookiebot,
      renewType: typeof (window.Cookiebot && window.Cookiebot.renew),
      consentMarketing: consented(),
      gatesOnPage: document.querySelectorAll('.' + GATE_CLASS).length,
      modalOpen: !!document.querySelector('#pt-booking-modal.open'),
      bodyPosition: document.body ? window.getComputedStyle(document.body).position : null,
      cybotElements: document.querySelectorAll('[id^="Cybot"]').length,
      suppressedOverlays: suppressed.length,
      fixedBackdropLayers: (function () {
        var n = 0, all = document.querySelectorAll('body *');
        for (var i = 0; i < all.length; i++) {
          var cs = window.getComputedStyle(all[i]);
          if (cs.position === 'fixed' && cs.display !== 'none' &&
              ((cs.backdropFilter && cs.backdropFilter !== 'none') ||
               (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none'))) n++;
        }
        return n;
      })(),
      lastFailure: lastFailure
    };
  };

  /* ───────────────────────── 5. Platzhalter ───────────────────────── */

  /* Container, in denen ein Bsport-Widget haette erscheinen sollen. Die
     Widget-Divs stehen im Markup, die iframes werden zur Laufzeit gebaut. */
  function collectContainers() {
    var out = [];
    function add(el) { if (el && out.indexOf(el) === -1) out.push(el); }

    /* Markup-Container der MountBsportWidget-Aufrufe (Ladeweg C).
       Nur echte Container: die Bsport-Snippets vergeben denselben Praefix auch
       an ihre <script>-Elemente (bsport-widget-cdn, bsport-widget-mount), und
       in ein <script> gehoert kein Hinweis. */
    var divs = document.querySelectorAll('[id^="bsport-widget-"]');
    for (var i = 0; i < divs.length; i++) {
      if (divs[i].tagName !== 'SCRIPT') add(divs[i]);
    }

    /* Views des Probetraining-Modals (Ladeweg B) */
    add(document.getElementById('pt-pass-view'));
    add(document.getElementById('pt-cal-view'));

    /* Eltern der abgefangenen iframes (Ladeweg B und D) */
    for (var j = 0; j < blockedFrames.length; j++) {
      var el = blockedFrames[j].el;
      add(el.parentNode && el.parentNode.nodeType === 1 ? el.parentNode : null);
    }

    /* Inerte statische iframes (Ladeweg D) */
    var inert = document.querySelectorAll('iframe[data-bsport-srcdoc], iframe[data-bsport-src]');
    for (var k = 0; k < inert.length; k++) {
      add(inert[k].parentNode && inert[k].parentNode.nodeType === 1 ? inert[k].parentNode : null);
    }
    /* Nur die aeussersten Container behalten. Sonst bekommt z. B. sowohl
       #pt-pass-view als auch der darin liegende .pt-iframe-wrapper einen
       eigenen Hinweis, und der Besucher sieht denselben Text mehrfach. */
    return out.filter(function (c) {
      return !out.some(function (other) { return other !== c && other.contains(c); });
    });
  }

  function alreadyPainted(c) { return !!c.querySelector('.' + GATE_CLASS); }

  function paint(container) {
    if (!container || alreadyPainted(container)) return;

    var box = document.createElement('div');
    box.className = GATE_CLASS;
    box.setAttribute('role', 'note');

    var h = document.createElement('p');
    h.className = GATE_CLASS + '__title';
    h.textContent = 'Buchungssystem benötigt deine Einwilligung';

    var p = document.createElement('p');
    p.className = GATE_CLASS + '__text';
    p.textContent = 'Bitte akzeptiere Marketing-Cookies, um das Buchungssystem zu laden. '
      + 'Es wird von bsport bereitgestellt und setzt dabei Cookies, die eine '
      + 'Einwilligung brauchen.';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = GATE_CLASS + '__btn';

    /* Fehlerausgabe direkt im Platzhalter. Der Knopf darf unter keinen
       Umstaenden stumm nichts tun - genau das war der gemeldete Fehler auf dem
       iPhone. Der Grund steht sichtbar auf dem Geraet, damit der naechste Test
       am echten Telefon ohne Debugger auswertbar ist. */
    var fail = document.createElement('p');
    fail.className = GATE_CLASS + '__fail';
    fail.hidden = true;

    function showFailure(reason) {
      lastFailure = reason;
      /* Der Platzhalter liegt auf index.html IM Buchungs-Modal. Haben wir das
         fuer den Dialog geschlossen und unterdrueckt, waere die Meldung genau
         dort unsichtbar, wo der Besucher sie braucht (visibility:hidden). Also
         erst alles zurueckholen und das Modal wieder oeffnen, dann melden. */
      restoreOverlays();
      if (reopenModalAfterConsent) {
        reopenModalAfterConsent = false;
        if (typeof window.ptOpenModal === 'function') {
          try { window.ptOpenModal(); } catch (e) {}
        }
      }
      fail.hidden = false;
      fail.textContent = 'Der Einwilligungsdialog laesst sich auf diesem Geraet nicht '
        + 'oeffnen. Bitte buche telefonisch oder per WhatsApp - oder nutze den Link '
        + '"Cookie-Einstellungen" ganz unten auf der Seite. (Grund: ' + reason + ')';
      btn.disabled = false;
      btn.textContent = 'ERNEUT VERSUCHEN';
      addCleanPageEscape();
      try { console.warn('[consent] renew fehlgeschlagen:', reason); } catch (e) {}
    }

    /* Letzter Ausweg, der von unseren eigenen Overlays gar nicht abhaengen
       kann: die Seite ohne ?probetraining= neu laden. Dort gibt es kein Modal,
       keinen Scroll-Lock und keine ganzflaechige Ebene - der Cookiebot-Dialog
       hat freie Bahn, und der Footer-Link funktioniert normal. */
    function addCleanPageEscape() {
      if (box.querySelector('.' + GATE_CLASS + '__escape')) return;
      var a = document.createElement('button');
      a.type = 'button';
      a.className = GATE_CLASS + '__escape';
      a.textContent = 'SEITE OHNE BUCHUNGSFENSTER NEU LADEN';
      a.addEventListener('click', function () {
        try {
          var u = new URL(window.location.href);
          u.searchParams.delete('probetraining');
          u.hash = '';
          window.location.href = u.toString();
        } catch (e) {
          window.location.href = window.location.pathname;
        }
      });
      box.insertBefore(a, alt);
    }

    /* Ist ein Cookiebot-Dialog sichtbar im Bild? Cookiebot vergibt seinen
       Elementen durchgaengig das Praefix "Cybot". */
    function cookiebotDialogVisible() {
      var nodes = document.querySelectorAll('[id^="Cybot"]');
      for (var i = 0; i < nodes.length; i++) {
        var r = nodes[i].getBoundingClientRect();
        var cs = window.getComputedStyle(nodes[i]);
        if (r.width > 40 && r.height > 40 && cs.visibility !== 'hidden' &&
            cs.display !== 'none' && cs.opacity !== '0') return true;
      }
      return false;
    }

    function armButton() {
      if (cookiebotReady()) {
        btn.disabled = false;
        btn.textContent = 'MARKETING-COOKIES ERLAUBEN UND BUCHUNG LADEN';
        return true;
      }
      btn.disabled = true;
      btn.textContent = 'EINWILLIGUNGSDIALOG WIRD GELADEN …';
      return false;
    }

    if (!armButton()) {
      /* Wettlauf ausschliessen: der Platzhalter kann fertig sein, bevor
         consent.cookiebot.com geladen hat. Solange bleibt der Knopf gesperrt
         statt ins Leere zu greifen. */
      whenCookiebotReady(armButton, function () {
        showFailure('Cookiebot wurde nicht geladen - moeglicherweise blockiert ein '
                  + 'Inhaltsblocker consent.cookiebot.com');
      });
    }

    btn.addEventListener('click', function () {
      fail.hidden = true;
      try {
        if (!cookiebotReady()) {
          showFailure('Cookiebot.renew ist nicht verfuegbar');
          return;
        }
        /* Das Buchungs-Modal aus dem Weg raeumen, BEVOR der Dialog aufgeht.
           Es liegt bildschirmfuellend bei z-index 9000, sperrt den Body per
           position:fixed und hat backdrop-filter. Jede dieser drei Eigenschaften
           kann auf iOS dazu fuehren, dass der Einwilligungsdialog zwar geoeffnet,
           aber nicht sichtbar oder nicht antippbar ist. Nach erteilter
           Einwilligung wird es weiter unten wieder geoeffnet. */
        reopenModalAfterConsent = closeBookingModal();
        /* Erst NACH dem Schliessen unterdruecken, damit das Modal seinen
           Scroll-Lock ordentlich aufraeumt, bevor es aus dem Baum faellt. */
        suppressOverlays();

        window.Cookiebot.renew();

        /* Wenn renew() zwar durchlaeuft, aber nichts erscheint, darf der
           Besucher nicht ratlos zurueckbleiben. */
        window.setTimeout(function () {
          if (!consented() && !cookiebotDialogVisible()) {
            showFailure('renew() lief, es erschien aber kein Dialog');
          }
        }, 1500);
      } catch (err) {
        showFailure((err && err.message) ? err.message : String(err));
      }
    });

    var alt = document.createElement('p');
    alt.className = GATE_CLASS + '__alt';
    alt.innerHTML = 'Lieber ohne Cookies buchen? Ruf uns an: '
      + '<a href="tel:+491737513627">+49 173 7513627</a> '
      + 'oder schreib uns per <a href="https://wa.me/491737513627" '
      + 'target="_blank" rel="noopener">WhatsApp</a>.';

    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(btn);
    box.appendChild(fail);
    box.appendChild(alt);
    container.appendChild(box);
  }

  function paintAll() {
    if (consented()) return;
    if (!document.body) return;
    var cs = collectContainers();
    for (var i = 0; i < cs.length; i++) paint(cs[i]);
  }

  function unpaintAll() {
    var nodes = document.querySelectorAll('.' + GATE_CLASS);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }

  /* ─────────────────────────── 6. Freigabe ─────────────────────────── */

  function release() {
    if (released || !consented()) return;
    released = true;

    unpaintAll();

    /* Statische, inert ausgelieferte iframes scharf schalten (Ladeweg D). */
    var inert = document.querySelectorAll('iframe[data-bsport-srcdoc], iframe[data-bsport-src]');
    for (var i = 0; i < inert.length; i++) {
      var f = inert[i];
      ['srcdoc', 'src'].forEach(function (p) {
        var v = f.getAttribute('data-bsport-' + p);
        if (v) { f.removeAttribute('data-bsport-' + p); f[p] = v; }
      });
    }

    /* Abgefangene iframes nachziehen (Ladeweg B). */
    var frames = blockedFrames.splice(0);
    for (var j = 0; j < frames.length; j++) {
      var b = frames[j];
      delete b.el['__bomayeBlocked_' + b.prop];
      b.el[b.prop] = b.value;
    }

    /* Abgefangene Scripts nachladen (Ladeweg A und C). Bewusst als NEUES
       Element: ein Script, das schon im Dokument haengt, ist ein Sonderfall
       im Standard, ein frisches laedt garantiert. */
    var scripts = blockedScripts.splice(0);
    var seen = {};
    for (var k = 0; k < scripts.length; k++) {
      var url = scripts[k].url;
      var old = scripts[k].el;
      delete old.__bomayeBlockedSrc;
      if (old.parentNode) old.parentNode.removeChild(old);
      if (seen[url]) continue;
      seen[url] = true;
      var s = document.createElement('script');
      if (old.id) s.id = old.id;
      s.async = true;
      s.src = url;
      document.head.appendChild(s);
    }

    /* Die Seitenskripte warten in Wiederholungsschleifen darauf, dass
       window.BsportWidget erscheint (MountBsportWidget bis ~2 min,
       _waitBsport ~7,5 s). Erscheint es innerhalb dieses Fensters, montieren
       sie sich von selbst. Erst nach 10 s — also nach Ablauf des kuerzesten
       Fensters (_waitBsport, 7,5 s) — wird geprueft, ob ein Container leer
       geblieben ist, und nur dann ein Neuladen-Hinweis angeboten. */
    setTimeout(checkStillEmpty, 10000);
  }

  function checkStillEmpty() {
    var divs = document.querySelectorAll('[id^="bsport-widget-"]');
    for (var i = 0; i < divs.length; i++) {
      var d = divs[i];
      if (d.tagName === 'SCRIPT') continue;
      if (d.children.length === 0 && !d.querySelector('.' + GATE_CLASS + '__reload')) {
        var p = document.createElement('p');
        p.className = GATE_CLASS + '__reload';
        var a = document.createElement('a');
        a.href = '#';
        a.textContent = 'Buchungssystem laden';
        a.addEventListener('click', function (e) { e.preventDefault(); location.reload(); });
        p.appendChild(a);
        d.appendChild(p);
      }
    }
  }

  /* ───────────────────────── 7. Verdrahtung ───────────────────────── */

  window.addEventListener('CookiebotOnConsentReady', function () {
    if (consented()) release(); else paintAll();
  });
  window.addEventListener('CookiebotOnAccept', function () {
    if (consented()) { release(); reopenBookingModal(); }
  });
  window.addEventListener('CookiebotOnDecline', function () {
    restoreOverlays();
    paintAll();
  });

  function onReady() {
    sweep(document);
    if (consented()) release(); else paintAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  /* Kleine Oberflaeche fuer Seitenskripte, die vor dem Mount fragen wollen,
     ob es sich ueberhaupt lohnt. Die Sperre wirkt auch ohne diese Aufrufe. */
  window.bomayeBsportAllowed = consented;

})();

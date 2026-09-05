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
    btn.textContent = 'MARKETING-COOKIES ERLAUBEN UND BUCHUNG LADEN';
    btn.addEventListener('click', function () {
      if (window.Cookiebot && typeof window.Cookiebot.renew === 'function') {
        window.Cookiebot.renew();
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
    if (consented()) release();
  });
  window.addEventListener('CookiebotOnDecline', paintAll);

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

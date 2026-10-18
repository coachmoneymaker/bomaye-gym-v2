/**
 * ?ptdom=1 - GEMEINSAME GRUNDLAGE DER DIAGNOSEBERICHTE
 * ───────────────────────────────────────────────────
 *
 * Hier steht, was ALLE Berichte brauchen und was sonst zweimal dastuende:
 * die Leiste mit den Knoepfen, der Kasten fuer den Text, das Kopieren in die
 * Zwischenablage, und eine Handvoll Beschreibungen einzelner Elemente.
 *
 * Es gibt zwei Berichte, und sie messen verschiedene Dinge:
 *
 *   bsport-dialog-diagnose.js  Kurskalender und Kursdialog
 *                              (/probetraining, /stundenplan)
 *   abo-form-diagnose.js       Registrierungsformular im Abo-Overlay
 *                              (/mitglied-werden, Startseite)
 *
 * WAS HIER BEWUSST NICHT STEHT
 * Die Formatierung der berechneten Stile. Beide Berichte lesen andere
 * Eigenschaften und setzen sie anders zusammen - eine gemeinsame Fassung
 * waere eine Huelle mit zwei Sonderfaellen darin, also keine.
 *
 * DER NAME IST NICHT bomayeDiagnose
 * Den gibt es schon: kalender-tag.js:613 legt dort eine Konsolenhilfe ab,
 * die auf /stundenplan von Hand aufgerufen wird. Ein gleichnamiges Objekt
 * haette sie ueberschrieben, sobald jemand ?ptdom=1 anhaengt. Gemessen,
 * nicht vermutet.
 *
 * Ohne ?ptdom=1 kehrt diese Datei in der ersten Zeile des Koerpers um:
 * window.bomayeDiagnoseBasis entsteht dann gar nicht, und die Berichte, die
 * darauf zugreifen, kehren ihrerseits um. Kein Element, kein Hoerer, kein
 * Beobachter, kein Takt.
 */
(function () {
  'use strict';
  if (!/[?&]ptdom=1/.test(window.location.search)) return;

  /* ── Beschreibungen einzelner Elemente ───────────────────────────── */

  function vollKlasse(el) {
    try {
      if (typeof el.className === 'string') return el.className || '-';
      if (el.className && el.className.baseVal !== undefined) return el.className.baseVal || '-';
    } catch (e) {}
    return '-';
  }

  function kurz(el) {
    if (!el || el.nodeType !== 1) return '-';
    var k = (typeof el.className === 'string' && el.className)
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    if (k.length > 60) k = k.slice(0, 60) + '…';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + k;
  }

  /* Klassenteile OHNE angehaengte Ziffernfolge. MUI vergibt laufende Nummern
     (MuiButton-root-575, jss571); die wechseln bei jedem Bsport-Update und
     taugen nicht als Haken. Was hier uebrig bleibt, taugt. */
  function stabileTeile(el) {
    var k = vollKlasse(el);
    if (k === '-') return '-';
    var aus = k.trim().split(/\s+/).filter(function (x) {
      return x && !/-\d+$/.test(x) && !/^jss\d+$/.test(x);
    });
    return aus.length ? aus.join(' ') : '(alle mit Nummer)';
  }

  function idKurz(el, max) {
    try {
      if (!el.id) return '';
      var m = max || 40;
      return el.id.length > m ? el.id.slice(0, m) + '…' : el.id;
    } catch (e) { return ''; }
  }

  /* Nur der EIGENE Text, ohne den der Kinder. Sonst meldete jede Huelle bis
     hinauf zur Wurzel denselben Treffer. */
  function eigenerText(el) {
    var t = '';
    try {
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3) t += el.childNodes[i].nodeValue;
      }
    } catch (e) { return ''; }
    return t.replace(/\s+/g, ' ').trim();
  }

  function attrZeile(el) {
    var t = [];
    try {
      for (var i = 0; i < el.attributes.length; i++) {
        var a = el.attributes[i];
        var v = a.value.length > 120 ? a.value.slice(0, 120) + '…' : a.value;
        t.push(a.name + '="' + v + '"');
      }
    } catch (e) {}
    return '<' + el.tagName.toLowerCase() + (t.length ? ' ' + t.join(' ') : '') + '>';
  }

  /* ── Leiste, Berichtskasten, Kopieren ────────────────────────────── */

  function knopf(text, breit) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.style.cssText = 'min-height:40px;' + (breit ? 'padding:0 14px;' : 'width:40px;')
      + 'background:#C9A84C;color:#0A0A08;border:0;border-radius:0;'
      + 'font:700 11px/1 Oswald,sans-serif;letter-spacing:0.14em;cursor:pointer;';
    return b;
  }

  /**
   * Baut Leiste und Berichtskasten und haengt sie an <body>.
   *
   *   einst.bericht        Funktion ohne Argumente, liefert den Text
   *   einst.zusatz         weitere Knoepfe: [{ text, klick(knopf) }]
   *   einst.beimSchliessen wird beim Schliessen der Leiste gerufen
   *
   * Rueckgabe: { leiste, bericht }
   */
  function leisteBauen(einst) {
    einst = einst || {};

    var leiste = document.createElement('div');
    leiste.id = 'pt-dom-leiste';
    leiste.setAttribute('data-diagnose', '1');
    /* Umbruch, weil vier Knoepfe bei 320px nicht in eine Zeile passen. Ohne
       flex-wrap ragte die Leiste aus dem Fenster und zoege waagerechten
       Ueberlauf nach sich - genau das, was pruefen:reichweite meldet. */
    leiste.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;'
      + 'display:flex;flex-wrap:wrap;justify-content:flex-end;'
      + 'max-width:calc(100vw - 24px);gap:1px;background:rgba(10,10,8,0.96);'
      + 'border:1px solid rgba(201,168,76,0.45);padding:6px;';

    var kDiag = knopf('DIAGNOSE', true);
    var kKopie = knopf('KOPIEREN', true);
    leiste.appendChild(kDiag);
    leiste.appendChild(kKopie);

    var extra = einst.zusatz || [];
    for (var i = 0; i < extra.length; i++) {
      (function (def) {
        var b = knopf(def.text, true);
        b.addEventListener('click', function () { def.klick(b); });
        leiste.appendChild(b);
      }(extra[i]));
    }

    var kZu = knopf('×', false);
    kZu.setAttribute('aria-label', 'Diagnose schliessen');
    leiste.appendChild(kZu);

    var bericht = document.createElement('pre');
    bericht.id = 'pt-dom-bericht';
    bericht.hidden = true;
    /* Hoehe bewusst unter der Haelfte des Fensters: so kann die Bauart-Regel
       der Dialogwache diesen Kasten gar nicht erst fuer einen Dialog halten -
       auch wenn die Ausnahmeliste einmal verlorengehen sollte. */
    bericht.style.cssText = 'position:fixed;left:12px;right:12px;bottom:66px;z-index:2147483646;'
      + 'max-height:45vh;overflow:auto;-webkit-overflow-scrolling:touch;margin:0;padding:10px 12px;'
      + 'background:rgba(10,10,8,0.97);border:1px solid rgba(201,168,76,0.30);color:#C9A84C;'
      + 'font:10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word;';

    var letzterText = '';

    kDiag.addEventListener('click', function () {
      try { letzterText = einst.bericht(); }
      catch (e) { letzterText = 'FEHLER im Bericht: ' + (e && e.message) + '\n' + (e && e.stack); }
      bericht.textContent = letzterText;
      bericht.hidden = false;
    });

    kKopie.addEventListener('click', function () {
      if (!letzterText) { kKopie.textContent = 'ERST DIAGNOSE';
        setTimeout(function () { kKopie.textContent = 'KOPIEREN'; }, 1800); return; }
      var fertig = function (ok) {
        kKopie.textContent = ok ? 'KOPIERT' : 'NICHT KOPIERT';
        setTimeout(function () { kKopie.textContent = 'KOPIEREN'; }, 1800);
      };
      try {
        navigator.clipboard.writeText(letzterText).then(function () { fertig(true); },
                                                        function () { fertig(false); });
      } catch (e) { fertig(false); }
    });

    kZu.addEventListener('click', function () {
      if (!bericht.hidden) { bericht.hidden = true; return; }
      if (einst.beimSchliessen) { try { einst.beimSchliessen(); } catch (e) {} }
      leiste.remove();
      bericht.remove();
    });

    function anhaengen() {
      document.body.appendChild(bericht);
      document.body.appendChild(leiste);
      if (einst.beimStart) { try { einst.beimStart(); } catch (e) {} }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', anhaengen);
    } else {
      anhaengen();
    }

    return { leiste: leiste, bericht: bericht };
  }

  window.bomayeDiagnoseBasis = {
    hilfen: {
      kurz: kurz,
      vollKlasse: vollKlasse,
      stabileTeile: stabileTeile,
      idKurz: idKurz,
      eigenerText: eigenerText,
      attrZeile: attrZeile
    },
    knopf: knopf,
    leisteBauen: leisteBauen
  };
}());

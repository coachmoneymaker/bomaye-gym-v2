/* ══════════════════════════════════════════════════════════════════════════
   ANFRAGEFORMULARE: FAMILY UND CORPORATE
   ══════════════════════════════════════════════════════════════════════════

   WARUM DIESE DATEI EXISTIERT
   Beide Formulare standen bis hierher in index.html, ihre Logik in main.js.
   Die Startseite zeigt sie nicht mehr: die Family-Anfrage steht jetzt auf
   /preise, die Corporate-Anfrage auf /kurse#corporate. Beide Seiten laden
   main.js NICHT. Die Logik musste also an eine Stelle, die beide laden
   koennen, und main.js musste sie loswerden, damit auf der Startseite kein
   toter Code bleibt.

   UNVERAENDERT UEBERNOMMEN
   Felder, Pflichtfeldpruefung, Fehlermeldungen Wort fuer Wort, der
   Endpunkt /api/contact, die gesendeten Schluessel (type: 'family'
   beziehungsweise 'corporate') und das Verhalten nach dem Senden. Es ist
   dieselbe Logik, nur an einem anderen Ort.

   KEIN TRACKING
   Hier wird nichts gemessen, und das war vorher auch so. Die Knoepfe
   tragen kein data-ga-event und keine Vertragskennung. pixel-events.js
   feuert nicht: "FAMILIENPLATZ ANFRAGEN" und "CORPORATE ANFRAGE SENDEN"
   stehen in keinem seiner CHECKOUT_KEYWORDS, und /api/contact steht in
   keinem BSPORT_PATTERN.

   ALLES IN EINER KAPSEL
   Nur die Namen, die im Markup als onclick/onsubmit stehen, haengen am
   window. Alles andere bleibt drin. So kollidiert nichts mit main.js
   (das auf anderen Seiten eigene lockBodyScroll-Funktionen mitbringt)
   oder mit dem Abo-Overlay auf /preise.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Rollsperre waehrend das Modal offen ist ───────────────────────────
     Wortgleich zu lockBodyScroll/unlockBodyScroll in main.js, nur lokal.
     Die Fassung mit position: fixed ist die, die auf iOS wirklich haelt. */
  var sperrY = 0;
  function sperrenAn() {
    sperrY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top      = '-' + sperrY + 'px';
    document.body.style.width    = '100%';
  }
  function sperrenAus() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top      = '';
    document.body.style.width    = '';
    window.scrollTo({ top: sperrY, behavior: 'instant' });
  }

  /* ── Der Verlauf am unteren Rand der Modalkarte ───────────────────────
     Zeigt "Weitere Felder unten", solange noch etwas kommt. */
  function rollVerlauf(modalId) {
    var modal = document.getElementById(modalId);
    if (!modal) return;
    var karte  = modal.querySelector('.family-modal-card');
    var huelle = modal.querySelector('.modal-card-wrapper');
    if (!karte || !huelle) return;

    karte.scrollTop = 0;

    function pruefen() {
      var unten = karte.scrollTop + karte.clientHeight >= karte.scrollHeight - 30;
      huelle.classList.toggle('at-bottom', unten);
    }

    if (karte._scrollFadeHandler) karte.removeEventListener('scroll', karte._scrollFadeHandler);
    karte._scrollFadeHandler = pruefen;
    karte.addEventListener('scroll', pruefen, { passive: true });
    requestAnimationFrame(pruefen);
  }

  /* ══════════════ FAMILY ══════════════ */

  function openFamilyModal() {
    var modal = document.getElementById('family-modal');
    if (!modal || modal.classList.contains('open')) return;
    modal.classList.add('open');
    sperrenAn();
    rollVerlauf('family-modal');
  }

  function closeFamilyModal() {
    var modal = document.getElementById('family-modal');
    if (!modal || !modal.classList.contains('open')) return;
    modal.classList.remove('open');
    sperrenAus();
    /* Formular und Erfolgsmeldung zuruecksetzen */
    var form    = document.getElementById('family-inquiry-form');
    var success = document.getElementById('fif-success');
    if (form) {
      form.reset();
      form.style.display = '';
      form.querySelectorAll('.fif-error').forEach(function (el) { el.textContent = ''; });
      form.querySelectorAll('.fif-input-error').forEach(function (el) { el.classList.remove('fif-input-error'); });
      var namen = document.getElementById('fif-member-names');
      if (namen) namen.innerHTML = '';
      var adresse = document.getElementById('fif-address-section');
      if (adresse) adresse.hidden = true;
    }
    if (success) success.hidden = true;
  }

  /* So viele Namensfelder wie Familienmitglieder gewaehlt sind. */
  function updateFamilyMemberFields() {
    var select    = document.getElementById('fif-count');
    var container = document.getElementById('fif-member-names');
    if (!select || !container) return;

    var val = select.value;
    container.innerHTML = '';
    if (!val) return;

    var count = parseInt(val, 10) || 0;      /* '6' heisst 6, angezeigt als "6+" */
    for (var i = 1; i <= count; i++) {
      var div = document.createElement('div');
      div.className = 'fif-field';
      div.innerHTML =
        '<label for="fif-member-' + i + '">Name Familienmitglied ' + i
          + ' <span class="fif-required">*</span></label>'
        + '<input type="text" id="fif-member-' + i + '" name="member_' + i
          + '" placeholder="Vor- und Nachname">'
        + '<span class="fif-error" id="fif-member-' + i + '-error" aria-live="polite"></span>';
      container.appendChild(div);
    }

    requestAnimationFrame(function () { rollVerlauf('family-modal'); });
  }

  /* Adresse nur, wenn die Familie NICHT im selben Haushalt wohnt. */
  function handleHouseholdChange(value) {
    var section = document.getElementById('fif-address-section');
    if (!section) return;
    section.hidden = (value !== 'Nein');
    requestAnimationFrame(function () { rollVerlauf('family-modal'); });
  }

  function submitFamilyInquiry(e) {
    e.preventDefault();
    var form = e.target;

    form.querySelectorAll('.fif-error').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('.fif-input-error').forEach(function (el) { el.classList.remove('fif-input-error'); });

    var nameEl  = form.querySelector('[name="name"]');
    var emailEl = form.querySelector('[name="email"]');
    var phoneEl = form.querySelector('[name="phone"]');

    var name  = nameEl.value.trim();
    var email = emailEl.value.trim();
    var phone = phoneEl.value.trim();

    var valid = true;

    if (!name) {
      document.getElementById('fif-name-error').textContent = 'Bitte gib deinen Namen ein';
      nameEl.classList.add('fif-input-error');
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('fif-email-error').textContent = 'Bitte gib eine gültige E-Mail-Adresse ein';
      emailEl.classList.add('fif-input-error');
      valid = false;
    }
    if (!phone) {
      document.getElementById('fif-phone-error').textContent = 'Bitte gib deine Telefonnummer ein';
      phoneEl.classList.add('fif-input-error');
      valid = false;
    }

    /* Die nachgewachsenen Namensfelder */
    var countSelect = form.querySelector('[name="count"]');
    var countVal    = countSelect ? countSelect.value : '';
    var count       = parseInt(countVal, 10) || 0;
    var memberNames = [];
    for (var i = 1; i <= count; i++) {
      var el  = form.querySelector('[name="member_' + i + '"]');
      var wert = el ? el.value.trim() : '';
      memberNames.push(wert);
      if (!wert) {
        var errEl = document.getElementById('fif-member-' + i + '-error');
        if (errEl) errEl.textContent = 'Bitte Namen eingeben';
        if (el) el.classList.add('fif-input-error');
        valid = false;
      }
    }

    if (!valid) return;

    var household = (form.querySelector('[name="household"]:checked') || {}).value || '';
    var message   = form.querySelector('[name="message"]').value.trim();
    var lies = function (feld) {
      var el = form.querySelector('[name="' + feld + '"]');
      return el ? el.value.trim() : '';
    };
    var street = household === 'Nein' ? lies('address_street') : '';
    var plz    = household === 'Nein' ? lies('address_plz')    : '';
    var city   = household === 'Nein' ? lies('address_city')   : '';

    var btn      = form.querySelector('[type="submit"]');
    var origHtml = btn.innerHTML;
    btn.disabled  = true;
    btn.innerHTML = 'Wird gesendet…';

    fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type: 'family',
        name: name, email: email, phone: phone,
        count: countVal,
        members: memberNames,
        household: household, street: street, plz: plz, city: city, message: message,
      }),
    }).then(function (res) {
      if (!res.ok) throw new Error('Request failed');
      form.style.display = 'none';
      document.getElementById('fif-success').hidden = false;
    }).catch(function () {
      btn.disabled  = false;
      btn.innerHTML = origHtml;
      document.getElementById('fif-name-error').textContent =
        'Fehler beim Senden. Bitte versuche es erneut.';
    });
  }

  /* ══════════════ CORPORATE ══════════════ */

  /* Dieses Formular steht fest auf der Seite, nicht in einem Modal. Die
     Fehlermeldung haengt am naechsten Geschwisterelement des Feldes,
     genau wie vorher in der Preisuebersicht der Startseite. */
  function submitCorporateInquiryInline(e) {
    e.preventDefault();
    var form = e.target;

    form.querySelectorAll('.fif-error').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('.fif-input-error').forEach(function (el) { el.classList.remove('fif-input-error'); });

    var nameEl    = form.querySelector('[name="name"]');
    var emailEl   = form.querySelector('[name="email"]');
    var phoneEl   = form.querySelector('[name="phone"]');
    var personsEl = form.querySelector('[name="persons"]');
    var dateEl    = form.querySelector('[name="date"]');
    var timeEl    = form.querySelector('[name="time"]');

    var name    = nameEl.value.trim();
    var email   = emailEl.value.trim();
    var phone   = phoneEl.value.trim();
    var persons = personsEl.value;
    var date    = dateEl.value;
    var time    = timeEl.value.trim();

    var valid = true;
    var zeigeFehler = function (el, text) {
      el.nextElementSibling.textContent = text;
      el.classList.add('fif-input-error');
      valid = false;
    };

    if (!name)    zeigeFehler(nameEl,    'Bitte gib deinen Namen ein');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                  zeigeFehler(emailEl,   'Bitte gib eine gültige E-Mail-Adresse ein');
    if (!phone)   zeigeFehler(phoneEl,   'Bitte gib deine Telefonnummer ein');
    if (!persons) zeigeFehler(personsEl, 'Bitte wähle die Anzahl der Personen');
    if (!date)    zeigeFehler(dateEl,    'Bitte wähle ein gewünschtes Datum');
    if (!time)    zeigeFehler(timeEl,    'Bitte gib eine gewünschte Uhrzeit an');

    if (!valid) return;

    var company  = form.querySelector('[name="company"]').value.trim();
    var catering = (form.querySelector('[name="catering"]:checked') || {}).value || '';
    var anlass   = form.querySelector('[name="event"]').value.trim();
    var message  = form.querySelector('[name="message"]').value.trim();

    var btn      = form.querySelector('[type="submit"]');
    var origHtml = btn.innerHTML;
    btn.disabled  = true;
    btn.innerHTML = 'Wird gesendet…';

    fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type: 'corporate',
        name: name, email: email, phone: phone, company: company,
        persons: persons, date: date, time: time,
        catering: catering, event: anlass, message: message,
      }),
    }).then(function (res) {
      if (!res.ok) throw new Error('Request failed');
      form.style.display = 'none';
      document.getElementById('cbi-success').hidden = false;
    }).catch(function () {
      btn.disabled  = false;
      btn.innerHTML = origHtml;
      nameEl.nextElementSibling.textContent = 'Fehler beim Senden. Bitte versuche es erneut.';
    });
  }

  /* ── Schliessen: Klick auf den Hintergrund, Escape ────────────────────
     Nur das Modal selbst zaehlt als Hintergrund, nicht seine Kinder. */
  document.addEventListener('click', function (e) {
    if (e.target.id === 'family-modal') closeFamilyModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var modal = document.getElementById('family-modal');
    if (modal && modal.classList.contains('open')) closeFamilyModal();
  });

  /* Nur diese Namen stehen im Markup als onclick/onsubmit. */
  window.openFamilyModal           = openFamilyModal;
  window.closeFamilyModal          = closeFamilyModal;
  window.updateFamilyMemberFields  = updateFamilyMemberFields;
  window.handleHouseholdChange     = handleHouseholdChange;
  window.submitFamilyInquiry       = submitFamilyInquiry;
  window.submitCorporateInquiryInline = submitCorporateInquiryInline;
}());

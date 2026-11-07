/* Bomaye Premium: ein Knopf haelt jede Dauerbewegung an.
   Hero-Videos und das Kurs-Laufband laufen laenger als fuenf Sekunden;
   WCAG 2.2.2 verlangt dafuer eine Pause. Ohne Speicherzugriff, damit es
   auch mit gesperrtem sessionStorage laeuft. */
(function () {
  var knopf = document.querySelector('.pr-ruhe-knopf');
  if (!knopf) return;
  var root = document.documentElement;
  function videos() { return document.querySelectorAll('#hero video'); }
  knopf.addEventListener('click', function () {
    var ruhe = !root.classList.contains('pr-ruhe');
    root.classList.toggle('pr-ruhe', ruhe);
    knopf.setAttribute('aria-pressed', ruhe ? 'true' : 'false');
    knopf.setAttribute('aria-label', ruhe ? 'Bewegung fortsetzen' : 'Bewegung anhalten');
    var v = videos();
    for (var i = 0; i < v.length; i++) {
      try { if (ruhe) v[i].pause(); else { var p = v[i].play(); if (p && p.catch) p.catch(function () {}); } } catch (e) {}
    }
  });
}());

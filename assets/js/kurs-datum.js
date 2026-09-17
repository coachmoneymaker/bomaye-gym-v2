/* ═══════════════════════════════════════════════════════════════════════════
   Kurs-Deep-Links: das Datum des angeklickten Termins
   ═══════════════════════════════════════════════════════════════════════════

   PR #73/#74/#75 filtern den Bsport-Kalender ueber /stundenplan?kurs=<slug>
   auf die richtige Aktivitaet - der Kalender oeffnet aber weiter auf heute.
   Wer am Donnerstag auf eine Freitagszeile tippt, landet unter dem Filter auf
   einem Tag ohne diesen Kurs.

   Dieses Modul liefert die gemeinsame Datumsrechnung fuer beide Einstiege
   (Stundenplan und Startseiten-Kalender). Es kennt nur Wochentage, weil genau
   das im Markup steht: jede Zeile haengt in einem Panel mit data-day.

   Bewusst streng: ein Datum, das nicht exakt JJJJ-MM-TT ist, nicht existiert
   (2026-02-31) oder ausserhalb des Fensters heute..+1 Jahr liegt, wird
   verworfen. Die aufrufende Seite faellt dann auf das bisherige Verhalten
   zurueck - heute, nur nach Kurs gefiltert.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WOCHENTAG = { so: 0, mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6 };
  var NAME = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
              'Donnerstag', 'Freitag', 'Samstag'];

  function zwei(n) { return (n < 10 ? '0' : '') + n; }

  /* Alle Daten werden auf 12:00 gesetzt. Um Mitternacht zu rechnen bricht
     an Zeitumstellungstagen: +1 Tag landet dort auf 23:00 des Vortags. */
  function mittags(d) {
    var k = new Date(d.getTime());
    k.setHours(12, 0, 0, 0);
    return k;
  }

  /* Naechstes Vorkommen eines Wochentags - heute eingeschlossen. Wer am
     Donnerstag auf eine Donnerstagszeile tippt, meint heute, nicht in
     einer Woche. */
  function naechsterTermin(tag, heute) {
    var ziel = WOCHENTAG[String(tag || '').toLowerCase()];
    if (ziel === undefined) return null;
    var d = mittags(heute || new Date());
    d.setDate(d.getDate() + ((ziel - d.getDay() + 7) % 7));
    return d;
  }

  function alsIso(d) {
    if (!d) return '';
    return d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate());
  }

  /* Streng: nur JJJJ-MM-TT, und das Datum muss es wirklich geben. */
  function ausIso(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var t = s.split('-');
    var j = +t[0], m = +t[1], g = +t[2];
    var d = new Date(j, m - 1, g, 12, 0, 0, 0);
    /* Faengt 2026-02-31 ab: der Date-Konstruktor rollt still weiter. */
    if (d.getFullYear() !== j || d.getMonth() !== m - 1 || d.getDate() !== g) return null;
    return d;
  }

  /* Plausibel ist nur heute bis in einem Jahr. Ein Datum aus der
     Vergangenheit kommt aus einem alten Link oder einem Tab, der ueber
     Mitternacht offen lag - dafuer ist heute die bessere Antwort. */
  function istPlausibel(d) {
    if (!d) return false;
    var von = mittags(new Date());
    von.setHours(0, 0, 0, 0);
    var bis = mittags(new Date());
    bis.setFullYear(bis.getFullYear() + 1);
    return d >= von && d <= bis;
  }

  function beschriftung(d) {
    if (!d) return '';
    return NAME[d.getDay()] + ', ' + zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.';
  }

  /* Haengt datum= an eine bestehende Kurs-Adresse. Ohne gueltigen Wochentag
     bleibt die Adresse unveraendert - kein kaputter Parameter. */
  function mitDatum(adresse, tag) {
    var d = naechsterTermin(tag);
    if (!d) return adresse;
    return adresse + (adresse.indexOf('?') === -1 ? '?' : '&') + 'datum=' + alsIso(d);
  }

  window.bomayeKurs = {
    naechsterTermin: naechsterTermin,
    alsIso:          alsIso,
    ausIso:          ausIso,
    istPlausibel:    istPlausibel,
    beschriftung:    beschriftung,
    mitDatum:        mitDatum
  };
}());

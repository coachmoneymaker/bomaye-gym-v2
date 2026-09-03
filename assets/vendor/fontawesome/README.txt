Font Awesome Free 6 - selbst gehostet, auf die benutzten Icons reduziert
=======================================================================

Ersetzt die Einbindung ueber cdnjs.cloudflare.com auf allen Seiten. Beim
Laden vom CDN ging die IP-Adresse jedes Besuchers an Cloudflare, bevor eine
Einwilligung vorlag - dieselbe Uebertragung wie zuvor bei Google Fonts.

Lizenz
------
Font Awesome Free besteht aus drei Teilen mit unterschiedlichen Lizenzen.
Aus diesem Paket werden ausgeliefert:

  Icons (die Glyphen in den woff2/ttf-Dateien)  CC BY 4.0
  Schriftdateien selbst                          SIL OFL 1.1
  CSS (all.min.css)                              MIT

Alle drei erlauben das Hosten auf eigenen Servern. CC BY 4.0 verlangt eine
Namensnennung; die liegt als LICENSE.txt je Version bei und der Hinweis
steht zusaetzlich im Kommentarkopf von all.min.css (unveraendert von
Fonticons uebernommen).

Zwei Versionen
--------------
Die Seiten binden historisch zwei Versionen ein: 6.4.0 (16 Seiten) und
6.5.0 (6 Seiten). Font Awesome exportiert seine Schriften bei jedem Release
neu, die Glyph-Umrisse unterscheiden sich zwischen 6.4.0 und 6.5.0 also
messbar. Deshalb bleibt jede Seite auf genau der Version, die sie heute
laedt - eine Vereinheitlichung waere eine optische Aenderung und gehoert in
eine eigene Entscheidung.

Subsetting
----------
Die Seiten benutzen 54 verschiedene Icons von rund 2.000. Die woff2- und
ttf-Dateien enthalten deshalb nur die tatsaechlich verwendeten Codepoints
(solid 53, brands 4, regular 1). Erzeugt mit pyftsubset (fontTools) aus den
Original-Dateien des npm-Pakets @fortawesome/fontawesome-free - derselben
Quelle, die cdnjs spiegelt.

Geprueft: alle 53 Glyphen im Subset sind gegenueber dem Original identisch
in Umriss, Vorschubbreite und Glyph-Hinting. Es wurde nichts neu gezeichnet
oder skaliert, nur nicht benutzte Glyphen entfernt.

  fa-solid-900.woff2    150.124 ->  5.780 Bytes
  fa-brands-400.woff2   108.020 ->  1.284 Bytes
  fa-regular-400.woff2   24.948 ->    680 Bytes

all.min.css ist byte-identisch zum Original (sha256 geprueft). Dadurch
bleiben alle Basisregeln, Groessen- und Animationsklassen unveraendert und
die relativen url(../webfonts/...) zeigen ohne Anpassung auf die lokalen
Dateien. fa-v4compatibility.* liegt unveraendert bei, damit keine in der
CSS referenzierte URL ins Leere laeuft; diese Seiten laden es nie.

Aktualisieren
-------------
  npm pack @fortawesome/fontawesome-free@<version>
  css/all.min.css unveraendert uebernehmen
  pyftsubset webfonts/<datei>.woff2 --unicodes=<liste> --flavor=woff2 \
    --layout-features='*' --desubroutinize --notdef-outline --name-IDs='*'
Danach das Rendering gegen den vorherigen Stand pruefen.

Bekannter Altbestand
--------------------
coming-soon.html benutzt "fa-boxing-glove". Dieses Icon gibt es nur in
Font Awesome Pro, nicht in Free - es wird deshalb schon heute nicht
dargestellt. Diese Umstellung aendert daran nichts; der Ersatz ist eine
gestalterische Entscheidung.

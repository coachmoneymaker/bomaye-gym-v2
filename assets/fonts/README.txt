BOMAYE GYM — selbst gehostete Schriften
=======================================

Alle drei Familien stehen unter der SIL Open Font License 1.1. Die OFL
erlaubt das Hosten auf eigenen Servern und die Weitergabe ausdruecklich;
sie verlangt lediglich, dass Lizenztext und Copyright-Hinweis mitgeliefert
werden - das leisten die drei OFL-Dateien in diesem Verzeichnis.

  Bebas Neue   Copyright (c) 2010 Dharma Type              -> OFL-BebasNeue.txt
  Oswald       Copyright 2016 The Oswald Project Authors    -> OFL-Oswald.txt
  DM Sans      Copyright 2014 The DM Sans Project Authors   -> OFL-DMSans.txt

Herkunft
--------
Die woff2-Dateien wurden unveraendert von fonts.gstatic.com geladen, ueber
genau die css2-URL, die die Seiten bisher angefordert haben:

  https://fonts.googleapis.com/css2?family=Bebas+Neue
    &family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400
    &family=Oswald:wght@400;500;600;700&display=swap

Es sind dieselben Variable-Font-Dateien, die der Browser bisher von Google
bekommen hat. Nicht neu subgesetzt, nicht konvertiert - damit ist das
Rendering identisch zum bisherigen Stand.

Dateien (latin + latin-ext, nur woff2)
--------------------------------------
  bebas-neue-latin.woff2          bebas-neue-latin-ext.woff2
  oswald-latin.woff2              oswald-latin-ext.woff2
  dm-sans-latin.woff2             dm-sans-latin-ext.woff2
  dm-sans-italic-latin.woff2      dm-sans-italic-latin-ext.woff2

Die @font-face-Regeln liegen in assets/css/fonts.css. Aktualisieren: Datei
erneut ueber die obige URL mit einem aktuellen Chrome-User-Agent abrufen,
die woff2-Dateien ersetzen und das Rendering gegen den alten Stand pruefen.

# Archiv: HTML-Kommentare aus dem Markup

Momentaufnahme vom 2026-11-05.

Diese Kommentare standen bis dahin im HTML. Sie sind aus dem ausgelieferten
Markup entfernt (siehe `scripts/kommentare-entfernen.mjs`), weil es keinen
getrennten Bauordner gibt: Vercel liefert das Verzeichnis direkt aus,
entfernen heisst hier also loeschen.

Hier stehen sie, damit die Begruendungen nicht verloren gehen. Die Datei
wird NICHT fortgeschrieben.


## about.html (38 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 39

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 134

```html
<!-- Schema.org -->
```

### Zeile 241

```html
<!-- BreadcrumbList -->
```

### Zeile 265

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 271

```html
<!-- Noise texture overlay -->
```

### Zeile 274

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 306

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 337

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 343

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 356

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 359

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 1 — HERO  (Dark)
  ══════════════════════════════════════════════════ -->
```

### Zeile 506

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 2 — THE ORIGIN  (Dark)
  ══════════════════════════════════════════════════ -->
```

### Zeile 579

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 3 — THE MEANING  (Light / Cream)
  ══════════════════════════════════════════════════ -->
```

### Zeile 636

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 4 — TECHNIK  (Dark, left-aligned)
  ══════════════════════════════════════════════════ -->
```

### Zeile 728

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 5 — COMMUNITY  (Cream, right-aligned)
  ══════════════════════════════════════════════════ -->
```

### Zeile 750

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 6 — CHARAKTER  (Dark, centered)
  ══════════════════════════════════════════════════ -->
```

### Zeile 804

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 7 — THE QUOTE  (Concrete wall, dark)
  ══════════════════════════════════════════════════ -->
```

### Zeile 885

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 8 — THE COACHES  (Cream, human moment)
  ══════════════════════════════════════════════════ -->
```

### Zeile 1063

```html
<!-- Raschad Pekpassi -->
```

### Zeile 1095

```html
<!-- Alfonso Fusco -->
```

### Zeile 1131

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 9 — COMMUNITY. ENERGY. REAL FIGHT.  (Dark, cinematic)
  ══════════════════════════════════════════════════ -->
```

### Zeile 1190

```html
<!-- ══════════════════════════════════════════════════
       CHAPTER 10 — FINAL CTA  (Light / Cream)
  ══════════════════════════════════════════════════ -->
```

### Zeile 1303

```html
<!-- ══════════════════════════════════════════════════
       FOOTER
  ══════════════════════════════════════════════════ -->
```

### Zeile 1368

```html
<!-- SEO footer links — visually minimal, kept for SEO value -->
```

### Zeile 1397

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 1506

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1507

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## agb.html (17 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 41

```html
<!-- Favicons -->
```

### Zeile 49

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 55

```html
<!-- Schema.org -->
```

### Zeile 162

```html
<!-- BreadcrumbList -->
```

### Zeile 185

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 191

```html
<!-- Header -->
```

### Zeile 240

```html
<!-- Legal Content -->
```

### Zeile 357

```html
<!-- Footer -->
```

### Zeile 399

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 400

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## boxen-lernen-muenchen.html (33 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 73

```html
<!-- Schema.org -->
```

### Zeile 181

```html
<!-- FAQ Schema -->
```

### Zeile 399

```html
<!-- BreadcrumbList -->
```

### Zeile 420

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 445

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 451

```html
<!-- Noise texture -->
```

### Zeile 454

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 487

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 503

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 509

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 522

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 525

```html
<!-- ── Hero ── -->
```

### Zeile 540

```html
<!-- ── Boxen lernen für Anfänger ── -->
```

### Zeile 588

```html
<!-- ── Technik und Beinarbeit ── -->
```

### Zeile 612

```html
<!-- ── Warum Bomaye Gym ── -->
```

### Zeile 637

```html
<!-- ── Early Bird CTA ── -->
```

### Zeile 653

```html
<!-- ── FAQ ── -->
```

### Zeile 698

```html
<!-- ── Footer ── -->
```

### Zeile 792

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 972

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 973

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## boxen-muenchen.html (33 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 73

```html
<!-- Schema.org -->
```

### Zeile 201

```html
<!-- FAQ Schema -->
```

### Zeile 447

```html
<!-- BreadcrumbList -->
```

### Zeile 448

```html
<!-- Course -->
```

### Zeile 449

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 474

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 480

```html
<!-- Noise texture -->
```

### Zeile 483

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 516

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 532

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 538

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 551

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 561

```html
<!-- ── Hero ── -->
```

### Zeile 577

```html
<!-- ── Wegweiser: alle Seiten zum Thema ── -->
```

### Zeile 608

```html
<!-- ── Für wen ── -->
```

### Zeile 626

```html
<!-- TODO-OWNER: Hier waere ein Satz zur Halle gut (Quadratmeter,
                 Anzahl Säcke, Ring ja/nein). Im Repo steht dazu nichts
                 Belastbares, deshalb steht hier nichts. -->
```

### Zeile 638

```html
<!-- ── Einstieg: zum kostenlosen Probetraining ── -->
```

### Zeile 653

```html
<!-- ── FAQ ── -->
```

### Zeile 810

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 990

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 991

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## boxgym-muenchen.html (33 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 73

```html
<!-- Schema.org -->
```

### Zeile 181

```html
<!-- FAQ Schema -->
```

### Zeile 394

```html
<!-- BreadcrumbList -->
```

### Zeile 415

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 440

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 446

```html
<!-- Noise texture -->
```

### Zeile 449

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 482

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 498

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 504

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 517

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 520

```html
<!-- ── Hero ── -->
```

### Zeile 535

```html
<!-- ── Boxgym für Anfänger ── -->
```

### Zeile 575

```html
<!-- ── Fitness Boxen ── -->
```

### Zeile 600

```html
<!-- ── Professionelles Boxtraining ── -->
```

### Zeile 625

```html
<!-- ── Early Bird CTA ── -->
```

### Zeile 641

```html
<!-- ── FAQ ── -->
```

### Zeile 686

```html
<!-- ── Footer ── -->
```

### Zeile 780

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 960

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 961

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## boxtraining-muenchen.html (33 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 73

```html
<!-- Schema.org -->
```

### Zeile 181

```html
<!-- FAQ Schema -->
```

### Zeile 394

```html
<!-- BreadcrumbList -->
```

### Zeile 415

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 440

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 446

```html
<!-- Noise texture -->
```

### Zeile 449

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 482

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 498

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 504

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 517

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 520

```html
<!-- ── Hero ── -->
```

### Zeile 535

```html
<!-- ── Boxtraining für Anfänger ── -->
```

### Zeile 575

```html
<!-- ── Fitness Boxtraining ── -->
```

### Zeile 600

```html
<!-- ── Boxtraining für Fortgeschrittene ── -->
```

### Zeile 627

```html
<!-- ── Early Bird CTA ── -->
```

### Zeile 643

```html
<!-- ── FAQ ── -->
```

### Zeile 688

```html
<!-- ── Footer ── -->
```

### Zeile 782

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 962

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 963

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## coaches.html (35 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 39

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 557

```html
<!-- Schema.org -->
```

### Zeile 709

```html
<!-- BreadcrumbList -->
```

### Zeile 730

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 755

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 761

```html
<!-- Noise texture -->
```

### Zeile 764

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 796

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 827

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 833

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 846

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 849

```html
<!-- ── Hero ── -->
```

### Zeile 858

```html
<!-- ── Coach Cards ── -->
```

### Zeile 861

```html
<!-- Sprungleiste. Bauteil .sched-day-tab aus dem Stundenplan-Ausschnitt
         der Startseite, Wert fuer Wert uebernommen - dort liegt es inline in
         index.html und nicht in style.css. Statt <button> hier <a>, weil es
         Sprungziele sind; der aktive Zustand wird beim Scrollen gesetzt,
         genau wie bei den Wochentagen. -->
```

### Zeile 877

```html
<!-- Raschad -->
```

### Zeile 927

```html
<!-- Alfonso -->
```

### Zeile 977

```html
<!-- ── Coach Team ── -->
```

### Zeile 990

```html
<!-- Nima -->
```

### Zeile 1017

```html
<!-- Pavlos -->
```

### Zeile 1052

```html
<!-- ── Bottom CTA ── -->
```

### Zeile 1069

```html
<!-- ── Footer ── -->
```

### Zeile 1158

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 1370

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1371

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## datenschutz.html (17 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 41

```html
<!-- Favicons -->
```

### Zeile 49

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 55

```html
<!-- Schema.org -->
```

### Zeile 162

```html
<!-- BreadcrumbList -->
```

### Zeile 185

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 191

```html
<!-- Header -->
```

### Zeile 240

```html
<!-- Legal Content -->
```

### Zeile 491

```html
<!-- Footer -->
```

### Zeile 533

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 534

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## downloads.html (23 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 41

```html
<!-- Open Graph -->
```

### Zeile 50

```html
<!-- Twitter -->
```

### Zeile 56

```html
<!-- JSON-LD -->
```

### Zeile 177

```html
<!-- Favicons -->
```

### Zeile 186

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 192

```html
<!-- BreadcrumbList -->
```

### Zeile 215

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 221

```html
<!-- Header -->
```

### Zeile 270

```html
<!-- Main: light cream block -->
```

### Zeile 278

```html
<!-- Hero -->
```

### Zeile 286

```html
<!-- Section 1: Studio-Regeln -->
```

### Zeile 317

```html
<!-- Section 2: U18 -->
```

### Zeile 409

```html
<!-- Section 3: Info note -->
```

### Zeile 424

```html
<!-- Footer -->
```

### Zeile 466

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 467

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## faq.html (30 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 39

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 382

```html
<!-- Schema.org -->
```

### Zeile 590

```html
<!-- BreadcrumbList -->
```

### Zeile 614

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 620

```html
<!-- Noise texture -->
```

### Zeile 623

```html
<!-- ═══════ HEADER (adapted for standalone page) ═══════ -->
```

### Zeile 655

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 686

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 692

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 705

```html
<!-- ═══════════════════════════════════════════════════════
     FAQ PAGE MAIN
═══════════════════════════════════════════════════════ -->
```

### Zeile 710

```html
<!-- ── Hero ── -->
```

### Zeile 714

```html
<!-- Suchwort in die H1, Slogan als Unterzeile. -->
```

### Zeile 721

```html
<!-- ── FAQ Accordion (rendered from faq-data.js) ── -->
```

### Zeile 848

```html
<!-- ── Bottom CTA ── -->
```

### Zeile 866

```html
<!-- ── Footer ── -->
```

### Zeile 955

```html
<!-- /faqp-main -->
```

### Zeile 957

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 1105

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1106

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## fitnessboxen-muenchen.html (33 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 73

```html
<!-- Schema.org -->
```

### Zeile 181

```html
<!-- FAQ Schema -->
```

### Zeile 394

```html
<!-- BreadcrumbList -->
```

### Zeile 415

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 440

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 446

```html
<!-- Noise texture -->
```

### Zeile 449

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 482

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 498

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 504

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 517

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 520

```html
<!-- ── Hero ── -->
```

### Zeile 535

```html
<!-- ── Fitnessboxen für Anfänger ── -->
```

### Zeile 575

```html
<!-- ── Box Workout für Kraft und Ausdauer ── -->
```

### Zeile 599

```html
<!-- ── Fitnessboxen ohne Sparring ── -->
```

### Zeile 624

```html
<!-- ── Early Bird CTA ── -->
```

### Zeile 640

```html
<!-- ── FAQ ── -->
```

### Zeile 685

```html
<!-- ── Footer ── -->
```

### Zeile 779

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 959

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 960

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## frauenboxen-muenchen.html (34 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 73

```html
<!-- Schema.org -->
```

### Zeile 181

```html
<!-- FAQ Schema -->
```

### Zeile 402

```html
<!-- BreadcrumbList -->
```

### Zeile 423

```html
<!-- Course -->
```

### Zeile 444

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 469

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 475

```html
<!-- Noise texture -->
```

### Zeile 478

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 511

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 527

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 533

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 546

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 549

```html
<!-- ── Hero ── -->
```

### Zeile 564

```html
<!-- ── Boxen für Frauen ── -->
```

### Zeile 606

```html
<!-- ── Warum Queens: Story ── -->
```

### Zeile 643

```html
<!-- ── Dein erstes Training ── -->
```

### Zeile 672

```html
<!-- ── Early Bird CTA ── -->
```

### Zeile 688

```html
<!-- ── FAQ ── -->
```

### Zeile 743

```html
<!-- ── Footer ── -->
```

### Zeile 837

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 1017

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1018

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## hausordnung.html (20 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 41

```html
<!-- Open Graph -->
```

### Zeile 50

```html
<!-- Twitter -->
```

### Zeile 56

```html
<!-- JSON-LD -->
```

### Zeile 177

```html
<!-- Favicons -->
```

### Zeile 186

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 379

```html
<!-- BreadcrumbList -->
```

### Zeile 402

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 408

```html
<!-- Header -->
```

### Zeile 457

```html
<!-- Main content: light block -->
```

### Zeile 572

```html
<!-- PDF CTA -->
```

### Zeile 586

```html
<!-- Footer -->
```

### Zeile 628

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 629

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## impressum.html (17 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 41

```html
<!-- Favicons -->
```

### Zeile 49

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 55

```html
<!-- Schema.org -->
```

### Zeile 162

```html
<!-- BreadcrumbList -->
```

### Zeile 185

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 191

```html
<!-- Header -->
```

### Zeile 240

```html
<!-- Legal Content -->
```

### Zeile 325

```html
<!-- Footer -->
```

### Zeile 365

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 366

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## index.html (103 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Kurs-Deep-Link-Datum: bewusst OHNE defer. Die Seitenskripte stehen
       inline im Body und laufen waehrend des Parsens - ein defer-Skript
       kaeme erst danach, das Modul waere dann noch nicht da. -->
```

### Zeile 13

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 34

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 35

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 37

```html
<!-- End Cookiebot CMP -->
```

### Zeile 38

```html
<!-- Google Ads -->
```

### Zeile 38

```html
<!-- End Google Ads -->
```

### Zeile 39

```html
<!-- Google Tag Manager -->
```

### Zeile 39

```html
<!-- End Google Tag Manager -->
```

### Zeile 44

```html
<!-- Favicons -->
```

### Zeile 52

```html
<!-- Open Graph -->
```

### Zeile 63

```html
<!-- Preload critical assets -->
```

### Zeile 68

```html
<!-- Bsport: early connection warm-up before user clicks -->
```

### Zeile 70

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 77

```html
<!-- Font Awesome: async to unblock render -->
```

### Zeile 79

```html
<!-- Styles -->
```

### Zeile 82

```html
<!-- Schema.org -->
```

### Zeile 190

```html
<!-- ══════════════════════════════════════════════════════
     HOMEPAGE UPDATES — scoped CSS overrides
     Updates: U3 nav · U5 accents · U6 hero · U7 pulse · U8 buttons · U9 mobile
══════════════════════════════════════════════════════ -->
```

### Zeile 731

```html
<!-- Organization — Identitaet der Marke, sameAs verknuepft Social und App-Stores -->
```

### Zeile 732

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 757

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 762

```html
<!-- Google Tag Manager (noscript) -->
```

### Zeile 762

```html
<!-- End Google Tag Manager (noscript) -->
```

### Zeile 764

```html
<!-- Scroll progress bar -->
```

### Zeile 767

```html
<!-- Noise texture -->
```

### Zeile 770

```html
<!-- ═══════ PRELOADER ═══════ -->
```

### Zeile 778

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 813

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 845

```html
<!-- ═══════ FAMILY MEMBERSHIP MODAL ═══════ -->
```

### Zeile 876

```html
<!-- 1. Anzahl Familienmitglieder -->
```

### Zeile 889

```html
<!-- 2. Dynamische Namen-Felder -->
```

### Zeile 892

```html
<!-- 3. Kontaktdaten -->
```

### Zeile 911

```html
<!-- 4. Gleicher Haushalt -->
```

### Zeile 932

```html
<!-- 5. Adresse (nur bei Nein) -->
```

### Zeile 951

```html
<!-- 6. Nachricht -->
```

### Zeile 970

```html
<!-- ═══════ CORPORATE BOXING MODAL ═══════ -->
```

### Zeile 1078

```html
<!-- ══════════════════════════════════════════════════════════
     HOME VIEW
══════════════════════════════════════════════════════════ -->
```

### Zeile 1083

```html
<!-- Announcement bar — hidden by default; enable via inline style if needed -->
```

### Zeile 1088

```html
<!-- SEO heading – visually hidden, preserves hero branding -->
```

### Zeile 1091

```html
<!-- ── HERO ── -->
```

### Zeile 1131

```html
<!-- ── PREISZEILE ──
       Eine Zeile, direkt unter dem ersten Bildschirm. Der Preisbereich
       dieser Seite beginnt erst bei rund 6.500 px, und in Kopfleiste und
       Burger gab es bis zu diesem PR keinen Eintrag "Preise". Wer den
       Preis sucht, findet ihn jetzt im ersten Wisch.

       Die 59,60 € sind der kleinste Monatsbetrag (Kids) und stehen
       gleichlautend in scripts/preise-daten.mjs. Wer sie aendert, aendert
       sie dort UND hier: diese eine Zeile wird nicht erzeugt, weil ein
       Bauskript fuer eine Zeile mehr Aufwand waere als Nutzen.
       Keine Zahl zu den Plaetzen, nur "solange Plaetze frei sind". -->
```

### Zeile 1149

```html
<!-- ── ORT — Kurzantwort auf "wo seid ihr" ──
       Vollstaendiger Block mit Karte, Zeiten und Anfahrtsvideo: #location -->
```

### Zeile 1174

```html
<!-- Springt zum vorhandenen Anfahrtsvideo weiter unten und loest dort
             denselben Abspielknopf aus. Kein zweites Video, keine zweite
             Einwilligungsschranke — siehe Skript am Seitenende. -->
```

### Zeile 1185

```html
<!-- ── SCHEDULE PREVIEW ── -->
```

### Zeile 1331

```html
<!-- MONDAY -->
```

### Zeile 1382

```html
<!-- TUESDAY -->
```

### Zeile 1417

```html
<!-- WEDNESDAY -->
```

### Zeile 1468

```html
<!-- THURSDAY -->
```

### Zeile 1511

```html
<!-- FRIDAY -->
```

### Zeile 1554

```html
<!-- SATURDAY -->
```

### Zeile 1767

```html
<!-- Sticky bottom conversion bar (mobile) -->
```

### Zeile 1773

```html
<!-- SLIDE-OVER PANEL · part 1 of 3 (markup only) -->
```

### Zeile 2045

```html
<!-- ── NEW PROGRAMMES — MONEY SLOTS ── -->
```

### Zeile 2151

```html
<!-- BOMAYE KICKBOXING -->
```

### Zeile 2161

```html
<!-- BOMAYE QUEENS -->
```

### Zeile 2177

```html
<!-- ── DNA / PHILOSOPHY TEASER ── -->
```

### Zeile 2196

```html
<!-- Right column: logo brand visual — desktop only -->
```

### Zeile 2199

```html
<!-- Rein dekorativ: der Block darueber traegt aria-hidden, und das
               Logo steht hier als Gestaltungselement, nicht als Information.
               alt="" plus aria-hidden sagt das ausdruecklich. -->
```

### Zeile 2214

```html
<!-- SOCIAL PROOF SECTION -->
```

### Zeile 2217

```html
<!-- Subtle radial glow -->
```

### Zeile 2220

```html
<!-- Section label -->
```

### Zeile 2225

```html
<!-- Rating -->
```

### Zeile 2229

```html
<!-- HANDWERT — keine Live-Daten. Diese Zahl wird NICHT von Google
             abgerufen. Sie steht einmal in BEWERTUNG in
             scripts/seo-daten.mjs und wird von dort hierher und nach
             /probetraining geschrieben:
                 node scripts/seo-bauen.mjs
             Von Hand geändert gehört sie also dort, nicht hier — hier wird
             sie beim nächsten Lauf überschrieben. Der Stand steht sichtbar
             in der Zeile darunter, damit niemand die Zahl für einen
             Live-Wert hält. Dasselbe gilt für die drei Rezensionstexte
             darunter: auch die sind von Hand gepflegt. -->
```

### Zeile 2241

```html
<!-- Der Stand stand bisher NUR im Kommentar darueber, also nur fuer
           uns. Jetzt steht er fuer den Besucher da: eine Bewertung ohne
           Datum liest sich wie ein Live-Wert, und das ist sie nicht.
           Zahl und Datum kommen beide aus BEWERTUNG in
           scripts/seo-daten.mjs und koennen deshalb nicht auseinander
           laufen. Dieselben zwei Angaben stehen im ersten Bildschirm von
           /probetraining. -->
```

### Zeile 2253

```html
<!-- 3 Cards — CSS Grid desktop, scroll snap mobile -->
```

### Zeile 2303

```html
<!-- Card 1: Emanuele -->
```

### Zeile 2313

```html
<!-- Card 2: Christopher -->
```

### Zeile 2323

```html
<!-- Card 3: Lilian -->
```

### Zeile 2335

```html
<!-- Mobile scroll indicator -->
```

### Zeile 2367

```html
<!-- CTAs — verified links -->
```

### Zeile 2370

```html
<!-- All reviews — verified short link -->
```

### Zeile 2389

```html
<!-- ── TRAINING DISCIPLINES — stacked sticky scroll ── -->
```

### Zeile 2404

```html
<!-- Section intro -->
```

### Zeile 2413

```html
<!-- Stacked sticky panels -->
```

### Zeile 2445

```html
<!-- Post-stack CTA -->
```

### Zeile 2451

```html
<!-- Verweis auf die Uebersichtsseite. Sie fuehrt zu allen Themenseiten
             (Boxen lernen, Boxtraining, Kickboxen, Frauenboxen, Kinderboxen,
             Personal Training) und ist damit der Einstieg fuer alles, was
             nicht in die drei Programme oben passt. -->
```

### Zeile 2463

```html
<!-- PT TEASER SECTION -->
```

### Zeile 2490

```html
<!-- ── PRICING ── -->
```

### Zeile 2564

```html
<!-- Verweis auf die Preisseite. Die drei Karten hier zeigen nur die
         Mitgliedschaften; Personal Training, Tageskarte, Open Gym und die
         Zehnerkarte stehen vollstaendig auf /preise. -->
```

### Zeile 2572

```html
<!-- ── PARTNER TRUST BAR ── -->
```

### Zeile 2604

```html
<!-- ── BOMAYE APP ── -->
```

### Zeile 2615

```html
<!-- ── EARLY BIRD ── -->
```

### Zeile 2640

```html
<!-- ── FAQ ── -->
```

### Zeile 2693

```html
<!-- ── LOCATION ── -->
```

### Zeile 2756

```html
<!-- ── ANFAHRT-VIDEO ──────────────────────────────────────────────
       Fassade statt Einbettung: sichtbar ist zunaechst nur ein eigenes
       Standbild. Der Player wird erst nach einem Klick geladen — bei
       YouTube zusaetzlich erst nach Marketing-Einwilligung.

       Umstellung auf eine selbst gehostete Datei: Datei nach
       /assets/videos/ legen und unten data-video-source auf
       "selfhosted" setzen. Sonst ist nichts zu aendern.
  ────────────────────────────────────────────────────────────────── -->
```

### Zeile 2801

```html
<!-- ── FOOTER ── -->
```

### Zeile 2866

```html
<!-- SEO footer text -->
```

### Zeile 2895

```html
<!-- /view-home -->
```

### Zeile 2897

```html
<!-- ══════════════════════════════════════════════════════════
     WEITERE PREISE VIEW
══════════════════════════════════════════════════════════ -->
```

### Zeile 3010

```html
<!-- ── Corporate Boxing Inline Inquiry Form ── -->
```

### Zeile 3111

```html
<!-- Core config (contact, address, hours, early bird) -->
```

### Zeile 3114

```html
<!-- Content modules -->
```

### Zeile 3120

```html
<!-- FAQ data -->
```

### Zeile 3123

```html
<!-- Main application logic -->
```

### Zeile 3126

```html
<!-- ══════════════════════════════════════════════════════════
     BSPORT WIDGET — Membership Subscription Widget
     Script 1: CDN loader (guards against double-load)
     Script 2: MountBsportWidget helper with retry logic
     Script 3: Mount the subscription widget
══════════════════════════════════════════════════════════ -->
```

### Zeile 3146

```html
<!-- ═══════ ABO-OVERLAY ═══════
     Der Mount-Punkt bsport-widget-78464 lag seit PR #75 brach: der Aufruf
     stand hier, der Container fehlte im Markup, der if-Guard war immer
     falsch. Jetzt gibt es den Container - im Overlay, montiert erst beim
     ersten Klick auf einen Paket-Knopf durch abo-embed.js. -->
```

### Zeile 3161

```html
<!-- Das Aussehen des Abo-Overlays steht jetzt gemeinsam in
     assets/css/style.css, Abschnitt "ABO-OVERLAY (Mitgliedschaft)".
     Die Kopie hier war schmaler geraten: transparenter Schliessen-
     Knopf in der Ecke, 8px Polsterung, der Rahmen scrollte selbst. -->
```

### Zeile 3167

```html
<!-- Paketklicks messen. Nur Lesen und Melden: kein preventDefault, kein
     Nachladen, kein Cookie. Siehe docs/tracking-events.md -->
```

### Zeile 3170

```html
<!-- DIAGNOSE NUR MIT ?ptdom=1
     Bewusst nachgeladen statt fest eingebunden: ohne den Parameter entsteht
     keine einzige Anfrage, und die Seite ist Zeile fuer Zeile die von vorher.
     async=false haelt die Reihenfolge ein - die Grundlage muss vor dem
     Bericht laufen, der auf sie zugreift. -->
```

### Zeile 3193

```html
<!-- ── Disc-stack: subtle scale-back on exiting card ─────────────────
     As card N+1 rises and covers card N, card N scales 1.0→0.985 and
     fades 1.0→0.92, reinforcing the card-deck depth feel.

     Key change from previous version: sticky offsets are now staggered
     (navH, navH+peekH, navH+2×peekH). Progress must be calculated
     relative to where each incoming card is "fully covering" — its own
     sticky top position — not a flat navH for all panels.

     · desktop/tablet only (≤480px exits early — mobile = relative cards)
     · passive rAF-gated scroll listener — zero scroll-jacking
     · resize resets stale inline transforms
──────────────────────────────────────────────────────────────────────── -->
```

### Zeile 3303

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 3304

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## kickboxen-muenchen.html (34 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 73

```html
<!-- Schema.org -->
```

### Zeile 181

```html
<!-- FAQ Schema -->
```

### Zeile 402

```html
<!-- BreadcrumbList -->
```

### Zeile 423

```html
<!-- Course -->
```

### Zeile 444

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 469

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 475

```html
<!-- Noise texture -->
```

### Zeile 478

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 511

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 527

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 533

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 546

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 549

```html
<!-- ── Hero ── -->
```

### Zeile 564

```html
<!-- ── Kickboxen für Anfänger ── -->
```

### Zeile 606

```html
<!-- ── Kickboxen oder Boxen ── -->
```

### Zeile 637

```html
<!-- ── Training mit Alfonso Fusco ── -->
```

### Zeile 665

```html
<!-- ── Early Bird CTA ── -->
```

### Zeile 681

```html
<!-- ── FAQ ── -->
```

### Zeile 736

```html
<!-- ── Footer ── -->
```

### Zeile 830

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 1010

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1011

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## kinderboxen-muenchen.html (34 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 73

```html
<!-- Schema.org -->
```

### Zeile 233

```html
<!-- FAQ Schema -->
```

### Zeile 479

```html
<!-- BreadcrumbList -->
```

### Zeile 480

```html
<!-- Course -->
```

### Zeile 481

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 506

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 512

```html
<!-- Noise texture -->
```

### Zeile 515

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 548

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 564

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 570

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 583

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 594

```html
<!-- ── Hero ── -->
```

### Zeile 609

```html
<!-- ── Was Kinder hier lernen ── -->
```

### Zeile 628

```html
<!-- TODO-OWNER: Zwei Angaben, nach denen Eltern zuerst fragen, stehen
                 im Repo nicht belastbar und fehlen hier deshalb:
                   1. an welchen Wochentagen und zu welchen Uhrzeiten Kids und
                      Youth trainieren (der Stundenplan kommt aus bsport, eine
                      feste Zeile hier wuerde veralten)
                   2. die Gruppengroesse als Zahl ("Kleingruppen" steht so auf
                      /mitglied-werden, eine Obergrenze nicht)
                 Beides bitte ergaenzen oder bestaetigen. -->
```

### Zeile 643

```html
<!-- ── Für Eltern ── -->
```

### Zeile 667

```html
<!-- ENTSCHEIDUNG, kein offener Punkt: Preis steht mit Absicht
                 NICHT hier und NICHT im Schema. Zwei Stellen mit Preisen laufen auseinander, und ein
                 veralteter Preis im Schema ist ein Verstoss gegen Googles
                 Richtlinien. -->
```

### Zeile 677

```html
<!-- ── Einstieg: zum kostenlosen Probetraining ── -->
```

### Zeile 692

```html
<!-- ── FAQ ── -->
```

### Zeile 847

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 1027

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1028

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## kurse.html (39 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 39

```html
<!-- Favicons -->
```

### Zeile 57

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 641

```html
<!-- Schema.org -->
```

### Zeile 748

```html
<!-- BreadcrumbList -->
```

### Zeile 769

```html
<!-- Course — ein Eintrag je Kurs, Inhalte aus dem COURSES-Objekt dieser Seite -->
```

### Zeile 926

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 951

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 958

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 987

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 1016

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 1022

```html
<!-- ═══════ BOOKING MODAL ═══════ -->
```

### Zeile 1035

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 1038

```html
<!-- ── Hero ── -->
```

### Zeile 1042

```html
<!-- Die H1 traegt das Suchwort, nicht den Slogan: "Kurse" allein sagt
           weder, worum es geht, noch wo. Der Slogan steht als Unterzeile
           direkt darunter und behaelt seine Gestalt. -->
```

### Zeile 1051

```html
<!-- ── Courses (Desktop Marquee + Mobile Carousel) ── -->
```

### Zeile 1061

```html
<!-- ── DESKTOP PREMIUM CAROUSEL ── -->
```

### Zeile 1141

```html
<!-- /dsk-track -->
```

### Zeile 1142

```html
<!-- /desk-carousel -->
```

### Zeile 1143

```html
<!-- /desk-carousel-outer -->
```

### Zeile 1145

```html
<!-- ── DESKTOP DETAIL PANEL ── -->
```

### Zeile 1189

```html
<!-- ── MOBILE CAROUSEL ── -->
```

### Zeile 1273

```html
<!-- /courses-carousel -->
```

### Zeile 1275

```html
<!-- Dots -->
```

### Zeile 1286

```html
<!-- Mobile detail panel -->
```

### Zeile 1297

```html
<!-- /courses-carousel-wrap -->
```

### Zeile 1301

```html
<!-- ══════════════════════════════════════════════════════════════════
       KURSE IM TEXT — aufklappbar, ein Block je Kurs

       Warum es das gibt: das Karussell zeigt die Beschreibungen erst nach
       einem Klick. Weder Suchmaschinen noch Ueberflieger sehen sie dadurch.
       Diese Bloecke stehen im Quelltext und tragen dieselben Inhalte.

       ACHTUNG BEIM AENDERN: Text und Merkmale stammen aus dem
       COURSES-Objekt weiter unten (Felder titleMob, desc, feats) und sind
       einmalig daraus erzeugt worden. Wer dort etwas aendert, muss es hier
       nachziehen - sonst sagen Karussell und Text Verschiedenes.

       Muster: dasselbe Akkordeon wie auf den sieben Landingpages
       (.faq-item / .faq-q / .faq-a, Umschalter per Klasse "open").
       Der Umschalter setzt zusaetzlich die gemessene Hoehe, weil die
       Kursbloecke laenger sind als die 300px, mit denen die Landingpages
       auskommen.
  ══════════════════════════════════════════════════════════════════ -->
```

### Zeile 1432

```html
<!-- ── CTA ── -->
```

### Zeile 1446

```html
<!-- ── Footer ── -->
```

### Zeile 1510

```html
<!-- SEO footer text -->
```

### Zeile 1538

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 2350

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 2351

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## mitglied-werden.html (39 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 39

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- bsport warm-up -->
```

### Zeile 64

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 72

```html
<!-- Site styles -->
```

### Zeile 873

```html
<!-- Schema.org -->
```

### Zeile 980

```html
<!-- BreadcrumbList -->
```

### Zeile 1001

```html
<!-- Offer — die drei Mitgliedschaften -->
```

### Zeile 1082

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 1106

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 1112

```html
<!-- ═══════ MINIMAL HEADER ═══════ -->
```

### Zeile 1160

```html
<!-- ═══════ PAGE CONTENT ═══════ -->
```

### Zeile 1163

```html
<!-- ══════════════════════════════════════════════
         SECTION 1 — HERO
    ══════════════════════════════════════════════ -->
```

### Zeile 1174

```html
<!-- ══════════════════════════════════════════════
         SECTION 2 — THREE PACKAGE CARDS
    ══════════════════════════════════════════════ -->
```

### Zeile 1179

```html
<!-- Dokumente-Hinweis -->
```

### Zeile 1190

```html
<!-- CARD: KIDS — DOM pos 1, desktop col 1, mobile col 2 -->
```

### Zeile 1214

```html
<!-- CARD: UNLIMITED — DOM pos 2, desktop col 2, mobile col 1 -->
```

### Zeile 1239

```html
<!-- CARD: YOUTH — DOM pos 3, desktop col 3, mobile col 3 -->
```

### Zeile 1266

```html
<!-- ══════════════════════════════════════════════
         SECTION — FIGHTER-KIT
    ══════════════════════════════════════════════ -->
```

### Zeile 1290

```html
<!-- ══════════════════════════════════════════════
         SECTION 3 — TRIAL TRAINING
    ══════════════════════════════════════════════ -->
```

### Zeile 1304

```html
<!-- ══════════════════════════════════════════════
         SECTION 4 — FINAL CTA (NOCH FRAGEN)
    ══════════════════════════════════════════════ -->
```

### Zeile 1320

```html
<!-- ── Footer ── -->
```

### Zeile 1424

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1425

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```

### Zeile 1430

```html
<!-- Das Aussehen des Abo-Overlays steht jetzt gemeinsam in
     assets/css/style.css, Abschnitt "ABO-OVERLAY (Mitgliedschaft)".
     Es war hier und in index.html doppelt und auseinandergelaufen. -->
```

### Zeile 1434

```html
<!-- ═══════ BSPORT SUBSCRIPTION WIDGET MODAL ═══════ -->
```

### Zeile 1445

```html
<!-- BSPORT — CDN loader (guards against double-load) -->
```

### Zeile 1448

```html
<!-- BSPORT — MountBsportWidget helper with retry -->
```

### Zeile 1460

```html
<!-- BSPORT — Abo-Overlay: Mount und Nachricht uebernimmt abo-embed.js.
     Montiert wird erst beim ersten Klick, nicht beim Seitenaufruf. -->
```

### Zeile 1463

```html
<!-- Paketklicks messen. Nur Lesen und Melden: kein preventDefault, kein
     Nachladen, kein Cookie. Siehe docs/tracking-events.md -->
```

### Zeile 1466

```html
<!-- DIAGNOSE NUR MIT ?ptdom=1
     Bewusst nachgeladen statt fest eingebunden: ohne den Parameter entsteht
     keine einzige Anfrage, und die Seite ist Zeile fuer Zeile die von vorher.
     async=false haelt die Reihenfolge ein - die Grundlage muss vor dem
     Bericht laufen, der auf sie zugreift. -->
```


## mitgliederbereich.html (22 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 50

```html
<!-- Preload critical assets -->
```

### Zeile 54

```html
<!-- bsport warm-up -->
```

### Zeile 56

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 64

```html
<!-- Site styles -->
```

### Zeile 301

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 307

```html
<!-- ═══════ MINIMAL HEADER ═══════ -->
```

### Zeile 356

```html
<!-- ═══════ PAGE CONTENT ═══════ -->
```

### Zeile 359

```html
<!-- ── PAGE INTRO ────────────────────────────────────── -->
```

### Zeile 368

```html
<!-- ── MEMBER PROFILE WIDGET ─────────────────────────── -->
```

### Zeile 375

```html
<!-- ── NO SUBSCRIPTION CTA ───────────────────────────── -->
```

### Zeile 396

```html
<!-- ── BEWERTUNG ERBITTEN ────────────────────────────
         Die Adresse ist Googles Bewertungsformular zur Orts-ID des
         eigenen Eintrags (search.google.com/local/writereview?placeid=).
         Die beiden Parameter source und laa aus dem Empfehlungsfeld des
         Unternehmensprofils sind weggelassen: sie vermerken nur, woher
         der Betreiber den Link kopiert hat.

         UNGEPRUEFT, wohin er im Browser fuehrt: Google ist aus der
         Bauumgebung gesperrt. Die Orts-ID stammt aus erster Hand. -->
```

### Zeile 424

```html
<!-- ── FOOTER ── -->
```

### Zeile 622

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 623

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## personal-training-boxen-muenchen.html (42 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 36

```html
<!-- KEIN AUTOMATISCHER ZOOM AUF DEM iPHONE
       Gemessen auf einem echten iPhone, nach PR #130: der Zoom steht
       weiter bei 1.1418 (= 16/14), und die Zoom-Aufzeichnung nennt als
       fokussiertes Element
         iframe.widget-8.bsport-user-interaction-modal__iframe
       Bsport haengt also in unser srcdoc noch einen EIGENEN Rahmen, und
       der kommt von bsport.io. Fremde Herkunft: weder unser CSS noch die
       Regel im srcdoc erreichen das Feld darin. Ueberlauf gibt es keinen,
       scrollWidth und clientWidth standen beide bei 402.

       Damit bleibt genau ein Hebel: das viewport-meta des obersten
       Dokuments. maximum-scale=1 unterbindet den Fokuszoom, den iOS von
       sich aus ausloest.

       NUR auf iPhone und iPod, und nur zur Laufzeit. Im Markup bleibt das
       meta unveraendert, damit Android, Schreibtisch, iPad und
       Suchmaschinen genau das sehen wie bisher. user-scalable=no steht
       hier NICHT: Zusammenziehen muss moeglich bleiben, und seit iOS 10
       laesst Safari es ohnehin zu, egal was hier steht - genau darum ist
       maximum-scale=1 vertretbar.

       Steht so frueh wie moeglich: direkt hinter dem meta, vor dem ersten
       Zeichnen. Die Reihenfolge der vorhandenen Skripte aendert sich
       nicht, hier kommt nur ein Inline-Block zwischen zwei Metazeilen. -->
```

### Zeile 80

```html
<!-- Favicons -->
```

### Zeile 90

```html
<!-- Open Graph -->
```

### Zeile 101

```html
<!-- Preload critical assets -->
```

### Zeile 105

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 113

```html
<!-- Site styles -->
```

### Zeile 116

```html
<!-- Schema.org -->
```

### Zeile 224

```html
<!-- FAQ Schema -->
```

### Zeile 274

```html
<!-- ANGEBOTS-SCHEMA
       Nur die oeffentlichen Paketpreise, also genau die Zahlen, die in der
       Preistabelle stehen. Die Mitgliederpreise sind bewusst NICHT hier:
       sie gelten erst nach Login und waeren fuer einen anonymen Crawler
       eine Preisangabe, die er nie bestaetigt bekommt. Wer die Tabelle
       aendert, aendert diesen Block mit. -->
```

### Zeile 931

```html
<!-- BreadcrumbList -->
```

### Zeile 952

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 977

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 983

```html
<!-- Noise texture -->
```

### Zeile 986

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 1019

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 1037

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 1043

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 1046

```html
<!-- ── Hero ── -->
```

### Zeile 1062

```html
<!-- ── WARUM 1:1 ── -->
```

### Zeile 1085

```html
<!-- ── WANN ── -->
```

### Zeile 1096

```html
<!-- ── PREISE ──
       Die Tabelle ist die einzige Preisquelle auf der Seite, auf die sich
       etwas anderes stuetzt: die Preisfrage im FAQ, das Angebots-Schema im
       Kopf und die Preiszeile im Hero nennen dieselben Zahlen. Wer hier
       etwas aendert, aendert diese drei Stellen mit. -->
```

### Zeile 1139

```html
<!-- ═════ PLATZ FUER DAS PROBETRAINING ═════
                 Sobald der Pass in bsport scharf ist, kommt die Zeile
                 HIER hin, direkt vor dieses Ende des tbody. Aufbau genau
                 wie die drei Zeilen darueber: ein <th role="rowheader"
                 scope="row"> mit dem Paketnamen, danach vier <td
                 role="cell"> mit den Attributen data-spalte="Preis",
                 "pro Einheit", "Mitglieder" (plus class="pt-preise-mg")
                 und "pro Einheit". Betraege mit geschuetztem Leerzeichen
                 vor dem Eurozeichen.

                 Am CSS ist nichts zu tun, die Zeile faellt in dieselben
                 Regeln. Zu aendern sind danach nur noch die drei Stellen,
                 die auf diese Tabelle zeigen: die Preisfrage im FAQ, das
                 Angebots-Schema im Kopf und, falls der Preis nach aussen
                 soll, die Preiszeile im Hero und die Meta-Beschreibung.
                 ══════════════════════════════════════ -->
```

### Zeile 1162

```html
<!-- ── Coaches ── -->
```

### Zeile 1213

```html
<!-- ── SO STARTEST DU ──
       Dieselbe Dreier-Komponente wie WARUM 1:1, nur auf Rauch statt Creme.
       Rauch und nicht Creme, weil darueber die dunkle Coach-Wand steht und
       darunter die cremefarbene Buchung beginnt: die Stufe fuehrt von einem
       zum anderen, zwei Cremeflaechen hintereinander wuerden verschmelzen. -->
```

### Zeile 1243

```html
<!-- ── PT Booking Widget ── -->
```

### Zeile 1251

```html
<!-- KEIN AUTOMATISCHER ZOOM BEIM TIPPEN INS FELD
           Gemessen auf einem echten iPhone (Chrome iOS, 402px breit):
           visualViewport.scale 1.1418, innerWidth 352, offsetLeft 5. Das ist
           exakt 16/14 - die Signatur des iOS-Zooms, der beim Fokus auf ein
           Feld mit weniger als 16px Schrift einsetzt. Die Seite wird dabei
           NICHT breiter (scrollWidth blieb 402 = clientWidth), sie wird
           vergroessert und verschoben, und dadurch sind beide Kanten
           beschnitten: Burger rechts, Uhrensymbol links.

           Das Feld steht in Bsports eigenem Dokument im srcdoc. Unser CSS
           kaskadiert dort nicht hinein, aber das srcdoc ist unser Text -
           also steht die Regel hier drin, als erstes Element des Dokuments.
           Zwei Zeilen, mehr nicht:
             input, select, textarea  auf 16px, damit iOS nicht zoomt
             html { touch-action: manipulation }  gegen den Doppeltipp-Zoom

           Am viewport-meta der Seite aendert sich NICHTS. Kein
           maximum-scale, kein user-scalable=no: Zusammenziehen muss
           moeglich bleiben, das ist seit PR #121 so entschieden. -->
```

### Zeile 1270

```html
<!-- DER STYLE-BLOCK IM SRCDOC IST UNSER EINZIGER HEBEL IM WIDGET

     Dieses iframe traegt sein Dokument per srcdoc. Es hat zwar unsere
     Herkunft, ist aber ein eigenes Dokument: assets/css/style.css
     kaskadiert NICHT hinein, nur der style-Block in data-bsport-srcdoc
     wirkt dort. Siehe den Kopf von assets/js/pt-dom-diagnose.js.

     Darin stehen jetzt drei Dinge:
       1. 16px auf Eingabefelder, gegen den Fokuszoom auf dem iPhone
       2. touch-action: manipulation, gegen den Doppeltipp-Zoom
       3. Creme auf innerContainer und topBar von Bsports Anmeldefenster.
          Der Betreiber hat die beiden Flaechen im laufenden Widget als
          rgb(255,255,255) gemessen; die Begruendung steht ausfuehrlich
          in assets/css/style.css am Ende. Dort steht dieselbe Regel fuer
          die 19 Seiten, die das Widget direkt im Seitendokument tragen. -->
```

### Zeile 1292

```html
<!-- ── FAQ ── -->
```

### Zeile 1359

```html
<!-- ── SCHLUSS-CTA ──
       Creme zwischen dem dunklen FAQ und dem dunklen Footer: dieses Band
       ist die letzte helle Flaeche der Seite und damit der Punkt, an dem
       das Auge haengen bleibt. -->
```

### Zeile 1374

```html
<!-- ── Footer ── -->
```

### Zeile 1467

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 1609

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1610

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```

### Zeile 1614

```html
<!-- Rahmenhoehe: laedt nichts von bsport.io, misst nur unser eigenes iframe. -->
```

### Zeile 1616

```html
<!-- Diagnose: tut ohne ?ptdom=1 nichts, laedt nichts, misst nur unser iframe. -->
```


## preise.html (39 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 37

```html
<!-- Favicons -->
```

### Zeile 47

```html
<!-- Open Graph -->
```

### Zeile 58

```html
<!-- Preload critical assets -->
```

### Zeile 62

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 70

```html
<!-- Site styles -->
```

### Zeile 73

```html
<!-- Schema.org -->
```

### Zeile 305

```html
<!-- Der gemeinsame Stilblock der Landeseiten, Zeile fuer Zeile aus
       boxen-muenchen.html uebernommen: .seo-hero, .seo-section und die
       drei Flaechen --dark/--smoke/--light, die Brotkrumen und die
       Aufzaehlung. Nichts daran geaendert. Die Regeln dieser Seite
       stehen im Block darunter. -->
```

### Zeile 555

```html
<!-- OHNE JAVASCRIPT BLEIBT DIE SEITE SONST LEER.
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       IntersectionObserver auf .visible gesetzt. Auf einer Preisseite ist
       das die falsche Abhaengigkeit: wer JavaScript blockiert, saehe kein
       einziges Preisschild. Die Regel hier hebt das nur fuer diese Seite
       und nur ohne JavaScript auf. Mit JavaScript aendert sich nichts. -->
```

### Zeile 1347

```html
<!-- ── Reveal-Wache ──────────────────────────────────────────────────────
       .reveal steht in style.css auf opacity: 0 und wird erst von einem
       Beobachter auf .visible gesetzt. Laeuft dieser Beobachter aus
       IRGENDEINEM Grund nicht, bleibt der halbe Seiteninhalt dauerhaft
       unsichtbar. Moegliche Gruende gibt es viele und sie liegen nicht
       alle in unserer Hand: ein Fehler frueher im selben Skriptblock, ein
       Blocker, der den Block neutralisiert, eine Erweiterung im Browser
       des Besuchers.

       Diese Wache macht das Symptom unmoeglich, ohne die Ursache kennen zu
       muessen: meldet sich der Beobachter nicht binnen 2,5 Sekunden, wird
       alles sichtbar gemacht. Laeuft er normal, loescht er den Wecker als
       erste Handlung und niemand merkt etwas.

       Eigener Skript-Tag mit Absicht: so kann ihn kein Fehler in einem
       anderen Block mitreissen. -->
```

### Zeile 1372

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 1378

```html
<!-- Noise texture -->
```

### Zeile 1381

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 1414

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 1430

```html
<!-- ═══════ WHATSAPP FLOAT ═══════ -->
```

### Zeile 1436

```html
<!-- Das generische Buchungsfenster der Vorlage (#booking-modal mit
     bsport-widget-464090) steht hier NICHT. Auf dieser Seite fuehrt kein
     Knopf hinein: die Mitgliedschaften oeffnen das Abo-Overlay weiter
     unten, Personal Training verweist auf /personal-training-boxen-muenchen
     und die Einzelkarten auf /stundenplan. Ein Widget-Container ohne
     Knopf waere nur ein weiterer Platz, an dem die Einwilligungssperre
     erscheint. -->
```

### Zeile 1444

```html
<!-- ═══════ MAIN ═══════ -->
```

### Zeile 1454

```html
<!-- ── Hero ── -->
```

### Zeile 1465

```html
<!-- Zahl und Stand setzt seo-bauen.mjs aus BEWERTUNG ein, derselben
           Konstante wie auf /probetraining. Nicht von Hand aendern. -->
```

### Zeile 1474

```html
<!-- ── Umschalter. Vier Verweise, kein JavaScript. ── -->
```

### Zeile 1484

```html
<!-- ── Mitgliedschaften ── -->
```

### Zeile 1722

```html
<!-- ── Personal Training ── -->
```

### Zeile 1806

```html
<!-- ── Weitere Optionen ── -->
```

### Zeile 1846

```html
<!-- ── Drei Zusagen ── -->
```

### Zeile 1860

```html
<!-- ── FAQ ── -->
```

### Zeile 1900

```html
<!-- ── Schluss ── -->
```

### Zeile 2006

```html
<!-- ═══════ SCRIPTS ═══════ -->
```

### Zeile 2152

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 2153

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```

### Zeile 2168

```html
<!-- BSPORT — CDN loader (guards against double-load) -->
```

### Zeile 2171

```html
<!-- BSPORT — MountBsportWidget helper with retry -->
```

### Zeile 2183

```html
<!-- BSPORT — Abo-Overlay: Mount und Nachricht uebernimmt abo-embed.js.
     Montiert wird erst beim ersten Klick, nicht beim Seitenaufruf. -->
```

### Zeile 2186

```html
<!-- Paketklicks messen. Nur Lesen und Melden: kein preventDefault, kein
     Nachladen, kein Cookie. Siehe docs/tracking-events.md -->
```


## probetraining.html (51 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- ═══ FRUEHSTART DES KALENDERS ═══
       Nur auf dieser Seite. Wer schon eingewilligt hat, soll nicht warten,
       bis consent.cookiebot.com geladen, ausgewertet und gemeldet hat: im
       Livetest vom 26.10. vergingen 15 bis 25 Sekunden bis zum ersten
       Termin.

       Die Sperre darueber entscheidet weiterhin allein, OB geladen wird.
       Ohne Einwilligung faengt sie dieses Skript-Tag ab und haelt es
       zurueck. Dieses Stueck entscheidet nur, WANN angefangen wird, und
       fragt dafuer Cookiebots eigenen Keks, der sofort da ist.

       preconnect baut die Verbindung zu cdn.bsport.io auf, waehrend das
       Skript noch geholt wird. Auch das nur mit Einwilligung, darum in
       derselben Bedingung. -->
```

### Zeile 54

```html
<!-- Vorverbindung zu den zwei fremden Hosts, die diese Seite in JEDEM Fall
       kontaktiert: Cookiebot (blockierend, siehe unten) und der Google-Tag.
       preconnect baut nur DNS, TCP und TLS vorab auf. Es kommt kein Host
       hinzu, der nicht ohnehin schon geladen wuerde, und es werden keine
       Daten gesendet - es verlegt nur die Handschlaege in die Zeit, in der
       der Browser sonst wartet. Auf dem Handy im 4G-Netz sind das pro Host
       leicht 200 bis 400 ms, die vor dem ersten Zeichnen liegen. -->
```

### Zeile 63

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 84

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 85

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 87

```html
<!-- End Cookiebot CMP -->
```

### Zeile 88

```html
<!-- Google Ads
       Die Befehle stehen weiter HIER und laufen sofort: sie schreiben nur in
       window.dataLayer und kosten kein einziges Byte Netz. Der Consent-Mode-
       Default darueber und die Aktualisierung aus Cookiebot stehen also
       unveraendert vor ihnen in derselben Reihenfolge wie bisher - an der
       Einwilligung aendert sich nichts.

       Nur das HOLEN von gtag.js wandert hinter das load-Ereignis. Auf dem
       Handy im 4G-Netz konkurriert es sonst mit style.css, den Schriften und
       dem Buchungskalender um dieselbe Leitung. Die Warteschlange in
       dataLayer bleibt dabei vollstaendig: gtag.js arbeitet sie ab, sobald es
       da ist, es geht kein Ereignis verloren.

       requestIdleCallback mit Frist, plus ein harter Zeitgeber als Netz -
       das Tag muss in jedem Fall kommen, auch wenn der Browser nie Ruhe
       meldet oder load schon vorbei ist.

       ABWAEGUNG, DIE DU KENNEN SOLLTEST: wer die Seite in der ersten Sekunde
       nach load wieder verlaesst, wird von Google Ads womoeglich nicht mehr
       als Seitenaufruf gezaehlt. Heute gilt das genauso fuer jeden, der vor
       dem async-Skript abbricht, aber das Fenster wird etwas groesser. Soll
       es zurueck, genuegt es, hier wieder ein <script async src=...> zu
       setzen. -->
```

### Zeile 135

```html
<!-- End Google Ads -->
```

### Zeile 136

```html
<!-- ZWEI TESTSCHALTER FUER DEN VERSETZTEN CURSOR IM EXPRESS-CHECKOUT
       Beide sind reine Vergleichsschalter fuer den Test am echten iPhone.
       Ohne sie aendert sich an der Seite nichts - die Abfrage unten ist der
       einzige Ort, an dem sie gelesen werden, ausser in den drei Skripten,
       die in ihrem Kopf dieselbe Klasse pruefen.

       ?ptplain=1  Die Seite laedt den Kalender OHNE unsere eigenen
                   Widget-Styles (der Einhaengepunkt bekommt eine andere
                   Kennung, damit die rund 210 Regeln an
                   #bsport-widget-172485 nicht greifen), ohne das
                   Leertag-Skript, ohne die Sticky-Leiste, ohne unsere
                   Scroll-Sperre und ohne die Zoomsperre darunter. Die
                   Einwilligungssperre bleibt: ohne Tipp laedt nichts von
                   bsport.io.

       ?ptzoom=1   Nur die Zoomsperre darunter bleibt aus, sonst ist alles
                   wie im Alltag. Damit laesst sich die eine Ursache
                   einzeln pruefen, ohne alles andere mit abzuschalten.

       Sitzt der Cursor mit ?ptplain=1 richtig, liegt es an uns. Sitzt er
       schon mit ?ptzoom=1 allein richtig, ist die Zoomsperre die Ursache.
       Sitzt er in beiden Faellen falsch, liegt es an bsport. -->
```

### Zeile 171

```html
<!-- KEIN AUTOMATISCHER ZOOM AUF DEM iPHONE
       Gemessen auf einem echten iPhone, nach PR #130: der Zoom steht
       weiter bei 1.1418 (= 16/14), und die Zoom-Aufzeichnung nennt als
       fokussiertes Element
         iframe.widget-8.bsport-user-interaction-modal__iframe
       Bsport haengt also in unser srcdoc noch einen EIGENEN Rahmen, und
       der kommt von bsport.io. Fremde Herkunft: weder unser CSS noch die
       Regel im srcdoc erreichen das Feld darin. Ueberlauf gibt es keinen,
       scrollWidth und clientWidth standen beide bei 402.

       Damit bleibt genau ein Hebel: das viewport-meta des obersten
       Dokuments. maximum-scale=1 unterbindet den Fokuszoom, den iOS von
       sich aus ausloest.

       NUR auf iPhone und iPod, und nur zur Laufzeit. Im Markup bleibt das
       meta unveraendert, damit Android, Schreibtisch, iPad und
       Suchmaschinen genau das sehen wie bisher. user-scalable=no steht
       hier NICHT: Zusammenziehen muss moeglich bleiben, und seit iOS 10
       laesst Safari es ohnehin zu, egal was hier steht - genau darum ist
       maximum-scale=1 vertretbar.

       Steht so frueh wie moeglich: direkt hinter dem meta, vor dem ersten
       Zeichnen. Die Reihenfolge der vorhandenen Skripte aendert sich
       nicht, hier kommt nur ein Inline-Block zwischen zwei Metazeilen. -->
```

### Zeile 219

```html
<!-- Favicons -->
```

### Zeile 238

```html
<!-- Preload -->
```

### Zeile 240

```html
<!-- HIER STANDEN ZWEI preload-ZEILEN FUER DIE STYLESHEETS, UND SIE WAREN
       JETZT SCHAEDLICH.
       Solange style.css das Zeichnen blockierte, war ein frueher Start
       richtig. Seit der Block mit dem kritischen CSS weiter unten das erste
       Bild traegt, braucht keine der beiden Dateien Vorrang - sie kommen per
       media="print" ohnehin, nur eben spaeter. Mit preload zogen sie
       dagegen 1,8 s lang Bandbreite mit hoher Prioritaet ab, waehrend das
       Heldenbild wartete; fetchpriority="low" hat Chromium bei as="style"
       nicht beachtet. Gemessen: LCP 2933 ms mit den Zeilen, 2371 ms ohne.
       Deshalb ersatzlos weg. -->
```

### Zeile 251

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 253

```html
<!-- Die drei Schriften des ersten Bildschirms: Oswald fuer die Augenbraue
       und den Knopf, Bebas Neue fuer die Ueberschrift, DM Sans fuer die
       Vertrauenszeile. Alle drei mit voller Prioritaet.

       fetchpriority="low" bei allen drei: das Heldenbild ist das LCP-Element
       und soll die Leitung bekommen. Dass die Schriften danach kommen,
       kostet jetzt nichts mehr - die massgleichen Rueckfallschriften in
       fonts.css halten den Umbruch, bis sie da sind.

       Ohne diese Rueckfallschriften war genau das noch falsch: gemessen kam
       dm-sans-latin.woff2 bei 2787 ms an, das erste Bild schon bei 1749 ms,
       und der Austausch verschob die halbe Seite (CLS 0,34). Mit ihnen liegt
       derselbe Lauf bei 0,007. Die eine Aenderung erlaubt die andere. -->
```

### Zeile 269

```html
<!-- ═══ DIE SCHRIFT-DEKLARATIONEN INLINE ═══
       fonts.css ist winzig (1,8 KB gepackt), hat aber als eigene Datei im
       Kopf eine volle Rundreise gekostet, bevor der Browser ueberhaupt
       wusste, welche Schriftdateien er braucht. Im 4G-Netz sind das rund
       150 ms, und sie lagen vor dem ersten Zeichnen.

       Hier stehen alle 21 @font-face-Regeln aus fonts.css, unveraendert und
       vollstaendig - kein Gewicht fehlt, keine Datei aendert sich. Darunter
       die drei massgleichen Rueckfallschriften; warum es sie gibt, steht in
       fonts.css beim Abschnitt "MASSGLEICHE RUECKFALLSCHRIFTEN". Die
       Erklaerungen zu Lizenz, Herkunft und Subsets stehen ebenfalls dort,
       das ist nach wie vor die Quelle. Neu erzeugen:
       node scripts/kritisches-css.mjs schreibt den Block nach
       /tmp/fontface.css.

       Die Datei wird darunter trotzdem noch geladen, nur ohne Blockade.
       Damit folgt die Seite einer spaeteren Aenderung in fonts.css von
       selbst, statt still zu veralten. Doppelte, identische Deklarationen
       kosten nichts.

       font-display: swap steht in jeder dieser Regeln - Text erscheint
       sofort in der Systemschrift und wird ersetzt, sobald die Schrift da
       ist. Deshalb haelt keine dieser Dateien das erste Zeichnen auf. -->
```

### Zeile 319

```html
<!-- ═══ KRITISCHES CSS FUER DEN ERSTEN BILDSCHIRM ═══
       WARUM DAS HIER STEHT
       style.css ist 270 KB, probetraining-page.css 43 KB. Beide blockierten
       das erste Zeichnen: der Browser sieht das Markup, darf aber nichts
       malen, bis beide da und geparst sind. Im 4G-Netz sind das mehrere
       Sekunden - gemessen FCP 5,7 bis 9 s auf dem Geraet.

       Hier stehen die Regeln der ersten ZWEI Bildschirme - nicht nur des
       ersten: die grossen Dateien kommen jetzt mit niedrigster Prioritaet
       und sind gemessen erst nach rund 4 s vollstaendig da, und der
       Buchungsabschnitt beginnt schon bei 0,78 Bildschirmen. Genau dorthin
       fuehrt der goldene Knopf, ungestylt darf er nicht sein.
       Sie sind NICHT von Hand ausgesucht, sondern ausgemessen: ein Skript
       laedt die Seite bei 320, 390 und 430 px und prueft jede Regel aus
       beiden Dateien gegen das Dokument. Mitgekommen ist, was ein Element
       im ersten Bildschirm trifft, dazu :root, html, body und die
       Keyframes. @font-face bleibt draussen, fonts.css wird weiter
       blockierend geladen - es ist klein und die Schriften braucht der
       erste Bildschirm sofort.

       Neu erzeugen: node scripts/kritisches-css.mjs - dort steht auch, wie
       der Block ersetzt und das Ergebnis geprueft wird. Wer am ersten
       Bildschirm etwas aendert, muss ihn neu erzeugen, sonst zeichnet die
       Seite kurz falsch und ruckt dann zurecht.

       Dies ist nur der Anlauf. Die vollstaendigen Dateien kommen direkt
       darunter und ueberschreiben alles davon, weil sie spaeter in der
       Reihenfolge stehen. Am Endzustand der Seite aendert sich nichts. -->
```

### Zeile 1359

```html
<!-- ═══ DIE VOLLSTAENDIGEN STYLESHEETS, OHNE BLOCKADE ═══
       media="print" laesst den Browser die Datei holen, ohne auf sie zu
       warten - sie gilt ja angeblich nur fuer den Druck. Das onload schaltet
       sie dann auf alle Medien. Der Trick ist alt und wird von jedem
       Browser verstanden; ohne JavaScript greift das noscript darunter.

       Die Reihenfolge der beiden link-Elemente bestimmt die Kaskade, nicht
       die Reihenfolge, in der sie ankommen. style.css vor
       probetraining-page.css, genau wie vorher. -->
```

### Zeile 1370

```html
<!-- Das Heldenbild ist das LCP-Element. Ohne Preload findet der Browser es
       erst, wenn er das Markup erreicht hat; mit Preload laedt es parallel zum
       CSS. imagesrcset und imagesizes muessen zum <picture> darunter passen,
       sonst laedt die Seite zwei verschiedene Dateien. -->
```

### Zeile 1382

```html
<!-- BreadcrumbList -->
```

### Zeile 1511

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 1517

```html
<!-- Noise texture -->
```

### Zeile 1520

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 1548

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 1573

```html
<!-- ═══════ ERSTER SCHIRM ═══════
     Mobil zuerst gebaut, 320 bis 430px. Was in den ersten Schirm gehoert:
     ein echtes Foto aus der Halle, die Zusage, eine kurze Vertrauenszeile
     und EIN goldener Knopf, der zum Kalender fuehrt. Nichts sonst.

     Das Foto ist ein <img> und kein CSS-Hintergrund: nur so kann der
     Browser es als LCP-Element frueh laden (fetchpriority="high"), und nur
     so stehen Breite und Hoehe fest, was Nachrutschen verhindert.

     gym-hall ist 1600x1067 und als WebP 84 KB gross. Kleinere Varianten
     gibt es nicht und waren hier nicht herstellbar - sharp liegt als
     Abhaengigkeit im Projekt, aber ohne node_modules laeuft es nicht. Bei
     84 KB ist das vertretbar; eine 480er und 760er Fassung waere trotzdem
     besser und ist ein eigener kleiner Schritt.                          -->
```

### Zeile 1605

```html
<!-- Die H1 traegt das Suchwort. Vorher stand hier der Zusagesatz "Dein
         erstes Boxtraining ist gratis": gut als Versprechen, aber ohne
         "Probetraining" und ohne "München" - also ohne das, wonach gesucht
         wird. Der Satz steht jetzt eine Zeile darunter und behaelt seinen
         Glanz auf "gratis". -->
```

### Zeile 1613

```html
<!-- Bewertung als Vertrauenszeile. Die Zahlen kommen vom Betreiber
         (204 Bewertungen, Durchschnitt 5,0) und stehen im Markup; sie
         werden nirgends automatisch nachgezogen. Ziel ist Googles
         dokumentierte Adresse nach Orts-ID; die ID stammt aus dem
         Bewertungslink des eigenen Unternehmensprofils.

         role="img" samt aria-label, damit Vorleseprogramme einen Satz
         hoeren statt "fuenf Komma null 204". -->
```

### Zeile 1642

```html
<!-- ═══════ BUCHUNG ═══════
     Das Widget haengt hier direkt im Seitenfluss. Kein Overlay, keine
     Hoehendeckelung, kein eigener Scroll-Container - gescrollt wird das
     Dokument. Genau dieses Muster laeuft auf stundenplan.html seit jeher
     ohne Scroll-Probleme.                                                  -->
```

### Zeile 1650

```html
<!-- Die id braucht pt-einstieg.js: mit einem Filter (?kurs=) nennt die
         Zeile nur die Kurse, die der Kalender dann wirklich zeigt. Ohne
         Filter bleibt dieser Satz stehen. -->
```

### Zeile 1655

```html
<!-- Steht hier und nicht erst im Buchungsfenster: der Kaufschritt von
         Bsport listet unter "Empfehlungen" zuerst das Abo (Bomaye Unlimited,
         Early Bird) und darunter den Pass "Probetraining - Bomaye Gym" fuer
         0,00 EUR. Wer den Gratis-Eintrag nicht bemerkt, haelt das Abo fuer
         den einzigen Weg und bricht ab. Die Zeile benennt deshalb genau das,
         was der Kunde dort sieht: den Namen und den Preis.

         Gleiches Bauteil wie die Zeile oben (.pt-booking-limit): goldener
         Randstrich, kein goldener Text. Gold auf Creme ergibt 2,01:1 und
         waere derselbe Kontrastfehler, der in PR #106 und #107 gerade
         beseitigt wurde. Auch --gold-dark kommt nur auf 3,34:1.

         Zwei geschuetzte Leerzeichen im Preis (vor 0,00 und vor dem
         Eurozeichen): sonst kann "0,00" am Zeilenende stehen und das Zeichen
         allein in der naechsten Zeile. Der Text bleibt derselbe, nur die
         Umbruchstelle wandert. -->
```

### Zeile 1672

```html
<!-- Nur am Wochenende sichtbar, eingeblendet von pt-einstieg.js. Der Text
         sagt bewusst nicht, der Kalender sei schon umgestellt: das Umstellen
         kann abbrechen, der Satz bleibt dann trotzdem richtig. -->
```

### Zeile 1676

```html
<!-- Das Netz unter dem Tagessprung. Leer im Markup, gefuellt und
         eingeblendet von pt-einstieg.js, und nur dann: wenn der Kalender
         nachweislich nicht auf den naechsten Termin gesprungen ist. Sonst
         saehe der Besucher einen leeren Tag ohne jede Auskunft. -->
```

### Zeile 1681

```html
<!-- Drei Schritte, direkt ueber dem Kalender. Sie standen vorher weiter
         oben in einem eigenen Abschnitt; dort kosteten sie einen halben
         Bildschirm Weg bis zum Kalender. Hier beantworten sie die Frage,
         die beim Hinsehen entsteht: was passiert, wenn ich tippe.

         Schritt 3 nennt den Gratis-Eintrag beim Namen. Bsports Kaufschritt
         listet unter "Empfehlungen" zuerst das Abo; wer den Eintrag fuer
         0 Euro nicht bemerkt, haelt das Abo fuer den einzigen Weg und
         bricht ab. -->
```

### Zeile 1697

```html
<!-- Der Notbehelf-Hinweis ("am Bildschirmrand wischen") ist ersatzlos
         weg. An seine Stelle tritt die Scroll-Hilfe: ein Knopf, der per
         JavaScript weiterschiebt, statt einen Umweg zu erklaeren, den die
         Leute selbst finden muessen. Aussehen in probetraining-page.css,
         Verhalten in probetraining-page.js beim Abschnitt "ZWEI WEGE". -->
```

### Zeile 1702

```html
<!-- DERSELBE AUFBAU WIE AUF /stundenplan
         .schedule-frame > .schedule-frame__widget > #bsport-widget-172485.
         Die Kennung ist bewusst dieselbe wie dort: an ihr haengen in
         style.css rund 210 Regeln fuer das Aussehen des Kalenders. Mit
         derselben Kennung gilt hier buchstaeblich dasselbe CSS, ohne eine
         einzige Zeile zu verdoppeln. Zwei Seiten, zwei Dokumente - die
         Kennung kollidiert nicht.

         id="pt-cal-view" bleibt an der aeusseren Huelle: die
         Einwilligungs-Bruecke bekommt genau dieses Element uebergeben
         (bomayeGateBsport in probetraining-page.js) und haengt ihren
         Hinweis hinein. Daran wird nichts geaendert. -->
```

### Zeile 1714

```html
<!-- Die drei data-gate-Attribute beschriften nur den Platzhalter der
         Einwilligungssperre (consent-bridge.js). Ohne sie steht dort der
         allgemeine Text wie auf den uebrigen Seiten. An der Sperre selbst
         aendert sich nichts: ohne Einwilligung laedt nichts von bsport.io. -->
```

### Zeile 1724

```html
<!-- Sichtbar zwischen Einwilligung und erstem Termin. pt-einstieg.js
           blendet ihn ein, sobald der Platzhalter weg ist, und wieder aus,
           sobald der Kalender steht. -->
```

### Zeile 1737

```html
<!-- Rueckfall fuer alle, die im Kalender nichts Passendes finden. Der Text
       ist vorbelegt, damit niemand selbst formulieren muss. -->
```

### Zeile 1746

```html
<!-- ═══════ DEIN ERSTES MAL ═══════
     Steht bewusst UNTER dem Kalender: wer hier liest, hat gebucht und
     fragt sich, was ihn erwartet. Die drei Schritte oben im Kopfbereich
     beschreiben die Buchung, diese hier den Besuch selbst.

     Texte aus /frauenboxen-muenchen, Abschnitt "DEIN ERSTES MAL" -
     dort als Fliesstext, hier auf drei Schritte gekuerzt. Kein neuer
     Text, nur ohne den Queens-Bezug, weil diese Seite fuer alle Kurse
     gilt. Bauteil .pt-steps ist dasselbe wie im Kopfbereich.        -->
```

### Zeile 1776

```html
<!-- ═══════ VERTRAUENSZEILE ═══════
     Dieselben Bausteine wie im Kopf der Startseite: .hero-cred-v2-item
     und .hero-cred-v2-divider, Wort fuer Wort derselbe Inhalt.

     NICHT uebernommen ist die Huelle .hero-credentials aus style.css -
     die steht auf opacity 0 und wird erst durch #hero.hero-revealed
     sichtbar. Dieses Element gibt es hier nicht, die Zeile bliebe also
     unsichtbar. Deshalb eine eigene Huelle, die nur das Flex-Layout
     macht.                                                          -->
```

### Zeile 1795

```html
<!-- ═══════ KLEBENDER KNOPF (nur Handy) ═══════
     Sichtbar, solange der Kalender nicht im Bild ist, und nur dann.
     Steht per hidden erst einmal nicht da: ohne JavaScript und ohne
     IntersectionObserver gibt es keine Leiste, statt einer, die den
     Kalender verdeckt. Verhalten in /assets/js/pt-einstieg.js.          -->
```

### Zeile 1804

```html
<!-- ═══════ FOOTER ═══════ -->
```

### Zeile 1924

```html
<!-- Probetraining: Widget inline im Seitenfluss, Tracking, Bsport-Dialog-Wache -->
```

### Zeile 1927

```html
<!-- Kalendertag: stellt den Bsport-Kalender nach dem Mounten auf einen
     Zieltag, ueber die Bedienelemente des Widgets. Dieselbe Datei wie auf
     /stundenplan, dort seit PR #80 im Einsatz. Tut nichts, solange sie
     niemand aufruft. -->
```

### Zeile 1932

```html
<!-- Einstieg: Wochenend-Hinweis samt Zieltag und der klebende Knopf. -->
```

### Zeile 1935

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1936

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```

### Zeile 1938

```html
<!-- Dialogwache: blendet die Kopfleiste aus und stellt die Seite fest,
     solange ein Bsport-Dialog offen ist. Dieselbe Datei auf beiden
     Seiten, damit sie nicht wieder auseinanderlaufen. -->
```

### Zeile 1942

```html
<!-- Nur mit ?ptdom=1: misst, was die Wache zu sehen bekommt und warum
     sie urteilt wie sie urteilt. Ohne den Parameter kehrt die Datei in
     ihrer ersten Zeile um. -->
```

### Zeile 1945

```html
<!-- DIAGNOSE NUR MIT ?ptdom=1
     Bewusst nachgeladen statt fest eingebunden: ohne den Parameter entsteht
     keine einzige Anfrage, und die Seite ist Zeile fuer Zeile die von vorher.
     async=false haelt die Reihenfolge ein - die Grundlage muss vor dem
     Bericht laufen, der auf sie zugreift. -->
```


## stundenplan.html (39 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Kurs-Deep-Link-Datum: bewusst OHNE defer. Die Seitenskripte stehen
       inline im Body und laufen waehrend des Parsens - ein defer-Skript
       kaeme erst danach, das Modul waere dann noch nicht da. -->
```

### Zeile 14

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 35

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 36

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 38

```html
<!-- End Cookiebot CMP -->
```

### Zeile 39

```html
<!-- Google Ads -->
```

### Zeile 39

```html
<!-- End Google Ads -->
```

### Zeile 41

```html
<!-- KEIN AUTOMATISCHER ZOOM AUF DEM iPHONE
       Gemessen auf einem echten iPhone, nach PR #130: der Zoom steht
       weiter bei 1.1418 (= 16/14), und die Zoom-Aufzeichnung nennt als
       fokussiertes Element
         iframe.widget-8.bsport-user-interaction-modal__iframe
       Bsport haengt also in unser srcdoc noch einen EIGENEN Rahmen, und
       der kommt von bsport.io. Fremde Herkunft: weder unser CSS noch die
       Regel im srcdoc erreichen das Feld darin. Ueberlauf gibt es keinen,
       scrollWidth und clientWidth standen beide bei 402.

       Damit bleibt genau ein Hebel: das viewport-meta des obersten
       Dokuments. maximum-scale=1 unterbindet den Fokuszoom, den iOS von
       sich aus ausloest.

       NUR auf iPhone und iPod, und nur zur Laufzeit. Im Markup bleibt das
       meta unveraendert, damit Android, Schreibtisch, iPad und
       Suchmaschinen genau das sehen wie bisher. user-scalable=no steht
       hier NICHT: Zusammenziehen muss moeglich bleiben, und seit iOS 10
       laesst Safari es ohnehin zu, egal was hier steht - genau darum ist
       maximum-scale=1 vertretbar.

       Steht so frueh wie moeglich: direkt hinter dem meta, vor dem ersten
       Zeichnen. Die Reihenfolge der vorhandenen Skripte aendert sich
       nicht, hier kommt nur ein Inline-Block zwischen zwei Metazeilen. -->
```

### Zeile 85

```html
<!-- Favicons -->
```

### Zeile 104

```html
<!-- Preload -->
```

### Zeile 108

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 116

```html
<!-- Styles -->
```

### Zeile 497

```html
<!-- Schema.org -->
```

### Zeile 604

```html
<!-- BreadcrumbList -->
```

### Zeile 628

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 634

```html
<!-- Noise texture -->
```

### Zeile 637

```html
<!-- ═══════ HEADER ═══════ -->
```

### Zeile 665

```html
<!-- ═══════ MOBILE NAV ═══════ -->
```

### Zeile 689

```html
<!-- ═══════ PAGE HERO ═══════ -->
```

### Zeile 693

```html
<!-- Suchwort in die H1, Slogan als Unterzeile. -->
```

### Zeile 700

```html
<!-- ═══════ WOCHENPLAN TIMELINE ═══════ -->
```

### Zeile 716

```html
<!-- MONTAG -->
```

### Zeile 767

```html
<!-- DIENSTAG -->
```

### Zeile 802

```html
<!-- MITTWOCH -->
```

### Zeile 853

```html
<!-- DONNERSTAG -->
```

### Zeile 896

```html
<!-- FREITAG -->
```

### Zeile 939

```html
<!-- SAMSTAG -->
```

### Zeile 957

```html
<!-- Sticky bottom conversion bar (mobile) -->
```

### Zeile 963

```html
<!-- ═══════ BSPORT CALENDAR ═══════ -->
```

### Zeile 982

```html
<!-- ═══════ CTA BAR ═══════ -->
```

### Zeile 995

```html
<!-- ═══════ FOOTER ═══════ -->
```

### Zeile 1265

```html
<!-- Bsport CDN -->
```

### Zeile 1418

```html
<!-- Die Dialogwache steht jetzt in /assets/js/bsport-dialog-wache.js und
     wird unten geladen - dieselbe Datei wie auf /probetraining. Hier stand
     eine eigene Kopie, die nur .bsport-user-interaction-modal__container
     und nur direkte Kinder von <body> kannte; den Kursdialog
     (bs-activity--dialog, eine Ebene tiefer) hat sie nie gesehen, und die
     Kopfleiste blieb am Schreibtisch darueber stehen. -->
```

### Zeile 1425

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 1426

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```

### Zeile 1428

```html
<!-- Dialogwache: blendet die Kopfleiste aus und stellt die Seite fest,
     solange ein Bsport-Dialog offen ist. Dieselbe Datei auf beiden
     Seiten, damit sie nicht wieder auseinanderlaufen. -->
```

### Zeile 1432

```html
<!-- Nur mit ?ptdom=1: misst, was die Wache zu sehen bekommt und warum
     sie urteilt wie sie urteilt. Ohne den Parameter kehrt die Datei in
     ihrer ersten Zeile um. -->
```

### Zeile 1435

```html
<!-- DIAGNOSE NUR MIT ?ptdom=1
     Bewusst nachgeladen statt fest eingebunden: ohne den Parameter entsteht
     keine einzige Anfrage, und die Seite ist Zeile fuer Zeile die von vorher.
     async=false haelt die Reihenfolge ein - die Grundlage muss vor dem
     Bericht laufen, der auf sie zugreift. -->
```


## u18.html (24 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 34

```html
<!-- Google Ads -->
```

### Zeile 34

```html
<!-- End Google Ads -->
```

### Zeile 41

```html
<!-- Open Graph -->
```

### Zeile 50

```html
<!-- Twitter -->
```

### Zeile 56

```html
<!-- JSON-LD -->
```

### Zeile 177

```html
<!-- Favicons -->
```

### Zeile 186

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 458

```html
<!-- BreadcrumbList -->
```

### Zeile 481

```html
<!-- Icon-Sprite. Ersetzt den Font-Awesome-Webfont; nur die auf dieser
     Seite verwendeten Symbole. Icons: Font Awesome Free, CC BY 4.0,
     https://fontawesome.com/license/free -->
```

### Zeile 487

```html
<!-- Header -->
```

### Zeile 536

```html
<!-- Main content: light block -->
```

### Zeile 551

```html
<!-- Dokumente-Hinweis -->
```

### Zeile 558

```html
<!-- Deine Dokumente: card grid (uses shared doc-card system from style.css) -->
```

### Zeile 657

```html
<!-- Info box -->
```

### Zeile 668

```html
<!-- Document grid -->
```

### Zeile 735

```html
<!-- Contact block -->
```

### Zeile 751

```html
<!-- Footer -->
```

### Zeile 793

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```

### Zeile 794

```html
<!-- Menuewache: schliesst das Burger-Menue und loest die Scroll-Sperre,
     wenn beim Drehen der Burger verschwindet. Siehe menue-wache.js. -->
```


## wochenplan.html (8 Kommentare)

### Zeile 5

```html
<!-- Bsport-Sperre: MUSS als erstes Skript laufen, vor jedem Markup und jedem
       Seitenskript, das bsport.io laden koennte. Ohne Marketing-Einwilligung
       wird nichts von bsport.io geladen (RudderStack, § 25 Abs. 1 TDDDG). -->
```

### Zeile 9

```html
<!-- Google Consent Mode v2 — muss VOR Cookiebot und vor jedem Tracking-Script stehen.
       Alle Werbe- und Analyse-Typen sind standardmaessig denied (Art. 6 DSGVO / § 25 TDDDG);
       die Freigabe erfolgt ausschliesslich per consent update aus Cookiebot.
       data-cookieconsent="ignore" ist zwingend: dieser Block darf von Cookiebot NICHT
       blockiert werden, sonst gaebe es keinen Default, gegen den das Update laufen kann. -->
```

### Zeile 30

```html
<!-- End Google Consent Mode v2 -->
```

### Zeile 31

```html
<!-- Cookiebot CMP — muss direkt nach dem Consent-Default und VOR GTM/gtag.js stehen. -->
```

### Zeile 33

```html
<!-- End Cookiebot CMP -->
```

### Zeile 36

```html
<!-- Favicons -->
```

### Zeile 48

```html
<!-- Schriften: selbst gehostet (kein Google-Request, LG Muenchen I).
       Preload der latin-Dateien, damit sie vor dem ersten Paint da sind. -->
```

### Zeile 288

```html
<!-- Consent-Bruecke: muss immer laufen, sie gated selbst und trackt nicht. -->
```


---

Gesamt: 870 Kommentare aus 26 Seiten.

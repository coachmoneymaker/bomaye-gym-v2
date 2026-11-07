---
version: alpha
name: bomaye-boxgym-munich
description: |
  Bomaye Boxgym Munich: ein Boxgym im Pineapple Park, München. Die Seite
  verkauft Probetraining und Mitgliedschaft. Dunkles, kantiges System aus
  drei Markentoenen (Schwarz, Creme, Gold), hohe Grossbuchstaben-Ueberschriften
  in Bebas Neue, echte Fotos aus dem Gym, Radius null, flache goldene
  Primaerknoepfe. Kein Reinweiss, kein Verlauf auf Knoepfen.
  Quelle aller Werte: assets/css/style.css (:root), assets/css/premium.css
  (Premium-Ebene, nur mit <html class="pr">: Startseite, Probetraining,
  Mitglied werden) und index.html. Bei Abweichungen gilt der Code.

colors:
  ink: "#0A0A08"            # --brand-dark / --ink, dunkle Abschnitte
  cream: "#F5F0E8"          # --brand-cream / --white, helle Abschnitte und Text auf Dunkel
  gold: "#C9A84C"           # --brand-gold / --gold, Primaerknopf, Akzente auf Dunkel
  gold-light: "#d4b472"     # --gold-light, Hover des Primaerknopfs
  gold-dark: "#A67C2E"      # --gold-dark, grosse Akzentwoerter auf Creme (3,3:1)
  gold-tief: "#7E5B20"      # --pr-gold-tief (premium.css), kleine goldene Schrift auf Creme (5,4:1)
  grau-auf-creme: "#5C574C" # premium.css, gedaempfter Text auf Creme (6,3:1)
  ink2: "#141414"
  smoke: "#1a1a1a"
  anthracite: "#1d1d1d"
  reviews-ground: "#EFE8DC" # Bewertungen auf der Startseite
  reviews-card: "#FAF9F6"

typography:
  display:
    fontFamily: Bebas Neue
    textTransform: uppercase
    lineHeight: 1.05
    letterSpacing: 0.02em
    h1: clamp(3rem, 8vw, 6.5rem)
    h2: clamp(2.5rem, 5.5vw, 4.5rem)
  head:
    fontFamily: Oswald       # Knoepfe, Etiketten, Kleinlabels, Zeiten
  body:
    fontFamily: DM Sans

shape:
  radius: 0                 # --radius, --radius-lg: Marke verlangt 0

motion:
  ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94)
  ease-expo: cubic-bezier(0.16, 1, 0.3, 1)
  dur-schnell: 150ms
  dur-normal: 250ms
  dur-ruhig: 500ms
  dur-auftritt: 800ms

spacing:
  takt-eng: clamp(2rem, 5vw, 4rem)
  takt: clamp(3rem, 7vw, 6rem)
---

# Bomaye Boxgym Munich: Designsystem

## Overview

Die Seite ist ein Verkaufsweg mit einem Ziel: Probetraining buchen, danach
Mitglied werden. Mobil zuerst (320 bis 430 px). Dunkle und cremefarbene
Abschnitte wechseln sich ab; Gold ist die einzige Akzentfarbe.

## Colors

- Drei Markentoene, sonst nichts: `#0A0A08`, `#F5F0E8`, `#C9A84C`.
  **Kein Reinweiss**, auch nicht als Kartenflaeche.
- Abstufungen entstehen ueber Deckkraft von Creme auf Schwarz bzw. von
  Schwarz auf Creme. Ausnahme: premium.css nutzt fuer gedaempften Text
  auf Creme den warmen Ton `#5C574C`.
- Kontrast (WCAG AA), geprueft in `tests/kontrast.mjs`:
  - Creme auf Schwarz: kleine Schrift mindestens `rgba(245,240,232,0.5)`
    (4,8:1), Fliesstext 0.6 und mehr.
  - Schwarz auf Creme: mindestens `rgba(10,10,8,0.6)` (5,0:1).
  - Gold `#C9A84C` auf Creme hat nur 2,0:1. Auf Creme gilt daher:
    grosse Akzentwoerter in `--gold-dark`, kleine Schrift und Links in
    `#7E5B20` (`--pr-gold-tief`). Gold `#C9A84C` als Schrift nur auf Dunkel.

## Typography

- Ueberschriften: Bebas Neue, Grossbuchstaben, ein Akzentwort pro
  Ueberschrift in `.gold` (auf Dunkel) oder `.gold-dark` (auf Creme).
- Knoepfe und Kleinlabels: Oswald, Grossbuchstaben, Sperrung.
- Fliesstext: DM Sans.

## Layout

- Abschnittsabstand ueber `--takt` / `--takt-eng`.
- Kein waagerechter Ueberlauf bei 320 px (`npm run pruefen:alles` prueft das).
- Mobile Buchungsleiste unten (`assets/js/sticky-buchung.js`), schweigt,
  solange ein Formular im Bild ist.

## Shapes

Radius 0 ueberall. Kanten statt Rundungen.

## Components

### Buttons
- Primaer: `.btn .btn--gold`, flache Goldflaeche, Text `--ink`. Hover
  (nur mit Maus): helleres Gold, leicht angehoben (`--gold-light`; auf den
  Premium-Seiten `#DDBF6A`, 1px). Druck: `scale(0.98)`, Premium `scale(0.97)`.
- Sekundaer: `.btn--outline-*`, Rahmen statt Flaeche.
- Auf Touchgeraeten bleibt nach dem Tippen nichts angehoben stehen
  (`@media (hover: none)` am Ende von `style.css`).
- Hover nie ueber Inline-JavaScript (`onmouseover`).

### Fokus
Ein Ring fuer alles: `outline: 2px solid var(--gold); outline-offset: 3px;`
nur ueber `:focus-visible`.

### Markierung und Formulare
`::selection` Gold auf Schwarz; `accent-color` Gold fuer Checkbox und Radio.

## Motion

- Nur `transform` und `opacity` bewegen, Transitionen mit benannten
  Eigenschaften, nie `transition: all`.
- Kein Einblenden beim Scrollen auf den Premium-Seiten (premium.css setzt
  `.reveal` sofort sichtbar). Die eine bewusste Bewegung ist der Auftritt
  des Heros. Auf den uebrigen Seiten gibt es `.reveal` noch; bei
  `prefers-reduced-motion` steht dort alles sofort.
- Hover-Bewegung nur fuer Geraete mit Maus.

## Do's and Don'ts

### Do
- Echte Fotos aus dem Gym.
- Deutsche Texte in Du-Form, echte Umlaute und ß.
- Fehlende Fakten als `TODO-OWNER` im Code-Kommentar, nie sichtbar.

### Don't
- Kein Reinweiss, kein Verlauf auf Knoepfen, kein Radius.
- Keine Gedankenstriche oder Halbgeviertstriche als Satzzeichen.
- Keine erfundenen Preise, Zahlen, Bewertungen.
- Tracking (Cookiebot, Meta Pixel, gtag, GTM, `pixel-events.js`) nicht anfassen.

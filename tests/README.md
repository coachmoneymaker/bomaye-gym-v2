# Testsuiten

Browsertests für Einwilligung, bsport-Buchung und Messung. Sie laufen mit
Playwright gegen einen kleinen Dateiserver, der diesen Baum ausliefert.

## Die Regel

**Nach jeder Änderung an Einwilligung, bsport, Messung oder dem Buchungstor:
`npm run test:alles`.**

Betroffen sind unter anderem `assets/js/anfrage-formulare.js`,
`assets/js/bsport-gate.js`,
`assets/js/consent-bridge.js`, `assets/js/probetraining-page.js`,
`assets/js/abo-embed.js`, `assets/js/plan-tracking.js`,
`assets/js/pixel-events.js`, der Anmeldehorcher in `mitgliederbereich.html`
und jedes `data-cookieconsent`-Attribut im Markup.

**Nach jeder Änderung an `assets/css/style.css`, an der Sticky-Leiste oder
am Layout einer Seite: ebenfalls `npm run test:alles`.** `breiten.mjs` und
`sticky.mjs` messen die Seiten in vierzehn Fenstergrößen; ein Überlauf auf
280 px fällt sonst erst auf dem Gerät eines Besuchers auf.

`npm run pruefen:alles` ersetzt das **nicht**. Es prüft Markup und Texte,
aber keinen laufenden Browser.

## Warum dieser Ordner existiert

Diese Suiten lagen bis zum 5. November 2026 in einem Sitzungsordner und
waren nach jeder Sitzung weg. Drei von ihnen sind dabei verloren gegangen
(siehe *Was fehlt*). Deshalb liegen sie jetzt im Repo.

## Starten

```bash
npm run test:alles              # alle Suiten, Zusammenfassung am Ende
node tests/zahlung.mjs          # eine einzelne Suite
```

Jede Suite endet mit `N/M bestanden, F Fehler` und gibt bei einem Fehler
den Rückgabewert 1. `tests/alles.mjs` bricht nicht beim ersten Fehler ab,
sondern lässt alle Suiten laufen und fasst am Ende zusammen.

Dauer: zusammen etwa zwölf Minuten (gemessen am 5.11.2026: 83 + 105 + 22 +
168 + 92 + 178 + 47 Sekunden, zusammen 637 Prüfungen). Die beiden längsten
sind `tor-text.mjs` und `sticky.mjs` (die Leiste auf elf Größen, jede frisch
geladen).
Zwei Abschnitte in `tor-knopf.mjs` warten absichtlich 15 beziehungsweise 17
Sekunden, weil der Lader in `probetraining-page.js` nach 15 Sekunden
aufgibt und genau das geprüft wird.

Deshalb hängt `test:alles` **nicht** an `pruefen:alles`: das läuft bei
jedem Bau und soll in Sekunden durch sein. Die Browsertests sind ein
eigener Schritt.

### Gegen einen anderen Baum

Jede Suite nimmt als erstes Argument ein Wurzelverzeichnis. Damit lässt
sich zeigen, dass eine Prüfung auf `main` scheitert und mit der Änderung
besteht:

```bash
git archive origin/main | tar -x -C /tmp/main
node tests/zahlung.mjs /tmp/main        # eine Suite gegen main
node tests/alles.mjs /tmp/main          # alle gegen main
```

Ohne Argument wird der Baum geprüft, in dem die Datei liegt.

Dass die Suiten wirklich Wächter sind und nicht nur mitlaufen, lässt sich
an den Ständen vor den jeweiligen Behebungen zeigen (gemessen am
5.11.2026):

| Suite | gegen | Ergebnis |
|---|---|---|
| `zahlung.mjs` | `ccd458c` (vor PR #190) | 8/22, **14 Fehler** — unter anderem „Lärm meldet auch hier nichts: Anzahl 1", also die Konversion auf `API_SUCCESS` |
| `abo-reveal.mjs` | `ccd458c` (vor PR #190) | 41/43, **2 Fehler** — `https://evil.example` leitet auf `/mitglied-werden` um und setzt `bsport_auth_complete` |
| `tor-knopf.mjs` | `66173c2` (vor PR #191) | 49/61, **12 Fehler** — kein zweiter Anlauf nach einem Fehlschlag, „Erneut versuchen" wirkungslos |
| `tor-text.mjs` | `210fe7a` (vor PR #192) | 74/109, **35 Fehler** — der Telefon-Absatz steht noch im Tor |
| `sticky.mjs` | `6cd3b64` (vor der Sticky-Politur) | 150/205, **55 Fehler** — Knopf 56 px statt 44 (auf 280 px sogar 79 px und drei Zeilen), Luft um den Knopf −0,7 px, das Kreuz ist das Zeichen „×" |
| `breiten.mjs` | `6cd3b64` (vor der Sticky-Politur) | 110/137, **27 Fehler** — `/u18` 300 px bei 280 px Fenster, `/datenschutz` 285 px, Startseite 334 px und `/probetraining` 402 px bei Systemschrift 130 % |
| `speicher-blockiert.mjs` | `6cd3b64` (vor der Sticky-Politur) | 58/60, **2 Fehler** — `SecurityError` aus dem Anmeldehorcher auf `/mitgliederbereich` |
| `kontrast.mjs` | `1ba6135` (nach Premium v3, vor dem Nachzug aus PR #205) | 14/40, **26 Fehler**: der Satz unter ALLE PROGRAMME mit 1,0:1 (Creme auf Creme), Footer auf 16 Seiten bis 2,25:1, Knopf bleibt am Handy angehoben, `onmouseover` und `transition: all` |
| `kontrast.mjs` (mit H, I, J) | `22db43c` (vor dem Kontrast-Nachzug ausserhalb der Premium-Ebene) | 40/71, **31 Fehler**: kleines Gold auf Creme mit 2,0:1 auf allen sieben Seiten, Footer von `/mitgliederbereich` 1,58:1, Social-Symbole auf `/coaches` 2,0:1, Kursnummer auf dem Foto 2,3:1 |

Gegen den aktuellen Stand bestehen alle zehn vollständig: 878 Prüfungen,
0 Fehler.

### Playwright

Erste Wahl ist `playwright` aus `node_modules` (`npm i -D playwright`).
Findet Node es dort nicht, wird die globale Installation versucht. Es wird
nur Chromium gestartet; Safari und WebKit sind hier nicht prüfbar.

## Die Suiten

### `zahlung.mjs` — die Buchungserkennung

Dass eine Buchung **nur** an `{"type":"PAYMENT_SUCCESS","source":"bsport"}`
vom Origin genau `https://backoffice.bsport.io` erkannt wird.

* Die echte Nachrichtenfolge von bsport (`API_ACKNOWLEDGE`, `API_SUCCESS`
  mit Nutzdaten, `bsport-widget-resize`, `CLOSE_MODAL`,
  `IFRAME_LOGIN_SUCCESS`, `intercom-snippet__ready`) löst **nichts** aus.
  `API_SUCCESS` enthält absichtlich `booking`, `confirmed` und `success` im
  Rumpf: daran ist die alte Textsuche gescheitert.
* Origin zeichengenau: `https://backoffice.bsport.io.angreifer.example`,
  `https://evil.example`, `http://backoffice.bsport.io` und
  `https://bsport.io` feuern nicht.
* Groß- und Kleinschreibung: `payment_success`, `Payment_Success` und
  `' PAYMENT_SUCCESS'` feuern nicht.
* Form: Zeichenkette, JSON-Text, `null`, falscher Schlüssel und
  verschachtelt feuern nicht.
* Entprellung: bsport sendet die Nachricht zweimal im Abstand von etwa vier
  Sekunden, es wird nur **einmal** gemeldet. Die Sperre im
  `sessionStorage` ist ein Zeitstempel, keine Flagge — eine zweite echte
  Buchung nach Ablauf der 60 Sekunden wird gezählt.
* Ohne Einwilligung wird nichts geladen und nichts gemeldet.

### `abo-reveal.mjs` — Overlay, Origins, Anmeldung, Sichtbarkeit

* **Abo-Overlay:** ein Klick auf einen Paketknopf navigiert nie, sondern
  öffnet das Overlay und nennt das Paket im Streifen — in allen drei
  Einwilligungszuständen und unter Cookiebots Blockade. Das ist der
  Rückschritt aus PR #177.
* **`abo-embed.js`:** eine Antwort von einem fremden Origin darf den
  Nachsendeplan nicht beenden.
* **Anmeldehorcher auf `/mitgliederbereich`:** ein fremder Origin darf
  weder `bsport_auth_complete` setzen noch umleiten, auch nicht mit
  `{type:'logged_in'}` oder einer Token-Nutzlast. `IFRAME_LOGIN_SUCCESS`
  von bsport leitet auf den gemerkten Abschnitt; ein neuer Nutzer
  (`isNewUser`) wird nicht umgeleitet.
* **Sichtbarkeit:** nach dem Durchscrollen bleibt unter Cookiebots Blockade
  kein Reveal-Abschnitt auf `opacity: 0` stehen. Auf `index.html` steckt
  der Beobachter in `main.js`; ohne Ausnahme war die Datei stillgelegt.

### `tor-knopf.mjs` — der Weg über den Tor-Knopf

Einwilligung **erst nach** dem Knopf, nicht schon beim Seitenaufbau. Genau
dieser Weg war bis PR #191 ungeprüft.

* Beide realistischen Startzustände von Cookiebot: `window.Cookiebot` ist
  bei `DOMContentLoaded` noch nicht da und erscheint erst später (so live
  gemessen), und: es ist schon da.
* Vor dem Knopf null Anfragen an bsport und kein
  `script#bsport-widget-cdn`; danach existiert es, `BsportWidget` ist
  geladen und `mount` wird mit `parentElement: 'bsport-widget-172485'`
  gerufen.
* Ein **gescheiterter erster Anlauf** blockiert die späteren nicht: nach
  einem Netzfehler und nach dem Aufgeben des Laders nach 15 Sekunden läuft
  ein neuer Anlauf, und der Grund steht in der Konsole.
* „Erneut versuchen" löst auf `/probetraining` wirklich einen neuen Anlauf
  aus. Der Knopf gehört `bsport-gate.js` und lud dort nur nach, was die
  Sperre abgefangen hatte — auf dieser Seite nichts.
* Regression auf `/stundenplan`, `/preise`, `/mitglied-werden`.

### `tor-text.mjs` — der Text im Buchungstor, alle Seiten

Über **alle** HTML-Seiten, ohne Einwilligung:

* Der Absatz „Lieber ohne Cookies buchen? Ruf uns an … WhatsApp" ist weg,
  als Element mit Klasse `__alt` und als Text (entfernt in PR #192).
* Wo ein Tor gezeichnet wird, steht der Einwilligungshinweis **Wort für
  Wort** unverändert da.
* Der Rückfall nach dem **zweiten** gescheiterten Ladeversuch ist noch da,
  mit Telefon und WhatsApp — als Verhalten geprüft, nicht als Zeichenkette:
  cdn.bsport.io wird abgewiesen und zweimal „Erneut versuchen" geklickt.
* Die Zeile unter dem Kalender auf `/probetraining` und die Kontaktdaten
  sonst bleiben.
* Die Video-Fassade auf der Startseite behält ihren eigenen Absatz samt
  44px-Tippflächen. Sie teilt die CSS-Klasse mit dem Buchungstor;
  unterschieden wird am Knopf („… VIDEO LADEN").

### `speicher-blockiert.mjs` — die Seite ohne sessionStorage

`sessionStorage` ist nicht nur manchmal leer, es **wirft**: im privaten
Fenster, bei blockierten Seitendaten, in manchen App-Browsern. Die Suite
ersetzt es durch eine Fassung, deren `getItem`, `setItem` und
`removeItem` eine `SecurityError` werfen, und zwar bevor irgendein
Seitenskript laeuft.

* Startseite, /preise, /kurse und eine Landingpage, je bei 1440x900 und
  390x844: keine einzige Ausnahme, der Vorschalter ist binnen fuenf
  Sekunden aus dem Layout, der Held ist eingeblendet, die Bedienung im Kopf
  ist sichtbar (am Schreibtisch der Knopf, am Handy der Burger).
* Mit funktionierendem Speicher: der erste Besuch zeigt das Intro und es
  ist nach etwa 1,3 Sekunden durch, **nicht** erst durch das Netz; der
  Merker wird gesetzt; nach einem Neuladen im selben Tab wird das Intro
  uebersprungen. (Ein zweiter Tab zaehlt nicht: `sessionStorage` gilt je
  Tab.)
* Das Netz: wird `main.js` gar nicht ausgeliefert, verschwindet der
  Vorschalter trotzdem nach etwa vier Sekunden und der Held wird
  eingeblendet.

* `/mitgliederbereich`: der Anmeldehorcher las die gemerkte Sektion
  (`bsport_pending_section`) ungeschuetzt und brach bei werfendem Speicher
  mitten im Nachrichten-Behandler ab. Geprueft wird mit einem
  `MessageEvent`, dessen `origin` auf `https://backoffice.bsport.io` steht:
  keine Ausnahme, keine Umleitung, der Kopf bleibt bedienbar und ein Klick
  kommt an. Gegenprobe mit funktionierendem Speicher: dieselbe Nachricht
  fuehrt weiter auf `/mitglied-werden#abos` und leert den Merker. Fremde
  Herkunft loest nach wie vor nichts aus.

Gegenprobe gegen den Stand vor der Behebung: **39/46**, unter anderem
"Vorschalter steht nach 5 s noch" und "hero-revealed false".

### `sticky.mjs` — die Buchungsleiste am Handy

Die Leiste am unteren Rand, nur auf den dreizehn eingeschlossenen Seiten.

* Oben nicht da, nach dem Anker `data-sticky-ab` da, in der
  Abschluss-Sektion `data-sticky-aus` wieder weg. Der Test **sucht** die
  gueltige Stelle, statt eine feste Position anzunehmen: auf der Startseite
  folgt direkt hinter dem Preisblock schon der Abschluss, auf /kurse der
  Buchungsbereich, und beides verbirgt die Leiste zu Recht.
* Am Schreibtisch (1440x900) nie.
* Auf allen zwoelf ausgeschlossenen Seiten kein Markup, kein Skript, kein
  Anker.
* Stumm bei offenem Cookiebot-Dialog und bei einem Feld im Fokus, danach
  wieder da.
* Das Kreuz haelt die Sitzung durch, auch ueber ein Neuladen.
* Aussehen und Tippflaechen: dunkles Token, eine Goldlinie oben, Hoehe
  genau 64 px, `color-scheme: dark`, `text-size-adjust: 100%`, Knopf genau
  44 px hoch mit mindestens 8 px Luft oben und unten, Text auf **einer**
  Zeile und ohne Punkte, kein Messattribut am Knopf, kein Ueberlappen mit
  Fusstext, kein waagerechtes Schieben.
* Das Kreuz ist ein SVG mit zwei Strichen, ohne Schriftzeichen, 44x44 als
  Tippflaeche, in der erklaerten Farbe `rgba(245,240,232,0.55)` und
  ausdruecklich **nicht** in einem der beiden Browserblaus
  (`rgb(0,0,238)`, `rgb(0,122,255)`). `aria-label` unveraendert.
* Elf Groessen am Stueck, je frisch geladen: 280, 320, 344, 360, 375, 390,
  412, 430 hochkant, ein Querformat (667x375, dort 56 px hoch) und zweimal
  Systemschrift 130 % (320 und 390). Bei 390x260 ist die Leiste aus, weil
  sie dort mehr als ein Fuenftel des Bildes verdecken wuerde.
* Die alte Regel, die Cookiebots Abzeichen anhob, ist nachweisbar aus den
  Stilblaettern verschwunden.
* **Stille Zonen:** jedes `<form>` und jedes Element mit
  `data-sticky-still` legt die Leiste schlafen, solange es im Bild ist.
  Geprüft auf `/kurse`, wo die Corporate-Anfrage **unter** der
  Abschluss-Sektion steht und `data-sticky-aus` dort nicht mehr greift:
  über dem Formular schweigt die Leiste, oberhalb davon kommt sie zurück.
  Dazu die Gegenprobe auf `/preise`: das geschlossene Family-Modal ist
  `position: fixed` und liegt damit **immer** im Bild, zählt aber nicht
  als stille Zone, sonst wäre die Leiste dort für immer stumm. Offen
  schweigt sie, geschlossen ist sie wieder da.
* **Die Punkte des Karussells auf `/kurse`** tragen `aria-label`
  („Slide n von 7"), genau einer trägt `aria-current`, und der Behälter
  ist nicht mehr `aria-hidden`.
* `prefers-reduced-motion`: sichtbar, aber ohne Uebergangsdauer.
* Blockierter `sessionStorage`: die Leiste erscheint trotzdem und das
  Zumachen wirkt im Seitenaufruf.
* Der Klick fuehrt auf /probetraining.

### `startseite-schlank.mjs` — die verschlankte Startseite und die Umzüge

Die Startseite hatte vierzehn Abschnitte, jetzt sind es zehn. Zwei
Anfrageformulare sind auf andere Seiten gezogen. Die Suite prüft beides,
denn ein Umzug, bei dem das Formular am Ziel nicht absendet, wäre schlimmer
als gar kein Umzug.

* **Die Abschnitte:** genau `hero`, `schedule-preview`, `dna`, `reviews`,
  `disciplines`, `pricing`, `early-bird`, `faq`, `location`,
  `anfahrt-video`, in dieser Reihenfolge. Keiner von `money-slots`, `ort`,
  `bomaye-app`, `pt-teaser`, `family-modal`, `corporate-modal`,
  `corporate-boxing-form` ist noch da. `data-sticky-ab` sitzt weiter auf
  `#pricing`, `data-sticky-aus` auf `#early-bird`.
* **Kein toter Anker:** nichts verweist mehr auf `#ort`. Der Knopf
  „VIDEO: WEG ZUR TÜR" steht jetzt in `#location` und springt beim Klick
  wirklich zu `#anfahrt-video`.
* **Family auf `/preise`:** die Textzeile öffnet das Modal; leer
  abgesendet erscheinen die Pflichtfeldmeldungen und es geht **nichts**
  raus; drei Mitglieder ergeben drei Namensfelder; „Haushalt Nein" blendet
  die Adressfelder ein; ausgefüllt geht genau **eine** Anfrage per POST an
  `/api/contact` mit `type: 'family'`, allen Namen und dem Haushalt; das
  Kreuz schließt und setzt zurück.
* **Corporate auf `/kurse#corporate`:** Anker, Überschrift und der Satz
  „Stärke dein Team im Boxring."; leer abgesendet sechs
  Pflichtfeldmeldungen und nichts raus; ausgefüllt genau eine Anfrage mit
  `type: 'corporate'`, Firma, Personen, Datum, Uhrzeit und Catering.
* **Wortwahl:** „echt" steht auf der Startseite nur noch in den
  Google-Zitaten (die wörtlich bleiben); der Early-Bird-Satz steht im
  sichtbaren Text genau einmal auf `/` und einmal auf `/mitglied-werden`;
  „Wann öffnet" kommt weder im Text noch im FAQPage-Schema vor.
* **Nichts verloren:** Kickboxing und Queens stehen weiter auf `/kurse`,
  `/kickboxen-muenchen` und `/frauenboxen-muenchen`, mit sichtbaren
  Knöpfen auf `/probetraining`.

**Es geht keine echte Anfrage raus.** `/api/contact` wird abgefangen und
mit 200 beantwortet; was gesendet *würde*, steht im Protokoll und wird
geprüft.

### `corporate-seite.mjs` — die eigene Seite /corporate-boxing

Die Corporate-Anfrage stand unten auf `/kurse` und hat seit November 2026
eine eigene Seite. Die Suite prüft den Umzug in beide Richtungen.

* **Die Seite:** Antwortstatus 200 · genau eine H1 („Corporate Boxing
  München" im Quelltext, in Versalien gezeigt) · Titel ≤ 60 Zeichen,
  Beschreibung 120 bis 155, `og:title` gleich dem Titel, canonical richtig ·
  die vier Abschnitte in dieser Reihenfolge · im Hero genau **ein** Knopf
  („ANFRAGE SENDEN" auf `#anfrage"`), kein Probetraining-Knopf · drei
  Punkte unter „Was dein Team bekommt" · drei FAQ-Fragen · alle JSON-LD-
  Blöcke parsen und die Fragen im FAQPage-Schema sind Zeichen für Zeichen
  die im HTML · **keine Buchungsleiste** und kein Anker, der eine auslösen
  würde · kein waagerechtes Schieben auf den elf Breiten von `breiten.mjs`.
* **Das Formular:** alle zehn Felder da · leer abgesendet sechs
  Pflichtfeldmeldungen und **nichts** raus · ausgefüllt genau **eine**
  POST-Anfrage an `/api/contact` mit `type: 'corporate'` und **denselben
  Schlüsseln wie vorher** (keiner mehr, keiner weniger) · Erfolgsmeldung
  da, Formular weg · das Antwortversprechen heißt überall „innerhalb von
  24 Stunden", nirgends mehr „schnellstmöglich".
* **`/kurse`:** der Anker `#corporate` führt weiter an eine Stelle der
  Seite, dort steht jetzt eine Karte mit „ZUR ANFRAGE" auf
  `/corporate-boxing`, das Formular ist weg, `data-sticky-still` ist mit
  ihm entfallen und `anfrage-formulare.js` wird dort nicht mehr geladen.
* **Die Wege dorthin:** jede Seite mit Fußmenü verlinkt
  `/corporate-boxing`, keine mehr `/kurse#corporate`, der Tabellenlink in
  der Preisübersicht zeigt auf `/corporate-boxing#anfrage`, und die
  sitemap nennt die Seite genau einmal.

**Es geht keine echte Anfrage raus.** `/api/contact` wird abgefangen und
mit 200 beantwortet.

### `breiten.mjs` — die ganze Seite auf jeder Telefonbreite

Alle siebenundzwanzig Seiten durch vierzehn Fenstergroessen: hochkant 280,
320, 344, 360, 375, 390, 412, 430, 480, 600 und 768, im Querformat 667x375,
844x390 und 915x412. An jeder Stelle:

* Die Seite laesst sich nicht waagerecht schieben
  (`scrollWidth <= innerWidth`), oben und am Dokumentende.
* Kein Element ist breiter als das Fenster und keines ragt rechts hinaus.
  Elemente in einem Kasten mit `overflow-x` zaehlen nicht, die Preistabelle
  ist dort absichtlich breiter.
* Die Sticky-Leiste verdeckt keinen Fusslink, keinen Rechtslink und kein
  Eingabefeld, und der letzte Inhalt im Fuss bleibt oberhalb der Leiste.
* Die Leiste hat die vorgesehene Hoehe: hochkant 64 px, im Querformat 56 px.

Dazu Systemschrift 130 % auf `/`, `/preise` und `/probetraining` bei 320 und
390 px.

**Groesse umstellen statt neu laden:** 27 Seiten mal 14 Groessen waeren 378
Ladevorgaenge. Stattdessen wird jede Seite einmal geladen und danach das
Fenster umgestellt; fuer Ueberlauf und Ueberlappung ist das gleichwertig,
weil beides beim Neuberechnen des Layouts entsteht. Nicht nachgestellt
werden Masse, die ein Skript einmal beim Laden ausrechnet - die
ausfuehrlichen Messungen der Leiste bei frisch geladener Seite stehen in
`sticky.mjs`.

**Geschlossene Dialoge zaehlen nicht.** `#family-modal` und
`#corporate-modal` auf der Startseite stehen immer im Markup, `position:
fixed`, `display: flex`, `visibility: visible`, und sind nur ueber
`opacity: 0` und `pointer-events: none` zu. Die Felder darin haben eigene
Masse mitten im Bild. Eine Pruefung, die nur das Element selbst ansieht,
meldete die Leiste darum in jeder Breite als "verdeckt ein Eingabefeld".
Jede Pruefung laeuft deshalb die Vorfahren mit ab - dieselbe Falle wie in
`sticky-buchung.js`.

Gefundene und behobene Befunde beim ersten Lauf: vier (siehe PR zur
Sticky-Politur) - `/u18` auf 280 px, `/datenschutz` auf 280 px, die
Startseite und `/probetraining` bei Systemschrift 130 %.

### `kontrast.mjs`: Lesbarkeit und Touch nach dem Design-Audit

Misst jede sichtbare Textstelle auf einfarbigem Grund gegen WCAG AA
(4,5:1, ab 24 px oder 18,66 px fett 3:1): Startseite bei 320, 390 und
430 px, dazu der Footer jeder Seite, seit 7.11.2026 auch der eigene
Footer von `/mitgliederbereich`. Ebenso die ganzen Seiten `/about`,
`/coaches`, `/kurse`, `/stundenplan`, `/mitgliederbereich`, `/preise` und
`/faq` bei 320, 390 und 430 px (H). Text auf Fotos (Programmkarten der
Startseite, Hero, Videofassade, Coachfoto) ist dort ausgenommen;
abgeschaltete Knoepfe ebenso, die nimmt WCAG aus. Die Suite misst das
Ergebnis, egal ob die Farbe aus `style.css`, einem Inline-Stil oder
`premium.css` kommt.

Dazu auf `/coaches` die Instagram- und TikTok-Symbole gegen ihren Grund,
Soll 3:1 fuer Bedienelemente (I). Und kleine Schrift auf Fotos (die
Nummer ueber dem Kurstitel auf `/kurse`, die Angaben im Coachfoto auf
`/coaches`): Schrift ausblenden, die Flaeche dahinter abfotografieren,
jeden Bildpunkt gegen die Schriftfarbe rechnen; massgeblich ist der
Bildpunkt beim 95. Perzentil der Helligkeit (J).

Dazu: in der Touch-Emulation bleibt ein goldener Knopf mit erzwungenem
`:hover` flach, mit Maus hebt er sich weiter; der Early-Bird-Knopf
verschwindet beim Ueberfahren nicht mehr im schwarzen Abschnitt; keine
Seite nutzt `onmouseover`; keine Regel der Startseite nutzt
`transition: all`; markierter Text ist Gold auf Schwarz.

Dazu die helle Anfragekarte auf `/corporate-boxing` bei 320, 390 und
430 px, jede Textstelle in `.cb-anfrage__panel` (F), und vier Stellen,
an denen Etiketten und Umriss-Knoepfe fuer dunklen Grund in einem hellen
Abschnitt standen (G) (`/boxen-muenchen`, `/kinderboxen-muenchen`,
`/frauenboxen-muenchen`, `/kickboxen-muenchen`). Gegen `main` `22db43c`:
40/47, **7 Fehler** (Karte 1,05 bis 1,08:1, die vier Stellen je 1,00:1).

Die Touch-Emulation zeigt, welche Regeln greifen. Ob ein Knopf auf einem
echten iPhone nach dem Tippen haengen bleibt, sieht man nur dort.

### `gemeinsam.mjs`

Keine Suite, sondern die gemeinsame Grundlage: Dateiserver, Cookiebots
Blockade als Nachbau, Platzhalter für bsports Bundle, die
Einwilligungszustände und die Zählerei. Hier stehen auch die Texte, die
unverändert bleiben sollen, an einer Stelle.

## Was der Nachbau kann und was nicht

Nachgebaut ist Cookiebots automatische Blockade: jedes `<script>` ohne
`data-cookieconsent="ignore"` wird beim Ausliefern auf `type="text/plain"`
gestellt, solange Statistik nicht eingewilligt ist. Nachgespielt wird
nichts, denn Cookiebot führt `cdn.bsport.io` wegen RudderStack unter
Statistik und gibt die Skripte bei reiner Marketing-Einwilligung nie
zurück. Genau daran hing die Buchungsschleife (PR #188, #189, #190).

**Nicht prüfbar aus dieser Umgebung:**

* Das **echte Cookiebot**. `consent.cookiebot.com` ist über den Proxy nicht
  erreichbar, und Vorschau-Domains auf Vercel können keine Einwilligung
  speichern. Der Nachbau verhält sich wie die Live-Messungen, ist aber
  nicht das Original.
* Das **echte bsport-Widget**. `cdn.bsport.io` und `backoffice.bsport.io`
  sind nicht erreichbar; statt des Bundles läuft ein Platzhalter, der
  `BsportWidget.mount` bereitstellt und mitschreibt. Ob das echte Widget
  nach einem Anlauf sauber montiert, zeigt erst die Live-Seite.
* Die **tatsächlich ausgehende Google-Ads-Anfrage**.
  `googletagmanager.com` ist nicht erreichbar. Nachgewiesen wird die
  Konversion im `dataLayer`, nicht am Netzwerk.
* **Was GTM** auf `probetraining_booking_completed` weiterschickt. Steht
  nicht im Repo.
* **Safari, WebKit und echte Geräte.** Es ist nur Chromium installiert.

## Was fehlt

Fünf ältere Suiten gingen verloren, bevor dieser Ordner existierte: `faq`
(251 Prüfungen, 132 Antworten), `reveal` (94), `deeplink-abo` (394),
`plan-tracking` (45) und `tabs`. Sie waren **nie** im Git, nur im
Sitzungsordner, und sind nicht wiederherstellbar — die genannten Zahlen
stammen aus alten Berichten und sind hier nur als Hinweis notiert, nicht
als etwas, das man nachstellen könnte.

Teilweise aufgefangen ist der Verlust an anderer Stelle:
`npm run pruefen:alles` prüft über `scripts/reichweite-pruefen.mjs` alle
Knöpfe, die Widget-Container, die FAQ-Antworten und den waagerechten
Überlauf, und `abo-reveal.mjs` deckt den Abo- und Sichtbarkeitsteil ab, für
den `deeplink-abo` und `reveal` zuständig waren. Nicht aufgefangen sind die
Tab-Prüfungen und die Messprüfungen von `plan-tracking`.

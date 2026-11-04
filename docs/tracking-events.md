# Paketklicks messen

Was `assets/js/plan-tracking.js` meldet, wann es das tut, was die Einwilligung
daran ändert und was im Google Tag Manager noch einzurichten ist.

Stand 01.11.2026.

## Warum es diese Datei gibt

Auf `/preise` und `/mitglied-werden` löste bis dahin **kein Klick auf einen
Paketknopf irgendein Ereignis aus**. `abo-embed.js` fängt den Klick ab, ruft
`preventDefault()` und öffnet das Overlay, ohne etwas zu melden.
`pixel-events.js`, das auf bsport-Adressen `InitiateCheckout` feuert, liegt nur
auf der Startseite. Damit war nicht messbar, wie viele Besucher eine
Mitgliedschaft beginnen.

## Wo das Skript läuft

| Seite | Paketknöpfe | `plan-tracking.js` | GTM-Container |
|---|---|---|---|
| `/preise` | ja | ja | **nein** |
| `/mitglied-werden` | ja | ja | **nein** |
| `/` (Startseite) | ja | ja | ja |

Auf allen anderen Seiten wird es nicht geladen.

> **Wichtig:** der GTM-Container `GTM-W2T9NXMN` läuft heute **nur auf der
> Startseite**. Auf `/preise` und `/mitglied-werden` liegt lediglich `gtag.js`
> für Google Ads. Der `dataLayer` existiert dort zwar, aber es liest ihn
> niemand. Siehe [Was noch fehlt](#was-noch-fehlt).

## Die Ereignisse

### `begin_checkout` und `select_item`

Welches der beiden feuert, steht am Knopf in `data-ga-event` und wird im
Bauskript entschieden:

* **`begin_checkout`** nur für Knöpfe, die wirklich einen bsport-Checkout
  öffnen: alle mit `data-abo-contract` (Early Bird, Flex) und alle, deren Ziel
  auf eine bsport-Kaufadresse zeigt.
* **`select_item`** für Knöpfe, die nur auf eine Buchungsseite führen. Das
  sind heute die PT- und Pass-Knöpfe: sie landen auf
  `/personal-training-boxen-muenchen` und `/stundenplan`, wo erst der Kalender
  steht. Als Checkout gezählt hätten sie Navigationen unter Kaufabsichten
  gemischt.

Bekommt ein PT- oder Pass-Knopf später eine echte Kaufadresse, schaltet das
Bauskript ihn von selbst auf `begin_checkout` um.

**Meta und Google Ads feuern ausschließlich beim `begin_checkout`.** Ein
`select_item` geht nur in den `dataLayer`.

Die Nutzlast ist bei beiden gleich aufgebaut:

```js
{
  event: 'begin_checkout',
  ecommerce: {
    currency: 'EUR',
    value: 175.60,            // erste Abbuchung inkl. Aufnahmegebühr
    items: [{
      item_id: '45433',       // Vertragskennung oder Produktschlüssel
      item_name: 'Unlimited',
      item_category: 'membership_earlybird',
      price: 75.60            // laufender Monatspreis
    }]
  },
  page_location: 'https://www.bomayegym.com/preise',
  plan: 'unlimited',          // unlimited | youth | kids, sonst leer
  offer_type: 'earlybird'     // earlybird | flex, sonst leer
}
```

**Kategorien und was sie auslöst**

| `item_category` | Knopf | `item_id` | `value` |
|---|---|---|---|
| `membership_earlybird` | EARLY BIRD SICHERN | 45433 / 45434 / 45432 | Monat + 100 € |
| `membership_flex` | FLEX STARTEN (nur bei `FLEX_AKTIV`) | 59649 / 59651 / 59650 | Monat + 100 € |
| `personal_training` | PERSONAL TRAINING BUCHEN | `pt-nicht-zehn` usw. | Kartenpreis |
| `pass` | ZUM STUNDENPLAN | `daypass` / `opengym` / `zehner` | Kartenpreis |

Die ersten zwei Zeilen melden `begin_checkout`, die letzten zwei
`select_item`.

**Vertragskennungen, aus dem Code bestätigt, nicht geraten:**
45433 = Unlimited, 45434 = Youth, 45432 = Kids.

### `plan_overlay_opened`

```js
{ event: 'plan_overlay_opened', page_location: '…' }
```

Feuert, wenn `abo-embed.js` am Overlay die Klasse `is-open` setzt. Beobachtet
wird das mit einem `MutationObserver` auf dem Klassenattribut, **ohne
`abo-embed.js` anzufassen**. Gemeldet wird nur der Wechsel zu, nicht jedes
Schreiben am Attribut.

### Meta: `InitiateCheckout`

```js
fbq('track', 'InitiateCheckout', {
  value: 175.60, currency: 'EUR',
  content_ids: ['45433'], content_name: 'Unlimited',
  content_category: 'membership_earlybird'
}, { eventID: 'ic-<uuid>' });
```

Läuft **nur**, wenn beide Bedingungen stimmen:

1. `window.fbq` existiert bereits. Der Pixel entsteht ausschließlich in
   `consent-bridge.js`, und zwar erst nach erteilter Marketing-Einwilligung.
   Das Skript lädt **nie** selbst einen Pixel und legt **nie** `fbq` an.
2. `pixel-events.js` liegt **nicht** auf der Seite. Siehe unten.

Die `eventID` ist je Klick neu. Eine Kollision mit dem Server ist
ausgeschlossen: `api/bsport-webhook.js` sendet `Lead` und `Purchase` mit der
**Rechnungsnummer** als `event_id` und **nie** ein `InitiateCheckout`.

## Keine Doppelzählung

Auf der Startseite liegt `pixel-events.js`. Dessen Schlüsselwortliste enthält
`mitglied werden`, und genau so heißen die Knöpfe dort. Es feuert also heute
schon ein `InitiateCheckout`, allerdings **ohne Parameter**.

Liefen beide, zählte Meta doppelt. Deshalb **tritt `plan-tracking.js` beim
Meta-Aufruf zurück**, sobald ein `<script src="…pixel-events…">` auf der Seite
steht. Der `dataLayer`-Push läuft trotzdem.

**Warum diese Richtung:** `pixel-events.js` deckt auf der Startseite noch
weitere Links ab, nicht nur Paketknöpfe. Es abzuschalten hätte mehr entfernt
als nötig. Erkannt wird es am Skript-Tag, nicht an einer fest eingetragenen
Seite: wer `pixel-events.js` von der Startseite nimmt, bekommt dort
automatisch den vollständigen Aufruf mit Wert und Produktkennung.

**Folge, solange das so bleibt:** das Meta-`InitiateCheckout` der Startseite
trägt keinen Wert und keine `content_ids`. Auf `/preise` und
`/mitglied-werden` trägt es beides.

### Google Ads: Mikrokonversion auf den Checkout-Klick

```js
gtag('event', 'conversion', { send_to: ADS_CHECKOUT_SEND_TO, value: 175.60, currency: 'EUR' });
```

Läuft **nur**, wenn alle drei Bedingungen stimmen:

1. Es ist ein `begin_checkout`, also ein echter bsport-Checkout.
2. `ADS_CHECKOUT_SEND_TO` in `scripts/preise-daten.mjs` ist **nicht leer**.
   Leer ist der Auslieferungszustand: dann wird `gtag` **gar nicht gerufen**.
3. `typeof window.gtag === 'function'`.

Die Kennung steht an genau einer Stelle im Repo und wird vom Bauskript als
`data-ads-send-to` an den `<script>`-Tag von `plan-tracking.js` geschrieben.
Ist sie leer, fällt das Attribut ganz weg. **In JavaScript steht sie nie.**

Einzutragen ist die vollständige Kennung aus Google Ads, Form
`AW-18136756611/XXXXXXXXXXXXXXXXXXX`. Die Conversion-Action legt der Betreiber
dort selbst an.

**Einwilligung:** `plan-tracking.js` ruft **nie** `gtag('consent', …)` und setzt
`ad_storage` nicht. Im Kopf jeder Seite steht `gtag('consent','default', …)`
mit `ad_storage`, `ad_user_data`, `ad_personalization` und
`analytics_storage` auf `denied`, dazu `ads_data_redaction: true`,
`url_passthrough: false` und `wait_for_update: 500`. Googles Tag entscheidet
daraufhin selbst: im abgelehnten Zustand geht nur ein **cookieloser Ping** ohne
Klickkennung hinaus, eine vollständige Konversion erst nach dem
`consent update` aus Cookiebot. Dieses Verhalten kommt vom Google-Tag, nicht
von uns, und wurde hier nicht verändert.

**Nicht zusätzlich im GTM auslösen.** Das wäre eine zweite Zählung.

## Entprellung

Ein zweiter Klick auf **denselben** Knopf innerhalb von **1500 ms** wird
verworfen, für `dataLayer` und Meta gleichermaßen. Zwei verschiedene Knöpfe
kurz hintereinander zählen beide.

## Einwilligung

| | ohne Einwilligung | mit Einwilligung |
|---|---|---|
| `dataLayer`-Push | **ja** | ja |
| `fbq` vorhanden | nein | ja |
| Meta-Aufruf | **nein** | ja |
| Anfrage an facebook.com | **keine** | wie bisher |

Der `dataLayer` ist eine Liste im Speicher der Seite und sendet für sich
genommen nichts. Was hinausgeht, entscheiden GTM und Consent Mode v2. Das
Skript fasst Cookiebot, die Consent-Mode-Vorgaben und `consent-bridge.js`
nicht an.

**Keine personenbezogenen Daten.** Übergeben werden Produktkennung,
Produktname, Kategorie, Preis und der Seitenpfad **ohne**
Abfragezeichenfolge, damit keine `utm`- oder `fbclid`-Werte mitlaufen. Keine
Adresse, kein Name, keine Besucherkennung.

## Woher die Zahlen kommen

Keine Zahl steht in JavaScript. `plan-tracking.js` liest ausschließlich
Datenattribute, die `scripts/preise-bauen.mjs` aus `scripts/preise-daten.mjs`
rendert:

| Attribut | Inhalt |
|---|---|
| `data-ga-event` | `begin_checkout` oder `select_item`. Fehlt es, gilt `select_item`. |
| `data-item-category` | Pflicht. Ohne sie meldet das Skript nichts. |
| `data-item-name` | Produktname |
| `data-price` | laufender Preis |
| `data-first-payment` | erste Abbuchung inkl. Aufnahmegebühr, nur Abos |
| `data-plan` | `unlimited` / `youth` / `kids` |
| `data-offer` | `earlybird` / `flex` |
| `data-item-id` | Kennung, wenn kein `data-abo-contract` am Knopf hängt |

Auf `index.html` und `mitglied-werden.html` stehen die Knöpfe von Hand im HTML;
dort setzt das Bauskript die Attribute anhand der Vertragskennung nach. Der
Lauf ist wiederholbar, Attribute stapeln sich nicht.

**Prüfung 8** in `scripts/preise-pruefen.mjs` vergleicht jedes dieser Attribute
auf allen drei Seiten gegen die Datenquelle. Ein getippter oder veralteter
Preis fällt dort auf, nicht erst in der Auswertung.

## Was im GTM einzurichten ist

Die GTM-Seite macht der Betreiber selbst. Nötig ist:

**1. Container auf `/preise` und `/mitglied-werden` ausliefern.**
Ohne das kommt von dort nichts an. Der Snippet-Einbau wurde hier bewusst
**nicht** vorgenommen.

**2. Variablen** (Datenschichtvariable, Version 2):

| Name | Datenschichtvariablenname |
|---|---|
| `dlv.ecommerce` | `ecommerce` |
| `dlv.plan` | `plan` |
| `dlv.offer_type` | `offer_type` |
| `dlv.page_location` | `page_location` |

**3. Trigger:**

| Name | Typ | Bedingung |
|---|---|---|
| `CE – begin_checkout` | Benutzerdefiniertes Ereignis | Ereignisname `begin_checkout` |
| `CE – plan_overlay_opened` | Benutzerdefiniertes Ereignis | Ereignisname `plan_overlay_opened` |

**4. Tags:**

| Tag | Typ | Trigger | Hinweis |
|---|---|---|---|
| GA4 `begin_checkout` | GA4-Ereignis | `CE – begin_checkout` | „E-Commerce-Daten senden" aus der Datenschicht |
| Google Ads Conversion | Conversion-Tracking | `CE – begin_checkout` | Wert aus `dlv.ecommerce`, Währung EUR |
| GA4 `plan_overlay_opened` | GA4-Ereignis | `CE – plan_overlay_opened` | optional |

**Meta nicht über GTM auslösen.** Das Pixel-Ereignis feuert bereits aus
`plan-tracking.js`. Ein zweites Tag im GTM zählte doppelt.

**Einwilligungseinstellungen** je Tag: `ad_storage` und `analytics_storage`
erforderlich, passend zur Consent-Mode-Vorgabe.

## Was noch nicht gemessen wird

1. **GA4 und Google Ads sehen von `/preise` und `/mitglied-werden` nichts**,
   solange der GTM-Container dort nicht ausgeliefert wird. Meta misst dort
   schon, weil `consent-bridge.js` den Pixel auf allen Seiten lädt.
2. **Kein Kaufabschluss aus dem Browser.** Siehe unten.
3. **Kein Ereignis, wenn der Besucher im bsport-Overlay abbricht** oder
   weiterklickt. bsport meldet uns nichts, worauf wir uns stützen könnten.
4. **Der genaue bsport-Produktname der Mitgliedschaften steht nicht im Repo.**
   `item_name` trägt den Namen von der Seite (`Unlimited`, `Youth`, `Kids`).
   Bei den Pässen ist es der echte bsport-Name (`Bomaye Day Pass`), weil der
   in `preise-daten.mjs` steht.

## Kaufabschluss: Vorschlag, nicht umgesetzt

**Es gibt im Browser kein verlässliches Abschlusssignal.** `abo-embed.js`
schreibt eingehende bsport-Nachrichten nur mit `?bsdebug=1` ins Protokoll und
wertet sie nicht aus. Im ganzen Repo ist genau **eine** Nachrichtenart belegt,
und zwar die, die wir selbst senden
(`bsport:subscription:add-to-cart:contract`). Welche Antworten bsport schickt,
ist hier nicht nachprüfbar: `cdn.bsport.io`, `backoffice.bsport.io` und die
Dokumentation sind aus der Entwicklungsumgebung nicht erreichbar.

**Der Abschluss wird bereits serverseitig gemeldet.** `api/bsport-webhook.js`
sendet an Meta CAPI:

| Fall | Meta-Ereignis | Wert | `event_id` | `event_source_url` |
|---|---|---|---|---|
| Probetraining (Summe 0) | `Lead` | 30 € fest | Rechnungsnummer | `/probetraining` |
| Mitgliedschaft (Summe > 0) | `Purchase` | Rechnungsbetrag | Rechnungsnummer | `/mitglied-werden` |

**Empfehlung: kein `purchase` aus dem Browser.** Der Browser kennt die
Rechnungsnummer nicht und könnte deshalb keine `event_id` setzen, die zum
Serverereignis passt. Meta würde jeden Kauf doppelt zählen. Der saubere Weg
wäre, den vorhandenen Webhook zusätzlich ein GA4-Measurement-Protocol-Ereignis
senden zu lassen, mit der Rechnungsnummer als `transaction_id`. Das ist eine
Änderung an `api/bsport-webhook.js` und wurde hier **nicht** vorgenommen.

---

# Probetrainingsbuchung an Google Ads

Stand 03.11.2026.

## Der Befund

Die Conversion-Action **„Probetraining-Buchung Server-Side"** (Typ Website,
primär, Ziel Lead-Formulare senden, 30 EUR) meldete „Conversion has never
received data". Der Grund steht an drei Stellen:

1. Auf `/probetraining` liegt **kein GTM-Container**, nur `gtag.js` für
   `AW-18136756611`. Nachgezählt: `GTM-W2T9NXMN` steht heute allein auf der
   Startseite.
2. `probetraining-page.js` meldete eine bestätigte Buchung ausschließlich als
   `dataLayer.push({ event: 'probetraining_booking_completed' })`. Auf dieser
   Seite liest den `dataLayer` niemand.
3. Der serverseitige Weg in `api/bsport-webhook.js` (`sendGoogleConversion`)
   ruft den alten Pixel-Endpunkt `googleadservices.com/pagead/conversion/…`
   per GET aus Vercel auf, **ohne gclid**. Die Datei sagt das selbst: „Aus dem
   Bsport-Widget kommt keine Klick-Kennung … Deshalb kann Google die Buchung
   keiner Anzeige zuordnen."

## Was jetzt feuert

In `assets/js/probetraining-page.js`, in `_ptFireBookingConfirmed()`, direkt
neben dem bestehenden `dataLayer`-Push:

```js
gtag('event', 'conversion', { send_to: ADS_PROBETRAINING_SEND_TO });
```

* **Kennung:** `ADS_PROBETRAINING_SEND_TO`, eine Konstante am Kopf der Datei,
  sonst nirgends im Code. Wie `ADS_CHECKOUT_SEND_TO` für die Paketklicks.
* **Kein `value`, keine `currency`.** Die 30 EUR stehen in der
  Conversion-Action. Zwei Quellen für denselben Wert wären eine zu viel.
* **Keine personenbezogenen Daten.** Gesendet wird ausschließlich `send_to`.
* **Einmal je Buchung.** Entprellt über 60 Sekunden, Zeitstempel in
  `sessionStorage['bomaye:pt-konversion-gesendet']`. Nicht einmal je
  Sitzung: eine zweite echte Buchung wird gezählt.

## Einwilligung

Stand 04.11.2026. Die Absicherung hat sich geändert, weil die alte ein
Defekt war.

1. **`_ptEinwilligung()` fragt aktiv.** Erste Quelle ist
   `window.bomayeMarketingConsented()` aus `consent-bridge.js`, dieselbe,
   die über das bsport-Widget und den Meta-Pixel entscheidet. Fehlt sie,
   wird `Cookiebot.consent.marketing` direkt gelesen. Fehlt auch das, wird
   **nichts** gemeldet. Das ist die tragende Absicherung.
2. Im Kopf jeder Seite steht `gtag("consent","default", …)` mit `ad_storage`,
   `ad_user_data`, `ad_personalization` und `analytics_storage` auf `denied`.
3. Ohne Marketing-Einwilligung lädt das bsport-Widget nicht, es gibt also
   keine Buchung, die gemeldet werden könnte.

Die Datei ruft **nie** `gtag('consent', …)`.

**Was hier vorher stand, war falsch:** „`probetraining-page.js` trägt kein
`data-cookieconsent="ignore"`, ohne Einwilligung schreibt Cookiebot die
Datei auf `type="text/plain"` um." Das stimmte, war aber keine Absicherung,
sondern ein Defekt. Cookiebot führt bsport unter **Statistik**, also
blockierte es die Datei auch bei erteilter Marketing-Einwilligung. Dann blieb
der Buchungskalender leer und dieser Code lief nie. Die Datei trägt die
Ausnahme jetzt, und die Einwilligung wird im Code geprüft.

## Das Erfolgssignal

`_ptStartBookingTracking()` läuft, sobald das bsport-Widget montiert ist, und
erkennt eine Buchung an **genau einer** Nachricht:

```json
{"type":"PAYMENT_SUCCESS","source":"bsport"}
```

vom Origin **exakt** `https://backoffice.bsport.io`. Geprüft wird: Origin aus
einer festen Liste (kein Teilstring), `typeof event.data === 'object'`,
`event.data.type === 'PAYMENT_SUCCESS'`. Kein Textvergleich, nirgends.

Von bsport bestätigt (Luca): `PAYMENT_SUCCESS` kommt auf der
Bestätigungsseite des Checkouts, auch bei Gratisbuchungen und beim
Express-Checkout. **Eine offiziell dokumentierte Schnittstelle ist das
nicht**, deshalb steht die Quelle auch im Code. bsport sendet sie **zweimal**
im Abstand von etwa vier Sekunden, daher die Entprellung über 60 Sekunden.

Vom selben Origin kommen außerdem `API_ACKNOWLEDGE`, `API_SUCCESS` (mit
Nutzdaten), `bsport-widget-resize`, `CLOSE_MODAL`, `IFRAME_LOGIN_SUCCESS`
und `intercom-snippet__ready`. Keine davon bedeutet eine Buchung.

### Der Fehlalarm, den das ablöst

Bis zum 04.11.2026 suchte diese Stelle im zusammengesetzten Text der
Nachricht nach `booking`, `success`, `confirmed`, `buchung` und `viel spa`.
`API_SUCCESS` enthält `success`. Live gemessen: das dataLayer-Ereignis und
die Ads-Konversion feuerten **zehn Sekunden nach dem Laden des Widgets**,
etwa sieben Minuten vor der echten Buchung. Danach sperrte die Flagge in
`sessionStorage` die echte Buchung. Jeder, der nur den Kalender aufmachte,
erzeugte eine Konversion, und jede echte Buchung ging verloren.

Der zweite Weg, ein Haken auf `dataLayer.push`, der Ereignisnamen mit
`booking`, `purchase` oder `conversion` als Buchung zählte, ist
**ersatzlos entfernt**. Ein Ereignisname im dataLayer belegt keine Buchung.
Mit ihm ist auch die 30-Minuten-Uhr weg, die den Horcher wieder abnahm: wer
nach 35 Minuten auf derselben Seite bucht, soll gezählt werden.

**Vor dem Vertrauen in die Zahlen einmal gegenprüfen:** eine Buchung
durchführen, in der Konsole die Zeile `🎯 Probetraining booking tracked via:`
lesen. Dort steht der Auslöser und dahinter `| Google Ads:` mit dem Ergebnis.
`?ptdom=1` zeigt denselben Stand als Messleiste auf dem Schirm.

## Was noch offen ist

* **Kennung gegenprüfen.** `AW-18136756611/rNbMCMrqlq4cEIPjo8hD` ist von
  einem Screenshot abgelesen. Kleines L und großes I sind in vielen
  Schriften nicht zu unterscheiden. Stimmt ein Zeichen nicht, meldet Google
  weiterhin nichts, ohne Fehlermeldung.
* **Eine eigene Dankeseite `/danke`** wäre das einzige wirklich sichere
  Signal. Sie setzt voraus, dass bsport eine Rückkehradresse nach der
  Buchung unterstützt.
* **Der serverseitige Weg** (`sendGoogleConversion`, Data-Manager-Upload)
  bleibt unberührt und ist weiterhin standardmäßig aus.

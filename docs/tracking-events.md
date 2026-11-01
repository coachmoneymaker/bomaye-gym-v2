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

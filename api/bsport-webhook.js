/**
 * /api/bsport-webhook — Vercel Serverless Function (Node.js runtime)
 *
 * Receives Bsport booking/payment webhooks, authenticates via request
 * fingerprinting (Bsport does not support HMAC or custom headers),
 * deduplicates via Vercel KV, fires server-side conversion events to
 * Meta CAPI and Google Ads, and sends an internal admin email via Resend.
 *
 * Meta event mapping: an explicit numeric total of 0 → Lead (Probetraining,
 * value 30 EUR), total > 0 → Purchase (membership, actual invoice value). Both
 * carry the invoice ID as event_id. Lead is not sent from the browser anywhere.
 *
 * A total that is missing, null, empty or unparseable is NOT treated as 0 and
 * is reported to no ad platform — it is logged as "invoice-total-unusable" so
 * the payload shape can be inspected. Same for a negative total (credit note,
 * refund). The admin email still goes out in both cases.
 *
 * Processed events: "invoice-finalize" and "invoice-pay" (all invoices, paid and free).
 * booking-create, invoice-revert, and invoice-dispute are gracefully skipped.
 *
 * Required env vars:
 *   // Unused — Bsport does not support secrets. Kept for future HMAC support.
 *   // BSPORT_WEBHOOK_SECRET
 *   BSPORT_STRICT            — set to "false" to skip fingerprint checks (local dev)
 *   BSPORT_NEW_MEMBER_WINDOW_DAYS
 *                            — optional; ab welchem Rechnungsalter eine
 *                              Zahlung als wiederkehrend gilt. Voreinstellung
 *                              14 Tage. "off" schaltet das Signal ab und
 *                              laesst allein die KV-Merkliste entscheiden.
 *   META_PIXEL_ID            — Meta Pixel numeric ID
 *   META_ACCESS_TOKEN        — Meta Graph API system access token
 *   META_CAPI_ENABLED        — set to "false" to stop sending server-side Meta
 *                              events (dry run: the attempt is still logged).
 *                              Unset = enabled. See the flag's comment below.
 *   TEST_EVENT_CODE          — optional; routes CAPI events to the Test Events
 *                              tab instead of live reporting. Unset in production.
 *   GOOGLE_CONVERSION_ID     — format: AW-XXXXXXXXX
 *   GOOGLE_CONVERSION_LABEL  — Google Ads conversion label
 *   KV_REST_API_URL          — auto-injected when Vercel KV is linked
 *   KV_REST_API_TOKEN        — auto-injected when Vercel KV is linked
 *   RESEND_API_KEY
 *   BSPORT_BACKOFFICE_URL    — optional; Vorlage fuer den Knopf "In Bsport
 *                              oeffnen", mit {id} als Platzhalter fuer die
 *                              Kundennummer. Bestaetigte Adresse:
 *                              https://backoffice.bsport.io/member/{id}/info
 *                              Fehlt sie, steht die Nummer als Text in der Mail.
 *   ADMIN_EMAIL              — internal notification recipient
 *   FROM_EMAIL               — verified Resend sender address
 */

import { createHash } from 'node:crypto';
import { Resend } from 'resend';

// Keep body parser disabled so raw bytes are available for any future HMAC support.
export const config = { api: { bodyParser: false } };

// ── KV lazy-load ──────────────────────────────────────────────────────────────
// Same defensive pattern as api/lead.js: @vercel/kv Proxy throws on getter
// access when env vars are absent, so we guard before importing.
let _kv = null;
async function getKV() {
  if (_kv) return _kv;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const mod = await import('@vercel/kv');
    _kv = mod.kv;
    return _kv;
  } catch {
    return null;
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** SHA-256 hex — used for PII hashing and invoice-ID fallback. */
function hash(str) {
  return createHash('sha256').update(String(str ?? '').trim()).digest('hex');
}

/**
 * Read the invoice total (in cents) from a webhook payload.
 *
 * Returns null — not 0 — when the value is missing, null, empty or otherwise
 * unusable. The distinction matters: 0 is the value that classifies an invoice
 * as a free Probetraining and sends a Lead to Meta. Coercing an absent field to
 * 0 (`Number(obj.total ?? 0)`) made every payload without a readable total look
 * like a booked trial, which is exactly the fail-open that inflated the Lead
 * count. An amount we cannot read is not zero — it is unknown, and unknown is
 * not reportable.
 *
 * Booleans are rejected deliberately: Number(true) is 1, which would silently
 * become a 0.01 EUR Purchase.
 */
export function parseInvoiceTotalCents(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Accumulate the request stream into a single Buffer. */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Validate that a webhook request actually comes from Bsport.
 *
 * Bsport's webhook system does NOT support secrets, signatures, or custom
 * headers. The only authentication signal we have is request fingerprinting:
 *
 *   1. User-Agent must contain "python-requests" (Bsport's HTTP client)
 *   2. A sentry-trace header must be present (Bsport uses Sentry internally)
 *   3. Payload must match Bsport's schema (event_type + data.object)
 *
 * This is "defense in depth without a shared secret" — sufficient for a
 * low-value-target SMB endpoint. TODO: replace with IP allowlist once
 * Bsport support provides their static webhook egress IPs.
 *
 * Set BSPORT_STRICT=false in env to skip these checks (e.g. for local curl tests).
 */
function validateBsportRequest(rawBody, headers, parsedBody) {
  if (process.env.BSPORT_STRICT === 'false') {
    return { ok: true, mode: 'strict-disabled' };
  }

  const ua = String(headers['user-agent'] || '').toLowerCase();
  if (!ua.includes('python-requests')) {
    return { ok: false, mode: 'bad-user-agent', detail: ua.slice(0, 40) };
  }

  if (!headers['sentry-trace']) {
    return { ok: false, mode: 'missing-sentry-trace' };
  }

  if (!parsedBody?.data || (!parsedBody.data.object && !parsedBody.data.booking)) {
    return { ok: false, mode: 'bad-schema' };
  }

  return { ok: true, mode: 'bsport-fingerprint' };
}

// ── Meta CAPI ────────────────────────────────────────────────────────────────

/**
 * Build the hashed user_data block from whatever the Bsport invoice provides.
 *
 * Meta requires each value normalized *before* hashing: lowercased and trimmed,
 * city without spaces or punctuation, zip reduced to alphanumerics, country as
 * a two-letter ISO code. A field that is absent is omitted entirely — an empty
 * hash is worse than no field, because it matches nothing but still counts.
 *
 * Deliberately NOT sent: client_ip_address and client_user_agent. This runs in
 * a serverless function, so those describe Vercel's egress host and Bsport's
 * HTTP client, not the customer, and would degrade match quality rather than
 * improve it. fbc/fbp are forwarded only if the payload actually carries them.
 */
/**
 * Normalize a phone number to digits with a country code, as Meta expects
 * (no plus sign, no separators).
 *
 *   "089 123456"    → "4989123456"   national format, 0 replaced by 49
 *   "0151 2345678"  → "491512345678"
 *   "+49 89 123456" → "4989123456"   already international, left alone
 *   "0049 89 12345" → "498912345"    00 is the international prefix, not a
 *                                    national trunk 0 — dropping only one
 *                                    zero and prepending 49 would corrupt it
 *
 * A number that starts with neither 0 nor a known prefix is passed through
 * unchanged: it either already carries a country code or is foreign, and
 * guessing 49 for it would produce a hash that matches the wrong person.
 */
export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0'))  return `49${digits.slice(1)}`;
  return digits;
}

export function buildMetaUserData(customer = {}) {
  const userData = {};
  const lower = s => s.trim().toLowerCase();

  const put = (key, raw, normalize) => {
    const value = normalize(String(raw ?? ''));
    if (value) userData[key] = [hash(value)];
  };

  // Strip separators and punctuation but keep letters — "münchen" must stay
  // "münchen", not become "mnchen", or the hash never matches Meta's own.
  const alnum = s => lower(s).replace(/[^\p{L}\p{N}]/gu, '');

  put('em',      customer.email,      lower);
  put('ph',      customer.phone,      normalizePhone);
  put('fn',      customer.first_name, lower);
  put('ln',      customer.last_name,  lower);
  put('ct',      customer.city,       alnum);
  put('zp',      customer.zip,        alnum);
  // Two-letter ISO code only. A full country name ("Germany") would truncate to
  // a wrong code, so it is dropped instead — no field beats a wrong field.
  put('country', customer.country,    s => {
    const code = lower(s).replace(/[^\p{L}]/gu, '');
    return code.length === 2 ? code : '';
  });

  // Click ID and browser ID are identifiers, not PII — they are sent unhashed.
  if (customer.fbc) userData.fbc = String(customer.fbc);
  if (customer.fbp) userData.fbp = String(customer.fbp);

  return userData;
}

/**
 * Die Seite, auf der die Konversion entstanden ist.
 *
 * Meta verlangt event_source_url, sobald action_source "website" ist, und
 * meldet das Fehlen im Events Manager ausdruecklich als Schaden fuer
 * Attribution und Optimierung. Bisher stand das Feld nicht im Payload.
 *
 * Die Reihenfolge ist bewusst:
 *   1. Was Bsport mitschickt, falls die Buchungsstrecke die Seite je in die
 *      Rechnungs-Metadaten legt — derselbe Haken wie fuer fbc/fbp.
 *   2. Sonst die kanonische Seite je Ereignisart: ein Lead entsteht am
 *      Probetraining-Kalender, ein Purchase an der Mitgliedschaft.
 *
 * Punkt 2 ist eine Naeherung und als solche benannt: der Kalender steht auf
 * mehreren Seiten, serverseitig ist die konkrete Seite nicht bekannt. Eine
 * plausible Seite der eigenen Domain ist fuer Metas Zuordnung aber deutlich
 * besser als gar keine — und sie ist nie falsch in dem Sinn, dass sie auf eine
 * fremde Domain zeigt.
 */
export function buildEventSourceUrl({ eventName, metadataUrl }) {
  const base = (process.env.SITE_BASE_URL || 'https://www.bomayegym.com').replace(/\/+$/, '');
  const roh = typeof metadataUrl === 'string' ? metadataUrl.trim() : '';
  /* Nur eine vollstaendige Adresse oder ein absoluter Pfad. Ohne diese
     Schranke wuerde jede beliebige Zeichenkette relativ zur eigenen Domain
     aufgeloest ("@@@" -> https://www.bomayegym.com/@@@) und als Ereignisort
     gemeldet, obwohl es die Seite nicht gibt. */
  if (roh && (/^https?:\/\//i.test(roh) || roh.startsWith('/'))) {
    try {
      const u = new URL(roh, base + '/');
      /* Nur die eigene Domain: eine fremde URL im Payload waere schlechter als
         keine, weil Meta sie als Ereignisort werten wuerde. */
      if (u.origin === new URL(base).origin) return u.href;
    } catch { /* unbrauchbare URL faellt auf die Naeherung zurueck */ }
  }
  return eventName === 'Purchase' ? base + '/mitglied-werden' : base + '/probetraining';
}

/** Assemble the exact CAPI request body. Exported so it can be inspected in tests. */
export function buildMetaPayload({ eventName, invoiceId, customer, value, currency, contentName, eventTime, sourceUrl }) {
  const payload = {
    data: [{
      event_name:    eventName,
      event_time:    eventTime ?? Math.floor(Date.now() / 1000),
      event_id:      String(invoiceId),
      action_source: 'website',
      event_source_url: sourceUrl || buildEventSourceUrl({ eventName }),
      user_data:     buildMetaUserData(customer),
      custom_data: {
        // Wert und Waehrung gehoeren zusammen: entweder beide oder keins.
        // Eine Waehrung ohne Betrag waere fuer Meta so unbrauchbar wie ein
        // erfundener Betrag.
        ...(value === undefined || value === null ? {} : { value, currency }),
        ...(contentName ? { content_name: contentName } : {}),
      },
    }],
  };

  // When set, the event appears in the Test Events tab instead of live
  // reporting. Leave this variable unset in production.
  const testEventCode = process.env.TEST_EVENT_CODE;
  if (testEventCode) payload.test_event_code = testEventCode;

  return payload;
}

/**
 * Der Notausschalter fuer den serverseitigen Meta-Versand.
 *
 * WARUM ES IHN GIBT
 * Bsport traegt unsere Pixel-ID in seinem eigenen Backoffice und schickt
 * darueber Browser-Ereignisse auf dieselbe Pixel-ID - im September standen so
 * 748 gemeldeten Leads rund 15 echte gegenueber. Wenn wir auf Bsports eigene
 * Facebook-Anbindung umstellen, muss unser Server schweigen, sonst zaehlt jede
 * Buchung doppelt. Umgekehrt darf der Weg nicht verloren gehen, falls sich
 * Bsports Anbindung als der schlechtere Tausch erweist: PR #86 hat genau hier
 * den festen Wert von 30 EUR aus dem Lead entfernt, diese Arbeit soll ein
 * Versuch nicht wegwerfen.
 *
 * Deshalb ein Schalter und kein auskommentierter Block: umlegen in Vercel,
 * zurueckdrehen ohne Deployment-Diff.
 *
 * VERHALTEN
 * Nicht gesetzt = an, wie bisher. Nur die ausdrueckliche Absage ("false", "0",
 * "off", "no", Gross-/Kleinschreibung egal) schaltet ab - dieselbe Bauart wie
 * BSPORT_STRICT weiter oben. Ein Tippfehler laesst die Messung also laufen,
 * statt sie still abzuschalten.
 *
 * Betroffen ist ausschliesslich der Meta-Versand: Google Ads, die interne
 * Buchungsmail, die Rechnungsauswertung und die Doppel-Erkennung laufen
 * unveraendert weiter.
 */
function metaCapiAktiv() {
  const wert = String(process.env.META_CAPI_ENABLED ?? '').trim().toLowerCase();
  return !(wert === 'false' || wert === '0' || wert === 'off' || wert === 'no');
}

async function sendMetaEvent({ eventName, invoiceId, customer, value, currency, contentName, sourceUrl }) {
  // Trockenlauf: nichts verlaesst den Server, aber das Protokoll zeigt, dass
  // der Pfad erreicht wurde und was hinausgegangen waere.
  if (!metaCapiAktiv()) {
    return {
      ok: false,
      skipped: true,
      reason: 'capi_disabled_for_pixel_test',
      would_send: { event: eventName, value, currency },
    };
  }

  const pixelId = process.env.META_PIXEL_ID;
  const token   = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !token) return { ok: false, reason: 'env-missing' };

  const payload = buildMetaPayload({ eventName, invoiceId, customer, value, currency, contentName, sourceUrl });

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${token}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, fb_error: json?.error?.message };
    return { ok: true, events_received: json.events_received };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Ein Datum aus Bsports Rechnung in Millisekunden umrechnen - oder null.
 *
 * Die Felder date_created, date_issued und date_due stehen im dokumentierten
 * Rumpf, ihr TYP steht dort nicht. Bsport spiegelt sonst Stripe, und Stripe
 * zaehlt Sekunden seit 1970 - aber ein ISO-String ist genauso moeglich.
 * Deshalb wird beides angenommen und im Zweifel nichts behauptet: ein
 * unlesbarer Wert wird zu null, nicht zu einem falschen Datum.
 *
 * Zwei Aufrufer teilen sich diese Deutung, damit die Mail und die
 * Verlaengerungs-Erkennung nie verschiedene Daten aus demselben Feld lesen:
 * alsBerlinerZeit() fuer die Anzeige, rechnungsalterInTagen() fuer das
 * zweite Erkennungssignal.
 */
function alsZeitstempel(wert) {
  if (wert === null || wert === undefined || wert === '') return null;
  let d;
  if (typeof wert === 'number' || /^\d+$/.test(String(wert))) {
    const n = Number(wert);
    /* Sekunden oder Millisekunden - alles unter dem Jahr 2100 in Sekunden
       liegt unter 4e9, alles darueber ist bereits in Millisekunden. */
    d = new Date(n < 4e9 ? n * 1000 : n);
  } else {
    d = new Date(String(wert));
  }
  return isNaN(d.getTime()) ? null : d.getTime();
}

function alsBerlinerZeit(wert) {
  const ms = alsZeitstempel(wert);
  if (ms === null) return '';
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ms));
}

/** Betrag in Cent -> "89,00 EUR". Leer, wenn der Wert unbrauchbar ist. */
function alsBetrag(cents, waehrung) {
  const c = parseInvoiceTotalCents(cents);
  if (c === null) return '';
  return `${(c / 100).toFixed(2)} ${waehrung}`;
}

/**
 * Ist das die erste bezahlte Rechnung dieses Kunden - oder eine Verlaengerung?
 *
 * WARUM WIR DAS SELBST FUEHREN MUESSEN
 * Bsports Rechnungs-Webhook sagt es nicht. Der dokumentierte Rumpf von
 * data.object ist: id, object, status, date_created, date_issued, date_due,
 * date_cancelled, currency, total, amount_due, amount_paid, company, customer,
 * line_items. Kein subscription, kein billing_reason, kein is_first_payment,
 * keine laufende Nummer je Kunde, kein Mitgliedschaftsbeginn. Eine monatliche
 * Abbuchung sieht damit genauso aus wie eine Neuanmeldung.
 *
 * NACHTRAG: nicht ganz. date_created traegt einen verwertbaren Hinweis - siehe
 * rechnungsalterInTagen() weiter unten. Das ist ein zweites Signal neben
 * dieser Liste, kein Ersatz: es greift nur, wenn Bsport die Rechnung deutlich
 * vor der Zahlung anlegt.
 * (Quelle: Bsport-Hilfeartikel "How to set up and use Invoice Webhooks". Die
 * Seite ist aus dieser Umgebung gesperrt und wurde ueber eine Suchzusammen-
 * fassung gelesen; line_items war darin abgeschnitten. Dort koennte ein
 * Zeitraum stehen, der ein zweites, unabhaengiges Signal waere - das ist an
 * einer echten Verlaengerungsmail zu pruefen, nicht hier zu raten.)
 *
 * Also merken wir es uns. Beim ersten BEZAHLTEN Ereignis eines Kunden wird ein
 * Schluessel gesetzt; ist er schon da, ist es eine Verlaengerung. Dieselbe
 * Ablage, die schon die Doppel-Erkennung traegt - keine neuen Zugangsdaten,
 * kein Netzaufruf zu Bsport, keine neue Fehlerquelle im Webhook.
 *
 * OHNE ABLAUFDATUM. Eine Mitgliedschaft laeuft Jahre; ein abgelaufener
 * Schluessel wuerde ein langjaehriges Mitglied ploetzlich wieder als neu
 * melden. Ein Schluessel je zahlendem Kunden ist vernachlaessigbar klein.
 *
 * IM ZWEIFEL NEU. Ohne Kundennummer oder ohne erreichbare Ablage melden wir
 * "neu". Eine Mail zu viel ist ein Aergernis, eine verpasste Anmeldung ein
 * verlorener Kunde.
 */
async function erstmalsGesehen(kv, kundenId) {
  if (!kv || kundenId === null || kundenId === undefined || kundenId === '') {
    return { neu: true, grund: 'ohne-kundennummer-oder-ablage' };
  }
  try {
    const gesetzt = await kv.set(`bsport:mitglied:${kundenId}`, Date.now(), { nx: true });
    return { neu: !!gesetzt, grund: gesetzt ? 'erstmals' : 'schon-bekannt' };
  } catch (err) {
    return { neu: true, grund: 'ablage-fehler:' + err.message };
  }
}

/**
 * ZWEITES, UNABHAENGIGES SIGNAL: WIE ALT IST DIE RECHNUNG?
 *
 * Die Merkliste oben hat eine Luecke, die sie nicht selbst schliessen kann:
 * Bestandsmitglieder stehen nicht darin. Bei ihrer ERSTEN Abbuchung nach dem
 * Deployment sieht ein langjaehriges Mitglied aus wie eine Neuanmeldung -
 * genau das ist am 24.09.2026 passiert (Mitglied seit Ende Juni, gemeldet als
 * "Neue Mitgliedschaft").
 *
 * Der Payload verraet es trotzdem, nur nicht dort, wo wir zuerst gesucht
 * haben. In diesem Fall stand in date_created der 30.06.2026 - die Rechnung
 * war 86 Tage alt, als sie bezahlt wurde. Eine Neuanmeldung zahlt binnen
 * Minuten (Karte) bis wenige Tage (SEPA, Rechnung). Ein grosser Abstand
 * zwischen Anlage und Zahlung kann also keine Erstanmeldung sein.
 *
 * Das gilt unabhaengig davon, WIE Bsport die Rechnungen anlegt:
 *   - legt Bsport je Abbuchung eine neue Rechnung an, ist der Abstand immer
 *     klein und dieses Signal schweigt einfach (die Merkliste traegt dann);
 *   - legt Bsport den ganzen Plan beim Vertragsstart an, wird der Abstand mit
 *     jedem Monat groesser und das Signal greift ab der zweiten Abbuchung.
 * Falsch melden kann es in keiner der beiden Varianten.
 *
 * DIE EINE FEHLERRICHTUNG, DIE BLEIBT: wer im Vorverkauf bucht und erst
 * Wochen spaeter belastet wird, wird als Verlaengerung beschriftet. Deshalb
 * wird hier nichts unterdrueckt - die Mail geht in jedem Fall raus, nur die
 * Betreffzeile aendert sich. Ein falsches Etikett ist korrigierbar, ein
 * verschwiegener Neukunde nicht.
 *
 * Rueckgabe: Alter in Tagen, oder null wenn kein brauchbares Datum vorliegt.
 */
function rechnungsalterInTagen(obj, jetztMs) {
  const ms = alsZeitstempel(obj.date_created) ?? alsZeitstempel(obj.date_issued);
  if (ms === null) return null;
  const tage = (jetztMs - ms) / 86400000;
  /* Eine Rechnung aus der Zukunft (Zeitzonen-Versatz, Vorausdatierung) sagt
     nichts ueber Neu oder Alt - dann schweigt das Signal. */
  return tage >= 0 ? tage : null;
}

/**
 * Ab welchem Rechnungsalter gilt eine Zahlung als wiederkehrend?
 *
 * Voreinstellung 14 Tage: laenger als jede realistische Karten- oder
 * SEPA-Verzoegerung, und deutlich kuerzer als der kuerzeste Abrechnungs-
 * zyklus (28 Tage). BSPORT_NEW_MEMBER_WINDOW_DAYS=off schaltet das Signal
 * ganz ab und laesst allein die Merkliste entscheiden; ein unbrauchbarer
 * Wert faellt auf die Voreinstellung zurueck statt das Signal zu verstellen.
 */
function neukundenFensterTage() {
  const roh = (process.env.BSPORT_NEW_MEMBER_WINDOW_DAYS || '').trim().toLowerCase();
  if (roh === 'off' || roh === 'false' || roh === '0') return null;
  if (roh === '') return 14;
  const n = Number(roh);
  return (Number.isFinite(n) && n >= 1) ? n : 14;
}

// ── Google Ads conversion pixel ───────────────────────────────────────────────

async function sendGoogleConversion({ invoiceId, value, currency }) {
  const rawId = process.env.GOOGLE_CONVERSION_ID || '';
  const label = process.env.GOOGLE_CONVERSION_LABEL;
  const numId = rawId.replace(/^AW-/i, '');
  if (!numId || !label) return { ok: false, reason: 'env-missing' };

  // TODO: purchases may need a separate Google Conversion Label in the future.
  // Currently using the same label for both probetraining and purchases.
  // Ohne Betrag werden value und currency_code weggelassen statt als
  // "undefined" in die Adresse geschrieben zu werden.
  const wertTeil = (value === undefined || value === null)
    ? ''
    : `&value=${encodeURIComponent(value)}` +
      `&currency_code=${encodeURIComponent(currency)}`;

  const url =
    `https://www.googleadservices.com/pagead/conversion/${numId}/` +
    `?label=${encodeURIComponent(label)}` +
    wertTeil +
    `&oid=${encodeURIComponent(String(invoiceId))}`;

  try {
    const res = await fetch(url);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── Admin email via Resend ────────────────────────────────────────────────────

async function sendAdminEmail({ customer, transactionId, isProbetraining, istVerlaengerung, details, typeStr, productDesc, amountStr, bookedAt }) {
  const apiKey     = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail  = process.env.FROM_EMAIL;
  if (!apiKey || !adminEmail || !fromEmail) return { ok: false, reason: 'env-missing' };

  /* Drei Betreffzeilen statt zweier. Eine wiederkehrende Abbuchung ist keine
     Neuanmeldung und soll im Posteingang auch nicht so aussehen - genau das
     war der Anlass: aus der Betreffzeile war nicht zu erkennen, ob jemand
     neu unterschrieben hat oder ob nur der Monatsbeitrag durchgelaufen ist.

     Unterdrueckt wird die Verlaengerungsmail bewusst NOCH NICHT. Solange die
     Merkliste ihren ersten Abrechnungszyklus nicht hinter sich hat, ist eine
     stille Mail das teurere Risiko: eine ignorierbare Mail kostet nichts,
     eine faelschlich unterdrueckte Neuanmeldung einen Kunden. Zum Abschalten
     genuegt spaeter eine Zeile an der Aufrufstelle. */
  const subject = isProbetraining
    ? `🥊 Neue Probetraining-Buchung: ${customer.name || customer.first_name}`
    : (istVerlaengerung
        ? `🔁 Zahlung erhalten: ${customer.name || customer.first_name} (${amountStr}), wiederkehrend`
        : `💰 Neue Mitgliedschaft: ${customer.name || customer.first_name} (${amountStr})`);

  const berlinTime = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(bookedAt);

  // Pre-build mailto href for welcome email quick-action button
  const welcomeSubject = encodeURIComponent(`Willkommen bei Bomaye Gym, ${customer.first_name || customer.name}!`);
  const welcomeBody    = encodeURIComponent(
    `Hallo ${customer.first_name || customer.name},\n\n` +
    `willkommen bei Bomaye Gym! Wir freuen uns sehr, dich bald bei uns begrüßen zu dürfen.\n\n` +
    `Dein Team von Bomaye Gym`
  );

  const html = buildAdminEmailHtml({
    customer, transactionId, typeStr, productDesc, amountStr,
    berlinTime, isProbetraining, istVerlaengerung, details: details || {},
    welcomeSubject, welcomeBody,
  });
  const text = buildAdminEmailText({
    customer, typeStr, productDesc, amountStr, berlinTime,
    isProbetraining, details: details || {},
  });

  try {
    const resend = new Resend(apiKey);
    const from   = fromEmail.includes('<') ? fromEmail : `Bomaye Gym <${fromEmail}>`;
    const { data, error } = await resend.emails.send({ from, to: adminEmail, subject, html, text });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Raw body must be read before JSON.parse (HMAC needs the original bytes).
  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.log(JSON.stringify({ step: 'read-body', ok: false, error: err.message }));
    return res.status(400).json({ error: 'Could not read request body' });
  }

  // JSON parse first — fingerprint validation needs the parsed payload
  let body;
  try {
    body = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Bsport sends many webhook types to the same URL. Skip known-untracked events
  // with 200 so Bsport doesn't retry; reject unknown events the same way.
  const eventType = body?.event_type;
  const TRACKED_EVENTS = ['invoice-finalize', 'invoice-pay'];
  const SKIP_EVENTS = ['booking-create', 'invoice-revert', 'invoice-dispute'];

  if (SKIP_EVENTS.includes(eventType)) {
    console.log(JSON.stringify({
      step: 'filter', ok: true, skipped: true, eventType
    }));
    return res.status(200).json({
      ok: true, skipped: true,
      reason: `event-type-not-tracked: ${eventType}`
    });
  }

  if (!TRACKED_EVENTS.includes(eventType)) {
    console.log(JSON.stringify({
      step: 'filter', ok: true, skipped: true, eventType,
      reason: 'unknown-event'
    }));
    return res.status(200).json({ ok: true, skipped: true });
  }

  // Bsport request fingerprint validation
  const auth = validateBsportRequest(rawBody, req.headers, body);
  console.log(JSON.stringify({ step: 'auth', ok: auth.ok, mode: auth.mode, detail: auth.detail }));
  if (!auth.ok) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data } = body;
  const kv = await getKV();

  // ── Unified invoice handler (invoice-finalize + invoice-pay) ─────────────
  const obj = data?.object ?? {};
  const invoiceId = obj.id;
  const status = obj.status;
  const currency = (obj.currency || 'eur').toUpperCase();
  const totalCents = parseInvoiceTotalCents(obj.total);
  const hasTotal = totalCents !== null;
  const totalEur = hasTotal ? totalCents / 100 : null;
  const lineItems = obj.line_items?.data ?? [];
  const productName = lineItems[0]?.description ?? 'Probetraining';

  // obj.customer may be null for anonymous POS invoices
  const cust = obj.customer ?? {};
  // Bsport mirrors a Stripe-shaped invoice, where address fields appear nested
  // under `address`. Flat variants are read as a fallback so a schema
  // difference degrades to a missing field instead of a wrong one.
  const addr = cust.address ?? {};
  const customer = {
    /* Bsports Kundennummer. Sie ist der Schluessel, an dem sich eine
       Verlaengerung von einer Erstanmeldung unterscheiden laesst - siehe
       erstmalsGesehen(). Bei anonymen Kassenrechnungen fehlt sie. */
    id:         cust.id ?? null,
    name:       cust.name || `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || undefined,
    first_name: cust.first_name || '',
    last_name:  cust.last_name  || '',
    email:      cust.email      || '',
    phone:      cust.phone      || '',
    city:       addr.city        || cust.city        || '',
    zip:        addr.postal_code || cust.postal_code || cust.zip || '',
    country:    addr.country     || cust.country     || '',
    // Only present if the booking flow forwarded the Meta cookies to Bsport.
    fbc:        obj.metadata?.fbc || cust.metadata?.fbc || '',
    fbp:        obj.metadata?.fbp || cust.metadata?.fbp || '',
  };

  /* Ereignisort fuer Meta. Bsport liefert die Seite heute nicht mit; der
     Zugriff steht hier, damit es ohne Codeaenderung greift, sobald die
     Buchungsstrecke sie in die Rechnungs-Metadaten legt. Bis dahin faellt
     buildEventSourceUrl auf die kanonische Seite der Ereignisart zurueck. */
  const metaSourceUrlRoh = (obj.metadata?.event_source_url || obj.metadata?.source_url
                         || cust.metadata?.event_source_url || '');
  const metaSourceUrl = metaSourceUrlRoh ? buildEventSourceUrl({
    eventName: null,
    metadataUrl: metaSourceUrlRoh,
  }) : null;   /* null => buildMetaPayload waehlt die Seite nach Ereignisart */

  console.log(JSON.stringify({
    step: 'invoice', ok: true, invoiceId, eventType, status,
    totalEur, hasTotal, hasCustomer: !!obj.customer
  }));

  // An invoice whose total we cannot read is logged in full shape — never its
  // contents — so the real cause can be identified from the logs instead of
  // guessed at. Field NAMES only (a differently named amount field is the most
  // likely cause); no customer data, no line-item text, since those can carry
  // personal data and none of it is needed to diagnose a schema mismatch.
  if (!hasTotal) {
    console.log(JSON.stringify({
      step: 'invoice-total-unusable',
      ok: false,
      invoiceId,
      eventType,
      status,
      currency,
      rawTotalType: obj.total === null ? 'null' : typeof obj.total,
      rawTotalIsEmptyString: obj.total === '',
      lineItemCount: lineItems.length,
      invoiceKeys: Object.keys(obj).slice(0, 40),
      hasCustomer: !!obj.customer,
    }));
  }

  // Idempotency — same key for both finalize and pay on the same invoice;
  // first event to arrive wins, second is deduped.
  if (kv) {
    try {
      const wasSet = await kv.set(
        `webhook:bsport:invoice:${invoiceId}`,
        Date.now(),
        { ex: 60 * 60 * 24 * 30, nx: true }
      );
      if (!wasSet) {
        console.log(JSON.stringify({
          step: 'idempotency', ok: true, duplicate: true, invoiceId
        }));
        return res.status(200).json({ duplicate: true, invoiceId });
      }
    } catch (err) {
      console.log(JSON.stringify({
        step: 'kv', ok: false, error: err.message
      }));
    }
  }

  // Classification is positive, not residual: an invoice is a Probetraining
  // only when it carries a total we could actually read AND that total is
  // exactly zero. Everything we cannot price — missing, null, empty or
  // unparseable — falls through to no classification at all.
  const isProbetraining = hasTotal && totalEur === 0;
  const isPurchase      = hasTotal && totalEur > 0;

  // Lead is the free Probetraining booking, Purchase the paid membership.
  // Anything else is not reported to any ad platform: a negative total (credit
  // note, refund) would corrupt reported revenue, and an unreadable total is an
  // unknown amount rather than a free one.
  const metaEventName = isProbetraining ? 'Lead' : (isPurchase ? 'Purchase' : null);

  // Das Probetraining ist kostenlos - der Code sagt das zwei Zeilen weiter
  // unten selbst ("Kostenlos (0 €)"). Trotzdem stand hier fest 30. Damit trug
  // jedes Lead-Event denselben erfundenen Betrag, und genau das meldet Metas
  // Events Manager: "Alle Lead-Events deiner Website senden dieselben
  // Preisdaten". Leads gehen jetzt ganz ohne Wert und Waehrung raus; Meta
  // optimiert dann auf Anzahl statt auf einen Fantasiewert.
  //
  // Kaeufe bleiben unveraendert: sie tragen den echten Rechnungsbetrag aus
  // obj.total. Wenn Meta auch dort identische Werte meldet, liegt das nicht an
  // dieser Zeile - dann sind es entweder tatsaechlich lauter gleiche Betraege
  // (bisher fast nur das eine Early-Bird-Paket) oder Bsports eigene Events,
  // die ueber unser globales fbq laufen.
  const hatWert = !isProbetraining && hasTotal;
  const value         = hatWert ? totalEur : undefined;
  const valueCurrency = hatWert ? currency : undefined;
  /* Nur bezahlte Rechnungen zaehlen fuer die Merkliste. Eine Gratisbuchung
     setzt den Schluessel NICHT - wer erst zum Probetraining kommt und spaeter
     Mitglied wird, loest dann korrekt "Neue Mitgliedschaft" aus.

     Steht bewusst VOR typeStr: die Beschriftung haengt vom Ergebnis ab. */
  const mitgliedschaft = isPurchase
    ? await erstmalsGesehen(kv, customer.id)
    : { neu: true, grund: 'keine-mitgliedschaft' };

  /* Zwei Signale, unabhaengig voneinander - siehe rechnungsalterInTagen().
     Die Merkliste kennt Bestandsmitglieder nicht, das Rechnungsalter schon.
     Eines von beiden genuegt; ein Treffer der Merkliste bleibt fuehrend. */
  const fensterTage = neukundenFensterTage();
  const alterTage   = rechnungsalterInTagen(obj, Date.now());
  const alteRechnung = isPurchase && fensterTage !== null
                    && alterTage !== null && alterTage > fensterTage;
  const istVerlaengerung = isPurchase && (!mitgliedschaft.neu || alteRechnung);

  /* Welches Signal hat entschieden - steht im Log und, bei Verlaengerungen,
     als Hinweiszeile in der Mail. Damit ist der naechste echte Fall ohne
     Nachfrage nachvollziehbar. */
  const alterGerundet = alterTage === null ? null : Math.round(alterTage);
  const erkennungsgrund = !mitgliedschaft.neu
    ? mitgliedschaft.grund
    : (alteRechnung ? `rechnung-${alterGerundet}-tage-alt` : mitgliedschaft.grund);

  const typeStr = isProbetraining
    ? 'Probetraining (Buchung)'
    : (isPurchase
        ? (istVerlaengerung ? 'Mitgliedschaft (Verlängerung)' : 'Mitgliedschaft (neu)')
        : 'Unklarer Rechnungsbetrag');
  const amountStr = isProbetraining
    ? 'Kostenlos (0 €)'
    : (hasTotal ? `${totalEur.toFixed(2)} ${currency}` : 'Betrag unlesbar — bitte in Bsport prüfen');

  /* ── WAS DIE MAIL AUSSER NAME UND BETRAG NOCH ZEIGEN KANN ──────────────
     Alles hier stammt aus dem dokumentierten Rechnungsrumpf. Bewusst NICHT
     dabei: official_document_id (Ausweis- bzw. Steuernummer) - die gehoert
     nicht in eine Mail.

     Und bewusst nicht versprochen: Geburtsdatum, Notfallkontakt und die
     Einwilligungen aus dem Anmeldeformular stehen am MITGLIEDSDATENSATZ,
     nicht an der Rechnung. Sie liessen sich nur ueber eine Bsport-API-
     Abfrage holen, fuer die es in diesem Projekt keine Zugangsdaten gibt.
     Dafuer gibt es den Knopf ins Backoffice: ein Tipp, und dort steht
     alles vollstaendig. */
  const alleLeistungen = lineItems
    .map((z) => (z && z.description) || '')
    .filter(Boolean);
  const bezahltStr = alsBetrag(obj.amount_paid, currency);
  const offenStr   = alsBetrag(obj.amount_due,  currency);

  const strasse = [addr.line1 || addr.street || '', addr.line2 || '']
    .filter(Boolean).join(', ');
  const ortZeile = [customer.zip, customer.city].filter(Boolean).join(' ');
  const adresse  = [strasse, ortZeile, customer.country].filter(Boolean).join(' · ');

  /* Die Adresse der Kundenseite im Backoffice kennt dieser Code nicht -
     backoffice.bsport.io ist von aussen nicht einsehbar, und eine geratene
     Adresse waere ein Link ins Leere. Deshalb eine Vorlage aus der Umgebung
     mit {id} als Platzhalter; fehlt sie, steht die Kundennummer als Text da
     und laesst sich im Backoffice suchen. Bestaetigt ist:
     https://backoffice.bsport.io/member/{id}/info */
  const backofficeVorlage = process.env.BSPORT_BACKOFFICE_URL || '';
  const backofficeUrl = (backofficeVorlage && customer.id !== null)
    ? backofficeVorlage.replace('{id}', encodeURIComponent(String(customer.id)))
    : '';

  const details = {
    kundenId:      customer.id,
    backofficeUrl,
    adresse,
    paket:         alleLeistungen.join(' · '),
    /* Hiess vorher "angemeldetAm" und stand in der Mail als "Anmeldung".
       Das war falsch und hat genau eine Fehldeutung verursacht: es ist das
       Datum der RECHNUNG, nicht der Beitritt des Mitglieds. Der Beitritt
       steht am Mitgliedsdatensatz, nicht an der Rechnung. */
    rechnungVom:   alsBerlinerZeit(obj.date_created) || alsBerlinerZeit(obj.date_issued),
    faelligAm:     alsBerlinerZeit(obj.date_due),
    /* Nur bei Verlaengerungen gesetzt: die Mail soll selbst sagen, woran sie
       das erkannt hat - sonst landet die Frage wieder bei uns. */
    erkennungsHinweis: (istVerlaengerung && alteRechnung)
      ? `Rechnung ist ${alterGerundet} Tage alt — wiederkehrende Abbuchung`
      : (istVerlaengerung ? 'Kunde ist in der Merkliste — wiederkehrende Abbuchung' : ''),
    bezahltStr,
    offenStr,
    rechnungStatus: status || '',
  };

  console.log(JSON.stringify({
    step: 'conversion',
    type: isProbetraining ? 'probetraining' : (isPurchase ? 'membership' : 'unclassified'),
    invoiceId, value, metaEventName,
    ...(isPurchase ? {
      verlaengerung: istVerlaengerung,
      grund: erkennungsgrund,
      merkliste: mitgliedschaft.grund,
      rechnungsalterTage: alterGerundet,
      fensterTage,
      /* Rohwerte mit, solange die Deutung von date_created nicht bestaetigt
         ist: an der naechsten echten Verlaengerung laesst sich damit ohne
         Rueckfrage nachlesen, was Bsport wirklich liefert. */
      dateCreatedRoh: obj.date_created ?? null,
      dateIssuedRoh: obj.date_issued ?? null,
    } : {}),
    reason: metaEventName ? undefined
          : (!hasTotal ? 'total-unusable-not-reported' : 'negative-total-not-reported'),
  }));

  // The admin email is sent in every case, including the unclassified one: the
  // gym still needs to know a booking happened, even when we decline to report
  // it to the ad platforms.
  const [metaResult, googleResult, emailResult] = await Promise.allSettled([
    metaEventName
      ? sendMetaEvent({
          eventName:   metaEventName,
          invoiceId,
          customer,
          value,
          currency: valueCurrency,
          contentName: productName,
          sourceUrl:   metaSourceUrl,
        })
      : Promise.resolve({ ok: false, reason: !hasTotal ? 'total-unusable-not-reported' : 'negative-total-not-reported' }),
    metaEventName
      ? sendGoogleConversion({
          invoiceId,
          value,
          currency: valueCurrency,
        })
      : Promise.resolve({ ok: false, reason: !hasTotal ? 'total-unusable-not-reported' : 'negative-total-not-reported' }),
    sendAdminEmail({
      customer,
      transactionId:   invoiceId,
      isProbetraining,
      istVerlaengerung,
      details,
      typeStr,
      productDesc:     productName,
      amountStr,
      bookedAt:        new Date(),
    }),
  ]);

  const meta   = metaResult.status   === 'fulfilled' ? metaResult.value   : { ok: false, error: metaResult.reason?.message };
  const google = googleResult.status === 'fulfilled' ? googleResult.value : { ok: false, error: googleResult.reason?.message };
  const email  = emailResult.status  === 'fulfilled' ? emailResult.value  : { ok: false, error: emailResult.reason?.message };

  // Die drei Zusatzfelder haengen am Schalter: ohne ihn bleibt die Zeile in
  // jedem Fall Zeichen fuer Zeichen die alte (gegen HEAD nachgemessen).
  console.log(JSON.stringify({ step: 'meta',   invoiceId, event: metaEventName, ok: meta.ok, ...(meta.skipped ? { skipped: true, reason: meta.reason, would_send: meta.would_send } : {}), events_received: meta.events_received, fb_error: meta.fb_error, event_source_url: metaSourceUrl || (metaEventName ? buildEventSourceUrl({ eventName: metaEventName }) : null) }));
  console.log(JSON.stringify({ step: 'google', invoiceId, ok: google.ok, status: google.status }));
  console.log(JSON.stringify({ step: 'email',  invoiceId, ok: email.ok }));

  return res.status(200).json({ ok: true, invoiceId, eventType });
}

// ── Email templates ───────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function detailRow(label, valueHtml) {
  return `
  <tr>
    <td width="90" valign="top"
        style="padding:0 16px 16px 0;font-family:Arial,sans-serif;font-size:10px;
               font-weight:700;letter-spacing:0.15em;text-transform:uppercase;
               color:rgba(245,240,232,0.35);white-space:nowrap;padding-top:2px;">
      ${label}
    </td>
    <td style="padding:0 0 16px;font-family:Arial,sans-serif;font-size:14px;
               color:#F5F0E8;line-height:1.5;">
      ${valueHtml}
    </td>
  </tr>`;
}

function buildAdminEmailHtml({ customer, transactionId, typeStr, productDesc, amountStr,
  berlinTime, isProbetraining, istVerlaengerung, details, welcomeSubject, welcomeBody }) {

  const icon      = isProbetraining ? '🥊' : '💰';
  const headline  = isProbetraining
    ? 'Neue Probetraining-Buchung'
    : (istVerlaengerung ? 'Wiederkehrende Zahlung' : 'Neue Mitgliedschaft');
  const custName  = esc(customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '—');
  const custEmail = customer.email || '';
  const custPhone = customer.phone || '';
  const telHref   = `tel:${custPhone.replace(/\s+/g, '')}`;
  const mailHref  = `mailto:${custEmail}?subject=${welcomeSubject}&body=${welcomeBody}`;
  const d         = details || {};

  /* ── ZWEI FELDLISTEN, WEIL ZWEI VERSCHIEDENE FRAGEN DAHINTERSTEHEN ─────
     Beim Probetraining-Lead zaehlt die Kontaktaufnahme: wer, wie erreichbar,
     zu welchem Termin, von wo. Bei einer Mitgliedschaft zaehlt der Vertrag:
     welches Paket, wie viel, bezahlt oder offen, bis wann, wohin.

     Leere Felder werden weggelassen statt als Strich gezeigt - eine Mail mit
     vier Strichen liest sich wie ein Fehler. */
  const feld = (name, wert) => (wert ? detailRow(name, esc(String(wert))) : '');
  const link = (name, href, text) => (text
    ? detailRow(name, `<a href="${esc(href)}" style="color:#C9A84C;text-decoration:none;">${esc(text)}</a>`)
    : '');

  const zeilen = (isProbetraining ? [
    detailRow('Name', custName),
    link('E-Mail', `mailto:${custEmail}`, custEmail),
    link('Telefon', telHref, custPhone),
    feld('Kurs / Termin', productDesc),
    feld('Rechnung vom', d.rechnungVom),
    feld('Ort', [customer.zip, customer.city].filter(Boolean).join(' ')),
    feld('Kundennr.', d.kundenId),
  ] : [
    detailRow('Name', custName),
    link('E-Mail', `mailto:${custEmail}`, custEmail),
    link('Telefon', telHref, custPhone),
    feld('Paket', d.paket || productDesc),
    detailRow('Betrag', esc(amountStr)),
    feld('Bezahlt', d.bezahltStr),
    feld('Noch offen', d.offenStr),
    feld('Fällig', d.faelligAm),
    feld('Rechnung vom', d.rechnungVom),
    feld('Adresse', d.adresse),
    feld('Hinweis', d.erkennungsHinweis),
    feld('Kundennr.', d.kundenId),
  ]).filter(Boolean);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(headline)}</title>
</head>
<body style="margin:0;padding:0;background:#0A0A08;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
         style="background:#0A0A08;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table width="580" cellpadding="0" cellspacing="0" border="0" role="presentation"
               style="max-width:580px;width:100%;">

          <!-- Eyebrow -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.3em;
                        text-transform:uppercase;color:#C9A84C;font-family:Arial,sans-serif;">
                BOMAYE GYM &mdash; INTERN
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#111110;border:1px solid rgba(201,168,76,0.2);border-radius:2px;">

              <!-- Gold accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td height="3" bgcolor="#C9A84C"
                      style="height:3px;line-height:3px;font-size:3px;background:#C9A84C;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card header -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:36px 40px 28px;
                             border-bottom:1px solid rgba(201,168,76,0.12);">
                    <p style="margin:0 0 10px;font-size:24px;line-height:1;">${icon}</p>
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;
                               color:#F5F0E8;line-height:1.2;font-family:Arial,sans-serif;">
                      ${esc(headline)}
                    </h1>
                    <p style="margin:0;font-size:13px;color:rgba(245,240,232,0.4);
                              font-family:Arial,sans-serif;">
                      ${esc(berlinTime)} &nbsp;&middot;&nbsp; ID: ${esc(String(transactionId))}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:28px 40px 4px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                      ${zeilen.join('\n                      ')}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:8px 40px 40px;">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <!-- Primary: call -->
                        <td bgcolor="#C9A84C" style="border-radius:2px;">
                          <a href="${esc(telHref)}"
                             style="display:inline-block;padding:13px 24px;
                                    font-family:Arial,sans-serif;font-size:11px;
                                    font-weight:700;letter-spacing:0.14em;
                                    text-transform:uppercase;color:#0A0A08;
                                    text-decoration:none;white-space:nowrap;">
                            📞 Anrufen
                          </a>
                        </td>
                        <td width="12">&nbsp;</td>
                        <!-- Secondary: welcome email -->
                        <td style="border:1px solid rgba(201,168,76,0.35);border-radius:2px;">
                          <a href="${esc(mailHref)}"
                             style="display:inline-block;padding:12px 24px;
                                    font-family:Arial,sans-serif;font-size:11px;
                                    font-weight:700;letter-spacing:0.14em;
                                    text-transform:uppercase;color:#C9A84C;
                                    text-decoration:none;white-space:nowrap;">
                            ✉ Begrüßungsmail
                          </a>
                        </td>
                        ${d.backofficeUrl ? `
                        <td width="12">&nbsp;</td>
                        <!-- Alles Weitere steht im Backoffice: Geburtsdatum,
                             Notfallkontakt, Einwilligungen. Die stehen am
                             Mitgliedsdatensatz und nicht an der Rechnung. -->
                        <td style="border:1px solid rgba(201,168,76,0.35);border-radius:2px;">
                          <a href="${esc(d.backofficeUrl)}"
                             style="display:inline-block;padding:12px 24px;
                                    font-family:Arial,sans-serif;font-size:11px;
                                    font-weight:700;letter-spacing:0.14em;
                                    text-transform:uppercase;color:#C9A84C;
                                    text-decoration:none;white-space:nowrap;">
                            ↗ In Bsport öffnen
                          </a>
                        </td>` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;">
              <p style="margin:0;font-size:10px;letter-spacing:0.05em;
                        color:rgba(245,240,232,0.15);font-family:Arial,sans-serif;">
                Bomaye Gym &mdash; Interne Benachrichtigung &mdash; Nicht weiterleiten
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function buildAdminEmailText({ customer, typeStr, productDesc, amountStr, berlinTime,
  isProbetraining, details }) {
  const name = customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '—';
  const d = details || {};
  /* 15 Zeichen, weil "Rechnung vom:" allein schon 13 belegt - mit 13 klebte
     der Wert direkt am Doppelpunkt. */
  const zeile = (k, v) => (v ? `${(k + ':').padEnd(15)}${v}` : null);

  const felder = isProbetraining ? [
    zeile('Kurs/Termin', productDesc),
    zeile('Rechnung vom', d.rechnungVom),
    zeile('Ort',         [customer.zip, customer.city].filter(Boolean).join(' ')),
  ] : [
    zeile('Paket',       d.paket || productDesc),
    zeile('Betrag',      amountStr),
    zeile('Bezahlt',     d.bezahltStr),
    zeile('Noch offen',  d.offenStr),
    zeile('Faellig',     d.faelligAm),
    zeile('Rechnung vom', d.rechnungVom),
    zeile('Adresse',     d.adresse),
    zeile('Hinweis',     d.erkennungsHinweis),
  ];

  return [
    'BOMAYE GYM — Interne Buchungsbenachrichtigung',
    '',
    zeile('Typ',     typeStr),
    zeile('Zeit',    berlinTime),
    '',
    zeile('Name',    name),
    zeile('E-Mail',  customer.email || '—'),
    zeile('Telefon', customer.phone || '—'),
    ...felder,
    zeile('Kundennr.', d.kundenId),
    d.backofficeUrl ? '' : null,
    d.backofficeUrl ? `In Bsport oeffnen: ${d.backofficeUrl}` : null,
    '',
    'Nicht weiterleiten.',
  ].filter((z) => z !== null && z !== undefined).join('\n');
}

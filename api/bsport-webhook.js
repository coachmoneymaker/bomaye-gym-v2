/**
 * /api/bsport-webhook — Vercel Serverless Function (Node.js runtime)
 *
 * Receives Bsport booking/payment webhooks, authenticates via request
 * fingerprinting (Bsport does not support HMAC or custom headers),
 * deduplicates via Vercel KV, fires server-side conversion events to
 * Meta CAPI and Google Ads, and sends an internal admin email via Resend.
 *
 * Processed events: "invoice-finalize" and "invoice-pay" (all invoices, paid and free).
 * booking-create, invoice-revert, and invoice-dispute are gracefully skipped.
 *
 * Required env vars:
 *   // Unused — Bsport does not support secrets. Kept for future HMAC support.
 *   // BSPORT_WEBHOOK_SECRET
 *   BSPORT_STRICT            — set to "false" to skip fingerprint checks (local dev)
 *   META_PIXEL_ID            — Meta Pixel numeric ID
 *   META_ACCESS_TOKEN        — Meta Graph API system access token
 *   GOOGLE_CONVERSION_ID     — format: AW-XXXXXXXXX
 *   GOOGLE_CONVERSION_LABEL  — Google Ads conversion label
 *   KV_REST_API_URL          — auto-injected when Vercel KV is linked
 *   KV_REST_API_TOKEN        — auto-injected when Vercel KV is linked
 *   RESEND_API_KEY
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

async function sendMetaEvent({ eventName, invoiceId, customer, value, currency, contentName }) {
  const pixelId = process.env.META_PIXEL_ID;
  const token   = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !token) return { ok: false, reason: 'env-missing' };

  const userData = {};
  if (customer.email)      userData.em = [hash(customer.email.toLowerCase().trim())];
  if (customer.phone)      userData.ph = [hash(customer.phone.replace(/\D/g, ''))];
  if (customer.first_name) userData.fn = [hash(customer.first_name.toLowerCase().trim())];
  if (customer.last_name)  userData.ln = [hash(customer.last_name.toLowerCase().trim())];

  const payload = {
    data: [{
      event_name:    eventName,
      event_time:    Math.floor(Date.now() / 1000),
      event_id:      String(invoiceId),
      action_source: 'website',
      user_data:     userData,
      custom_data: {
        value,
        currency,
        ...(contentName ? { content_name: contentName } : {}),
      },
    }],
  };

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

// ── Google Ads conversion pixel ───────────────────────────────────────────────

async function sendGoogleConversion({ invoiceId, value, currency }) {
  const rawId = process.env.GOOGLE_CONVERSION_ID || '';
  const label = process.env.GOOGLE_CONVERSION_LABEL;
  const numId = rawId.replace(/^AW-/i, '');
  if (!numId || !label) return { ok: false, reason: 'env-missing' };

  // TODO: purchases may need a separate Google Conversion Label in the future.
  // Currently using the same label for both probetraining and purchases.
  const url =
    `https://www.googleadservices.com/pagead/conversion/${numId}/` +
    `?label=${encodeURIComponent(label)}` +
    `&value=${value}` +
    `&currency_code=${encodeURIComponent(currency)}` +
    `&oid=${encodeURIComponent(String(invoiceId))}`;

  try {
    const res = await fetch(url);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── Admin email via Resend ────────────────────────────────────────────────────

async function sendAdminEmail({ customer, transactionId, isProbetraining, typeStr, productDesc, amountStr, bookedAt }) {
  const apiKey     = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail  = process.env.FROM_EMAIL;
  if (!apiKey || !adminEmail || !fromEmail) return { ok: false, reason: 'env-missing' };

  const subject = isProbetraining
    ? `🥊 Neue Probetraining-Buchung: ${customer.name || customer.first_name}`
    : `💰 Neue Mitgliedschaft: ${customer.name || customer.first_name} (${amountStr})`;

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
    berlinTime, isProbetraining, welcomeSubject, welcomeBody,
  });
  const text = buildAdminEmailText({ customer, typeStr, productDesc, amountStr, berlinTime });

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
  const totalCents = Number(obj.total ?? 0);
  const totalEur = totalCents / 100;
  const lineItems = obj.line_items?.data ?? [];
  const productName = lineItems[0]?.description ?? 'Probetraining';

  // obj.customer may be null for anonymous POS invoices
  const cust = obj.customer ?? {};
  const customer = {
    name:       cust.name || `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || undefined,
    first_name: cust.first_name || '',
    last_name:  cust.last_name  || '',
    email:      cust.email      || '',
    phone:      cust.phone      || '',
  };

  console.log(JSON.stringify({
    step: 'invoice', ok: true, invoiceId, eventType, status,
    totalEur, hasCustomer: !!obj.customer
  }));

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

  const isProbetraining = totalEur === 0;
  const value = isProbetraining ? 30 : totalEur;
  const typeStr = isProbetraining ? 'Probetraining (Buchung)' : 'Mitgliedschaft';
  const amountStr = isProbetraining ? 'Kostenlos (0 €)' : `${totalEur.toFixed(2)} ${currency}`;

  console.log(JSON.stringify({
    step: 'conversion', type: isProbetraining ? 'probetraining' : 'membership',
    invoiceId, value
  }));

  const [metaResult, googleResult, emailResult] = await Promise.allSettled([
    sendMetaEvent({
      eventName:   'Lead',
      invoiceId,
      customer,
      value,
      currency,
      contentName: productName,
    }),
    sendGoogleConversion({
      invoiceId,
      value,
      currency,
    }),
    sendAdminEmail({
      customer,
      transactionId:   invoiceId,
      isProbetraining,
      typeStr,
      productDesc:     productName,
      amountStr,
      bookedAt:        new Date(),
    }),
  ]);

  const meta   = metaResult.status   === 'fulfilled' ? metaResult.value   : { ok: false, error: metaResult.reason?.message };
  const google = googleResult.status === 'fulfilled' ? googleResult.value : { ok: false, error: googleResult.reason?.message };
  const email  = emailResult.status  === 'fulfilled' ? emailResult.value  : { ok: false, error: emailResult.reason?.message };

  console.log(JSON.stringify({ step: 'meta',   invoiceId, ok: meta.ok, events_received: meta.events_received, fb_error: meta.fb_error }));
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
  berlinTime, isProbetraining, welcomeSubject, welcomeBody }) {

  const icon      = isProbetraining ? '🥊' : '💰';
  const headline  = isProbetraining ? 'Neue Probetraining-Buchung' : 'Neue Mitgliedschaft';
  const custName  = esc(customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '—');
  const custEmail = customer.email || '';
  const custPhone = customer.phone || '';
  const telHref   = `tel:${custPhone.replace(/\s+/g, '')}`;
  const mailHref  = `mailto:${custEmail}?subject=${welcomeSubject}&body=${welcomeBody}`;

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
                      ${detailRow('Name',    custName)}
                      ${detailRow('E-Mail',  custEmail
                        ? `<a href="mailto:${esc(custEmail)}"
                               style="color:#C9A84C;text-decoration:none;">${esc(custEmail)}</a>`
                        : '—')}
                      ${detailRow('Telefon', custPhone
                        ? `<a href="${esc(telHref)}"
                               style="color:#C9A84C;text-decoration:none;">${esc(custPhone)}</a>`
                        : '—')}
                      ${detailRow('Produkt', esc(productDesc))}
                      ${detailRow('Betrag',  esc(amountStr))}
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

function buildAdminEmailText({ customer, typeStr, productDesc, amountStr, berlinTime }) {
  const name = customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '—';
  return [
    'BOMAYE GYM — Interne Buchungsbenachrichtigung',
    '',
    `Typ:     ${typeStr}`,
    `Zeit:    ${berlinTime}`,
    '',
    `Name:    ${name}`,
    `E-Mail:  ${customer.email || '—'}`,
    `Telefon: ${customer.phone || '—'}`,
    `Produkt: ${productDesc}`,
    `Betrag:  ${amountStr}`,
    '',
    'Nicht weiterleiten.',
  ].join('\n');
}

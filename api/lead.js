import { Resend } from 'resend';
import { createHmac, createHash, timingSafeEqual } from 'crypto';

/**
 * /api/lead — Vercel Serverless Function
 *
 * Phase 3B: Double opt-in flow.
 * On submit: validates, generates a signed verification token,
 * stores pending state in KV, sends a confirmation email to the user.
 * Admin email is sent ONLY after the user verifies (/api/verify).
 *
 * Required env vars:
 *   RESEND_API_KEY   — Resend API key
 *   FROM_EMAIL       — verified sender address in Resend
 *   SITE_URL         — public URL, e.g. https://bomayegym.com
 *   TOKEN_SECRET     — secret used to sign/verify tokens (keep private)
 *
 * Optional env vars:
 *   KV_REST_API_URL  — Vercel KV endpoint (enables dedup + rate limiting)
 *   KV_REST_API_TOKEN
 */

const TOTAL_SPOTS   = 300;
const TOKEN_TTL_MS  = 24 * 60 * 60 * 1000; // 24 h
const TOKEN_TTL_SEC = TOKEN_TTL_MS / 1000;

// ── KV (optional) ─────────────────────────────────────────────────────────────
let _kv = null;
async function getKV() {
  if (_kv) return _kv;
  // Must check env vars first: @vercel/kv exports a Proxy whose getter throws
  // when env vars are missing. Without this guard, `await getKV()` triggers a
  // thenable check (kv.then) on the Proxy, which throws and crashes the handler.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  try {
    const mod = await import('@vercel/kv');
    _kv = mod.kv;
    return _kv;
  } catch {
    return null;
  }
}

// ── Token helpers ──────────────────────────────────────────────────────────────
export function buildToken(payload) {
  const secret = process.env.TOKEN_SECRET || 'bomaye-fallback-secret';
  const data   = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig    = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function parseToken(token) {
  try {
    const secret  = process.env.TOKEN_SECRET || 'bomaye-fallback-secret';
    const dot     = token.lastIndexOf('.');
    if (dot < 0) return null;
    const data     = token.slice(0, dot);
    const sig      = token.slice(dot + 1);
    const expected = createHmac('sha256', secret).update(data).digest('base64url');
    const sigBuf   = Buffer.from(sig,      'base64url');
    const expBuf   = Buffer.from(expected, 'base64url');
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf))  return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

/** Short hash of token used as KV key (avoids storing raw token in Redis). */
function tokenKey(token) {
  return 'tok:' + createHash('sha256').update(token).digest('hex').slice(0, 32);
}

// ── Main handler ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    firstName, lastName, email, phone,
    category, dob, goal, street, postalCode, city,
    members,
  } = req.body ?? {};

  // ── Validation ─────────────────────────────────────────────────────────────
  const errors = {};
  if (!firstName?.trim())  errors.firstName = 'Bitte Vornamen eingeben.';
  if (!lastName?.trim())   errors.lastName  = 'Bitte Nachnamen eingeben.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Bitte gültige E-Mail-Adresse eingeben.';

  const normalizedCategory = category
    ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
    : null;
  if (!normalizedCategory || !['Kids', 'Youth', 'Adults', 'Family'].includes(normalizedCategory))
    errors.category = 'Kategorie muss Kids, Youth, Adults oder Family sein.';

  // DOB / category age validation (optional field, but must match category if provided)
  if (dob) {
    const dobDate = new Date(dob);
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dobDate.getTime()) || dobDate >= today) {
      errors.dob = 'Bitte gib ein gültiges Geburtsdatum ein.';
    } else {
      // Age in full years
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;

      const cat = (normalizedCategory || '').toLowerCase();
      if (cat === 'kids'  && (age < 6 || age > 9))   errors.dob = 'Kids ist nur für 6 bis 9 Jahre.';
      if (cat === 'youth' && (age < 10 || age > 17))  errors.dob = 'Jugend ist nur für 10 bis 17 Jahre.';
      if (cat === 'adults' && age < 18)                errors.dob = 'Erwachsene ist erst ab 18 Jahren möglich.';
    }
  }

  if (Object.keys(errors).length > 0)
    return res.status(400).json({ error: 'Validation failed', fields: errors });

  const normalizedEmail = email.trim().toLowerCase();

  // ── Rate limit + duplicate check (KV, optional) ────────────────────────────
  const kv = await getKV();

  if (kv) {
    // Rate limit per IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
              || req.socket?.remoteAddress
              || 'unknown';
    try {
      const rlKey = `rl:${ip}`;
      const count = await kv.incr(rlKey);
      if (count === 1) await kv.expire(rlKey, 3600);
      if (count > 5) {
        return res.status(429).json({
          error: 'Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.',
        });
      }
    } catch (err) {
      console.warn('[LEAD] Rate-limit check failed:', err.message);
    }

    // Duplicate email check
    try {
      const emailKey   = `email:${normalizedEmail}`;
      const existingStatus = await kv.get(emailKey);
      if (existingStatus === 'verified') {
        // Already fully registered — tell the user
        return res.status(200).json({
          success: false,
          duplicate: true,
          message: 'Diese E-Mail-Adresse ist bereits registriert.',
        });
      }
      // If 'pending' → we allow re-send (overwrite token below)
    } catch (err) {
      console.warn('[LEAD] Duplicate check failed:', err.message);
    }
  }

  // ── Build lead object ──────────────────────────────────────────────────────
  const lead = {
    firstName:  firstName.trim(),
    lastName:   lastName.trim(),
    email:      normalizedEmail,
    phone:      phone?.trim()      ?? '',
    category:   normalizedCategory,
    dob:        dob?.trim()        ?? '',
    goal:       goal?.trim()       ?? '',
    street:     street?.trim()     ?? '',
    postalCode: postalCode?.trim() ?? '',
    city:       city?.trim()       ?? '',
    submittedAt: new Date().toISOString(),
    source: 'coming-soon',
    ...(Array.isArray(members) && members.length ? { members: members.map(m => String(m).trim()).filter(Boolean) } : {}),
  };

  // ── Generate signed verification token ────────────────────────────────────
  const token = buildToken({
    lead,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  });

  // ── Persist to KV ─────────────────────────────────────────────────────────
  if (kv) {
    try {
      await kv.set(tokenKey(token), 'pending', { ex: TOKEN_TTL_SEC });
      await kv.set(`email:${normalizedEmail}`, 'pending', { ex: TOKEN_TTL_SEC });
    } catch (err) {
      console.warn('[LEAD] KV write failed:', err.message);
    }
  }

  console.log('[LEAD_PENDING]', JSON.stringify({ email: lead.email, category: lead.category, submittedAt: lead.submittedAt }));

  // ── Send verification email to user ───────────────────────────────────────
  const siteUrl   = (process.env.SITE_URL || 'https://www.bomayegym.com').replace(/\/$/, '');
  const verifyUrl = `${siteUrl}/api/verify?token=${encodeURIComponent(token)}`;

  // [DEBUG] Remove before go-live
  console.log('[DEBUG][LEAD] submitted lead.email:', lead.email);
  console.log('[DEBUG][LEAD] generated verifyUrl:', verifyUrl);

  console.log('[LEAD] Verification email send start', { email: lead.email });

  try {
    await sendVerificationEmail(lead, verifyUrl);
    console.log('[LEAD] Verification email sent successfully', { email: lead.email });
  } catch (err) {
    console.error('[LEAD] Verification email send failed', {
      email: lead.email,
      error: err?.message ?? String(err),
    });
    return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
  }

  return res.status(200).json({ success: true, pending: true });
}

// ── Emails ─────────────────────────────────────────────────────────────────────

async function sendVerificationEmail(lead, verifyUrl) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[LEAD] RESEND_API_KEY not configured — cannot send verification email', { email: lead.email });
    throw new Error('Email service not configured');
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from:    'Bomaye Gym <info@bomayegym.com>',
    to:      lead.email,
    subject: 'Bestätige deinen BOMAYE Early Bird Spot',
    html:    buildVerificationEmailHtml(lead, verifyUrl),
  });

  // [DEBUG] Remove before go-live
  console.log('[DEBUG][LEAD] Resend verification email response:', JSON.stringify({ data, error }));

  if (error) {
    console.error('[LEAD] Resend error (verification email)', { email: lead.email, error: JSON.stringify(error) });
    throw new Error(error.message || 'Resend send failed');
  }

  console.log('[LEAD] Resend accepted verification email', { email: lead.email, messageId: data?.id });
}

function buildVerificationEmailHtml(lead, verifyUrl) {
  let siteUrl = '';
  try { siteUrl = new URL(verifyUrl).origin; } catch { /* ignore */ }
  const logoUrl = siteUrl ? `${siteUrl}/assets/images/bomaye-logo.png` : '';

  return `<!DOCTYPE html>
<html lang="de" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Bestätige deinen BOMAYE Early Bird Spot</title>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#080808;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#080808;">
    Nur noch ein Schritt — bestätige deinen Early Bird Platz bei BOMAYE GYM Munich.&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;
  </div>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
         style="background-color:#080808;">
    <tr>
      <td align="center" style="padding:48px 16px 56px;">

        <!-- Email container -->
        <table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation"
               style="width:100%;max-width:560px;">

          <!-- ── LOGO ──────────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding:0 0 36px;">
              ${logoUrl
                ? `<img src="${logoUrl}" alt="BOMAYE GYM" width="130" height="auto"
                        style="display:block;width:130px;height:auto;border:0;outline:none;text-decoration:none;" />`
                : `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:18px;
                             font-weight:700;letter-spacing:0.25em;color:#C6A45A;">BOMAYE GYM</p>`
              }
            </td>
          </tr>

          <!-- ── CARD ──────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#111111;border-radius:2px;
                       border:1px solid rgba(198,164,90,0.16);">

              <!-- Gold accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td bgcolor="#C6A45A" height="3"
                      style="height:3px;line-height:3px;font-size:3px;
                             background-color:#C6A45A;">&nbsp;</td>
                </tr>
              </table>

              <!-- Header block -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center"
                      style="padding:52px 52px 40px;
                             border-bottom:1px solid rgba(198,164,90,0.1);">

                    <!-- Eyebrow -->
                    <p style="margin:0 0 20px;
                              font-family:Arial,Helvetica,sans-serif;
                              font-size:10px;font-weight:700;
                              letter-spacing:0.32em;text-transform:uppercase;
                              color:#C6A45A;">
                      Early Bird Access &mdash; Munich
                    </p>

                    <!-- Headline -->
                    <h1 style="margin:0;
                               font-family:Arial,Helvetica,sans-serif;
                               font-size:30px;font-weight:700;
                               letter-spacing:-0.01em;line-height:1.2;
                               color:#ffffff;">
                      Bestätige deinen<br />Early Bird Platz.
                    </h1>

                  </td>
                </tr>
              </table>

              <!-- Body copy -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:44px 52px 0;">
                    <p style="margin:0 0 12px;
                              font-family:Arial,Helvetica,sans-serif;
                              font-size:16px;font-weight:600;
                              color:#ffffff;line-height:1.4;">
                      Hallo ${escapeHtml(lead.firstName)},
                    </p>
                    <p style="margin:0;
                              font-family:Arial,Helvetica,sans-serif;
                              font-size:15px;font-weight:400;
                              color:rgba(255,255,255,0.55);
                              line-height:1.85;letter-spacing:0.01em;">
                      du bist fast dabei. Ein Klick genügt, um deinen exklusiven
                      Early Bird Platz bei BOMAYE GYM Munich dauerhaft zu sichern.<br /><br />
                      Der Bestätigungslink ist
                      <span style="color:#C6A45A;font-weight:600;">24&nbsp;Stunden</span>
                      gültig.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center" style="padding:40px 52px 44px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                      href="${verifyUrl}" style="height:58px;v-text-anchor:middle;width:340px;"
                      arcsize="4%" strokecolor="#C6A45A" fillcolor="#C6A45A">
                      <w:anchorlock/>
                      <center style="color:#080808;font-family:Arial,Helvetica,sans-serif;
                                     font-size:12px;font-weight:700;letter-spacing:0.2em;">
                        EARLY BIRD SPOT BESTÄTIGEN
                      </center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td bgcolor="#C6A45A"
                            style="background-color:#C6A45A;border-radius:3px;">
                          <a href="${verifyUrl}" target="_blank"
                             style="display:inline-block;
                                    padding:20px 52px;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:12px;font-weight:700;
                                    letter-spacing:0.22em;text-transform:uppercase;
                                    color:#080808;text-decoration:none;
                                    mso-padding-alt:0;white-space:nowrap;">
                            EARLY BIRD SPOT BESTÄTIGEN
                          </a>
                        </td>
                      </tr>
                    </table>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:0 52px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td height="1" style="height:1px;background-color:rgba(255,255,255,0.06);
                                              line-height:1px;font-size:1px;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Fallback link — de-emphasized -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:22px 52px 44px;">
                    <p style="margin:0 0 7px;
                              font-family:Arial,Helvetica,sans-serif;
                              font-size:10px;font-weight:400;
                              color:rgba(255,255,255,0.18);
                              letter-spacing:0.04em;line-height:1.5;">
                      Wenn der Button nicht funktioniert, kopiere diesen Link:
                    </p>
                    <p style="margin:0;
                              font-family:Arial,Helvetica,sans-serif;
                              font-size:10px;line-height:1.6;
                              color:rgba(255,255,255,0.14);">
                      <a href="${verifyUrl}" target="_blank"
                         style="color:rgba(198,164,90,0.38);text-decoration:none;
                                word-break:break-all;word-wrap:break-word;">
                        ${verifyUrl}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── FOOTER ────────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding:36px 48px 0;">

              <!-- Ornament -->
              <p style="margin:0 0 20px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:10px;color:rgba(198,164,90,0.25);
                        letter-spacing:0.35em;">
                &mdash;&nbsp;&nbsp;&#9670;&nbsp;&nbsp;&mdash;
              </p>

              <!-- Brand name -->
              <p style="margin:0 0 10px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:11px;font-weight:700;
                        letter-spacing:0.28em;text-transform:uppercase;
                        color:rgba(198,164,90,0.35);">
                BOMAYE GYM MUNICH
              </p>

              <!-- Trust line -->
              <p style="margin:0 0 16px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:11px;font-weight:400;
                        color:rgba(255,255,255,0.18);
                        letter-spacing:0.04em;line-height:1.6;">
                Exklusiv. Limitiert. Für die ersten 300 Mitglieder.
              </p>

              <!-- Legal -->
              <p style="margin:0;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:10px;font-weight:400;
                        color:rgba(255,255,255,0.1);
                        line-height:1.75;letter-spacing:0.01em;">
                Du erhältst diese E-Mail, weil du dich für einen Early Bird Spot<br />
                bei BOMAYE GYM Munich angemeldet hast.<br />
                Wenn du das nicht warst, ignoriere diese E-Mail einfach.
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

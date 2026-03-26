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
  if (!normalizedCategory || !['Kids', 'Youth', 'Adults'].includes(normalizedCategory))
    errors.category = 'Kategorie muss Kids, Youth oder Adults sein.';

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

  console.log('[LEAD_PENDING]', JSON.stringify({ email: lead.email, category: lead.category }));

  // ── Send verification email to user ───────────────────────────────────────
  const siteUrl   = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '');
  const verifyUrl = `${siteUrl}/api/verify?token=${encodeURIComponent(token)}`;

  try {
    await sendVerificationEmail(lead, verifyUrl);
  } catch (err) {
    // Email failure is non-fatal: the lead is already persisted in KV.
    // Log clearly for ops, but do not surface an error to the user.
    console.error('[LEAD] Verification email send failed (lead saved, needs manual follow-up):', {
      email: lead.email,
      error: err?.message ?? err,
    });
  }

  return res.status(200).json({ success: true, pending: true });
}

// ── Emails ─────────────────────────────────────────────────────────────────────

async function sendVerificationEmail(lead, verifyUrl) {
  const apiKey    = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn('[LEAD] Email env vars not configured — skipping verification email.');
    return;
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from:    fromEmail,
    to:      lead.email,
    subject: 'Bestätige deinen BOMAYE Founding Spot',
    html:    buildVerificationEmailHtml(lead, verifyUrl),
  });

  if (error) {
    console.error('[LEAD] Resend error (verification email):', JSON.stringify(error));
    throw error;
  }
}

function buildVerificationEmailHtml(lead, verifyUrl) {
  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#111111;border-radius:8px;overflow:hidden;border:1px solid rgba(198,164,90,0.12);">

        <!-- Header -->
        <tr>
          <td style="background:#0A0A0A;padding:28px 36px;text-align:center;border-bottom:1px solid rgba(198,164,90,0.15);">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#C6A45A;">
              BOMAYE GYM MUNICH
            </p>
            <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;letter-spacing:0.03em;">
              Platz bestätigen
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px;">
            <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.65;">
              Hallo ${escapeHtml(lead.firstName)},<br /><br />
              fast geschafft. Klicke auf den Button unten, um deinen
              <strong style="color:#ffffff;">Founding-Member-Spot</strong> zu sichern.
              Der Link ist <strong style="color:#C6A45A;">24 Stunden</strong> gültig.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;">
              <tr>
                <td align="center">
                  <a href="${verifyUrl}"
                     style="display:inline-block;background:#C6A45A;color:#000000;
                            text-decoration:none;font-size:14px;font-weight:700;
                            letter-spacing:2px;text-transform:uppercase;
                            padding:16px 40px;border-radius:4px;">
                    Platz bestätigen
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.6;">
              Wenn der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br />
              <a href="${verifyUrl}" style="color:#C6A45A;word-break:break-all;">${verifyUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0A0A0A;padding:18px 36px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;">
              Du erhältst diese E-Mail, weil du dich für einen Founding-Member-Spot bei BOMAYE GYM München beworben hast.
              Wenn du das nicht warst, ignoriere diese E-Mail einfach.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
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

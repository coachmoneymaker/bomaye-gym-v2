import { Resend } from 'resend';
import { createHash } from 'crypto';
import { parseToken } from './lead.js';

/**
 * /api/verify — Email verification endpoint
 *
 * GET /api/verify?token=XYZ
 *
 * 1. Decodes + verifies the HMAC-signed token from /api/lead
 * 2. Checks it hasn't been used before (KV)
 * 3. Marks user as verified, increments verified_count in KV
 * 4. Sends admin notification email
 * 5. Returns branded HTML (success or error)
 *
 * Required env vars: same as lead.js + ADMIN_EMAIL
 */

const TOTAL_SPOTS = 300;

// ── KV (optional but strongly recommended) ────────────────────────────────────
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

function tokenKey(token) {
  return 'tok:' + createHash('sha256').update(token).digest('hex').slice(0, 32);
}

// ── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const rawToken = req.query?.token;

  if (!rawToken) {
    return res.status(400).send(renderPage('error', {
      title: 'Ungültiger Link',
      message: 'Dieser Bestätigungslink ist ungültig. Bitte registriere dich erneut.',
    }));
  }

  // ── Verify signature + expiry ──────────────────────────────────────────────
  const payload = parseToken(rawToken);

  if (!payload) {
    return res.status(400).send(renderPage('error', {
      title: 'Link abgelaufen',
      message: 'Dieser Bestätigungslink ist abgelaufen oder ungültig. Bitte registriere dich erneut.',
    }));
  }

  const { lead } = payload;
  const kv = await getKV();
  const tKey = tokenKey(rawToken);

  // ── Check for already-verified or already-used token (KV) ─────────────────
  if (kv) {
    try {
      const status = await kv.get(tKey);
      if (status === 'verified') {
        return res.status(200).send(renderPage('already', {
          title: 'Bereits bestätigt',
          message: `Dein Early Bird Spot für ${escapeHtml(lead.email)} wurde bereits bestätigt.`,
        }));
      }
    } catch (err) {
      console.warn('[VERIFY] KV status check failed:', err.message);
    }
  }

  // ── Mark as verified in KV ─────────────────────────────────────────────────
  let verifiedCount = null;
  if (kv) {
    try {
      // Mark this token as verified (keep entry so double-clicks show "already verified")
      await kv.set(tKey, 'verified', { ex: 48 * 3600 });
      // Mark email as verified (prevents re-registration)
      await kv.set(`email:${lead.email}`, 'verified');
      // Increment counter
      verifiedCount = await kv.incr('verified_count');
    } catch (err) {
      console.warn('[VERIFY] KV update failed:', err.message);
    }
  }

  const verifiedAt = new Date().toISOString();
  console.log('[LEAD_VERIFIED]', JSON.stringify({ email: lead.email, verifiedAt, verifiedCount }));

  // ── Send admin email ───────────────────────────────────────────────────────
  try {
    await sendAdminEmail(lead, verifiedAt);
  } catch (err) {
    // Non-fatal — lead is verified, just log the failure
    console.error('[VERIFY] Admin email failed:', err);
  }

  // ── Redirect to success page ───────────────────────────────────────────────
  const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '');
  res.setHeader('Location', `${siteUrl}/?verified=1`);
  return res.status(302).send('');
}

// ── Email ──────────────────────────────────────────────────────────────────────

async function sendAdminEmail(lead, verifiedAt) {
  const apiKey     = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail  = process.env.FROM_EMAIL;

  if (!apiKey || !adminEmail || !fromEmail) {
    console.warn('[VERIFY] Admin email env vars not configured — skipping.');
    return;
  }

  // Resend onboarding override
  const recipient = process.env.RESEND_ACCOUNT_EMAIL || adminEmail;

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from:    fromEmail,
    to:      recipient,
    subject: `✅ Early Bird Member verified – ${lead.firstName} ${lead.lastName}`,
    html:    buildAdminEmailHtml(lead, verifiedAt),
  });

  if (error) {
    console.error('[VERIFY] Resend admin email error:', JSON.stringify(error));
    throw error;
  }
}

function buildAdminEmailHtml(lead, verifiedAt) {
  const row = (label, value) =>
    `<tr>
       <td style="padding:8px 16px 8px 0;color:#666;font-size:14px;white-space:nowrap;">${escapeHtml(label)}</td>
       <td style="padding:8px 0;color:#111;font-size:14px;font-weight:600;">${value || '—'}</td>
     </tr>`;

  const fmtTime = (iso) =>
    new Date(iso).toLocaleString('de-DE', {
      timeZone:  'Europe/Berlin',
      dateStyle: 'full',
      timeStyle: 'short',
    });

  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0A0A0A;padding:24px 32px;">
            <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C6A45A;">
              BOMAYE GYM MUNICH
            </p>
            <h1 style="margin:8px 0 0;font-size:20px;color:#ffffff;">
              ✅ Early Bird Member verified
            </h1>
          </td>
        </tr>

        <!-- Verified badge -->
        <tr>
          <td style="padding:16px 32px 0;">
            <span style="display:inline-block;background:#e8f5e9;color:#2e7d32;
                         font-size:12px;font-weight:700;letter-spacing:1px;
                         text-transform:uppercase;padding:6px 14px;border-radius:20px;">
              Status: Verifiziert
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:24px 32px 32px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              ${row('Vorname',       escapeHtml(lead.firstName))}
              ${row('Nachname',      escapeHtml(lead.lastName))}
              ${row('E-Mail',        `<a href="mailto:${escapeHtml(lead.email)}" style="color:#C6A45A;">${escapeHtml(lead.email)}</a>`)}
              ${row('Telefon',       escapeHtml(lead.phone))}
              ${row('Kategorie',     escapeHtml(lead.category))}
              ${row('Geburtsdatum',  escapeHtml(lead.dob))}
              ${row('Ziel',          escapeHtml(lead.goal))}
              ${row('Straße',        escapeHtml(lead.street))}
              ${row('PLZ',           escapeHtml(lead.postalCode))}
              ${row('Stadt',         escapeHtml(lead.city))}
              ${Array.isArray(lead.members) && lead.members.length
                ? row('Family Members', lead.members.map((m, i) =>
                    escapeHtml(m) + (i === 3 ? ' <span style="color:#C6A45A;font-size:11px;">(free)</span>' : '')
                  ).join('<br />'))
                : ''}
              ${row('Eingereicht',   fmtTime(lead.submittedAt))}
              ${row('Verifiziert',   fmtTime(verifiedAt))}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#999;">
              Automatische Benachrichtigung — BOMAYE GYM Early Bird (verifiziert)
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── HTML page renderer ─────────────────────────────────────────────────────────

function renderPage(type, { title, message }) {
  const icon = type === 'error'
    ? '<i class="fa-solid fa-circle-xmark" style="color:#e53e3e;"></i>'
    : type === 'already'
    ? '<i class="fa-solid fa-circle-check" style="color:#C6A45A;"></i>'
    : '<i class="fa-solid fa-circle-check" style="color:#C6A45A;"></i>';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)} — BOMAYE GYM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Bebas+Neue&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a0a;color:#fff;font-family:'DM Sans',Arial,sans-serif;
         min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#111;border:1px solid rgba(198,164,90,0.12);border-radius:12px;
          padding:48px 40px;text-align:center;max-width:460px;width:100%}
    .icon{font-size:3rem;margin-bottom:24px;filter:drop-shadow(0 0 20px rgba(198,164,90,0.3))}
    .eyebrow{font-family:'Bebas Neue',sans-serif;font-size:0.6rem;letter-spacing:4px;
             color:#C6A45A;text-transform:uppercase;margin-bottom:16px;opacity:0.8}
    h1{font-family:'Bebas Neue',sans-serif;font-size:2.2rem;letter-spacing:0.04em;
       color:#fff;margin-bottom:16px;font-weight:400}
    p{font-size:0.9rem;color:rgba(255,255,255,0.5);line-height:1.75;margin-bottom:28px}
    a.btn{display:inline-block;background:#C6A45A;color:#000;text-decoration:none;
          font-size:0.7rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;
          padding:14px 32px;border-radius:4px}
  </style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">BOMAYE GYM MUNICH</div>
    <div class="icon">${icon}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a href="/" class="btn">Zur Startseite</a>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

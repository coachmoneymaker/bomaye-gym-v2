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

  // ── Send admin + user confirmation emails (parallel, non-fatal) ───────────
  console.log('[VERIFY] Admin email send start', { email: lead.email });
  console.log('[VERIFY] User confirmation email send start', { email: lead.email });

  const [adminResult, confirmResult] = await Promise.allSettled([
    sendAdminEmail(lead, verifiedAt),
    sendUserConfirmationEmail(lead),
  ]);

  if (adminResult.status === 'fulfilled') {
    console.log('[VERIFY] Admin email sent successfully', { email: lead.email });
  } else {
    console.error('[VERIFY] Admin email failed', { email: lead.email, error: adminResult.reason?.message ?? adminResult.reason });
  }

  if (confirmResult.status === 'fulfilled') {
    console.log('[VERIFY] User confirmation email sent successfully', { email: lead.email });
  } else {
    console.error('[VERIFY] User confirmation email failed', { email: lead.email, error: confirmResult.reason?.message ?? confirmResult.reason });
  }

  // ── Redirect to success page ───────────────────────────────────────────────
  const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '');
  res.setHeader('Location', `${siteUrl}/?verified=1`);
  return res.status(302).send('');
}

// ── Email ──────────────────────────────────────────────────────────────────────

async function sendAdminEmail(lead, verifiedAt) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[VERIFY] RESEND_API_KEY not configured — skipping admin email.');
    return;
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from:     'BOMAYE GYM <info@bomayegym.com>',
    to:       ['support@bomayegym.com'],
    replyTo:  lead.email,
    subject:  'New Early Bird Lead – BOMAYE GYM',
    html:     buildAdminEmailHtml(lead, verifiedAt),
  });

  if (error) {
    console.error('[VERIFY] Resend admin email error:', JSON.stringify(error));
    throw new Error(error.message || 'Resend send failed');
  }

  console.log('[VERIFY] Admin email sent:', data?.id);
}

async function sendUserConfirmationEmail(lead) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[VERIFY] RESEND_API_KEY not configured — skipping user confirmation email.');
    return;
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from:    'BOMAYE GYM <info@bomayegym.com>',
    to:      [lead.email],
    replyTo: 'support@bomayegym.com',
    subject: "You're in – BOMAYE GYM Early Bird",
    html:    buildUserConfirmationEmailHtml(lead),
  });

  if (error) {
    console.error('[VERIFY] Resend user confirmation email error:', JSON.stringify(error));
    throw new Error(error.message || 'Resend send failed');
  }

  console.log('[VERIFY] User confirmation email sent:', data?.id);
}

function buildUserConfirmationEmailHtml(lead) {
  const categoryLabel = {
    Kids:   'Kids (6–9)',
    Youth:  'Youth (10–17)',
    Adults: 'Adults (18+)',
    Family: 'Family',
  }[lead.category] ?? lead.category;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>You're in – BOMAYE GYM Early Bird</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#111111;border-radius:12px;overflow:hidden;
                      border:1px solid rgba(198,164,90,0.15);">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;padding:36px 44px 32px;
                       border-bottom:1px solid rgba(198,164,90,0.12);text-align:center;">
              <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.22em;
                        text-transform:uppercase;color:#C6A45A;font-weight:600;">
                BOMAYE GYM MUNICH
              </p>
              <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:700;
                         letter-spacing:-0.02em;line-height:1.2;">
                You're officially in.
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 44px 28px;">
              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.75;">
                Hey ${escapeHtml(lead.firstName)},<br /><br />
                your Early Bird spot is confirmed. We'll keep you posted on the
                opening date, member pricing, and everything else you need to know
                before day one.
              </p>

              <!-- Summary card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.07);
                            border-radius:8px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.12em;
                              text-transform:uppercase;color:rgba(255,255,255,0.3);">Name</p>
                    <p style="margin:5px 0 0;font-size:14px;color:#ffffff;font-weight:500;">
                      ${escapeHtml(lead.firstName)} ${escapeHtml(lead.lastName)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.12em;
                              text-transform:uppercase;color:rgba(255,255,255,0.3);">Category</p>
                    <p style="margin:5px 0 0;font-size:14px;color:#ffffff;font-weight:500;">
                      ${escapeHtml(categoryLabel)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;">
                    <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.12em;
                              text-transform:uppercase;color:rgba(255,255,255,0.3);">Status</p>
                    <p style="margin:5px 0 0;font-size:14px;font-weight:600;">
                      <span style="color:#C6A45A;">&#10003;&nbsp; Early Bird Confirmed</span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.4);line-height:1.75;">
                Questions? Reply to this email or reach us at
                <a href="mailto:support@bomayegym.com"
                   style="color:#C6A45A;text-decoration:none;">support@bomayegym.com</a>.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 44px;">
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.05);margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 44px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);line-height:1.7;">
                BOMAYE GYM Munich &mdash; Early Bird Programme<br />
                You received this because you registered for an Early Bird spot.
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

function buildAdminEmailHtml(lead, verifiedAt) {
  const field = (label, value) => `
    <tr>
      <td style="padding:14px 20px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
        <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;
                  text-transform:uppercase;color:#999999;">${escapeHtml(label)}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#1a1a1a;font-weight:500;line-height:1.5;">
          ${value || '<span style="color:#cccccc;">—</span>'}
        </p>
      </td>
    </tr>`;

  const fmtDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-GB', {
      timeZone:  'Europe/Berlin',
      day:       '2-digit',
      month:     'long',
      year:      'numeric',
      hour:      '2-digit',
      minute:    '2-digit',
    }) + ' (Berlin)';
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New Early Bird Lead – BOMAYE GYM</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 24px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;padding:32px 40px 28px;">
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;
                        text-transform:uppercase;color:#C6A45A;font-weight:600;">
                BOMAYE GYM MUNICH
              </p>
              <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:600;
                         letter-spacing:-0.01em;line-height:1.3;">
                New Early Bird Lead
              </h1>
              <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.4);
                        font-weight:400;">
                A new registration has been verified and is ready for review.
              </p>
            </td>
          </tr>

          <!-- Status badge -->
          <tr>
            <td style="padding:20px 40px 0;">
              <span style="display:inline-block;background:#ecfdf5;color:#065f46;
                           font-size:11px;font-weight:700;letter-spacing:0.08em;
                           text-transform:uppercase;padding:5px 12px;border-radius:100px;
                           border:1px solid #a7f3d0;">
                &#10003;&nbsp; Verified
              </span>
            </td>
          </tr>

          <!-- Lead details -->
          <tr>
            <td style="padding:20px 20px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">

                ${field('First Name',    escapeHtml(lead.firstName))}
                ${field('Last Name',     escapeHtml(lead.lastName))}
                ${field('Email',         `<a href="mailto:${escapeHtml(lead.email)}"
                           style="color:#C6A45A;text-decoration:none;font-weight:600;">
                           ${escapeHtml(lead.email)}</a>`)}
                ${field('Phone',         escapeHtml(lead.phone))}
                ${field('Category',      escapeHtml(lead.category))}
                ${field('Date of Birth', escapeHtml(lead.dob))}
                ${field('Goal',          escapeHtml(lead.goal))}
                ${Array.isArray(lead.members) && lead.members.length
                  ? field('Family Members', lead.members.map((m, i) =>
                      escapeHtml(m) + (i === 3
                        ? ' <span style="color:#C6A45A;font-size:11px;font-weight:600;">(free)</span>'
                        : '')
                    ).join('<br />'))
                  : ''}
                ${field('Submitted At',  fmtDate(lead.submittedAt))}

                <!-- Last row: no bottom border -->
                <tr>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;
                              text-transform:uppercase;color:#999999;">Verified At</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#1a1a1a;font-weight:500;line-height:1.5;">
                      ${escapeHtml(fmtDate(verifiedAt))}
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Reply note -->
          <tr>
            <td style="padding:20px 40px;">
              <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;">
                Reply directly to this email to contact
                <strong style="color:#1a1a1a;">${escapeHtml(lead.firstName)} ${escapeHtml(lead.lastName)}</strong>
                — the reply-to is set to their address.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f0f0f0;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;">
              <p style="margin:0;font-size:11px;color:#bbbbbb;line-height:1.7;">
                Automated notification &middot; BOMAYE GYM Early Bird Programme<br />
                Sent to support@bomayegym.com &middot; Do not reply to this footer address.
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

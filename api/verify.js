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

  console.log('[VERIFY] start', { tokenPrefix: rawToken ? rawToken.slice(0, 8) + '…' : 'none' });

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
  console.log('[VERIFY] lead found', { email: lead.email });

  const kv = await getKV();
  const tKey = tokenKey(rawToken);

  // ── Check for already-verified or already-used token (KV) ─────────────────
  if (kv) {
    try {
      const status = await kv.get(tKey);
      if (status === 'verified') {
        console.log('[VERIFY] already verified: true', { email: lead.email });
        return res.status(200).send(renderPage('already', {
          title: 'Bereits bestätigt',
          message: `Dein Early Bird Spot für ${escapeHtml(lead.email)} wurde bereits bestätigt.`,
        }));
      }
    } catch (err) {
      console.warn('[VERIFY] KV status check failed:', err.message);
    }
  }

  console.log('[VERIFY] already verified: false', { email: lead.email });

  // ── Mark as verified in KV ─────────────────────────────────────────────────
  let verifiedCount = null;
  if (kv) {
    try {
      // Mark this token as verified (keep entry so double-clicks show "already verified")
      await kv.set(tKey, 'verified', { ex: 48 * 3600 });
      // Mark email as verified (prevents re-registration)
      await kv.set(`email:${lead.email}`, 'verified');
      // Increment counter and capture result
      const countBefore = (await kv.get('verified_count')) ?? 0;
      console.log('[VERIFY] counter before increment:', Number(countBefore));
      verifiedCount = await kv.incr('verified_count');
      console.log('[VERIFY] counter after increment:', verifiedCount);
    } catch (err) {
      console.warn('[VERIFY] KV update failed:', err.message);
    }
  } else {
    console.warn('[VERIFY] KV unavailable — counter not incremented');
  }

  const verifiedAt = new Date().toISOString();
  console.log('[LEAD_VERIFIED]', JSON.stringify({ email: lead.email, verifiedAt, verifiedCount }));

  // ── Resolve siteUrl before emails ────────────────────────────────────────
  const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '');

  // ── Send admin + user confirmation emails (parallel, non-fatal) ───────────
  console.log('[VERIFY] Admin email send start', { email: lead.email });
  console.log('[VERIFY] User confirmation email send start', { email: lead.email });

  const [adminResult, confirmResult] = await Promise.allSettled([
    sendAdminEmail(lead, verifiedAt),
    sendUserConfirmationEmail(lead, siteUrl),
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

  // [DEBUG] Remove before go-live
  console.log('[DEBUG][VERIFY] Resend admin email response:', JSON.stringify({ data, error }));

  if (error) {
    console.error('[VERIFY] Resend admin email error:', JSON.stringify(error));
    throw new Error(error.message || 'Resend send failed');
  }

  console.log('[VERIFY] Admin email sent:', data?.id);
}

async function sendUserConfirmationEmail(lead, siteUrl) {
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
    subject: 'Dein Early Bird Platz ist gesichert — BOMAYE GYM Munich',
    html:    buildUserConfirmationEmailHtml(lead, siteUrl),
  });

  // [DEBUG] Remove before go-live
  console.log('[DEBUG][VERIFY] Resend user confirmation email response:', JSON.stringify({ data, error }));

  if (error) {
    console.error('[VERIFY] Resend user confirmation email error:', JSON.stringify(error));
    throw new Error(error.message || 'Resend send failed');
  }

  console.log('[VERIFY] User confirmation email sent:', data?.id);
}

function buildUserConfirmationEmailHtml(lead, siteUrl) {
  const logoUrl = siteUrl ? `${siteUrl}/assets/images/bomaye-logo.png` : '';
  const categoryLabel = {
    Kids:   'Kids (6–9 Jahre)',
    Youth:  'Jugend (10–17 Jahre)',
    Adults: 'Erwachsene (18+)',
    Family: 'Familie',
  }[lead.category] ?? lead.category;

  return `<!DOCTYPE html>
<html lang="de" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Dein Early Bird Platz ist gesichert — BOMAYE GYM</title>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#080808;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#080808;">
    Willkommen, ${escapeHtml(lead.firstName)}. Dein Platz bei BOMAYE GYM Munich ist offiziell gesichert.&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
         style="background-color:#080808;">
    <tr>
      <td align="center" style="padding:48px 16px 56px;">

        <table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation"
               style="width:100%;max-width:560px;">

          <!-- ── LOGO ─────────────────────────────────────────────── -->
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

              <!-- Hero header block -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center"
                      style="padding:52px 52px 44px;
                             border-bottom:1px solid rgba(198,164,90,0.1);">

                    <!-- Checkmark icon (inline SVG — email safe) -->
                    <div style="margin:0 0 24px;">
                      <table cellpadding="0" cellspacing="0" border="0" role="presentation"
                             style="margin:0 auto;">
                        <tr>
                          <td bgcolor="#1a1a0d"
                              style="width:56px;height:56px;border-radius:50%;
                                     border:2px solid rgba(198,164,90,0.35);
                                     background-color:#1a1a0d;text-align:center;
                                     vertical-align:middle;line-height:56px;">
                            <span style="font-size:22px;color:#C6A45A;line-height:56px;">&#10003;</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Eyebrow -->
                    <p style="margin:0 0 18px;
                              font-family:Arial,Helvetica,sans-serif;
                              font-size:10px;font-weight:700;
                              letter-spacing:0.32em;text-transform:uppercase;
                              color:#C6A45A;">
                      Founding Member &mdash; Bestätigt
                    </p>

                    <!-- Headline -->
                    <h1 style="margin:0;
                               font-family:Arial,Helvetica,sans-serif;
                               font-size:30px;font-weight:700;
                               letter-spacing:-0.01em;line-height:1.2;
                               color:#ffffff;">
                      Dein Platz ist bestätigt.
                    </h1>

                  </td>
                </tr>
              </table>

              <!-- Body copy -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:44px 52px 36px;">
                    <p style="margin:0 0 12px;
                              font-family:Arial,Helvetica,sans-serif;
                              font-size:16px;font-weight:600;
                              color:#ffffff;line-height:1.4;">
                      Hey ${escapeHtml(lead.firstName)},
                    </p>
                    <p style="margin:0;
                              font-family:Arial,Helvetica,sans-serif;
                              font-size:15px;font-weight:400;
                              color:rgba(255,255,255,0.55);
                              line-height:1.85;letter-spacing:0.01em;">
                      dein Early Bird Platz bei BOMAYE GYM ist jetzt offiziell
                      bestätigt.<br /><br />
                      Wir halten dich auf dem Laufenden zu Opening, Preisen und
                      allem, was du für deinen Start wissen musst.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Membership summary -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:0 52px 44px;">

                    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
                           style="border:1px solid rgba(198,164,90,0.14);border-radius:3px;
                                  background-color:#0d0d0d;">

                      <!-- Row: Name -->
                      <tr>
                        <td style="padding:16px 22px;
                                   border-bottom:1px solid rgba(255,255,255,0.05);">
                          <p style="margin:0 0 5px;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:9px;font-weight:700;
                                    letter-spacing:0.2em;text-transform:uppercase;
                                    color:rgba(255,255,255,0.25);">Mitglied</p>
                          <p style="margin:0;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:14px;font-weight:600;
                                    color:#ffffff;">
                            ${escapeHtml(lead.firstName)} ${escapeHtml(lead.lastName)}
                          </p>
                        </td>
                      </tr>

                      <!-- Row: Category -->
                      <tr>
                        <td style="padding:16px 22px;
                                   border-bottom:1px solid rgba(255,255,255,0.05);">
                          <p style="margin:0 0 5px;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:9px;font-weight:700;
                                    letter-spacing:0.2em;text-transform:uppercase;
                                    color:rgba(255,255,255,0.25);">Kategorie</p>
                          <p style="margin:0;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:14px;font-weight:600;
                                    color:#ffffff;">
                            ${escapeHtml(categoryLabel)}
                          </p>
                        </td>
                      </tr>

                      <!-- Row: Status -->
                      <tr>
                        <td style="padding:16px 22px;">
                          <p style="margin:0 0 5px;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:9px;font-weight:700;
                                    letter-spacing:0.2em;text-transform:uppercase;
                                    color:rgba(255,255,255,0.25);">Status</p>
                          <p style="margin:0;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:14px;font-weight:700;
                                    color:#C6A45A;">
                            &#10003;&nbsp; Early Bird Platz bestätigt
                          </p>
                        </td>
                      </tr>

                    </table>

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

              <!-- Contact note -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:28px 52px 44px;">
                    <p style="margin:0;
                              font-family:Arial,Helvetica,sans-serif;
                              font-size:13px;font-weight:400;
                              color:rgba(255,255,255,0.3);
                              line-height:1.75;letter-spacing:0.01em;">
                      Fragen? Antworte einfach auf diese E-Mail oder schreibe uns an
                      <a href="mailto:support@bomayegym.com"
                         style="color:#C6A45A;text-decoration:none;font-weight:500;">
                        support@bomayegym.com
                      </a>.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── FOOTER ────────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding:36px 48px 0;">

              <p style="margin:0 0 20px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:10px;color:rgba(198,164,90,0.25);
                        letter-spacing:0.35em;">
                &mdash;&nbsp;&nbsp;&#9670;&nbsp;&nbsp;&mdash;
              </p>

              <p style="margin:0 0 10px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:11px;font-weight:700;
                        letter-spacing:0.28em;text-transform:uppercase;
                        color:rgba(198,164,90,0.35);">
                BOMAYE GYM MUNICH
              </p>

              <p style="margin:0 0 16px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:11px;font-weight:400;
                        color:rgba(255,255,255,0.18);
                        letter-spacing:0.04em;line-height:1.6;">
                Exklusiv. Limitiert. Für die ersten 300 Mitglieder.
              </p>

              <p style="margin:0;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:10px;font-weight:400;
                        color:rgba(255,255,255,0.1);
                        line-height:1.75;letter-spacing:0.01em;">
                Du erhältst diese E-Mail, weil du dich erfolgreich für einen<br />
                Early Bird Platz bei BOMAYE GYM Munich registriert hast.
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

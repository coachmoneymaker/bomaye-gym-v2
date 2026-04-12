import { Resend } from 'resend';

/**
 * /api/contact — Vercel Serverless Function
 *
 * Handles Family Membership and Corporate Boxing inquiry form submissions.
 * Sends a branded HTML notification email to support@bomayegym.com via Resend.
 *
 * POST /api/contact
 * Body: { type: 'family' | 'corporate', ...fields }
 *
 * Required env var:
 *   RESEND_API_KEY — Resend API key
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body ?? {};
  const { type, name, email, phone } = body;

  // ── Validate type ──────────────────────────────────────────────────────────
  if (type !== 'family' && type !== 'corporate') {
    return res.status(400).json({ error: 'Invalid form type' });
  }

  // ── Validate required fields ───────────────────────────────────────────────
  const errors = {};
  if (!name?.trim())  errors.name  = 'Name is required';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Valid email address required';
  if (!phone?.trim()) errors.phone = 'Phone is required';

  if (type === 'corporate') {
    if (!body.persons)      errors.persons = 'Number of persons is required';
    if (!body.date)         errors.date    = 'Date is required';
    if (!body.time?.trim()) errors.time    = 'Time is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', fields: errors });
  }

  // ── Check API key ──────────────────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[CONTACT] RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // ── Build email ────────────────────────────────────────────────────────────
  const subject = type === 'family'
    ? 'New Family Membership Inquiry – BOMAYE GYM'
    : 'New Corporate Boxing Inquiry – BOMAYE GYM';

  const html = type === 'family'
    ? buildFamilyEmailHtml(body)
    : buildCorporateEmailHtml(body);

  // ── Send via Resend ────────────────────────────────────────────────────────
  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from:    'BOMAYE GYM <info@bomayegym.com>',
      to:      ['support@bomayegym.com'],
      replyTo: email.trim(),
      subject,
      html,
    });

    if (error) {
      console.error('[CONTACT] Resend error:', JSON.stringify(error));
      return res.status(500).json({ error: 'Failed to send email' });
    }

    console.log('[CONTACT] Email sent:', data?.id, { type, email });
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[CONTACT] Unexpected error:', err?.message ?? err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}

// ── HTML builders ──────────────────────────────────────────────────────────────

function buildFamilyEmailHtml(data) {
  const {
    name     = '',
    email    = '',
    phone    = '',
    count    = '',
    members  = [],
    household = '',
    street   = '',
    plz      = '',
    city     = '',
    message  = '',
  } = data;

  const memberRows = Array.isArray(members) && members.length
    ? members.map((m, i) =>
        field(`Family Member ${i + 1}`, escapeHtml(m))
      ).join('')
    : '';

  const addressRow = household === 'Nein' && (street || plz || city)
    ? field('Address', escapeHtml([street, plz, city].filter(Boolean).join(', ')))
    : '';

  return emailWrapper('New Family Membership Inquiry', `
    ${field('Contact Person', escapeHtml(name))}
    ${field('Email',          emailLink(email))}
    ${field('Phone',          escapeHtml(phone))}
    ${field('Family Members', escapeHtml(count))}
    ${memberRows}
    ${field('Same Household', escapeHtml(household))}
    ${addressRow}
    ${message ? field('Message', escapeHtml(message)) : ''}
    ${field('Submitted At', new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/Berlin',
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) + ' (Berlin)')}
  `);
}

function buildCorporateEmailHtml(data) {
  const {
    name     = '',
    email    = '',
    phone    = '',
    company  = '',
    persons  = '',
    date     = '',
    time     = '',
    catering = '',
    event    = '',
    message  = '',
  } = data;

  return emailWrapper('New Corporate Boxing Inquiry', `
    ${field('Name',             escapeHtml(name))}
    ${field('Email',            emailLink(email))}
    ${field('Phone',            escapeHtml(phone))}
    ${company  ? field('Company / Organisation', escapeHtml(company))  : ''}
    ${field('Number of Persons', escapeHtml(persons))}
    ${field('Requested Date',    escapeHtml(date))}
    ${field('Requested Time',    escapeHtml(time))}
    ${catering ? field('Catering',  escapeHtml(catering)) : ''}
    ${event    ? field('Event Type', escapeHtml(event))   : ''}
    ${message  ? field('Message',    escapeHtml(message)) : ''}
    ${field('Submitted At', new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/Berlin',
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) + ' (Berlin)')}
  `);
}

// ── Template helpers ───────────────────────────────────────────────────────────

function emailWrapper(title, fieldsHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)} – BOMAYE GYM</title>
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
                ${escapeHtml(title)}
              </h1>
              <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.4);">
                New inquiry submitted via the website.
              </p>
            </td>
          </tr>

          <!-- New badge -->
          <tr>
            <td style="padding:20px 40px 0;">
              <span style="display:inline-block;background:#eff6ff;color:#1d4ed8;
                           font-size:11px;font-weight:700;letter-spacing:0.08em;
                           text-transform:uppercase;padding:5px 12px;border-radius:100px;
                           border:1px solid #bfdbfe;">
                New Inquiry
              </span>
            </td>
          </tr>

          <!-- Fields table -->
          <tr>
            <td style="padding:20px 20px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">
                ${fieldsHtml}
              </table>
            </td>
          </tr>

          <!-- Reply note -->
          <tr>
            <td style="padding:20px 40px;">
              <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;">
                Reply directly to this email to contact the sender —
                the reply-to is set to their address.
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
                Automated notification &middot; BOMAYE GYM Munich<br />
                Sent to support@bomayegym.com
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

function field(label, value) {
  return `
  <tr>
    <td style="padding:13px 20px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
      <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.1em;
                text-transform:uppercase;color:#999999;">${escapeHtml(label)}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#1a1a1a;font-weight:500;line-height:1.5;">
        ${value || '<span style="color:#cccccc;">—</span>'}
      </p>
    </td>
  </tr>`;
}

function emailLink(email) {
  const safe = escapeHtml(email);
  return `<a href="mailto:${safe}" style="color:#C6A45A;text-decoration:none;font-weight:600;">${safe}</a>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

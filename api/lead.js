import { Resend } from 'resend';

/**
 * /api/lead — Vercel Serverless Function
 *
 * Collects early-bird leads from the /coming-soon form.
 * Sends an admin notification email via Resend on every submission.
 *
 * Required environment variables (set in Vercel dashboard):
 *   RESEND_API_KEY   — your Resend API key
 *   ADMIN_EMAIL      — address that receives lead notifications
 *   FROM_EMAIL       — verified sender address in your Resend domain
 *
 * Ready to extend later with:
 *   - CRM (HubSpot / Pipedrive): see sendToCRM() stub
 *   - Google Sheets (Sheets API): see appendToSheet() stub
 */

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, category, dob, goal, street, postalCode, city } = req.body ?? {};

  // ── Validation ───────────────────────────────────────────────
  const errors = {};
  if (!firstName?.trim()) {
    errors.firstName = 'First name is required.';
  }
  if (!lastName?.trim()) {
    errors.lastName = 'Last name is required.';
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'A valid email is required.';
  }
  // Normalize category to title-case to accept both 'kids' and 'Kids'
  const normalizedCategory = category
    ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
    : null;
  if (!normalizedCategory || !['Kids', 'Youth', 'Adults'].includes(normalizedCategory)) {
    errors.category = 'Category must be Kids, Youth, or Adults.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', fields: errors });
  }

  // ── Build lead object ────────────────────────────────────────
  const lead = {
    firstName:  firstName.trim(),
    lastName:   lastName.trim(),
    email:      email.trim().toLowerCase(),
    phone:      phone?.trim() ?? '',
    category:   normalizedCategory,
    dob:        dob?.trim() ?? '',
    goal:       goal?.trim() ?? '',
    street:     street?.trim() ?? '',
    postalCode: postalCode?.trim() ?? '',
    city:       city?.trim() ?? '',
    submittedAt: new Date().toISOString(),
    source: 'coming-soon',
  };

  // ── Log (always runs) ────────────────────────────────────────
  console.log('[LEAD_CAPTURED]', JSON.stringify(lead));

  // ── Send admin email via Resend ──────────────────────────────
  try {
    await sendAdminEmail(lead);
  } catch (err) {
    console.error('[LEAD] Email send failed:', JSON.stringify(err) ?? err);
    // Non-fatal — lead is already logged above.
  }

  return res.status(200).json({ success: true });
}

// ── Email ────────────────────────────────────────────────────

async function sendAdminEmail(lead) {
  const apiKey     = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail  = process.env.FROM_EMAIL;

  if (!apiKey || !adminEmail || !fromEmail) {
    console.warn('[LEAD] Email env vars not configured — skipping send.');
    return; // treat as non-fatal in dev / staging
  }

  // Resend onboarding mode: can only deliver to the account owner's email.
  // Set RESEND_ACCOUNT_EMAIL to override ADMIN_EMAIL during testing.
  const recipient = process.env.RESEND_ACCOUNT_EMAIL || adminEmail;
  if (process.env.RESEND_ACCOUNT_EMAIL) {
    console.log('[LEAD] Resend onboarding mode — sending to account email instead of admin.');
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from:    fromEmail,
    to:      recipient,
    subject: 'New Early Bird Lead – BOMAYE GYM MUNICH',
    html:    buildEmailHtml(lead),
  });

  if (error) {
    console.error('[LEAD] Resend API error:', JSON.stringify(error));
    throw error;
  }
}

function buildEmailHtml(lead) {
  const row = (label, value) =>
    value
      ? `<tr>
           <td style="padding:8px 16px 8px 0;color:#666;font-size:14px;white-space:nowrap;">${label}</td>
           <td style="padding:8px 0;color:#111;font-size:14px;font-weight:600;">${value}</td>
         </tr>`
      : '';

  const formattedTime = new Date(lead.submittedAt).toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
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
              New Early Bird Lead
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              ${row('Vorname',       lead.firstName)}
              ${row('Nachname',     lead.lastName)}
              ${row('E-Mail',       `<a href="mailto:${lead.email}" style="color:#C6A45A;">${lead.email}</a>`)}
              ${row('Telefon',      lead.phone || '—')}
              ${row('Kategorie',    lead.category)}
              ${row('Geburtsdatum', lead.dob || '—')}
              ${row('Ziel',         lead.goal || '—')}
              ${row('Straße',       lead.street || '—')}
              ${row('PLZ',          lead.postalCode || '—')}
              ${row('Stadt',        lead.city || '—')}
              ${row('Eingereicht',  formattedTime)}
              ${row('Quelle',       lead.source)}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#999;">
              This is an automated notification from the BOMAYE GYM early-bird form.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Future extension points (stubs) ─────────────────────────

/**
 * sendToCRM — connect HubSpot, Pipedrive, etc.
 *
 * async function sendToCRM(lead) {
 *   await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
 *     },
 *     body: JSON.stringify({
 *       properties: {
 *         firstname: lead.firstName,
 *         lastname:  lead.lastName,
 *         email:     lead.email,
 *         phone:     lead.phone,
 *       },
 *     }),
 *   });
 * }
 */

/**
 * appendToSheet — connect Google Sheets API
 *
 * async function appendToSheet(lead) {
 *   const auth = new google.auth.GoogleAuth({
 *     credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
 *     scopes: ['https://www.googleapis.com/auth/spreadsheets'],
 *   });
 *   const sheets = google.sheets({ version: 'v4', auth });
 *   await sheets.spreadsheets.values.append({
 *     spreadsheetId: process.env.SHEET_ID,
 *     range: 'Leads!A:G',
 *     valueInputOption: 'RAW',
 *     requestBody: {
 *       values: [[
 *         lead.submittedAt, lead.firstName, lead.lastName,
 *         lead.email, lead.phone, lead.category, lead.source,
 *       ]],
 *     },
 *   });
 * }
 */

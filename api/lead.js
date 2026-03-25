/**
 * /api/lead — Vercel Serverless Function
 *
 * Collects early-bird leads from the /coming-soon form.
 * Currently logs to console. Ready to extend with:
 *   - Email (Resend / Nodemailer): see sendEmail() stub
 *   - CRM (HubSpot / Pipedrive): see sendToCRM() stub
 *   - Google Sheets (Sheets API): see appendToSheet() stub
 */

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, category } = req.body ?? {};

  // ── Validation ───────────────────────────────────────────────
  const errors = {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'A valid email is required.';
  }
  if (!category || !['Kids', 'Youth', 'Adults'].includes(category)) {
    errors.category = 'Category must be Kids, Youth, or Adults.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', fields: errors });
  }

  // ── Build lead object ────────────────────────────────────────
  const lead = {
    firstName: firstName?.trim() ?? '',
    lastName:  lastName?.trim()  ?? '',
    email:     email.trim().toLowerCase(),
    phone:     phone?.trim()     ?? '',
    category,
    submittedAt: new Date().toISOString(),
    source: 'coming-soon',
  };

  // ── Log (always runs) ────────────────────────────────────────
  console.log('[LEAD]', JSON.stringify(lead));

  // ── Extension points (uncomment + implement when ready) ─────

  // await sendEmail(lead);
  // await sendToCRM(lead);
  // await appendToSheet(lead);

  return res.status(200).json({ success: true });
}

// ── Stubs ────────────────────────────────────────────────────

/**
 * sendEmail — connect Resend, Nodemailer, or similar
 *
 * async function sendEmail(lead) {
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   await resend.emails.send({
 *     from: 'noreply@bomaye.de',
 *     to: 'info@bomaye.de',
 *     subject: `New Early Bird: ${lead.firstName} ${lead.lastName}`,
 *     html: `<p>${JSON.stringify(lead, null, 2)}</p>`,
 *   });
 * }
 */

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
 *   // Uses google-auth-library + googleapis packages
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

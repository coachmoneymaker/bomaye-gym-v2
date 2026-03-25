// POST /api/lead — stores lead + increments spot counter
// Uses Vercel KV via REST API (no npm package needed)
// Dedup: one increment per unique email address

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Always return success — form logic must never be blocked
  try {
    const body  = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const email = (body.email ?? '').toLowerCase().trim();

    const kv  = process.env.KV_REST_API_URL;
    const tok = process.env.KV_REST_API_TOKEN;

    if (!kv || !tok || !email) {
      return res.status(200).json({ success: true });
    }

    const headers   = { Authorization: `Bearer ${tok}` };
    const emailKey  = `lead:${encodeURIComponent(email)}`;

    // SET NX — only succeeds if this email has never registered
    const setResp   = await fetch(`${kv}/set/${emailKey}/1?nx=true`, {
      method: 'POST',
      headers,
    });
    const setData   = await setResp.json();

    // result === "OK" means the key was new (not a duplicate)
    if (setData.result === 'OK') {
      // Check cap before incrementing
      const cntResp = await fetch(`${kv}/get/spots`, { headers });
      const cntData = await cntResp.json();
      const current = parseInt(cntData.result ?? '0', 10);

      if (current < 300) {
        await fetch(`${kv}/incr/spots`, { method: 'POST', headers });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[lead] error (non-fatal):', err);
    return res.status(200).json({ success: true });
  }
}

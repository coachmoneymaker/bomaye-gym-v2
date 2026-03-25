// GET /api/spots — returns current spot count
// Uses Vercel KV via REST API (no npm package needed)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const kv  = process.env.KV_REST_API_URL;
    const tok = process.env.KV_REST_API_TOKEN;

    if (!kv || !tok) {
      // KV not configured — return neutral value so UI doesn't break
      return res.status(200).json({ taken: 0, total: 300, remaining: 300 });
    }

    const r    = await fetch(`${kv}/get/spots`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const data = await r.json();
    const taken = Math.min(Math.max(parseInt(data.result ?? '0', 10), 0), 300);

    return res.status(200).json({ taken, total: 300, remaining: 300 - taken });
  } catch (err) {
    console.error('[spots] error:', err);
    return res.status(200).json({ taken: 0, total: 300, remaining: 300 });
  }
}

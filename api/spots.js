import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * /api/spots — Returns real early-bird spot availability
 *
 * GET /api/spots
 * Returns: { total: number, taken: number, spots_left: number }
 *
 * Counter is driven by verified_count in Vercel KV.
 * Falls back to /data/earlybird.json if KV is not configured.
 */

const TOTAL_SPOTS = 300;

// Only cache a successful KV instance — never cache null so that transient
// failures on a warm lambda do not permanently disable the counter.
let _kv = null;
async function getKV() {
  if (_kv) return _kv;
  // Must check env vars first: @vercel/kv exports a Proxy whose getter throws
  // when env vars are missing. Without this guard, `await getKV()` triggers a
  // thenable check (kv.then) on the Proxy, which throws and crashes the handler.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.warn('[SPOTS][getKV] KV_REST_API_URL or KV_REST_API_TOKEN missing — KV disabled, will fall back to JSON');
    return null;
  }
  try {
    const mod = await import('@vercel/kv');
    _kv = mod.kv;
    console.log('[SPOTS][getKV] KV client initialised');
    return _kv;
  } catch (err) {
    // Do NOT cache null — allow retry on next invocation
    console.error('[SPOTS][getKV] Failed to import @vercel/kv:', err.message);
    return null;
  }
}

function setNoCacheHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try KV first (real-time verified count)
  console.log('[SPOTS] reading key: verified_count');
  const kv = await getKV();
  if (kv) {
    try {
      const rawValue = await kv.get('verified_count');
      console.log('[SPOTS] raw KV value for verified_count:', rawValue);

      // null means the key doesn't exist yet (no verifications completed)
      const verified = rawValue === null ? 0 : Number(rawValue);
      console.log('[SPOTS] numeric verified count:', verified);

      const taken = Math.min(TOTAL_SPOTS, Math.max(0, verified));
      const spotsLeft = TOTAL_SPOTS - taken;
      console.log('[SPOTS] final JSON response — taken:', taken, 'spots_left:', spotsLeft, '| source: kv');
      setNoCacheHeaders(res);
      return res.status(200).json({ total: TOTAL_SPOTS, taken, spots_left: spotsLeft });
    } catch (err) {
      console.error('[SPOTS] KV read FAILED — falling back to JSON:', err.message);
      console.error('[SPOTS] KV error stack:', err.stack);
    }
  } else {
    console.warn('[SPOTS] KV not available — using JSON fallback. This means the counter will not reflect real verifications.');
  }

  // Fallback: static JSON file
  try {
    const filePath = join(process.cwd(), 'data', 'earlybird.json');
    const raw  = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const taken = data.taken ?? (TOTAL_SPOTS - (data.spots_left ?? TOTAL_SPOTS));
    const spotsLeft = TOTAL_SPOTS - taken;
    console.log('[SPOTS] returning taken:', Math.max(0, taken), '| source: json-fallback');
    setNoCacheHeaders(res);
    return res.status(200).json({
      total:      data.total ?? TOTAL_SPOTS,
      taken:      Math.max(0, taken),
      spots_left: Math.max(0, spotsLeft),
    });
  } catch (err) {
    console.error('[SPOTS] Failed to read earlybird.json:', err);
    console.log('[SPOTS] returning taken: 0 | source: hardcoded-fallback');
    setNoCacheHeaders(res);
    return res.status(200).json({ total: TOTAL_SPOTS, taken: 0, spots_left: TOTAL_SPOTS });
  }
}

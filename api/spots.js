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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try KV first (real-time verified count)
  const kv = await getKV();
  if (kv) {
    try {
      const verified = (await kv.get('verified_count')) ?? 0;
      const taken = Math.min(TOTAL_SPOTS, Math.max(0, Number(verified)));
      const spotsLeft = TOTAL_SPOTS - taken;
      console.log('[SPOTS] returning taken:', taken, '| source: kv');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ total: TOTAL_SPOTS, taken, spots_left: spotsLeft });
    } catch (err) {
      console.warn('[SPOTS] KV read failed, falling back to JSON:', err.message);
    }
  }

  // Fallback: static JSON file
  try {
    const filePath = join(process.cwd(), 'data', 'earlybird.json');
    const raw  = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const taken = data.taken ?? (TOTAL_SPOTS - (data.spots_left ?? TOTAL_SPOTS));
    const spotsLeft = TOTAL_SPOTS - taken;
    console.log('[SPOTS] returning taken:', Math.max(0, taken), '| source: json-fallback');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      total:      data.total ?? TOTAL_SPOTS,
      taken:      Math.max(0, taken),
      spots_left: Math.max(0, spotsLeft),
    });
  } catch (err) {
    console.error('[SPOTS] Failed to read earlybird.json:', err);
    console.log('[SPOTS] returning taken: 0 | source: hardcoded-fallback');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ total: TOTAL_SPOTS, taken: 0, spots_left: TOTAL_SPOTS });
  }
}

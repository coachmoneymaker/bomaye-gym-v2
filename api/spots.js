import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * /api/spots — Returns real early-bird spot availability
 *
 * GET /api/spots
 * Returns: { spots_left: number, total: number }
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
      const spotsLeft = Math.max(0, TOTAL_SPOTS - Number(verified));
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      return res.status(200).json({ spots_left: spotsLeft, total: TOTAL_SPOTS });
    } catch (err) {
      console.warn('[SPOTS] KV read failed, falling back to JSON:', err.message);
    }
  }

  // Fallback: static JSON file
  try {
    const filePath = join(process.cwd(), 'data', 'earlybird.json');
    const raw  = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      spots_left: data.spots_left ?? TOTAL_SPOTS,
      total:      data.total      ?? TOTAL_SPOTS,
    });
  } catch (err) {
    console.error('[SPOTS] Failed to read earlybird.json:', err);
    return res.status(200).json({ spots_left: TOTAL_SPOTS, total: TOTAL_SPOTS });
  }
}

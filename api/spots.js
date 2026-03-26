import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * /api/spots — Returns current early-bird spot availability
 *
 * GET /api/spots
 * Returns: { spots_left: number, total: number }
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filePath = join(process.cwd(), 'data', 'earlybird.json');
    const raw = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      spots_left: data.spots_left ?? 300,
      total: data.total ?? 300,
    });
  } catch (err) {
    console.error('[SPOTS] Failed to read earlybird.json:', err);
    return res.status(200).json({ spots_left: 300, total: 300 });
  }
}

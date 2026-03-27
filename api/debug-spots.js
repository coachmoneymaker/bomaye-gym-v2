/**
 * /api/debug-spots — Raw storage state inspector
 *
 * GET /api/debug-spots
 * Returns the raw KV state for the verified_count key so you can confirm
 * whether the counter is actually being written.
 *
 * REMOVE OR RESTRICT THIS ROUTE BEFORE GOING TO PRODUCTION.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  const kvUrlPresent   = Boolean(process.env.KV_REST_API_URL);
  const kvTokenPresent = Boolean(process.env.KV_REST_API_TOKEN);

  console.log('[DEBUG-SPOTS] KV_REST_API_URL present:', kvUrlPresent);
  console.log('[DEBUG-SPOTS] KV_REST_API_TOKEN present:', kvTokenPresent);

  // ── KV not configured ──────────────────────────────────────────────────────
  if (!kvUrlPresent || !kvTokenPresent) {
    console.warn('[DEBUG-SPOTS] KV env vars missing — counter will always be 0');
    return res.status(200).json({
      kv_available: false,
      kv_url_present:   kvUrlPresent,
      kv_token_present: kvTokenPresent,
      verified_count:   null,
      diagnosis: 'KV env vars are not set. /api/verify cannot increment the counter and /api/spots falls back to earlybird.json (taken: 0). Set KV_REST_API_URL and KV_REST_API_TOKEN in your Vercel project environment variables.',
    });
  }

  // ── KV configured — try to read ────────────────────────────────────────────
  let kv;
  try {
    const mod = await import('@vercel/kv');
    kv = mod.kv;
  } catch (err) {
    console.error('[DEBUG-SPOTS] Failed to import @vercel/kv:', err.message);
    return res.status(200).json({
      kv_available: false,
      kv_url_present:   kvUrlPresent,
      kv_token_present: kvTokenPresent,
      verified_count:   null,
      import_error:     err.message,
      diagnosis: '@vercel/kv import failed. Check that the package is installed (npm install @vercel/kv).',
    });
  }

  let rawValue;
  let readError = null;
  try {
    rawValue = await kv.get('verified_count');
    console.log('[DEBUG-SPOTS] raw KV value for verified_count:', rawValue);
  } catch (err) {
    readError = err.message;
    console.error('[DEBUG-SPOTS] KV read error:', err.message);
  }

  if (readError) {
    return res.status(200).json({
      kv_available: true,
      kv_url_present:   kvUrlPresent,
      kv_token_present: kvTokenPresent,
      verified_count:   null,
      read_error:       readError,
      diagnosis: 'KV env vars are present but the read failed. Verify the credentials are valid and the KV store is accessible for this Vercel environment.',
    });
  }

  const numericCount = rawValue === null ? null : Number(rawValue);

  return res.status(200).json({
    kv_available:   true,
    kv_url_present: kvUrlPresent,
    kv_token_present: kvTokenPresent,
    verified_count: numericCount,
    raw_value:      rawValue,
    diagnosis: rawValue === null
      ? 'KV is reachable but verified_count key does not exist yet. No successful verification has completed, OR verify.js is hitting a different KV store / environment.'
      : `KV is working correctly. verified_count = ${numericCount}`,
  });
}

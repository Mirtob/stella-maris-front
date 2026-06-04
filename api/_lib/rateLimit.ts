import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * In-memory sliding-window rate limiter for Vercel serverless functions.
 *
 * Trade-off: stateless serverless platforms create fresh containers on cold
 * start, but warm containers reuse the same Node process and Map instance
 * across requests. This filters out 90%+ of casual abuse (scripts hammering
 * one endpoint from one IP) without external infra like Redis/Upstash.
 *
 * It does NOT defend against:
 *   - Distributed attacks from many IPs (use Cloudflare/Vercel WAF)
 *   - Sustained attacks across cold starts (state resets)
 *
 * For the demo this is enough. Post-demo: migrate to Upstash Ratelimit.
 */

interface Hit {
  count: number;
  resetAt: number;  // epoch ms
}

// Keyed by `${endpoint}:${ip}` so each endpoint has its own bucket.
const hits = new Map<string, Hit>();
const MAX_BUCKET_SIZE = 10_000;  // safety cap so the map can't grow unbounded

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') {
    // x-forwarded-for is a comma-separated chain — first one is the original client
    return fwd.split(',')[0].trim();
  }
  if (Array.isArray(fwd)) {
    return fwd[0];
  }
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string') return real;
  return req.socket?.remoteAddress ?? 'unknown';
}

/**
 * Returns true if the caller is under the limit (request may proceed),
 * false if they exceeded it (handler should NOT execute).
 *
 * On rejection, sets a 429 status and the standard RateLimit-* headers.
 */
export function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  endpoint: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const ip = getClientIp(req);
  const key = `${endpoint}:${ip}`;
  const now = Date.now();

  // Periodic eviction when the map gets too big
  if (hits.size > MAX_BUCKET_SIZE) {
    for (const [k, h] of hits) {
      if (h.resetAt < now) hits.delete(k);
    }
  }

  let hit = hits.get(key);
  if (!hit || hit.resetAt < now) {
    hit = { count: 0, resetAt: now + windowMs };
    hits.set(key, hit);
  }
  hit.count += 1;

  const remaining = Math.max(0, maxRequests - hit.count);
  const resetSec = Math.ceil(hit.resetAt / 1000);

  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(resetSec));

  if (hit.count > maxRequests) {
    const retryAfter = Math.ceil((hit.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'Demasiadas peticiones. Esperá un momento antes de intentar de nuevo.',
    });
    return false;
  }

  return true;
}

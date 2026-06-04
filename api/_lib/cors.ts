import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * CORS allow-list for our Vercel serverless endpoints.
 *
 * Replaces the previous `Access-Control-Allow-Origin: *` which let any
 * third-party site call our endpoints from a logged-in user's browser
 * (CSRF / enumeration risk).
 *
 * Allowed origins:
 *   - Production deployment (read from VERCEL_URL / explicit env vars)
 *   - Vercel preview deployments (any *.vercel.app subdomain)
 *   - Local dev (localhost ports)
 *
 * To add more allowed origins for staging or custom domains, set the
 * ALLOWED_ORIGINS env var as a comma-separated list.
 */

const STATIC_ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
]);

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;

  // Allow if explicitly listed
  if (STATIC_ALLOWED_ORIGINS.has(origin)) return true;

  // Allow if matches the configured production origin
  const prodOrigin = process.env.PUBLIC_ORIGIN;
  if (prodOrigin && origin === prodOrigin) return true;

  // Allow any *.vercel.app (covers production + preview deployments)
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    return false;
  }

  // Custom comma-separated list via env var
  const extra = process.env.ALLOWED_ORIGINS;
  if (extra) {
    const list = extra.split(',').map(s => s.trim()).filter(Boolean);
    if (list.includes(origin)) return true;
  }

  return false;
}

/**
 * Apply CORS headers and short-circuit OPTIONS preflight requests.
 *
 * @returns true if the request should continue, false if it was handled
 *          (preflight) and the handler should return immediately.
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Mandatory for any response whose body depends on the Origin header:
  // ensures CDNs cache per-origin instead of serving one user's CORS-allowed
  // response to a different (disallowed) origin.
  res.setHeader('Vary', 'Origin');

  // Preflight — respond immediately, don't run the handler
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }

  return true;
}

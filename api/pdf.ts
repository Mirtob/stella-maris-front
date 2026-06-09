import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proxy que descarga el PDF de Drive y lo sirve desde nuestro dominio.
// CORS y rate-limit van inline para evitar problemas con bundling de api/_lib
// en Vercel (los archivos compartidos no se empaquetaban en todas las
// funciones y daban FUNCTION_INVOCATION_FAILED).

// --- CORS allow-list ---
const STATIC_ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
]);

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED_ORIGINS.has(origin)) return true;
  const prodOrigin = process.env.PUBLIC_ORIGIN;
  if (prodOrigin && origin === prodOrigin) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) return true;
  } catch { return false; }
  const extra = process.env.ALLOWED_ORIGINS;
  if (extra) {
    const list = extra.split(',').map(s => s.trim()).filter(Boolean);
    if (list.includes(origin)) return true;
  }
  return false;
}

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return false; }
  return true;
}

// --- Rate limit in-memory ---
interface Hit { count: number; resetAt: number; }
const hits = new Map<string, Hit>();

function rateLimit(req: VercelRequest, res: VercelResponse, endpoint: string, maxRequests: number, windowMs: number): boolean {
  const fwd = req.headers['x-forwarded-for'];
  const ip = typeof fwd === 'string' ? fwd.split(',')[0].trim()
    : Array.isArray(fwd) ? fwd[0]
    : (typeof req.headers['x-real-ip'] === 'string' ? req.headers['x-real-ip'] as string : 'unknown');
  const key = `${endpoint}:${ip}`;
  const now = Date.now();
  let hit = hits.get(key);
  if (!hit || hit.resetAt < now) {
    hit = { count: 0, resetAt: now + windowMs };
    hits.set(key, hit);
  }
  hit.count += 1;
  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - hit.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(hit.resetAt / 1000)));
  if (hit.count > maxRequests) {
    const retryAfter = Math.ceil((hit.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Demasiadas peticiones. Esperá un momento antes de intentar de nuevo.' });
    return false;
  }
  return true;
}

// --- Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  if (!rateLimit(req, res, 'pdf', 30, 60_000)) return;

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]{10,64}$/.test(id)) {
    return res.status(400).json({ error: 'Parametro id invalido' });
  }

  try {
    const driveUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
    const driveRes = await fetch(driveUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StellaMaris/1.0)' },
    });
    if (!driveRes.ok) {
      return res.status(driveRes.status).json({ error: 'No se pudo obtener el archivo' });
    }
    const buffer = await driveRes.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('pdf proxy error:', err?.message);
    res.status(500).json({ error: 'Error descargando el PDF' });
  }
}

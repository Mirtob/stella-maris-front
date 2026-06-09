import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS y rate limit inline (ver pdf.ts para contexto del bundling).

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
    res.status(429).json({ error: 'Demasiadas peticiones.' });
    return false;
  }
  return true;
}

const FOLDER_ID = process.env.VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER || '1AIUOrDiruV6_H8kPnBUEMONSdS91Ubhv';
const API_KEY = process.env.VITE_GOOGLE_DRIVE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  if (!rateLimit(req, res, 'sheets', 20, 60_000)) return;

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key no configurada' });
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${API_KEY}&fields=files(id,name,mimeType)&pageSize=200`;
    const r = await fetch(url);
    const data = await r.json();
    if (data.error) {
      console.error('Drive list error:', data.error.message);
      return res.status(data.error.code || 500).json({ error: 'No se pudo listar partituras' });
    }
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).json({ files: data.files || [] });
  } catch (err: any) {
    console.error('sheets list error:', err?.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}

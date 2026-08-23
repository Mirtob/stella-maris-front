import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proxy de lectura a la YouTube Data API. La clave vive SOLO en el servidor
// (GOOGLE_API_KEY), así no se expone en el bundle del cliente. Con rate-limit
// para que el proxy no sea un nuevo vector de abuso de cuota.
//
// Uso: GET /api/youtube?endpoint=videos&part=...&id=...
// Endpoints permitidos: videos | search | playlistItems | channels.
// Para `search` el channelId se fuerza desde el servidor (no se permite buscar
// fuera del canal oficial).

const ALLOWED = new Set(['videos', 'search', 'playlistItems', 'channels']);

// ── Rate limit (distribuido vía Supabase + fallback en memoria) ──
interface Hit { count: number; resetAt: number; }
const hits = new Map<string, Hit>();

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  return typeof fwd === 'string' ? fwd.split(',')[0].trim()
    : Array.isArray(fwd) ? fwd[0]
    : (typeof req.headers['x-real-ip'] === 'string' ? req.headers['x-real-ip'] as string : 'unknown');
}

async function distributedCheck(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number } | null> {
  const url = (process.env.VITE_SUPABASE_URL || '').trim();
  const anon = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) return null;
  const ctrl = new AbortController();
  // 2 s, no 800 ms: bajo ráfaga las instancias nuevas pagan TLS frío y el RPC tardaba
  // ~1,2 s, así que se abortaba y el limiter caía al de memoria (por instancia) —
  // medido contra producción: de 100 peticiones en paralelo solo se contaban ~26.
  const timer = setTimeout(() => ctrl.abort(), 2000);
  try {
    const r = await fetch(`${url}/rest/v1/rpc/api_rate_limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify({ p_key: key, p_limit: limit, p_window_seconds: windowSeconds }),
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    const data = await r.json();
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== 'boolean') return null;
    return { allowed: row.allowed, remaining: Number(row.remaining) || 0 };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function rateLimit(req: VercelRequest, res: VercelResponse, maxRequests: number, windowMs: number): Promise<boolean> {
  const key = `youtube:${clientIp(req)}`;
  const windowSeconds = Math.ceil(windowMs / 1000);
  const dist = await distributedCheck(key, maxRequests, windowSeconds);
  if (dist) {
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, dist.remaining)));
    if (!dist.allowed) { res.setHeader('Retry-After', String(windowSeconds)); res.status(429).json({ error: 'Demasiadas peticiones.' }); return false; }
    return true;
  }
  const now = Date.now();
  let hit = hits.get(key);
  if (!hit || hit.resetAt < now) { hit = { count: 0, resetAt: now + windowMs }; hits.set(key, hit); }
  hit.count += 1;
  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - hit.count)));
  if (hit.count > maxRequests) { res.setHeader('Retry-After', String(Math.ceil((hit.resetAt - now) / 1000))); res.status(429).json({ error: 'Demasiadas peticiones.' }); return false; }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  if (!(await rateLimit(req, res, 60, 60_000))) return;

  const API_KEY = (process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_DRIVE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '').trim();
  if (!API_KEY) return res.status(500).json({ error: 'API key no configurada' });

  const q = req.query as Record<string, string | string[]>;
  const endpoint = String(q.endpoint || '');
  if (!ALLOWED.has(endpoint)) return res.status(400).json({ error: 'Endpoint no permitido' });

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (k === 'endpoint' || k === 'key') continue;
    params.set(k, Array.isArray(v) ? v[0] : v);
  }
  // En búsquedas, forzar el canal oficial (no permitir buscar fuera de él).
  if (endpoint === 'search') {
    const officialChannel = (process.env.VITE_YOUTUBE_CHANNEL_ID || '').trim();
    if (officialChannel) params.set('channelId', officialChannel);
  }
  params.set('key', API_KEY);

  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${params.toString()}`);
    const data = await r.json();
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
    return res.status(r.status).json(data);
  } catch (e: any) {
    return res.status(502).json({ error: 'No se pudo consultar YouTube', detail: e?.message });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Audios de ensayo: el catálogo de pistas de una obra y los bytes de cada pista.
 *
 * MuseScore deja en la misma carpeta de Drive que las partituras un MP3 por voz
 * (`Obra-Soprano.mp3`, `Obra-Alto.mp3`…) además de la mezcla completa (`Obra.mp3`).
 * Cada archivo trae ESA voz sola, todas duran lo mismo y empiezan a la vez: sumadas
 * dan la obra completa. Eso es lo que hace posible el mezclador del Modo Atril.
 *
 * Dos operaciones en un solo archivo, a propósito: en este setup de Vercel las
 * funciones tienen que ser autocontenidas (importar un módulo hermano las revienta al
 * cargar), así que separarlas obligaría a duplicar CORS y rate limit una vez más.
 *
 *   GET /api/audio?folder=<id>  → JSON con los MP3 de esa carpeta (id, nombre, tamaño)
 *   GET /api/audio?id=<fileId>  → los bytes, como audio/mpeg
 *
 * El proxy existe porque la CSP solo permite reproducir audio de nuestro propio
 * dominio (`media-src 'self'`), y además deja la caché del CDN delante de Drive: en un
 * ensayo, doce coristas piden las mismas cuatro pistas.
 */

const API_KEY = (process.env.VITE_GOOGLE_DRIVE_API_KEY || '').trim();

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

// --- Rate limit (distribuido vía Supabase + fallback en memoria) ---
interface Hit { count: number; resetAt: number; }
const hits = new Map<string, Hit>();

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  return typeof fwd === 'string' ? fwd.split(',')[0].trim()
    : Array.isArray(fwd) ? fwd[0]
    : (typeof req.headers['x-real-ip'] === 'string' ? req.headers['x-real-ip'] as string : 'unknown');
}

// Limiter distribuido (compartido entre instancias serverless) vía RPC
// SECURITY DEFINER en Supabase. Fail-open: ante cualquier error/timeout/env
// ausente devuelve null y el llamador cae al limiter en memoria por instancia.
// No agrega dependencias (fetch directo a PostgREST con la anon key).
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

async function rateLimit(req: VercelRequest, res: VercelResponse, endpoint: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const key = `${endpoint}:${clientIp(req)}`;
  const windowSeconds = Math.ceil(windowMs / 1000);

  // 1) Distribuido: fuente de verdad si Supabase responde.
  const dist = await distributedCheck(key, maxRequests, windowSeconds);
  if (dist) {
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, dist.remaining)));
    if (!dist.allowed) {
      res.setHeader('Retry-After', String(windowSeconds));
      res.status(429).json({ error: 'Demasiadas peticiones. Espera un momento antes de intentar de nuevo.' });
      return false;
    }
    return true;
  }

  // 2) Fallback en memoria (por instancia) si el distribuido no está disponible.
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
    res.setHeader('Retry-After', String(Math.ceil((hit.resetAt - now) / 1000)));
    res.status(429).json({ error: 'Demasiadas peticiones. Espera un momento antes de intentar de nuevo.' });
    return false;
  }
  return true;
}

// --- Handler ---

/** ¿Es un id de Drive con pinta de tal? Evita usar el proxy como puente a cualquier URL. */
const idValido = (x: unknown): x is string =>
  typeof x === 'string' && /^[a-zA-Z0-9_-]{10,64}$/.test(x);

/** Lista los MP3 de UNA carpeta. Una sola llamada a Drive (~200 ms), no el árbol entero. */
async function listarPistas(folderId: string) {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    key: API_KEY,
    fields: 'files(id,name,mimeType,size)',
    pageSize: '200',
  });
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || 'Drive list error');
  return (data.files || [])
    .filter((f: any) => /\.mp3$/i.test(f.name || ''))
    .map((f: any) => ({ id: f.id, name: f.name, size: Number(f.size) || 0 }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  // Tope alto: abrir un mezclador son 4-5 peticiones seguidas, y el <audio> pide por
  // rangos mientras se reproduce.
  if (!(await rateLimit(req, res, 'audio', 150, 60_000))) return;
  if (!API_KEY) return res.status(500).json({ error: 'API key no configurada' });

  const { folder, id } = req.query;

  // ── Catálogo de pistas de una obra ──────────────────────────────────────
  if (folder !== undefined) {
    if (!idValido(folder)) return res.status(400).json({ error: 'Parametro folder invalido' });
    try {
      const pistas = await listarPistas(folder);
      // Una carpeta de Drive cambia poco; media hora de caché evita repetir la consulta
      // cada vez que alguien abre el mezclador del mismo canto en un ensayo.
      res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800, stale-while-revalidate=86400');
      return res.status(200).json({ tracks: pistas });
    } catch (err: any) {
      console.error('audio list error:', err?.message);
      return res.status(500).json({ error: 'No se pudieron listar los audios' });
    }
  }

  // ── Bytes de una pista ──────────────────────────────────────────────────
  if (!idValido(id)) return res.status(400).json({ error: 'Parametro id invalido' });

  try {
    const driveUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
    // El <audio> pide por rangos para poder arrastrar la barra sin bajar el archivo
    // entero: hay que reenviarlo tal cual y devolver 206 cuando corresponde.
    const rangeHeader = req.headers['range'];
    const range = Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader;
    const driveRes = await fetch(driveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StellaMaris/1.0)',
        ...(range ? { Range: range } : {}),
      },
    });
    if (!driveRes.ok && driveRes.status !== 206) {
      return res.status(driveRes.status).json({ error: 'No se pudo obtener el audio' });
    }
    const buffer = Buffer.from(await driveRes.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Accept-Ranges', 'bytes');
    const contentRange = driveRes.headers.get('content-range');
    res.setHeader('Content-Length', String(buffer.length));
    // Un MP3 de Drive (id fijo) es inmutable: se cachea fuerte en el CDN, que es lo que
    // hace barato que un coro entero abra el mismo mezclador a la vez.
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    // 206 si se pidió un rango Y Drive lo respetó. Devolver 200 con Content-Range es
    // contradictorio y deja al navegador sin saber si puede buscar dentro del archivo.
    if (range && contentRange) {
      res.setHeader('Content-Range', contentRange);
      return res.status(206).send(buffer);
    }
    return res.status(200).send(buffer);
  } catch (err: any) {
    console.error('audio proxy error:', err?.message);
    return res.status(500).json({ error: 'Error descargando el audio' });
  }
}

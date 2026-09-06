import type { VercelRequest, VercelResponse } from '@vercel/node';

// TODO lo que la app pide a Google Drive, en un solo sitio. La API key vive aquí y
// nunca llega al navegador.
//
//   GET /api/drive?id=<fileId>              → la partitura, como application/pdf
//   GET /api/drive?id=<fileId>&kind=audio   → la pista, como audio/mpeg
//   GET /api/drive?folder=<folderId>        → JSON con los MP3 de esa carpeta
//   GET /api/drive?list=1                   → JSON con el árbol de partituras
//
// LAS RUTAS VIEJAS SIGUEN VIVAS. `vercel.json` reescribe `/api/pdf` y `/api/sheets`
// hacia aquí, y el cliente las sigue usando a propósito: la caché sin conexión guarda
// URLs `/api/pdf?id=...` y renombrarlas la invalidaría para todo el mundo.
//
// CORS y rate-limit van inline para evitar problemas con bundling de api/_lib
// en Vercel (los archivos compartidos no se empaquetaban en todas las
// funciones y daban FUNCTION_INVOCATION_FAILED).
//
// Los audios viven AQUÍ y no en su propio /api/audio por una razón de plataforma, no
// de diseño: el plan Hobby de Vercel admite 12 funciones serverless y ya estábamos en
// 12. Un archivo más y el despliegue entero falla — que es exactamente lo que pasó al
// intentarlo. Si algún día se sube de plan, esto se puede separar sin tocar el cliente
// más que en las dos URL.
//
// El proxy existe porque la CSP solo permite reproducir audio y abrir PDF de nuestro
// propio dominio, y de paso pone la caché del CDN delante de Drive: el día de Misa
// mucha gente pide la misma partitura, y en un ensayo el coro entero pide las mismas
// cuatro pistas.

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
// ── Listado del árbol de partituras (antes /api/sheets) ───────────────────────
//
// Recorre la carpeta raíz entera y devuelve archivos y subcarpetas. Es caro (muchas
// llamadas a Drive), por eso se cachea una hora; `?fresh=1` lo salta.

const FOLDER_ID = process.env.VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER || '1AIUOrDiruV6_H8kPnBUEMONSdS91Ubhv';
// Preferir GOOGLE_API_KEY (server-only, sin VITE_ → no entra al bundle).
// Fallback a las VITE_ por compatibilidad mientras se migra la env var.
const API_KEY = (process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_DRIVE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '').trim();

const FOLDER_MIME = 'application/vnd.google-apps.folder';
// Cotas de seguridad para que un Drive enorme (o un ciclo de atajos) no
// dispare cientos de llamadas ni agote la quota de la API. Si se alcanzan, la
// respuesta lo dice (`truncated`) en vez de mentir con un árbol a medias: era
// justo el modo de falla de "subí la partitura y la app no la encuentra".
const MAX_FOLDERS = 400;
const MAX_FILES = 5000;

/**
 * Carpetas que NO se recorren. `.mscbackup` son los respaldos que MuseScore deja al
 * lado de cada partitura: no traen ningún PDF, ensucian el selector y se comían un
 * cuarto del cupo de carpetas (34 de 131 en el Drive real).
 */
const isSkippableFolder = (name: string) => name.startsWith('.');

interface SheetFile { id: string; name: string; mimeType: string; path?: string; parentId?: string }
interface SheetFolder { id: string; name: string; path: string }

/** Lista TODOS los hijos directos de una carpeta, paginando hasta agotar. */
async function listFolderChildren(folderId: string, apiKey: string): Promise<any[]> {
  const out: any[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      key: apiKey,
      fields: 'nextPageToken,files(id,name,mimeType)',
      pageSize: '1000',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
    const data = await r.json();
    if (data.error) throw new Error(data.error.message || 'Drive list error');
    out.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

/**
 * Cuántas carpetas se piden a Drive a la vez.
 *
 * De a una, el Drive real tardaba ~8,3 s en producción: pegado al tope de 10 s de la
 * función serverless, o sea un 504 esperando a que el catálogo creciera un poco más.
 * Medido sobre el Drive real (97 carpetas útiles, 612 archivos): 28,7 s en serie,
 * 4,3 s con 8 y 3,5 s con 16. Se queda en 8 porque el salto grande ya está ahí y
 * varios administradores actualizando a la vez no deben agotar la cuota de Drive.
 */
const CONCURRENCY = 8;

/**
 * Recorre recursivamente (BFS) el árbol de carpetas desde `rootId` y devuelve
 * todos los archivos NO-carpeta encontrados, con su ruta relativa en `path`.
 * Protegido contra ciclos (set `seen`) y con cotas MAX_FOLDERS / MAX_FILES.
 *
 * Se exporta para poder medirlo y probarlo fuera de la función serverless.
 */
export async function walkDrive(rootId: string, apiKey: string): Promise<{ files: SheetFile[]; folders: SheetFolder[]; truncated: boolean }> {
  const files: SheetFile[] = [];
  // Las carpetas se devuelven aparte: la ficha del canto enlaza UNA carpeta (la del
  // canto polifónico) y de ahí deduce sus voces. Sin esto habría que adivinar la
  // carpeta por la ruta de los archivos, que se rompe al renombrarla.
  const folders: SheetFolder[] = [];
  const queue: { id: string; path: string }[] = [{ id: rootId, path: '' }];
  const seen = new Set<string>();
  let foldersVisited = 0;

  while (queue.length > 0 && foldersVisited < MAX_FOLDERS && files.length < MAX_FILES) {
    // Se toma un nivel de a tandas: las carpetas hermanas se piden en paralelo.
    const batch: { id: string; path: string }[] = [];
    while (queue.length > 0 && batch.length < CONCURRENCY && foldersVisited + batch.length < MAX_FOLDERS) {
      const next = queue.shift()!;
      if (seen.has(next.id)) continue;
      seen.add(next.id);
      batch.push(next);
    }
    if (batch.length === 0) break;
    foldersVisited += batch.length;

    const listings = await Promise.all(
      batch.map(async (folder) => ({ folder, children: await listFolderChildren(folder.id, apiKey) })),
    );

    for (const { folder: { id, path }, children } of listings) {
      for (const child of children) {
        if (child.mimeType === FOLDER_MIME) {
          if (isSkippableFolder(child.name)) continue;
          const childPath = path ? `${path}/${child.name}` : child.name;
          if (!seen.has(child.id)) {
            queue.push({ id: child.id, path: childPath });
            folders.push({ id: child.id, name: child.name, path: childPath });
          }
        } else {
          files.push({
            id: child.id, name: child.name, mimeType: child.mimeType,
            path: path || undefined, parentId: id,
          });
          if (files.length >= MAX_FILES) break;
        }
      }
    }
  }
  // Quedó algo sin recorrer: el árbol que se devuelve está incompleto y quien lo
  // consuma tiene que poder avisarlo.
  const truncated = queue.length > 0 || files.length >= MAX_FILES;
  return { files, folders, truncated };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  // Límite alto: pdf.js hace VARIAS peticiones por rango para una misma partitura
  // (más aún en libros grandes como el de salmos), así que 30/min se quedaba corto.
  if (!(await rateLimit(req, res, 'pdf', 150, 60_000))) return;

  const { id, folder, kind } = req.query;

  // ── Árbol completo de partituras (lo que servía /api/sheets) ───────────────
  if (req.query.list !== undefined) {
    if (!API_KEY) return res.status(500).json({ error: 'API key no configurada' });
    try {
      const { files, folders, truncated } = await walkDrive(FOLDER_ID, API_KEY);
      // Una hora de caché (recorrer el Drive entero es caro), salvo `?fresh=1`: es lo
      // que usa "Actualizar desde Drive" cuando alguien acaba de subir una partitura.
      const fresh = req.query.fresh !== undefined;
      res.setHeader('Cache-Control', fresh ? 'no-store' : 'public, max-age=3600, s-maxage=3600');
      return res.status(200).json({ files, folders, truncated });
    } catch (err: any) {
      console.error('drive list error:', err?.message);
      return res.status(500).json({ error: 'No se pudo listar partituras' });
    }
  }
  const idValido = (x: unknown): x is string =>
    typeof x === 'string' && /^[a-zA-Z0-9_-]{10,64}$/.test(x);

  // ── Catálogo de pistas de una obra ───────────────────────────────────────
  // MuseScore deja un MP3 por voz en la misma carpeta que las partituras, con la misma
  // convención de nombres. Se lista SOLO esa carpeta (una llamada a Drive, ~200 ms),
  // no el árbol entero como /api/sheets.
  if (folder !== undefined) {
    if (!idValido(folder)) return res.status(400).json({ error: 'Parametro folder invalido' });
    const apiKey = (process.env.VITE_GOOGLE_DRIVE_API_KEY || '').trim();
    if (!apiKey) return res.status(500).json({ error: 'API key no configurada' });
    try {
      const params = new URLSearchParams({
        q: `'${folder}' in parents and trashed=false`,
        key: apiKey,
        fields: 'files(id,name,mimeType,size)',
        pageSize: '200',
      });
      const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message || 'Drive list error');
      const tracks = (data.files || [])
        .filter((f: any) => /\.mp3$/i.test(f.name || ''))
        .map((f: any) => ({ id: f.id, name: f.name, size: Number(f.size) || 0 }));
      // Media hora de caché: una carpeta de Drive cambia poco y en un ensayo se abre el
      // mismo mezclador varias veces.
      res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800, stale-while-revalidate=86400');
      return res.status(200).json({ tracks });
    } catch (err: any) {
      console.error('audio list error:', err?.message);
      return res.status(500).json({ error: 'No se pudieron listar los audios' });
    }
  }

  if (!idValido(id)) {
    return res.status(400).json({ error: 'Parametro id invalido' });
  }
  const esAudio = kind === 'audio';

  try {
    const driveUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
    // Reenviar el header Range (pdf.js lo usa para pedir solo las páginas que necesita;
    // clave en libros grandes como el de salmos: renderiza 1 página sin bajar los 18 MB).
    const rangeHeader = req.headers['range'];
    const range = Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader;
    const driveRes = await fetch(driveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StellaMaris/1.0)',
        ...(range ? { Range: range } : {}),
      },
    });
    // 206 = respuesta parcial (rango) válida; no es un error.
    if (!driveRes.ok && driveRes.status !== 206) {
      return res.status(driveRes.status).json({ error: 'No se pudo obtener el archivo' });
    }
    const buffer = Buffer.from(await driveRes.arrayBuffer());
    res.setHeader('Content-Type', esAudio ? 'audio/mpeg' : 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Accept-Ranges', 'bytes');
    const contentRange = driveRes.headers.get('content-range');
    const contentLength = driveRes.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    // Una partitura (id de Drive fijo) es prácticamente inmutable, así que la cacheamos
    // agresivamente en el EDGE de Vercel (s-maxage) además del navegador (max-age):
    //  - max-age=3600            → el navegador la reusa 1 h sin pedir nada.
    //  - s-maxage=86400          → el CDN de Vercel la sirve 24 h sin tocar la función
    //                              ni Google Drive (clave el día de Misa: muchos escanean
    //                              el mismo QR y ven la misma partitura a la vez).
    //  - stale-while-revalidate  → la sigue sirviendo al instante mientras revalida.
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    // 206 si se pidió un rango Y Drive lo respetó: devolver 200 con Content-Range es
    // contradictorio y deja al navegador sin saber si puede buscar dentro del archivo
    // (que es justo lo que necesita el <audio> para arrastrar la barra).
    if (range && contentRange) {
      res.setHeader('Content-Range', contentRange);
      res.status(206).send(buffer);
    } else {
      res.status(200).send(buffer);
    }
  } catch (err: any) {
    console.error('drive proxy error:', err?.message);
    res.status(500).json({ error: esAudio ? 'Error descargando el audio' : 'Error descargando el PDF' });
  }
}

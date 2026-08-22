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
  const timer = setTimeout(() => ctrl.abort(), 800);
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
      res.status(429).json({ error: 'Demasiadas peticiones.' });
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
    res.status(429).json({ error: 'Demasiadas peticiones.' });
    return false;
  }
  return true;
}

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
 * Recorre recursivamente (BFS) el árbol de carpetas desde `rootId` y devuelve
 * todos los archivos NO-carpeta encontrados, con su ruta relativa en `path`.
 * Protegido contra ciclos (set `seen`) y con cotas MAX_FOLDERS / MAX_FILES.
 */
async function walkDrive(rootId: string, apiKey: string): Promise<{ files: SheetFile[]; folders: SheetFolder[]; truncated: boolean }> {
  const files: SheetFile[] = [];
  // Las carpetas se devuelven aparte: la ficha del canto enlaza UNA carpeta (la del
  // canto polifónico) y de ahí deduce sus voces. Sin esto habría que adivinar la
  // carpeta por la ruta de los archivos, que se rompe al renombrarla.
  const folders: SheetFolder[] = [];
  const queue: { id: string; path: string }[] = [{ id: rootId, path: '' }];
  const seen = new Set<string>();
  let foldersVisited = 0;

  while (queue.length > 0 && foldersVisited < MAX_FOLDERS && files.length < MAX_FILES) {
    const { id, path } = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    foldersVisited++;

    const children = await listFolderChildren(id, apiKey);
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
  // Quedó algo sin recorrer: el árbol que se devuelve está incompleto y quien lo
  // consuma tiene que poder avisarlo.
  const truncated = queue.length > 0 || files.length >= MAX_FILES;
  return { files, folders, truncated };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return;
  if (!(await rateLimit(req, res, 'sheets', 20, 60_000))) return;

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key no configurada' });
  }

  try {
    const { files, folders, truncated } = await walkDrive(FOLDER_ID, API_KEY);
    // El listado se cachea una hora (recorrer el Drive entero es caro), pero con
    // `?fresh=1` se pide sin caché: es lo que usa el botón "Actualizar desde Drive"
    // cuando alguien acaba de subir una partitura y necesita verla YA.
    const fresh = req.query.fresh !== undefined;
    res.setHeader('Cache-Control', fresh ? 'no-store' : 'public, max-age=3600, s-maxage=3600');
    // `files` se mantiene tal cual por compatibilidad con el selector existente.
    return res.status(200).json({ files, folders, truncated });
  } catch (err: any) {
    console.error('sheets list error:', err?.message);
    return res.status(500).json({ error: 'No se pudo listar partituras' });
  }
}

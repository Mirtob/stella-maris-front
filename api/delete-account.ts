import type { VercelRequest, VercelResponse } from '@vercel/node';

// Borrado de cuenta SELF-SERVICE. Requisito de Google Play / App Store: el usuario
// debe poder eliminar su propia cuenta desde la app. Solo borra AL PROPIO usuario (se
// valida con SU token). Elimina el perfil (dato personal) y el usuario de Auth; NO
// toca los cantorales publicados (contenido de la comunidad/parroquia; `published_by`
// no tiene FK a auth.users, así que no hay cascada).

async function getUidFromToken(url: string, anon: string, token: string): Promise<string | null> {
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return typeof u?.id === 'string' ? u.id : null;
  } catch {
    return null;
  }
}

// ── Rate limit (inline; ver pdf.ts para el contexto del bundling) ────────────
interface Hit { count: number; resetAt: number; }
const hits = new Map<string, Hit>();

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  return typeof fwd === 'string' ? fwd.split(',')[0].trim()
    : Array.isArray(fwd) ? fwd[0]
    : (typeof req.headers['x-real-ip'] === 'string' ? req.headers['x-real-ip'] as string : 'unknown');
}

/**
 * Contador compartido entre instancias serverless (RPC SECURITY DEFINER en Supabase).
 * Devuelve `null` si no se pudo consultar; quien llama decide qué hacer con esa duda.
 * El timeout es de 2 s porque bajo ráfaga las instancias nuevas pagan TLS frío y el
 * RPC llega a tardar ~1,2 s.
 */
async function distributedCheck(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number } | null> {
  const url = (process.env.VITE_SUPABASE_URL || '').trim();
  const anon = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) return null;
  const ctrl = new AbortController();
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

/**
 * @param failClosed Si el contador compartido no responde, DENIEGA en vez de dejar
 *   pasar. Se usa donde cada petición manda un correo o gasta cuota: ante la duda,
 *   es mejor un 429 que una factura o un buzón lleno.
 */
async function rateLimit(
  req: VercelRequest, res: VercelResponse,
  endpoint: string, maxRequests: number, windowMs: number, failClosed = false,
): Promise<boolean> {
  const key = `${endpoint}:${clientIp(req)}`;
  const windowSeconds = Math.ceil(windowMs / 1000);

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

  if (failClosed) {
    res.setHeader('Retry-After', String(windowSeconds));
    res.status(429).json({ error: 'Servicio ocupado. Intenta de nuevo en un minuto.' });
    return false;
  }

  // Respaldo en memoria (por instancia) cuando el compartido no está disponible.
  const now = Date.now();
  let hit = hits.get(key);
  if (!hit || hit.resetAt < now) { hit = { count: 0, resetAt: now + windowMs }; hits.set(key, hit); }
  hit.count += 1;
  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - hit.count)));
  if (hit.count > maxRequests) {
    res.setHeader('Retry-After', String(Math.ceil((hit.resetAt - now) / 1000)));
    res.status(429).json({ error: 'Demasiadas peticiones.' });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Operación destructiva: poco volumen legítimo, ningún motivo para permitir ráfagas.
  if (!(await rateLimit(req, res, 'delete-account', 10, 15 * 60_000))) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // trim(): defensivo ante variables de entorno con espacios/saltos de línea.
  const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
  const ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!SUPABASE_URL || !ANON || !SERVICE) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  // El usuario se identifica con SU token → solo puede borrarse a sí mismo.
  const authHeader = (req.headers.authorization as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const uid = await getUidFromToken(SUPABASE_URL, ANON, token);
  if (!uid) return res.status(401).json({ error: 'Sesión inválida' });

  const svcHeaders = {
    apikey: SERVICE,
    Authorization: `Bearer ${SERVICE}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Borrar el perfil (dato personal).
    await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${uid}`, {
      method: 'DELETE',
      headers: { ...svcHeaders, Prefer: 'return=minimal' },
    });

    // 2. Borrar el usuario de Auth (GoTrue admin). Invalida su sesión.
    const del = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
      method: 'DELETE',
      headers: svcHeaders,
    });
    if (!del.ok && del.status !== 404) {
      console.error('delete-account: auth delete failed', del.status, await del.text());
      return res.status(500).json({ error: 'No se pudo eliminar la cuenta' });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('delete-account error:', err?.message);
    return res.status(500).json({ error: 'Error eliminando la cuenta' });
  }
}

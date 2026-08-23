import type { VercelRequest, VercelResponse } from '@vercel/node';

// Alta/baja de suscripciones push. Escribe en push_subscriptions con SERVICE ROLE
// (la tabla no se expone a clientes). Acepta llamadas autenticadas o anónimas (el
// Pueblo fiel puede navegar sin login), pero si viene token, guarda el user_id.

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return {}; } }

async function userIdFromToken(url: string, anon: string, token: string): Promise<string | null> {
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u?.id ?? null;
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
  // Es público a propósito (el Pueblo fiel se suscribe sin login), así que necesita
  // tope: si no, se llena la tabla de suscripciones basura.
  if (!(await rateLimit(req, res, 'push-subscribe', 20, 60_000))) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
  const ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!SUPABASE_URL || !ANON || !SERVICE) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  const svcHeaders = {
    apikey: SERVICE,
    Authorization: `Bearer ${SERVICE}`,
    'Content-Type': 'application/json',
  };

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const action = body.action;

  try {
    if (action === 'unsubscribe') {
      const endpoint = String(body.endpoint || '');
      if (!endpoint) return res.status(400).json({ error: 'Falta endpoint' });
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
        { method: 'DELETE', headers: svcHeaders },
      );
      if (!r.ok) return res.status(400).json({ error: 'No se pudo cancelar la suscripción' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'subscribe') {
      const sub = body.subscription || {};
      const endpoint = String(sub.endpoint || '');
      const p256dh = String(sub.p256dh || '');
      const auth = String(sub.auth || '');
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ error: 'Suscripción inválida' });
      }
      const parishes: string[] = Array.isArray(body.parishes) ? body.parishes.filter(Boolean) : [];
      const topics: string[] = Array.isArray(body.topics) && body.topics.length
        ? body.topics
        : ['celebrations', 'cantorals'];
      const role: string | null = typeof body.role === 'string' && body.role ? body.role : null;

      // user_id si viene token (opcional).
      const authHeader = (req.headers.authorization as string) || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const userId = token ? await userIdFromToken(SUPABASE_URL, ANON, token) : null;

      // Upsert por endpoint (unique). merge-duplicates actualiza parishes/topics/etc.
      const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
        method: 'POST',
        headers: { ...svcHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          endpoint, p256dh, auth,
          user_id: userId,
          parishes, topics, role,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        return res.status(400).json({ error: 'No se pudo guardar la suscripción', detail: t.slice(0, 200) });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

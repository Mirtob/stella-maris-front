import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Todo lo que un DISPOSITIVO hace con sus avisos push: darse de alta, darse de baja y
 * mandarse una prueba a sí mismo.
 *
 * Eran dos funciones (`push-subscribe` y `push-test`) que compartían más de la mitad
 * del código: el mismo control de tope, el mismo `userIdFromToken`, las mismas
 * cabeceras de servicio. Juntarlas quita esa repetición y, de paso, libera un hueco de
 * los DOCE que permite el plan Hobby de Vercel — pasado ese número no falla la función
 * nueva: falla el despliegue ENTERO. Ya ocurrió una vez, con el mezclador de voces.
 *
 * Las rutas viejas siguen funcionando: `vercel.json` reescribe `/api/push-subscribe` y
 * `/api/push-test` hacia aquí. Eso importa porque hay teléfonos con la app abierta y
 * el código anterior en memoria, que seguirán llamando a las de antes.
 *
 * AUTOCONTENIDO a propósito (sin imports hermanos): Vercel empaqueta cada archivo de
 * `api/` por separado y un import a `api/_lib` rompe el build.
 */

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
const ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const DEFAULT_VAPID_PUBLIC = 'BD6iyTq35EL0rH1goWKY4FEjvAjpUpxO-XSY9qFFaKHh9qBOeUeMSiKhFuUO8ZwZHOsUwM5T3F4NmvJSzv1ViSg';
const VAPID_PUBLIC = (process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC).trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').trim();
const VAPID_SUBJECT = (process.env.VAPID_SUBJECT || 'mailto:gustavus.tobar@gmail.com').trim();

const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return {}; } }

async function userIdFromToken(token: string): Promise<string | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    return (await r.json())?.id ?? null;
  } catch { return null; }
}

/** El token de quien llama, si viene. Cadena vacía si la petición es anónima. */
function tokenDe(req: VercelRequest): string {
  const cabecera = (req.headers.authorization as string) || '';
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
}

let _webpush: any = null;
async function webpushLib(): Promise<any> {
  if (_webpush) return _webpush;
  const mod: any = await import('web-push');
  _webpush = mod?.default ?? mod;
  return _webpush;
}

/** Una suscripción muerta (404/410) se borra: si no, se reintenta para siempre. */
async function olvidarSuscripcion(endpoint: string): Promise<void> {
  await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    { method: 'DELETE', headers: svcHeaders },
  ).catch(() => {});
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
/**
 * Qué acción se pide.
 *
 * Se mira primero la query (`?action=`), que es por donde llega cuando la petición
 * viene reescrita desde una ruta antigua, y después el cuerpo, que es como lo mandaba
 * `push-subscribe` desde el principio.
 */
export function accionPedida(query: unknown, body: unknown): string {
  const q = (query as any)?.action;
  const b = (body as any)?.action;
  return String((Array.isArray(q) ? q[0] : q) || b || '').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});

  if (accionPedida(req.query, body) === 'test') {
    // Manda notificaciones: con tope para que no se use como timbre ajeno.
    if (!(await rateLimit(req, res, 'push-test', 10, 60_000))) return;
    return enviarPrueba(req, res, body);
  }

  // Alta y baja. Es público a propósito (el Pueblo fiel se suscribe sin login), así
  // que necesita tope: si no, se llena la tabla de suscripciones basura.
  if (!(await rateLimit(req, res, 'push-subscribe', 20, 60_000))) return;
  return altaOBaja(req, res, body);
}

/** Alta y baja de la suscripción de ESTE dispositivo. */
async function altaOBaja(req: VercelRequest, res: VercelResponse, body: any) {
  if (!SUPABASE_URL || !ANON || !SERVICE) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  try {
    if (body.action === 'unsubscribe') {
      const endpoint = String(body.endpoint || '');
      if (!endpoint) return res.status(400).json({ error: 'Falta endpoint' });
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
        { method: 'DELETE', headers: svcHeaders },
      );
      if (!r.ok) return res.status(400).json({ error: 'No se pudo cancelar la suscripción' });
      return res.status(200).json({ ok: true });
    }

    if (body.action === 'subscribe') {
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

      // user_id si viene token (opcional): sin sesión igual se pueden recibir avisos.
      const token = tokenDe(req);
      const userId = token ? await userIdFromToken(token) : null;

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

/**
 * Aviso de prueba a los dispositivos de quien lo pide.
 *
 * Acepta un texto propio: es lo que permite VER cómo queda un aviso en el teléfono de
 * uno antes de mandárselo a toda la comunidad. Un push no se puede retirar.
 */
async function enviarPrueba(req: VercelRequest, res: VercelResponse, body: any) {
  if (!SUPABASE_URL || !SERVICE) return res.status(500).json({ error: 'Config incompleta' });
  if (!VAPID_PRIVATE) return res.status(200).json({ ok: true, sent: 0, skipped: 'push no configurado (VAPID)' });

  // A quién: al dispositivo que manda su propio endpoint, o a todos los de la sesión.
  const endpoint = String(body.endpoint || '');
  const token = tokenDe(req);
  let filtro = '';
  if (endpoint) {
    filtro = `endpoint=eq.${encodeURIComponent(endpoint)}`;
  } else if (token) {
    const uid = await userIdFromToken(token);
    if (!uid) return res.status(401).json({ error: 'No autenticado' });
    filtro = `user_id=eq.${uid}`;
  } else {
    return res.status(400).json({ error: 'Falta endpoint o sesión' });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth&${filtro}`, { headers: svcHeaders });
    const subs: { endpoint: string; p256dh: string; auth: string }[] = r.ok ? await r.json() : [];
    if (subs.length === 0) return res.status(200).json({ ok: true, sent: 0, note: 'sin suscripciones' });

    const webpush = await webpushLib();
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const titulo = String(body.title ?? '').trim();
    const texto = String(body.body ?? '').trim();
    const destino = String(body.url ?? '/').trim();
    const payload = JSON.stringify({
      title: titulo || '¡Notificaciones activas! ✅',
      body: texto || 'Esta es una prueba. Así recibirás los avisos de Stella Maris.',
      url: destino.startsWith('/') ? destino : '/',
      // Tag fijo: una prueba reemplaza a la anterior en la bandeja, que es lo que se
      // quiere al ir ajustando el texto.
      tag: 'push-test',
    });

    let sent = 0, failed = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (e: any) {
        failed++;
        if (e?.statusCode === 404 || e?.statusCode === 410) await olvidarSuscripcion(s.endpoint);
      }
    }));
    return res.status(200).json({ ok: true, sent, failed });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

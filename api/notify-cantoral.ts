import type { VercelRequest, VercelResponse } from '@vercel/node';

// Envía "Nuevo cantoral publicado" a los suscriptores de la parroquia. Acepta VARIOS
// cantorales (cantoralIds) de una misma sesión de publicación y manda UN SOLO aviso por
// parroquia (evita saturar cuando se publican varios días de una vez, p. ej. Semana
// Santa). Tag ESTABLE por parroquia → el aviso nuevo reemplaza al anterior en la
// bandeja (no se apilan). Se llama en segundo plano tras publicar; requiere sesión.
// AUTOCONTENIDO a propósito: no importa helpers de api/_push (Vercel puede no incluir
// archivos con prefijo "_" en el bundle → FUNCTION_INVOCATION_FAILED). web-push se
// carga con dynamic import (lazy).

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
const ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const DEFAULT_VAPID_PUBLIC = 'BD6iyTq35EL0rH1goWKY4FEjvAjpUpxO-XSY9qFFaKHh9qBOeUeMSiKhFuUO8ZwZHOsUwM5T3F4NmvJSzv1ViSg';
const VAPID_PUBLIC = (process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC).trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').trim();
const VAPID_SUBJECT = (process.env.VAPID_SUBJECT || 'mailto:gustavus.tobar@gmail.com').trim();

const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return {}; } }

/**
 * Deja constancia del envío en `cron_runs` (job = 'notify-cantoral'). Sin esto, cuando
 * alguien dice "publiqué y no me llegó" no hay forma de distinguir entre: la app nunca
 * llamó, no había suscriptores para esa parroquia, el push service rechazó, o llegó y
 * el teléfono no lo mostró. Reutiliza la tabla del cron (migración 20260731_cron_runs)
 * a propósito: mismo tipo de dato y una migración menos que aplicar a mano.
 * Best-effort: si el registro falla, el aviso ya se envió y eso es lo que importa.
 */
async function logRun(row: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/cron_runs`, {
      method: 'POST',
      headers: { ...svcHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ job: 'notify-cantoral', ...row }),
    });
  } catch {
    /* la bitácora es best-effort */
  }
}

/**
 * Quién puede disparar el aviso: **solo quien publica cantorales** (Coro o Admin).
 *
 * Antes bastaba con estar logueado, y este endpoint manda una notificación push a
 * TODA la parroquia: cualquiera con una cuenta de Pueblo fiel podía repetirla a
 * voluntad. El rol se lee con la service key sobre el uid del token de quien llama,
 * así que no se puede falsear desde el cliente.
 */
async function callerCanNotify(token: string): Promise<boolean> {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
    if (!r.ok) return false;
    const user = await r.json();
    const uid = user?.id;
    if (!uid) return false;
    const p = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${encodeURIComponent(uid)}&select=role`,
      { headers: svcHeaders },
    );
    if (!p.ok) return false;
    const rows = await p.json();
    const role = Array.isArray(rows) && rows[0] ? rows[0].role : null;
    return role === 'Coro' || role === 'Admin';
  } catch { return false; }
}

let _webpush: any = null;
async function webpushLib(): Promise<any> {
  if (_webpush) return _webpush;
  const mod: any = await import('web-push');
  _webpush = mod?.default ?? mod;
  return _webpush;
}

/**
 * Opciones de envío.
 *
 *  · urgency 'high': en Android con la pantalla apagada, una notificación 'normal' se
 *    puede quedar retenida hasta que el teléfono despierte. El aviso de un cantoral
 *    sirve ANTES de la Misa o no sirve.
 *  · TTL de 12 h: si el teléfono estuvo apagado más que eso, el aviso ya no aporta.
 *    Sin TTL, el valor por defecto son cuatro semanas y llegan avisos de Misas viejas.
 */
const PUSH_OPTS = { urgency: 'high' as const, TTL: 12 * 60 * 60 };

/**
 * Manda a cada suscriptor, con UN reintento ante fallo transitorio.
 *
 * Los push services (FCM, Mozilla, Apple) devuelven 429 o 5xx cuando están saturados.
 * Sin reintento ese aviso se perdía y nadie se enteraba: es una de las razones de que
 * "no lleguen todas". Un 404/410 es distinto — esa suscripción ya no existe y se borra.
 */
async function sendToSubs(subs: { endpoint: string; p256dh: string; auth: string }[], payload: object) {
  if (!VAPID_PRIVATE || subs.length === 0) return { sent: 0, failed: 0, errors: [] as string[] };
  const webpush = await webpushLib();
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const body = JSON.stringify(payload);
  let sent = 0, failed = 0;
  const errors: string[] = [];

  const uno = async (s: { endpoint: string; p256dh: string; auth: string }, reintento = false): Promise<void> => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, PUSH_OPTS);
      sent++;
    } catch (e: any) {
      const code = Number(e?.statusCode) || 0;
      // Suscripción muerta: el navegador la rotó o el usuario desinstaló la app.
      if (code === 404 || code === 410) {
        failed++;
        errors.push(`${code} caducada`);
        await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE', headers: svcHeaders }).catch(() => {});
        return;
      }
      // Transitorio: se reintenta una vez tras una pausa corta.
      if (!reintento && (code === 429 || code >= 500)) {
        await new Promise((r) => setTimeout(r, 800));
        return uno(s, true);
      }
      failed++;
      errors.push(String(code || e?.message || 'error').slice(0, 40));
    }
  };

  await Promise.all(subs.map((s) => uno(s)));
  return { sent, failed, errors };
}

/**
 * Comparación de parroquias tolerante, la misma idea que usa listCantorals.
 *
 * El cantoral guarda `parish_name` recortado; la suscripción guarda la parroquia tal
 * cual la tiene el perfil. Un espacio de más o una mayúscula distinta bastaban para que
 * el suscriptor no calzara y el aviso no le llegara nunca, en silencio. Se normaliza
 * quitando acentos, espacios sobrantes y mayúsculas.
 */
const normParish = (x: unknown): string =>
  String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();

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
  // Dispara un push a toda la parroquia: sin tope, cualquiera con sesión podía
  // repetirlo en bucle.
  if (!(await rateLimit(req, res, 'notify-cantoral', 10, 60_000))) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!SUPABASE_URL || !ANON || !SERVICE) return res.status(500).json({ error: 'Config incompleta' });
  if (!VAPID_PRIVATE) return res.status(200).json({ ok: true, skipped: 'push no configurado (VAPID)' });

  const authHeader = (req.headers.authorization as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  if (!(await callerCanNotify(token))) return res.status(403).json({ error: 'Solo el coro o un administrador pueden avisar' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  // Acepta cantoralIds (varios, misma sesión) o cantoralId (uno, retrocompat).
  const ids: string[] = (Array.isArray(body.cantoralIds) ? body.cantoralIds : [body.cantoralId])
    .map((x: any) => String(x || '').replace(/[(),"]/g, '').trim())
    .filter(Boolean);
  if (ids.length === 0) return res.status(400).json({ error: 'Falta cantoralId(s)' });

  const startedAt = Date.now();

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/published_cantorals?id=in.(${encodeURIComponent(ids.join(','))})&select=id,parish_name,liturgical_date,mass_time,date,status`,
      { headers: svcHeaders },
    );
    if (!r.ok) {
      await logRun({ ok: false, error: 'No se pudo leer los cantorales', duration_ms: Date.now() - startedAt });
      return res.status(400).json({ error: 'No se pudo leer los cantorales' });
    }
    const rows = await r.json();
    const published = (Array.isArray(rows) ? rows : []).filter((c: any) => c.status === 'published' && c.parish_name);
    if (published.length === 0) {
      // Caso silencioso: los ids no existen, no están 'published' o no traen parroquia.
      await logRun({
        ok: false,
        error: `ids sin cantoral publicado: ${ids.join(',').slice(0, 200)}`,
        duration_ms: Date.now() - startedAt,
      });
      return res.status(200).json({ ok: true, sent: 0, subs: 0 });
    }

    // Agrupar por parroquia → UN aviso por parroquia.
    const byParish = new Map<string, any[]>();
    for (const c of published) {
      const p = String(c.parish_name);
      if (!byParish.has(p)) byParish.set(p, []);
      byParish.get(p)!.push(c);
    }

    // Suscriptores del topic 'cantorals', UNA sola vez. El filtro por parroquia se hace
    // aquí y no en la consulta: PostgREST solo sabe comparar el texto exacto, y con eso
    // cualquier diferencia de espacios o mayúsculas dejaba fuera al suscriptor.
    const allSr = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth,parishes&topics=cs.${encodeURIComponent('{cantorals}')}`,
      { headers: svcHeaders },
    );
    const allSubs: { endpoint: string; p256dh: string; auth: string; parishes: string[] }[] =
      allSr.ok ? await allSr.json() : [];

    let totalSent = 0;
    let totalSubs = 0;
    let totalFailed = 0;
    const errores: string[] = [];
    for (const [parish, items] of byParish) {
      // Más próximo primero (para el modo radio y el resumen).
      items.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
      const nearest = items[0];

      const objetivo = normParish(parish);
      const subs = allSubs.filter((s2) => (s2.parishes || []).some((x) => normParish(x) === objetivo));
      totalSubs += subs.length;

      const detail = [nearest.liturgical_date, nearest.mass_time].filter(Boolean).join(' · ');
      const payload = items.length === 1
        ? { title: 'Nuevo cantoral publicado 🎵', body: detail ? `${detail} — ${parish}` : parish }
        : { title: `${items.length} cantorales nuevos 🎵`, body: `${parish} · empieza por ${nearest.liturgical_date || 'el más próximo'}` };

      const result = await sendToSubs(subs, {
        ...payload,
        // ?r=1 → la app abre PRIMERO el modo radio (genera vistas) y luego el cantoral.
        url: `/c/${nearest.id}?r=1`,
        // Tag por parroquia Y FECHA. Antes era solo la parroquia, así que el aviso de
        // la Misa del domingo borraba de la bandeja el de la vespertina del sábado: la
        // gente veía llegar una sola. Con la fecha, cada Misa tiene el suyo, y volver a
        // avisar de la MISMA Misa sigue reemplazando en vez de apilar.
        tag: `cantoral-${parish}-${nearest.date}`,
      });
      totalSent += result.sent;
      totalFailed += result.failed;
      errores.push(...result.errors);
    }

    // `subs_total` = suscriptores que CALZABAN con la parroquia. Distinguirlo de
    // `sent` es lo que separa "no había a quién avisar" de "había y falló".
    await logRun({
      logical_date: published[0]?.date ?? null,
      coro_sent: totalSent,
      subs_total: totalSubs,
      duration_ms: Date.now() - startedAt,
      ok: totalFailed === 0,
      // Con el motivo concreto: la proxima vez que alguien diga "no me llego" se puede
      // distinguir una suscripcion caducada de un rechazo del push service.
      error: totalFailed > 0
        ? `${totalFailed} envío(s) rechazado(s): ${Array.from(new Set(errores)).join(', ').slice(0, 200)}`
        : null,
    });

    return res.status(200).json({ ok: true, sent: totalSent, subs: totalSubs, parishes: byParish.size });
  } catch (e: any) {
    await logRun({ ok: false, error: String(e?.message || e).slice(0, 500), duration_ms: Date.now() - startedAt });
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

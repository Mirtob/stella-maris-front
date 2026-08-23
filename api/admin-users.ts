import type { VercelRequest, VercelResponse } from '@vercel/node';

// Gestión de cuentas usuario/clave (creadas por admin). Usa la API admin de
// GoTrue (service-role) por fetch — sin dependencias nuevas. Protegido: solo
// admins (verificado con el RPC is_admin usando el token de quien llama).
//
// IMPORTANTE: este dominio debe coincidir con USERNAME_EMAIL_DOMAIN del frontend
// (src/services/supabaseClient.ts).
const USERNAME_EMAIL_DOMAIN = 'usuario.stellamaris.app';

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return {}; } }

async function verifyAdmin(url: string, anon: string, token: string): Promise<boolean> {
  try {
    const r = await fetch(`${url}/rest/v1/rpc/is_admin`, {
      method: 'POST',
      headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch {
    return false;
  }
}

async function findUserIdByEmail(url: string, svcHeaders: Record<string, string>, email: string): Promise<string | null> {
  // GoTrue admin list (paginado). Para la escala de marcha blanca basta recorrer
  // algunas páginas.
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: svcHeaders });
    if (!r.ok) return null;
    const data = await r.json();
    const users: any[] = Array.isArray(data) ? data : (data.users || []);
    const found = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (users.length < 200) break;
  }
  return null;
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
  // Cada intento consulta is_admin en Supabase; sin tope se puede martillar.
  if (!(await rateLimit(req, res, 'admin-users', 30, 60_000))) return;

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

  // 1. Autorización: quien llama debe ser admin (se valida con SU token).
  const authHeader = (req.headers.authorization as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  if (!(await verifyAdmin(SUPABASE_URL, ANON, token))) {
    return res.status(403).json({ error: 'Solo administradores' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const action = body.action;
  const svcHeaders = {
    apikey: SERVICE,
    Authorization: `Bearer ${SERVICE}`,
    'Content-Type': 'application/json',
  };

  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');

  try {
    if (action === 'create') {
      if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
        return res.status(400).json({ error: 'Usuario inválido (3-30 caracteres: letras, números, . _ -)' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'La clave debe tener al menos 6 caracteres' });
      }
      const email = `${username}@${USERNAME_EMAIL_DOMAIN}`;
      const name = body.name ? String(body.name) : undefined;
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: svcHeaders,
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: name ? { name, username } : { username },
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        const blob = JSON.stringify(data);
        const msg = /already|registered|exist/i.test(blob)
          ? 'Ese usuario ya existe'
          : (data?.msg || data?.error_description || data?.error || 'No se pudo crear la cuenta');
        return res.status(400).json({ error: msg });
      }

      // Pre-armar la fila en user_profiles para que la cuenta aparezca de inmediato
      // en Gestión de Usuarios (sin esperar al primer login) y el admin pueda
      // cambiarle el rol/perfil. Rol por defecto 'Pueblo fiel'; el usuario elige
      // su rol y parroquia en su primer ingreso (perfil "incompleto" → setup).
      let warning: string | undefined;
      const newUserId = data?.id;
      if (newUserId) {
        const pr = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
          method: 'POST',
          headers: { ...svcHeaders, Prefer: 'return=minimal' },
          body: JSON.stringify({ id: newUserId, email, name: name ?? null, role: 'Pueblo fiel' }),
        });
        if (!pr.ok) {
          // No es fatal: la cuenta ya existe; su perfil se creará en el primer login.
          const pblob = await pr.text().catch(() => '');
          console.error('admin-users create: no se pudo prearmar user_profiles', pr.status, pblob);
          warning = 'La cuenta se creó, pero su perfil aparecerá recién cuando inicie sesión.';
        }
      }
      return res.status(200).json({ ok: true, username, email, ...(warning ? { warning } : {}) });
    }

    if (action === 'reset-password') {
      if (!username) return res.status(400).json({ error: 'Falta el usuario' });
      if (password.length < 6) {
        return res.status(400).json({ error: 'La clave debe tener al menos 6 caracteres' });
      }
      const email = `${username}@${USERNAME_EMAIL_DOMAIN}`;
      const userId = await findUserIdByEmail(SUPABASE_URL, svcHeaders, email);
      if (!userId) return res.status(404).json({ error: 'No existe ese usuario' });
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: svcHeaders,
        body: JSON.stringify({ password }),
      });
      if (!r.ok) return res.status(400).json({ error: 'No se pudo restablecer la clave' });
      return res.status(200).json({ ok: true, username });
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

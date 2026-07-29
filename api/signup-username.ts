import type { VercelRequest, VercelResponse } from '@vercel/node';

// Registro AUTOSERVICIO de cuentas usuario/clave (alternativa a Google), para quien no
// quiere usar correo. Crea la cuenta con la API admin de GoTrue (service-role) y
// `email_confirm: true`, igual que el alta desde el Panel Admin (api/admin-users.ts):
// un signUp desde el cliente con la anon key dejaría la cuenta SIN confirmar (los emails
// sintéticos no se pueden confirmar) y no podría iniciar sesión.
//
// Público, pero con rate limit estricto por IP (evita creación masiva de cuentas).
// No inicia sesión: devuelve ok y el cliente hace login con las mismas credenciales.
//
// IMPORTANTE: el dominio debe coincidir con USERNAME_EMAIL_DOMAIN del frontend
// (src/services/supabaseClient.ts) y con api/admin-users.ts.
const USERNAME_EMAIL_DOMAIN = 'usuario.stellamaris.app';

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return {}; } }

// ── CORS ────────────────────────────────────────────────────────────────────
function isAllowedOrigin(origin: string): boolean {
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/i.test(origin)) return true;
  const extra = process.env.ALLOWED_ORIGINS;
  if (extra) {
    const list = extra.split(',').map((s) => s.trim()).filter(Boolean);
    if (list.includes(origin)) return true;
  }
  return false;
}

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return false; }
  return true;
}

// ── Rate limit (distribuido vía RPC api_rate_limit, con fallback en memoria) ──
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
  const dist = await distributedCheck(key, maxRequests, windowSeconds);
  if (dist) {
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, dist.remaining)));
    if (!dist.allowed) {
      res.setHeader('Retry-After', String(windowSeconds));
      res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
      return false;
    }
    return true;
  }
  const now = Date.now();
  let hit = hits.get(key);
  if (!hit || hit.resetAt < now) { hit = { count: 0, resetAt: now + windowMs }; hits.set(key, hit); }
  hit.count += 1;
  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - hit.count)));
  if (hit.count > maxRequests) {
    res.setHeader('Retry-After', String(Math.ceil((hit.resetAt - now) / 1000)));
    res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
    return false;
  }
  return true;
}

// ── Validación de clave: mínimo 4 caracteres, con al menos una letra y un número ──
function passwordProblem(pw: string): string | null {
  if (pw.length < 4) return 'La clave debe tener al menos 4 caracteres.';
  if (!/[a-zA-Z]/.test(pw)) return 'La clave debe incluir al menos una letra.';
  if (!/[0-9]/.test(pw)) return 'La clave debe incluir al menos un número.';
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return; // preflight
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // Rate limit: 5 registros por IP cada 15 minutos.
  if (!(await rateLimit(req, res, 'signup', 5, 15 * 60_000))) return;

  const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
  const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!SUPABASE_URL || !SERVICE) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = body.name ? String(body.name).trim().slice(0, 80) : undefined;

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return res.status(400).json({ error: 'Usuario inválido: 3 a 30 caracteres (letras, números, . _ -), sin espacios ni tildes.' });
  }
  const pwErr = passwordProblem(password);
  if (pwErr) return res.status(400).json({ error: pwErr });

  const email = `${username}@${USERNAME_EMAIL_DOMAIN}`;
  const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

  try {
    // Crear la cuenta. GoTrue rechaza el email duplicado → nombre de usuario ya tomado.
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
      if (/already|registered|exist|duplicate/i.test(blob)) {
        return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso. Elige otro.' });
      }
      // Ej.: la política de contraseña del proyecto exige más longitud.
      const msg = data?.msg || data?.error_description || data?.error || 'No se pudo crear la cuenta.';
      return res.status(400).json({ error: msg });
    }

    // Pre-armar user_profiles (rol por defecto Pueblo fiel) para que la cuenta exista
    // de inmediato; el usuario elige rol y parroquia en su primer ingreso (perfil
    // "incompleto" → setup). Mismo comportamiento que el alta del admin.
    const newUserId = data?.id;
    if (newUserId) {
      await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: { ...svcHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify({ id: newUserId, email, name: name ?? null, role: 'Pueblo fiel' }),
      }).catch(() => undefined); // no es fatal: se crea en el primer login si falla
    }

    return res.status(200).json({ ok: true, username });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

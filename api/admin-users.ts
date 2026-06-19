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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      return res.status(200).json({ ok: true, username, email });
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

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

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { querySubs, sendToSubs, containsParish, containsTopic, pushConfigured } from './_push';

// Envía "Nuevo cantoral publicado" a los suscriptores de la parroquia del cantoral.
// Se llama en segundo plano tras publicar. Requiere sesión (evita spam anónimo).

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return {}; } }

async function isAuthenticated(url: string, anon: string, token: string): Promise<boolean> {
  try {
    const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    return r.ok;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
  const ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!SUPABASE_URL || !ANON || !SERVICE) return res.status(500).json({ error: 'Config incompleta' });
  if (!pushConfigured()) return res.status(200).json({ ok: true, skipped: 'push no configurado (VAPID)' });

  const authHeader = (req.headers.authorization as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || !(await isAuthenticated(SUPABASE_URL, ANON, token))) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const cantoralId = String(body.cantoralId || '');
  if (!cantoralId) return res.status(400).json({ error: 'Falta cantoralId' });

  const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

  try {
    // Leer el cantoral (service role) para obtener parroquia/celebración reales.
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/published_cantorals?id=eq.${encodeURIComponent(cantoralId)}&select=id,parish_name,liturgical_date,mass_time,status`,
      { headers: svcHeaders },
    );
    if (!r.ok) return res.status(400).json({ error: 'No se pudo leer el cantoral' });
    const rows = await r.json();
    const c = Array.isArray(rows) ? rows[0] : null;
    if (!c || c.status !== 'published') return res.status(404).json({ error: 'Cantoral no publicado' });

    const parish = String(c.parish_name || '');
    if (!parish) return res.status(200).json({ ok: true, sent: 0 });

    // Suscriptores de esa parroquia con el topic de cantorales.
    const subs = await querySubs(`${containsTopic('cantorals')}&${containsParish(parish)}`);
    const detail = [c.liturgical_date, c.mass_time].filter(Boolean).join(' · ');
    const result = await sendToSubs(subs, {
      title: 'Nuevo cantoral publicado 🎵',
      body: detail ? `${detail} — ${parish}` : parish,
      url: `/c/${c.id}`,
      tag: `cantoral-${c.id}`,
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

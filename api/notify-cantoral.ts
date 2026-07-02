import type { VercelRequest, VercelResponse } from '@vercel/node';

// Envía "Nuevo cantoral publicado" a los suscriptores de la parroquia del cantoral.
// Se llama en segundo plano tras publicar. Requiere sesión (evita spam anónimo).
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

async function isAuthenticated(token: string): Promise<boolean> {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
    return r.ok;
  } catch { return false; }
}

let _webpush: any = null;
async function webpushLib(): Promise<any> {
  if (_webpush) return _webpush;
  const mod: any = await import('web-push');
  _webpush = mod?.default ?? mod;
  return _webpush;
}

async function sendToSubs(subs: { endpoint: string; p256dh: string; auth: string }[], payload: object) {
  if (!VAPID_PRIVATE || subs.length === 0) return { sent: 0, failed: 0 };
  const webpush = await webpushLib();
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const body = JSON.stringify(payload);
  let sent = 0, failed = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
      sent++;
    } catch (e: any) {
      failed++;
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE', headers: svcHeaders }).catch(() => {});
      }
    }
  }));
  return { sent, failed };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!SUPABASE_URL || !ANON || !SERVICE) return res.status(500).json({ error: 'Config incompleta' });
  if (!VAPID_PRIVATE) return res.status(200).json({ ok: true, skipped: 'push no configurado (VAPID)' });

  const authHeader = (req.headers.authorization as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || !(await isAuthenticated(token))) return res.status(401).json({ error: 'No autenticado' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const cantoralId = String(body.cantoralId || '');
  if (!cantoralId) return res.status(400).json({ error: 'Falta cantoralId' });

  try {
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

    const topicF = `topics=cs.${encodeURIComponent('{cantorals}')}`;
    const parishF = `parishes=cs.${encodeURIComponent(`{"${parish.replace(/"/g, '\\"')}"}`)}`;
    const sr = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth&${topicF}&${parishF}`,
      { headers: svcHeaders },
    );
    const subs = sr.ok ? await sr.json() : [];
    const detail = [c.liturgical_date, c.mass_time].filter(Boolean).join(' · ');
    const result = await sendToSubs(subs, {
      title: 'Nuevo cantoral publicado 🎵',
      body: detail ? `${detail} — ${parish}` : parish,
      // ?r=1 → la app abre PRIMERO el modo radio (genera vistas en el canal) y luego
      // el cantoral según el perfil.
      url: `/c/${c.id}?r=1`,
      tag: `cantoral-${c.id}`,
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

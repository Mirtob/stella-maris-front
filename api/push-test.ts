import type { VercelRequest, VercelResponse } from '@vercel/node';

// Envía una notificación de PRUEBA a la(s) suscripción(es) del solicitante, para
// verificar la entrega end-to-end. Recibe el `endpoint` del propio dispositivo (o, si
// viene token, usa las suscripciones del usuario). AUTOCONTENIDO (sin imports hermanos).

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
const ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const DEFAULT_VAPID_PUBLIC = 'BD6iyTq35EL0rH1goWKY4FEjvAjpUpxO-XSY9qFFaKHh9qBOeUeMSiKhFuUO8ZwZHOsUwM5T3F4NmvJSzv1ViSg';
const VAPID_PUBLIC = (process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC).trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').trim();
const VAPID_SUBJECT = (process.env.VAPID_SUBJECT || 'mailto:gustavus.tobar@gmail.com').trim();

const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return {}; } }

let _webpush: any = null;
async function webpushLib(): Promise<any> {
  if (_webpush) return _webpush;
  const mod: any = await import('web-push');
  _webpush = mod?.default ?? mod;
  return _webpush;
}

async function userIdFromToken(token: string): Promise<string | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    return (await r.json())?.id ?? null;
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!SUPABASE_URL || !SERVICE) return res.status(500).json({ error: 'Config incompleta' });
  if (!VAPID_PRIVATE) return res.status(200).json({ ok: true, sent: 0, skipped: 'push no configurado (VAPID)' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const endpoint = String(body.endpoint || '');

  const authHeader = (req.headers.authorization as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  // Selección de suscripciones: por endpoint propio, o por user_id si viene token.
  let query = '';
  if (endpoint) {
    query = `endpoint=eq.${encodeURIComponent(endpoint)}`;
  } else if (token) {
    const uid = await userIdFromToken(token);
    if (!uid) return res.status(401).json({ error: 'No autenticado' });
    query = `user_id=eq.${uid}`;
  } else {
    return res.status(400).json({ error: 'Falta endpoint o sesión' });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth&${query}`, { headers: svcHeaders });
    const subs: { endpoint: string; p256dh: string; auth: string }[] = r.ok ? await r.json() : [];
    if (subs.length === 0) return res.status(200).json({ ok: true, sent: 0, note: 'sin suscripciones' });

    const webpush = await webpushLib();
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    const payload = JSON.stringify({
      title: '¡Notificaciones activas! ✅',
      body: 'Esta es una prueba. Así recibirás los avisos de Stella Maris.',
      url: '/',
      tag: 'push-test',
    });

    let sent = 0, failed = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (e: any) {
        failed++;
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE', headers: svcHeaders }).catch(() => {});
        }
      }
    }));
    return res.status(200).json({ ok: true, sent, failed });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

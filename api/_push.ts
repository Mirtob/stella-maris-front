// Helper compartido de envío de Web Push (usado por push-subscribe, notify-cantoral y
// el cron de celebraciones). El prefijo "_" hace que Vercel NO lo trate como ruta.
import webpush from 'web-push';

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const VAPID_PUBLIC = (process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '').trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').trim();
const VAPID_SUBJECT = (process.env.VAPID_SUBJECT || 'mailto:gustavus.tobar@gmail.com').trim();

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export function pushConfigured(): boolean {
  return !!(VAPID_PUBLIC && VAPID_PRIVATE);
}

const svcHeaders = {
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
  'Content-Type': 'application/json',
};

/** Consulta suscripciones por un filtro PostgREST ya construido (p. ej. topics/parishes). */
export async function querySubs(filter: string): Promise<PushSub[]> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth&${filter}`,
    { headers: svcHeaders },
  );
  if (!r.ok) return [];
  return (await r.json()) as PushSub[];
}

/** Borra una suscripción caduca (endpoint 404/410 en el push service). */
export async function deleteSubByEndpoint(endpoint: string): Promise<void> {
  await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    { method: 'DELETE', headers: svcHeaders },
  ).catch(() => {});
}

/**
 * Envía un payload a una lista de suscripciones. Limpia las que el push service reporta
 * como caducadas (404/410). Devuelve conteos.
 */
export async function sendToSubs(subs: PushSub[], payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!pushConfigured() || subs.length === 0) return { sent: 0, failed: 0 };
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      );
      sent++;
    } catch (e: any) {
      failed++;
      const code = e?.statusCode;
      if (code === 404 || code === 410) await deleteSubByEndpoint(s.endpoint);
    }
  }));
  return { sent, failed };
}

/** Filtro PostgREST: array `parishes` contiene el valor dado (escapado). */
export function containsParish(parish: string): string {
  // cs = contains. Formato de array literal: {"valor"}
  return `parishes=cs.${encodeURIComponent(`{"${parish.replace(/"/g, '\\"')}"}`)}`;
}

/** Filtro PostgREST: array `topics` contiene el topic dado. */
export function containsTopic(topic: string): string {
  return `topics=cs.${encodeURIComponent(`{${topic}}`)}`;
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cron DIARIO: avisa de las celebraciones PERSONALIZADAS (custom_liturgical_dates) que
// caen en N días: globales → a todos; de parroquia → a esa parroquia. Se dispara por
// Vercel Cron (ver vercel.json). Idempotente por día.
// AUTOCONTENIDO: sin imports de api/_push (Vercel puede no incluir archivos "_" en el
// bundle) ni de src/ (cross-boundary). web-push se carga con dynamic import.

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const DEFAULT_VAPID_PUBLIC = 'BD6iyTq35EL0rH1goWKY4FEjvAjpUpxO-XSY9qFFaKHh9qBOeUeMSiKhFuUO8ZwZHOsUwM5T3F4NmvJSzv1ViSg';
const VAPID_PUBLIC = (process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC).trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').trim();
const VAPID_SUBJECT = (process.env.VAPID_SUBJECT || 'mailto:gustavus.tobar@gmail.com').trim();
const LEAD_DAYS = [7, 1];

const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };

function todayInSantiago(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date());
}
function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
const leadLabel = (lead: number) => (lead === 1 ? 'mañana' : `en ${lead} días`);

let _webpush: any = null;
async function webpushLib(): Promise<any> {
  if (_webpush) return _webpush;
  const mod: any = await import('web-push');
  _webpush = mod?.default ?? mod;
  return _webpush;
}

async function querySubs(filter: string): Promise<{ endpoint: string; p256dh: string; auth: string }[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth&${filter}`, { headers: svcHeaders });
  return r.ok ? await r.json() : [];
}
async function sendToSubs(subs: { endpoint: string; p256dh: string; auth: string }[], payload: object) {
  if (!VAPID_PRIVATE || subs.length === 0) return 0;
  const webpush = await webpushLib();
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const body = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE', headers: svcHeaders }).catch(() => {});
      }
    }
  }));
  return sent;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const CRON_SECRET = (process.env.CRON_SECRET || '').trim();
  const isVercelCron = !!req.headers['x-vercel-cron'];
  const authOk = CRON_SECRET && req.headers.authorization === `Bearer ${CRON_SECRET}`;
  if (!isVercelCron && !authOk) return res.status(401).json({ error: 'No autorizado' });

  if (!SUPABASE_URL || !SERVICE) return res.status(500).json({ error: 'Config incompleta' });
  if (!VAPID_PRIVATE) return res.status(200).json({ ok: true, skipped: 'push no configurado (VAPID)' });

  const today = todayInSantiago();
  const topicF = `topics=cs.${encodeURIComponent('{celebrations}')}`;
  let totalSent = 0;

  try {
    for (const lead of LEAD_DAYS) {
      const target = addDays(today, lead);
      const r = await fetch(`${SUPABASE_URL}/rest/v1/custom_liturgical_dates?date=eq.${target}&select=name,scope`, { headers: svcHeaders });
      const custom: { name: string; scope: string }[] = r.ok ? await r.json() : [];
      for (const c of custom) {
        const filter = c.scope === 'global'
          ? topicF
          : `${topicF}&parishes=cs.${encodeURIComponent(`{"${c.scope.replace(/"/g, '\\"')}"}`)}`;
        const subs = await querySubs(filter);
        totalSent += await sendToSubs(subs, {
          title: 'Celebración próxima ✝️',
          body: `${c.name} — ${leadLabel(lead)}`,
          url: '/',
          tag: `celeb-${target}-${c.name}`,
        });
      }
    }
    return res.status(200).json({ ok: true, date: today, sent: totalSent });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import CAL from '../liturgical-calendar.json';

// Cron DIARIO. Dos tipos de aviso:
//  1) Recordatorio general de celebraciones PERSONALIZADAS (7 y 1 día antes) → a todos
//     los suscriptores con topic 'celebrations'.
//  2) Recordatorio al CORO (3 días antes) de celebraciones POR DEFECTO (calendario:
//     domingos + solemnidades) y AGREGADAS, "publica el cantoral si no lo has hecho":
//     solo a suscriptores con role='Coro', por parroquia, y SOLO si esa parroquia aún
//     no tiene un cantoral publicado para esa fecha.
//
// AUTOCONTENIDO (sin imports de api/_*). El calendario base va como JSON dentro de api/
// (copia de src/data/liturgicalCalendar.generated.json) para que Vercel lo bundlee.
// web-push se carga con dynamic import.

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const DEFAULT_VAPID_PUBLIC = 'BD6iyTq35EL0rH1goWKY4FEjvAjpUpxO-XSY9qFFaKHh9qBOeUeMSiKhFuUO8ZwZHOsUwM5T3F4NmvJSzv1ViSg';
const VAPID_PUBLIC = (process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC).trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').trim();
const VAPID_SUBJECT = (process.env.VAPID_SUBJECT || 'mailto:gustavus.tobar@gmail.com').trim();

const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };

interface CalEntry { date: string; name: string; type: string }

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
const encParish = (p: string) => encodeURIComponent(`{"${p.replace(/"/g, '\\"')}"}`);

/** Celebraciones "por defecto" en una fecha: domingos + solemnidades (a todas las parroquias). */
function baseCelebrationsOn(date: string): string[] {
  return (CAL as CalEntry[])
    .filter((e) => e.date === date && (e.type === 'SOLEMNITY' || e.type === 'SUNDAY'))
    .map((e) => e.name);
}

async function customCelebrationsOn(date: string): Promise<{ name: string; scope: string }[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/custom_liturgical_dates?date=eq.${date}&select=name,scope`, { headers: svcHeaders });
  return r.ok ? await r.json() : [];
}

/** ¿La parroquia ya tiene un cantoral publicado para alguna de esas fechas (incluye víspera)? */
async function parishHasCantoral(parish: string, dates: string[]): Promise<boolean> {
  const orExpr = `(${dates.map((d) => `date.eq.${d}`).join(',')})`;
  const url = `${SUPABASE_URL}/rest/v1/published_cantorals?parish_name=eq.${encodeURIComponent(parish)}&or=${encodeURIComponent(orExpr)}&select=id&limit=1`;
  const r = await fetch(url, { headers: svcHeaders });
  if (!r.ok) return false;
  const rows = await r.json();
  return Array.isArray(rows) && rows.length > 0;
}

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
async function sendToSubs(subs: { endpoint: string; p256dh: string; auth: string }[], payload: object): Promise<number> {
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
  const topicCeleb = `topics=cs.${encodeURIComponent('{celebrations}')}`;
  let generalSent = 0;
  let coroSent = 0;

  try {
    // ── 1) Recordatorio general (7 y 1 día) de celebraciones personalizadas ──
    for (const lead of [7, 1]) {
      const target = addDays(today, lead);
      for (const c of await customCelebrationsOn(target)) {
        const filter = c.scope === 'global' ? topicCeleb : `${topicCeleb}&parishes=cs.${encParish(c.scope)}`;
        const subs = await querySubs(filter);
        generalSent += await sendToSubs(subs, {
          title: 'Celebración próxima ✝️',
          body: `${c.name} — ${leadLabel(lead)}`,
          url: '/',
          tag: `celeb-${target}-${c.name}`,
        });
      }
    }

    // ── 2) Recordatorio al CORO (3 días): publica el cantoral si no lo has hecho ──
    const target3 = addDays(today, 3);
    const vigil = addDays(today, 2); // víspera (I Vísperas se publica el día anterior)
    const base3 = baseCelebrationsOn(target3);           // domingos + solemnidades (globales)
    const custom3 = await customCelebrationsOn(target3);

    const cr = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?role=eq.Coro&select=endpoint,p256dh,auth,parishes`, { headers: svcHeaders });
    const coroSubs: { endpoint: string; p256dh: string; auth: string; parishes: string[] }[] = cr.ok ? await cr.json() : [];

    for (const sub of coroSubs) {
      for (const parish of (sub.parishes || [])) {
        const relevant = [
          ...base3,
          ...custom3.filter((c) => c.scope === 'global' || c.scope === parish).map((c) => c.name),
        ];
        if (relevant.length === 0) continue;
        if (await parishHasCantoral(parish, [target3, vigil])) continue; // ya publicaron
        coroSent += await sendToSubs([{ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }], {
          title: 'Publica el cantoral 🎼',
          body: `${relevant[0]} es ${leadLabel(3)}. Publica los cantos para tu coro y tu comunidad.`,
          url: '/', // el Coro llega a su pantalla principal (constructor del cantoral)
          tag: `coropub-${target3}-${parish}`,
        });
      }
    }

    return res.status(200).json({ ok: true, date: today, generalSent, coroSent });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

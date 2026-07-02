import type { VercelRequest, VercelResponse } from '@vercel/node';
import { querySubs, sendToSubs, containsParish, containsTopic, pushConfigured } from '../_push';
import { liturgicalCalendar2026 } from '../../src/data/liturgicalCalendar';

// Cron DIARIO: avisa de las celebraciones que caen en N días.
//  - Personalizadas (custom_liturgical_dates): globales → a todos; de parroquia → a esa.
//  - Solemnidades importantes del calendario 2026 (importance 'high') → a todos.
// Se dispara por Vercel Cron (ver vercel.json). Idempotente por día: cada corrida solo
// matchea las fechas que caen exactamente a `lead` días.

const LEAD_DAYS = [7, 1];

/** 'YYYY-MM-DD' de hoy en America/Santiago (misma zona que usa la app). */
function todayInSantiago(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date()); // en-CA da 'YYYY-MM-DD'
}

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

const leadLabel = (lead: number) => (lead === 1 ? 'mañana' : `en ${lead} días`);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Seguridad: Vercel Cron manda header `x-vercel-cron`. Para disparo manual se acepta
  // Authorization: Bearer <CRON_SECRET>.
  const CRON_SECRET = (process.env.CRON_SECRET || '').trim();
  const isVercelCron = !!req.headers['x-vercel-cron'];
  const authOk = CRON_SECRET && (req.headers.authorization === `Bearer ${CRON_SECRET}`);
  if (!isVercelCron && !authOk) return res.status(401).json({ error: 'No autorizado' });

  const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
  const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!SUPABASE_URL || !SERVICE) return res.status(500).json({ error: 'Config incompleta' });
  if (!pushConfigured()) return res.status(200).json({ ok: true, skipped: 'push no configurado (VAPID)' });

  const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };
  const today = todayInSantiago();
  let totalSent = 0;

  try {
    for (const lead of LEAD_DAYS) {
      const target = addDays(today, lead);

      // 1) Celebraciones personalizadas de esa fecha.
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/custom_liturgical_dates?date=eq.${target}&select=name,scope`,
        { headers: svcHeaders },
      );
      const custom: { name: string; scope: string }[] = r.ok ? await r.json() : [];
      for (const c of custom) {
        const filter = c.scope === 'global'
          ? containsTopic('celebrations')
          : `${containsTopic('celebrations')}&${containsParish(c.scope)}`;
        const subs = await querySubs(filter);
        const { sent } = await sendToSubs(subs, {
          title: 'Celebración próxima ✝️',
          body: `${c.name} — ${leadLabel(lead)}`,
          url: '/',
          tag: `celeb-${target}-${c.name}`,
        });
        totalSent += sent;
      }

      // 2) Solemnidades importantes del calendario oficial (a todos).
      const solemn = liturgicalCalendar2026.filter(
        (e) => e.date === target && e.importance === 'high',
      );
      if (solemn.length) {
        const subs = await querySubs(containsTopic('celebrations'));
        for (const e of solemn) {
          const { sent } = await sendToSubs(subs, {
            title: 'Solemnidad próxima ✝️',
            body: `${e.name} — ${leadLabel(lead)}`,
            url: '/',
            tag: `celeb-${target}-${e.name}`,
          });
          totalSent += sent;
        }
      }
    }
    return res.status(200).json({ ok: true, date: today, sent: totalSent });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Envía "Nuevo cantoral publicado" a los suscriptores de la parroquia. Acepta VARIOS
// cantorales (cantoralIds) de una misma sesión de publicación y manda UN SOLO aviso por
// parroquia (evita saturar cuando se publican varios días de una vez, p. ej. Semana
// Santa). Tag ESTABLE por parroquia → el aviso nuevo reemplaza al anterior en la
// bandeja (no se apilan). Se llama en segundo plano tras publicar; requiere sesión.
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

/**
 * Deja constancia del envío en `cron_runs` (job = 'notify-cantoral'). Sin esto, cuando
 * alguien dice "publiqué y no me llegó" no hay forma de distinguir entre: la app nunca
 * llamó, no había suscriptores para esa parroquia, el push service rechazó, o llegó y
 * el teléfono no lo mostró. Reutiliza la tabla del cron (migración 20260731_cron_runs)
 * a propósito: mismo tipo de dato y una migración menos que aplicar a mano.
 * Best-effort: si el registro falla, el aviso ya se envió y eso es lo que importa.
 */
async function logRun(row: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/cron_runs`, {
      method: 'POST',
      headers: { ...svcHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ job: 'notify-cantoral', ...row }),
    });
  } catch {
    /* la bitácora es best-effort */
  }
}

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
  // Acepta cantoralIds (varios, misma sesión) o cantoralId (uno, retrocompat).
  const ids: string[] = (Array.isArray(body.cantoralIds) ? body.cantoralIds : [body.cantoralId])
    .map((x: any) => String(x || '').replace(/[(),"]/g, '').trim())
    .filter(Boolean);
  if (ids.length === 0) return res.status(400).json({ error: 'Falta cantoralId(s)' });

  const startedAt = Date.now();

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/published_cantorals?id=in.(${encodeURIComponent(ids.join(','))})&select=id,parish_name,liturgical_date,mass_time,date,status`,
      { headers: svcHeaders },
    );
    if (!r.ok) {
      await logRun({ ok: false, error: 'No se pudo leer los cantorales', duration_ms: Date.now() - startedAt });
      return res.status(400).json({ error: 'No se pudo leer los cantorales' });
    }
    const rows = await r.json();
    const published = (Array.isArray(rows) ? rows : []).filter((c: any) => c.status === 'published' && c.parish_name);
    if (published.length === 0) {
      // Caso silencioso: los ids no existen, no están 'published' o no traen parroquia.
      await logRun({
        ok: false,
        error: `ids sin cantoral publicado: ${ids.join(',').slice(0, 200)}`,
        duration_ms: Date.now() - startedAt,
      });
      return res.status(200).json({ ok: true, sent: 0, subs: 0 });
    }

    // Agrupar por parroquia → UN aviso por parroquia.
    const byParish = new Map<string, any[]>();
    for (const c of published) {
      const p = String(c.parish_name);
      if (!byParish.has(p)) byParish.set(p, []);
      byParish.get(p)!.push(c);
    }

    let totalSent = 0;
    let totalSubs = 0;
    let totalFailed = 0;
    for (const [parish, items] of byParish) {
      // Más próximo primero (para el modo radio y el resumen).
      items.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
      const nearest = items[0];

      const topicF = `topics=cs.${encodeURIComponent('{cantorals}')}`;
      const parishF = `parishes=cs.${encodeURIComponent(`{"${parish.replace(/"/g, '\\"')}"}`)}`;
      const sr = await fetch(
        `${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth&${topicF}&${parishF}`,
        { headers: svcHeaders },
      );
      const subs = sr.ok ? await sr.json() : [];
      totalSubs += Array.isArray(subs) ? subs.length : 0;

      const detail = [nearest.liturgical_date, nearest.mass_time].filter(Boolean).join(' · ');
      const payload = items.length === 1
        ? { title: 'Nuevo cantoral publicado 🎵', body: detail ? `${detail} — ${parish}` : parish }
        : { title: `${items.length} cantorales nuevos 🎵`, body: `${parish} · empieza por ${nearest.liturgical_date || 'el más próximo'}` };

      const result = await sendToSubs(subs, {
        ...payload,
        // ?r=1 → la app abre PRIMERO el modo radio (genera vistas) y luego el cantoral.
        url: `/c/${nearest.id}?r=1`,
        // Tag ESTABLE por parroquia: el aviso nuevo reemplaza al anterior (no se apilan).
        tag: `cantoral-${parish}`,
      });
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    // `subs_total` = suscriptores que CALZABAN con la parroquia. Distinguirlo de
    // `sent` es lo que separa "no había a quién avisar" de "había y falló".
    await logRun({
      logical_date: published[0]?.date ?? null,
      coro_sent: totalSent,
      subs_total: totalSubs,
      duration_ms: Date.now() - startedAt,
      ok: totalFailed === 0,
      error: totalFailed > 0 ? `${totalFailed} envío(s) rechazado(s) por el push service` : null,
    });

    return res.status(200).json({ ok: true, sent: totalSent, subs: totalSubs, parishes: byParish.size });
  } catch (e: any) {
    await logRun({ ok: false, error: String(e?.message || e).slice(0, 500), duration_ms: Date.now() - startedAt });
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}

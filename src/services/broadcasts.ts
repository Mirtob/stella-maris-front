import { getSupabaseClient } from './supabaseClient';

/**
 * Avisos y promociones por push.
 *
 * El envío y el recuento de destinatarios pasan por `/api/notify-cantoral` (acciones
 * `audience` y `broadcast`) porque `push_subscriptions` NO es legible desde el
 * navegador: no tiene policies, solo la alcanza el service role de las funciones. Eso
 * es a propósito — la lista de dispositivos de toda la comunidad no tiene por qué
 * viajar al cliente para contar cuántos son.
 *
 * El historial sí se lee directo de la base: `push_broadcasts` deja leer al admin
 * principal (migración 20260903_push_avisos).
 */

export interface Audiencia {
  /** Diócesis a las que dirigirlo. Vacío = todas. */
  dioceses?: string[];
  /** Roles a los que dirigirlo ('Coro', 'Admin', 'Pueblo fiel'). Vacío = todos. */
  roles?: string[];
}

export interface ResumenAudiencia {
  total: number;
  porDiocesis: Record<string, number>;
  porRol: Record<string, number>;
}

export interface AvisoEnviado {
  id: string;
  title: string;
  body: string;
  url: string | null;
  audience: Audiencia;
  subsTotal: number;
  sent: number;
  failed: number;
  sentBy: string | null;
  sentAt: string;
}

async function token(): Promise<string | undefined> {
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session?.access_token;
}

async function llamar(cuerpo: object): Promise<any> {
  const t = await token();
  if (!t) return { error: 'Tu sesión expiró. Vuelve a entrar.' };
  const r = await fetch('/api/notify-cantoral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify(cuerpo),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { error: data?.error || `Error ${r.status}` };
  return data;
}

/** Cuántos dispositivos hay y cómo se reparten por diócesis y por rol. */
export async function getResumenAudiencia(): Promise<ResumenAudiencia | { error: string }> {
  const d = await llamar({ action: 'audience' });
  if (d.error) return { error: d.error };
  return { total: d.total ?? 0, porDiocesis: d.porDiocesis ?? {}, porRol: d.porRol ?? {} };
}

/** Manda el aviso. No se puede deshacer. */
export async function enviarAviso(aviso: {
  title: string;
  body: string;
  url?: string;
  audience: Audiencia;
  sentBy?: string;
}): Promise<{ ok: boolean; sent?: number; subs?: number; error?: string; aviso?: string }> {
  const d = await llamar({ action: 'broadcast', ...aviso });
  if (d.error) return { ok: false, error: d.error };
  return { ok: true, sent: d.sent, subs: d.subs, aviso: d.aviso };
}

/** Lo que ya se mandó, lo más reciente primero. */
export async function listarAvisos(limite = 20): Promise<AvisoEnviado[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('push_broadcasts')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limite);
    if (error) {
      // Sin la migración aplicada la tabla no existe: se devuelve vacío y la pantalla
      // lo explica, en vez de romperse.
      console.error('No se pudo leer el historial de avisos:', error.message);
      return [];
    }
    return (data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      url: r.url,
      audience: r.audience ?? {},
      subsTotal: r.subs_total ?? 0,
      sent: r.sent ?? 0,
      failed: r.failed ?? 0,
      sentBy: r.sent_by,
      sentAt: r.sent_at,
    }));
  } catch {
    return [];
  }
}

/** Cómo se lee una audiencia en la lista de enviados. */
export function describirAudiencia(a: Audiencia): string {
  const partes: string[] = [];
  if (a.dioceses?.length) partes.push(a.dioceses.join(', '));
  if (a.roles?.length) partes.push(`rol ${a.roles.join(' y ')}`);
  return partes.length ? partes.join(' · ') : 'Toda la comunidad';
}

/**
 * Manda el aviso SOLO a los dispositivos de quien lo escribe.
 *
 * Es el paso que faltaba: hasta ahora, la única forma de ver cómo queda un aviso en un
 * teléfono de verdad era mandárselo a toda la comunidad — y eso no se puede retirar.
 * También sirve de diagnóstico: si la prueba no llega, el problema es la suscripción de
 * ESTE dispositivo, no el envío.
 */
export async function enviarPrueba(aviso: { title: string; body: string; url?: string }):
  Promise<{ ok: boolean; sent?: number; sinSuscripciones?: boolean; error?: string }> {
  const t = await token();
  if (!t) return { ok: false, error: 'Tu sesión expiró. Vuelve a entrar.' };
  try {
    const r = await fetch('/api/push-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(aviso),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: d?.error || `Error ${r.status}` };
    return { ok: true, sent: d.sent ?? 0, sinSuscripciones: (d.sent ?? 0) === 0 };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

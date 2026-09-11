import { getSupabaseClient } from './supabaseClient';
import {
  cubre, parroquiasMadre, esParaMiCoro, type ChoirInvitation,
} from '../utils/choirInvitations';
import type { MassType } from '../types';

export type { ChoirInvitation };

/**
 * Coros invitados.
 *
 * En la fiesta patronal, una parroquia invita al coro de otra: el 10 de octubre el
 * coro de Pirque canta en Valdivia de Paine. Esa invitación es lo único que habilita
 * al coro invitado a publicar el cantoral de esa Misa en la parroquia anfitriona
 * (ver la migración 20260910_coros_invitados, que es donde se aplica de verdad: la
 * RLS del servidor decide, esto solo pinta la puerta).
 *
 * Dos reglas que no se negocian aquí:
 *  · Invita la ANFITRIONA. Nadie se auto-invita.
 *  · Vale SOLO la fecha invitada, y la fecha es la de la CELEBRACIÓN (una Misa de
 *    I Vísperas cantada la tarde anterior lleva igual la fecha de la fiesta).
 */

interface Row {
  id: string;
  host_parish: string;
  guest_parish: string;
  date: string;
  mass_type?: string | null;
  rejected_at?: string | null;
  rejected_reason?: string | null;
  accepted_at?: string | null;
  note?: string | null;
  created_by?: string | null;
}

const TABLE = 'choir_invitations';
const COLS = 'id,host_parish,guest_parish,date,mass_type,rejected_at,rejected_reason,accepted_at,note,created_by';

const rowToInvitation = (r: Row): ChoirInvitation => ({
  id: r.id,
  hostParish: r.host_parish,
  guestParish: r.guest_parish,
  date: String(r.date).slice(0, 10),
  massType: (r.mass_type === 'visperas_i' || r.mass_type === 'visperas_ii' ? r.mass_type : 'dia') as MassType,
  rejectedAt: r.rejected_at ?? undefined,
  rejectedReason: r.rejected_reason ?? undefined,
  acceptedAt: r.accepted_at ?? undefined,
  note: r.note ?? undefined,
  createdBy: r.created_by ?? undefined,
});

/**
 * Las invitaciones de aquí en adelante, sin filtrar por parroquia.
 *
 * No se filtra en el servidor porque la unidad invitada puede ser una capilla y la del
 * perfil su parroquia (o al revés), y eso no se expresa con un `in`. Son pocas filas
 * —lo que queda del año en un puñado de parroquias—, así que se filtran aquí con la
 * misma regla que usa la RLS.
 */
async function proximas(desde: string): Promise<ChoirInvitation[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from(TABLE)
    .select(COLS)
    .gte('date', desde)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToInvitation);
}

/** Invitaciones que recibió el coro de estas parroquias (de hoy en adelante). */
export async function listInvitacionesRecibidas(parroquiasPropias: string[], desde: string): Promise<ChoirInvitation[]> {
  const madres = parroquiasMadre(parroquiasPropias);
  if (madres.length === 0) return [];
  try {
    const filas = await proximas(desde);
    return filas.filter((i) => madres.some((m) => esParaMiCoro(i.guestParish, m)));
  } catch (err) {
    console.error('Error listando invitaciones recibidas:', (err as Error).message);
    return [];
  }
}

/** Invitaciones que hizo esta parroquia como anfitriona (de hoy en adelante). */
export async function listInvitacionesEnviadas(parroquiasPropias: string[], desde: string): Promise<ChoirInvitation[]> {
  const madres = parroquiasMadre(parroquiasPropias);
  if (madres.length === 0) return [];
  try {
    const filas = await proximas(desde);
    // Las capillas de la parroquia también son "su casa".
    return filas.filter((i) => madres.some((m) => cubre(m, i.hostParish)));
  } catch (err) {
    console.error('Error listando invitaciones enviadas:', (err as Error).message);
    return [];
  }
}

/** Registra la invitación. Solo funciona desde la parroquia anfitriona (lo exige la RLS). */
export async function invitarCoro(
  input: { hostParish: string; guestParish: string; date: string; massType: MassType; note?: string },
): Promise<{ ok: boolean; invitation?: ChoirInvitation; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from(TABLE)
      .insert({
        host_parish: input.hostParish.trim(),
        // Tal cual se eligió: una capilla puede invitar y ser invitada.
        guest_parish: input.guestParish.trim(),
        date: input.date,
        mass_type: input.massType,
        note: input.note?.trim() || null,
      })
      .select(COLS)
      .single();
    if (error) return { ok: false, error: mensajeDeError(error) };
    return { ok: true, invitation: rowToInvitation(data as Row) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * El coro invitado responde: ACEPTA (va) o RECHAZA diciendo por qué.
 *
 * No borra nada —eso es cosa de quien invitó—: queda la respuesta, para que la
 * anfitriona sepa si tiene coro o si tiene que buscar otro. Se puede cambiar: aceptar
 * hoy y avisar el jueves que al final no pueden es justo lo que pasa.
 */
export async function responderInvitacion(
  id: string, aceptar: boolean, motivo?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('responder_invitacion', {
      p_id: id, p_aceptar: aceptar, p_motivo: motivo ?? null,
    });
    if (error) return { ok: false, error: mensajeDeError(error) };
    if (data !== true) return { ok: false, error: 'Esa invitación no es de tu coro.' };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Avisa al coro invitado con una notificación push.
 *
 * Best-effort y en segundo plano: la invitación ya está guardada, y que el aviso no
 * salga (VAPID sin configurar, nadie suscrito, el push service caído) no puede hacer
 * fallar la invitación ni dejar al usuario mirando una rueda. Ver api/notify-cantoral.
 */
export async function avisarInvitacion(id: string): Promise<void> {
  try {
    const sb = getSupabaseClient();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch('/api/notify-cantoral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'invitation', invitationId: id }),
    });
  } catch {
    /* el aviso es un extra: la invitación ya quedó registrada */
  }
}

/**
 * Le devuelve el mensaje a quien invitó: el coro no puede ir, y por qué.
 *
 * Sin esto el rechazo se queda esperando a que alguien de la parroquia anfitriona entre
 * a mirar, y lo que necesita es enterarse a tiempo para buscar otro coro. Best-effort,
 * como el aviso de la invitación.
 */
export async function avisarRechazo(id: string): Promise<void> {
  try {
    const sb = getSupabaseClient();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch('/api/notify-cantoral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'invitation-rejected', invitationId: id }),
    });
  } catch {
    /* el aviso es un extra: el rechazo ya quedó registrado */
  }
}

/** Retira la invitación — solo quien invitó. El permiso se apaga. */
export async function retirarInvitacion(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).delete().eq('id', id);
    if (error) return { ok: false, error: mensajeDeError(error) };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** El error de Postgres, dicho como lo diría una persona. */
function mensajeDeError(error: { code?: string; message?: string }): string {
  if (error.code === '23505') return 'Ese coro ya está invitado para esa fecha.';
  if (error.code === '42P01' || error.code === 'PGRST202' || error.code === 'PGRST205') {
    return 'Falta aplicar la migración 20260910 en Supabase.';
  }
  if (/row-level security|42501/i.test(`${error.code} ${error.message}`)) {
    return 'Solo la parroquia anfitriona puede invitar, y desde su propia cuenta.';
  }
  return error.message ?? 'Error desconocido.';
}

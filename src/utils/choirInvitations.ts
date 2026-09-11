/**
 * Coros invitados — las reglas puras.
 *
 * En la fiesta patronal, una parroquia invita al coro de otra: el coro de Pirque canta
 * en Valdivia de Paine. Esa invitación es lo único que habilita al coro invitado a
 * publicar el cantoral de esa Misa en la parroquia anfitriona.
 *
 * Tres reglas que no se negocian:
 *  · Invita la ANFITRIONA. Nadie se auto-invita. La retira solo quien invitó; el coro
 *    invitado no la borra: la RECHAZA, y queda constancia.
 *  · Vale SOLO la fecha invitada, y la fecha es la de la CELEBRACIÓN. Un sábado por la
 *    tarde se invita al DOMINGO con tipo I Vísperas.
 *  · Parroquias y capillas juegan igual: una capilla puede invitar al coro de otra
 *    parroquia o de otra capilla.
 *
 * Quien decide de verdad es la RLS del servidor (migración 20260910_coros_invitados);
 * esto es lo que le permite a la app ofrecer la puerta correcta y no una que el
 * servidor vaya a cerrar en la cara.
 */
import { splitActiveParish, CHAPEL_SEP } from './parish';
import type { MassType } from '../types';

export interface ChoirInvitation {
  id: string;
  /** Dónde se canta: parroquia o capilla anfitriona. */
  hostParish: string;
  /** Quién viene: parroquia o capilla del coro invitado. */
  guestParish: string;
  /** Fecha de la CELEBRACIÓN, 'YYYY-MM-DD'. */
  date: string;
  /** I Vísperas (se canta la tarde anterior), del día, o II Vísperas. */
  massType: MassType;
  /** Para qué ("Fiesta patronal de San Francisco"). */
  note?: string;
  /** El coro invitado dijo que no puede. `undefined` = sigue en pie. */
  rejectedAt?: string;
  createdBy?: string;
}

/**
 * ¿La unidad `unidad` está cubierta por `propia`?
 *
 * Misma regla que `user_covers_parish` en la BD: la parroquia tal cual, o una capilla
 * que cuelga de ella ("<Parroquia> - <Diócesis> · <Capilla>").
 */
export function cubre(propia: string, unidad: string): boolean {
  const p = (propia ?? '').trim();
  const u = (unidad ?? '').trim();
  if (!p || !u) return false;
  return u === p || u.startsWith(p + CHAPEL_SEP);
}

/**
 * ¿Esta invitación es para MI coro?
 *
 * Se mira en los dos sentidos, porque las dos cosas pasan y las dos son la misma
 * invitación: me invitan como parroquia y yo entré por una capilla, o me invitan a la
 * capilla y mi perfil declara la parroquia. Es lo mismo que hace el servidor, que
 * pregunta si el usuario "cubre" la unidad invitada.
 */
export function esParaMiCoro(unidadInvitada: string, unidadPropia: string): boolean {
  return cubre(unidadPropia, unidadInvitada) || cubre(unidadInvitada, unidadPropia);
}

/** La parroquia madre de cada unidad del perfil, sin repetir ni vacías. */
export function parroquiasMadre(parroquias: string[]): string[] {
  return Array.from(new Set(
    (parroquias ?? []).map((p) => splitActiveParish(p).parishFull).filter(Boolean),
  ));
}

/** ¿Sigue en pie? (ni rechazada por el coro invitado). */
export function estaVigente(i: ChoirInvitation): boolean {
  return !i.rejectedAt;
}

/**
 * De las invitaciones recibidas, las parroquias donde este coro puede publicar ese día.
 *
 * La parroquia propia nunca sale en esta lista — ahí se publica por derecho, no por
 * invitación. Las rechazadas tampoco: rechazar apaga el permiso.
 */
export function invitacionesVigentesPara(
  invitaciones: ChoirInvitation[],
  parroquiasPropias: string[],
  fecha: string,
): ChoirInvitation[] {
  const dia = (fecha ?? '').slice(0, 10);
  if (!dia) return [];
  const madres = parroquiasMadre(parroquiasPropias);
  if (madres.length === 0) return [];
  const vistas = new Set<string>();
  return invitaciones
    .filter((i) => i.date === dia && estaVigente(i))
    .filter((i) => madres.some((m) => esParaMiCoro(i.guestParish, m)))
    .filter((i) => !madres.some((m) => cubre(m, i.hostParish)))
    .filter((i) => {
      if (vistas.has(i.hostParish)) return false;
      vistas.add(i.hostParish);
      return true;
    });
}

/** Solo los nombres, para cuando basta con saber dónde. */
export function parroquiasInvitadasPara(
  invitaciones: ChoirInvitation[],
  parroquiasPropias: string[],
  fecha: string,
): string[] {
  return invitacionesVigentesPara(invitaciones, parroquiasPropias, fecha).map((i) => i.hostParish);
}

/** ¿Me invitaron a mí? (para decidir si puedo rechazarla). */
export function meInvitaron(i: ChoirInvitation, parroquiasPropias: string[]): boolean {
  return parroquiasMadre(parroquiasPropias).some((m) => esParaMiCoro(i.guestParish, m));
}

/** ¿Invité yo? (para decidir si puedo retirarla). */
export function inviteYo(i: ChoirInvitation, parroquiasPropias: string[]): boolean {
  return parroquiasMadre(parroquiasPropias).some((m) => cubre(m, i.hostParish));
}

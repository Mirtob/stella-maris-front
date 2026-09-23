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
  /** Por qué no pueden ir. Lo escribe el invitado; lo lee la anfitriona. */
  rejectedReason?: string;
  /** El coro invitado confirmó que va. */
  acceptedAt?: string;
  createdBy?: string;
}

/**
 * En qué va la invitación.
 *
 * `pendiente` es la que hay que responder; es la única que muestra los botones.
 * ACEPTAR ES LA LLAVE: hasta que alguien del coro invitado acepta, no se puede publicar
 * en la parroquia anfitriona (lo mismo exige la BD). Y basta con UNO: la invitación es
 * al coro, así que en cuanto uno acepta, cualquiera de ese coro puede armar y publicar.
 */
export type EstadoInvitacion = 'pendiente' | 'aceptada' | 'rechazada';

export function estadoInvitacion(i: ChoirInvitation): EstadoInvitacion {
  if (i.rejectedAt) return 'rechazada';
  if (i.acceptedAt) return 'aceptada';
  return 'pendiente';
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

/** ¿Hay que responderla? Es lo que decide si se muestran Aceptar/Rechazar. */
export function estaPendiente(i: ChoirInvitation): boolean {
  return estadoInvitacion(i) === 'pendiente';
}

/**
 * De las invitaciones recibidas, las parroquias donde este coro puede publicar ese día.
 *
 * Solo las ACEPTADAS: publicar en la casa de otro empieza por decir que sí, y es lo que
 * exige la RLS — ofrecer la parroquia antes de aceptar sería ofrecer una puerta que el
 * servidor cierra. La propia nunca sale en esta lista: ahí se publica por derecho.
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
    .filter((i) => i.date === dia && estadoInvitacion(i) === 'aceptada')
    .filter((i) => madres.some((m) => esParaMiCoro(i.guestParish, m)))
    .filter((i) => !madres.some((m) => cubre(m, i.hostParish)))
    .filter((i) => {
      if (vistas.has(i.hostParish)) return false;
      vistas.add(i.hostParish);
      return true;
    });
}

/**
 * La invitación ACEPTADA que convierte a este cantoral en uno de coro invitado.
 *
 * Se resuelve contra la parroquia y la fecha FINALES del cantoral —las que se van a
 * guardar—, no contra lo que hubiera en el constructor: al publicar, la fecha se canoniza
 * a la de la celebración, y una invitación vale para un día concreto.
 *
 * A diferencia de `invitacionesVigentesPara`, esta NO descarta las anfitrionas que el
 * usuario ya cubre por perfil. Aquella lista decide qué OFRECER como destino, y ahí sí
 * sobra ofrecer una parroquia donde ya se publica por derecho; esta decide **de quién es
 * el cantoral**, y eso no cambia porque quien publica pertenezca además a la anfitriona.
 *
 * Sin esa distinción, a quien tuviera las dos parroquias en su perfil el cantoral le
 * salía sin marcar y desaparecía de la casa del coro invitado — que es exactamente lo
 * que pasaba el 23-sep-2026 con el cantoral del 11 de octubre en Valdivia de Paine.
 */
export function invitacionQueMarca(
  invitaciones: ChoirInvitation[],
  parroquiasPropias: string[],
  fecha: string,
  anfitriona: string,
): ChoirInvitation | undefined {
  const dia = (fecha ?? '').slice(0, 10);
  const host = (anfitriona ?? '').trim();
  if (!dia || !host) return undefined;
  const madres = parroquiasMadre(parroquiasPropias);
  if (madres.length === 0) return undefined;
  return invitaciones.find((i) => (
    i.date === dia
    && estadoInvitacion(i) === 'aceptada'
    && (i.hostParish ?? '').trim() === host
    && madres.some((m) => esParaMiCoro(i.guestParish, m))
  ));
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

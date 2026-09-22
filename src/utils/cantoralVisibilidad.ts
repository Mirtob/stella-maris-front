/**
 * De quién es un cantoral publicado — las reglas puras.
 *
 * Normalmente un cantoral es de UNA parroquia y lo ve quien está en ella. La excepción
 * es el coro invitado: el coro de Pirque canta la fiesta patronal de Valdivia de Paine
 * y publica el cantoral allá. Ese cantoral tiene DOS casas:
 *
 *   · Valdivia de Paine (la anfitriona) — su coro Y su pueblo fiel, como cualquier
 *     cantoral de su parroquia: es la Misa a la que van a ir.
 *   · Pirque (el coro invitado) — SOLO el perfil Coro. El pueblo fiel de Pirque ese
 *     domingo va a su propia Misa, con su propio cantoral; mostrarle el de Valdivia
 *     sería mandarlo a la iglesia equivocada.
 *
 * Antes el cantoral desaparecía de Pirque por completo: el coro que lo armó no podía
 * abrirlo desde su propia parroquia.
 *
 * Ver utils/choirInvitations (quién es "mi coro") y la migración
 * 20260922_cantoral_coro_invitado.
 */
import { esParaMiCoro, parroquiasMadre } from './choirInvitations';

/** Lo mínimo que hace falta saber de un cantoral para decidir quién lo ve. */
export interface CantoralConDuenos {
  parishName: string;
  /** Parroquia/capilla del coro invitado, si se publicó en casa ajena. */
  guestChoirParish?: string;
}

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();

/** ¿El cantoral es de la unidad (parroquia o capilla) en la que estoy? */
export function esDeMiParroquia(c: CantoralConDuenos, unidadActiva?: string): boolean {
  const mia = norm(unidadActiva);
  return !!mia && norm(c.parishName) === mia;
}

/**
 * ¿Lo armó MI coro como invitado en otra parroquia?
 *
 * Se compara contra la parroquia MADRE (una capilla del coro invitado cuenta) y en los
 * dos sentidos, igual que la invitación: ver `esParaMiCoro`.
 */
export function esDeMiCoroInvitado(c: CantoralConDuenos, unidadActiva?: string): boolean {
  const invitado = (c.guestChoirParish ?? '').trim();
  if (!invitado) return false;
  return parroquiasMadre(unidadActiva ? [unidadActiva] : []).some((m) => esParaMiCoro(invitado, m));
}

/**
 * ¿Este usuario ve este cantoral?
 *
 * `esCoro` es el rol EFECTIVO (el de la sesión, no el permanente): quien está de visita
 * en otra parroquia actúa como pueblo fiel, y entonces solo ve lo de la casa donde está.
 */
export function cantoralVisiblePara(
  c: CantoralConDuenos,
  opciones: { unidadActiva?: string; esCoro: boolean },
): boolean {
  if (esDeMiParroquia(c, opciones.unidadActiva)) return true;
  return opciones.esCoro && esDeMiCoroInvitado(c, opciones.unidadActiva);
}

/**
 * ¿Hay que decir en la tarjeta que se canta en otra parroquia?
 *
 * Solo en la casa del coro invitado: en Valdivia el cantoral es el suyo y no necesita
 * aclaración; en Pirque, sin este aviso, parecería un cantoral de Pirque con la
 * parroquia mal escrita.
 */
export function esCantoralDeSalida(c: CantoralConDuenos, unidadActiva?: string): boolean {
  return !esDeMiParroquia(c, unidadActiva) && esDeMiCoroInvitado(c, unidadActiva);
}

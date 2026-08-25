/**
 * Ir de visita a otra parroquia.
 *
 * Un miembro del coro o del pueblo fiel viaja, va a la Misa Crismal en la catedral,
 * pasa por la parroquia de la familia en otra diócesis. Quiere ver el cantoral de
 * ESA Misa sin que su perfil cambie: sigue siendo del coro de su parroquia.
 *
 * De ahí la regla: la visita es de SESIÓN. Se cambia `activeParishName` a una
 * parroquia que no está en el perfil, y de ahí se deduce todo lo demás — no hace
 * falta guardar un "modo visita" que después haya que apagar a mano.
 *
 * Mientras dura la visita se actúa como Pueblo fiel: publicar y editar cantorales
 * es cosa del coro de casa (y la RLS del servidor lo bloquea igual), así que no
 * tiene sentido ofrecer botones que van a fallar.
 */
import type { UserProfile, UserRole } from '../types';
import { splitActiveParish } from './parish';

/** Las parroquias del perfil (tolera perfiles antiguos con solo `parishName`). */
export function parroquiasDelPerfil(profile: Pick<UserProfile, 'parishes' | 'parishName'>): string[] {
  if (profile.parishes && profile.parishes.length > 0) return profile.parishes;
  return profile.parishName ? [profile.parishName] : [];
}

/**
 * ¿La parroquia activa es ajena al perfil?
 *
 * Una CAPILLA de una parroquia propia no es visita: el perfil guarda la parroquia
 * madre y la capilla se elige al entrar. Por eso se compara por parroquia madre.
 */
export function esVisita(profile: Pick<UserProfile, 'parishes' | 'parishName' | 'activeParishName' | 'role'>): boolean {
  const activa = (profile.activeParishName ?? '').trim();
  if (!activa) return false;
  // El Administrador no tiene parroquia: su alcance es global, nunca está "de visita".
  if (profile.role === 'Admin') return false;
  const propias = parroquiasDelPerfil(profile);
  if (propias.length === 0) return false;
  const madre = splitActiveParish(activa).parishFull;
  return !propias.some(p => splitActiveParish(p).parishFull === madre);
}

/**
 * Rol con el que se opera de verdad. De visita, cualquiera es Pueblo fiel.
 * Fuera de visita manda lo elegido en la sesión y, si no, el rol permanente.
 */
export function rolEfectivo(
  profile: Pick<UserProfile, 'parishes' | 'parishName' | 'activeParishName' | 'role' | 'activeRole'>,
): UserRole {
  if (esVisita(profile)) return 'Pueblo fiel';
  return profile.activeRole || profile.role;
}

/** Cuántas visitas recientes se recuerdan para volver en un toque. */
export const MAX_VISITAS_RECIENTES = 3;

/**
 * Agrega una parroquia visitada al principio de la lista de recientes, sin
 * repetirla y sin dejar crecer la lista. Las propias no se guardan: para esas
 * ya está el conmutador normal del menú.
 */
export function recordarVisita(
  recientes: string[] | undefined,
  parroquia: string,
  propias: string[],
): string[] {
  const limpia = (parroquia ?? '').trim();
  if (!limpia) return recientes ?? [];
  const madre = splitActiveParish(limpia).parishFull;
  if (propias.some(p => splitActiveParish(p).parishFull === madre)) return recientes ?? [];
  return [limpia, ...(recientes ?? []).filter(p => p !== limpia)].slice(0, MAX_VISITAS_RECIENTES);
}

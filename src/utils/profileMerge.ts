/**
 * Qué manda cuando el perfil del servidor y el del teléfono no coinciden.
 *
 * Lo **permanente** (rol, nombre, parroquias, instrumento, voz) lo administra el admin
 * desde su panel y vive en `user_profiles`. Lo de la **sesión** (con qué rol y en qué
 * parroquia entras hoy) es de este dispositivo y no existe en la base.
 *
 * Antes el arranque usaba la copia local y encima la subía tal cual: un cambio de rol
 * hecho por el admin no llegaba nunca al usuario y, peor, se revertía solo la próxima
 * vez que esa persona abría la app. Por eso aquí manda el servidor.
 */
import { UserProfile } from '../types';

export function mergeProfile(remoto: UserProfile, local: UserProfile): UserProfile {
  const cambioElRol = remoto.role !== local.role;
  return {
    ...remoto,
    // Elección de sesión: vive solo en el dispositivo.
    activeParishName: local.activeParishName,
    lastSessionParish: local.lastSessionParish,
    // Si el admin cambió el rol, la elección anterior ya no vale: que vuelva a elegir
    // (un Pueblo fiel ascendido a Coro tiene que poder entrar como Coro).
    activeRole: cambioElRol ? undefined : local.activeRole,
    lastSessionRole: cambioElRol ? undefined : local.lastSessionRole,
  };
}

/** Sin acentos, minúsculas, espacios colapsados — para comparar nombres escritos a mano. */
const normNombre = (s?: string): string =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Ids de las fichas que parecen de la MISMA persona: mismo nombre, o mismo correo de
 * recuperación. Pasa cuando alguien se registra dos veces (una con Google y otra con
 * usuario/clave), y quedan dos fichas —cada una con su parroquia— que desde el panel
 * parecen usuarios distintos.
 *
 * Se marcan, no se borran: cuál se queda lo decide el administrador.
 */
export function idsDuplicados(
  users: Pick<UserProfile, 'id' | 'name' | 'recoveryEmail'>[],
): Set<string> {
  const porClave = new Map<string, string[]>();
  for (const u of users) {
    const claves = [
      normNombre(u.name) ? `nombre:${normNombre(u.name)}` : null,
      u.recoveryEmail ? `correo:${u.recoveryEmail.trim().toLowerCase()}` : null,
    ].filter((k): k is string => !!k);
    for (const k of claves) porClave.set(k, [...(porClave.get(k) ?? []), u.id]);
  }
  const marcados = new Set<string>();
  for (const ids of porClave.values()) {
    if (ids.length > 1) ids.forEach(id => marcados.add(id));
  }
  return marcados;
}

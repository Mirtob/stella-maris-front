/**
 * A dónde lleva el botón "atrás" del teléfono dentro de la app.
 *
 * Reportado el 5-sep-2026: pulsar atrás en el teléfono o la tablet SACABA de la app.
 * La causa es que la app cambia de pantalla con estado propio y nunca tocaba el
 * historial del navegador: para el teléfono, la app era una sola página, y atrás
 * significaba salir de ella.
 *
 * La decisión se escribe aquí, aparte, porque es una regla —qué es "volver" en cada
 * pantalla— y no depende de React ni del navegador. Así se puede probar sola.
 */

/** Lo mínimo que hace falta saber de la pantalla actual para decidir. */
export interface PantallaActual {
  /** 'app', 'player', 'playlist', 'settings', 'install', 'terms'… */
  screen: string;
  /** Solo en 'app': la vista dentro del armazón ('main', 'cantorals', 'history'…). */
  view?: string;
  /** En las sub-pantallas: la vista a la que hay que volver. */
  returnView?: string;
  /** ¿Hay una capa abierta encima (Modo Atril, un visor a pantalla completa)? */
  hayCapaAbierta?: boolean;
}

export type Destino =
  /** Cerrar la capa que está encima; la pantalla de abajo no cambia. */
  | { tipo: 'cerrar-capa' }
  /** Ir a una vista del armazón. */
  | { tipo: 'vista'; vista: string }
  /** No hay a dónde volver: la siguiente pulsación debe salir de la app. */
  | { tipo: 'salir' };

/** La vista raíz: desde aquí, atrás sale de la app. */
export const VISTA_RAIZ = 'main';

/**
 * Pantallas que NO son parte de la navegación normal y donde atrás no debe hacer nada
 * raro: si el teléfono va atrás en el login o mientras carga, que salga sin más.
 */
const SIN_VUELTA = new Set(['loading', 'login', 'callback', 'onboarding', 'profile-setup']);

/**
 * Qué debe pasar al pulsar atrás.
 *
 * El orden importa y es el que espera cualquiera que use un teléfono: primero se cierra
 * lo que está encima, después se sube un nivel, y solo al final se sale.
 */
export function destinoAlVolver(p: PantallaActual): Destino {
  // 1) Una capa abierta se cierra antes que nada. Estando en el Modo Atril, atrás
  //    significa "cierra el atril", no "sácame del cantoral".
  if (p.hayCapaAbierta) return { tipo: 'cerrar-capa' };

  if (SIN_VUELTA.has(p.screen)) return { tipo: 'salir' };

  // 2) Las sub-pantallas (reproductor, lista, ajustes) saben de dónde vinieron.
  if (p.returnView) return { tipo: 'vista', vista: p.returnView };

  // 3) Pantallas completas que cuelgan de la app: vuelven a la raíz.
  //    (install/terms/privacy tienen su propio `returnTo`, que resuelve quien llama;
  //     si llegan aquí sin él, es porque se abrieron desde un enlace directo.)
  if (p.screen !== 'app') return { tipo: 'vista', vista: VISTA_RAIZ };

  // 4) Dentro del armazón: cualquier vista vuelve a la raíz; la raíz, sale.
  if (p.view && p.view !== VISTA_RAIZ) return { tipo: 'vista', vista: VISTA_RAIZ };
  return { tipo: 'salir' };
}

/**
 * Registro de capas abiertas (Modo Atril y demás pantallas completas que viven DENTRO
 * de una vista). Cada una se apunta mientras está abierta y se borra al cerrarse.
 *
 * Hace falta un registro porque esas capas no son rutas: son estado de un componente
 * hijo, y App no puede saber desde fuera que están abiertas.
 */
const capas: Array<() => void> = [];

/** Apunta una capa abierta. Devuelve la función para darla de baja al cerrarse. */
export function registrarCapa(cerrar: () => void): () => void {
  capas.push(cerrar);
  return () => {
    const i = capas.indexOf(cerrar);
    if (i !== -1) capas.splice(i, 1);
  };
}

export function hayCapaAbierta(): boolean {
  return capas.length > 0;
}

/** Cierra la capa de más arriba. `false` si no había ninguna. */
export function cerrarCapaDeArriba(): boolean {
  const cerrar = capas.pop();
  if (!cerrar) return false;
  cerrar();
  return true;
}

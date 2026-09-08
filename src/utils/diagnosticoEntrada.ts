/**
 * Qué contar cuando alguien se queda atascado al entrar.
 *
 * El 8-sep-2026 un usuario no podía entrar desde su teléfono mientras su tablet
 * funcionaba. La causa era una renovación de token que se quedaba colgada, y lo peor
 * fue esto: **no dejaba ni rastro**. No era un error —era silencio—, así que ni el
 * usuario ni el sistema de errores tenían nada que mirar. Nos enteramos porque él lo
 * dijo; nadie sabe cuánta gente lo sufrió y simplemente cerró la app.
 *
 * Esto recoge el contexto MÍNIMO para responder a "¿cuánto pasa y a quién?" sin
 * identificar a nadie: nada de correos, nombres ni parroquias. Solo la forma del
 * aparato y de la red, que es lo que explica el fenómeno.
 */

export interface EntornoDeEntrada {
  /** 'ios' | 'android' | 'otro' — deducido del user agent, sin más detalle. */
  plataforma: string;
  /** ¿Se abrió como app instalada o desde el navegador? */
  instalada: boolean;
  /** Lo que el navegador cree de la red: '4g', '3g', '2g', 'slow-2g'… */
  conexion: string;
  /** ¿El navegador se declara conectado? */
  enLinea: boolean;
  /** 'visible' | 'hidden': si estaba en segundo plano, la red suele estar dormida. */
  visibilidad: string;
}

/** Cada lectura va protegida: esto corre justo cuando algo ya va mal. */
function seguro<T>(leer: () => T, siFalla: T): T {
  try {
    const v = leer();
    return v === undefined || v === null ? siFalla : v;
  } catch {
    return siFalla;
  }
}

export function entornoDeEntrada(): EntornoDeEntrada {
  const ua = seguro(() => navigator.userAgent, '');
  const plataforma = /iphone|ipad|ipod/i.test(ua) ? 'ios'
    : /android/i.test(ua) ? 'android'
    : 'otro';

  return {
    plataforma,
    instalada: seguro(() => window.matchMedia('(display-mode: standalone)').matches, false)
      || seguro(() => (navigator as any).standalone === true, false),
    conexion: seguro(() => String((navigator as any).connection?.effectiveType ?? ''), '') || 'desconocida',
    enLinea: seguro(() => navigator.onLine, true),
    visibilidad: seguro(() => document.visibilityState, 'desconocida'),
  };
}

/** Motivos por los que la entrada se atasca. Se separan para poder contarlos aparte. */
export type MotivoAtasco =
  /** Leer la sesión guardada tardó más de la cuenta (renovación de token colgada). */
  | 'sesion-lenta'
  /** El arranque entero no terminó: saltó el vigilante. */
  | 'arranque-colgado';

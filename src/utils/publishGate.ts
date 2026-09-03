import { getLiturgicalDateForDate } from './liturgicalCalendar';
import { getTodayLocal } from './dateLocal';

/**
 * Qué hace falta para poder publicar un cantoral, y qué falta cuando no se puede.
 *
 * Vive aquí, fuera del componente, porque un fallo en esto no se ve: el botón se queda
 * gris y ya. Fue exactamente lo que pasó en la primera semana de lanzamiento — un coro
 * armaba su cantoral y no podía publicarlo, sin ningún mensaje.
 */

/**
 * La celebración con la que ABRE el menú de publicación, según la fecha elegida en el
 * constructor.
 *
 * No es un detalle: publicar EXIGE una celebración, y cuando los datos vienen del
 * constructor el menú ya no muestra el campo para escribirla (enseña un resumen). Si
 * esto devuelve vacío para un domingo normal, el botón queda muerto y no hay forma de
 * arreglarlo desde esa pantalla.
 */
export function celebracionInicial(fecha?: string): string {
  return getLiturgicalDateForDate(fecha || getTodayLocal()) || '';
}

export interface EstadoPublicacion {
  /** Cuántos cantos lleva el cantoral. */
  cantos: number;
  publicando: boolean;
  /** Modo multi-parroquia (el perfil tiene más de una). */
  multi: boolean;
  /** Solo modo una parroquia. */
  fecha?: string;
  horario?: string;
  celebracion?: string;
  /** Solo modo multi: parroquias marcadas y su horario. */
  parroquiasMarcadas?: string[];
  horarioPorParroquia?: Record<string, { date?: string; liturgicalDate?: string; massTime?: string } | undefined>;
}

/**
 * Por qué no se puede publicar todavía, o `null` si sí se puede.
 *
 * Devolver el MOTIVO y no un booleano es deliberado: un botón gris que no explica nada
 * es una pared, y quien la encuentra no puede saber si le falta un canto, una parroquia
 * o la celebración.
 */
export function motivoParaNoPublicar(e: EstadoPublicacion): string | null {
  if (e.publicando) return null;
  if (e.cantos === 0) return 'Agrega al menos un canto antes de publicar.';

  if (e.multi) {
    const marcadas = e.parroquiasMarcadas ?? [];
    if (marcadas.length === 0) return 'Marca al menos una parroquia.';
    const incompleta = marcadas.find((p) => {
      const h = e.horarioPorParroquia?.[p];
      return !h || !h.date || !h.liturgicalDate || !h.massTime;
    });
    if (incompleta) return `Falta la fecha, la celebración o el horario de ${incompleta}.`;
    return null;
  }

  if (!e.fecha) return 'Falta la fecha de la Misa.';
  if (!e.horario) return 'Falta el horario de la Misa.';
  if (!e.celebracion) return 'Falta la celebración de esta fecha. Agrégala aquí abajo y podrás publicar.';
  return null;
}

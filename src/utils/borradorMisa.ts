/**
 * Los datos de la Misa que se está armando, guardados entre visita y visita.
 *
 * El constructor se cierra por accidente todo el tiempo: se sale a mirar el calendario,
 * se toca "atrás", se recarga la página en el teléfono. Hasta ahora, al volver, la
 * fecha, la hora y —sobre todo— el LUGAR donde se canta volvían a cero, y el coro se
 * quedaba armando un cantoral sin saber para dónde iba. Eso importa el doble desde que
 * un coro puede estar armando el cantoral de OTRA parroquia, la que lo invitó.
 *
 * Los cantos elegidos no se guardan aquí: viven en el estado de la app mientras dura la
 * sesión. Esto es solo el encabezado de la Misa, que es lo que se perdía al desmontar
 * el constructor.
 *
 * Se guarda en el navegador (localStorage), así que es por dispositivo y por persona.
 */
import type { MassType } from '../types';

export interface DatosDeLaMisa {
  /** 'YYYY-MM-DD' — la fecha de la CELEBRACIÓN. */
  fecha: string;
  /** 'HH:MM' de 24 h, como lo usa el <select> del constructor. */
  hora: string;
  tipo: MassType;
  /** Dónde se canta: parroquia o capilla. Vacío = la parroquia activa. */
  destino?: string;
}

export const CLAVE_BORRADOR_MISA = 'stellamaris.constructor.misa.v1';

const esFecha = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const esHora = (v: unknown): v is string => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v);
const esTipo = (v: unknown): v is MassType =>
  v === 'dia' || v === 'visperas_i' || v === 'visperas_ii';

/**
 * Lee lo guardado, o `null` si no sirve.
 *
 * No sirve: lo que no se puede leer, lo que no tiene forma de datos de Misa, y lo de
 * una Misa que YA PASÓ. Reabrir el constructor en el domingo del mes pasado confunde
 * más que empezar en blanco; y una fecha vieja arrastra consigo el permiso de una
 * invitación que ya se apagó.
 */
export function parseDatosDeLaMisa(raw: string | null | undefined, hoy: string): DatosDeLaMisa | null {
  if (!raw) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object') return null;
  const d = obj as Record<string, unknown>;
  if (!esFecha(d.fecha) || !esHora(d.hora) || !esTipo(d.tipo)) return null;
  // Una Misa de I Vísperas se canta la tarde ANTERIOR, así que el día de la celebración
  // todavía cuenta como futuro. Comparar contra `hoy` a secas ya lo respeta.
  if (d.fecha < hoy) return null;
  const destino = typeof d.destino === 'string' ? d.destino.trim() : '';
  return { fecha: d.fecha, hora: d.hora, tipo: d.tipo, destino: destino || undefined };
}

/** Lo guardado en este navegador, o `null`. `hoy` en formato 'YYYY-MM-DD'. */
export function leerDatosDeLaMisa(hoy: string): DatosDeLaMisa | null {
  try {
    return parseDatosDeLaMisa(localStorage.getItem(CLAVE_BORRADOR_MISA), hoy);
  } catch {
    // localStorage no disponible (modo privado en iOS): se sigue sin recordar nada.
    return null;
  }
}

export function guardarDatosDeLaMisa(datos: DatosDeLaMisa): void {
  try {
    localStorage.setItem(CLAVE_BORRADOR_MISA, JSON.stringify(datos));
  } catch {
    /* sin localStorage no se recuerda, y no es motivo para romper el constructor */
  }
}

/** Se olvida al publicar: lo que quedó publicado ya no es un borrador. */
export function olvidarDatosDeLaMisa(): void {
  try {
    localStorage.removeItem(CLAVE_BORRADOR_MISA);
  } catch {
    /* ídem */
  }
}

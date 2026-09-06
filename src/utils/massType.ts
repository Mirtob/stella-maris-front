import { MassType } from '../types';

/**
 * Tipos de horario litúrgico para domingos y solemnidades de precepto:
 *  - I Vísperas: tarde del día ANTERIOR (15:00–23:59).
 *  - Misa del día: mismo día, 00:00–15:00.
 *  - II Vísperas: mismo día, 15:01–23:59.
 */

export const MASS_TYPE_LABEL: Record<MassType, string> = {
  visperas_i: 'I Vísperas',
  dia: 'Misa del día',
  visperas_ii: 'II Vísperas',
};

/**
 * Texto de ayuda: CUÁNDO se celebra cada tipo. Es una guía para elegir bien, no una
 * regla — una Misa de aniversario un sábado a las 18:00 es "Misa del día" aunque sea
 * de tarde. La vigencia del cantoral NO sale de aquí: se calcula con la hora real de
 * la Misa (ver más abajo).
 */
export const MASS_TYPE_RANGE: Record<MassType, string> = {
  visperas_i: 'La tarde del día anterior',
  dia: 'El mismo día de la celebración',
  visperas_ii: 'La tarde del mismo día',
};

/** Horarios sugeridos por tipo (formato canónico 'HH:MM AM/PM'). */
export const MASS_TIME_BY_TYPE: Record<MassType, string[]> = {
  dia: ['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'],
  visperas_i: ['04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'],
  visperas_ii: ['04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'],
};

/** Tipo efectivo de un cantoral (con fallback al campo legacy `vigil`). */
export function resolveMassType(c: { massType?: MassType; vigil?: boolean }): MassType {
  if (c.massType) return c.massType;
  return c.vigil ? 'visperas_i' : 'dia';
}

/** Etiqueta corta para badges (la "Misa del día" no necesita badge). */
export function massTypeBadge(c: { massType?: MassType; vigil?: boolean }): string | null {
  const t = resolveMassType(c);
  return t === 'dia' ? null : MASS_TYPE_LABEL[t];
}

// ──────────────────────────────────────────────────────────────────────────
// Ventana de vigencia: hasta cuándo un cantoral sigue a la vista antes de irse
// al historial.
//
// La regla es UNA y mira la hora de la Misa: **hasta 4 horas después de que empieza**.
//
// Antes no miraba la hora en absoluto: la "Misa del día" cerraba a las 15:00 fijas,
// vinieran de donde vinieran. Un cantoral publicado para una Misa de las 18:00 —una
// Misa de aniversario, un sábado por la tarde— desaparecía a las 15:00, TRES HORAS
// ANTES de empezar, y el coro se quedaba sin cantoral en plena celebración.
// Reportado el 6-sep-2026.
//
// Cuatro horas dan de sobra para la Misa y para lo que venga después sin que el
// cantoral se quede semanas ocupando la pantalla.
// ──────────────────────────────────────────────────────────────────────────

type CantoralLike = { date: string; massType?: MassType; vigil?: boolean; massTime?: string };

const ymd = (date: string): [number, number, number] => {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d];
};

/** Horas que un cantoral sigue vigente después de que empieza su Misa. */
export const HORAS_VIGENTE_TRAS_LA_MISA = 4;

/**
 * Momento exacto en que empieza la Misa (día + hora local).
 *
 * El día NO es siempre `date`: en I Vísperas la Misa se canta la tarde ANTERIOR a la
 * celebración. `null` si no se puede saber la hora, para que quien llame decida.
 */
export function inicioDeLaMisa(c: CantoralLike): Date | null {
  const hhmm = massTimeTo24h(c.massTime ?? '');
  if (!hhmm) return null;
  const [y, m, d] = ymd(fechaEnQueSeCanta(c));
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

/** Inicio de la ventana de vigencia (Date local). */
export function cantoralWindowStart(c: CantoralLike): Date {
  const [y, m, d] = ymd(fechaEnQueSeCanta(c));
  // Desde el comienzo del día en que se canta: quien va a la Misa de las 8 tiene que
  // poder abrir el cantoral al levantarse.
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Fin de la ventana de vigencia (Date local). */
export function cantoralWindowEnd(c: CantoralLike): Date {
  const inicio = inicioDeLaMisa(c);
  if (inicio) {
    // Se suman horas REALES, no números de reloj: la noche en que entra o sale el
    // horario de verano, `setHours(+4)` daría 3 o 5 horas de verdad. En Chile el
    // cambio cae de madrugada, justo cuando puede estar corriendo la ventana de una
    // Misa de la tarde-noche.
    return new Date(inicio.getTime() + HORAS_VIGENTE_TRAS_LA_MISA * 60 * 60 * 1000);
  }
  // Sin hora legible no se adivina: se deja hasta el final del día en que se canta.
  // Es preferible que sobre a que un cantoral se esfume en mitad de la Misa.
  const [y, m, d] = ymd(fechaEnQueSeCanta(c));
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

/** ¿La Misa ya pasó? (ahora superó el fin de su ventana). */
export function cantoralYaPaso(c: CantoralLike, now: Date = new Date()): boolean {
  return now.getTime() > cantoralWindowEnd(c).getTime();
}

/** ¿Está activa AHORA mismo? (dentro de [inicio, fin]). */
export function cantoralActivoAhora(c: CantoralLike, now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= cantoralWindowStart(c).getTime() && t <= cantoralWindowEnd(c).getTime();
}

/**
 * La fecha del CALENDARIO en que se canta esta Misa.
 *
 * `date` guarda siempre la fecha de la CELEBRACIÓN, no la del día en que se canta, y
 * para I Vísperas no son la misma: el sábado 5 de septiembre por la tarde se canta el
 * 23.º Domingo del Tiempo Ordinario, que es el domingo 6. La celebración es la del
 * domingo; el día es el sábado.
 *
 * Esa diferencia hay que respetarla al MOSTRAR la fecha —el folleto de esa Misa decía
 * "domingo 6 de septiembre" para una Misa del sábado— pero NO al resolver nada
 * litúrgico: el salmo, el ciclo, el tiempo y el color se sacan de `date`, que es la
 * fecha de la celebración. Reportado el 5-sep-2026.
 */
export function fechaEnQueSeCanta(c: CantoralLike): string {
  const [y, m, d] = ymd(c.date);
  const dia = new Date(y, m - 1, resolveMassType(c) === 'visperas_i' ? d - 1 : d);
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${dia.getFullYear()}-${p2(dia.getMonth() + 1)}-${p2(dia.getDate())}`;
}

// ──────────────────────────────────────────────────────────────────────────
// Conversión del horario de la Misa.
//
// La BD guarda 'HH:MM AM/PM' y el <input type="time"> del constructor usa 'HH:MM' de
// 24 h. Al editar un cantoral publicado hay que ir de lo primero a lo segundo, y antes
// no se hacía: el constructor arrancaba siempre en las 10:00 y el horario real se
// perdía sin avisar.
// ──────────────────────────────────────────────────────────────────────────

/** 'HH:MM AM/PM' → 'HH:MM' de 24 h. `null` si el texto no tiene esa forma. */
export function massTimeTo24h(raw: string): string | null {
  const m = (raw || '').trim().toUpperCase().replace(/\s+/g, ' ').match(/^(\d{1,2}):(\d{2})(?: (AM|PM))?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const minutos = m[2];
  const periodo = m[3];
  if (periodo === 'PM' && h < 12) h += 12;
  if (periodo === 'AM' && h === 12) h = 0;   // 12 AM = medianoche
  if (h > 23 || Number(minutos) > 59) return null;
  return `${String(h).padStart(2, '0')}:${minutos}`;
}

/** 'HH:MM' de 24 h → 'HH:MM AM/PM' (el formato que se guarda). */
export function massTimeTo12h(hhmm: string): string {
  const [h, m] = (hhmm || '10:00').split(':').map(Number);
  const periodo = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${periodo}`;
}

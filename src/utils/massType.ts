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

/** Texto de ayuda del rango horario de cada tipo. */
export const MASS_TYPE_RANGE: Record<MassType, string> = {
  visperas_i: 'Día anterior · 15:00 a 23:59',
  dia: 'Mismo día · 00:00 a 15:00',
  visperas_ii: 'Mismo día · 15:01 a 23:59',
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
// Ventana de vigencia (fecha + HORA local) según el tipo de Misa.
// `date` es SIEMPRE la fecha propia de la celebración (la que elige el usuario).
//   · I Vísperas  → el DÍA ANTERIOR a la celebración, 15:00 a 23:59.
//   · Misa del día → la fecha de la celebración, 00:00 a 15:00.
//   · II Vísperas → la fecha de la celebración, 15:01 a 23:59.
// Aplica igual a domingos y a solemnidades agregadas manualmente.
// ──────────────────────────────────────────────────────────────────────────

type CantoralLike = { date: string; massType?: MassType; vigil?: boolean };

const ymd = (date: string): [number, number, number] => {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d];
};

/** Inicio de la ventana de vigencia (Date local). */
export function cantoralWindowStart(c: CantoralLike): Date {
  const [y, m, d] = ymd(c.date);
  switch (resolveMassType(c)) {
    // I Vísperas se canta la tarde del día anterior a la celebración (d - 1).
    case 'visperas_i':  return new Date(y, m - 1, d - 1, 15, 0, 0, 0);
    case 'visperas_ii': return new Date(y, m - 1, d, 15, 1, 0, 0);
    case 'dia':
    default:            return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
}

/** Fin de la ventana de vigencia (Date local). */
export function cantoralWindowEnd(c: CantoralLike): Date {
  const [y, m, d] = ymd(c.date);
  switch (resolveMassType(c)) {
    // I Vísperas: hasta las 23:59 del día anterior a la celebración.
    case 'visperas_i':  return new Date(y, m - 1, d - 1, 23, 59, 59, 999);
    // Misa del día: cierra a las 15:00 (cede a II Vísperas).
    case 'dia':         return new Date(y, m - 1, d, 15, 0, 59, 999);
    case 'visperas_ii':
    default:            return new Date(y, m - 1, d, 23, 59, 59, 999);
  }
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

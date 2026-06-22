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

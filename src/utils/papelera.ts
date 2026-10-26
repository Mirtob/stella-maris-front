/**
 * Reglas puras de la papelera y del registro de cambios (ver services/papelera.ts y la
 * migración 20261028_papelera_y_registro). Viven aquí y no en el servicio para que se
 * puedan probar sin abrir el cliente de Supabase.
 */

/** Días que un cantoral borrado queda en la papelera. Debe calzar con la migración. */
export const DIAS_PAPELERA = 30;

/** Días que le quedan en la papelera antes de purgarse (0 = hoy). */
export function diasRestantes(borradoEn: string, ahora: Date = new Date()): number {
  const t = Date.parse(borradoEn);
  if (!Number.isFinite(t)) return DIAS_PAPELERA;
  const vence = t + DIAS_PAPELERA * 86_400_000;
  return Math.max(0, Math.ceil((vence - ahora.getTime()) / 86_400_000));
}

/** Nombre en castellano de cada columna que puede aparecer en `detalle`. */
const CAMPOS: Record<string, string> = {
  songs: 'cantos',
  date: 'fecha',
  mass_time: 'hora',
  mass_type: 'tipo de Misa',
  vigil: 'tipo de Misa',
  liturgical_date: 'celebración',
  parish_name: 'parroquia',
  choir_name: 'coro',
  status: 'estado',
  garland: 'decoración del folleto',
  pdf_font: 'letra del folleto',
  pdf_size: 'tamaño del folleto',
  published_by: 'firma',
  guest_choir_parish: 'coro invitado',
};

/** "songs,mass_time,vigil" → ['cantos', 'hora', 'tipo de Misa']. Lo técnico se omite. */
export function camposLegibles(detalle: string | null | undefined): string[] {
  if (!detalle) return [];
  const out = detalle.split(',').map((k) => CAMPOS[k.trim()]).filter((x): x is string => !!x);
  return Array.from(new Set(out));
}

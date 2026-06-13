/**
 * Helpers para el nombre combinado de parroquia.
 *
 * En la app, `parishName` suele venir como "Parroquia - Capilla"
 * (p. ej. "San José - Capilla del Carmen"). No existe un campo separado de
 * capilla, así que esta función centraliza el split que antes estaba disperso
 * como `parishName.split(' - ')[0]` en varios componentes.
 */

export interface ParishChapel {
  parish: string;
  chapel?: string;
}

/**
 * Separa "Parroquia - Capilla" en sus partes. Usa el PRIMER " - " como
 * separador (una capilla con guiones en el nombre queda intacta).
 * Tolerante a undefined/whitespace.
 */
export function parseParishChapel(parishName?: string | null): ParishChapel {
  const raw = (parishName ?? '').trim();
  if (!raw) return { parish: '' };

  const idx = raw.indexOf(' - ');
  if (idx === -1) return { parish: raw };

  const parish = raw.slice(0, idx).trim();
  const chapel = raw.slice(idx + 3).trim();
  return chapel ? { parish, chapel } : { parish };
}

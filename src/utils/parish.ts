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

// ===========================================================================
// Capilla como unidad de "parroquia activa"
// ===========================================================================
//
// Una capilla seleccionada en la sesión se identifica con el string
// "<parishFull> · <Capilla>", donde parishFull es "<Parroquia> - <Diócesis>".
// El separador ' · ' (espacio + punto medio + espacio) no colisiona con ' - '.

export const CHAPEL_SEP = ' · ';

/** Construye el string de parroquia activa para una capilla. */
export function buildChapelParish(parishFull: string, chapelName: string): string {
  return `${parishFull.trim()}${CHAPEL_SEP}${chapelName.trim()}`;
}

/** Separa un string de parroquia activa en parroquia madre y (opcional) capilla. */
export function splitActiveParish(active?: string | null): { parishFull: string; chapel?: string } {
  const raw = (active ?? '').trim();
  if (!raw) return { parishFull: '' };
  const idx = raw.indexOf(CHAPEL_SEP);
  if (idx === -1) return { parishFull: raw };
  const parishFull = raw.slice(0, idx).trim();
  const chapel = raw.slice(idx + CHAPEL_SEP.length).trim();
  return chapel ? { parishFull, chapel } : { parishFull };
}

/**
 * Etiqueta legible de una unidad (parroquia o capilla). Para una capilla muestra
 * SIEMPRE su parroquia madre, de modo que dos capillas con el mismo nombre (en
 * parroquias distintas) se distingan: "Capilla San José · Parroquia X - Diócesis".
 */
export function formatActiveParishLabel(active?: string | null): string {
  const { parishFull, chapel } = splitActiveParish(active);
  if (!chapel) return parishFull;
  return `Capilla ${chapel} · ${parishFull}`;
}

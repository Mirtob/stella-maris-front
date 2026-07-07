import { PublishedCantoral } from '../types';

export interface PreviousUsage {
  /** Fecha (YYYY-MM-DD) del cantoral anterior. */
  date: string;
  /** Etiqueta amigable (celebración litúrgica o fecha) para el mensaje. */
  label: string;
  /** id base del canto → partes (categorías) en que se usó y su título. */
  byId: Record<string, { title: string; parts: string[] }>;
}

/** Quita el sufijo `::algo` que se añade a un canto usado en varias partes. */
const baseId = (id: string) => (id || '').split('::')[0];

/**
 * Uso de cantos en el cantoral PUBLICADO más reciente de la parroquia (la "semana
 * pasada"), para avisar al armar el nuevo y fomentar variedad. Excluye el que se está
 * editando. Devuelve null si no hay cantoral anterior.
 */
export function computePreviousUsage(
  cantorals: PublishedCantoral[],
  excludeId?: string | null,
): PreviousUsage | null {
  const prev = cantorals
    .filter((c) => c.status === 'published' && c.id !== excludeId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0];
  if (!prev) return null;

  const byId: PreviousUsage['byId'] = {};
  for (const s of prev.songs ?? []) {
    const id = baseId(s.id);
    if (!id) continue;
    if (!byId[id]) byId[id] = { title: s.title, parts: [] };
    if (s.category && !byId[id].parts.includes(s.category)) byId[id].parts.push(s.category);
  }
  return { date: prev.date, label: prev.liturgicalDate || prev.date, byId };
}

/** Uso previo de un canto por su id (tolera el sufijo `::parte`). */
export function previousUseOf(usage: PreviousUsage | null | undefined, songId: string) {
  if (!usage) return undefined;
  return usage.byId[baseId(songId)];
}

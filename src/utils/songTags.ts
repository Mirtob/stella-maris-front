/**
 * Etiquetas de canto — parte PURA (sin base de datos).
 *
 * Vive aparte de `services/songTags.ts` porque ese módulo abre el cliente de
 * Supabase al importarse: dejando aquí la lista por defecto y las comparaciones,
 * se pueden probar sin base de datos y las usa quien no necesita consultar nada.
 */

export interface SongTag {
  id: string;
  label: string;
  sortOrder: number;
}

/**
 * Lista por defecto: la misma que estaba escrita a mano en SongManager y que
 * siembra la migración `20260814_song_tags.sql`. Es el respaldo cuando la tabla
 * todavía no existe (las migraciones se aplican a mano en este proyecto) y el
 * estado inicial del editor, para que nunca aparezca sin etiquetas.
 * Mantenerla en sincronía con la semilla de esa migración.
 */
export const DEFAULT_SONG_TAGS: string[] = [
  // Tiempos litúrgicos
  'Adviento', 'Navidad', 'Tiempo Ordinario', 'Cuaresma',
  'Semana Santa', 'Pascua', 'Pentecostés', 'Corpus Christi',
  // Días y solemnidades
  'Miércoles de Ceniza', 'Domingo de Ramos', 'Jueves Santo', 'Viernes Santo',
  'Sábado Santo', 'Vigilia Pascual', 'Domingo de Resurrección',
  'Ascensión del Señor', 'Espíritu Santo', 'Cristo Rey', 'Asunción de la Virgen',
  'Inmaculada Concepción', 'Misa Crismal', 'Ordenaciones',
  // Celebraciones fuera del tiempo litúrgico
  'Funerales', 'Otros sacramentos', 'Fiestas patronales',
  // Temáticas
  'Sagrado Corazón', 'Virgen María', 'Santos', 'Gregoriano', 'Secuencias',
];

/** Las etiquetas por defecto en forma de filas (mismo tipo que las de la BD). */
export const defaultSongTagRows = (): SongTag[] =>
  DEFAULT_SONG_TAGS.map((label, i) => ({ id: `default-${i}`, label, sortOrder: (i + 1) * 10 }));

/**
 * ¿Esta fila viene de la base? Las de respaldo no se pueden renombrar ni borrar
 * (no existen como registro), y la UI las muestra con los botones inhabilitados.
 */
export const isPersistedTag = (tag: SongTag): boolean => !tag.id.startsWith('default-');

/** Normaliza para comparar: sin acentos, minúsculas, espacios colapsados. */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * ¿Ya existe una etiqueta equivalente? Evita terminar con "Funerales" y
 * "funerales" como dos chips distintos. `exceptId` excluye la etiqueta que se
 * está renombrando, que si no chocaría consigo misma.
 */
export function findDuplicate(tags: SongTag[], label: string, exceptId?: string): SongTag | undefined {
  const target = norm(label);
  return tags.find(t => t.id !== exceptId && norm(t.label) === target);
}

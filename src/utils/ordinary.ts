import { Song } from '../types';

/**
 * Partes del ordinario de la Misa que se cantan desde la partitura (no desde
 * letra/acordes). Incluye el Padre Nuestro (si se canta) y el Rito de Aspersión
 * (que en Pascua reemplaza al Kyrie). Fuente única para PDF y Modo Atril.
 */
export const ORDINARY_CATEGORIES = [
  'Kyrie',
  'Rito de Aspersión',
  'Gloria',
  'Santo',
  'Cordero de Dios',
  'Padre Nuestro',
] as const;

const SET = new Set<string>(ORDINARY_CATEGORIES as readonly string[]);

/** ¿Este canto es una parte del ordinario que debería mostrarse como partitura? */
export function isOrdinary(song: Pick<Song, 'category'> | null | undefined): boolean {
  return !!song && SET.has(song.category);
}

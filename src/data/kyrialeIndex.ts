/**
 * Las Misas del ordinario en gregoriano (Kyriale): Kyrie, Gloria, Santo y Cordero.
 *
 * Son cantos como cualquier otro —se eligen del mismo modo que una Misa en castellano—
 * con UNA regla propia: el Santo y el Cordero van siempre con el Kyrie de su Misa. No es
 * un capricho de la app, es cómo está escrito el libro: cada Misa del Kyriale es una
 * pieza de una sola melodía, y mezclar el Santo de una con el Kyrie de otra suena a dos
 * Misas pegadas. El GLORIA sí se puede cambiar, porque en la práctica se cambia: hay
 * Misas que no traen Gloria (en ferias, Adviento y Cuaresma no se canta) y es costumbre
 * tomarlo de otra.
 *
 * Los propios del día (introito, gradual, ofertorio, comunión) viven aparte, en
 * `gradualeIndex`: esos cambian cada domingo, y estos no.
 */
import { KYRIALE_DATA, PATER_NOSTER_DATA, type MisaKyriale,
         type TonoPaterNoster } from './kyrialeIndex.data';
import type { LibroGraduale } from './gradualeIndex';
import { LIBROS } from './gradualeIndex';

export type ParteKyriale = 'kyrie' | 'gloria' | 'sanctus' | 'agnus';

/** Qué parte del libro corresponde a cada parte del ordinario en la app. */
const PARTE_DE_LA_CATEGORIA: Record<string, ParteKyriale> = {
  'Kyrie': 'kyrie',
  'Gloria': 'gloria',
  'Santo': 'sanctus',
  'Cordero de Dios': 'agnus',
};

/** Las partes del ordinario que el Kyriale cubre, en el orden en que se cantan. */
export const CATEGORIAS_DEL_KYRIALE = Object.keys(PARTE_DE_LA_CATEGORIA);

/** La parte del libro que le toca a esa categoría de la app, si le toca alguna. */
export function parteKyrialeDe(categoria: string): ParteKyriale | null {
  return PARTE_DE_LA_CATEGORIA[categoria] ?? null;
}

/** Una Misa del Kyriale, ya identificada por su libro. */
export interface MisaDelKyriale extends MisaKyriale {
  libro: LibroGraduale;
  /** Cómo se llama en la app: "XI · Orbis factor" o, si no tiene nombre, sólo "XVI". */
  rotulo: string;
}

function rotuloDe(misa: MisaKyriale): string {
  return misa.nombre ? `${misa.numero} · ${misa.nombre}` : misa.numero;
}

/** Todas las Misas disponibles, Romanum primero. */
export function misasDelKyriale(): MisaDelKyriale[] {
  const salida: MisaDelKyriale[] = [];
  for (const libro of ['romanum', 'simplex'] as LibroGraduale[]) {
    for (const misa of Object.values(KYRIALE_DATA[libro]) as MisaKyriale[]) {
      salida.push({ ...misa, libro, rotulo: rotuloDe(misa) });
    }
  }
  return salida;
}

/** Una Misa concreta. `null` si no existe (por ejemplo, tras cambiar el índice). */
export function misaDelKyriale(libro: LibroGraduale, numero: string): MisaDelKyriale | null {
  const misa = (KYRIALE_DATA[libro] as Record<string, MisaKyriale>)[numero];
  return misa ? { ...misa, libro, rotulo: rotuloDe(misa) } : null;
}

/** Las Misas que traen Gloria: las únicas que sirven para reemplazarlo. */
export function misasConGloria(): MisaDelKyriale[] {
  return misasDelKyriale().filter((m) => m.partes.includes('gloria'));
}

/** Dónde vive la imagen ya recortada. La genera scripts/import-kyriale.py. */
export function kyrialeImageUrl(
  libro: LibroGraduale, numero: string, parte: ParteKyriale,
): string {
  return `/kyriale/${libro}/${numero}/${parte}.webp`;
}

/** De dónde sale, para el pie de la partitura. */
export function fuenteKyriale(misa: MisaDelKyriale): string {
  return `${LIBROS[misa.libro].nombre} · Misa ${misa.rotulo} · p. ${misa.pagina}`;
}

/** Cómo se llama cada parte en la app (el rótulo que ve el coro). */
export const CATEGORIA_DE_LA_PARTE: Record<ParteKyriale, string> = {
  kyrie: 'Kyrie',
  gloria: 'Gloria',
  sanctus: 'Santo',
  agnus: 'Cordero de Dios',
};

/**
 * Los tonos del Padre Nuestro.
 *
 * No es una Misa del Kyriale ni va atado a ella: el libro lo pone en el rito de comunion
 * y ofrece tres tonos completos, que se eligen aparte. Por eso no entra en la regla del
 * Santo y el Cordero.
 */
export function tonosDelPaterNoster(libro: LibroGraduale): readonly TonoPaterNoster[] {
  return PATER_NOSTER_DATA[libro] ?? [];
}

/** La imagen del tono. La genera scripts/import-kyriale.py. */
export function paterNosterImageUrl(libro: LibroGraduale, tono: string): string {
  return `/kyriale/${libro}/pater/${tono}.webp`;
}

/** De donde sale, para el pie de la partitura. */
export function fuentePaterNoster(libro: LibroGraduale, tono: TonoPaterNoster): string {
  return `${LIBROS[libro].nombre} · Padre Nuestro, tono ${tono.tono} · p. ${tono.pagina}`;
}

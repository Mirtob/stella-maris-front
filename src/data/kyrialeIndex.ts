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
import { KYRIALE_DATA, PATER_NOSTER_DATA, CREDO_DATA, AD_LIBITUM_DATA, type MisaKyriale,
         type TonoPaterNoster, type CredoKyriale, type PiezaAdLibitum } from './kyrialeIndex.data';
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
  /**
   * Cómo se llama en la app: «Misa XI, Orbis factor», o «Misa XVI» si no tiene nombre.
   * Las del Simplex dicen de qué libro son («Misa I del Simplex»): su numeración es
   * otra, y la Misa I del Simplex no es Lux et origo.
   */
  rotulo: string;
}

function rotuloDe(misa: MisaKyriale, libro: LibroGraduale): string {
  const numero = libro === 'simplex' ? `Misa ${misa.numero} del Simplex` : `Misa ${misa.numero}`;
  return misa.nombre ? `${numero}, ${misa.nombre}` : numero;
}

/** Todas las Misas disponibles, Romanum primero. */
export function misasDelKyriale(): MisaDelKyriale[] {
  const salida: MisaDelKyriale[] = [];
  for (const libro of ['romanum', 'simplex'] as LibroGraduale[]) {
    for (const misa of Object.values(KYRIALE_DATA[libro]) as MisaKyriale[]) {
      salida.push({ ...misa, libro, rotulo: rotuloDe(misa, libro) });
    }
  }
  return salida;
}

/** Una Misa concreta. `null` si no existe (por ejemplo, tras cambiar el índice). */
export function misaDelKyriale(libro: LibroGraduale, numero: string): MisaDelKyriale | null {
  const misa = (KYRIALE_DATA[libro] as Record<string, MisaKyriale>)[numero];
  return misa ? { ...misa, libro, rotulo: rotuloDe(misa, libro) } : null;
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
  return `${LIBROS[misa.libro].nombre} · ${misa.rotulo} · p. ${misa.pagina}`;
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

/** Todos los tonos del Padre Nuestro, de los dos libros. */
export function todosLosTonosDelPaterNoster(): { libro: LibroGraduale; tono: TonoPaterNoster }[] {
  return (['romanum', 'simplex'] as LibroGraduale[])
    .flatMap((libro) => tonosDelPaterNoster(libro).map((tono) => ({ libro, tono })));
}

/**
 * La clave con que se guarda el tono elegido: «A» es el tono A del Romanum (así se
 * guardaba antes de que hubiera tonos del Simplex) y «simplex:A» el del Simplex.
 */
export function clavePaterNoster(libro: LibroGraduale, tono: string): string {
  return libro === 'romanum' ? tono : `${libro}:${tono}`;
}

export function desdeClavePaterNoster(clave: string | null): { libro: LibroGraduale; tono: string } | null {
  if (!clave) return null;
  const [a, b] = clave.split(':');
  return b ? { libro: a as LibroGraduale, tono: b } : { libro: 'romanum', tono: a };
}

/** De donde sale, para el pie de la partitura. */
export function fuentePaterNoster(libro: LibroGraduale, tono: TonoPaterNoster): string {
  return `${LIBROS[libro].nombre} · Padre Nuestro, tono ${tono.tono} · p. ${tono.pagina}`;
}

/* ─── El Credo ────────────────────────────────────────────────────────────────────
 * No es parte de ninguna Misa del Kyriale: el libro trae los Credos aparte (seis el
 * Romanum, cuatro el Simplex) y cualquiera va con cualquier Misa. Se elige solo, como
 * el Padre Nuestro.
 */

export interface CredoDelLibro extends CredoKyriale {
  libro: LibroGraduale;
  /** «Credo III», o «Credo I del Simplex». */
  rotulo: string;
}

function credoDe(libro: LibroGraduale, c: CredoKyriale): CredoDelLibro {
  return { ...c, libro, rotulo: libro === 'simplex' ? `Credo ${c.numero} del Simplex` : `Credo ${c.numero}` };
}

/** Todos los Credos, Romanum primero. */
export function credosDelKyriale(): CredoDelLibro[] {
  return (['romanum', 'simplex'] as LibroGraduale[])
    .flatMap((libro) => (CREDO_DATA[libro] ?? []).map((c) => credoDe(libro, c)));
}

export function credoDelKyriale(libro: LibroGraduale, numero: string): CredoDelLibro | null {
  const c = (CREDO_DATA[libro] ?? []).find((x) => x.numero === numero);
  return c ? credoDe(libro, c) : null;
}

export function credoImageUrl(libro: LibroGraduale, numero: string): string {
  return `/kyriale/${libro}/credo/${numero}.webp`;
}

export function fuenteCredo(credo: CredoDelLibro): string {
  return `${LIBROS[credo.libro].nombre} · ${credo.rotulo} · p. ${credo.pagina}`;
}

/* ─── Los cantos «ad libitum» ─────────────────────────────────────────────────────
 * Kyries, Glorias, Sanctus y Agnus sueltos que el Romanum trae al final del Kyriale
 * para cantarlos EN LUGAR de los de la Misa. No forman Misa, así que no rompen la regla
 * del Santo y el Cordero: no se mezclan dos Misas, se usa la pieza que el libro ofrece
 * para eso. Sólo el Romanum los trae.
 */

export interface PiezaDelLibitum extends PiezaAdLibitum {
  parte: ParteKyriale;
  /** «Kyrie I ad libitum, Clemens rector». */
  rotulo: string;
}

function piezaDe(parte: ParteKyriale, p: PiezaAdLibitum): PiezaDelLibitum {
  const base = `${CATEGORIA_LATINA[parte]} ${p.numero} ad libitum`;
  return { ...p, parte, rotulo: p.nombre ? `${base}, ${p.nombre}` : base };
}

/** Cómo nombra el libro cada parte, en latín: los ad libitum y los títulos del cantoral. */
export const CATEGORIA_LATINA: Record<ParteKyriale, string> = {
  kyrie: 'Kyrie', gloria: 'Gloria', sanctus: 'Sanctus', agnus: 'Agnus Dei',
};

/** Las piezas ad libitum de una parte, en el orden del libro. */
export function piezasAdLibitum(parte: ParteKyriale): PiezaDelLibitum[] {
  return (AD_LIBITUM_DATA[parte] ?? []).map((p) => piezaDe(parte, p));
}

export function piezaAdLibitum(parte: ParteKyriale, numero: string): PiezaDelLibitum | null {
  const p = (AD_LIBITUM_DATA[parte] ?? []).find((x) => x.numero === numero);
  return p ? piezaDe(parte, p) : null;
}

export function adLibitumImageUrl(parte: ParteKyriale, numero: string): string {
  return `/kyriale/romanum/ad-libitum/${parte}/${numero}.webp`;
}

export function fuenteAdLibitum(pieza: PiezaDelLibitum): string {
  const ref = pieza.ref ? ` (= ${pieza.ref})` : '';
  return `${LIBROS.romanum.nombre} · ${pieza.rotulo}${ref} · p. ${pieza.pagina}`;
}

/**
 * Los propios de la Misa en canto gregoriano: Graduale Romanum y Graduale Simplex.
 *
 * El texto de las antífonas en español (el del Misal) vive en `antiphonIndex`. Esto es
 * lo otro: la MELODÍA, tal como viene en los dos libros, recortada del facsímil y
 * servida como imagen (ver scripts/render-graduale-webp.py para el porqué de la imagen).
 *
 * Los dos no compiten con el Misal ni entre sí: el coro elige libro por libro y parte
 * por parte, y puede mezclarlos —el introito del Romanum y la comunión del Simplex, o
 * el texto del Misal en una parte y el gregoriano en otra—. Por eso la elección se
 * guarda por PARTE y no una sola para toda la Misa.
 *
 * LOS DOS LIBROS NO ESTÁN ORGANIZADOS IGUAL, y eso se nota aquí. El Romanum da un
 * propio para cada domingo; el Simplex da Misas para un TIEMPO entero —ocho para el
 * Tiempo Ordinario, dos para Adviento, dos para Pascua— y deja que el coro escoja cuál
 * canta. Por eso el Simplex se resuelve por dos caminos: por la celebración, cuando el
 * libro la nombra (Corpus, la Trinidad, los domingos de Cuaresma), y si no, por la Misa
 * del tiempo que el coro haya elegido.
 */
import { GRADUALE_APP, SIMPLEX_POR_TIEMPO, type MisaApp } from './gradualeApp.data';

export type LibroGraduale = 'romanum' | 'simplex';
export type CantoGraduale =
  'introitus' | 'graduale' | 'alleluia' | 'tractus' | 'offertorium' | 'communio';

/** Ciclo dominical, para las comuniones que el libro trae distintas cada año. */
export type CicloGraduale = 'A' | 'B' | 'C';

export const LIBROS: Record<LibroGraduale, { nombre: string; corto: string }> = {
  romanum: { nombre: 'Graduale Romanum', corto: 'Romanum' },
  simplex: { nombre: 'Graduale Simplex', corto: 'Simplex' },
};

/**
 * Qué canto del libro corresponde a cada parte de la Misa.
 *
 * El gradual ocupa el lugar del salmo responsorial: es el mismo momento, el canto
 * interleccional entre las lecturas.
 *
 * El TRACTO no aparece como tipo propio porque el importador lo guarda en el hueco del
 * aleluya (ver CANTOS_POR_LIBRO en scripts/import-graduale.py): en Cuaresma el aleluya
 * se calla y el tracto ocupa exactamente su sitio, así que es un mismo hueco con dos
 * nombres según el tiempo. De ahí que el rótulo de esa parte lo ponga la APP y no el
 * latín — en Cuaresma la app ya llama a esa parte "Aclamación al Evangelio".
 */
const CANTOS_DE_LA_PARTE: Record<string, CantoGraduale[]> = {
  'Entrada': ['introitus'],
  'Salmo': ['graduale'],
  'Aleluya': ['alleluia'],
  'Aclamación al Evangelio': ['alleluia'],
  'Ofertorio': ['offertorium'],
  'Comunión': ['communio'],
};

/** Las partes de la Misa que tienen propio en los dos libros. */
export const PARTES_CON_PROPIO = Object.keys(CANTOS_DE_LA_PARTE);

/** ¿Esta parte de la Misa tiene canto propio en el Graduale? */
export function parteTienePropio(parte: string): boolean {
  return parte in CANTOS_DE_LA_PARTE;
}

/** La Misa del libro que corresponde a esa celebración, si el libro la trae. */
function misaDe(libro: LibroGraduale, celebracion: string): MisaApp | null {
  if (!celebracion) return null;
  return (GRADUALE_APP[libro] as Record<string, MisaApp>)[celebracion] ?? null;
}

/**
 * Las Misas que el SIMPLEX ofrece para un tiempo litúrgico entero.
 *
 * El Simplex no da un propio por domingo como el Romanum: para el Tiempo Ordinario trae
 * ocho Misas, para Adviento y Pascua dos, y es el coro quien escoge cuál canta ese día.
 * Mientras no se pudieron elegir, el Simplex sólo servía en las veintiséis celebraciones
 * que el libro sí nombra —ni un domingo del Tiempo Ordinario entre ellas—, así que el
 * botón "Todo el Simplex" no daba casi nada.
 */
export function misasDelTiempo(tiempo: string): MisaApp[] {
  const delTiempo = (SIMPLEX_POR_TIEMPO as Record<string, Record<string, MisaApp>>)[tiempo];
  return delTiempo ? Object.values(delTiempo) : [];
}

/** ¿El Simplex ofrece Misas a elegir para este tiempo? */
export function tiempoConMisasDelSimplex(tiempo: string): boolean {
  return misasDelTiempo(tiempo).length > 0;
}

/** Cómo se llama una Misa del tiempo para el coro ("Misa III"). */
export function rotuloMisaDelTiempo(misa: MisaApp): string {
  return misa.titulo.replace(/^Missa\s+/i, 'Misa ');
}

/** Dónde vive la imagen ya recortada. La genera scripts/render-graduale-webp.py. */
export function gradualeImageUrl(
  libro: LibroGraduale, clave: string, canto: string,
): string {
  return `/graduale/${libro}/${clave}/${canto}.webp`;
}

export interface PropioGraduale {
  libro: LibroGraduale;
  /** Nombre latino del canto ('introitus', 'communio'…), para el rótulo. */
  canto: CantoGraduale;
  /** Título latino de la Misa en el libro, tal cual ("Dominica I Adventus"). */
  misa: string;
  imagen: string;
  /** Página impresa donde empieza, por si alguien quiere ir al libro de papel. */
  pagina: number;
}

/** Lo que hace falta además de la celebración para resolver un propio. */
export interface OpcionesGraduale {
  /** Año dominical, para los cantos que el libro trae distintos por ciclo. */
  ciclo?: CicloGraduale;
  /** Misa del tiempo elegida por el coro en el Simplex (su `clave`). */
  misaDelTiempo?: string | null;
  /** Tiempo litúrgico de la fecha ('Adviento', 'Tiempo Ordinario'…). */
  tiempo?: string;
}

/**
 * El propio de una parte concreta, en un libro concreto. `null` si el libro no lo trae.
 *
 * `ciclo` sólo cambia algo donde el libro ofrece una melodía distinta por año (pasa
 * sobre todo en las comuniones del Tiempo Ordinario). Donde no la ofrece, se devuelve
 * la única que hay, que sirve para los tres.
 *
 * EN EL SIMPLEX HAY DOS CAMINOS, y el orden importa: si el libro trae esa celebración
 * con nombre propio (Corpus, la Santísima Trinidad, los domingos de Cuaresma), manda ese
 * propio, porque para eso lo escribieron. La Misa del tiempo que el coro haya elegido
 * cubre todo lo demás, que en el Simplex es casi el año entero.
 */
export function resolveGraduale(
  libro: LibroGraduale,
  celebracion: string,
  parte: string,
  opciones: OpcionesGraduale = {},
): PropioGraduale | null {
  const { ciclo, misaDelTiempo, tiempo } = opciones;
  const nombres = CANTOS_DE_LA_PARTE[parte];
  if (!nombres) return null;

  let misa = misaDe(libro, celebracion);
  if (!misa && libro === 'simplex' && misaDelTiempo && tiempo) {
    misa = misasDelTiempo(tiempo).find((m) => m.clave === misaDelTiempo) ?? null;
  }
  if (!misa) return null;

  for (const canto of nombres) {
    const hay = misa.cantos[canto];
    if (!hay) continue;
    // `1` = una sola melodía, que sirve los tres años. Una lista = el libro trae una
    // por ciclo, y entonces sólo vale la del año que se está armando: la del año que
    // no es sería, lisa y llanamente, otro canto.
    if (hay !== 1) {
      if (!ciclo || !hay.includes(ciclo)) continue;
    }
    const archivo = hay === 1 ? canto : `${canto}-${ciclo}`;
    return {
      libro,
      canto: canto as CantoGraduale,
      misa: misa.titulo,
      imagen: gradualeImageUrl(libro, misa.clave, archivo),
      pagina: misa.pagina,
    };
  }
  return null;
}

/** Los libros que traen propio para esa parte ese día (para no ofrecer chips muertos). */
export function librosDisponibles(
  celebracion: string, parte: string, opciones: OpcionesGraduale = {},
): LibroGraduale[] {
  return (Object.keys(LIBROS) as LibroGraduale[])
    .filter((l) => resolveGraduale(l, celebracion, parte, opciones) !== null);
}

/** ¿Hay algo de gregoriano para esta celebración, en cualquier parte y cualquier libro? */
export function hayPropios(celebracion: string, opciones: OpcionesGraduale = {}): boolean {
  return PARTES_CON_PROPIO.some((p) => librosDisponibles(celebracion, p, opciones).length > 0);
}

/** Cómo se llama cada canto en castellano, para el rótulo de la tarjeta. */
const EN_CASTELLANO: Partial<Record<CantoGraduale, string>> = {
  introitus: 'Introito',
  graduale: 'Gradual',
  offertorium: 'Ofertorio',
  communio: 'Comunión',
};

/**
 * El rótulo del propio, tal como lo ve el coro.
 *
 * El hueco del aleluya lo nombra la PARTE y no el latín: ahí el libro pone el aleluya
 * casi todo el año y el tracto en Cuaresma, y la app ya sabe cuál toca porque cambia el
 * nombre de la parte con el tiempo litúrgico. Poner "Aleluya" en Cuaresma sería decirle
 * al coro que cante lo único que no se canta en Cuaresma.
 */
export function nombreDelPropio(canto: CantoGraduale, parte: string): string {
  return EN_CASTELLANO[canto] ?? parte;
}

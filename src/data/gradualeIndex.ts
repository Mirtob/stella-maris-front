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
 * UN DÍA NO SIEMPRE TIENE UNA SOLA MISA, y de ahí sale casi toda la complicación de
 * este archivo:
 *
 *  · El Romanum da un propio por domingo, pero algunas solemnidades llevan VARIAS Misas
 *    con cantos distintos: la Navidad tiene cuatro (vigilia, noche, aurora y día) y
 *    Pentecostés dos.
 *  · El Simplex ni siquiera va por domingo: da Misas para un TIEMPO entero —ocho para el
 *    Tiempo Ordinario, dos para Adviento, dos para Pascua— y el coro escoge.
 *
 * El calendario de la app, en cambio, da UN nombre por día. Así que las dos cosas se
 * ofrecen como "alternativas del día" y gana siempre la más concreta: la Misa de la
 * solemnidad sobre la entrada del día, y la entrada del día sobre la Misa del tiempo.
 */
import { GRADUALE_APP, SIMPLEX_POR_TIEMPO, MISAS_DE_LA_SOLEMNIDAD,
         type MisaApp } from './gradualeApp.data';

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

/**
 * Una Misa entre varias que el libro ofrece para el mismo día.
 *
 * Hay dos motivos por los que un día tiene más de una, y NO se comportan igual:
 *
 *  · `solemnidad` — la Navidad tiene cuatro Misas (vigilia, noche, aurora y día) y
 *    Pentecostés dos, cada una con sus propios cantos. Son MÁS concretas que la entrada
 *    del día, así que la elegida manda sobre ella.
 *  · `tiempo` — las Misas que el Simplex da para un tiempo entero. Son MENOS concretas
 *    que el propio del día, así que sólo se usan donde el libro no trae ese día.
 *
 * La regla, en una línea: gana siempre lo más concreto.
 */
export interface AlternativaMisa extends MisaApp {
  libro: LibroGraduale;
  /** Cómo se ofrece al coro ("Misa de la noche", "Misa III"). */
  rotuloCorto: string;
  clase: 'solemnidad' | 'tiempo';
}

/** Las Misas entre las que el coro puede elegir ese día, en ese libro. */
export function alternativasDelDia(
  libro: LibroGraduale, celebracion: string, tiempo?: string,
): AlternativaMisa[] {
  const deLaSolemnidad = (MISAS_DE_LA_SOLEMNIDAD as
    Record<string, Record<string, Record<string, MisaApp>>>)[libro]?.[celebracion];
  if (deLaSolemnidad) {
    return Object.values(deLaSolemnidad).map((m) => ({
      ...m, libro, clase: 'solemnidad' as const,
      rotuloCorto: m.rotulo ?? m.titulo,
    }));
  }
  // Las Misas por tiempo son cosa del Simplex, y sólo valen donde el libro no trae ya
  // esa celebración con nombre propio.
  if (libro !== 'simplex' || !tiempo || misaDe(libro, celebracion)) return [];
  return misasDelTiempo(tiempo).map((m) => ({
    ...m, libro, clase: 'tiempo' as const, rotuloCorto: rotuloMisaDelTiempo(m),
  }));
}

/** La versión general, para los años que no tienen melodía propia. */
export const SIRVE_TODO_AÑO = '*';

/**
 * Qué archivo toca cantar este año, o `null` si el libro no trae ese canto.
 *
 * EL AÑO NO SE ELIGE: lo determina la fecha de la Misa. Cuando el libro trae una
 * comunión distinta para el año A, otra para el B y otra para el C, no son tres opciones
 * entre las que escoger — es una para cada año, y la del año que no toca sería, lisa y
 * llanamente, otro canto.
 *
 * El orden es el único posible: primero la melodía propia de este año; si el libro no la
 * trae, la general; y si no hay ninguna, nada. Sin ese segundo paso, un canto con
 * variante sólo del año A desaparecía del cantoral en los años B y C.
 *
 * @param cubre  `1` = una melodía para los tres años; lista = los años cubiertos, con
 *               `'*'` para la versión general.
 */
export function archivoDelCanto(
  cubre: 1 | readonly string[] | undefined,
  canto: string,
  año: CicloGraduale | undefined,
): string | null {
  if (!cubre) return null;
  if (cubre === 1) return canto;
  if (año && cubre.includes(año)) return `${canto}-${año}`;
  if (cubre.includes(SIRVE_TODO_AÑO)) return canto;
  return null;
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
  /** El año del que es esta melodía, SÓLO si el libro trae una distinta por año.
   *  No es una elección: sale de la fecha de la Misa. */
  año?: CicloGraduale;
}

/** Lo que hace falta además de la celebración para resolver un propio. */
export interface OpcionesGraduale {
  /** Año dominical, para los cantos que el libro trae distintos por ciclo. */
  ciclo?: CicloGraduale;
  /** La Misa que el coro eligió entre las varias del día (su `clave`). */
  misaElegida?: string | null;
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
 * CUANDO EL DÍA TIENE VARIAS MISAS, gana la más concreta:
 *
 *  1. la Misa de la solemnidad que el coro eligió (la de la noche de Navidad), que es
 *     más concreta que la entrada del día;
 *  2. el propio de la celebración, cuando el libro la trae con nombre propio;
 *  3. la Misa del tiempo elegida en el Simplex, que es la genérica del tiempo y por eso
 *     sólo rellena donde no hay nada más.
 */
export function resolveGraduale(
  libro: LibroGraduale,
  celebracion: string,
  parte: string,
  opciones: OpcionesGraduale = {},
): PropioGraduale | null {
  const { ciclo, misaElegida, tiempo } = opciones;
  const nombres = CANTOS_DE_LA_PARTE[parte];
  if (!nombres) return null;

  const elegida = misaElegida
    ? alternativasDelDia(libro, celebracion, tiempo).find((m) => m.clave === misaElegida)
    : undefined;
  const misa: MisaApp | null = (elegida?.clase === 'solemnidad' ? elegida : null)
    ?? misaDe(libro, celebracion)
    ?? elegida
    ?? null;
  if (!misa) return null;

  for (const canto of nombres) {
    const cubre = misa.cantos[canto];
    const archivo = archivoDelCanto(cubre, canto, ciclo);
    if (!archivo) continue;
    return {
      libro,
      canto: canto as CantoGraduale,
      misa: misa.titulo,
      imagen: gradualeImageUrl(libro, misa.clave, archivo),
      pagina: misa.pagina,
      // Se dice el año sólo cuando el libro trae una melodía distinta para cada uno:
      // así el coro ve por qué este domingo suena diferente al del año pasado.
      año: archivo === `${canto}-${ciclo}` ? ciclo : undefined,
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

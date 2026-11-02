/**
 * El Padre Nuestro y las aclamaciones breves de la Misa, armados desde el Drive.
 *
 * Fuente única para el diálogo que aparece al agregar el Ofertorio y para el panel fijo
 * del constructor (que es el que permite ponerlos o quitarlos al EDITAR un cantoral).
 * Antes cada lugar tenía su propia búsqueda y se enredaban: el Padre Nuestro en español
 * podía salir del catálogo como el «Padre nuestro, recibid» del Ofertorio, porque se
 * buscaba por texto.
 *
 * Convención del Drive (pedida por el coro el 26-sep-2026):
 *  · Gregoriano → «Padre Nuestro/Pater noster.pdf», en tetragrama.
 *  · Español    → «Padre Nuestro/Padre Nuestro/Padre nuestro-Voz.pdf», en pentagrama;
 *                 la misma carpeta trae las demás voces para el coro.
 *  · Aclamaciones → carpeta de la Misa, o la común «Aclamaciones» (ver pickOrdinarySheet).
 *
 * Cada canto lleva además `sheets`: las partituras por voz de su carpeta. Con eso el
 * Modo Atril muestra a cada corista su voz y al Pueblo fiel la Voz (partituraDelPueblo).
 */
import { Song } from '../types';
import { ACLAMACIONES, Aclamacion, AclamacionId } from '../data/aclamaciones';
import { massOrdinary } from '../data/massOrdinary';
import {
  DriveFile, esLaVoz, pdfsDelPadreNuestro, pickOrdinarySheet,
} from './ordinarySheetMusic';
import { detectSheets, sinSufijoDeBronce } from './sheetParts';
import { isKyrialeSong } from './kyrialeSong';
import { ELEVACION } from './instrumental';

export type PadreNuestroIdioma = 'es' | 'la';

const urlDe = (f: DriveFile) => `https://drive.google.com/file/d/${f.id}/preview`;

/**
 * Nombre de la obra: el archivo sin extensión y sin el sufijo de voz o de bronce.
 * El de bronce se corta desde el guion, con todo lo que siga: MuseScore escribe
 * «Obra-Trompeta_en_Sib_1», y sin esto el arreglo de bronces quedaba fuera de las
 * partituras de la aclamación.
 */
const obraDe = (nombre: string) => sinSufijoDeBronce(nombre)
  .replace(/[\s_-]*(voz|soprano|alto|contralto|tenor|bajo|hombres|mujeres)([\s_]*\d)?$/i, '')
  .trim()
  .toLowerCase();

/**
 * Las otras voces de `f`: los PDF de su MISMA carpeta y de su MISMA obra.
 *
 * Lo de la obra importa: la carpeta «Anunciamos tu muerte» guarda también las voces de
 * «Anunciaremos tu Reino», y sin este filtro el bajo terminaba leyendo la otra obra.
 */
function hermanos(f: DriveFile, files: DriveFile[]): DriveFile[] {
  const obra = obraDe(f.name);
  return files.filter((x) => (x.path ?? '') === (f.path ?? '') && /\.pdf$/i.test(x.name)
    && obraDe(x.name) === obra);
}

/** Las partituras por voz de la carpeta de `f`; vacío si está sola. */
function voces(f: DriveFile | null, files: DriveFile[]) {
  if (!f) return [];
  const pdfs = hermanos(f, files);
  return pdfs.length > 1 ? detectSheets(pdfs) : [];
}

/** Letra de respaldo del Padre Nuestro (la del Ordinario), sin la monición. */
function letraPadreNuestro(latin: boolean): string | undefined {
  const cantado = massOrdinary.find((x) => x.id === 'lords-prayer-song');
  const hablado = massOrdinary.find((x) => x.id === 'lords-prayer');
  if (latin) return cantado?.latin;
  // En castellano la sección cantada no trae texto: se toma el del rito, desde
  // "Padre nuestro…" hasta "…líbranos del mal." (sin la monición del sacerdote).
  const m = /(Padre nuestro[\s\S]*?líbranos del mal\.)/.exec(hablado?.text ?? '');
  return m?.[1];
}

/** ¿Es un Padre Nuestro armado aquí o por el diálogo (no el del Kyriale)? */
export const esPadreNuestroDelCantoral = (s: Pick<Song, 'category' | 'id'>) =>
  s.category === 'Padre Nuestro' && !isKyrialeSong(s);

/** El idioma del Padre Nuestro que ya está en el cantoral, o null si no hay. */
export function idiomaEnElCantoral(cantoral: Song[]): PadreNuestroIdioma | null {
  const pn = cantoral.find(esPadreNuestroDelCantoral);
  if (!pn) return null;
  return String(pn.id).startsWith('padre-nuestro-la') || /\bpater\b|latin|gregor/i.test(`${pn.title} ${pn.author ?? ''}`)
    ? 'la' : 'es';
}

/**
 * El Padre Nuestro listo para el cantoral.
 *  · `sheetMusicUrl`: en español la Voz (así lo pidió el coro); en gregoriano, el PDF.
 *  · `sheets`: las voces de la carpeta, para el Atril del coro.
 *  · `lyrics`: la del Ordinario, por si no hay partitura.
 */
export function construirPadreNuestro(idioma: PadreNuestroIdioma, files: DriveFile[]): Song {
  const latin = idioma === 'la';
  const pdfs = pdfsDelPadreNuestro(files, latin);
  const principal = (latin ? (pdfs.find(esLaVoz) ?? pdfs[0]) : pdfs.find(esLaVoz)) ?? pdfs[0] ?? null;
  return {
    id: `padre-nuestro-${idioma}-${Date.now()}`,
    title: latin ? 'Pater noster' : 'Padre nuestro',
    category: 'Padre Nuestro',
    youtubeId: '',
    duration: '0:00',
    version: 'Coro',
    isLiturgical: true,
    sheetMusicUrl: principal ? urlDe(principal) : undefined,
    sheets: voces(principal, files),
    lyrics: letraPadreNuestro(latin),
  };
}

/** Las aclamaciones que ya están en el cantoral. */
export function aclamacionesEnElCantoral(cantoral: Song[]): AclamacionId[] {
  return ACLAMACIONES.filter((a) => cantoral.some((s) => s.category === a.category)).map((a) => a.id);
}

const baseMisa = (x?: string) =>
  (x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Una aclamación lista para el cantoral, con el mismo criterio que el Kyrie o el Santo:
 * primero el canto del catálogo de esa parte y de esa Misa; si no, la partitura en
 * Drive (carpeta de la Misa o la común «Aclamaciones»); si tampoco, solo la letra.
 */
export function construirAclamacion(
  a: Aclamacion, misa: string | undefined, files: DriveFile[], catalogo: Song[] = [],
): Song {
  const delCatalogo = catalogo.find((s) => s.category === a.category
    && (misa ? baseMisa(s.massName) === baseMisa(misa) : true));
  const archivo = pickOrdinarySheet(a.category, misa, files);
  if (delCatalogo) {
    return {
      ...delCatalogo,
      id: `${delCatalogo.id}::${a.id}`,
      lyrics: delCatalogo.lyrics || a.letra,
      sheetMusicUrl: delCatalogo.sheetMusicUrl || (archivo ? urlDe(archivo) : undefined),
      sheets: delCatalogo.sheets?.length ? delCatalogo.sheets : voces(archivo, files),
    };
  }
  return {
    id: `aclamacion-${a.id}-${Date.now()}`,
    title: a.titulo,
    category: a.category,
    youtubeId: '',
    duration: '0:00',
    // Sin autor: la aclamación es universal, no "de la Misa X". La Misa se guarda solo
    // para buscar su partitura en la carpeta de esa Misa, si la tuviera.
    version: 'Coro',
    massName: misa,
    isLiturgical: true,
    lyrics: a.letra,
    sheetMusicUrl: archivo ? urlDe(archivo) : undefined,
    sheets: voces(archivo, files),
  };
}

/**
 * La Misa del ordinario que ya está en el cantoral: las aclamaciones se buscan en SU
 * carpeta. El Santo manda porque la aclamación de la consagración y el Amén vienen
 * justo después.
 */
export function misaDelCantoral(cantoral: Song[]): string | undefined {
  return ['Santo', 'Kyrie', 'Cordero de Dios', 'Gloria']
    .map((cat) => cantoral.find((s) => s.category === cat && s.massName)?.massName)
    .find(Boolean);
}

/** Sin acentos ni mayúsculas, para comparar títulos y carpetas. */
const plano = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Los toques de elevación que se pueden elegir (pedido del 2-nov-2026): primero los del
 * catálogo y después las obras de la carpeta «Elevación» del Drive que el catálogo no
 * tiene. Así basta subir el toque al Drive para poder usarlo, sin darlo de alta.
 *
 * En el Drive cada obra es una carpeta (o un PDF suelto) con su partitura general y una
 * por instrumento («Toque-Trompeta_en_Sib_1.pdf»); la general es la que no trae sufijo.
 * Son obras instrumentales: el pueblo no las ve (utils/instrumental).
 */
export function obrasDeElevacion(files: DriveFile[], catalogo: Song[] = []): Song[] {
  const delCatalogo = catalogo.filter((s) => s.category === ELEVACION);
  const yaEstan = new Set(delCatalogo.map((s) => plano(s.title)));

  const deLaElevacion = files.filter((f) => /\.pdf$/i.test(f.name)
    && ((f.path ?? '').split('/').some((seg) => plano(seg).includes('elevacion'))
      || plano(f.name).includes('elevacion')));
  const porObra = new Map<string, DriveFile[]>();
  for (const f of deLaElevacion) {
    const k = `${f.path ?? ''}|${obraDe(f.name)}`;
    porObra.set(k, [...(porObra.get(k) ?? []), f]);
  }

  const delDrive: Song[] = [];
  for (const grupo of porObra.values()) {
    const obra = obraDe(grupo[0].name);
    const general = grupo.find((f) => plano(f.name.replace(/\.[^.]+$/, '')) === obra) ?? grupo[0];
    const titulo = general.name.replace(/\.[^.]+$/, '').trim();
    if (yaEstan.has(plano(titulo))) continue;
    delDrive.push({
      id: `elevacion-${general.id}`,
      title: titulo,
      category: ELEVACION,
      youtubeId: '',
      duration: '0:00',
      version: 'Coro',
      isLiturgical: true,
      instrumental: true,
      sheetMusicUrl: urlDe(general),
      sheets: voces(general, files),
    });
  }
  delDrive.sort((a, b) => a.title.localeCompare(b.title));
  return [...delCatalogo, ...delDrive];
}

/** La obra de elevación lista para el cantoral (con su id propio de esta Misa). */
export function construirElevacion(obra: Song): Song {
  return { ...obra, id: `${obra.id}::elevacion-${Date.now()}`, category: ELEVACION, instrumental: true };
}

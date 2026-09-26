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
import { detectSheets } from './sheetParts';
import { isKyrialeSong } from './kyrialeSong';

export type PadreNuestroIdioma = 'es' | 'la';

const urlDe = (f: DriveFile) => `https://drive.google.com/file/d/${f.id}/preview`;

/** Nombre de la obra: el archivo sin extensión y sin el sufijo de voz. */
const obraDe = (nombre: string) => nombre
  .replace(/\.[^.]+$/, '')
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
    title: latin ? 'Pater noster' : 'Padre Nuestro',
    category: 'Padre Nuestro',
    youtubeId: '',
    duration: '0:00',
    author: latin ? 'Gregoriano' : undefined,
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
    author: misa,
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

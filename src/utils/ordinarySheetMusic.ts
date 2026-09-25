import { Song } from '../types';
import { isOrdinary } from './ordinary';

/**
 * Resuelve la partitura (PDF de Drive) de una parte del ordinario que no la tiene
 * vinculada en el catálogo.
 *
 * Modelo de carpetas (preferido): una carpeta por Misa dentro de la carpeta de
 * partituras, con un PDF por parte fija (Kyrie, Gloria, Santo, Cordero…). El
 * nombre de la carpeta = el nombre de la Misa (`massName`). Así basta con dejar
 * los archivos en su carpeta — sin pegar el ID en cada video — y al agregar una
 * parte la app encuentra las demás "en la misma carpeta".
 *
 * Respaldo (compatibilidad): si no hay carpeta por Misa, cae al match por nombre
 * de archivo (parte + nombre de la Misa en el propio nombre del PDF).
 *
 * El listado de `/api/sheets` se cachea a nivel módulo para no repetir la llamada
 * cuando se agregan varias partes seguidas (Kyrie auto-agrega Santo/Cordero/Gloria).
 */

export interface DriveFile { id: string; name: string; mimeType?: string; path?: string }

let sheetsCache: DriveFile[] | null = null;
let inFlight: Promise<DriveFile[]> | null = null;

async function loadSheets(): Promise<DriveFile[]> {
  if (sheetsCache) return sheetsCache;
  if (!inFlight) {
    inFlight = (async () => {
      try {
        const r = await fetch('/api/sheets');
        if (!r.ok) return [];
        const data = await r.json();
        const files = (data.files || []) as DriveFile[];
        sheetsCache = files;
        return files;
      } catch {
        return [];
      } finally {
        inFlight = null;
      }
    })();
  }
  return inFlight;
}

/** Normaliza: sin acentos, minúsculas, separadores → espacios. */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Sinónimos por parte para el match contra el nombre del archivo en Drive.
const PART_SYNONYMS: Record<string, string[]> = {
  'Kyrie': ['kyrie', 'senor ten piedad', 'ten piedad'],
  'Gloria': ['gloria'],
  'Santo': ['santo', 'sanctus'],
  'Cordero de Dios': ['cordero', 'agnus'],
  'Padre Nuestro': ['padre nuestro', 'pater noster'],
  'Rito de Aspersión': ['aspersion', 'asperges'],
};

/**
 * Qué partitura va al folleto del pueblo cuando la carpeta de la Misa trae varias.
 *
 * La que se imprime es la de la VOZ PRINCIPAL — la línea melódica que canta la asamblea,
 * sin cifrado de acordes (los acordes son del que acompaña, y solo se muestran en el
 * perfil de Coro y en el Modo Atril). El orden lo fijó el coro el 24-sep-2026:
 *
 *   1. «Voz»      — la melodía, escrita como tal.
 *   2. «Órgano»   — en el archivo del coro lleva la línea principal.
 *   3. «Soprano»  — a falta de las dos, es la melodía dentro del arreglo a cuatro voces.
 *
 * Y se esquivan las que claramente no son la melodía: las cifradas, los arreglos a varias
 * voces y las demás voces sueltas.
 *
 * Esto INCLINA, no descarta: quedarse sin partitura es peor que quedarse con la del
 * tenor, así que si es la única que hay, esa va.
 */
const PREFERENCIA_VOZ: readonly (readonly string[])[] = [
  ['voz', 'melodia', 'melodica', 'pueblo', 'asamblea', 'unisono', 'fieles'],
  ['organo', 'orga'],
  ['soprano', 'sop'],
];
const EVITA = [
  'acordes', 'acorde', 'cifrado', 'cifra', 'guitarra',        // acompañamiento
  'satb', 'coral', 'polifonia', 'polifonica',                 // arreglo a varias voces
  'contralto', 'alto', 'tenor', 'bajo', 'baritono', 'barit',  // otra voz suelta
  'piano', 'teclado',                                         // reducción instrumental
];

/**
 * Las palabras del nombre, sueltas.
 *
 * Se compara por PALABRA y no por trozo de texto: "contralto" contiene "alto", y con una
 * comparación por substring la partitura de la contralto se habría colado como si fuera
 * la del alto — o peor, cualquier nombre que llevara esas letras dentro.
 */
const palabras = (nombreNormalizado: string): Set<string> =>
  new Set(nombreNormalizado.split(/[^a-z0-9]+/).filter(Boolean));

/** Cuánto inclina el nombre de un archivo hacia la partitura de la voz principal. */
function sesgoDeVozPrincipal(nombreNormalizado: string): number {
  const tokens = palabras(nombreNormalizado);
  if (EVITA.some((t) => tokens.has(t))) return -0.5;
  const nivel = PREFERENCIA_VOZ.findIndex((grupo) => grupo.some((t) => tokens.has(t)));
  if (nivel === -1) return 0;                       // nombre neutro: ni suma ni resta
  return (PREFERENCIA_VOZ.length - nivel) * 0.3;    // voz 0,9 · órgano 0,6 · soprano 0,3
}

/**
 * Las carpetas del camino del archivo, normalizadas.
 *
 * Se miran TODAS y no solo la contenedora porque la parte y la Misa pueden repartirse
 * entre el nombre del archivo y las carpetas de tres maneras, y las tres son razonables:
 *
 *   Misa X/Gloria voz.pdf      — todo en el nombre
 *   Misa X/Voz/Gloria.pdf      — una carpeta por voz
 *   Misa X/Gloria/Voz.pdf      — una carpeta por parte (la misma forma que ya se usa
 *                                para los cantos polifónicos)
 *
 * Con la versión anterior, que exigía la parte en el NOMBRE y la Misa en la carpeta
 * contenedora, las dos últimas se quedaban sin partitura sin que nada lo dijera.
 */
const segmentosDe = (f: DriveFile): string[] =>
  (f.path ?? '').split('/').filter(Boolean).map(norm);

/**
 * Elige el archivo de Drive que corresponde a una parte del ordinario.
 * Fuente de verdad: el modelo "una carpeta por Misa" (la carpeta se llama como
 * la Misa y contiene un PDF por parte). Respaldo: el nombre del archivo menciona
 * la parte + la Misa. Devuelve `null` si no hay coincidencia confiable.
 *
 * Compartido por el agregado al cantoral y por la sincronización de YouTube para
 * que no diverjan (evita tomar el "Kyrie" de otra Misa).
 */
export function pickOrdinarySheet(
  category: string,
  massName: string | undefined,
  files: DriveFile[],
): DriveFile | null {
  const parts = PART_SYNONYMS[category] ?? [norm(category)];
  const massTokens = massName
    ? norm(massName).split(' ').filter(t => t.length > 2)
    : [];

  let best: DriveFile | null = null;
  let bestScore = 0;
  for (const f of files) {
    const n = norm(f.name);
    const segs = segmentosDe(f);
    // La parte se identifica en el nombre del archivo O en alguna carpeta del camino.
    const hasPart = parts.some(p => n.includes(p)) || segs.some(s => parts.some(p => s.includes(p)));
    if (!hasPart) continue;

    // Coincidencia de Misa por CARPETA (preferido, en cualquier nivel) o por el nombre.
    const folderMatch = massTokens.length > 0 && segs.some(s => massTokens.every(t => s.includes(t)));
    const nameMassMatch = massTokens.length > 0 && massTokens.every(t => n.includes(t));

    // Si la parte declara una Misa, exigir que la carpeta o el nombre la mencionen
    // (evita traer el Santo de otra Misa). Sin Misa declarada → basta la parte.
    if (massTokens.length > 0 && !folderMatch && !nameMassMatch) continue;

    // La carpeta pesa más que el nombre: el modelo "una carpeta por Misa" es la
    // fuente de verdad. Sin Misa, cualquier archivo de la parte sirve (score 1).
    // El sesgo de asamblea desempata DENTRO de la misma calidad de coincidencia: pesa
    // menos que la carpeta y que el nombre de la Misa, para no traer el Santo de otra
    // Misa solo porque su archivo dice "pueblo".
    // El sesgo desempata DENTRO de la misma calidad de coincidencia: como mucho suma
    // 0,9, siempre menos que acertar la carpeta (3) o el nombre de la Misa (2). Traer el
    // Santo de otra Misa porque su archivo dice "voz" sería peor que traer el del tenor
    // de la Misa correcta.
    // La voz puede venir en el archivo ("Gloria voz.pdf", "Gloria/Voz.pdf") o en la
    // carpeta que lo contiene ("Voz/Gloria.pdf"). Se toma la señal más fuerte, pero si
    // CUALQUIERA de las dos dice que no es la melodía, manda esa: más vale no elegir la
    // del tenor por estar guardada en una carpeta que se llama "Voz".
    const contenedora = segs.length ? segs[segs.length - 1] : '';
    const sesgos = [sesgoDeVozPrincipal(n), sesgoDeVozPrincipal(contenedora)];
    const sesgo = sesgos.some(v => v < 0) ? -0.5 : Math.max(...sesgos);

    const score = 1 + (folderMatch ? 3 : 0) + (nameMassMatch ? 2 : 0) + sesgo;
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return best;
}

/**
 * Devuelve el `song` enriquecido con `sheetMusicUrl` si era una parte del
 * ordinario sin partitura y se encontró una coincidencia en Drive. Si no, lo
 * devuelve igual (best-effort, nunca lanza).
 */
export async function resolveOrdinarySheetMusic(song: Song): Promise<Song> {
  if (song.sheetMusicUrl || !isOrdinary(song)) return song;

  const files = await loadSheets();
  if (!files.length) return song;

  const best = pickOrdinarySheet(song.category, song.massName, files);
  if (best) {
    return { ...song, sheetMusicUrl: `https://drive.google.com/file/d/${best.id}/preview` };
  }
  return song;
}

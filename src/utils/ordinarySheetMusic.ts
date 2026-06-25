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

/** Último segmento de la ruta = nombre de la carpeta contenedora del archivo. */
const folderOf = (f: DriveFile): string => {
  if (!f.path) return '';
  const segs = f.path.split('/').filter(Boolean);
  return segs.length ? segs[segs.length - 1] : '';
};

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
    const hasPart = parts.some(p => n.includes(p));
    if (!hasPart) continue; // el nombre del archivo debe identificar la parte

    // Coincidencia de Misa por CARPETA (preferido) o por el propio nombre.
    const folder = norm(folderOf(f));
    const folderMatch = massTokens.length > 0 && massTokens.every(t => folder.includes(t));
    const nameMassMatch = massTokens.length > 0 && massTokens.every(t => n.includes(t));

    // Si la parte declara una Misa, exigir que la carpeta o el nombre la mencionen
    // (evita traer el Santo de otra Misa). Sin Misa declarada → basta la parte.
    if (massTokens.length > 0 && !folderMatch && !nameMassMatch) continue;

    // La carpeta pesa más que el nombre: el modelo "una carpeta por Misa" es la
    // fuente de verdad. Sin Misa, cualquier archivo de la parte sirve (score 1).
    const score = 1 + (folderMatch ? 3 : 0) + (nameMassMatch ? 2 : 0);
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

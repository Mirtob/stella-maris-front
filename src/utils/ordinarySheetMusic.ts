import { Song } from '../types';
import { isOrdinary } from './ordinary';

/**
 * Resuelve la partitura (PDF de Drive) de una parte del ordinario que no la tiene
 * vinculada en el catálogo, buscándola en la carpeta de partituras por nombre de
 * la Misa + parte. Mismo enfoque que ya usa el Padre Nuestro al agregarse.
 *
 * El listado de `/api/sheets` se cachea a nivel módulo para no repetir la llamada
 * cuando se agregan varias partes seguidas (Kyrie auto-agrega Santo/Cordero/Gloria).
 */

interface DriveFile { id: string; name: string; mimeType?: string; path?: string }

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
 * Devuelve el `song` enriquecido con `sheetMusicUrl` si era una parte del
 * ordinario sin partitura y se encontró una coincidencia en Drive. Si no, lo
 * devuelve igual (best-effort, nunca lanza).
 */
export async function resolveOrdinarySheetMusic(song: Song): Promise<Song> {
  if (song.sheetMusicUrl || !isOrdinary(song)) return song;

  const files = await loadSheets();
  if (!files.length) return song;

  const parts = PART_SYNONYMS[song.category] ?? [norm(song.category)];
  const massTokens = song.massName
    ? norm(song.massName).split(' ').filter(t => t.length > 2)
    : [];

  let best: DriveFile | null = null;
  let bestScore = 0;
  for (const f of files) {
    const n = norm(f.name);
    const hasPart = parts.some(p => n.includes(p));
    if (!hasPart) continue;
    const massMatch = massTokens.length > 0 && massTokens.every(t => n.includes(t));
    // Si la parte declara una Misa, exigir que el archivo también la mencione
    // (evita traer el Santo de otra Misa distinta). Sin Misa → basta la parte.
    if (massTokens.length > 0 && !massMatch) continue;
    const score = 1 + (massMatch ? 2 : 0);
    if (score > bestScore) { bestScore = score; best = f; }
  }

  if (best) {
    return { ...song, sheetMusicUrl: `https://drive.google.com/file/d/${best.id}/preview` };
  }
  return song;
}

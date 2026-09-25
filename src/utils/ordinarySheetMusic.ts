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

/**
 * Normaliza para comparar: sin acentos, minúsculas, y TODO lo que no sea letra o dígito
 * pasa a ser un espacio.
 *
 * Antes solo se convertían `_ - .`, y la puntuación que quedaba rompía calces buenos: el
 * archivo «Señor, ten piedad - Nebreda-Voz.pdf» daba "senor, ten piedad …" con la coma
 * pegada, que no es el "senor ten piedad" que busca el sinónimo. Se salvaba de milagro
 * porque hay un segundo sinónimo más corto.
 */
const norm = (s: string) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
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
/**
 * Palabras del nombre de una Misa que no sirven para identificarla.
 *
 * "Misa" está en el nombre de TODAS, así que exigirla no descarta ninguna equivocada y sí
 * descarta las correctas: el archivo «Santo - Manzano-Voz.pdf» no dice "misa" por ningún
 * lado, y con la palabra exigida se quedaba fuera aunque fuera exactamente el que se
 * buscaba. Reportado el 25-sep-2026.
 */
const PALABRAS_VACIAS = new Set(['misa', 'del', 'las', 'los', 'para']);

/**
 * Una partitura es un PDF.
 *
 * La carpeta de cada parte trae además el MP3 de ensayo de cada voz y el .mscz de
 * MuseScore, y varios de ellos se llaman EXACTAMENTE igual que el PDF salvo por la
 * extensión: «Santo - Manzano-Voz.mp3» junto a «Santo - Manzano-Voz.pdf». Empataban en
 * puntaje y ganaba el que Drive devolviera primero, que no es algo que uno controle: en
 * la carpeta del Santo los MP3 venían antes, así que al folleto se le entregaba un audio,
 * PDF.js no podía dibujarlo y la parte salía con la letra. En las carpetas del Kyrie y
 * del Cordero el PDF venía primero y funcionaba de casualidad. Reportado el 25-sep-2026.
 */
const esPdf = (f: DriveFile): boolean =>
  f?.mimeType === 'application/pdf' || /\.pdf$/i.test(f?.name ?? '');

export function pickOrdinarySheet(
  category: string,
  massName: string | undefined,
  files: DriveFile[],
): DriveFile | null {
  const parts = PART_SYNONYMS[category] ?? [norm(category)];
  // Lo que va ENTRE PARÉNTESIS es un matiz, no la identidad de la Misa: «Nebreda (Do
  // mayor)» y «Nebreda» son la misma, y en Drive la carpeta se llama «Misa Nebreda» a
  // secas. Exigir esas palabras dejaba fuera al Kyrie y al Cordero de Nebreda aunque su
  // partitura estuviera ahí. Así que el paréntesis no se exige: SUMA si además calza,
  // para poder desempatar entre dos variantes de la misma Misa si algún día se separan.
  const tokensDe = (texto: string) =>
    norm(texto).split(' ').filter(t => t.length > 2 && !PALABRAS_VACIAS.has(t));
  const massTokens = massName ? tokensDe(massName.replace(/\([^)]*\)/g, ' ')) : [];
  const matices = massName
    ? tokensDe([...massName.matchAll(/\(([^)]*)\)/g)].map(m => m[1]).join(' '))
    : [];

  let best: DriveFile | null = null;
  let bestScore = 0;
  for (const f of files) {
    if (!esPdf(f)) continue;          // el MP3 de ensayo no es una partitura
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
    // La carpeta pesa más que el nombre: el modelo "una carpeta por Misa" es la
    // fuente de verdad. Sin Misa, cualquier archivo de la parte sirve (score 1).
    // El matiz del paréntesis solo desempata: nunca decide por sí solo.
    const matiz = matices.filter(t => n.includes(t) || segs.some(g => g.includes(t))).length;
    const score = 1 + (folderMatch ? 3 : 0) + (nameMassMatch ? 2 : 0) + matiz * 0.25;
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

/** El nombre sin su extensión ("Santo - Manzano-Voz.pdf" → "Santo - Manzano-Voz"). */
const sinExtension = (nombre: string): string => (nombre ?? '').replace(/\.[^.]+$/, '');

/**
 * ¿Este archivo es LA VOZ?
 *
 * El folleto del pueblo no acepta otra cosa. La convención del coro es que el archivo
 * TERMINA en "Voz" —«Santo - Manzano-Voz.pdf»— y ese lleva la línea melódica sin cifrado.
 * Todos los demás («…-Hombres», «…-Mujeres», «…-SATB», «…-Tenor») son del coro y se
 * abren en el Modo Atril, no en el folleto de la asamblea.
 *
 * Por eso esto es un FILTRO y no una preferencia: antes se elegía "la mejor disponible" y
 * acababa colándose la de Hombres cuando no había otra. Si no hay archivo de Voz, el
 * folleto imprime la letra y ya está.
 *
 * Se acepta también la carpeta llamada "Voz" («Misa X/Voz/Gloria.pdf»), que es la otra
 * forma de decir lo mismo.
 */
export function esLaVoz(f: DriveFile): boolean {
  if (/(^|\s)voz$/.test(norm(sinExtension(f?.name ?? '')))) return true;
  const segs = segmentosDe(f);
  return segs.length > 0 && segs[segs.length - 1] === 'voz';
}

/**
 * La partitura que va al FOLLETO DEL PUEBLO, o nada.
 *
 * Solo la de la Voz de ESA parte y ESA Misa. No hereda la partitura que el canto tenga
 * vinculada —esa es la del coro, la completa con cifrado, y se abre en el Atril— ni cae
 * a ninguna otra voz. Sin archivo de Voz devuelve `undefined` y el folleto imprime la
 * letra, que es exactamente lo que pidió el coro el 25-sep-2026.
 */
export async function resolveSheetForFolleto(song: Song): Promise<string | undefined> {
  if (!isOrdinary(song)) return undefined;
  try {
    const files = (await loadSheets()).filter(esLaVoz);
    if (!files.length) return undefined;
    const best = pickOrdinarySheet(song.category, song.massName, files);
    return best ? `https://drive.google.com/file/d/${best.id}/preview` : undefined;
  } catch {
    return undefined;
  }
}

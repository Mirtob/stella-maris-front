/**
 * Búsqueda de partituras dentro del Drive: la CARPETA de un canto polifónico y el PDF
 * suelto de un canto a una voz.
 *
 * Los dos selectores de la ficha del canto ("Partitura (Google Drive)" y "Partituras por
 * voz") eran listas con todo el Drive adentro: manejables con veinte, inservibles con
 * cientos. Aquí vive la lógica pura de ambos buscadores —filtros, orden y sugerencia por
 * título— para poder probarla sin navegador.
 *
 * Reglas de orden (de más a menos útil para quien está cargando el canto):
 *  1. Lo que se parece al TÍTULO que ya escribió (casi siempre lo que busca).
 *  2. Lo del MOMENTO del canto (las de "Entrada" si está cargando una entrada).
 *  3. El resto, alfabético; las carpetas contenedoras (las que solo agrupan otras) al final.
 */
import { detectSheets, FULL_SCORE } from './sheetParts';
import { normalizeForSearch } from './textSearch';

export interface DriveFolder { id: string; name: string; path: string }
export interface DriveFile { id: string; name: string; path?: string; parentId?: string }

/** Momento con el que se agrupa lo que está suelto en la raíz del Drive. */
export const NO_FOLDER = '(Sin carpeta)';

/** Lo que comparten una carpeta y un PDF a la hora de buscarlos y ordenarlos. */
export interface SearchableOption {
  id: string;
  /** Nombre a mostrar y a comparar con el título ("Ave María Arcadelt"). */
  name: string;
  /** Ruta completa dentro del Drive de partituras. */
  path: string;
  /** Momento de la Misa al que pertenece (1.er tramo de la ruta, ya rotulado). */
  moment: string;
  /** Tramos entre el momento y el elemento ("Adviento"), si los hay. */
  subPath: string;
  /** Qué tanto se parece su nombre al título escrito (0 = nada, 1 = todas las palabras). */
  titleScore: number;
  /**
   * Cuántas palabras tiene de más respecto del título. Desempata entre coincidencias
   * igual de buenas: con "Ave María Arcadelt", `Ave Maria Arcadelt.pdf` (0 de más) gana a
   * `Ave Maria Arcadelt-Soprano.pdf` (1 de más), que es justo lo que se quiere en el
   * selector de UNA partitura.
   */
  titleExtra: number;
  /** Texto contra el que se busca, ya normalizado. */
  searchText: string;
}

export interface FolderOption extends SearchableOption {
  /** Cuántos PDF cuelgan directamente de ella. */
  pdfCount: number;
  /** Voces detectadas por el nombre de esos PDF (sin la partitura general). */
  parts: string[];
  /** Cuántas subcarpetas tiene: >0 = es una carpeta que agrupa, no la de un canto. */
  childFolders: number;
}

export interface FileOption extends SearchableOption {
  /** Nombre del archivo tal cual está en Drive, con extensión. */
  fileName: string;
}

/**
 * Alias carpeta-de-Drive → etiqueta de la app, para los nombres que no coinciden
 * textualmente. En Drive las carpetas se llaman "Salida" y "Comunion" (sin tilde),
 * mientras la app rotula "Final / Salida" y "Comunión". Ojo: NO conviene renombrar la
 * carpeta a "Final / Salida" en Drive, porque la barra es el separador de la ruta.
 */
const FOLDER_ALIASES: Record<string, string> = {
  salida: 'Final / Salida',
  final: 'Final / Salida',
  misas: 'Kyrie', // las partes del ordinario viven bajo "Misas/<nombre de la Misa>"
};

/** Sin acentos, minúsculas, sin espacios de sobra. */
const folderKey = (s: string) => normalizeForSearch(s).trim();

/**
 * Devuelve la función que rotula una carpeta con su momento de la Misa. Se le pasan las
 * etiquetas que usa la app (MOMENT_OPTIONS) para no duplicar esa lista aquí.
 */
export function makeMomentLabeler(momentLabels: string[]): (folder: string) => string {
  const byKey = new Map(momentLabels.map(l => [folderKey(l), l]));
  return (folder: string) =>
    byKey.get(folderKey(folder)) ?? FOLDER_ALIASES[folderKey(folder)] ?? folder;
}

/** Palabras que no distinguen un canto de otro y por eso no cuentan al comparar títulos. */
const STOPWORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'a', 'al', 'en', 'un', 'una', 'unos',
  'unas', 'con', 'por', 'para', 'mi', 'tu', 'su', 'oh', 'que', 'se', 'lo', 'te', 'me',
]);

/** Palabras significativas de un texto (sin acentos, sin muletillas, sin las de una letra). */
function words(value: string): string[] {
  return normalizeForSearch(value)
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * Qué fracción de las palabras del título aparece en el nombre de la carpeta. Se acepta
 * el prefijo ("maria" encuentra "marias", "arcadelt" encuentra "arcadelt2") porque en
 * Drive los nombres traen numeraciones y variantes.
 */
export function titleMatchScore(folderName: string, title: string): number {
  return titleAffinity(folderName, title).score;
}

/** Dos palabras se consideran la misma si una es prefijo de la otra ("maria" ↔ "marias"). */
const sameWord = (a: string, b: string) => a === b || a.startsWith(b) || b.startsWith(a);

/**
 * Parecido con el título: qué fracción de sus palabras aparece (`score`) y cuántas
 * palabras sobran en el nombre (`extra`, para desempatar entre coincidencias iguales).
 */
export function titleAffinity(name: string, title: string): { score: number; extra: number } {
  const wanted = words(title);
  const have = words(name);
  if (wanted.length === 0 || have.length === 0) return { score: 0, extra: 0 };
  const hits = wanted.filter(w => have.some(h => sameWord(h, w))).length;
  const extra = have.filter(h => !wanted.some(w => sameWord(h, w))).length;
  return { score: hits / wanted.length, extra };
}

/** Desde este parecido consideramos que la carpeta es "la del canto" y se sugiere sola. */
export const TITLE_MATCH_THRESHOLD = 0.6;

/**
 * Arma la lista de carpetas candidatas con todo lo que el selector necesita mostrar:
 * momento, cuántos PDF tiene, qué voces se detectan y si se parece al título escrito.
 */
export function buildFolderOptions(
  folders: DriveFolder[],
  files: DriveFile[],
  opts: { momentLabels: string[]; title?: string },
): FolderOption[] {
  const labeler = makeMomentLabeler(opts.momentLabels);

  // PDF por carpeta madre, de una pasada (evita recorrer todos los archivos por carpeta).
  const pdfsByParent = new Map<string, DriveFile[]>();
  for (const f of files) {
    if (!f.parentId || !/\.pdf$/i.test(f.name)) continue;
    const list = pdfsByParent.get(f.parentId);
    if (list) list.push(f);
    else pdfsByParent.set(f.parentId, [f]);
  }

  // Subcarpetas por carpeta: una carpeta que agrupa otras no es la carpeta de un canto.
  const childCount = new Map<string, number>();
  for (const fo of folders) {
    const parentPath = fo.path.split('/').slice(0, -1).join('/');
    if (parentPath) childCount.set(parentPath, (childCount.get(parentPath) ?? 0) + 1);
  }

  const base = folders.map((fo) => {
    const segs = fo.path.split('/').map(s => s.trim()).filter(Boolean);
    const pdfs = pdfsByParent.get(fo.id) ?? [];
    const parts = detectSheets(pdfs.map(p => ({ id: p.id, name: p.name })))
      .map(s => s.part)
      .filter(p => p !== FULL_SCORE);
    return {
      id: fo.id,
      name: fo.name,
      path: fo.path,
      moment: segs.length > 1 ? labeler(segs[0]) : labeler(fo.name),
      subPath: segs.slice(1, -1).join(' / '),
      pdfCount: pdfs.length,
      parts,
      childFolders: childCount.get(fo.path) ?? 0,
      titleScore: 0,
      titleExtra: 0,
      // Se busca también por el nombre de los PDF: a veces uno recuerda el archivo
      // ("...-Soprano.pdf") y no cómo bautizó la carpeta.
      searchText: normalizeForSearch([fo.path, ...pdfs.map(p => p.name)].join(' ')),
    };
  });
  return opts.title ? scoreByTitle(base, opts.title) : base;
}

/**
 * Arma la lista de PDF sueltos para el selector de "Partitura (Google Drive)": el canto a
 * una voz enlaza UN archivo, no una carpeta. Se ve y se busca igual que las carpetas.
 */
export function buildFileOptions(
  files: DriveFile[],
  opts: { momentLabels: string[]; title?: string },
): FileOption[] {
  const labeler = makeMomentLabeler(opts.momentLabels);
  const base = files
    .filter(f => /\.pdf$/i.test(f.name))
    .map((f) => {
      const segs = (f.path || '').split('/').map(s => s.trim()).filter(Boolean);
      const name = f.name.replace(/\.pdf$/i, '');
      const path = segs.length ? `${segs.join('/')}/${f.name}` : f.name;
      return {
        id: f.id,
        name,
        fileName: f.name,
        path,
        moment: segs.length ? labeler(segs[0]) : NO_FOLDER,
        subPath: segs.slice(1).join(' / '),
        titleScore: 0,
      titleExtra: 0,
        searchText: normalizeForSearch(path),
      };
    });
  return opts.title ? scoreByTitle(base, opts.title) : base;
}

/**
 * Recalcula solo el parecido con el título. Se separa de los `build…` porque el título se
 * reescribe letra por letra mientras se carga el canto, y rehacer el recorrido de miles de
 * archivos en cada tecla no hace falta.
 */
export function scoreByTitle<T extends SearchableOption>(options: T[], title: string): T[] {
  const t = title.trim();
  return options.map((o) => {
    const { score, extra } = t ? titleAffinity(o.name, t) : { score: 0, extra: 0 };
    return { ...o, titleScore: score, titleExtra: extra };
  });
}

export interface SearchFilter {
  /** Texto libre: deben aparecer TODAS las palabras, en cualquier orden. */
  query?: string;
  /** Etiqueta de momento, o vacío para todos. */
  moment?: string;
}

export interface FolderFilter extends SearchFilter {
  /** Ocultar las carpetas que todavía no tienen ningún PDF (por defecto, sí). */
  onlyWithPdf?: boolean;
}

/** ¿Esto pasa el texto buscado? Todas las palabras, en cualquier orden. */
function matchesQuery(option: SearchableOption, query: string): boolean {
  const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  return terms.every(t => option.searchText.includes(t));
}

/**
 * Filtra y ORDENA. El orden es la mitad del valor: quien carga un canto quiere ver arriba
 * lo que se llama como él, y después lo de su momento. `demote` marca lo que debe caer al
 * final aunque coincida (las carpetas que solo agrupan otras).
 */
export function filterOptions<T extends SearchableOption>(
  options: T[],
  filter: SearchFilter,
  opts: { currentMomentLabel?: string; demote?: (option: T) => boolean } = {},
): T[] {
  const { query = '', moment = '' } = filter;
  const hit = options.filter((o) => {
    if (moment && o.moment !== moment) return false;
    if (query && !matchesQuery(o, query)) return false;
    return true;
  });

  const rank = (o: T) => {
    if (o.titleScore >= TITLE_MATCH_THRESHOLD) return 0;                  // lo del canto
    if (opts.demote?.(o)) return 3;
    if (opts.currentMomentLabel && o.moment === opts.currentMomentLabel) return 1;
    return 2;
  };

  return hit.sort((a, b) =>
    (rank(a) - rank(b)) ||
    (b.titleScore - a.titleScore) ||
    // Entre coincidencias iguales, primero la más "limpia": con el título "Ave María
    // Arcadelt", el PDF general antes que sus voces (`…-Soprano`, `…-Alto`). Solo aplica
    // si de verdad coinciden: si no, mandaría el largo del nombre en vez del alfabeto.
    (a.titleScore > 0 ? a.titleExtra - b.titleExtra : 0) ||
    a.path.localeCompare(b.path, 'es'));
}

/** Igual que `filterOptions`, más el filtro de "solo carpetas que ya tienen PDF". */
export function filterFolderOptions(
  options: FolderOption[],
  filter: FolderFilter,
  currentMomentLabel?: string,
): FolderOption[] {
  const { onlyWithPdf = true, ...rest } = filter;
  const visible = onlyWithPdf ? options.filter(o => o.pdfCount > 0) : options;
  return filterOptions(visible, rest, {
    currentMomentLabel,
    demote: o => o.childFolders > 0 && o.pdfCount === 0,   // solo agrupa
  });
}

/** Momentos presentes, con cuántos elementos hay en cada uno (para los chips). */
export function momentCountsOf(
  options: SearchableOption[],
  momentLabels: string[],
): { moment: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const o of options) counts.set(o.moment, (counts.get(o.moment) ?? 0) + 1);
  const order = (m: string) => {
    if (m === NO_FOLDER) return momentLabels.length + 1;   // lo suelto, al final del todo
    const i = momentLabels.indexOf(m);
    return i === -1 ? momentLabels.length : i;             // los desconocidos, antes
  };
  return Array.from(counts.entries())
    .map(([moment, count]) => ({ moment, count }))
    .sort((a, b) => (order(a.moment) - order(b.moment)) || a.moment.localeCompare(b.moment, 'es'));
}

/** Los chips del selector de carpetas: por defecto no cuenta las que aún no tienen PDF. */
export function momentCounts(
  options: FolderOption[],
  momentLabels: string[],
  onlyWithPdf = true,
): { moment: string; count: number }[] {
  return momentCountsOf(onlyWithPdf ? options.filter(o => o.pdfCount > 0) : options, momentLabels);
}

/**
 * Lo que se sugiere solo por parecerse al título escrito. Solo se ofrece si hay UNA opción
 * claramente mejor: sugerir entre dos empatadas obliga a elegir igual y no ayuda.
 */
export function suggestedMatch<T extends SearchableOption>(
  options: T[],
  usable: (option: T) => boolean = () => true,
): T | undefined {
  const strong = options
    .filter(o => o.titleScore >= TITLE_MATCH_THRESHOLD && usable(o))
    .sort((a, b) => (b.titleScore - a.titleScore) || (a.titleExtra - b.titleExtra));
  if (strong.length === 0) return undefined;
  const [best, next] = strong;
  // Empate exacto (mismo parecido y mismas palabras de más): elegir es del usuario.
  if (next && next.titleScore === best.titleScore && next.titleExtra === best.titleExtra) {
    return undefined;
  }
  return best;
}

/** La carpeta sugerida: solo se ofrece una que ya tenga partituras adentro. */
export function suggestedFolder(options: FolderOption[]): FolderOption | undefined {
  return suggestedMatch(options, o => o.pdfCount > 0);
}

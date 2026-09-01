/**
 * Deducción de la VOZ o INSTRUMENTO al que corresponde cada PDF de una carpeta de
 * canto en Drive.
 *
 * Ajustado a cómo exporta MuseScore 4 de verdad (verificado sobre una carpeta real):
 *
 *   Ave Maria Arcadelt.pdf                      → partitura general (full score)
 *   Ave Maria Arcadelt-Soprano.pdf              → Soprano
 *   Ave Maria Arcadelt-Alto.pdf                 → Alto
 *   Ave Maria Arcadelt-Trompeta_en_Sib_1.pdf    → Trompeta en Sib 1
 *   Ave Maria Arcadelt.mp3 / .mscz              → se ignoran (no son PDF)
 *
 * Reglas:
 *  - El nombre de la obra se descuenta como PREFIJO COMÚN de la carpeta, así funciona
 *    sin saber cómo se llama la obra ni depender de un separador fijo.
 *  - La etiqueta que se MUESTRA es la que escribió el músico, solo aseada (MuseScore
 *    pone guiones bajos donde hay espacios). No se renombra: si el archivo dice "Alto"
 *    la app dice "Alto", no "Contralto".
 *  - Las equivalencias existen solo para BUSCAR: quien tenga "Contralto" en su perfil
 *    encuentra igual el archivo "Alto".
 */

/** Etiqueta de la partitura general: la que ve quien no tiene voz asignada. */
export const FULL_SCORE = 'Full Score';

export interface SongSheet {
  /** Voz o instrumento tal como lo nombró el músico ('Soprano', 'Trompeta en Sib 1'). */
  part: string;
  /** Id del archivo en Drive. */
  fileId: string;
  /** Nombre del archivo, para poder auditar de dónde salió la deducción. */
  fileName: string;
}

/** Sin acentos, minúsculas, separadores unificados. */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Equivalencias SOLO PARA BUSCAR. No renombran nada: sirven para que la voz del perfil
 * encuentre el archivo aunque el músico lo haya nombrado con el otro término.
 */
const EQUIVALENTS: string[][] = [
  ['contralto', 'alto'],
  ['bajo', 'bass', 'baritono'],
  ['soprano', 'tiple'],
  ['organo', 'organ'],
  ['trombon', 'trombone'],
  ['bombardino', 'euphonium', 'eufonio'],
  ['trompeta', 'trumpet'],
  ['corno', 'trompa', 'horn'],
  ['violonchelo', 'violoncello', 'cello', 'chelo'],
  ['saxofon', 'saxo', 'sax'],
];

/**
 * Si alguien no tiene partitura propia, a qué otra parte recurrir ANTES del full score.
 * El organista lee la línea de soprano (la melodía) cuando la obra no trae una parte de
 * órgano escrita: es lo que hace en la práctica, y es más útil que la partitura general
 * con todas las voces apiladas.
 */
const PART_FALLBACKS: Record<string, string[]> = {
  organo: ['soprano'],
  piano: ['organo', 'soprano'],
};

/** Textos que identifican la partitura general cuando el archivo no se llama como la obra. */
const FULL_SCORE_WORDS = [
  'full score', 'fullscore', 'score', 'partitura', 'partitura general',
  'general', 'completa', 'todas las voces', 'satb',
];

/** Todos los términos equivalentes a uno dado (incluido él mismo). */
function synonymsOf(term: string): string[] {
  const t = norm(term);
  const row = EQUIVALENTS.find(g => g.includes(t));
  return row ? row : [t];
}

/**
 * Quita el nombre de la obra, que MuseScore antepone a cada parte. Se calcula como el
 * prefijo compartido por los archivos de la carpeta.
 */
function commonPrefix(names: string[]): string {
  if (names.length < 2) return '';
  let prefix = names[0];
  for (const n of names.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < n.length && prefix[i] === n[i]) i++;
    prefix = prefix.slice(0, i);
    if (!prefix) break;
  }
  // Cortar en el último separador para no partir una palabra por la mitad.
  return prefix.replace(/[\s\-_.]+$/, '');
}

/**
 * Asea la etiqueta para mostrarla: MuseScore escribe los espacios como guiones bajos
 * ("Trompeta_en_Sib_1"), y el separador con la obra queda al inicio ("-Alto").
 */
function cleanLabel(raw: string): string {
  return raw
    .replace(/^[\s\-_.]+/, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convierte los PDF de una carpeta de Drive en la lista de partituras del canto.
 * Ignora todo lo que no sea PDF (MuseScore deja .mp3 y .mscz en la misma carpeta).
 * Devuelve el full score primero y el resto en orden coral (SATB) y luego alfabético.
 */
export function detectSheets(files: { id: string; name: string }[], ext = 'pdf'): SongSheet[] {
  // `ext` existe para los AUDIOS de ensayo: MuseScore exporta los MP3 por voz con
  // exactamente la misma convención de nombres que los PDF (`Obra-Soprano.mp3`), así
  // que la deducción de voces es la misma y no tiene por qué escribirse dos veces.
  const re = new RegExp(`\\.${ext}$`, 'i');
  const pdfs = files.filter(f => re.test(f.name));
  if (pdfs.length === 0) return [];

  const base = commonPrefix(pdfs.map(f => f.name.replace(re, '')));
  const sheets: SongSheet[] = pdfs.map((f) => {
    const stem = f.name.replace(re, '');
    const remainder = base && stem.startsWith(base) ? stem.slice(base.length) : stem;
    const label = cleanLabel(remainder);
    const isFull = !label || FULL_SCORE_WORDS.includes(norm(label));
    return { part: isFull ? FULL_SCORE : label, fileId: f.id, fileName: f.name };
  });

  // Un único PDF en la carpeta es, por definición, la partitura del canto.
  if (sheets.length === 1) return [{ ...sheets[0], part: FULL_SCORE }];

  const ORDER = ['soprano', 'contralto', 'alto', 'tenor', 'bajo'];
  const rank = (p: string) => {
    if (p === FULL_SCORE) return -1;
    const n = norm(p);
    const i = ORDER.findIndex(o => n.startsWith(o));
    return i === -1 ? 100 : i;
  };
  return sheets.sort((a, b) => (rank(a.part) - rank(b.part)) || a.part.localeCompare(b.part));
}

/**
 * Partes que se ofrecen en los selectores (perfil y Modo Atril). Es solo una ayuda para
 * no tener que escribir: la voz es TEXTO LIBRE, así que quien toque algo que no esté
 * aquí puede escribirlo y funcionará igual.
 */
export const COMMON_PARTS = [
  'Soprano', 'Alto', 'Tenor', 'Bajo',
  'Órgano', 'Piano', 'Guitarra',
  'Flauta', 'Trompeta', 'Trombón', 'Bombardino', 'Corno', 'Clarinete', 'Saxofón',
  'Violín', 'Viola', 'Violonchelo', 'Contrabajo',
];

/**
 * Voz efectiva de una persona: la que fijó en su perfil o, si no fijó ninguna, la que
 * implica su instrumento. Un organista que nunca tocó Ajustes debe leer igualmente la
 * parte de órgano (y, por PART_FALLBACKS, la de soprano si la obra no la trae) en vez
 * del full score con todas las voces apiladas.
 */
export function effectiveVoicePart(voicePart?: string, instrument?: string): string | undefined {
  if (voicePart) return voicePart;
  if (instrument && norm(instrument) === 'organo') return 'Órgano';
  return undefined;
}

/** La partitura por defecto: el full score si existe, si no la primera. */
export function defaultSheet(sheets: SongSheet[]): SongSheet | undefined {
  return sheets.find(s => s.part === FULL_SCORE) ?? sheets[0];
}

/** Busca una partitura cuyo nombre empiece por alguno de esos términos. */
function findByTerms(sheets: SongSheet[], terms: string[]): SongSheet | undefined {
  for (const t of terms) {
    const exact = sheets.find(s => norm(s.part) === t);
    if (exact) return exact;
  }
  // Prefijo: "Trompeta" debe encontrar "Trompeta en Sib 1"; "Soprano", "Soprano 2".
  for (const t of terms) {
    const loose = sheets.find(s => norm(s.part).startsWith(t));
    if (loose) return loose;
  }
  return undefined;
}

/**
 * La partitura que le toca a alguien. En orden: su parte (o un sinónimo), luego el
 * respaldo definido para ella (el organista lee soprano si no hay parte de órgano) y,
 * como último recurso, el full score. Nunca devuelve `undefined` habiendo partituras:
 * es preferible ver la general que no ver nada.
 */
export function sheetForPart(sheets: SongSheet[], part?: string): SongSheet | undefined {
  if (!sheets.length) return undefined;
  if (part) {
    const own = findByTerms(sheets, synonymsOf(part));
    if (own) return own;
    for (const fb of PART_FALLBACKS[norm(part)] ?? []) {
      const alt = findByTerms(sheets, synonymsOf(fb));
      if (alt) return alt;
    }
  }
  return defaultSheet(sheets);
}

/**
 * ¿Esta persona tiene una partitura PROPIA en este canto (no la general)? Cuenta también
 * el respaldo: el organista que termina leyendo la de soprano sí debe ver partitura.
 */
export function hasPartSheet(sheets: SongSheet[] | undefined, part?: string): boolean {
  if (!sheets?.length || !part) return false;
  const found = sheetForPart(sheets, part);
  return !!found && found.part !== FULL_SCORE;
}

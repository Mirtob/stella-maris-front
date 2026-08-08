/**
 * Deducción de la VOZ o INSTRUMENTO al que corresponde cada PDF de una carpeta de
 * canto en Drive.
 *
 * Los coros escriben las partituras en MuseScore, que al "exportar partes" genera un
 * archivo por voz/instrumento con el nombre `<Obra>-<Parte>.pdf`, más el full score
 * con el nombre de la obra a secas. De ahí se puede deducir la parte sin pedirle a
 * nadie que la escriba a mano.
 *
 * Criterio: reconocer lo habitual (SATB + instrumentos) y, ante lo desconocido,
 * NO inventar — se conserva el texto tal cual (así "Bombardino 2" o "Viola da gamba"
 * siguen siendo etiquetas útiles aunque no estén en ninguna lista).
 */

/** Etiqueta de la partitura general: la que ve quien no tiene voz asignada. */
export const FULL_SCORE = 'Full Score';

export interface SongSheet {
  /** Voz o instrumento, ya normalizado ('Soprano', 'Trompeta', 'Full Score'…). */
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
 * Sinónimos → etiqueta canónica. Se comparan como PALABRAS dentro del texto restante,
 * no como subcadenas, para que "sopranos" no case pero "alto" tampoco se dispare
 * dentro de "contralto" por accidente (el orden de la lista resuelve ese caso: se
 * prueba primero 'contralto').
 */
const PART_SYNONYMS: [canonical: string, synonyms: string[]][] = [
  // Voces (SATB y variantes habituales en partituras corales).
  ['Soprano', ['soprano', 'sopranos', 'sopran', 'tiple', 's']],
  ['Contralto', ['contralto', 'contraltos', 'alto', 'altos', 'a']],
  ['Tenor', ['tenor', 'tenores', 't']],
  ['Bajo', ['bajo', 'bajos', 'bass', 'baritono', 'barítono', 'b']],
  // Teclado y cuerda pulsada.
  ['Órgano', ['organo', 'organ', 'organo manual']],
  ['Piano', ['piano']],
  ['Guitarra', ['guitarra', 'guitar']],
  // Viento — los que el usuario nombró y sus vecinos naturales.
  ['Flauta', ['flauta', 'flute', 'flauta traversa']],
  ['Trompeta', ['trompeta', 'trumpet']],
  ['Trombón', ['trombon', 'trombone']],
  ['Bombardino', ['bombardino', 'euphonium', 'eufonio']],
  ['Corno', ['corno', 'trompa', 'horn']],
  ['Clarinete', ['clarinete', 'clarinet']],
  ['Saxofón', ['saxofon', 'saxo', 'sax']],
  // Cuerda frotada.
  ['Violín', ['violin']],
  ['Viola', ['viola']],
  ['Violonchelo', ['violonchelo', 'violoncello', 'cello', 'chelo']],
  ['Contrabajo', ['contrabajo', 'contrabass']],
];

/** Textos que identifican la partitura general. */
const FULL_SCORE_WORDS = [
  'full score', 'fullscore', 'score', 'partitura', 'partitura general',
  'general', 'completa', 'todas las voces', 'coro', 'satb',
];

/**
 * Quita del nombre del archivo la parte común a todos (el nombre de la obra), que es
 * lo que MuseScore antepone. Se calcula como el prefijo compartido por los archivos
 * de la carpeta: así funciona sin saber cómo se llama la obra.
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

/** Deduce la parte de UN archivo, ya descontado el nombre de la obra. */
function partFromRemainder(remainder: string, fullName: string): string {
  const rest = norm(remainder);

  // Sin resto (el archivo se llama igual que la obra) → es el full score.
  if (!rest) return FULL_SCORE;
  if (FULL_SCORE_WORDS.some(w => rest === w || rest.startsWith(`${w} `) || rest.endsWith(` ${w}`))) {
    return FULL_SCORE;
  }

  const words = rest.split(' ').filter(Boolean);
  for (const [canonical, synonyms] of PART_SYNONYMS) {
    // Coincidencia por palabra completa; las abreviaturas de una letra (S/A/T/B)
    // solo valen si el resto es EXACTAMENTE esa letra, o se dispararían por todo.
    const hit = synonyms.some(syn =>
      syn.length === 1 ? rest === syn : words.includes(syn) || rest === syn);
    if (hit) {
      // Solo se normaliza cuando el resto es la voz (con un número opcional de
      // refuerzo). Si hay más palabras, se respeta el texto original: colapsar
      // "Viola da gamba" a "Viola" o "Trompeta en Sib" a "Trompeta" sería inventar
      // una parte que el músico no escribió. Igual se encuentran al buscar, porque
      // sheetForPart() también compara por prefijo.
      const extra = words.filter(w => !synonyms.includes(w) && !/^[12345]$/.test(w));
      if (extra.length > 0) break;
      const num = rest.match(/\b([12345])\b/);
      return num ? `${canonical} ${num[1]}` : canonical;
    }
  }

  // Desconocido: se respeta lo que escribió el músico, con la inicial en mayúscula.
  const raw = remainder.replace(/^[\s\-_.]+/, '').replace(/\.pdf$/i, '').trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : fullName.replace(/\.pdf$/i, '');
}

/**
 * Convierte los PDF de una carpeta de Drive en la lista de partituras del canto.
 * Devuelve el full score primero y el resto en orden coral (SATB) y luego alfabético,
 * que es como los espera ver un músico.
 */
export function detectSheets(files: { id: string; name: string }[]): SongSheet[] {
  const pdfs = files.filter(f => /\.pdf$/i.test(f.name));
  if (pdfs.length === 0) return [];

  const base = commonPrefix(pdfs.map(f => f.name.replace(/\.pdf$/i, '')));
  const sheets: SongSheet[] = pdfs.map((f) => {
    const stem = f.name.replace(/\.pdf$/i, '');
    const remainder = base && stem.startsWith(base) ? stem.slice(base.length) : stem;
    return { part: partFromRemainder(remainder, f.name), fileId: f.id, fileName: f.name };
  });

  // Un único PDF en la carpeta es, por definición, la partitura del canto.
  if (sheets.length === 1) return [{ ...sheets[0], part: FULL_SCORE }];

  const ORDER = ['Soprano', 'Contralto', 'Tenor', 'Bajo'];
  const rank = (p: string) => {
    if (p === FULL_SCORE) return -1;
    const i = ORDER.findIndex(o => p.startsWith(o));
    return i === -1 ? 100 : i;
  };
  return sheets.sort((a, b) => (rank(a.part) - rank(b.part)) || a.part.localeCompare(b.part));
}

/** La partitura por defecto: el full score si existe, si no la primera. */
export function defaultSheet(sheets: SongSheet[]): SongSheet | undefined {
  return sheets.find(s => s.part === FULL_SCORE) ?? sheets[0];
}

/**
 * La partitura que le toca a alguien: la de su voz/instrumento si existe, y si no
 * el full score. Nunca devuelve `undefined` habiendo partituras: es preferible ver
 * la general que no ver nada.
 */
export function sheetForPart(sheets: SongSheet[], part?: string): SongSheet | undefined {
  if (!sheets.length) return undefined;
  if (part) {
    const exact = sheets.find(s => norm(s.part) === norm(part));
    if (exact) return exact;
    // "Soprano" debe encontrar "Soprano 1" si no hay un "Soprano" a secas.
    const loose = sheets.find(s => norm(s.part).startsWith(norm(part)));
    if (loose) return loose;
  }
  return defaultSheet(sheets);
}

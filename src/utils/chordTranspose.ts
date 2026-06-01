/**
 * Utilidad para transponer acordes musicales
 * Usado para que los guitarristas puedan cambiar la tonalidad
 */

// Notas en orden cromático (escala de 12 semitonos)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Mapeo de notación alternativa (bemoles a sostenidos)
const NOTE_MAPPING: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

/**
 * Transpone una nota individual
 * @param note - Nota a transponer (ej: "C", "Am", "G7")
 * @param semitones - Número de semitonos a subir (+) o bajar (-)
 */
function transposeNote(note: string, semitones: number): string {
  // Separar la nota base del modificador (m, 7, sus4, etc.)
  const noteMatch = note.match(/^([A-G][#b]?)(.*)/);
  
  if (!noteMatch) return note; // Si no es una nota válida, devolver sin cambios
  
  let baseNote = noteMatch[1];
  const modifier = noteMatch[2];
  
  // Convertir bemoles a sostenidos
  if (baseNote in NOTE_MAPPING) {
    baseNote = NOTE_MAPPING[baseNote];
  }
  
  // Buscar el índice de la nota en la escala
  const currentIndex = NOTES.indexOf(baseNote);
  
  if (currentIndex === -1) return note; // Nota no válida
  
  // Calcular el nuevo índice
  let newIndex = (currentIndex + semitones) % 12;
  
  // Manejar índices negativos
  if (newIndex < 0) {
    newIndex = 12 + newIndex;
  }
  
  // Devolver la nueva nota con su modificador
  return NOTES[newIndex] + modifier;
}

/**
 * Transpone todos los acordes en una línea de texto
 * @param line - Línea de texto con acordes
 * @param semitones - Número de semitonos a transponer
 */
export function transposeLine(line: string, semitones: number): string {
  // Patrón para encontrar acordes (letras mayúsculas seguidas opcionalmente de #, b, m, 7, etc.)
  const chordPattern = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9])*)\b/g;
  
  return line.replace(chordPattern, (match) => {
    return transposeNote(match, semitones);
  });
}

/**
 * Transpone todo el contenido (letra con acordes)
 * @param content - Texto completo con letras y acordes
 * @param semitones - Número de semitonos a transponer
 */
export function transposeContent(content: string, semitones: number): string {
  // Si no hay transposición, devolver el contenido original
  if (semitones === 0) return content;
  
  // Dividir en líneas y transponer cada una
  const lines = content.split('\n');
  const transposedLines = lines.map(line => transposeLine(line, semitones));
  
  return transposedLines.join('\n');
}

/**
 * Obtiene el nombre de la tonalidad transpuesta
 * @param originalKey - Tonalidad original (ej: "G")
 * @param semitones - Número de semitonos transpuestos
 */
export function getTransposedKey(originalKey: string, semitones: number): string {
  return transposeNote(originalKey, semitones);
}

/**
 * Formatea el número de semitonos como texto descriptivo
 * @param semitones - Número de semitonos
 */
export function formatTransposition(semitones: number): string {
  if (semitones === 0) return 'Tono original';
  if (semitones > 0) return `+${semitones} ${Math.abs(semitones) === 1 ? 'semitono' : 'semitonos'}`;
  return `${semitones} ${Math.abs(semitones) === 1 ? 'semitono' : 'semitonos'}`;
}

import { FormattedText } from './FormattedText';
import { isCenteredLine, stripCenterMarker } from '../../utils/lyricsFormat';
import { useReadingPrefs } from '../../hooks/useReadingPrefs';
import { soloLaAclamacion, AVISO_ESTROFA } from '../../utils/aleluyaEstrofa';

interface LyricsOnlyProps {
  lyrics: string;
  /**
   * Este canto es el Aleluya (o la Aclamación al Evangelio).
   *
   * Cambia lo que se muestra: la estrofa que trae el canto en el catálogo está ahí
   * como EJEMPLO, para poder escribir los acordes. La de verdad es propia de cada
   * domingo y la canta el cantor. Enseñada tal cual, el pueblo la lee y la canta.
   */
  esAleluya?: boolean;
  /** Aplica la preferencia de lectura (tamaño + alto contraste). El Atril lo desactiva
   *  porque tiene su propio zoom y fondo oscuro. */
  applyReadingPrefs?: boolean;
}

/**
 * Componente para mostrar SOLO la letra de cantos (sin acordes).
 * Para uso exclusivo de Pueblo Fiel.
 *
 * Este componente elimina todos los acordes [X] y muestra únicamente el texto.
 * El tamaño de letra y el alto contraste se controlan con `useReadingPrefs`.
 */
export function LyricsOnly({ lyrics, applyReadingPrefs = true, esAleluya = false }: LyricsOnlyProps) {
  const { prefs } = useReadingPrefs();
  const scale = applyReadingPrefs ? prefs.scale : 1;
  const hc = applyReadingPrefs && prefs.highContrast;

  const { letra, seQuitoLaEstrofa } = esAleluya
    ? soloLaAclamacion(lyrics)
    : { letra: lyrics, seQuitoLaEstrofa: false };
  lyrics = letra;

  if (!lyrics) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400 py-4">
        <p className="text-sm">Letra no disponible</p>
      </div>
    );
  }

  // Función para eliminar todos los acordes [X] de una línea
  const removeChords = (line: string): string => {
    return line.replace(/\[([^\]]+)\]/g, '');
  };

  // Función para procesar cada línea
  const processLine = (line: string, lineIndex: number) => {
    // Centrado (prefijo ">> ") y luego quitar acordes.
    const centered = isCenteredLine(line);
    const cleanedLine = removeChords(centered ? stripCenterMarker(line) : line);

    // Línea vacía = espacio
    if (cleanedLine.trim() === '') {
      return <div key={lineIndex} className="h-4" />;
    }

    // Detectar si es un encabezado de sección (Coro, Estrofa, Puente, etc.)
    if (/^(Coro|Estrofa|Puente|Intro|Final|Verso)(\s+\d+)?:?\s*$/i.test(cleanedLine.trim())) {
      return (
        <div key={lineIndex} className={`font-bold text-[1.15em] mt-4 mb-2 ${hc ? 'text-blue-900 dark:text-blue-100' : 'text-blue-700 dark:text-blue-300'} ${centered ? 'text-center' : ''}`}>
          {cleanedLine.trim()}
        </div>
      );
    }

    // Texto normal (sin acordes), con formato inline (**negrita**, *cursiva*, __subrayado__).
    return (
      <div key={lineIndex} className={`text-[1em] leading-relaxed py-1 ${hc ? 'text-black dark:text-white font-medium' : 'text-gray-900 dark:text-gray-100'} ${centered ? 'text-center' : ''}`}>
        <FormattedText text={cleanedLine} />
      </div>
    );
  };

  const lines = lyrics.split('\n');

  return (
    <div
      className={`rounded-xl p-6 border-2 ${hc ? 'bg-white dark:bg-black border-black dark:border-white' : 'bg-white/80 dark:bg-white/10 border-blue-200 dark:border-blue-700'}`}
      style={{ fontSize: `${scale}rem` }}
    >
      <div className="space-y-1">
        {lines.map((line, index) => processLine(line, index))}
      </div>
      {/* Se explica el hueco: sin esto, quien conocía el canto puede pensar que falta
          la letra, o buscar en el papel una estrofa que no está. */}
      {seQuitoLaEstrofa && (
        <p className="mt-3 pt-3 border-t border-gray-200 dark:border-white/15 text-[0.8em] italic text-gray-600 dark:text-gray-400">
          {AVISO_ESTROFA}
        </p>
      )}
    </div>
  );
}

interface LyricsOnlyProps {
  lyrics: string;
}

/**
 * Componente para mostrar SOLO la letra de cantos (sin acordes).
 * Para uso exclusivo de Pueblo Fiel.
 * 
 * Este componente elimina todos los acordes [X] y muestra únicamente el texto.
 */
export function LyricsOnly({ lyrics }: LyricsOnlyProps) {
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
    const cleanedLine = removeChords(line);

    // Línea vacía = espacio
    if (cleanedLine.trim() === '') {
      return <div key={lineIndex} className="h-4" />;
    }

    // Detectar si es un encabezado de sección (Coro, Estrofa, Puente, etc.)
    if (/^(Coro|Estrofa|Puente|Intro|Final|Verso)(\s+\d+)?:?\s*$/i.test(cleanedLine.trim())) {
      return (
        <div key={lineIndex} className="text-blue-700 dark:text-blue-300 font-bold text-lg mt-4 mb-2">
          {cleanedLine.trim()}
        </div>
      );
    }

    // Texto normal (sin acordes)
    return (
      <div key={lineIndex} className="text-gray-900 dark:text-gray-100 text-base leading-relaxed py-1">
        {cleanedLine}
      </div>
    );
  };

  const lines = lyrics.split('\n');

  return (
    <div className="bg-white/80 dark:bg-white/10 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700">
      <div className="space-y-1">
        {lines.map((line, index) => processLine(line, index))}
      </div>
    </div>
  );
}

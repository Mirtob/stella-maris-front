import { memo, useMemo } from 'react';
import { stripLyricsFormatting } from '../../utils/lyricsFormat';

interface LyricsWithChordsProps {
  lyrics: string;
}

/**
 * Componente para mostrar letra de cantos con acordes.
 * 
 * Formato esperado de la letra:
 * - Los acordes deben estar entre corchetes: [C], [Am], [G7], etc.
 * - Los acordes se mostrarán encima de la letra en el punto donde aparecen
 * 
 * Ejemplo:
 * "[C]Santo, [G]Santo, [Am]Santo\n[F]Es el Se[G]ñor"
 */
/**
 * Q34 — memoizado con React.memo y useMemo para evitar re-render de 300+
 * spans absolutamente posicionados cuando el padre re-renderiza por
 * cualquier cambio. Re-rendea solo si cambia el prop `lyrics`.
 */
function LyricsWithChordsImpl({ lyrics }: LyricsWithChordsProps) {
  if (!lyrics) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400 py-4">
        <p className="text-sm">Letra no disponible</p>
      </div>
    );
  }

  // Función para procesar cada línea y mostrar acordes encima
  const processLine = (line: string, lineIndex: number) => {
    line = stripLyricsFormatting(line); // el Coro ve la letra sin marcadores de formato
    if (line.trim() === '') {
      return <div key={lineIndex} className="h-4" />; // Espacio en blanco
    }

    // Detectar si es un encabezado de sección (Coro, Estrofa, Puente, etc.)
    if (/^(Coro|Estrofa|Puente|Intro|Final|Verso)(\s+\d+)?:?\s*$/i.test(line.trim())) {
      return (
        <div key={lineIndex} className="text-amber-700 dark:text-amber-300 font-bold text-base mt-4 mb-2">
          {line.trim()}
        </div>
      );
    }

    // Buscar todos los acordes [X] en la línea
    const chordRegex = /\[([^\]]+)\]/g;
    const parts: Array<{ type: 'chord' | 'text'; content: string; position: number }> = [];
    let lastIndex = 0;
    let match;

    while ((match = chordRegex.exec(line)) !== null) {
      // Agregar texto antes del acorde
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: line.substring(lastIndex, match.index),
          position: lastIndex
        });
      }

      // Agregar el acorde
      parts.push({
        type: 'chord',
        content: match[1],
        position: match.index
      });

      lastIndex = match.index + match[0].length;
    }

    // Agregar el texto restante
    if (lastIndex < line.length) {
      parts.push({
        type: 'text',
        content: line.substring(lastIndex),
        position: lastIndex
      });
    }

    // Si no hay acordes en la línea, mostrarla como texto simple
    if (parts.length === 0 || parts.every(p => p.type === 'text')) {
      return (
        <div key={lineIndex} className="text-gray-900 dark:text-gray-100 text-base leading-relaxed py-1">
          {line}
        </div>
      );
    }

    // Agrupar en "columnas": cada columna = acorde (arriba) + el texto que le sigue
    // (abajo). Así el acorde queda ENCIMA de la sílaba, sin superponerse a la letra
    // y sin separar la palabra (las columnas se pegan: "ale"+"gría" = "alegría").
    type Chunk = { chord: string; text: string };
    const chunks: Chunk[] = [];
    let cur: Chunk = { chord: '', text: '' };
    let started = false;
    for (const part of parts) {
      if (part.type === 'chord') {
        if (started) chunks.push(cur);
        cur = { chord: part.content, text: '' };
        started = true;
      } else {
        cur.text += part.content;
        started = true;
      }
    }
    chunks.push(cur);

    return (
      <div key={lineIndex} className="leading-relaxed py-1">
        {chunks.map((c, i) => (
          <span key={i} className="inline-flex flex-col align-bottom">
            <span className="h-5 leading-none text-blue-700 dark:text-blue-300 font-bold text-sm whitespace-pre">
              {c.chord || ' '}
            </span>
            <span className="text-gray-900 dark:text-gray-100 text-base whitespace-pre-wrap">
              {c.text || ' '}
            </span>
          </span>
        ))}
      </div>
    );
  };

  // Q34 — memo del split para que no rompa la igualdad referencial cuando
  // el padre re-renderiza con el mismo lyrics (común al cambiar transposition).
  const lines = useMemo(() => lyrics.split('\n'), [lyrics]);

  return (
    <div className="bg-white/60 dark:bg-white/10 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700 font-mono">
      <div className="space-y-1">
        {lines.map((line, index) => processLine(line, index))}
      </div>
    </div>
  );
}

export const LyricsWithChords = memo(LyricsWithChordsImpl);

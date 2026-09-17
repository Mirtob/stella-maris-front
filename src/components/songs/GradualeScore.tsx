import { useState } from 'react';

interface GradualeScoreProps {
  /** Recorte del facsímil (campo `gradualeImage` del canto sintético). */
  src: string;
  alt: string;
  /** De qué libro y página sale, para el pie. */
  fuente?: string;
  /** Zoom (1 = ancho del contenedor). */
  zoom?: number;
  /** Texto claro sobre fondo oscuro (Modo Atril). */
  onDark?: boolean;
}

/**
 * El tetragrama del propio gregoriano, recortado del Graduale.
 *
 * Va como imagen y no como PDF porque los dos libros son facsímiles escaneados y pdf.js
 * no los dibuja bajo la CSP estricta — lo mismo que pasa con el salmo del libro.
 *
 * Se muestra al coro Y al pueblo: el gregoriano es canto de toda la asamblea, así que
 * esta partitura no lleva la condición de rol que sí llevan las demás.
 *
 * El fondo es blanco fijo, también en el Atril a oscuras: el facsímil es tinta negra
 * sobre papel y sobre fondo oscuro se vuelve ilegible.
 */
export function GradualeScore({ src, alt, fuente, zoom = 1, onDark }: GradualeScoreProps) {
  const [falló, setFalló] = useState(false);

  if (falló) {
    return (
      <p className={`text-xs text-center py-4 ${onDark ? 'text-white/70' : 'text-brand-ink-soft'}`}>
        La partitura de este propio todavía no está disponible en la app.
      </p>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFalló(true)}
          style={{ width: `${Math.round(100 * zoom)}%`, maxWidth: zoom <= 1 ? '100%' : 'none' }}
          className="block mx-auto rounded-md bg-white"
        />
      </div>
      {fuente && (
        <p className={`mt-1 text-[11px] text-center ${onDark ? 'text-white/60' : 'text-brand-ink-soft'}`}>
          {fuente}
        </p>
      )}
    </div>
  );
}

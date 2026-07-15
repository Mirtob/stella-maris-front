import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { SundayCycle } from '../../utils/liturgicalCycle';
import { psalmPageImageUrl } from '../../data/psalmIndex';

interface PsalmPageImageProps {
  cycle: SundayCycle;
  /** Página REAL del PDF (ya con offset). Coincide con el nombre del archivo .webp. */
  page: number;
  /** Última página si el salmo ocupa un rango. */
  pageEnd?: number;
  title?: string;
  driveViewUrl?: string;
  /** Zoom (1 = ancho del contenedor). */
  zoom?: number;
  /** Texto claro sobre fondo oscuro (Modo Atril). */
  onDark?: boolean;
}

/**
 * Muestra la partitura del salmo del libro como IMAGEN estática (una por página).
 * Sustituye a pdf.js para el salmo: las páginas escaneadas usan JBIG2 y pdf.js no las
 * dibuja bajo la CSP estricta. La imagen se sirve desde public/salmos/<ciclo>/<página>.webp.
 */
export function PsalmPageImage({ cycle, page, pageEnd, title, driveViewUrl, zoom = 1, onDark }: PsalmPageImageProps) {
  const pages: number[] = [];
  for (let p = page; p <= (pageEnd ?? page); p++) pages.push(p);
  return (
    <div className="w-full space-y-2">
      {pages.map((p) => (
        <OnePage key={p} src={psalmPageImageUrl(cycle, p)} alt={title || 'Salmo responsorial'} driveViewUrl={driveViewUrl} zoom={zoom} onDark={onDark} />
      ))}
    </div>
  );
}

function OnePage({ src, alt, driveViewUrl, zoom, onDark }: { src: string; alt: string; driveViewUrl?: string; zoom: number; onDark?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`flex flex-col items-center gap-3 py-6 text-center ${onDark ? 'text-white/70' : 'text-brand-ink-soft'}`}>
        <div className="text-3xl">📄</div>
        <p className="text-xs">La partitura de este salmo aún no está disponible en la app.</p>
        {driveViewUrl && (
          <a
            href={driveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`py-2 px-3 rounded-lg flex items-center gap-1 text-xs font-bold ${onDark ? 'bg-white/15 border border-white/20 text-white' : 'bg-blue-900 text-white'}`}
          >
            <ExternalLink className="w-3 h-3" /> Abrir el libro en Drive
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: `${Math.round(100 * zoom)}%`, maxWidth: zoom <= 1 ? '100%' : 'none' }}
        className="block mx-auto rounded-md bg-white"
      />
    </div>
  );
}

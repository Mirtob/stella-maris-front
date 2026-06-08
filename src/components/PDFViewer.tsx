import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Download, Loader, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface PDFViewerProps {
  proxyUrl: string;
  driveViewUrl: string;
  title: string;
}

// Worker servido desde nuestro propio dominio — más confiable que CDN
const WORKER_URL = '/pdf.worker.min.mjs';

export function PDFViewer({ proxyUrl, driveViewUrl, title }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasesRef = useRef<HTMLCanvasElement[]>([]);
  const [pdf, setPdf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  // Cargar PDF cuando cambia la URL
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const pdfjsLib: any = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

        const loadingTask = pdfjsLib.getDocument({ url: proxyUrl });
        const loadedPdf = await loadingTask.promise;
        if (cancelled) return;

        setPdf(loadedPdf);
        setLoading(false);
        setCurrentPage(1);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Error cargando PDF:', err);
        setError(err?.message || 'No se pudo cargar la partitura');
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [proxyUrl]);

  // Renderizar la página actual
  useEffect(() => {
    if (!pdf || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;

        // Ancho disponible — ajustar al contenedor
        const containerWidth = container.clientWidth - 16; // padding
        const baseViewport = page.getViewport({ scale: 1 });
        const baseScale = containerWidth / baseViewport.width;
        const viewport = page.getViewport({ scale: baseScale * zoom });

        // Crear o reutilizar canvas
        let canvas = canvasesRef.current[0];
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto';
          canvas.style.maxWidth = '100%';
          canvas.style.height = 'auto';
          container.appendChild(canvas);
          canvasesRef.current[0] = canvas;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ajustar resolución para pantallas Retina
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        ctx.scale(dpr, dpr);

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        console.error('Error renderizando página:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [pdf, currentPage, zoom]);

  const numPages = pdf?.numPages || 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg flex flex-col items-center justify-center gap-3 p-6" style={{ minHeight: 220 }}>
        <Loader className="w-7 h-7 text-blue-700 animate-spin" />
        <p className="text-xs text-gray-600">Cargando partitura...</p>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="bg-white rounded-lg flex flex-col items-center justify-center gap-3 p-5">
        <div className="text-3xl">📄</div>
        <p className="text-xs text-gray-500 text-center">No se pudo mostrar el PDF en la app</p>
        <div className="flex gap-2 w-full">
          <a
            href={driveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-900 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-1 text-xs font-bold"
          >
            <ExternalLink className="w-3 h-3" /> Abrir en Drive
          </a>
          <a
            href={proxyUrl}
            download={`${title}.pdf`}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg flex items-center justify-center gap-1 text-xs font-bold"
          >
            <Download className="w-3 h-3" /> Descargar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Toolbar */}
      {/* Q21 — Toolbar con tap targets >= 40px para mobile. Antes era p-1
          + w-3.5 = ~22px, imposible de tocar con dedo sin errar. */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between gap-2">
        {/* Paginación */}
        {numPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
              className="w-10 h-10 rounded-lg bg-blue-900 text-white disabled:opacity-40 active:scale-95 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-gray-700 px-1 min-w-[44px] text-center">{currentPage} / {numPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              aria-label="Página siguiente"
              className="w-10 h-10 rounded-lg bg-blue-900 text-white disabled:opacity-40 active:scale-95 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : <span className="text-xs text-gray-500">Pág. 1</span>}

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
            aria-label="Reducir zoom"
            className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 active:scale-95 flex items-center justify-center"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-gray-700 px-1 min-w-[48px] text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.2))}
            aria-label="Aumentar zoom"
            className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 active:scale-95 flex items-center justify-center"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas del PDF — scroll horizontal/vertical según zoom */}
      <div
        ref={containerRef}
        className="bg-gray-100 overflow-auto p-2"
        style={{ maxHeight: '70vh' }}
      />
    </div>
  );
}

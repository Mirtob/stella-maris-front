import { useEffect, useRef, useState } from 'react';
import { Loader, ExternalLink, Download } from 'lucide-react';
import { getOfflinePdf } from '../../services/offlineCache';

const WORKER_URL = '/pdf.worker.min.mjs';

interface PdfPagesProps {
  proxyUrl: string;
  driveViewUrl: string;
  title: string;
  /** Zoom global del atril (1 = ancho del contenedor). */
  zoom: number;
  /** Rango de páginas a renderizar (1-indexado). Por defecto, todas. Para el salmo del
   *  libro (un salmo por página) se pasa fromPage = toPage = página de la celebración. */
  fromPage?: number;
  toPage?: number;
}

/**
 * Renderiza TODAS las páginas de UN PDF apiladas, SIN toolbar ni scroll propio, para
 * poder encadenar varias partituras dentro del scroll continuo del Modo Atril (Órgano).
 * Carga con fallback a la copia offline cacheada, igual que PDFViewer.
 */
export function PdfPages({ proxyUrl, driveViewUrl, title, zoom, fromPage, toPage }: PdfPagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Cargar el PDF (con fallback offline).
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);
    setPdf(null);

    (async () => {
      let pdfjsLib: any;
      try {
        pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
        return;
      }
      // Al pedir un rango de páginas (salmo del libro), con disableAutoFetch pdf.js baja
      // SOLO los bytes de esa página vía Range. Requiere PDF LINEARIZADO (el libro de
      // salmos ya lo está); en no-linearizados no ubicaría la página, por eso se activa
      // solo cuando se pide un rango.
      const rangeMode = fromPage != null;
      const load = async (url: string) => (await pdfjsLib.getDocument({
        url,
        ...(rangeMode ? { disableAutoFetch: true, disableStream: false } : {}),
      }).promise);
      try {
        const doc = await load(proxyUrl);
        if (cancelled) return;
        setPdf(doc);
        setLoading(false);
      } catch {
        try {
          objectUrl = await getOfflinePdf(proxyUrl);
          if (objectUrl) {
            const doc = await load(objectUrl);
            if (cancelled) return;
            setPdf(doc);
            setLoading(false);
            return;
          }
        } catch { /* cae al error */ }
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proxyUrl]);

  // Renderizar todas las páginas como canvas dentro del contenedor.
  useEffect(() => {
    if (!pdf || !containerRef.current) return;
    let cancelled = false;
    const container = containerRef.current;

    (async () => {
      try {
        container.innerHTML = '';
        const containerWidth = (container.clientWidth || 600) - 8;
        const from = Math.max(1, fromPage ?? 1);
        const to = Math.min(pdf.numPages, toPage ?? pdf.numPages);
        for (let pageNum = from; pageNum <= to; pageNum++) {
          const page = await pdf.getPage(pageNum);
          if (cancelled) return;
          const baseViewport = page.getViewport({ scale: 1 });
          const baseScale = containerWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: baseScale * zoom });

          const canvas = document.createElement('canvas');
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 10px';
          canvas.style.maxWidth = '100%';
          canvas.style.borderRadius = '6px';
          canvas.style.background = '#ffffff';
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          const dpr = window.devicePixelRatio || 1;
          canvas.width = viewport.width * dpr;
          canvas.height = viewport.height * dpr;
          canvas.style.width = viewport.width + 'px';
          canvas.style.height = viewport.height + 'px';
          ctx.scale(dpr, dpr);
          container.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
        }
      } catch {
        /* si falla el render, queda el contenedor vacío */
      }
    })();

    return () => { cancelled = true; };
  }, [pdf, zoom, fromPage, toPage]);

  return (
    <div className="relative">
      {loading && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-white/60">
          <Loader className="w-6 h-6 animate-spin" />
          <p className="text-xs">Cargando partitura…</p>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center gap-3 py-6 text-center text-white/70">
          <div className="text-3xl">📄</div>
          <p className="text-xs">No se pudo mostrar la partitura en la app</p>
          <div className="flex gap-2">
            <a href={driveViewUrl} target="_blank" rel="noopener noreferrer" className="bg-white/15 border border-white/20 text-white py-2 px-3 rounded-lg flex items-center gap-1 text-xs font-bold">
              <ExternalLink className="w-3 h-3" /> Abrir en Drive
            </a>
            <a href={proxyUrl} download={`${title}.pdf`} className="bg-white/15 border border-white/20 text-white py-2 px-3 rounded-lg flex items-center gap-1 text-xs font-bold">
              <Download className="w-3 h-3" /> Descargar
            </a>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

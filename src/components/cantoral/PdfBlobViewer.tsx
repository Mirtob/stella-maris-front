import { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

// Worker servido desde nuestro propio dominio (igual que PDFViewer). El CSP permite
// worker-src 'self' blob:.
const WORKER_URL = '/pdf.worker.min.mjs';

/**
 * Visor de un PDF que ya tenemos como Blob, renderizado con PDF.js en canvas.
 * Se pasa el ArrayBuffer directamente a getDocument({ data }): NO usa <iframe> ni una
 * blob: URL, así esquiva el CSP (frame-src no permite blob:) y funciona también en
 * móvil, donde los iframes de PDF suelen fallar.
 */
export function PdfBlobViewer({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const pdfjsLib: any = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
        const data = await blob.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';
        const containerWidth = Math.min((container.clientWidth || 800) - 16, 820);

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: containerWidth / base.width });

          const canvas = document.createElement('canvas');
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 12px';
          canvas.style.maxWidth = '100%';
          canvas.style.boxShadow = '0 1px 8px rgba(0,0,0,0.25)';
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

        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error('Error renderizando la vista previa:', e);
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [blob]);

  return (
    <div className="relative flex-1 overflow-auto bg-gray-200 dark:bg-gray-800 p-3">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
          <Loader className="w-7 h-7 animate-spin text-blue-700 dark:text-blue-400" />
          <p className="text-sm">Generando vista previa…</p>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-gray-600 dark:text-gray-300 text-sm">
          No se pudo mostrar la vista previa. Intenta descargar el folleto.
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader, RefreshCw } from 'lucide-react';

// Worker servido desde nuestro propio dominio (igual que PDFViewer). El CSP permite
// worker-src 'self' blob:.
const WORKER_URL = '/pdf.worker.min.mjs';

/**
 * Techo de resolución. Un teléfono moderno reporta `devicePixelRatio` 3, y a esa escala
 * un cantoral de 11 cantos ocupaba **36 MB solo en lienzos** (medido: 6 páginas, 9,5
 * megapíxeles). Con el reproductor de YouTube todavía en memoria, esa reserva falla en
 * un teléfono de gama media y el visor moría con "no se pudo mostrar la vista previa",
 * sin forma de reintentar. Para un PDF de texto, 2 no se distingue de 3 a simple vista.
 */
const DPR_MAXIMO = 2;

/**
 * Presupuesto de píxeles para TODO el documento. Si el cantoral trae muchas páginas se
 * baja la escala en vez de reventar: más vale una vista previa un pelo menos nítida que
 * una pantalla de error.
 */
const PRESUPUESTO_PX = 6_000_000; // ~24 MB en lienzos

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
  // Cambiar este número vuelve a lanzar el render (botón "Reintentar").
  const [intento, setIntento] = useState(0);

  /** Suelta los lienzos: en móvil, dejarlos vivos se paga en la siguiente apertura. */
  const liberarLienzos = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll('canvas').forEach((c) => { c.width = 0; c.height = 0; });
    container.innerHTML = '';
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    /**
     * @param dprTope resolución máxima de esta pasada. El reintento baja a 1 para que
     *   un teléfono con poca memoria libre alcance a dibujar algo.
     */
    const dibujar = async (dprTope: number) => {
      const pdfjsLib: any = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
      const data = await blob.arrayBuffer();
      if (cancelled) return;
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      if (cancelled) return;

      const container = containerRef.current;
      if (!container) return;
      liberarLienzos();
      const anchoContenedor = Math.min((container.clientWidth || 800) - 16, 820);

      // Escala común a todo el documento, ajustada al presupuesto de píxeles.
      const vistas: any[] = [];
      let areaCss = 0;
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: anchoContenedor / base.width });
        vistas.push({ page, viewport });
        areaCss += viewport.width * viewport.height;
      }
      const dprPantalla = Math.min(window.devicePixelRatio || 1, dprTope);
      const dpr = Math.max(1, Math.min(dprPantalla, Math.sqrt(PRESUPUESTO_PX / Math.max(areaCss, 1))));

      for (const { page, viewport } of vistas) {
        if (cancelled) return;
        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto 12px';
        canvas.style.maxWidth = '100%';
        canvas.style.boxShadow = '0 1px 8px rgba(0,0,0,0.25)';
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        ctx.scale(dpr, dpr);

        container.appendChild(canvas);
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;
      }

      // El documento ya está pintado: soltar lo que PDF.js tenga reservado.
      try { await pdf.destroy(); } catch { /* da igual si ya se fue */ }
    };

    (async () => {
      try {
        await dibujar(DPR_MAXIMO);
        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error('Error renderizando la vista previa:', e);
        if (cancelled) return;
        // Un reintento a la mínima resolución: casi siempre es falta de memoria y a
        // la segunda, con los lienzos liberados, entra.
        try {
          liberarLienzos();
          await new Promise((r) => setTimeout(r, 400));
          await dibujar(1);
          if (!cancelled) setLoading(false);
        } catch (e2) {
          console.error('La vista previa falló también en el reintento:', e2);
          if (!cancelled) { setError(true); setLoading(false); }
        }
      }
    })();

    return () => { cancelled = true; liberarLienzos(); };
  }, [blob, intento, liberarLienzos]);

  return (
    <div className="relative flex-1 overflow-auto bg-gray-200 dark:bg-gray-800 p-3">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
          <Loader className="w-7 h-7 animate-spin text-blue-700 dark:text-blue-400" />
          <p className="text-sm">Generando vista previa…</p>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-gray-600 dark:text-gray-300 text-sm">
          <p>
            No se pudo mostrar la vista previa. Suele pasar cuando al teléfono le queda
            poca memoria: cierra otras aplicaciones y vuelve a intentarlo.
          </p>
          <button
            onClick={() => setIntento((n) => n + 1)}
            className="inline-flex items-center gap-2 bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all"
          >
            <RefreshCw className="w-5 h-5" strokeWidth={2.5} />
            Reintentar
          </button>
          <p className="text-xs">Si sigue sin verse, usa «Imprimir folleto» para descargarlo.</p>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}

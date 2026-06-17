import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Download, Loader, Play, Pause, RotateCcw, Plus, Minus, ZoomIn, ZoomOut } from 'lucide-react';
import { useWakeLock } from '../../hooks/useWakeLock';
import { getOfflinePdf } from '../../services/offlineCache';

interface PDFViewerProps {
  proxyUrl: string;
  driveViewUrl: string;
  title: string;
  /** Duración del canto en segundos (de YouTube) — estima la velocidad inicial del autoscroll. */
  durationSeconds?: number;
}

// Worker servido desde nuestro propio dominio — más confiable que CDN
const WORKER_URL = '/pdf.worker.min.mjs';

// Velocidad de scroll por defecto cuando no hay duración conocida (px/s).
const FALLBACK_PX_PER_SEC = 30;
const SPEED_KEY = 'pdf_autoscroll_speed';

function loadSavedSpeed(): number {
  const saved = parseFloat(localStorage.getItem(SPEED_KEY) || '');
  return Number.isFinite(saved) && saved >= 0.5 && saved <= 3 ? saved : 1;
}

export function PDFViewer({ proxyUrl, driveViewUrl, title, durationSeconds }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Autoscroll
  const [isScrolling, setIsScrolling] = useState(false);
  const [speed, setSpeed] = useState<number>(loadSavedSpeed);
  const [scrollable, setScrollable] = useState(false);

  // Evita que la pantalla se bloquee mientras el músico tiene la partitura
  // abierta. Se libera solo al desmontar el visor (cerrar la partitura).
  useWakeLock(true);

  // Cargar PDF cuando cambia la URL (con fallback a la copia offline cacheada)
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);
    setIsScrolling(false);

    (async () => {
      let pdfjsLib: any;
      try {
        pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
      } catch {
        if (!cancelled) { setError('No se pudo cargar el visor'); setLoading(false); }
        return;
      }

      const load = async (url: string) => (await pdfjsLib.getDocument({ url }).promise);

      try {
        const loadedPdf = await load(proxyUrl);
        if (cancelled) return;
        setPdf(loadedPdf);
        setLoading(false);
      } catch (netErr: any) {
        // Sin red: intentar la copia offline cacheada (Modo Misa offline)
        try {
          objectUrl = await getOfflinePdf(proxyUrl);
          if (objectUrl) {
            const loadedPdf = await load(objectUrl);
            if (cancelled) return;
            setPdf(loadedPdf);
            setLoading(false);
            return;
          }
        } catch {
          /* cae al error general */
        }
        if (cancelled) return;
        console.error('Error cargando PDF:', netErr);
        setError(netErr?.message || 'No se pudo cargar la partitura');
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      // Revocar al cambiar de PDF/desmontar (ya no se necesita el blob).
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proxyUrl]);

  // Renderizar TODAS las páginas apiladas verticalmente (modo scroll continuo)
  useEffect(() => {
    if (!pdf || !containerRef.current) return;
    let cancelled = false;
    const container = containerRef.current;

    (async () => {
      try {
        container.innerHTML = '';
        container.scrollTop = 0;
        const containerWidth = container.clientWidth - 16; // padding

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const baseScale = containerWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: baseScale * zoom });

          const canvas = document.createElement('canvas');
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 12px';
          canvas.style.maxWidth = '100%';

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          const dpr = window.devicePixelRatio || 1;
          canvas.width = viewport.width * dpr;
          canvas.height = viewport.height * dpr;
          canvas.style.width = viewport.width + 'px';
          canvas.style.height = viewport.height + 'px';
          ctx.scale(dpr, dpr);

          // Insertar antes de renderizar para que el layout crezca de inmediato
          container.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
        }

        if (!cancelled) {
          setScrollable(container.scrollHeight - container.clientHeight > 4);
        }
      } catch (err) {
        console.error('Error renderizando páginas:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [pdf, zoom]);

  // Loop de autoscroll — anima scrollTop del contenedor interno.
  useEffect(() => {
    if (!isScrolling) return;
    const container = containerRef.current;
    if (!container) return;

    if (container.scrollHeight - container.clientHeight <= 1) {
      setIsScrolling(false);
      return;
    }

    let raf = 0;
    let lastTs: number | null = null;

    const step = (ts: number) => {
      if (lastTs == null) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      // Recalcular cada frame para reaccionar al zoom en vivo
      const distance = container.scrollHeight - container.clientHeight;
      const basePxPerSec = durationSeconds && durationSeconds > 0
        ? distance / durationSeconds
        : FALLBACK_PX_PER_SEC;

      container.scrollTop += basePxPerSec * speed * dt;

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
        setIsScrolling(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isScrolling, speed, durationSeconds]);

  // Pausa el autoscroll si el usuario interactúa (scroll manual / toque)
  useEffect(() => {
    if (!isScrolling) return;
    const container = containerRef.current;
    if (!container) return;
    const pause = () => setIsScrolling(false);
    container.addEventListener('wheel', pause, { passive: true });
    container.addEventListener('touchstart', pause, { passive: true });
    return () => {
      container.removeEventListener('wheel', pause);
      container.removeEventListener('touchstart', pause);
    };
  }, [isScrolling]);

  const changeSpeed = (delta: number) => {
    setSpeed((s) => {
      const next = Math.min(3, Math.max(0.5, Math.round((s + delta) * 10) / 10));
      localStorage.setItem(SPEED_KEY, String(next));
      return next;
    });
  };

  const backToTop = () => {
    setIsScrolling(false);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 space-y-2">
        {/* Fila 1 — Autoscroll */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScrolling((v) => !v)}
              disabled={!scrollable}
              aria-label={isScrolling ? 'Pausar autoscroll' : 'Iniciar autoscroll'}
              className="w-10 h-10 rounded-lg bg-blue-900 text-white disabled:opacity-40 active:scale-95 flex items-center justify-center"
            >
              {isScrolling ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={backToTop}
              aria-label="Volver al inicio"
              className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 active:scale-95 flex items-center justify-center"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Velocidad */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeSpeed(-0.1)}
              disabled={speed <= 0.5}
              aria-label="Reducir velocidad"
              className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-40 active:scale-95 flex items-center justify-center"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-gray-700 px-1 min-w-[44px] text-center">
              {speed.toFixed(1)}×
            </span>
            <button
              onClick={() => changeSpeed(0.1)}
              disabled={speed >= 3}
              aria-label="Aumentar velocidad"
              className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-40 active:scale-95 flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fila 2 — Zoom + estado */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">
            {pdf.numPages} {pdf.numPages === 1 ? 'página' : 'páginas'}
            {!scrollable && ' · cabe en pantalla'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              aria-label="Reducir zoom"
              className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 active:scale-95 flex items-center justify-center"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-gray-700 px-1 min-w-[48px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              aria-label="Aumentar zoom"
              className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 active:scale-95 flex items-center justify-center"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas del PDF — scroll continuo de todas las páginas */}
      <div
        ref={containerRef}
        className="bg-gray-100 overflow-auto p-2"
        style={{ maxHeight: '70vh' }}
      />
    </div>
  );
}

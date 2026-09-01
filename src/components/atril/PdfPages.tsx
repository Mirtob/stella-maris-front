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
 * Renderiza las páginas de UN PDF apiladas, SIN toolbar ni scroll propio, para poder
 * encadenar varias partituras dentro del scroll continuo del Modo Atril.
 *
 * SE RENDERIZA SOLO LO QUE ESTÁ CERCA DE LA PANTALLA, y esto no es una optimización:
 * es la diferencia entre que la partitura se vea o no. El atril apila TODOS los cantos
 * de la Misa, y un cantoral corriente son unas 19 páginas. A un lienzo por página, con
 * DPR 2 y ancho de teléfono, eso son ~240 MB: muy por encima de lo que un móvil dedica
 * a lienzos. Pasado el tope, el navegador deja de pintar SIN dar error — y como el
 * `catch` de aquí se lo tragaba en silencio, el corista veía un hueco vacío donde
 * debía estar su partitura, sin spinner y sin explicación.
 *
 * Ahora: se carga y se pinta al acercarse, se libera al alejarse (conservando el alto
 * para que el scroll no salte), y si algo falla se DICE.
 */
export function PdfPages({ proxyUrl, driveViewUrl, title, zoom, fromPage, toPage }: PdfPagesProps) {
  const raizRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [error, setError] = useState(false);
  /** Cerca de la pantalla: merece cargarse y pintarse. */
  const [cerca, setCerca] = useState(false);
  /** Alto de lo ya pintado, para reservarlo cuando se libere y el scroll no salte. */
  const [altoReservado, setAltoReservado] = useState(0);
  const [pintado, setPintado] = useState(false);

  // ── ¿Estamos cerca? ───────────────────────────────────────────────────────
  // Dos umbrales distintos a propósito: se pinta con antelación (una pantalla y media)
  // para que al desplazarse la partitura ya esté, pero solo se libera cuando de verdad
  // se está lejos (cuatro pantallas). Con un solo umbral, ir y venir alrededor del
  // borde haría pintar y borrar sin parar.
  useEffect(() => {
    const el = raizRef.current;
    if (!el) return;

    // El `root` TIENE que ser el contenedor que hace scroll (en el atril, un <main> con
    // overflow-y), no la ventana.
    //
    // Con el root por defecto, el navegador recorta la sección contra ese <main> ANTES
    // de compararla con la ventana: una partitura que quedaba fuera del área desplazable
    // daba "no visible" por mucho margen que se pidiera, y el margen de anticipación no
    // servía absolutamente de nada — el margen agranda el root, no deshace el recorte.
    // Resultado: partituras que estaban en pantalla y nunca se pintaban. Es exactamente
    // el sintoma reportado.
    const scroller = (() => {
      let p: HTMLElement | null = el.parentElement;
      while (p) {
        const ov = getComputedStyle(p).overflowY;
        if (ov === 'auto' || ov === 'scroll') return p;
        p = p.parentElement;
      }
      return null;
    })();

    const alAcercarse = new IntersectionObserver(
      (entradas) => { if (entradas.some((e) => e.isIntersecting)) setCerca(true); },
      { root: scroller, rootMargin: '150% 0px' },
    );
    const alAlejarse = new IntersectionObserver(
      (entradas) => { if (entradas.every((e) => !e.isIntersecting)) setCerca(false); },
      { root: scroller, rootMargin: '400% 0px' },
    );
    alAcercarse.observe(el);
    alAlejarse.observe(el);
    return () => { alAcercarse.disconnect(); alAlejarse.disconnect(); };
  }, []);

  // ── Cargar el PDF (con respaldo offline) ──────────────────────────────────
  useEffect(() => {
    if (!cerca) return;
    if (pdf) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setError(false);

    (async () => {
      let pdfjsLib: any;
      try {
        pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
      } catch {
        if (!cancelled) setError(true);
        return;
      }
      // NOTA: no usamos disableAutoFetch. Estas partituras escaneadas tienen muchas
      // imágenes por página y con disableAutoFetch pdf.js renderizaba la hoja en BLANCO
      // (no alcanzaba a traer las imágenes).
      // wasmUrl: pdf.js 5 decodifica JBIG2 / JPEG2000 con WASM (las partituras escaneadas
      // del libro de salmos usan JBIG2). Sin esto, "JBig2 failed to initialize" → hoja en
      // blanco. Los .wasm viven en public/wasm y se sirven en /wasm/.
      const load = async (url: string) => (await pdfjsLib.getDocument({ url, wasmUrl: '/wasm/' }).promise);
      try {
        const doc = await load(proxyUrl);
        if (cancelled) return;
        setPdf(doc);
      } catch {
        try {
          objectUrl = await getOfflinePdf(proxyUrl);
          if (objectUrl) {
            const doc = await load(objectUrl);
            if (cancelled) return;
            setPdf(doc);
            return;
          }
        } catch { /* cae al error */ }
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proxyUrl, cerca, pdf]);

  // Si cambia el PDF, se empieza de cero.
  useEffect(() => {
    setPdf(null);
    setError(false);
    setAltoReservado(0);
    setPintado(false);
  }, [proxyUrl]);

  // ── Pintar / liberar ──────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Lejos: se sueltan los lienzos. Es lo que devuelve la memoria al navegador y
    // permite que las partituras de más abajo se puedan pintar.
    if (!cerca) {
      if (container.childElementCount > 0) {
        setAltoReservado(container.getBoundingClientRect().height);
        container.innerHTML = '';
        setPintado(false);
      }
      return;
    }
    if (!pdf) return;

    let cancelled = false;
    (async () => {
      try {
        container.innerHTML = '';
        // Ojo con el 0: mientras el elemento no tiene ancho medido, un `- 8` lo dejaba
        // NEGATIVO y el lienzo salía inválido (otra hoja en blanco sin error).
        const medido = container.clientWidth || raizRef.current?.clientWidth || 0;
        const containerWidth = Math.max(240, medido - 8);
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
          // Tope de 2: los teléfonos reportan 3 y a esa escala los lienzos triplican
          // la memoria sin que se note en pantalla (el zoom del visor recupera detalle
          // cuando hace falta). Ver PdfBlobViewer: a DPR 3 el visor se quedaba sin
          // memoria y moría al segundo intento.
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = viewport.width * dpr;
          canvas.height = viewport.height * dpr;
          canvas.style.width = viewport.width + 'px';
          canvas.style.height = viewport.height + 'px';
          ctx.scale(dpr, dpr);
          container.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
        }
        if (!cancelled) setPintado(true);
      } catch {
        // Antes esto quedaba en silencio y el corista veía un hueco vacío. Si no se
        // pudo pintar, se dice y se ofrece abrirla en Drive.
        if (!cancelled) setError(true);
      }
    })();

    return () => { cancelled = true; };
  }, [pdf, zoom, fromPage, toPage, cerca]);

  // El aviso de "cargando" dura hasta que hay PÍXELES, no hasta que llega el archivo.
  // Entre que pdf.js termina de leer el PDF y termina de pintar las páginas hay un
  // rato — y con `loading` ya en falso ese rato se veía como un hueco en blanco sin
  // explicación, indistinguible de una partitura rota.
  const cargando = cerca && !pintado && !error;

  return (
    <div className="relative" ref={raizRef}>
      {cargando && (
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
      {/*
        Se reserva el sitio SIEMPRE que no haya nada pintado, y esto es lo que hace que
        el atril funcione:

        · Antes de pintar por primera vez no se sabe cuánto ocupará, así que se reserva
          una hoja aproximada (70vh). Sin esa reserva las secciones sin pintar medían
          casi cero, la página entera no llegaba a ser más alta que la pantalla, no se
          podía desplazar y por tanto NINGUNA otra partitura se acercaba nunca a la
          vista: solo se veía la primera. Es el pez que se muerde la cola de cualquier
          carga perezosa.
        · Después de haberse pintado una vez se reserva el alto REAL medido, para que
          al liberar la memoria la sección no encoja de golpe y el scroll no dé un
          salto en mitad de la Misa.
      */}
      <div
        ref={containerRef}
        className="w-full"
        style={pintado ? undefined : { minHeight: altoReservado || '70vh' }}
      />
    </div>
  );
}

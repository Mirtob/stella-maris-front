import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Loader, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { PublishedCantoral } from '../../types';
import { generateCantoralPDF } from '../../utils/cantoralPDFGenerator';
import { PdfBlobViewer } from './PdfBlobViewer';
import { abrirOGuardarPdf, guardarPdf, nombreDeFolleto } from '../../utils/descargarPdf';

/**
 * Visor del cantoral del Pueblo fiel (letra) para SEGUIR EN VIVO: PDF CONTINUO
 * (vertical, decorado), cómodo de leer en pantalla. El botón "Imprimir folleto" genera
 * la versión impuesta como CUADERNILLO (booklet) — así, en pantalla es continuo y para
 * imprimir es folleto.
 */
export function CantoralPdfViewer({ cantoral, onBack }: { cantoral: PublishedCantoral; onBack: () => void }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [printing, setPrinting] = useState(false);

  /**
   * Guarda el cantoral que YA está generado y en memoria.
   *
   * Es la salida que faltaba. Varios usuarios de Android y iPhone quedaban atrapados:
   * la vista previa no se dibujaba y el único botón volvía a generar el cuadernillo,
   * que era justo lo que fallaba. Guardar el blob que ya tenemos no necesita lienzos,
   * ni pdf.js, ni memoria de sobra.
   *
   * Si el cantoral ya tiene su PDF en el servidor, se usa ESE: el teléfono no tiene
   * que construir nada.
   */
  const descargar = () => {
    const nombre = nombreDeFolleto(cantoral.liturgicalDate, cantoral.date);
    if (cantoral.pdfUrl) {
      window.open(cantoral.pdfUrl, '_blank');
      return;
    }
    if (!blob) { toast.error('El cantoral todavía se está preparando'); return; }
    const r = guardarPdf(blob, nombre);
    if (r === 'bloqueado') {
      toast.error('El navegador bloqueó la descarga', {
        description: 'Permite las ventanas emergentes para este sitio y vuelve a tocar Descargar.',
      });
    } else if (r === 'abierto') {
      toast.success('Cantoral abierto', {
        description: 'Usa el botón de compartir para guardarlo en Archivos o imprimirlo.',
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    generateCantoralPDF({ cantoral, download: false, booklet: false })
      .then(({ blob }) => { if (!cancelled) setBlob(blob); })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cantoral]);

  const printBooklet = async () => {
    if (printing) return;
    setPrinting(true);
    toast.info('Preparando el folleto para imprimir…');
    try {
      const { url } = await generateCantoralPDF({ cantoral, download: false, booklet: true });

      // Respaldo: abrir el PDF en una pestaña (el usuario imprime con Ctrl/Cmd+P).
      const openInTab = () => {
        abrirOGuardarPdf(url, nombreDeFolleto(cantoral.liturgicalDate, cantoral.date));
      };

      // Preferido: iframe oculto → dispara el diálogo de impresión DIRECTO, sin abrir
      // otra pestaña (requiere `frame-src blob:` en el CSP). Si no carga a tiempo
      // (CSP/entorno que lo bloquee), caemos al respaldo de pestaña.
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');

      let handled = false;
      const cleanup = () => { try { URL.revokeObjectURL(url); iframe.remove(); } catch { /* noop */ } };
      const timer = setTimeout(() => {
        if (handled) return;
        handled = true;
        openInTab();
        cleanup();
      }, 2500);

      iframe.onload = () => {
        if (handled) return;
        handled = true;
        clearTimeout(timer);
        // Pequeña espera para que el visor de PDF termine de renderizar antes de imprimir.
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {
            openInTab();
          }
          setTimeout(cleanup, 60000);
        }, 300);
      };

      iframe.src = url;
      document.body.appendChild(iframe);

      toast.success('Abriendo el diálogo de impresión…', {
        description: 'Imprime a doble faz y dobla al medio. Si no calzan, cambia el volteo a "borde corto".',
      });
    } catch (e: any) {
      // Se dice QUÉ pasó y se ofrece la salida que no depende de volver a generar nada.
      console.error('Folleto: fallo al preparar la impresión:', e);
      toast.error('No se pudo preparar el folleto para imprimir', {
        description: 'Toca «Descargar» y ábrelo con tu lector de PDF, o imprímelo desde ahí.',
        duration: 8000,
      });
    }
    setPrinting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      <div className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-brand to-brand-strong text-white p-3 sm:p-4">
        <button onClick={onBack} className="flex items-center gap-2 font-bold active:opacity-70 flex-shrink-0">
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} /> Volver
        </button>
        <span className="font-bold truncate min-w-0">Cantoral (letra)</span>
        {/* Descargar va PRIMERO y siempre disponible: es la salida que funciona aunque
            la vista previa no se dibuje o el cuadernillo no se pueda imponer. */}
        <button
          onClick={descargar}
          className="ml-auto flex items-center gap-2 bg-white/20 hover:bg-white/30 border-2 border-white/30 rounded-xl px-3 py-2 font-bold active:scale-95 transition-all flex-shrink-0"
        >
          <Download className="w-5 h-5" strokeWidth={2.5} />
          <span className="hidden sm:inline">Descargar</span>
        </button>
        <button
          onClick={printBooklet}
          disabled={printing}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border-2 border-white/30 rounded-xl px-3 py-2 font-bold active:scale-95 transition-all disabled:opacity-60 flex-shrink-0"
        >
          {printing ? <Loader className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" strokeWidth={2.5} />}
          <span className="hidden sm:inline">Imprimir folleto</span>
          <span className="sm:hidden">Imprimir</span>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/80">
          <Loader className="w-8 h-8 animate-spin" />
          <p className="text-sm">Preparando el cantoral…</p>
        </div>
      ) : blob ? (
        <PdfBlobViewer blob={blob} onDescargar={descargar} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/80 text-center px-6">
          {failed ? 'No se pudo generar el cantoral. Toca «Volver» e inténtalo de nuevo.' : ''}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { PublishedCantoral } from '../../types';
import { generateCantoralPDF } from '../../utils/cantoralPDFGenerator';
import { PdfBlobViewer } from './PdfBlobViewer';

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
      const w = window.open(url, '_blank');
      if (!w) {
        const a = document.createElement('a');
        a.href = url; a.download = 'cantoral-folleto.pdf';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      toast.success('Folleto listo para imprimir', {
        description: 'Imprime a doble faz y dobla al medio. Si no calzan, cambia el volteo a "borde corto".',
      });
    } catch {
      toast.error('No se pudo generar el folleto');
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
        <button
          onClick={printBooklet}
          disabled={printing}
          className="ml-auto flex items-center gap-2 bg-white/20 hover:bg-white/30 border-2 border-white/30 rounded-xl px-3 py-2 font-bold active:scale-95 transition-all disabled:opacity-60 flex-shrink-0"
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
        <PdfBlobViewer blob={blob} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/80 text-center px-6">
          {failed ? 'No se pudo generar el cantoral. Toca «Volver» e inténtalo de nuevo.' : ''}
        </div>
      )}
    </div>
  );
}

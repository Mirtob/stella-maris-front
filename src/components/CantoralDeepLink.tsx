import { useEffect, useState } from 'react';
import { Download, BookOpen, ArrowLeft, FileX } from 'lucide-react';
import { toast } from 'sonner';
import { PublishedCantoral } from '../types';
import { getCantoralById } from '../services/cantorals';
import { generateCantoralPDF } from '../utils/cantoralPDFGenerator';

interface CantoralDeepLinkProps {
  cantoralId: string;
  onOpenInApp: (cantoral: PublishedCantoral) => void;
  onCancel: () => void;
}

/**
 * Landing screen when a user opens a /c/:id deep link (e.g. from a QR scan).
 * Asks: "¿Descargar el PDF o ver el cantoral en la app?"
 *
 * If user picks "Descargar PDF" → opens the PDF URL in a new tab (browser
 *   downloads or shows it natively).
 * If user picks "Ver en la app" → navigates back into the React app.
 */
export function CantoralDeepLink({ cantoralId, onOpenInApp, onCancel }: CantoralDeepLinkProps) {
  const [cantoral, setCantoral] = useState<PublishedCantoral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCantoralById(cantoralId)
      .then((c) => {
        if (cancelled) return;
        if (!c) {
          setError('No encontramos este cantoral. Puede haber sido eliminado.');
        } else if (c.status !== 'published') {
          // Defense in depth: even if RLS leaks a draft, the UI refuses to show it.
          // Deep links should only ever resolve to publicly published cantorales.
          setError('Este cantoral aún no está publicado. Volvé a intentar cuando el coro lo publique.');
        } else {
          setCantoral(c);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Error al cargar el cantoral. Revisa tu conexión.');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [cantoralId]);

  // El PDF del QR/deep-link es para la COMUNIDAD (Pueblo fiel): folleto con las
  // LETRAS de los cantos, sin acordes ni partituras. Se genera en el cliente desde
  // cantoral.songs (mismo generador que ve el Pueblo fiel dentro de la app), NO se
  // sirve el PDF Full Score del Coro (pdf_url) que se sube al publicar. Así el PDF
  // que descarga la comunidad se distingue del que usa el Coro.
  const handleDownloadPDF = async () => {
    if (!cantoral || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      await generateCantoralPDF({ cantoral });
    } catch (err: any) {
      toast.error('No se pudo generar el PDF', { description: err?.message });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleOpenInApp = () => {
    if (cantoral) onOpenInApp(cantoral);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen p-4 sm:p-6 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-12 sm:pt-16">

        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
            <p className="text-base font-semibold text-blue-900 dark:text-blue-100">
              Cargando cantoral…
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-4 border-red-300 dark:border-red-700 text-center">
            <FileX className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-3">
              Cantoral no disponible
            </h1>
            <p className="text-base text-red-800 dark:text-red-200 mb-6">
              {error}
            </p>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 active:scale-95 transition-all"
            >
              Ir al inicio
            </button>
          </div>
        )}

        {!loading && cantoral && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">📖</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-950 dark:text-white mb-2">
                Cantoral disponible
              </h1>
              <p className="text-base text-blue-800 dark:text-blue-200">
                {cantoral.parishName}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {cantoral.liturgicalDate} · {cantoral.massTime}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {cantoral.songs?.length ?? 0} cantos
              </p>
            </div>

            {/* Question */}
            <p className="text-center text-lg font-semibold text-blue-900 dark:text-blue-100 mb-6">
              ¿Cómo prefieres verlo?
            </p>

            {/* Actions */}
            <div className="space-y-3 mb-6">
              {(cantoral.songs?.length ?? 0) > 0 && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={generatingPdf}
                  className="w-full bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-5 rounded-2xl flex items-center gap-4 hover:opacity-95 active:scale-95 transition-all border-2 border-emerald-600 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download className="w-7 h-7" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-lg">{generatingPdf ? 'Generando PDF…' : 'Descargar PDF'}</p>
                    <p className="text-sm opacity-90">Folleto con las letras de los cantos</p>
                  </div>
                </button>
              )}

              <button
                onClick={handleOpenInApp}
                className="w-full bg-gradient-to-br from-blue-900 to-blue-950 text-white p-5 rounded-2xl flex items-center gap-4 hover:opacity-95 active:scale-95 transition-all border-2 border-blue-800 shadow-xl"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-lg">Ver en la app</p>
                  <p className="text-sm opacity-90">Reproduce cantos y abre partituras</p>
                </div>
              </button>
            </div>

            {(cantoral.songs?.length ?? 0) === 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Este cantoral aún no tiene cantos. Solo puedes verlo en la app.
                </p>
              </div>
            )}

            {/* Back */}
            <button
              onClick={onCancel}
              className="w-full py-3 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Ir al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}

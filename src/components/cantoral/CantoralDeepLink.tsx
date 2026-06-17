import { useEffect, useState } from 'react';
import { Download, ArrowLeft, FileX, Share, Plus, Smartphone, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { PublishedCantoral, Song } from '../../types';
import { getCantoralById } from '../../services/cantorals';
import { generateCantoralPDF } from '../../utils/cantoralPDFGenerator';
import { LyricsOnly } from '../songs/LyricsOnly';
import {
  getDeferredInstallPrompt,
  promptInstall,
  subscribeInstall,
  isIos,
  isStandalone,
} from '../../utils/installPrompt';

interface CantoralDeepLinkProps {
  cantoralId: string;
  /** Para usuarios que quieren entrar a la app completa (los lleva a login/app). */
  onOpenInApp: (cantoral: PublishedCantoral) => void;
  onCancel: () => void;
}

// Orden e iconos por parte de la Misa (mismo criterio que PublishedCantorals).
const CATEGORY_ORDER = [
  'Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Aclamación al Evangelio',
  'Post Evangelio', 'Ofertorio', 'Santo', 'Padre Nuestro', 'Cordero de Dios',
  'Comunión', 'Salida',
];
const CATEGORY_ICONS: Record<string, string> = {
  'Entrada': '⛪', 'Kyrie': '🙏', 'Gloria': '✨', 'Salmo': '📖', 'Aleluya': '🎺',
  'Aclamación al Evangelio': '📯', 'Post Evangelio': '📿', 'Ofertorio': '🍇',
  'Santo': '✝️', 'Padre Nuestro': '🙏', 'Cordero de Dios': '🐑', 'Comunión': '🫓',
  'Salida': '⛪',
};

function groupByCategory(songs: Song[]): { category: string; songs: Song[] }[] {
  const grouped: Record<string, Song[]> = {};
  for (const s of songs) {
    (grouped[s.category] ||= []).push(s);
  }
  return Object.keys(grouped)
    .sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map((category) => ({ category, songs: grouped[category] }));
}

/**
 * Pantalla al abrir un deep link /c/:id (p. ej. desde un QR). Muestra SIEMPRE el
 * cantoral en la vista de Pueblo fiel (letras, sin acordes), sin requerir login, y
 * sugiere instalar la app. Permite descargar el PDF de letras.
 */
export function CantoralDeepLink({ cantoralId, onOpenInApp, onCancel }: CantoralDeepLinkProps) {
  const [cantoral, setCantoral] = useState<PublishedCantoral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Sugerencia de instalación
  const [installAvailable, setInstallAvailable] = useState(!!getDeferredInstallPrompt());
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const standalone = isStandalone();
  const ios = isIos();

  useEffect(() => subscribeInstall(() => setInstallAvailable(!!getDeferredInstallPrompt())), []);

  useEffect(() => {
    let cancelled = false;
    getCantoralById(cantoralId)
      .then((c) => {
        if (cancelled) return;
        if (!c) {
          setError('No encontramos este cantoral. Puede haber sido eliminado.');
        } else if (c.status !== 'published') {
          // Defensa en profundidad: aunque RLS filtre un borrador, la UI lo rechaza.
          setError('Este cantoral aún no está publicado. Vuelve a intentar cuando el coro lo publique.');
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

  // PDF para la comunidad: SOLO letras (mismo generador que el Pueblo fiel in-app).
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

  const handleInstall = async () => {
    if (installAvailable) {
      const r = await promptInstall();
      if (r === 'accepted') toast.success('¡Gracias! La app se está instalando.');
      else if (r === 'unavailable') setShowInstallHelp(true);
    } else {
      setShowInstallHelp((v) => !v);
    }
  };

  const groups = cantoral ? groupByCategory(cantoral.songs ?? []) : [];
  const hasSongs = (cantoral?.songs?.length ?? 0) > 0;

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen p-4 sm:p-6 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <main className="pt-10 sm:pt-14 pb-16">

        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
            <p className="text-base font-semibold text-blue-900 dark:text-blue-100">Cargando cantoral…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-4 border-red-300 dark:border-red-700 text-center">
            <FileX className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-3">Cantoral no disponible</h1>
            <p className="text-base text-red-800 dark:text-red-200 mb-6">{error}</p>
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
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">📖</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-950 dark:text-white">{cantoral.parishName}</h1>
              <p className="text-base text-blue-800 dark:text-blue-200 mt-1">{cantoral.liturgicalDate}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">{cantoral.massTime} · {cantoral.songs?.length ?? 0} cantos</p>
            </div>

            {/* Sugerencia de instalación (oculta si ya está instalada) */}
            {!standalone && (
              <div className="mb-5 bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-2xl p-4 border-2 border-blue-800 shadow-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-base">Instala Stella Maris</p>
                    <p className="text-sm text-blue-200">Ten los cantorales de tu parroquia siempre a mano.</p>
                  </div>
                  <button
                    onClick={handleInstall}
                    className="flex-shrink-0 bg-white text-blue-900 px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" strokeWidth={3} /> Instalar
                  </button>
                </div>

                {showInstallHelp && (
                  <div className="mt-3 pt-3 border-t border-white/20 text-sm text-blue-100 space-y-1">
                    {ios ? (
                      <p className="flex items-center gap-2">
                        Toca <Share className="inline w-4 h-4" /> <strong>Compartir</strong> y luego
                        <strong>“Agregar a inicio”</strong>.
                      </p>
                    ) : (
                      <p>
                        Abre el menú del navegador (⋮) y elige <strong>“Instalar app”</strong> o
                        <strong> “Agregar a pantalla de inicio”</strong>.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {hasSongs && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={generatingPdf}
                  className="flex-1 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-4 px-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all border-2 border-emerald-600 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-bold">{generatingPdf ? 'Generando PDF…' : 'Descargar PDF (letras)'}</span>
                </button>
              )}
              <button
                onClick={() => cantoral && onOpenInApp(cantoral)}
                className="flex-1 bg-white/70 dark:bg-white/10 text-blue-950 dark:text-white py-4 px-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white active:scale-95 transition-all border-2 border-blue-200 dark:border-white/20"
              >
                <LogIn className="w-5 h-5" />
                <span className="font-bold">Abrir en la app</span>
              </button>
            </div>

            {/* Cantoral — vista Pueblo fiel (letras por parte de la Misa) */}
            {hasSongs ? (
              <div className="space-y-5">
                {groups.map(({ category, songs }) => (
                  <section key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{CATEGORY_ICONS[category] || '🎵'}</span>
                      <h2 className="text-xl font-bold text-blue-950 dark:text-white">{category}</h2>
                    </div>
                    <div className="space-y-3">
                      {songs.map((song) => (
                        <div key={song.id}>
                          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
                            {song.title}
                            {song.author && (
                              <span className="text-sm font-normal text-blue-700 dark:text-blue-300"> · {song.author}</span>
                            )}
                          </h3>
                          <LyricsOnly lyrics={song.lyrics ?? ''} />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 text-center">
                <p className="text-sm text-amber-800 dark:text-amber-200">Este cantoral aún no tiene cantos.</p>
              </div>
            )}

            {/* Back */}
            <button
              onClick={onCancel}
              className="w-full mt-8 py-3 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Ir al inicio
            </button>
          </>
        )}
      </main>
    </div>
  );
}

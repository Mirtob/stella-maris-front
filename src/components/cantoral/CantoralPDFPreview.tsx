import { X, Download, Music } from 'lucide-react';
import { Song, InstrumentType } from '../../types';
import { useState } from 'react';
import { generateChoirCantoralPDF } from '../../utils/choirCantoralPDFGenerator';
import { toast } from 'sonner';

interface CantoralPDFPreviewProps {
  cantoral: Song[];
  parishName: string;
  date: string;
  celebration?: string;
  massTime?: string;
  userInstruments?: InstrumentType[];
  onClose: () => void;
}

export function CantoralPDFPreview({
  cantoral,
  parishName,
  date,
  celebration,
  massTime,
  userInstruments = [],
  onClose
}: CantoralPDFPreviewProps) {
  const [downloading, setDownloading] = useState(false);

  // Agrupar cantos por categoría
  const categoryOrder = [
    'Entrada',
    'Kyrie',
    'Gloria',
    'Salmo',
    'Aleluya',
    'Aclamación al Evangelio',
    'Post Evangelio',
    'Ofertorio',
    'Santo',
    'Cordero de Dios',
    'Comunión',
    'Salida'
  ];

  const groupedSongs = cantoral.reduce((acc, song) => {
    if (!acc[song.category]) {
      acc[song.category] = [];
    }
    acc[song.category].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  const sortedCategories = Object.keys(groupedSongs).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const categoryIcons: Record<string, string> = {
    'Entrada': '⛪',
    'Kyrie': '🙏',
    'Gloria': '✨',
    'Santo': '✝️',
    'Cordero de Dios': '🐑',
    'Credo': '📿',
    'Padre Nuestro': '🙏',
    'Salmo': '📖',
    'Aleluya': '🎺',
    'Aclamación al Evangelio': '📯',
    'Post Evangelio': '📿',
    'Ofertorio': '🍇',
    'Comunión': '🫓',
    'Salida': '⛪',
  };

  // El folleto del Coro = letra con acordes + las partituras de todos los cantos
  // (en orden de la Misa), en el mismo archivo. Descarga cada partitura vía el
  // proxy, por eso puede tardar unos segundos.
  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await generateChoirCantoralPDF(
        cantoral,
        parishName,
        date,
        celebration,
        massTime,
        userInstruments,
        'Full Score',
        { download: true, embedScores: true }
      );
      toast.success('PDF Generado', {
        description: 'El folleto con letras, acordes y partituras se ha descargado'
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF', {
        description: 'Por favor intenta nuevamente'
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col border-4 border-blue-800 transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 rounded-t-3xl border-b-4 border-blue-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Music className="w-10 h-10" strokeWidth={2.5} />
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">Vista Previa del Folleto</h2>
                <p className="text-blue-200 text-sm mt-1">Revisa tu cantoral antes de descargar</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-8 h-8" strokeWidth={2.5} />
            </button>
          </div>

          {/* Info del Cantoral */}
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm border border-white/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-200">Parroquia:</span>
                <span className="ml-2 font-bold">{parishName}</span>
              </div>
              <div>
                <span className="text-blue-200">Fecha:</span>
                <span className="ml-2 font-bold">
                  {new Date(date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {celebration && (
                <div className="sm:col-span-2">
                  <span className="text-blue-200">Celebración:</span>
                  <span className="ml-2 font-bold">{celebration}</span>
                </div>
              )}
              {massTime && (
                <div>
                  <span className="text-blue-200">Horario:</span>
                  <span className="ml-2 font-bold">{massTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 transition-colors">
          {/* Logo de la app */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-950 rounded-full flex items-center justify-center border-4 border-blue-800 shadow-lg">
              <div className="text-white text-4xl font-bold">✝</div>
            </div>
          </div>

          {/* Cantos por Categoría */}
          {sortedCategories.map((category) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border-2 border-blue-200 dark:border-blue-900 transition-colors">
              {/* Título de Categoría */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-200 dark:border-blue-900">
                <span className="text-3xl">{categoryIcons[category] || '🎵'}</span>
                <h3 className="text-2xl font-bold text-blue-950 dark:text-blue-100">{category}</h3>
              </div>

              {/* Cantos de la categoría */}
              <div className="space-y-4">
                {groupedSongs[category].map((song, index) => (
                  <div
                    key={song.id}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    {/* Título del canto */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-blue-900 dark:text-blue-300 font-bold text-lg">{index + 1}.</span>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{song.title}</h4>
                        {song.author && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">Por: {song.author}</p>
                        )}
                        {song.originalKey && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                            Tonalidad: {song.originalKey}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Enlaces */}
                    <div className="flex gap-3 text-xs text-blue-600 dark:text-blue-400 mb-2">
                      {song.videoUrl && (
                        <span className="flex items-center gap-1">
                          🎬 Video disponible
                        </span>
                      )}
                      {song.sheetMusicUrl && (
                        <span className="flex items-center gap-1">
                          📄 Partitura disponible
                        </span>
                      )}
                    </div>

                    {/* Preview de letra */}
                    {song.lyrics && song.lyrics.trim() && (
                      <div className="mt-3 bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                          ♫ Letra con Acordes
                        </p>
                        <div className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {song.lyrics.split('\n').slice(0, 6).join('\n')}
                          {song.lyrics.split('\n').length > 6 && '\n...'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Info final */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 text-center border-2 border-blue-200 dark:border-blue-800 transition-colors">
            <p className="text-blue-900 dark:text-blue-200 font-semibold">
              📖 Folleto Digital para Coros Católicos
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
              Generado el {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        {/* Footer - Botones de Acción */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 rounded-b-3xl border-t-4 border-blue-800 flex-shrink-0 space-y-3 transition-colors">
          {/* Botones principales */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-4 px-4 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-2 border-gray-300 dark:border-gray-600"
            >
              Volver
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex-1 bg-gradient-to-r from-green-700 to-green-800 text-white py-4 px-4 rounded-xl font-bold text-lg hover:shadow-lg active:scale-95 transition-all border-2 border-green-900 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                {downloading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Generando con partituras…
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Descargar PDF
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
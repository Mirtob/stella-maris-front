import { useState } from 'react';
import { X, Download, Music } from 'lucide-react';
import { InstrumentType } from '../types';

type VoiceSelection = 'Soprano' | 'Contralto' | 'Tenor' | 'Bajo' | 'Full Score';

interface DownloadPDFModalProps {
  onClose: () => void;
  onDownload: (voiceSelection: VoiceSelection) => void | Promise<void>;
  userInstruments: InstrumentType[];
}

export function DownloadPDFModal({ onClose, onDownload, userInstruments }: DownloadPDFModalProps) {
  const [voiceSelection, setVoiceSelection] = useState<VoiceSelection>('Full Score');

  const isPolyChoirMode = userInstruments.includes('Coro');
  const isGuitarMode = userInstruments.includes('Guitarra');
  const isOrganMode = userInstruments.includes('Órgano');

  const handleDownload = () => {
    onDownload(voiceSelection);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-green-700 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-700 to-green-800 text-white p-6 rounded-t-3xl border-b-4 border-green-900">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Download className="w-10 h-10" strokeWidth={2.5} />
              <h2 className="text-lg sm:text-2xl font-bold">Descargar Folleto PDF</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-8 h-8" strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-green-100 text-sm">
            Elige el formato del folleto según tu rol en el coro
          </p>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-5 space-y-6">
          {/* Información sobre el folleto */}
          <div className="bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/60 dark:border-white/30 transition-colors">
            <div className="flex gap-3">
              <div className="text-3xl">📖</div>
              <div>
                <h4 className="text-lg font-bold text-green-950 dark:text-green-100 mb-1">
                  Folleto para miembros del coro
                </h4>
                <p className="text-sm text-green-900 dark:text-green-200">
                  El PDF incluirá todos los cantos con letra completa. 
                  Selecciona el formato que necesitas según tu instrumento o voz.
                </p>
              </div>
            </div>
          </div>

          {/* Formato del PDF según instrumento */}
          <div className="bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/60 dark:border-white/30 transition-colors">
            <label className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-green-800 rounded-xl flex items-center justify-center border-2 border-green-900">
                <Music className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-green-950 dark:text-white">Formato del Folleto</span>
            </label>

            {/* Opciones según el tipo de coro */}
            {isGuitarMode && (
              <div className="bg-amber-100 dark:bg-amber-900 rounded-xl p-4 mb-4 border-2 border-amber-300 dark:border-amber-700">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎸</span>
                  <div>
                    <p className="font-bold text-amber-950 dark:text-amber-100 mb-1">Coro con Guitarra</p>
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                      El folleto mostrará la letra con los <strong>acordes encima de cada línea</strong>. 
                      Perfecto para seguir la armonía mientras cantas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isOrganMode && !isGuitarMode && !isPolyChoirMode && (
              <div className="bg-purple-100 dark:bg-purple-900 rounded-xl p-4 mb-4 border-2 border-purple-300 dark:border-purple-700">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎹</span>
                  <div>
                    <p className="font-bold text-purple-950 dark:text-purple-100 mb-1">Coro con Órgano</p>
                    <p className="text-sm text-purple-900 dark:text-purple-200">
                      El folleto mostrará la <strong>letra limpia sin acordes</strong>. 
                      Ideal para seguir el canto con acompañamiento de órgano.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isPolyChoirMode && (
              <div className="space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-xl p-4 border-2 border-blue-300 dark:border-blue-700">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎼</span>
                    <div>
                      <p className="font-bold text-blue-950 dark:text-blue-100 mb-1">Coro Polifónico (SATB)</p>
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        Selecciona tu voz o genera la partitura completa para el director del coro.
                      </p>
                    </div>
                  </div>
                </div>

                <select
                  value={voiceSelection}
                  onChange={(e) => setVoiceSelection(e.target.value as VoiceSelection)}
                  className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-green-600 dark:focus:border-green-400 bg-white/60 dark:bg-white/10 text-green-950 dark:text-white font-bold shadow-lg transition-colors"
                >
                  <option value="Full Score">🎼 Partitura Completa (Director)</option>
                  <option value="Soprano">🎵 Voz Soprano</option>
                  <option value="Contralto">🎵 Voz Contralto (Alto)</option>
                  <option value="Tenor">🎵 Voz Tenor</option>
                  <option value="Bajo">🎵 Voz Bajo</option>
                </select>

                {/* Descripción dinámica según selección */}
                <div className="bg-white/60 dark:bg-white/10 rounded-xl p-4 border-2 border-white/40 dark:border-white/20">
                  <p className="text-sm text-green-900 dark:text-green-200">
                    {voiceSelection === 'Full Score' ? (
                      <>
                        <strong>Partitura Completa:</strong> El PDF incluirá referencias a la partitura completa 
                        con enlaces a las partituras de cada canto. Ideal para el director del coro.
                      </>
                    ) : (
                      <>
                        <strong>Voz {voiceSelection}:</strong> El PDF mostrará la letra de los cantos 
                        para que puedas seguir tu línea melódica. Combínalo con los enlaces a las partituras 
                        para practicar.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Si no tiene instrumentos configurados */}
            {!isGuitarMode && !isOrganMode && !isPolyChoirMode && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-300 dark:border-gray-600">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-bold text-gray-950 dark:text-gray-100 mb-1">Formato Estándar</p>
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      El folleto mostrará la letra de los cantos con formato estándar.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vista previa de contenido */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950 dark:to-emerald-950 rounded-xl p-4 border-2 border-green-300 dark:border-green-700">
            <p className="text-sm font-bold text-green-950 dark:text-green-100 mb-2">
              📋 El folleto incluirá:
            </p>
            <ul className="text-sm text-green-900 dark:text-green-200 space-y-1">
              <li>✓ Logo de la aplicación</li>
              <li>✓ Información de la Misa (fecha, celebración, hora)</li>
              <li>✓ Cantos organizados por categorías litúrgicas</li>
              <li>✓ Letra completa de cada canto</li>
              {isGuitarMode && <li>✓ Acordes encima de la letra</li>}
              {isPolyChoirMode && voiceSelection !== 'Full Score' && <li>✓ Formato para voz {voiceSelection}</li>}
              <li>✓ Enlaces a videos de YouTube y partituras</li>
              <li>✓ Tonalidades originales</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white/50 dark:bg-white/20 text-green-950 dark:text-white py-4 px-4 rounded-xl font-bold text-lg hover:bg-white/70 dark:hover:bg-white/30 transition-colors border-2 border-white/60 dark:border-white/30"
            >
              Cancelar
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-4 px-4 rounded-xl font-bold text-lg transition-all border-2 bg-gradient-to-r from-green-700 to-green-800 text-white hover:shadow-lg active:scale-95 border-green-900"
            >
              <div className="flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Descargar PDF
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
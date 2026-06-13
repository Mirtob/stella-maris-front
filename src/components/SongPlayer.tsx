import { ArrowLeft, FileText, Music, ZoomIn, ZoomOut, Download, Printer, ChevronUp, ChevronDown, RotateCcw, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Song, InstrumentType, UserRole } from '../types';
import { PDFViewer } from './PDFViewer';
import { safeUrl, safeWindowOpen } from '../utils/safeUrl';

// Extrae el Drive file ID de una URL de Drive y construye la URL del proxy
function getDriveProxyUrl(sheetMusicUrl: string): { proxyUrl: string; driveViewUrl: string } | null {
  const match = sheetMusicUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const fileId = match[1];
  return {
    proxyUrl: `/api/pdf?id=${fileId}`,
    driveViewUrl: `https://drive.google.com/file/d/${fileId}/view`,
  };
}
import { getCategoryColors, getCategoryHeaderGradient } from '../utils/colors';
import { transposeContent, getTransposedKey, formatTransposition } from '../utils/chordTranspose';
import { LyricsWithChords } from './LyricsWithChords';
import { LyricsOnly } from './LyricsOnly';

interface SongPlayerProps {
  song: Song;
  onBack: () => void;
  userInstrument?: InstrumentType;
  userRole?: UserRole;
}

export function SongPlayer({ song, onBack, userInstrument, userRole }: SongPlayerProps) {
  const [showSheetMusic, setShowSheetMusic] = useState(false);
  const [sheetMusicScale, setSheetMusicScale] = useState(1);
  const [transposition, setTransposition] = useState(0); // Semitonos de transposición
  const [showLyrics, setShowLyrics] = useState(true); // Mostrar letras por defecto
  
  const colors = getCategoryColors(song.category);
  const headerGradient = getCategoryHeaderGradient(song.category);

  // ✅ Pueblo Fiel: Solo letra sin acordes (no puede transponer)
  // ✅ Coro con Guitarra: Letra con acordes + transposición
  // ✅ Coro con Órgano: Partitura (línea melódica) + transposición
  const isPuebloFiel = userRole === 'Pueblo fiel';
  const isCoroOrAdmin = userRole === 'Coro' || userRole === 'Admin';
  
  // Puede transponer: Coro/Admin con Guitarra u Órgano
  const canTranspose = isCoroOrAdmin && 
                       (userInstrument === 'Guitarra' || userInstrument === 'Órgano') && 
                       song.lyrics;

  // Transponer la letra si hay transposición activa
  const displayedLyrics = song.lyrics && canTranspose 
    ? transposeContent(song.lyrics, transposition)
    : song.lyrics;

  // Calcular tonalidad transpuesta
  const displayedKey = song.originalKey && canTranspose
    ? getTransposedKey(song.originalKey, transposition)
    : song.originalKey;

  const handleZoomIn = () => {
    setSheetMusicScale(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setSheetMusicScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleTransposeUp = () => {
    setTransposition(prev => (prev + 1) % 12);
  };

  const handleTransposeDown = () => {
    setTransposition(prev => (prev - 1 + 12) % 12);
  };

  const handleResetTransposition = () => {
    setTransposition(0);
  };

  const handleDownload = () => {
    if (song.sheetMusicUrl) {
      const link = document.createElement('a');
      link.href = song.sheetMusicUrl;
      link.download = `${song.title} - Partitura.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    if (song.sheetMusicUrl) {
      const printWindow = safeWindowOpen(song.sheetMusicUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      {/* Header */}
      <div className={`bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 pb-8 border-b-4 border-blue-800`}>
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-xl active:opacity-70"
        >
          <ArrowLeft className="w-8 h-8" strokeWidth={2.5} />
          <span className="font-bold">Volver</span>
        </button>
        
        <div className="mb-4">
          <div className="text-lg opacity-90 mb-2">{song.category}</div>
          <h1 className="text-xl sm:text-base sm:text-lg font-bold mb-1 leading-tight">{song.title}</h1>
          
          {/* Mass Name Badge */}
          {song.massName && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-base font-bold border border-white/30">
                <Music className="w-4 h-4" />
                {song.massName}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {song.author && (
              <p className="text-lg opacity-90">
                <strong>Autor:</strong> {song.author}
              </p>
            )}
            {song.version && (
              <span className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-base font-bold border border-white/30">
                {song.version}
              </span>
            )}
            {displayedKey && (
              <span className="inline-flex items-center bg-amber-500 text-white px-3 py-1 rounded-lg text-base font-bold border border-amber-600">
                🎵 {displayedKey}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {/* YouTube Player Embebido — Q33: min-height en pantallas chicas
            asegura que los controles del player tengan tap target usable. */}
        <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden mb-6 border-2 border-white/40 dark:border-white/20 transition-colors">
          <div className="aspect-video bg-black min-h-[200px]">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${song.youtubeId}?rel=0&playsinline=1`}
              title={song.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
          
          {/* Player Info */}
          <div className="p-5 bg-white/40 dark:bg-white/10 backdrop-blur-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-blue-900 dark:text-blue-200 mb-1">Duración</div>
                <div className="text-2xl font-bold text-blue-950 dark:text-white">{song.duration}</div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className={`grid ${userRole === 'Pueblo fiel' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              {song.lyrics && (
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={`bg-gradient-to-br from-green-600 to-green-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-green-800`}
                >
                  <FileText className="w-5 h-5" />
                  {showLyrics ? 'Ocultar' : 'Ver'} Letra
                </button>
              )}
              {song.sheetMusicUrl && userRole !== 'Pueblo fiel' && (
                <button
                  onClick={() => setShowSheetMusic(!showSheetMusic)}
                  className={`bg-gradient-to-br from-blue-900 to-blue-950 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-blue-800`}
                >
                  <FileText className="w-5 h-5" />
                  {showSheetMusic ? 'Ocultar' : 'Ver'} Partitura
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lyrics Section with Transposition */}
        {song.lyrics && showLyrics && (
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-white/40 dark:border-white/20 overflow-hidden mb-6 transition-colors">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-5 border-b-2 border-green-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-7 h-7" strokeWidth={2.5} />
                  <h2 className="text-2xl font-bold">
                    {isPuebloFiel && 'Letra'}
                    {isCoroOrAdmin && userInstrument === 'Guitarra' && 'Letra con Acordes'}
                    {isCoroOrAdmin && userInstrument === 'Órgano' && 'Letra'}
                  </h2>
                </div>
              </div>

              {/* Transposition Controls - Solo para guitarristas */}
              {canTranspose && (
                <div className="bg-white/20 rounded-xl p-4 border border-white/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm opacity-90 mb-1">Transposición</div>
                      <div className="text-xl font-bold">
                        {formatTransposition(transposition)}
                      </div>
                      {transposition !== 0 && song.originalKey && (
                        <div className="text-sm opacity-90 mt-1">
                          {song.originalKey} → {displayedKey}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleTransposeDown}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-lg active:scale-95 transition-all border border-white/30"
                        title="Bajar 1 semitono"
                      >
                        <ChevronDown className="w-6 h-6" strokeWidth={2.5} />
                      </button>
                      {transposition !== 0 && (
                        <button
                          onClick={handleResetTransposition}
                          className="p-3 bg-amber-500 hover:bg-amber-600 rounded-lg active:scale-95 transition-all border border-amber-700"
                          title="Restablecer tono original"
                        >
                          <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                      )}
                      <button
                        onClick={handleTransposeUp}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-lg active:scale-95 transition-all border border-white/30"
                        title="Subir 1 semitono"
                      >
                        <ChevronUp className="w-6 h-6" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm opacity-90">
                    💡 <strong>Tip:</strong> Usa los botones ↑↓ para encontrar la tonalidad más cómoda para tu voz
                  </p>
                </div>
              )}

              {/* Info para organistas */}
              {userInstrument === 'Órgano' && song.originalKey && (
                <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-800/50">
                  <p className="text-sm">
                    🎹 <strong>Organistas:</strong> Este canto está en <strong>{song.originalKey}</strong>. 
                    Puedes transponer directamente en tu órgano usando el control de transposición del instrumento.
                  </p>
                </div>
              )}
            </div>

            {/* Lyrics Viewer — responsive height:
                  Mobile (<640px): cap at 50% of viewport so the YouTube player
                  stays visible above the fold.
                  Tablet/desktop: 600px fixed cap. */}
            <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 overflow-auto transition-colors max-h-[50vh] sm:max-h-[600px]">
              {/* Pueblo Fiel: Solo letra sin acordes */}
              {isPuebloFiel && <LyricsOnly lyrics={displayedLyrics} />}
              
              {/* Coro/Admin con Guitarra: Letra con acordes */}
              {isCoroOrAdmin && userInstrument === 'Guitarra' && (
                <LyricsWithChords lyrics={displayedLyrics} />
              )}
              
              {/* Coro/Admin con Órgano: Letra sin acordes (se ven en la partitura) */}
              {isCoroOrAdmin && userInstrument === 'Órgano' && (
                <LyricsOnly lyrics={displayedLyrics} />
              )}
            </div>

            {/* Footer with Tips */}
            <div className="bg-white/40 dark:bg-white/10 backdrop-blur-sm border-t-2 border-white/40 dark:border-white/20 p-4 transition-colors">
              <div className="flex gap-2 text-blue-900 dark:text-blue-100">
                <div className="text-xl">🎼</div>
                <div className="text-sm">
                  <strong>Nota:</strong> {canTranspose 
                    ? 'Los acordes se transponen automáticamente. Puedes ajustar la tonalidad a tu preferencia.'
                    : 'Sigue la letra mientras escuchas el audio de fondo.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sheet Music Section */}
        {song.sheetMusicUrl && showSheetMusic && (
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-white/40 dark:border-white/20 overflow-hidden mb-6 transition-colors">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-3 sm:p-4 border-b-2 border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5" strokeWidth={2.5} />
                <h2 className="text-base font-bold">Partitura</h2>
              </div>
              {(() => {
                const urls = getDriveProxyUrl(song.sheetMusicUrl);
                return (
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={safeUrl(urls?.driveViewUrl ?? song.sheetMusicUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-blue-900 py-3 px-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold shadow-lg"
                    >
                      <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                      Abrir en Drive
                    </a>
                    <a
                      href={safeUrl(urls ? `/api/pdf?id=${urls.proxyUrl.split('id=')[1]}` : song.sheetMusicUrl)}
                      download={`${song.title} - Partitura.pdf`}
                      className="bg-white/20 hover:bg-white/30 text-white py-3 px-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold border border-white/30"
                    >
                      <Download className="w-4 h-4" strokeWidth={2.5} />
                      Descargar
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Sheet Music Viewer */}
            <div className="bg-gray-100 dark:bg-gray-800 overflow-auto transition-colors" style={{ maxHeight: '600px' }}>
              <div
                className="p-4 inline-block min-w-full"
                style={{
                  transform: `scale(${sheetMusicScale})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s ease'
                }}
              >
                {/* Si la URL es una imagen */}
                {(song.sheetMusicUrl.endsWith('.jpg') || 
                  song.sheetMusicUrl.endsWith('.jpeg') || 
                  song.sheetMusicUrl.endsWith('.png') || 
                  song.sheetMusicUrl.endsWith('.webp')) ? (
                  <img 
                    src={song.sheetMusicUrl} 
                    alt={`Partitura de ${song.title}`}
                    className="w-full h-auto shadow-xl rounded-lg"
                  />
                ) : (
                  (() => {
                    const urls = getDriveProxyUrl(song.sheetMusicUrl);
                    if (!urls) return null;
                    return (
                      <PDFViewer
                        proxyUrl={urls.proxyUrl}
                        driveViewUrl={urls.driveViewUrl}
                        title={song.title}
                      />
                    );
                  })()
                )}
              </div>
            </div>

            {/* Footer with Tips */}
            <div className="bg-white/40 dark:bg-white/10 backdrop-blur-sm border-t-2 border-white/40 dark:border-white/20 p-4 transition-colors">
              <div className="flex gap-2 text-blue-900 dark:text-blue-100">
                <div className="text-xl">💡</div>
                <p className="text-base">
                  <strong>Consejo:</strong> Usa los controles de zoom para ajustar el tamaño de la partitura según tu preferencia
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Card */}
        <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm border-2 border-white/40 dark:border-white/20 rounded-xl p-6 transition-colors">
          <div className="flex gap-3">
            <div className="text-3xl">🎼</div>
            <div>
              <h3 className="text-xl font-bold text-blue-950 dark:text-white mb-2">Modo de uso</h3>
              <ul className="text-base text-blue-900 dark:text-blue-100 space-y-2">
                <li>• <strong>Reproduce el video</strong> para escuchar el canto</li>
                {song.lyrics && <li>• <strong>Ver Letra</strong> para seguir la letra{canTranspose && ' y acordes'}</li>}
                {canTranspose && <li>• <strong>Transposición (↑↓):</strong> Ajusta la tonalidad fácilmente</li>}
                {userInstrument === 'Órgano' && <li>• <strong>Organistas:</strong> Transpón directamente en tu instrumento</li>}
                {song.sheetMusicUrl && userRole !== 'Pueblo fiel' && <li>• <strong>Ver Partitura</strong> para seguir la partitura completa</li>}
                <li>• {userRole === 'Pueblo fiel' ? 'Canta junto con el video siguiendo la letra' : 'Puedes ver todo al mismo tiempo sin salir de la app'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
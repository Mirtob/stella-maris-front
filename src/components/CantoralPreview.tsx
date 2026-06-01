import { Trash2, Play, Music } from 'lucide-react';
import { Song } from '../types';

interface CantoralPreviewProps {
  cantoral: Song[];
  onRemove: (songId: string) => void;
  onPlaySong: (song: Song) => void;
}

export function CantoralPreview({ cantoral, onRemove, onPlaySong }: CantoralPreviewProps) {
  if (cantoral.length === 0) {
    return (
      <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/40 dark:border-white/20 transition-colors">
        <Music className="w-8 h-8 mx-auto mb-2 text-blue-900/50 dark:text-blue-300/50" />
        <h3 className="text-sm font-bold text-blue-950 dark:text-white mb-1">
          Cantoral Vacío
        </h3>
        <p className="text-xs text-blue-900 dark:text-blue-100">
          Comienza a buscar cantos por categoría para armar tu cantoral
        </p>
      </div>
    );
  }

  // Agrupar cantos por categoría
  const groupedSongs = cantoral.reduce((acc, song) => {
    if (!acc[song.category]) {
      acc[song.category] = [];
    }
    acc[song.category].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

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

  return (
    <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border-2 border-white/40 dark:border-white/20 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <Music className="w-8 h-8 text-blue-900 dark:text-blue-300" strokeWidth={2.5} />
        <div>
          <h3 className="text-2xl font-bold text-blue-950 dark:text-white">
            Mi Cantoral
          </h3>
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {cantoral.length} {cantoral.length === 1 ? 'canto seleccionado' : 'cantos seleccionados'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedCategories.map((category) => (
          <div key={category} className="bg-white/50 dark:bg-white/5 rounded-xl p-4 border border-white/60 dark:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{categoryIcons[category] || '🎵'}</span>
              <h4 className="text-lg font-bold text-blue-950 dark:text-white">{category}</h4>
              <span className="text-sm text-blue-900 dark:text-blue-200 ml-auto">
                {groupedSongs[category].length}
              </span>
            </div>

            <div className="space-y-2">
              {groupedSongs[category].map((song) => (
                <div
                  key={song.id}
                  className="bg-white/60 dark:bg-white/5 rounded-lg p-3 border border-white/60 dark:border-white/10 group hover:bg-white/80 dark:hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Play Button */}
                    <button
                      onClick={() => onPlaySong(song)}
                      className="flex-shrink-0 w-10 h-10 bg-blue-900 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center"
                    >
                      <Play className="w-5 h-5" fill="currentColor" />
                    </button>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-blue-950 dark:text-white truncate">
                        {song.title}
                      </h5>
                      {song.author && (
                        <p className="text-sm text-blue-800 dark:text-blue-200 truncate">
                          {song.author}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {song.isLiturgical && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                            Litúrgico
                          </span>
                        )}
                        {song.originalKey && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                            {song.originalKey}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemove(song.id)}
                      className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 active:scale-95 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Music, Search, Edit2, Trash2, Plus, FileText, Youtube, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { MassCategory } from '../types';
import { AdminUploadSong } from './AdminUploadSong';

interface ManagedSong {
  id: string;
  title: string;
  author: string;
  category: MassCategory;
  youtubeId: string;
  duration: string;
  hasSheetMusic: boolean;
  massName?: string;
}

export function SongManager() {
  const [songs] = useState<ManagedSong[]>([
    { 
      id: '1', 
      title: 'Pescador de Hombres', 
      author: 'Cesáreo Gabaráin', 
      category: 'Comunión',
      youtubeId: 'abc123',
      duration: '4:30',
      hasSheetMusic: true
    },
    { 
      id: '2', 
      title: 'Juntos como Hermanos', 
      author: 'Cesáreo Gabaráin', 
      category: 'Entrada',
      youtubeId: 'def456',
      duration: '3:45',
      hasSheetMusic: true
    },
    { 
      id: '3', 
      title: 'Kyrie Eleison', 
      author: 'Misa Criolla', 
      category: 'Kyrie',
      youtubeId: 'ghi789',
      duration: '2:30',
      hasSheetMusic: true,
      massName: 'Misa Criolla'
    },
    { 
      id: '4', 
      title: 'Salmo 23', 
      author: 'Traditional', 
      category: 'Salmo',
      youtubeId: 'jkl012',
      duration: '3:15',
      hasSheetMusic: false
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<MassCategory | 'Todos'>('Todos');
  const [showUploadForm, setShowUploadForm] = useState(false);

  const categories: (MassCategory | 'Todos')[] = [
    'Todos',
    'Entrada',
    'Kyrie',
    'Gloria',
    'Salmo',
    'Aleluya',
    'Ofertorio',
    'Santo',
    'Cordero de Dios',
    'Comunión',
    'Salida'
  ];

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || song.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: MassCategory) => {
    const colors: Record<MassCategory, string> = {
      'Entrada': 'bg-purple-100 text-purple-700 border-purple-300',
      'Kyrie': 'bg-blue-100 text-blue-700 border-blue-300',
      'Gloria': 'bg-amber-100 text-amber-700 border-amber-300',
      'Salmo': 'bg-green-100 text-green-700 border-green-300',
      'Aleluya': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Post Evangelio': 'bg-pink-100 text-pink-700 border-pink-300',
      'Ofertorio': 'bg-orange-100 text-orange-700 border-orange-300',
      'Santo': 'bg-red-100 text-red-700 border-red-300',
      'Cordero de Dios': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      'Comunión': 'bg-teal-100 text-teal-700 border-teal-300',
      'Salida': 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[category];
  };

  // Si está en modo subir, mostrar formulario
  if (showUploadForm) {
    return (
      <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
        <div className="pt-16">
          {/* Back Button */}
          <button
            onClick={() => setShowUploadForm(false)}
            className="mb-6 flex items-center gap-2 text-blue-900 dark:text-blue-100 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Volver a la lista</span>
          </button>

          {/* Upload Form */}
          <AdminUploadSong
            onSongUploaded={(song) => {
              console.log('Song uploaded:', song);
              setShowUploadForm(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Music className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-purple-900 mb-2">Gestión de Cantos</h1>
          <p className="text-xl text-purple-700">{songs.length} cantos en la base de datos</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="Buscar canto o autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 text-lg border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as MassCategory | 'Todos')}
            className="w-full px-4 py-4 text-lg border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 bg-white font-bold"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Todos' ? 'Todas las categorías' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Songs List */}
        <div className="space-y-4">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className="bg-white rounded-2xl shadow-lg p-5 border-2 border-gray-200"
            >
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-800 flex-1 leading-tight">
                    {song.title}
                  </h3>
                  <div className={`px-3 py-1 rounded-lg border-2 text-sm font-bold ml-2 ${getCategoryColor(song.category)}`}>
                    {song.category}
                  </div>
                </div>
                
                <p className="text-base text-gray-600 mb-2">{song.author}</p>
                
                {song.massName && (
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-lg border-2 border-purple-300 text-sm font-bold">
                    <Music className="w-4 h-4" />
                    {song.massName}
                  </div>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4 bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="text-center">
                  <Youtube className="w-6 h-6 text-red-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">YouTube</div>
                  <div className="text-sm font-bold text-gray-800 truncate">{song.youtubeId}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">⏱️</div>
                  <div className="text-xs text-gray-600">Duración</div>
                  <div className="text-sm font-bold text-gray-800">{song.duration}</div>
                </div>
                <div className="text-center">
                  <FileText className={`w-6 h-6 mx-auto mb-1 ${song.hasSheetMusic ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="text-xs text-gray-600">Partitura</div>
                  <div className={`text-sm font-bold ${song.hasSheetMusic ? 'text-green-600' : 'text-gray-400'}`}>
                    {song.hasSheetMusic ? 'Sí' : 'No'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-98 transition-all">
                  <Edit2 className="w-5 h-5" />
                  <span className="text-base font-bold">Editar</span>
                </button>
                <button className="flex-1 bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 active:scale-98 transition-all">
                  <Trash2 className="w-5 h-5" />
                  <span className="text-base font-bold">Eliminar</span>
                </button>
              </div>
            </div>
          ))}

          {filteredSongs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-600">No se encontraron cantos</p>
            </div>
          )}
        </div>

        {/* Add Song Button */}
        <button 
          onClick={() => setShowUploadForm(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus className="w-8 h-8" strokeWidth={2.5} />
        </button>

        {/* Stats */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="text-lg sm:text-2xl font-bold text-blue-700">{songs.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Cantos</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="text-lg sm:text-2xl font-bold text-green-700">
                {songs.filter(s => s.hasSheetMusic).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Con Partitura</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
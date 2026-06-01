import { useState } from 'react';
import { Upload, Music, X, Plus, Check, Copy, CheckCircle, Youtube, Hash, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getGoogleDriveAccessToken, getYouTubeAccessToken } from '../services/googleAuth';
import { uploadVideo } from '../services/youtube';
import { uploadSheetMusic, getPublicUrl as getDrivePublicUrl } from '../services/googleDrive';

interface AdminUploadSongProps {
  onSongUploaded?: (song: any) => void;
}

const MASS_PARTS = [
  'Entrada',
  'Kyrie',
  'Gloria',
  'Salmo',
  'Aleluya',
  'Post Evangelio',
  'Ofertorio',
  'Santo',
  'Cordero de Dios',
  'Comunión',
  'Salida',
];

const LITURGICAL_SEASONS = [
  'Adviento',
  'Navidad',
  'Cuaresma',
  'Pascua',
  'Tiempo Ordinario',
  'Todas las temporadas',
];

const INSTRUMENTS = ['Coro', 'Guitarra', 'Órgano'];

export function AdminUploadSong({ onSongUploaded }: AdminUploadSongProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [artist, setArtist] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [sheetMusicUrl, setSheetMusicUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [instrument, setInstrument] = useState<'Coro' | 'Guitarra' | 'Órgano'>('Coro');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [sheetMusicFile, setSheetMusicFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [sheetUploadProgress, setSheetUploadProgress] = useState<number | null>(null);
  const [isLiturgical, setIsLiturgical] = useState<boolean | null>(null);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleSeason = (season: string) => {
    if (selectedSeasons.includes(season)) {
      setSelectedSeasons(selectedSeasons.filter(s => s !== season));
    } else {
      setSelectedSeasons([...selectedSeasons, season]);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('El título es obligatorio');
      return false;
    }
    if (!author.trim()) {
      toast.error('El autor es obligatorio');
      return false;
    }
    if (selectedCategories.length === 0) {
      toast.error('Debe seleccionar al menos una parte de la Misa');
      return false;
    }
    if (selectedSeasons.length === 0) {
      toast.error('Debe seleccionar al menos un tiempo litúrgico');
      return false;
    }
    if (!youtubeId.trim() && !videoFile) {
      toast.error('Debe proporcionar un ID de YouTube o subir un video');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    setVideoUploadProgress(null);
    setSheetUploadProgress(null);

    try {
      const youtubeAccessToken = getYouTubeAccessToken();
      const driveAccessToken = getGoogleDriveAccessToken();
      
      let resolvedYoutubeId = youtubeId.trim();
      let resolvedSheetMusicUrl = sheetMusicUrl.trim() || undefined;

      // Validar acceso a APIs si se necesita subir archivos
      if (videoFile && !resolvedYoutubeId) {
        if (!youtubeAccessToken) {
          toast.error('Acceso denegado a YouTube. Por favor, inicia sesión nuevamente.', {
            description: 'Tu sesión puede haber expirado.'
          });
          setUploading(false);
          return;
        }
      }

      if (sheetMusicFile && !resolvedSheetMusicUrl) {
        if (!driveAccessToken) {
          toast.error('Acceso denegado a Google Drive. Por favor, inicia sesión nuevamente.', {
            description: 'Tu sesión puede haber expirado.'
          });
          setUploading(false);
          return;
        }
      }

      if (videoFile && !resolvedYoutubeId) {
        const uploadResult = await uploadVideo(
          videoFile,
          {
            title: title.trim(),
            description: generateYouTubeDescription(),
            tags: [...selectedCategories, ...selectedSeasons, instrument]
              .filter(Boolean)
              .map((tag) => tag.replace(/\s+/g, '')),
            privacyStatus: 'unlisted',
          },
          youtubeAccessToken,
          (progress) => setVideoUploadProgress(progress)
        );

        if (!uploadResult.success || !uploadResult.videoId) {
          throw new Error(uploadResult.error || 'No se pudo subir el video a YouTube');
        }

        resolvedYoutubeId = uploadResult.videoId;
        toast.success('Video subido a YouTube con éxito');
      }

      if (sheetMusicFile && !resolvedSheetMusicUrl) {
        const sheetResult = await uploadSheetMusic(
          sheetMusicFile,
          title.trim(),
          driveAccessToken,
          (progress) => setSheetUploadProgress(progress)
        );

        if (!sheetResult.success || !sheetResult.file) {
          throw new Error(sheetResult.error || 'No se pudo subir la partitura a Drive');
        }

        resolvedSheetMusicUrl = getDrivePublicUrl(sheetResult.file.id);
        toast.success('Partitura subida a Google Drive');
      }

      const newSong = {
        id: `song_${Date.now()}`,
        title: title.trim(),
        author: author.trim(),
        artist: artist.trim() || author.trim(),
        youtubeId: resolvedYoutubeId || 'pending_upload',
        sheetMusicUrl: resolvedSheetMusicUrl,
        duration: duration.trim() || '0:00',
        version: instrument,
        category: selectedCategories[0],
        recommendedCategories: selectedCategories,
        liturgicalSeason: selectedSeasons.join(', '),
        tags: [...selectedCategories, ...selectedSeasons],
        uploadedAt: new Date().toISOString(),
      };

      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('¡Canto subido exitosamente!', {
        description: `"${title}" está ahora disponible en el catálogo`,
      });

      setTitle('');
      setAuthor('');
      setArtist('');
      setYoutubeId('');
      setSheetMusicUrl('');
      setDuration('');
      setSelectedCategories([]);
      setSelectedSeasons([]);
      setVideoFile(null);
      setSheetMusicFile(null);
      setVideoUploadProgress(null);
      setSheetUploadProgress(null);

      if (onSongUploaded) {
        onSongUploaded(newSong);
      }
    } catch (error: any) {
      console.error('Error uploading song:', error);
      toast.error('Error al subir el canto', {
        description: error?.message || 'Por favor, intenta nuevamente',
      });
    } finally {
      setUploading(false);
    }
  };

  const extractYouTubeId = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return url; // Si no es URL, asumir que ya es el ID
  };

  const handleYouTubeUrlChange = (value: string) => {
    const id = extractYouTubeId(value);
    setYoutubeId(id);
  };

  // Generar hashtags para YouTube
  const generateYouTubeHashtags = (): string[] => {
    const hashtags: string[] = [];
    
    // Agregar clasificación litúrgica OBLIGATORIA
    if (isLiturgical !== null) {
      hashtags.push(isLiturgical ? '#Liturgico' : '#NoLiturgico');
    }
    
    // Agregar categorías como hashtags (sin espacios)
    selectedCategories.forEach(cat => {
      const tag = cat.replace(/\s+/g, '');
      hashtags.push(`#${tag}`);
    });
    
    // Agregar instrumento
    hashtags.push(`#${instrument}`);
    
    // Agregar tiempos litúrgicos (sin espacios)
    selectedSeasons.forEach(season => {
      const tag = season.replace(/\s+/g, '');
      hashtags.push(`#${tag}`);
    });
    
    // Agregar hashtags generales
    hashtags.push('#CantosCatolicos', '#MusicaSacra', '#Liturgia', '#Misa');
    
    return hashtags;
  };

  // Generar descripción completa para YouTube
  const generateYouTubeDescription = (): string => {
    let description = `${title}\n\n`;
    description += `🎵 INFORMACIÓN DEL CANTO 🎵\n`;
    description += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    description += `📝 Título: ${title}\n`;
    description += `✍️ Autor/Compositor: ${author}\n`;
    if (artist && artist !== author) {
      description += `🎤 Intérprete: ${artist}\n`;
    }
    description += `🎹 Instrumento: ${instrument}\n`;
    if (duration) {
      description += `⏱️ Duración: ${duration}\n`;
    }
    
    // Agregar clasificación litúrgica
    if (isLiturgical !== null) {
      description += `\n⛪ CLASIFICACIÓN:\n`;
      if (isLiturgical) {
        description += `   ✝️ LITÚRGICO - Apropiado para la celebración de la Misa\n`;
      } else {
        description += `   🕊️ NO LITÚRGICO - Solo para eventos extra-litúrgicos (procesiones, adoraciones, charlas, etc.)\n`;
      }
    }
    description += `\n`;
    
    description += `📖 PARTES DE LA MISA:\n`;
    selectedCategories.forEach(cat => {
      description += `   • ${cat}\n`;
    });
    description += `\n`;
    
    description += `🕊️ TIEMPOS LITÚRGICOS:\n`;
    selectedSeasons.forEach(season => {
      description += `   • ${season}\n`;
    });
    description += `\n`;
    
    if (sheetMusicUrl) {
      description += `🎼 PARTITURA:\n`;
      description += `${sheetMusicUrl}\n\n`;
    }
    
    description += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const hashtags = generateYouTubeHashtags();
    description += `${hashtags.join(' ')}\n\n`;
    
    description += `📱 Descarga nuestra app de Cantoral Católico para acceder a todos los cantos organizados por tiempo litúrgico y parte de la Misa.\n`;
    
    return description;
  };

  // Copiar al portapapeles
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);

  const copyToClipboard = async (text: string, type: 'description' | 'hashtags') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'description') {
        setCopiedDescription(true);
        setTimeout(() => setCopiedDescription(false), 2000);
      } else {
        setCopiedHashtags(true);
        setTimeout(() => setCopiedHashtags(false), 2000);
      }
      toast.success('¡Copiado al portapapeles!');
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  const hasMinimumInfo = title && author && selectedCategories.length > 0 && selectedSeasons.length > 0;

  return (
    <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-white/40 dark:border-white/20 overflow-hidden transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 border-b-2 border-white/30">
        <div className="flex items-center gap-3">
          <Music className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Subir Nuevo Canto</h2>
            <p className="text-sm opacity-90 mt-1">
              Completa todos los campos obligatorios marcados con *
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Título */}
        <div>
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-2">
            Título del Canto *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Todos Juntos Formamos la Iglesia"
            className="w-full px-4 py-3 rounded-xl text-lg text-blue-950 dark:text-white bg-white/70 dark:bg-white/15 border-2 border-white/60 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-600 dark:focus:border-purple-400 placeholder-blue-700/50 dark:placeholder-blue-300/50 transition-all"
            required
          />
        </div>

        {/* Autor */}
        <div>
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-2">
            Autor/Compositor *
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Ej: Juan Pérez"
            className="w-full px-4 py-3 rounded-xl text-lg text-blue-950 dark:text-white bg-white/70 dark:bg-white/15 border-2 border-white/60 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-600 dark:focus:border-purple-400 placeholder-blue-700/50 dark:placeholder-blue-300/50 transition-all"
            required
          />
        </div>

        {/* Artista/Intérprete (opcional) */}
        <div>
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-2">
            Artista/Intérprete (opcional)
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Ej: Coro Parroquial San Juan"
            className="w-full px-4 py-3 rounded-xl text-lg text-blue-950 dark:text-white bg-white/70 dark:bg-white/15 border-2 border-white/60 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-600 dark:focus:border-purple-400 placeholder-blue-700/50 dark:placeholder-blue-300/50 transition-all"
          />
        </div>

        {/* Instrumento */}
        <div>
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-2">
            Versión/Instrumento
          </label>
          <div className="flex gap-3">
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst}
                type="button"
                onClick={() => setInstrument(inst as any)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  instrument === inst
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg scale-105'
                    : 'bg-white/60 dark:bg-white/10 text-blue-900 dark:text-blue-100 hover:bg-white/80 dark:hover:bg-white/20'
                }`}
              >
                {inst}
              </button>
            ))}
          </div>
        </div>

        {/* CLASIFICACIÓN LITÚRGICA - SOLO ADMINISTRADOR PUEDE MODIFICAR */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl p-5 border-2 border-yellow-300 dark:border-yellow-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-2xl">⛪</div>
            <div>
              <h4 className="text-base font-bold text-yellow-900 dark:text-yellow-100">
                Clasificación Litúrgica *
              </h4>
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                Esta clasificación solo puede ser establecida por el administrador
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setIsLiturgical(true)}
              className={`w-full py-4 px-5 rounded-xl text-sm font-bold transition-all flex items-start gap-3 ${
                isLiturgical === true
                  ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg border-2 border-green-800'
                  : 'bg-white/80 dark:bg-white/20 text-blue-900 dark:text-blue-100 hover:bg-white dark:hover:bg-white/30 border-2 border-green-300 dark:border-green-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-3 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isLiturgical === true 
                  ? 'border-white bg-white' 
                  : 'border-green-400 dark:border-green-600'
              }`}>
                {isLiturgical === true && <Check className="w-4 h-4 text-green-700" />}
              </div>
              <div className="text-left">
                <div className="font-bold text-base mb-1">✝️ Litúrgico</div>
                <div className={`text-xs ${isLiturgical === true ? 'text-green-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  Apropiado para la celebración de la Misa. Disponible en el armado de cantorales litúrgicos.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsLiturgical(false)}
              className={`w-full py-4 px-5 rounded-xl text-sm font-bold transition-all flex items-start gap-3 ${
                isLiturgical === false
                  ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-lg border-2 border-orange-800'
                  : 'bg-white/80 dark:bg-white/20 text-blue-900 dark:text-blue-100 hover:bg-white dark:hover:bg-white/30 border-2 border-orange-300 dark:border-orange-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-3 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isLiturgical === false 
                  ? 'border-white bg-white' 
                  : 'border-orange-400 dark:border-orange-600'
              }`}>
                {isLiturgical === false && <Check className="w-4 h-4 text-orange-700" />}
              </div>
              <div className="text-left">
                <div className="font-bold text-base mb-1">🕊️ No Litúrgico (Religioso Católico)</div>
                <div className={`text-xs ${isLiturgical === false ? 'text-orange-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  Apropiado solo para eventos extra-litúrgicos: procesiones, adoraciones, charlas, etc. Se guardará en el banco de partituras.
                </div>
              </div>
            </button>
          </div>

          {isLiturgical !== null && (
            <div className={`mt-4 p-3 rounded-lg ${
              isLiturgical 
                ? 'bg-green-100 dark:bg-green-900/40 border-2 border-green-300 dark:border-green-700' 
                : 'bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-300 dark:border-orange-700'
            }`}>
              <p className={`text-sm font-bold ${
                isLiturgical 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-orange-900 dark:text-orange-100'
              }`}>
                ✓ Clasificación seleccionada: {isLiturgical ? 'Litúrgico' : 'No Litúrgico'}
              </p>
            </div>
          )}

          <div className="mt-4 bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-lg border-2 border-yellow-400 dark:border-yellow-600">
            <p className="text-xs text-yellow-900 dark:text-yellow-100">
              <strong>⚠️ Importante:</strong> La clasificación litúrgica determina dónde estará disponible el canto. Solo el administrador puede modificar esta clasificación después de la subida inicial.
            </p>
          </div>
        </div>

        {/* YouTube ID o URL */}
        <div>
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-2">
            YouTube URL o ID *
          </label>
          <input
            type="text"
            value={youtubeId}
            onChange={(e) => handleYouTubeUrlChange(e.target.value)}
            placeholder="Ej: https://youtube.com/watch?v=dQw4w9WgXcQ o dQw4w9WgXcQ"
            className="w-full px-4 py-3 rounded-xl text-lg text-blue-950 dark:text-white bg-white/70 dark:bg-white/15 border-2 border-white/60 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-600 dark:focus:border-purple-400 placeholder-blue-700/50 dark:placeholder-blue-300/50 transition-all"
          />
          {youtubeId && (
            <p className="mt-2 text-sm text-green-700 dark:text-green-400">
              ✓ ID extraído: {youtubeId}
            </p>
          )}

          <div className="mt-4">
            <label className="block text-sm font-bold text-blue-950 dark:text-white mb-2">
              Subir archivo de video MP4 (opcional)
            </label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-blue-950 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />
            {videoFile && (
              <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                ✓ Archivo seleccionado: {videoFile.name}
              </p>
            )}
            {videoUploadProgress !== null && (
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                Progreso de subida de video: {videoUploadProgress.toFixed(0)}%
              </p>
            )}
          </div>
        </div>

        {/* Duración */}
        <div>
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-2">
            Duración (opcional)
          </label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Ej: 3:45"
            className="w-full px-4 py-3 rounded-xl text-lg text-blue-950 dark:text-white bg-white/70 dark:bg-white/15 border-2 border-white/60 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-600 dark:focus:border-purple-400 placeholder-blue-700/50 dark:placeholder-blue-300/50 transition-all"
          />
        </div>

        {/* URL de Partitura */}
        <div>
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-2">
            URL de Partitura (opcional)
          </label>
          <input
            type="url"
            value={sheetMusicUrl}
            onChange={(e) => setSheetMusicUrl(e.target.value)}
            placeholder="Ej: https://drive.google.com/file/..."
            className="w-full px-4 py-3 rounded-xl text-lg text-blue-950 dark:text-white bg-white/70 dark:bg-white/15 border-2 border-white/60 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-600 dark:focus:border-purple-400 placeholder-blue-700/50 dark:placeholder-blue-300/50 transition-all"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-2">
            Subir partitura local (PDF/PNG/JPEG)
          </label>
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            onChange={(e) => setSheetMusicFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-blue-950 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
          />
          {sheetMusicFile && (
            <p className="mt-2 text-sm text-green-700 dark:text-green-400">
              ✓ Partitura seleccionada: {sheetMusicFile.name}
            </p>
          )}
          {sheetUploadProgress !== null && (
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              Progreso de subida de partitura: {sheetUploadProgress.toFixed(0)}%
            </p>
          )}
        </div>

        {/* Partes de la Misa (Múltiple selección) */}
        <div>
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-3">
            Partes de la Misa Recomendadas * (Selecciona una o más)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MASS_PARTS.map((part) => (
              <button
                key={part}
                type="button"
                onClick={() => toggleCategory(part)}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedCategories.includes(part)
                    ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg scale-105'
                    : 'bg-white/60 dark:bg-white/10 text-blue-900 dark:text-blue-100 hover:bg-white/80 dark:hover:bg-white/20'
                }`}
              >
                {selectedCategories.includes(part) && <Check className="w-4 h-4" />}
                {part}
              </button>
            ))}
          </div>
          {selectedCategories.length > 0 && (
            <p className="mt-2 text-sm text-green-700 dark:text-green-400">
              ✓ {selectedCategories.length} parte{selectedCategories.length !== 1 ? 's' : ''} seleccionada{selectedCategories.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tiempo Litúrgico (Múltiple selección) */}
        <div>
          <label className="block text-sm font-bold text-blue-950 dark:text-white mb-3">
            Tiempos Litúrgicos Recomendados * (Selecciona uno o más)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LITURGICAL_SEASONS.map((season) => (
              <button
                key={season}
                type="button"
                onClick={() => toggleSeason(season)}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedSeasons.includes(season)
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                    : 'bg-white/60 dark:bg-white/10 text-blue-900 dark:text-blue-100 hover:bg-white/80 dark:hover:bg-white/20'
                }`}
              >
                {selectedSeasons.includes(season) && <Check className="w-4 h-4" />}
                {season}
              </button>
            ))}
          </div>
          {selectedSeasons.length > 0 && (
            <p className="mt-2 text-sm text-green-700 dark:text-green-400">
              ✓ {selectedSeasons.length} tiempo{selectedSeasons.length !== 1 ? 's' : ''} seleccionado{selectedSeasons.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t-2 border-white/30 dark:border-white/20">
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-gradient-to-br from-purple-600 to-purple-800 text-white py-4 px-3 sm:px-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-2xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                Subiendo canto...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Subir Canto
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-xl">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>📝 Nota:</strong> Este canto estará disponible para todos los coros y aparecerá en las sugerencias según el tiempo litúrgico seleccionado.
          </p>
        </div>

        {/* YouTube Description and Hashtags */}
        {hasMinimumInfo && (
          <div className="space-y-4 pt-4 border-t-2 border-white/30 dark:border-white/20">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                <Youtube className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-950 dark:text-white">
                  Etiquetas para YouTube
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Copia y pega estos datos en tu video de YouTube
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-xl p-5 border-2 border-orange-200 dark:border-orange-700">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-orange-700 dark:text-orange-300" />
                <h4 className="text-base font-bold text-orange-900 dark:text-orange-100">
                  Descripción Completa
                </h4>
              </div>
              <textarea
                value={generateYouTubeDescription()}
                className="w-full h-48 px-4 py-3 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800 border-2 border-orange-300 dark:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono resize-none transition-colors"
                readOnly
              />
              <button
                type="button"
                onClick={() => copyToClipboard(generateYouTubeDescription(), 'description')}
                className="mt-3 w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-xl text-base font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {copiedDescription ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    ¡Descripción Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Descripción
                  </>
                )}
              </button>
            </div>

            {/* Hashtags */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                <h4 className="text-base font-bold text-blue-900 dark:text-blue-100">
                  Hashtags ({generateYouTubeHashtags().length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {generateYouTubeHashtags().map((hashtag) => (
                  <span
                    key={hashtag}
                    className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-blue-300 dark:border-blue-600"
                  >
                    {hashtag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(generateYouTubeHashtags().join(' '), 'hashtags')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl text-base font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {copiedHashtags ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    ¡Hashtags Copiados!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Hashtags
                  </>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-5 border-2 border-red-200 dark:border-red-700">
              <div className="flex items-start gap-3">
                <Youtube className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-red-900 dark:text-red-100 mb-2">
                    📌 Instrucciones para YouTube
                  </h4>
                  <ol className="text-sm text-red-800 dark:text-red-200 space-y-2 list-decimal list-inside">
                    <li>Sube el video a tu canal de YouTube</li>
                    <li>Copia y pega la <strong>Descripción Completa</strong> en la descripción del video</li>
                    <li>Copia y pega los <strong>Hashtags</strong> al final de la descripción o en los hashtags del video</li>
                    <li>Asegúrate de que todos los datos coincidan con los del formulario</li>
                    <li>Publica el video y copia el ID o URL en el campo "YouTube URL o ID" arriba</li>
                  </ol>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-3 font-bold">
                    ⚠️ Es fundamental que uses estas etiquetas para que el sistema pueda clasificar automáticamente el canto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
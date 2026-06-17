# Integración con YouTube API v3

## 📋 Descripción General

Este documento detalla la integración completa con YouTube Data API v3 para:
- Gestionar el canal de cantos litúrgicos
- Subir nuevos cantos
- Crear y gestionar playlists
- Obtener metadata de videos (tags, descripciones, thumbnails)
- Reproducir videos en la aplicación

## 🎯 Funcionalidades

### Para Usuarios Admin:
1. ✅ Subir nuevos cantos al canal
2. ✅ Editar metadata de videos (título, descripción, tags)
3. ✅ Crear playlists por categoría litúrgica
4. ✅ Organizar videos en playlists
5. ✅ Ver estadísticas de videos

### Para Usuarios Coro:
1. ✅ Buscar cantos por tags litúrgicos
2. ✅ Reproducir cantos
3. ✅ Ver partituras asociadas
4. ✅ Agregar cantos al cantoral

### Para Pueblo Fiel:
1. ✅ Ver cantorales publicados
2. ✅ Reproducir cantos
3. ✅ Descargar/ver partituras

## 🔧 Configuración en Google Cloud Console

### 1. Habilitar YouTube Data API v3

```bash
1. Ir a https://console.cloud.google.com/
2. Seleccionar proyecto "Cantorales Católicos"
3. APIs & Services > Library
4. Buscar "YouTube Data API v3"
5. Hacer click en "Enable"
```

### 2. Scopes OAuth Necesarios

```typescript
const YOUTUBE_SCOPES = [
  // Leer datos del canal
  'https://www.googleapis.com/auth/youtube.readonly',
  
  // Subir videos
  'https://www.googleapis.com/auth/youtube.upload',
  
  // Gestionar canal completo
  'https://www.googleapis.com/auth/youtube.force-ssl',
  
  // Gestionar playlists
  'https://www.googleapis.com/auth/youtube',
];
```

### 3. Quota y Límites

```
- Quota diaria: 10,000 unidades
- Costo por operación:
  - Video upload: 1,600 unidades
  - Search: 100 unidades
  - Video list: 1 unidad
  - Playlist insert: 50 unidades

Estrategia: Cachear resultados y usar webhooks para actualizaciones
```

## 📦 Instalación de Dependencias

```bash
npm install @google/youtube
npm install googleapis
```

## 💻 Estructura de Datos

### 1. Song Interface (Extendido)

```typescript
export interface Song {
  // Datos básicos
  id: string;
  title: string;
  category: string;
  
  // YouTube data
  youtubeId: string;                    // ID del video
  thumbnailUrl?: string;                // URL del thumbnail
  duration: string;                     // Duración en formato "MM:SS"
  uploadedAt?: string;                  // Fecha de subida
  views?: number;                       // Visualizaciones
  
  // Metadata litúrgica
  artist?: string;
  author?: string;
  version?: 'Coro' | 'Guitarra' | 'Órgano';
  massName?: string;
  
  // Tags de YouTube
  tags?: string[];                      // Tags litúrgicos del video
  
  // Partituras
  sheetMusicUrl?: string;               // URL a partitura en Google Drive/Cloud Storage
  sheetMusicFileId?: string;            // ID del archivo de partitura
  
  // Playlists
  playlists?: string[];                 // IDs de playlists donde está incluido
}
```

### 2. YouTube Video Metadata

```typescript
interface YouTubeVideoMetadata {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    tags: string[];
    categoryId: string;
    publishedAt: string;
  };
  contentDetails: {
    duration: string;  // ISO 8601 format: PT3M45S
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}
```

## 🎬 Operaciones de YouTube API

### 1. Subir un Nuevo Canto (Admin)

```typescript
// services/youtube.ts

import { google } from 'googleapis';

export async function uploadSong(
  videoFile: File,
  metadata: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    privacyStatus: 'public' | 'unlisted' | 'private';
  },
  accessToken: string
): Promise<{ videoId: string; url: string }> {
  const youtube = google.youtube({
    version: 'v3',
    auth: new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  });

  // Establecer credentials
  youtube.context._options.auth.setCredentials({
    access_token: accessToken,
  });

  // Preparar metadata del video
  const videoMetadata = {
    snippet: {
      title: metadata.title,
      description: buildDescription(metadata),
      tags: buildTags(metadata),
      categoryId: '10', // Music category
    },
    status: {
      privacyStatus: metadata.privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };

  // Subir video
  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: videoMetadata,
    media: {
      body: videoFile.stream(),
    },
  });

  return {
    videoId: response.data.id!,
    url: `https://www.youtube.com/watch?v=${response.data.id}`,
  };
}

// Helper: Construir descripción estandarizada
function buildDescription(metadata: any): string {
  return `
${metadata.title}

Categoría Litúrgica: ${metadata.category}
${metadata.author ? `Autor: ${metadata.author}` : ''}
${metadata.version ? `Versión: ${metadata.version}` : ''}

📖 Partitura disponible en la descripción

---
Canal oficial de Cantorales Católicos
Cantos litúrgicos para la Santa Misa
  `.trim();
}

// Helper: Construir tags
function buildTags(metadata: any): string[] {
  const baseTags = [
    'canto católico',
    'música litúrgica',
    'misa católica',
    metadata.category.toLowerCase(),
  ];

  if (metadata.tags) {
    baseTags.push(...metadata.tags);
  }

  return baseTags;
}
```

### 2. Obtener Metadata de Video

```typescript
export async function getVideoMetadata(
  videoId: string,
  accessToken: string
): Promise<YouTubeVideoMetadata> {
  const youtube = google.youtube({
    version: 'v3',
    auth: new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  });

  youtube.context._options.auth.setCredentials({
    access_token: accessToken,
  });

  const response = await youtube.videos.list({
    part: ['snippet', 'contentDetails', 'statistics'],
    id: [videoId],
  });

  if (!response.data.items || response.data.items.length === 0) {
    throw new Error(`Video ${videoId} not found`);
  }

  return response.data.items[0] as YouTubeVideoMetadata;
}
```

### 3. Buscar Videos por Tags

```typescript
export async function searchSongsByTags(
  tags: string[],
  channelId: string,
  accessToken: string,
  maxResults: number = 50
): Promise<Song[]> {
  const youtube = google.youtube({
    version: 'v3',
    auth: new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  });

  youtube.context._options.auth.setCredentials({
    access_token: accessToken,
  });

  const response = await youtube.search.list({
    part: ['snippet'],
    channelId: channelId,
    q: tags.join(' '),
    type: ['video'],
    maxResults: maxResults,
    order: 'date', // Más recientes primero
  });

  const songs: Song[] = [];

  for (const item of response.data.items || []) {
    const videoId = item.id!.videoId!;
    const metadata = await getVideoMetadata(videoId, accessToken);
    
    songs.push({
      id: videoId,
      youtubeId: videoId,
      title: item.snippet!.title!,
      category: extractCategory(metadata.snippet.tags),
      duration: formatDuration(metadata.contentDetails.duration),
      thumbnailUrl: item.snippet!.thumbnails!.medium!.url,
      tags: metadata.snippet.tags,
      views: parseInt(metadata.statistics.viewCount),
      uploadedAt: item.snippet!.publishedAt!,
      artist: extractArtist(metadata.snippet.description),
      author: extractAuthor(metadata.snippet.description),
    });
  }

  return songs;
}

// Helper: Convertir duración ISO 8601 a MM:SS
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(\d+M)?(\d+S)?/);
  const minutes = parseInt(match?.[1]?.replace('M', '') || '0');
  const seconds = parseInt(match?.[2]?.replace('S', '') || '0');
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper: Extraer categoría de tags
function extractCategory(tags?: string[]): string {
  const categories = ['Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Ofertorio', 'Santo', 'Cordero de Dios', 'Comunión', 'Salida'];
  
  for (const tag of tags || []) {
    const normalized = tag.toLowerCase();
    const found = categories.find(cat => normalized.includes(cat.toLowerCase()));
    if (found) return found;
  }
  
  return 'Otros';
}
```

### 4. Crear Playlist por Categoría

```typescript
export async function createCategoryPlaylist(
  category: string,
  description: string,
  accessToken: string
): Promise<{ playlistId: string; url: string }> {
  const youtube = google.youtube({
    version: 'v3',
    auth: new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  });

  youtube.context._options.auth.setCredentials({
    access_token: accessToken,
  });

  const response = await youtube.playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: `Cantos de ${category}`,
        description: description,
        tags: [category, 'litúrgica', 'católica'],
      },
      status: {
        privacyStatus: 'public',
      },
    },
  });

  return {
    playlistId: response.data.id!,
    url: `https://www.youtube.com/playlist?list=${response.data.id}`,
  };
}
```

### 5. Agregar Video a Playlist

```typescript
export async function addVideoToPlaylist(
  videoId: string,
  playlistId: string,
  accessToken: string
): Promise<void> {
  const youtube = google.youtube({
    version: 'v3',
    auth: new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  });

  youtube.context._options.auth.setCredentials({
    access_token: accessToken,
  });

  await youtube.playlistItems.insert({
    part: ['snippet'],
    requestBody: {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId: videoId,
        },
      },
    },
  });
}
```

### 6. Actualizar Metadata de Video

```typescript
export async function updateVideoMetadata(
  videoId: string,
  updates: {
    title?: string;
    description?: string;
    tags?: string[];
  },
  accessToken: string
): Promise<void> {
  const youtube = google.youtube({
    version: 'v3',
    auth: new google.auth.OAuth2({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  });

  youtube.context._options.auth.setCredentials({
    access_token: accessToken,
  });

  // Primero obtener metadata actual
  const current = await getVideoMetadata(videoId, accessToken);

  // Actualizar solo los campos proporcionados
  await youtube.videos.update({
    part: ['snippet'],
    requestBody: {
      id: videoId,
      snippet: {
        ...current.snippet,
        title: updates.title || current.snippet.title,
        description: updates.description || current.snippet.description,
        tags: updates.tags || current.snippet.tags,
        categoryId: current.snippet.categoryId,
      },
    },
  });
}
```

## 🎵 Componentes de UI

### 1. Upload Song Component (Admin)

```typescript
// components/admin/UploadSong.tsx

export function UploadSong() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Entrada');
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!videoFile) return;

    setUploading(true);
    
    try {
      const result = await uploadSong(
        videoFile,
        {
          title,
          description: '',
          category,
          tags,
          privacyStatus: 'public',
        },
        authStorage.getTokens()!.accessToken
      );

      toast.success(`Video subido exitosamente: ${result.url}`);
      
      // Guardar en base de datos
      await saveSongToDatabase({
        youtubeId: result.videoId,
        title,
        category,
        tags,
      });
      
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Error al subir el video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6">Subir Nuevo Canto</h2>
      
      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2">
          Archivo de Video
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          className="w-full"
        />
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border-2"
        />
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2">Categoría</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border-2"
        >
          <option value="Entrada">Entrada</option>
          <option value="Kyrie">Kyrie</option>
          <option value="Gloria">Gloria</option>
          {/* Más categorías... */}
        </select>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2">Tags Litúrgicos</label>
        <TagInput
          tags={tags}
          onChange={setTags}
          suggestions={['Adviento', 'Navidad', 'Cuaresma', 'Pascua', 'Ordinario']}
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!videoFile || !title || uploading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
      >
        {uploading ? `Subiendo... ${progress}%` : 'Subir Video'}
      </button>

      {uploading && (
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

### 2. Video Player Component

```typescript
// components/SongPlayer.tsx (actualizar)

import YouTube from 'react-youtube';

export function SongPlayer({ song, onBack }: SongPlayerProps) {
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0, // No mostrar videos relacionados al final
    },
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 p-4">
          <button onClick={onBack} className="text-white">
            ← Volver
          </button>
        </div>

        {/* Video Player */}
        <div className="flex-1 relative">
          <YouTube
            videoId={song.youtubeId}
            opts={opts}
            className="absolute inset-0"
            iframeClassName="w-full h-full"
          />
        </div>

        {/* Song Info */}
        <div className="bg-white p-4">
          <h2 className="text-xl font-bold">{song.title}</h2>
          {song.artist && <p className="text-gray-600">{song.artist}</p>}
          <div className="flex gap-2 mt-2">
            {song.tags?.map(tag => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 📊 Gestión de Quota

### 1. Cachear Resultados

```typescript
// utils/cache.ts

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export const videoCache = {
  get(videoId: string): YouTubeVideoMetadata | null {
    const cached = localStorage.getItem(`video_${videoId}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(`video_${videoId}`);
      return null;
    }

    return data;
  },

  set(videoId: string, data: YouTubeVideoMetadata) {
    localStorage.setItem(`video_${videoId}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  },
};
```

### 2. Batch Requests

```typescript
// Obtener metadata de múltiples videos en una sola request
export async function getMultipleVideosMetadata(
  videoIds: string[],
  accessToken: string
): Promise<YouTubeVideoMetadata[]> {
  const youtube = google.youtube({ version: 'v3' });
  
  // Máximo 50 videos por request
  const batches = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50));
  }

  const results: YouTubeVideoMetadata[] = [];

  for (const batch of batches) {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: batch,
    });

    results.push(...(response.data.items as YouTubeVideoMetadata[]));
  }

  return results;
}
```

## 🔐 Permisos y Roles

```typescript
// Verificar permisos antes de operaciones sensibles
export function canUploadVideos(userRole: UserRole): boolean {
  return userRole === 'Admin';
}

export function canEditVideoMetadata(userRole: UserRole): boolean {
  return userRole === 'Admin';
}

export function canCreatePlaylists(userRole: UserRole): boolean {
  return userRole === 'Admin';
}
```

## 📚 Variables de Entorno

```bash
# .env
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxx
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXX
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

## 🧪 Testing

```typescript
// Mock para desarrollo
export const mockYouTubeService = {
  uploadSong: async () => ({ videoId: 'mock123', url: 'https://...' }),
  getVideoMetadata: async () => ({ /* mock data */ }),
  searchSongsByTags: async () => [/* mock songs */],
};
```

## 📚 Referencias

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [googleapis Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
- [YouTube API Quotas](https://developers.google.com/youtube/v3/getting-started#quota)

---

**Nota:** La implementación completa requiere backend en Supabase. Ver `/docs/BACKEND_SETUP.md`.

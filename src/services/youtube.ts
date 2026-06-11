/**
 * 🎬 YouTube Service - Stella Maris
 * 
 * Servicio para integración con YouTube Data API v3.
 * Funcionalidades:
 * - Extraer metadata de videos
 * - Generar thumbnails
 * - Validar video IDs
 * - Parsear URLs de YouTube
 * 
 * 📚 Para configurar YouTube API, ver: /docs/YOUTUBE_API_INTEGRATION.md
 */

import { YOUTUBE_CONFIG } from '../config/api';

// ==========================================
// 🔧 TIPOS
// ==========================================

export interface YouTubeVideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
    standard?: string;
    maxres?: string;
  };
  duration: string; // ISO 8601 format (PT3M45S)
  durationFormatted: string; // Formato MM:SS
  publishedAt: string;
  channelTitle: string;
  tags?: string[];
  viewCount?: number;
  likeCount?: number;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}

// ==========================================
// 🎯 UTILIDADES
// ==========================================

/**
 * Extraer video ID de una URL de YouTube
 */
export function extractVideoId(url: string): string | null {
  // Patrones de URL de YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // ID directo
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validar si un string es un video ID válido de YouTube
 */
export function isValidVideoId(videoId: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

/**
 * Obtener URL de thumbnail
 */
export function getThumbnailUrl(
  videoId: string, 
  quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'
): string {
  return YOUTUBE_CONFIG.urls.thumbnail(videoId, quality);
}

/**
 * Obtener URL de video
 */
export function getVideoUrl(videoId: string): string {
  return YOUTUBE_CONFIG.urls.watch(videoId);
}

/**
 * Obtener URL de embed
 */
export function getEmbedUrl(videoId: string, params?: Record<string, any>): string {
  const baseUrl = YOUTUBE_CONFIG.urls.embed(videoId);
  
  if (!params) return baseUrl;
  
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
    
  return `${baseUrl}?${queryString}`;
}

/**
 * Convertir duración ISO 8601 a formato MM:SS
 */
export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parsear duración formateada a segundos
 */
export function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number);
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
}

// ==========================================
// 💾 CACHE
// ==========================================

/**
 * Cache de videos en localStorage
 */
const videoCache = {
  get(videoId: string): YouTubeVideoMetadata | null {
    if (!YOUTUBE_CONFIG.cache.enabled) return null;
    
    const key = YOUTUBE_CONFIG.cache.key(videoId);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    try {
      const { data, timestamp } = JSON.parse(cached);
      
      // Verificar si el cache expiró
      if (Date.now() - timestamp > YOUTUBE_CONFIG.cache.duration) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error leyendo cache:', error);
      return null;
    }
  },
  
  set(videoId: string, data: YouTubeVideoMetadata) {
    if (!YOUTUBE_CONFIG.cache.enabled) return;
    
    const key = YOUTUBE_CONFIG.cache.key(videoId);
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  },
  
  clear(videoId?: string) {
    if (videoId) {
      localStorage.removeItem(YOUTUBE_CONFIG.cache.key(videoId));
    } else {
      // Limpiar todo el cache de videos
      Object.keys(localStorage)
        .filter(key => key.startsWith('youtube_video_'))
        .forEach(key => localStorage.removeItem(key));
    }
  },
};

// ==========================================
// 📡 API CALLS
// ==========================================

/**
 * Obtener metadata de un video
 * 
 * NOTA: Esta función requiere YouTube Data API key.
 * En modo mock, retorna datos simulados.
 */
function hasRealYouTubeApiKey(): boolean {
  return Boolean(
    YOUTUBE_CONFIG.apiKey &&
    !YOUTUBE_CONFIG.apiKey.includes('XXXXXXXXXXXXXXXX') &&
    !YOUTUBE_CONFIG.apiKey.includes('xxxxx')
  );
}

function hasValidYouTubeChannelId(): boolean {
  return Boolean(
    YOUTUBE_CONFIG.channelId &&
    !YOUTUBE_CONFIG.channelId.includes('UCxxxxxxxx') &&
    !YOUTUBE_CONFIG.channelId.includes('xxxxx')
  );
}

export async function getVideoMetadata(videoId: string): Promise<YouTubeVideoMetadata | null> {
  if (!isValidVideoId(videoId)) {
    console.error('❌ Video ID inválido:', videoId);
    return null;
  }

  const cached = videoCache.get(videoId);
  if (cached) {
    return cached;
  }

  const useRealApi = hasRealYouTubeApiKey();
  if (!useRealApi) {
    const mockMetadata: YouTubeVideoMetadata = {
      id: videoId,
      title: 'Canto Litúrgico',
      description: 'Canto para la Santa Misa',
      thumbnails: {
        default: getThumbnailUrl(videoId, 'default'),
        medium: getThumbnailUrl(videoId, 'medium'),
        high: getThumbnailUrl(videoId, 'high'),
        standard: getThumbnailUrl(videoId, 'standard'),
        maxres: getThumbnailUrl(videoId, 'maxres'),
      },
      duration: 'PT3M45S',
      durationFormatted: '3:45',
      publishedAt: new Date().toISOString(),
      channelTitle: 'Cantorales Católicos',
      tags: ['canto católico', 'música litúrgica'],
      viewCount: 1000,
      likeCount: 50,
    };

    videoCache.set(videoId, mockMetadata);
    return mockMetadata;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(YOUTUBE_CONFIG.apiKey)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.items || data.items.length === 0) {
      console.error('❌ Video no encontrado:', videoId, data);
      return null;
    }

    const video = data.items[0];
    const metadata: YouTubeVideoMetadata = {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnails: {
        default: video.snippet.thumbnails.default?.url,
        medium: video.snippet.thumbnails.medium?.url,
        high: video.snippet.thumbnails.high?.url,
        standard: video.snippet.thumbnails.standard?.url,
        maxres: video.snippet.thumbnails.maxres?.url,
      },
      duration: video.contentDetails.duration,
      durationFormatted: formatDuration(video.contentDetails.duration),
      publishedAt: video.snippet.publishedAt,
      channelTitle: video.snippet.channelTitle,
      tags: video.snippet.tags,
      viewCount: Number(video.statistics?.viewCount || 0),
      likeCount: Number(video.statistics?.likeCount || 0),
    };

    videoCache.set(videoId, metadata);
    return metadata;
  } catch (error) {
    console.error('❌ Error obteniendo metadata:', error);
    return null;
  }
}

/**
 * Buscar videos en el canal
 * 
 * NOTA: Requiere YouTube Data API key y Channel ID
 */
export async function searchVideos(query: string, maxResults: number = 20): Promise<YouTubeSearchResult[]> {
  const useRealApi = hasRealYouTubeApiKey() && hasValidYouTubeChannelId();
  if (!useRealApi) return [];

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(YOUTUBE_CONFIG.channelId)}&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=date&key=${encodeURIComponent(YOUTUBE_CONFIG.apiKey)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error buscando videos:', data);
      return [];
    }

    return data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error('❌ Error buscando videos:', error);
    return [];
  }
}

/**
 * Obtener videos de una playlist
 */
export async function getPlaylistVideos(_playlistId: string, _maxResults: number = 50): Promise<YouTubeSearchResult[]> {
  return [];
  
  // TODO: Implementar con YouTube API real
  /*
  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?` +
      `part=snippet&` +
      `playlistId=${playlistId}&` +
      `maxResults=${maxResults}&` +
      `key=${YOUTUBE_CONFIG.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.items.map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error('❌ Error obteniendo playlist:', error);
    return [];
  }
  */
}

// ==========================================
// 🎨 COMPONENTES DE EMBED
// ==========================================

/**
 * Generar código de embed para un video
 */
export function generateEmbedCode(
  videoId: string, 
  options?: {
    width?: number;
    height?: number;
    autoplay?: boolean;
    controls?: boolean;
  }
): string {
  const width = options?.width || 560;
  const height = options?.height || 315;
  const autoplay = options?.autoplay ? 1 : 0;
  const controls = options?.controls !== false ? 1 : 0;
  
  const embedUrl = getEmbedUrl(videoId, {
    autoplay,
    controls,
    rel: 0,
    modestbranding: 1,
  });
  
  return `<iframe width="${width}" height="${height}" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

// ==========================================
// 📤 UPLOADS (Requiere Google OAuth)
// ==========================================

export interface VideoUploadOptions {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
  notifySubscribers?: boolean;
}

/**
 * Subir video a YouTube channel
 * 
 * Requiere:
 * - Google OAuth token con alcance youtube.upload
 * - User tiene un canal de YouTube
 */
export async function uploadVideo(
  file: File, 
  options: VideoUploadOptions,
  accessToken: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; videoId?: string; error?: string }> {
  try {
    if (!file.type.startsWith('video/')) {
      throw new Error('El archivo debe ser un video');
    }

    const formData = new FormData();
    
    // Metadata del video
    const metadata = {
      snippet: {
        title: options.title,
        description: options.description,
        tags: options.tags || [],
        categoryId: options.categoryId || '24', // 24 = Entertainment
      },
      status: {
        privacyStatus: options.privacyStatus || 'private',
        notifySubscribers: options.notifySubscribers !== false,
      },
    };

    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('video', file);

    const url = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status';

    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    return new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            videoId: response.id,
          });
        } else {
          reject(new Error(`Error en upload: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Error en la conexión'));
      });

      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.send(formData);
    });
  } catch (error: any) {
    console.error('❌ Error subiendo video:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtener información del canal del usuario
 */
export async function getChannelInfo(accessToken: string): Promise<any> {
  try {
    const url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true';

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0];
    }

    return null;
  } catch (error: any) {
    console.error('❌ Error obteniendo información del canal:', error);
    return null;
  }
}

/**
 * Crear una playlist
 */
export async function createPlaylist(
  title: string,
  description: string,
  accessToken: string
): Promise<{ success: boolean; playlistId?: string; error?: string }> {
  try {
    const url = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status';

    const metadata = {
      snippet: {
        title: title,
        description: description,
      },
      status: {
        privacyStatus: 'public',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      playlistId: data.id,
    };
  } catch (error: any) {
    console.error('❌ Error creando playlist:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Agregar video a una playlist
 */
export async function addVideoToPlaylist(
  videoId: string,
  playlistId: string,
  accessToken: string
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet';

    const metadata = {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId: videoId,
        },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      itemId: data.id,
    };
  } catch (error: any) {
    console.error('❌ Error agregando video a playlist:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
// 🚀 EXPORT
// ==========================================

export default {
  // Utilidades
  extractVideoId,
  isValidVideoId,
  getThumbnailUrl,
  getVideoUrl,
  getEmbedUrl,
  formatDuration,
  parseDurationToSeconds,
  
  // API
  getVideoMetadata,
  searchVideos,
  getPlaylistVideos,
  
  // Cache
  cache: videoCache,
  
  // Embed
  generateEmbedCode,
};

/**
 * 🔧 API Configuration - Stella Maris
 * 
 * Configuración centralizada para todas las integraciones de API.
 * Este archivo contiene las configuraciones necesarias para:
 * - Supabase Backend
 * - YouTube Data API v3
 * - Google Drive API
 * - Google OAuth
 */

// ==========================================
// 🌐 SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL = typeof import.meta !== 'undefined'
  ? import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL
  : undefined;

const SUPABASE_ANON_KEY = typeof import.meta !== 'undefined'
  ? import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : undefined;

// Fallback placeholders — intencionalmente inválidos para que sean
// fácilmente identificables y NUNCA se confundan con una llave real.
// Si la aplicación intenta usar estos valores, Supabase devolverá 401
// inmediatamente y el error apuntará claramente a env vars faltantes.
const SUPABASE_URL_PLACEHOLDER = 'MISSING_VITE_SUPABASE_URL';
const SUPABASE_KEY_PLACEHOLDER = 'MISSING_VITE_SUPABASE_ANON_KEY';

if (typeof window !== 'undefined' && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.error(
    '[Stella Maris] Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'Configurarlas en Vercel → Project Settings → Environment Variables.'
  );
}

export const SUPABASE_CONFIG = {
  // URL del proyecto Supabase
  url: SUPABASE_URL || SUPABASE_URL_PLACEHOLDER,

  // Anon key pública (segura para el frontend)
  anonKey: SUPABASE_ANON_KEY || SUPABASE_KEY_PLACEHOLDER,
  
  // Configuración de autenticación
  auth: {
    // URL de redirección después del login
    redirectTo: typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : 'http://localhost:5173/auth/callback',
    
    // Detectar sesión automáticamente
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  
  // Configuración de storage
  storage: {
    // Bucket para partituras
    sheetMusicBucket: 'sheet-music',
    
    // Bucket para imágenes/thumbnails
    imagesBucket: 'images',
    
    // Configuración de uploads
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: {
      sheetMusic: ['application/pdf', 'image/png', 'image/jpeg'],
      images: ['image/png', 'image/jpeg', 'image/webp'],
    },
  },
} as const;

// ==========================================
// 🎬 YOUTUBE API CONFIGURATION
// ==========================================

// Lista de canales de cantos a sincronizar. Acepta varios IDs:
//  - una lista separada por comas en VITE_YOUTUBE_CHANNEL_ID, y/o
//  - un segundo canal en VITE_YOUTUBE_CHANNEL_ID_2.
// La app lee/sincroniza TODOS los canales de la lista.
const YT_CHANNEL_IDS: string[] = (() => {
  const env = typeof import.meta !== 'undefined' ? (import.meta.env ?? {}) : ({} as Record<string, string>);
  const raw = [env.VITE_YOUTUBE_CHANNEL_ID, env.VITE_YOUTUBE_CHANNEL_ID_2]
    .filter(Boolean)
    .join(',');
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !s.includes('xxxxx'));
})();

export const YOUTUBE_CONFIG = {
  // La API key NO vive en el cliente: las lecturas pasan por el proxy serverless
  // /api/youtube (la clave está solo en el servidor). Se deja vacío a propósito
  // para que no se inyecte ninguna clave en el bundle.
  apiKey: '',

  // Todos los canales a sincronizar.
  channelIds: YT_CHANNEL_IDS,
  // Canal principal (compat: link público y búsqueda forzada server-side).
  channelId: YT_CHANNEL_IDS[0] ?? 'UCxxxxxxxxxxxxx',

  // YouTube se accede con API key de la cuenta de la app, no con OAuth del usuario
  scopes: [],
  
  // Quota limits (unidades por día)
  quota: {
    daily: 10000,
    operations: {
      upload: 1600,
      search: 100,
      list: 1,
      insert: 50,
    },
  },
  
  // Configuración de player
  player: {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0, // No mostrar videos relacionados
      fs: 1,  // Permitir fullscreen
      cc_load_policy: 0, // No cargar subtítulos por defecto
      iv_load_policy: 3, // No mostrar anotaciones
    },
  },
  
  // URLs base
  urls: {
    watch: (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`,
    embed: (videoId: string) => `https://www.youtube.com/embed/${videoId}`,
    thumbnail: (videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high') =>
      `https://img.youtube.com/vi/${videoId}/${quality === 'high' ? 'hqdefault' : quality === 'medium' ? 'mqdefault' : quality === 'maxres' ? 'maxresdefault' : 'default'}.jpg`,
    playlist: (playlistId: string) => `https://www.youtube.com/playlist?list=${playlistId}`,
  },
  
  // Cache settings
  cache: {
    enabled: true,
    duration: 24 * 60 * 60 * 1000, // 24 horas
    key: (videoId: string) => `youtube_video_${videoId}`,
  },
} as const;

// ==========================================
// 📁 GOOGLE DRIVE API CONFIGURATION
// ==========================================

export const GOOGLE_DRIVE_CONFIG = {
  // OJO: `/api/pdf` y `/api/sheets` ya no son archivos: los dos los atiende
  // `api/drive.ts`, que vercel.json reescribe. Se conservan las rutas porque la
  // caché sin conexión guarda URLs `/api/pdf?id=...` y cambiarlas la invalidaría
  // para todo el mundo. Ver el comentario de cabecera de api/drive.ts.
  // La API key de Drive vive SOLO en el servidor (/api/sheets, /api/pdf).
  // No se inyecta al bundle. Las lecturas del cliente pasan por esos endpoints.
  apiKey: '',

  // Client ID para OAuth (público por diseño)
  clientId: typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_GOOGLE_CLIENT_ID || import.meta.env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    : 'xxxxx.apps.googleusercontent.com',
  
  // Drive se accede con la cuenta de la app (stellamarismusicacatolica@gmail.com), no con OAuth del usuario
  scopes: [],
  
  // Folder IDs
  folders: {
    // Carpeta raíz de partituras
    sheetMusic: typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER 
      ? import.meta.env.VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER 
      : '1xxxxxxxxxxxxxx',
    
    // Carpeta de videos/audios
    media: typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_DRIVE_MEDIA_FOLDER 
      ? import.meta.env.VITE_GOOGLE_DRIVE_MEDIA_FOLDER 
      : '1xxxxxxxxxxxxxx',
  },
  
  // Mime types
  mimeTypes: {
    pdf: 'application/pdf',
    folder: 'application/vnd.google-apps.folder',
    image: 'image/jpeg',
  },
  
  // URLs
  urls: {
    // URL pública de archivo
    publicFile: (fileId: string) => `https://drive.google.com/file/d/${fileId}/view`,
    
    // URL de descarga directa
    download: (fileId: string) => `https://drive.google.com/uc?export=download&id=${fileId}`,
    
    // URL de preview (para PDFs)
    preview: (fileId: string) => `https://drive.google.com/file/d/${fileId}/preview`,
    
    // URL de thumbnail
    thumbnail: (fileId: string, size: number = 400) => 
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`,
  },
  
  // Configuración de uploads
  upload: {
    chunkSize: 256 * 1024, // 256KB chunks
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'video/mp4', 'audio/mpeg'],
  },
} as const;

// ==========================================
// 🔐 GOOGLE OAUTH CONFIGURATION
// ==========================================

export const GOOGLE_OAUTH_CONFIG = {
  // Client ID (mismo que Drive y YouTube)
  clientId: typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_GOOGLE_CLIENT_ID || import.meta.env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    : 'xxxxx.apps.googleusercontent.com',
  
  // Redirect URIs
  redirectUri: typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback`
    : 'http://localhost:5173/auth/callback',
  
  // Solo scopes de identidad — Drive y YouTube usan la cuenta de la app (stellamarismusicacatolica@gmail.com)
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
  ],
  
  // Discovery document
  discoveryDocs: [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest',
  ],
} as const;

// ==========================================
// 📊 API ENDPOINTS (Supabase REST)
// ==========================================

export const API_ENDPOINTS = {
  // Base URL
  base: SUPABASE_CONFIG.url,
  
  // Auth endpoints
  auth: {
    signIn: '/auth/v1/token?grant_type=password',
    signUp: '/auth/v1/signup',
    signOut: '/auth/v1/logout',
    user: '/auth/v1/user',
    refreshToken: '/auth/v1/token?grant_type=refresh_token',
  },
  
  // REST endpoints (auto-generados por PostgREST)
  rest: {
    // Usuarios
    profiles: '/rest/v1/user_profiles',
    
    // Cantos
    songs: '/rest/v1/songs',
    
    // Cantorales
    cantorals: '/rest/v1/published_cantorals',
    cantoralSongs: '/rest/v1/cantoral_songs',
    
    // Parroquias
    parishes: '/rest/v1/parishes',
    chapels: '/rest/v1/chapels',
    dioceses: '/rest/v1/dioceses',
    
    // Storage
    storage: '/storage/v1/object',
  },
  
  // RPC functions (funciones personalizadas de Postgres)
  rpc: {
    // Funciones de búsqueda
    searchSongs: '/rest/v1/rpc/search_songs',
    searchCantorals: '/rest/v1/rpc/search_cantorals',
    
    // Funciones de estadísticas
    getStats: '/rest/v1/rpc/get_stats',
    getUserStats: '/rest/v1/rpc/get_user_stats',
    
    // Funciones de permisos
    canEditCantoral: '/rest/v1/rpc/can_edit_cantoral',
    canDeleteSong: '/rest/v1/rpc/can_delete_song',
  },
} as const;

// ==========================================
// 🔧 UTILITY FUNCTIONS
// ==========================================

/**
 * Construir URL completa con query params
 */
export function buildApiUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(endpoint, SUPABASE_CONFIG.url);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

/**
 * Headers comunes para requests
 */
export function getCommonHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_CONFIG.anonKey,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Validar configuración de API
 */
export function validateApiConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar Supabase
  if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url.includes('[tu-proyecto]')) {
    errors.push('❌ VITE_SUPABASE_URL no configurada');
  }
  
  if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey.length < 50) {
    errors.push('❌ VITE_SUPABASE_ANON_KEY no configurada');
  }
  
  // La API key de YouTube/Drive vive en el servidor (proxy /api/youtube y
  // /api/sheets). No se valida en el cliente porque ya no se expone aquí.

  if (!YOUTUBE_CONFIG.channelId || YOUTUBE_CONFIG.channelId.includes('xxxxx')) {
    errors.push('⚠️ VITE_YOUTUBE_CHANNEL_ID no configurada (opcional)');
  }
  
  // Validar Google OAuth
  if (!GOOGLE_OAUTH_CONFIG.clientId || GOOGLE_OAUTH_CONFIG.clientId.includes('xxxxx')) {
    errors.push('⚠️ VITE_GOOGLE_CLIENT_ID no configurada (opcional)');
  }
  
  return {
    valid: errors.filter(e => e.startsWith('❌')).length === 0,
    errors,
  };
}

/**
 * Log de configuración (solo desarrollo)
 */
export function logApiConfig(): void {
  // Verificar si estamos en modo desarrollo
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
  
  if (isDev) {
    const validation = validateApiConfig();
    
    console.group('🔧 API Configuration');
    console.log('Supabase URL:', SUPABASE_CONFIG.url);
    console.log('YouTube Channel:', YOUTUBE_CONFIG.channelId);
    console.log('Google Drive Folder:', GOOGLE_DRIVE_CONFIG.folders.sheetMusic);
    
    if (validation.errors.length > 0) {
      console.group('⚠️ Configuración Pendiente:');
      validation.errors.forEach(error => console.log(error));
      console.groupEnd();
    } else {
      console.log('✅ Todas las configuraciones están correctas');
    }
    
    console.groupEnd();
  }
}

// ==========================================
// 📝 ENVIRONMENT VARIABLES TEMPLATE
// ==========================================

/**
 * Template para archivo .env
 * Copiar este contenido a .env.local y completar con valores reales
 */
export const ENV_TEMPLATE = `
# ==========================================
# 🌐 SUPABASE
# ==========================================
VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==========================================
# 🎬 YOUTUBE DATA API v3
# ==========================================
VITE_YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXX
VITE_YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxx

# ==========================================
# 📁 GOOGLE DRIVE API
# ==========================================
VITE_GOOGLE_DRIVE_API_KEY=AIzaSyXXXXXXXXXXXXXXXX
VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER=1xxxxxxxxxxxxxx
VITE_GOOGLE_DRIVE_MEDIA_FOLDER=1xxxxxxxxxxxxxx

# ==========================================
# 🔐 GOOGLE OAUTH 2.0
# ==========================================
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com

# ==========================================
# 🔧 OPTIONAL
# ==========================================
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
`;

// ==========================================
// 🚀 EXPORT ALL
// ==========================================

export default {
  supabase: SUPABASE_CONFIG,
  youtube: YOUTUBE_CONFIG,
  drive: GOOGLE_DRIVE_CONFIG,
  oauth: GOOGLE_OAUTH_CONFIG,
  endpoints: API_ENDPOINTS,
  utils: {
    buildApiUrl,
    getCommonHeaders,
    validateApiConfig,
    logApiConfig,
  },
};
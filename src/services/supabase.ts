/**
 * 🗄️ Supabase Service - Stella Maris
 * 
 * Servicio centralizado para todas las operaciones con Supabase.
 * Este archivo está listo para conectar con el backend real.
 * 
 * 📚 Para configurar Supabase, ver: /docs/BACKEND_SETUP.md
 */

import { SUPABASE_CONFIG, getCommonHeaders } from '../config/api';
import type { Song, PublishedCantoral, UserProfile } from '../types';

// ==========================================
// 🔧 CONFIGURACIÓN
// ==========================================

/**
 * Estado de la conexión con Supabase
 */
let isConnected = false;
let supabaseClient: any = null;

/**
 * Inicializar cliente de Supabase
 * TODO: Descomentar cuando se instale @supabase/supabase-js
 */
export async function initializeSupabase() {
  try {
    // import { createClient } from '@supabase/supabase-js';
    
    // supabaseClient = createClient(
    //   SUPABASE_CONFIG.url,
    //   SUPABASE_CONFIG.anonKey,
    //   {
    //     auth: SUPABASE_CONFIG.auth
    //   }
    // );
    
    // isConnected = true;
    console.log('✅ Supabase inicializado (modo mock)');
    return { success: true };
  } catch (error) {
    console.error('❌ Error inicializando Supabase:', error);
    return { success: false, error };
  }
}

/**
 * Verificar si Supabase está conectado
 */
export function isSupabaseConnected(): boolean {
  return isConnected;
}

// ==========================================
// 🔐 AUTENTICACIÓN
// ==========================================

/**
 * Login con Google OAuth
 */
export async function signInWithGoogle() {
  if (!supabaseClient) {
    console.log('🔄 Mock: Login con Google');
    return { data: { user: null, session: null }, error: null };
  }
  
  // const { data, error } = await supabaseClient.auth.signInWithOAuth({
  //   provider: 'google',
  //   options: {
  //     redirectTo: SUPABASE_CONFIG.auth.redirectTo,
  //   },
  // });
  
  // return { data, error };
}

/**
 * Obtener sesión actual
 */
export async function getSession() {
  if (!supabaseClient) {
    console.log('🔄 Mock: Obtener sesión');
    return { data: { session: null }, error: null };
  }
  
  // const { data, error } = await supabaseClient.auth.getSession();
  // return { data, error };
}

/**
 * Logout
 */
export async function signOut() {
  if (!supabaseClient) {
    console.log('🔄 Mock: Logout');
    return { error: null };
  }
  
  // const { error } = await supabaseClient.auth.signOut();
  // return { error };
}

// ==========================================
// 👤 PERFILES DE USUARIO
// ==========================================

/**
 * Crear perfil de usuario
 */
export async function createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Crear perfil', profile);
    return { 
      data: { ...profile, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      error: null 
    };
  }
  
  // const { data, error } = await supabaseClient
  //   .from('user_profiles')
  //   .insert({
  //     id: profile.id,
  //     email: profile.email,
  //     name: profile.name,
  //     role: profile.role,
  //     instrument: profile.instrument,
  //     parish_name: profile.parishName,
  //   })
  //   .select()
  //   .single();
  
  // return { data, error };
}

/**
 * Obtener perfil por ID
 */
export async function getUserProfile(userId: string) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Obtener perfil', userId);
    return { data: null, error: null };
  }
  
  // const { data, error } = await supabaseClient
  //   .from('user_profiles')
  //   .select('*')
  //   .eq('id', userId)
  //   .single();
  
  // return { data, error };
}

/**
 * Actualizar perfil
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Actualizar perfil', userId, updates);
    return { data: updates, error: null };
  }
  
  // const { data, error } = await supabaseClient
  //   .from('user_profiles')
  //   .update({
  //     name: updates.name,
  //     instrument: updates.instrument,
  //     parish_name: updates.parishName,
  //   })
  //   .eq('id', userId)
  //   .select()
  //   .single();
  
  // return { data, error };
}

// ==========================================
// 🎵 CANTOS
// ==========================================

/**
 * Listar cantos con filtros
 */
export async function searchSongs(filters?: {
  category?: string;
  version?: string;
  massName?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Buscar cantos', filters);
    return { data: [], error: null };
  }
  
  // let query = supabaseClient
  //   .from('songs')
  //   .select('*')
  //   .order('title', { ascending: true });
  
  // if (filters?.category) {
  //   query = query.eq('category', filters.category);
  // }
  
  // if (filters?.version) {
  //   query = query.eq('version', filters.version);
  // }
  
  // if (filters?.massName) {
  //   query = query.eq('mass_name', filters.massName);
  // }
  
  // if (filters?.searchTerm) {
  //   query = query.or(`
  //     title.ilike.%${filters.searchTerm}%,
  //     author.ilike.%${filters.searchTerm}%,
  //     artist.ilike.%${filters.searchTerm}%
  //   `);
  // }
  
  // if (filters?.limit) {
  //   query = query.limit(filters.limit);
  // }
  
  // if (filters?.offset) {
  //   query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  // }
  
  // const { data, error } = await query;
  // return { data, error };
}

/**
 * Obtener canto por ID
 */
export async function getSongById(songId: string) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Obtener canto', songId);
    return { data: null, error: null };
  }
  
  // const { data, error } = await supabaseClient
  //   .from('songs')
  //   .select('*')
  //   .eq('id', songId)
  //   .single();
  
  // return { data, error };
}

/**
 * Crear canto (Solo Admin)
 */
export async function createSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Crear canto', song);
    return { 
      data: { ...song, id: `song-${Date.now()}`, createdAt: new Date().toISOString() },
      error: null 
    };
  }
  
  // const { data: { user } } = await supabaseClient.auth.getUser();
  
  // const { data, error } = await supabaseClient
  //   .from('songs')
  //   .insert({
  //     title: song.title,
  //     category: song.category,
  //     youtube_id: song.youtubeId,
  //     sheet_music_url: song.sheetMusicUrl,
  //     duration: song.duration,
  //     artist: song.artist,
  //     author: song.author,
  //     version: song.version,
  //     mass_name: song.massName,
  //     created_by: user?.id,
  //   })
  //   .select()
  //   .single();
  
  // return { data, error };
}

/**
 * Actualizar canto (Solo Admin)
 */
export async function updateSong(songId: string, updates: Partial<Song>) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Actualizar canto', songId, updates);
    return { data: updates, error: null };
  }
  
  // const { data, error } = await supabaseClient
  //   .from('songs')
  //   .update({
  //     title: updates.title,
  //     category: updates.category,
  //     youtube_id: updates.youtubeId,
  //     duration: updates.duration,
  //     author: updates.author,
  //     version: updates.version,
  //   })
  //   .eq('id', songId)
  //   .select()
  //   .single();
  
  // return { data, error };
}

/**
 * Eliminar canto (Solo Admin)
 */
export async function deleteSong(songId: string) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Eliminar canto', songId);
    return { error: null };
  }
  
  // const { error } = await supabaseClient
  //   .from('songs')
  //   .delete()
  //   .eq('id', songId);
  
  // return { error };
}

// ==========================================
// 📖 CANTORALES
// ==========================================

/**
 * Listar cantorales publicados
 */
export async function getPublishedCantorals(filters?: {
  parishName?: string;
  date?: string;
  choirId?: string;
}) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Obtener cantorales', filters);
    return { data: [], error: null };
  }
  
  // let query = supabaseClient
  //   .from('published_cantorals')
  //   .select('*')
  //   .order('date', { ascending: false });
  
  // if (filters?.parishName) {
  //   query = query.eq('parish_name', filters.parishName);
  // }
  
  // if (filters?.date) {
  //   query = query.eq('date', filters.date);
  // }
  
  // if (filters?.choirId) {
  //   query = query.eq('choir_id', filters.choirId);
  // }
  
  // const { data, error } = await query;
  // return { data, error };
}

/**
 * Obtener cantoral con cantos
 */
export async function getCantoralWithSongs(cantoralId: string) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Obtener cantoral con cantos', cantoralId);
    return { data: null, error: null };
  }
  
  // const { data, error } = await supabaseClient
  //   .from('published_cantorals')
  //   .select(`
  //     *,
  //     cantoral_songs (
  //       position,
  //       song:songs (*)
  //     )
  //   `)
  //   .eq('id', cantoralId)
  //   .single();
  
  // if (error) return { data: null, error };
  
  // // Transformar y ordenar
  // const cantoral = {
  //   ...data,
  //   songs: data.cantoral_songs
  //     .sort((a, b) => a.position - b.position)
  //     .map(cs => cs.song),
  // };
  
  // delete cantoral.cantoral_songs;
  
  // return { data: cantoral, error: null };
}

/**
 * Publicar cantoral (Solo Coro)
 */
export async function publishCantoral(cantoral: {
  parishName: string;
  date: string;
  liturgicalDate: string;
  massTime: string;
  songs: Song[];
}) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Publicar cantoral', cantoral);
    return { 
      data: { 
        id: `cantoral-${Date.now()}`,
        ...cantoral,
        publishedAt: new Date().toISOString() 
      },
      error: null 
    };
  }
  
  // const { data: { user } } = await supabaseClient.auth.getUser();
  // if (!user) throw new Error('No autenticado');
  
  // // 1. Obtener perfil del usuario
  // const { data: profile } = await supabaseClient
  //   .from('user_profiles')
  //   .select('*')
  //   .eq('id', user.id)
  //   .single();
  
  // if (!profile || profile.role !== 'Coro') {
  //   throw new Error('Solo los coros pueden publicar cantorales');
  // }
  
  // // 2. Crear cantoral
  // const { data: newCantoral, error: cantoralError } = await supabaseClient
  //   .from('published_cantorals')
  //   .insert({
  //     choir_id: user.id,
  //     choir_name: profile.name,
  //     parish_name: cantoral.parishName,
  //     date: cantoral.date,
  //     liturgical_date: cantoral.liturgicalDate,
  //     mass_time: cantoral.massTime,
  //     published_by: user.id,
  //   })
  //   .select()
  //   .single();
  
  // if (cantoralError) throw cantoralError;
  
  // // 3. Agregar cantos al cantoral
  // const cantoralSongs = cantoral.songs.map((song, index) => ({
  //   cantoral_id: newCantoral.id,
  //   song_id: song.id,
  //   position: index,
  // }));
  
  // const { error: songsError } = await supabaseClient
  //   .from('cantoral_songs')
  //   .insert(cantoralSongs);
  
  // if (songsError) throw songsError;
  
  // return {
  //   data: {
  //     ...newCantoral,
  //     songs: cantoral.songs,
  //   },
  //   error: null,
  // };
}

/**
 * Eliminar cantoral (Solo dueño)
 */
export async function deleteCantoral(cantoralId: string) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Eliminar cantoral', cantoralId);
    return { error: null };
  }
  
  // const { error } = await supabaseClient
  //   .from('published_cantorals')
  //   .delete()
  //   .eq('id', cantoralId);
  
  // return { error };
}

// ==========================================
// 📁 STORAGE
// ==========================================

/**
 * Subir partitura (Solo Admin)
 */
export async function uploadSheetMusic(file: File, songId: string) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Subir partitura', file.name, songId);
    return { 
      url: `https://mock-storage.supabase.co/sheet-music/${songId}.pdf`,
      error: null 
    };
  }
  
  // const fileExt = file.name.split('.').pop();
  // const fileName = `${songId}.${fileExt}`;
  // const filePath = `partituras/${fileName}`;
  
  // const { error: uploadError } = await supabaseClient.storage
  //   .from(SUPABASE_CONFIG.storage.sheetMusicBucket)
  //   .upload(filePath, file, {
  //     cacheControl: '3600',
  //     upsert: true,
  //   });
  
  // if (uploadError) throw uploadError;
  
  // // Obtener URL pública
  // const { data } = supabaseClient.storage
  //   .from(SUPABASE_CONFIG.storage.sheetMusicBucket)
  //   .getPublicUrl(filePath);
  
  // return { url: data.publicUrl, error: null };
}

/**
 * Obtener URL de partitura
 */
export function getSheetMusicUrl(songId: string): string {
  if (!supabaseClient) {
    return `https://mock-storage.supabase.co/sheet-music/${songId}.pdf`;
  }
  
  // const { data } = supabaseClient.storage
  //   .from(SUPABASE_CONFIG.storage.sheetMusicBucket)
  //   .getPublicUrl(`partituras/${songId}.pdf`);
  
  // return data.publicUrl;
}

/**
 * Eliminar partitura (Solo Admin)
 */
export async function deleteSheetMusic(songId: string) {
  if (!supabaseClient) {
    console.log('🔄 Mock: Eliminar partitura', songId);
    return { error: null };
  }
  
  // const { error } = await supabaseClient.storage
  //   .from(SUPABASE_CONFIG.storage.sheetMusicBucket)
  //   .remove([`partituras/${songId}.pdf`]);
  
  // return { error };
}

// ==========================================
// 🚀 EXPORT
// ==========================================

export default {
  // Setup
  initialize: initializeSupabase,
  isConnected: isSupabaseConnected,
  
  // Auth
  auth: {
    signInWithGoogle,
    getSession,
    signOut,
  },
  
  // Users
  users: {
    create: createUserProfile,
    get: getUserProfile,
    update: updateUserProfile,
  },
  
  // Songs
  songs: {
    search: searchSongs,
    getById: getSongById,
    create: createSong,
    update: updateSong,
    delete: deleteSong,
  },
  
  // Cantorals
  cantorals: {
    list: getPublishedCantorals,
    getWithSongs: getCantoralWithSongs,
    publish: publishCantoral,
    delete: deleteCantoral,
  },
  
  // Storage
  storage: {
    uploadSheet: uploadSheetMusic,
    getSheetUrl: getSheetMusicUrl,
    deleteSheet: deleteSheetMusic,
  },
};

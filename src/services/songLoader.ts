/**
 * @legacy — Ya no es la fuente principal del catálogo de cantos.
 * El catálogo ahora vive en Supabase (tabla `songs`).
 * Este archivo se mantiene como herramienta de importación:
 *   - loadSongsFromYouTube() puede usarse desde AdminDashboard para
 *     importar nuevos cantos del canal directamente a Supabase.
 *   - getSongs() queda como fallback en caso de necesitar reconstruir el catálogo.
 *
 * Carga cantos desde el canal de YouTube de Stella Maris.
 *
 * Convención de metadata en la descripción del video:
 *
 *   STELLA_MARIS_META
 *   categoria: Entrada
 *   autor: Alejandro Mejía
 *   version: Guitarra
 *   temporada: Ordinario
 *   tonalidad: G
 *   etiquetas: Popular, Comunidad
 *   misa: Misa de los Ángeles      ← solo para Kyrie/Gloria/Santo/Cordero de la misma misa
 *   partitura: 1ABC123XYZ           ← Google Drive file ID (compartido públicamente)
 *   liturgico: si                   ← "no" para cantos extra-litúrgicos
 *   categoria_no_liturgica: Mariano ← solo cuando liturgico: no
 *
 *   --- LETRA ---
 *   [Coro]
 *   Letra del coro con [Am]acordes [G]en línea...
 *
 * Campos obligatorios: categoria
 * El título del video es el título del canto.
 *
 * Para Drive: el archivo debe estar compartido como "Cualquiera con el enlace puede ver".
 * URL de preview: https://drive.google.com/file/d/[FILE_ID]/preview
 */

import { Song } from '../types';
import { mockSongs } from '../data/songs';
import { YOUTUBE_CONFIG } from '../config/api';

const CACHE_KEY = 'stella_maris_songs_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

interface CacheEntry {
  songs: Song[];
  timestamp: number;
}

// ──────────────────────────────────────────────
// Cache en localStorage
// ──────────────────────────────────────────────

function readCache(): Song[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.songs;
  } catch {
    return null;
  }
}

function writeCache(songs: Song[]): void {
  try {
    const entry: CacheEntry = { songs, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // quota excedida — ignorar
  }
}

export function clearSongsCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

// ──────────────────────────────────────────────
// Parser de descripción
// ──────────────────────────────────────────────

interface ParsedMeta {
  categoria?: string;
  autor?: string;
  version?: string;
  temporada?: string;
  tonalidad?: string;
  etiquetas?: string[];
  misa?: string;
  partitura?: string;
  liturgico?: boolean;
  categoriaNOLiturgica?: string;
  letra?: string;
}

function parseDescription(description: string): ParsedMeta | null {
  if (!description.includes('STELLA_MARIS_META')) return null;

  const meta: ParsedMeta = {};
  const lines = description.split('\n').map(l => l.trim());
  let inMeta = false;
  let letteraStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === 'STELLA_MARIS_META') { inMeta = true; continue; }
    if (line === '--- LETRA ---') { letteraStart = i + 1; break; }
    if (!inMeta) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    switch (key) {
      case 'categoria':          meta.categoria = value; break;
      case 'autor':              meta.autor = value; break;
      case 'version':            meta.version = value; break;
      case 'temporada':          meta.temporada = value; break;
      case 'tonalidad':          meta.tonalidad = value; break;
      case 'etiquetas':          meta.etiquetas = value.split(',').map(t => t.trim()); break;
      case 'misa':               meta.misa = value; break;
      case 'partitura':          meta.partitura = value; break;
      case 'liturgico':          meta.liturgico = value.toLowerCase() !== 'no'; break;
      case 'categoria_no_liturgica': meta.categoriaNOLiturgica = value; break;
    }
  }

  if (letteraStart !== -1) {
    meta.letra = lines.slice(letteraStart).join('\n').trim();
  }

  return meta.categoria ? meta : null;
}

// ──────────────────────────────────────────────
// Convertir video de YouTube → Song
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// Matching de partituras por nombre
// ──────────────────────────────────────────────

interface DriveFile { id: string; name: string; mimeType: string; }

/** Normaliza un texto para comparación: minúsculas, sin acentos, sin caracteres especiales. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // quita acentos
    .replace(/\.(pdf|jpg|jpeg|png|webp)$/i, '')           // quita extensión
    .replace(/_+/g, ' ')                                  // _ → espacio
    .replace(/[^a-z0-9\s]/g, ' ')                         // solo letras/números/espacios
    .replace(/\s+/g, ' ')                                 // espacios múltiples
    .trim();
}

/** Busca el mejor match de partitura para un título de canto. */
function findBestSheetMatch(songTitle: string, sheets: DriveFile[]): DriveFile | null {
  if (sheets.length === 0) return null;

  const songWords = normalize(songTitle).split(' ').filter(w => w.length > 2);
  if (songWords.length === 0) return null;

  let bestMatch: DriveFile | null = null;
  let bestScore = 0;

  for (const sheet of sheets) {
    const sheetWords = normalize(sheet.name).split(' ').filter(w => w.length > 2);
    if (sheetWords.length === 0) continue;

    // Contar palabras del título del canto que aparecen en el nombre del archivo
    const matchedWords = songWords.filter(w => sheetWords.includes(w));
    const score = matchedWords.length / songWords.length;

    if (score > bestScore && score >= 0.5) {  // mínimo 50% de palabras coincidentes
      bestScore = score;
      bestMatch = sheet;
    }
  }

  return bestMatch;
}

// Cache global de archivos de Drive — se carga una vez por sesión
let cachedSheets: DriveFile[] | null = null;
async function loadSheets(): Promise<DriveFile[]> {
  if (cachedSheets) return cachedSheets;
  try {
    const r = await fetch('/api/sheets');
    if (!r.ok) return [];
    const data = await r.json();
    cachedSheets = (data.files || []).filter((f: DriveFile) => f.mimeType?.includes('pdf') || f.mimeType?.includes('image'));
    return cachedSheets;
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// Convertir video de YouTube → Song
// ──────────────────────────────────────────────

function videoToSong(video: any, sheets: DriveFile[] = []): Song | null {
  const snippet = video.snippet ?? {};
  const details = video.contentDetails ?? {};
  const stats   = video.statistics ?? {};
  const videoId: string = video.id;

  const meta = parseDescription(snippet.description ?? '');

  // Si no tiene metadata válida, no incluir en la biblioteca
  if (!meta) return null;

  const thumbnails = snippet.thumbnails ?? {};
  const thumbnailUrl =
    thumbnails.maxres?.url ??
    thumbnails.standard?.url ??
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ?? '';

  // 1. Si la descripción tiene "partitura: ID", usar ese ID directamente
  // 2. Si no, buscar automáticamente en Drive por título similar
  let sheetFileId = meta.partitura;
  if (!sheetFileId) {
    const match = findBestSheetMatch(snippet.title ?? '', sheets);
    if (match) sheetFileId = match.id;
  }

  const sheetMusicUrl = sheetFileId
    ? `https://drive.google.com/file/d/${sheetFileId}/preview`
    : undefined;

  return {
    id: videoId,
    title: snippet.title ?? 'Sin título',
    category: meta.categoria!,
    youtubeId: videoId,
    duration: formatDuration(details.duration ?? ''),
    artist: 'Stella Maris',
    author: meta.autor,
    version: (meta.version as any) ?? 'Coro',
    instrument: (meta.version as any) ?? 'Coro',
    massName: meta.misa,
    tags: meta.etiquetas ?? snippet.tags ?? [],
    thumbnailUrl,
    uploadedAt: snippet.publishedAt,
    views: Number(stats.viewCount ?? 0),
    liturgicalSeason: meta.temporada,
    lyrics: meta.letra,
    originalKey: meta.tonalidad,
    isLiturgical: meta.liturgico !== false,
    nonLiturgicalCategory: meta.categoriaNOLiturgica as any,
    sheetMusicUrl,
    approvalStatus: 'approved',
  };
}

function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '0:00';
  const h = parseInt(m[1] ?? '0');
  const min = parseInt(m[2] ?? '0');
  const sec = parseInt(m[3] ?? '0');
  if (h > 0) return `${h}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${min}:${String(sec).padStart(2,'0')}`;
}

// ──────────────────────────────────────────────
// Llamadas a la API de YouTube
// ──────────────────────────────────────────────

const YT_API = 'https://www.googleapis.com/youtube/v3';

async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string | null> {
  const url = `${YT_API}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

async function getPlaylistVideoIds(playlistId: string, apiKey: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = '';

  do {
    const url = `${YT_API}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) break;

    for (const item of data.items ?? []) {
      const id = item.contentDetails?.videoId;
      if (id) ids.push(id);
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);

  return ids;
}

async function getVideoDetails(videoIds: string[], apiKey: string): Promise<any[]> {
  const results: any[] = [];

  // YouTube permite máximo 50 IDs por request
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(',');
    const url = `${YT_API}/videos?part=snippet,contentDetails,statistics&id=${batch}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.error) results.push(...(data.items ?? []));
  }

  return results;
}

// ──────────────────────────────────────────────
// Función principal
// ──────────────────────────────────────────────

export async function loadSongsFromYouTube(): Promise<Song[]> {
  const apiKey = YOUTUBE_CONFIG.apiKey;
  const channelId = YOUTUBE_CONFIG.channelId;

  const hasKey = apiKey && !apiKey.includes('XXXXXXXX') && !apiKey.includes('xxxxx');
  const hasChannel = channelId && !channelId.includes('UCxxxxxxxx');

  if (!hasKey || !hasChannel) return [];

  const uploadsId = await getUploadsPlaylistId(channelId, apiKey);
  if (!uploadsId) return [];

  const videoIds = await getPlaylistVideoIds(uploadsId, apiKey);
  if (videoIds.length === 0) return [];

  // Cargar videos y partituras en paralelo
  const [videos, sheets] = await Promise.all([
    getVideoDetails(videoIds, apiKey),
    loadSheets(),
  ]);

  const songs = videos.map(v => videoToSong(v, sheets)).filter((s): s is Song => s !== null);
  return songs;
}

/**
 * Punto de entrada principal.
 * Devuelve canciones de YouTube si están disponibles, con fallback a mockSongs.
 * Usa caché local de 1 hora para no agotar quota de API.
 */
export async function getSongs(): Promise<Song[]> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const songs = await loadSongsFromYouTube();
    if (songs.length > 0) {
      writeCache(songs);
      return songs;
    }
  } catch (err) {
    console.warn('No se pudo cargar desde YouTube, usando datos de ejemplo:', err);
  }

  return mockSongs;
}

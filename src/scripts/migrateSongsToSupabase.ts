/**
 * One-time migration utility: inserts the local mock song catalog into Supabase.
 *
 * Run from AdminDashboard → "Migrar catálogo".
 * Safe to run multiple times: uses youtube_id UNIQUE constraint to skip duplicates.
 */

import { Song, MassMoment, LiturgicalSeason } from '../types';
import { getSupabaseClient } from '../services/supabaseClient';
import { mockSongs } from '../data/mockSongs';
import { loadSongsFromYouTube } from '../services/songLoader';
import { categoryToMoment, seasonToCanonical } from '../utils/category';

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapMoment(category: string): MassMoment {
  return categoryToMoment(category);
}

function mapSeasons(song: Song): LiturgicalSeason[] {
  const seasons: LiturgicalSeason[] = [];

  // Primary season from liturgicalSeason field
  const primary = seasonToCanonical(song.liturgicalSeason);
  if (primary) seasons.push(primary);

  // Supplement with tags (e.g. "Adviento", "Cuaresma" as YouTube tags)
  for (const tag of song.tags ?? []) {
    const canonical = seasonToCanonical(tag);
    if (canonical && !seasons.includes(canonical)) {
      seasons.push(canonical);
    }
  }

  // Empty array = valid for all seasons (no restriction)
  return seasons;
}

/** Momentos adicionales: usa los explícitos del canto o los deriva de recommendedCategories. */
function mapExtraMoments(song: Song): MassMoment[] {
  const primary = mapMoment(song.category);
  const codes = (song.extraMoments && song.extraMoments.length)
    ? song.extraMoments
    : (song.recommendedCategories ?? []).map(categoryToMoment);
  // Sin duplicados y sin repetir el principal.
  return Array.from(new Set(codes)).filter(m => m !== primary);
}

function mapInstruments(song: Song): string[] {
  const instruments = new Set<string>();
  if (song.version)     instruments.add(song.version.toLowerCase());
  if (song.instrument)  instruments.add(song.instrument.toLowerCase());
  for (const i of song.instruments ?? []) instruments.add(i.toLowerCase());
  if (instruments.size === 0) {
    instruments.add('coro');
    instruments.add('guitarra');
    instruments.add('organo');
  }
  return Array.from(instruments);
}

function extractDriveFileId(url?: string): string | null {
  if (!url || url === '#') return null;
  // Handle patterns:
  //   https://drive.google.com/file/d/{ID}/view
  //   https://drive.google.com/open?id={ID}
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ??
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function songToRow(song: Song): Record<string, unknown> {
  return {
    title:                   song.title,
    youtube_id:              song.youtubeId || null,
    // Si el video declara su versión en la metadata (`version:` del bloque
    // STELLA_MARIS_META), queda además en la columna de esa versión: así el
    // canto sincronizado ya dirige al organista y al guitarrista a su propia
    // grabación. Ver utils/songVideo.ts.
    youtube_id_organo:       song.youtubeIdOrgano   ?? null,
    youtube_id_guitarra:     song.youtubeIdGuitarra ?? null,
    mass_moment:             mapMoment(song.category),
    extra_moments:           mapExtraMoments(song),
    liturgical_seasons:      (song.liturgicalSeasons && song.liturgicalSeasons.length)
                               ? song.liturgicalSeasons
                               : mapSeasons(song),
    instruments:             mapInstruments(song),
    drive_file_id:           extractDriveFileId(song.sheetMusicUrl),
    artist:                  song.artist   ?? null,
    author:                  song.author   ?? null,
    original_key:            song.originalKey ?? null,
    duration:                song.duration  ?? null,
    mass_name:               song.massName  ?? null,
    lyrics:                  song.lyrics    ?? null,
    is_liturgical:           song.isLiturgical ?? true,
    non_liturgical_category: song.nonLiturgicalCategory ?? null,
    approval_status:         song.approvalStatus ?? 'approved',
  };
}

// ---------------------------------------------------------------------------
// Migration runner
// ---------------------------------------------------------------------------

export interface MigrationResult {
  total:    number;
  inserted: number;
  updated:  number;   // already existed and were refreshed from YouTube
  skipped:  number;   // already existed (duplicate youtube_id) — solo en la migración de mocks
  errors:   number;
  details:  string[];
}

/**
 * Fila para RE-SINCRONIZAR: la metadata del canal manda, pero sin pisar lo que no
 * corresponde. No incluye approval_status (preserva el flujo de aprobación) y omite
 * drive_file_id / lyrics cuando la metadata no los trae (no borra una partitura/letra
 * ya cargada). El resto de campos (partes, temporadas, etc.) sí se refresca.
 */
function songToSyncRow(song: Song): Record<string, unknown> {
  const row = songToRow(song);
  delete row.approval_status;
  if (row.drive_file_id == null) delete row.drive_file_id;
  if (row.lyrics == null)        delete row.lyrics;
  // Un video del canal declara UNA versión (la suya). La otra se pega a mano en la
  // ficha del canto, así que no puede viajar en este row: mandarla como null la
  // borraría en cada re-sincronización. Mismo criterio que la letra y la partitura.
  if (row.youtube_id_organo == null)   delete row.youtube_id_organo;
  if (row.youtube_id_guitarra == null) delete row.youtube_id_guitarra;
  return row;
}

/**
 * Migrate all mock songs to the Supabase `songs` table in batches of 50.
 * On conflict (same youtube_id), the row is silently skipped — safe to re-run.
 */
export async function migrateMockSongsToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total:    mockSongs.length,
    inserted: 0,
    updated:  0,
    skipped:  0,
    errors:   0,
    details:  [],
  };

  const sb = getSupabaseClient();
  const BATCH = 50;

  for (let i = 0; i < mockSongs.length; i += BATCH) {
    const batch = mockSongs.slice(i, i + BATCH).map(songToRow);

    const { data, error } = await sb
      .from('songs')
      .upsert(batch, {
        onConflict:     'youtube_id',
        ignoreDuplicates: true,       // silently skip duplicates
      })
      .select('id');

    if (error) {
      result.errors += batch.length;
      result.details.push(`Batch ${i / BATCH + 1} error: ${error.message}`);
    } else {
      const inserted = (data ?? []).length;
      const skipped  = batch.length - inserted;
      result.inserted += inserted;
      result.skipped  += skipped;
      result.details.push(
        `Batch ${i / BATCH + 1}: ${inserted} insertados, ${skipped} ya existían`
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// YouTube → Supabase sync
// ---------------------------------------------------------------------------

/**
 * Reads all videos with STELLA_MARIS_META from the YouTube channel and los
 * sincroniza con Supabase (identificados por youtube_id): inserta los nuevos y
 * ACTUALIZA los existentes con la metadata actual del canal. Ejecutar después de
 * cada subida o edición de metadata en el canal.
 */
export async function syncYouTubeToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0, details: [] };

  // 1. Pull videos from YouTube (only those with STELLA_MARIS_META metadata)
  let ytSongs: Song[];
  try {
    ytSongs = await loadSongsFromYouTube();
  } catch (err: any) {
    result.errors = 1;
    result.details.push(`Error accediendo al canal de YouTube: ${err.message}`);
    return result;
  }

  result.total = ytSongs.length;

  if (ytSongs.length === 0) {
    result.details.push(
      'No se encontraron videos con bloque STELLA_MARIS_META en el canal. ' +
      'Agrega ese bloque a la descripción del video para que la app lo reconozca.'
    );
    return result;
  }

  const sb = getSupabaseClient();

  // 2. ¿Cuáles ya existían? (para contar nuevas vs. actualizadas)
  const existing = new Set<string>();
  try {
    const ids = ytSongs.map(s => s.youtubeId).filter(Boolean) as string[];
    const CHUNK = 200;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { data } = await sb
        .from('songs')
        .select('youtube_id')
        .in('youtube_id', ids.slice(i, i + CHUNK));
      for (const row of data ?? []) {
        if (row.youtube_id) existing.add(row.youtube_id as string);
      }
    }
  } catch {
    // si falla el conteo previo, seguimos: el upsert igual funciona (contadores aproximados)
  }

  // 3. Upsert (insertar nuevos + actualizar existentes desde la metadata del canal)
  const BATCH = 50;
  for (let i = 0; i < ytSongs.length; i += BATCH) {
    const slice = ytSongs.slice(i, i + BATCH);
    const batch = slice.map(songToSyncRow);

    const { error } = await sb
      .from('songs')
      .upsert(batch, { onConflict: 'youtube_id' });

    if (error) {
      result.errors += batch.length;
      result.details.push(`Batch ${Math.floor(i / BATCH) + 1} error: ${error.message}`);
    } else {
      const updated  = slice.filter(s => s.youtubeId && existing.has(s.youtubeId)).length;
      const inserted = slice.length - updated;
      result.inserted += inserted;
      result.updated  += updated;
      result.details.push(
        `Batch ${Math.floor(i / BATCH) + 1}: ${inserted} nuevas, ${updated} actualizadas`
      );
    }
  }

  return result;
}

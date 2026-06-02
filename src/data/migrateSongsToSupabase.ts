/**
 * One-time migration utility: inserts the local mock song catalog into Supabase.
 *
 * Run from AdminDashboard → "Migrar catálogo".
 * Safe to run multiple times: uses youtube_id UNIQUE constraint to skip duplicates.
 */

import { Song, MassMoment, LiturgicalSeason } from '../types';
import { getSupabaseClient } from '../services/supabaseClient';
import { mockSongs } from './songs';

// ---------------------------------------------------------------------------
// Mapping tables  (old string values → canonical keys)
// ---------------------------------------------------------------------------

const CATEGORY_TO_MOMENT: Record<string, MassMoment> = {
  'Entrada':                  'entrada',
  'Kyrie':                    'kyrie',
  'Gloria':                   'gloria',
  'Salmo':                    'salmo',
  'Salmo AT 1-7':             'salmo',
  'Salmo Epistolar':          'salmo',
  'Aleluya':                  'aleluya',
  'Aleluya Triple':           'aleluya',
  'Post Evangelio':           'aleluya',
  'Aclamación al Evangelio':  'aleluya',
  'Secuencia de Pascua':      'aleluya',
  'Secuencia de Pentecostés': 'aleluya',
  'Secuencia de Corpus':      'aleluya',
  'Ofertorio':                'ofertorio',
  'Santo':                    'santo',
  'Cordero de Dios':          'cordero',
  'Comunión':                 'comunion',
  'Salida':                   'final',
  'Kalenda Navideña':         'entrada',
  'Pregón Pascual':           'entrada',
  'Exposición y Procesión':   'exposicion',
  'Adoración':                'no-liturgico',
  'Procesión':                'no-liturgico',
  'Mariano':                  'no-liturgico',
  'Reflexión':                'no-liturgico',
  'Evangelización':           'no-liturgico',
  'Otro':                     'no-liturgico',
};

const SEASON_TO_CANONICAL: Record<string, LiturgicalSeason> = {
  'Adviento':          'adviento',
  'Navidad':           'navidad',
  'Ordinario':         'tiempo-ordinario',
  'Tiempo Ordinario':  'tiempo-ordinario',
  'Cuaresma':          'cuaresma',
  'Semana Santa':      'semana-santa',
  'Pascua':            'pascua',
  'Pentecostés':       'pentecostes',
  'Corpus Christi':    'corpus-christi',
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapMoment(category: string): MassMoment {
  return CATEGORY_TO_MOMENT[category] ?? 'no-liturgico';
}

function mapSeasons(song: Song): LiturgicalSeason[] {
  const seasons: LiturgicalSeason[] = [];

  // Primary season from liturgicalSeason field
  if (song.liturgicalSeason) {
    const canonical = SEASON_TO_CANONICAL[song.liturgicalSeason];
    if (canonical) seasons.push(canonical);
  }

  // Supplement with tags (e.g. "Adviento", "Cuaresma" as YouTube tags)
  for (const tag of song.tags ?? []) {
    const canonical = SEASON_TO_CANONICAL[tag];
    if (canonical && !seasons.includes(canonical)) {
      seasons.push(canonical);
    }
  }

  // Empty array = valid for all seasons (no restriction)
  return seasons;
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
    mass_moment:             mapMoment(song.category),
    liturgical_seasons:      mapSeasons(song),
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
  skipped:  number;   // already existed (duplicate youtube_id)
  errors:   number;
  details:  string[];
}

/**
 * Migrate all mock songs to the Supabase `songs` table in batches of 50.
 * On conflict (same youtube_id), the row is silently skipped — safe to re-run.
 */
export async function migrateMockSongsToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total:    mockSongs.length,
    inserted: 0,
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

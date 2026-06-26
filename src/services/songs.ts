import { Song, MassMoment, LiturgicalSeason, InstrumentType } from '../types';
import { getSupabaseClient } from './supabaseClient';
import { normalizeCategory } from '../utils/category';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SongFilters {
  massMoment?: MassMoment;
  liturgicalSeason?: LiturgicalSeason;
  instrument?: InstrumentType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SongInput {
  title: string;
  youtubeId?: string;
  massMoment: MassMoment;
  extraMoments?: MassMoment[];
  liturgicalSeasons?: LiturgicalSeason[];
  instruments?: InstrumentType[];
  driveFileId?: string;
  artist?: string;
  author?: string;
  originalKey?: string;
  duration?: string;
  massName?: string;
  lyrics?: string;
  isLiturgical?: boolean;
  nonLiturgicalCategory?: Song['nonLiturgicalCategory'];
}

// ---------------------------------------------------------------------------
// DB row ↔ Song mapper
// ---------------------------------------------------------------------------

/**
 * Normaliza un instrumento al valor canónico que guarda la BD: minúsculas y sin
 * acentos ('Órgano' → 'organo'). Imprescindible para que coincida con el default
 * '{coro,guitarra,organo}' y con el filtro p_instrument del RPC search_songs.
 */
const normalizeInstrument = (i: string): string =>
  i.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function rowToSong(row: Record<string, unknown>): Song {
  return {
    id:                    row.id as string,
    title:                 row.title as string,
    category:              normalizeCategory(row.mass_moment as string), // nombre de categoría que usa la app
    massMoment:            row.mass_moment as MassMoment,
    extraMoments:          (row.extra_moments as MassMoment[]) ?? [],
    recommendedCategories: ((row.extra_moments as string[]) ?? []).map(m => normalizeCategory(m)),
    youtubeId:             (row.youtube_id as string) ?? '',
    videoUrl:              row.youtube_id ? `https://www.youtube.com/watch?v=${row.youtube_id}` : undefined,
    liturgicalSeasons:     (row.liturgical_seasons as LiturgicalSeason[]) ?? [],
    liturgicalSeason:      ((row.liturgical_seasons as string[]) ?? [])[0], // backwards compat
    instruments:           (row.instruments as string[]) ?? [],
    version:               ((row.instruments as string[]) ?? [])[0] as Song['version'],
    instrument:            ((row.instruments as string[]) ?? [])[0] as Song['instrument'],
    driveFileId:           row.drive_file_id as string | undefined,
    sheetMusicUrl:         row.drive_file_id
                             ? `https://drive.google.com/file/d/${row.drive_file_id}/view`
                             : undefined,
    artist:                row.artist as string | undefined,
    author:                row.author as string | undefined,
    originalKey:           row.original_key as string | undefined,
    duration:              (row.duration as string) ?? '',
    massName:              row.mass_name as string | undefined,
    lyrics:                row.lyrics as string | undefined,
    isLiturgical:          (row.is_liturgical as boolean) ?? true,
    nonLiturgicalCategory: row.non_liturgical_category as Song['nonLiturgicalCategory'],
    approvalStatus:        row.approval_status as Song['approvalStatus'],
    approvedBy:            row.approved_by as string | undefined,
    approvedAt:            row.approved_at as string | undefined,
    rejectionReason:       row.rejection_reason as string | undefined,
  };
}

function songInputToRow(input: SongInput): Record<string, unknown> {
  return {
    title:                 input.title,
    youtube_id:            input.youtubeId ?? null,
    mass_moment:           input.massMoment,
    extra_moments:         input.extraMoments ?? [],
    liturgical_seasons:    input.liturgicalSeasons ?? [],
    instruments:           input.instruments?.map(normalizeInstrument) ?? ['coro', 'guitarra', 'organo'],
    drive_file_id:         input.driveFileId ?? null,
    artist:                input.artist ?? null,
    author:                input.author ?? null,
    original_key:          input.originalKey ?? null,
    duration:              input.duration ?? null,
    mass_name:             input.massName ?? null,
    lyrics:                input.lyrics ?? null,
    is_liturgical:         input.isLiturgical ?? true,
    non_liturgical_category: input.nonLiturgicalCategory ?? null,
    approval_status:       'approved',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List approved songs from the Supabase catalog via the `search_songs` RPC.
 * All filter params are optional — omit to get everything (up to limit).
 * The DB function handles array containment for liturgical_seasons correctly,
 * including songs with an empty seasons array (valid for any season).
 */
export async function listSongs(filters: SongFilters = {}): Promise<Song[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('search_songs', {
      p_moment:     filters.massMoment      ?? null,
      p_season:     filters.liturgicalSeason ?? null,
      p_instrument: filters.instrument ? normalizeInstrument(filters.instrument) : null,
      p_query:      filters.search          ?? null,
      p_limit:      filters.limit           ?? 200,
      p_offset:     filters.offset          ?? 0,
    });
    if (error) throw error;
    return (data ?? []).map(rowToSong);
  } catch (err) {
    console.error('Error listando canciones:', err);
    return [];
  }
}

/** Fetch a single song by ID. */
export async function getSongById(id: string): Promise<Song | null> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from('songs').select('*').eq('id', id).single();
    if (error || !data) return null;
    return rowToSong(data);
  } catch {
    return null;
  }
}

/** Fetch all songs pending admin review. */
export async function listPendingSongs(): Promise<Song[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('songs')
      .select('*')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToSong);
  } catch (err) {
    console.error('Error listando canciones pendientes:', err);
    return [];
  }
}

/** Add a new song to the catalog (admin only). */
export async function addSong(input: SongInput): Promise<{ ok: boolean; song?: Song; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('songs')
      .insert(songInputToRow(input))
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, song: rowToSong(data) };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Update an existing song's metadata (admin only). */
export async function updateSong(
  id: string,
  input: Partial<SongInput>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const row: Record<string, unknown> = {};
    if (input.title !== undefined)            row.title                  = input.title;
    if (input.youtubeId !== undefined)        row.youtube_id             = input.youtubeId;
    if (input.massMoment !== undefined)       row.mass_moment            = input.massMoment;
    if (input.extraMoments !== undefined)     row.extra_moments          = input.extraMoments;
    if (input.liturgicalSeasons !== undefined)row.liturgical_seasons     = input.liturgicalSeasons;
    if (input.instruments !== undefined)      row.instruments            = input.instruments.map(normalizeInstrument);
    if (input.driveFileId !== undefined)      row.drive_file_id          = input.driveFileId;
    if (input.artist !== undefined)           row.artist                 = input.artist;
    if (input.author !== undefined)           row.author                 = input.author;
    if (input.originalKey !== undefined)      row.original_key           = input.originalKey;
    if (input.duration !== undefined)         row.duration               = input.duration;
    if (input.massName !== undefined)         row.mass_name              = input.massName;
    if (input.lyrics !== undefined)           row.lyrics                 = input.lyrics;
    if (input.isLiturgical !== undefined)     row.is_liturgical          = input.isLiturgical;
    if (input.nonLiturgicalCategory !== undefined) row.non_liturgical_category = input.nonLiturgicalCategory;

    const { error } = await sb.from('songs').update(row).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Approve a pending song (admin only). */
export async function approveSong(
  id: string,
  approvedBy: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from('songs').update({
      approval_status: 'approved',
      approved_by:     approvedBy,
      approved_at:     new Date().toISOString(),
      rejection_reason: null,
    }).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Reject a pending song (admin only). */
export async function rejectSong(
  id: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from('songs').update({
      approval_status:  'rejected',
      rejection_reason: reason,
    }).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Permanently delete a song from the catalog (admin only). */
export async function deleteSong(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from('songs').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message };
  }
}

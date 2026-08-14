/**
 * Catálogo de etiquetas de canto (temporadas litúrgicas y temáticas) — acceso a
 * la tabla `song_tags`.
 *
 * Antes la lista estaba escrita a mano en SongManager, así que agregar
 * "Domingo de Ramos" obligaba a tocar el código y desplegar. Ahora la administra
 * el admin desde la app.
 *
 * IMPORTANTE — degradación sin la migración: si la tabla todavía no existe (las
 * migraciones se aplican a mano en este proyecto), `listSongTags` devuelve la
 * lista por defecto y la app sigue funcionando igual que antes; lo único que no
 * se puede es crear, renombrar ni borrar etiquetas. Sin esto, un despliegue
 * anterior a la migración dejaría el editor de cantos sin ninguna etiqueta.
 *
 * La lógica pura (lista por defecto, duplicados) está en `utils/songTags.ts`,
 * que no importa Supabase y por eso se puede probar sin base de datos.
 */

import { getSupabaseClient } from './supabaseClient';
import { defaultSongTagRows, type SongTag } from '../utils/songTags';

export {
  DEFAULT_SONG_TAGS, defaultSongTagRows, isPersistedTag, findDuplicate, type SongTag,
} from '../utils/songTags';

const TABLE = 'song_tags';

function rowToTag(row: any): SongTag {
  return { id: row.id, label: row.label, sortOrder: Number(row.sort_order ?? 500) };
}

/**
 * Etiquetas del catálogo, en el orden en que se muestran los chips. Ante
 * cualquier problema (tabla ausente, sin red) devuelve la lista por defecto: es
 * preferible editar cantos con las etiquetas de siempre que quedarse sin ninguna.
 */
export async function listSongTags(): Promise<SongTag[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from(TABLE)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true });
    if (error) {
      console.error('Error listando etiquetas:', error.message);
      return defaultSongTagRows();
    }
    return (data ?? []).length ? (data ?? []).map(rowToTag) : defaultSongTagRows();
  } catch (err) {
    console.error('Excepción listando etiquetas:', err);
    return defaultSongTagRows();
  }
}

/** Crea una etiqueta (solo admin por RLS). Devuelve la fila creada. */
export async function addSongTag(
  label: string,
  sortOrder = 500,
): Promise<{ ok: boolean; tag?: SongTag; error?: string }> {
  const clean = label.trim();
  if (!clean) return { ok: false, error: 'La etiqueta no puede estar vacía' };
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from(TABLE)
      .insert({ label: clean, sort_order: sortOrder })
      .select()
      .single();
    if (error) {
      // 23505 = índice único: ya existe con otras mayúsculas o acentos.
      if (error.code === '23505') return { ok: false, error: 'Ya existe una etiqueta con ese nombre' };
      return { ok: false, error: error.message };
    }
    return { ok: true, tag: rowToTag(data) };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error creando la etiqueta' };
  }
}

/** Renombra una etiqueta del catálogo (solo admin por RLS). */
export async function renameSongTag(id: string, label: string): Promise<{ ok: boolean; error?: string }> {
  const clean = label.trim();
  if (!clean) return { ok: false, error: 'La etiqueta no puede estar vacía' };
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).update({ label: clean }).eq('id', id);
    if (error) {
      if (error.code === '23505') return { ok: false, error: 'Ya existe una etiqueta con ese nombre' };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error renombrando la etiqueta' };
  }
}

/** Borra una etiqueta del catálogo (solo admin por RLS). */
export async function deleteSongTag(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error eliminando la etiqueta' };
  }
}

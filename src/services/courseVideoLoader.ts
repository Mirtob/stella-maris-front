import { getSupabaseClient } from './supabaseClient';
import { YOUTUBE_CONFIG } from '../config/api';
import { findCapsule } from '../data/courseCurriculum';

// Lectura del canal vía el proxy serverless (la API key vive solo en el servidor).
const YT = '/api/youtube';

async function uploadsPlaylistId(channelId: string): Promise<string | null> {
  const res = await fetch(`${YT}?endpoint=channels&part=contentDetails&id=${encodeURIComponent(channelId)}`);
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

async function playlistVideoIds(playlistId: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = '';
  do {
    const res = await fetch(`${YT}?endpoint=playlistItems&part=contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=50${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
    const data = await res.json();
    if (data.error) break;
    for (const item of data.items ?? []) { const id = item.contentDetails?.videoId; if (id) ids.push(id); }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return ids;
}

async function videoDescriptions(videoIds: string[]): Promise<{ id: string; description: string }[]> {
  const out: { id: string; description: string }[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(',');
    const res = await fetch(`${YT}?endpoint=videos&part=snippet&id=${encodeURIComponent(batch)}`);
    const data = await res.json();
    if (data.error) continue;
    for (const v of data.items ?? []) out.push({ id: v.id, description: v.snippet?.description ?? '' });
  }
  return out;
}

/** Extrae el id de cápsula del bloque STELLA_MARIS_CURSO de la descripción. */
export function parseCapsuleId(description: string): string | null {
  if (!description || !description.includes('STELLA_MARIS_CURSO')) return null;
  let inBlock = false;
  for (const raw of description.split('\n')) {
    const line = raw.trim();
    if (line === 'STELLA_MARIS_CURSO') { inBlock = true; continue; }
    if (!inBlock) continue;
    const m = line.match(/^cap(?:sula|sule)?\s*:\s*([a-z0-9-]+)/i);
    if (m) return m[1].toLowerCase();
    if (line === '') break; // fin del bloque
  }
  return null;
}

/** Lee el canal y sincroniza course_videos con los videos que tienen el bloque del curso. */
export async function syncCourseVideos(): Promise<{ mapped: number; ignored: number; error?: string }> {
  try {
    const channelIds = (YOUTUBE_CONFIG.channelIds ?? []).filter((c) => c && !c.includes('xxxxx'));
    if (channelIds.length === 0) return { mapped: 0, ignored: 0, error: 'No hay canal de YouTube configurado.' };

    const ids: string[] = [];
    for (const ch of channelIds) {
      const up = await uploadsPlaylistId(ch);
      if (up) ids.push(...(await playlistVideoIds(up)));
    }
    const unique = Array.from(new Set(ids));
    if (unique.length === 0) return { mapped: 0, ignored: 0, error: 'El proxy no devolvió videos (¿API key configurada?).' };

    const descs = await videoDescriptions(unique);
    const rows: { capsule_id: string; video_id: string; updated_at: string }[] = [];
    let ignored = 0;
    const seen = new Set<string>();
    for (const d of descs) {
      const capId = parseCapsuleId(d.description);
      if (!capId) continue;
      if (!findCapsule(capId)) { ignored++; continue; }   // id que no existe en el currículo
      if (seen.has(capId)) continue;                       // ya mapeada (gana la más reciente del canal)
      seen.add(capId);
      rows.push({ capsule_id: capId, video_id: d.id, updated_at: new Date().toISOString() });
    }

    if (rows.length) {
      const sb = getSupabaseClient();
      const { error } = await sb.from('course_videos').upsert(rows, { onConflict: 'capsule_id' });
      if (error) return { mapped: 0, ignored, error: error.message };
    }
    return { mapped: rows.length, ignored };
  } catch (e: any) {
    return { mapped: 0, ignored: 0, error: e?.message || 'Error sincronizando' };
  }
}

/** Mapa capsuleId → videoId (para resolver el video de cada cápsula en la app). */
export async function getCourseVideos(): Promise<Record<string, string>> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from('course_videos').select('capsule_id, video_id');
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const r of data as { capsule_id: string; video_id: string }[]) map[r.capsule_id] = r.video_id;
    return map;
  } catch {
    return {};
  }
}

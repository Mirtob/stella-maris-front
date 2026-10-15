/**
 * Lectura del canal de YouTube — SOLO LECTURA.
 *
 * El canal ya no alimenta el catálogo (los cantos se agregan desde la app). Esto
 * se usa después de subir videos, para el inventario del Resumen de cantos: qué
 * videos hay en el canal y, por separado, qué responde YouTube por los videos que
 * la app usa y no aparecen ahí. Todo va por el proxy /api/youtube (la key vive en
 * el servidor). Nada de aquí escribe en Supabase.
 */
import { YOUTUBE_CONFIG } from '../config/api';
import type { ChannelVideo, VideoLookup } from '../utils/channelInventory';

const YT_PROXY = '/api/youtube';

async function getJson(url: string): Promise<any> {
  // El proxy cachea 10 min en el CDN; esta lectura se hace justo después de subir
  // videos, así que se pide fresca (el proxy descarta `fresh`).
  const res = await fetch(`${url}&fresh=${Date.now()}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    const msg = data?.error?.message || data?.error || `YouTube respondió ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : 'Error consultando YouTube');
  }
  return data;
}

/** Canales oficiales configurados (los placeholders no cuentan). */
export function officialChannelIds(): string[] {
  return (YOUTUBE_CONFIG.channelIds ?? []).filter((c) => c && !c.includes('xxxxx'));
}

/** Todos los videos públicos del canal (o canales) oficial. */
export async function listChannelVideos(): Promise<ChannelVideo[]> {
  const channels = officialChannelIds();
  if (channels.length === 0) throw new Error('No hay canal de YouTube configurado (VITE_YOUTUBE_CHANNEL_ID).');

  const videos: ChannelVideo[] = [];
  for (const channelId of channels) {
    const ch = await getJson(`${YT_PROXY}?endpoint=channels&part=contentDetails&id=${encodeURIComponent(channelId)}`);
    const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) continue;

    let pageToken = '';
    do {
      const data = await getJson(
        `${YT_PROXY}?endpoint=playlistItems&part=snippet,contentDetails&maxResults=50` +
        `&playlistId=${encodeURIComponent(uploads)}` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''),
      );
      for (const item of data.items ?? []) {
        const id = item.contentDetails?.videoId;
        if (!id) continue;
        const sn = item.snippet ?? {};
        videos.push({
          id,
          title: sn.title ?? 'Sin título',
          publishedAt: item.contentDetails?.videoPublishedAt ?? sn.publishedAt,
          thumbnail: sn.thumbnails?.medium?.url ?? sn.thumbnails?.default?.url,
        });
      }
      pageToken = data.nextPageToken ?? '';
    } while (pageToken);
  }
  return videos;
}

/**
 * Consulta videos sueltos por ID. Los que YouTube no devuelve (borrados o
 * privados) quedan en `null`.
 */
export async function lookupVideos(ids: string[]): Promise<Map<string, VideoLookup | null>> {
  const out = new Map<string, VideoLookup | null>();
  for (let i = 0; i < ids.length; i += 50) {
    const slice = ids.slice(i, i + 50);
    for (const id of slice) out.set(id, null);
    const batch = slice.join(',');
    const data = await getJson(`${YT_PROXY}?endpoint=videos&part=snippet,status&id=${encodeURIComponent(batch)}`);
    for (const v of data.items ?? []) {
      out.set(v.id, { channelId: v.snippet?.channelId, privacyStatus: v.status?.privacyStatus });
    }
  }
  return out;
}

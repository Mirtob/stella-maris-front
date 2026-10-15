import { InstrumentType, Song } from '../types';
import { pickSongVideo, toVideoId, type VideoVersion } from './songVideo';

/**
 * Inventario del canal de YouTube frente al catálogo de la app.
 *
 * Los cantos se AGREGAN Y EDITAN SOLO DESDE LA APP (Gestión de Cantos). El canal
 * ya no alimenta el catálogo: se lee únicamente para saber qué videos del canal
 * ya están disponibles en la app y en qué versión (órgano, guitarra o única), y
 * cuáles faltan por vincular. Nada de este archivo escribe en la base.
 *
 * Son funciones puras: el componente trae los videos (services/channelInventory)
 * y los cantos (services/songs), y aquí solo se cruzan.
 */

/** Un video publicado en el canal. */
export interface ChannelVideo {
  id: string;
  title: string;
  publishedAt?: string;
  thumbnail?: string;
}

/** Dónde está usado un video dentro de la app. */
export interface VideoUse {
  songId: string;
  songTitle: string;
  version: VideoVersion;
}

/** Video del canal que ya está vinculado a uno o más cantos. */
export interface LinkedVideo {
  video: ChannelVideo;
  uses: VideoUse[];
}

/**
 * Video que la app usa pero que NO aparece entre los públicos del canal.
 *  - 'no-listado':    existe y es del canal, pero está oculto (sí se reproduce).
 *  - 'otro-canal':    existe, pero lo publicó otro canal.
 *  - 'no-disponible': YouTube no lo devuelve (borrado o privado): no se reproduce.
 *  - 'sin-verificar': no se pudo consultar.
 */
export type OutsideStatus = 'no-listado' | 'otro-canal' | 'no-disponible' | 'sin-verificar';

export const OUTSIDE_STATUS_LABEL: Record<OutsideStatus, string> = {
  'no-listado':    'Oculto (no listado) en el canal',
  'otro-canal':    'Es de otro canal',
  'no-disponible': 'Borrado o privado: no se reproduce',
  'sin-verificar': 'No se pudo verificar',
};

export interface OutsideVideo extends VideoUse {
  videoId: string;
  status: OutsideStatus;
}

/** Lo que YouTube devuelve al consultar un video suelto por ID. */
export interface VideoLookup {
  channelId?: string;
  privacyStatus?: string;
}

export interface ChannelInventory {
  /** Cuándo se leyó el canal (ISO). */
  readAt: string;
  /** Videos públicos en el canal. */
  channelTotal: number;
  /** En el canal y ya en la app. */
  linked: LinkedVideo[];
  /** En el canal pero sin canto en la app: el pendiente de vincular. */
  unlinked: ChannelVideo[];
  /** En la app pero no entre los públicos del canal. */
  outside: OutsideVideo[];
}

/** Todos los videos que usa un canto, con la versión de cada uno. */
export function songVideoUses(song: Song): (VideoUse & { videoId: string })[] {
  const slots: [VideoVersion, string | undefined][] = [
    ['Órgano', song.youtubeIdOrgano],
    ['Guitarra', song.youtubeIdGuitarra],
    ['General', song.youtubeId],
  ];
  const out: (VideoUse & { videoId: string })[] = [];
  for (const [version, raw] of slots) {
    const videoId = toVideoId(raw);
    if (videoId) out.push({ videoId, songId: song.id, songTitle: song.title, version });
  }
  return out;
}

/**
 * IDs de la app que no están entre los públicos del canal. Son los que hay que
 * consultar uno por uno para saber si están ocultos, son de otro canal o ya no existen.
 */
export function videosOutsideChannel(songs: Song[], channel: ChannelVideo[]): string[] {
  const inChannel = new Set(channel.map((v) => v.id));
  const ids = new Set<string>();
  for (const s of songs) {
    for (const u of songVideoUses(s)) if (!inChannel.has(u.videoId)) ids.add(u.videoId);
  }
  return Array.from(ids);
}

/**
 * Cruza el canal con el catálogo.
 *
 * `lookup` trae lo que respondió YouTube al consultar los videos de
 * `videosOutsideChannel`: `null` = se consultó y YouTube no lo devolvió (borrado o
 * privado); sin entrada = no se consultó (p. ej. un canto vinculado después de la
 * lectura), y queda 'sin-verificar' en vez de darlo por perdido.
 */
export function buildChannelInventory(
  songs: Song[],
  channel: ChannelVideo[],
  lookup: Map<string, VideoLookup | null>,
  officialChannelIds: string[],
  readAt: Date = new Date(),
): ChannelInventory {
  const uses = new Map<string, VideoUse[]>();
  for (const s of songs) {
    for (const { videoId, ...use } of songVideoUses(s)) {
      const list = uses.get(videoId) ?? [];
      list.push(use);
      uses.set(videoId, list);
    }
  }

  const linked: LinkedVideo[] = [];
  const unlinked: ChannelVideo[] = [];
  const inChannel = new Set<string>();
  for (const video of channel) {
    if (inChannel.has(video.id)) continue;
    inChannel.add(video.id);
    const u = uses.get(video.id);
    if (u) linked.push({ video, uses: u });
    else unlinked.push(video);
  }

  const official = new Set(officialChannelIds);
  const outside: OutsideVideo[] = [];
  for (const [videoId, list] of uses) {
    if (inChannel.has(videoId)) continue;
    const info = lookup.get(videoId);
    const status: OutsideStatus =
      info === undefined ? 'sin-verificar' :
      info === null      ? 'no-disponible' :
      info.channelId && official.size && !official.has(info.channelId) ? 'otro-canal' :
      info.privacyStatus === 'private' ? 'no-disponible' :
                                         'no-listado';
    for (const use of list) outside.push({ ...use, videoId, status });
  }
  // Lo que no se reproduce va primero: es lo único que rompe algo para el coro.
  const rank: Record<OutsideStatus, number> = { 'no-disponible': 0, 'sin-verificar': 1, 'otro-canal': 2, 'no-listado': 3 };
  outside.sort((a, b) => rank[a.status] - rank[b.status] || a.songTitle.localeCompare(b.songTitle));

  // Lo más reciente primero: es lo que se acaba de subir y se quiere vincular.
  const byDate = (a: ChannelVideo, b: ChannelVideo) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
  unlinked.sort(byDate);
  linked.sort((a, b) => byDate(a.video, b.video));

  return { readAt: readAt.toISOString(), channelTotal: inChannel.size, linked, unlinked, outside };
}

// ── Qué ve cada instrumento ─────────────────────────────────────────────────

/**
 * Cuántos cantos le muestran a un organista (o guitarrista) cada tipo de video,
 * con la MISMA regla que el reproductor (`pickSongVideo`):
 *  - propia:   la grabación de su instrumento,
 *  - unica:    el video único/general (cuando no está la suya),
 *  - otra:     la del otro instrumento (única versión disponible, con aviso),
 *  - sinVideo: ninguna.
 */
export interface InstrumentCoverage {
  propia: number;
  unica: number;
  otra: number;
  sinVideo: number;
}

export function instrumentCoverage(songs: Song[], instrument: InstrumentType): InstrumentCoverage {
  const c: InstrumentCoverage = { propia: 0, unica: 0, otra: 0, sinVideo: 0 };
  for (const s of songs) {
    const v = pickSongVideo(s, instrument);
    if (!v) c.sinVideo++;
    else if (v.version === instrument) c.propia++;
    else if (v.version === 'General') c.unica++;
    else c.otra++;
  }
  return c;
}

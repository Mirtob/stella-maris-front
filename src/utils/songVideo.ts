import { InstrumentType, Song } from '../types';

/**
 * ¿Qué video del canto le toca a este usuario?
 *
 * Cada canto se graba DOS veces: una versión con órgano y otra con guitarra.
 * El instrumento del perfil (o el elegido para esta Misa en el constructor)
 * decide cuál se reproduce, para que nadie ensaye con el acompañamiento del
 * otro instrumento.
 *
 * No es un filtro duro como `filterByInstrument`: si la versión que te toca
 * todavía no está grabada, es mejor ver la otra que no ver nada — pero quien
 * muestre el video DEBE rotular qué versión está sonando (`version`) y avisar
 * cuando no es la tuya (`isFallback`).
 */

/** Versión de acompañamiento de un video. 'General' = grabación única. */
export type VideoVersion = InstrumentType | 'General';

export interface SongVideo {
  /** ID de YouTube (11 caracteres) listo para el embed. */
  videoId: string;
  /** Versión que realmente se va a reproducir. */
  version: VideoVersion;
  /** true si NO es la versión del instrumento pedido (se cayó al respaldo). */
  isFallback: boolean;
}

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

/** Un ID solo sirve si tiene la forma que espera YouTube. */
export const isValidVideoId = (id?: string | null): id is string =>
  !!id && VIDEO_ID_RE.test(id);

/**
 * Acepta lo que pegue el admin —URL de watch/youtu.be/embed/shorts o el ID
 * pelado— y devuelve el ID, o '' si no hay nada aprovechable.
 */
export function toVideoId(raw?: string | null): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  if (VIDEO_ID_RE.test(value)) return value;
  // `youtube-nocookie.com` cuenta: es el dominio que usa el reproductor de la app,
  // así que es lo que copia el admin desde el inspector o desde un embed.
  const m = value.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : '';
}

/** El video propio de una versión (sin respaldos). */
function versionVideoId(song: Song, version: VideoVersion): string {
  const raw =
    version === 'Órgano'   ? song.youtubeIdOrgano :
    version === 'Guitarra' ? song.youtubeIdGuitarra :
                             song.youtubeId;
  const id = toVideoId(raw);
  return isValidVideoId(id) ? id : '';
}

/**
 * Resuelve el video a reproducir para `instrument`, en este orden:
 *   1. la versión del instrumento pedido,
 *   2. el video general (`youtubeId`) — es lo que tiene el catálogo antiguo,
 *   3. la versión del OTRO instrumento (marcada como respaldo).
 * `null` si el canto no tiene ningún video (p. ej. el salmo del libro).
 */
export function pickSongVideo(song: Song, instrument?: InstrumentType): SongVideo | null {
  if (instrument) {
    const own = versionVideoId(song, instrument);
    if (own) return { videoId: own, version: instrument, isFallback: false };
  }

  const general = versionVideoId(song, 'General');
  if (general) {
    // Sin instrumento pedido no hay "versión equivocada" posible.
    return { videoId: general, version: 'General', isFallback: false };
  }

  const other: InstrumentType = instrument === 'Guitarra' ? 'Órgano' : 'Guitarra';
  const otherId = versionVideoId(song, other);
  if (otherId) return { videoId: otherId, version: other, isFallback: !!instrument };

  // Sin instrumento pedido: la que haya.
  if (!instrument) {
    const fallback = versionVideoId(song, 'Guitarra') || versionVideoId(song, 'Órgano');
    if (fallback) {
      return {
        videoId: fallback,
        version: versionVideoId(song, 'Guitarra') ? 'Guitarra' : 'Órgano',
        isFallback: false,
      };
    }
  }

  return null;
}

/** ID del video que le toca a este usuario ('' si el canto no tiene video). */
export function pickVideoId(song: Song, instrument?: InstrumentType): string {
  return pickSongVideo(song, instrument)?.videoId ?? '';
}

/** URL de YouTube del video que le toca a este usuario (para enlaces y PDF). */
export function pickVideoUrl(song: Song, instrument?: InstrumentType): string | undefined {
  const id = pickVideoId(song, instrument);
  return id ? `https://www.youtube.com/watch?v=${id}` : undefined;
}

/** ¿Este canto tiene algún video (de la versión que sea)? */
export function hasAnyVideo(song: Song): boolean {
  return pickSongVideo(song) !== null;
}

/** Rótulo corto para mostrar qué versión está sonando. */
export function videoVersionLabel(version: VideoVersion): string {
  if (version === 'Guitarra') return '🎶 Versión Guitarra';
  if (version === 'Órgano')   return '🎹 Versión Órgano';
  return '🎬 Versión única';
}

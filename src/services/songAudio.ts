import { detectSheets, FULL_SCORE } from '../utils/sheetParts';

/**
 * Pistas de ensayo de un canto: un MP3 por voz, tal como los deja MuseScore.
 *
 * NO se guardan en la base a propósito. Se resuelven en el momento desde la MISMA
 * carpeta de Drive donde ya están las partituras (`song.driveFolderId`), por dos
 * razones: no hace falta migración ni tocar el editor de cantos, y en cuanto alguien
 * exporta los MP3 de una obra nueva aparecen solos, sin que nadie tenga que volver a
 * registrarlos a mano.
 *
 * Las dos URL apuntan a `/api/pdf` y no a un `/api/audio` propio porque el plan Hobby
 * de Vercel admite 12 funciones serverless y ya estábamos en 12: la número 13 tumbaba
 * el despliegue entero. Ver la cabecera de api/pdf.ts.
 */

export interface AudioTrack {
  /** Voz tal como la nombró el músico ('Soprano', 'Bajo'…) o la mezcla completa. */
  part: string;
  fileId: string;
  fileName: string;
  /** Bytes del archivo. Sirve para decir cuánto se va a descargar ANTES de bajarlo. */
  size: number;
  /** URL propia (la CSP solo deja reproducir audio de nuestro dominio). */
  url: string;
}

/** La mezcla de todas las voces, que MuseScore exporta sin sufijo. */
export const MEZCLA = FULL_SCORE;

const cache = new Map<string, AudioTrack[]>();

/**
 * Las pistas de un canto, o lista vacía si esa obra no tiene audios.
 *
 * Se cachea en memoria por carpeta: en un ensayo se abre y se cierra el mismo
 * mezclador varias veces, y volver a preguntarle a Drive cada vez no aporta nada.
 */
export async function getSongTracks(driveFolderId?: string | null): Promise<AudioTrack[]> {
  if (!driveFolderId) return [];
  const enCache = cache.get(driveFolderId);
  if (enCache) return enCache;

  try {
    const r = await fetch(`/api/pdf?folder=${encodeURIComponent(driveFolderId)}`);
    if (!r.ok) return [];
    const data = await r.json();
    const archivos: { id: string; name: string; size: number }[] = data.tracks ?? [];
    if (archivos.length === 0) {
      cache.set(driveFolderId, []);
      return [];
    }

    // Misma deducción de voces que las partituras: los MP3 siguen la convención de
    // nombres de MuseScore igual que los PDF.
    const voces = detectSheets(archivos.map(a => ({ id: a.id, name: a.name })), 'mp3');
    const porId = new Map(archivos.map(a => [a.id, a]));
    const pistas: AudioTrack[] = voces.map((v) => ({
      part: v.part,
      fileId: v.fileId,
      fileName: v.fileName,
      size: porId.get(v.fileId)?.size ?? 0,
      url: `/api/pdf?id=${encodeURIComponent(v.fileId)}&kind=audio`,
    }));

    cache.set(driveFolderId, pistas);
    return pistas;
  } catch {
    return [];
  }
}

/** ¿Vale la pena ofrecer el mezclador? Con una sola pista no hay nada que mezclar. */
export function tieneMezclador(tracks: AudioTrack[]): boolean {
  return tracks.filter(t => t.part !== MEZCLA).length >= 2;
}

/** Cuánto pesa bajar estas pistas, para decirlo antes de gastar los datos. */
export function pesoTotal(tracks: AudioTrack[]): number {
  return tracks.reduce((n, t) => n + t.size, 0);
}

export function formatearPeso(bytes: number): string {
  if (bytes <= 0) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

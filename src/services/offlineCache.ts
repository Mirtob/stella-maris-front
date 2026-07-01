// Modo Misa offline — caché GESTIONADA POR LA APP (sin service worker que
// intercepte fetch). La señal en los templos es mala, así que guardamos los
// cantorales de la ventana próxima (datos + PDFs) para que sigan disponibles
// sin red.
//
// IMPORTANTE: no se reintroduce un SW interceptor a propósito (el sw.js está
// desactivado por problemas pasados de deploys obsoletos en caché). Aquí solo
// usamos Cache Storage explícita y localStorage.

import { PublishedCantoral } from '../types';

export const CACHE_NAME = 'stella-offline-v1';
const LS_KEY = 'offline_cantorals';

/** Deriva la URL del proxy de PDF a partir de una URL de Drive. */
function pdfProxyUrlFor(sheetMusicUrl?: string): string | null {
  if (!sheetMusicUrl) return null;
  const m = sheetMusicUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `/api/pdf?id=${m[1]}` : null;
}

/** pathname+search de una URL (para comparar absolutas vs relativas). */
function pathOf(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

/** Guarda los cantorales (JSON) y cachea sus PDFs. Best-effort: nunca lanza. */
export async function cacheCantoralsForOffline(cantorals: PublishedCantoral[]): Promise<void> {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cantorals));
  } catch {
    /* almacenamiento lleno o no disponible — ignorar */
  }

  if (typeof caches === 'undefined') return;

  try {
    const cache = await caches.open(CACHE_NAME);

    // URLs de PDF de la ventana actual
    const wanted = new Set<string>();
    for (const c of cantorals) {
      for (const s of c.songs) {
        const u = pdfProxyUrlFor(s.sheetMusicUrl);
        if (u) wanted.add(u);
      }
    }

    // Descargar las que falten (no re-descargar las ya cacheadas)
    await Promise.all(
      [...wanted].map(async (u) => {
        try {
          if (await cache.match(u)) return;
          const res = await fetch(u);
          if (res.ok) await cache.put(u, res.clone());
        } catch {
          /* best-effort */
        }
      })
    );

    // Evicción: borrar PDFs cacheados que ya no están en la ventana
    const wantedPaths = new Set([...wanted].map(pathOf));
    const keys = await cache.keys();
    await Promise.all(
      keys.map((req) => (wantedPaths.has(pathOf(req.url)) ? Promise.resolve(false) : cache.delete(req)))
    );
  } catch {
    /* ignore */
  }
}

/** Lee los cantorales guardados para uso offline. */
export function getOfflineCantorals(): PublishedCantoral[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PublishedCantoral[]) : [];
  } catch {
    return [];
  }
}

/** Devuelve un object URL del PDF cacheado, o null si no está. El llamador debe
 *  revocar el object URL cuando termine. */
export async function getOfflinePdf(url: string): Promise<string | null> {
  if (typeof caches === 'undefined') return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const res = (await cache.match(url)) || (await cache.match(pathOf(url)));
    if (!res) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

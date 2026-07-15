import type { SundayCycle } from '../utils/liturgicalCycle';
import { PSALM_INDEX_DATA } from './psalmIndex.data';

/**
 * Índice del libro de salmos musicalizados (uno por página, 3 PDF: Año A/B/C).
 *
 * Para cada ciclo y celebración guarda:
 *  - `page`     → página del PDF de ese año donde está el salmo (partitura, para el CORO).
 *  - `antiphon` → texto de la antífona/respuesta que canta el PUEBLO FIEL (solo letra).
 *
 * La CLAVE de celebración es la etiqueta litúrgica de la app (`liturgicalDate`, p. ej.
 * "5.º Domingo de Pascua"). El contenido lo llena `scripts/import-psalm-index.py` a partir
 * de la planilla que transcribe el libro. Los IDs de Drive de los 3 PDF van en PSALM_BOOKS.
 */
export interface PsalmEntry {
  page?: number;
  /** Última página si el salmo ocupa un rango (p. ej. Epifanía "18-19"). */
  pageEnd?: number;
  antiphon?: string;
}

/**
 * Alias: etiqueta del calendario de la app (`getLiturgicalDateForDate`) → clave usada en
 * la planilla del índice, cuando difieren. La mayoría de los domingos coinciden tal cual.
 */
const CELEBRATION_ALIASES: Record<string, string> = {
  'Jesucristo, Rey del Universo': '34.º Domingo T.O. — Cristo Rey',
  'Natividad del Señor': 'Natividad del Señor (Misa del día)',
  'Domingo de la Divina Misericordia (2.º de Pascua)': '2.º Domingo de Pascua',
};

/** ID de archivo de Google Drive del PDF de cada año (uno por ciclo). */
export const PSALM_BOOKS: Record<SundayCycle, { driveFileId: string }> = {
  A: { driveFileId: '177Y1H6MXqvtxsBi1VVoP60rzJu6mRwi7' }, // PDF Año A
  B: { driveFileId: '11RO4bNj2sSfr7iVPsY5WqcV2TBQZutlC' }, // PDF Año B
  C: { driveFileId: '1SxNEkB8yAvsn17NQsFAul4LbgrHu7I9v' }, // PDF Año C
};

/** ciclo → (clave de celebración → entrada). Datos generados por el importador. */
export const PSALM_INDEX: Record<SundayCycle, Record<string, PsalmEntry>> = PSALM_INDEX_DATA;

/**
 * Versión del libro de salmos: se incrementa al REEMPLAZAR los PDF en Drive, para saltar
 * la caché del CDN del proxy (`s-maxage` 24 h) y que se sirva la versión nueva de una.
 * ('lin1' = primera subida linearizada/web-optimized.)
 */
export const PSALM_BOOK_VERSION = 'lin1';

/** URL del proxy para una página del libro de salmos (con cache-buster de versión). */
export const psalmBookProxyUrl = (driveFileId: string) => `/api/pdf?id=${driveFileId}&v=${PSALM_BOOK_VERSION}`;

/** ¿Hay al menos un PDF configurado? (si no, la función está inactiva). */
export function psalmBooksReady(): boolean {
  return Object.values(PSALM_BOOKS).some((b) => !!b.driveFileId);
}

/** Normaliza una etiqueta de celebración para emparejar pese a acentos/mayúsculas/puntuación. */
const normKey = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();

// Índice normalizado por ciclo (se arma una vez, en el primer uso).
const normalizedByCycle: Partial<Record<SundayCycle, Record<string, PsalmEntry>>> = {};
function normalizedIndex(cycle: SundayCycle): Record<string, PsalmEntry> {
  if (!normalizedByCycle[cycle]) {
    const map: Record<string, PsalmEntry> = {};
    for (const [k, v] of Object.entries(PSALM_INDEX[cycle] ?? {})) map[normKey(k)] = v;
    normalizedByCycle[cycle] = map;
  }
  return normalizedByCycle[cycle]!;
}

/**
 * Resuelve el salmo del libro para una celebración: devuelve la entrada (página/antífona)
 * y el ID de Drive del PDF del ciclo. `null` si no hay dato o falta el PDF. El match es
 * exacto primero y luego normalizado (tolerante a acentos/mayúsculas/puntuación).
 */
export function resolvePsalm(cycle: SundayCycle, celebrationKey: string): (PsalmEntry & { driveFileId: string }) | null {
  const book = PSALM_BOOKS[cycle];
  if (!book?.driveFileId || !celebrationKey) return null;
  const key = CELEBRATION_ALIASES[celebrationKey] ?? celebrationKey;
  const entry = PSALM_INDEX[cycle]?.[key] ?? normalizedIndex(cycle)[normKey(key)];
  if (!entry || (entry.page == null && !entry.antiphon)) return null;
  return { ...entry, driveFileId: book.driveFileId };
}

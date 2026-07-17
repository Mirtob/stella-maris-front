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
 * Excepciones de página: celebraciones cuyo salmo está en OTRA sección del libro (con
 * numeración distinta), donde el offset no aplica. Aquí la página es la REAL del PDF
 * (el número del visor, ej. "24/151"), NO la impresa. Se ignora el pageOffset.
 * Formato: PSALM_PAGE_OVERRIDES[ciclo][clave de celebración] = { page, pageEnd? }.
 */
export const PSALM_PAGE_OVERRIDES: Record<SundayCycle, Record<string, { page: number; pageEnd?: number }>> = {
  A: {},
  B: {},
  C: {},
};

/**
 * Alias: etiqueta del calendario de la app (`getLiturgicalDateForDate`) → clave usada en
 * la planilla del índice, cuando difieren. La mayoría de los domingos coinciden tal cual.
 */
const CELEBRATION_ALIASES: Record<string, string> = {
  'Jesucristo, Rey del Universo': '34.º Domingo T.O. — Cristo Rey',
  'Natividad del Señor': 'Natividad del Señor (Misa del día)',
  'Domingo de la Divina Misericordia (2.º de Pascua)': '2.º Domingo de Pascua',
};

/**
 * ID de Drive del PDF de cada año + `pageOffset`: páginas de portada/índice ANTES de la
 * página impresa 1. El índice guarda el número IMPRESO del libro; la página real del PDF
 * = página impresa + pageOffset. (Año A verificado: impresa 93 = PDF 99 → offset 6.)
 */
export const PSALM_BOOKS: Record<SundayCycle, { driveFileId: string; pageOffset: number }> = {
  A: { driveFileId: '177Y1H6MXqvtxsBi1VVoP60rzJu6mRwi7', pageOffset: 6 }, // PDF Año A
  B: { driveFileId: '11RO4bNj2sSfr7iVPsY5WqcV2TBQZutlC', pageOffset: 5 }, // PDF Año B (impresa 1 = PDF 6)
  C: { driveFileId: '1SxNEkB8yAvsn17NQsFAul4LbgrHu7I9v', pageOffset: 5 }, // PDF Año C (impresa 1 = PDF 6)
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

/** Ciclo (A/B/C) al que pertenece un ID de Drive del libro de salmos. `null` si no coincide. */
export function cycleForBookId(driveFileId?: string): SundayCycle | null {
  if (!driveFileId) return null;
  for (const [cycle, b] of Object.entries(PSALM_BOOKS)) {
    if (b.driveFileId === driveFileId) return cycle as SundayCycle;
  }
  return null;
}

/**
 * Ruta de la IMAGEN pre-renderizada de una página del libro de salmos.
 * Las partituras escaneadas usan JBIG2 y pdf.js no las renderiza bajo la CSP estricta
 * (necesitaría 'unsafe-eval', inseguro). Por eso servimos cada página como imagen estática
 * en `public/salmos/<ciclo>/<páginaPDF>.webp` (generadas por scripts/render-salmos-webp.py).
 * `page` es la página REAL del PDF (ya con el offset aplicado por resolvePsalm).
 */
export const psalmPageImageUrl = (cycle: SundayCycle, page: number) => `/salmos/${cycle}/${page}.webp`;

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
  // Excepción: página REAL del PDF (otra sección) → sin offset.
  const override = PSALM_PAGE_OVERRIDES[cycle]?.[key];
  if (override) {
    return { antiphon: entry.antiphon, page: override.page, pageEnd: override.pageEnd, driveFileId: book.driveFileId };
  }
  // La página del índice es la IMPRESA; se suma el offset del libro para la página real del PDF.
  const off = book.pageOffset ?? 0;
  return {
    ...entry,
    page: entry.page != null ? entry.page + off : undefined,
    pageEnd: entry.pageEnd != null ? entry.pageEnd + off : undefined,
    driveFileId: book.driveFileId,
  };
}

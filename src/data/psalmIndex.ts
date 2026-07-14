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
  antiphon?: string;
}

/** ID de archivo de Google Drive del PDF de cada año (uno por ciclo). */
export const PSALM_BOOKS: Record<SundayCycle, { driveFileId: string }> = {
  A: { driveFileId: '' }, // TODO: pegar ID de Drive del PDF Año A
  B: { driveFileId: '' }, // TODO: pegar ID de Drive del PDF Año B
  C: { driveFileId: '' }, // TODO: pegar ID de Drive del PDF Año C
};

/** ciclo → (clave de celebración → entrada). Datos generados por el importador. */
export const PSALM_INDEX: Record<SundayCycle, Record<string, PsalmEntry>> = PSALM_INDEX_DATA;

/** ¿Hay al menos un PDF configurado? (si no, la función está inactiva). */
export function psalmBooksReady(): boolean {
  return Object.values(PSALM_BOOKS).some((b) => !!b.driveFileId);
}

/**
 * Resuelve el salmo del libro para una celebración: devuelve la entrada (página/antífona)
 * y el ID de Drive del PDF del ciclo. `null` si no hay dato o falta el PDF.
 */
export function resolvePsalm(cycle: SundayCycle, celebrationKey: string): (PsalmEntry & { driveFileId: string }) | null {
  const book = PSALM_BOOKS[cycle];
  if (!book?.driveFileId) return null;
  const entry = PSALM_INDEX[cycle]?.[celebrationKey];
  if (!entry || (entry.page == null && !entry.antiphon)) return null;
  return { ...entry, driveFileId: book.driveFileId };
}

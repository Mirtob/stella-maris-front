/**
 * Reportería del catálogo de cantos (panel del admin).
 *
 * Responde, sin tocar la BD, las preguntas con las que se ordena la subida de
 * material al canal y a Drive:
 *
 *   - ¿Cuántos cantos tengo por clasificación (la carpeta de Drive / momento)?
 *   - ¿Cuántos tienen versión ÓRGANO y cuántos versión GUITARRA?
 *   - ¿Cuáles están incompletos, es decir, les falta grabar una de las dos?
 *   - ¿Cuáles tienen la letra con acordes?
 *
 * REGLA DEL PAR: en el canal debe estar el MISMO canto en los dos instrumentos.
 * La única excepción es el canto gregoriano, que se canta a capella o con órgano
 * y no tiene versión de guitarra: le basta un video. Ver `isGregorianSong`.
 *
 * Todo es lógica pura sobre `Song[]` (lo que ya trae `listSongs`), para que la
 * planilla se complete sola a medida que se cargan cantos: no hay estado nuevo
 * que mantener ni tabla que migrar.
 */

import { Song } from '../types';
import { MOMENT_TO_CATEGORY } from './category';
import { toVideoId } from './songVideo';

/** Sin acentos, minúsculas, espacios colapsados. */
const norm = (s: string) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// ── Detección de acordes ────────────────────────────────────────────────────

// Los acordes son lo ÚNICO que va entre corchetes en la letra: el formato ligero
// (**negrita**, *cursiva*, __subrayado__, ">> centrado") evita a propósito los
// corchetes (ver utils/lyricsFormat.ts). Aun así el token debe ser un acorde
// ENTERO —nota latina (Do…Si) o americana (A–G), alteración y cifrado— para no
// contar como acorde una acotación del tipo "[Estribillo]", "[bis]" o "[Coro]",
// que empiezan por letra de nota pero siguen con texto.
const NOTE = '(?:sol|do|re|mi|fa|la|si|[a-g])(?:#|b)?';
// Cifrado admitido tras la nota: m, maj7, sus4, dim, aug, °, add9, (b5), 7/9/11…
const QUALITY = '(?:maj|min|sus|add|dim|aug|m|M|º|°|\\+|-|\\d|#|b|\\(|\\))*';
const CHORD_TOKEN = new RegExp(`\\[\\s*${NOTE}${QUALITY}(?:/${NOTE}${QUALITY})?\\s*\\]`, 'i');

/** ¿La letra de este canto trae acordes cifrados? */
export function lyricsHaveChords(lyrics?: string | null): boolean {
  return !!lyrics && CHORD_TOKEN.test(lyrics);
}

// ── Excepción gregoriana ────────────────────────────────────────────────────

/**
 * ¿Es canto gregoriano? Se marca con la etiqueta "Gregoriano" del editor de
 * cantos (esa es la forma correcta y la que conviene mantener al día); el título
 * se mira solo como red de seguridad para el material antiguo sin etiquetar.
 */
export function isGregorianSong(song: Song): boolean {
  const tagged = ((song.liturgicalSeasons as unknown as string[]) ?? [])
    .some((t) => norm(t).startsWith('gregorian'));
  return tagged || /gregorian/.test(norm(song.title));
}

// ── Fila de la planilla ─────────────────────────────────────────────────────

export type VideoStatus =
  | 'completo'        // están las dos versiones (o una, si es gregoriano)
  | 'falta-guitarra'  // está órgano, falta guitarra
  | 'falta-organo'    // está guitarra, falta órgano
  | 'solo-general'    // hay un video único sin identificar el instrumento
  | 'sin-video';      // no hay ninguna grabación

export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
  'completo':       'Completo',
  'falta-guitarra': 'Falta guitarra',
  'falta-organo':   'Falta órgano',
  'solo-general':   'Solo video único',
  'sin-video':      'Sin video',
};

export interface SongReportRow {
  id: string;
  title: string;
  /** Clasificación = parte de la Misa / carpeta de Drive (la principal, ★). */
  category: string;
  gregorian: boolean;
  hasOrgano: boolean;
  hasGuitarra: boolean;
  hasGeneral: boolean;
  videoStatus: VideoStatus;
  /** Cumple la regla del par (o es gregoriano y tiene al menos un video). */
  videoComplete: boolean;
  hasSheet: boolean;
  /** Partituras por voz detectadas en la carpeta de Drive (polifonía). */
  voices: number;
  hasLyrics: boolean;
  hasChords: boolean;
  /** Qué falta, en texto, para dar el canto por terminado. */
  missing: string[];
}

const hasVideo = (raw?: string | null): boolean => !!toVideoId(raw);

/** Convierte un canto del catálogo en su fila de la planilla. */
export function songReportRow(song: Song): SongReportRow {
  const gregorian = isGregorianSong(song);
  const hasOrgano = hasVideo(song.youtubeIdOrgano);
  const hasGuitarra = hasVideo(song.youtubeIdGuitarra);
  const hasGeneral = hasVideo(song.youtubeId);
  const anyVideo = hasOrgano || hasGuitarra || hasGeneral;

  // El gregoriano no lleva versión de guitarra: con cualquier grabación basta.
  const videoComplete = gregorian ? anyVideo : (hasOrgano && hasGuitarra);

  const videoStatus: VideoStatus =
    videoComplete            ? 'completo' :
    !anyVideo                ? 'sin-video' :
    hasOrgano && !hasGuitarra ? 'falta-guitarra' :
    hasGuitarra && !hasOrgano ? 'falta-organo' :
                               'solo-general';

  const hasSheet = !!(song.driveFileId || song.sheetMusicUrl);
  const voices = (song.sheets ?? []).length;
  const hasLyrics = !!(song.lyrics && song.lyrics.trim());
  const hasChords = lyricsHaveChords(song.lyrics);

  const missing: string[] = [];
  if (!gregorian) {
    if (!hasOrgano) missing.push('Versión órgano');
    if (!hasGuitarra) missing.push('Versión guitarra');
  } else if (!anyVideo) {
    missing.push('Video (gregoriano)');
  }
  if (!hasSheet) missing.push('Partitura');
  if (!hasLyrics) missing.push('Letra');
  else if (!hasChords) missing.push('Acordes');

  return {
    id: song.id,
    title: song.title,
    category: song.category || 'Sin clasificar',
    gregorian, hasOrgano, hasGuitarra, hasGeneral,
    videoStatus, videoComplete,
    hasSheet, voices, hasLyrics, hasChords, missing,
  };
}

// ── Totales y desglose por clasificación ────────────────────────────────────

export interface ReportTotals {
  total: number;
  organo: number;
  guitarra: number;
  /** Cantos con AMBAS versiones grabadas. */
  ambas: number;
  /** Cantos con solo el video único (sin identificar instrumento). */
  soloGeneral: number;
  sinVideo: number;
  /** Cumplen la regla del par (incluye gregorianos con un video). */
  completos: number;
  pendientes: number;
  gregorianos: number;
  conPartitura: number;
  /** Cantos polifónicos: tienen partituras por voz detectadas. */
  conVoces: number;
  conLetra: number;
  conAcordes: number;
}

export interface CategoryReport extends ReportTotals {
  /** Clasificación (parte de la Misa = carpeta de Drive). */
  category: string;
  /** PDF en la carpeta de Drive de esta clasificación (si se pudo consultar). */
  drivePdfs?: number;
  /** Carpetas de canto con partituras dentro de esa clasificación. */
  driveFolders?: number;
}

const emptyTotals = (): ReportTotals => ({
  total: 0, organo: 0, guitarra: 0, ambas: 0, soloGeneral: 0, sinVideo: 0,
  completos: 0, pendientes: 0, gregorianos: 0,
  conPartitura: 0, conVoces: 0, conLetra: 0, conAcordes: 0,
});

function accumulate(t: ReportTotals, r: SongReportRow): void {
  t.total++;
  if (r.hasOrgano) t.organo++;
  if (r.hasGuitarra) t.guitarra++;
  if (r.hasOrgano && r.hasGuitarra) t.ambas++;
  if (r.videoStatus === 'solo-general') t.soloGeneral++;
  if (r.videoStatus === 'sin-video') t.sinVideo++;
  if (r.videoComplete) t.completos++; else t.pendientes++;
  if (r.gregorian) t.gregorianos++;
  if (r.hasSheet) t.conPartitura++;
  if (r.voices > 0) t.conVoces++;
  if (r.hasLyrics) t.conLetra++;
  if (r.hasChords) t.conAcordes++;
}

export interface SongReport {
  rows: SongReportRow[];
  totals: ReportTotals;
  byCategory: CategoryReport[];
}

/**
 * Orden de la Misa para presentar las clasificaciones. Es el mismo orden en que
 * se cantan, que es como el admin piensa el catálogo (y como están las carpetas).
 */
const CATEGORY_ORDER = Object.values(MOMENT_TO_CATEGORY);

/** Planilla completa: una fila por canto, totales y desglose por clasificación. */
export function buildSongReport(songs: Song[]): SongReport {
  const rows = songs.map(songReportRow);
  const totals = emptyTotals();
  const groups = new Map<string, CategoryReport>();

  for (const r of rows) {
    accumulate(totals, r);
    let g = groups.get(r.category);
    if (!g) {
      g = { category: r.category, ...emptyTotals() };
      groups.set(r.category, g);
    }
    accumulate(g, r);
  }

  const rank = (c: string) => {
    const i = CATEGORY_ORDER.indexOf(c);
    return i === -1 ? 500 : i;
  };
  const byCategory = Array.from(groups.values())
    .sort((a, b) => (rank(a.category) - rank(b.category)) || a.category.localeCompare(b.category));

  return { rows, totals, byCategory };
}

// ── Cruce con las carpetas de Drive ─────────────────────────────────────────

export interface DriveEntryFile { id: string; name: string; mimeType?: string; path?: string; parentId?: string }
export interface DriveEntryFolder { id: string; name: string; path: string }

/** Nombre canónico de categoría por su forma normalizada ('comunion' → 'Comunión'). */
const CATEGORY_BY_KEY = new Map(Object.values(MOMENT_TO_CATEGORY).map(c => [norm(c), c]));

/**
 * Categoría de la app que corresponde a una carpeta de primer nivel de Drive.
 * En Drive las carpetas se llaman sin tilde ("Comunion") y la de salida es
 * "Salida"; el ordinario vive aparte, bajo "Misas". Lo que no se reconoce se
 * devuelve tal cual: aparece en el informe con su propio nombre, que es la
 * manera de detectar una carpeta mal nombrada.
 */
export function folderToCategory(folder: string): string {
  const key = norm(folder);
  if (key === 'salida' || key === 'final') return 'Salida';
  if (key === 'exposicion') return 'Exposición y Procesión';
  return CATEGORY_BY_KEY.get(key) ?? folder;
}

export interface DriveFolderStat {
  category: string;
  /** PDF colgando de esa clasificación (a cualquier profundidad). */
  pdfs: number;
  /** Carpetas de canto (las que tienen PDF directamente dentro). */
  folders: number;
}

/**
 * Cuenta el material que hay en Drive por clasificación, a partir de lo que
 * devuelve `/api/sheets`. El primer segmento de `path` es la carpeta del momento.
 */
export function summarizeDrive(
  files: DriveEntryFile[],
  folders: DriveEntryFolder[],
): DriveFolderStat[] {
  const isPdf = (f: DriveEntryFile) =>
    /\.pdf$/i.test(f.name) || (f.mimeType ?? '').includes('pdf');
  const top = (p?: string) => (p || '').split('/').map(s => s.trim()).filter(Boolean)[0] || '';

  const stats = new Map<string, DriveFolderStat>();
  const bump = (folder: string): DriveFolderStat => {
    const category = folderToCategory(folder);
    let s = stats.get(category);
    if (!s) { s = { category, pdfs: 0, folders: 0 }; stats.set(category, s); }
    return s;
  };

  const pdfs = files.filter(isPdf);
  for (const f of pdfs) {
    const folder = top(f.path);
    if (!folder) continue;                 // PDF suelto en la raíz: sin clasificar
    bump(folder).pdfs++;
  }

  // Carpeta de canto = la que tiene PDF directamente dentro (una obra polifónica,
  // o la carpeta del momento cuando los PDF cuelgan sin subcarpeta).
  const withPdf = new Set(pdfs.map(f => f.parentId).filter(Boolean) as string[]);
  for (const fo of folders) {
    if (!withPdf.has(fo.id)) continue;
    const folder = top(fo.path);
    if (!folder) continue;
    bump(folder).folders++;
  }

  return Array.from(stats.values()).sort((a, b) => a.category.localeCompare(b.category));
}

/** Pega los conteos de Drive al desglose por clasificación del catálogo. */
export function mergeDriveStats(byCategory: CategoryReport[], drive: DriveFolderStat[]): CategoryReport[] {
  const byName = new Map(drive.map(d => [d.category, d]));
  const merged = byCategory.map(c => {
    const d = byName.get(c.category);
    return d ? { ...c, drivePdfs: d.pdfs, driveFolders: d.folders } : c;
  });
  // Clasificaciones que existen en Drive pero todavía no tienen ningún canto
  // cargado: son justamente las que hay que subir, así que deben verse.
  const seen = new Set(byCategory.map(c => c.category));
  for (const d of drive) {
    if (seen.has(d.category)) continue;
    merged.push({ category: d.category, ...emptyTotals(), drivePdfs: d.pdfs, driveFolders: d.folders });
  }
  return merged;
}

// ── Exportación a planilla (CSV) ────────────────────────────────────────────

const CSV_HEADERS = [
  'Canto', 'Clasificación', 'Gregoriano', 'Versión órgano', 'Versión guitarra',
  'Video único', 'Estado del video', 'Partitura', 'Voces', 'Letra', 'Acordes', 'Falta',
];

const csvCell = (value: string): string =>
  /[",;\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const si = (b: boolean) => (b ? 'Sí' : 'No');

/**
 * Planilla en CSV para llevar el control fuera de la app (Excel / Sheets).
 * Separador `;` y BOM: es lo que abre bien Excel en español sin pedir nada.
 */
export function reportToCSV(rows: SongReportRow[]): string {
  const lines = [CSV_HEADERS.join(';')];
  for (const r of rows) {
    lines.push([
      r.title,
      r.category,
      si(r.gregorian),
      si(r.hasOrgano),
      si(r.hasGuitarra),
      si(r.hasGeneral),
      VIDEO_STATUS_LABEL[r.videoStatus],
      si(r.hasSheet),
      String(r.voices),
      si(r.hasLyrics),
      si(r.hasChords),
      r.missing.join(' + ') || '—',
    ].map(csvCell).join(';'));
  }
  return '﻿' + lines.join('\r\n');
}

// ── Filtros de la planilla ──────────────────────────────────────────────────

export type ReportFilter =
  | 'todos' | 'pendientes' | 'falta-organo' | 'falta-guitarra' | 'solo-general'
  | 'sin-video' | 'sin-partitura' | 'sin-acordes' | 'gregorianos';

export const REPORT_FILTER_LABEL: Record<ReportFilter, string> = {
  'todos':         'Todos',
  'pendientes':    'Pendientes',
  'falta-organo':  'Falta órgano',
  'falta-guitarra':'Falta guitarra',
  'solo-general':  'Video sin clasificar',
  'sin-video':     'Sin video',
  'sin-partitura': 'Sin partitura',
  'sin-acordes':   'Sin acordes',
  'gregorianos':   'Gregorianos',
};

export function matchesReportFilter(row: SongReportRow, filter: ReportFilter): boolean {
  switch (filter) {
    case 'todos':          return true;
    case 'pendientes':     return !row.videoComplete;
    // "Falta órgano/guitarra" no aplica al gregoriano: no se le exige el par.
    case 'falta-organo':   return !row.gregorian && !row.hasOrgano;
    case 'falta-guitarra': return !row.gregorian && !row.hasGuitarra;
    // Tiene grabación pero nadie sabe con qué instrumento: hay que mover el ID
    // al campo de órgano o de guitarra para que cada corista vea la suya.
    case 'solo-general':   return row.videoStatus === 'solo-general';
    case 'sin-video':      return row.videoStatus === 'sin-video';
    case 'sin-partitura':  return !row.hasSheet;
    case 'sin-acordes':    return !row.hasChords;
    case 'gregorianos':    return row.gregorian;
  }
}

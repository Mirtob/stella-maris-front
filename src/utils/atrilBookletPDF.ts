import { jsPDF } from 'jspdf';
import { Song, InstrumentType } from '../types';
import { getDrivePdfProxyUrl } from './driveProxy';
import { sortByMassOrder } from './ordinary';
import { transposeContent, getChordNotation } from './chordTranspose';
import { getOfflinePdf } from '../services/offlineCache';

// =============================================================================
// Cuadernillo imprimible del Modo Atril.
// - Formato LIBRO (cuadernillo plegable): carta HORIZONTAL, 2 páginas media-carta
//   por cara, con orden de IMPOSICIÓN. Se imprime a doble faz (voltear por el borde
//   largo) y se dobla al medio → queda un librito media carta.
// - Contenido según instrumento: Guitarra = letra con acordes; Órgano = partituras.
// La imposición es AGNÓSTICA al contenido: cada "página lógica" se rasteriza a imagen
// y se coloca 2-por-hoja, así sirve igual para letra o para partituras.
// =============================================================================

const WORKER_URL = '/pdf.worker.min.mjs';

// Media carta (portrait) en mm — la "página lógica" del cuadernillo.
const HALF_W = 139.7;   // 5.5"
const HALF_H = 215.9;   // 8.5"
// Carta horizontal (landscape) — la hoja física (2 páginas lógicas por cara).
const SHEET_W = 279.4;  // 11"
const SHEET_H = 215.9;  // 8.5"

/** Solo Latin-1 (jsPDF con fuentes estándar). */
function clean(t: string): string {
  return (t || '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\x00-\xFF]/g, '');
}

// ── pdfjs: renderiza cada página de un PDF (URL) a imagen (dataURL) ──
async function renderPdfToImages(url: string, targetWpx = 1000): Promise<string[]> {
  let pdfjsLib: any;
  try {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
  } catch {
    return [];
  }
  const load = async (u: string) => (await pdfjsLib.getDocument({ url: u }).promise);
  let doc: any;
  try {
    doc = await load(url);
  } catch {
    // Fallback offline (partitura cacheada).
    const off = await getOfflinePdf(url).catch(() => null);
    if (!off) return [];
    try { doc = await load(off); } catch { return []; }
  }
  const images: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = targetWpx / base.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.82));
  }
  return images;
}

/** Quita los acordes entre corchetes y las líneas que son SOLO acordes. */
function stripChords(lyrics: string): string {
  return lyrics
    .split('\n')
    .map((line) => line.replace(/\[[^\]]*\]/g, ''))
    // Descartar líneas que quedaron con puros acordes sueltos (Sol Re Lam…)
    .filter((line) => {
      const t = line.trim();
      if (!t) return true; // conservar líneas en blanco (separan estrofas)
      const tokens = t.split(/\s+/);
      const chordLike = /^[A-G]([#b])?(m|maj|min|dim|aug|sus|add)?[0-9]*(\/[A-G][#b]?)?$/i;
      const latinLike = /^(Do|Re|Mi|Fa|Sol|La|Si)/i;
      return !tokens.every((tok) => chordLike.test(tok) || latinLike.test(tok));
    })
    .join('\n');
}

// ── Genera un PDF media-carta con la LETRA de los cantos (con o sin acordes) ──
function buildLyricsBlob(
  songs: Song[],
  opts: { withChords: boolean; notation: ReturnType<typeof getChordNotation> }
): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [HALF_W, HALF_H] });
  const M = 10;
  let y = M;
  const need = (h: number) => { if (y + h > HALF_H - M) { doc.addPage(); y = M; } };
  const chordRegex = /\[([^\]]+)\]/g;

  songs.forEach((song, si) => {
    if (si > 0) { need(10); y += 4; }
    // Título del canto (momento + título)
    need(12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(30, 58, 138);
    const titleLines = doc.splitTextToSize(`${clean(song.category)}: ${clean(song.title)}`, HALF_W - 2 * M) as string[];
    titleLines.forEach((ln) => { need(5.5); doc.text(ln, M, y); y += 5.5; });
    y += 1.5;

    const raw = song.lyrics || '';
    const lyrics = opts.withChords ? transposeContent(raw, 0, opts.notation) : stripChords(raw);
    if (!lyrics.trim()) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
      need(5); doc.text('(Sin letra en el catálogo)', M, y); y += 5;
      return;
    }

    for (const rawLine of lyrics.split('\n')) {
      const line = clean(rawLine.replace(/\s+$/, ''));
      if (line === '') { y += 2.4; continue; }

      if (opts.withChords && /\[[^\]]+\]/.test(line)) {
        need(8);
        // Acordes encima (monospace para que el offset calce con la letra)
        const chords: { chord: string; position: number }[] = [];
        chordRegex.lastIndex = 0;
        let m; while ((m = chordRegex.exec(line)) !== null) chords.push({ chord: m[1], position: m.index });
        doc.setFont('courier', 'bold'); doc.setFontSize(9); doc.setTextColor(30, 58, 138);
        chords.forEach(({ chord, position }) => {
          const before = line.substring(0, position).replace(/\[[^\]]+\]/g, '');
          const xo = doc.getTextWidth(before);
          doc.text(clean(chord), M + xo, y);
        });
        y += 3.4;
        doc.setFont('courier', 'normal'); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
        doc.text(line.replace(/\[[^\]]+\]/g, ''), M, y); y += 4.6;
      } else {
        // Letra sola: helvetica, con wrap por si la línea es larga en media carta.
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20, 20, 20);
        const wrapped = doc.splitTextToSize(line, HALF_W - 2 * M) as string[];
        wrapped.forEach((wl) => { need(5); doc.text(wl, M, y); y += 5; });
      }
    }
  });

  return doc.output('blob');
}

// ── Orden de imposición de cuadernillo (n múltiplo de 4). Cada par = [izq, der]
//    de una CARA (página del PDF final). Números de página lógicos 1-indexados. ──
function bookletPairs(n: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let s = 0; s < n / 4; s++) {
    pairs.push([n - 2 * s, 1 + 2 * s]);       // cara frontal de la hoja s
    pairs.push([2 + 2 * s, n - 1 - 2 * s]);   // cara trasera
  }
  return pairs;
}

// ── Coloca las imágenes 2-por-hoja (carta horizontal) en orden de cuadernillo ──
function imposeBooklet(images: string[]): Blob {
  // Padear a múltiplo de 4 con páginas en blanco.
  const n = Math.max(4, Math.ceil(images.length / 4) * 4);
  const pad = 4; // margen dentro de cada media-hoja (mm)

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pairs = bookletPairs(n);

  const placeAt = (img: string | null, xHalf: number) => {
    if (!img) return;
    // Área disponible de la media-hoja
    const areaX = xHalf + pad, areaY = pad, areaW = HALF_W - 2 * pad, areaH = SHEET_H - 2 * pad;
    const props = doc.getImageProperties(img);
    const ar = props.width / props.height;
    let w = areaW, h = w / ar;
    if (h > areaH) { h = areaH; w = h * ar; }
    const x = areaX + (areaW - w) / 2;
    const yy = areaY + (areaH - h) / 2;
    doc.addImage(img, 'JPEG', x, yy, w, h, undefined, 'FAST');
  };

  pairs.forEach(([leftNum, rightNum], idx) => {
    if (idx > 0) doc.addPage('letter', 'landscape');
    placeAt(images[leftNum - 1] ?? null, 0);
    placeAt(images[rightNum - 1] ?? null, HALF_W);
  });

  return doc.output('blob');
}

/** Ordena los cantos como en la Misa y arma la lista de imágenes de página lógica.
 *  `withChords`: true = letra con acordes (coro); false = solo letra (folleto). */
async function pagesFor(songs: Song[], instrument: InstrumentType | undefined, withChords: boolean): Promise<string[]> {
  const ordered = sortByMassOrder(songs);
  const notation = getChordNotation();
  const isOrgano = instrument === 'Órgano';

  if (!isOrgano) {
    // Un solo PDF de letra (con o sin acordes) → imágenes.
    const url = URL.createObjectURL(buildLyricsBlob(ordered, { withChords, notation }));
    try { return await renderPdfToImages(url); } finally { URL.revokeObjectURL(url); }
  }

  // Órgano: partitura por canto; si un canto no tiene, cae a su letra con acordes.
  const images: string[] = [];
  for (const song of ordered) {
    const proxy = song.sheetMusicUrl ? getDrivePdfProxyUrl(song.sheetMusicUrl) : null;
    if (proxy) {
      images.push(...(await renderPdfToImages(proxy)));
    } else {
      const url = URL.createObjectURL(buildLyricsBlob([song], { withChords: true, notation }));
      try { images.push(...(await renderPdfToImages(url))); } finally { URL.revokeObjectURL(url); }
    }
  }
  return images;
}

export interface BookletOptions {
  songs: Song[];
  instrument?: InstrumentType;
}

/** Cuadernillo del Modo Atril (según instrumento: acordes o partituras). */
export async function generateAtrilBooklet(opts: BookletOptions): Promise<{ blob: Blob; url: string }> {
  const images = await pagesFor(opts.songs, opts.instrument, /* withChords */ true);
  const blob = imposeBooklet(images);
  return { blob, url: URL.createObjectURL(blob) };
}

/** Cuadernillo del CANTORAL (folleto del Pueblo fiel): solo letra, formato libro. */
export async function generateCantoralBooklet(songs: Song[]): Promise<{ blob: Blob; url: string }> {
  const images = await pagesFor(songs, undefined, /* withChords */ false);
  const blob = imposeBooklet(images);
  return { blob, url: URL.createObjectURL(blob) };
}

/** Cuadernillo del CORO (Full Score): por cada canto, su letra con acordes seguida de
 *  su partitura (si tiene), en orden de Misa y en formato libro. */
export async function generateChoirBooklet(songs: Song[]): Promise<{ blob: Blob; url: string }> {
  const ordered = sortByMassOrder(songs);
  const notation = getChordNotation();
  const images: string[] = [];
  for (const song of ordered) {
    // 1) Letra con acordes del canto.
    const lurl = URL.createObjectURL(buildLyricsBlob([song], { withChords: true, notation }));
    try { images.push(...(await renderPdfToImages(lurl))); } finally { URL.revokeObjectURL(lurl); }
    // 2) Partitura del canto (si tiene), justo después.
    const proxy = song.sheetMusicUrl ? getDrivePdfProxyUrl(song.sheetMusicUrl) : null;
    if (proxy) images.push(...(await renderPdfToImages(proxy)));
  }
  const blob = imposeBooklet(images);
  return { blob, url: URL.createObjectURL(blob) };
}

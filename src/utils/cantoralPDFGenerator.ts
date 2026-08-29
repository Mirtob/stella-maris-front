import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { PublishedCantoral, Song } from '../types';
import { getCurrentLiturgicalSeason } from './liturgicalSeason';
import { parseYmdLocal, formatYmdForDisplay } from './dateLocal';
import { recortarConElipsis } from './pdfText';
import { getChannelUrl } from '../services/youtube';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';
import { getGarland } from '../data/garlands';
import { getPdfFont, getPdfScale } from '../data/pdfStyle';
import { renderPdfToImages, imposeBooklet } from './atrilBookletPDF';
import { repartirEnColumnas, type Pieza } from './pdfColumns';
import { sortCategoriesByMassOrder } from './ordinary';

interface PDFGeneratorOptions {
  cantoral: PublishedCantoral;
  /** Si es false, no descarga el archivo: solo devuelve el blob (para previsualizar). */
  download?: boolean;
  /**
   * Si es true, el mismo folleto decorado (portada + guirnaldas + cabeceras de sección
   * + colores litúrgicos + QR) se entrega IMPUESTO como cuadernillo: cada página carta
   * se rasteriza y se coloca 2-por-cara en carta HORIZONTAL, en orden de imposición.
   * Se imprime a doble faz (voltear por el borde largo) y se dobla al medio → librito.
   */
  booklet?: boolean;
}

/** Descarga un blob con el nombre dado (para el cuadernillo, que no es el `pdf` de jsPDF). */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // El object URL se libera tras dar tiempo al navegador a iniciar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

interface GarlandImg { dataUrl: string; w: number; h: number }

/** Carga el logo recortado en CÍRCULO (con fondo transparente), listo para addImage. */
async function loadCircularLogo(src: string): Promise<{ dataUrl: string; size: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const side = Math.min(img.naturalWidth, img.naturalHeight) || 1;
        const canvas = document.createElement('canvas');
        canvas.width = side;
        canvas.height = side;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.beginPath();
        ctx.arc(side / 2, side / 2, side / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);
        resolve({ dataUrl: canvas.toDataURL('image/png'), size: side });
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Carga una imagen y resuelve cuando está lista (o null si falla). */
async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Convierte el fondo casi-blanco de una cenefa en transparente (recorte por
 * luminancia), conservando los colores naturales del adorno. Así la guirnalda se
 * compone limpia sobre la hoja y la caja blanca del título "corta" el dibujo dejando
 * el centro en blanco.
 */
function clipWhite(img: HTMLImageElement): GarlandImg | null {
  const sw = img.naturalWidth, sh = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, sw, sh);
  try {
    const data = ctx.getImageData(0, 0, sw, sh);
    const a = data.data;
    for (let i = 0; i < a.length; i += 4) {
      const lum = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2];
      if (lum > 240) a[i + 3] = 0;
      else if (lum > 215) a[i + 3] = Math.round(a[i + 3] * (240 - lum) / 25);
    }
    ctx.putImageData(data, 0, 0);
  } catch {
    // Si el canvas quedara "tainted", se entrega sin recorte (luce bien igual).
  }
  return { dataUrl: canvas.toDataURL('image/png'), w: sw, h: sh };
}

/**
 * Dibuja media guirnalda sencilla (cenefa de laurel fina y poco invasiva) entre el
 * borde de la hoja (xOuter) y el costado del título (xInner), centrada en midY.
 * Trazo del mismo color que la letra de los cantos. Se usa en los separadores de
 * sección: a 1.2 cm de grosor y a todo el ancho la imagen se distorsionaría, así que
 * en su lugar trazamos esta cenefa vectorial con el título del momento al centro.
 */
function drawSideGarland(
  pdf: any,
  xOuter: number,
  xInner: number,
  midY: number,
  color: [number, number, number],
) {
  const span = xInner - xOuter; // con signo: + si el título está a la derecha
  if (Math.abs(span) < 6) return; // sin espacio suficiente: no dibujar
  const dir = Math.sign(span); // hacia dónde queda el título
  pdf.setDrawColor(color[0], color[1], color[2]);
  pdf.setFillColor(color[0], color[1], color[2]);
  pdf.setLineWidth(0.3);
  // Tallo central
  pdf.line(xOuter, midY, xInner, midY);
  // Pares de hojas a lo largo del tallo (motivo de laurel), inclinadas hacia el título
  const leaves = 3;
  const lf = 1.8; // largo de cada hoja
  for (let k = 1; k <= leaves; k++) {
    const t = k / (leaves + 1);
    const x = xOuter + span * t;
    pdf.line(x, midY, x + dir * lf, midY - lf * 0.8);
    pdf.line(x, midY, x + dir * lf, midY + lf * 0.8);
  }
  // Pequeña baya de remate junto al título y en el extremo exterior
  pdf.circle(xInner, midY, 0.7, 'F');
  pdf.circle(xOuter, midY, 0.5, 'F');
}

/**
 * Dibuja una línea de texto JUSTIFICADA a un ancho fijo, repartiendo el sobrante de
 * forma pareja entre las palabras. No estira líneas de una sola palabra. El texto
 * queda SIEMPRE dentro del ancho indicado, sea cual sea el tamaño de letra elegido.
 */
function drawJustifiedLine(pdf: any, text: string, x: number, y: number, width: number) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    pdf.text(text, x, y);
    return;
  }
  const widths = words.map((w) => pdf.getTextWidth(w));
  const wordsW = widths.reduce((a, b) => a + b, 0);
  const gap = (width - wordsW) / (words.length - 1);
  let cx = x;
  words.forEach((w, i) => {
    pdf.text(w, cx, y);
    cx += widths[i] + gap;
  });
}


// ──────────────────────────────────────────────
// Colores litúrgicos
// ──────────────────────────────────────────────

interface LiturgicalColors {
  primary: [number, number, number];   // color principal (cabeceras, líneas)
  light: [number, number, number];     // fondo claro
  textOnPrimary: [number, number, number]; // texto sobre primary
  seasonName: string;
}

function getColorsForDate(dateStr: string): LiturgicalColors {
  // Local, no UTC: en el borde de un tiempo litúrgico el color se iba al anterior.
  const date = parseYmdLocal(dateStr);
  const season = getCurrentLiturgicalSeason(date);

  switch (season) {
    case 'Adviento':
      return { primary: [91, 33, 182], light: [237, 233, 254], textOnPrimary: [255, 255, 255], seasonName: 'Adviento' };
    case 'Navidad':
      return { primary: [180, 130, 32], light: [254, 243, 199], textOnPrimary: [255, 255, 255], seasonName: 'Navidad' };
    case 'Cuaresma':
      return { primary: [88, 28, 135], light: [233, 213, 255], textOnPrimary: [255, 255, 255], seasonName: 'Cuaresma' };
    case 'Pascua':
      return { primary: [217, 119, 6], light: [254, 243, 199], textOnPrimary: [255, 255, 255], seasonName: 'Pascua' };
    case 'Tiempo Ordinario':
    default:
      return { primary: [21, 128, 61], light: [220, 252, 231], textOnPrimary: [255, 255, 255], seasonName: 'Tiempo Ordinario' };
  }
}

// ──────────────────────────────────────────────
// Limpieza de texto
// ──────────────────────────────────────────────

/**
 * jsPDF (fuentes default) solo soporta Latin-1.
 * Eliminar/reemplazar todo lo que rompe: emojis, comillas tipográficas, guiones largos, etc.
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    // Comillas tipográficas → simples
    .replace(/[“”‘’]/g, '"')
    .replace(/[‘’]/g, "'")
    // Guiones largos → guión simple
    .replace(/[–—―]/g, '-')
    // Puntos suspensivos
    .replace(/…/g, '...')
    // Eliminar emojis y símbolos no-Latin-1 (mantiene tildes y eñes)
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    // Espacios no estándar → espacio normal
    .replace(/[  -​]/g, ' ')
    .trim();
}

/**
 * Limpia la letra del canto:
 * - Elimina acordes inline tipo [Am], [G7], [Em/B]
 * - Elimina líneas que son solo acordes (ej: "G  D  Em  C")
 * - Elimina secciones explícitas como (Repetir Coro), (Bis)
 * - Mantiene marcas tipo "Coro:", "Estrofa 1:" en su propia línea
 */
// Token de acorde, en notación AMERICANA (A-G) o LATINA (Do, Re, Mi, Fa, Sol, La,
// Si). Ej: Am, G/B, C#m7, Sol, Lam, Re7, Do/Mi. Sensible a mayúsculas a propósito:
// los acordes van capitalizados, así no confundimos palabras como "si"/"la"/"mi"/"sol".
const NOTE = '([A-G]|Do|Re|Mi|Fa|Sol|La|Si)';
const CHORD_TOKEN = new RegExp(
  `^${NOTE}[#b]?(maj|min|m|sus|dim|aug|add)?[0-9]?(\\/${NOTE}[#b]?)?$`
);

// ──────────────────────────────────────────────
// Formato de letra en el folleto: **negrita**, *cursiva*, __subrayado__, ">> " centrado.
// Los cantos SIN marcadores siguen el camino justificado de siempre (no se tocan).
// ──────────────────────────────────────────────

interface StyledWord { t: string; b: boolean; i: boolean; u: boolean }

/** ¿La línea trae marcadores de formato? (para no tocar los cantos sin formato). */
function hasLyricFormatting(line: string): boolean {
  return /^\s*>>\s?/.test(line) || /\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*/.test(line);
}

/** Descompone una línea en centrado + runs con estilo (**b**, *i*, __u__). */
function parseRuns(raw: string): { centered: boolean; runs: StyledWord[] } {
  let text = raw.replace(/^\s+/, '');
  let centered = false;
  if (/^>>\s?/.test(text)) { centered = true; text = text.replace(/^>>\s?/, ''); }
  const runs: StyledWord[] = [];
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ t: text.slice(last, m.index), b: false, i: false, u: false });
    if (m[2] != null) runs.push({ t: m[2], b: true, i: false, u: false });        // **negrita**
    else if (m[3] != null) runs.push({ t: m[3], b: false, i: false, u: true });   // __subrayado__
    else if (m[4] != null) runs.push({ t: m[4], b: false, i: true, u: false });   // *cursiva*
    last = re.lastIndex;
  }
  if (last < text.length) runs.push({ t: text.slice(last), b: false, i: false, u: false });
  return { centered, runs };
}

function styleFont(pdf: any, b: boolean, i: boolean) {
  pdf.setFont('helvetica', b && i ? 'bolditalic' : b ? 'bold' : i ? 'italic' : 'normal');
}

/** Parte los runs en palabras con estilo y las envuelve al ancho dado. */
function wrapStyledRuns(pdf: any, runs: StyledWord[], width: number): StyledWord[][] {
  const words: StyledWord[] = [];
  for (const r of runs) {
    for (const p of r.t.split(/\s+/)) if (p) words.push({ ...r, t: p });
  }
  styleFont(pdf, false, false);
  const sw = pdf.getTextWidth(' ');
  const lines: StyledWord[][] = [];
  let cur: StyledWord[] = [];
  let curW = 0;
  for (const w of words) {
    styleFont(pdf, w.b, w.i);
    const ww = pdf.getTextWidth(w.t);
    const add = cur.length ? sw + ww : ww;
    if (cur.length && curW + add > width) { lines.push(cur); cur = [w]; curW = ww; }
    else { cur.push(w); curW += add; }
  }
  if (cur.length) lines.push(cur);
  return lines.length ? lines : [[]];
}

/** Dibuja líneas ya envueltas (izquierda o centradas) y devuelve la nueva Y. */
function drawStyledLines(pdf: any, lines: StyledWord[][], x: number, yStart: number, width: number, centered: boolean, lineAdv: number): number {
  let y = yStart;
  styleFont(pdf, false, false);
  const sw = pdf.getTextWidth(' ');
  for (const line of lines) {
    let lw = 0;
    line.forEach((w, idx) => { styleFont(pdf, w.b, w.i); lw += pdf.getTextWidth(w.t) + (idx ? sw : 0); });
    let cx = centered ? x + Math.max(0, (width - lw) / 2) : x;
    for (let idx = 0; idx < line.length; idx++) {
      const w = line[idx];
      if (idx) cx += sw;
      styleFont(pdf, w.b, w.i);
      pdf.text(w.t, cx, y);
      const ww = pdf.getTextWidth(w.t);
      if (w.u) { pdf.setLineWidth(0.3); pdf.line(cx, y + 0.9, cx + ww, y + 0.9); }
      cx += ww;
    }
    y += lineAdv;
  }
  styleFont(pdf, false, false);
  return y;
}

function cleanLyrics(lyrics: string): string {
  if (!lyrics) return '';

  // NOTA: se CONSERVAN los marcadores de formato (**negrita**, *cursiva*, __subrayado__,
  // ">> " centrado); el dibujo del folleto los interpreta (ver parseRuns/drawStyledLines).
  // Quitar acordes inline entre corchetes (cualquier notación): [Sol] [La m] [C#m7] [Re/Fa#]
  let cleaned = lyrics.replace(/\[[^\]]*\]/g, '');

  // Procesar línea por línea
  const lines = cleaned.split('\n').map(line => {
    const stripped = line.trim();
    if (!stripped) return '';

    // Si la línea es solo acordes (sueltos, sin corchetes), eliminarla.
    // Patrón: "Sol  Re  Lam  Do" → toda la línea son acordes
    const tokens = stripped.split(/\s+/);
    const isChordLine = tokens.length > 0 && tokens.every(t => CHORD_TOKEN.test(t));
    if (isChordLine) return '';

    return line;
  });

  // Compactar líneas vacías consecutivas → máximo una
  const result: string[] = [];
  let lastEmpty = false;
  for (const line of lines) {
    const isEmpty = line.trim() === '';
    if (isEmpty && lastEmpty) continue;
    result.push(line);
    lastEmpty = isEmpty;
  }

  return cleanText(result.join('\n').trim());
}

// ──────────────────────────────────────────────
// Generador principal
// ──────────────────────────────────────────────

export async function generateCantoralPDF(options: PDFGeneratorOptions): Promise<{ blob: Blob; url: string }> {
  const { cantoral, download = true, booklet = false } = options;
  const colors = getColorsForDate(cantoral.date);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  // Fuente y tamaño editables por el usuario (elegidos al publicar). El tamaño es un
  // factor de escala aplicado a TODO el PDF: fuentes y espaciados. Por defecto la letra
  // va más grande ("Grande"). Interceptamos setFontSize/setFont de esta instancia para
  // escalar y forzar la familia elegida sin tener que tocar cada llamada del documento.
  const fontFamily = getPdfFont(cantoral.pdfFont).jsFont;
  // `scale` NO es constante: el cuerpo del folleto se rearma con una escala menor si
  // con la elegida no cabría en una sola hoja (ver "ajuste a una hoja" más abajo). La
  // portada se dibuja antes, siempre con la escala elegida por quien publica.
  const escalaBase = getPdfScale(cantoral.pdfSize);
  let scale = escalaBase;
  const adv = (n: number) => n * scale; // escala los avances verticales (interlineado)
  const _setFontSize = pdf.setFontSize.bind(pdf);
  (pdf as any).setFontSize = (size: number) => _setFontSize(size * scale);
  const _setFont = pdf.setFont.bind(pdf);
  (pdf as any).setFont = (_family: string, style?: string) => _setFont(fontFamily, style);

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;              // portada
  // El cuerpo aprovecha más hoja que la portada: dos columnas de borde a borde. El
  // encabezado y el pie (que solo existen en las hojas de cantos) usan este mismo
  // margen para que las reglas acompañen a las columnas.
  const margenCuerpo = 13;
  const contentW = pageW - margenCuerpo * 2;

  let pageNum = 1;

  // Logo redondo de la app para el encabezado (si falla la carga, se usa el texto).
  const logo = await loadCircularLogo(logoStellaMaris);

  // Guirnalda elegida al publicar (colores naturales; fondo blanco → transparente).
  // En cada título se usa a todo el ancho y se "corta" al medio con una caja blanca
  // para el título; en la portada va completa, arriba y abajo del texto.
  const garlandStyle = getGarland(cantoral.garland);
  const garlandImg = await loadImage(garlandStyle.src);
  const garland = garlandImg ? clipWhite(garlandImg) : null;

  /** Recorta con «…» midiendo con la fuente y el tamaño puestos ahora (ver utils/pdfText). */
  const recortarAlAncho = (texto: string, maxW: number): string =>
    recortarConElipsis(texto, maxW, (t) => pdf.getTextWidth(t));

  // Header en cada página
  const addPageHeader = () => {
    if (logo) {
      const d = 12; // diámetro: redondo y un poco más grande
      pdf.addImage(logo.dataUrl, 'PNG', margenCuerpo, 1, d, d);
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Stella Maris', margenCuerpo, 10);
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    // El encabezado es UNA línea sobre la regla: una celebración de nombre largo
    // ("Solemnidad de …, patronos de la parroquia") se salía de la hoja y se metía
    // encima del logo. Aquí se recorta; en la portada, en cambio, se parte en varias.
    pdf.text(recortarAlAncho(cleanText(cantoral.liturgicalDate), pageW - margenCuerpo * 2 - 18),
      pageW - margenCuerpo, 10, { align: 'right' });
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(margenCuerpo, 13, pageW - margenCuerpo, 13);
  };

  // Footer en cada página
  const addPageFooter = () => {
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(margenCuerpo, pageH - 12, pageW - margenCuerpo, pageH - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    const parish = cleanText(cantoral.parishName);
    pdf.text(parish, margenCuerpo, pageH - 7);
    pdf.text(`Pág. ${pageNum}`, pageW - margenCuerpo, pageH - 7, { align: 'right' });
  };

  // ─── PORTADA ───
  // Guirnalda completa arriba y abajo; todo el texto centrado horizontal y
  // verticalmente en el espacio entre ambas.
  // parseYmdLocal, no new Date(): 'YYYY-MM-DD' se parsea como medianoche UTC y en
  // Chile (UTC-4) eso cae el día anterior — la portada salía con la fecha de ayer.
  const formattedDate = formatYmdForDisplay(cantoral.date);

  let coverTop = margin;
  let coverBottom = pageH - margin;
  if (garland) {
    const gW = pageW;
    const gH = gW * (garland.h / garland.w);
    pdf.addImage(garland.dataUrl, 'PNG', 0, 16, gW, gH, 'garland', 'FAST');
    pdf.addImage(garland.dataUrl, 'PNG', 0, pageH - 16 - gH, gW, gH, 'garland', 'FAST');
    coverTop = 16 + gH;
    coverBottom = pageH - 16 - gH;
  }

  type CoverLine = { t: string; s: number; b: boolean; c: [number, number, number]; h: number };
  const coverLines: CoverLine[] = ([
    { t: 'Cantoral de la Misa', s: 24, b: true, c: colors.primary, h: 14 },
    { t: `Tiempo: ${colors.seasonName}`, s: 11, b: false, c: colors.primary, h: 9 },
    { t: cleanText(cantoral.liturgicalDate), s: 16, b: false, c: [80, 80, 80], h: 11 },
    { t: cleanText(formattedDate), s: 12, b: false, c: [100, 100, 100], h: 9 },
    { t: cleanText(cantoral.massTime), s: 14, b: true, c: [60, 60, 60], h: 14 },
    { t: cleanText(cantoral.parishName), s: 12, b: false, c: [80, 80, 80], h: 8 },
    { t: cantoral.choirName ? `Coro: ${cleanText(cantoral.choirName)}` : '', s: 11, b: false, c: [80, 80, 80], h: 8 },
  ] as CoverLine[]).filter(l => l.t.trim() !== '');

  // Cada línea se parte en las que hagan falta para no salirse de la hoja: el nombre
  // de una celebración puede ser largo ("Solemnidad de …, patronos de la parroquia") y
  // antes se escribía de corrido, pasándose de los dos bordes. Se mide con la fuente y
  // el tamaño de esa línea, que es lo que decide dónde corta.
  const anchoUtil = pageW - margin * 2;
  const lineasPortada = coverLines.flatMap((l) => {
    pdf.setFont('helvetica', l.b ? 'bold' : 'normal');
    pdf.setFontSize(l.s);
    const partes = pdf.splitTextToSize(l.t, anchoUtil) as string[];
    return partes.map(t => ({ ...l, t }));
  });

  const totalH = lineasPortada.reduce((s, l) => s + adv(l.h), 0);
  let cy = coverTop + Math.max(0, (coverBottom - coverTop - totalH) / 2);
  for (const line of lineasPortada) {
    pdf.setFont('helvetica', line.b ? 'bold' : 'normal');
    pdf.setFontSize(line.s);
    pdf.setTextColor(...line.c);
    pdf.text(line.t, pageW / 2, cy + adv(line.h) * 0.72, { align: 'center' });
    cy += adv(line.h);
  }

  // ─── CUERPO DEL FOLLETO: DOS COLUMNAS CONTINUAS ───
  //
  // Estructura tomada del folleto impreso de la parroquia: la portada va sola y todo
  // lo demás cae en un flujo de dos columnas que llena la hoja de arriba abajo —se
  // baja por la columna izquierda y se sigue por la derecha, como un periódico—, de
  // modo que el cantoral entero quepa en una sola hoja.
  //
  // Antes las dos columnas eran POR CANTO (estrofa 1 izquierda, 2 derecha, y la fila
  // avanzaba según la más alta): cada estrofa corta dejaba un hueco al lado, los
  // títulos y las guirnaldas ocupaban el ancho completo, y un cantoral normal se iba
  // a tres o cuatro hojas.

  // Agrupar cantos por parte de la misa
  const byCategory = cantoral.songs.reduce((acc, song) => {
    if (!acc[song.category]) acc[song.category] = [];
    acc[song.category].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  // Orden litúrgico desde utils/ordinary (fuente única). Con la lista local que había
  // aquí, una parte que no estuviera en ella (las de la Vigilia Pascual, o el rótulo
  // "Aclamación al Evangelio" de Cuaresma) daba indexOf = -1 y se imprimía ANTES de
  // la Entrada. Ahora lo desconocido va al final.
  const sortedCategories = sortCategoriesByMassOrder(Object.keys(byCategory));

  // Marcas de sección dentro de la letra ("Coro:", "Estrofa 2", etc.).
  const SECTION_RE = /^(Coro|Estrofa\s*\d*|Puente|Final|Refrán|Recitativo)\s*:?\s*$/i;

  // Geometría de la caja de texto: entre la regla del encabezado y la del pie.
  const colTop = 17;
  const colBottom = pageH - 14;
  const gutter = 7;                              // canal entre columnas
  const colW = (contentW - gutter) / 2;
  const colX = [margenCuerpo, margenCuerpo + colW + gutter];

  // QR del canal: se arma antes para poder incluirlo en la medición (así nunca es él
  // quien obliga a abrir una hoja más).
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(getChannelUrl(), { margin: 0, width: 240 });
  } catch {
    // Si falla la generación del QR, el folleto se entrega igual.
  }

  // Parte la letra en estrofas: bloques de líneas separados por líneas en blanco.
  const parseStanzas = (lyrics: string): string[][] => {
    const stanzas: string[][] = [];
    let cur: string[] = [];
    for (const raw of lyrics.split('\n')) {
      const l = raw.replace(/\s+$/, '');
      if (l === '') { if (cur.length) { stanzas.push(cur); cur = []; } }
      else cur.push(l);
    }
    if (cur.length) stanzas.push(cur);
    return stanzas;
  };

  /**
   * Una pieza del flujo (un encabezado, un título, UNA línea de letra, un separador…).
   * Se mide al construirla y se dibuja donde el empaquetador decida.
   */
  interface Elem extends Pieza {
    /** Pinta la pieza con el borde superior en (x, y) y ancho w. */
    draw: (x: number, y: number, w: number) => void;
    /** Piezas que viajan juntas: un encabezado con su primer canto, un título con
     *  las primeras líneas de su letra. Si el grupo entero no cabe en lo que resta de
     *  columna, se salta ANTES — así no queda un rótulo colgando al pie. */
    grupo?: string;
    /** Es aire de separación: se omite si cae justo al empezar una columna. */
    espacio?: boolean;
  }

  // Interlineado de la letra (mm antes de escalar). El ajuste a una hoja lo aprieta un
  // punto antes que achicar la letra: leer apretado cuesta menos que leer chico.
  let interlineado = 5.5;

  /** Arma todo el cuerpo con la escala y el interlineado vigentes. Se rehace al ajustar. */
  const construirElementos = (): Elem[] => {
    const els: Elem[] = [];
    const LH = adv(interlineado);
    const BASE = adv(4);        // de borde superior de la pieza a la línea base del texto

    const espacio = (h: number) => els.push({ h, draw: () => {}, espacio: true });

    // Encabezado de parte de la Misa: rótulo en color litúrgico con una cenefa a cada
    // lado, dentro del ancho de la columna (la guirnalda a hoja completa no cabe en un
    // flujo de dos columnas y costaba media hoja de alto).
    const encabezado = (label: string) => {
      const texto = cleanText(label).toUpperCase();
      const h = adv(8);
      els.push({
        h,
        draw: (x, y, w) => {
          pdf.setFont('helvetica', 'bold');
          let fs = 10.5;
          pdf.setFontSize(fs);
          while (pdf.getTextWidth(texto) > w - adv(16) && fs > 7) { fs -= 0.5; pdf.setFontSize(fs); }
          pdf.setTextColor(...colors.primary);
          const midY = y + h / 2;
          pdf.text(texto, x + w / 2, midY, { align: 'center', baseline: 'middle' });
          const tw = pdf.getTextWidth(texto);
          const hueco = adv(3);
          drawSideGarland(pdf, x, x + w / 2 - tw / 2 - hueco, midY, colors.primary);
          drawSideGarland(pdf, x + w, x + w / 2 + tw / 2 + hueco, midY, colors.primary);
        },
      });
    };

    // Título del canto: centrado, en cursiva negrita, con el autor entre paréntesis
    // en la misma línea — como en el folleto impreso ("Hija de Sión (L. Deiss)").
    const titulo = (song: Song) => {
      const texto = cleanText(song.title) + (song.author ? ` (${cleanText(song.author)})` : '');
      pdf.setFont('helvetica', 'bolditalic');
      pdf.setFontSize(11);
      const lineas = pdf.splitTextToSize(texto, colW) as string[];
      const paso = adv(5.8);
      els.push({
        h: lineas.length * paso + adv(1.5),
        draw: (x, y, w) => {
          pdf.setFont('helvetica', 'bolditalic');
          pdf.setFontSize(11);
          pdf.setTextColor(40, 40, 40);
          lineas.forEach((l, i) => pdf.text(l, x + w / 2, y + BASE + i * paso, { align: 'center' }));
        },
      });
    };

    // Una línea de letra = una pieza. Que el corte entre columnas caiga a mitad de una
    // estrofa es lo normal en un folleto impreso, y es lo que permite llenar la hoja.
    const lineasDeEstrofa = (estrofa: string[]) => {
      for (const raw of estrofa) {
        const line = raw.replace(/\s+$/, '');

        if (SECTION_RE.test(line.trim())) {
          const marca = line.trim();
          els.push({
            h: adv(6),
            draw: (x, y) => {
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(10.5);
              pdf.setTextColor(80, 80, 80);
              pdf.text(marca, x, y + BASE);
            },
          });
          continue;
        }

        if (hasLyricFormatting(line)) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10.5);
          const { centered, runs } = parseRuns(line);
          for (const envuelta of wrapStyledRuns(pdf, runs, colW)) {
            els.push({
              h: LH,
              draw: (x, y, w) => {
                pdf.setFontSize(10.5);
                pdf.setTextColor(40, 40, 40);
                drawStyledLines(pdf, [envuelta], x, y + BASE, w, centered, LH);
              },
            });
          }
          continue;
        }

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        const envueltas = pdf.splitTextToSize(line, colW) as string[];
        envueltas.forEach((texto, i) => {
          const ultima = i === envueltas.length - 1;
          els.push({
            h: LH,
            draw: (x, y, w) => {
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10.5);
              pdf.setTextColor(40, 40, 40);
              // Justificada salvo la última línea del párrafo (como el folleto impreso).
              if (ultima) pdf.text(texto, x, y + BASE);
              else drawJustifiedLine(pdf, texto, x, y + BASE, w);
            },
          });
        });
      }
    };

    // Separador entre cantos: regla fina partida por una crucecita, el "---+++---" del
    // folleto impreso dibujado con el trazo de la app.
    const separador = () => {
      const h = adv(7);
      els.push({
        h,
        draw: (x, y, w) => {
          const cx = x + w / 2;
          const my = y + h / 2;
          const brazo = adv(1.4);
          pdf.setDrawColor(...colors.primary);
          pdf.setLineWidth(0.3);
          pdf.line(cx - w * 0.3, my, cx - brazo * 2.2, my);
          pdf.line(cx + brazo * 2.2, my, cx + w * 0.3, my);
          pdf.line(cx - brazo, my, cx + brazo, my);
          pdf.line(cx, my - brazo, cx, my + brazo);
        },
      });
    };

    /** Ata las `cuantas` piezas que empiezan en `desde` para que no se separen. */
    const agrupar = (desde: number, cuantas: number, id: string) => {
      for (let i = desde; i < Math.min(els.length, desde + cuantas); i++) els[i].grupo = id;
    };

    sortedCategories.forEach((category, catIdx) => {
      if (catIdx > 0) espacio(adv(4));
      const iCabecera = els.length;
      encabezado(category);
      espacio(adv(2));

      byCategory[category].forEach((song, idx) => {
        const iCanto = els.length;
        titulo(song);
        const lyrics = cleanLyrics(song.lyrics || '');
        if (lyrics) {
          const estrofas = parseStanzas(lyrics);
          estrofas.forEach((estrofa, i) => {
            lineasDeEstrofa(estrofa);
            if (i < estrofas.length - 1) espacio(adv(2.5));
          });
        } else {
          els.push({
            h: adv(6),
            draw: (x, y) => {
              pdf.setFont('helvetica', 'italic');
              pdf.setFontSize(9);
              pdf.setTextColor(160, 160, 160);
              pdf.text('(Letra no disponible)', x, y + BASE);
            },
          });
        }
        // El título viaja con la primera línea de su letra, y el encabezado de la parte
        // con el título de su primer canto: así ningún rótulo queda solo al pie de una
        // columna. No se ata más que eso a propósito: cada línea que se exige por
        // adelantado es espacio que puede quedar en blanco al final de la columna.
        agrupar(iCanto, 2, `canto-${category}-${idx}`);
        if (idx === 0) agrupar(iCabecera, iCanto - iCabecera + 1, `parte-${catIdx}`);
        if (idx < byCategory[category].length - 1) separador();
      });
    });

    // Cierre: QR al canal, centrado al final del flujo (como el escudo del folleto
    // impreso). Va dentro de la medición, así que nunca abre una hoja por su cuenta.
    if (qrDataUrl) {
      const lado = 22;
      const h = adv(9) + lado;
      els.push({
        h,
        draw: (x, y, w) => {
          const cx = x + w / 2;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(...colors.primary);
          pdf.text('Escúchalos en nuestro', cx, y + adv(4), { align: 'center' });
          pdf.text('canal de YouTube', cx, y + adv(7.5), { align: 'center' });
          pdf.addImage(qrDataUrl!, 'PNG', cx - lado / 2, y + adv(9), lado, lado);
        },
      });
    }

    return els;
  };

  /** Cuántas hojas de cantos ocupan estas piezas (el reparto vive en utils/pdfColumns). */
  const medir = (els: Elem[]): number =>
    repartirEnColumnas(els, { top: colTop, bottom: colBottom, columnas: 2 }).hojas;

  /** Dibuja las piezas ya repartidas, abriendo hoja (con encabezado y pie) al pasar. */
  const dibujar = (els: Elem[]) => {
    const { colocadas } = repartirEnColumnas(els, { top: colTop, bottom: colBottom, columnas: 2 });
    let hojaActual = 1;
    for (const c of colocadas) {
      if (c.hoja > hojaActual) {
        addPageFooter();
        pdf.addPage();
        pageNum++;
        addPageHeader();
        hojaActual = c.hoja;
      }
      els[c.pieza].draw(colX[c.columna], c.y, colW);
    }
  };

  // ── Ajuste a una sola hoja ──
  // Con la letra elegida al publicar puede no caber. Se prueba achicando de a poco
  // hasta un piso legible (el folleto lo lee gente de todas las edades) y se elige la
  // letra MÁS GRANDE que logre el menor número de hojas: achicar solo sirve si ahorra
  // una hoja; si no la ahorra, la letra chica no compra nada y se descarta.
  const ESCALA_MINIMA = Math.max(0.85, escalaBase * 0.7);
  const ESCALAS: number[] = [];
  for (let s = escalaBase; s > ESCALA_MINIMA - 1e-9; s -= 0.05) ESCALAS.push(Number(s.toFixed(3)));
  const INTERLINEADOS = [5.5, 5.2, 4.9];

  let mejor: { escala: number; interlineado: number; hojas: number; elementos: Elem[] } | null = null;
  buscar:
  for (const s of ESCALAS) {
    for (const il of INTERLINEADOS) {
      scale = s;
      interlineado = il;
      const els = construirElementos();
      const hojas = medir(els);
      if (!mejor || hojas < mejor.hojas) mejor = { escala: s, interlineado: il, hojas, elementos: els };
      if (hojas === 1) break buscar;
    }
  }
  scale = mejor!.escala;
  interlineado = mejor!.interlineado;
  const elementos = mejor!.elementos;

  pdf.addPage();
  pageNum++;
  addPageHeader();
  dibujar(elementos);
  addPageFooter();

  // El folleto del Pueblo fiel es SOLO la letra (sin acordes ni partituras).

  const safeFileName = cleanText(cantoral.liturgicalDate).replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

  // ─── Cuadernillo: mismo folleto decorado, impuesto 2-por-cara en carta horizontal ───
  // Se rasteriza cada página carta (con toda su decoración) y se coloca en orden de
  // cuadernillo, para imprimir a doble faz y doblar al medio. Es EL MISMO diseño de la
  // vista previa, solo que reordenado como librito.
  //
  // Con portada + UNA hoja de cantos no hay nada que doblar: esas dos caras ya son una
  // hoja impresa por lado y lado, y pasarlas por la imposición solo serviría para
  // achicar la letra a la mitad y dejar dos medias hojas en blanco. En ese caso se
  // entrega el folleto tal cual.
  const paginas = 1 + mejor!.hojas;
  if (booklet && paginas > 2) {
    const images = await renderPdfToImages({ data: pdf.output('arraybuffer') }, 1400);
    const bookletBlob = imposeBooklet(images);
    if (download) saveBlob(bookletBlob, `Cantoral_${safeFileName}_cuadernillo.pdf`);
    return { blob: bookletBlob, url: URL.createObjectURL(bookletBlob) };
  }

  // Descargar (o solo devolver el blob para previsualización, sin descargar). El
  // nombre dice "cuadernillo" solo cuando de verdad hubo que doblarlo.
  if (download) pdf.save(`Cantoral_${safeFileName}.pdf`);
  const blob = pdf.output('blob');
  return { blob, url: URL.createObjectURL(blob) };
}

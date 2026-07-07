import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { PublishedCantoral, Song } from '../types';
import { getCurrentLiturgicalSeason } from './liturgicalSeason';
import { getChannelUrl } from '../services/youtube';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';
import { getGarland } from '../data/garlands';
import { getPdfFont, getPdfScale } from '../data/pdfStyle';
import { renderPdfToImages, imposeBooklet } from './atrilBookletPDF';
import { stripLyricsFormatting } from './lyricsFormat';

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
  const leaves = 4;
  const lf = 2.2; // largo de cada hoja
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

const CATEGORY_ORDER = [
  'Entrada', 'Rito de Aspersión', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya',
  'Post Evangelio', 'Respuesta a Oración Universal', 'Ofertorio', 'Santo',
  'Aclamación Consagración', 'Amén (Doxología)', 'Padre Nuestro',
  'Tuyo es el Reino', 'Cordero de Dios', 'Comunión', 'Salida',
];

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
  const date = new Date(dateStr);
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

function cleanLyrics(lyrics: string): string {
  if (!lyrics) return '';

  // Quitar marcadores de formato del editor (**negrita**, *cursiva*, __subrayado__, ">> ").
  lyrics = stripLyricsFormatting(lyrics);
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
  const scale = getPdfScale(cantoral.pdfSize);
  const adv = (n: number) => n * scale; // escala los avances verticales (interlineado)
  const _setFontSize = pdf.setFontSize.bind(pdf);
  (pdf as any).setFontSize = (size: number) => _setFontSize(size * scale);
  const _setFont = pdf.setFont.bind(pdf);
  (pdf as any).setFont = (_family: string, style?: string) => _setFont(fontFamily, style);

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  let y = margin;
  let pageNum = 1;

  // Logo redondo de la app para el encabezado (si falla la carga, se usa el texto).
  const logo = await loadCircularLogo(logoStellaMaris);

  // Guirnalda elegida al publicar (colores naturales; fondo blanco → transparente).
  // En cada título se usa a todo el ancho y se "corta" al medio con una caja blanca
  // para el título; en la portada va completa, arriba y abajo del texto.
  const garlandStyle = getGarland(cantoral.garland);
  const garlandImg = await loadImage(garlandStyle.src);
  const garland = garlandImg ? clipWhite(garlandImg) : null;

  // Header en cada página
  const addPageHeader = () => {
    if (logo) {
      const d = 12; // diámetro: redondo y un poco más grande
      pdf.addImage(logo.dataUrl, 'PNG', margin, 1, d, d);
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Stella Maris', margin, 10);
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(cleanText(cantoral.liturgicalDate), pageW - margin, 10, { align: 'right' });
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 13, pageW - margin, 13);
  };

  // Footer en cada página
  const addPageFooter = () => {
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageH - 12, pageW - margin, pageH - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    const parish = cleanText(cantoral.parishName);
    pdf.text(parish, margin, pageH - 7);
    pdf.text(`Pág. ${pageNum}`, pageW - margin, pageH - 7, { align: 'right' });
  };

  // Saltar de página si no entra el contenido
  const needPage = (required: number) => {
    if (y + required > pageH - 18) {
      addPageFooter();
      pdf.addPage();
      pageNum++;
      addPageHeader();
      y = 22;
    }
  };

  // Renderizar bloque de texto con wrap automático
  const renderTextBlock = (text: string, fontSize: number, lineHeight: number, options: { bold?: boolean; color?: [number, number, number]; align?: 'left' | 'center' } = {}) => {
    pdf.setFont('helvetica', options.bold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...(options.color ?? [30, 30, 30]));

    const lines = pdf.splitTextToSize(text, contentW) as string[];
    for (const line of lines) {
      needPage(lineHeight);
      const x = options.align === 'center' ? pageW / 2 : margin;
      pdf.text(line, x, y, options.align === 'center' ? { align: 'center' } : undefined);
      y += lineHeight;
    }
  };

  // ─── PORTADA ───
  // Guirnalda completa arriba y abajo; todo el texto centrado horizontal y
  // verticalmente en el espacio entre ambas.
  const dateObj = new Date(cantoral.date);
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

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

  const totalH = coverLines.reduce((s, l) => s + adv(l.h), 0);
  let cy = coverTop + Math.max(0, (coverBottom - coverTop - totalH) / 2);
  for (const line of coverLines) {
    pdf.setFont('helvetica', line.b ? 'bold' : 'normal');
    pdf.setFontSize(line.s);
    pdf.setTextColor(...line.c);
    pdf.text(line.t, pageW / 2, cy + adv(line.h) * 0.72, { align: 'center' });
    cy += adv(line.h);
  }

  // ─── CANTOS POR CATEGORÍA ───
  pdf.addPage();
  pageNum++;
  addPageHeader();
  y = 22;

  // Agrupar cantos por parte de la misa
  const byCategory = cantoral.songs.reduce((acc, song) => {
    if (!acc[song.category]) acc[song.category] = [];
    acc[song.category].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  const sortedCategories = Object.keys(byCategory).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );

  // Espacio simétrico (arriba y abajo) de cada guirnalda, para que quede SIEMPRE
  // centrada entre el canto anterior y el siguiente que separa.
  const bandGap = adv(8);

  // Marcas de sección dentro de la letra ("Coro:", "Estrofa 2", etc.).
  const SECTION_RE = /^(Coro|Estrofa\s*\d*|Puente|Final|Refrán|Recitativo)\s*:?\s*$/i;

  // Alto utilizable de una página (de y=22 tras el encabezado al límite inferior).
  const usableH = (pageH - 18) - 22;

  // ── Maquetación a DOS COLUMNAS ──
  // Las estrofas se reparten en dos columnas para aprovechar el ancho de la hoja:
  // estrofa 1 arriba-izquierda, 2 arriba-derecha, 3 debajo de la 1, 4 debajo de la 2…
  // (columna izquierda = estrofas impares, derecha = pares). Cada fila avanza según la
  // estrofa más alta del par, así ambas columnas quedan alineadas. Las proporciones se
  // mantienen porque el ancho de columna se deriva del ancho de contenido escalado.
  const gutter = adv(8); // separación entre columnas
  const colW = (contentW - gutter) / 2; // ancho de cada columna
  const colX = [margin, margin + colW + gutter]; // x de inicio de cada columna

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

  // Mide el alto (mm, ya escalado) de una estrofa a un ancho de columna dado, con el
  // mismo criterio con que se dibuja (marcas de sección + wrap del texto).
  const measureStanza = (stanza: string[], width: number): number => {
    let h = 0;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    for (const raw of stanza) {
      const line = raw.replace(/\s+$/, '');
      if (SECTION_RE.test(line.trim())) { h += adv(6); continue; }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      const wrapped = pdf.splitTextToSize(line, width) as string[];
      h += wrapped.length * adv(5.5);
    }
    return h;
  };

  // Dibuja una estrofa en una columna (x fijo, desde startY), justificada al ancho de
  // columna; la última línea de cada wrap y las de una sola línea quedan a la izquierda.
  // No hace saltos de página: el salto se decide por FILA (par de estrofas) más arriba.
  const drawStanzaAt = (stanza: string[], x: number, startY: number, width: number) => {
    let yy = startY;
    for (const raw of stanza) {
      const line = raw.replace(/\s+$/, '');
      if (SECTION_RE.test(line.trim())) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.setTextColor(80, 80, 80);
        pdf.text(line.trim(), x, yy);
        yy += adv(6);
        continue;
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(40, 40, 40);
      const wrapped = pdf.splitTextToSize(line, width) as string[];
      wrapped.forEach((wl, wi) => {
        if (wi < wrapped.length - 1) drawJustifiedLine(pdf, wl, x, yy, width);
        else pdf.text(wl, x, yy);
        yy += adv(5.5);
      });
    }
  };

  // Mide el alto total de un canto en dos columnas (título + autor + filas de estrofas)
  // para decidir si cabe completo en lo que queda de página.
  const measureSongHeight = (song: Song): number => {
    let h = 0;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const titleLines = pdf.splitTextToSize(cleanText(song.title), contentW) as string[];
    h += titleLines.length * adv(6);
    if (song.author) h += adv(5);
    h += adv(2);
    const lyrics = cleanLyrics(song.lyrics || '');
    if (!lyrics) return h + adv(6);
    const stanzas = parseStanzas(lyrics);
    for (let i = 0; i < stanzas.length; i += 2) {
      const lh = measureStanza(stanzas[i], colW);
      const rh = stanzas[i + 1] ? measureStanza(stanzas[i + 1], colW) : 0;
      h += Math.max(lh, rh);
      if (i + 2 < stanzas.length) h += adv(3); // separación entre filas
    }
    return h;
  };

  sortedCategories.forEach((category, catIdx) => {
    // Cabecera de categoría: la guirnalda con el título del momento, centrada entre
    // los dos cantos que separa (mismo espacio arriba y abajo).
    const label = cleanText(category).toUpperCase();

    // Gap superior. El contenido anterior dejó ~un avance de línea final (adv(5.5)),
    // que también es aire; lo descontamos para que el espacio de ARRIBA quede igual al
    // de ABAJO y la guirnalda caiga centrada entre ambos cantos.
    if (catIdx > 0) y += Math.max(adv(2), bandGap - adv(5.5));

    // Guirnalda de sección: cenefa vectorial sencilla (laurel fino y poco invasivo,
    // del mismo color que la letra) con el título del momento centrado, ocupando el
    // resto del ancho de la hoja. La banda mide 1.2 cm de grosor. Reservamos también el
    // comienzo del primer canto para que la guirnalda no quede huérfana al pie de hoja.
    const bandH = adv(12); // 1.2 cm de grosor de la banda
    const firstSongStart = Math.min(measureSongHeight(byCategory[category][0]), adv(28));
    needPage(bandH + adv(4) + bandGap + firstSongStart);
    const midY = y + bandH / 2;

    // Título del momento, centrado (se achica si no cabe, dejando aire a los lados).
    pdf.setFont('helvetica', 'bold');
    let fs = 13;
    pdf.setFontSize(fs);
    const maxTitleW = contentW - adv(44);
    while (pdf.getTextWidth(label) > maxTitleW && fs > 8) { fs -= 0.5; pdf.setFontSize(fs); }
    pdf.setTextColor(...colors.primary);
    pdf.text(label, pageW / 2, midY, { align: 'center', baseline: 'middle' });

    // Cenefa a cada lado del título, del color de la letra de los cantos.
    const labelW = pdf.getTextWidth(label);
    const innerGap = adv(5);
    const leftInner = pageW / 2 - labelW / 2 - innerGap;
    const rightInner = pageW / 2 + labelW / 2 + innerGap;
    const garlandColor: [number, number, number] = [40, 40, 40];
    drawSideGarland(pdf, margin + 4, leftInner, midY, garlandColor);
    drawSideGarland(pdf, pageW - margin - 4, rightInner, midY, garlandColor);

    y = midY + bandH / 2;

    // Gap inferior (igual al superior) → la guirnalda queda centrada entre ambos cantos.
    y += bandGap;

    byCategory[category].forEach((song, idx) => {
      const songH = measureSongHeight(song);
      // Mantener cada canto entero en una página cuando quepa: si no cabe en lo que
      // resta de hoja, saltar de página ANTES de empezarlo (sin cortes a media hoja).
      // El primer canto tras la guirnalda no fuerza salto (la guirnalda ya reservó su
      // comienzo, así no queda huérfana); si es muy largo, igual cortará entre estrofas.
      if (idx > 0 && songH <= usableH) needPage(songH);
      else needPage(adv(20));

      // Título del canto. Fija fuente y tamaño ANTES de medir, para que el ajuste de
      // línea se calcule al mismo tamaño con que se dibuja y nunca exceda el ancho.
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      const titleLines = pdf.splitTextToSize(cleanText(song.title), contentW) as string[];
      titleLines.forEach((line) => {
        needPage(adv(6));
        // Reaplicar estilo DESPUÉS de needPage: si saltó de página, addPageHeader
        // dejó el color en gris y el texto saldría descolorido.
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(...colors.primary);
        pdf.text(line, margin, y);
        y += adv(6);
      });

      // Autor (si existe)
      if (song.author) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(130, 130, 130);
        pdf.text(`${cleanText(song.author)}`, margin, y);
        y += adv(5);
      }

      y += adv(2);

      // Letra a DOS COLUMNAS, por filas de dos estrofas (1 izq, 2 der, 3 bajo la 1…).
      // Cada fila es atómica: si no entra en lo que queda de hoja, salta de página
      // ANTES de empezarla → el corte cae siempre al final de una fila de estrofas,
      // nunca a media estrofa. Cada estrofa queda justificada al ancho de su columna.
      const lyrics = cleanLyrics(song.lyrics || '');
      if (lyrics) {
        const stanzas = parseStanzas(lyrics);
        for (let i = 0; i < stanzas.length; i += 2) {
          const left = stanzas[i];
          const right = stanzas[i + 1];
          const lh = measureStanza(left, colW);
          const rh = right ? measureStanza(right, colW) : 0;
          const rowH = Math.max(lh, rh);
          if (rowH <= usableH) needPage(rowH); // mantener la fila (par de estrofas) junta
          const rowY = y;
          drawStanzaAt(left, colX[0], rowY, colW);
          if (right) drawStanzaAt(right, colX[1], rowY, colW);
          y = rowY + rowH;
          if (i + 2 < stanzas.length) y += adv(3); // separación entre filas
        }
      } else {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(160, 160, 160);
        pdf.text('(Letra no disponible)', margin, y);
        y += adv(6);
      }

      // Separador entre cantos de la misma categoría (línea fina en color litúrgico)
      if (idx < byCategory[category].length - 1) {
        y += adv(4);
        pdf.setDrawColor(...colors.primary);
        pdf.setLineWidth(0.2);
        pdf.line(pageW / 2 - 24, y, pageW / 2 + 24, y);
        y += adv(6);
      }
    });
    // Sin gap extra aquí: el espacio entre la última letra y la siguiente guirnalda
    // lo da el `bandGap` superior de la próxima categoría (simétrico con el inferior).
  });

  // ─── QR al canal de YouTube (esquina inferior derecha de la última hoja) ───
  try {
    const qrDataUrl = await QRCode.toDataURL(getChannelUrl(), { margin: 0, width: 240 });
    const qrSize = 26;
    const bottomLimit = pageH - 16;          // justo por encima de la línea del footer
    const qrY = bottomLimit - qrSize;        // borde superior del QR
    const qrTopWithCaption = qrY - 8;        // reservar el rótulo de dos líneas

    // Si el contenido llega hasta esa zona, llevar el QR a una página nueva.
    if (y > qrTopWithCaption) {
      addPageFooter();
      pdf.addPage();
      pageNum++;
      addPageHeader();
    }
    const qrX = pageW - margin - qrSize;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.primary);
    pdf.text('Escúchalos en nuestro', qrX + qrSize / 2, qrY - 4.5, { align: 'center' });
    pdf.text('canal de YouTube', qrX + qrSize / 2, qrY - 1, { align: 'center' });
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch {
    // Si falla la generación del QR, el folleto se entrega igual.
  }

  addPageFooter();

  // El folleto del Pueblo fiel es SOLO la letra (sin acordes ni partituras).

  const safeFileName = cleanText(cantoral.liturgicalDate).replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

  // ─── Cuadernillo: mismo folleto decorado, impuesto 2-por-cara en carta horizontal ───
  // Se rasteriza cada página carta (con toda su decoración) y se coloca en orden de
  // cuadernillo, para imprimir a doble faz y doblar al medio. Es EL MISMO diseño de la
  // vista previa, solo que reordenado como librito.
  if (booklet) {
    const images = await renderPdfToImages({ data: pdf.output('arraybuffer') }, 1400);
    const bookletBlob = imposeBooklet(images);
    if (download) saveBlob(bookletBlob, `Cantoral_${safeFileName}_cuadernillo.pdf`);
    return { blob: bookletBlob, url: URL.createObjectURL(bookletBlob) };
  }

  // Descargar (o solo devolver el blob para previsualización, sin descargar).
  if (download) pdf.save(`Cantoral_${safeFileName}.pdf`);
  const blob = pdf.output('blob');
  return { blob, url: URL.createObjectURL(blob) };
}

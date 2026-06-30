import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { PublishedCantoral, Song } from '../types';
import { getCurrentLiturgicalSeason } from './liturgicalSeason';
import { getChannelUrl } from '../services/youtube';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';
import eucharisticWreath from '../assets/eucharistic-wreath.jpg';
import sectionArch from '../assets/section-arch.png';

interface PDFGeneratorOptions {
  cantoral: PublishedCantoral;
}

type RGB = [number, number, number];
interface Crop { sx: number; sy: number; sw: number; sh: number }
interface TintedImage { dataUrl: string; w: number; h: number }

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
 * Recorta una región de la corona iluminada y la tinta al color litúrgico:
 *  · blend 'color' → conserva el claroscuro del dibujo pero impone el tono litúrgico
 *    (haciendo "prevalecer" ese color).
 *  · recorte por luminancia → el fondo de pergamino claro se vuelve transparente,
 *    dejando solo las vides/medallones flotando sobre la hoja.
 * `flip` refleja horizontalmente (para que el adorno derecho mire al centro).
 */
function tintWreath(
  img: HTMLImageElement,
  color: RGB,
  crop: Crop,
  flip = false,
  clearFrac?: { x0: number; y0: number; x1: number; y1: number },
): TintedImage | null {
  const { sx, sy, sw, sh } = crop;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (flip) { ctx.translate(sw, 0); ctx.scale(-1, 1); }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Imponer el tono litúrgico conservando el claroscuro.
  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  ctx.fillRect(0, 0, sw, sh);
  ctx.globalCompositeOperation = 'source-over';
  // Recortar el fondo claro (pergamino) por luminancia.
  try {
    const data = ctx.getImageData(0, 0, sw, sh);
    const a = data.data;
    for (let i = 0; i < a.length; i += 4) {
      const lum = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2];
      if (lum > 205) a[i + 3] = 0;
      else if (lum > 150) a[i + 3] = Math.round(a[i + 3] * (205 - lum) / 55);
    }
    // Vaciar una zona central (donde el arco trae texto propio) para escribir el
    // título del momento encima sin que se superponga al rótulo de la imagen.
    if (clearFrac) {
      const x0 = Math.max(0, Math.floor(clearFrac.x0 * sw));
      const x1 = Math.min(sw, Math.ceil(clearFrac.x1 * sw));
      const y0 = Math.max(0, Math.floor(clearFrac.y0 * sh));
      const y1 = Math.min(sh, Math.ceil(clearFrac.y1 * sh));
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) a[(yy * sw + xx) * 4 + 3] = 0;
      }
    }
    ctx.putImageData(data, 0, 0);
  } catch {
    // Si el canvas quedara "tainted", se entrega sin recorte (igual luce bien).
  }
  return { dataUrl: canvas.toDataURL('image/png'), w: sw, h: sh };
}

const CATEGORY_ORDER = [
  'Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Post Evangelio',
  'Ofertorio', 'Santo', 'Padre Nuestro', 'Cordero de Dios', 'Comunión', 'Salida',
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

export async function generateCantoralPDF(options: PDFGeneratorOptions): Promise<void> {
  const { cantoral } = options;
  const colors = getColorsForDate(cantoral.date);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  let y = margin;
  let pageNum = 1;

  // Logo redondo de la app para el encabezado (si falla la carga, se usa el texto).
  const logo = await loadCircularLogo(logoStellaMaris);

  // Corona eucarística (portada) y arco de sección, ambos tintados al color
  // litúrgico. El arco lleva su propio texto al centro: se vacía esa zona para
  // escribir encima el título del momento de la Misa.
  const wreathImg = await loadImage(eucharisticWreath);
  const wreathSquare = wreathImg ? tintWreath(wreathImg, colors.primary, { sx: 232, sy: 0, sw: 559, sh: 559 }) : null;
  const archImg = await loadImage(sectionArch);
  // El asset ya viene recortado a SOLO la guirnalda con el texto embebido, así que
  // se usa completo. Se vacía la banda central (donde dice "TITULO DEL CANTO") para
  // escribir encima el momento de la Misa.
  const archTinted = archImg
    ? tintWreath(archImg, colors.primary,
        { sx: 0, sy: 0, sw: archImg.naturalWidth, sh: archImg.naturalHeight }, false,
        // Banda central vaciada más ancha → más espacio para el título del momento.
        { x0: 0.12, y0: 0.30, x1: 0.88, y1: 0.66 })
    : null;

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
  addPageHeader();

  // Corona eucarística como pieza central (color litúrgico predominante).
  if (wreathSquare) {
    const wW = 84;
    const wH = wW * (wreathSquare.h / wreathSquare.w);
    pdf.addImage(wreathSquare.dataUrl, 'PNG', pageW / 2 - wW / 2, 16, wW, wH);
    y = 16 + wH + 10;
  } else {
    y = 64;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...colors.primary);
  pdf.text('Cantoral de la Misa', pageW / 2, y, { align: 'center' });
  y += 9;

  // Badge del tiempo litúrgico
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.primary);
  pdf.text(`Tiempo: ${colors.seasonName}`, pageW / 2, y, { align: 'center' });
  y += 7;

  pdf.setFontSize(16);
  pdf.setTextColor(80, 80, 80);
  pdf.text(cleanText(cantoral.liturgicalDate), pageW / 2, y, { align: 'center' });
  y += 9;

  // Fecha y hora
  const dateObj = new Date(cantoral.date);
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(cleanText(formattedDate), pageW / 2, y, { align: 'center' });
  y += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(60, 60, 60);
  pdf.text(cleanText(cantoral.massTime), pageW / 2, y, { align: 'center' });
  y += 12;

  // Parroquia
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(80, 80, 80);
  pdf.text(cleanText(cantoral.parishName), pageW / 2, y, { align: 'center' });
  y += 6;
  pdf.text(`Coro: ${cleanText(cantoral.choirName)}`, pageW / 2, y, { align: 'center' });

  addPageFooter();

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

  sortedCategories.forEach((category) => {
    // Cabecera de categoría: arco eucarístico (tintado al color litúrgico) con el
    // título del momento de la Misa centrado en su hueco (donde la imagen original
    // dice "MISSA DE ANGELIS").
    const label = cleanText(category).toUpperCase();

    if (archTinted) {
      const aW = pageW; // guirnalda a sangre: ocupa el ancho COMPLETO de la hoja (borde a borde)
      // Banner un 25% más angosto (más fino verticalmente) → deja más espacio para la letra.
      const aH = aW * (archTinted.h / archTinted.w) * 0.75;
      needPage(aH + 6);
      // Reusar la misma imagen (alias) para no inflar el PDF en cada sección.
      pdf.addImage(archTinted.dataUrl, 'PNG', 0, y, aW, aH, 'arco-seccion', 'FAST');
      // Título adaptativo: arranca grande y se achica solo si no entra en la banda
      // central (dimensionada para el título más largo, "CORDERO DE DIOS").
      pdf.setFont('helvetica', 'bold');
      let fs = 30;
      pdf.setFontSize(fs);
      const maxTitleW = aW * 0.68;
      while (pdf.getTextWidth(label) > maxTitleW && fs > 12) { fs -= 0.5; pdf.setFontSize(fs); }
      pdf.setTextColor(...colors.primary);
      pdf.text(label, pageW / 2, y + aH * 0.58, { align: 'center' });
      y += aH + 2;
    } else {
      // Respaldo si la imagen no carga: título centrado con líneas a los lados.
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(...colors.primary);
      const labelW = pdf.getTextWidth(label);
      const gap = 4;
      needPage(16);
      const midY = y + 6;
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.5);
      pdf.line(margin + 6, midY, pageW / 2 - labelW / 2 - gap, midY);
      pdf.line(pageW / 2 + labelW / 2 + gap, midY, pageW - margin - 6, midY);
      pdf.text(label, pageW / 2, midY + 1.8, { align: 'center' });
      y = midY + 8;
    }

    byCategory[category].forEach((song, idx) => {
      needPage(20);

      // Título del canto
      const titleLines = pdf.splitTextToSize(cleanText(song.title), contentW) as string[];
      titleLines.forEach((line) => {
        needPage(6);
        // Reaplicar estilo DESPUÉS de needPage: si saltó de página, addPageHeader
        // dejó el color en gris y el texto saldría descolorido.
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(...colors.primary);
        pdf.text(line, margin, y);
        y += 6;
      });

      // Autor (si existe)
      if (song.author) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(130, 130, 130);
        pdf.text(`${cleanText(song.author)}`, margin, y);
        y += 5;
      }

      y += 2;

      // Letra limpia
      const lyrics = cleanLyrics(song.lyrics || '');
      if (lyrics) {
        const lyricLines = lyrics.split('\n');
        for (const rawLine of lyricLines) {
          const line = rawLine.replace(/\s+$/, ''); // trim trailing spaces

          if (line === '') {
            y += 3; // espacio entre estrofas
            continue;
          }

          // Detectar marcas de sección: "Coro:", "Estrofa 1:", etc.
          const isSection = /^(Coro|Estrofa\s*\d*|Puente|Final|Refrán|Recitativo)\s*:?\s*$/i.test(line.trim());

          if (isSection) {
            needPage(6);
            // Estilo SIEMPRE tras needPage para mantener color parejo al cambiar de hoja.
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10.5);
            pdf.setTextColor(80, 80, 80);
            pdf.text(line.trim(), margin, y);
            y += 6;
          } else {
            // Texto normal — wrap si la línea es muy larga
            const wrapped = pdf.splitTextToSize(line, contentW) as string[];
            for (const wl of wrapped) {
              needPage(5.5);
              // Reaplicar el color/fuente de la letra tras cada posible salto de
              // página (evita que la segunda hoja salga más gris).
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10.5);
              pdf.setTextColor(40, 40, 40);
              pdf.text(wl, margin, y);
              y += 5.5;
            }
          }
        }
      } else {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(160, 160, 160);
        pdf.text('(Letra no disponible)', margin, y);
        y += 6;
      }

      // Separador entre cantos de la misma categoría (línea fina en color litúrgico)
      if (idx < byCategory[category].length - 1) {
        y += 4;
        pdf.setDrawColor(...colors.primary);
        pdf.setLineWidth(0.2);
        pdf.line(pageW / 2 - 24, y, pageW / 2 + 24, y);
        y += 6;
      }
    });

    y += 6; // espacio entre categorías
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

  // Descargar
  const safeFileName = cleanText(cantoral.liturgicalDate).replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  pdf.save(`Cantoral_${safeFileName}.pdf`);
}

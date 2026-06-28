import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { PublishedCantoral, Song } from '../types';
import { getCurrentLiturgicalSeason } from './liturgicalSeason';
import { getChannelUrl } from '../services/youtube';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';

interface PDFGeneratorOptions {
  cantoral: PublishedCantoral;
}

type RGB = [number, number, number];

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

/** Espiga de trigo: tallo con granos a ambos lados. `dir` = +1 derecha / -1 izquierda. */
function drawWheat(pdf: jsPDF, x: number, y: number, color: RGB, scale = 1, dir = 1) {
  pdf.setDrawColor(...color);
  pdf.setFillColor(...color);
  pdf.setLineWidth(0.25 * scale);
  const len = 4 * scale;
  const tipX = x + dir * len, tipY = y - len * 0.9;
  pdf.line(x, y, tipX, tipY);
  const grains = 4;
  for (let i = 1; i <= grains; i++) {
    const t = i / (grains + 1);
    const gx = x + dir * len * t, gy = y - len * 0.9 * t;
    pdf.ellipse(gx - dir * 0.7 * scale, gy, 0.4 * scale, 0.85 * scale, 'F');
    pdf.ellipse(gx + dir * 0.7 * scale, gy, 0.4 * scale, 0.85 * scale, 'F');
  }
  pdf.ellipse(tipX, tipY, 0.4 * scale, 0.85 * scale, 'F');
}

/** Racimo de uvas: pirámide de granos que cuelga, con tallito arriba. */
function drawGrapes(pdf: jsPDF, cx: number, y: number, color: RGB, scale = 1) {
  pdf.setFillColor(...color);
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.2 * scale);
  const r = 0.65 * scale;
  pdf.line(cx, y - r, cx, y - r - 1.2 * scale); // tallo
  let gy = y;
  [3, 2, 1].forEach((n) => {
    const rowW = (n - 1) * r * 1.7;
    for (let i = 0; i < n; i++) {
      pdf.circle(cx - rowW / 2 + i * r * 1.7, gy, r, 'F');
    }
    gy += r * 1.5;
  });
}

/**
 * Guirnalda eucarística de estilo románico/gótico: una cinta con hojas y motivos
 * eucarísticos (espigas de trigo y un racimo de uvas al centro), simétrica respecto
 * a su punto medio. Su FORMA distingue las secciones aunque se imprima en B/N.
 * Se dibuja a lo largo del tramo [x1, x2] centrado verticalmente en `y`.
 */
function drawEucharisticGarland(pdf: jsPDF, x1: number, x2: number, y: number, color: RGB, scale = 1) {
  const w = x2 - x1;
  pdf.setDrawColor(...color);
  pdf.setFillColor(...color);
  pdf.setLineWidth(0.3 * scale);
  if (w < 10) {
    pdf.line(x1, y, x2, y);
    pdf.circle(x1, y, 0.6 * scale, 'F');
    pdf.circle(x2, y, 0.6 * scale, 'F');
    return;
  }
  // Cinta base + remates redondos en las puntas.
  pdf.line(x1, y, x2, y);
  pdf.circle(x1, y, 0.6 * scale, 'F');
  pdf.circle(x2, y, 0.6 * scale, 'F');
  const cx = (x1 + x2) / 2;
  // Hojas alternadas (volutas) a lo largo de la cinta.
  [0.32, 0.5, 0.68].forEach((t, i) => {
    const lx = x1 + w * t;
    const up = i % 2 === 0;
    pdf.ellipse(lx, y + (up ? -1.3 : 1.3) * scale, 0.5 * scale, 1.2 * scale, 'F');
  });
  // Racimo de uvas al centro (colgando).
  drawGrapes(pdf, cx, y + 0.6 * scale, color, 0.75 * scale);
  // Espigas de trigo hacia afuera en ambos extremos.
  drawWheat(pdf, x1 + w * 0.16, y, color, 0.75 * scale, -1);
  drawWheat(pdf, x2 - w * 0.16, y, color, 0.75 * scale, +1);
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
  y = 60;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...colors.primary);
  pdf.text('Cantoral de la Misa', pageW / 2, y, { align: 'center' });
  y += 8;

  // Badge del tiempo litúrgico
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.primary);
  pdf.text(`Tiempo: ${colors.seasonName}`, pageW / 2, y, { align: 'center' });
  y += 6;

  pdf.setFontSize(16);
  pdf.setTextColor(80, 80, 80);
  pdf.text(cleanText(cantoral.liturgicalDate), pageW / 2, y, { align: 'center' });
  y += 10;

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
  y += 14;

  // Guirnalda eucarística (trigo y uvas) en el color litúrgico
  drawEucharisticGarland(pdf, pageW / 2 - 45, pageW / 2 + 45, y, colors.primary, 1.1);
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
    // Cabecera de categoría: cinta del color litúrgico con la parte de la Misa
    // centrada y la guirnalda eucarística ocupando el espacio a ambos lados.
    needPage(22);
    const bandTop = y - 7;
    const bandH = 12;
    pdf.setFillColor(...colors.primary);
    pdf.rect(margin, bandTop, contentW, bandH, 'F');

    const label = cleanText(category).toUpperCase();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...colors.textOnPrimary);
    const labelW = pdf.getTextWidth(label);
    const cxBand = pageW / 2;
    const garlandY = bandTop + bandH / 2;
    pdf.text(label, cxBand, garlandY + 1.6, { align: 'center' });

    const gap = 6;        // separación entre la palabra y la guirnalda
    const sidePad = 7;    // margen interno de la cinta
    drawEucharisticGarland(pdf, margin + sidePad, cxBand - labelW / 2 - gap, garlandY, colors.textOnPrimary, 0.8);
    drawEucharisticGarland(pdf, cxBand + labelW / 2 + gap, pageW - margin - sidePad, garlandY, colors.textOnPrimary, 0.8);
    y += 13;

    byCategory[category].forEach((song, idx) => {
      needPage(20);

      // Título del canto
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(...colors.primary);
      const titleLines = pdf.splitTextToSize(cleanText(song.title), contentW) as string[];
      titleLines.forEach((line) => {
        needPage(6);
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
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        pdf.setTextColor(40, 40, 40);

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
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(80, 80, 80);
            needPage(6);
            pdf.text(line.trim(), margin, y);
            y += 6;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(40, 40, 40);
          } else {
            // Texto normal — wrap si la línea es muy larga
            const wrapped = pdf.splitTextToSize(line, contentW) as string[];
            for (const wl of wrapped) {
              needPage(5.5);
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

      // Separador entre cantos de la misma categoría (guirnalda tenue)
      if (idx < byCategory[category].length - 1) {
        y += 5;
        drawEucharisticGarland(pdf, pageW / 2 - 26, pageW / 2 + 26, y, colors.primary, 0.7);
        y += 7;
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

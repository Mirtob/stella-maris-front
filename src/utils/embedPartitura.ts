import jsPDF from 'jspdf';
import { Song } from '../types';
import { getDrivePdfProxyUrl } from './driveProxy';

/**
 * Embebe las páginas de la partitura (PDF de Drive) de un canto al final del
 * documento jsPDF. Renderiza cada página con PDF.js a un canvas y la agrega como
 * imagen en una página A4. Si la partitura no existe o falla la descarga, agrega
 * una página con un aviso. Compartido por los generadores de PDF (Coro y Pueblo fiel).
 */
export async function embedPartituraPages(
  pdf: jsPDF,
  song: Song,
  layout: { pageWidth: number; pageHeight: number; margin: number }
): Promise<void> {
  const { pageWidth, pageHeight, margin } = layout;
  const proxyUrl = getDrivePdfProxyUrl(song.sheetMusicUrl);
  if (!proxyUrl) return;

  const addErrorPage = (msg: string) => {
    pdf.addPage();
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(156, 163, 175); // gray-400
    pdf.text(msg, margin, margin + 10, { maxWidth: pageWidth - margin * 2 });
  };

  try {
    const pdfjs: any = await import('pdfjs-dist');
    // Worker servido desde nuestro propio dominio (mismo patrón que PDFViewer).
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const doc = await pdfjs.getDocument({ url: proxyUrl }).promise;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { await doc.destroy(); return; }

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale: 2 }); // ~150-200 dpi, buen balance nitidez/peso
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const imgData = canvas.toDataURL('image/jpeg', 0.85);

      pdf.addPage();
      // Encabezado solo en la primera página de la partitura del canto.
      let topOffset = margin;
      if (p === 1) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138); // blue-900
        pdf.text(`Partitura — ${song.title}`, margin, margin, { maxWidth: pageWidth - margin * 2 });
        topOffset = margin + 6;
      }

      // Ajuste "contain" dentro del área útil de la A4.
      const availW = pageWidth - margin * 2;
      const availH = pageHeight - topOffset - margin;
      const imgRatio = canvas.width / canvas.height;
      let drawW = availW;
      let drawH = drawW / imgRatio;
      if (drawH > availH) {
        drawH = availH;
        drawW = drawH * imgRatio;
      }
      const x = (pageWidth - drawW) / 2;
      pdf.addImage(imgData, 'JPEG', x, topOffset, drawW, drawH);
    }

    await doc.destroy();
  } catch {
    addErrorPage(`No se pudo cargar la partitura de "${song.title}".`);
  }
}

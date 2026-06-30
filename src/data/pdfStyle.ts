// Fuente y tamaño del folleto PDF, elegibles por el usuario al publicar y guardados
// por cantoral (ver columnas pdf_font / pdf_size). El tamaño es un factor de escala
// aplicado a TODO el PDF (tipografías y espaciados).

export interface PdfFontOption {
  id: string;
  name: string;
  /** Familia base de jsPDF (las 3 estándar, sin necesidad de incrustar TTF). */
  jsFont: 'helvetica' | 'times' | 'courier';
}

export const PDF_FONTS: PdfFontOption[] = [
  { id: 'helvetica', name: 'Moderna (Helvetica)',      jsFont: 'helvetica' },
  { id: 'times',     name: 'Clásica (Times)',          jsFont: 'times' },
  { id: 'courier',   name: 'Monoespaciada (Courier)',  jsFont: 'courier' },
];

export interface PdfSizeOption {
  id: string;
  name: string;
  /** Factor de escala aplicado a todas las fuentes y espaciados del PDF. */
  scale: number;
}

export const PDF_SIZES: PdfSizeOption[] = [
  { id: 'normal',     name: 'Normal',      scale: 1.0 },
  { id: 'grande',     name: 'Grande',      scale: 1.2 },
  { id: 'muy-grande', name: 'Muy grande',  scale: 1.4 },
  { id: 'maxima',     name: 'Máxima',      scale: 1.6 },
];

export const DEFAULT_PDF_FONT = 'helvetica';
// La letra va más grande por defecto ("agranda la letra de todo el pdf").
export const DEFAULT_PDF_SIZE = 'grande';

export function getPdfFont(id?: string | null): PdfFontOption {
  return PDF_FONTS.find(f => f.id === id) ?? PDF_FONTS[0];
}

export function getPdfScale(id?: string | null): number {
  const opt = PDF_SIZES.find(s => s.id === id)
    ?? PDF_SIZES.find(s => s.id === DEFAULT_PDF_SIZE)
    ?? PDF_SIZES[0];
  return opt.scale;
}

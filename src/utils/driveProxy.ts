/**
 * Construye la URL del proxy interno que sirve los bytes de un PDF de Google Drive,
 * evitando CORS. El backend expone `/api/pdf?id={fileId}` (lo consume PDF.js tanto en
 * el visor `PDFViewer` como al embeber partituras en el folleto del Coro).
 *
 * Acepta cualquier URL de Drive con el patrón `/d/{fileId}` (preview, view, etc.).
 * Devuelve null si no se puede extraer un fileId.
 */
export function getDrivePdfProxyUrl(sheetMusicUrl: string | undefined | null): string | null {
  if (!sheetMusicUrl) return null;
  const match = sheetMusicUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  return `/api/pdf?id=${match[1]}`;
}

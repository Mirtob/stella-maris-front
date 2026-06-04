import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_lib/cors';
import { rateLimit } from './_lib/rateLimit';

/**
 * Lista archivos de la carpeta de partituras de Drive.
 * Cachea la respuesta 1 hora porque Drive cambia poco.
 */
const FOLDER_ID = process.env.VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER || '1AIUOrDiruV6_H8kPnBUEMONSdS91Ubhv';
const API_KEY = process.env.VITE_GOOGLE_DRIVE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return; // OPTIONS preflight handled

  // 20 req/min per IP — cheap (cached 1h), but limits enumeration attempts
  if (!rateLimit(req, res, 'sheets', 20, 60_000)) return;

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key no configurada' });
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${API_KEY}&fields=files(id,name,mimeType)&pageSize=200`;
    const r = await fetch(url);
    const data = await r.json();

    if (data.error) {
      console.error('Drive list error:', data.error.message);
      return res.status(data.error.code || 500).json({ error: 'No se pudo listar partituras' });
    }

    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).json({ files: data.files || [] });
  } catch (err: any) {
    console.error('sheets list error:', err?.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}

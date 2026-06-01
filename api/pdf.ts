import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proxy que descarga el PDF de Drive y lo sirve desde nuestro dominio
// Esto evita todos los problemas de CORS, cookies y CSP del iframe de Drive
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Falta el parámetro id del archivo Drive' });
  }

  try {
    // URL de descarga directa de Google Drive (archivo público)
    const driveUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;

    const driveRes = await fetch(driveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StellaMaris/1.0)',
      },
    });

    if (!driveRes.ok) {
      return res.status(driveRes.status).json({ error: `Drive respondió ${driveRes.status}` });
    }

    const buffer = await driveRes.arrayBuffer();

    // Forzar application/pdf — Drive a veces devuelve octet-stream
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(Buffer.from(buffer));
  } catch (err: any) {
    res.status(500).json({ error: 'Error descargando el PDF', detalle: err.message });
  }
}

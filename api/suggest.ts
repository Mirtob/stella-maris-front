import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_lib/cors';

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro',
  'gemini-1.0-pro',
];

interface Song {
  id: string;
  title: string;
  category: string;
  author?: string;
  version?: string;
  liturgicalSeason?: string;
  tags?: string[];
}

async function callGemini(apiKey: string, prompt: string, model: string): Promise<string> {
  // Intentar con formato API key en query param (formato estándar)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return; // OPTIONS preflight handled

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' });
  }

  const { songs, season, date, specialDay } = req.body as {
    songs: Song[];
    season: string;
    date: string;
    specialDay?: string;
  };

  if (!songs || songs.length === 0) {
    return res.status(400).json({ error: 'No hay cantos disponibles para sugerir' });
  }

  // Agrupar cantos por categoría para el prompt
  const byCategory: Record<string, string[]> = {};
  songs.forEach(s => {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(`"${s.title}"${s.author ? ` (${s.author})` : ''}${s.liturgicalSeason ? ` [${s.liturgicalSeason}]` : ''}`);
  });

  const cantosList = Object.entries(byCategory)
    .map(([cat, list]) => `${cat}: ${list.join(', ')}`)
    .join('\n');

  const prompt = `Eres un experto en música litúrgica católica.
Ayuda a un coro a elegir cantos apropiados para la Misa.

Contexto:
- Fecha: ${date}
- Tiempo litúrgico: ${season}
${specialDay ? `- Celebración especial: ${specialDay}` : ''}

Cantos disponibles en la biblioteca:
${cantosList}

Basándote en el tiempo litúrgico y los cantos disponibles, sugiere el canto más apropiado para cada parte de la Misa.
Solo sugiere cantos que estén en la lista. Si no hay canto apropiado para una parte, omitila.

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin texto adicional):
{
  "sugerencias": [
    { "categoria": "Entrada", "titulo": "título exacto del canto", "razon": "breve razón litúrgica" },
    { "categoria": "Comunión", "titulo": "título exacto del canto", "razon": "breve razón litúrgica" }
  ],
  "consejo": "Un consejo breve para el coro sobre la celebración de hoy"
}`;

  // Probar modelos hasta que uno funcione
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      const text = await callGemini(apiKey, prompt, model);

      // Extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Respuesta no contiene JSON válido');

      const result = JSON.parse(jsonMatch[0]);
      return res.status(200).json({ ...result, model });
    } catch (err: any) {
      lastError = err.message;
      console.error(`Modelo ${model} falló:`, err.message);
      // Si es error de autenticación, no intentar otros modelos
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('API_KEY')) break;
    }
  }

  return res.status(500).json({
    error: 'No se pudo conectar con Gemini',
    detalle: lastError,
    ayuda: 'Verifica que GEMINI_API_KEY esté correctamente configurada en Vercel Environment Variables',
  });
}

import { useState } from 'react';
import { Song } from '../types';

export interface GeminiSuggestion {
  categoria: string;
  titulo: string;
  razon: string;
}

export interface GeminiResult {
  sugerencias: GeminiSuggestion[];
  consejo: string;
  model?: string;
}

export function useGeminiSuggestions() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getSuggestions = async (songs: Song[], season: string, specialDay?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songs,
          season,
          date: new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          specialDay,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detalle || data.error || 'Error al obtener sugerencias');
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError('No se pudo conectar con el servidor de sugerencias');
    } finally {
      setLoading(false);
    }
  };

  return { getSuggestions, loading, result, error };
}

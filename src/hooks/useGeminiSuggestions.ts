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

  /**
   * Hard timeout for the Gemini call.
   * Gemini puede colgarse hasta 30s con red mala — sin esto, el botón
   * "Sugerir con IA" del coro queda en estado loading indefinidamente,
   * sin forma de cancelar y bloqueando la decisión de armar el cantoral
   * manualmente. 12s es suficiente para una respuesta sana; si tarda
   * más, el coro recibe un mensaje claro y puede seguir manualmente.
   */
  const TIMEOUT_MS = 12_000;

  const getSuggestions = async (songs: Song[], season: string, specialDay?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          songs,
          season,
          date: new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          specialDay,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Map common backend errors to friendlier text for the UI.
        const raw = (data?.error ?? data?.detalle ?? '').toLowerCase();
        if (res.status === 429) {
          setError('Demasiadas consultas a Gemini. Esperá unos segundos e intentá de nuevo.');
        } else if (raw.includes('api key') || res.status === 401 || res.status === 403) {
          setError('Gemini no está configurado correctamente. Avisá al administrador.');
        } else {
          setError(data?.detalle || data?.error || 'Gemini no pudo procesar la sugerencia.');
        }
        return;
      }

      setResult(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Gemini tardó demasiado en responder. Puedes armar el cantoral manualmente.');
      } else {
        setError('No se pudo conectar con el servicio de sugerencias.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return { getSuggestions, loading, result, error };
}

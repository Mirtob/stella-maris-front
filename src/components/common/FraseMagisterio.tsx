import { useEffect, useState } from 'react';
import { FRASES_MAGISTERIO } from '../../data/frasesMagisterio';

/** Cada cuánto cambia la frase: lo justo para leerla con calma. */
const INTERVALO_MS = 8000;

/**
 * Una enseñanza del Magisterio sobre la música sacra, que cambia sola mientras algo
 * carga (pedido del 27-sep-2026, en lugar de "Preparando…" o "Releyendo…").
 *
 * Empieza en una al azar, para que quien abre la app a menudo no lea siempre la misma,
 * y avanza en orden. `aria-live="off"`: un lector de pantalla no la anuncia cada ocho
 * segundos; el avance ya lo informa la barra de progreso.
 */
export function FraseMagisterio({ sobre = 'oscuro', compacta = false }: {
  sobre?: 'oscuro' | 'claro';
  /** Para espacios chicos (una partitura cargando dentro del Atril). */
  compacta?: boolean;
}) {
  const [i, setI] = useState(() => Math.floor(Math.random() * FRASES_MAGISTERIO.length));
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % FRASES_MAGISTERIO.length), INTERVALO_MS);
    return () => window.clearInterval(id);
  }, []);
  const frase = FRASES_MAGISTERIO[i];
  const texto = sobre === 'oscuro' ? 'text-white/90' : 'text-brand-ink';
  const fuente = sobre === 'oscuro' ? 'text-amber-200/80' : 'text-brand-ink-soft';

  return (
    <figure key={i} aria-live="off" className={`animate-fadeIn text-center ${compacta ? 'max-w-[16rem]' : 'max-w-sm'} px-2`}>
      <blockquote className={`italic leading-snug ${compacta ? 'text-xs' : 'text-sm sm:text-base'} ${texto}`}>
        {frase.texto}
      </blockquote>
      <figcaption className={`mt-1 ${compacta ? 'text-[10px]' : 'text-xs'} ${fuente}`}>{frase.fuente}</figcaption>
    </figure>
  );
}

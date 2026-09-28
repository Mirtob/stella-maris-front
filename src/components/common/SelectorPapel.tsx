import { useState } from 'react';
import type { PapelFolleto } from '../../utils/atrilBookletPDF';

const CLAVE = 'stellamaris.folleto.papel';

/**
 * El papel en que se imprime el folleto, recordado en este teléfono o computador.
 *
 * Es una preferencia de quien imprime —no del cantoral—: cada parroquia usa el papel
 * que tiene a mano. Si el almacenamiento no está disponible (modo privado), vale carta.
 */
export function usePapelFolleto(): [PapelFolleto, (p: PapelFolleto) => void] {
  const [papel, setPapel] = useState<PapelFolleto>(() => {
    try { return localStorage.getItem(CLAVE) === 'oficio' ? 'oficio' : 'carta'; } catch { return 'carta'; }
  });
  const elegir = (p: PapelFolleto) => {
    setPapel(p);
    try { localStorage.setItem(CLAVE, p); } catch { /* sin almacenamiento, solo por esta vez */ }
  };
  return [papel, elegir];
}

/** Carta u oficio, en dos botones. Pedido del 27-sep-2026. */
export function SelectorPapel({ papel, onChange, sobre = 'claro' }: {
  papel: PapelFolleto;
  onChange: (p: PapelFolleto) => void;
  sobre?: 'oscuro' | 'claro';
}) {
  const opcion = (valor: PapelFolleto, rotulo: string) => {
    const activa = papel === valor;
    const estilo = activa
      ? 'bg-brand text-white border-brand-border'
      : sobre === 'oscuro'
        ? 'bg-white/10 text-white border-white/30 hover:bg-white/20'
        : 'bg-white/70 dark:bg-white/10 text-brand-ink border-blue-200 dark:border-blue-800 hover:bg-white';
    return (
      <button
        type="button"
        aria-pressed={activa}
        onClick={() => onChange(valor)}
        className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-colors ${estilo}`}
      >
        {rotulo}
      </button>
    );
  };
  return (
    <div role="group" aria-label="Papel para imprimir el folleto" className="flex items-center gap-2">
      <span className={`text-sm font-semibold ${sobre === 'oscuro' ? 'text-white/80' : 'text-brand-ink-soft'}`}>Papel:</span>
      {opcion('carta', 'Carta')}
      {opcion('oficio', 'Oficio')}
    </div>
  );
}

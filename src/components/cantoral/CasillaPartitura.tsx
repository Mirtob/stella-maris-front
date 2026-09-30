interface CasillaPartituraProps {
  checked: boolean;
  onChange: (incluir: boolean) => void;
  /** Qué pasa si se desmarca (una línea). */
  detalle?: string;
}

/**
 * «Incluir la partitura en el folleto», la misma casilla en los tres lugares donde se
 * elige una parte del ordinario: el diálogo «Completar la Misa» del Kyrie, la Misa del
 * Kyriale y la tarjeta del Padre Nuestro. Cada una vale solo para lo que se elige ahí.
 */
export function CasillaPartitura({ checked, onChange, detalle }: CasillaPartituraProps) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl bg-white/70 dark:bg-white/5 border-2 border-blue-200 dark:border-blue-800 cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 flex-shrink-0 accent-blue-700"
      />
      <span className="text-sm text-brand-ink-soft">
        <strong className="text-brand-ink">📄 Incluir la partitura en el folleto</strong>
        {detalle && <><br /><span className="text-xs">{detalle}</span></>}
      </span>
    </label>
  );
}

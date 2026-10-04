import { toast } from 'sonner';

interface CasillaPartituraProps {
  checked: boolean;
  onChange: (incluir: boolean) => void;
  /** Qué lleva el folleto sin la partitura (una línea). */
  detalle?: string;
}

/** El aviso, en un solo lugar: lo dicen la casilla y el mensaje al marcarla. */
export const AVISO_PARTITURA_FOLLETO =
  'Para que se lean, las partituras van a todo el ancho de la plana: el folleto pasará de una hoja a dos.';

/**
 * «Incluir la partitura en el folleto», la misma casilla en los tres lugares donde se
 * elige una parte del ordinario: el diálogo «Completar la Misa» del Kyrie, la Misa del
 * Kyriale y la tarjeta del Padre Nuestro. Cada una vale solo para lo que se elige ahí.
 *
 * Viene DESMARCADA (4-oct-2026): probado en una Misa real, la partitura legible ocupa
 * el ancho de la plana y el folleto se va a dos hojas. Al marcarla se avisa.
 */
export function CasillaPartitura({ checked, onChange, detalle }: CasillaPartituraProps) {
  const cambiar = (incluir: boolean) => {
    if (incluir) toast.warning('El folleto pasará a dos hojas', { description: AVISO_PARTITURA_FOLLETO });
    onChange(incluir);
  };
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl bg-white/70 dark:bg-white/5 border-2 border-blue-200 dark:border-blue-800 cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => cambiar(e.target.checked)}
        className="mt-0.5 w-5 h-5 flex-shrink-0 accent-blue-700"
      />
      <span className="text-sm text-brand-ink-soft">
        <strong className="text-brand-ink">📄 Incluir la partitura en el folleto</strong>
        {checked ? (
          <>
            <br />
            <span className="text-xs text-amber-700 dark:text-amber-300">⚠️ {AVISO_PARTITURA_FOLLETO}</span>
          </>
        ) : detalle && (
          <>
            <br />
            <span className="text-xs">{detalle}</span>
          </>
        )}
      </span>
    </label>
  );
}

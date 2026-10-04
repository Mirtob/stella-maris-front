import { useId, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface CasillaPartituraProps {
  checked: boolean;
  onChange: (incluir: boolean) => void;
  /** Qué lleva el folleto sin la partitura (una línea). */
  detalle?: string;
}

/** El aviso, en un solo lugar: lo dicen el diálogo y la casilla marcada. */
export const AVISO_PARTITURA_FOLLETO =
  'Para que se lean, las partituras van a todo el ancho de la plana: el folleto pasará de una hoja a dos.';

/**
 * «Incluir la partitura en el folleto», la misma casilla en los tres lugares donde se
 * elige una parte del ordinario: el diálogo «Completar la Misa» del Kyrie, la Misa del
 * Kyriale y la tarjeta del Padre Nuestro. Cada una vale solo para lo que se elige ahí.
 *
 * Viene DESMARCADA (4-oct-2026): probado en una Misa real, la partitura legible ocupa
 * el ancho de la plana y el folleto se va a dos hojas. Marcarla PREGUNTA primero, con un
 * diálogo que no se puede pasar por alto (un aviso flotante se iba sin que nadie lo
 * leyera), y mientras está marcada el recuadro lo sigue diciendo en ámbar.
 */
export function CasillaPartitura({ checked, onChange, detalle }: CasillaPartituraProps) {
  const [preguntando, setPreguntando] = useState(false);
  const tituloId = useId();

  const cambiar = (incluir: boolean) => {
    if (incluir) setPreguntando(true);   // se confirma en el diálogo
    else onChange(false);
  };

  return (
    <>
      <label
        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors
          ${checked
            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 dark:border-amber-500'
            : 'bg-white/70 dark:bg-white/5 border-blue-200 dark:border-blue-800'}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => cambiar(e.target.checked)}
          className="mt-0.5 w-5 h-5 flex-shrink-0 accent-amber-600"
        />
        <span className="text-sm text-brand-ink-soft min-w-0">
          <strong className="text-brand-ink">📄 Incluir la partitura en el folleto</strong>
          {checked ? (
            <span className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden />
              <span>{AVISO_PARTITURA_FOLLETO}</span>
            </span>
          ) : detalle && (
            <>
              <br />
              <span className="text-xs">{detalle}</span>
            </>
          )}
        </span>
      </label>

      <Modal
        open={preguntando}
        onClose={() => setPreguntando(false)}
        labelledById={tituloId}
        panelClassName="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-amber-500"
      >
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 flex-shrink-0" strokeWidth={2.5} aria-hidden />
          <h3 id={tituloId} className="text-xl font-bold leading-tight">El folleto pasará a dos hojas</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-base text-brand-ink leading-relaxed">
            Para que se puedan leer, las partituras se imprimen a <strong>todo el ancho de la plana</strong>.
            Por su tamaño, el folleto pasa de <strong>una hoja a dos</strong>.
          </p>
          <p className="text-sm text-brand-ink-soft">
            Sin la partitura, el folleto lleva solo la letra y cabe en una hoja.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => { setPreguntando(false); onChange(true); }}
              className="w-full py-3 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 border-2 border-amber-800 active:scale-95 transition-all"
            >
              Sí, incluir las partituras
            </button>
            <button
              type="button"
              onClick={() => setPreguntando(false)}
              className="w-full py-3 px-4 rounded-2xl font-bold text-brand-ink bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 active:scale-95 transition-all"
            >
              No, solo la letra
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

import { BookOpenText, Check } from 'lucide-react';
import { resolveAntiphons, conCita } from '../../data/antiphonIndex';
import { getLiturgicalDateForDate } from '../../utils/liturgicalCalendar';
import type { ParteConAntifona } from '../../utils/antiphonSong';

interface MassAntiphonProps {
  /** Fecha de la Misa, 'YYYY-MM-DD'. De ahí sale la celebración y su antífona. */
  date: string;
  parte: ParteConAntifona;
  /** Texto en la caja (el del Misal, o lo que el coro haya corregido). */
  value: string;
  onChange: (value: string) => void;
  /** ¿Se imprime en el folleto del pueblo? */
  incluir: boolean;
  onIncluirChange: (incluir: boolean) => void;
}

const ROTULO: Record<ParteConAntifona, { titulo: string; cuando: string }> = {
  'Entrada': {
    titulo: 'Antífona de entrada',
    cuando: 'Se canta después del canto de entrada.',
  },
  'Comunión': {
    titulo: 'Antífona de comunión',
    cuando: 'Se canta cuando el sacerdote empieza a comulgar.',
  },
};

/**
 * La antífona propia del día, en el constructor.
 *
 * Es el texto del Misal para esa celebración: se carga solo al elegir la fecha, se
 * puede corregir a mano —la fuente trae alguna errata, y hay parroquias que usan otra
 * traducción— y una casilla decide si viaja al cantoral y al folleto del pueblo.
 *
 * No reemplaza al canto de entrada ni al de comunión: se suma a ellos. Por eso vive
 * junto a su parte y no en lugar de ella.
 */
export function MassAntiphon({
  date, parte, value, onChange, incluir, onIncluirChange,
}: MassAntiphonProps) {
  const celebracion = date ? getLiturgicalDateForDate(date) : '';
  const delMisal = celebracion ? resolveAntiphons(celebracion) : null;
  const { titulo, cuando } = ROTULO[parte];

  const textoMisal = parte === 'Entrada'
    ? conCita(delMisal?.entrada, delMisal?.entradaCita)
    : conCita(delMisal?.comunion, delMisal?.comunionCita);
  const alternativa = parte === 'Entrada'
    ? conCita(delMisal?.entradaAlt, delMisal?.entradaAltCita)
    : conCita(delMisal?.comunionAlt, delMisal?.comunionAltCita);

  return (
    <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-amber-300/70 dark:border-amber-700/70 transition-colors">
      <div className="flex items-start gap-2 mb-2">
        <BookOpenText className="w-5 h-5 flex-shrink-0 text-amber-700 dark:text-amber-300 mt-0.5" strokeWidth={2.5} />
        <div className="min-w-0">
          <h4 className="text-base font-bold text-brand-ink leading-tight">{titulo}</h4>
          <p className="text-xs text-brand-ink-soft">{cuando}</p>
        </div>
      </div>

      {!date ? (
        <p className="text-sm text-brand-ink-soft">Elige la fecha de la Misa para cargar la antífona.</p>
      ) : (
        <>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={textoMisal ? 'Antífona del Misal (editable)…' : 'Escribe la antífona…'}
            className="w-full px-3 py-2 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-brand-ink font-semibold focus:outline-none focus:border-amber-500 resize-y"
          />

          {/* Lo que trae el Misal, a mano: para volver atrás tras corregir de más, y
              para la segunda opción, que el Misal ofrece en casi todas. */}
          <div className="mt-2 space-y-1">
            {textoMisal && value.trim() !== textoMisal && (
              <button
                type="button"
                onClick={() => onChange(textoMisal)}
                className="text-xs text-left text-amber-800 dark:text-amber-300 underline"
              >
                Usar la del Misal: «{textoMisal.length > 90 ? `${textoMisal.slice(0, 90)}…` : textoMisal}»
              </button>
            )}
            {alternativa && value.trim() !== alternativa && (
              <button
                type="button"
                onClick={() => onChange(alternativa)}
                className="block text-xs text-left text-amber-800 dark:text-amber-300 underline"
              >
                O bien: «{alternativa.length > 90 ? `${alternativa.slice(0, 90)}…` : alternativa}»
              </button>
            )}
            {!textoMisal && celebracion && (
              <p className="text-xs text-brand-ink-soft">
                El Misal que usamos no trae la antífona de «{celebracion}». Puedes escribirla.
              </p>
            )}
          </div>

          <label className="mt-3 flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={incluir}
              onChange={(e) => onIncluirChange(e.target.checked)}
              disabled={!value.trim()}
              className="w-5 h-5 mt-0.5 flex-shrink-0 rounded border-2 border-amber-600 accent-amber-600 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-brand-ink">
                Incluirla en el cantoral y en el folleto
              </span>
              <span className="block text-xs text-brand-ink-soft">
                {incluir
                  ? <><Check className="w-3 h-3 inline" /> Se imprime en el folleto del pueblo, después del canto de {parte === 'Entrada' ? 'entrada' : 'comunión'}.</>
                  : 'Sin marcar, queda solo como referencia aquí y no se publica.'}
              </span>
            </span>
          </label>
        </>
      )}
    </div>
  );
}

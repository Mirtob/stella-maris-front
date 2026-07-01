import { useEffect, useState } from 'react';
import { Church, Calendar, Clock, ChevronRight } from 'lucide-react';
import { PublishedCantoral } from '../../types';
import { listCantorals } from '../../services/cantorals';
import { cantoralYaPaso, massTypeBadge } from '../../utils/massType';
import { formatYmdForDisplay } from '../../utils/dateLocal';
import { splitActiveParish } from '../../utils/parish';
import { CantoralDeepLink } from './CantoralDeepLink';
import { LoadingScreen } from '../common/LoadingScreen';

interface ParishCantoralLinkProps {
  /** Cadena de parroquia/capilla codificada en el QR permanente. */
  parish: string;
  onOpenInApp: (cantoral: PublishedCantoral) => void;
  onExit: () => void;
}

type State =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'choose'; options: PublishedCantoral[] }
  | { kind: 'one'; id: string };

/**
 * Landing del enlace PERMANENTE de parroquia (`/i/{parroquia}`). Resuelve al cantoral
 * VIGENTE de esa parroquia/capilla (misma lógica de vigencia que la lista del Pueblo
 * fiel). Si hay una sola Misa vigente en la fecha más próxima, la abre directo; si hay
 * varias ese mismo día, muestra una lista para elegir; si no hay ninguna, avisa.
 */
export function ParishCantoralLink({ parish, onOpenInApp, onExit }: ParishCantoralLinkProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [chosenId, setChosenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    setChosenId(null);
    (async () => {
      const all = await listCantorals(parish);
      if (cancelled) return;
      const now = new Date();
      const vigentes = all
        .filter((c) => c.status === 'published' && !cantoralYaPaso(c, now))
        .sort((a, b) =>
          a.date < b.date ? -1 : a.date > b.date ? 1 : (a.massTime || '').localeCompare(b.massTime || '')
        );
      if (vigentes.length === 0) {
        setState({ kind: 'empty' });
        return;
      }
      // Misas de la fecha vigente más próxima ("ese día").
      const nearestDate = vigentes[0].date;
      const group = vigentes.filter((c) => c.date === nearestDate);
      if (group.length === 1) setState({ kind: 'one', id: group[0].id });
      else setState({ kind: 'choose', options: group });
    })();
    return () => {
      cancelled = true;
    };
  }, [parish]);

  // Si ya hay un cantoral resuelto/elegido, mostrarlo con el visor existente.
  const activeId = chosenId ?? (state.kind === 'one' ? state.id : null);
  if (activeId) {
    return (
      <CantoralDeepLink
        cantoralId={activeId}
        onOpenInApp={onOpenInApp}
        onCancel={() => {
          // Si venimos de una lista, volver a la lista; si no, salir.
          if (state.kind === 'choose') setChosenId(null);
          else onExit();
        }}
      />
    );
  }

  if (state.kind === 'loading') return <LoadingScreen />;

  const { parishFull, chapel } = splitActiveParish(parish);
  const parishLabel = parishFull || parish;

  if (state.kind === 'empty') {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-soft dark:bg-blue-900/40 text-brand flex items-center justify-center mb-5">
          <Church className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-brand-ink mb-2">Aún no hay cantoral</h1>
        <p className="text-brand-ink-soft max-w-sm mb-1">
          Todavía no hay un cantoral publicado y vigente para las próximas misas de:
        </p>
        <p className="font-bold text-brand-ink mb-6">
          {parishLabel}
          {chapel ? ` · ${chapel}` : ''}
        </p>
        <button
          onClick={onExit}
          className="bg-gradient-to-br from-brand to-brand-strong text-white px-6 py-3 rounded-2xl font-bold shadow-lg active:scale-95 border-2 border-brand-border"
        >
          Ir a la app
        </button>
      </div>
    );
  }

  // choose — varias Misas vigentes en la fecha más próxima.
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-4 sm:p-6">
      <div className="max-w-md mx-auto pt-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Church className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-brand-ink">{parishLabel}</h1>
          {chapel && <p className="text-sm text-brand-ink-soft">{chapel}</p>}
          <p className="text-sm text-brand-ink-soft mt-2">Elige tu Misa:</p>
        </div>
        <div className="space-y-3">
          {state.options.map((c) => {
            const badge = massTypeBadge(c);
            return (
              <button
                key={c.id}
                onClick={() => setChosenId(c.id)}
                className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 dark:border-white/20 p-4 flex items-center gap-3 text-left active:scale-[0.99] hover:bg-white/80 dark:hover:bg-white/15 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-brand-ink truncate">
                    {c.massTime || 'Misa'}
                    {badge ? ` · ${badge}` : ''}
                  </div>
                  <div className="text-sm text-brand-ink-soft truncate flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {c.liturgicalDate || formatYmdForDisplay(c.date)}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-brand flex-shrink-0" />
              </button>
            );
          })}
        </div>
        <button onClick={onExit} className="w-full mt-6 py-3 text-sm font-bold text-brand-ink-soft hover:underline">
          Ir a la app
        </button>
      </div>
    </div>
  );
}

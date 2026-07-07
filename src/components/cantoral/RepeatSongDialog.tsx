import { AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  title: string;          // título del canto
  prevParts: string[];    // partes en que se usó la semana pasada
  currentPart: string;    // parte a la que se está agregando ahora
  season: string;         // tiempo litúrgico actual
  label: string;          // referencia del cantoral anterior (celebración/fecha)
  onConfirm: () => void;
  onCancel: () => void;
}

const FLEX_PARTS = ['Entrada', 'Ofertorio', 'Comunión', 'Salida'];

/**
 * Aviso al elegir un canto que ya se usó en el cantoral anterior (la "semana pasada").
 * En Adviento/Cuaresma (repertorio más corto) NO desalienta repetir: sugiere usarlo en
 * OTRA parte para dar variedad. En el resto del año invita a elegir otro canto.
 */
export function RepeatSongDialog({ title, prevParts, currentPart, season, label, onConfirm, onCancel }: Props) {
  const isAdventLent = /adviento|cuaresma/i.test(season || '');
  const sameSpot = prevParts.includes(currentPart);
  const prevText = prevParts.join(' y ');
  const alts = FLEX_PARTS.filter((p) => !prevParts.includes(p) && p !== currentPart).slice(0, 2);
  const altText = alts.length ? alts.join(' o ') : 'otra parte';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full border-4 border-amber-300 dark:border-amber-700 overflow-hidden">
        <div className={`p-5 text-white flex items-center gap-3 ${isAdventLent ? 'bg-gradient-to-r from-purple-600 to-purple-800' : 'bg-gradient-to-r from-amber-500 to-orange-600'}`}>
          {isAdventLent ? <Sparkles className="w-8 h-8 flex-shrink-0" strokeWidth={2.5} /> : <AlertCircle className="w-8 h-8 flex-shrink-0" strokeWidth={2.5} />}
          <div>
            <h2 className="text-lg font-bold leading-tight">Ya lo usaron hace poco</h2>
            <p className="text-white/90 text-sm">«{title}»</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-brand-ink">
            La semana pasada ({label}) lo usaron como <strong>{prevText}</strong>.
          </p>

          {isAdventLent ? (
            sameSpot ? (
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-3 text-sm text-purple-900 dark:text-purple-100">
                En <strong>{season}</strong> hay menos cantos, así que <strong>repetir está bien</strong>. Para dar variedad,
                puedes usarlo en <strong>{altText}</strong> en vez de <strong>{currentPart}</strong>.
                <div className="mt-2 flex items-center gap-1 font-bold text-purple-700 dark:text-purple-300">
                  {currentPart} <ArrowRight className="w-4 h-4" /> {alts[0] ?? 'otra parte'}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-3 text-sm text-green-900 dark:text-green-100">
                ¡Buena! Ya lo estás variando: la semana pasada fue <strong>{prevText}</strong> y ahora irá como <strong>{currentPart}</strong>. 👍
              </div>
            )
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-900 dark:text-amber-100">
              Con el repertorio de <strong>{season}</strong> conviene <strong>elegir otro canto</strong> para {currentPart} y darle variedad a la Misa.
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 dark:bg-slate-800 text-brand-ink py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-slate-700 active:scale-95 transition-all"
            >
              Elegir otro
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-brand to-brand-strong text-white py-3 rounded-xl font-bold active:scale-95 transition-all border-2 border-brand-border"
            >
              Agregarlo igual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

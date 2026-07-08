import { useEffect, useState } from 'react';
import { X, Trophy, Loader, Users, GraduationCap } from 'lucide-react';
import { getCourseRanking, type RankingRow } from '../../services/courseProgress';

interface Props {
  userId: string;
  myParish?: string;
  onClose: () => void;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export function CourseRankingModal({ myParish, onClose }: Props) {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCourseRanking().then((r) => { if (!cancelled) { setRows(r); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full border-4 border-amber-300 dark:border-amber-800 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5">
          <Trophy className="w-7 h-7 flex-shrink-0" strokeWidth={2.5} />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-tight">Ranking de coros</h2>
            <p className="text-amber-100 text-sm">Cápsulas de formación completadas por parroquia</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400"><Loader className="w-7 h-7 animate-spin" /><p className="text-sm">Cargando ranking…</p></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <GraduationCap className="w-10 h-10 mx-auto mb-2" />
              <p className="font-semibold">Aún no hay avances registrados</p>
              <p className="text-sm">¡Sé el primer coro en formarse!</p>
            </div>
          ) : (
            <ol className="space-y-2">
              {rows.map((r, i) => {
                const mine = !!myParish && r.parish === myParish;
                return (
                  <li key={r.parish} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${mine ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700'}`}>
                    <span className="w-8 text-center text-lg font-extrabold text-brand-ink flex-shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>{MEDAL[i] || i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-brand-ink leading-tight truncate">{r.parish}{mine && ' · tu coro'}</div>
                      <div className="text-xs text-brand-ink-soft flex items-center gap-2">
                        <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {r.members}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.capsules}</div>
                      <div className="text-[10px] uppercase tracking-wide text-brand-ink-soft">cápsulas</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="text-xs text-gray-400 mt-4 text-center">Muestra totales por parroquia, sin datos personales. Formarse en comunidad anima a todos. 🎵</p>
        </div>
      </div>
    </div>
  );
}

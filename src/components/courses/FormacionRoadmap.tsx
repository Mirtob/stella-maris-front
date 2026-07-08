import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Flame, CheckCircle2, Lock, PlayCircle, Award, ChevronRight, Circle, RefreshCw } from 'lucide-react';
import { CURRICULUM, ACTIVE_CAPSULES, EJE_META, MODULE_BADGES, isModuleDone, findCapsule, type Capsule } from '../../data/courseCurriculum';
import { getMyProgress, completeCapsule, computeStreakWeeks, type CapsuleProgress } from '../../services/courseProgress';
import { CapsuleView } from './CapsuleView';
import { CertificateModal } from './CertificateModal';

export function FormacionRoadmap({ userId, userName }: { userId: string; userName?: string }) {
  const [showCertificate, setShowCertificate] = useState(false);
  const [progress, setProgress] = useState<CapsuleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyProgress(userId).then((p) => { if (!cancelled) { setProgress(p); setLoading(false); } });
    return () => { cancelled = true; };
  }, [userId]);

  const completed = useMemo(() => new Set(progress.map((p) => p.capsuleId)), [progress]);
  const streak = useMemo(() => computeStreakWeeks(progress.map((p) => p.completedAt)), [progress]);

  // Desbloqueo lineal: una cápsula está disponible si es la primera o la anterior está hecha.
  const isUnlocked = (idx: number) => idx === 0 || completed.has(ACTIVE_CAPSULES[idx - 1].id);
  const nextIdx = ACTIVE_CAPSULES.findIndex((c, i) => !completed.has(c.id) && isUnlocked(i));
  const nextCapsule = nextIdx >= 0 ? ACTIVE_CAPSULES[nextIdx] : null;
  const doneCount = ACTIVE_CAPSULES.filter((c) => completed.has(c.id)).length;
  const allDone = doneCount === ACTIVE_CAPSULES.length;

  // Repaso espaciado: la cápsula completada más antigua (≥ 1 semana) vuelve para repasar.
  const reviewCapsule = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const oldest = [...progress].sort((a, b) => (a.completedAt < b.completedAt ? -1 : 1));
    for (const p of oldest) {
      if (new Date(p.completedAt).getTime() <= weekAgo) {
        const cap = findCapsule(p.capsuleId);
        if (cap) return cap;
      }
    }
    return null;
  }, [progress]);

  const handlePass = async (capsule: Capsule, score: number) => {
    if (completed.has(capsule.id)) return;
    setProgress((prev) => [...prev, { capsuleId: capsule.id, quizScore: score, completedAt: new Date().toISOString() }]);
    await completeCapsule(userId, capsule.id, score);
  };

  // ── Vista de una cápsula ──
  if (selectedId) {
    const cap = findCapsule(selectedId);
    if (cap) {
      const idx = ACTIVE_CAPSULES.findIndex((c) => c.id === cap.id);
      const next = ACTIVE_CAPSULES[idx + 1];
      return (
        <CapsuleView
          capsule={cap}
          done={completed.has(cap.id)}
          hasNext={!!next}
          onBack={() => setSelectedId(null)}
          onNext={() => next && setSelectedId(next.id)}
          onPass={(score) => handlePass(cap, score)}
        />
      );
    }
  }

  const year1 = CURRICULUM[0];
  const pct = Math.round((doneCount / ACTIVE_CAPSULES.length) * 100);

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-8">
        {/* Cabecera */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-brand to-brand-strong rounded-full flex items-center justify-center shadow-lg border-4 border-brand-border">
              <GraduationCap className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-brand-ink">Camino de formación</h1>
          <p className="text-brand-ink-soft mt-1">Formación teológico-litúrgica y musical, paso a paso</p>
        </div>

        {/* Racha + progreso */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-orange-200 dark:border-orange-900 flex items-center gap-3">
            <Flame className={`w-9 h-9 flex-shrink-0 ${streak > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-slate-600'}`} strokeWidth={2.2} />
            <div>
              <div className="text-2xl font-extrabold text-brand-ink leading-none">{streak}</div>
              <div className="text-xs text-brand-ink-soft">{streak === 1 ? 'semana' : 'semanas'} de racha</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-900">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-brand-ink leading-none">{doneCount}<span className="text-base text-brand-ink-soft">/{ACTIVE_CAPSULES.length}</span></span>
              <span className="text-xs text-brand-ink-soft">{pct}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-strong transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Continuar */}
        {!loading && nextCapsule && (
          <button onClick={() => setSelectedId(nextCapsule.id)} className="w-full mb-6 bg-gradient-to-r from-brand to-brand-strong text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg border-2 border-brand-border active:scale-[0.99] transition-all text-left">
            <PlayCircle className="w-9 h-9 flex-shrink-0" strokeWidth={2.2} />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide text-blue-200 font-bold">{doneCount === 0 ? 'Empieza aquí' : 'Continuar'}</div>
              <div className="font-bold leading-tight truncate">{nextCapsule.n}. {nextCapsule.title}</div>
            </div>
            <ChevronRight className="w-6 h-6 flex-shrink-0" />
          </button>
        )}
        {!loading && allDone && (
          <button onClick={() => setShowCertificate(true)} className="w-full mb-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg border-2 border-amber-700 active:scale-[0.99] transition-all text-left">
            <Award className="w-9 h-9 flex-shrink-0" strokeWidth={2.2} />
            <div className="flex-1 min-w-0"><div className="font-bold leading-tight">¡Completaste el Año 1!</div><div className="text-sm text-amber-50">Toca para ver tu certificado</div></div>
            <ChevronRight className="w-6 h-6 flex-shrink-0" />
          </button>
        )}

        {/* Repaso espaciado */}
        {!loading && reviewCapsule && (
          <button onClick={() => setSelectedId(reviewCapsule.id)} className="w-full mb-6 bg-white dark:bg-slate-800 border-2 border-teal-300 dark:border-teal-800 p-4 rounded-2xl flex items-center gap-3 active:scale-[0.99] transition-all text-left">
            <RefreshCw className="w-8 h-8 flex-shrink-0 text-teal-600 dark:text-teal-400" strokeWidth={2.2} />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide font-bold text-teal-700 dark:text-teal-300">Repaso de la semana</div>
              <div className="font-bold text-brand-ink leading-tight truncate">{reviewCapsule.n}. {reviewCapsule.title}</div>
            </div>
            <ChevronRight className="w-6 h-6 flex-shrink-0 text-teal-600 dark:text-teal-400" />
          </button>
        )}

        {/* Insignias */}
        {!loading && (
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9a7636' }}>Insignias</div>
            <div className="grid grid-cols-4 gap-2">
              {CURRICULUM[0].modules.map((mod) => {
                const earned = isModuleDone(mod, completed);
                const badge = MODULE_BADGES[mod.id];
                return (
                  <div key={mod.id} className={`rounded-xl p-2 text-center border-2 ${earned ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' : 'bg-gray-100 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'}`}>
                    <div className={`text-2xl leading-none ${earned ? '' : 'grayscale opacity-40'}`}>{badge?.emoji}</div>
                    <div className={`text-[10px] leading-tight mt-1 font-semibold ${earned ? 'text-brand-ink' : 'text-gray-400'}`}>{badge?.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Track Año 1 */}
        <div className="mb-2">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9a7636' }}>{year1.cycle}</div>
          <h2 className="text-xl font-bold text-brand-ink">{year1.title}</h2>
          <p className="text-sm italic text-brand-ink-soft">«{year1.motto}»</p>
        </div>

        <div className="space-y-5 mt-4">
          {year1.modules.map((mod) => (
            <div key={mod.id}>
              <div className="flex items-baseline gap-2 mb-2 border-b-2 pb-1" style={{ borderColor: '#e0d6bd' }}>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9a7636' }}>{mod.term}</span>
                <span className="font-bold text-brand-ink text-sm">{mod.title}</span>
              </div>
              <div className="space-y-2">
                {mod.capsules.map((cap) => {
                  const idx = ACTIVE_CAPSULES.findIndex((c) => c.id === cap.id);
                  const isDone = completed.has(cap.id);
                  const unlocked = isUnlocked(idx);
                  const isNext = nextCapsule?.id === cap.id;
                  const eje = EJE_META[cap.eje];
                  return (
                    <button
                      key={cap.id}
                      disabled={!unlocked}
                      onClick={() => unlocked && setSelectedId(cap.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        isDone ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : isNext ? 'bg-white dark:bg-slate-800 border-brand shadow-md'
                        : unlocked ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                        : 'bg-gray-100 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 opacity-70'}`}
                    >
                      <span className="flex-shrink-0">
                        {isDone ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                          : !unlocked ? <Lock className="w-5 h-5 text-gray-400" />
                          : isNext ? <PlayCircle className="w-6 h-6 text-brand" />
                          : <Circle className="w-5 h-5 text-gray-300 dark:text-slate-600" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-brand-ink leading-tight truncate">{cap.n}. {cap.title}</span>
                        <span className="text-xs text-brand-ink-soft">{cap.duration}</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-white px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: eje.color }}>{eje.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Certificado */}
        <div className="mt-6 bg-white/60 dark:bg-white/5 border-2 border-dashed rounded-2xl p-4 flex items-center gap-3" style={{ borderColor: '#d8cfb8' }}>
          <Award className="w-8 h-8 flex-shrink-0" style={{ color: '#9a7636' }} />
          <p className="text-sm text-brand-ink-soft">Al completar las {ACTIVE_CAPSULES.length} cápsulas obtienes el certificado <strong className="text-brand-ink">{year1.certificate}</strong>.</p>
        </div>

        {/* Próximos ciclos */}
        <div className="mt-6 space-y-3">
          {CURRICULUM.filter((t) => t.status === 'coming').map((t) => (
            <div key={t.id} className="bg-gray-100 dark:bg-slate-800/50 rounded-2xl p-4 border-2 border-gray-200 dark:border-slate-700 flex items-center gap-3 opacity-80">
              <Lock className="w-6 h-6 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9a7636' }}>{t.cycle}</div>
                <div className="font-bold text-brand-ink leading-tight">{t.title}</div>
                <div className="text-xs italic text-brand-ink-soft">«{t.motto}»</div>
              </div>
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Próximamente</span>
            </div>
          ))}
        </div>

        {showCertificate && (
          <CertificateModal
            name={userName || 'Miembro del coro'}
            title={year1.certificate || 'Cantor Litúrgico — Fundamentos'}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </div>
    </div>
  );
}

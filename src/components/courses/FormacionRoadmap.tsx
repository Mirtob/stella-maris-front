import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Flame, CheckCircle2, Lock, PlayCircle, Award, ChevronRight, Circle, RefreshCw, Trophy, Sparkles } from 'lucide-react';
import {
  CURRICULUM, PERMANENT_CAPSULES, EJE_META, MODULE_BADGES,
  trackCapsules, isModuleDone, isTrackDone, findCapsule, type Capsule, type Track,
} from '../../data/courseCurriculum';
import { getMyProgress, completeCapsule, computeStreakWeeks, type CapsuleProgress } from '../../services/courseProgress';
import { getCourseVideos } from '../../services/courseVideoLoader';
import { getVideoUrl } from '../../services/youtube';
import { CapsuleView } from './CapsuleView';
import { CertificateModal } from './CertificateModal';
import { CourseRankingModal } from './CourseRankingModal';

const trackById: Record<string, Track> = Object.fromEntries(CURRICULUM.map((t) => [t.id, t]));

export function FormacionRoadmap({ userId, userName, userParish }: { userId: string; userName?: string; userParish?: string }) {
  const [progress, setProgress] = useState<CapsuleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [videoMap, setVideoMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    getMyProgress(userId).then((p) => { if (!cancelled) { setProgress(p); setLoading(false); } });
    getCourseVideos().then((m) => { if (!cancelled) setVideoMap(m); });
    return () => { cancelled = true; };
  }, [userId]);

  const videoUrlFor = (id: string) => (videoMap[id] ? getVideoUrl(videoMap[id]) : undefined);

  const completed = useMemo(() => new Set(progress.map((p) => p.capsuleId)), [progress]);
  const scoreById = useMemo(() => Object.fromEntries(progress.map((p) => [p.capsuleId, p.quizScore])), [progress]);
  const streak = useMemo(() => computeStreakWeeks(progress.map((p) => p.completedAt)), [progress]);

  // Desbloqueo POR TRACK: un track se abre si no depende de otro (paralelo) o si su
  // dependencia está completa; dentro del track, las cápsulas se abren en orden.
  const trackOpen = (t: Track) => !t.requiresTrack || isTrackDone(trackById[t.requiresTrack], completed);
  const capUnlocked = (t: Track, cap: Capsule) => {
    if (!trackOpen(t)) return false;
    const caps = trackCapsules(t);
    const j = caps.findIndex((c) => c.id === cap.id);
    return j <= 0 ? j === 0 : completed.has(caps[j - 1].id);
  };
  let nextCapsule: Capsule | null = null;
  for (const t of CURRICULUM) {
    const c = trackCapsules(t).find((x) => !completed.has(x.id) && capUnlocked(t, x));
    if (c) { nextCapsule = c; break; }
  }

  const y1 = CURRICULUM[0];
  const y1Caps = trackCapsules(y1);
  const y1Done = y1Caps.filter((c) => completed.has(c.id)).length;
  const y1AllDone = y1Done === y1Caps.length;
  const pct = Math.round((y1Done / y1Caps.length) * 100);

  const reviewCapsule = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const oldest = [...progress].sort((a, b) => (a.completedAt < b.completedAt ? -1 : 1));
    for (const p of oldest) {
      if (new Date(p.completedAt).getTime() <= weekAgo) {
        const c = findCapsule(p.capsuleId);
        if (c) return c;
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
    const capsule = findCapsule(selectedId);
    if (capsule) {
      const t = CURRICULUM.find((tr) => trackCapsules(tr).some((c) => c.id === capsule.id));
      const tcaps = t ? trackCapsules(t) : [];
      const j = tcaps.findIndex((c) => c.id === capsule.id);
      const next = j >= 0 ? tcaps[j + 1] : undefined;
      return (
        <CapsuleView
          capsule={capsule}
          done={completed.has(capsule.id)}
          hasNext={!!next}
          videoUrl={videoUrlFor(capsule.id)}
          onBack={() => setSelectedId(null)}
          onNext={() => next && setSelectedId(next.id)}
          onPass={(score) => handlePass(capsule, score)}
        />
      );
    }
  }

  const gold = '#9a7636';

  const CapsuleRow = ({ track, cap }: { track: Track; cap: Capsule }) => {
    const isDone = completed.has(cap.id);
    const unlocked = capUnlocked(track, cap);
    const isNext = nextCapsule?.id === cap.id;
    const eje = EJE_META[cap.eje];
    return (
      <button
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
          <span className="text-xs text-brand-ink-soft">
            {cap.duration}
            {isDone && cap.quiz && cap.quiz.length > 0 && scoreById[cap.id] != null && ` · quiz ${scoreById[cap.id]}/${cap.quiz.length}`}
          </span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-white px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: eje.color }}>{eje.label}</span>
      </button>
    );
  };

  const renderTrack = (track: Track, index: number) => {
    const caps = trackCapsules(track);
    const open = trackOpen(track);
    const doneCount = caps.filter((c) => completed.has(c.id)).length;
    const done = doneCount === caps.length && caps.length > 0;
    return (
      <div key={track.id} className="mt-8">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: gold }}>{track.cycle}</div>
            <h2 className="text-xl font-bold text-brand-ink leading-tight">{track.title}</h2>
            <p className="text-sm italic text-brand-ink-soft">«{track.motto}»</p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-bold text-brand-ink-soft" style={{ fontVariantNumeric: 'tabular-nums' }}>{doneCount}/{caps.length}</span>
            {done ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : !open ? <Lock className="w-5 h-5 text-gray-400" /> : null}
          </div>
        </div>
        {!open && (
          <p className="text-xs text-brand-ink-soft mt-1 mb-1">🔒 Se abre al completar el ciclo anterior · vista previa del contenido</p>
        )}
        <div className="space-y-5 mt-3">
          {track.modules.map((mod) => (
            <div key={mod.id}>
              <div className="flex items-baseline gap-2 mb-2 border-b-2 pb-1" style={{ borderColor: '#e0d6bd' }}>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: gold }}>{mod.term}</span>
                <span className="font-bold text-brand-ink text-sm">{mod.title}</span>
                {MODULE_BADGES[mod.id] && isModuleDone(mod, completed) && <span className="ml-auto text-base">{MODULE_BADGES[mod.id].emoji}</span>}
              </div>
              <div className="space-y-2">
                {mod.capsules.map((cap) => <CapsuleRow key={cap.id} track={track} cap={cap} />)}
              </div>
            </div>
          ))}
        </div>
        {track.certificate && (
          <div className="mt-4 flex items-center gap-2 text-sm text-brand-ink-soft">
            <Award className="w-5 h-5 flex-shrink-0" style={{ color: gold }} />
            <span>Certificado: <strong className="text-brand-ink">{track.certificate}</strong></span>
          </div>
        )}
      </div>
    );
  };

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

        {/* Racha + progreso del Año 1 */}
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
              <span className="text-2xl font-extrabold text-brand-ink leading-none">{y1Done}<span className="text-base text-brand-ink-soft">/{y1Caps.length}</span></span>
              <span className="text-xs text-brand-ink-soft">Año 1 · {pct}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-strong transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Continuar */}
        {!loading && nextCapsule && (
          <button onClick={() => setSelectedId(nextCapsule.id)} className="w-full mb-4 bg-gradient-to-r from-brand to-brand-strong text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg border-2 border-brand-border active:scale-[0.99] transition-all text-left">
            <PlayCircle className="w-9 h-9 flex-shrink-0" strokeWidth={2.2} />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide text-blue-200 font-bold">{completed.size === 0 ? 'Empieza aquí' : 'Continuar'}</div>
              <div className="font-bold leading-tight truncate">{nextCapsule.n}. {nextCapsule.title}</div>
            </div>
            <ChevronRight className="w-6 h-6 flex-shrink-0" />
          </button>
        )}
        {!loading && y1AllDone && (
          <button onClick={() => setShowCertificate(true)} className="w-full mb-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg border-2 border-amber-700 active:scale-[0.99] transition-all text-left">
            <Award className="w-9 h-9 flex-shrink-0" strokeWidth={2.2} />
            <div className="flex-1 min-w-0"><div className="font-bold leading-tight">¡Completaste el Año 1!</div><div className="text-sm text-amber-50">Toca para ver tu certificado</div></div>
            <ChevronRight className="w-6 h-6 flex-shrink-0" />
          </button>
        )}

        {/* Repaso espaciado */}
        {!loading && reviewCapsule && (
          <button onClick={() => setSelectedId(reviewCapsule.id)} className="w-full mb-4 bg-white dark:bg-slate-800 border-2 border-teal-300 dark:border-teal-800 p-4 rounded-2xl flex items-center gap-3 active:scale-[0.99] transition-all text-left">
            <RefreshCw className="w-8 h-8 flex-shrink-0 text-teal-600 dark:text-teal-400" strokeWidth={2.2} />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide font-bold text-teal-700 dark:text-teal-300">Repaso de la semana</div>
              <div className="font-bold text-brand-ink leading-tight truncate">{reviewCapsule.n}. {reviewCapsule.title}</div>
            </div>
            <ChevronRight className="w-6 h-6 flex-shrink-0 text-teal-600 dark:text-teal-400" />
          </button>
        )}

        {/* Ranking de coros */}
        <button onClick={() => setShowRanking(true)} className="w-full mb-2 bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-800 p-4 rounded-2xl flex items-center gap-3 active:scale-[0.99] transition-all text-left">
          <Trophy className="w-8 h-8 flex-shrink-0 text-amber-500" strokeWidth={2.2} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-brand-ink leading-tight">Ranking de coros</div>
            <div className="text-xs text-brand-ink-soft">Formarse en comunidad: mira cómo avanzan los coros</div>
          </div>
          <ChevronRight className="w-6 h-6 flex-shrink-0 text-amber-500" />
        </button>

        {/* Insignias del Año 1 */}
        {!loading && (
          <div className="mt-6 mb-2">
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Insignias · Año 1</div>
            <div className="grid grid-cols-4 gap-2">
              {y1.modules.map((mod) => {
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

        {/* Los tres ciclos */}
        {CURRICULUM.map((t, i) => renderTrack(t, i))}

        {/* Formación permanente */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" style={{ color: gold }} />
            <h2 className="text-xl font-bold text-brand-ink">Formación permanente</h2>
          </div>
          <p className="text-sm text-brand-ink-soft mb-3">Cápsulas mensuales, disponibles siempre — mantienen viva tu formación.</p>
          <div className="space-y-2">
            {PERMANENT_CAPSULES.map((cap) => {
              const isDone = completed.has(cap.id);
              const eje = EJE_META[cap.eje];
              return (
                <button key={cap.id} onClick={() => setSelectedId(cap.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left active:scale-[0.99] transition-all ${isDone ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                  <span className="flex-shrink-0">{isDone ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Circle className="w-5 h-5 text-gray-300 dark:text-slate-600" />}</span>
                  <span className="flex-1 min-w-0"><span className="block font-semibold text-brand-ink leading-tight truncate">{cap.title}</span><span className="text-xs text-brand-ink-soft">{cap.source}</span></span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: eje.color }}>{eje.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {showCertificate && (
          <CertificateModal name={userName || 'Miembro del coro'} title={y1.certificate || 'Cantor Litúrgico — Fundamentos'} onClose={() => setShowCertificate(false)} />
        )}
        {showRanking && <CourseRankingModal userId={userId} myParish={userParish} onClose={() => setShowRanking(false)} />}
      </div>
    </div>
  );
}

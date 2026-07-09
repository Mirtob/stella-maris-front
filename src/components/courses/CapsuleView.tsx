import { useState } from 'react';
import { ArrowLeft, PlayCircle, BookOpen, CheckCircle2, XCircle, Award, ChevronRight } from 'lucide-react';
import { getChannelUrl } from '../../services/youtube';
import { EJE_META, type Capsule, type QuizQuestion } from '../../data/courseCurriculum';

interface Props {
  capsule: Capsule;
  done: boolean;
  hasNext: boolean;
  videoUrl?: string; // resuelto desde el canal (course_videos); si no, cae al del currículo
  quiz?: QuizQuestion[]; // resuelto (override de BD > base); si no, el del currículo
  onBack: () => void;
  onNext: () => void;
  onPass: (score: number) => void;
}

export function CapsuleView({ capsule, done, hasNext, videoUrl, quiz: quizProp, onBack, onNext, onPass }: Props) {
  const eje = EJE_META[capsule.eje];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [passed, setPassed] = useState(done);

  const quiz = quizProp ?? capsule.quiz ?? [];
  const total = quiz.length;
  const allAnswered = quiz.every((_, i) => answers[i] != null);
  const correctCount = quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);

  const hasVideo = !!(videoUrl || capsule.videoUrl);
  const openVideo = () => {
    const a = document.createElement('a');
    a.href = videoUrl || capsule.videoUrl || getChannelUrl();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const PASS_RATIO = 0.8; // se aprueba con 80% de aciertos
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const check = () => {
    setChecked(true);
    if (total > 0 && correctCount / total >= PASS_RATIO) {
      setPassed(true);
      onPass(correctCount);
    }
  };

  const markSeen = () => { setPassed(true); onPass(0); };

  const retry = () => { setChecked(false); setAnswers({}); };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-14">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-brand font-bold active:opacity-70">
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} /> Volver al camino
        </button>

        {/* Cabecera */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-full" style={{ background: eje.color }}>{eje.label}</span>
          <span className="text-sm text-brand-ink-soft">Cápsula {capsule.n} · {capsule.duration}</span>
          {passed && <span className="ml-auto inline-flex items-center gap-1 text-sm font-bold text-green-700 dark:text-green-300"><CheckCircle2 className="w-4 h-4" /> Completada</span>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink leading-tight mb-3">{capsule.title}</h1>

        {/* Idea fuerza */}
        <div className="bg-white/70 dark:bg-white/10 border-l-4 rounded-xl p-4 mb-4" style={{ borderColor: eje.color }}>
          <p className="text-lg font-semibold text-brand-ink leading-snug">{capsule.idea}</p>
        </div>

        {/* Video */}
        <button onClick={openVideo} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-lg border-2 active:scale-95 transition-all mb-4 ${hasVideo ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white border-rose-800' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-600'}`}>
          <PlayCircle className="w-7 h-7" strokeWidth={2.5} /> {hasVideo ? `Ver el video (${capsule.duration})` : 'Video en preparación · ir al canal'}
        </button>

        {/* Texto de apoyo + fuente */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-blue-100 dark:border-slate-700 mb-4">
          <p className="text-brand-ink dark:text-gray-100 leading-relaxed">{capsule.summary}</p>
          <div className="mt-3 flex items-start gap-2 text-sm text-brand-ink-soft border-t border-gray-100 dark:border-slate-700 pt-3">
            <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold" style={{ color: '#9a7636' }} />
            <span><strong>Fuente:</strong> {capsule.source}</span>
          </div>
        </div>

        {/* Quiz */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-amber-200 dark:border-amber-800">
          <h2 className="text-lg font-bold text-brand-ink mb-1">{total > 0 ? 'Comprueba lo aprendido' : 'Completar cápsula'}</h2>
          <p className="text-sm text-brand-ink-soft mb-4">{total > 0 ? `Responde para completar. Se aprueba con al menos 80% de aciertos (${total} preguntas).` : 'Marca la cápsula cuando la hayas visto.'}</p>

          <div className="space-y-5">
            {quiz.map((q, qi) => (
              <div key={qi}>
                <p className="font-semibold text-brand-ink mb-2">{qi + 1}. {q.q}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    const isCorrect = oi === q.answer;
                    let cls = 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900';
                    if (checked && selected && isCorrect) cls = 'border-green-500 bg-green-50 dark:bg-green-900/30';
                    else if (checked && selected && !isCorrect) cls = 'border-red-400 bg-red-50 dark:bg-red-900/30';
                    else if (checked && isCorrect) cls = 'border-green-500 bg-green-50 dark:bg-green-900/30';
                    else if (selected) cls = 'border-brand bg-blue-50 dark:bg-blue-900/30';
                    return (
                      <button
                        key={oi}
                        disabled={passed}
                        onClick={() => !checked && setAnswers((p) => ({ ...p, [qi]: oi }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 flex items-center gap-2 transition-all ${cls} ${passed ? '' : 'active:scale-[0.99]'}`}
                      >
                        <span className="flex-1 text-brand-ink dark:text-gray-100">{opt}</span>
                        {checked && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                        {checked && selected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Acción */}
          {passed ? (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-bold mb-3">
                <Award className="w-6 h-6" /> ¡Aprobada!{total > 0 && ` ${correctCount}/${total} (${scorePct}%)`}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={onBack} className="flex-1 bg-gray-100 dark:bg-slate-700 text-brand-ink py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-slate-600 active:scale-95 transition-all">Volver al camino</button>
                {hasNext && (
                  <button onClick={onNext} className="flex-1 bg-gradient-to-r from-brand to-brand-strong text-white py-3 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-all border-2 border-brand-border">
                    Siguiente cápsula <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ) : checked ? (
            <div className="mt-5">
              <p className="text-red-700 dark:text-red-300 font-semibold mb-3">Necesitas 80% para aprobar. Acertaste {correctCount} de {total} ({scorePct}%). Repasa y vuelve a intentar.</p>
              <button onClick={retry} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold active:scale-95 transition-all">Intentar de nuevo</button>
            </div>
          ) : total === 0 ? (
            <button onClick={markSeen} className="w-full mt-5 py-3 rounded-xl font-bold bg-gradient-to-r from-green-600 to-green-700 text-white active:scale-95 transition-all">
              Marcar como completada
            </button>
          ) : (
            <button
              onClick={check}
              disabled={!allAnswered}
              className={`w-full mt-5 py-3 rounded-xl font-bold transition-all ${allAnswered ? 'bg-gradient-to-r from-green-600 to-green-700 text-white active:scale-95' : 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'}`}
            >
              Comprobar y completar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

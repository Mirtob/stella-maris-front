import { useState } from 'react';
import { Sparkles, Radio, BookOpen, Music, PartyPopper, Loader, Check } from 'lucide-react';
import { submitSurvey, PRELAUNCH, type UsefulMode } from '../../services/survey';

interface Props {
  role?: string;
  parish?: string;
  onClose: () => void;
}

const MODES: { id: UsefulMode; label: string; icon: typeof Radio; hint: string }[] = [
  { id: 'radio', label: 'Modo radio', icon: Radio, hint: 'Escuchar los cantos (videos del canal)' },
  { id: 'folleto', label: 'Folleto PDF', icon: BookOpen, hint: 'El cuadernillo con las letras' },
  { id: 'atril', label: 'Modo atril', icon: Music, hint: 'Lectura continua con acordes/partitura' },
];

/**
 * Encuesta del pre-lanzamiento (Misa de la Asunción). Dos preguntas y, al responder,
 * la invitación al lanzamiento oficial del 29 de agosto.
 */
export function PrelaunchSurvey({ role, parish, onClose }: Props) {
  const [step, setStep] = useState<'questions' | 'invitation'>('questions');
  const [interesting, setInteresting] = useState<boolean | null>(null);
  const [usefulMode, setUsefulMode] = useState<UsefulMode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = interesting !== null && usefulMode !== null && !submitting;

  const handleSubmit = async () => {
    if (interesting === null || usefulMode === null || submitting) return;
    setSubmitting(true);
    // Best-effort: aunque falle el guardado, no bloqueamos al usuario en plena Misa;
    // igual avanzamos a la invitación.
    await submitSurvey({ interesting, usefulMode, role, parish });
    setSubmitting(false);
    setStep('invitation');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full border-4 border-brand-border overflow-hidden max-h-[92vh] overflow-y-auto">
        {step === 'questions' ? (
          <>
            <div className="bg-gradient-to-r from-brand to-brand-strong text-white p-6 border-b-4 border-brand-border">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 flex-shrink-0" strokeWidth={2.5} />
                <div>
                  <h2 className="text-xl font-bold leading-tight">¿Qué te pareció la app?</h2>
                  <p className="text-blue-100 text-sm mt-0.5">Tu opinión nos ayuda un montón 🙏</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Q1 */}
              <div>
                <p className="font-bold text-brand-ink mb-3">¿La app te resultó interesante?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: true, l: '👍 Sí' }, { v: false, l: '👎 No' }].map(({ v, l }) => (
                    <button
                      key={String(v)}
                      onClick={() => setInteresting(v)}
                      aria-pressed={interesting === v}
                      className={`py-3 rounded-xl font-bold border-2 active:scale-95 transition-all ${
                        interesting === v
                          ? 'bg-gradient-to-br from-brand to-brand-strong text-white border-brand-border'
                          : 'bg-white dark:bg-slate-800 text-brand-ink border-blue-200 dark:border-slate-700'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div>
                <p className="font-bold text-brand-ink mb-3">¿Qué modo de ver los cantos te resultó más útil?</p>
                <div className="space-y-2">
                  {MODES.map(({ id, label, icon: Icon, hint }) => (
                    <button
                      key={id}
                      onClick={() => setUsefulMode(id)}
                      aria-pressed={usefulMode === id}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left active:scale-[0.99] transition-all ${
                        usefulMode === id
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-700'
                          : 'bg-white dark:bg-slate-800 text-brand-ink border-amber-200 dark:border-slate-700'
                      }`}
                    >
                      <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={2.5} />
                      <span className="min-w-0">
                        <span className="block font-bold leading-tight">{label}</span>
                        <span className={`block text-xs ${usefulMode === id ? 'text-amber-50' : 'text-brand-ink-soft'}`}>{hint}</span>
                      </span>
                      {usefulMode === id && <Check className="w-5 h-5 ml-auto flex-shrink-0" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 dark:bg-slate-800 text-brand-ink py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-slate-700 active:scale-95 transition-all"
                >
                  Ahora no
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                    canSubmit
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-800 active:scale-95'
                      : 'bg-gray-300 dark:bg-slate-700 text-gray-500 border-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" strokeWidth={2.5} />}
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Invitación al lanzamiento oficial ── */
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <PartyPopper className="w-11 h-11 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-brand-ink mb-2">¡Gracias por tu opinión! 🎉</h2>
            <p className="text-brand-ink-soft mb-6">
              Estás entre los primeros en probar Stella Maris.
            </p>

            <div className="bg-gradient-to-br from-brand to-brand-strong text-white rounded-2xl p-6 border-4 border-brand-border shadow-xl mb-6">
              <p className="text-sm uppercase tracking-wide text-blue-200 font-bold mb-1">Estás invitado/a</p>
              <p className="text-xl font-bold leading-tight mb-2">Lanzamiento oficial de la app</p>
              <p className="text-3xl font-extrabold">{PRELAUNCH.launchDate}</p>
              <p className="text-blue-100 text-sm mt-3">
                Ese día la app queda disponible para toda la comunidad. ¡Te esperamos! 🎵✝️
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold active:scale-95 transition-all border-2 border-green-800"
            >
              ¡Genial!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

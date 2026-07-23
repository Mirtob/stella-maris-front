import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Save, Loader, Plus, Trash2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { CURRICULUM, PERMANENT_CAPSULES, baseQuizFor, findCapsule, type QuizQuestion } from '../../data/courseCurriculum';
import { getQuizOverrides, saveQuizOverride, resetQuizOverride } from '../../services/courseQuizzes';

const clone = (qs: QuizQuestion[]): QuizQuestion[] => qs.map((q) => ({ q: q.q, answer: q.answer, options: [...q.options] }));

export function CourseQuizEditor({ onBack }: { onBack: () => void }) {
  const [overrides, setOverrides] = useState<Record<string, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getQuizOverrides().then((o) => { setOverrides(o); setLoading(false); });
  }, []);

  // Opciones del selector: todas las cápsulas, agrupadas por track + permanentes.
  const groups = useMemo(() => {
    const g = CURRICULUM.map((t) => ({ label: t.title, items: t.modules.flatMap((m) => m.capsules) }));
    g.push({ label: 'Formación permanente', items: PERMANENT_CAPSULES });
    return g;
  }, []);

  const load = (id: string) => {
    setSelectedId(id);
    if (!id) { setQuestions([]); return; }
    setQuestions(clone(overrides[id] ?? baseQuizFor(id)));
  };

  const edited = !!selectedId && !!overrides[selectedId];

  const setQ = (i: number, text: string) => setQuestions((p) => p.map((q, k) => (k === i ? { ...q, q: text } : q)));
  const setOpt = (i: number, j: number, text: string) => setQuestions((p) => p.map((q, k) => (k === i ? { ...q, options: q.options.map((o, l) => (l === j ? text : o)) } : q)));
  const setAnswer = (i: number, j: number) => setQuestions((p) => p.map((q, k) => (k === i ? { ...q, answer: j } : q)));
  const addOption = (i: number) => setQuestions((p) => p.map((q, k) => (k === i ? { ...q, options: [...q.options, ''] } : q)));
  const removeOption = (i: number, j: number) => setQuestions((p) => p.map((q, k) => {
    if (k !== i || q.options.length <= 2) return q;
    const options = q.options.filter((_, l) => l !== j);
    return { ...q, options, answer: q.answer >= options.length ? 0 : q.answer };
  }));
  const addQuestion = () => setQuestions((p) => (p.length >= 5 ? p : [...p, { q: '', options: ['', '', ''], answer: 0 }]));
  const removeQuestion = (i: number) => setQuestions((p) => p.filter((_, k) => k !== i));

  const validate = (): string | null => {
    if (questions.length < 3 || questions.length > 5) return 'Debe tener entre 3 y 5 preguntas.';
    for (const q of questions) {
      if (!q.q.trim()) return 'Hay una pregunta sin texto.';
      if (q.options.length < 2) return 'Cada pregunta necesita al menos 2 opciones.';
      if (q.options.some((o) => !o.trim())) return 'Hay opciones vacías.';
      if (q.answer < 0 || q.answer >= q.options.length) return 'Falta marcar la respuesta correcta.';
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    const r = await saveQuizOverride(selectedId, questions);
    setSaving(false);
    if (r.ok) { setOverrides((o) => ({ ...o, [selectedId]: clone(questions) })); toast.success('Quiz guardado'); }
    else toast.error('No se pudo guardar', { description: r.error });
  };

  const reset = async () => {
    setSaving(true);
    const r = await resetQuizOverride(selectedId);
    setSaving(false);
    if (r.ok) {
      setOverrides((o) => { const n = { ...o }; delete n[selectedId]; return n; });
      setQuestions(clone(baseQuizFor(selectedId)));
      toast.success('Restablecido al quiz base');
    } else toast.error('No se pudo restablecer', { description: r.error });
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:border-brand';
  const cap = selectedId ? findCapsule(selectedId) : undefined;

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        <button onClick={onBack} className="flex items-center gap-2 text-brand font-bold mb-6 active:opacity-70"><ArrowLeft className="w-5 h-5" /> Volver al Panel</button>
        <h1 className="text-2xl font-bold text-brand-ink mb-1">Editar quizzes de Cursos</h1>
        <p className="text-sm text-brand-ink-soft mb-5">Modifica el texto o el enfoque de las preguntas. Se guardan en la app (3–5 preguntas, se aprueba con 80%).</p>

        {loading ? (
          <div className="flex justify-center py-10"><Loader className="w-7 h-7 animate-spin text-brand" /></div>
        ) : (
          <>
            <label className="text-sm font-bold text-brand-ink mb-1 block">Cápsula</label>
            <select value={selectedId} onChange={(e) => load(e.target.value)} className={`${inputCls} mb-5`}>
              <option value="">— Elige una cápsula —</option>
              {groups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((c) => (
                    <option key={c.id} value={c.id}>{c.n ? `${c.n}. ` : ''}{c.title}{overrides[c.id] ? ' ✎' : ''}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {selectedId && (
              <>
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <span className="font-semibold text-brand-ink">{cap?.title}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${edited ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>{edited ? 'Editado' : 'Base'}</span>
                </div>

                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-blue-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-brand-ink">Pregunta {i + 1}</span>
                        <button onClick={() => removeQuestion(i)} className="ml-auto text-red-500 active:scale-95" aria-label="Eliminar pregunta"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      <input value={q.q} onChange={(e) => setQ(i, e.target.value)} placeholder="Texto de la pregunta" className={`${inputCls} mb-3`} />
                      <p className="text-xs text-brand-ink-soft mb-1">Opciones (marca la correcta):</p>
                      <div className="space-y-2">
                        {q.options.map((opt, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <input type="radio" name={`ans-${i}`} checked={q.answer === j} onChange={() => setAnswer(i, j)} className="w-5 h-5 flex-shrink-0 accent-green-600" aria-label="Correcta" />
                            <input value={opt} onChange={(e) => setOpt(i, j, e.target.value)} placeholder={`Opción ${j + 1}`} className={inputCls} />
                            <button onClick={() => removeOption(i, j)} disabled={q.options.length <= 2} className="text-gray-400 disabled:opacity-30 active:scale-95 flex-shrink-0" aria-label="Quitar opción"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addOption(i)} className="mt-2 text-sm font-bold text-brand active:opacity-70 flex items-center gap-1"><Plus className="w-4 h-4" /> Opción</button>
                    </div>
                  ))}
                </div>

                <button onClick={addQuestion} disabled={questions.length >= 5} className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-brand text-brand font-bold flex items-center justify-center gap-2 disabled:opacity-40"><Plus className="w-5 h-5" /> Agregar pregunta ({questions.length}/5)</button>

                <div className="flex gap-2 mt-5">
                  <button onClick={reset} disabled={saving || !edited} className="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 text-brand-ink font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95"><RotateCcw className="w-5 h-5" /> Restablecer</button>
                  <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60">{saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar</button>
                </div>
                <p className="text-xs text-brand-ink-soft mt-3 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> Los cambios se ven de inmediato en el módulo Cursos.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

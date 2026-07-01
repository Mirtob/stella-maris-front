import { GraduationCap, Music2, Cross, Guitar } from 'lucide-react';

interface CoursesMenuProps {
  onSelectCourse: (course: 'theory' | 'liturgy' | 'instruments') => void;
}

export function CoursesMenu({ onSelectCourse }: CoursesMenuProps) {
  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-strong rounded-full flex items-center justify-center shadow-lg border-4 border-brand-border">
              <GraduationCap className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-brand-ink mb-2">Cursos de Formación</h1>
          <p className="text-xl text-brand-ink-soft">Aprende y profundiza tu fe</p>
        </div>

        {/* Course Cards */}
        <div className="space-y-4">
          {/* Teoría Musical */}
          <button
            onClick={() => onSelectCourse('theory')}
            className="w-full bg-gradient-to-br from-brand to-brand-strong rounded-2xl shadow-xl p-6 border-2 border-brand-border hover:border-blue-600 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <Music2 className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Teoría Musical</h2>
                <p className="text-base text-blue-100">
                  Fundamentos de música: notas, escalas, ritmo y armonía
                </p>
              </div>
            </div>
          </button>

          {/* Liturgia */}
          <button
            onClick={() => onSelectCourse('liturgy')}
            className="w-full bg-gradient-to-br from-brand to-brand-strong rounded-2xl shadow-xl p-6 border-2 border-brand-border hover:border-blue-600 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <Cross className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Liturgia</h2>
                <p className="text-base text-blue-100">
                  Estructura de la Misa y tiempos litúrgicos
                </p>
              </div>
            </div>
          </button>

          {/* Instrumentos Musicales */}
          <button
            onClick={() => onSelectCourse('instruments')}
            className="w-full bg-gradient-to-br from-brand to-brand-strong rounded-2xl shadow-xl p-6 border-2 border-brand-border hover:border-blue-600 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <Guitar className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Instrumentos Musicales</h2>
                <p className="text-base text-blue-100">
                  Aprende guitarra, órgano y dirección coral
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl p-6 transition-colors">
          <div className="flex gap-3 items-start">
            <div className="text-2xl flex-shrink-0 leading-none mt-0.5">📚</div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-brand-ink mb-1">Formación continua</h3>
              <p className="text-sm sm:text-base text-brand-ink-soft leading-relaxed">
                Los cursos te ayudarán a mejorar tu servicio litúrgico y profundizar
                tu conocimiento de la música sacra católica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
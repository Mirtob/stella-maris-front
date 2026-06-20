import { Music2, BookOpen, PlayCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getChannelUrl } from '../../services/youtube';

interface MusicalTheoryProps {
  onBack?: () => void;
}

export function MusicalTheory({ onBack }: MusicalTheoryProps) {
  const lessons = [
    {
      id: 1,
      title: 'Introducción a la Lectura Musical',
      duration: '15 min',
      completed: false,
      topics: ['El pentagrama', 'Claves musicales', 'Notas musicales'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 2,
      title: 'Valores de las Notas y Silencios',
      duration: '20 min',
      completed: false,
      topics: ['Redonda, blanca, negra', 'Corcheas y semicorcheas', 'Silencios musicales'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 3,
      title: 'El Ritmo y el Compás',
      duration: '25 min',
      completed: false,
      topics: ['Compás binario y ternario', 'Compás de 4/4', 'Acentuación rítmica'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 4,
      title: 'Escalas Mayores y Menores',
      duration: '30 min',
      completed: false,
      topics: ['Tonos y semitonos', 'Escala de Do Mayor', 'Escalas menores naturales'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 5,
      title: 'Intervalos Musicales',
      duration: '25 min',
      completed: false,
      topics: ['Intervalos melódicos', 'Intervalos armónicos', 'Clasificación de intervalos'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 6,
      title: 'Acordes Básicos',
      duration: '30 min',
      completed: false,
      topics: ['Tríadas mayores y menores', 'Inversiones de acordes', 'Acordes en cantos litúrgicos'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
  ];

  const handleLessonClick = (videoUrl: string) => {
    // <a> sintético en vez de window.open (más fiable en PWA/móvil, donde
    // window.open suele ser bloqueado).
    const url = videoUrl || getChannelUrl();
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-950 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-800">
              <Music2 className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-950 dark:text-white mb-2 transition-colors">Teoría Musical</h1>
          <p className="text-xl text-blue-900 dark:text-blue-100 transition-colors">Fundamentos para el ministerio musical</p>
        </div>

        {/* Progress Card */}
        <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-white/40 dark:border-white/20 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-950 dark:text-white transition-colors">Tu Progreso</h2>
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100 transition-colors">0%</span>
          </div>
          <div className="w-full bg-white/40 dark:bg-white/20 rounded-full h-3 transition-colors">
            <div className="bg-gradient-to-r from-blue-900 to-blue-950 h-3 rounded-full" style={{ width: '0%' }}></div>
          </div>
          <p className="text-sm text-blue-900 dark:text-blue-200 mt-2 transition-colors">0 de {lessons.length} lecciones completadas</p>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-blue-950 dark:text-white mb-4">Lecciones</h2>
          
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border-2 border-white/40 dark:border-white/20 transition-colors"
            >
              <button 
                className="w-full p-5 text-left hover:bg-white/50 dark:hover:bg-white/20 transition-colors"
                onClick={() => handleLessonClick(lesson.videoUrl)}
              >
                <div className="flex items-start gap-4">
                  {/* Lesson Number */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${
                    lesson.completed
                      ? 'bg-green-600 border-green-700'
                      : 'bg-gradient-to-br from-blue-900 to-blue-950 border-blue-800'
                  }`}>
                    {lesson.completed ? (
                      <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                    ) : (
                      <span className="text-xl font-bold text-white">{index + 1}</span>
                    )}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-950 dark:text-white mb-2 leading-tight">
                      {lesson.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200 mb-3">
                      <PlayCircle className="w-4 h-4" />
                      <span>{lesson.duration}</span>
                    </div>

                    {/* Topics */}
                    <div className="flex flex-wrap gap-2">
                      {lesson.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="bg-gradient-to-br from-blue-900 to-blue-950 text-white px-2 py-1 rounded-lg text-xs font-semibold border border-blue-800"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-blue-400 dark:text-blue-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Practice Tips */}
        <div className="mt-8 bg-white/30 dark:bg-white/10 backdrop-blur-sm border-2 border-white/40 dark:border-white/20 rounded-xl p-6 transition-colors">
          <div className="flex gap-3">
            <div className="text-3xl">🎼</div>
            <div>
              <h3 className="text-lg font-bold text-blue-950 dark:text-white mb-2">Fundamentos esenciales</h3>
              <p className="text-base text-blue-900 dark:text-blue-100">
                La teoría musical es fundamental para entender y dirigir mejor los cantos litúrgicos. 
                Cada lección incluye ejercicios prácticos para aplicar lo aprendido.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
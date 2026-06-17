import { Cross, BookOpen, PlayCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getChannelUrl } from '../../services/youtube';

interface LiturgyProps {
  onBack?: () => void;
}

export function Liturgy({ onBack }: LiturgyProps) {
  const lessons = [
    {
      id: 1,
      title: 'La Misa: Estructura y Significado',
      duration: '20 min',
      completed: false,
      topics: ['Ritos iniciales', 'Liturgia de la Palabra', 'Liturgia Eucarística', 'Ritos finales'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 2,
      title: 'Tiempos Litúrgicos',
      duration: '25 min',
      completed: false,
      topics: ['Adviento', 'Navidad', 'Cuaresma', 'Pascua', 'Tiempo Ordinario'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 3,
      title: 'Los Cantos en la Liturgia',
      duration: '30 min',
      completed: false,
      topics: ['Función de los cantos', 'Momentos apropiados', 'Criterios de selección'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 4,
      title: 'El Salmo Responsorial',
      duration: '20 min',
      completed: false,
      topics: ['Importancia del salmo', 'Cómo cantarlo', 'Respuesta del pueblo'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 5,
      title: 'Cantos del Ordinario de la Misa',
      duration: '35 min',
      completed: false,
      topics: ['Kyrie eleison', 'Gloria', 'Santo', 'Cordero de Dios'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 6,
      title: 'El Canto Gregoriano',
      duration: '30 min',
      completed: false,
      topics: ['Historia', 'Características', 'Aplicación actual', 'Notación cuadrada'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 7,
      title: 'Música Sacra y Pastoral',
      duration: '25 min',
      completed: false,
      topics: ['Criterios pastorales', 'Participación activa', 'Selección de repertorio'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
    {
      id: 8,
      title: 'Colores Litúrgicos',
      duration: '15 min',
      completed: false,
      topics: ['Morado', 'Blanco', 'Rojo', 'Verde', 'Significados'],
      videoUrl: '' // TODO: pegar URL real del video; vacío usa el canal oficial como respaldo
    },
  ];

  const handleLessonClick = (videoUrl: string) => {
    // Si la lección aún no tiene video propio, abrir el canal oficial como respaldo
    window.open(videoUrl || getChannelUrl(), '_blank');
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-950 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-800">
              <Cross className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-950 dark:text-white mb-2">Liturgia</h1>
          <p className="text-xl text-blue-900 dark:text-blue-100">Profundiza la celebración eucarística</p>
        </div>

        {/* Progress Card */}
        <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-white/40 dark:border-white/20 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-950 dark:text-white">Tu Progreso</h2>
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">0%</span>
          </div>
          <div className="w-full bg-white/40 dark:bg-white/20 rounded-full h-3">
            <div className="bg-gradient-to-r from-blue-900 to-blue-950 h-3 rounded-full" style={{ width: '0%' }}></div>
          </div>
          <p className="text-sm text-blue-900 dark:text-blue-200 mt-2">0 de {lessons.length} lecciones completadas</p>
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

        {/* Vatican II Quote */}
        <div className="mt-8 bg-white/30 dark:bg-white/10 backdrop-blur-sm border-2 border-white/40 dark:border-white/20 rounded-xl p-6 transition-colors">
          <div className="flex gap-3">
            <div className="text-3xl">📖</div>
            <div>
              <h3 className="text-lg font-bold text-blue-950 dark:text-white mb-2">Sacrosanctum Concilium</h3>
              <p className="text-base text-blue-900 dark:text-blue-100 italic">
                "La música sacra será tanto más santa cuanto más íntimamente esté unida 
                a la acción litúrgica"
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">— Concilio Vaticano II, SC 112</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
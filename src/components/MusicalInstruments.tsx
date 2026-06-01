import { Guitar, Music2, Users, PlayCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface MusicalInstrumentsProps {
  onBack?: () => void;
}

export function MusicalInstruments({ onBack }: MusicalInstrumentsProps) {
  const courses = [
    {
      id: 1,
      title: 'Guitarra para Liturgia',
      icon: '🎶',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      lessons: [
        { name: 'Acordes básicos (Do, Re, Mi, Sol, La)', duration: '25 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Rasgueos litúrgicos', duration: '20 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Cambios de acordes suaves', duration: '30 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Acompañamiento de cantos marianos', duration: '35 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Canciones en tonalidad menor', duration: '30 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Técnicas de arpegio', duration: '25 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      ]
    },
    {
      id: 2,
      title: 'Órgano Litúrgico',
      icon: '🎹',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      lessons: [
        { name: 'Introducción al órgano de tubos', duration: '20 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Posición de manos y pedalera', duration: '30 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Registros básicos del órgano', duration: '25 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Preludio y postludio', duration: '35 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Acompañamiento de himnos', duration: '40 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Bach para principiantes', duration: '45 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      ]
    },
    {
      id: 3,
      title: 'Dirección Coral',
      icon: '👥',
      gradient: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      lessons: [
        { name: 'Técnica de dirección básica', duration: '30 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Patrones de compás', duration: '25 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Entradas y cortes', duration: '20 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Calentamiento vocal del coro', duration: '35 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Ensayos efectivos', duration: '40 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Interpretación y expresión', duration: '35 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      ]
    },
    {
      id: 4,
      title: 'Técnica Vocal',
      icon: '🎤',
      gradient: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      lessons: [
        { name: 'Respiración diafragmática', duration: '20 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Postura y relajación', duration: '15 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Resonancia y proyección', duration: '25 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Vocalización y ejercicios', duration: '30 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Cuidado de la voz', duration: '20 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'Canto a varias voces', duration: '35 min', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      ]
    },
  ];

  const handleLessonClick = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-950 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-800">
              <Guitar className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-950 dark:text-white mb-2">Instrumentos Musicales</h1>
          <p className="text-xl text-blue-900 dark:text-blue-100">Desarrolla tus habilidades musicales</p>
        </div>

        {/* Courses */}
        <div className="space-y-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border-2 border-white/40 dark:border-white/20 transition-colors"
            >
              {/* Course Header */}
              <div className={`bg-gradient-to-r from-blue-900 to-blue-950 text-white p-5 border-b-2 border-blue-800`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{course.icon}</span>
                  <h2 className="text-2xl font-bold">{course.title}</h2>
                </div>
                <p className="text-base opacity-90">{course.lessons.length} lecciones disponibles</p>
              </div>

              {/* Lessons List */}
              <div className="p-4 space-y-2 bg-white/20 dark:bg-white/5 backdrop-blur-sm">
                {course.lessons.map((lesson, index) => (
                  <button
                    key={index}
                    className="w-full bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-white/60 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/20 transition-colors text-left"
                    onClick={() => handleLessonClick(lesson.videoUrl)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-800`}>
                        <span className="text-base font-bold text-white">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-blue-950 dark:text-white mb-1 leading-tight">
                          {lesson.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200">
                          <PlayCircle className="w-4 h-4" />
                          <span>{lesson.duration}</span>
                        </div>
                      </div>

                      <div className="text-blue-400 dark:text-blue-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Practice Tips */}
        <div className="mt-8 bg-white/30 dark:bg-white/10 backdrop-blur-sm border-2 border-white/40 dark:border-white/20 rounded-xl p-6 transition-colors">
          <div className="flex gap-3">
            <div className="text-3xl">🎯</div>
            <div>
              <h3 className="text-lg font-bold text-blue-950 dark:text-white mb-2">Consejo de práctica</h3>
              <p className="text-base text-blue-900 dark:text-blue-100">
                Dedica al menos 20 minutos diarios a practicar. La constancia 
                es más importante que la duración de cada sesión.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { ChevronRight, X, Users, Music, BookOpen, QrCode, Sparkles } from 'lucide-react';
import logoStellaMaris from 'figma:asset/logo-stella-maris.webp';

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface Slide {
  icon: React.ReactNode;
  title: string;
  description: string;
  visual: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    icon: <Sparkles className="w-7 h-7" strokeWidth={2.5} />,
    title: 'Bienvenido a Stella Maris',
    description: 'La aplicación que ayuda a los coros parroquiales a preparar, publicar y compartir los cantos de la Misa con la comunidad.',
    visual: (
      <div className="w-44 h-44 sm:w-56 sm:h-56 mx-auto mb-6">
        <img
          src={logoStellaMaris}
          alt="Logo Stella Maris"
          className="w-full h-full object-cover rounded-full drop-shadow-2xl ring-4 ring-blue-300/50"
        />
      </div>
    ),
  },
  {
    icon: <Users className="w-7 h-7" strokeWidth={2.5} />,
    title: 'Dos formas de usar la app',
    description: 'Elegirás tu rol al crear tu perfil. Puedes cambiar de rol cuando quieras desde el menú.',
    visual: (
      <div className="space-y-3 mb-6">
        <div className="bg-gradient-to-r from-brand to-brand-strong text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg border-2 border-brand-border">
          <Music className="w-7 h-7 flex-shrink-0" strokeWidth={2.5} />
          <div className="text-left flex-1">
            <p className="font-bold text-base">Como Coro</p>
            <p className="text-xs sm:text-sm text-blue-200">Armas y publicas cantorales</p>
          </div>
        </div>
        <div className="bg-white/50 dark:bg-white/10 border-2 border-blue-300 dark:border-blue-600 text-brand-ink-soft p-4 rounded-2xl flex items-center gap-3">
          <BookOpen className="w-7 h-7 flex-shrink-0" strokeWidth={2.5} />
          <div className="text-left flex-1">
            <p className="font-bold text-base">Como Pueblo fiel</p>
            <p className="text-xs sm:text-sm">Ves los cantorales de tu parroquia</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <QrCode className="w-7 h-7" strokeWidth={2.5} />,
    title: 'El QR conecta a la parroquia',
    description: 'Cuando un coro publica un cantoral, se genera un código QR que el pueblo fiel escanea desde la entrada de la iglesia para verlo o descargar el PDF.',
    visual: (
      <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center mb-6 max-w-sm mx-auto">
        <div className="text-center bg-white/50 dark:bg-white/10 rounded-xl p-3 sm:p-4 border-2 border-blue-300 dark:border-blue-600">
          <div className="text-3xl sm:text-4xl mb-1">🎵</div>
          <p className="text-xs sm:text-sm font-bold text-brand-ink-soft">Coro publica</p>
        </div>
        <div className="text-center text-blue-700 dark:text-blue-300">
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
        </div>
        <div className="text-center bg-white/50 dark:bg-white/10 rounded-xl p-3 sm:p-4 border-2 border-blue-300 dark:border-blue-600">
          <div className="text-3xl sm:text-4xl mb-1">📱</div>
          <p className="text-xs sm:text-sm font-bold text-brand-ink-soft">Fieles escanean</p>
        </div>
      </div>
    ),
  },
];

/**
 * Onboarding de 3 pantallas que se muestra UNA VEZ por dispositivo,
 * después del primer login Google y antes de ProfileSetup.
 *
 * Persiste en localStorage que ya se vio para no repetir.
 * Tiene botón Saltar disponible en todos los slides.
 */
export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">

      {/* Botón Saltar - top right */}
      <div className="flex justify-end p-4 sm:p-6">
        <button
          onClick={onSkip}
          aria-label="Saltar introducción"
          className="text-sm sm:text-base font-semibold text-blue-700 dark:text-blue-300 hover:opacity-70 transition-opacity flex items-center gap-1"
        >
          Saltar
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contenido del slide */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8">
        <div className="max-w-md w-full text-center">
          {/* Visual del slide */}
          {slide.visual}

          {/* Icono + título */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-strong rounded-2xl flex items-center justify-center text-white shadow-lg border-2 border-brand-border">
              {slide.icon}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-ink text-left flex-1">
              {slide.title}
            </h1>
          </div>

          {/* Descripción */}
          <p className="text-base sm:text-lg text-brand-ink-soft leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Footer fijo: dots + botón Siguiente */}
      <div
        className="px-4 sm:px-6 pt-4 pb-6 bg-white/30 dark:bg-white/5 backdrop-blur-sm border-t-2 border-white/40 dark:border-white/10"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto">

          {/* Indicadores de slide (dots) */}
          <div className="flex items-center justify-center gap-2 mb-4" role="tablist" aria-label="Slides">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                role="tab"
                aria-selected={i === currentSlide}
                aria-label={`Slide ${i + 1} de ${SLIDES.length}`}
                className={`h-2 rounded-full transition-all ${
                  i === currentSlide
                    ? 'w-8 bg-blue-900 dark:bg-blue-300'
                    : 'w-2 bg-blue-300 dark:bg-blue-700'
                }`}
              />
            ))}
          </div>

          {/* Botón Siguiente / Empezar */}
          <button
            onClick={handleNext}
            className="w-full py-4 sm:py-5 px-4 rounded-2xl bg-gradient-to-r from-brand to-brand-strong text-white text-lg sm:text-xl font-bold shadow-2xl active:scale-95 hover:scale-[1.02] transition-all border-2 border-brand-border flex items-center justify-center gap-2"
          >
            {isLastSlide ? 'Empezar' : 'Siguiente'}
            {!isLastSlide && <ChevronRight className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}

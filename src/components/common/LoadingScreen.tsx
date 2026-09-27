import logoStellaMaris from 'figma:asset/logo-stella-maris.webp';
import { useAvanceEstimado } from '../../hooks/useAvanceEstimado';
import { FraseMagisterio } from './FraseMagisterio';

interface LoadingScreenProps {
  message?: string;
  /** Avance real (0-100). Sin él, uno estimado: el navegador no informa cuánto lleva
   *  bajado un módulo, y una pantalla quieta hace creer que la app se colgó. */
  progress?: number;
}

export function LoadingScreen({ message = 'Cargando...', progress }: LoadingScreenProps) {
  const estimado = useAvanceEstimado(progress === undefined);
  const valor = Math.max(0, Math.min(100, Math.round(progress ?? estimado)));
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-950 to-indigo-950 flex items-center justify-center z-50">
      {/* Fondo animado con estrellas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        {/* Logo girando en 3D sobre eje Y */}
        <div className="relative w-52 h-52 sm:w-72 sm:h-72 md:w-80 md:h-80">
          {/* Resplandor dorado pulsante */}
          <div className="absolute inset-0 rounded-full animate-pulse opacity-30 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 blur-3xl"></div>
          
          {/* Logo con rotación 3D */}
          <div 
            className="w-full h-full rounded-full overflow-hidden relative z-10"
            style={{
              animation: 'spin3d 3s linear infinite',
              transformStyle: 'preserve-3d',
            }}
          >
            <img
              src={logoStellaMaris}
              alt="Logo Stella Maris"
              className="w-full h-full object-cover drop-shadow-2xl"
            />
          </div>

          {/* Aura externa animada */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-amber-400/30 animate-ping"
            style={{
              animationDuration: '2s'
            }}
          ></div>
        </div>

        {/* Texto de carga */}
        <div className="text-center space-y-3">
          {/* El "Cargando…" ya no se muestra: queda como nombre de la barra para los
              lectores de pantalla. En su lugar, una enseñanza del Magisterio. */}
          {/* Porcentaje: que se vea que avanza */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={valor}
            aria-label={message}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-2xl font-bold text-amber-300 tabular-nums">{valor} %</span>
            <div className="w-56 h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-[width] duration-300"
                style={{ width: `${valor}%` }}
              />
            </div>
          </div>
        </div>

        {/* Una enseñanza del Magisterio sobre la música sacra, que cambia sola */}
        <FraseMagisterio />
      </div>

    </div>
  );
}
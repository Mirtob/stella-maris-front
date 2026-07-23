import logoStellaMaris from 'figma:asset/logo-stella-maris.webp';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
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
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo girando en 3D sobre eje Y */}
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem]">
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
          <h2 className="text-4xl sm:text-2xl sm:text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
            {message}
          </h2>
          
          {/* Puntos animados */}
          <div className="flex items-center justify-center gap-2">
            <div 
              className="w-3 h-3 bg-amber-400 rounded-full animate-bounce"
              style={{ animationDelay: '0s' }}
            ></div>
            <div 
              className="w-3 h-3 bg-amber-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div 
              className="w-3 h-3 bg-amber-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
        </div>

        {/* Versículo bíblico opcional */}
        <p className="text-amber-200 text-lg italic max-w-md text-center px-3 sm:px-4 opacity-80">
          "María, Estrella del Mar, guía a la Iglesia en su navegación"
        </p>
      </div>

      {/* CSS para rotación 3D sobre eje Y */}
      <style>{`
        @keyframes spin3d {
          0% {
            transform: perspective(1000px) rotateY(0deg);
          }
          100% {
            transform: perspective(1000px) rotateY(360deg);
          }
        }
      `}</style>
    </div>
  );
}
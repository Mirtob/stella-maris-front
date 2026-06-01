import { Cross } from 'lucide-react';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';

export function Home() {
  return (
    <div className="text-center mb-3 pt-12 px-2 sm:px-4">
      <div className="flex items-center justify-center mb-2">
        {/* Logo Stella Maris - Imagen original */}
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36">
          {/* Resplandor exterior animado */}
          <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-gradient-to-br from-blue-400 via-yellow-400 to-blue-600 blur-3xl"></div>
          
          {/* Anillo intermedio giratorio */}
          <div className="absolute inset-4 border-4 border-blue-400/30 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
          
          {/* Logo con imagen real */}
          <div className="w-full h-full rounded-full overflow-hidden relative z-10 shadow-2xl ring-4 ring-blue-400/20">
            <img
              src={logoStellaMaris}
              alt="Logo Stella Maris"
              className="w-full h-full object-cover drop-shadow-2xl"
              style={{
                animation: 'gentle-float 4s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </div>
      
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-950 dark:text-white mb-3 animate-fade-in">
        Stella Maris
      </h1>
      <p className="text-base sm:text-lg md:text-2xl text-blue-900 dark:text-blue-100 font-medium mb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        Arma el cantoral para tu parroquia
      </p>
      <p className="text-sm sm:text-base md:text-lg text-blue-800 dark:text-blue-200 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
        Organiza cantos litúrgicos, accede a partituras y guía a tu comunidad en la celebración eucarística
      </p>
      
      {/* CSS para animaciones personalizadas */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(255, 255, 255, 1)) drop-shadow(0 0 24px rgba(147, 197, 253, 0.8));
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
        
        @keyframes gentle-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
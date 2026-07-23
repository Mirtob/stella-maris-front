import logoStellaMaris from 'figma:asset/logo-stella-maris.webp';

export function Home() {
  return (
    <div className="text-center mb-3 pt-12 px-2 sm:px-4">
      <div className="flex items-center justify-center mb-2">
        {/* Logo Stella Maris */}
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36">
          {/* Halo suave y ESTÁTICO (sin pulso): da calidez sin distraer. */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-blue-400/15 via-amber-300/15 to-blue-600/15 blur-2xl"></div>

          {/* Logo: una sola animación de entrada, sutil. */}
          <div className="w-full h-full rounded-full overflow-hidden relative z-10 shadow-xl ring-2 ring-blue-400/20">
            <img
              src={logoStellaMaris}
              alt="Logo Stella Maris"
              className="w-full h-full object-cover animate-home-rise"
            />
          </div>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-ink mb-3 animate-home-rise" style={{ animationDelay: '0.05s' }}>
        Stella Maris
      </h1>
      <p className="text-base sm:text-lg md:text-2xl text-brand-ink-soft font-medium mb-2 animate-home-rise" style={{ animationDelay: '0.12s' }}>
        Arma el cantoral para tu parroquia
      </p>
      <p className="text-sm sm:text-base md:text-lg text-blue-800 dark:text-blue-200 max-w-2xl mx-auto animate-home-rise" style={{ animationDelay: '0.18s' }}>
        Organiza cantos litúrgicos, accede a partituras y guía a tu comunidad en la celebración eucarística
      </p>

      {/* Una sola animación de entrada, reutilizada con retardos. Respeta
          prefers-reduced-motion vía la regla global de globals.css. */}
      <style>{`
        @keyframes home-rise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-home-rise {
          animation: home-rise 0.5s ease-out both;
        }
      `}</style>
    </div>
  );
}

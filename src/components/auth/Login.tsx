import { useState } from 'react';
import { LogIn, User, Lock, Church, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { loginWithGoogle } from '../../services/googleAuth';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';

interface LoginProps {
  onGoogleLogin: () => void;
}

export function Login({ onGoogleLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      onGoogleLogin();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error iniciando sesión con Google';
      toast.error(errorMessage);
      console.error('Error en login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <header className="text-center mb-4">
          <div className="flex items-center justify-center mb-3">
            {/* Logo Stella Maris */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40">
              {/* Resplandor exterior animado */}
              <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-gradient-to-br from-blue-400 via-yellow-400 to-blue-600 blur-3xl"></div>

              <div className="w-full h-full rounded-full overflow-hidden relative z-10">
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
          {/* A2 — h1 explícito para que axe (page-has-heading-one) lo detecte.
             Lo dejamos visualmente como párrafo para no romper el diseño actual. */}
          <h1 className="text-base sm:text-lg text-blue-900 dark:text-blue-100 font-medium mb-1">
            Tu guía para la liturgia musical
          </h1>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Cantos, partituras y cantorales de tu parroquia
          </p>
        </header>

        {/* Login Card */}
        <section aria-labelledby="login-heading" className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-blue-800 transition-colors">
          <h2 id="login-heading" className="text-base font-bold text-white mb-3 text-center">
            Iniciar sesión
          </h2>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border-2 border-blue-200 text-gray-700 py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-50 active:scale-95 transition-all shadow text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          <div className="mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-lg flex-shrink-0">✝️</span>
            <p className="text-xs text-white/90">
              Accede a cantorales, cantos y partituras de tu parroquia.
            </p>
          </div>
        </section>

        {/* Features — 3 columnas en móvil */}
        <section aria-label="Funcionalidades destacadas" className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl p-2 border border-blue-800 text-center">
            <div className="text-2xl mb-1">🎵</div>
            <h3 className="text-xs font-bold text-white mb-0.5">Cantos</h3>
            <p className="text-xs text-blue-200 leading-tight">Biblioteca litúrgica</p>
          </div>
          <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl p-2 border border-blue-800 text-center">
            <div className="text-2xl mb-1">📖</div>
            <h3 className="text-xs font-bold text-white mb-0.5">Partituras</h3>
            <p className="text-xs text-blue-200 leading-tight">Ver mientras escuchas</p>
          </div>
          <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl p-2 border border-blue-800 text-center">
            <div className="text-2xl mb-1">⛪</div>
            <h3 className="text-xs font-bold text-white mb-0.5">Parroquia</h3>
            <p className="text-xs text-blue-200 leading-tight">Cantorales publicados</p>
          </div>
        </section>
      </div>

      {/* CSS para animación personalizada */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(255, 255, 255, 1)) drop-shadow(0 0 24px rgba(147, 197, 253, 0.8));
          }
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
    </main>
  );
}
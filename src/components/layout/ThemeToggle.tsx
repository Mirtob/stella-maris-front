import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      // 44×44 también en teléfono: por debajo de eso el dedo falla (guía de iOS y
      // Android). Antes eran 36×36 y el QA visual lo marcaba en todas las pantallas.
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 w-11 h-11 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center border-2 border-purple-200 dark:border-purple-600 hover:scale-110 active:scale-95 transition-all"
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" strokeWidth={2.5} />
      ) : (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" strokeWidth={2.5} />
      )}
    </button>
  );
}

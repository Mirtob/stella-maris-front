import { Menu } from 'lucide-react';
import { getCurrentLiturgicalColor, getLiturgicalGradient } from '../../utils/liturgicalColors';
import logoStellaMaris from 'figma:asset/logo-stella-maris.webp';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = true }: HeaderProps) {
  const liturgicalColor = getCurrentLiturgicalColor();
  const gradient = getLiturgicalGradient(liturgicalColor);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-br from-amber-50/95 via-amber-100/95 to-orange-50/95 dark:from-slate-900/95 dark:via-blue-950/95 dark:to-indigo-950/95 backdrop-blur-lg border-b-2 border-white/40 dark:border-white/20 shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        {/* Menu Button */}
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${gradient} text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-all hover:shadow-2xl hover:scale-105`}
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          </button>
        )}

        {/* Logo Section */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          {/* Logo Stella Maris - Imagen original */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-blue-400/30 shadow-lg">
            <img
              src={logoStellaMaris}
              alt="Logo Stella Maris"
              className="w-full h-full object-cover drop-shadow-lg"
            />
          </div>
          
          <h1 className="text-2xl sm:text-lg sm:text-2xl font-bold text-brand-ink">
            Stella Maris
          </h1>
        </div>

        {/* Spacer for balance */}
        {showMenuButton && <div className="w-12 sm:w-14"></div>}
      </div>
    </header>
  );
}
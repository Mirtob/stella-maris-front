import { Menu } from 'lucide-react';
import { getCurrentLiturgicalColor, getLiturgicalGradient } from '../../utils/liturgicalColors';

interface MenuButtonProps {
  onClick: () => void;
}

export function MenuButton({ onClick }: MenuButtonProps) {
  const liturgicalColor = getCurrentLiturgicalColor();
  const gradient = getLiturgicalGradient(liturgicalColor);
  
  return (
    <button
      onClick={onClick}
      className={`fixed top-4 left-4 z-30 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 bg-gradient-to-br ${gradient} text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-all hover:shadow-2xl hover:scale-105 border-2 border-white/20 group`}
      aria-label="Abrir menú de navegación"
    >
      {/* Efecto de pulso en hover */}
      <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
      
      <Menu className="w-7 h-7 sm:w-8 sm:h-8 relative z-10 transform group-hover:rotate-180 transition-transform duration-300" strokeWidth={2.5} />
    </button>
  );
}
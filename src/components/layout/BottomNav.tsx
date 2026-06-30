import { Church, Book, Calendar, Music, GraduationCap, ShieldCheck, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { UserRole } from '../../types';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  /** Abre el menú lateral completo (resto de destinos). */
  onOpenMore: () => void;
  role: UserRole;
}

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

// Destinos primarios por rol (4 + "Más"). El resto del menú vive en el Sidebar,
// que se abre con "Más". Reusamos los mismos ids/íconos que el Sidebar.
const PRIMARY_TABS: Record<UserRole, Tab[]> = {
  Coro: [
    { id: 'main', label: 'Inicio', icon: Church },
    { id: 'cantorals', label: 'Cantorales', icon: Book },
    { id: 'liturgical-calendar', label: 'Calendario', icon: Calendar },
    { id: 'sheet-music', label: 'Partituras', icon: Music },
  ],
  'Pueblo fiel': [
    { id: 'main', label: 'Inicio', icon: Church },
    { id: 'cantorals', label: 'Cantorales', icon: Book },
    { id: 'liturgical-calendar', label: 'Calendario', icon: Calendar },
    { id: 'courses', label: 'Cursos', icon: GraduationCap },
  ],
  Admin: [
    { id: 'main', label: 'Inicio', icon: Church },
    { id: 'cantorals', label: 'Cantorales', icon: Book },
    { id: 'liturgical-calendar', label: 'Calendario', icon: Calendar },
    { id: 'admin', label: 'Panel', icon: ShieldCheck },
  ],
};

export function BottomNav({ currentView, onNavigate, onOpenMore, role }: BottomNavProps) {
  const tabs = PRIMARY_TABS[role] ?? PRIMARY_TABS['Pueblo fiel'];
  // Si la vista actual no es ninguno de los tabs primarios (Historial, Ajustes…),
  // resaltamos "Más" para que el usuario sepa que llegó por ahí.
  const isPrimary = tabs.some((t) => t.id === currentView);

  const renderTab = (key: string, label: string, Icon: LucideIcon, active: boolean, onClick: () => void) => (
    <button
      key={key}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 h-16 transition-colors ${
        active ? 'text-blue-900 dark:text-blue-200' : 'text-blue-500/70 dark:text-blue-300/50'
      }`}
    >
      {/* Indicador superior del tab activo (sutil). */}
      <span
        className={`absolute top-0 h-0.5 w-8 rounded-full transition-colors ${
          active ? 'bg-blue-900 dark:bg-blue-300' : 'bg-transparent'
        }`}
        aria-hidden
      />
      <Icon className="w-6 h-6" strokeWidth={active ? 2.6 : 2} aria-hidden />
      <span className={`text-[11px] leading-none truncate max-w-[68px] ${active ? 'font-bold' : 'font-medium'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <nav
      aria-label="Navegación principal"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-blue-900/10 dark:border-white/10 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch max-w-2xl mx-auto">
        {tabs.map((t) => renderTab(t.id, t.label, t.icon, currentView === t.id, () => onNavigate(t.id)))}
        {renderTab('more', 'Más', MoreHorizontal, !isPrimary, onOpenMore)}
      </div>
    </nav>
  );
}

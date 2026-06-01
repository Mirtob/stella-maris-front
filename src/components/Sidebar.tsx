import { X, Home, BookOpen, GraduationCap, ShieldCheck, Music, LogOut, User, Settings, List, History, Calendar, Church, Book, Cross } from 'lucide-react';
import { UserProfile } from '../types';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ isOpen, onClose, userProfile, currentView, onNavigate, onLogout, onOpenSettings }: SidebarProps) {
  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const handleSettings = () => {
    onOpenSettings();
    onClose();
  };

  const menuItems = [
    { id: 'main', label: 'Inicio', icon: Church, roles: ['Coro', 'Pueblo fiel', 'Admin'] },
    { id: 'cantorals', label: 'Cantorales Publicados', icon: Book, roles: ['Pueblo fiel', 'Coro', 'Admin'] },
    { id: 'history', label: 'Historial de Cantorales', icon: History, roles: ['Coro', 'Admin'] },
    { id: 'sheet-music', label: 'Banco de Partituras', icon: Music, roles: ['Coro', 'Admin'] },
    { id: 'liturgical-calendar', label: 'Calendario Litúrgico', icon: Calendar, roles: ['Coro', 'Pueblo fiel', 'Admin'] },
    { id: 'manage-cantorals', label: 'Mis Cantorales', icon: BookOpen, roles: ['Coro'] },
    { id: 'courses', label: 'Cursos', icon: GraduationCap, roles: ['Coro', 'Pueblo fiel', 'Admin'] },
    { id: 'admin', label: 'Panel Admin', icon: ShieldCheck, roles: ['Admin'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(userProfile.role));

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-xs sm:max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${ 
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Botón Cerrar - Posicionado de forma absoluta en la esquina superior derecha */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 border-2 border-blue-900/20"
        >
          <X className="w-6 h-6 text-blue-950" strokeWidth={2.5} />
        </button>

        {/* Header con identificación - NO SE DESPLAZA */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-6 border-b-4 border-blue-800 shadow-xl flex-shrink-0">
          <div className="mb-6">
            <div className="flex flex-col items-center gap-4">
              {/* Logo Stella Maris - Imagen original - GRANDE */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-blue-300/50 shadow-2xl">
                <img
                  src={logoStellaMaris}
                  alt="Logo Stella Maris"
                  className="w-full h-full object-cover drop-shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white/10 rounded-xl p-3 border border-amber-500/30 backdrop-blur-sm text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center border-2 border-amber-400/50 shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold truncate">{userProfile.name}</div>
                <div className="text-sm opacity-90 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {userProfile.role}
                </div>
              </div>
            </div>
            
            {userProfile.role === 'Coro' && userProfile.instrument && (
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center gap-2 text-sm">
                <span className="text-xl">
                  {userProfile.instrument === 'Guitarra' && '🎶'}
                  {userProfile.instrument === 'Órgano' && '🎹'}
                </span>
                <span className="font-medium">{userProfile.instrument}</span>
              </div>
            )}
            
            {(userProfile as any).parishName && (
              <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-2 text-sm">
                <span className="text-base">⛪</span>
                <span className="font-medium truncate">{(userProfile as any).parishName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items - ÁREA CON SCROLL - SE DESPLAZA */}
        <div className="flex-1 p-4 pb-8 space-y-2 overflow-y-auto bg-gradient-to-br from-amber-100 to-orange-100">
          {visibleMenuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all transform hover:scale-[1.02] ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-900 to-blue-950 text-white shadow-lg border-2 border-blue-800 scale-[1.02]'
                      : 'bg-white/40 text-blue-950 hover:bg-white/60 border-2 border-white/50 hover:border-blue-300'
                }`}
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animation: 'slideIn 0.3s ease-out forwards',
                  opacity: 0
                }}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-blue-900'}`} strokeWidth={2.5} />
                <span className="text-lg font-bold">{item.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer - FIJO EN LA PARTE INFERIOR - NO SE DESPLAZA */}
        <div className="relative flex-shrink-0">
          {/* Gradiente superior sutil para indicar que hay más contenido arriba */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent via-amber-100/50 to-amber-100 pointer-events-none -translate-y-full"></div>
          
          <div className="p-4 border-t-2 border-blue-900/20 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center gap-4 shadow-2xl">
            {/* Botón Configuración - Solo icono con tooltip */}
            <div className="relative group">
              <button
                onClick={handleSettings}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-xl flex items-center justify-center hover:from-blue-800 hover:to-blue-900 active:scale-95 transition-all border-2 border-blue-800 shadow-lg hover:shadow-xl"
              >
                <Settings className="w-6 h-6" strokeWidth={2.5} />
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-blue-950 text-white text-sm font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                Configuración
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-950"></div>
              </div>
            </div>
            
            {/* Botón Cerrar Sesión - Solo icono con tooltip */}
            <div className="relative group">
              <button
                onClick={onLogout}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-700 to-red-900 text-white rounded-xl flex items-center justify-center hover:from-red-600 hover:to-red-800 active:scale-95 transition-all border-2 border-red-800 shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-6 h-6" strokeWidth={2.5} />
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-950 text-white text-sm font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                Cerrar Sesión
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-950"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS para animaciones personalizadas */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 12px rgba(147, 197, 253, 0.8));
          }
        }
        
        @keyframes slideIn {
          0% {
            transform: translateX(-10px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
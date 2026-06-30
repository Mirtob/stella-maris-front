import { X, Home, BookOpen, GraduationCap, ShieldCheck, Music, LogOut, User, Settings, List, History, Calendar, Church, Book, Cross, ChevronDown, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { IconButton } from '../common/IconButton';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  /** If provided, used instead of the role derived from userProfile.
   *  Used by App.tsx to enforce a server-verified role (downgrades 'Admin'
   *  to 'Coro' when the user can't be verified as admin in the DB). */
  effectiveRoleOverride?: UserRole;
  /** Cambio rápido de parroquia activa (Coro / Pueblo fiel con varias parroquias). */
  onSwitchParish?: (parish: string) => void;
  /** Reinicia y vuelve a mostrar el tutorial del rol actual. */
  onReplayTour?: () => void;
}

export function Sidebar({ isOpen, onClose, userProfile, currentView, onNavigate, onLogout, onOpenSettings, effectiveRoleOverride, onSwitchParish, onReplayTour }: SidebarProps) {
  const [parishMenuOpen, setParishMenuOpen] = useState(false);
  // Use the session-level role (activeRole) so the menu reflects what the user
  // chose today, not their permanent registration role. App can override this
  // with a server-verified role when admin claims need DB confirmation.
  const effectiveRole = effectiveRoleOverride || userProfile.activeRole || userProfile.role;
  const activeParish = userProfile.activeParishName || userProfile.parishName;

  const userParishes: string[] = (userProfile.parishes && userProfile.parishes.length > 0)
    ? userProfile.parishes
    : (userProfile.parishName ? [userProfile.parishName] : []);
  // Admin no usa parroquia (CRUD global). Solo Coro/Pueblo fiel con >1 conmutan.
  const canSwitchParish = !!onSwitchParish && effectiveRole !== 'Admin' && userParishes.length > 1;

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

  // Filter menu by the effective session role, not the permanent registration role
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(effectiveRole));

  // Al cerrar el menú, colapsar el conmutador de parroquia para que reabra plegado.
  useEffect(() => {
    if (!isOpen) setParishMenuOpen(false);
  }, [isOpen]);

  // Close on ESC + lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay — must sit ABOVE the global ThemeToggle (z-50) so that taps
          in the upper-right corner are captured by the overlay (not the toggle)
          and dismiss the sidebar. */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar — above the overlay */}
      <div
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-xs sm:max-w-sm bg-white shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        {/* Botón Cerrar - Posicionado de forma absoluta en la esquina superior derecha */}
        <button
          onClick={onClose}
          aria-label="Cerrar menú"
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 border-2 border-brand/20"
        >
          <X className="w-6 h-6 text-brand-strong" strokeWidth={2.5} />
        </button>

        {/* Header con identificación - NO SE DESPLAZA */}
        <div className="bg-gradient-to-br from-brand to-brand-strong p-6 border-b-4 border-brand-border shadow-xl flex-shrink-0">
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
          <div className="bg-white/10 rounded-xl p-3 border border-gold/30 backdrop-blur-sm text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-strong rounded-full flex items-center justify-center border-2 border-amber-400/50 shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold truncate">{userProfile.name}</div>
                <div className="text-sm opacity-90 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {effectiveRole}
                  {effectiveRole !== userProfile.role && (
                    <span className="text-xs opacity-70 ml-1">(sesión)</span>
                  )}
                </div>
              </div>
            </div>

            {effectiveRole === 'Coro' && userProfile.instrument && (
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center gap-2 text-sm">
                <span className="text-xl">
                  {userProfile.instrument === 'Guitarra' && '🎶'}
                  {userProfile.instrument === 'Órgano' && '🎹'}
                </span>
                <span className="font-medium">{userProfile.instrument}</span>
              </div>
            )}

            {activeParish && (
              <div className="mt-2 pt-2 border-t border-white/20">
                {canSwitchParish ? (
                  <>
                    {/* Conmutador de parroquia activa — Coro/Pueblo fiel con varias */}
                    <button
                      onClick={() => setParishMenuOpen(o => !o)}
                      aria-expanded={parishMenuOpen}
                      className="w-full flex items-center gap-2 text-sm text-left rounded-lg px-1 py-1 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-base">⛪</span>
                      {/* Q20 — title nativo muestra el nombre completo al hover/long-press. */}
                      <span className="font-medium truncate flex-1" title={activeParish}>{activeParish}</span>
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${parishMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {!parishMenuOpen && (
                      <p className="text-[11px] text-white/60 mt-0.5 ml-7">Toca para cambiar de parroquia</p>
                    )}
                    {parishMenuOpen && (
                      <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                        {userParishes.map((parish) => {
                          const isActive = parish === activeParish;
                          return (
                            <button
                              key={parish}
                              onClick={() => {
                                setParishMenuOpen(false);
                                if (!isActive) {
                                  onSwitchParish!(parish);
                                  onClose();
                                }
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                                isActive
                                  ? 'bg-amber-500/30 text-white font-bold'
                                  : 'bg-white/5 text-blue-50 hover:bg-white/15'
                              }`}
                            >
                              <span className="flex-1 truncate" title={parish}>{parish}</span>
                              {isActive && <Check className="w-4 h-4 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-base">⛪</span>
                    {/* Q20 — title nativo muestra el nombre completo al hover/long-press. */}
                    <span className="font-medium truncate" title={activeParish}>{activeParish}</span>
                  </div>
                )}
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
                      ? 'bg-gradient-to-r from-brand to-brand-strong text-white shadow-lg border-2 border-brand-border scale-[1.02]'
                      : 'bg-white/40 text-brand-strong hover:bg-white/60 border-2 border-white/50 hover:border-blue-300'
                }`}
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animation: 'slideIn 0.3s ease-out forwards',
                  opacity: 0
                }}
              >
                <Icon className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-white' : 'text-brand'}`} strokeWidth={2.5} />
                <span className="text-lg font-bold text-left leading-tight break-words min-w-0 flex-1">{item.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <div className="ml-auto flex-shrink-0 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer - FIJO EN LA PARTE INFERIOR - NO SE DESPLAZA */}
        <div className="relative flex-shrink-0">
          {/* Gradiente superior sutil para indicar que hay más contenido arriba */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent via-amber-100/50 to-amber-100 pointer-events-none -translate-y-full"></div>
          
          <div className="p-4 border-t-2 border-brand/20 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center gap-4 shadow-2xl">
            {/* Botón Ver tutorial */}
            {onReplayTour && (
              <IconButton
                label="Ver tutorial"
                side="top"
                onClick={() => { onReplayTour(); onClose(); }}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-brand to-brand-strong text-white rounded-xl flex items-center justify-center hover:from-blue-800 hover:to-blue-900 active:scale-95 transition-all border-2 border-brand-border shadow-lg hover:shadow-xl"
              >
                <GraduationCap className="w-6 h-6" strokeWidth={2.5} />
              </IconButton>
            )}

            {/* Botón Configuración */}
            <IconButton
              label="Configuración"
              side="top"
              onClick={handleSettings}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-brand to-brand-strong text-white rounded-xl flex items-center justify-center hover:from-blue-800 hover:to-blue-900 active:scale-95 transition-all border-2 border-brand-border shadow-lg hover:shadow-xl"
            >
              <Settings className="w-6 h-6" strokeWidth={2.5} />
            </IconButton>

            {/* Botón Cerrar Sesión / Cambiar perfil */}
            <IconButton
              label="Cambiar perfil"
              side="top"
              onClick={onLogout}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-danger to-danger-strong text-white rounded-xl flex items-center justify-center hover:from-red-600 hover:to-red-800 active:scale-95 transition-all border-2 border-danger-strong shadow-lg hover:shadow-xl"
            >
              <LogOut className="w-6 h-6" strokeWidth={2.5} />
            </IconButton>
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
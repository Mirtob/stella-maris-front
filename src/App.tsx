import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { Login } from './components/Login';
import { AuthCallback } from './components/AuthCallback';
import { ProfileSetup } from './components/ProfileSetup';
import { ChoirView } from './components/ChoirView';
import { PublishedCantorals } from './components/PublishedCantorals';
import { AdminDashboard } from './components/AdminDashboard';
import { SongPlayer } from './components/SongPlayer';
import { Sidebar } from './components/Sidebar';
import { MenuButton } from './components/MenuButton';
import { CoursesMenu } from './components/CoursesMenu';
import { MusicalTheory } from './components/MusicalTheory';
import { Liturgy } from './components/Liturgy';
import { MusicalInstruments } from './components/MusicalInstruments';
import { CantoralManager } from './components/CantoralManager';
import { ProfileSettings } from './components/ProfileSettings';
import { CantoralHistory } from './components/CantoralHistory';
import { LiturgicalCalendar } from './components/LiturgicalCalendar';
import { SolemnityAlerts } from './components/SolemnityAlerts';
import { SheetMusicLibrary } from './components/SheetMusicLibrary';
import { LoadingScreen } from './components/LoadingScreen';
import { SelectActiveParishDialog } from './components/SelectActiveParishDialog';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Song, UserProfile, UserRole, InstrumentType, PublishedCantoral } from './types';
import { logApiConfig } from './config/api';
import {
  getStoredSession,
  getStoredUserProfile,
  saveUserProfile,
  sessionToUserProfile,
  signOutOnly,
} from './services/googleAuth';
import { listCantorals, publishCantoral as publishCantoralToDB, deleteCantoral as deleteCantoralFromDB, findDuplicate, updateCantoral } from './services/cantorals';

type AppState = 'loading' | 'login' | 'profile-setup' | 'main' | 'player' | 'settings';
type ViewState = 'main' | 'cantorals' | 'courses' | 'admin' | 'theory' | 'liturgy' | 'instruments' | 'manage-cantorals' | 'history' | 'liturgical-calendar' | 'sheet-music';

// AccessDenied component - extracted from duplicated blocks
function AccessDenied({ onBack, title, message, details, buttonLabel = 'Volver al Inicio', backView = 'main' }: { onBack: (view: ViewState) => void; title: string; message: string; details: string; buttonLabel?: string; backView?: ViewState }) {
  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-gradient-to-br from-red-100 via-red-50 to-orange-100 dark:from-slate-900 dark:via-red-950 dark:to-red-950 transition-colors flex items-center justify-center">
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-4 border-red-500 dark:border-red-600 shadow-2xl text-center">
        <div className="text-8xl mb-6">🔒</div>
        <h1 className="text-3xl font-bold text-red-900 dark:text-red-100 mb-4">
          {title}
        </h1>
        <p className="text-xl text-red-800 dark:text-red-200 mb-6">
          {message}
        </p>
        <p className="text-lg text-red-700 dark:text-red-300 mb-8">
          {details}
        </p>
        <button
          onClick={() => onBack(backView)}
          className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-4 px-8 rounded-2xl text-xl font-bold hover:shadow-xl active:scale-95 transition-all border-2 border-blue-800"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-center" richColors />
      <ThemeToggle />
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cantoral, setCantoral] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [publishedCantorals, setPublishedCantorals] = useState<PublishedCantoral[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showParishSelector, setShowParishSelector] = useState(false);

  useEffect(() => {
    logApiConfig();
  }, []);

  useEffect(() => {
    if (appState !== 'main' || !userProfile) return;
    const activeParish = userProfile.activeParishName || userProfile.parishName;
    listCantorals(activeParish).then(setPublishedCantorals);
  }, [appState, userProfile]);

  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    async function initializeAuth() {
      const storedSession = await getStoredSession();
      const storedProfile = getStoredUserProfile();

      if (storedSession) {
        if (storedProfile) {
          setUserProfile(storedProfile);
          toast.success(`¡Bienvenido ${storedProfile.name}! 🎵`);
          // Si tiene varias parroquias y aún no eligió cuál hoy → mostrar selector
          if (!storedProfile.activeParishName && storedProfile.parishes && storedProfile.parishes.length > 1) {
            setShowParishSelector(true);
            // appState sigue 'loading' hasta que seleccione parroquia; el selector es un portal
            setAppState('main');
          } else {
            setAppState('main');
          }
        } else {
          // Primera vez: tiene sesión Google pero aún no configuró su perfil
          const baseProfile = sessionToUserProfile(storedSession);
          setUserProfile(baseProfile);
          setAppState('profile-setup');
        }
        return;
      }

      timer = setTimeout(() => {
        setAppState('login');
      }, 2500);
    }

    initializeAuth();
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    setAppState('loading');
  };

  const handleProfileSetup = (role: UserRole, instruments?: InstrumentType[], parishes?: string[]) => {
    const baseProfile = userProfile || {
      id: 'user123',
      email: 'usuario@ejemplo.com',
      name: 'Usuario Demo',
      role,
    };

    const hasSingleParish = parishes && parishes.length === 1;

    const profile: UserProfile = {
      ...baseProfile,
      role,
      instruments,
      instrument: instruments && instruments.length > 0 ? instruments[0] : baseProfile.instrument,
      parishes,
      parishName: parishes && parishes.length > 0 ? parishes[0] : undefined,
      // Para una sola parroquia la dejamos activa directamente; para varias se pide al inicio de sesión
      activeParishName: hasSingleParish ? parishes![0] : undefined,
      activeRole: undefined,
    };

    setUserProfile(profile);
    saveUserProfile(profile);

    if (parishes && parishes.length > 1) {
      setShowParishSelector(true);
      setAppState('main');
    } else {
      setAppState('main');
    }
  };

  const handleSelectActiveParish = (parish: string, role: UserRole) => {
    if (userProfile) {
      const updated: UserProfile = {
        ...userProfile,
        activeParishName: parish,
        activeRole: role,
      };
      setUserProfile(updated);
      saveUserProfile(updated);
      setShowParishSelector(false);
    }
  };

  const handleAddToCantoral = (song: Song) => {
    setCantoral((prevCantoral: Song[]) => {
      if (!prevCantoral.find((s: Song) => s.id === song.id)) {
        return [...prevCantoral, song];
      }
      return prevCantoral;
    });
  };

  const handleRemoveFromCantoral = (songId: string) => {
    setCantoral((prevCantoral: Song[]) => prevCantoral.filter((s: Song) => s.id !== songId));
  };

  const handlePlaySong = (song: Song) => {
    setSelectedSong(song);
    setAppState('player');
  };

  const handleBackFromPlayer = () => {
    setAppState('main');
  };

  const handlePublishCantoral = async (newCantoral: PublishedCantoral) => {
    setPublishedCantorals([newCantoral, ...publishedCantorals]);
    setCantoral([]);

    const result = await publishCantoralToDB(newCantoral);
    if (!result.ok) {
      toast.error('Error guardando el cantoral. Revisa tu conexión.', {
        description: result.error,
      });
      setPublishedCantorals(prev => prev.filter(c => c.id !== newCantoral.id));
      return;
    }

    toast.success('¡Cantoral publicado!');
    const fresh = await listCantorals(userProfile?.activeParishName || userProfile?.parishName);
    setPublishedCantorals(fresh);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view as ViewState);
  };

  const handleSelectCourse = (course: 'theory' | 'liturgy' | 'instruments') => {
    setCurrentView(course);
  };

  const handleLogout = () => {
    // Conservar el perfil pero limpiar los datos de sesión activa
    if (userProfile) {
      const profileToKeep: UserProfile = {
        ...userProfile,
        activeParishName: undefined,
        activeRole: undefined,
      };
      saveUserProfile(profileToKeep);
    }
    setUserProfile(null);
    setCantoral([]);
    setSelectedSong(null);
    setCurrentView('main');
    setAppState('login');
    setSidebarOpen(false);
    signOutOnly(); // Solo cierra la sesión Google, el perfil queda guardado
    toast.info('Sesión cerrada');
  };

  const handleOpenSettings = () => {
    setAppState('settings');
  };

  const handleCloseSettings = () => {
    setAppState('main');
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    if (userProfile) {
      const updated = {
        ...userProfile,
        ...updates,
      } as UserProfile;
      setUserProfile(updated);
      saveUserProfile(updated);
    }
  };

  const lastSeenCount = useRef(0);
  useEffect(() => {
    const effectiveRole = userProfile?.activeRole || userProfile?.role;
    if (effectiveRole !== 'Pueblo fiel') {
      lastSeenCount.current = publishedCantorals.length;
      return;
    }
    if (publishedCantorals.length > lastSeenCount.current && lastSeenCount.current > 0) {
      const newest = publishedCantorals[0];
      const userParish = userProfile.activeParishName || userProfile.parishName;
      if (!userParish || newest.parishName === userParish) {
        toast.success('¡Nuevo cantoral publicado! 📖', {
          description: `${newest.parishName}\n${newest.liturgicalDate} - ${newest.massTime}`,
          duration: 8000,
          action: { label: 'Ver Cantoral', onClick: () => setCurrentView('cantorals') },
        });
      }
    }
    lastSeenCount.current = publishedCantorals.length;
  }, [publishedCantorals, userProfile]);

  // Auth Callback Route
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  // Loading Screen
  if (appState === 'loading') {
    return <LoadingScreen message="Cargando Stella Maris..." />;
  }

  // Login Screen
  if (appState === 'login') {
    return <Login onGoogleLogin={handleGoogleLogin} />;
  }

  // Profile Setup Screen
  if (appState === 'profile-setup') {
    return <ProfileSetup onComplete={handleProfileSetup} userEmail={userProfile?.email} />;
  }

  // Song Player Screen
  if (appState === 'player' && selectedSong) {
    return (
      <SongPlayer
        song={selectedSong}
        onBack={handleBackFromPlayer}
        userInstrument={userProfile?.instrument}
        userRole={userProfile?.role}
      />
    );
  }

  // Settings Screen
  if (appState === 'settings' && userProfile) {
    return (
      <ProfileSettings
        userProfile={userProfile}
        onClose={handleCloseSettings}
        onSave={handleUpdateProfile}
      />
    );
  }

  // Main App Screen
  if (appState === 'main' && userProfile) {
    const activeParishName = userProfile.activeParishName || userProfile.parishName || 'Mi Parroquia';
    const effectiveRole = userProfile.activeRole || userProfile.role;

    return (
      <div>
        {showParishSelector && userProfile.parishes && userProfile.parishes.length > 1 && (
          <SelectActiveParishDialog
            parishes={userProfile.parishes}
            userRole={userProfile.role}
            onSelect={handleSelectActiveParish}
          />
        )}

        <MenuButton onClick={() => setSidebarOpen(true)} />

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userProfile={userProfile}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />

        {renderMainContent(
          currentView,
          userProfile,
          effectiveRole,
          activeParishName,
          cantoral,
          publishedCantorals,
          handleAddToCantoral,
          handleRemoveFromCantoral,
          handlePlaySong,
          handlePublishCantoral,
          handleSelectCourse,
          setCurrentView,
          async (id: string) => {
            setPublishedCantorals(prev => prev.filter(c => c.id !== id));
            const r = await deleteCantoralFromDB(id);
            if (!r.ok) {
              toast.error('No se pudo eliminar el cantoral', { description: r.error });
              const fresh = await listCantorals(activeParishName);
              setPublishedCantorals(fresh);
            }
          }
        )}

        <SolemnityAlerts />
      </div>
    );
  }

  return <Login onGoogleLogin={handleGoogleLogin} />;
}

function renderMainContent(
  currentView: ViewState,
  userProfile: UserProfile,
  effectiveRole: UserRole,
  activeParishName: string,
  cantoral: Song[],
  publishedCantorals: PublishedCantoral[],
  onAddToCantoral: (song: Song) => void,
  onRemoveFromCantoral: (songId: string) => void,
  onPlaySong: (song: Song) => void,
  onPublishCantoral: (cantoral: PublishedCantoral) => Promise<void>,
  onSelectCourse: (course: 'theory' | 'liturgy' | 'instruments') => void,
  setCurrentView: (view: ViewState) => void,
  onDeleteCantoral: (id: string) => Promise<void>
) {
  switch (currentView) {
    case 'main':
      if (effectiveRole === 'Coro') {
        return (
          <ChoirView
            preferredInstrument={userProfile.instrument || 'Coro'}
            userInstruments={userProfile.instruments}
            parishName={activeParishName}
            cantoral={cantoral}
            onAddToCantoral={onAddToCantoral}
            onRemoveFromCantoral={onRemoveFromCantoral}
            onPlaySong={onPlaySong}
            onPublishCantoral={onPublishCantoral}
          />
        );
      }
      if (effectiveRole === 'Pueblo fiel') {
        return (
          <PublishedCantorals
            cantorals={publishedCantorals}
            onPlaySong={onPlaySong}
            userRole={effectiveRole}
            userParishName={activeParishName}
          />
        );
      }
      if (effectiveRole === 'Admin') {
        return <AdminDashboard />;
      }
      return null;

    case 'cantorals':
      return (
        <PublishedCantorals
          cantorals={publishedCantorals}
          onPlaySong={onPlaySong}
          userRole={effectiveRole}
          userParishName={activeParishName}
        />
      );

    case 'admin':
      if (effectiveRole === 'Admin') {
        return <AdminDashboard />;
      }
      return (
        <AccessDenied
          onBack={setCurrentView}
          title="Acceso Denegado"
          message="Solo los administradores pueden acceder a esta sección."
          details="Esta área incluye funcionalidades críticas como:
• Subir nuevos cantos al sistema
• Gestión del canal de YouTube
• Administración de usuarios"
          buttonLabel="Volver al Inicio"
          backView="main"
        />
      );

    case 'courses':
      return <CoursesMenu onSelectCourse={onSelectCourse} />;

    case 'theory':
      return <MusicalTheory onBack={() => setCurrentView('courses')} />;

    case 'liturgy':
      return <Liturgy onBack={() => setCurrentView('courses')} />;

    case 'instruments':
      return <MusicalInstruments onBack={() => setCurrentView('courses')} />;

    case 'manage-cantorals':
      if (effectiveRole === 'Coro') {
        return (
          <CantoralManager
            cantorals={publishedCantorals}
            onPublishCantoral={onPublishCantoral}
          />
        );
      }
      return (
        <AccessDenied
          onBack={setCurrentView}
          title="Acceso Denegado"
          message="Solo los miembros del coro pueden gestionar cantorales."
          details="Esta funcionalidad permite:
• Crear y editar cantorales
• Guardar borradores
• Publicar cantorales para la comunidad"
          buttonLabel="Volver al Inicio"
          backView="main"
        />
      );

    case 'history':
      if (effectiveRole === 'Coro' || effectiveRole === 'Admin') {
        return (
          <CantoralHistory
            cantorals={publishedCantorals}
            onPlaySong={onPlaySong}
            onDeleteCantoral={onDeleteCantoral}
          />
        );
      }
      return (
        <AccessDenied
          onBack={setCurrentView}
          title="Acceso Denegado"
          message="El historial de cantorales está disponible solo para coros y administradores."
          details="Puedes ver todos los cantorales publicados en la sección principal."
          buttonLabel="Ver Cantorales Publicados"
          backView="cantorals"
        />
      );

    case 'liturgical-calendar':
      return (
        <LiturgicalCalendar
          onCreateCantoral={(liturgicalDate, date) => {
            if (effectiveRole === 'Coro') {
              setCurrentView('main');
              toast.success(`Crear cantoral para: ${liturgicalDate}`, {
                description: `Fecha: ${new Date(date).toLocaleDateString('es-ES')}`,
                duration: 5000
              });
            } else {
              toast.info(`${liturgicalDate}`, {
                description: `${new Date(date).toLocaleDateString('es-ES')}`,
                duration: 3000
              });
            }
          }}
        />
      );

    case 'sheet-music':
      if (effectiveRole === 'Coro' || effectiveRole === 'Admin') {
        return <SheetMusicLibrary onPlaySong={onPlaySong} />;
      }
      return (
        <AccessDenied
          onBack={setCurrentView}
          title="Acceso Denegado"
          message="El banco de partituras está disponible solo para coros y administradores."
          details="Esta herramienta es para la selección y gestión de cantos durante la preparación de cantorales."
          buttonLabel="Ver Cantorales Publicados"
          backView="cantorals"
        />
      );

    default:
      return null;
  }
}

export default App;

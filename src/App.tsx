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
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Song, UserProfile, UserRole, InstrumentType, PublishedCantoral } from './types';
import { logApiConfig } from './config/api';
import {
  getStoredSession,
  getStoredUserProfile,
  saveUserProfile,
  sessionToUserProfile,
  logout as googleLogout,
} from './services/googleAuth';
import { listCantorals, publishCantoral as publishCantoralToDB, deleteCantoral as deleteCantoralFromDB } from './services/cantorals';

type AppState = 'loading' | 'login' | 'profile-setup' | 'main' | 'player' | 'settings';
type ViewState = 'main' | 'cantorals' | 'courses' | 'admin' | 'theory' | 'liturgy' | 'instruments' | 'manage-cantorals' | 'history' | 'liturgical-calendar' | 'sheet-music';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cantoral, setCantoral] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [publishedCantorals, setPublishedCantorals] = useState<PublishedCantoral[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Log API configuration on mount (development only)
  useEffect(() => {
    logApiConfig();
  }, []);

  // Cargar cantorales desde Supabase cuando el usuario entra a la app
  useEffect(() => {
    if (appState !== 'main' || !userProfile) return;
    listCantorals().then(setPublishedCantorals);
  }, [appState, userProfile]);

  // Simulate initial loading
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      return; // AuthCallback component will handle this
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    async function initializeAuth() {
      const storedSession = await getStoredSession();
      const storedProfile = getStoredUserProfile();
      if (storedSession) {
        if (storedProfile) {
          setUserProfile(storedProfile);
          setAppState('main');
          toast.success(`¡Bienvenido ${storedProfile.name}! 🎵`);
        } else {
          // Usuario nuevo — tiene sesión pero aún no eligió rol ni parroquia
          const baseProfile = sessionToUserProfile(storedSession);
          setUserProfile(baseProfile);
          setAppState('profile-setup');
        }
        return;
      }

      timer = setTimeout(() => {
        setAppState('login');
      }, 2500); // 2.5 segundos de pantalla de carga
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

  const handleProfileSetup = (role: UserRole, instruments?: InstrumentType[], parishName?: string) => {
    const baseProfile = userProfile || {
      id: 'user123',
      email: 'usuario@ejemplo.com',
      name: 'Usuario Demo',
      role,
    };

    const profile: UserProfile = {
      ...baseProfile,
      role,
      instruments,
      instrument: instruments && instruments.length > 0 ? instruments[0] : baseProfile.instrument,
    };

    if (parishName) {
      (profile as any).parishName = parishName;
    }

    setUserProfile(profile);
    saveUserProfile(profile);
    setAppState('main');
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
    // Optimistic update — agregar al estado local mientras se guarda
    setPublishedCantorals([newCantoral, ...publishedCantorals]);
    setCantoral([]);

    const result = await publishCantoralToDB(newCantoral);
    if (!result.ok) {
      toast.error('Error guardando el cantoral. Revisa tu conexión.', {
        description: result.error,
      });
      // Revertir si falla
      setPublishedCantorals(prev => prev.filter(c => c.id !== newCantoral.id));
      return;
    }

    // Recargar desde DB para reflejar el estado real (otros usuarios verán este cantoral)
    const fresh = await listCantorals();
    setPublishedCantorals(fresh);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view as ViewState);
  };

  const handleSelectCourse = (course: 'theory' | 'liturgy' | 'instruments') => {
    setCurrentView(course);
  };

  const handleLogout = () => {
    setUserProfile(null);
    setCantoral([]);
    setSelectedSong(null);
    setCurrentView('main');
    setAppState('login');
    setSidebarOpen(false);
    googleLogout(); // Clear Google session
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
      setUserProfile({
        ...userProfile,
        ...updates,
      } as UserProfile);
    }
  };

  // Notificar al Pueblo Fiel cuando aparezca un cantoral nuevo de su parroquia
  const lastSeenCount = useRef(0);
  useEffect(() => {
    if (userProfile?.role !== 'Pueblo fiel') {
      lastSeenCount.current = publishedCantorals.length;
      return;
    }
    if (publishedCantorals.length > lastSeenCount.current && lastSeenCount.current > 0) {
      const newest = publishedCantorals[0];
      const userParish = (userProfile as any).parishName;
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
    return (
      <ThemeProvider>
        <AuthCallback />
      </ThemeProvider>
    );
  }

  // Loading Screen
  if (appState === 'loading') {
    return (
      <ThemeProvider>
        <LoadingScreen message="Cargando Stella Maris..." />
      </ThemeProvider>
    );
  }

  // Login Screen
  if (appState === 'login') {
    return (
      <ThemeProvider>
        <Toaster position="top-center" richColors />
        <ThemeToggle />
        <Login onGoogleLogin={handleGoogleLogin} />
      </ThemeProvider>
    );
  }

  // Profile Setup Screen
  if (appState === 'profile-setup') {
    return (
      <ThemeProvider>
        <Toaster position="top-center" richColors />
        <ThemeToggle />
        <ProfileSetup onComplete={handleProfileSetup} userEmail={userProfile?.email} />
      </ThemeProvider>
    );
  }

  // Song Player Screen
  if (appState === 'player' && selectedSong) {
    return (
      <ThemeProvider>
        <Toaster position="top-center" richColors />
        <ThemeToggle />
        <SongPlayer 
          song={selectedSong} 
          onBack={handleBackFromPlayer}
          userInstrument={userProfile?.instrument}
          userRole={userProfile?.role}
        />
      </ThemeProvider>
    );
  }

  // Settings Screen
  if (appState === 'settings' && userProfile) {
    return (
      <ThemeProvider>
        <Toaster position="top-center" richColors />
        <ThemeToggle />
        <ProfileSettings userProfile={userProfile} onClose={handleCloseSettings} onSave={handleUpdateProfile} />
      </ThemeProvider>
    );
  }

  // Main App Screen (based on user role and current view)
  if (appState === 'main' && userProfile) {
    return (
      <ThemeProvider>
        <Toaster position="top-center" richColors />
        <ThemeToggle />
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

        {/* Main View - Depends on role */}
        {currentView === 'main' && userProfile.role === 'Coro' && (
          <ChoirView
            preferredInstrument={userProfile.instrument || 'Coro'}
            userInstruments={userProfile.instruments}
            parishName={(userProfile as any).parishName || 'Mi Parroquia'}
            cantoral={cantoral}
            onAddToCantoral={handleAddToCantoral}
            onRemoveFromCantoral={handleRemoveFromCantoral}
            onPlaySong={handlePlaySong}
            onPublishCantoral={handlePublishCantoral}
          />
        )}

        {currentView === 'main' && userProfile.role === 'Pueblo fiel' && (
          <PublishedCantorals
            cantorals={publishedCantorals}
            onPlaySong={handlePlaySong}
            userRole={userProfile.role}
            userParishName={(userProfile as any).parishName}
          />
        )}

        {currentView === 'main' && userProfile.role === 'Admin' && (
          <AdminDashboard />
        )}

        {/* Published Cantorals View */}
        {currentView === 'cantorals' && (
          <PublishedCantorals
            cantorals={publishedCantorals}
            onPlaySong={handlePlaySong}
            userRole={userProfile.role}
            userParishName={(userProfile as any).parishName}
          />
        )}

        {/* Admin View */}
        {currentView === 'admin' && userProfile.role === 'Admin' && (
          <AdminDashboard />
        )}

        {/* Bloqueo de acceso - Solo Admin */}
        {currentView === 'admin' && userProfile.role !== 'Admin' && (
          <div className="max-w-md mx-auto min-h-screen p-6 bg-gradient-to-br from-red-100 via-red-50 to-orange-100 dark:from-slate-900 dark:via-red-950 dark:to-red-950 transition-colors flex items-center justify-center">
            <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-4 border-red-500 dark:border-red-600 shadow-2xl text-center">
              <div className="text-8xl mb-6">🔒</div>
              <h1 className="text-3xl font-bold text-red-900 dark:text-red-100 mb-4">
                Acceso Denegado
              </h1>
              <p className="text-xl text-red-800 dark:text-red-200 mb-6">
                Solo los administradores pueden acceder a esta sección.
              </p>
              <p className="text-lg text-red-700 dark:text-red-300 mb-8">
                Esta área incluye funcionalidades críticas como:
                <br />
                • Subir nuevos cantos al sistema
                <br />
                • Gestión del canal de YouTube
                <br />
                • Administración de usuarios
              </p>
              <button
                onClick={() => setCurrentView('main')}
                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-4 px-8 rounded-2xl text-xl font-bold hover:shadow-xl active:scale-95 transition-all border-2 border-blue-800"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        )}

        {/* Courses Menu */}
        {currentView === 'courses' && (
          <CoursesMenu onSelectCourse={handleSelectCourse} />
        )}

        {/* Musical Theory Course */}
        {currentView === 'theory' && (
          <MusicalTheory onBack={() => setCurrentView('courses')} />
        )}

        {/* Liturgy Course */}
        {currentView === 'liturgy' && (
          <Liturgy onBack={() => setCurrentView('courses')} />
        )}

        {/* Musical Instruments Course */}
        {currentView === 'instruments' && (
          <MusicalInstruments onBack={() => setCurrentView('courses')} />
        )}

        {/* Cantoral Manager */}
        {currentView === 'manage-cantorals' && userProfile.role === 'Coro' && (
          <CantoralManager
            cantorals={publishedCantorals}
            onPublishCantoral={handlePublishCantoral}
          />
        )}

        {/* Bloqueo de acceso - Solo Coro puede gestionar cantorales */}
        {currentView === 'manage-cantorals' && userProfile.role !== 'Coro' && (
          <div className="max-w-md mx-auto min-h-screen p-6 bg-gradient-to-br from-red-100 via-red-50 to-orange-100 dark:from-slate-900 dark:via-red-950 dark:to-red-950 transition-colors flex items-center justify-center">
            <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-4 border-red-500 dark:border-red-600 shadow-2xl text-center">
              <div className="text-8xl mb-6">🔒</div>
              <h1 className="text-3xl font-bold text-red-900 dark:text-red-100 mb-4">
                Acceso Denegado
              </h1>
              <p className="text-xl text-red-800 dark:text-red-200 mb-6">
                Solo los miembros del coro pueden gestionar cantorales.
              </p>
              <p className="text-lg text-red-700 dark:text-red-300 mb-8">
                Esta funcionalidad permite:
                <br />
                • Crear y editar cantorales
                <br />
                • Guardar borradores
                <br />
                • Publicar cantorales para la comunidad
              </p>
              <button
                onClick={() => setCurrentView('main')}
                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-4 px-8 rounded-2xl text-xl font-bold hover:shadow-xl active:scale-95 transition-all border-2 border-blue-800"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        )}

        {/* Cantoral History */}
        {currentView === 'history' && (userProfile.role === 'Coro' || userProfile.role === 'Admin') && (
          <CantoralHistory
            cantorals={publishedCantorals}
            onPlaySong={handlePlaySong}
            onDeleteCantoral={async (id: string) => {
              setPublishedCantorals(prev => prev.filter(c => c.id !== id));
              const r = await deleteCantoralFromDB(id);
              if (!r.ok) {
                toast.error('No se pudo eliminar el cantoral', { description: r.error });
                const fresh = await listCantorals();
                setPublishedCantorals(fresh);
              }
            }}
          />
        )}

        {/* Bloqueo de acceso - Solo Coro y Admin pueden ver historial */}
        {currentView === 'history' && userProfile.role === 'Pueblo fiel' && (
          <div className="max-w-md mx-auto min-h-screen p-6 bg-gradient-to-br from-red-100 via-red-50 to-orange-100 dark:from-slate-900 dark:via-red-950 dark:to-red-950 transition-colors flex items-center justify-center">
            <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-4 border-red-500 dark:border-red-600 shadow-2xl text-center">
              <div className="text-8xl mb-6">🔒</div>
              <h1 className="text-3xl font-bold text-red-900 dark:text-red-100 mb-4">
                Acceso Denegado
              </h1>
              <p className="text-xl text-red-800 dark:text-red-200 mb-6">
                El historial de cantorales está disponible solo para coros y administradores.
              </p>
              <p className="text-lg text-red-700 dark:text-red-300 mb-8">
                Puedes ver todos los cantorales publicados en la sección principal.
              </p>
              <button
                onClick={() => setCurrentView('cantorals')}
                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-4 px-8 rounded-2xl text-xl font-bold hover:shadow-xl active:scale-95 transition-all border-2 border-blue-800"
              >
                Ver Cantorales Publicados
              </button>
            </div>
          </div>
        )}

        {/* Liturgical Calendar */}
        {currentView === 'liturgical-calendar' && (
          <LiturgicalCalendar 
            onCreateCantoral={(liturgicalDate, date) => {
              // Solo permitir crear cantorales si el usuario es Coro
              if (userProfile.role === 'Coro') {
                // Redirigir al usuario al main view (donde se crea el cantoral)
                setCurrentView('main');
                // Aquí se podría pre-llenar la información del cantoral si fuera necesario
                toast.success(`Crear cantoral para: ${liturgicalDate}`, {
                  description: `Fecha: ${new Date(date).toLocaleDateString('es-ES')}`,
                  duration: 5000
                });
              } else {
                // Mostrar mensaje informativo para Pueblo fiel
                toast.info(`${liturgicalDate}`, {
                  description: `${new Date(date).toLocaleDateString('es-ES')}`,
                  duration: 3000
                });
              }
            }}
          />
        )}

        {/* Sheet Music Library */}
        {currentView === 'sheet-music' && (userProfile.role === 'Coro' || userProfile.role === 'Admin') && (
          <SheetMusicLibrary onPlaySong={handlePlaySong} />
        )}

        {/* Bloqueo de acceso - Solo Coro y Admin pueden acceder al banco de partituras */}
        {currentView === 'sheet-music' && userProfile.role === 'Pueblo fiel' && (
          <div className="max-w-md mx-auto min-h-screen p-6 bg-gradient-to-br from-red-100 via-red-50 to-orange-100 dark:from-slate-900 dark:via-red-950 dark:to-red-950 transition-colors flex items-center justify-center">
            <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-4 border-red-500 dark:border-red-600 shadow-2xl text-center">
              <div className="text-8xl mb-6">🔒</div>
              <h1 className="text-3xl font-bold text-red-900 dark:text-red-100 mb-4">
                Acceso Denegado
              </h1>
              <p className="text-xl text-red-800 dark:text-red-200 mb-6">
                El banco de partituras está disponible solo para coros y administradores.
              </p>
              <p className="text-lg text-red-700 dark:text-red-300 mb-8">
                Esta herramienta es para la selección y gestión de cantos durante la preparación de cantorales.
              </p>
              <button
                onClick={() => setCurrentView('cantorals')}
                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-4 px-8 rounded-2xl text-xl font-bold hover:shadow-xl active:scale-95 transition-all border-2 border-blue-800"
              >
                Ver Cantorales Publicados
              </button>
            </div>
          </div>
        )}

        {/* Solemnity Alerts - Show on all views */}
        <SolemnityAlerts />
      </ThemeProvider>
    );
  }

  // Fallback
  return <Login onGoogleLogin={handleGoogleLogin} />;
}

export default App;
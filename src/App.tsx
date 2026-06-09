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
import { RoleGuard } from './components/RoleGuard';
import { CantoralQRDialog } from './components/CantoralQRDialog';
import { CantoralDeepLink } from './components/CantoralDeepLink';
import { OfflineBanner } from './components/OfflineBanner';
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
import {
  listCantorals,
  publishCantoral as publishCantoralToDB,
  deleteCantoral as deleteCantoralFromDB,
  updateCantoralPdfUrl,
} from './services/cantorals';
import { uploadCantoralPDF } from './services/cantoralPDF';
import { generateChoirCantoralPDF } from './utils/choirCantoralPDFGenerator';
import { isCurrentUserAdmin } from './services/admin';
import { upsertCurrentUserProfile } from './services/userProfiles';

const PENDING_CANTORAL_KEY = 'stella_maris_pending_cantoral_id';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Returns the input only if it's a valid UUID; null otherwise. */
function sanitizeCantoralId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return UUID_RE.test(raw) ? raw.toLowerCase() : null;
}

/**
 * Extract /c/:id from the current URL. Returns null if not a cantoral deep link
 * or if the id is not a valid UUID. Strict validation avoids passing arbitrary
 * strings to Supabase queries and prevents path traversal-style abuse.
 */
function getCantoralIdFromPath(): string | null {
  const match = window.location.pathname.match(/^\/c\/([^/?#]+)\/?$/);
  return match ? sanitizeCantoralId(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Routing types
// ---------------------------------------------------------------------------

/**
 * All possible app views within the authenticated shell.
 * Each value maps directly to a future React Router path:
 *   'main'               → /
 *   'cantorals'          → /cantorals
 *   'courses'            → /courses
 *   'admin'              → /admin
 *   'theory'             → /courses/theory
 *   'liturgy'            → /courses/liturgy
 *   'instruments'        → /courses/instruments
 *   'manage-cantorals'   → /manage-cantorals
 *   'history'            → /history
 *   'liturgical-calendar'→ /calendar
 *   'sheet-music'        → /sheet-music
 */
type ViewState =
  | 'main'
  | 'cantorals'
  | 'courses'
  | 'admin'
  | 'theory'
  | 'liturgy'
  | 'instruments'
  | 'manage-cantorals'
  | 'history'
  | 'liturgical-calendar'
  | 'sheet-music';

/**
 * Discriminated union representing every possible screen in the app.
 * Replaces the previous dual appState + currentView pair.
 *
 * Migration note: each variant maps 1-to-1 to a React Router <Route>:
 *   loading        → handled before any route renders
 *   login          → /login
 *   callback       → /auth/callback
 *   profile-setup  → /setup
 *   player         → /player  (song carried in state, future: /player/:id)
 *   settings       → /settings
 *   app            → /:view   (nested routes under the authenticated shell)
 */
type AppRoute =
  | { screen: 'loading' }
  | { screen: 'login' }
  | { screen: 'callback' }
  | { screen: 'profile-setup' }
  | { screen: 'player'; song: Song; returnView: ViewState }
  | { screen: 'settings'; returnView: ViewState }
  | { screen: 'cantoral-link'; cantoralId: string }
  | { screen: 'app'; view: ViewState };

// ---------------------------------------------------------------------------
// Root — global providers mounted once, never re-mount
// ---------------------------------------------------------------------------

function App() {
  return (
    <ThemeProvider>
      {/* Q28 — bottom-center en mobile evita tapado por el MenuButton de la
          esquina superior; top-center vuelve en sm+ donde hay espacio.
          Detectado por matchMedia en mount. */}
      <Toaster
        position={typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? 'bottom-center' : 'top-center'}
        richColors
        closeButton
        offset={typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? 16 : undefined}
      />
      <OfflineBanner />
      <ThemeToggle />
      <AppContent />
    </ThemeProvider>
  );
}

// ---------------------------------------------------------------------------
// AppContent — all business logic and state lives here
// ---------------------------------------------------------------------------

function AppContent() {
  const [route, setRoute] = useState<AppRoute>({ screen: 'loading' });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cantoral, setCantoral] = useState<Song[]>([]);
  const [publishedCantorals, setPublishedCantorals] = useState<PublishedCantoral[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showParishSelector, setShowParishSelector] = useState(false);
  const [qrCantoral, setQrCantoral] = useState<PublishedCantoral | null>(null);
  // Server-authoritative admin check (vs. trusting the role saved in localStorage)
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  // Q17 — flag para mostrar skeleton mientras Supabase responde con la lista
  const [loadingCantorals, setLoadingCantorals] = useState(true);

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Navigate to a view inside the authenticated shell.
   *  Q19 — Si estábamos armando un cantoral (vista 'main' como Coro con cantos
   *  en el draft) y nos vamos a otra vista, pedimos confirmación nativa.
   *  Evita perder 15 minutos de armado por un tap accidental al sidebar. */
  function navigate(view: string) {
    const isAbandoningDraft =
      route.screen === 'app' &&
      route.view === 'main' &&
      cantoral.length > 0 &&
      view !== 'main' &&
      (userProfile?.activeRole || userProfile?.role) === 'Coro';
    if (isAbandoningDraft) {
      const ok = window.confirm(
        `Tenés ${cantoral.length} ${cantoral.length === 1 ? 'canto' : 'cantos'} en el cantoral sin publicar. ¿Salir y perderlos?`
      );
      if (!ok) return;
    }
    setRoute({ screen: 'app', view: view as ViewState });
  }

  /** Get the current ViewState when inside the app shell; fallback to 'main'. */
  function currentView(): ViewState {
    return route.screen === 'app' ? route.view : 'main';
  }

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    logApiConfig();
  }, []);

  // Verify admin status against Supabase every time the user changes.
  // We never trust userProfile.role === 'Admin' from localStorage on its own;
  // the DB is the source of truth and the RLS policies enforce it server-side.
  useEffect(() => {
    if (!userProfile) {
      setIsVerifiedAdmin(false);
      return;
    }
    let cancelled = false;
    isCurrentUserAdmin().then((isAdmin) => {
      if (cancelled) return;
      setIsVerifiedAdmin(isAdmin);
      // If localStorage said "Admin" but Supabase says no, demote immediately.
      if (!isAdmin && (userProfile.role === 'Admin' || userProfile.activeRole === 'Admin')) {
        const demoted: UserProfile = {
          ...userProfile,
          role: userProfile.role === 'Admin' ? 'Coro' : userProfile.role,
          activeRole: userProfile.activeRole === 'Admin' ? undefined : userProfile.activeRole,
        };
        setUserProfile(demoted);
        saveUserProfile(demoted);
      }
    });
    return () => { cancelled = true; };
  }, [userProfile?.id, userProfile?.email]);

  // Load cantorals whenever we enter the app shell or the profile changes.
  // Admin VE TODOS los cantorales (sin filtro de parroquia).
  useEffect(() => {
    if (route.screen !== 'app' || !userProfile) return;
    const effectiveRoleForLoad = userProfile.activeRole || userProfile.role;
    const isAdminLoad = effectiveRoleForLoad === 'Admin' || isVerifiedAdmin;
    const parish = isAdminLoad
      ? undefined  // sin filtro: trae todos los cantorales de todas las parroquias
      : (userProfile.activeParishName || userProfile.parishName);
    setLoadingCantorals(true);
    listCantorals(parish)
      .then(setPublishedCantorals)
      .finally(() => setLoadingCantorals(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.screen, userProfile, isVerifiedAdmin]);

  // Auth initialization — runs once on mount
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') return;

    // Detect /c/:id deep link from QR scan
    const deepLinkCantoralId = getCantoralIdFromPath();

    let timer: ReturnType<typeof setTimeout> | null = null;

    async function initializeAuth() {
      const storedSession = await getStoredSession();
      const storedProfile = getStoredUserProfile();

      if (storedSession) {
        if (storedProfile) {
          setUserProfile(storedProfile);
          // Refresh last_seen_at + datos en Supabase. Fire-and-forget.
          upsertCurrentUserProfile(storedProfile).catch(() => undefined);
          toast.success(`¡Bienvenido ${storedProfile.name}! 🎵`);

          // Pick up a pending cantoral from a previous QR scan that required login.
          // sanitizeCantoralId() guards against tampered localStorage values.
          const pendingId = deepLinkCantoralId
            || sanitizeCantoralId(localStorage.getItem(PENDING_CANTORAL_KEY));
          if (pendingId) {
            localStorage.removeItem(PENDING_CANTORAL_KEY);
            setRoute({ screen: 'cantoral-link', cantoralId: pendingId });
            return;
          }
          // Stale or invalid pending id — clear it
          localStorage.removeItem(PENDING_CANTORAL_KEY);

          // Admin no necesita parroquia/selector — entra directo.
          // Para el resto: si no hay activeRole, mostrar selector.
          const isAdminProfile = storedProfile.role === 'Admin';
          if (!isAdminProfile && !storedProfile.activeRole) {
            setShowParishSelector(true);
          }
          setRoute({ screen: 'app', view: 'main' });
        } else {
          const baseProfile = sessionToUserProfile(storedSession);
          setUserProfile(baseProfile);
          if (deepLinkCantoralId) {
            localStorage.setItem(PENDING_CANTORAL_KEY, deepLinkCantoralId);
          }
          setRoute({ screen: 'profile-setup' });
        }
        return;
      }

      // No session — save the cantoral id so we can resume after login
      if (deepLinkCantoralId) {
        localStorage.setItem(PENDING_CANTORAL_KEY, deepLinkCantoralId);
        setRoute({ screen: 'login' });
        return;
      }

      timer = setTimeout(() => setRoute({ screen: 'login' }), 2500);
    }

    initializeAuth();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  // Notify Pueblo fiel when a new cantoral is published for their parish
  const lastSeenCount = useRef(0);
  useEffect(() => {
    const effectiveRole = userProfile?.activeRole || userProfile?.role;
    if (effectiveRole !== 'Pueblo fiel') {
      lastSeenCount.current = publishedCantorals.length;
      return;
    }
    if (publishedCantorals.length > lastSeenCount.current && lastSeenCount.current > 0) {
      const newest = publishedCantorals[0];
      const userParish = userProfile!.activeParishName || userProfile!.parishName;
      // Only notify if the cantoral belongs to the user's configured parish.
      // If no parish is set, skip — user hasn't finished setup and shouldn't
      // receive notifications for cantorals they don't belong to.
      if (userParish && newest.parishName === userParish) {
        toast.success('¡Nuevo cantoral publicado! 📖', {
          description: `${newest.parishName} · ${newest.liturgicalDate} · ${newest.massTime}`,
          duration: 8000,
          action: { label: 'Ver cantorales', onClick: () => navigate('cantorals') },
        });
      }
    }
    lastSeenCount.current = publishedCantorals.length;
  }, [publishedCantorals, userProfile]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleGoogleLogin = () => setRoute({ screen: 'loading' });

  const handleProfileSetup = (role: UserRole, instruments?: InstrumentType[], parishes?: string[]) => {
    const baseProfile = userProfile || {
      id: 'user123',
      email: 'usuario@ejemplo.com',
      name: 'Usuario Demo',
      role,
    };
    const hasSingleParish = parishes?.length === 1;
    // Admin no tiene parroquia ni activeParishName — tiene CRUD global.
    const isAdminSetup = role === 'Admin';
    const profile: UserProfile = {
      ...baseProfile,
      role,
      instruments,
      instrument: instruments?.[0] ?? baseProfile.instrument,
      parishes: isAdminSetup ? undefined : parishes,
      parishName: isAdminSetup ? undefined : parishes?.[0],
      activeParishName: isAdminSetup ? undefined : (hasSingleParish ? parishes![0] : undefined),
      activeRole: isAdminSetup ? 'Admin' : (hasSingleParish ? role : undefined),
    };
    setUserProfile(profile);
    saveUserProfile(profile);
    // Persistir el perfil en Supabase para que el admin pueda verlo en
    // ProfileManager. Fire-and-forget; el flujo local sigue igual aunque falle.
    upsertCurrentUserProfile(profile).catch(() => undefined);
    if (!isAdminSetup && !hasSingleParish) setShowParishSelector(true);
    setRoute({ screen: 'app', view: 'main' });
  };

  const handleSelectActiveParish = (parish: string, role: UserRole) => {
    if (!userProfile) return;
    // Save both the active session state AND remember this selection for next time
    const updated: UserProfile = {
      ...userProfile,
      activeParishName: parish,
      activeRole: role,
      lastSessionRole: role,
      lastSessionParish: parish,
    };
    setUserProfile(updated);
    saveUserProfile(updated);
    setShowParishSelector(false);
    // Tras cambio de perfil, llevar siempre al inicio del nuevo perfil.
    setRoute({ screen: 'app', view: 'main' });
  };

  const handleAddToCantoral = (song: Song) => {
    setCantoral(prev => prev.find(s => s.id === song.id) ? prev : [...prev, song]);
  };

  const handleRemoveFromCantoral = (songId: string) => {
    setCantoral(prev => prev.filter(s => s.id !== songId));
  };

  const handlePlaySong = (song: Song) => {
    setRoute({ screen: 'player', song, returnView: currentView() });
  };

  const handleBackFromPlayer = () => {
    const returnView = route.screen === 'player' ? route.returnView : 'main';
    setRoute({ screen: 'app', view: returnView });
  };

  const handleOpenSettings = () => {
    setRoute({ screen: 'settings', returnView: currentView() });
  };

  const handleCloseSettings = () => {
    const returnView = route.screen === 'settings' ? route.returnView : 'main';
    setRoute({ screen: 'app', view: returnView });
  };

  const handlePublishCantoral = async (newCantoral: PublishedCantoral) => {
    // Q16 — Validar sesión antes de tocar la red. Si el token de Supabase ya
    // expiró y el auto-refresh falló, el insert respondería 401 con un mensaje
    // críptico ("JWT expired"). Mejor frenarlo acá y guiar al usuario al login.
    const session = await getStoredSession();
    if (!session) {
      toast.error('Sesión expirada', {
        description: 'Tu sesión caducó. Iniciá sesión de nuevo para publicar el cantoral.',
      });
      setRoute({ screen: 'login' });
      return;
    }

    // Optimistic UI: show cantoral immediately while the request is in flight
    setPublishedCantorals(prev => [newCantoral, ...prev]);

    const result = await publishCantoralToDB(newCantoral);
    if (!result.ok) {
      // Revert the optimistic update — keep the draft intact so the coro doesn't lose work
      setPublishedCantorals(prev => prev.filter(c => c.id !== newCantoral.id));

      // Q15 — Traducir errores de Supabase a mensajes humanos.
      // RLS, JWT, network y "duplicate key" son los más comunes en producción.
      const raw = (result.error ?? '').toLowerCase();
      let humanMsg = 'No pudimos guardar el cantoral. Volvé a intentar.';
      if (raw.includes('jwt') || raw.includes('unauthorized') || raw.includes('401')) {
        humanMsg = 'Tu sesión caducó. Iniciá sesión de nuevo.';
      } else if (raw.includes('row-level security') || raw.includes('rls') || raw.includes('permission denied')) {
        humanMsg = 'No tenés permiso para publicar en esta parroquia.';
      } else if (raw.includes('duplicate') || raw.includes('unique')) {
        humanMsg = 'Ya existe un cantoral con esos datos para esta parroquia y horario.';
      } else if (raw.includes('failed to fetch') || raw.includes('network')) {
        humanMsg = 'Sin conexión a internet. Revisá tu red y volvé a intentar.';
      }
      toast.error('Error al publicar el cantoral', { description: humanMsg });
      return;
    }

    // Only clear the draft after DB confirms success
    setCantoral([]);
    toast.success('¡Cantoral publicado! 🎵');

    // Generate PDF blob (without triggering local download) and upload to Storage
    let pdfUrl: string | undefined;
    try {
      const { blob } = generateChoirCantoralPDF(
        newCantoral.songs,
        newCantoral.parishName,
        newCantoral.date,
        newCantoral.liturgicalDate,
        newCantoral.massTime,
        userProfile?.instruments ?? [],
        'Full Score',
        { download: false }
      );
      const uploadResult = await uploadCantoralPDF(newCantoral.id, blob);
      if (uploadResult.ok && uploadResult.publicUrl) {
        pdfUrl = uploadResult.publicUrl;
        await updateCantoralPdfUrl(newCantoral.id, pdfUrl);
      } else {
        toast.warning('Cantoral publicado, pero no pudimos generar el PDF compartible.', {
          description: uploadResult.error,
        });
      }
    } catch (err: any) {
      toast.warning('Cantoral publicado, pero falló la generación del PDF.', {
        description: err?.message,
      });
    }

    // Show QR dialog with the final cantoral (with pdfUrl if upload succeeded)
    setQrCantoral({ ...newCantoral, pdfUrl });

    const fresh = await listCantorals(userProfile?.activeParishName || userProfile?.parishName);
    setPublishedCantorals(fresh);
  };

  // "Cambiar perfil" — keeps Google session, shows the role/parish selector
  const handleLogout = () => {
    if (!userProfile) return;
    const profileToKeep: UserProfile = { ...userProfile, activeParishName: undefined, activeRole: undefined };
    saveUserProfile(profileToKeep);
    setCantoral([]);
    setSidebarOpen(false);

    const hasParishData = (profileToKeep.parishes?.length ?? 0) > 0 || !!profileToKeep.parishName;

    if (hasParishData) {
      // Batch both state updates together: profile cleared + selector shown
      setUserProfile(profileToKeep);
      setShowParishSelector(true);
    } else {
      // No parish data (incomplete profile) → go back to full profile setup
      setUserProfile(profileToKeep);
      setRoute({ screen: 'profile-setup' });
    }
  };

  // "Cerrar sesión de Google" — full sign-out, called from the selector dialog
  const handleGoogleSignOut = () => {
    if (userProfile) {
      saveUserProfile({ ...userProfile, activeParishName: undefined, activeRole: undefined });
    }
    setUserProfile(null);
    setCantoral([]);
    setShowParishSelector(false);
    signOutOnly();
    setRoute({ screen: 'login' });
    toast.info('Sesión cerrada');
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates } as UserProfile;
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  const handleDeleteCantoral = async (id: string) => {
    setPublishedCantorals(prev => prev.filter(c => c.id !== id));
    const r = await deleteCantoralFromDB(id);
    if (!r.ok) {
      toast.error('No se pudo eliminar el cantoral', { description: r.error });
      const activeParish = userProfile?.activeParishName || userProfile?.parishName;
      const fresh = await listCantorals(activeParish);
      setPublishedCantorals(fresh);
    }
  };

  // ── Route rendering ───────────────────────────────────────────────────────

  // Auth callback is handled before any app route
  if (window.location.pathname === '/auth/callback') return <AuthCallback />;

  if (route.screen === 'loading')       return <LoadingScreen message="Cargando Stella Maris..." />;
  if (route.screen === 'login')         return <Login onGoogleLogin={handleGoogleLogin} />;
  if (route.screen === 'profile-setup') return <ProfileSetup onComplete={handleProfileSetup} userEmail={userProfile?.email} />;

  if (route.screen === 'cantoral-link') {
    return (
      <CantoralDeepLink
        cantoralId={route.cantoralId}
        onOpenInApp={() => {
          // Clean the URL and switch to the published-cantorals view
          window.history.replaceState({}, '', '/');
          setRoute({ screen: 'app', view: 'cantorals' });
        }}
        onCancel={() => {
          window.history.replaceState({}, '', '/');
          setRoute({ screen: 'app', view: 'main' });
        }}
      />
    );
  }

  if (route.screen === 'player') {
    return (
      <SongPlayer
        song={route.song}
        onBack={handleBackFromPlayer}
        userInstrument={userProfile?.instrument}
        userRole={userProfile?.role}
      />
    );
  }

  if (route.screen === 'settings') {
    if (!userProfile) return <Login onGoogleLogin={handleGoogleLogin} />;
    return (
      <ProfileSettings
        userProfile={userProfile}
        onClose={handleCloseSettings}
        onSave={handleUpdateProfile}
      />
    );
  }

  // Authenticated app shell — route.screen === 'app'
  if (!userProfile) return <Login onGoogleLogin={handleGoogleLogin} />;

  const view = route.screen === 'app' ? route.view : 'main';
  const activeParishName = userProfile.activeParishName || userProfile.parishName || 'Mi Parroquia';
  // Ensure effectiveRole always falls back to a valid UserRole so renderView never returns null.
  // If localStorage claims 'Admin' but Supabase hasn't verified it, downgrade to 'Coro'.
  const claimedRole = userProfile.activeRole || userProfile.role || 'Coro';
  const effectiveRole: UserRole =
    claimedRole === 'Admin' && !isVerifiedAdmin ? 'Coro' : claimedRole;

  return (
    <div>
      {showParishSelector && (
        <SelectActiveParishDialog
          parishes={userProfile.parishes ?? []}
          defaultParish={userProfile.parishName}
          // Show the Admin option only if Supabase confirms — never trust localStorage alone
          userRole={isVerifiedAdmin ? 'Admin' : (userProfile.role === 'Admin' ? 'Coro' : userProfile.role)}
          lastSessionRole={userProfile.lastSessionRole}
          lastSessionParish={userProfile.lastSessionParish}
          onSelect={handleSelectActiveParish}
          onSignOut={handleGoogleSignOut}
        />
      )}

      <CantoralQRDialog
        open={!!qrCantoral}
        cantoralId={qrCantoral?.id ?? ''}
        cantoralLabel={qrCantoral ? `${qrCantoral.liturgicalDate} · ${qrCantoral.massTime}` : undefined}
        parishName={qrCantoral?.parishName}
        pdfUrl={qrCantoral?.pdfUrl}
        onClose={() => setQrCantoral(null)}
      />

      <MenuButton onClick={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userProfile={userProfile}
        currentView={view}
        onNavigate={navigate}
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
        effectiveRoleOverride={effectiveRole}
      />

      {renderView({
        view,
        userProfile,
        effectiveRole,
        activeParishName,
        cantoral,
        publishedCantorals,
        loadingCantorals,
        onAddToCantoral: handleAddToCantoral,
        onRemoveFromCantoral: handleRemoveFromCantoral,
        onPlaySong: handlePlaySong,
        onPublishCantoral: handlePublishCantoral,
        navigate,
        onDeleteCantoral: handleDeleteCantoral,
      })}

      <SolemnityAlerts />
    </div>
  );
}

// ---------------------------------------------------------------------------
// renderView — centralized view router for the authenticated shell
// ---------------------------------------------------------------------------

interface ViewProps {
  view: ViewState;
  userProfile: UserProfile;
  effectiveRole: UserRole;
  activeParishName: string;
  cantoral: Song[];
  publishedCantorals: PublishedCantoral[];
  loadingCantorals: boolean;
  onAddToCantoral: (song: Song) => void;
  onRemoveFromCantoral: (songId: string) => void;
  onPlaySong: (song: Song) => void;
  onPublishCantoral: (cantoral: PublishedCantoral) => Promise<void>;
  navigate: (view: string) => void;
  onDeleteCantoral: (id: string) => Promise<void>;
}

function renderView(p: ViewProps): JSX.Element | null {
  switch (p.view) {
    case 'main':
      if (p.effectiveRole === 'Coro') {
        return (
          <ChoirView
            preferredInstrument={p.userProfile.instrument || 'Coro'}
            userInstruments={p.userProfile.instruments}
            parishName={p.activeParishName}
            cantoral={p.cantoral}
            onAddToCantoral={p.onAddToCantoral}
            onRemoveFromCantoral={p.onRemoveFromCantoral}
            onPlaySong={p.onPlaySong}
            onPublishCantoral={p.onPublishCantoral}
          />
        );
      }
      if (p.effectiveRole === 'Pueblo fiel') {
        return (
          <PublishedCantorals
            cantorals={p.publishedCantorals}
            loading={p.loadingCantorals}
            onPlaySong={p.onPlaySong}
            userRole={p.effectiveRole}
            userParishName={p.activeParishName}
          />
        );
      }
      if (p.effectiveRole === 'Admin') return <AdminDashboard />;
      // Fallback: perfil con rol desconocido o corrupto → tratar como Coro
      return (
        <ChoirView
          preferredInstrument={p.userProfile.instrument || 'Coro'}
          userInstruments={p.userProfile.instruments}
          parishName={p.activeParishName}
          cantoral={p.cantoral}
          onAddToCantoral={p.onAddToCantoral}
          onRemoveFromCantoral={p.onRemoveFromCantoral}
          onPlaySong={p.onPlaySong}
          onPublishCantoral={p.onPublishCantoral}
        />
      );

    case 'cantorals':
      return (
        <PublishedCantorals
          cantorals={p.publishedCantorals}
          loading={p.loadingCantorals}
          onPlaySong={p.onPlaySong}
          userRole={p.effectiveRole}
          userParishName={p.activeParishName}
        />
      );

    case 'admin':
      return (
        <RoleGuard
          allowed={p.effectiveRole === 'Admin'}
          message="Solo los administradores pueden acceder a esta sección."
          details={`Esta área incluye funcionalidades críticas como:\n• Subir nuevos cantos al sistema\n• Gestión del canal de YouTube\n• Administración de usuarios`}
          navigate={p.navigate}
        >
          <AdminDashboard />
        </RoleGuard>
      );

    case 'courses':
      return <CoursesMenu onSelectCourse={course => p.navigate(course)} />;

    case 'theory':
      return <MusicalTheory onBack={() => p.navigate('courses')} />;

    case 'liturgy':
      return <Liturgy onBack={() => p.navigate('courses')} />;

    case 'instruments':
      return <MusicalInstruments onBack={() => p.navigate('courses')} />;

    case 'manage-cantorals':
      return (
        <RoleGuard
          allowed={p.effectiveRole === 'Coro'}
          message="Solo los miembros del coro pueden gestionar cantorales."
          details={`Esta funcionalidad permite:\n• Crear y editar cantorales\n• Guardar borradores\n• Publicar cantorales para la comunidad`}
          navigate={p.navigate}
        >
          <CantoralManager
            cantorals={p.publishedCantorals}
            onPublishCantoral={p.onPublishCantoral}
          />
        </RoleGuard>
      );

    case 'history':
      return (
        <RoleGuard
          allowed={p.effectiveRole === 'Coro' || p.effectiveRole === 'Admin'}
          message="El historial de cantorales está disponible solo para coros y administradores."
          details="Puedes ver todos los cantorales publicados en la sección principal."
          buttonLabel="Ver Cantorales Publicados"
          backView="cantorals"
          navigate={p.navigate}
        >
          <CantoralHistory
            cantorals={p.publishedCantorals}
            onPlaySong={p.onPlaySong}
            onDeleteCantoral={p.onDeleteCantoral}
          />
        </RoleGuard>
      );

    case 'liturgical-calendar':
      return (
        <LiturgicalCalendar
          onCreateCantoral={(liturgicalDate, date) => {
            if (p.effectiveRole === 'Coro') {
              p.navigate('main');
              toast.success(`Crear cantoral para: ${liturgicalDate}`, {
                description: `Fecha: ${new Date(date).toLocaleDateString('es-ES')}`,
                duration: 5000,
              });
            } else {
              toast.info(liturgicalDate, {
                description: new Date(date).toLocaleDateString('es-ES'),
                duration: 3000,
              });
            }
          }}
        />
      );

    case 'sheet-music':
      return (
        <RoleGuard
          allowed={p.effectiveRole === 'Coro' || p.effectiveRole === 'Admin'}
          message="El banco de partituras está disponible solo para coros y administradores."
          details="Esta herramienta es para la selección y gestión de cantos durante la preparación de cantorales."
          buttonLabel="Ver Cantorales Publicados"
          backView="cantorals"
          navigate={p.navigate}
        >
          <SheetMusicLibrary onPlaySong={p.onPlaySong} />
        </RoleGuard>
      );

    default:
      return null;
  }
}

export default App;

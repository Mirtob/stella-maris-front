import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster, toast } from 'sonner';
import { Login } from './components/auth/Login';
import { AuthCallback } from './components/auth/AuthCallback';
import { ProfileSetup } from './components/profile/ProfileSetup';
import { ChoirView } from './components/layout/ChoirView';
import { PublishedCantorals } from './components/cantoral/PublishedCantorals';
import { Sidebar } from './components/layout/Sidebar';
import { MenuButton } from './components/layout/MenuButton';
import { Tour } from './components/tour/Tour';
import { toursByRole, hasSeenTour, markTourSeen, resetTour } from './components/tour/tours';
import { NotificationBell } from './components/layout/NotificationBell';
import { SolemnityAlerts } from './components/liturgy/SolemnityAlerts';

// Vistas pesadas / no iniciales — carga diferida (code-splitting) para aligerar
// el bundle inicial. Son exports nombrados, de ahí el `.then(m => ({ default }))`.
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SongPlayer = lazy(() => import('./components/songs/SongPlayer').then(m => ({ default: m.SongPlayer })));
const PlaylistPlayer = lazy(() => import('./components/songs/PlaylistPlayer').then(m => ({ default: m.PlaylistPlayer })));
const CoursesMenu = lazy(() => import('./components/courses/CoursesMenu').then(m => ({ default: m.CoursesMenu })));
const MusicalTheory = lazy(() => import('./components/courses/MusicalTheory').then(m => ({ default: m.MusicalTheory })));
const Liturgy = lazy(() => import('./components/liturgy/Liturgy').then(m => ({ default: m.Liturgy })));
const MusicalInstruments = lazy(() => import('./components/courses/MusicalInstruments').then(m => ({ default: m.MusicalInstruments })));
const CantoralManager = lazy(() => import('./components/cantoral/CantoralManager').then(m => ({ default: m.CantoralManager })));
const ProfileSettings = lazy(() => import('./components/profile/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const CantoralHistory = lazy(() => import('./components/cantoral/CantoralHistory').then(m => ({ default: m.CantoralHistory })));
const LiturgicalCalendar = lazy(() => import('./components/liturgy/LiturgicalCalendar').then(m => ({ default: m.LiturgicalCalendar })));
const SheetMusicLibrary = lazy(() => import('./components/songs/SheetMusicLibrary').then(m => ({ default: m.SheetMusicLibrary })));
import { LoadingScreen } from './components/common/LoadingScreen';
import { SelectActiveParishDialog } from './components/profile/SelectActiveParishDialog';
import { RoleGuard } from './components/profile/RoleGuard';
import { CantoralQRDialog } from './components/cantoral/CantoralQRDialog';
import { MultiPublishSummary } from './components/cantoral/MultiPublishSummary';
import { CantoralDeepLink } from './components/cantoral/CantoralDeepLink';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { TermsOfService } from './components/legal/TermsOfService';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { Onboarding } from './components/common/Onboarding';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { NotFound } from './components/common/NotFound';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/layout/ThemeToggle';
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
  updateCantoral as updateCantoralInDB,
  updateCantoralPdfUrl,
  rowToCantoral,
  findDuplicate,
} from './services/cantorals';
import { getSupabaseClient } from './services/supabaseClient';
import { uploadCantoralPDF } from './services/cantoralPDF';
import { cacheCantoralsForOffline, getOfflineCantorals } from './services/offlineCache';
import { listChapels } from './services/chapels';
import { getTodayLocal, addDaysLocal, isWithinInclusive } from './utils/dateLocal';
import { massTypeBadge } from './utils/massType';
import { generateChoirCantoralPDF } from './utils/choirCantoralPDFGenerator';
import { isCurrentUserAdmin } from './services/admin';
import { upsertCurrentUserProfile, getCurrentUserProfile } from './services/userProfiles';
import { setSentryUserContext, clearSentryUserContext } from './services/sentry';

const PENDING_CANTORAL_KEY = 'stella_maris_pending_cantoral_id';
const ONBOARDING_SEEN_KEY = 'stella_maris_onboarding_seen';

function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
  } catch {
    /* localStorage no disponible (modo privado iOS) — el onboarding se mostrará otra vez, no es bloqueante */
  }
}

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

/**
 * V2 — Distinguir un deep link inválido de cantoral (`/c/<bad>`) de una URL
 * desconocida (`/foo`). Antes ambos caían al Login sin avisar.
 *
 *   - /c/{uuid válido} → deep link OK (otra función se encarga)
 *   - /c/{algo no UUID} → 'invalid-link'
 *   - /c/ vacío → 'invalid-link'
 *   - cualquier otro path desconocido → 'unknown-route'
 *   - paths conocidos (/, /auth/callback) → null (continuar flujo normal)
 */
function classifyPath(): { kind: 'ok' } | { kind: 'invalid-link' | 'unknown-route' } {
  const path = window.location.pathname;
  // Paths conocidos del shell
  if (path === '/' || path === '/auth/callback') return { kind: 'ok' };
  // Deep link de cantoral
  if (path.startsWith('/c/')) {
    const id = getCantoralIdFromPath();
    return id ? { kind: 'ok' } : { kind: 'invalid-link' };
  }
  return { kind: 'unknown-route' };
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
  | { screen: 'onboarding' }
  | { screen: 'profile-setup' }
  | { screen: 'player'; song: Song; returnView: ViewState }
  | { screen: 'playlist'; cantoral: PublishedCantoral; returnView: ViewState }
  | { screen: 'settings'; returnView: ViewState }
  | { screen: 'cantoral-link'; cantoralId: string }
  | { screen: 'terms'; returnTo: AppRoute }
  | { screen: 'privacy'; returnTo: AppRoute }
  | { screen: 'not-found'; reason: 'invalid-link' | 'unknown-route'; attemptedPath: string }
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
  // Si está editando un cantoral publicado, su id; al republicar se ACTUALIZA en vez de crear.
  const [editingCantoralId, setEditingCantoralId] = useState<string | null>(null);
  // Catálogo global de capillas (parishFull → capillas) para el selector de sesión.
  const [chapelsByParish, setChapelsByParish] = useState<Record<string, { id: string; name: string }[]>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showParishSelector, setShowParishSelector] = useState(false);
  // Fuerza re-render al cerrar el tour (para que hasSeenTour() se reevalúe).
  const [, setTourTick] = useState(0);
  const [qrCantoral, setQrCantoral] = useState<PublishedCantoral | null>(null);
  // true cuando el QR se abre desde "Compartir" (no recién publicado) → encabezado distinto.
  const [qrShareMode, setQrShareMode] = useState(false);
  const handleShareCantoral = (c: PublishedCantoral) => { setQrShareMode(true); setQrCantoral(c); };
  // Resumen tras publicar el mismo cantoral en varias parroquias (QR por parroquia).
  const [publishedBatch, setPublishedBatch] = useState<PublishedCantoral[] | null>(null);
  // Server-authoritative admin check (vs. trusting the role saved in localStorage)
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  // Q17 — flag para mostrar skeleton mientras Supabase responde con la lista
  const [loadingCantorals, setLoadingCantorals] = useState(true);
  // F2 — Vista pendiente cuando el coro intenta abandonar un draft de cantoral.
  // null = no hay confirmación abierta; string = mostrar diálogo y, si confirma, navegar a esa vista.
  const [pendingNavigateView, setPendingNavigateView] = useState<ViewState | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Navigate to a view inside the authenticated shell.
   *  Q19 — Si estábamos armando un cantoral (vista 'main' como Coro con cantos
   *  en el draft) y nos vamos a otra vista, pedimos confirmación.
   *  Evita perder 15 minutos de armado por un tap accidental al sidebar.
   *  F2 — Usa <ConfirmDialog> en lugar del window.confirm nativo (iOS se ve OS-style,
   *  rompe la sensación PWA). */
  function navigate(view: string) {
    const isAbandoningDraft =
      route.screen === 'app' &&
      route.view === 'main' &&
      cantoral.length > 0 &&
      view !== 'main' &&
      (userProfile?.activeRole || userProfile?.role) === 'Coro';
    if (isAbandoningDraft) {
      setPendingNavigateView(view as ViewState);
      return;
    }
    // Salir del constructor cancela cualquier edición en curso (evita actualizar
    // por error un cantoral previo al publicar uno nuevo más tarde).
    if (view !== 'main') setEditingCantoralId(null);
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
      .then((list) => {
        // Sin red y sin datos del backend: usar lo cacheado para la Misa.
        if (list.length === 0 && typeof navigator !== 'undefined' && navigator.onLine === false) {
          setPublishedCantorals(getOfflineCantorals());
          return;
        }
        setPublishedCantorals(list);
        // Cachear en segundo plano la ventana próxima (hoy → hoy+14) para uso offline.
        const today = getTodayLocal();
        const upcoming = list.filter((c) => isWithinInclusive(c.date, today, addDaysLocal(today, 14)));
        if (upcoming.length) void cacheCantoralsForOffline(upcoming);
      })
      .finally(() => setLoadingCantorals(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.screen, userProfile, isVerifiedAdmin]);

  // Cargar el catálogo de capillas una vez que hay sesión (para el selector de parroquia).
  useEffect(() => {
    if (!userProfile) return;
    let cancelled = false;
    listChapels().then((list) => {
      if (cancelled) return;
      const map: Record<string, { id: string; name: string }[]> = {};
      for (const c of list) {
        (map[c.parishFull] ??= []).push({ id: c.id, name: c.name });
      }
      setChapelsByParish(map);
    });
    return () => { cancelled = true; };
  }, [userProfile?.id]);

  // Auth initialization — runs once on mount
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') return;

    // V1+V2 — Clasificar el path ANTES de cualquier auth check. URLs desconocidas
    // o deep links inválidos van a NotFound, no al login silencioso.
    const cls = classifyPath();
    if (cls.kind !== 'ok') {
      setRoute({ screen: 'not-found', reason: cls.kind, attemptedPath: window.location.pathname });
      return;
    }

    // Detect /c/:id deep link from QR scan
    const deepLinkCantoralId = getCantoralIdFromPath();

    let timer: ReturnType<typeof setTimeout> | null = null;

    async function initializeAuth() {
      const storedSession = await getStoredSession();
      const storedProfile = getStoredUserProfile();

      // Deep link de QR: mostrar SIEMPRE el cantoral (vista Pueblo fiel), sin exigir
      // login (lectura anónima de cantorales publicados). Si hay perfil guardado lo
      // seteamos para que "Abrir en la app" funcione, pero la vista del cantoral no
      // depende de la sesión.
      if (deepLinkCantoralId) {
        localStorage.removeItem(PENDING_CANTORAL_KEY);
        if (storedSession && storedProfile) {
          setUserProfile(storedProfile);
          upsertCurrentUserProfile(storedProfile).catch(() => undefined);
          setSentryUserContext(storedProfile.role, storedProfile.id);
        }
        setRoute({ screen: 'cantoral-link', cantoralId: deepLinkCantoralId });
        return;
      }

      if (storedSession) {
        if (storedProfile) {
          setUserProfile(storedProfile);
          // Refresh last_seen_at + datos en Supabase. Fire-and-forget.
          upsertCurrentUserProfile(storedProfile).catch(() => undefined);
          // Sentry: contexto sin PII — solo rol y ID anónimo (UUID Supabase).
          setSentryUserContext(storedProfile.role, storedProfile.id);
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

          // El perfil PERMANENTE vive en Supabase. En un dispositivo nuevo el
          // localStorage está vacío, pero si el usuario ya completó su perfil
          // antes (en otro equipo) lo recuperamos y NO le pedimos el setup inicial
          // de nuevo: solo la elección de sesión (rol + parroquia).
          const remoteProfile = await getCurrentUserProfile(baseProfile.id);
          if (remoteProfile) {
            setUserProfile(remoteProfile);
            saveUserProfile(remoteProfile);
            upsertCurrentUserProfile(remoteProfile).catch(() => undefined);
            setSentryUserContext(remoteProfile.role, remoteProfile.id);
            toast.success(`¡Bienvenido ${remoteProfile.name}! 🎵`);

            const pendingId = deepLinkCantoralId
              || sanitizeCantoralId(localStorage.getItem(PENDING_CANTORAL_KEY));
            localStorage.removeItem(PENDING_CANTORAL_KEY);
            if (pendingId) {
              setRoute({ screen: 'cantoral-link', cantoralId: pendingId });
              return;
            }
            // Admin entra directo; el resto elige rol + parroquia de la sesión.
            if (remoteProfile.role !== 'Admin') setShowParishSelector(true);
            setRoute({ screen: 'app', view: 'main' });
            return;
          }

          // Sin perfil remoto: es un usuario nuevo de verdad → onboarding + setup.
          setUserProfile(baseProfile);
          if (deepLinkCantoralId) {
            localStorage.setItem(PENDING_CANTORAL_KEY, deepLinkCantoralId);
          }
          // Onboarding solo se ve UNA vez por dispositivo.
          if (!hasSeenOnboarding()) {
            setRoute({ screen: 'onboarding' });
          } else {
            setRoute({ screen: 'profile-setup' });
          }
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

  // Aviso EN VIVO (Supabase Realtime) cuando se publica un cantoral de la
  // parroquia del Pueblo fiel. Reemplaza el toast frágil basado en conteo.
  useEffect(() => {
    const effectiveRole = userProfile?.activeRole || userProfile?.role;
    if (effectiveRole !== 'Pueblo fiel') return;
    const parish = userProfile?.activeParishName || userProfile?.parishName;
    if (!parish) return;

    const sb = getSupabaseClient();
    const channel = sb
      .channel('cantorals-notif')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'published_cantorals' },
        (payload: any) => {
          const row = payload?.new;
          if (!row || row.status !== 'published' || row.parish_name !== parish) return;
          // Refrescar la lista para que aparezca en el dashboard y la campana.
          listCantorals(parish).then(setPublishedCantorals);
          const cantoral = rowToCantoral(row);
          toast.success('¡Nuevo cantoral publicado! 📖', {
            description: `${row.liturgical_date} · ${row.mass_time}`,
            duration: 9000,
            action: {
              label: '🎧 Escuchar cantos',
              onClick: () => setRoute({ screen: 'playlist', cantoral, returnView: currentView() }),
            },
          });
        }
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.activeRole, userProfile?.role, userProfile?.activeParishName, userProfile?.parishName]);

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

  /**
   * Cambio rápido de parroquia activa desde el menú lateral (Coro / Pueblo fiel con
   * varias parroquias). Mantiene el rol de la sesión; solo cambia qué parroquia se ve.
   * El effect de carga de cantorales depende de `userProfile`, así que al setear un
   * nuevo perfil se recargan los cantorales de la parroquia elegida.
   */
  const handleSwitchActiveParish = (parish: string) => {
    if (!userProfile) return;
    if (parish === (userProfile.activeParishName || userProfile.parishName)) return;
    const updated: UserProfile = {
      ...userProfile,
      activeParishName: parish,
      lastSessionParish: parish,
    };
    setUserProfile(updated);
    saveUserProfile(updated);
    upsertCurrentUserProfile(updated).catch(() => undefined);
    toast.success(`Parroquia: ${parish}`);
    // No hace falta navegar: el effect de carga depende de userProfile y recarga los
    // cantorales de la nueva parroquia en la vista actual (p. ej. Pueblo fiel en 'main').
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

  // Abrir el reproductor "modo radio" con todos los cantos del cantoral.
  const handleListen = (cantoral: PublishedCantoral) => {
    setRoute({ screen: 'playlist', cantoral, returnView: currentView() });
  };

  const handleBackFromPlaylist = () => {
    const returnView = route.screen === 'playlist' ? route.returnView : 'main';
    setRoute({ screen: 'app', view: returnView });
  };

  const handleOpenSettings = () => {
    setRoute({ screen: 'settings', returnView: currentView() });
  };

  const handleCloseSettings = () => {
    const returnView = route.screen === 'settings' ? route.returnView : 'main';
    setRoute({ screen: 'app', view: returnView });
  };

  // Q15 — Traducir errores de Supabase a mensajes humanos.
  // RLS, JWT, network y "duplicate key" son los más comunes en producción.
  const translatePublishError = (error?: string): string => {
    const raw = (error ?? '').toLowerCase();
    if (raw.includes('jwt') || raw.includes('unauthorized') || raw.includes('401')) {
      return 'Tu sesión caducó. Inicia sesión de nuevo.';
    }
    if (raw.includes('row-level security') || raw.includes('rls') || raw.includes('permission denied')) {
      return 'No tienes permiso para publicar en esta parroquia.';
    }
    if (raw.includes('duplicate') || raw.includes('unique')) {
      return 'Ya existe un cantoral con esos datos para esta parroquia y horario.';
    }
    if (raw.includes('failed to fetch') || raw.includes('network')) {
      return 'Sin conexión a internet. Revisa tu red y vuelve a intentar.';
    }
    return 'No pudimos guardar el cantoral. Vuelve a intentar.';
  };

  // Publica uno o varios cantorales (uno por parroquia/horario), con los mismos cantos.
  const handlePublishCantoral = async (newCantorals: PublishedCantoral[]) => {
    if (newCantorals.length === 0) return;
    const single = newCantorals.length === 1;

    // Q16 — Validar sesión una sola vez antes de tocar la red. Si el token de Supabase
    // ya expiró y el auto-refresh falló, el insert respondería 401 críptico ("JWT
    // expired"). Mejor frenarlo acá y guiar al usuario al login.
    const session = await getStoredSession();
    if (!session) {
      toast.error('Sesión expirada', {
        description: 'Tu sesión caducó. Inicia sesión de nuevo para publicar el cantoral.',
      });
      setRoute({ screen: 'login' });
      return;
    }

    // ── Edición: si venimos de "Editar", ACTUALIZAMOS el cantoral existente (mismo id)
    //    en vez de crear uno nuevo. La edición aplica a un solo cantoral.
    if (editingCantoralId) {
      const updated: PublishedCantoral = { ...newCantorals[0], id: editingCantoralId };
      setEditingCantoralId(null);
      setPublishedCantorals(prev => prev.map(c => (c.id === editingCantoralId ? updated : c)));
      const r = await updateCantoralInDB(updated);
      if (!r.ok) {
        toast.error('No se pudo actualizar el cantoral', { description: r.error });
        const activeParish = userProfile?.activeParishName || userProfile?.parishName;
        setPublishedCantorals(await listCantorals(activeParish));
        return;
      }
      // Regenerar el PDF del coro y refrescar.
      try {
        const { blob } = await generateChoirCantoralPDF(
          updated.songs, updated.parishName, updated.date,
          massTypeBadge(updated) ? `${updated.liturgicalDate} (${massTypeBadge(updated)})` : updated.liturgicalDate,
          updated.massTime, userProfile?.instruments ?? [], 'Full Score', { download: false }
        );
        const up = await uploadCantoralPDF(updated.id, blob);
        if (up.ok && up.publicUrl) await updateCantoralPdfUrl(updated.id, up.publicUrl);
      } catch { /* best-effort */ }
      setCantoral([]);
      const activeParish = userProfile?.activeParishName || userProfile?.parishName;
      setPublishedCantorals(await listCantorals(activeParish));
      toast.success('Cantoral actualizado');
      return;
    }

    // Optimistic UI: mostrar todos de inmediato mientras corren los inserts.
    setPublishedCantorals(prev => [...newCantorals, ...prev]);

    const succeeded: PublishedCantoral[] = [];
    const failed: { parishName: string; error?: string }[] = [];

    for (const newCantoral of newCantorals) {
      // Un cantoral por Misa: si ya hay uno para esa parroquia + fecha + horario,
      // no publicar otro. (El índice UNIQUE en la BD es la red de seguridad.)
      const dup = await findDuplicate(newCantoral.parishName, newCantoral.date, newCantoral.massTime);
      if (dup) {
        setPublishedCantorals(prev => prev.filter(c => c.id !== newCantoral.id));
        // 'duplicate' → translatePublishError lo mapea al mensaje amigable de duplicado.
        failed.push({ parishName: newCantoral.parishName, error: 'duplicate' });
        continue;
      }

      const result = await publishCantoralToDB(newCantoral);
      if (!result.ok) {
        // Revertir SOLO este; el draft sigue intacto para no perder trabajo.
        setPublishedCantorals(prev => prev.filter(c => c.id !== newCantoral.id));
        failed.push({ parishName: newCantoral.parishName, error: result.error });
        continue;
      }

      // Generar PDF (sin descargar) y subir a Storage. Best-effort: si falla, el
      // cantoral ya quedó publicado. Solo avisamos cuando es una única parroquia
      // (evita spam de toasts en publicación múltiple).
      let pdfUrl: string | undefined;
      try {
        // PDF liviano para el QR/Storage (sin partituras embebidas, publicación rápida).
        const { blob } = await generateChoirCantoralPDF(
          newCantoral.songs,
          newCantoral.parishName,
          newCantoral.date,
          massTypeBadge(newCantoral) ? `${newCantoral.liturgicalDate} (${massTypeBadge(newCantoral)})` : newCantoral.liturgicalDate,
          newCantoral.massTime,
          userProfile?.instruments ?? [],
          'Full Score',
          // PDF del coro = letra con acordes (en orden de la Misa). Las partituras
          // del coro se ven en el Modo Atril, no en este folleto. El folleto del
          // Pueblo fiel (letra sin acordes + partituras del ordinario) se genera
          // aparte con generateCantoralPDF.
          { download: false }
        );
        const uploadResult = await uploadCantoralPDF(newCantoral.id, blob);
        if (uploadResult.ok && uploadResult.publicUrl) {
          pdfUrl = uploadResult.publicUrl;
          await updateCantoralPdfUrl(newCantoral.id, pdfUrl);
        } else if (single) {
          toast.warning('Cantoral publicado, pero no pudimos generar el PDF compartible.', {
            description: uploadResult.error,
          });
        }
      } catch (err: any) {
        if (single) {
          toast.warning('Cantoral publicado, pero falló la generación del PDF.', {
            description: err?.message,
          });
        }
      }

      succeeded.push({ ...newCantoral, pdfUrl });
    }

    // Reportar fallos (si los hubo).
    if (failed.length > 0) {
      const parishList = failed.map(f => f.parishName).join(', ');
      toast.error(
        failed.length === newCantorals.length
          ? 'Error al publicar el cantoral'
          : `No se pudo publicar en ${failed.length} parroquia${failed.length === 1 ? '' : 's'}`,
        { description: `${parishList}. ${translatePublishError(failed[0].error)}` }
      );
    }

    // Nada se publicó → conservar el draft para reintentar.
    if (succeeded.length === 0) return;

    // Al menos uno OK → limpiar el draft y avisar.
    setCantoral([]);
    toast.success(
      succeeded.length === 1
        ? '¡Cantoral publicado! 🎵'
        : `¡Cantoral publicado en ${succeeded.length} parroquias! 🎵`
    );

    // QR: una sola → diálogo directo; varias → resumen con QR por parroquia.
    if (succeeded.length === 1) {
      setQrShareMode(false);
      setQrCantoral(succeeded[0]);
    } else {
      setPublishedBatch(succeeded);
    }

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

    // El Admin verificado tiene un perfil COMPLETO aunque no tenga parroquia (CRUD global).
    // Debe ir al selector de rol/parroquia para cambiar de rol SIN reescribir su rol
    // permanente (el diálogo solo toca activeRole). Sin esto caía al alta completa,
    // que sobrescribía role='Admin' por el rol elegido.
    if (hasParishData || isVerifiedAdmin) {
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
    clearSentryUserContext();
    signOutOnly();
    setRoute({ screen: 'login' });
    toast.info('Sesión cerrada');
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates } as UserProfile;
    setUserProfile(updated);
    saveUserProfile(updated);
    // Sincronizar a Supabase cuando cambian datos persistentes del perfil (p. ej. el
    // conjunto de parroquias editado en Configuración). Fire-and-forget: el flujo local
    // sigue aunque falle. activeParishName/activeRole son de sesión, pero no estorban.
    upsertCurrentUserProfile(updated).catch(() => undefined);
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

  // Editar: carga los cantos al constructor y, al republicar, actualiza el mismo
  // cantoral (no crea uno nuevo). El original se conserva hasta que se vuelva a publicar.
  const handleEditCantoral = (id: string) => {
    const c = publishedCantorals.find(x => x.id === id);
    if (!c) return;
    setCantoral(c.songs);
    setEditingCantoralId(id);
    navigate('main');
    toast.info('Editando cantoral', {
      description: 'Modifica los cantos y la fecha/hora, y vuelve a publicarlo.',
    });
  };

  // ── Route rendering ───────────────────────────────────────────────────────

  // Auth callback is handled before any app route
  if (window.location.pathname === '/auth/callback') return <AuthCallback />;

  if (route.screen === 'loading')       return <LoadingScreen message="Cargando Stella Maris..." />;
  if (route.screen === 'login')         return <Login onGoogleLogin={handleGoogleLogin} />;
  if (route.screen === 'onboarding') {
    const goToSetup = () => {
      markOnboardingSeen();
      setRoute({ screen: 'profile-setup' });
    };
    return <Onboarding onComplete={goToSetup} onSkip={goToSetup} />;
  }
  if (route.screen === 'profile-setup') return (
    <ProfileSetup
      onComplete={handleProfileSetup}
      userEmail={userProfile?.email}
      onShowTerms={() => setRoute({ screen: 'terms', returnTo: { screen: 'profile-setup' } })}
      onShowPrivacy={() => setRoute({ screen: 'privacy', returnTo: { screen: 'profile-setup' } })}
    />
  );

  if (route.screen === 'not-found') {
    return (
      <NotFound
        reason={route.reason}
        attemptedPath={route.attemptedPath}
        // Hard reload a "/" para volver a correr initializeAuth con un path
        // limpio. Más simple y robusto que tratar de re-disparar el effect
        // a mano. Mantiene la sesión (localStorage no se toca).
        onGoHome={() => window.location.assign('/')}
      />
    );
  }

  if (route.screen === 'terms') {
    return <TermsOfService onBack={() => setRoute(route.returnTo)} />;
  }

  if (route.screen === 'privacy') {
    return <PrivacyPolicy onBack={() => setRoute(route.returnTo)} />;
  }

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
      <Suspense fallback={<LoadingScreen />}>
        <SongPlayer
          song={route.song}
          onBack={handleBackFromPlayer}
          userInstrument={userProfile?.instrument}
          userRole={userProfile?.role}
        />
      </Suspense>
    );
  }

  if (route.screen === 'playlist') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PlaylistPlayer cantoral={route.cantoral} onBack={handleBackFromPlaylist} />
      </Suspense>
    );
  }

  if (route.screen === 'settings') {
    if (!userProfile) return <Login onGoogleLogin={handleGoogleLogin} />;
    // Mismo cálculo que el shell/sidebar: la config se perfila por el rol de sesión
    // (con downgrade de Admin no verificado), no por el rol permanente.
    const claimedSettingsRole = userProfile.activeRole || userProfile.role || 'Coro';
    const settingsRole: UserRole =
      claimedSettingsRole === 'Admin' && !isVerifiedAdmin ? 'Coro' : claimedSettingsRole;
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ProfileSettings
          userProfile={userProfile}
          effectiveRole={settingsRole}
          onClose={handleCloseSettings}
          onSave={handleUpdateProfile}
        />
      </Suspense>
    );
  }

  // Authenticated app shell — route.screen === 'app'
  if (!userProfile) return <Login onGoogleLogin={handleGoogleLogin} />;

  const view = route.screen === 'app' ? route.view : 'main';
  const activeParishName = userProfile.activeParishName || userProfile.parishName || 'Mi Parroquia';
  // Ensure effectiveRole always falls back to a valid UserRole so renderView never returns null.
  // If localStorage claims 'Admin' but Supabase hasn't verified it, downgrade to 'Coro'.
  const claimedRole = userProfile.activeRole || userProfile.role || 'Coro';
  let effectiveRole: UserRole =
    claimedRole === 'Admin' && !isVerifiedAdmin ? 'Coro' : claimedRole;
  // Solo un perfil Coro (o Admin) puede actuar como Coro y publicar. Si un perfil
  // Pueblo fiel tuviera activeRole='Coro' persistido (de antes), se fuerza a Pueblo
  // fiel — red de seguridad por si el selector de sesión no se mostró.
  if (effectiveRole === 'Coro' && userProfile.role === 'Pueblo fiel') {
    effectiveRole = 'Pueblo fiel';
  }

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
          chapelsByParish={chapelsByParish}
          onSelect={handleSelectActiveParish}
          onSignOut={handleGoogleSignOut}
        />
      )}

      <CantoralQRDialog
        open={!!qrCantoral}
        cantoralId={qrCantoral?.id ?? ''}
        cantoralLabel={qrCantoral ? `${qrCantoral.liturgicalDate}${massTypeBadge(qrCantoral) ? ` (${massTypeBadge(qrCantoral)})` : ''} · ${qrCantoral.massTime}` : undefined}
        parishName={qrCantoral?.parishName}
        pdfUrl={qrCantoral?.pdfUrl}
        shareMode={qrShareMode}
        onClose={() => { setQrCantoral(null); setQrShareMode(false); }}
      />

      {publishedBatch && (
        <MultiPublishSummary
          cantorals={publishedBatch}
          onViewQR={(c) => setQrCantoral(c)}
          onClose={() => setPublishedBatch(null)}
        />
      )}

      <MenuButton onClick={() => setSidebarOpen(true)} />

      {effectiveRole === 'Pueblo fiel' && (
        <NotificationBell
          cantorals={publishedCantorals.filter(c => c.status === 'published')}
          onListen={handleListen}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userProfile={userProfile}
        currentView={view}
        onNavigate={navigate}
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
        effectiveRoleOverride={effectiveRole}
        onSwitchParish={handleSwitchActiveParish}
        onReplayTour={() => {
          resetTour(effectiveRole);
          navigate('main');
          setTourTick(t => t + 1);
        }}
      />

      <ConfirmDialog
        open={pendingNavigateView !== null}
        title="¿Salir del cantoral en armado?"
        message={`Tienes ${cantoral.length} ${cantoral.length === 1 ? 'canto agregado' : 'cantos agregados'} en el cantoral. El borrador queda en esta sesión, pero si cierras la app o cambias de cuenta se va a perder.`}
        confirmLabel="Sí, salir"
        cancelLabel="Seguir armando"
        variant="warning"
        onConfirm={() => {
          if (pendingNavigateView) {
            setRoute({ screen: 'app', view: pendingNavigateView });
            setPendingNavigateView(null);
          }
        }}
        onCancel={() => setPendingNavigateView(null)}
      />

      <Suspense fallback={<LoadingScreen />}>
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
          onEditCantoral: handleEditCantoral,
          onShareCantoral: handleShareCantoral,
          onListen: handleListen,
        })}
      </Suspense>

      <SolemnityAlerts />

      {/* Tutorial en vivo (F1): auto la primera vez por rol, en la vista principal. */}
      {view === 'main' && !showParishSelector && toursByRole[effectiveRole] && !hasSeenTour(effectiveRole) && (
        <Tour
          steps={toursByRole[effectiveRole]}
          onClose={() => { markTourSeen(effectiveRole); setTourTick(t => t + 1); }}
        />
      )}
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
  onPublishCantoral: (cantorals: PublishedCantoral[]) => Promise<void>;
  navigate: (view: string) => void;
  onDeleteCantoral: (id: string) => Promise<void>;
  onEditCantoral: (id: string) => void;
  onShareCantoral: (cantoral: PublishedCantoral) => void;
  onListen: (cantoral: PublishedCantoral) => void;
}

function renderView(p: ViewProps): JSX.Element | null {
  switch (p.view) {
    case 'main':
      if (p.effectiveRole === 'Coro') {
        return (
          <ChoirView
            preferredInstrument={p.userProfile.instrument || 'Guitarra'}
            userInstruments={p.userProfile.instruments}
            parishName={p.activeParishName}
            parishes={p.userProfile.parishes}
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
            onListen={p.onListen}
            userRole={p.effectiveRole}
            userInstrument={p.userProfile.instrument}
            userParishName={p.activeParishName}
            // El Pueblo fiel puede compartir el QR (no editar/eliminar).
            onShare={p.onShareCantoral}
          />
        );
      }
      if (p.effectiveRole === 'Admin') return <AdminDashboard />;
      // Fallback: perfil con rol desconocido o corrupto → tratar como Coro
      return (
        <ChoirView
          preferredInstrument={p.userProfile.instrument || 'Guitarra'}
          userInstruments={p.userProfile.instruments}
          parishName={p.activeParishName}
          parishes={p.userProfile.parishes}
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
          onListen={p.onListen}
          userRole={p.effectiveRole}
          userInstrument={p.userProfile.instrument}
          userParishName={p.activeParishName}
          // Editar/Eliminar solo Coro/Admin; Compartir (QR) lo puede usar también el Pueblo fiel.
          onEdit={p.effectiveRole !== 'Pueblo fiel' ? p.onEditCantoral : undefined}
          onDelete={p.effectiveRole !== 'Pueblo fiel' ? p.onDeleteCantoral : undefined}
          onShare={p.onShareCantoral}
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
            onEdit={p.onEditCantoral}
            onDelete={p.onDeleteCantoral}
            onShare={p.onShareCantoral}
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

import { useState } from 'react';
import { Users, Church, Music, ShieldCheck, Lock, AlertTriangle, Database, Youtube, LifeBuoy, KeyRound, BarChart3, GraduationCap, Megaphone } from 'lucide-react';
import { ProfileManager } from '../profile/ProfileManager';
import { ParishManager } from '../profile/ParishManager';
import { SongManager } from '../songs/SongManager';
import { CatalogMigration } from './CatalogMigration';
import { YouTubeSyncDialog } from './YouTubeSyncDialog';
import { RecoveryManager } from '../profile/RecoveryManager';
import { AdminUserAccounts } from './AdminUserAccounts';
import { SurveyResults } from './SurveyResults';
import { CourseQuizEditor } from './CourseQuizEditor';
import { AdminTeam } from './AdminTeam';
import { BroadcastManager } from './BroadcastManager';

type AdminView = 'menu' | 'users' | 'equipo' | 'avisos' | 'accounts' | 'parishes' | 'songs' | 'migration' | 'youtube-sync' | 'recovery' | 'survey' | 'quizzes';

interface AdminDashboardProps {
  /**
   * Admin limitado al CATÁLOGO DE CANTOS: quien ayuda a subir y transcribir.
   *
   * Solo esconde puertas — lo que de verdad lo limita son las policies de la base
   * (migración 20260901_admin_solo_cantos): aunque alguien fuerce esta bandera desde
   * el navegador, la base le rechaza todo lo que no sea el catálogo. Se esconde igual
   * porque una puerta que al abrirse da un error no es una puerta, es una trampa.
   */
  soloCantos?: boolean;
  /** Correo de quien administra, para dejarlo anotado al enviar un aviso. */
  enviadoPor?: string;
}

export function AdminDashboard({ soloCantos = false, enviadoPor }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('menu');

  // Red de seguridad: si por un enlace viejo o un estado raro se pidiera otra vista,
  // el ayudante vuelve al menú en vez de ver una pantalla que no puede usar.
  const vistaEfectiva: AdminView = soloCantos && currentView !== 'songs' ? 'menu' : currentView;

  if (vistaEfectiva === 'users') {
    return <ProfileManager />;
  }

  if (vistaEfectiva === 'equipo') {
    return <AdminTeam onBack={() => setCurrentView('menu')} />;
  }

  if (vistaEfectiva === 'avisos') {
    return <BroadcastManager onBack={() => setCurrentView('menu')} enviadoPor={enviadoPor} />;
  }

  if (vistaEfectiva === 'accounts') {
    return <AdminUserAccounts onBack={() => setCurrentView('menu')} />;
  }

  if (vistaEfectiva === 'parishes') {
    return <ParishManager />;
  }

  if (vistaEfectiva === 'songs') {
    // Borrar del catálogo es solo del principal: el ayudante sube y transcribe.
    return <SongManager puedeBorrar={!soloCantos} />;
  }

  if (vistaEfectiva === 'migration') {
    return <CatalogMigration onBack={() => setCurrentView('menu')} />;
  }

  if (vistaEfectiva === 'youtube-sync') {
    return <YouTubeSyncDialog onBack={() => setCurrentView('menu')} />;
  }

  if (vistaEfectiva === 'recovery') {
    return <RecoveryManager onBack={() => setCurrentView('menu')} />;
  }

  if (vistaEfectiva === 'survey') {
    return <SurveyResults onBack={() => setCurrentView('menu')} />;
  }

  if (vistaEfectiva === 'quizzes') {
    return <CourseQuizEditor onBack={() => setCurrentView('menu')} />;
  }

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-strong rounded-full flex items-center justify-center shadow-lg border-4 border-brand-border">
              <ShieldCheck className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-brand-ink mb-2">Panel Administrativo</h1>
          <p className="text-xl text-brand-ink-soft">
            {soloCantos ? 'Tu acceso: el catálogo de cantos' : 'Gestión completa del sistema'}
          </p>
        </div>

        {/* Admin Menu Cards */}
        <div className="space-y-4">
          {/* Todo lo que sigue es del administrador PLENO. El ayudante de cantos ve
              solo la tarjeta del catálogo: una puerta que al abrirse diera un error
              no sería una puerta, sería una trampa. */}
          {!soloCantos && (
            <>
          {/* Users Management */}
          <button
            onClick={() => setCurrentView('users')}
            className="w-full bg-gradient-to-br from-brand to-brand-strong rounded-2xl shadow-xl p-6 border-2 border-brand-border hover:border-blue-600 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <Users className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Gestión de Usuarios</h2>
                <p className="text-base text-blue-100">
                  Administra perfiles, roles y permisos
                </p>
              </div>
            </div>
          </button>

          {/* Equipo de administración */}
          <button
            onClick={() => setCurrentView('equipo')}
            className="w-full bg-gradient-to-br from-brand to-brand-strong rounded-2xl shadow-xl p-6 border-2 border-brand-border hover:border-blue-600 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <ShieldCheck className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Equipo de administración</h2>
                <p className="text-base text-blue-100">
                  Da de alta ayudantes del catálogo y quita accesos
                </p>
              </div>
            </div>
          </button>

          {/* Avisos y promociones */}
          <button
            onClick={() => setCurrentView('avisos')}
            className="w-full bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 border-2 border-orange-700 hover:border-orange-400 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <Megaphone className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Avisos y promociones</h2>
                <p className="text-base text-orange-50">
                  Un mensaje a los telefonos de la comunidad
                </p>
              </div>
            </div>
          </button>

          {/* Parishes Management */}
          <button
            onClick={() => setCurrentView('parishes')}
            className="w-full bg-gradient-to-br from-brand to-brand-strong rounded-2xl shadow-xl p-6 border-2 border-brand-border hover:border-blue-600 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <Church className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Gestión de Parroquias</h2>
                <p className="text-base text-blue-100">
                  Administra parroquias y comunidades
                </p>
              </div>
            </div>
          </button>
            </>
          )}

          {/* Songs Management */}
          <button
            data-tour="admin-songs"
            onClick={() => setCurrentView('songs')}
            className="w-full bg-gradient-to-br from-brand to-brand-strong rounded-2xl shadow-xl p-6 border-2 border-brand-border hover:border-blue-600 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <Music className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Gestión de Cantos</h2>
                <p className="text-base text-blue-100">
                  Administra biblioteca musical
                </p>
              </div>
            </div>
          </button>

          {!soloCantos && (
            <>
          {/* YouTube Sync */}
          <button
            data-tour="admin-sync"
            onClick={() => setCurrentView('youtube-sync')}
            className="w-full bg-gradient-to-br from-red-600 to-red-700 rounded-2xl shadow-xl p-6 border-2 border-red-500 hover:border-red-300 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <Youtube className="w-9 h-9 text-white" strokeWidth={2} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Sincronizar YouTube</h2>
                <p className="text-base text-red-100">
                  Importar canciones nuevas del canal
                </p>
              </div>
            </div>
          </button>

          {/* Recovery de cuentas */}
          <button
            onClick={() => setCurrentView('recovery')}
            className="w-full bg-gradient-to-br from-green-700 to-emerald-800 rounded-2xl shadow-xl p-6 border-2 border-green-600 hover:border-green-400 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <LifeBuoy className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Recuperación de Cuentas</h2>
                <p className="text-base text-green-100">
                  Buscar perfiles por email principal o respaldo
                </p>
              </div>
            </div>
          </button>

          {/* Cuentas usuario/clave */}
          <button
            data-tour="admin-accounts"
            onClick={() => setCurrentView('accounts')}
            className="w-full bg-gradient-to-br from-blue-700 to-indigo-900 rounded-2xl shadow-xl p-6 border-2 border-blue-600 hover:border-blue-400 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <KeyRound className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Cuentas usuario/clave</h2>
                <p className="text-base text-blue-100">
                  Crear cuentas sin correo y restablecer claves
                </p>
              </div>
            </div>
          </button>

          {/* Catalog Migration */}
          <button
            onClick={() => setCurrentView('migration')}
            className="w-full bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl shadow-xl p-6 border-2 border-emerald-600 hover:border-emerald-400 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <Database className="w-9 h-9 text-white" strokeWidth={2} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Migrar Catálogo</h2>
                <p className="text-base text-emerald-100">
                  Importar canciones locales a Supabase
                </p>
              </div>
            </div>
          </button>

          {/* Resultados de la encuesta (muestra pre-lanzamiento) */}
          <button
            onClick={() => setCurrentView('survey')}
            className="w-full bg-gradient-to-br from-indigo-700 to-violet-900 rounded-2xl shadow-xl p-6 border-2 border-indigo-600 hover:border-indigo-400 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <BarChart3 className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Encuesta de la muestra</h2>
                <p className="text-base text-indigo-100">
                  Resultados del pre-lanzamiento (/demo)
                </p>
              </div>
            </div>
          </button>

          {/* Editar quizzes de Cursos */}
          <button
            onClick={() => setCurrentView('quizzes')}
            className="w-full bg-gradient-to-br from-teal-700 to-cyan-900 rounded-2xl shadow-xl p-6 border-2 border-teal-600 hover:border-teal-400 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <GraduationCap className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">Quizzes de Cursos</h2>
                <p className="text-base text-teal-100">
                  Edita el texto y el enfoque de las preguntas
                </p>
              </div>
            </div>
          </button>
            </>
          )}
        </div>

        {/* Qué alcance tiene esta cuenta. Se dice de frente para que nadie pierda el
            tiempo buscando una sección que no le corresponde. */}
        {soloCantos && (
          <div className="mt-8 bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/60 dark:border-white/20">
            <h3 className="text-lg font-bold text-brand-ink mb-2">Tu acceso</h3>
            <p className="text-base text-brand-ink-soft leading-relaxed">
              Tu cuenta administra <strong>el catálogo de cantos</strong>: agregar, editar y
              etiquetar. Las demás secciones del panel (usuarios, parroquias, cuentas,
              encuesta, cursos) son del administrador principal.
            </p>
          </div>
        )}

        {/* Aviso de Seguridad de YouTube */}
        {!soloCantos && (
        <div className="mt-8 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-950 dark:to-orange-950 rounded-2xl p-3 sm:p-4 border-2 border-red-400 dark:border-red-700 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center border-3 border-red-600 shadow-lg">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" strokeWidth={2.5} />
                <span className="min-w-0">Seguridad del Canal de YouTube</span>
              </h3>
              <div className="space-y-3 text-base text-red-800 dark:text-red-200">
                <p className="leading-relaxed">
                  <strong>⚠️ Acceso Exclusivo de Administrador:</strong>
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                    <span>Solo los administradores pueden subir cantos a través de esta aplicación</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                    <span>Los usuarios de tipo Coro y Pueblo Fiel NO tienen acceso a esta sección</span>
                  </li>
                </ul>
                
                <div className="mt-4 pt-4 border-t-2 border-red-300 dark:border-red-800">
                  <p className="leading-relaxed mb-2">
                    <strong>🔐 Configuración de YouTube:</strong>
                  </p>
                  <p className="text-sm leading-relaxed">
                    Para proteger el canal de YouTube contra modificaciones no autorizadas directamente desde YouTube:
                  </p>
                  <ul className="space-y-2 ml-4 mt-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 mt-1">1.</span>
                      <span>Accede a <strong>YouTube Studio → Configuración → Permisos</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 mt-1">2.</span>
                      <span>Mantén solo al administrador como <strong>"Propietario"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 mt-1">3.</span>
                      <span>NO agregues otros usuarios como editores o administradores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 mt-1">4.</span>
                      <span>Activa la <strong>verificación en dos pasos (2FA)</strong> en tu cuenta de Google</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t-2 border-red-300 dark:border-red-800">
                  <p className="text-sm italic">
                    📌 <strong>Nota:</strong> La aplicación conecta a YouTube mediante la API oficial. Los permisos se gestionan desde la consola de YouTube Studio y la Google Cloud Console.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
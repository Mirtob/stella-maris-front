import { useEffect, useState } from 'react';
import {
  ArrowLeft, Check, Loader, Bell, Share, Plus, MoreVertical, Menu,
  Copy, Chrome, Smartphone, AlertTriangle, RefreshCw, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import logoStellaMaris from 'figma:asset/logo-stella-maris.webp';
import {
  getDeferredInstallPrompt, promptInstall, subscribeInstall, isStandalone,
} from '../../utils/installPrompt';
import { detectPlatform, canInstallHere, browserToUse } from '../../utils/installPlatform';
import {
  pushSupported, notificationPermission, isPushEnabled, enablePush, sendTestPush,
} from '../../services/push';

interface InstallAppProps {
  /** Volver a donde estaba. Si no se pasa, no se muestra el botón. */
  onBack?: () => void;
  /** Parroquias del perfil, para suscribir los avisos de "nuevo cantoral". */
  parishes?: string[];
  /** Rol efectivo (el Coro recibe además el recordatorio de publicar el cantoral). */
  role?: string;
  /** ¿Hay sesión iniciada? Sin sesión no se puede suscribir el dispositivo. */
  loggedIn?: boolean;
  /** Llevar a iniciar sesión (para el paso de avisos, si entró desde un QR). */
  onLogin?: () => void;
}

/** Tarjeta numerada de un paso, con su estado (pendiente / listo). */
function Paso({ n, titulo, listo, children }: {
  n: number; titulo: string; listo?: boolean; children: React.ReactNode;
}) {
  return (
    <section className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl border-2 border-white/60 dark:border-white/20 shadow-xl overflow-hidden">
      <header className={`flex items-center gap-3 p-4 sm:p-5 ${
        listo
          ? 'bg-gradient-to-br from-green-600 to-green-700 border-b-2 border-green-800'
          : 'bg-gradient-to-br from-brand to-brand-strong border-b-2 border-brand-border'
      }`}>
        <div className="w-11 h-11 flex-shrink-0 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xl font-bold">
          {listo ? <Check className="w-6 h-6" strokeWidth={3} /> : n}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{titulo}</h2>
      </header>
      <div className="p-4 sm:p-5 space-y-4">{children}</div>
    </section>
  );
}

/** Un paso manual: número + texto, con espacio para un ícono del navegador. */
function Instruccion({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="w-7 h-7 flex-shrink-0 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span className="text-lg text-brand-ink leading-snug">{children}</span>
    </li>
  );
}

/**
 * Módulo «Instalar aplicación».
 *
 * Escrito después del lanzamiento del 29-ago-2026, donde se vieron los dos problemas
 * que esta pantalla resuelve:
 *
 *  · ANDROID — casi nadie pudo instalar desde el QR. La instrucción "abre los tres
 *    puntos" no sirve porque ese menú se llama y se ve distinto en cada teléfono
 *    (Chrome, Samsung Internet, Edge, Xiaomi…). La solución de fondo no es una
 *    instrucción mejor sino NO NECESITAR instrucción: con el service worker ya
 *    registrado el navegador ofrece instalar, y aquí eso es UN BOTÓN. Las
 *    instrucciones quedan solo como respaldo, y ya no genéricas: las del navegador
 *    que la persona tiene de verdad.
 *
 *  · iOS — la mayoría instaló pero no logró activar las notificaciones, porque en
 *    iPhone el push SOLO existe con la app instalada y abierta DESDE EL ÍCONO
 *    (iOS 16.4+). Antes eso no se decía en ninguna parte: el botón simplemente no
 *    funcionaba. Ahora el paso 2 dice exactamente qué falta y por qué.
 */
export function InstallApp({ onBack, parishes = [], role, loggedIn = false, onLogin }: InstallAppProps) {
  const plataforma = detectPlatform();
  const sePuedeAquí = canInstallHere(plataforma);
  const navegadorDestino = browserToUse(plataforma);

  const [instalada, setInstalada] = useState(isStandalone());
  const [promptDisponible, setPromptDisponible] = useState(!!getDeferredInstallPrompt());
  const [instalando, setInstalando] = useState(false);

  const [avisosActivos, setAvisosActivos] = useState(false);
  const [activandoAvisos, setActivandoAvisos] = useState(false);
  const [permiso, setPermiso] = useState(notificationPermission());

  const url = typeof window !== 'undefined' ? window.location.origin : '';

  // El evento de instalación puede llegar unos segundos después de abrir la pantalla.
  useEffect(() => subscribeInstall(() => setPromptDisponible(!!getDeferredInstallPrompt())), []);

  // Instalar la PWA no recarga la página: hay que mirar el modo de pantalla en vivo
  // para que el paso 1 se marque como listo y se habilite el paso 2.
  useEffect(() => {
    const mq = window.matchMedia?.('(display-mode: standalone)');
    const ver = () => setInstalada(isStandalone());
    mq?.addEventListener?.('change', ver);
    window.addEventListener('appinstalled', ver);
    return () => {
      mq?.removeEventListener?.('change', ver);
      window.removeEventListener('appinstalled', ver);
    };
  }, []);

  useEffect(() => {
    if (pushSupported()) isPushEnabled().then(setAvisosActivos);
  }, []);

  // ── Paso 1 ────────────────────────────────────────────────────────────────
  const instalar = async () => {
    if (instalando) return;
    setInstalando(true);
    try {
      const r = await promptInstall();
      if (r === 'accepted') {
        setInstalada(true);
        toast.success('¡Listo! Stella Maris quedó en tu teléfono', {
          description: 'Ábrela desde su ícono, como cualquier otra app.',
        });
      } else if (r === 'dismissed') {
        toast.info('No se instaló', { description: 'Puedes volver a intentarlo cuando quieras.' });
      } else {
        setPromptDisponible(false);
        toast.info('Tu navegador no ofreció el botón', { description: 'Sigue los pasos de abajo.' });
      }
    } finally {
      setInstalando(false);
    }
  };

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado', { description: `Pégalo en ${navegadorDestino} y ábrelo.` });
    } catch {
      toast.error('No se pudo copiar', { description: url });
    }
  };

  const compartir = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Stella Maris', url });
      else await copiarEnlace();
    } catch {
      /* el usuario canceló el menú de compartir */
    }
  };

  /** Abre el enlace en Chrome de verdad (sirve para salir de WhatsApp/Instagram). */
  const abrirEnChrome = () => {
    const sinEsquema = url.replace(/^https?:\/\//, '');
    window.location.href =
      `intent://${sinEsquema}#Intent;scheme=https;package=com.android.chrome;end`;
  };

  // ── Paso 2 ────────────────────────────────────────────────────────────────
  // En iPhone el push solo existe con la app instalada y abierta desde el ícono.
  const iosFaltaInstalar = plataforma.os === 'ios' && !instalada;
  const iosVersionCorta = plataforma.os === 'ios' && plataforma.iosVersion !== null && plataforma.iosVersion < 16;

  const activarAvisos = async () => {
    if (activandoAvisos) return;
    setActivandoAvisos(true);
    try {
      const r = await enablePush(parishes, role);
      setPermiso(notificationPermission());
      if (r.ok) {
        setAvisosActivos(true);
        toast.success('¡Avisos activados!', { description: 'Te mandamos uno de prueba ahora mismo.' });
      } else if (r.reason === 'denied') {
        toast.error('El teléfono los tiene bloqueados', {
          description: 'Ábrelos en los ajustes del teléfono y vuelve a intentar.',
        });
      } else if (r.reason === 'unsupported') {
        toast.error('Este navegador no admite avisos');
      } else {
        toast.error('No se pudo activar', { description: 'Vuelve a intentarlo en un momento.' });
      }
    } finally {
      setActivandoAvisos(false);
    }
  };

  const probarAviso = async () => {
    const r = await sendTestPush();
    if (r.ok) toast.success('Aviso de prueba enviado', { description: 'Debería llegarte en unos segundos.' });
    else toast.error('No llegó a salir', { description: 'Vuelve a activar los avisos en este teléfono.' });
  };

  // ── Instrucciones manuales según el navegador REAL de la persona ──────────
  const menuDelNavegador = () => {
    switch (plataforma.browser) {
      case 'samsung':
        return { icono: <Menu className="inline w-5 h-5 align-text-bottom" strokeWidth={3} />, donde: 'abajo a la derecha', opcion: 'Agregar página a' };
      case 'firefox':
        return { icono: <MoreVertical className="inline w-5 h-5 align-text-bottom" strokeWidth={3} />, donde: 'arriba a la derecha', opcion: 'Instalar' };
      case 'opera':
        return { icono: <MoreVertical className="inline w-5 h-5 align-text-bottom" strokeWidth={3} />, donde: 'abajo a la derecha', opcion: 'Agregar a…' };
      case 'edge':
        return { icono: <MoreVertical className="inline w-5 h-5 align-text-bottom" strokeWidth={3} />, donde: 'abajo al centro', opcion: 'Agregar a teléfono' };
      default:
        return { icono: <MoreVertical className="inline w-5 h-5 align-text-bottom" strokeWidth={3} />, donde: 'arriba a la derecha', opcion: 'Instalar aplicación' };
    }
  };

  const renderPaso1 = () => {
    if (instalada) {
      return (
        <p className="text-lg text-brand-ink">
          Ya la tienes instalada en este dispositivo. Ábrela siempre desde su ícono
          <strong> Stella Maris</strong>, no desde el navegador.
        </p>
      );
    }

    // Navegador dentro de otra app (WhatsApp, Instagram, Facebook…). Aquí instalar es
    // imposible: lo único que sirve es salir a un navegador de verdad.
    if (plataforma.inApp) {
      return (
        <>
          <div className="flex gap-3 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 rounded-2xl p-4">
            <AlertTriangle className="w-7 h-7 flex-shrink-0 text-amber-700 dark:text-amber-300" strokeWidth={2.5} />
            <p className="text-lg text-amber-950 dark:text-amber-100 leading-snug">
              Abriste el enlace <strong>dentro de otra aplicación</strong> (WhatsApp,
              Instagram, Facebook…). Desde ahí no se puede instalar. Ábrelo en {navegadorDestino}.
            </p>
          </div>
          {plataforma.os === 'android' && (
            <button
              onClick={abrirEnChrome}
              className="w-full bg-gradient-to-br from-brand to-brand-strong text-white py-4 px-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-brand-border shadow-lg active:scale-95 transition-all"
            >
              <Chrome className="w-6 h-6" strokeWidth={2.5} /> Abrir en Chrome
            </button>
          )}
          <ol className="space-y-3">
            <Instruccion n={1}>
              Si el botón no funciona, toca <MoreVertical className="inline w-5 h-5 align-text-bottom" strokeWidth={3} /> y
              elige <strong>«Abrir en {navegadorDestino}»</strong>.
            </Instruccion>
            <Instruccion n={2}>
              O copia el enlace y pégalo tú en {navegadorDestino}.
            </Instruccion>
          </ol>
          <button
            onClick={copiarEnlace}
            className="w-full bg-white dark:bg-slate-800 text-brand-ink py-3.5 px-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-brand/30 active:scale-95 transition-all"
          >
            <Copy className="w-5 h-5" strokeWidth={2.5} /> Copiar el enlace
          </button>
        </>
      );
    }

    // El camino bueno: el navegador ya ofrece instalar → un solo toque.
    if (promptDisponible) {
      return (
        <>
          <p className="text-lg text-brand-ink">
            Tu teléfono puede instalarla ahora mismo. Toca el botón y acepta.
          </p>
          <button
            onClick={instalar}
            disabled={instalando}
            className="w-full bg-gradient-to-br from-brand to-brand-strong text-white py-5 px-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 border-2 border-brand-border shadow-xl active:scale-95 transition-all disabled:opacity-60"
          >
            {instalando ? <Loader className="w-7 h-7 animate-spin" /> : <Plus className="w-7 h-7" strokeWidth={3} />}
            {instalando ? 'Un momento…' : 'Instalar la aplicación'}
          </button>
        </>
      );
    }

    // iPhone/iPad en Safari: Apple no permite el botón; el camino es Compartir.
    if (plataforma.os === 'ios' && sePuedeAquí) {
      return (
        <>
          <p className="text-lg text-brand-ink">
            En iPhone se instala desde el botón <strong>Compartir</strong> de Safari.
            Son tres toques:
          </p>
          <ol className="space-y-3">
            <Instruccion n={1}>
              Toca <Share className="inline w-5 h-5 align-text-bottom" strokeWidth={2.5} /> <strong>Compartir</strong>,
              abajo al centro de la pantalla.
            </Instruccion>
            <Instruccion n={2}>
              Desliza la lista hacia arriba y elige <strong>«Añadir a pantalla de inicio»</strong>.
            </Instruccion>
            <Instruccion n={3}>
              Toca <strong>«Añadir»</strong> arriba a la derecha. El ícono queda en tu pantalla.
            </Instruccion>
          </ol>
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4">
            <p className="text-base text-blue-900 dark:text-blue-100">
              Después <strong>ábrela desde el ícono</strong>. Es lo que habilita los avisos del paso 2.
            </p>
          </div>
        </>
      );
    }

    // iPhone en Chrome/Firefox/Edge: no pueden instalar. Hay que ir a Safari.
    if (plataforma.os === 'ios') {
      return (
        <>
          <div className="flex gap-3 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 rounded-2xl p-4">
            <AlertTriangle className="w-7 h-7 flex-shrink-0 text-amber-700 dark:text-amber-300" strokeWidth={2.5} />
            <p className="text-lg text-amber-950 dark:text-amber-100 leading-snug">
              En iPhone <strong>solo Safari</strong> puede instalar aplicaciones.
              {plataforma.browserName !== 'tu navegador' && <> Estás en {plataforma.browserName}.</>}
            </p>
          </div>
          <ol className="space-y-3">
            <Instruccion n={1}>Copia el enlace con el botón de abajo.</Instruccion>
            <Instruccion n={2}>Abre <strong>Safari</strong> y pégalo en la barra de direcciones.</Instruccion>
            <Instruccion n={3}>Vuelve a esta pantalla: te dará los pasos para instalar.</Instruccion>
          </ol>
          <button
            onClick={copiarEnlace}
            className="w-full bg-gradient-to-br from-brand to-brand-strong text-white py-4 px-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-brand-border shadow-lg active:scale-95 transition-all"
          >
            <Copy className="w-6 h-6" strokeWidth={2.5} /> Copiar el enlace
          </button>
        </>
      );
    }

    // Android (u escritorio) sin el botón todavía: instrucciones del navegador REAL.
    const m = menuDelNavegador();
    return (
      <>
        <p className="text-lg text-brand-ink">
          {plataforma.os === 'android'
            ? <>El botón directo aún no aparece. En <strong>{plataforma.browserName}</strong> se instala así:</>
            : <>En el computador se instala desde la barra de direcciones:</>}
        </p>
        <ol className="space-y-3">
          {plataforma.os === 'android' ? (
            <>
              <Instruccion n={1}>
                Toca {m.icono} <strong>el menú</strong>, {m.donde} de la pantalla.
              </Instruccion>
              <Instruccion n={2}>
                Busca <strong>«{m.opcion}»</strong>. Según el teléfono puede decir
                «Instalar app», «Agregar a pantalla de inicio» o «Añadir a inicio»:
                <strong> las tres sirven</strong>.
              </Instruccion>
              <Instruccion n={3}>Confirma. El ícono queda junto a tus otras apps.</Instruccion>
            </>
          ) : (
            <>
              <Instruccion n={1}>
                Mira el extremo derecho de la barra de direcciones: hay un ícono de instalar
                (una pantalla con una flecha).
              </Instruccion>
              <Instruccion n={2}>Tócalo y confirma <strong>«Instalar»</strong>.</Instruccion>
            </>
          )}
        </ol>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-white dark:bg-slate-800 text-brand-ink py-3.5 px-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-brand/30 active:scale-95 transition-all"
        >
          <RefreshCw className="w-5 h-5" strokeWidth={2.5} /> Recargar y probar el botón directo
        </button>
      </>
    );
  };

  const renderPaso2 = () => {
    if (avisosActivos) {
      return (
        <>
          <p className="text-lg text-brand-ink">
            Este dispositivo ya recibe los avisos de <strong>nuevo cantoral</strong> y de
            las <strong>celebraciones</strong> que se acercan.
          </p>
          <button
            onClick={probarAviso}
            className="w-full bg-white dark:bg-slate-800 text-brand-ink py-3.5 px-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-brand/30 active:scale-95 transition-all"
          >
            <Bell className="w-5 h-5" strokeWidth={2.5} /> Enviarme uno de prueba
          </button>
        </>
      );
    }

    if (iosVersionCorta) {
      return (
        <p className="text-lg text-brand-ink">
          Tu iPhone necesita <strong>iOS 16.4 o superior</strong> para recibir avisos.
          Actualízalo en Ajustes → General → Actualización de software, y vuelve aquí.
        </p>
      );
    }

    // El caso de iOS que dejó a todos a medio camino en el lanzamiento.
    if (iosFaltaInstalar) {
      return (
        <div className="flex gap-3 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 rounded-2xl p-4">
          <Smartphone className="w-7 h-7 flex-shrink-0 text-amber-700 dark:text-amber-300" strokeWidth={2.5} />
          <div className="space-y-2">
            <p className="text-lg text-amber-950 dark:text-amber-100 leading-snug">
              En iPhone los avisos <strong>solo funcionan con la app instalada</strong>, y
              hay que abrirla <strong>desde su ícono</strong>. Estando en Safari no se
              pueden activar, aunque el botón aparezca.
            </p>
            <p className="text-base text-amber-900 dark:text-amber-200">
              Haz el paso 1, cierra Safari, abre <strong>Stella Maris</strong> desde el
              ícono y vuelve a esta pantalla.
            </p>
          </div>
        </div>
      );
    }

    if (!pushSupported()) {
      return (
        <p className="text-lg text-brand-ink">
          Este navegador no admite avisos. Instala la app (paso 1) y ábrela desde su
          ícono: desde ahí sí llegan.
        </p>
      );
    }

    if (!loggedIn) {
      return (
        <>
          <p className="text-lg text-brand-ink">
            Para saber de qué parroquia avisarte, primero entra con tu cuenta.
          </p>
          {onLogin && (
            <button
              onClick={onLogin}
              className="w-full bg-gradient-to-br from-brand to-brand-strong text-white py-4 px-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-brand-border shadow-lg active:scale-95 transition-all"
            >
              <ExternalLink className="w-6 h-6" strokeWidth={2.5} /> Entrar a la app
            </button>
          )}
        </>
      );
    }

    if (permiso === 'denied') {
      return (
        <>
          <p className="text-lg text-brand-ink">
            Los avisos están <strong>bloqueados</strong> para Stella Maris en este dispositivo.
          </p>
          <ol className="space-y-3">
            {plataforma.os === 'ios' ? (
              <>
                <Instruccion n={1}>Abre <strong>Ajustes</strong> del iPhone.</Instruccion>
                <Instruccion n={2}>Entra en <strong>Notificaciones</strong> y busca <strong>Stella Maris</strong>.</Instruccion>
                <Instruccion n={3}>Activa <strong>«Permitir notificaciones»</strong> y vuelve aquí.</Instruccion>
              </>
            ) : (
              <>
                <Instruccion n={1}>
                  Toca el candado 🔒 de la barra de direcciones (o mantén pulsado el ícono
                  de la app → «Información»).
                </Instruccion>
                <Instruccion n={2}>Entra en <strong>Permisos</strong> → <strong>Notificaciones</strong>.</Instruccion>
                <Instruccion n={3}>Cámbialo a <strong>Permitir</strong> y recarga esta pantalla.</Instruccion>
              </>
            )}
          </ol>
        </>
      );
    }

    return (
      <>
        <p className="text-lg text-brand-ink">
          Recibe un aviso cuando tu parroquia publica un <strong>nuevo cantoral</strong> y
          cuando se acerca una <strong>celebración</strong>. Un toque y listo.
        </p>
        <button
          onClick={activarAvisos}
          disabled={activandoAvisos}
          className="w-full bg-gradient-to-br from-amber-500 to-orange-600 text-white py-5 px-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 border-2 border-orange-700 shadow-xl active:scale-95 transition-all disabled:opacity-60"
        >
          {activandoAvisos ? <Loader className="w-7 h-7 animate-spin" /> : <Bell className="w-7 h-7" strokeWidth={2.5} />}
          {activandoAvisos ? 'Un momento…' : 'Activar los avisos'}
        </button>
        <p className="text-base text-brand-ink-soft">
          El teléfono te va a preguntar si permites las notificaciones: responde
          <strong> Permitir</strong>.
        </p>
      </>
    );
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="max-w-xl mx-auto pt-6 pb-24 space-y-5">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-white/70 dark:bg-white/10 text-brand-ink px-4 py-3 rounded-2xl border-2 border-white/60 dark:border-white/20 font-bold active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} /> Volver
          </button>
        )}

        {/* Portada */}
        <div className="text-center">
          <img src={logoStellaMaris} alt="" className="w-24 h-24 mx-auto mb-3 rounded-2xl shadow-lg" />
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-ink leading-tight">
            Instala Stella Maris
          </h1>
          <p className="text-lg text-brand-ink-soft mt-2">
            Para tener el cantoral de tu parroquia en la pantalla de inicio, como
            cualquier otra aplicación.
          </p>
        </div>

        <Paso n={1} titulo="Poner la app en tu teléfono" listo={instalada}>
          {renderPaso1()}
        </Paso>

        <Paso n={2} titulo="Recibir los avisos" listo={avisosActivos}>
          {renderPaso2()}
        </Paso>

        {/* Ayuda para el que no lo logra solo */}
        <section className="bg-white/50 dark:bg-white/5 rounded-3xl border-2 border-white/60 dark:border-white/10 p-4 sm:p-5 space-y-3">
          <h3 className="text-xl font-bold text-brand-ink">¿No te resulta?</h3>
          <p className="text-base text-brand-ink-soft">
            Mándale el enlace a quien te pueda ayudar, o ábrelo en otro teléfono. La app
            es la misma para todos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={compartir}
              className="flex-1 bg-white dark:bg-slate-800 text-brand-ink py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-brand/30 active:scale-95 transition-all"
            >
              <Share className="w-5 h-5" strokeWidth={2.5} /> Compartir
            </button>
            <button
              onClick={copiarEnlace}
              className="flex-1 bg-white dark:bg-slate-800 text-brand-ink py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-brand/30 active:scale-95 transition-all"
            >
              <Copy className="w-5 h-5" strokeWidth={2.5} /> Copiar enlace
            </button>
          </div>
          <p className="text-sm text-brand-ink-soft break-all">{url}</p>
        </section>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Radio, BookOpen, Music, FileX, Check, PartyPopper } from 'lucide-react';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';
import { PublishedCantoral } from '../../types';
import { getCantoralById } from '../../services/cantorals';
import { PlaylistPlayer } from '../songs/PlaylistPlayer';
import { AtrilMode } from '../atril/AtrilMode';
import { CantoralPdfViewer } from '../cantoral/CantoralPdfViewer';
import { PrelaunchSurvey } from './PrelaunchSurvey';
import { PRELAUNCH, findPrelaunchCantoralId } from '../../services/survey';

type Mode = 'radio' | 'folleto' | 'atril';

const ORDER: Mode[] = ['radio', 'folleto', 'atril'];
const META: Record<Mode, { label: string; desc: string; icon: typeof Radio; color: string }> = {
  radio:   { label: 'Modo radio',  desc: 'Escucha los cantos (videos del canal)', icon: Radio,    color: 'from-rose-500 to-pink-600' },
  folleto: { label: 'Folleto PDF', desc: 'Sigue la letra en pantalla (e imprime)',   icon: BookOpen, color: 'from-purple-600 to-indigo-700' },
  atril:   { label: 'Modo atril',  desc: 'Lectura continua en pantalla',           icon: Music,    color: 'from-amber-500 to-orange-600' },
};

/**
 * Pantalla de MUESTRA pública (sin login ni perfil): acceso directo al cantoral del
 * pre-lanzamiento. El usuario recorre los 3 modos (al salir de uno se le ofrecen los
 * restantes); tras el 3.º se dispara la encuesta y luego la invitación al lanzamiento.
 */
export function PrelaunchDemo({ cantoralId }: { cantoralId?: string }) {
  const [cantoral, setCantoral] = useState<PublishedCantoral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [visited, setVisited] = useState<Mode[]>([]);
  const [active, setActive] = useState<Mode | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = cantoralId || (await findPrelaunchCantoralId());
        if (!id) { if (!cancelled) { setError('Aún no hay un cantoral publicado para la muestra.'); setLoading(false); } return; }
        const c = await getCantoralById(id);
        if (cancelled) return;
        if (!c) setError('No encontramos el cantoral de la muestra.');
        else if (c.status !== 'published') setError('El cantoral aún no está publicado.');
        else setCantoral(c);
        setLoading(false);
      } catch {
        if (!cancelled) { setError('Error al cargar. Revisa tu conexión.'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [cantoralId]);

  const remaining = ORDER.filter((m) => !visited.includes(m));

  const openMode = (m: Mode) => setActive(m);

  const exitMode = () => {
    const m = active;
    setActive(null);
    if (!m) return;
    setVisited((prev) => {
      const next = prev.includes(m) ? prev : [...prev, m];
      if (next.length >= ORDER.length) setShowSurvey(true);
      return next;
    });
  };

  // ── Estados de carga / error ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        <p className="text-base font-semibold text-brand-ink-soft">Cargando la muestra…</p>
      </div>
    );
  }
  if (error || !cantoral) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        <FileX className="w-16 h-16 text-red-500" />
        <p className="text-lg font-bold text-red-900 dark:text-red-100">{error ?? 'No disponible'}</p>
      </div>
    );
  }

  // ── Modo activo (pantalla completa) ──
  if (active === 'radio') return <PlaylistPlayer cantoral={cantoral} onBack={exitMode} />;
  if (active === 'atril') return <AtrilMode songs={cantoral.songs} userRole="Pueblo fiel" onClose={exitMode} />;
  if (active === 'folleto') return <CantoralPdfViewer cantoral={cantoral} onBack={exitMode} />;

  // ── Encuesta (tras recorrer los 3 modos) ──
  if (showSurvey) {
    return (
      <PrelaunchSurvey
        role="demo"
        parish={cantoral.parishName}
        onClose={() => { setShowSurvey(false); setFinished(true); }}
      />
    );
  }

  const massLabel = [cantoral.liturgicalDate, cantoral.parishName].filter(Boolean).join(' · ');

  // ── Pantalla final (invitación persistente) ──
  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        <div className="w-20 h-20 mb-4 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
          <PartyPopper className="w-11 h-11 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-2">¡Gracias por probar Stella Maris! 🎉</h1>
        <div className="max-w-sm w-full bg-gradient-to-br from-brand to-brand-strong text-white rounded-2xl p-6 border-4 border-brand-border shadow-xl my-4">
          <p className="text-sm uppercase tracking-wide text-blue-200 font-bold mb-1">Estás invitado/a</p>
          <p className="text-xl font-bold leading-tight mb-1">Lanzamiento oficial de la app</p>
          <p className="text-3xl font-extrabold">{PRELAUNCH.launchDate}</p>
        </div>
        <button
          onClick={() => { setVisited([]); setFinished(false); }}
          className="mt-2 text-brand font-bold underline"
        >
          Volver a explorar los modos
        </button>
      </div>
    );
  }

  // ── Selector de modos (landing y entre modos) ──
  return (
    <div className="min-h-screen p-5 sm:p-8 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="max-w-md mx-auto pt-10 pb-16">
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-gradient-to-br from-blue-400 via-yellow-400 to-blue-600 blur-2xl" />
            <div className="w-full h-full rounded-full overflow-hidden relative z-10 shadow-lg">
              <img
                src={logoStellaMaris}
                alt="Logo Stella Maris"
                className="w-full h-full object-cover"
                style={{ animation: 'gentle-float 4s ease-in-out infinite' }}
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-brand-ink leading-tight">Stella Maris</h1>
          <p className="text-brand-ink-soft mt-1">{massLabel || 'Cantoral de la Misa'}</p>
        </div>

        <div className="text-center mb-5">
          <p className="font-bold text-brand-ink">
            {visited.length === 0
              ? 'Elige cómo quieres ver los cantos'
              : remaining.length === 1
                ? '¡Te queda un modo por probar!'
                : '¡Bien! Ahora prueba otro modo'}
          </p>
          <p className="text-sm text-brand-ink-soft mt-1">Modo {visited.length + 1} de {ORDER.length}</p>
        </div>

        <div className="space-y-3">
          {remaining.map((m) => {
            const { label, desc, icon: Icon, color } = META[m];
            return (
              <button
                key={m}
                onClick={() => openMode(m)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-white bg-gradient-to-br ${color} shadow-lg active:scale-[0.98] transition-all border-2 border-black/10`}
              >
                <div className="w-12 h-12 flex-shrink-0 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-lg font-bold leading-tight">{label}</div>
                  <div className="text-sm text-white/90">{desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {visited.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {visited.map((m) => (
              <span key={m} className="inline-flex items-center gap-1 text-xs font-bold text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40 px-3 py-1.5 rounded-full">
                <Check className="w-4 h-4" strokeWidth={3} /> {META[m].label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

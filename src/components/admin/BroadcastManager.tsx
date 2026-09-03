import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Megaphone, Send, Loader, Users, Church, AlertTriangle, History, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  getResumenAudiencia, enviarAviso, listarAvisos, describirAudiencia,
  type ResumenAudiencia, type AvisoEnviado, type Audiencia,
} from '../../services/broadcasts';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface Props {
  onBack: () => void;
  /** Quién manda, para dejarlo anotado en el registro. */
  enviadoPor?: string;
}

/** Adónde lleva el aviso al tocarlo. Solo rutas internas. */
const DESTINOS: { valor: string; etiqueta: string }[] = [
  { valor: '/', etiqueta: 'La pantalla principal' },
  { valor: '/instalar', etiqueta: 'Cómo instalar la app' },
  { valor: '/?goto=cursos', etiqueta: 'Camino de formación (Cursos)' },
];

const TOPE_TITULO = 60;
const TOPE_TEXTO = 160;

/**
 * Avisos y promociones a los suscriptores.
 *
 * Nace de que se están sumando usuarios de diócesis cuyas parroquias todavía no están
 * cargadas: hace falta poder hablarles.
 *
 * La pantalla está construida alrededor de una idea: **un push no se puede retirar**.
 * Por eso, antes de enviar se dice a cuántos teléfonos va a sonar, se ve el aviso tal
 * como se verá, hay que confirmar, y todo lo enviado queda listado — que es lo único
 * que permite darse cuenta de que se está avisando demasiado.
 */
export function BroadcastManager({ onBack, enviadoPor }: Props) {
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [destino, setDestino] = useState('/');
  const [dioceses, setDioceses] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  const [resumen, setResumen] = useState<ResumenAudiencia | null>(null);
  const [errorResumen, setErrorResumen] = useState<string | null>(null);
  const [historial, setHistorial] = useState<AvisoEnviado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [r, h] = await Promise.all([getResumenAudiencia(), listarAvisos()]);
    if ('error' in r) { setErrorResumen(r.error); setResumen(null); }
    else { setResumen(r); setErrorResumen(null); }
    setHistorial(h);
    setCargando(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const audiencia: Audiencia = {
    ...(dioceses.length ? { dioceses } : {}),
    ...(roles.length ? { roles } : {}),
  };

  /**
   * A cuántos teléfonos va a sonar. Se calcula aquí con el desglose que devolvió el
   * servidor; es una estimación honesta (un dispositivo de dos diócesis se cuenta una
   * vez por diócesis), y el número exacto lo devuelve el envío.
   */
  const alcance = (() => {
    if (!resumen) return null;
    if (!dioceses.length && !roles.length) return resumen.total;
    if (dioceses.length && !roles.length) {
      return dioceses.reduce((n, d) => n + (resumen.porDiocesis[d] ?? 0), 0);
    }
    if (roles.length && !dioceses.length) {
      return roles.reduce((n, r) => n + (resumen.porRol[r] ?? 0), 0);
    }
    return null; // dos filtros a la vez: el número exacto lo dirá el envío
  })();

  const puedeEnviar = titulo.trim().length > 0 && texto.trim().length > 0 && !enviando;

  const alternar = (lista: string[], set: (v: string[]) => void, valor: string) =>
    set(lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]);

  const enviar = async () => {
    setConfirmando(false);
    setEnviando(true);
    try {
      const r = await enviarAviso({
        title: titulo.trim(), body: texto.trim(), url: destino, audience: audiencia, sentBy: enviadoPor,
      });
      if (!r.ok) { toast.error('No se pudo enviar', { description: r.error }); return; }
      if (r.aviso) { toast.info(r.aviso); return; }
      toast.success(`Aviso enviado a ${r.sent} de ${r.subs} dispositivos`);
      setTitulo(''); setTexto('');
      await cargar();
    } finally {
      setEnviando(false);
    }
  };

  const chip = (activo: boolean) =>
    `px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
      activo
        ? 'bg-gradient-to-br from-brand to-brand-strong text-white border-brand-border'
        : 'bg-white/70 dark:bg-white/10 text-brand-ink border-brand/30'
    }`;

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 bg-white/70 dark:bg-white/10 text-brand-ink px-4 py-3 rounded-2xl border-2 border-white/60 dark:border-white/20 font-bold active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} /> Volver
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-4 border-orange-700">
            <Megaphone className="w-11 h-11 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-brand-ink mb-2">Avisos y promociones</h1>
          <p className="text-lg text-brand-ink-soft">Un mensaje a los teléfonos de la comunidad</p>
        </div>

        {/* Redactar */}
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl border-2 border-white/60 dark:border-white/20 shadow-xl p-5 mb-6 space-y-4">
          <div>
            <label htmlFor="aviso-titulo" className="text-sm font-bold text-brand-ink-soft mb-1 block">
              Título <span className="font-normal">({titulo.length}/{TOPE_TITULO})</span>
            </label>
            <input
              id="aviso-titulo"
              value={titulo}
              maxLength={TOPE_TITULO}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ya puedes sumar tu parroquia"
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 text-brand-ink border-2 border-brand/30 focus:border-brand outline-none font-bold"
            />
          </div>
          <div>
            <label htmlFor="aviso-texto" className="text-sm font-bold text-brand-ink-soft mb-1 block">
              Texto <span className="font-normal">({texto.length}/{TOPE_TEXTO})</span>
            </label>
            <textarea
              id="aviso-texto"
              value={texto}
              maxLength={TOPE_TEXTO}
              rows={3}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escríbenos y cargamos las parroquias de tu diócesis."
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 text-brand-ink border-2 border-brand/30 focus:border-brand outline-none resize-y"
            />
            {/* El teléfono recorta lo que no cabe: mejor saberlo antes de mandarlo. */}
            <p className="text-xs text-brand-ink-soft mt-1">
              En el teléfono se ven unas dos líneas; lo demás queda cortado.
            </p>
          </div>
          <div>
            <label htmlFor="aviso-destino" className="text-sm font-bold text-brand-ink-soft mb-1 block">Al tocarlo, abre</label>
            <select
              id="aviso-destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 text-brand-ink border-2 border-brand/30 focus:border-brand outline-none font-bold"
            >
              {DESTINOS.map((d) => <option key={d.valor} value={d.valor}>{d.etiqueta}</option>)}
            </select>
          </div>

          {/* Cómo se va a ver, con el mismo aspecto que en el teléfono */}
          {(titulo || texto) && (
            <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-3">
              <p className="text-xs font-bold text-brand-ink-soft mb-2">Así se verá</p>
              <div className="flex gap-3 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-gradient-to-br from-brand to-brand-strong flex items-center justify-center text-white text-sm font-bold">SM</div>
                <div className="min-w-0">
                  <p className="font-bold text-brand-ink text-sm leading-tight line-clamp-1">{titulo || 'Título del aviso'}</p>
                  <p className="text-sm text-brand-ink-soft leading-snug line-clamp-2">{texto || 'Texto del aviso'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* A quién */}
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl border-2 border-white/60 dark:border-white/20 shadow-xl p-5 mb-6">
          <h2 className="text-xl font-bold text-brand-ink mb-3 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand" strokeWidth={2.5} /> A quién
          </h2>

          {cargando ? (
            <div className="flex items-center gap-2 text-brand-ink-soft"><Loader className="w-5 h-5 animate-spin" /> Contando…</div>
          ) : errorResumen ? (
            <p className="text-base text-red-700 dark:text-red-300">{errorResumen}</p>
          ) : resumen && (
            <>
              <p className="text-base text-brand-ink-soft mb-3">
                Hay <strong>{resumen.total}</strong> dispositivo{resumen.total === 1 ? '' : 's'} con
                los avisos activados. Sin filtros, les llega a todos.
              </p>

              <p className="text-sm font-bold text-brand-ink-soft mb-2 flex items-center gap-1">
                <Church className="w-4 h-4" /> Diócesis
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(resumen.porDiocesis)
                  .sort((a, b) => b[1] - a[1])
                  .map(([d, n]) => (
                    <button key={d} onClick={() => alternar(dioceses, setDioceses, d)} className={chip(dioceses.includes(d))}>
                      {d} · {n}
                    </button>
                  ))}
              </div>

              <p className="text-sm font-bold text-brand-ink-soft mb-2">Rol</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(resumen.porRol)
                  .sort((a, b) => b[1] - a[1])
                  .map(([r, n]) => (
                    <button key={r} onClick={() => alternar(roles, setRoles, r)} className={chip(roles.includes(r))}>
                      {r} · {n}
                    </button>
                  ))}
              </div>

              {(dioceses.length > 0 || roles.length > 0) && (
                <button
                  onClick={() => { setDioceses([]); setRoles([]); }}
                  className="mt-3 text-sm font-bold text-brand underline underline-offset-4"
                >
                  Quitar los filtros
                </button>
              )}
            </>
          )}
        </div>

        {/* Enviar */}
        <div className="bg-amber-100/80 dark:bg-amber-900/30 rounded-3xl border-2 border-amber-400 p-5 mb-8">
          <div className="flex gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-700 dark:text-amber-300" strokeWidth={2.5} />
            <p className="text-base text-amber-950 dark:text-amber-100 leading-snug">
              Un aviso <strong>no se puede retirar</strong>. Y cada uno que no hacía falta
              enseña a la gente a apagar las notificaciones — con lo que después no le
              llegan los cantorales.
            </p>
          </div>
          <button
            onClick={() => setConfirmando(true)}
            disabled={!puedeEnviar}
            className="w-full bg-gradient-to-br from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-orange-700 shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {enviando ? <Loader className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" strokeWidth={2.5} />}
            {enviando ? 'Enviando…' : alcance !== null ? `Enviar a ${alcance} dispositivo${alcance === 1 ? '' : 's'}` : 'Enviar aviso'}
          </button>
        </div>

        {/* Lo que ya se mandó */}
        <h2 className="text-xl font-bold text-brand-ink mb-3 flex items-center gap-2">
          <History className="w-6 h-6 text-brand" strokeWidth={2.5} /> Enviados
        </h2>
        {historial.length === 0 ? (
          <p className="text-base text-brand-ink-soft">
            Todavía no se ha enviado ninguno. (Si acabas de enviar uno y no aparece, falta
            aplicar la migración <code>20260903_push_avisos.sql</code>: el aviso salió igual,
            lo que no se guardó es el registro.)
          </p>
        ) : (
          <div className="space-y-3">
            {historial.map((a) => (
              <div key={a.id} className="bg-white/60 dark:bg-white/10 rounded-2xl border-2 border-white/60 dark:border-white/20 p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-brand-ink truncate">{a.title}</p>
                    <p className="text-sm text-brand-ink-soft line-clamp-2">{a.body}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-ink-soft flex-shrink-0 flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                    {a.sent}/{a.subsTotal}
                  </span>
                </div>
                <p className="text-xs text-brand-ink-soft mt-2">
                  {new Date(a.sentAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                  {' · '}{describirAudiencia(a.audience)}
                  {a.failed > 0 && <span className="text-amber-700 dark:text-amber-300"> · {a.failed} sin entregar</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmando}
        title="¿Enviar el aviso?"
        message={`«${titulo}» llegará ${alcance !== null ? `a ${alcance} dispositivo${alcance === 1 ? '' : 's'}` : 'a los destinatarios del filtro'}. No se puede retirar.`}
        confirmLabel="Sí, enviar"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={enviar}
        onCancel={() => setConfirmando(false)}
      />
    </div>
  );
}

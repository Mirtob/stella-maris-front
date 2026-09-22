import { useEffect, useMemo, useState } from 'react';
import { Ticket, Calendar, Church, Trash2, Plus, Loader, Inbox, XCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ParishPicker } from '../profile/ParishPicker';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatActiveParishLabel, buildChapelParish, splitActiveParish } from '../../utils/parish';
import { formatYmdForDisplay, getTodayLocal, addDaysLocal } from '../../utils/dateLocal';
import { getLiturgicalDateForDate } from '../../utils/liturgicalCalendar';
import { MASS_TYPE_LABEL } from '../../utils/massType';
import type { MassType } from '../../types';
import {
  parroquiasMadre, meInvitaron, inviteYo, estaVigente, estadoInvitacion,
  type ChoirInvitation,
} from '../../utils/choirInvitations';
import { listChapels, type Chapel } from '../../services/chapels';
import {
  listInvitacionesRecibidas, listInvitacionesEnviadas, invitarCoro,
  retirarInvitacion, responderInvitacion, avisarInvitacion, avisarRechazo,
} from '../../services/choirInvitations';

interface ChoirInvitationsProps {
  /** Parroquias del perfil. */
  parishes: string[];
  /** Parroquia (o capilla) activa: la casa desde la que se invita. */
  activeParish: string;
  /**
   * Aceptar lleva derecho a armar el cantoral de esa Misa. La pantalla no sabe navegar:
   * avisa con la fecha Y con la parroquia anfitriona, y App abre el constructor en las
   * dos —igual que hace el calendario litúrgico con la fecha—. El lugar viaja junto con
   * la fecha porque es la otra mitad de "para dónde va este cantoral".
   */
  onBuildCantoral?: (date: string, hostParish: string) => void;
}

/**
 * Coros invitados.
 *
 * En la fiesta patronal se invita al coro de otra parroquia: el coro de Pirque canta en
 * Valdivia de Paine. Esta pantalla tiene las dos caras, porque cualquier coro es las
 * dos cosas según el domingo:
 *
 *  · ANFITRIÓN — invita, y con eso habilita al coro invitado a publicar el cantoral de
 *    esa Misa en su parroquia o capilla. Solo ese día. Puede retirar la invitación.
 *  · INVITADO  — ve dónde le toca cantar, puede rechazarla si no puede ir, y al armar
 *    el cantoral de ese día le aparece la anfitriona entre las opciones para publicar.
 *
 * Nadie se auto-invita, nadie retira lo que no invitó y nadie rechaza lo que no le
 * ofrecieron: eso lo hace cumplir la RLS (migración 20260910_coros_invitados), no esta
 * pantalla, que solo evita ofrecer botones que el servidor va a rechazar.
 */
export function ChoirInvitations({ parishes, activeParish, onBuildCantoral }: ChoirInvitationsProps) {
  const propias = useMemo(
    () => (parishes.length > 0 ? parishes : (activeParish ? [activeParish] : [])),
    [parishes, activeParish],
  );
  const hoy = getTodayLocal();

  const [recibidas, setRecibidas] = useState<ChoirInvitation[]>([]);
  const [enviadas, setEnviadas] = useState<ChoirInvitation[]>([]);
  const [capillas, setCapillas] = useState<Chapel[]>([]);
  const [cargando, setCargando] = useState(true);

  // Formulario de invitación (lado anfitrión).
  const [abierto, setAbierto] = useState(false);
  const [anfitriona, setAnfitriona] = useState(() => activeParish || propias[0] || '');
  const [invitada, setInvitada] = useState('');
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState<MassType>('dia');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [porRetirar, setPorRetirar] = useState<ChoirInvitation | null>(null);
  // Rechazo: se pide el motivo antes de mandarlo. La anfitriona necesita saber por qué
  // para decidir si busca otro coro.
  const [rechazando, setRechazando] = useState<ChoirInvitation | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [respondiendo, setRespondiendo] = useState(false);

  /**
   * Dónde puede invitar este coro: sus parroquias Y las capillas de esas parroquias.
   * Una capilla invita por su cuenta — su fiesta patronal es suya, no la de la
   * parroquia madre.
   */
  const anfitrionasPosibles = useMemo(() => {
    const madres = parroquiasMadre(propias);
    const deCapillas = capillas
      .filter(ch => madres.includes(ch.parishFull))
      .map(ch => buildChapelParish(ch.parishFull, ch.name));
    return Array.from(new Set([...propias, ...madres, ...deCapillas]));
  }, [propias, capillas]);

  const recargar = () => {
    if (propias.length === 0) { setCargando(false); return; }
    setCargando(true);
    Promise.all([
      listInvitacionesRecibidas(propias, hoy),
      listInvitacionesEnviadas(propias, hoy),
    ]).then(([r, e]) => {
      setRecibidas(r);
      setEnviadas(e);
      setCargando(false);
    });
  };

  useEffect(recargar, [propias.join('|')]);
  useEffect(() => { listChapels().then(setCapillas); }, []);

  const puedeGuardar = !!anfitriona && !!invitada && !!fecha && !guardando;
  // La celebración de esa fecha, para que se vea que el sábado por la tarde se invita
  // al DOMINGO: «Domingo 11 de octubre · 28.º Domingo del Tiempo Ordinario».
  const celebracion = fecha ? getLiturgicalDateForDate(fecha) : '';

  const fechaLarga = (d: string) =>
    formatYmdForDisplay(d, { weekday: 'long', day: 'numeric', month: 'long' });

  /** El día en que se canta de verdad: I Vísperas es la tarde anterior. */
  const seCanta = (i: { date: string; massType: MassType }) =>
    i.massType === 'visperas_i' ? addDaysLocal(i.date, -1) : i.date;

  const cuando = (i: { date: string; massType: MassType }) => {
    const base = `${fechaLarga(i.date)}`;
    if (i.massType === 'dia') return base;
    return `${base} · ${MASS_TYPE_LABEL[i.massType]} (se canta el ${fechaLarga(seCanta(i))} por la tarde)`;
  };

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    const r = await invitarCoro({
      hostParish: anfitriona, guestParish: invitada, date: fecha, massType: tipo, note: motivo,
    });
    setGuardando(false);
    if (!r.ok) {
      toast.error('No se pudo invitar al coro', { description: r.error });
      return;
    }
    toast.success('Coro invitado', {
      description: `${formatActiveParishLabel(invitada)} podrá publicar el cantoral de ese día.`,
    });
    setAbierto(false);
    setInvitada(''); setFecha(''); setMotivo(''); setTipo('dia');
    setEnviadas(prev => [...prev, r.invitation!].sort((a, b) => a.date.localeCompare(b.date)));
    // Que les suene el teléfono: sin esto la invitación se queda esperando a que a
    // alguien se le ocurra entrar a mirar. En segundo plano y sin bloquear.
    void avisarInvitacion(r.invitation!.id);
  };

  const retirar = async (inv: ChoirInvitation) => {
    const r = await retirarInvitacion(inv.id);
    if (!r.ok) {
      toast.error('No se pudo retirar la invitación', { description: r.error });
      return;
    }
    toast.success('Invitación retirada');
    setEnviadas(prev => prev.filter(i => i.id !== inv.id));
  };

  /** Aceptar: queda constancia y se va derecho a armar el cantoral de esa fecha. */
  const aceptar = async (inv: ChoirInvitation) => {
    setRespondiendo(true);
    const r = await responderInvitacion(inv.id, true);
    setRespondiendo(false);
    if (!r.ok) {
      toast.error('No se pudo aceptar la invitación', { description: r.error });
      return;
    }
    setRecibidas(prev => prev.map(i => (
      i.id === inv.id ? { ...i, acceptedAt: new Date().toISOString(), rejectedAt: undefined, rejectedReason: undefined } : i
    )));
    toast.success('Invitación aceptada', {
      description: `A armar el cantoral del ${fechaLarga(inv.date)} para ${formatActiveParishLabel(inv.hostParish)}.`,
    });
    onBuildCantoral?.(inv.date, inv.hostParish);
  };

  /** Rechazar: con el motivo, que es lo que le sirve a la anfitriona. */
  const rechazar = async () => {
    const inv = rechazando;
    if (!inv) return;
    setRespondiendo(true);
    const r = await responderInvitacion(inv.id, false, motivoRechazo);
    setRespondiendo(false);
    if (!r.ok) {
      toast.error('No se pudo rechazar la invitación', { description: r.error });
      return;
    }
    setRecibidas(prev => prev.map(i => (
      i.id === inv.id
        ? { ...i, rejectedAt: new Date().toISOString(), rejectedReason: motivoRechazo.trim() || undefined, acceptedAt: undefined }
        : i
    )));
    setRechazando(null);
    setMotivoRechazo('');
    toast.success('Invitación rechazada', {
      description: `${formatActiveParishLabel(inv.hostParish)} verá que su coro no puede ir.`,
    });
    // El motivo vuelve a quien invitó, para que busque otro coro a tiempo.
    void avisarRechazo(inv.id);
  };

  const etiquetaTipo = (i: ChoirInvitation) =>
    i.massType === 'dia' ? null : MASS_TYPE_LABEL[i.massType];

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-4 border-amber-400">
              <Ticket className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">Coros invitados</h1>
          <p className="text-base text-amber-800 dark:text-amber-200">
            Para las fiestas patronales: invita al coro de otra parroquia o capilla y podrá
            publicar el cantoral de esa Misa aquí.
          </p>
        </div>

        {/* ── Recibidas: dónde nos toca cantar ─────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-brand-ink mb-3 flex items-center gap-2">
            <Inbox className="w-5 h-5" strokeWidth={2.5} /> Nos invitaron a cantar
          </h2>
          {cargando ? (
            <div className="flex items-center gap-2 text-brand-ink-soft p-4">
              <Loader className="w-5 h-5 animate-spin" /> Cargando…
            </div>
          ) : recibidas.length === 0 ? (
            <EmptyState
              compact
              Icon={Inbox}
              title="Todavía no los invitan a ninguna parroquia"
              description="Cuando otra parroquia o capilla los invite a su fiesta patronal, aparecerá aquí."
            />
          ) : (
            <div className="space-y-3">
              {recibidas.map(inv => (
                <div
                  key={inv.id}
                  className={`rounded-2xl p-4 border-2 shadow ${
                    estaVigente(inv)
                      ? 'bg-white/70 dark:bg-white/10 border-amber-300 dark:border-amber-700'
                      : 'bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/15 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-brand-ink break-words">
                        {formatActiveParishLabel(inv.hostParish)}
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mt-1 first-letter:uppercase">
                        {cuando(inv)}
                      </p>
                      {inv.note && <p className="text-sm text-brand-ink-soft mt-1">{inv.note}</p>}
                    </div>
                    {etiquetaTipo(inv) && (
                      <span className="flex-shrink-0 bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        {etiquetaTipo(inv)}
                      </span>
                    )}
                  </div>

                  {estadoInvitacion(inv) === 'rechazada' ? (
                    <>
                      <p className="mt-2 text-sm font-bold text-red-700 dark:text-red-300">
                        La rechazaron — ya no pueden publicar el cantoral de ese día.
                      </p>
                      {inv.rejectedReason && (
                        <p className="text-sm text-brand-ink-soft mt-1">Motivo: {inv.rejectedReason}</p>
                      )}
                    </>
                  ) : estadoInvitacion(inv) === 'aceptada' ? (
                    <>
                      <p className="mt-2 text-sm font-bold text-green-700 dark:text-green-300">
                        Aceptada — van a cantar. Cualquiera del coro puede armar y publicar
                        el cantoral de esa Misa.
                      </p>
                      {onBuildCantoral && (
                        <button
                          onClick={() => onBuildCantoral(inv.date, inv.hostParish)}
                          className="mt-3 w-full bg-gradient-to-br from-green-600 to-green-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold border-2 border-green-800"
                        >
                          <Calendar className="w-4 h-4" strokeWidth={2.5} />
                          Armar el cantoral de ese día
                        </button>
                      )}
                    </>
                  ) : rechazando?.id === inv.id ? (
                    /* Formulario del motivo: corto, porque la anfitriona solo necesita
                       saber si tiene que buscar otro coro. */
                    <div className="mt-3 bg-white/80 dark:bg-white/10 rounded-xl p-3 border-2 border-red-300 dark:border-red-700">
                      <label className="block text-sm font-bold text-brand-ink mb-1">
                        ¿Por qué no pueden ir?
                      </label>
                      <textarea
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        rows={2}
                        maxLength={500}
                        autoFocus
                        placeholder="Ej: ese día tenemos Misa a la misma hora"
                        className="w-full px-3 py-2 text-base rounded-lg border-2 border-red-200 dark:border-white/20 bg-white dark:bg-white/10 text-brand-ink focus:outline-none focus:border-red-500 placeholder:text-gray-500"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => { setRechazando(null); setMotivoRechazo(''); }}
                          className="flex-1 bg-white/70 dark:bg-white/10 text-brand-ink py-2 px-3 rounded-lg text-sm font-bold border-2 border-white/60 dark:border-white/20"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={rechazar}
                          disabled={respondiendo}
                          className="flex-1 bg-gradient-to-br from-red-600 to-red-700 text-white py-2 px-3 rounded-lg text-sm font-bold border-2 border-red-800 active:scale-95 transition-all disabled:opacity-60"
                        >
                          {respondiendo ? 'Enviando…' : 'Rechazar'}
                        </button>
                      </div>
                      <p className="text-xs text-brand-ink-soft mt-2">
                        El motivo lo verá {formatActiveParishLabel(inv.hostParish)}.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-brand-ink-soft mt-2">
                        Hasta que alguien del coro acepte no se puede publicar el cantoral de
                        esa Misa. Con que acepte uno, basta para todo el coro.
                      </p>
                      {meInvitaron(inv, propias) && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => aceptar(inv)}
                            disabled={respondiendo}
                            className="flex-1 bg-gradient-to-br from-green-600 to-green-700 text-white py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold border-2 border-green-800 disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                            Aceptar
                          </button>
                          <button
                            onClick={() => { setRechazando(inv); setMotivoRechazo(''); }}
                            disabled={respondiendo}
                            className="flex-1 bg-white/70 dark:bg-white/10 text-red-700 dark:text-red-300 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold border-2 border-red-300 dark:border-red-700 disabled:opacity-60"
                          >
                            <XCircle className="w-4 h-4" strokeWidth={2.5} />
                            Rechazar
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Enviadas: a quién invitamos ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-brand-ink flex items-center gap-2">
              <Church className="w-5 h-5" strokeWidth={2.5} /> Invitamos a cantar aquí
            </h2>
            <button
              onClick={() => setAbierto(o => !o)}
              className="flex-shrink-0 bg-gradient-to-br from-amber-600 to-orange-700 text-white py-2 px-3 rounded-xl flex items-center gap-2 active:scale-95 transition-all text-sm font-bold border-2 border-amber-800 shadow"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Invitar un coro
            </button>
          </div>

          {abierto && (
            <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-4 border-2 border-amber-300 dark:border-amber-700 mb-4 space-y-4">
              {/* Dónde cantan: parroquia o capilla propia. */}
              {anfitrionasPosibles.length > 1 && (
                <div>
                  <label className="block text-sm font-bold text-brand-ink mb-1">Cantarán en</label>
                  <select
                    value={anfitriona}
                    onChange={(e) => setAnfitriona(e.target.value)}
                    className="w-full px-3 py-3 text-base rounded-lg border-2 border-amber-300 dark:border-white/20 bg-white/80 dark:bg-white/10 text-brand-ink font-bold focus:outline-none focus:border-amber-600"
                  >
                    {anfitrionasPosibles.map(p => (
                      <option key={p} value={p}>{formatActiveParishLabel(p)}</option>
                    ))}
                  </select>
                  <p className="text-xs text-brand-ink-soft mt-1">
                    Una capilla invita por su cuenta: la fiesta es suya.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-ink mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" /> Fecha de la celebración
                </label>
                <input
                  type="date"
                  value={fecha}
                  min={hoy}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-3 text-base rounded-lg border-2 border-amber-300 dark:border-white/20 bg-white/80 dark:bg-white/10 text-brand-ink font-bold focus:outline-none focus:border-amber-600"
                />
                {celebracion && (
                  <p className="text-xs text-purple-800 dark:text-purple-300 mt-1">{celebracion}</p>
                )}
              </div>

              {/* Tipo de Misa: un sábado por la tarde se invita al DOMINGO con I Vísperas. */}
              <div>
                <label className="block text-sm font-bold text-brand-ink mb-1">🕯️ Tipo de Misa</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['visperas_i', 'dia', 'visperas_ii'] as MassType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`px-2 py-2 rounded-lg text-xs font-bold border-2 transition-all active:scale-95 leading-tight ${
                        tipo === t
                          ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white border-amber-800'
                          : 'bg-white/70 dark:bg-white/10 text-brand-ink border-amber-200 dark:border-white/20'
                      }`}
                    >
                      {MASS_TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
                {fecha && (
                  <p className="mt-1.5 text-xs text-purple-800 dark:text-purple-300 first-letter:uppercase">
                    Se canta el <strong>{fechaLarga(seCanta({ date: fecha, massType: tipo }))}</strong>
                    {tipo === 'visperas_i' ? ' por la tarde (I Vísperas)' : tipo === 'visperas_ii' ? ' por la tarde (II Vísperas)' : ''}.
                  </p>
                )}
                <p className="text-xs text-brand-ink-soft mt-1">
                  La invitación vale solo esa celebración. Un sábado por la tarde se invita al
                  domingo con I Vísperas.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-ink mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Fiesta patronal de San Francisco"
                  className="w-full px-3 py-3 text-base rounded-lg border-2 border-amber-300 dark:border-white/20 bg-white/80 dark:bg-white/10 text-brand-ink focus:outline-none focus:border-amber-600 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-ink mb-2">
                  ¿Qué coro viene? {invitada && <span className="text-amber-800 dark:text-amber-300">· {formatActiveParishLabel(invitada)}</span>}
                </label>
                <div className="max-h-64 overflow-y-auto rounded-lg">
                  <ParishPicker
                    selected={invitada ? [invitada] : []}
                    onChange={(next) => setInvitada(next[next.length - 1] ?? '')}
                    alreadyAdded={[splitActiveParish(anfitriona).parishFull, anfitriona]}
                  />
                </div>
                <p className="text-xs text-brand-ink-soft mt-1">
                  Puede ser una parroquia o una capilla.
                </p>
              </div>

              <button
                onClick={guardar}
                disabled={!puedeGuardar}
                className={`w-full py-3 px-4 rounded-xl font-bold text-base border-2 transition-all ${
                  puedeGuardar
                    ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white border-amber-800 active:scale-95 shadow'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-400 cursor-not-allowed'
                }`}
              >
                {guardando ? 'Invitando…' : 'Invitar a este coro'}
              </button>
            </div>
          )}

          {cargando ? null : enviadas.length === 0 ? (
            <EmptyState
              compact
              Icon={Ticket}
              title="No han invitado a ningún coro"
              description="Para la fiesta patronal, invita al coro de otra parroquia y podrá publicar el cantoral de esa Misa."
            />
          ) : (
            <div className="space-y-3">
              {enviadas.map(inv => (
                <div key={inv.id} className="bg-white/70 dark:bg-white/10 rounded-2xl p-4 border-2 border-white/60 dark:border-white/20 shadow flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-brand-ink break-words">
                      {formatActiveParishLabel(inv.guestParish)}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1 first-letter:uppercase">
                      {cuando(inv)}
                    </p>
                    {inv.note && <p className="text-sm text-brand-ink-soft mt-1">{inv.note}</p>}
                    <p className="text-xs text-brand-ink-soft mt-2 break-words">
                      Cantan en {formatActiveParishLabel(inv.hostParish)}
                    </p>
                    {estadoInvitacion(inv) === 'rechazada' && (
                      <>
                        <p className="mt-2 text-sm font-bold text-red-700 dark:text-red-300">
                          Ese coro rechazó la invitación: no puede ir.
                        </p>
                        {inv.rejectedReason && (
                          <p className="text-sm text-brand-ink-soft mt-1">Motivo: {inv.rejectedReason}</p>
                        )}
                      </>
                    )}
                    {estadoInvitacion(inv) === 'aceptada' && (
                      <p className="mt-2 text-sm font-bold text-green-700 dark:text-green-300">
                        Aceptada: ese coro confirmó que va.
                      </p>
                    )}
                    {estadoInvitacion(inv) === 'pendiente' && (
                      <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
                        Sin responder todavía.
                      </p>
                    )}
                  </div>
                  {inviteYo(inv, propias) && (
                    <button
                      onClick={() => setPorRetirar(inv)}
                      aria-label={`Retirar la invitación a ${formatActiveParishLabel(inv.guestParish)}`}
                      className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center active:scale-95 transition-all"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <ConfirmDialog
          open={!!porRetirar}
          title="¿Retirar la invitación?"
          message={porRetirar
            ? `${formatActiveParishLabel(porRetirar.guestParish)} dejará de poder publicar el cantoral del ${fechaLarga(porRetirar.date)}. Si ya lo publicó, el cantoral no se borra: hay que borrarlo desde los cantorales de la parroquia.`
            : ''}
          confirmLabel="Sí, retirar"
          cancelLabel="Cancelar"
          variant="warning"
          onConfirm={() => { const i = porRetirar; setPorRetirar(null); if (i) retirar(i); }}
          onCancel={() => setPorRetirar(null)}
        />

      </div>
    </div>
  );
}

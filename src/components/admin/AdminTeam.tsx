import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ShieldCheck, Music, UserPlus, Trash2, Loader, Search, AlertTriangle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { listAdmins, addSongAdmin, removeAdmin, AdminRow } from '../../services/adminTeam';
import { listUserProfiles, updateUserRole } from '../../services/userProfiles';
import { UserProfile } from '../../types';
import { isPrincipalAdminEmail } from '../../config/admin';
import { matchesSearch } from '../../utils/textSearch';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface AdminTeamProps {
  onBack: () => void;
}

const norm = (e?: string | null) => (e ?? '').trim().toLowerCase();

/**
 * Equipo de administración: dar de alta y quitar ayudantes del catálogo, sin SQL.
 *
 * Dar de alta a alguien eran DOS pasos en dos sitios distintos: un INSERT a mano en el
 * SQL Editor de Supabase (tabla `admins`) y, aparte, ponerle rol Admin en Gestión de
 * Usuarios. Hacer uno y olvidar el otro deja a la persona a medio camino, y de una
 * forma que además confunde: con el rol puesto pero sin la fila, entra y no ve el
 * panel; con la fila pero sin el rol, tampoco. Aquí van juntos, en un botón.
 *
 * Quién puede usar esta pantalla lo decide la base, no este archivo: escribir en
 * `admins` exige `is_admin()`, que desde 20260901 significa administrador principal.
 * Si alguien llegara aquí sin serlo, la base rechaza el cambio y la pantalla lo dice.
 */
export function AdminTeam({ onBack }: AdminTeamProps) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [perfiles, setPerfiles] = useState<UserProfile[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [porQuitar, setPorQuitar] = useState<AdminRow | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [a, p] = await Promise.all([listAdmins(), listUserProfiles()]);
    setAdmins(a);
    setPerfiles(p);
    setCargando(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const perfilDe = (email: string) => perfiles.find((p) => norm(p.email) === norm(email));

  /**
   * Alta completa: la fila en `admins` y el rol Admin del perfil, en ese orden.
   *
   * Si la persona todavía no ha entrado nunca a la app, su perfil no existe y no hay
   * rol que poner: la fila queda igual, y el rol se le pone solo la primera vez que
   * entre… no, no se pone solo. Por eso la lista de abajo marca ese caso como
   * "pendiente" y deja el botón para completarlo cuando la persona ya haya entrado.
   */
  const darDeAlta = async (email: string) => {
    const limpio = norm(email);
    if (!limpio) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
      toast.error('Ese correo no parece válido');
      return;
    }
    if (isPrincipalAdminEmail(limpio)) {
      toast.error('Ese es el administrador principal', { description: 'Su acceso no se gestiona desde aquí.' });
      return;
    }
    setTrabajando(limpio);
    try {
      const r = await addSongAdmin(limpio);
      if (!r.ok) {
        toast.error('No se pudo dar de alta', { description: r.error });
        return;
      }
      const perfil = perfilDe(limpio);
      if (perfil && perfil.role !== 'Admin') {
        const rr = await updateUserRole(perfil.id, 'Admin');
        if (!rr.ok) {
          toast.warning('Quedó a medias', {
            description: 'Se le dio el acceso, pero no se pudo cambiar su rol a Admin. Hazlo en Gestión de Usuarios.',
          });
          await cargar();
          return;
        }
      }
      toast.success('Ayudante dado de alta', {
        description: perfil
          ? `${perfil.name || limpio} ya puede entrar a Gestión de Cantos.`
          : 'Aún no tiene cuenta. Cuando entre por primera vez, vuelve aquí y completa el alta.',
      });
      setBusqueda('');
      await cargar();
    } finally {
      setTrabajando(null);
    }
  };

  /** Completa el alta de quien ya tenía la fila pero aún no el rol Admin. */
  const completarRol = async (email: string) => {
    const perfil = perfilDe(email);
    if (!perfil) return;
    setTrabajando(norm(email));
    try {
      const r = await updateUserRole(perfil.id, 'Admin');
      if (r.ok) {
        toast.success('Listo', { description: `${perfil.name || email} ya puede entrar al panel.` });
        await cargar();
      } else {
        toast.error('No se pudo cambiar el rol', { description: r.error });
      }
    } finally {
      setTrabajando(null);
    }
  };

  /** Quitar el acceso: la fila y, si lo tenía, el rol Admin del perfil. */
  const quitar = async (fila: AdminRow) => {
    setPorQuitar(null);
    setTrabajando(fila.email);
    try {
      const r = await removeAdmin(fila.email);
      if (!r.ok) {
        toast.error('No se pudo quitar el acceso', { description: r.error });
        return;
      }
      // Sin la fila, la app ya lo trata como Coro en su próxima entrada. Se le baja
      // también el rol guardado para que Gestión de Usuarios no siga diciendo "Admin".
      const perfil = perfilDe(fila.email);
      if (perfil && perfil.role === 'Admin') await updateUserRole(perfil.id, 'Coro');
      toast.success('Acceso retirado', { description: `${fila.email} ya no administra el catálogo.` });
      await cargar();
    } finally {
      setTrabajando(null);
    }
  };

  const yaEsAdmin = (email: string) => admins.some((a) => norm(a.email) === norm(email));

  // Candidatos: usuarios registrados que todavía no administran nada.
  const candidatos = perfiles
    .filter((p) => !yaEsAdmin(p.email) && !isPrincipalAdminEmail(p.email))
    .filter((p) => busqueda.trim().length >= 2
      && (matchesSearch(p.name ?? '', busqueda) || matchesSearch(p.email ?? '', busqueda)))
    .slice(0, 6);

  const correoEscrito = busqueda.trim().toLowerCase();
  const pareceCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoEscrito);
  const correoSuelto = pareceCorreo && !perfiles.some((p) => norm(p.email) === correoEscrito) && !yaEsAdmin(correoEscrito);

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
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-brand to-brand-strong rounded-full flex items-center justify-center shadow-lg border-4 border-brand-border">
            <ShieldCheck className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-brand-ink mb-2">Equipo de administración</h1>
          <p className="text-lg text-brand-ink-soft">
            Quién administra y con qué alcance
          </p>
        </div>

        {/* Alta */}
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-3xl border-2 border-white/60 dark:border-white/20 shadow-xl p-5 mb-6">
          <h2 className="text-xl font-bold text-brand-ink mb-1 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-brand" strokeWidth={2.5} /> Dar de alta un ayudante
          </h2>
          <p className="text-base text-brand-ink-soft mb-4">
            Podrá <strong>subir y transcribir cantos</strong>. No verá usuarios, parroquias
            ni el resto del panel, y no puede borrar del catálogo.
          </p>

          <div className="relative mb-3">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink-soft" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca por nombre o escribe el correo"
              aria-label="Buscar a quién dar de alta"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 text-brand-ink border-2 border-brand/30 focus:border-brand outline-none text-base"
            />
          </div>

          {candidatos.map((p) => (
            <button
              key={p.id}
              onClick={() => darDeAlta(p.email)}
              disabled={trabajando !== null}
              className="w-full mb-2 flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl p-3 border-2 border-brand/20 hover:border-brand active:scale-98 transition-all disabled:opacity-60"
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-brand/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-brand" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-bold text-brand-ink truncate">{p.name || p.email}</p>
                <p className="text-sm text-brand-ink-soft truncate">{p.email}</p>
              </div>
              {trabajando === norm(p.email)
                ? <Loader className="w-5 h-5 animate-spin text-brand flex-shrink-0" />
                : <UserPlus className="w-5 h-5 text-brand flex-shrink-0" strokeWidth={2.5} />}
            </button>
          ))}

          {correoSuelto && (
            <button
              onClick={() => darDeAlta(correoEscrito)}
              disabled={trabajando !== null}
              className="w-full bg-gradient-to-br from-brand to-brand-strong text-white rounded-2xl p-4 font-bold border-2 border-brand-border active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {trabajando === correoEscrito ? <Loader className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" strokeWidth={2.5} />}
              Dar de alta a {correoEscrito}
            </button>
          )}

          {busqueda.trim().length >= 2 && candidatos.length === 0 && !correoSuelto && (
            <p className="text-base text-brand-ink-soft px-1">
              Sin resultados. Si todavía no tiene cuenta, escribe su correo completo para
              dejarlo autorizado desde ya.
            </p>
          )}
        </div>

        {/* Lista */}
        <h2 className="text-xl font-bold text-brand-ink mb-3">Quiénes administran</h2>

        {cargando ? (
          <div className="flex items-center gap-3 text-brand-ink-soft p-4">
            <Loader className="w-5 h-5 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map((a) => {
              const perfil = perfilDe(a.email);
              const esPrincipal = a.role === 'principal';
              const faltaRol = !esPrincipal && perfil && perfil.role !== 'Admin';
              const sinCuenta = !perfil;
              return (
                <div
                  key={a.id}
                  className={`rounded-2xl p-4 border-2 shadow-lg ${
                    esPrincipal
                      ? 'bg-gradient-to-br from-brand to-brand-strong border-brand-border text-white'
                      : 'bg-white/70 dark:bg-white/10 border-white/60 dark:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 flex-shrink-0 rounded-2xl flex items-center justify-center ${
                      esPrincipal ? 'bg-white/20 border-2 border-white/30' : 'bg-brand/10'
                    }`}>
                      {esPrincipal
                        ? <Crown className="w-6 h-6 text-white" strokeWidth={2.5} />
                        : <Music className="w-6 h-6 text-brand" strokeWidth={2.5} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold truncate ${esPrincipal ? 'text-white' : 'text-brand-ink'}`}>
                        {perfil?.name || a.email}
                      </p>
                      {/* Sin cuenta todavía no hay nombre: repetir el correo debajo de
                          sí mismo solo hace ruido. */}
                      {perfil?.name && (
                        <p className={`text-sm truncate ${esPrincipal ? 'text-blue-100' : 'text-brand-ink-soft'}`}>
                          {a.email}
                        </p>
                      )}
                      <p className={`text-sm font-bold mt-0.5 ${esPrincipal ? 'text-blue-100' : 'text-brand-ink-soft'}`}>
                        {esPrincipal ? 'Acceso total' : 'Solo Gestión de Cantos'}
                      </p>
                    </div>
                    {!esPrincipal && (
                      <button
                        onClick={() => setPorQuitar(a)}
                        disabled={trabajando !== null}
                        aria-label={`Quitar el acceso a ${a.email}`}
                        className="w-10 h-10 flex-shrink-0 bg-red-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-60"
                      >
                        {trabajando === norm(a.email)
                          ? <Loader className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" strokeWidth={2.5} />}
                      </button>
                    )}
                  </div>

                  {/* Alta a medias: tiene el acceso pero no puede llegar al panel. */}
                  {sinCuenta && !esPrincipal && (
                    <div className="mt-3 flex gap-2 items-start bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 rounded-xl p-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-700 dark:text-amber-300" strokeWidth={2.5} />
                      <p className="text-sm text-amber-950 dark:text-amber-100">
                        Todavía no ha entrado a la app. Cuando cree su cuenta con este
                        correo, vuelve aquí y termina el alta.
                      </p>
                    </div>
                  )}
                  {faltaRol && (
                    <div className="mt-3 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 rounded-xl p-3">
                      <p className="text-sm text-amber-950 dark:text-amber-100 mb-2">
                        Tiene el acceso, pero su perfil sigue como <strong>{perfil?.role}</strong>:
                        sin el rol Admin no le aparece el panel.
                      </p>
                      <button
                        onClick={() => completarRol(a.email)}
                        disabled={trabajando !== null}
                        className="text-sm font-bold text-amber-900 dark:text-amber-200 underline underline-offset-4 active:scale-95 disabled:opacity-60"
                      >
                        Completar el alta
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-sm text-brand-ink-soft mt-6 leading-relaxed">
          El acceso total no se da desde aquí a propósito: es de un solo correo. Si
          alguna vez hiciera falta cambiarlo, está documentado al final de la migración
          <code className="mx-1 px-1 rounded bg-white/60 dark:bg-white/10">20260901_admin_solo_cantos.sql</code>.
        </p>
      </div>

      <ConfirmDialog
        open={porQuitar !== null}
        title="¿Quitar el acceso?"
        message={`${porQuitar?.email} dejará de administrar el catálogo y su perfil vuelve a Coro. Los cantos que haya subido se quedan.`}
        confirmLabel="Sí, quitar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => porQuitar && quitar(porQuitar)}
        onCancel={() => setPorQuitar(null)}
      />
    </div>
  );
}

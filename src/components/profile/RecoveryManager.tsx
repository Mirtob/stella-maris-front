import { useState } from 'react';
import { ArrowLeft, Search, ShieldCheck, Mail, Loader, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile, UserRole } from '../../types';
import { findProfilesForRecovery, deleteUserProfile } from '../../services/userProfiles';
import { ConfirmDialog } from '../common/ConfirmDialog';

type ProfileRow = UserProfile & { createdAt?: string; lastSeenAt?: string };

interface Props {
  onBack: () => void;
}

/**
 * RecoveryManager — flujo admin para gestionar recoveries de cuenta.
 *
 * Caso de uso típico:
 *   1. Un coro pierde acceso a su cuenta Google (cambió de email, hackeo,
 *      dejó la parroquia y otra persona toma su rol).
 *   2. El admin verifica identidad fuera de banda (WhatsApp con el párroco).
 *   3. Busca el perfil original acá (por email principal O recovery_email).
 *   4. Decide: borrar el perfil viejo (el usuario hará setup fresh con su
 *      cuenta nueva) o mantenerlo activo.
 *
 * Esta UI NO transfiere ownership automáticamente — los cantorales publicados
 * tienen FK a auth.users.id que no puede cambiar desde acá. Para casos de
 * "recuperar cantorales viejos a una cuenta nueva" se hace manualmente con SQL
 * (ver docs/RECOVERY-PROCEDURE.md).
 */
export function RecoveryManager({ onBack }: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ProfileRow[] | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteUser = pendingDeleteId
    ? results?.find((u) => u.id === pendingDeleteId)
    : null;

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      toast.info('Escribe al menos 3 caracteres para buscar');
      return;
    }
    setSearching(true);
    const data = await findProfilesForRecovery(trimmed);
    setResults(data);
    setSearching(false);
    if (data.length === 0) {
      toast.info('No se encontraron perfiles con ese email');
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    const r = await deleteUserProfile(id);
    if (!r.ok) {
      toast.error('No se pudo eliminar el perfil', { description: r.error });
      return;
    }
    setResults((prev) => (prev ? prev.filter((u) => u.id !== id) : prev));
    toast.success('Perfil eliminado. El usuario podrá rehacer setup en su próximo login.');
  };

  const roleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin':       return 'bg-red-100 text-red-700 border-red-300';
      case 'Coro':        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Pueblo fiel': return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-xl text-brand-ink active:opacity-70"
          aria-label="Volver al panel de administración"
        >
          <ArrowLeft className="w-7 h-7" strokeWidth={2.5} />
          <span className="font-bold">Volver</span>
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-1">
            Recuperación de cuentas
          </h1>
          <p className="text-base sm:text-lg text-brand-ink-soft">
            Buscar perfiles por email principal o email de respaldo
          </p>
        </div>

        {/* Procedimiento */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 mb-4">
          <div className="flex gap-3">
            <FileText className="w-6 h-6 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 dark:text-amber-100 space-y-1">
              <p className="font-bold">Antes de tocar nada:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs sm:text-sm">
                <li>Verifica la identidad del usuario fuera de banda (WhatsApp con el párroco).</li>
                <li>Confirma que el email que te dio coincide con su email principal o recovery_email.</li>
                <li>Solo entonces decide si borras el perfil viejo o transfieres cantorales.</li>
              </ol>
              <p className="text-xs italic mt-2">
                Doc completo: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">docs/RECOVERY-PROCEDURE.md</code>
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 mb-4 border-2 border-green-200 dark:border-green-700">
          <label className="text-base text-gray-700 dark:text-gray-200 mb-2 block font-bold" htmlFor="recovery-search">
            Email del usuario
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="recovery-search"
                type="email"
                inputMode="email"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="email@ejemplo.com"
                disabled={searching}
                className="w-full pl-11 pr-3 py-3 text-base border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-green-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || query.trim().length < 3}
              className="px-4 sm:px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
              aria-label="Buscar"
            >
              {searching ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>

        {/* Results */}
        {results !== null && results.length === 0 && !searching && (
          <div className="text-center py-8 bg-white/60 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="text-5xl mb-2">🔍</div>
            <p className="text-base text-gray-700 dark:text-gray-300 font-bold">Sin resultados</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Prueba con el email principal o el email de respaldo del usuario.
            </p>
          </div>
        )}

        {results && results.length > 0 && (
          <div className="space-y-3">
            {results.map((user) => {
              const matchedByRecovery =
                user.recoveryEmail &&
                user.recoveryEmail.toLowerCase().includes(query.trim().toLowerCase()) &&
                !user.email.toLowerCase().includes(query.trim().toLowerCase());

              return (
                <div
                  key={user.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border-2 border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white truncate">
                        {user.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        <Mail className="w-4 h-4 inline mr-1" />
                        {user.email}
                      </p>
                      {user.recoveryEmail && (
                        <p className={`text-sm truncate mt-1 ${matchedByRecovery ? 'text-green-700 dark:text-green-300 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                          <ShieldCheck className="w-4 h-4 inline mr-1" />
                          Respaldo: {user.recoveryEmail}
                          {matchedByRecovery && <CheckCircle2 className="w-4 h-4 inline ml-1" />}
                        </p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 flex-shrink-0 ${roleBadge(user.role)}`}>
                      <span className="text-xs sm:text-sm font-bold">{user.role}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 mb-3">
                    {user.parishName && <p>⛪ {user.parishName}</p>}
                    {user.parishes && user.parishes.length > 1 && (
                      <p>📍 {user.parishes.length} parroquias</p>
                    )}
                    <p>🆔 <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">{user.id.slice(0, 8)}…</code></p>
                  </div>

                  <button
                    onClick={() => setPendingDeleteId(user.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-bold text-sm active:scale-95 transition-all"
                  >
                    Eliminar perfil viejo
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDeleteUser}
        title="Eliminar perfil para recovery"
        message={`¿Eliminar el perfil de ${pendingDeleteUser?.name ?? pendingDeleteUser?.email}? Esto borra SOLO la fila en user_profiles; la cuenta de Google no se borra. Los cantorales publicados quedarán sin perfil asociado hasta que el usuario haga setup nuevo o los reasignes con SQL.`}
        details={`${pendingDeleteUser?.email}  ·  ver docs/RECOVERY-PROCEDURE.md`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

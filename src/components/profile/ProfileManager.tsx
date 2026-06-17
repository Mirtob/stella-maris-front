import { Users, Search, Trash2, Shield, Music, UserCircle, RefreshCw, Loader } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { UserRole, UserProfile } from '../../types';
import { listUserProfiles, updateUserRole, deleteUserProfile } from '../../services/userProfiles';
import { matchesSearch } from '../../utils/textSearch';
import { ConfirmDialog } from '../common/ConfirmDialog';

type ProfileRow = UserProfile & { createdAt?: string; lastSeenAt?: string };

/**
 * Admin ProfileManager — conectado a la tabla `user_profiles` de Supabase.
 * Lista los usuarios reales que se han logueado (sus perfiles se persisten en
 * cada login mediante upsertCurrentUserProfile en App.tsx).
 *
 * Acciones del admin:
 *  · Cambiar el rol de un usuario
 *  · Eliminar el row de perfil (no borra auth.users)
 */
export function ProfileManager() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'Todos'>('Todos');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteUser = pendingDeleteId ? users.find(u => u.id === pendingDeleteId) : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listUserProfiles();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredUsers = users.filter(user => {
    const matchesText =
      matchesSearch(user.name, searchTerm) ||
      matchesSearch(user.email, searchTerm);
    const matchesRole = filterRole === 'Todos' || user.role === filterRole;
    return matchesText && matchesRole;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Admin':       return <Shield className="w-4 h-4" />;
      case 'Coro':        return <Music className="w-4 h-4" />;
      case 'Pueblo fiel': return <UserCircle className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin':       return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700';
      case 'Coro':        return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700';
      case 'Pueblo fiel': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700';
    }
  };

  const handleRoleChange = async (user: ProfileRow, newRole: UserRole) => {
    if (user.role === newRole) return;
    // Optimistic
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    const r = await updateUserRole(user.id, newRole);
    if (!r.ok) {
      toast.error('No se pudo cambiar el rol', { description: r.error });
      load();
    } else {
      toast.success(`Rol actualizado: ${newRole}`);
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setUsers(prev => prev.filter(u => u.id !== id));
    const r = await deleteUserProfile(id);
    if (!r.ok) {
      toast.error('No se pudo eliminar el perfil', { description: r.error });
      load();
    } else {
      toast.success('Perfil eliminado');
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg">
              <Users className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-white mb-1">Gestión de Usuarios</h1>
          <p className="text-base sm:text-lg text-purple-700 dark:text-purple-200">
            {loading ? 'Cargando…' : `${users.length} usuarios registrados`}
          </p>
        </div>

        {/* Refresh */}
        <button
          onClick={load}
          disabled={loading}
          className="w-full mb-4 py-2 bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-700 rounded-xl text-purple-700 dark:text-purple-200 font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refrescar desde Supabase
        </button>

        {/* Search */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar usuarios"
              className="w-full pl-12 pr-4 py-3 text-base border-2 border-purple-200 dark:border-purple-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Role Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['Todos', 'Admin', 'Coro', 'Pueblo fiel'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  filterRole === role
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-slate-700'
                }`}
              >
                {role}
                {role !== 'Todos' && (
                  <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                    {users.filter(u => u.role === role).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white/60 dark:bg-white/5 rounded-2xl p-5 animate-pulse h-32" />
            ))}
          </div>
        )}

        {/* Users List */}
        {!loading && (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-5 border-2 border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white truncate">{user.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{user.email}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 flex-shrink-0 ${getRoleBadgeColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span className="text-xs sm:text-sm font-bold">{user.role}</span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-1.5 mb-3 text-sm">
                  {user.parishName && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <span>⛪</span>
                      <span className="truncate" title={user.parishName}>{user.parishName}</span>
                    </div>
                  )}
                  {user.instrument && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <span>
                        {user.instrument === 'Guitarra' && '🎶'}
                        {user.instrument === 'Órgano' && '🎹'}
                      </span>
                      <span>{user.instrument}</span>
                    </div>
                  )}
                </div>

                {/* Role selector + delete */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 flex-shrink-0">Cambiar rol:</label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                      aria-label={`Cambiar rol de ${user.name}`}
                      className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-purple-400"
                    >
                      <option value="Pueblo fiel">Pueblo fiel</option>
                      <option value="Coro">Coro</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setPendingDeleteId(user.id)}
                    aria-label={`Eliminar perfil de ${user.name}`}
                    className="w-full bg-red-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-bold">Eliminar perfil</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-base text-gray-600 dark:text-gray-300">
                  {users.length === 0
                    ? 'Sin usuarios registrados aún. Los perfiles aparecen acá cuando alguien inicia sesión.'
                    : 'No se encontraron usuarios con esos filtros.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDeleteUser}
        title="Eliminar perfil"
        message={`¿Eliminar el perfil de ${pendingDeleteUser?.name ?? pendingDeleteUser?.email}? Solo borra su fila en user_profiles, no su cuenta de Google.`}
        details={pendingDeleteUser?.email}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

import { Users, Search, Trash2, Shield, Music, UserCircle, RefreshCw, Loader, UserPlus, Pencil, X, Copy, Check, RotateCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { UserRole, UserProfile, InstrumentType } from '../../types';
import { listUserProfiles, updateUserRole, deleteUserProfile, adminUpdateUserProfile } from '../../services/userProfiles';
import { createUserAccount } from '../../services/adminUsers';
import { getSupabaseClient, isUsernameAccount } from '../../services/supabaseClient';
import { matchesSearch } from '../../utils/textSearch';
import { isPrincipalAdminEmail } from '../../config/admin';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ParishPicker } from './ParishPicker';
import { idsDuplicados } from '../../utils/profileMerge';

type ProfileRow = UserProfile & { createdAt?: string; lastSeenAt?: string };

// Clave legible (sin caracteres ambiguos) para entregar al usuario.
function generatePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  const arr = new Uint32Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

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
  // Solo el administrador principal puede cambiar roles. Detectamos su email
  // desde la sesión actual; el resto de los Admin ven el rol en modo lectura.
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const isPrincipal = isPrincipalAdminEmail(currentEmail);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'Todos'>('Todos');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteUser = pendingDeleteId ? users.find(u => u.id === pendingDeleteId) : null;

  // Crear cuenta usuario/clave
  const [showCreate, setShowCreate] = useState(false);
  const [cUser, setCUser] = useState('');
  const [cName, setCName] = useState('');
  const [cPass, setCPass] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Editar perfil
  const [editUser, setEditUser] = useState<ProfileRow | null>(null);
  const [eName, setEName] = useState('');
  const [eInstrument, setEInstrument] = useState<InstrumentType | ''>('');
  const [eParishes, setEParishes] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

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

  useEffect(() => {
    getSupabaseClient().auth.getSession().then(({ data }) => {
      setCurrentEmail(data.session?.user?.email ?? null);
    }).catch(() => setCurrentEmail(null));
  }, []);

  // Fichas que parecen de la misma persona (se marcan en la tarjeta).
  const duplicados = idsDuplicados(users);

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
    if (!isPrincipal) { toast.error('Solo el administrador principal puede cambiar roles'); return; }
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

  const handleCreate = async () => {
    const u = cUser.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(u)) { toast.error('Usuario inválido (3-30: letras, números, . _ -)'); return; }
    if (cPass.length < 6) { toast.error('La clave debe tener al menos 6 caracteres'); return; }
    setCreating(true);
    const r = await createUserAccount(u, cPass, cName.trim() || undefined);
    setCreating(false);
    if (!r.ok) { toast.error('No se pudo crear', { description: r.error }); return; }
    setCreatedCreds({ username: u, password: cPass });
    setCUser(''); setCName(''); setCPass('');
    if ((r as { warning?: string }).warning) {
      toast.warning('Cuenta creada', { description: (r as { warning?: string }).warning });
    } else {
      toast.success('Cuenta creada');
    }
    // El perfil ya quedó pre-armado server-side → recargar para que aparezca en la lista.
    load();
  };

  const openEdit = (user: ProfileRow) => {
    setEditUser(user);
    setEName(user.name || '');
    setEInstrument((user.instrument as InstrumentType) || '');
    setEParishes(user.parishes && user.parishes.length ? user.parishes : (user.parishName ? [user.parishName] : []));
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setSavingEdit(true);
    const fields: { name?: string; instruments?: string[]; parishes?: string[]; parishName?: string } = {
      name: eName.trim() || editUser.email,
      parishes: eParishes,
      parishName: eParishes[0],
    };
    if (editUser.role === 'Coro') fields.instruments = eInstrument ? [eInstrument] : [];
    const r = await adminUpdateUserProfile(editUser.id, fields);
    setSavingEdit(false);
    if (!r.ok) { toast.error('No se pudo guardar', { description: r.error }); return; }
    // Reflejar en la lista sin recargar todo.
    setUsers(prev => prev.map(x => x.id === editUser.id ? {
      ...x, name: fields.name!, parishes: eParishes, parishName: eParishes[0],
      instrument: editUser.role === 'Coro' ? (eInstrument || undefined) : x.instrument,
    } : x));
    setEditUser(null);
    toast.success('Perfil actualizado');
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
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
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
            {loading
              ? 'Cargando…'
              : (() => {
                  const up = users.filter(u => isUsernameAccount(u.email)).length;
                  const google = users.length - up;
                  return `${users.length} usuarios · 📧 ${google} Google · 👤 ${up} usuario/clave`;
                })()}
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

        {/* Crear cuenta usuario/clave */}
        <button
          onClick={() => { setShowCreate(true); setCreatedCreds(null); }}
          className="w-full mb-4 py-3 bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow"
        >
          <UserPlus className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
          Crear cuenta (usuario y clave)
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
                    {(() => {
                      const isUP = isUsernameAccount(user.email);
                      return (
                        <>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {isUP ? `Usuario: ${user.email.split('@')[0]}` : user.email}
                          </p>
                          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            isUP
                              ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                          }`}>
                            {isUP ? '👤 Usuario/clave' : '📧 Google'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 ${getRoleBadgeColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="text-xs sm:text-sm font-bold">{user.role}</span>
                    </div>
                    {duplicados.has(user.id) && (
                      <span
                        title="Hay otra ficha con el mismo nombre o correo de recuperación. Revisa si es la misma persona registrada dos veces."
                        className="px-2 py-0.5 rounded-full text-[11px] font-bold border bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                      >
                        ⚠️ Posible duplicado
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-1.5 mb-3 text-sm">
                  {/* TODAS las parroquias del usuario, no solo la principal: un mismo
                      fiel puede estar en dos, y mostrando una sola parecía que el
                      registro se había perdido. */}
                  {(() => {
                    const parroquias = Array.from(new Set([
                      ...(user.parishes ?? []),
                      user.parishName,
                    ].filter((p): p is string => !!p)));
                    if (parroquias.length === 0) return null;
                    return (
                      <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="flex-shrink-0">⛪</span>
                        <div className="min-w-0 flex flex-col gap-0.5">
                          {parroquias.map(p => (
                            <span key={p} className="truncate" title={p}>{p}</span>
                          ))}
                          {parroquias.length > 1 && (
                            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                              En {parroquias.length} parroquias
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
                  {isPrincipal ? (
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
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-bold flex-shrink-0">Rol:</span>
                      <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold">{user.role}</span>
                      <span className="italic">· solo el administrador principal puede cambiarlo</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(user)}
                      aria-label={`Editar perfil de ${user.name}`}
                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      <Pencil className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-bold">Editar</span>
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(user.id)}
                      aria-label={`Eliminar perfil de ${user.name}`}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-bold">Eliminar</span>
                    </button>
                  </div>
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

      {/* Modal: crear cuenta usuario/clave */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border-4 border-brand-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-brand to-brand-strong text-white p-5 flex items-center justify-between border-b-4 border-brand-border">
              <div className="flex items-center gap-3 min-w-0"><UserPlus className="w-7 h-7 flex-shrink-0" strokeWidth={2.5} /><h2 className="text-xl font-bold min-w-0">Crear cuenta</h2></div>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/20 rounded-xl flex-shrink-0"><X className="w-6 h-6" strokeWidth={2.5} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                El usuario entra con estas credenciales y elige su rol (Coro o Pueblo fiel) en su primer ingreso. Aparece en la lista apenas se crea; puedes cambiar su rol cuando quieras (por ejemplo a Admin, para que suba cantos).
              </p>
              <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Usuario</label>
              <input value={cUser} onChange={(e) => setCUser(e.target.value)} autoCapitalize="none" placeholder="ej: coro.sanjose" className="w-full px-4 py-3 mb-3 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium" />
              <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Nombre (opcional)</label>
              <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Nombre para mostrar" className="w-full px-4 py-3 mb-3 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium" />
              <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Clave</label>
              <div className="flex gap-2 mb-4">
                <input value={cPass} onChange={(e) => setCPass(e.target.value)} placeholder="Clave" className="w-full px-4 py-3 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium" />
                <button type="button" onClick={() => setCPass(generatePassword())} title="Generar clave" className="flex-shrink-0 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-blue-950"><RotateCw className="w-5 h-5" strokeWidth={2.5} /></button>
              </div>
              <button onClick={handleCreate} disabled={creating || !cUser || !cPass} className="w-full bg-gradient-to-br from-blue-700 to-blue-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 disabled:opacity-50">
                {creating ? <Loader className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
                {creating ? 'Creando...' : 'Crear cuenta'}
              </button>
              {createdCreds && (
                <div className="mt-4 bg-green-50 border-2 border-green-300 rounded-xl p-4">
                  <p className="text-sm font-bold text-green-900 mb-2">✅ Entrega estas credenciales:</p>
                  <div className="font-mono text-base text-gray-900"><div>Usuario: <strong>{createdCreds.username}</strong></div><div>Clave: <strong>{createdCreds.password}</strong></div></div>
                  <button onClick={() => { navigator.clipboard?.writeText(`Usuario: ${createdCreds.username}\nClave: ${createdCreds.password}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="mt-3 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: editar perfil */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border-4 border-brand-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-brand to-brand-strong text-white p-5 flex items-center justify-between border-b-4 border-brand-border">
              <div className="flex items-center gap-3 min-w-0"><Pencil className="w-6 h-6 flex-shrink-0" strokeWidth={2.5} /><h2 className="text-xl font-bold min-w-0 truncate">Editar perfil</h2></div>
              <button onClick={() => setEditUser(null)} className="p-2 hover:bg-white/20 rounded-xl flex-shrink-0"><X className="w-6 h-6" strokeWidth={2.5} /></button>
            </div>
            <div className="p-6">
              <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Nombre</label>
              <input value={eName} onChange={(e) => setEName(e.target.value)} className="w-full px-4 py-3 mb-3 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium" />

              {editUser.role === 'Coro' && (
                <>
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Instrumento</label>
                  <select value={eInstrument} onChange={(e) => setEInstrument(e.target.value as InstrumentType | '')} className="w-full px-4 py-3 mb-3 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium">
                    <option value="">Sin instrumento</option>
                    <option value="Guitarra">Guitarra</option>
                    <option value="Órgano">Órgano</option>
                  </select>
                </>
              )}

              {editUser.role !== 'Admin' && (
                <>
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Parroquias</label>
                  <div className="mb-4"><ParishPicker selected={eParishes} onChange={setEParishes} /></div>
                </>
              )}

              <button onClick={handleEditSave} disabled={savingEdit} className="w-full bg-gradient-to-br from-blue-700 to-blue-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 disabled:opacity-50">
                {savingEdit ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

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

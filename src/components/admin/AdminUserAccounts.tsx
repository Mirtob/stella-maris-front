import { useState } from 'react';
import { ArrowLeft, UserPlus, KeyRound, Loader, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { createUserAccount, resetUserPassword } from '../../services/adminUsers';

interface AdminUserAccountsProps {
  onBack: () => void;
}

// Genera una clave legible (sin caracteres ambiguos) para entregar al usuario.
function generatePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'; // sin l,o,0,1
  let out = '';
  const arr = new Uint32Array(8);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 8; i++) out += chars[arr[i] % chars.length];
  return out;
}

export function AdminUserAccounts({ onBack }: AdminUserAccountsProps) {
  // Crear cuenta
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Restablecer clave
  const [resetUser, setResetUser] = useState('');
  const [resetPass, setResetPass] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState<{ username: string; password: string } | null>(null);

  const handleCreate = async () => {
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(u)) {
      toast.error('Usuario inválido (3-30: letras, números, . _ -)');
      return;
    }
    if (password.length < 6) {
      toast.error('La clave debe tener al menos 6 caracteres');
      return;
    }
    setCreating(true);
    const r = await createUserAccount(u, password, name.trim() || undefined);
    setCreating(false);
    if (!r.ok) {
      toast.error('No se pudo crear', { description: r.error });
      return;
    }
    setCreated({ username: u, password });
    setUsername('');
    setName('');
    setPassword('');
    toast.success('Cuenta creada');
  };

  const handleReset = async () => {
    const u = resetUser.trim().toLowerCase();
    if (!u) { toast.error('Escribe el usuario'); return; }
    if (resetPass.length < 6) { toast.error('La clave debe tener al menos 6 caracteres'); return; }
    setResetting(true);
    const r = await resetUserPassword(u, resetPass);
    setResetting(false);
    if (!r.ok) {
      toast.error('No se pudo restablecer', { description: r.error });
      return;
    }
    setResetDone({ username: u, password: resetPass });
    setResetUser('');
    setResetPass('');
    toast.success('Clave restablecida');
  };

  const copyCredentials = (c: { username: string; password: string }) => {
    navigator.clipboard?.writeText(`Usuario: ${c.username}\nClave: ${c.password}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium';

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-6">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 bg-gradient-to-br from-brand to-brand-strong text-white px-4 py-3 rounded-2xl border-2 border-brand-border font-bold active:scale-95 transition-all"
        >
          <ArrowLeft className="w-6 h-6 flex-shrink-0" strokeWidth={2.5} />
          Volver
        </button>

        <h1 className="text-3xl font-bold text-brand-ink mb-1">Cuentas usuario/clave</h1>
        <p className="text-base text-brand-ink-soft mb-6">
          Crea cuentas para quienes no quieren usar correo. Entrégales el usuario y la clave; ellos
          podrán cambiarla luego en su perfil.
        </p>

        {/* Crear cuenta */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Crear cuenta</h2>
          </div>

          <label className="text-base text-gray-600 mb-1 block">Usuario</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ej: coro.sanjose" autoCapitalize="none" className={`${inputCls} mb-3`} />

          <label className="text-base text-gray-600 mb-1 block">Nombre (opcional)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre para mostrar" className={`${inputCls} mb-3`} />

          <label className="text-base text-gray-600 mb-1 block">Clave</label>
          <div className="flex gap-2 mb-4">
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Clave" className={inputCls} />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="flex-shrink-0 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold flex items-center gap-1"
              title="Generar clave"
            >
              <RefreshCw className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !username || !password}
            className="w-full bg-gradient-to-br from-blue-700 to-blue-900 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? <Loader className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
            {creating ? 'Creando...' : 'Crear cuenta'}
          </button>

          {created && (
            <div className="mt-4 bg-green-50 border-2 border-green-300 rounded-xl p-4">
              <p className="text-sm font-bold text-green-900 mb-2">✅ Cuenta creada — entrega estas credenciales:</p>
              <div className="font-mono text-base text-gray-900">
                <div>Usuario: <strong>{created.username}</strong></div>
                <div>Clave: <strong>{created.password}</strong></div>
              </div>
              <button
                onClick={() => copyCredentials(created)}
                className="mt-3 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          )}
        </div>

        {/* Restablecer clave */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Restablecer clave</h2>
          </div>
          <p className="text-base text-gray-700 mb-4">
            Para usuarios que olvidaron su clave. Verifica su identidad por su correo de respaldo antes
            de entregarle una clave nueva.
          </p>

          <label className="text-base text-gray-600 mb-1 block">Usuario</label>
          <input value={resetUser} onChange={(e) => setResetUser(e.target.value)} placeholder="usuario" autoCapitalize="none" className={`${inputCls} mb-3`} />

          <label className="text-base text-gray-600 mb-1 block">Nueva clave</label>
          <div className="flex gap-2 mb-4">
            <input value={resetPass} onChange={(e) => setResetPass(e.target.value)} placeholder="Nueva clave" className={inputCls} />
            <button
              type="button"
              onClick={() => setResetPass(generatePassword())}
              className="flex-shrink-0 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold flex items-center gap-1"
              title="Generar clave"
            >
              <RefreshCw className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={handleReset}
            disabled={resetting || !resetUser || !resetPass}
            className="w-full bg-gradient-to-br from-amber-600 to-amber-800 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting ? <Loader className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
            {resetting ? 'Restableciendo...' : 'Restablecer clave'}
          </button>

          {resetDone && (
            <div className="mt-4 bg-green-50 border-2 border-green-300 rounded-xl p-4 font-mono text-base text-gray-900">
              <p className="text-sm font-bold text-green-900 mb-2 font-sans">✅ Clave restablecida — nueva clave:</p>
              <div>Usuario: <strong>{resetDone.username}</strong></div>
              <div>Clave: <strong>{resetDone.password}</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

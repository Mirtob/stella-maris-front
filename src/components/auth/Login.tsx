import { useEffect, useState } from 'react';
import { LogIn, User, Lock, Loader, UserPlus, Mail, Music, Users, Check, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import { loginWithGoogle } from '../../services/googleAuth';
import { signInWithUsernamePassword, signUpUsernameAccount, checkUsernameAvailable } from '../../services/supabaseClient';
import { SIGNUP_PREFS_KEY } from '../../config/signupPrefs';
import { ForgotPassword } from './ForgotPassword';
import logoStellaMaris from 'figma:asset/logo-stella-maris.webp';

interface LoginProps {
  onGoogleLogin: () => void;
}

// Vista del bloque usuario/clave: cerrado, entrar (login) o crear cuenta (registro).
type UserMode = 'closed' | 'login' | 'signup';

// Roles que alguien puede elegir para sí mismo al registrarse. 'Admin' NO está: lo
// asigna el administrador principal, y el endpoint también lo rechaza.
type SignupRole = 'Coro' | 'Pueblo fiel';
type Instrument = 'Guitarra' | 'Órgano';

// Estado del aviso de disponibilidad del nombre de usuario.
type NameCheck = { status: 'idle' | 'checking' | 'free' | 'taken' | 'invalid' };

// Validación del nombre de usuario (coincide con el endpoint /api/signup-username).
const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

// Longitud mínima de clave. Debe coincidir con MIN_PASSWORD_LENGTH del endpoint.
// Verificado: Supabase acepta 4 caracteres (crear + login), así que se usa el mínimo pedido.
const MIN_PASSWORD_LENGTH = 4;

/** Regla de clave: longitud mínima, con al menos una letra y un número. */
function passwordProblem(pw: string): string | null {
  if (pw.length < MIN_PASSWORD_LENGTH) return `La clave debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (!/[a-zA-Z]/.test(pw)) return 'La clave debe incluir al menos una letra.';
  if (!/[0-9]/.test(pw)) return 'La clave debe incluir al menos un número.';
  return null;
}

/** Valida un correo simple (opcional, para recuperación). */
function isValidEmail(s: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
}

export function Login({ onGoogleLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>('closed');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  // Rol e instrumento se preguntan aquí para no partir el alta en dos pantallas.
  const [signupRole, setSignupRole] = useState<SignupRole | null>(null);
  const [signupInstruments, setSignupInstruments] = useState<Instrument[]>([]);
  // Disponibilidad del usuario, consultada mientras escribe.
  const [nameCheck, setNameCheck] = useState<NameCheck>({ status: 'idle' });

  const toggleInstrument = (i: Instrument) => {
    setSignupInstruments((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  // Aviso EN VIVO de "usuario ya en uso": se consulta con retardo (350 ms) para no
  // pegarle al endpoint en cada tecla. Solo en el modo registro y con formato válido.
  useEffect(() => {
    if (userMode !== 'signup') { setNameCheck({ status: 'idle' }); return; }
    const u = username.trim().toLowerCase();
    if (!u) { setNameCheck({ status: 'idle' }); return; }
    if (!USERNAME_RE.test(u)) { setNameCheck({ status: 'invalid' }); return; }
    setNameCheck({ status: 'checking' });
    let cancelled = false;
    const t = setTimeout(async () => {
      const { available } = await checkUsernameAvailable(u);
      if (cancelled) return;
      // `null` = no se pudo comprobar → no afirmamos nada (la creación decide).
      setNameCheck(available === null ? { status: 'idle' } : { status: available ? 'free' : 'taken' });
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [username, userMode]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      onGoogleLogin();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error iniciando sesión con Google';
      toast.error(errorMessage);
      console.error('Error en login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u || !password) {
      toast.error('Escribe tu usuario y tu clave');
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await signInWithUsernamePassword(u, password);
      if (error) {
        toast.error('Usuario o clave incorrectos');
        return;
      }
      // Recargar: la app re-inicia, toma la sesión recién creada y sigue el
      // flujo normal (recuperar perfil / completar perfil).
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  // Registro autoservicio: valida en el cliente, crea la cuenta por el endpoint
  // (server-side, con la cuenta ya confirmada) y luego inicia sesión con las mismas
  // credenciales → recarga y sigue el flujo normal (elige rol y parroquia en el setup).
  const handleUserSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    if (!USERNAME_RE.test(u)) {
      toast.error('Usuario inválido', {
        description: '3 a 30 caracteres: letras, números, punto, guion o guion bajo. Sin espacios ni tildes.',
      });
      return;
    }
    const pwErr = passwordProblem(password);
    if (pwErr) {
      toast.error(pwErr);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las claves no coinciden');
      return;
    }
    const emailBackup = recoveryEmail.trim();
    if (emailBackup && !isValidEmail(emailBackup)) {
      toast.error('El correo de respaldo no es válido', {
        description: 'Revísalo o déjalo en blanco (puedes agregarlo después).',
      });
      return;
    }
    if (nameCheck.status === 'taken') {
      toast.error('Ese usuario ya está en uso', { description: 'Elige otro nombre para tu cuenta.' });
      return;
    }
    if (!signupRole) {
      toast.error('Falta tu rol', { description: '¿Participas en el coro o asistes como pueblo fiel?' });
      return;
    }
    if (signupRole === 'Coro' && signupInstruments.length === 0) {
      toast.error('Elige tu instrumento', { description: 'Guitarra, órgano, o ambos.' });
      return;
    }
    try {
      setSubmitting(true);
      const result = await signUpUsernameAccount(u, password, {
        email: emailBackup || undefined,
        role: signupRole,
        instruments: signupRole === 'Coro' ? signupInstruments : undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // El alta de perfil ocurre después del reload; le dejamos por localStorage lo ya
      // elegido para que solo pida la parroquia y no repita rol/instrumento.
      try {
        localStorage.setItem(SIGNUP_PREFS_KEY, JSON.stringify({
          role: signupRole,
          instruments: signupRole === 'Coro' ? signupInstruments : undefined,
        }));
      } catch { /* modo privado: ProfileSetup preguntará el rol de nuevo, sin romperse */ }
      // Cuenta creada (ya confirmada) → iniciar sesión de inmediato.
      const { error } = await signInWithUsernamePassword(u, password);
      if (error) {
        // La cuenta existe pero el login falló (raro): guiar a iniciar sesión.
        toast.success('¡Cuenta creada!', { description: 'Ahora inicia sesión con tu usuario y clave.' });
        setUserMode('login');
        setPassword('');
        setConfirmPassword('');
        return;
      }
      toast.success('¡Bienvenido a Stella Maris! 🎵');
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <header className="text-center mb-4">
          <div className="flex items-center justify-center mb-3">
            {/* Logo Stella Maris */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40">
              {/* Resplandor exterior animado */}
              <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-gradient-to-br from-blue-400 via-yellow-400 to-blue-600 blur-3xl"></div>

              <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                <img
                  src={logoStellaMaris}
                  alt="Logo Stella Maris"
                  className="w-full h-full object-cover drop-shadow-2xl"
                  style={{
                    animation: 'gentle-float 4s ease-in-out infinite'
                  }}
                />
              </div>
            </div>
          </div>
          {/* A2 — h1 explícito para que axe (page-has-heading-one) lo detecte.
             Lo dejamos visualmente como párrafo para no romper el diseño actual. */}
          <h1 className="text-base sm:text-lg text-brand-ink-soft font-medium mb-1">
            Tu guía para la liturgia musical
          </h1>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Cantos, partituras y cantorales de tu parroquia
          </p>
        </header>

        {/* Login Card */}
        <section aria-labelledby="login-heading" className="bg-gradient-to-br from-brand to-brand-strong rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-brand-border transition-colors">
          <h2 id="login-heading" className="text-base font-bold text-white mb-3 text-center">
            Iniciar sesión
          </h2>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border-2 border-blue-200 text-gray-700 py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-50 active:scale-95 transition-all shadow text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          <div className="mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-lg flex-shrink-0">✝️</span>
            <p className="text-xs text-white/90">
              Accede a cantorales, cantos y partituras de tu parroquia.
            </p>
          </div>

          {/* Login alternativo: usuario + clave (para quienes no quieren usar correo).
              Se puede iniciar sesión o CREAR una cuenta nueva (autoservicio). */}
          <div className="mt-4 pt-3 border-t border-white/15">
            {userMode === 'closed' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setUserMode('login')}
                  // min-h-11 = 44px: es la vía de entrada de quien no usa Google y
                  // quedaba en 41px, por debajo del mínimo táctil.
                  className="w-full min-h-11 flex items-center justify-center gap-2 text-sm font-bold text-blue-100 hover:text-white py-2 transition-colors"
                >
                  <User className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
                  Entrar con usuario y clave
                </button>
                <button
                  type="button"
                  onClick={() => setUserMode('signup')}
                  className="w-full min-h-11 flex items-center justify-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200 py-1 transition-colors"
                >
                  <UserPlus className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
                  Crear una cuenta nueva
                </button>
              </div>
            )}

            {userMode === 'login' && (
              <form onSubmit={handleUserLogin} className="space-y-3">
                <div>
                  <label htmlFor="login-user" className="sr-only">Usuario</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/60 pointer-events-none" />
                    <input
                      id="login-user"
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Usuario"
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-base text-blue-950 bg-white border-2 border-blue-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="login-pass" className="sr-only">Clave</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/60 pointer-events-none" />
                    <input
                      id="login-pass"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Clave"
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-base text-blue-950 bg-white border-2 border-blue-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
                  {submitting ? 'Entrando...' : 'Entrar'}
                </button>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-white/80 hover:text-white underline"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUserMode('signup'); setPassword(''); }}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 underline"
                  >
                    Crear una cuenta
                  </button>
                </div>
              </form>
            )}

            {userMode === 'signup' && (
              <form onSubmit={handleUserSignup} className="space-y-3">
                <p className="text-xs text-white/85 text-center">
                  Crea tu cuenta para entrar sin correo. Elige un usuario y una clave.
                </p>
                <div>
                  <label htmlFor="signup-user" className="sr-only">Usuario nuevo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/60 pointer-events-none" />
                    <input
                      id="signup-user"
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Elige un usuario"
                      aria-describedby="signup-user-check"
                      className="w-full pl-10 pr-10 py-3 rounded-xl text-base text-blue-950 bg-white border-2 border-blue-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                    {nameCheck.status === 'checking' && (
                      <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/50 animate-spin" />
                    )}
                    {nameCheck.status === 'free' && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" strokeWidth={3} />
                    )}
                    {nameCheck.status === 'taken' && (
                      <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" strokeWidth={3} />
                    )}
                  </div>
                  <p id="signup-user-check" aria-live="polite" className="text-xs leading-snug mt-1 min-h-[1rem]">
                    {nameCheck.status === 'taken' && (
                      <span className="text-red-200 font-bold">Ese usuario ya está en uso. Elige otro.</span>
                    )}
                    {nameCheck.status === 'free' && (
                      <span className="text-green-200 font-bold">¡Disponible!</span>
                    )}
                    {nameCheck.status === 'invalid' && (
                      <span className="text-amber-200">3 a 30 caracteres: letras, números, punto, guion o guion bajo.</span>
                    )}
                  </p>
                </div>
                <div>
                  <label htmlFor="signup-pass" className="sr-only">Clave</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/60 pointer-events-none" />
                    <input
                      id="signup-pass"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crea una clave (ej. Coro2026)"
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-base text-blue-950 bg-white border-2 border-blue-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-pass2" className="sr-only">Repetir clave</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/60 pointer-events-none" />
                    <input
                      id="signup-pass2"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la clave"
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-base text-blue-950 bg-white border-2 border-blue-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2">
                  <p className="text-xs text-blue-100/90 leading-snug">
                    La clave debe tener al menos <strong>4 caracteres</strong>, con al menos <strong>una letra</strong> y <strong>un número</strong>.
                  </p>
                  <p className="text-xs text-amber-200/90 leading-snug mt-1">
                    Ejemplo válido: <strong>Coro2026</strong> · <strong>musica12</strong>
                  </p>
                </div>

                {/* Correo de respaldo OPCIONAL: habilita la auto-recuperación de clave. */}
                <div>
                  <label htmlFor="signup-email" className="sr-only">Correo de respaldo (opcional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/60 pointer-events-none" />
                    <input
                      id="signup-email"
                      type="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="Correo de respaldo (opcional)"
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-base text-blue-950 bg-white border-2 border-blue-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                  <p className="text-xs text-blue-100/80 leading-snug mt-1">
                    Te recomendamos dejar tu correo: si olvidas tu <strong>clave</strong> o tu <strong>usuario</strong>, podrás recuperar el acceso tú mismo.
                  </p>
                </div>

                {/* Rol: define qué ve en la app (el coro arma cantorales; el pueblo los lee). */}
                <fieldset>
                  <legend className="text-xs text-white/85 mb-1.5">¿Cómo participas?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { role: 'Coro' as const, icon: Music, label: 'Coro', hint: 'Canto o toco' },
                      { role: 'Pueblo fiel' as const, icon: Users, label: 'Pueblo fiel', hint: 'Participo en la Misa' },
                    ]).map(({ role, icon: Icon, label, hint }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSignupRole(role)}
                        aria-pressed={signupRole === role}
                        className={`p-2.5 rounded-xl border-2 transition-all text-left ${
                          signupRole === role
                            ? 'bg-amber-500 border-amber-300 text-blue-950 shadow-lg'
                            : 'bg-white/10 border-white/25 text-white hover:bg-white/20'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" strokeWidth={2.5} />
                        <div className="text-sm font-bold leading-tight">{label}</div>
                        <div className={`text-xs leading-tight ${signupRole === role ? 'text-blue-950/75' : 'text-white/70'}`}>{hint}</div>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Instrumento: solo aplica al coro, y ahí es obligatorio. */}
                {signupRole === 'Coro' && (
                  <fieldset>
                    <legend className="text-xs text-white/85 mb-1.5">¿Qué instrumento tocas?</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Guitarra', 'Órgano'] as const).map((inst) => (
                        <button
                          key={inst}
                          type="button"
                          onClick={() => toggleInstrument(inst)}
                          aria-pressed={signupInstruments.includes(inst)}
                          className={`p-2.5 rounded-xl border-2 transition-all text-sm font-bold ${
                            signupInstruments.includes(inst)
                              ? 'bg-amber-500 border-amber-300 text-blue-950 shadow-lg'
                              : 'bg-white/10 border-white/25 text-white hover:bg-white/20'
                          }`}
                        >
                          {inst}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/70 leading-snug mt-1">Puedes elegir los dos.</p>
                  </fieldset>
                )}

                {/* El rol no encierra a nadie: un cantor puede ir de oyente a otra parroquia. */}
                <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 flex gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-200" strokeWidth={2.5} />
                  <p className="text-xs text-blue-100/90 leading-snug">
                    Esto no te deja encasillado: al iniciar sesión puedes entrar como{' '}
                    <strong>pueblo fiel</strong> si vas a Misa a otra parroquia, y volver al coro cuando quieras.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
                  {submitting ? 'Creando cuenta...' : 'Crear cuenta y entrar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setUserMode('login'); setConfirmPassword(''); }}
                  className="w-full text-xs text-white/85 hover:text-white text-center underline"
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Features — 3 columnas en móvil */}
        <section aria-label="Funcionalidades destacadas" className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-brand to-brand-strong rounded-xl p-2 border border-brand-border text-center">
            <div className="text-2xl mb-1">🎵</div>
            <h3 className="text-xs font-bold text-white mb-0.5">Cantos</h3>
            <p className="text-xs text-blue-200 leading-tight">Biblioteca litúrgica</p>
          </div>
          <div className="bg-gradient-to-br from-brand to-brand-strong rounded-xl p-2 border border-brand-border text-center">
            <div className="text-2xl mb-1">📖</div>
            <h3 className="text-xs font-bold text-white mb-0.5">Partituras</h3>
            <p className="text-xs text-blue-200 leading-tight">Ver mientras escuchas</p>
          </div>
          <div className="bg-gradient-to-br from-brand to-brand-strong rounded-xl p-2 border border-brand-border text-center">
            <div className="text-2xl mb-1">⛪</div>
            <h3 className="text-xs font-bold text-white mb-0.5">Parroquia</h3>
            <p className="text-xs text-blue-200 leading-tight">Cantorales publicados</p>
          </div>
        </section>
      </div>

      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}

      {/* CSS para animación personalizada */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(255, 255, 255, 1)) drop-shadow(0 0 24px rgba(147, 197, 253, 0.8));
          }
        }

        @keyframes gentle-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </main>
  );
}
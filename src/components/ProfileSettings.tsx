import { User, Church, Music, Save, ArrowLeft, ShieldCheck, Loader, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserProfile, InstrumentType } from '../types';
import { updateRecoveryEmail } from '../services/userProfiles';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => void;
  onClose: () => void;
}

export function ProfileSettings({ userProfile, onSave, onClose }: ProfileSettingsProps) {
  // Settings only lets the user pick the ACTIVE parish from the ones already
  // in their profile. Adding/removing parishes from the set is done at the
  // initial ProfileSetup step.
  const initialActive = userProfile.activeParishName || userProfile.parishName || '';
  const [activeParish, setActiveParish] = useState(initialActive);
  const [instrument, setInstrument] = useState<InstrumentType>(userProfile.instrument || 'Coro');
  const [recoveryEmail, setRecoveryEmail] = useState(userProfile.recoveryEmail ?? '');
  const [recoverySaving, setRecoverySaving] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const canChangeInstrument = userProfile.role === 'Coro';
  // El email de respaldo no aplica para Admin — su acceso lo gestionan vía la tabla `admins`
  const canSetRecoveryEmail = userProfile.role !== 'Admin';

  // Build the list of parishes the user belongs to (from their saved profile)
  const userParishes: string[] = (userProfile.parishes && userProfile.parishes.length > 0)
    ? userProfile.parishes
    : (userProfile.parishName ? [userProfile.parishName] : []);

  const instruments: InstrumentType[] = ['Coro', 'Guitarra', 'Órgano'];

  const handleSave = () => {
    const updates: Partial<UserProfile> = {};

    // Update which parish is active in this session (not the saved set)
    if (activeParish) {
      updates.activeParishName = activeParish;
    }

    // Only update instrument for choir members
    if (canChangeInstrument) {
      updates.instrument = instrument;
    }

    onSave(updates);
    onClose();
  };

  /**
   * El email de respaldo se guarda directo a Supabase (no espera al "Guardar Cambios"
   * principal) para no mezclar persistencia local (perfil) con server-side (recovery).
   * Esto evita inconsistencias: si el usuario configuró el email y cerró sin guardar,
   * el resto de cambios queda atrás pero el email queda persistido en Supabase.
   */
  const handleSaveRecoveryEmail = async () => {
    const trimmed = recoveryEmail.trim();
    setRecoveryError(null);

    // Validación: no debe coincidir con su email principal
    if (trimmed.toLowerCase() === userProfile.email.toLowerCase()) {
      setRecoveryError('El email de respaldo debe ser distinto del email de tu cuenta principal');
      return;
    }

    setRecoverySaving(true);
    const result = await updateRecoveryEmail(userProfile.id, trimmed || null);
    setRecoverySaving(false);

    if (!result.ok) {
      setRecoveryError(result.error ?? 'No se pudo guardar');
      toast.error('No se pudo guardar el email de respaldo', { description: result.error });
      return;
    }

    // Actualizar el estado local del perfil también
    onSave({ recoveryEmail: trimmed || undefined });
    toast.success(trimmed ? 'Email de respaldo guardado' : 'Email de respaldo eliminado');
  };

  const handleRemoveRecoveryEmail = async () => {
    setRecoveryEmail('');
    setRecoveryError(null);
    setRecoverySaving(true);
    const result = await updateRecoveryEmail(userProfile.id, null);
    setRecoverySaving(false);
    if (!result.ok) {
      toast.error('No se pudo eliminar el email de respaldo', { description: result.error });
      return;
    }
    onSave({ recoveryEmail: undefined });
    toast.success('Email de respaldo eliminado');
  };

  const getRoleColor = () => {
    switch (userProfile.role) {
      case 'Admin':
        return 'from-red-600 to-red-700';
      case 'Coro':
        return 'from-purple-600 to-purple-700';
      case 'Pueblo fiel':
        return 'from-blue-600 to-blue-700';
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getRoleColor()} text-white p-6 pb-8`}>
        <button
          onClick={onClose}
          className="mb-6 flex items-center gap-2 text-xl active:opacity-70"
        >
          <ArrowLeft className="w-8 h-8" strokeWidth={2.5} />
          <span className="font-bold">Volver</span>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-9 h-9" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold mb-1">Configuración</h1>
            <p className="text-lg opacity-90">Actualiza tu perfil</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-24">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Información Personal</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-base text-gray-600 mb-1 block">Nombre</label>
              <div className="text-xl font-bold text-gray-800 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                {userProfile.name}
              </div>
            </div>

            <div>
              <label className="text-base text-gray-600 mb-1 block">Correo Electrónico</label>
              <div className="text-xl font-bold text-gray-800 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                {userProfile.email}
              </div>
            </div>

            <div>
              <label className="text-base text-gray-600 mb-1 block">Rol</label>
              <div className="text-xl font-bold text-gray-800 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                {userProfile.role}
              </div>
            </div>
          </div>
        </div>

        {/* Parish Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-200 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Church className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Parroquia activa</h2>
          </div>

          {userParishes.length === 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
              <p className="text-base text-amber-900 font-semibold">
                No tienes parroquias configuradas en tu perfil.
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Cierra sesión y vuelve a entrar para configurar tus parroquias desde el perfil inicial.
              </p>
            </div>
          )}

          {userParishes.length === 1 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 mb-1">Tu parroquia:</p>
              <p className="text-lg font-bold text-amber-900">{userParishes[0]}</p>
            </div>
          )}

          {userParishes.length > 1 && (
            <>
              <label className="text-base text-gray-600 mb-2 block">
                Tienes {userParishes.length} parroquias. ¿Cuál usas ahora?
              </label>
              <div className="space-y-2">
                {userParishes.map((parish) => (
                  <button
                    key={parish}
                    onClick={() => setActiveParish(parish)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      activeParish === parish
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-600 shadow-lg'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold flex-1">{parish}</span>
                      {activeParish === parish && (
                        <span className="text-sm font-bold bg-white/20 px-2 py-1 rounded-full">Activa</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex gap-2 text-amber-800">
              <div className="text-xl">⛪</div>
              <p className="text-sm">
                <strong>Nota:</strong> La parroquia activa determina qué cantorales se muestran y dónde se publican los tuyos.
              </p>
            </div>
          </div>
        </div>

        {/* T13 — Recovery Email (no aplica para admin) */}
        {canSetRecoveryEmail && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Email de respaldo</h2>
            </div>

            <p className="text-base text-gray-700 mb-4">
              Si perdés acceso a tu cuenta de Google, este email le permite al administrador verificar tu identidad y devolverte el acceso a tus cantorales.
            </p>

            <label className="text-base text-gray-600 mb-2 block" htmlFor="recovery-email">
              Email alternativo (opcional)
            </label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={recoveryEmail}
              onChange={(e) => {
                setRecoveryEmail(e.target.value);
                setRecoveryError(null);
              }}
              placeholder="tu-otro-email@ejemplo.com"
              disabled={recoverySaving}
              aria-invalid={!!recoveryError}
              aria-describedby={recoveryError ? 'recovery-email-error' : undefined}
              className={`w-full px-4 py-4 text-lg rounded-xl border-2 bg-gray-50 text-gray-800 focus:outline-none focus:bg-white transition-all ${
                recoveryError
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-200 focus:border-green-500'
              }`}
            />

            {recoveryError && (
              <p id="recovery-email-error" className="mt-2 text-sm font-bold text-red-700">
                {recoveryError}
              </p>
            )}

            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={handleSaveRecoveryEmail}
                disabled={recoverySaving || recoveryEmail === (userProfile.recoveryEmail ?? '')}
                className="flex-1 min-w-[8rem] bg-gradient-to-r from-green-600 to-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold disabled:opacity-50 active:scale-95 transition-all"
              >
                {recoverySaving ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {userProfile.recoveryEmail ? 'Actualizar' : 'Guardar email'}
              </button>

              {userProfile.recoveryEmail && (
                <button
                  onClick={handleRemoveRecoveryEmail}
                  disabled={recoverySaving}
                  aria-label="Eliminar email de respaldo"
                  className="px-4 py-3 bg-white border-2 border-red-200 text-red-700 rounded-xl flex items-center gap-2 font-bold active:scale-95 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                  Quitar
                </button>
              )}
            </div>

            <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex gap-2 text-green-800">
                <div className="text-xl">🔐</div>
                <p className="text-sm">
                  <strong>Importante:</strong> Tu email de respaldo se usa SOLO para que el administrador te identifique en caso de recovery. Nunca recibirás emails automáticos a esta dirección.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instrument Selection (Only for Choir members) */}
        {canChangeInstrument && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Music className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Instrumento Principal</h2>
            </div>

            <label className="text-base text-gray-600 mb-3 block">¿Con qué acompañas la liturgia?</label>
            
            <div className="space-y-3">
              {instruments.map((inst) => (
                <button
                  key={inst}
                  onClick={() => setInstrument(inst)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    instrument === inst
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {inst === 'Coro' && '👥'}
                      {inst === 'Guitarra' && '🎶'}
                      {inst === 'Órgano' && '🎹'}
                    </span>
                    <span className="text-xl font-bold">{inst}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex gap-2 text-blue-800">
                <div className="text-xl">🎵</div>
                <p className="text-sm">
                  <strong>Nota:</strong> Esta configuración te ayudará a recibir recomendaciones de cantos apropiados para tu instrumento.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`w-full bg-gradient-to-r ${getRoleColor()} text-white py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-98 transition-all shadow-xl text-xl font-bold`}
        >
          <Save className="w-7 h-7" strokeWidth={2.5} />
          Guardar Cambios
        </button>

        {/* Info Box */}
        <div className="mt-6 bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex gap-3">
            <div className="text-3xl">ℹ️</div>
            <div>
              <h3 className="text-lg font-bold text-purple-900 mb-2">Privacidad</h3>
              <p className="text-base text-purple-800">
                Tu información personal está protegida y solo se utiliza para mejorar tu experiencia en la aplicación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
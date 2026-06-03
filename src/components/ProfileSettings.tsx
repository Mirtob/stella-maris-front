import { User, Church, Music, Save, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { UserProfile, InstrumentType } from '../types';

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

  const canChangeInstrument = userProfile.role === 'Coro';

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
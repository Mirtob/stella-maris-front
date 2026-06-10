import { useState, useEffect } from 'react';
import { Cross, Music, Users, ShieldCheck, Church } from 'lucide-react';
import { UserRole, InstrumentType } from '../types';
import { chileDioceses, getParishesByDiocese } from '../data/chileDioceses';
import { isCurrentUserAdmin } from '../services/admin';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';

interface ProfileSetupProps {
  onComplete: (role: UserRole, instruments?: InstrumentType[], parishes?: string[]) => void;
  userEmail?: string;
  onShowTerms?: () => void;
  onShowPrivacy?: () => void;
}

export function ProfileSetup({ onComplete, userEmail, onShowTerms, onShowPrivacy }: ProfileSetupProps) {
  // Aceptación legal — Ley 19.628. Sin esto no se puede continuar.
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  // Admin eligibility is decided server-side via the `is_admin()` Supabase RPC
  // (against the `admins` table). The previous hardcoded ADMIN_EMAILS was
  // bypassable from DevTools by manipulating React state.
  const [isAdminAllowed, setIsAdminAllowed] = useState(false);

  useEffect(() => {
    isCurrentUserAdmin().then(setIsAdminAllowed);
  }, [userEmail]);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedInstruments, setSelectedInstruments] = useState<InstrumentType[]>([]);
  const [selectedDiocese, setSelectedDiocese] = useState('');
  const [selectedParishes, setSelectedParishes] = useState<Set<string>>(new Set());

  const toggleInstrument = (instrument: InstrumentType) => {
    if (selectedInstruments.includes(instrument)) {
      setSelectedInstruments(selectedInstruments.filter(i => i !== instrument));
    } else {
      setSelectedInstruments([...selectedInstruments, instrument]);
    }
  };

  const toggleParish = (parishId: string) => {
    const newSet = new Set(selectedParishes);
    if (newSet.has(parishId)) {
      newSet.delete(parishId);
    } else {
      newSet.add(parishId);
    }
    setSelectedParishes(newSet);
  };

  const handleContinue = () => {
    if (selectedRole) {
      const selectedParishIds = Array.from(selectedParishes);
      const diocese = chileDioceses.find(d => d.id === selectedDiocese);

      const selectedParishNames = selectedParishIds.map(parishId => {
        const parish = diocese?.parishes.find(p => p.id === parishId);
        return `${parish?.name} - ${diocese?.name}`;
      });

      if (selectedRole === 'Coro') {
        if (selectedInstruments.length > 0 && selectedParishNames.length > 0) {
          onComplete(selectedRole, selectedInstruments, selectedParishNames);
        }
      } else if (selectedRole === 'Pueblo fiel') {
        if (selectedParishNames.length > 0) {
          onComplete(selectedRole, undefined, selectedParishNames);
        }
      } else if (selectedRole === 'Admin') {
        // Admin no necesita parroquia — tiene CRUD sobre todas.
        onComplete(selectedRole, undefined, undefined);
      } else {
        onComplete(selectedRole);
      }
    }
  };

  const canContinue = () => {
    // Aceptación legal obligatoria por Ley 19.628 (datos sensibles religiosos).
    if (!acceptedLegal) return false;
    if (!selectedRole) return false;
    if (selectedRole === 'Coro') {
      return selectedInstruments.length > 0 && selectedDiocese && selectedParishes.size > 0;
    }
    if (selectedRole === 'Pueblo fiel') {
      return selectedDiocese && selectedParishes.size > 0;
    }
    if (selectedRole === 'Admin') {
      // Admin no requiere selección de parroquia
      return true;
    }
    return true;
  };

  const availableParishes = selectedDiocese ? getParishesByDiocese(selectedDiocese) : [];

  const handleDioceseChange = (dioceseId: string) => {
    setSelectedDiocese(dioceseId);
    setSelectedParishes(new Set());
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="max-w-3xl mx-auto pt-8 pb-24">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center mb-6">
            {/* Logo Stella Maris - Imagen original */}
            <div className="relative w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48">
              <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-gradient-to-br from-blue-400 via-yellow-400 to-blue-600 blur-2xl"></div>
              
              <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                <img
                  src={logoStellaMaris}
                  alt="Logo Stella Maris"
                  className="w-full h-full object-cover drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-950 dark:text-white mb-4 leading-tight">
            Completa tu perfil
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-blue-900 dark:text-blue-100 font-medium">
            ¿Cómo usarás esta aplicación?
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-5 mb-4 sm:mb-6">
          <button
            onClick={() => setSelectedRole('Coro')}
            className={`w-full p-3 sm:p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
              selectedRole === 'Coro'
                ? 'bg-gradient-to-r from-blue-900 to-blue-950 text-white border-blue-800 shadow-2xl scale-[1.02]'
                : 'bg-white/30 dark:bg-white/10 backdrop-blur-sm text-blue-950 dark:text-white border-white/40 dark:border-white/20 shadow-lg'
            }`}
          >
            <div className="flex items-center gap-5">
              <Music className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" strokeWidth={2.5} />
              <div className="text-left flex-1">
                <div className="text-lg sm:text-xl font-bold mb-1">Coro</div>
                <div className={`text-lg sm:text-xl ${selectedRole === 'Coro' ? 'opacity-90' : 'text-gray-600 dark:text-gray-400'}`}>
                  Armar y publicar cantorales para la parroquia
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('Pueblo fiel')}
            className={`w-full p-3 sm:p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
              selectedRole === 'Pueblo fiel'
                ? 'bg-gradient-to-r from-blue-900 to-blue-950 text-white border-blue-800 shadow-2xl scale-[1.02]'
                : 'bg-white/30 dark:bg-white/10 backdrop-blur-sm text-blue-950 dark:text-white border-white/40 dark:border-white/20 shadow-lg'
            }`}
          >
            <div className="flex items-center gap-5">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" strokeWidth={2.5} />
              <div className="text-left flex-1">
                <div className="text-lg sm:text-xl font-bold mb-1">Pueblo fiel</div>
                <div className={`text-lg sm:text-xl ${selectedRole === 'Pueblo fiel' ? 'opacity-90' : ''}`}>
                  Ver cantorales publicados por mi parroquia
                </div>
              </div>
            </div>
          </button>

          {isAdminAllowed && (
          <button
            onClick={() => setSelectedRole('Admin')}
            className={`w-full p-3 sm:p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
              selectedRole === 'Admin'
                ? 'bg-gradient-to-r from-blue-900 to-blue-950 text-white border-blue-800 shadow-2xl scale-[1.02]'
                : 'bg-white/30 dark:bg-white/10 backdrop-blur-sm text-blue-950 dark:text-white border-white/40 dark:border-white/20 shadow-lg'
            }`}
          >
            <div className="flex items-center gap-5">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" strokeWidth={2.5} />
              <div className="text-left flex-1">
                <div className="text-lg sm:text-xl font-bold mb-1">Administrador</div>
                <div className={`text-lg sm:text-xl ${selectedRole === 'Admin' ? 'opacity-90' : ''}`}>
                  Gestionar cantos y administrar la plataforma
                </div>
              </div>
            </div>
          </button>
          )}
        </div>

        {/* Parish Selection - For Coro and Pueblo fiel */}
        {(selectedRole === 'Coro' || selectedRole === 'Pueblo fiel') && (
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-4 border-2 border-white/40 dark:border-white/20 mb-4 sm:mb-6 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-blue-800">
                <Church className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <label className="text-base sm:text-lg font-bold text-blue-950 dark:text-white">
                  Selecciona tus parroquias
                </label>
                <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 mt-1">
                  Puedes seleccionar una o varias
                </p>
              </div>
            </div>

            <select
              value={selectedDiocese}
              onChange={(e) => handleDioceseChange(e.target.value)}
              className="w-full px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/60 dark:bg-white/10 text-blue-950 dark:text-white font-bold shadow-lg transition-colors"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-blue-950 dark:text-white">Elige una diócesis...</option>
              {chileDioceses.map((diocese) => (
                <option key={diocese.id} value={diocese.id} className="bg-white dark:bg-slate-800 text-blue-950 dark:text-white">
                  {diocese.name}
                </option>
              ))}
            </select>

            {selectedDiocese && availableParishes.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100">
                  Parroquias disponibles:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto bg-white/50 dark:bg-white/5 rounded-xl p-4">
                  {availableParishes.map((parish) => (
                    <label
                      key={parish.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParishes.has(parish.id)}
                        onChange={() => toggleParish(parish.id)}
                        className="w-5 h-5 rounded border-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-white/10 cursor-pointer accent-blue-600"
                      />
                      <span className="text-base sm:text-lg font-medium text-blue-900 dark:text-blue-100">
                        {parish.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 bg-white/40 dark:bg-white/10 backdrop-blur-sm border-2 border-white/50 dark:border-white/20 rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="text-3xl">⛪</div>
                <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 leading-relaxed">
                  <strong>Importante:</strong> Selecciona las parroquias donde usarás Stella Maris. Podrás elegir la activa cada vez que entres a la app.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Choir Specific Options */}
        {selectedRole === 'Coro' && (
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-4 border-2 border-white/40 dark:border-white/20 mb-4 sm:mb-6 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-blue-800">
                <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <label className="text-base sm:text-lg font-bold text-blue-950 dark:text-white">
                  Instrumentos de acompañamiento
                </label>
                <p className="text-base sm:text-lg text-blue-800 dark:text-blue-200 mt-1">
                  Puedes seleccionar uno o varios
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <button
                onClick={() => toggleInstrument('Guitarra')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  selectedInstruments.includes('Guitarra')
                    ? 'bg-gradient-to-br from-blue-900 to-blue-950 text-white border-blue-800 shadow-2xl scale-105'
                    : 'bg-white/50 dark:bg-white/10 backdrop-blur-sm text-blue-950 dark:text-white border-white/60 dark:border-white/20 shadow-lg'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-3">🎶</div>
                <div className="text-base sm:text-lg font-bold">Guitarra</div>
              </button>

              <button
                onClick={() => toggleInstrument('Órgano')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  selectedInstruments.includes('Órgano')
                    ? 'bg-gradient-to-br from-blue-900 to-blue-950 text-white border-blue-800 shadow-2xl scale-105'
                    : 'bg-white/50 dark:bg-white/10 backdrop-blur-sm text-blue-950 dark:text-white border-white/60 dark:border-white/20 shadow-lg'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-3">🎹</div>
                <div className="text-base sm:text-lg font-bold">Órgano</div>
              </button>
            </div>
            
            <div className="bg-white/40 dark:bg-white/10 backdrop-blur-sm border-2 border-white/50 dark:border-white/20 rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="text-3xl">🎵</div>
                <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 leading-relaxed">
                  Los cantos se filtrarán preferentemente según el instrumento seleccionado para cada Misa
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aceptación legal — Ley 19.628 (datos personales y sensibles).
            Sin esto el botón Continuar queda deshabilitado. */}
        <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border-2 border-white/40 dark:border-white/20 mb-4 sm:mb-6 transition-colors">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
              className="mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-blue-700 dark:border-blue-400 bg-white dark:bg-white/10 accent-blue-700 cursor-pointer flex-shrink-0"
              aria-label="Acepto los términos y la política de privacidad"
            />
            <span className="text-sm sm:text-base text-blue-950 dark:text-blue-100 leading-relaxed">
              He leído y acepto los{' '}
              <button
                type="button"
                onClick={onShowTerms}
                className="underline font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
              >
                Términos de Uso
              </button>
              {' '}y la{' '}
              <button
                type="button"
                onClick={onShowPrivacy}
                className="underline font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
              >
                Política de Privacidad
              </button>
              . Doy mi consentimiento expreso para el tratamiento de mis datos
              personales y de mi afiliación parroquial, conforme a la Ley 19.628.
            </span>
          </label>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!canContinue()}
          className={`w-full py-4 sm:py-5 px-4 rounded-2xl text-lg sm:text-xl font-bold transition-all transform ${
            canContinue()
              ? 'bg-gradient-to-r from-blue-900 to-blue-950 text-white shadow-2xl hover:shadow-3xl active:scale-95 hover:scale-[1.02] border-2 border-blue-800'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          Continuar
        </button>

        {!acceptedLegal && (
          <p className="text-center text-xs sm:text-sm text-blue-800 dark:text-blue-200 mt-3 italic">
            Marcá la casilla de aceptación legal para continuar
          </p>
        )}
      </div>
    </div>
  );
}
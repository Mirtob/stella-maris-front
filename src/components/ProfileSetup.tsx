import { useState } from 'react';
import { Cross, Music, Users, ShieldCheck, Church, MapPin } from 'lucide-react';
import { UserRole, InstrumentType } from '../types';
import { chileDioceses, getParishesByDiocese, getChapelsByParish } from '../data/chileDioceses';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';

// Solo estos emails pueden elegir el rol Admin
const ADMIN_EMAILS = ['gustavus.tobar@gmail.com'];

interface ProfileSetupProps {
  onComplete: (role: UserRole, instruments?: InstrumentType[], parishName?: string) => void;
  userEmail?: string;
}

export function ProfileSetup({ onComplete, userEmail }: ProfileSetupProps) {
  const isAdminAllowed = userEmail ? ADMIN_EMAILS.includes(userEmail.toLowerCase()) : false;
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedInstruments, setSelectedInstruments] = useState<InstrumentType[]>([]);
  const [selectedDiocese, setSelectedDiocese] = useState('');
  const [selectedParish, setSelectedParish] = useState('');
  const [selectedChapel, setSelectedChapel] = useState('');

  const toggleInstrument = (instrument: InstrumentType) => {
    if (selectedInstruments.includes(instrument)) {
      setSelectedInstruments(selectedInstruments.filter(i => i !== instrument));
    } else {
      setSelectedInstruments([...selectedInstruments, instrument]);
    }
  };

  const handleContinue = () => {
    if (selectedRole) {
      // Construir el nombre completo de la ubicación
      let fullLocationName = '';
      
      if (selectedChapel) {
        // Si hay capilla seleccionada, usar nombre completo
        const diocese = chileDioceses.find(d => d.id === selectedDiocese);
        const parish = diocese?.parishes.find(p => p.id === selectedParish);
        const chapel = parish?.chapels?.find(c => c.id === selectedChapel);
        fullLocationName = `${chapel?.name} - ${parish?.name} - ${diocese?.name}`;
      } else if (selectedParish) {
        // Si solo hay parroquia, usar parroquia y diócesis
        const diocese = chileDioceses.find(d => d.id === selectedDiocese);
        const parish = diocese?.parishes.find(p => p.id === selectedParish);
        fullLocationName = `${parish?.name} - ${diocese?.name}`;
      }
      
      if (selectedRole === 'Coro') {
        if (selectedInstruments.length > 0 && fullLocationName) {
          onComplete(selectedRole, selectedInstruments, fullLocationName);
        }
      } else if (selectedRole === 'Pueblo fiel') {
        if (fullLocationName) {
          onComplete(selectedRole, undefined, fullLocationName);
        }
      } else if (selectedRole === 'Admin') {
        if (fullLocationName) {
          onComplete(selectedRole, undefined, fullLocationName);
        }
      } else {
        onComplete(selectedRole);
      }
    }
  };

  const canContinue = () => {
    if (!selectedRole) return false;
    if (selectedRole === 'Coro') {
      return selectedInstruments.length > 0 && selectedDiocese && selectedParish;
    }
    if (selectedRole === 'Pueblo fiel' || selectedRole === 'Admin') {
      return selectedDiocese && selectedParish;
    }
    return true;
  };

  const availableParishes = selectedDiocese ? getParishesByDiocese(selectedDiocese) : [];
  const availableChapels = (selectedDiocese && selectedParish) 
    ? getChapelsByParish(selectedDiocese, selectedParish) 
    : [];

  const handleDioceseChange = (dioceseId: string) => {
    setSelectedDiocese(dioceseId);
    setSelectedParish('');
    setSelectedChapel('');
  };

  const handleParishChange = (parishId: string) => {
    setSelectedParish(parishId);
    setSelectedChapel('');
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
        {(selectedRole === 'Coro' || selectedRole === 'Pueblo fiel' || selectedRole === 'Admin') && (
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-3 sm:p-4 border-2 border-white/40 dark:border-white/20 mb-4 sm:mb-6 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-blue-800">
                <Church className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
              </div>
              <label className="text-base sm:text-lg font-bold text-blue-950 dark:text-white">
                Selecciona tu parroquia
              </label>
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
            
            <select
              value={selectedParish}
              onChange={(e) => handleParishChange(e.target.value)}
              className="w-full px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/60 dark:bg-white/10 text-blue-950 dark:text-white font-bold shadow-lg transition-colors mt-5"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-blue-950 dark:text-white">Elige una parroquia...</option>
              {availableParishes.map((parish) => (
                <option key={parish.id} value={parish.id} className="bg-white dark:bg-slate-800 text-blue-950 dark:text-white">
                  {parish.name}
                </option>
              ))}
            </select>
            
            {availableChapels.length > 0 && (
              <select
                value={selectedChapel}
                onChange={(e) => setSelectedChapel(e.target.value)}
                className="w-full px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/60 dark:bg-white/10 text-blue-950 dark:text-white font-bold shadow-lg transition-colors mt-5"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-blue-950 dark:text-white">Elige una capilla (opcional)...</option>
                {availableChapels.map((chapel) => (
                  <option key={chapel.id} value={chapel.id} className="bg-white dark:bg-slate-800 text-blue-950 dark:text-white">
                    {chapel.name}
                  </option>
                ))}
              </select>
            )}
            
            <div className="mt-5 bg-white/40 dark:bg-white/10 backdrop-blur-sm border-2 border-white/50 dark:border-white/20 rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="text-3xl">⛪</div>
                <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 leading-relaxed">
                  <strong>Importante:</strong> Selecciona la parroquia donde asistes a Misa para ver los cantorales correspondientes.
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
      </div>
    </div>
  );
}
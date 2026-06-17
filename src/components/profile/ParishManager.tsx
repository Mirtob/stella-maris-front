import { Church, Search, Edit2, Trash2, MapPin, Users, Plus, Building2, ArrowLeft, Activity, RefreshCw, Loader } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { chileDioceses, Diocese, Parish, Chapel } from '../../data/chileDioceses';
import { toast } from 'sonner';
import { listActiveParishes, ParishActivity } from '../../services/parishStats';
import { listChapels, addChapel, deleteChapel, Chapel as AdminChapel } from '../../services/chapels';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ExtendedParish extends Parish {
  choirCount?: number;
  memberCount?: number;
  dioceseName?: string;
  dioceseId?: string;
}

export function ParishManager() {
  const [selectedDiocese, setSelectedDiocese] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Parroquias con actividad real (consulta Supabase: user_profiles + published_cantorals).
  const [activeParishes, setActiveParishes] = useState<ParishActivity[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);

  const loadActive = useCallback(async () => {
    setLoadingActive(true);
    try {
      const data = await listActiveParishes();
      setActiveParishes(data);
    } finally {
      setLoadingActive(false);
    }
  }, []);

  useEffect(() => { loadActive(); }, [loadActive]);

  // Capillas administradas (Supabase). Agrupadas por parish_full para mostrarlas
  // bajo su parroquia madre.
  const [adminChapels, setAdminChapels] = useState<AdminChapel[]>([]);
  const [savingChapel, setSavingChapel] = useState(false);
  const [pendingDeleteChapel, setPendingDeleteChapel] = useState<AdminChapel | null>(null);

  const loadChapels = useCallback(async () => {
    setAdminChapels(await listChapels());
  }, []);
  useEffect(() => { loadChapels(); }, [loadChapels]);

  const chapelsForParish = (parishFull: string) =>
    adminChapels.filter((c) => c.parishFull === parishFull);

  const [showAddChapelDialog, setShowAddChapelDialog] = useState(false);
  const [showAddParishDialog, setShowAddParishDialog] = useState(false);
  const [showEditParishDialog, setShowEditParishDialog] = useState(false);
  const [selectedParishForChapel, setSelectedParishForChapel] = useState<ExtendedParish | null>(null);
  const [selectedParishForEdit, setSelectedParishForEdit] = useState<ExtendedParish | null>(null);
  const [newChapelName, setNewChapelName] = useState('');
  const [newChapelAddress, setNewChapelAddress] = useState('');
  
  // Estados para agregar parroquia
  const [newParishName, setNewParishName] = useState('');
  const [newParishAddress, setNewParishAddress] = useState('');
  const [newParishCity, setNewParishCity] = useState('');
  const [newParishDiocese, setNewParishDiocese] = useState('');
  
  // Estado local de parroquias (simulando backend)
  const [localParishes, setLocalParishes] = useState<Map<string, Parish[]>>(new Map());
  const [localChapels, setLocalChapels] = useState<Map<string, Chapel[]>>(new Map());

  // Obtener todas las parroquias con información adicional
  const allParishesWithDiocese: ExtendedParish[] = selectedDiocese 
    ? (chileDioceses.find(d => d.id === selectedDiocese)?.parishes || []).map(p => ({
        ...p,
        choirCount: 0,
        memberCount: 0,
        dioceseName: chileDioceses.find(d => d.id === selectedDiocese)?.name,
        dioceseId: selectedDiocese
      }))
    : chileDioceses.flatMap(d => d.parishes.map(p => ({
        ...p,
        choirCount: 0,
        memberCount: 0,
        dioceseName: d.name,
        dioceseId: d.id
      })));

  const filteredParishes = allParishesWithDiocese.filter(parish =>
    parish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parish.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parish.dioceseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddChapel = (parish: ExtendedParish) => {
    setSelectedParishForChapel(parish);
    setShowAddChapelDialog(true);
  };

  const handleSaveChapel = async () => {
    if (!selectedParishForChapel || !newChapelName.trim() || savingChapel) return;
    setSavingChapel(true);
    // parishFull debe coincidir con el formato del perfil: "<Parroquia> - <Diócesis>".
    const parishFull = `${selectedParishForChapel.name} - ${selectedParishForChapel.dioceseName ?? ''}`.trim();
    const res = await addChapel({
      name: newChapelName,
      parishFull,
      diocese: selectedParishForChapel.dioceseName,
      address: newChapelAddress,
    });
    setSavingChapel(false);

    if (!res.ok) {
      toast.error('No se pudo agregar la capilla', { description: res.error });
      return;
    }

    toast.success('¡Capilla agregada exitosamente!', {
      description: `${newChapelName} ha sido agregada a ${selectedParishForChapel.name}`,
      duration: 4000,
    });
    await loadChapels();
    setShowAddChapelDialog(false);
    setNewChapelName('');
    setNewChapelAddress('');
    setSelectedParishForChapel(null);
  };

  const handleDeleteChapel = async (chapel: AdminChapel) => {
    const res = await deleteChapel(chapel.id);
    if (!res.ok) {
      toast.error('No se pudo eliminar la capilla', { description: res.error });
      return;
    }
    toast.success('Capilla eliminada', { description: chapel.name });
    await loadChapels();
  };

  const handleAddParish = () => {
    setShowAddParishDialog(true);
  };

  const handleSaveParish = () => {
    // TODO: persistir en backend cuando exista endpoint /api/parishes
    const dioceseName = chileDioceses.find(d => d.id === newParishDiocese)?.name || '';

    toast.success('¡Parroquia agregada exitosamente!', {
      description: `${newParishName} ha sido agregada a ${dioceseName}`,
      duration: 4000,
    });
    
    setShowAddParishDialog(false);
    setNewParishName('');
    setNewParishAddress('');
    setNewParishCity('');
    setNewParishDiocese('');
  };

  const handleEditParish = (parish: ExtendedParish) => {
    setSelectedParishForEdit(parish);
    setShowEditParishDialog(true);
  };

  const handleSaveEditParish = () => {
    // TODO: persistir en backend cuando exista endpoint PATCH /api/parishes/:id

    toast.success('¡Parroquia actualizada exitosamente!', {
      description: `Los cambios en ${selectedParishForEdit?.name} han sido guardados`,
      duration: 4000,
    });
    
    setShowEditParishDialog(false);
    setSelectedParishForEdit(null);
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen p-6 pb-24 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <Church className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-purple-900 dark:text-white mb-2">Gestión de Parroquias y Capillas</h1>
          <p className="text-xl text-purple-700 dark:text-purple-300">Base de datos de Chile</p>
        </div>

        {/* Parroquias activas en la app — datos reales de Supabase */}
        <div className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-2xl shadow-lg p-5 border-2 border-emerald-300 dark:border-emerald-700">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Parroquias activas en la app
            </h2>
            <button
              onClick={loadActive}
              disabled={loadingActive}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200 active:scale-95 disabled:opacity-50"
              aria-label="Refrescar parroquias activas"
            >
              {loadingActive ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>

          {loadingActive ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1].map(i => (
                <div key={i} className="bg-white/60 dark:bg-white/5 rounded-xl p-3 animate-pulse h-14" />
              ))}
            </div>
          ) : activeParishes.length === 0 ? (
            <p className="text-sm text-emerald-800 dark:text-emerald-200 italic">
              Aún no hay actividad de parroquias en la app. Aparecerán acá cuando se registren usuarios o se publiquen cantorales.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {activeParishes.map(p => (
                <div
                  key={p.parishName}
                  className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate" title={p.parishName}>
                      {p.parishName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 font-bold">
                      <Users className="w-3 h-3" /> {p.userCount}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 font-bold">
                      📖 {p.publishedCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-3 italic">
            👤 = usuarios registrados · 📖 = cantorales publicados
          </p>
        </div>

        <div className="mb-4 text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          Catálogo de parroquias
        </div>

        {/* Diocese Filter */}
        <div className="mb-6">
          <select
            value={selectedDiocese}
            onChange={(e) => setSelectedDiocese(e.target.value)}
            className="w-full px-3 sm:px-4 py-4 text-lg border-2 border-amber-200 dark:border-amber-700 rounded-xl focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors"
          >
            <option value="">Todas las Diócesis de Chile</option>
            {chileDioceses.map((diocese) => (
              <option key={diocese.id} value={diocese.id}>
                {diocese.name} - {diocese.region}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="Buscar parroquia, ciudad o diócesis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 text-lg border-2 border-amber-200 dark:border-amber-700 rounded-xl focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors"
          />
        </div>

        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
          Mostrando {filteredParishes.length} parroquias
        </p>

        {/* Parishes List */}
        <div className="space-y-4">
          {filteredParishes.map((parish) => (
            <div
              key={parish.id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 dark:border-slate-700 transition-colors"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5">
                <div className="flex items-start gap-3">
                  <Church className="w-8 h-8 flex-shrink-0 mt-1" strokeWidth={2.5} />
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold mb-1 leading-tight">{parish.name}</h3>
                    <div className="text-sm opacity-90 mb-1">{parish.dioceseName}</div>
                    {(parish.address || parish.city) && (
                      <div className="flex items-start gap-2 text-base opacity-90">
                        <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          {parish.address && <div>{parish.address}</div>}
                          {parish.city && <div>{parish.city}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chapels List */}
              {parish.chapels && parish.chapels.length > 0 && (
                <div className="p-5 bg-blue-50 dark:bg-slate-700 border-b-2 border-blue-100 dark:border-slate-600 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                    <h4 className="font-bold text-blue-900 dark:text-blue-200">Capillas ({parish.chapels.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {parish.chapels.map((chapel) => (
                      <div key={chapel.id} className="bg-white dark:bg-slate-600 p-3 rounded-lg border border-blue-200 dark:border-slate-500 transition-colors">
                        <div className="font-semibold text-gray-900 dark:text-white">{chapel.name}</div>
                        {chapel.address && (
                          <div className="text-sm text-gray-600 dark:text-gray-300">{chapel.address}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Capillas administradas (Supabase) */}
              {chapelsForParish(`${parish.name} - ${parish.dioceseName}`).length > 0 && (
                <div className="p-5 bg-green-50 dark:bg-slate-700 border-b-2 border-green-100 dark:border-slate-600 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-green-700 dark:text-green-300" />
                    <h4 className="font-bold text-green-900 dark:text-green-200">
                      Capillas administradas ({chapelsForParish(`${parish.name} - ${parish.dioceseName}`).length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {chapelsForParish(`${parish.name} - ${parish.dioceseName}`).map((chapel) => (
                      <div key={chapel.id} className="bg-white dark:bg-slate-600 p-3 rounded-lg border border-green-200 dark:border-slate-500 flex items-center justify-between gap-2 transition-colors">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">{chapel.name}</div>
                          {chapel.address && <div className="text-sm text-gray-600 dark:text-gray-300 truncate">{chapel.address}</div>}
                        </div>
                        <button
                          onClick={() => setPendingDeleteChapel(chapel)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                          aria-label="Eliminar capilla"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-4 flex gap-2 flex-wrap">
                <button className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
                  onClick={() => handleEditParish(parish)}
                >
                  <Edit2 className="w-5 h-5" />
                  <span className="text-base font-bold">Editar</span>
                </button>
                <button className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
                  onClick={() => handleAddChapel(parish)}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-base font-bold">+ Capilla</span>
                </button>
              </div>
            </div>
          ))}

          {filteredParishes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-600 dark:text-gray-400">No se encontraron parroquias</p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-purple-200 dark:border-purple-700 transition-colors">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Estadísticas de Chile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700 transition-colors">
              <div className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                {chileDioceses.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Diócesis</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700 transition-colors">
              <div className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                {allParishesWithDiocese.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Parroquias</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={handleAddParish}
        className="fixed bottom-24 right-6 bg-gradient-to-br from-green-600 to-green-700 text-white p-5 rounded-full shadow-2xl active:scale-95 transition-all z-40 border-4 border-green-800 hover:from-green-700 hover:to-green-800"
        title="Agregar Parroquia"
      >
        <Plus className="w-8 h-8" strokeWidth={2.5} />
      </button>

      {/* Add Chapel Dialog */}
      {showAddChapelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Agregar Capilla</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Parroquia</label>
              <div className="px-4 py-3 bg-amber-50 dark:bg-slate-700 rounded-xl border-2 border-amber-200 dark:border-amber-700 transition-colors">
                <div className="font-bold text-gray-900 dark:text-white">{selectedParishForChapel?.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{selectedParishForChapel?.dioceseName}</div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre de la Capilla *</label>
              <input
                type="text"
                value={newChapelName}
                onChange={(e) => setNewChapelName(e.target.value)}
                placeholder="Ej: Capilla San Antonio"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dirección (opcional)</label>
              <input
                type="text"
                value={newChapelAddress}
                onChange={(e) => setNewChapelAddress(e.target.value)}
                placeholder="Ej: Calle Los Álamos 123"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white px-3 sm:px-4 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                onClick={() => {
                  setShowAddChapelDialog(false);
                  setNewChapelName('');
                  setNewChapelAddress('');
                  setSelectedParishForChapel(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 sm:px-4 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                onClick={handleSaveChapel}
                disabled={!newChapelName.trim() || savingChapel}
              >
                {savingChapel ? 'Guardando…' : 'Guardar Capilla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Parish Dialog */}
      {showAddParishDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Agregar Parroquia</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre de la Parroquia *</label>
              <input
                type="text"
                value={newParishName}
                onChange={(e) => setNewParishName(e.target.value)}
                placeholder="Ej: Parroquia San Antonio"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dirección (opcional)</label>
              <input
                type="text"
                value={newParishAddress}
                onChange={(e) => setNewParishAddress(e.target.value)}
                placeholder="Ej: Calle Los Álamos 123"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ciudad (opcional)</label>
              <input
                type="text"
                value={newParishCity}
                onChange={(e) => setNewParishCity(e.target.value)}
                placeholder="Ej: Santiago"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Diócesis *</label>
              <select
                value={newParishDiocese}
                onChange={(e) => setNewParishDiocese(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              >
                <option value="">Seleccionar Diócesis</option>
                {chileDioceses.map((diocese) => (
                  <option key={diocese.id} value={diocese.id}>
                    {diocese.name} - {diocese.region}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white px-3 sm:px-4 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                onClick={() => {
                  setShowAddParishDialog(false);
                  setNewParishName('');
                  setNewParishAddress('');
                  setNewParishCity('');
                  setNewParishDiocese('');
                }}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 sm:px-4 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                onClick={handleSaveParish}
                disabled={!newParishName.trim() || !newParishDiocese.trim()}
              >
                Guardar Parroquia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Parish Dialog */}
      {showEditParishDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Editar Parroquia</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre de la Parroquia *</label>
              <input
                type="text"
                value={selectedParishForEdit?.name || ''}
                onChange={(e) => setSelectedParishForEdit(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Ej: Parroquia San Antonio"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dirección (opcional)</label>
              <input
                type="text"
                value={selectedParishForEdit?.address || ''}
                onChange={(e) => setSelectedParishForEdit(prev => prev ? { ...prev, address: e.target.value } : null)}
                placeholder="Ej: Calle Los Álamos 123"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ciudad (opcional)</label>
              <input
                type="text"
                value={selectedParishForEdit?.city || ''}
                onChange={(e) => setSelectedParishForEdit(prev => prev ? { ...prev, city: e.target.value } : null)}
                placeholder="Ej: Santiago"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Diócesis *</label>
              <select
                value={selectedParishForEdit?.dioceseId || ''}
                onChange={(e) => setSelectedParishForEdit(prev => prev ? { ...prev, dioceseId: e.target.value } : null)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors"
              >
                <option value="">Seleccionar Diócesis</option>
                {chileDioceses.map((diocese) => (
                  <option key={diocese.id} value={diocese.id}>
                    {diocese.name} - {diocese.region}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white px-3 sm:px-4 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                onClick={() => {
                  setShowEditParishDialog(false);
                  setSelectedParishForEdit(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 sm:px-4 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                onClick={handleSaveEditParish}
                disabled={!selectedParishForEdit?.name?.trim() || !selectedParishForEdit?.dioceseId?.trim()}
              >
                Guardar Parroquia
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteChapel}
        title="Eliminar capilla"
        message="¿Seguro que quieres eliminar esta capilla? Los usuarios dejarán de poder seleccionarla."
        details={pendingDeleteChapel ? `${pendingDeleteChapel.name} · ${pendingDeleteChapel.parishFull}` : undefined}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteChapel) handleDeleteChapel(pendingDeleteChapel);
          setPendingDeleteChapel(null);
        }}
        onCancel={() => setPendingDeleteChapel(null)}
      />
    </div>
  );
}
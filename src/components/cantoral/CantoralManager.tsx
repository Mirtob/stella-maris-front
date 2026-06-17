import { BookOpen, Calendar, Edit2, Trash2, Share2, Eye } from 'lucide-react';
import { useState } from 'react';
import { PublishedCantoral } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface CantoralManagerProps {
  cantorals: PublishedCantoral[];
  onEdit?: (cantoralId: string) => void;
  onDelete?: (cantoralId: string) => void;
}

export function CantoralManager({ cantorals, onEdit, onDelete }: CantoralManagerProps) {
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Publicados' | 'Borradores'>('Todos');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteCantoral = pendingDeleteId
    ? cantorals.find(c => c.id === pendingDeleteId)
    : null;

  // Map each cantoral's real DB status ('draft' | 'published') to UI label.
  // Cantorals without an explicit status default to 'published' for backwards compat
  // (older rows in Supabase may not have the field).
  const cantoralsWithLabel = cantorals.map(c => ({
    ...c,
    statusLabel: (c.status === 'draft' ? 'Borradores' : 'Publicados') as 'Publicados' | 'Borradores',
  }));

  const filteredCantorals = cantoralsWithLabel.filter(cantoral =>
    filterStatus === 'Todos' || cantoral.statusLabel === filterStatus
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-950 rounded-full flex items-center justify-center shadow-2xl border-4 border-blue-800">
              <BookOpen className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-950 dark:text-white mb-2">Mis Cantorales</h1>
          <p className="text-xl text-blue-900 dark:text-blue-100">Gestiona tus cantorales publicados</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-2 border-2 border-white/60 dark:border-white/20 shadow-lg">
          {(['Todos', 'Publicados', 'Borradores'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 py-3 rounded-xl text-base font-bold transition-all ${
                filterStatus === status
                  ? 'bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-xl border-2 border-blue-800'
                  : 'text-blue-950 dark:text-white hover:bg-white/30 dark:hover:bg-white/20'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Cantorals List */}
        <div className="space-y-4">
          {filteredCantorals.map((cantoral) => (
            <div
              key={cantoral.id}
              className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 border-white/60 dark:border-white/20"
            >
              {/* Header */}
              <div className={`p-5 ${
                cantoral.statusLabel === 'Publicados'
                  ? 'bg-gradient-to-br from-blue-900 to-blue-950'
                  : 'bg-gradient-to-br from-gray-600 to-gray-700'
              } text-white border-b-2 ${
                cantoral.statusLabel === 'Publicados'
                  ? 'border-blue-800'
                  : 'border-gray-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-6 h-6" strokeWidth={2.5} />
                    <span className="text-lg font-bold">{cantoral.parishName}</span>
                  </div>
                  {cantoral.statusLabel === 'Publicados' ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      Público
                    </span>
                  ) : (
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                      Borrador
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-base opacity-90">
                  <Calendar className="w-5 h-5" />
                  <span className="capitalize">{formatDate(cantoral.date)}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 bg-amber-50/50 dark:bg-amber-900/20 border-b-2 border-white/40 dark:border-white/10 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-blue-900 dark:text-blue-100 mb-1 font-bold">Cantos</div>
                    <div className="text-2xl font-bold text-blue-950 dark:text-white">
                      {cantoral.songs?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-900 dark:text-blue-100 mb-1 font-bold">Publicado por</div>
                    <div className="text-base font-bold text-blue-950 dark:text-white truncate">
                      {cantoral.publishedBy}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 flex gap-2 bg-white/20 dark:bg-white/5 backdrop-blur-sm">
                <button 
                  onClick={() => onEdit?.(cantoral.id)}
                  className="flex-1 bg-gradient-to-br from-blue-900 to-blue-950 text-white py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg border-2 border-blue-800 hover:shadow-xl"
                >
                  <Edit2 className="w-5 h-5" strokeWidth={2.5} />
                  <span className="text-base font-bold">Editar</span>
                </button>
                
                {cantoral.statusLabel === 'Publicados' && (
                  <button className="flex-1 bg-gradient-to-br from-green-600 to-green-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg border-2 border-green-800 hover:shadow-xl">
                    <Share2 className="w-5 h-5" strokeWidth={2.5} />
                    <span className="text-base font-bold">Compartir</span>
                  </button>
                )}
                
                <button
                  onClick={() => setPendingDeleteId(cantoral.id)}
                  className="bg-gradient-to-br from-red-600 to-red-700 text-white py-3 px-4 rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-lg border-2 border-red-800 hover:shadow-xl"
                >
                  <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}

          {filteredCantorals.length === 0 && (
            <div className="text-center py-12 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/60 dark:border-white/20">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-xl text-blue-950 dark:text-white font-bold mb-2">No hay cantorales</p>
              <p className="text-base text-blue-900 dark:text-blue-100">
                {filterStatus === 'Borradores' 
                  ? 'No tienes borradores guardados' 
                  : 'Comienza creando un nuevo cantoral'}
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-white/60 dark:border-white/20">
          <h3 className="text-xl font-bold text-blue-950 dark:text-white mb-4">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl p-4 border-2 border-blue-800 shadow-lg">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {cantoralsWithLabel.filter(c => c.statusLabel === 'Publicados').length}
              </div>
              <div className="text-sm text-blue-100 mt-1 font-bold">Publicados</div>
            </div>
            <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl p-4 border-2 border-amber-700 shadow-lg">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {cantoralsWithLabel.filter(c => c.statusLabel === 'Borradores').length}
              </div>
              <div className="text-sm text-amber-50 mt-1 font-bold">Borradores</div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDeleteCantoral}
        title="Eliminar cantoral"
        message="¿Estás seguro de eliminar este cantoral? Esta acción no se puede deshacer."
        details={pendingDeleteCantoral ? `${pendingDeleteCantoral.parishName} · ${pendingDeleteCantoral.liturgicalDate} · ${pendingDeleteCantoral.massTime}` : undefined}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId && onDelete) {
            onDelete(pendingDeleteId);
          }
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
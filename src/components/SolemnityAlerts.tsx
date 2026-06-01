import { useEffect, useState } from 'react';
import { Bell, X, Calendar, Church } from 'lucide-react';
import { LiturgicalEvent, getUpcomingSolemnities } from '../data/liturgicalCalendar';

export function SolemnityAlerts() {
  const [alerts, setAlerts] = useState<LiturgicalEvent[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedSolemnityAlerts');
    if (dismissed) setDismissedAlerts(JSON.parse(dismissed));
    setAlerts(getUpcomingSolemnities(28));
  }, []);

  const dismissAlert = (eventId: string) => {
    const next = [...dismissedAlerts, eventId];
    setDismissedAlerts(next);
    localStorage.setItem('dismissedSolemnityAlerts', JSON.stringify(next));
    setExpanded(false);
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));
  if (visibleAlerts.length === 0) return null;

  const alert = visibleAlerts[0];

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

  const daysUntil = getDaysUntil(alert.date);
  const daysLabel = daysUntil === 0 ? '¡Hoy!' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`;

  return (
    <div className="fixed bottom-3 left-2 right-2 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm z-50 pointer-events-none">
      <div className="pointer-events-auto bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl shadow-xl border-2 border-amber-300 overflow-hidden animate-slide-in-right">

        {/* Cabecera compacta — siempre visible */}
        <div className="flex items-center gap-2 p-3 sm:p-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 animate-ring" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold leading-none truncate">{alert.name}</p>
            <p className="text-xs opacity-90">{daysLabel}</p>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
          >
            {expanded ? 'Cerrar' : 'Ver más'}
          </button>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Detalle expandible */}
        {expanded && (
          <div className="px-3 pb-3 sm:px-4 sm:pb-4 space-y-2">
            <div className="bg-white/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Church className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-sm font-bold">{alert.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
                <span className="capitalize">{formatDate(alert.date)}</span>
              </div>
              {alert.description && (
                <p className="text-xs opacity-90 leading-relaxed">{alert.description}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 bg-white/30 rounded-lg text-xs font-bold">{alert.type}</span>
                <span className="px-2 py-1 bg-white/30 rounded-lg text-xs font-bold">Color: {alert.color}</span>
              </div>
            </div>
            <p className="text-xs font-medium opacity-90">
              💡 Prepara los cantos apropiados para esta celebración
            </p>
            {visibleAlerts.length > 1 && (
              <p className="text-xs opacity-75">+{visibleAlerts.length - 1} alerta(s) más</p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes ring {
          0%,100%{transform:rotate(0deg)}
          10%,30%{transform:rotate(-10deg)}
          20%,40%{transform:rotate(10deg)}
        }
        .animate-slide-in-right { animation: slide-in-right 0.4s ease-out; }
        .animate-ring { animation: ring 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

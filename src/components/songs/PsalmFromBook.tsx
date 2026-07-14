import { BookOpen } from 'lucide-react';
import { UserRole } from '../../types';
import { getSundayCycle } from '../../utils/liturgicalCycle';
import { getLiturgicalDateForDate } from '../../utils/liturgicalCalendar';
import { resolvePsalm } from '../../data/psalmIndex';
import { PdfPages } from '../atril/PdfPages';

/**
 * Salmo responsorial del libro musicalizado, según la celebración de la fecha:
 *  - Coro/Admin → la PARTITURA (página del libro del año A/B/C), más la antífona si hay.
 *  - Pueblo fiel → solo la ANTÍFONA (texto de la respuesta).
 * Si no hay dato para esa celebración, muestra un aviso "pendiente" (nada roto).
 */
export function PsalmFromBook({ date, role, zoom = 1 }: { date?: string; role?: UserRole; zoom?: number }) {
  const isPueblo = role === 'Pueblo fiel';

  const box = 'bg-white/70 dark:bg-white/10 rounded-2xl p-4 border-2 border-amber-200 dark:border-amber-800';
  const head = (
    <div className="flex items-center gap-2 mb-2">
      <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-300 flex-shrink-0" strokeWidth={2.5} />
      <h4 className="text-lg font-bold text-brand-ink">Salmo responsorial</h4>
    </div>
  );

  if (!date) {
    return (
      <div className={box}>
        {head}
        <p className="text-sm text-brand-ink-soft">Elige la fecha de la Misa para cargar el salmo del libro.</p>
      </div>
    );
  }

  const cycle = getSundayCycle(date);
  const celebration = getLiturgicalDateForDate(date);
  const psalm = celebration ? resolvePsalm(cycle, celebration) : null;

  if (!psalm) {
    return (
      <div className={box}>
        {head}
        <p className="text-sm text-brand-ink-soft">
          {celebration
            ? <>Salmo del libro <strong>pendiente</strong> para «{celebration}» (Año {cycle}). Se mostrará cuando esté en el índice.</>
            : <>No hay salmo del libro para esta fecha.</>}
        </p>
      </div>
    );
  }

  const proxyUrl = `/api/pdf?id=${psalm.driveFileId}`;
  const driveViewUrl = `https://drive.google.com/file/d/${psalm.driveFileId}/view`;

  return (
    <div className={box}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-300 flex-shrink-0" strokeWidth={2.5} />
          <h4 className="text-lg font-bold text-brand-ink truncate">Salmo responsorial</h4>
        </div>
        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex-shrink-0">Del libro · Año {cycle}</span>
      </div>

      {/* Antífona (respuesta del pueblo). Visible para todos. */}
      {psalm.antiphon && (
        <p className="text-brand-ink font-semibold leading-relaxed bg-white dark:bg-slate-900 rounded-xl p-3 border border-amber-200 dark:border-amber-800 mb-3">
          <span className="text-amber-700 dark:text-amber-300 font-bold mr-1">R/</span>{psalm.antiphon}
        </p>
      )}

      {/* Partitura (página del libro) — SOLO coro/admin. */}
      {!isPueblo && psalm.page != null && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-2 border border-amber-200 dark:border-amber-800">
          <PdfPages proxyUrl={proxyUrl} driveViewUrl={driveViewUrl} title={`Salmo — ${celebration}`} zoom={zoom} fromPage={psalm.page} toPage={psalm.pageEnd ?? psalm.page} />
        </div>
      )}
      {!isPueblo && psalm.page == null && (
        <p className="text-xs text-brand-ink-soft">Partitura del salmo pendiente en el índice.</p>
      )}
      {isPueblo && !psalm.antiphon && (
        <p className="text-sm text-brand-ink-soft">Antífona pendiente en el índice.</p>
      )}
    </div>
  );
}

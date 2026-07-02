import { useState, useEffect } from 'react';
import { X, Send, Calendar, Church, Clock, Plus, Eye, ExternalLink } from 'lucide-react';
import { Song, InstrumentType, PublishedCantoral } from '../../types';
import { generateCantoralPDF } from '../../utils/cantoralPDFGenerator';
import { getTodayLocal, formatYmdForDisplay, addDaysLocal } from '../../utils/dateLocal';
import { formatActiveParishLabel } from '../../utils/parish';
import { MassType } from '../../types';
import { MASS_TYPE_LABEL, MASS_TYPE_RANGE, MASS_TIME_BY_TYPE } from '../../utils/massType';
import { getLiturgicalDateForDate, getDateForLiturgicalName, isSunday, getLiturgicalDateNames } from '../../utils/liturgicalCalendar';
import { LiturgicalColorBadge } from '../liturgy/LiturgicalColorBadge';
import { validateCantoral, LiturgicalWarning } from '../../utils/liturgicalValidation';
import { AddSolemnityModal } from '../liturgy/AddSolemnityModal';
import { addCustomLiturgicalDate, toLiturgicalDate, GLOBAL_SCOPE } from '../../services/liturgicalDates';
import { setPersistedCustomDates, getPersistedCustomDates } from '../../utils/liturgicalCalendar';
import { CantoralPDFPreview } from './CantoralPDFPreview';
import { PostPublishModal } from './PostPublishModal';
import { PdfBlobViewer } from './PdfBlobViewer';
import { GARLANDS, DEFAULT_GARLAND_ID } from '../../data/garlands';
import { PDF_FONTS, PDF_SIZES, DEFAULT_PDF_FONT, DEFAULT_PDF_SIZE } from '../../data/pdfStyle';
import { toast } from 'sonner';

/** Destino de publicación: una parroquia con su propia fecha/celebración/horario. */
export interface PublishTarget {
  parishName: string;
  /** Fecha real en que se canta. Para una vespertina, ya es la víspera. */
  date: string;
  liturgicalDate: string;
  massTime: string;
  /** Tipo de horario litúrgico (I Vísperas / del día / II Vísperas). */
  massType: MassType;
  /** Legacy: equivale a massType === 'visperas_i'. */
  vigil: boolean;
  /** Id de la guirnalda elegida para adornar el folleto PDF. */
  garland: string;
  /** Id de la fuente del folleto PDF. */
  pdfFont: string;
  /** Id del tamaño/escala de letra del folleto PDF. */
  pdfSize: string;
}

interface PublishCantoralModalProps {
  cantoral: Song[];
  /** Parroquia activa — usada como destino por defecto y en el modo de una sola parroquia. */
  parishName: string;
  /** Conjunto completo de parroquias del coro. Si tiene >1, se habilita el modo multi-parroquia. */
  parishes?: string[];
  /** Admin verificado: sus celebraciones agregadas son globales (para todos los usuarios). */
  isAdmin?: boolean;
  onClose: () => void;
  onPublish: (targets: PublishTarget[]) => Promise<void> | void;
  userInstruments?: InstrumentType[];
}

interface CustomLiturgicalDate {
  name: string;
  date: string;
}

/** Estado por parroquia en el modo multi-parroquia. */
interface ParishSchedule {
  date: string;
  liturgicalDate: string;
  massTime: string;
  /** Tipo de horario litúrgico (I Vísperas / del día / II Vísperas). */
  massType: MassType;
  /** Legacy: equivale a massType === 'visperas_i'. */
  vigil: boolean;
}

/** Q38 — Normaliza horarios variados al formato 'HH:MM AM/PM' canónico. */
function normalizeMassTime(raw: string): string {
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  if (!trimmed) return raw;
  // Match HH:MM with optional AM/PM
  const m = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!m) return trimmed; // unknown format, leave as-is
  const h = parseInt(m[1], 10);
  const min = m[2].padStart(2, '0');
  const period = m[3] ?? (h >= 12 ? 'PM' : 'AM');
  const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${String(displayH).padStart(2, '0')}:${min} ${period}`;
}

export function PublishCantoralModal({ cantoral, parishName, parishes = [], isAdmin = false, onClose, onPublish, userInstruments = [] }: PublishCantoralModalProps) {
  // Lista efectiva de parroquias (con fallback a la activa). >1 ⇒ modo multi-parroquia.
  const allParishes = parishes.length > 0 ? parishes : (parishName ? [parishName] : []);
  const isMulti = allParishes.length > 1;

  // ── Estado modo una sola parroquia ────────────────────────────────────────
  // Use local-timezone today to avoid the user in a negative-offset TZ
  // (Chile, México, Argentina) publishing for "tomorrow" when it's 22:00.
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [liturgicalDate, setLiturgicalDate] = useState('');
  const [massTime, setMassTime] = useState('');
  // Tipo de horario litúrgico: I Vísperas (tarde del día anterior), Misa del día
  // (mismo día 00–15h) o II Vísperas (mismo día 15:01–23:59). Para I Vísperas la
  // fecha publicada es el día anterior (se muestra antes de publicar).
  const [massType, setMassType] = useState<MassType>('dia');
  const [dateChangeSource, setDateChangeSource] = useState<'calendar' | 'liturgical' | null>(null);

  // ── Estado modo multi-parroquia ───────────────────────────────────────────
  // Parroquias marcadas para publicar (por defecto, solo la activa).
  const [selectedParishes, setSelectedParishes] = useState<Set<string>>(
    () => new Set(parishName ? [parishName] : [])
  );
  // Fecha/celebración/horario por parroquia.
  const [schedules, setSchedules] = useState<Record<string, ParishSchedule>>(() => {
    const today = getTodayLocal();
    // Auto-derivar la celebración de hoy (si es domingo/solemnidad del calendario)
    // para no obligar a re-elegir la fecha cuando ya es la correcta.
    const todayLiturgical = getLiturgicalDateForDate(today) || '';
    const init: Record<string, ParishSchedule> = {};
    allParishes.forEach(p => { init[p] = { date: today, liturgicalDate: todayLiturgical, massTime: '', massType: 'dia', vigil: false }; });
    return init;
  });

  // ── Estado compartido ─────────────────────────────────────────────────────
  // Guirnalda elegida para adornar el folleto PDF (común a todos los destinos).
  const [garland, setGarland] = useState<string>(DEFAULT_GARLAND_ID);
  // Fuente y tamaño de letra del folleto PDF (editables por el usuario).
  const [pdfFont, setPdfFont] = useState<string>(DEFAULT_PDF_FONT);
  const [pdfSize, setPdfSize] = useState<string>(DEFAULT_PDF_SIZE);
  // Vista previa del folleto (PDF real con la guirnalda) antes de publicar.
  // `previewBlob` se renderiza en canvas con PDF.js; `previewUrl` es solo para el
  // botón de descarga (el CSP no permite blob: en <iframe>).
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [showAddSolemnityModal, setShowAddSolemnityModal] = useState(false);
  const [showDownloadPDFModal, setShowDownloadPDFModal] = useState(false);
  const [showPostPublishModal, setShowPostPublishModal] = useState(false);
  const [customDates, setCustomDates] = useState<CustomLiturgicalDate[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Efectos de sincronización fecha ↔ celebración (solo modo una parroquia) ─
  useEffect(() => {
    if (dateChangeSource === 'calendar') {
      const liturgicalName = getLiturgicalDateForDate(selectedDate);

      if (liturgicalName) {
        setLiturgicalDate(liturgicalName);
        toast.success('Celebración encontrada', { description: liturgicalName });
      } else if (isSunday(selectedDate)) {
        toast.info('Domingo no encontrado', {
          description: 'Agrega la celebración para este domingo',
          action: { label: 'Agregar', onClick: () => setShowAddSolemnityModal(true) }
        });
        setLiturgicalDate('');
      } else {
        toast.warning('Fecha no litúrgica', {
          description: 'La fecha seleccionada no corresponde a un domingo. Agrega la celebración especial.',
          action: { label: 'Agregar', onClick: () => setShowAddSolemnityModal(true) }
        });
        setLiturgicalDate('');
      }
    }
    setDateChangeSource(null);
  }, [dateChangeSource, selectedDate]);

  useEffect(() => {
    if (dateChangeSource === 'liturgical' && liturgicalDate) {
      const currentYear = new Date(selectedDate).getFullYear();
      const date = getDateForLiturgicalName(liturgicalDate, currentYear);

      if (date) {
        setSelectedDate(date);
        toast.success('Fecha encontrada', {
          description: formatYmdForDisplay(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        });
      } else {
        const customDate = customDates.find(cd => cd.name === liturgicalDate);
        if (customDate) setSelectedDate(customDate.date);
      }
    }
    setDateChangeSource(null);
  }, [dateChangeSource, liturgicalDate, customDates]);

  // ── Helpers modo multi-parroquia ──────────────────────────────────────────
  const toggleParish = (parish: string) => {
    setSelectedParishes(prev => {
      const next = new Set(prev);
      if (next.has(parish)) next.delete(parish); else next.add(parish);
      return next;
    });
  };

  const allSelected = allParishes.length > 0 && allParishes.every(p => selectedParishes.has(p));
  const toggleSelectAll = () => {
    setSelectedParishes(allSelected ? new Set() : new Set(allParishes));
  };

  const updateSchedule = (parish: string, patch: Partial<ParishSchedule>) => {
    setSchedules(prev => ({ ...prev, [parish]: { ...prev[parish], ...patch } }));
  };

  // Cambiar la fecha de una parroquia auto-deriva su celebración litúrgica (si existe
  // en el calendario). Sin toasts para no spamear cuando hay varias parroquias.
  const setParishDate = (parish: string, date: string) => {
    const derived = getLiturgicalDateForDate(date);
    updateSchedule(parish, { date, liturgicalDate: derived || schedules[parish]?.liturgicalDate || '' });
  };

  // ── Publicar ──────────────────────────────────────────────────────────────
  // Fecha base = la fecha CANÓNICA de la celebración elegida (si se reconoce en el
  // calendario o en las solemnidades agregadas), NO la que haya quedado en el campo.
  // Así I Vísperas siempre cae el día correcto aunque el campo de fecha no se haya
  // sincronizado. Si la celebración no se reconoce, usa la fecha del campo.
  const canonicalBaseDate = (litName: string, fallbackDate: string): string => {
    const name = (litName || '').trim();
    if (!name) return fallbackDate;
    const year = new Date(fallbackDate || getTodayLocal()).getFullYear();
    const derived = getDateForLiturgicalName(name, year);
    if (derived) return derived;
    const custom = customDates.find(cd => cd.name === name);
    return custom?.date || fallbackDate;
  };

  // La fecha que se GUARDA es siempre la del día propio de la celebración (la que
  // elige el usuario / la canónica de la celebración). El ajuste del I Vísperas
  // (que se canta la tarde anterior) lo resuelve la VENTANA DE VIGENCIA, no la fecha.
  const publishDate = (date: string, _type: MassType, litName: string) =>
    canonicalBaseDate(litName, date);

  // Fecha en que efectivamente se canta — solo para el aviso al usuario:
  // I Vísperas = la tarde del día anterior; el resto, el mismo día.
  const singDate = (date: string, type: MassType, litName: string) => {
    const base = canonicalBaseDate(litName, date);
    return type === 'visperas_i' ? addDaysLocal(base, -1) : base;
  };

  const buildTargets = (): PublishTarget[] => {
    if (isMulti) {
      return Array.from(selectedParishes).map(parish => {
        const s = schedules[parish];
        return {
          parishName: parish,
          date: publishDate(s.date, s.massType, s.liturgicalDate),
          liturgicalDate: s.liturgicalDate.trim(),
          massTime: normalizeMassTime(s.massTime),
          massType: s.massType,
          vigil: s.massType === 'visperas_i',
          garland,
          pdfFont,
          pdfSize,
        };
      });
    }
    return [{
      parishName: allParishes[0] || parishName,
      date: publishDate(selectedDate, massType, liturgicalDate),
      liturgicalDate: liturgicalDate.trim(),
      massTime: normalizeMassTime(massTime),
      massType,
      vigil: massType === 'visperas_i',
      garland,
      pdfFont,
      pdfSize,
    }];
  };

  const canPublish = (() => {
    if (isPublishing || cantoral.length === 0) return false;
    if (isMulti) {
      if (selectedParishes.size === 0) return false;
      return Array.from(selectedParishes).every(p => {
        const s = schedules[p];
        return !!s && !!s.date && !!s.liturgicalDate && !!s.massTime;
      });
    }
    return !!selectedDate && !!liturgicalDate && !!massTime;
  })();

  const handlePublish = async () => {
    if (!canPublish || isPublishing) return;
    setIsPublishing(true);
    try {
      // Await the full pipeline: DB insert(s) + PDF gen + Storage upload + QR dialog
      await onPublish(buildTargets());
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Vista previa del folleto (PDF real con la guirnalda) antes de publicar ──
  // Arma un cantoral temporal con la guirnalda elegida y el primer destino, y genera
  // el PDF del Pueblo fiel SIN descargarlo para mostrarlo en un visor.
  const buildPreviewCantoral = (): PublishedCantoral => {
    const p = isMulti
      ? (Array.from(selectedParishes)[0] ?? allParishes[0] ?? parishName)
      : (allParishes[0] || parishName);
    const s = isMulti ? schedules[p] : undefined;
    return {
      id: 'preview',
      choirId: '',
      choirName: 'Mi Coro',
      parishName: p,
      date: (s?.date || selectedDate) || getTodayLocal(),
      liturgicalDate: (s?.liturgicalDate ?? liturgicalDate) || '',
      massTime: (s?.massTime ?? massTime) || '',
      massType: s?.massType ?? massType,
      songs: cantoral,
      status: 'published',
      createdAt: new Date().toISOString(),
      garland,
      pdfFont,
      pdfSize,
    };
  };

  const handlePreview = async () => {
    if (generatingPreview || cantoral.length === 0) return;
    setGeneratingPreview(true);
    try {
      const { blob, url } = await generateCantoralPDF({ cantoral: buildPreviewCantoral(), download: false });
      setPreviewBlob(blob);
      setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch (e: any) {
      toast.error('No se pudo generar la vista previa', { description: e?.message });
    } finally {
      setGeneratingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewBlob(null);
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
  };

  // Liberar el object URL del preview al desmontar / al cambiar.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // Opciones de celebración litúrgica para un año dado (+ solemnidades custom).
  const liturgicalOptions = (year: number) => [
    ...getLiturgicalDateNames(year),
    ...customDates.map(cd => cd.name),
  ];

  // Aviso: la fecha EFECTIVA en que se publica (ya con el ajuste de I Vísperas)
  // quedó en el pasado → el Pueblo fiel no lo verá (solo muestra de hoy en adelante).
  const pastPublishDates = (() => {
    const today = getTodayLocal();
    const eff = isMulti
      ? Array.from(selectedParishes).map(p => singDate(schedules[p]?.date || '', schedules[p]?.massType || 'dia', schedules[p]?.liturgicalDate || ''))
      : [singDate(selectedDate, massType, liturgicalDate)];
    return eff.filter(d => d && d < today);
  })();
  const hasPastPublishDate = pastPublishDates.length > 0;

  // Revisión litúrgica (avisos no bloqueantes) para la(s) fecha(s) destino.
  const liturgicalWarnings: LiturgicalWarning[] = (() => {
    const dates = isMulti
      ? Array.from(new Set(Array.from(selectedParishes).map(p => schedules[p]?.date).filter(Boolean)))
      : (selectedDate ? [selectedDate] : []);
    const seen = new Set<string>();
    const merged: LiturgicalWarning[] = [];
    for (const d of dates) {
      for (const w of validateCantoral(cantoral, { date: d as string })) {
        const key = `${w.code}|${w.message}`;
        if (!seen.has(key)) { seen.add(key); merged.push(w); }
      }
    }
    return merged;
  })();

  return (
    <>
      {!showDownloadPDFModal && !showAddSolemnityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
              // No permitir cerrar el modal accidentalmente mientras se está publicando —
              // el backend está procesando upload de PDF + DB insert y cerrar a medio
              // camino podría dejar al usuario sin ver el QR.
              if (!isPublishing) onClose();
            }}
          />
          <div
            className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900 dark:to-orange-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border-4 border-brand-border transition-colors overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — fixed top of the flex column */}
            <div className="flex-shrink-0 bg-gradient-to-r from-brand to-brand-strong text-white p-6 z-10 border-b-4 border-brand-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Send className="w-10 h-10" strokeWidth={2.5} />
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Publicar Cantoral</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-8 h-8" strokeWidth={2.5} />
                </button>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm border border-white/30">
                <span className="text-lg font-bold">{cantoral.length} cantos listos para publicar</span>
              </div>
            </div>

            {/* Content — scrollable middle region of the flex column */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-6">
              {isMulti ? (
                /* ── Modo multi-parroquia: elegir parroquias + fecha/horario por cada una ── */
                <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center border-2 border-brand-border flex-shrink-0">
                      <Church className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-bold text-brand-ink">¿A qué parroquias?</div>
                      <div className="text-sm text-blue-900 dark:text-blue-200">
                        Mismos cantos; indica fecha y horario de cada misa.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={toggleSelectAll}
                    className="mb-3 text-sm font-bold text-blue-800 dark:text-blue-200 underline"
                  >
                    {allSelected ? 'Quitar todas' : 'Seleccionar todas'}
                  </button>

                  <div className="space-y-3">
                    {allParishes.map((parish) => {
                      const checked = selectedParishes.has(parish);
                      const s = schedules[parish];
                      const year = new Date(s?.date || getTodayLocal()).getFullYear();
                      return (
                        <div
                          key={parish}
                          className={`rounded-xl border-2 transition-colors ${
                            checked
                              ? 'border-blue-600 dark:border-blue-400 bg-white/60 dark:bg-white/10'
                              : 'border-white/50 dark:border-white/20 bg-white/30 dark:bg-white/5'
                          }`}
                        >
                          <label className="flex items-center gap-3 p-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleParish(parish)}
                              className="w-5 h-5 rounded border-2 border-blue-600 dark:border-blue-400 accent-blue-600 cursor-pointer flex-shrink-0"
                            />
                            <span className="text-base font-bold text-brand-ink break-words">{formatActiveParishLabel(parish)}</span>
                          </label>

                          {checked && (
                            <div className="px-3 pb-4 pt-1 space-y-3 border-t-2 border-white/50 dark:border-white/10">
                              {/* Fecha */}
                              <div>
                                <label className="flex items-center gap-2 mb-1 text-sm font-bold text-brand-ink">
                                  <Calendar className="w-4 h-4" /> Fecha de la Misa
                                </label>
                                <input
                                  type="date"
                                  value={s.date}
                                  onChange={(e) => setParishDate(parish, e.target.value)}
                                  className="w-full px-3 py-3 text-base rounded-lg border-2 border-blue-300 dark:border-white/20 focus:outline-none focus:border-blue-600 bg-white/70 dark:bg-white/10 text-brand-ink font-bold"
                                />
                              </div>
                              {/* Celebración litúrgica */}
                              <div>
                                <label className="flex items-center gap-2 mb-1 text-sm font-bold text-brand-ink">
                                  📖 Calendario Litúrgico
                                </label>
                                <select
                                  value={s.liturgicalDate}
                                  onChange={(e) => updateSchedule(parish, { liturgicalDate: e.target.value })}
                                  className="w-full px-3 py-3 text-base rounded-lg border-2 border-blue-300 dark:border-white/20 focus:outline-none focus:border-blue-600 bg-white/70 dark:bg-white/10 text-brand-ink font-bold"
                                >
                                  <option value="">Seleccionar...</option>
                                  {liturgicalOptions(year).map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </select>
                              </div>
                              {/* Tipo de horario litúrgico */}
                              <div>
                                <label className="flex items-center gap-2 mb-1 text-sm font-bold text-brand-ink">
                                  🕯️ Tipo de Misa
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['visperas_i', 'dia', 'visperas_ii'] as MassType[]).map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => updateSchedule(parish, { massType: t, vigil: t === 'visperas_i', massTime: '' })}
                                      className={`px-2 py-2 rounded-lg text-xs font-bold border-2 transition-all active:scale-95 leading-tight ${
                                        s.massType === t
                                          ? 'bg-gradient-to-br from-blue-700 to-blue-900 text-white border-brand-border'
                                          : 'bg-white/60 dark:bg-white/10 text-brand-ink border-blue-200 dark:border-white/20'
                                      }`}
                                    >
                                      {MASS_TYPE_LABEL[t]}
                                    </button>
                                  ))}
                                </div>
                                {(s.date || s.liturgicalDate) && (
                                  <p className="mt-1.5 text-xs text-purple-800 dark:text-purple-300">
                                    Se canta el <strong>{formatYmdForDisplay(singDate(s.date, s.massType, s.liturgicalDate), { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                                    {s.massType === 'visperas_i' ? ' por la tarde (I Vísperas)' : s.massType === 'visperas_ii' ? ' por la tarde (II Vísperas)' : ''}.
                                  </p>
                                )}
                              </div>
                              {/* Horario */}
                              <div>
                                <label className="flex items-center gap-2 mb-1 text-sm font-bold text-brand-ink">
                                  <Clock className="w-4 h-4" /> Horario de la Misa
                                </label>
                                <select
                                  value={s.massTime}
                                  onChange={(e) => updateSchedule(parish, { massTime: e.target.value })}
                                  className="w-full px-3 py-3 text-base rounded-lg border-2 border-blue-300 dark:border-white/20 focus:outline-none focus:border-blue-600 bg-white/70 dark:bg-white/10 text-brand-ink font-bold"
                                >
                                  <option value="">Seleccionar...</option>
                                  {MASS_TIME_BY_TYPE[s.massType].map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── Modo una sola parroquia (comportamiento original) ── */
                <>
                  {/* Parish Name */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center border-2 border-brand-border">
                        <Church className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-sm text-blue-900 dark:text-blue-200">Parroquia</div>
                        <div className="text-xl font-bold text-brand-ink">{formatActiveParishLabel(parishName)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center border-2 border-brand-border">
                        <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-xl font-bold text-brand-ink">Fecha de la Misa</span>
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setDateChangeSource('calendar');
                      }}
                      className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/60 dark:bg-white/10 text-brand-ink font-bold shadow-lg transition-colors"
                    />
                  </div>

                  {/* Liturgical Date Selection */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center border-2 border-brand-border">
                        <span className="text-xl">📖</span>
                      </div>
                      <span className="text-xl font-bold text-brand-ink">Calendario Litúrgico</span>
                    </label>
                    <select
                      value={liturgicalDate}
                      onChange={(e) => {
                        setLiturgicalDate(e.target.value);
                        setDateChangeSource('liturgical');
                      }}
                      className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/60 dark:bg-white/10 text-brand-ink font-bold shadow-lg transition-colors"
                    >
                      <option value="">Seleccionar...</option>
                      {liturgicalOptions(new Date(selectedDate).getFullYear()).map((date) => (
                        <option key={date} value={date}>
                          {date}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <p className="text-sm text-blue-900 dark:text-blue-200 transition-colors">
                        Selecciona el tiempo litúrgico correspondiente
                      </p>
                      {selectedDate && <LiturgicalColorBadge date={selectedDate} />}
                    </div>
                    <button
                      onClick={() => setShowAddSolemnityModal(true)}
                      className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200 mt-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar solemnidad
                    </button>
                  </div>

                  {/* Tipo de horario litúrgico: I Vísperas / del día / II Vísperas */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center border-2 border-brand-border">
                        <span className="text-xl">🕯️</span>
                      </div>
                      <span className="text-xl font-bold text-brand-ink">Tipo de Misa</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['visperas_i', 'dia', 'visperas_ii'] as MassType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setMassType(t); setMassTime(''); }}
                          className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${
                            massType === t
                              ? 'bg-gradient-to-br from-blue-700 to-blue-900 text-white border-brand-border shadow-lg'
                              : 'bg-white/60 dark:bg-white/10 text-brand-ink border-blue-200 dark:border-white/20'
                          }`}
                        >
                          <span className="block font-bold text-sm leading-tight">{MASS_TYPE_LABEL[t]}</span>
                          <span className={`block text-[11px] mt-0.5 leading-tight ${massType === t ? 'text-blue-100' : 'text-blue-700 dark:text-blue-300'}`}>
                            {MASS_TYPE_RANGE[t]}
                          </span>
                        </button>
                      ))}
                    </div>
                    {(selectedDate || liturgicalDate) && (
                      <div className="mt-3 bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-3 flex gap-2">
                        <span className="text-lg">📅</span>
                        <p className="text-sm text-purple-900 dark:text-purple-200">
                          Se canta el <strong>{formatYmdForDisplay(singDate(selectedDate, massType, liturgicalDate), { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                          {massType === 'visperas_i' ? ' por la tarde (I Vísperas)' : massType === 'visperas_ii' ? ' por la tarde (II Vísperas)' : ''}
                          {liturgicalDate ? <> · {liturgicalDate}</> : null}.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Mass Time Selection */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center border-2 border-brand-border">
                        <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-xl font-bold text-brand-ink">Horario de la Misa</span>
                    </label>
                    <select
                      value={massTime}
                      onChange={(e) => setMassTime(e.target.value)}
                      className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/60 dark:bg-white/10 text-brand-ink font-bold shadow-lg transition-colors"
                    >
                      <option value="">Seleccionar...</option>
                      {MASS_TIME_BY_TYPE[massType].map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-blue-900 dark:text-blue-200 mt-2 transition-colors">
                      {MASS_TYPE_RANGE[massType]}
                    </p>
                  </div>
                </>
              )}

              {/* Aviso de fecha en el pasado — el Pueblo fiel no lo vería */}
              {hasPastPublishDate && (
                <div className="bg-red-50 dark:bg-red-950/40 rounded-2xl p-4 border-2 border-red-300 dark:border-red-700 transition-colors">
                  <div className="flex gap-2">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h4 className="text-base font-bold text-red-900 dark:text-red-100 mb-1">La fecha de la Misa ya pasó</h4>
                      <p className="text-sm text-red-900 dark:text-red-200">
                        Se publicaría para el <strong>{formatYmdForDisplay(pastPublishDates[0], { weekday: 'long', day: 'numeric', month: 'long' })}</strong>,
                        que es anterior a hoy. El Pueblo fiel solo ve cantorales de hoy en adelante, así que <strong>no aparecerá</strong> en su lista.
                        {massType === 'visperas_i' && ' Revisa que la celebración y su fecha sean las correctas (I Vísperas publica el día anterior).'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Revisión litúrgica — avisos no bloqueantes */}
              {liturgicalWarnings.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-4 border-2 border-amber-300 dark:border-amber-700 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📋</span>
                    <h4 className="text-base font-bold text-amber-950 dark:text-amber-100">Revisión litúrgica</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {liturgicalWarnings.map((w, i) => (
                      <li key={i} className="flex gap-2 text-sm text-amber-900 dark:text-amber-200">
                        <span>{w.level === 'warn' ? '⚠️' : 'ℹ️'}</span>
                        <span>{w.message}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
                    Son sugerencias; puedes publicar igualmente.
                  </p>
                </div>
              )}

              {/* Preview */}
              <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border-2 border-white/40 dark:border-white/20 transition-colors">
                <div className="flex gap-3 items-start">
                  <div className="text-2xl flex-shrink-0 leading-none mt-0.5">ℹ️</div>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-brand-ink mb-1">Vista previa</h4>
                    <p className="text-sm text-brand-ink-soft leading-relaxed">
                      {isMulti
                        ? `Se publicará el mismo cantoral en ${selectedParishes.size} parroquia${selectedParishes.size === 1 ? '' : 's'}, con la fecha y horario de cada misa.`
                        : 'Este cantoral estará disponible para que los fieles de tu parroquia puedan seguir la liturgia con los cantos seleccionados.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adorno del folleto — guirnalda para los títulos del PDF */}
              <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center border-2 border-brand-border flex-shrink-0">
                    <span className="text-xl">🎨</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-brand-ink">Adorno del folleto</div>
                    <div className="text-sm text-blue-900 dark:text-blue-200">Elige la guirnalda que decorará los títulos del PDF</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {GARLANDS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGarland(g.id)}
                      aria-pressed={garland === g.id}
                      className={`w-full rounded-xl border-2 p-2 transition-all active:scale-[0.99] ${
                        garland === g.id
                          ? 'border-blue-600 dark:border-blue-400 bg-white/70 dark:bg-white/15 ring-2 ring-blue-400/40'
                          : 'border-white/50 dark:border-white/20 bg-white/30 dark:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 px-1">
                        <span className="text-sm font-bold text-brand-ink">{g.name}</span>
                        {garland === g.id && <span className="text-xs font-bold text-blue-700 dark:text-blue-300">✓ Elegida</span>}
                      </div>
                      <img src={g.src} alt={g.name} loading="lazy" className="w-full h-auto rounded-md bg-white" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Letra del folleto — fuente y tamaño editables */}
              <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center border-2 border-brand-border flex-shrink-0">
                    <span className="text-xl">🔤</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-brand-ink">Letra del folleto</div>
                    <div className="text-sm text-blue-900 dark:text-blue-200">Elige la fuente y el tamaño de la letra del PDF</div>
                  </div>
                </div>

                <div className="text-sm font-bold text-brand-ink mb-1.5">Fuente</div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {PDF_FONTS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPdfFont(f.id)}
                      aria-pressed={pdfFont === f.id}
                      className={`px-2 py-2 rounded-lg text-xs font-bold border-2 transition-all active:scale-95 leading-tight ${
                        pdfFont === f.id
                          ? 'bg-gradient-to-br from-blue-700 to-blue-900 text-white border-brand-border'
                          : 'bg-white/60 dark:bg-white/10 text-brand-ink border-blue-200 dark:border-white/20'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>

                <div className="text-sm font-bold text-brand-ink mb-1.5">Tamaño de letra</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PDF_SIZES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPdfSize(s.id)}
                      aria-pressed={pdfSize === s.id}
                      className={`px-2 py-2 rounded-lg text-xs font-bold border-2 transition-all active:scale-95 ${
                        pdfSize === s.id
                          ? 'bg-gradient-to-br from-blue-700 to-blue-900 text-white border-brand-border'
                          : 'bg-white/60 dark:bg-white/10 text-brand-ink border-blue-200 dark:border-white/20'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-2">
                  Tip: usa "Vista previa del folleto" para ver cómo queda antes de publicar.
                </p>
              </div>

              {/* Folleto PDF Info */}
              <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950 dark:to-green-900 rounded-2xl p-5 border-2 border-green-300 dark:border-green-700 shadow-lg transition-colors">
                <div className="flex gap-3 items-start">
                  <div className="text-2xl flex-shrink-0 leading-none mt-0.5">📖</div>
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-bold text-green-950 dark:text-green-100 mb-1">
                      Folleto digital para el coro
                    </h4>
                    <p className="text-sm sm:text-base text-green-900 dark:text-green-200 leading-relaxed">
                      Al publicar podrás descargar un PDF con todos los cantos ordenados por momento de la Misa,
                      ideal para el coro que prefiere el folleto descargado sin abrir la app durante la celebración.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer — fixed bottom of the flex column. Stays visible even
                when the mobile virtual keyboard shrinks the viewport. */}
            <div className="flex-shrink-0 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950 border-t-4 border-brand-border p-3 sm:p-5" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
              {/* Vista previa del folleto (PDF real con la guirnalda) antes de publicar */}
              <button
                onClick={handlePreview}
                disabled={cantoral.length === 0 || generatingPreview || isPublishing}
                className="w-full mb-3 bg-white/70 dark:bg-white/15 text-brand-ink py-3 px-4 rounded-xl font-bold text-base border-2 border-blue-300 dark:border-white/25 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generatingPreview ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Generando vista previa…
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    Vista previa del folleto
                  </>
                )}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isPublishing}
                  className="flex-1 bg-white/50 dark:bg-white/20 text-brand-ink py-4 px-4 rounded-xl font-bold text-lg hover:bg-white/70 dark:hover:bg-white/30 transition-colors border-2 border-white/60 dark:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className={`flex-1 py-4 px-4 rounded-xl font-bold text-lg transition-all border-2 ${
                    canPublish
                      ? 'bg-gradient-to-r from-brand to-brand-strong text-white hover:shadow-lg active:scale-95 border-brand-border'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isPublishing ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Publicando…
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {isMulti ? `Publicar en ${selectedParishes.size || ''} ${selectedParishes.size === 1 ? 'parroquia' : 'parroquias'}` : 'Publicar'}
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showAddSolemnityModal && (
        <AddSolemnityModal
          selectedDate={selectedDate}
          isAdmin={isAdmin}
          parishes={allParishes}
          onClose={() => setShowAddSolemnityModal(false)}
          onAdd={async (name, date, scope, type) => {
            // Uso inmediato en esta sesión (aunque el guardado tarde/falle).
            setCustomDates([...customDates, { name, date }]);
            setLiturgicalDate(name);
            setShowAddSolemnityModal(false);
            // Persistir: Admin → global (todos); Coro → su parroquia/capilla.
            const r = await addCustomLiturgicalDate({ name, date, type, scope });
            if (r.ok && r.row) {
              // Reflejar en el caché del calendario → aparece en toda la app.
              setPersistedCustomDates([...getPersistedCustomDates(), toLiturgicalDate(r.row)]);
              toast.success('Celebración agregada', {
                description: scope === GLOBAL_SCOPE
                  ? 'Guardada para todos los usuarios.'
                  : `Guardada para ${scope}.`,
              });
            } else {
              toast.warning('Celebración agregada solo en esta sesión', {
                description: r.error || 'No se pudo guardar en el servidor.',
              });
            }
          }}
        />
      )}
      {showDownloadPDFModal && (
        <CantoralPDFPreview
          cantoral={cantoral}
          parishName={parishName}
          date={selectedDate}
          celebration={liturgicalDate}
          massTime={massTime}
          userInstruments={userInstruments}
          garland={garland}
          pdfFont={pdfFont}
          pdfSize={pdfSize}
          onClose={() => {
            setShowDownloadPDFModal(false);
            onClose(); // Cerrar también el modal de publicación
          }}
        />
      )}
      {showPostPublishModal && (
        <PostPublishModal
          onContinueInApp={() => {
            setShowPostPublishModal(false);
            onClose(); // Cerrar todo y continuar en la app
          }}
          onDownloadPDF={() => {
            setShowPostPublishModal(false);
            setShowDownloadPDFModal(true); // Mostrar vista previa del folleto
          }}
        />
      )}

      {/* Visor de vista previa del folleto (PDF real con la guirnalda), en canvas */}
      {previewBlob && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-shrink-0 bg-gradient-to-r from-brand to-brand-strong text-white p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold truncate">Vista previa del folleto</h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {previewUrl && (
                <a
                  href={previewUrl}
                  download="Cantoral-vista-previa.pdf"
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Descargar
                </a>
              )}
              <button
                onClick={closePreview}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Cerrar vista previa"
              >
                <X className="w-7 h-7" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <PdfBlobViewer blob={previewBlob} />
          <div
            className="flex-shrink-0 bg-white dark:bg-slate-900 border-t-4 border-brand-border p-3 flex gap-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              onClick={closePreview}
              className="flex-1 bg-gray-100 dark:bg-slate-700 text-brand-ink py-3 px-4 rounded-xl font-bold border-2 border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Volver a editar
            </button>
            <button
              onClick={() => { closePreview(); handlePublish(); }}
              disabled={!canPublish}
              className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition-all ${
                canPublish
                  ? 'bg-gradient-to-r from-brand to-brand-strong text-white border-brand-border hover:shadow-lg active:scale-95'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" /> Publicar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

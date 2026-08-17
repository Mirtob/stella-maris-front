import { FolderOpen, Folder, X, Check, RefreshCw, Sparkles, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MomentChips, SearchField } from './SheetSearchControls';
import { FULL_SCORE, type SongSheet } from '../../utils/sheetParts';
import {
  buildFolderOptions, scoreByTitle, filterFolderOptions, momentCounts, suggestedFolder,
  type DriveFile, type DriveFolder, type FolderOption,
} from '../../utils/sheetFolderSearch';

/** Cuántas carpetas se pintan de una vez: más que esto no se lee, se busca. */
const MAX_VISIBLE = 40;

interface Props {
  /** Carpetas del Drive de partituras (las trae /api/sheets). */
  folders: DriveFolder[];
  /** Archivos del mismo Drive: de ahí salen los PDF de cada carpeta. */
  files: DriveFile[];
  loading: boolean;
  /** Etiquetas de los momentos de la Misa, en orden (MOMENT_OPTIONS del formulario). */
  momentLabels: string[];
  /** Momento del canto que se está cargando: sus carpetas se muestran primero. */
  currentMomentLabel?: string;
  /** Título escrito en el formulario: con él se sugiere la carpeta sola. */
  songTitle: string;
  /** Carpeta elegida (driveFolderId). */
  value: string;
  /** Voces ya detectadas en esa carpeta. */
  sheets: SongSheet[];
  /** Elegir carpeta (o '' para quitarla). El formulario hace la detección. */
  onPick: (folderId: string) => void;
}

/**
 * Selector de la carpeta de Drive con las partituras por voz de un canto.
 *
 * Antes era un `<select>` con TODAS las carpetas del Drive: manejable con veinte,
 * inservible con cientos. Ahora se busca como se busca de verdad —por el nombre del
 * canto— y además:
 *
 *  - sugiere sola la carpeta que se llama como el título escrito ("Usar esta");
 *  - filtra por momento de la Misa, arrancando por el del canto;
 *  - esconde las carpetas sin PDF (las que aún no tienen nada que enlazar);
 *  - muestra en cada fila cuántos PDF hay y qué voces se detectan, para no tener que
 *    elegirla, ver el resultado y volver atrás.
 */
export function VoiceSheetPicker({
  folders, files, loading, momentLabels, currentMomentLabel, songTitle, value, sheets, onPick,
}: Props) {
  const [query, setQuery] = useState('');
  const [moment, setMoment] = useState<string>('');
  const [onlyWithPdf, setOnlyWithPdf] = useState(true);
  // Con carpeta ya elegida el buscador arranca plegado: lo normal es no volver a tocarlo.
  const [changing, setChanging] = useState(false);

  // El recorrido del Drive se hace una vez; el parecido con el título, en cada tecla.
  const catalog = useMemo(
    () => buildFolderOptions(folders, files, { momentLabels }),
    [folders, files, momentLabels],
  );
  const options = useMemo(() => scoreByTitle(catalog, songTitle), [catalog, songTitle]);
  const selected = options.find(o => o.id === value);
  const counts = useMemo(
    () => momentCounts(options, momentLabels, onlyWithPdf),
    [options, momentLabels, onlyWithPdf],
  );
  const results = useMemo(
    () => filterFolderOptions(options, { query, moment, onlyWithPdf }, currentMomentLabel),
    [options, query, moment, onlyWithPdf, currentMomentLabel],
  );
  // La sugerencia por título se calcula sobre TODO el Drive, no sobre lo filtrado: si la
  // carpeta del canto está en otro momento, igual debe ofrecerse.
  const suggestion = useMemo(
    () => (value ? undefined : suggestedFolder(options)),
    [options, value],
  );

  const pick = (id: string) => {
    onPick(id);
    setChanging(false);
  };

  /** Fila de la lista: nombre + dónde vive + qué trae dentro. */
  const row = (o: FolderOption) => {
    const isSelected = o.id === value;
    return (
      <button
        key={o.id}
        type="button"
        onClick={() => pick(o.id)}
        className={`w-full text-left px-3 py-2 rounded-xl border-2 active:scale-[0.99] transition-all ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
            : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-300" />
          <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{o.name}</span>
          {isSelected && <Check className="w-4 h-4 shrink-0 text-blue-600" strokeWidth={3} />}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 pl-6">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {o.moment}{o.subPath ? ` / ${o.subPath}` : ''}
          </span>
          {o.pdfCount > 0 && (
            <span className="text-[11px] font-bold text-green-700 dark:text-green-300">
              {o.pdfCount} PDF
            </span>
          )}
          {o.parts.length > 0 && (
            <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
              {o.parts.slice(0, 4).join(' · ')}{o.parts.length > 4 ? ' …' : ''}
            </span>
          )}
          {o.childFolders > 0 && (
            <span className="text-[11px] text-amber-700 dark:text-amber-300">
              agrupa {o.childFolders} carpeta{o.childFolders === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-3">
      <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
        Partituras por voz <span className="text-gray-400">(polifonía — opcional)</span>
      </label>

      {/* Carpeta elegida: qué se detectó y cómo cambiarla. Se muestra aunque la carpeta no
          aparezca en el listado (Drive caído, o la carpeta se borró/renombró después de
          guardarla): perder de vista lo que el canto tiene enlazado sería peor. */}
      {value && (
        <div className="mb-2 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-2">
          <div className="flex items-start gap-2">
            <FolderOpen className="w-4 h-4 mt-0.5 shrink-0 text-green-700 dark:text-green-300" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {selected ? selected.name : 'Carpeta enlazada'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {selected ? selected.path : `No aparece en Drive (id ${value.slice(0, 10)}…)`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => pick('')}
              title="Quitar la carpeta (canto a una voz)"
              className="p-1 rounded-lg text-gray-500 hover:text-red-600"
            >
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>

          {sheets.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {sheets.map(sh => (
                <li key={sh.fileId} className="flex items-baseline gap-2 text-sm">
                  <span className={`font-bold ${sh.part === FULL_SCORE ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    {sh.part === FULL_SCORE ? '★ ' : ''}{sh.part}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{sh.fileName}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              {loading ? 'Leyendo la carpeta en Drive…' : 'Esta carpeta no tiene PDF todavía.'}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <button
              type="button"
              onClick={() => onPick(value)}
              className="text-xs text-blue-600 dark:text-blue-300 font-bold hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={3} />
              Volver a detectar (si agregaste una voz en Drive)
            </button>
            <button
              type="button"
              onClick={() => setChanging(v => !v)}
              className="text-xs text-blue-600 dark:text-blue-300 font-bold hover:underline"
            >
              {changing ? 'Cerrar el buscador' : 'Cambiar de carpeta'}
            </button>
          </div>
        </div>
      )}

      {/* Sugerencia por título: el atajo que ahorra buscar en el 90% de los casos */}
      {suggestion && !changing && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
          <Sparkles className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{suggestion.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              Se parece al título · {suggestion.moment} · {suggestion.pdfCount} PDF
            </p>
          </div>
          <button
            type="button"
            onClick={() => pick(suggestion.id)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-700 text-white active:scale-95"
          >
            Usar esta
          </button>
        </div>
      )}

      {(!value || changing) && (
        <>
          {/* Buscador por nombre (de la carpeta o de sus PDF) */}
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={loading ? 'Cargando carpetas de Drive…' : 'Buscar carpeta por nombre del canto…'}
          />
          <MomentChips counts={counts} value={moment} onChange={setMoment} />

          <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={onlyWithPdf}
              onChange={(e) => setOnlyWithPdf(e.target.checked)}
              className="w-4 h-4 accent-blue-700"
            />
            Solo carpetas que ya tienen PDF
          </label>

          {/* Resultados */}
          <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto">
            {results.slice(0, MAX_VISIBLE).map(row)}
          </div>

          {results.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {loading
                ? 'Cargando carpetas de Drive…'
                : folders.length === 0
                  ? 'No se pudo leer el Drive de partituras. Puedes guardar el canto igual y enlazar la carpeta después.'
                  : 'Ninguna carpeta coincide. Prueba con menos palabras, quita el filtro de momento o destilda "solo con PDF" si todavía no subiste los archivos.'}
            </p>
          )}

          {results.length > MAX_VISIBLE && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Mostrando {MAX_VISIBLE} de {results.length}. Escribe el nombre del canto para acotar.
            </p>
          )}
        </>
      )}

      {!value && !changing && results.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start gap-1">
          <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Elige la carpeta del canto y se detectarán solas las voces e instrumentos.
          La marcada con ★ es la que ve quien no tiene voz asignada.
        </p>
      )}
    </div>
  );
}

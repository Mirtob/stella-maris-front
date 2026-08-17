import { FileText, X, Check, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MomentChips, SearchField } from './SheetSearchControls';
import {
  buildFileOptions, scoreByTitle, filterOptions, momentCountsOf, suggestedMatch,
  type DriveFile, type FileOption,
} from '../../utils/sheetFolderSearch';

/** Cuántos PDF se pintan de una vez: más que esto no se lee, se busca. */
const MAX_VISIBLE = 40;

interface Props {
  /** Archivos del Drive de partituras (los trae /api/sheets). */
  files: DriveFile[];
  loading: boolean;
  /** Etiquetas de los momentos de la Misa, en orden (MOMENT_OPTIONS del formulario). */
  momentLabels: string[];
  /** Momento del canto que se está cargando: sus partituras se muestran primero. */
  currentMomentLabel?: string;
  /** Título escrito en el formulario: con él se sugiere la partitura sola. */
  songTitle: string;
  /** Archivo elegido (driveFileId). */
  value: string;
  onPick: (fileId: string) => void;
}

/**
 * Selector del PDF de un canto (el de "Partitura (Google Drive)").
 *
 * Mismo buscador que el de las carpetas por voz —búsqueda por nombre, filtro por momento
 * y sugerencia por el título escrito— porque el problema es el mismo: con cientos de
 * partituras, un desplegable con todo el Drive adentro no se navega.
 *
 * Se conserva el campo para pegar un **ID de Drive a mano**: es la salida cuando el
 * archivo se subió recién y todavía no aparece (la lista se cachea una hora), o cuando
 * Drive no responde.
 */
export function SheetFilePicker({
  files, loading, momentLabels, currentMomentLabel, songTitle, value, onPick,
}: Props) {
  const [query, setQuery] = useState('');
  const [moment, setMoment] = useState('');
  const [changing, setChanging] = useState(false);
  const [manualId, setManualId] = useState('');

  // El recorrido del Drive se hace una vez; el parecido con el título, en cada tecla.
  const catalog = useMemo(
    () => buildFileOptions(files, { momentLabels }),
    [files, momentLabels],
  );
  const options = useMemo(() => scoreByTitle(catalog, songTitle), [catalog, songTitle]);
  const selected = options.find(o => o.id === value);
  const counts = useMemo(() => momentCountsOf(options, momentLabels), [options, momentLabels]);
  const results = useMemo(
    () => filterOptions(options, { query, moment }, { currentMomentLabel }),
    [options, query, moment, currentMomentLabel],
  );
  // La sugerencia se calcula sobre TODO el Drive, no sobre lo filtrado: si la partitura
  // está guardada en otro momento, igual debe ofrecerse.
  const suggestion = useMemo(
    () => (value ? undefined : suggestedMatch(options)),
    [options, value],
  );

  const pick = (id: string) => {
    onPick(id);
    setChanging(false);
  };

  const applyManualId = () => {
    const id = manualId.trim();
    if (!id) return;
    pick(id);
    setManualId('');
  };

  const row = (o: FileOption) => (
    <button
      key={o.id}
      type="button"
      onClick={() => pick(o.id)}
      className={`w-full text-left px-3 py-2 rounded-xl border-2 active:scale-[0.99] transition-all ${
        o.id === value
          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
          : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-300" />
        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{o.name}</span>
        {o.id === value && <Check className="w-4 h-4 shrink-0 text-blue-600" strokeWidth={3} />}
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate pl-6">
        {o.moment}{o.subPath ? ` / ${o.subPath}` : ''}
      </p>
    </button>
  );

  return (
    <div>
      <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
        Partitura (Google Drive)
      </label>

      {/* Partitura elegida. Se muestra aunque no esté en el listado (Drive caído, archivo
          recién subido o borrado): perder de vista lo que el canto tiene enlazado sería peor. */}
      {value && (
        <div className="mb-2 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-2">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-green-700 dark:text-green-300" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {selected ? selected.name : 'Partitura enlazada'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {selected
                  ? selected.path
                  : loading
                    ? 'Buscándola en Drive…'
                    : `No aparece en la lista de Drive (id ${value.slice(0, 10)}…)`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => pick('')}
              title="Quitar la partitura"
              className="p-1 rounded-lg text-gray-500 hover:text-red-600"
            >
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setChanging(v => !v)}
            className="mt-2 text-xs text-blue-600 dark:text-blue-300 font-bold hover:underline"
          >
            {changing ? 'Cerrar el buscador' : 'Cambiar de partitura'}
          </button>
        </div>
      )}

      {/* Sugerencia por título: el atajo que ahorra buscar en el 90% de los casos */}
      {suggestion && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
          <Sparkles className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{suggestion.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              Se parece al título · {suggestion.moment}{suggestion.subPath ? ` / ${suggestion.subPath}` : ''}
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
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={loading ? 'Cargando partituras de Drive…' : 'Buscar partitura por nombre…'}
          />
          <MomentChips counts={counts} value={moment} onChange={setMoment} />

          <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto">
            {results.slice(0, MAX_VISIBLE).map(row)}
          </div>

          {results.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {loading
                ? 'Cargando partituras de Drive…'
                : options.length === 0
                  ? 'No se pudo leer el Drive de partituras. Puedes pegar el ID del archivo aquí abajo.'
                  : 'Ningún PDF coincide. Prueba con menos palabras o quita el filtro de momento. Si lo subiste recién, pega su ID abajo: la lista de Drive se refresca cada hora.'}
            </p>
          )}

          {results.length > MAX_VISIBLE && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Mostrando {MAX_VISIBLE} de {results.length}. Escribe el nombre del canto para acotar.
            </p>
          )}

          {/* Salida de emergencia: pegar el ID a mano */}
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            // Se aplica al salir del campo o con Enter: pegar y guardar sin más pasos.
            onBlur={applyManualId}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyManualId(); } }}
            placeholder="…o pega el ID del archivo de Drive manualmente"
            className="w-full mt-2 px-4 py-2 rounded-xl text-sm text-gray-700 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-blue-500"
          />
        </>
      )}
    </div>
  );
}

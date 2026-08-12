import { Music, Search, Trash2, FileText, Youtube, Loader, RefreshCw, Pencil, X, Check, Ban, Plus, ClipboardList } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { LyricsToolbar } from './LyricsToolbar';
import { toast } from 'sonner';
import { Song, MassMoment, LiturgicalSeason, InstrumentType, LITURGICAL_SEASON_LABELS } from '../../types';
import { listSongs, deleteSong, updateSong, approveSong, rejectSong, addSong } from '../../services/songs';
import { getSupabaseClient } from '../../services/supabaseClient';
import { formatDuration } from '../../services/youtube';
import { matchesSearch } from '../../utils/textSearch';
import { toVideoId, pickSongVideo } from '../../utils/songVideo';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { detectSheets, defaultSheet, FULL_SCORE, type SongSheet } from '../../utils/sheetParts';
import { SongReport } from '../admin/SongReport';
import { buildSongReport } from '../../utils/songReport';

const MOMENT_OPTIONS: { value: MassMoment; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'rito_aspersion', label: 'Rito de Aspersión' },
  { value: 'kyrie', label: 'Kyrie' },
  { value: 'gloria', label: 'Gloria' },
  { value: 'salmo', label: 'Salmo' },
  { value: 'aleluya', label: 'Aleluya' },
  { value: 'post_evangelio', label: 'Post Evangelio' },
  { value: 'respuesta_oracion_universal', label: 'Respuesta a Oración Universal' },
  { value: 'ofertorio', label: 'Ofertorio' },
  { value: 'santo', label: 'Santo' },
  { value: 'aclamacion_consagracion', label: 'Aclamación Consagración' },
  { value: 'amen_doxologia', label: 'Amén (Doxología)' },
  { value: 'padre_nuestro', label: 'Padre Nuestro' },
  { value: 'tuyo_es_el_reino', label: 'Tuyo es el Reino' },
  { value: 'cordero', label: 'Cordero de Dios' },
  { value: 'comunion', label: 'Comunión' },
  { value: 'final', label: 'Final / Salida' },
  { value: 'exposicion', label: 'Exposición' },
  // 'no-liturgico' NO es un chip: lo determina el toggle "Tipo de canto" (abajo), para
  // que el momento y `is_liturgical` nunca queden contradictorios.
];

/**
 * Admin SongManager — conectado a la tabla `songs` de Supabase.
 * Lista, busca y elimina cantos del catálogo real (los mismos que ve el coro).
 *
 * Para agregar cantos: el admin sube el video a YouTube con el bloque
 * STELLA_MARIS_META y luego usa "Sincronizar YouTube" (YouTubeSyncDialog).
 */
export function SongManager() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteSong = pendingDeleteId ? songs.find(s => s.id === pendingDeleteId) : null;
  // Reportería: planilla de avance de la subida (videos por instrumento, partituras, acordes).
  const [showReport, setShowReport] = useState(false);

  // Editar canto
  const [editSong, setEditSong] = useState<Song | null>(null);
  const [savingSong, setSavingSong] = useState(false);
  const NON_LIT_OPTIONS = ['Adoración', 'Procesión', 'Mariano', 'Reflexión', 'Evangelización', 'Otro'] as const;
  // Etiquetas para clasificar el canto: tiempos litúrgicos + temáticas. Se guardan
  // como rótulos en `liturgical_seasons` (text[]), igual que los cantos sincronizados.
  // Se pueden marcar varias por canto.
  const SEASON_TAGS: string[] = [
    ...Object.values(LITURGICAL_SEASON_LABELS),
    // Solemnidades y días litúrgicos específicos
    'Miércoles de Ceniza', 'Jueves Santo', 'Viernes Santo', 'Sábado Santo',
    'Vigilia Pascual', 'Domingo de Resurrección', 'Ascensión del Señor',
    'Espíritu Santo', 'Cristo Rey', 'Asunción de la Virgen',
    'Inmaculada Concepción', 'Misa Crismal', 'Ordenaciones',
    // Temáticas
    'Sagrado Corazón', 'Virgen María', 'Santos', 'Gregoriano', 'Secuencias',
  ];
  // Versión / instrumento del canto. Vacío = sirve para todas las versiones
  // (en BD se guarda como {coro,guitarra,organo}); marcar una = es esa versión.
  const INSTRUMENT_OPTIONS: InstrumentType[] = ['Guitarra', 'Órgano'];
  const emptyForm = {
    title: '', author: '', artist: '', moments: ['entrada'] as MassMoment[], youtubeId: '',
    // Un canto, dos grabaciones: el usuario ve la de SU instrumento (ver utils/songVideo.ts).
    youtubeIdOrgano: '', youtubeIdGuitarra: '',
    driveFileId: '', duration: '', originalKey: '', massName: '', lyrics: '',
    seasons: [] as string[], instruments: [] as InstrumentType[],
    isLiturgical: true, nonLiturgicalCategory: '' as string,
    // Polifonía: carpeta del canto en Drive + partituras por voz detectadas en ella.
    driveFolderId: '', sheets: [] as SongSheet[],
  };
  type SongForm = typeof emptyForm;
  // Deriva los chips de versión desde lo guardado en BD (minúsculas/sin acento).
  // Si incluye 'coro' o está vacío lo tratamos como genérico → ningún chip.
  const songVersionChips = (instruments?: string[]): InstrumentType[] => {
    const inst = (instruments ?? []).map(i => i.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
    if (inst.length === 0 || inst.includes('coro')) return [];
    const chips: InstrumentType[] = [];
    if (inst.includes('guitarra')) chips.push('Guitarra');
    if (inst.includes('organo')) chips.push('Órgano');
    return chips;
  };
  const toggleInstrumentIn = (setForm: Dispatch<SetStateAction<SongForm>>, i: InstrumentType) =>
    setForm(prev => ({
      ...prev,
      instruments: prev.instruments.includes(i)
        ? prev.instruments.filter(x => x !== i)
        : [...prev.instruments, i],
    }));
  // Alterna una parte de la Misa. La primera elegida es la PRINCIPAL (orden del
  // cantoral/PDF); el resto son partes adicionales donde el canto también sirve.
  // Nunca se queda sin al menos una parte.
  const toggleMomentIn = (setForm: Dispatch<SetStateAction<SongForm>>, m: MassMoment) =>
    setForm(prev => {
      if (prev.moments.includes(m)) {
        if (prev.moments.length === 1) return prev; // siempre al menos una
        return { ...prev, moments: prev.moments.filter(x => x !== m) };
      }
      return { ...prev, moments: [...prev.moments, m] };
    });

  // Deriva mass_moment/extra_moments a guardar según el toggle "Tipo de canto":
  //  - Litúrgico    → la 1ª parte elegida es la principal; el resto, adicionales.
  //  - No litúrgico → mass_moment='no-liturgico' y sin partes adicionales.
  // Así `is_liturgical` y `mass_moment` SIEMPRE concuerdan (antes podían contradecirse:
  // un canto quedaba con moment='no-liturgico' aunque is_liturgical=true, y seguía
  // mostrándose como "No litúrgico" sin poder corregirlo).
  const momentPayload = (form: SongForm): { massMoment: MassMoment; extraMoments: MassMoment[] } => {
    if (!form.isLiturgical) return { massMoment: 'no-liturgico', extraMoments: [] };
    const real = form.moments.filter(m => m !== 'no-liturgico');
    return { massMoment: (real[0] ?? 'entrada'), extraMoments: real.slice(1) };
  };
  const [f, setF] = useState<SongForm>(emptyForm);
  // Alta manual de un canto (p. ej. de un canal ajeno: pones tú la metadata).
  const [showAdd, setShowAdd] = useState(false);
  const [na, setNa] = useState<SongForm>(emptyForm);
  // Refs de los textarea de letra para el toolbar de formato (negrita/cursiva/…).
  const naLyricsRef = useRef<HTMLTextAreaElement>(null);
  const fLyricsRef = useRef<HTMLTextAreaElement>(null);
  // Toggler de etiqueta genérico para cualquiera de los dos formularios (edición/alta).
  const toggleSeasonIn = (setForm: Dispatch<SetStateAction<SongForm>>, s: string) =>
    setForm(prev => ({
      ...prev,
      seasons: prev.seasons.includes(s) ? prev.seasons.filter(x => x !== s) : [...prev.seasons, s],
    }));
  const [addingSong, setAddingSong] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  // A qué versión del canto pertenece el video que se está trayendo de YouTube.
  const [ytTarget, setYtTarget] = useState<'youtubeIdOrgano' | 'youtubeIdGuitarra' | 'youtubeId'>('youtubeIdOrgano');
  const [fetchingYt, setFetchingYt] = useState(false);
  // Partituras disponibles en la carpeta de Drive (para elegir sin buscar el ID a mano).
  // `path` = carpeta relativa (p. ej. "Entrada" o "Entrada/Vienen con Alegría"), para
  // agrupar el selector por momento de la Misa y por canto (subcarpeta polifónica).
  const [sheets, setSheets] = useState<{ id: string; name: string; path?: string; parentId?: string }[]>([]);
  // Carpetas de Drive: una por canto polifónico. Enlazando la CARPETA (y no cada PDF)
  // las voces se deducen solas, que es como las exporta MuseScore.
  const [folders, setFolders] = useState<{ id: string; name: string; path: string }[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // Cargar la lista de partituras de Drive al abrir el editor o el alta (una vez).
  useEffect(() => {
    if ((!editSong && !showAdd) || sheets.length > 0 || loadingSheets) return;
    setLoadingSheets(true);
    fetch('/api/sheets')
      .then(r => (r.ok ? r.json() : { files: [] }))
      .then(d => {
        setSheets((d.files || [])
          .filter((x: any) => (x.mimeType || '').includes('pdf'))
          .map((x: any) => ({
            id: x.id, name: x.name,
            path: x.path as string | undefined, parentId: x.parentId as string | undefined,
          })));
        setFolders((d.folders || []).map((x: any) => ({ id: x.id, name: x.name, path: x.path })));
      })
      .catch(() => { /* sin red: queda el campo manual */ })
      .finally(() => setLoadingSheets(false));
  }, [editSong, showAdd, sheets.length, loadingSheets]);

  // Opciones del selector de partitura AGRUPADAS por momento (1.er nivel de carpeta) y,
  // dentro, por lo que venga debajo (tiempo litúrgico y/o canto polifónico). Se prioriza
  // arriba la carpeta del momento del canto que se está editando.
  //
  // El nombre de la carpeta de Drive se compara SIN acentos ni mayúsculas, y con algunos
  // alias: en Drive las carpetas se llaman "Comunion" (sin tilde) y "Salida", mientras la
  // app rotula "Comunión" y "Final / Salida". Con comparación literal esos dos momentos
  // caían al fondo, entre las carpetas desconocidas, y perdían el atajo de "el momento
  // del canto, primero". Ojo: NO conviene renombrar la carpeta a "Final / Salida" en
  // Drive, porque la barra es el separador de `path` y partiría la ruta en dos.
  const sheetOptions = (currentMoment?: MassMoment) => {
    const folderKey = (s: string) =>
      s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    // Alias carpeta-de-Drive → etiqueta de la app, para los que no coinciden textualmente.
    const FOLDER_ALIASES: Record<string, string> = {
      salida: 'Final / Salida',
      final: 'Final / Salida',
      misas: 'Kyrie', // las partes del ordinario viven bajo "Misas/<nombre de la Misa>"
    };
    const labelByKey = new Map(MOMENT_OPTIONS.map(o => [folderKey(o.label), o.label]));
    /** Etiqueta de momento que le corresponde a una carpeta, o la propia carpeta. */
    const toMomentLabel = (folder: string) =>
      labelByKey.get(folderKey(folder)) ?? FOLDER_ALIASES[folderKey(folder)] ?? folder;

    const momentLabels = MOMENT_OPTIONS.map(o => o.label);
    const currentLabel = MOMENT_OPTIONS.find(o => o.value === currentMoment)?.label;
    const NO_FOLDER = '(Sin carpeta)';

    const groups = new Map<string, { id: string; label: string }[]>();
    for (const s of sheets) {
      const segs = (s.path || '').split('/').map(x => x.trim()).filter(Boolean);
      const moment = segs[0] ? toMomentLabel(segs[0]) : NO_FOLDER;
      const sub = segs.slice(1).join(' / ');
      const clean = s.name.replace(/\.pdf$/i, '');
      const label = sub ? `${sub} — ${clean}` : clean;
      if (!groups.has(moment)) groups.set(moment, []);
      groups.get(moment)!.push({ id: s.id, label });
    }

    const rank = (moment: string) => {
      if (currentLabel && moment === currentLabel) return -1;      // el del canto, primero
      const i = momentLabels.indexOf(moment);
      if (i !== -1) return i;                                       // orden de la Misa
      if (moment === NO_FOLDER) return 9999;                       // sueltas, al final
      return 5000;                                                 // otras carpetas, alfabético
    };

    return Array.from(groups.entries())
      .sort((a, b) => (rank(a[0]) - rank(b[0])) || a[0].localeCompare(b[0]))
      .map(([moment, items]) => (
        <optgroup key={moment} label={moment}>
          {items.sort((x, y) => x.label.localeCompare(y.label)).map(it => (
            <option key={it.id} value={it.id}>{it.label}</option>
          ))}
        </optgroup>
      ));
  };


  /**
   * Bloque "partituras por voz": se enlaza la CARPETA del canto en Drive y de ahí se
   * deducen las voces por el nombre de cada PDF (ver utils/sheetParts). Al detectar se
   * fija además `driveFileId` al full score, para que todo lo que ya usa una sola
   * partitura (cuadernillo, Modo Atril, ordinario) siga funcionando sin cambios.
   */
  /**
   * Videos del canto: uno por versión de acompañamiento.
   *
   * El mismo canto se graba con órgano y con guitarra, y cada usuario ve la
   * versión de SU instrumento (el que eligió al iniciar sesión, o el elegido
   * para esta Misa en el constructor). Se acepta pegar la URL completa: se
   * guarda solo el ID. El campo "video único" es el respaldo cuando todavía hay
   * una sola grabación — es lo que tiene el catálogo que ya está cargado.
   */
  const renderVideosBlock = (form: SongForm, setForm: Dispatch<SetStateAction<SongForm>>) => {
    const field = (
      key: 'youtubeIdOrgano' | 'youtubeIdGuitarra' | 'youtubeId',
      label: string,
      placeholder: string,
    ) => {
      const raw = form[key] as string;
      const id = toVideoId(raw);
      const invalid = raw.trim() !== '' && !id;
      return (
        <div key={key}>
          <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">{label}</label>
          <input
            value={raw}
            onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
            // Al salir del campo se normaliza a ID, para que lo guardado y lo
            // que se ve en pantalla sean lo mismo.
            onBlur={() => id && setForm(prev => ({ ...prev, [key]: id }))}
            placeholder={placeholder}
            className={`w-full px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 focus:outline-none font-medium ${
              invalid ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {invalid && (
            <p className="text-xs text-red-600 mt-1">No parece una URL ni un ID de YouTube.</p>
          )}
        </div>
      );
    };
    return (
      <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-3 space-y-3">
        <div>
          <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block">Videos del canto</label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pega la URL (o el ID) de cada versión. Cada corista verá la del instrumento
            que eligió al entrar; si falta la suya, se muestra la otra con un aviso.
          </p>
        </div>
        {field('youtubeIdOrgano',   '🎹 Versión Órgano',   'https://youtube.com/watch?v=…')}
        {field('youtubeIdGuitarra', '🎶 Versión Guitarra', 'https://youtube.com/watch?v=…')}
        {field('youtubeId',         'Video único / general (si aún hay una sola grabación)', 'https://youtube.com/watch?v=…')}
      </div>
    );
  };

  const renderVoicesBlock = (form: SongForm, setForm: Dispatch<SetStateAction<SongForm>>) => {
    const detect = (folderId: string) => {
      const inFolder = sheets.filter(s => s.parentId === folderId);
      const found = detectSheets(inFolder);
      const full = defaultSheet(found);
      setForm(prev => ({
        ...prev,
        driveFolderId: folderId,
        sheets: found,
        // Solo se pisa la partitura principal si se detectó alguna.
        driveFileId: full ? full.fileId : prev.driveFileId,
      }));
      if (folderId && found.length === 0) {
        toast.warning('Esa carpeta no tiene PDF', { description: 'Sube las partituras a Drive y vuelve a elegirla.' });
      }
    };
    return (
      <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-3">
        <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
          Partituras por voz <span className="text-gray-400">(polifonía — opcional)</span>
        </label>
        <select
          value={form.driveFolderId}
          onChange={(e) => detect(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
        >
          <option value="">— Sin carpeta (canto a una voz) —</option>
          {folders.map(fo => (
            <option key={fo.id} value={fo.id}>{fo.path}</option>
          ))}
        </select>

        {form.sheets.length > 0 ? (
          <>
            <ul className="mt-2 space-y-1">
              {form.sheets.map(sh => (
                <li key={sh.fileId} className="flex items-baseline gap-2 text-sm">
                  <span className={`font-bold ${sh.part === FULL_SCORE ? 'text-green-700' : 'text-gray-700 dark:text-gray-200'}`}>
                    {sh.part === FULL_SCORE ? '★ ' : ''}{sh.part}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{sh.fileName}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => detect(form.driveFolderId)}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Volver a detectar (si agregaste una voz en Drive)
            </button>
          </>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Elige la carpeta del canto y se detectarán solas las voces e instrumentos.
            La marcada con ★ es la que ve quien no tiene voz asignada.
          </p>
        )}
      </div>
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // No pasamos filtros — admin ve todo el catálogo.
      const data = await listSongs({ limit: 500 });
      setSongs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = [
    'Todos',
    'Entrada',
    'Rito de Aspersión',
    'Kyrie',
    'Gloria',
    'Salmo',
    'Aleluya',
    'Post Evangelio',
    'Respuesta a Oración Universal',
    'Ofertorio',
    'Santo',
    'Aclamación Consagración',
    'Amén (Doxología)',
    'Padre Nuestro',
    'Tuyo es el Reino',
    'Cordero de Dios',
    'Comunión',
    'Salida',
  ];

  const filteredSongs = songs.filter(song => {
    const matchesText =
      matchesSearch(song.title, searchTerm) ||
      matchesSearch(song.artist, searchTerm) ||
      matchesSearch(song.author, searchTerm);
    const matchesCategory = filterCategory === 'Todos' || song.category === filterCategory;
    return matchesText && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Entrada': 'bg-purple-100 text-purple-700 border-purple-300',
      'Kyrie': 'bg-blue-100 text-blue-700 border-blue-300',
      'Gloria': 'bg-amber-100 text-amber-700 border-amber-300',
      'Salmo': 'bg-green-100 text-green-700 border-green-300',
      'Aleluya': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Ofertorio': 'bg-orange-100 text-orange-700 border-orange-300',
      'Santo': 'bg-red-100 text-red-700 border-red-300',
      'Padre Nuestro': 'bg-rose-100 text-rose-700 border-rose-300',
      'Cordero de Dios': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      'Comunión': 'bg-teal-100 text-teal-700 border-teal-300',
      'Salida': 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[category] ?? 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const openEditSong = (song: Song) => {
    setEditSong(song);
    // Un canto es "No litúrgico" si lo dice el flag O si su momento es 'no-liturgico'
    // (p. ej. sincronizado sin momento → default de la columna). Los chips de partes
    // solo muestran momentos reales; 'no-liturgico' lo maneja el toggle.
    const nonLit = song.isLiturgical === false || song.massMoment === 'no-liturgico';
    const realMoments = [
      (song.massMoment as MassMoment) || 'entrada',
      ...((song.extraMoments ?? []) as MassMoment[]),
    ].filter((m, i, arr) => m !== 'no-liturgico' && arr.indexOf(m) === i);
    setF({
      title: song.title || '',
      author: song.author || '',
      artist: song.artist || '',
      moments: realMoments.length ? realMoments : (['entrada'] as MassMoment[]),
      youtubeId: song.youtubeId || '',
      youtubeIdOrgano: song.youtubeIdOrgano || '',
      youtubeIdGuitarra: song.youtubeIdGuitarra || '',
      driveFileId: song.driveFileId || '',
      driveFolderId: song.driveFolderId || '',
      sheets: song.sheets ?? [],
      duration: song.duration || '',
      originalKey: song.originalKey || '',
      massName: song.massName || '',
      lyrics: song.lyrics || '',
      seasons: (song.liturgicalSeasons as unknown as string[]) || [],
      instruments: songVersionChips(song.instruments),
      isLiturgical: !nonLit,
      nonLiturgicalCategory: song.nonLiturgicalCategory || '',
    });
  };

  /**
   * Videos a guardar. Se acepta URL o ID en cada campo y se guarda siempre el ID.
   * Campo vacío → `null`: así se puede BORRAR un video mal pegado (en `updateSong`
   * `undefined` significa "no tocar la columna", que dejaría el video viejo).
   */
  const videoPayload = (form: SongForm) => {
    const clean = (raw: string) => (raw.trim() ? toVideoId(raw) : '');
    return {
      youtubeId:         clean(form.youtubeId) || null,
      youtubeIdOrgano:   clean(form.youtubeIdOrgano) || null,
      youtubeIdGuitarra: clean(form.youtubeIdGuitarra) || null,
    };
  };

  /** Avisa si algún campo de video tiene texto que no es una URL/ID de YouTube. */
  const videosAreValid = (form: SongForm): boolean => {
    const bad = ([form.youtubeId, form.youtubeIdOrgano, form.youtubeIdGuitarra] as string[])
      .some(raw => raw.trim() !== '' && !toVideoId(raw));
    if (bad) toast.error('Revisa los videos: hay una URL o ID de YouTube que no es válido');
    return !bad;
  };

  const handleSaveSong = async () => {
    if (!editSong) return;
    if (!f.title.trim()) { toast.error('El título es obligatorio'); return; }
    if (!videosAreValid(f)) return;
    setSavingSong(true);
    const mp = momentPayload(f);
    const r = await updateSong(editSong.id, {
      title: f.title.trim(),
      author: f.author.trim() || undefined,
      artist: f.artist.trim() || undefined,
      massMoment: mp.massMoment,
      extraMoments: mp.extraMoments,
      // Vacío = no tocar la versión guardada; con chips = fijar esa versión.
      instruments: f.instruments.length ? f.instruments : undefined,
      ...videoPayload(f),
      driveFileId: f.driveFileId.trim() || undefined,
      driveFolderId: f.driveFolderId.trim() || null,
      sheets: f.sheets,
      duration: f.duration.trim() || undefined,
      originalKey: f.originalKey.trim() || undefined,
      massName: f.massName.trim() || undefined,
      lyrics: f.lyrics || undefined,
      liturgicalSeasons: f.seasons as unknown as LiturgicalSeason[],
      isLiturgical: f.isLiturgical,
      nonLiturgicalCategory: f.isLiturgical ? undefined : (f.nonLiturgicalCategory as Song['nonLiturgicalCategory']) || undefined,
    });
    setSavingSong(false);
    if (!r.ok) { toast.error('No se pudo guardar', { description: r.error }); return; }
    setEditSong(null);
    toast.success('Canto actualizado');
    load();
  };

  // Abrir el alta manual (formulario en blanco).
  const openAddSong = () => {
    setNa(emptyForm);
    setYtUrl('');
    setShowAdd(true);
  };

  // Trae título/duración del video desde YouTube (sirve para cualquier canal público).
  // El ID va al campo de la versión elegida en `ytTarget`: el canto se graba dos
  // veces (órgano y guitarra) y cada una tiene su propio video.
  const handleFetchYt = async () => {
    const id = toVideoId(ytUrl);
    if (!id) {
      toast.error('Pega una URL o ID de YouTube válido');
      return;
    }
    setFetchingYt(true);
    try {
      const r = await fetch(`/api/youtube?endpoint=videos&part=snippet,contentDetails&id=${encodeURIComponent(id)}`);
      const data = await r.json();
      const v = data.items?.[0];
      if (!v) { toast.error('No se encontró el video (¿es público?)'); return; }
      setNa(prev => ({
        ...prev,
        [ytTarget]: id,
        title: prev.title || (v.snippet?.title ?? ''),
        duration: formatDuration(v.contentDetails?.duration ?? '') || prev.duration,
      }));
      toast.success('Datos del video cargados', { description: 'Completa la metadata abajo.' });
    } catch {
      toast.error('No se pudo consultar YouTube');
    } finally {
      setFetchingYt(false);
    }
  };

  const handleAddSong = async () => {
    if (!na.title.trim()) { toast.error('El título es obligatorio'); return; }
    if (!videosAreValid(na)) return;
    setAddingSong(true);
    const mpAdd = momentPayload(na);
    const r = await addSong({
      title: na.title.trim(),
      massMoment: mpAdd.massMoment,
      extraMoments: mpAdd.extraMoments,
      // Vacío = sirve para todas las versiones (default {coro,guitarra,organo}).
      instruments: na.instruments.length ? na.instruments : undefined,
      ...videoPayload(na),
      driveFileId: na.driveFileId.trim() || undefined,
      driveFolderId: na.driveFolderId.trim() || null,
      sheets: na.sheets,
      author: na.author.trim() || undefined,
      artist: na.artist.trim() || undefined,
      originalKey: na.originalKey.trim() || undefined,
      duration: na.duration.trim() || undefined,
      massName: na.massName.trim() || undefined,
      lyrics: na.lyrics || undefined,
      liturgicalSeasons: na.seasons as unknown as LiturgicalSeason[],
      isLiturgical: na.isLiturgical,
      nonLiturgicalCategory: na.isLiturgical ? undefined : (na.nonLiturgicalCategory as Song['nonLiturgicalCategory']) || undefined,
    });
    setAddingSong(false);
    if (!r.ok) { toast.error('No se pudo agregar el canto', { description: r.error }); return; }
    setShowAdd(false);
    toast.success('Canto agregado al catálogo');
    load();
  };

  const handleApprove = async (song: Song) => {
    const { data } = await getSupabaseClient().auth.getSession();
    const who = data.session?.user?.email || 'admin';
    const r = await approveSong(song.id, who);
    if (!r.ok) { toast.error('No se pudo aprobar', { description: r.error }); return; }
    setSongs(prev => prev.map(s => s.id === song.id ? { ...s, approvalStatus: 'approved' } : s));
    toast.success('Canto aprobado');
  };

  const handleReject = async (song: Song) => {
    const reason = window.prompt('Motivo del rechazo (opcional):');
    if (reason === null) return;
    const r = await rejectSong(song.id, reason || 'Sin motivo');
    if (!r.ok) { toast.error('No se pudo rechazar', { description: r.error }); return; }
    setSongs(prev => prev.map(s => s.id === song.id ? { ...s, approvalStatus: 'rejected' } : s));
    toast.success('Canto rechazado');
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    // Optimistic
    setSongs(prev => prev.filter(s => s.id !== id));
    const r = await deleteSong(id);
    if (!r.ok) {
      toast.error('No se pudo eliminar el canto', { description: r.error });
      load();
    } else {
      toast.success('Canto eliminado');
    }
  };

  // Totales de la reportería: alimentan el resumen del pie y el badge del botón.
  const reportTotals = useMemo(() => buildSongReport(songs).totals, [songs]);

  if (showReport) {
    return <SongReport songs={songs} loading={loading} onBack={() => setShowReport(false)} />;
  }

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Music className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-white mb-1">Gestión de Cantos</h1>
          <p className="text-base sm:text-lg text-purple-700 dark:text-purple-200">
            {loading ? 'Cargando…' : `${songs.length} cantos en el catálogo`}
          </p>
        </div>

        {/* Agregar canto manualmente (p. ej. de un canal ajeno: la metadata la pones tú) */}
        <button
          onClick={openAddSong}
          className="w-full mb-3 py-3 bg-gradient-to-br from-blue-700 to-blue-900 text-white border-2 border-brand-border rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          Agregar canto manualmente
        </button>

        {/* Reportería: cuántos cantos hay por clasificación y qué falta subir */}
        <button
          onClick={() => setShowReport(true)}
          disabled={loading}
          className="w-full mb-3 py-3 bg-gradient-to-br from-green-700 to-emerald-900 text-white border-2 border-green-600 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <ClipboardList className="w-5 h-5" strokeWidth={2.5} />
          Reportería y planilla
          {!loading && reportTotals.pendientes > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {reportTotals.pendientes} por completar
            </span>
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={load}
          disabled={loading}
          className="w-full mb-4 py-2 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-xl text-blue-700 dark:text-blue-200 font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refrescar desde Supabase
        </button>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título o autor (con o sin acentos)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base border-2 border-blue-200 dark:border-blue-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-blue-400"
            aria-label="Buscar canto"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-blue-200 dark:border-blue-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-blue-400 bg-white font-bold"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Todos' ? 'Todas las categorías' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white/60 dark:bg-white/5 rounded-2xl p-5 animate-pulse h-32" />
            ))}
          </div>
        )}

        {/* Songs List */}
        {!loading && (
          <div className="space-y-3">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-5 border-2 border-gray-200 dark:border-slate-700"
              >
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex-1 min-w-0 leading-tight line-clamp-2">
                      {song.title}
                    </h3>
                    <div className={`px-2 py-1 rounded-lg border-2 text-xs sm:text-sm font-bold flex-shrink-0 ${getCategoryColor(song.category)}`}>
                      {song.category}
                    </div>
                  </div>
                  {(song.author || song.artist) && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 truncate">
                      {song.author || song.artist}
                    </p>
                  )}
                  {song.massName && (
                    <div className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 px-2 py-1 rounded-lg border border-purple-300 dark:border-purple-700 text-xs font-bold">
                      <Music className="w-3 h-3" />
                      {song.massName}
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 dark:bg-slate-900 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                  {/* Qué versiones están grabadas: el canto necesita el par
                      órgano/guitarra para que cada corista vea la suya. */}
                  <div className="text-center min-w-0">
                    <Youtube className="w-5 h-5 text-red-600 mx-auto mb-1" />
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">Videos</div>
                    <div className="text-xs font-bold text-gray-800 dark:text-white truncate">
                      {[
                        song.youtubeIdOrgano   ? '🎹' : '',
                        song.youtubeIdGuitarra ? '🎶' : '',
                        song.youtubeId         ? '🎬' : '',
                      ].filter(Boolean).join(' ') || '—'}
                    </div>
                    {!pickSongVideo(song) && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">sin video</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-base mb-1">⏱️</div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">Duración</div>
                    <div className="text-xs font-bold text-gray-800 dark:text-white">{song.duration || '—'}</div>
                  </div>
                  <div className="text-center">
                    <FileText className={`w-5 h-5 mx-auto mb-1 ${song.sheetMusicUrl ? 'text-green-600' : 'text-gray-400'}`} />
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">Partitura</div>
                    <div className={`text-xs font-bold ${song.sheetMusicUrl ? 'text-green-600' : 'text-gray-400'}`}>
                      {song.sheetMusicUrl ? 'Sí' : 'No'}
                    </div>
                  </div>
                </div>

                {/* Estado de aprobación (solo si no está aprobado) */}
                {song.approvalStatus && song.approvalStatus !== 'approved' && (
                  <div className={`mb-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border-2 ${
                    song.approvalStatus === 'rejected'
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {song.approvalStatus === 'rejected' ? '🚫 Rechazado' : '⏳ Pendiente de aprobación'}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {song.approvalStatus !== 'approved' && (
                    <button
                      onClick={() => handleApprove(song)}
                      className="flex-1 min-w-[110px] bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all"
                    >
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-bold">Aprobar</span>
                    </button>
                  )}
                  {song.approvalStatus !== 'rejected' && (
                    <button
                      onClick={() => handleReject(song)}
                      className="flex-1 min-w-[110px] bg-amber-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-700 active:scale-95 transition-all"
                    >
                      <Ban className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-bold">Rechazar</span>
                    </button>
                  )}
                  <button
                    onClick={() => openEditSong(song)}
                    aria-label={`Editar ${song.title}`}
                    className="flex-1 min-w-[110px] bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    <Pencil className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-bold">Editar</span>
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(song.id)}
                    aria-label={`Eliminar ${song.title}`}
                    className="flex-1 min-w-[110px] bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-bold">Eliminar</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredSongs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-base text-gray-600 dark:text-gray-300">No se encontraron cantos</p>
                {songs.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Sube cantos al canal de YouTube y usa "Sincronizar YouTube" para poblar el catálogo.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {!loading && songs.length > 0 && (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border-2 border-purple-200 dark:border-purple-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 border-2 border-blue-200 dark:border-blue-700">
                <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-200">{songs.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Total cantos</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 border-2 border-green-200 dark:border-green-700">
                <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-200">
                  {songs.filter(s => !!s.sheetMusicUrl).length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Con partitura</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-3 border-2 border-purple-200 dark:border-purple-700">
                <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-200">{reportTotals.organo}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">🎹 Versión órgano</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 border-2 border-amber-200 dark:border-amber-700">
                <div className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-200">{reportTotals.guitarra}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">🎶 Versión guitarra</div>
              </div>
            </div>
            <button
              onClick={() => setShowReport(true)}
              className="mt-3 w-full py-2 text-sm font-bold text-green-800 dark:text-green-200 underline active:opacity-70"
            >
              Ver reportería completa ({reportTotals.completos}/{songs.length} con las dos versiones)
            </button>
          </div>
        )}
      </div>

      {/* Modal: editar canto */}
      {editSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditSong(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-brand-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-br from-brand to-brand-strong text-white p-5 flex items-center justify-between border-b-4 border-brand-border z-10">
              <div className="flex items-center gap-3 min-w-0"><Pencil className="w-6 h-6 flex-shrink-0" strokeWidth={2.5} /><h2 className="text-xl font-bold min-w-0 truncate">Editar canto</h2></div>
              <button onClick={() => setEditSong(null)} className="p-2 hover:bg-white/20 rounded-xl flex-shrink-0"><X className="w-6 h-6" strokeWidth={2.5} /></button>
            </div>
            <div className="p-6 space-y-3">
              {([
                ['Título', 'title'],
                ['Autor', 'author'],
                ['Artista / Intérprete', 'artist'],
                ['Duración (ej. 3:45)', 'duration'],
                ['Tonalidad (ej. Sol, Re m)', 'originalKey'],
                ['Nombre de la Misa (agrupa Kyrie/Gloria/Santo/Cordero)', 'massName'],
              ] as [string, keyof typeof f][]).map(([label, key]) => (
                <div key={key}>
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">{label}</label>
                  <input
                    value={f[key] as string}
                    onChange={(e) => setF(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              ))}
              {/* Partitura: elegir el archivo de la carpeta de Drive (sin buscar el ID a mano) */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                  Partitura (Google Drive)
                </label>
                <select
                  value={f.driveFileId}
                  onChange={(e) => setF(prev => ({ ...prev, driveFileId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">{loadingSheets ? 'Cargando partituras…' : '— Sin partitura —'}</option>
                  {/* Si el canto ya tiene un ID que no está en la lista, mostrarlo igual. */}
                  {f.driveFileId && !sheets.some(s => s.id === f.driveFileId) && (
                    <option value={f.driveFileId}>Partitura actual ({f.driveFileId.slice(0, 8)}…)</option>
                  )}
                  {sheetOptions(f.moments[0])}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Elige el archivo de la carpeta de partituras. Si no aparece, súbelo a Drive y vuelve a abrir este editor.
                </p>
                <input
                  value={f.driveFileId}
                  onChange={(e) => setF(prev => ({ ...prev, driveFileId: e.target.value }))}
                  placeholder="…o pega el ID del archivo de Drive manualmente"
                  className="w-full mt-2 px-4 py-2 rounded-xl text-sm text-gray-700 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {renderVideosBlock(f, setF)}

              {renderVoicesBlock(f, setF)}

              {f.isLiturgical && (
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                  Parte(s) de la Misa <span className="text-gray-400">(elige una o varias; la 1ª es la principal)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOMENT_OPTIONS.map((o) => {
                    const idx = f.moments.indexOf(o.value);
                    const on = idx !== -1;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleMomentIn(setF, o.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 active:scale-95 transition-all ${
                          on
                            ? 'bg-blue-700 text-white border-brand-border'
                            : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                        }`}
                      >
                        {o.label}{idx === 0 ? ' ★' : ''}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">★ principal. Un canto puede servir para varias partes (p. ej. Ofertorio y Comunión).</p>
              </div>
              )}

              {/* Versión / instrumento (sin marcar = todas las versiones) */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                  Versión <span className="text-gray-400">(opcional; sin marcar = todas)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INSTRUMENT_OPTIONS.map((i) => {
                    const on = f.instruments.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInstrumentIn(setF, i)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 active:scale-95 transition-all ${
                          on
                            ? 'bg-blue-700 text-white border-brand-border'
                            : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                        }`}
                      >
                        {i === 'Guitarra' ? '🎶' : '🎹'} {i}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Guitarra = con acordes · Órgano = con partitura. Sin marcar sirve para cualquier instrumento.</p>
              </div>

              {/* Temporada litúrgica (varias permitidas; sin marcar = todas) */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                  Temporada litúrgica <span className="text-gray-400">(opcional; sin marcar = todas)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEASON_TAGS.map((s) => {
                    const on = f.seasons.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSeasonIn(setF, s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 active:scale-95 transition-all ${
                          on
                            ? 'bg-blue-700 text-white border-brand-border'
                            : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Litúrgico / No litúrgico */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Tipo de canto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setF(prev => ({ ...prev, isLiturgical: true }))}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border-2 active:scale-95 transition-all ${
                      f.isLiturgical
                        ? 'bg-blue-700 text-white border-brand-border'
                        : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                    }`}
                  >
                    Litúrgico (para la Misa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setF(prev => ({ ...prev, isLiturgical: false }))}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border-2 active:scale-95 transition-all ${
                      !f.isLiturgical
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-slate-600'
                    }`}
                  >
                    No litúrgico
                  </button>
                </div>
                {!f.isLiturgical && (
                  <select
                    value={f.nonLiturgicalCategory}
                    onChange={(e) => setF(prev => ({ ...prev, nonLiturgicalCategory: e.target.value }))}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-amber-300 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="">Categoría no litúrgica…</option>
                    {NON_LIT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Letra</label>
                <LyricsToolbar textareaRef={fLyricsRef} value={f.lyrics} onChange={(v) => setF(prev => ({ ...prev, lyrics: v }))} />
                <textarea
                  ref={fLyricsRef}
                  value={f.lyrics}
                  onChange={(e) => setF(prev => ({ ...prev, lyrics: e.target.value }))}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <button onClick={handleSaveSong} disabled={savingSong} className="w-full bg-gradient-to-br from-blue-700 to-blue-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 disabled:opacity-50">
                {savingSong ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
                {savingSong ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: alta manual de un canto */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-brand-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-br from-brand to-brand-strong text-white p-5 flex items-center justify-between border-b-4 border-brand-border z-10">
              <div className="flex items-center gap-3 min-w-0"><Plus className="w-6 h-6 flex-shrink-0" strokeWidth={2.5} /><h2 className="text-xl font-bold min-w-0 truncate">Agregar canto</h2></div>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/20 rounded-xl flex-shrink-0"><X className="w-6 h-6" strokeWidth={2.5} /></button>
            </div>
            <div className="p-6 space-y-3">
              {/* Traer datos desde una URL/ID de YouTube (cualquier canal público) */}
              <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-3 border-2 border-blue-200 dark:border-brand-border">
                <label className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-1 block">Video de YouTube (URL o ID)</label>
                <div className="flex gap-2">
                  <input
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=…"
                    className="flex-1 px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
                  />
                  <button
                    onClick={handleFetchYt}
                    disabled={fetchingYt || !ytUrl.trim()}
                    className="px-4 py-2.5 rounded-xl bg-blue-700 text-white font-bold flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {fetchingYt ? <Loader className="w-5 h-5 animate-spin" /> : <Youtube className="w-5 h-5" />}
                    Traer
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Es la versión:</span>
                  {([
                    ['youtubeIdOrgano', '🎹 Órgano'],
                    ['youtubeIdGuitarra', '🎶 Guitarra'],
                    ['youtubeId', 'Única / general'],
                  ] as [typeof ytTarget, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setYtTarget(value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 active:scale-95 transition-all ${
                        ytTarget === value
                          ? 'bg-blue-700 text-white border-brand-border'
                          : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                  Trae el título y la duración, y guarda el video en la versión elegida.
                  Repite pegando la otra grabación para completar el par órgano/guitarra.
                </p>
              </div>

              {([
                ['Título', 'title'],
                ['Autor', 'author'],
                ['Artista / Intérprete', 'artist'],
                ['Duración (ej. 3:45)', 'duration'],
                ['Tonalidad (ej. Sol, Re m)', 'originalKey'],
                ['Nombre de la Misa (agrupa Kyrie/Gloria/Santo/Cordero)', 'massName'],
              ] as [string, keyof typeof na][]).map(([label, key]) => (
                <div key={key}>
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">{label}</label>
                  <input
                    value={na[key] as string}
                    onChange={(e) => setNa(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              ))}

              {/* Partitura (Google Drive) */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Partitura (Google Drive)</label>
                <select
                  value={na.driveFileId}
                  onChange={(e) => setNa(prev => ({ ...prev, driveFileId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">{loadingSheets ? 'Cargando partituras…' : '— Sin partitura —'}</option>
                  {sheetOptions(na.moments[0])}
                </select>
                <input
                  value={na.driveFileId}
                  onChange={(e) => setNa(prev => ({ ...prev, driveFileId: e.target.value }))}
                  placeholder="…o pega el ID del archivo de Drive manualmente"
                  className="w-full mt-2 px-4 py-2 rounded-xl text-sm text-gray-700 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {renderVideosBlock(na, setNa)}

              {renderVoicesBlock(na, setNa)}

              {na.isLiturgical && (
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                  Parte(s) de la Misa <span className="text-gray-400">(elige una o varias; la 1ª es la principal)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOMENT_OPTIONS.map((o) => {
                    const idx = na.moments.indexOf(o.value);
                    const on = idx !== -1;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleMomentIn(setNa, o.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 active:scale-95 transition-all ${
                          on
                            ? 'bg-blue-700 text-white border-brand-border'
                            : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                        }`}
                      >
                        {o.label}{idx === 0 ? ' ★' : ''}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">★ principal. Un canto puede servir para varias partes (p. ej. Ofertorio y Comunión).</p>
              </div>
              )}

              {/* Versión / instrumento (sin marcar = todas las versiones) */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                  Versión <span className="text-gray-400">(opcional; sin marcar = todas)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INSTRUMENT_OPTIONS.map((i) => {
                    const on = na.instruments.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInstrumentIn(setNa, i)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 active:scale-95 transition-all ${
                          on
                            ? 'bg-blue-700 text-white border-brand-border'
                            : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                        }`}
                      >
                        {i === 'Guitarra' ? '🎶' : '🎹'} {i}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Guitarra = con acordes · Órgano = con partitura. Sin marcar sirve para cualquier instrumento.</p>
              </div>

              {/* Temporada litúrgica (varias permitidas; sin marcar = sirve para todas) */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">
                  Temporada litúrgica <span className="text-gray-400">(opcional; sin marcar = todas)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEASON_TAGS.map((s) => {
                    const on = na.seasons.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSeasonIn(setNa, s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 active:scale-95 transition-all ${
                          on
                            ? 'bg-blue-700 text-white border-brand-border'
                            : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Litúrgico / No litúrgico */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Tipo de canto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNa(prev => ({ ...prev, isLiturgical: true }))}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border-2 active:scale-95 transition-all ${
                      na.isLiturgical
                        ? 'bg-blue-700 text-white border-brand-border'
                        : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                    }`}
                  >
                    Litúrgico (para la Misa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNa(prev => ({ ...prev, isLiturgical: false }))}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border-2 active:scale-95 transition-all ${
                      !na.isLiturgical
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-slate-600'
                    }`}
                  >
                    No litúrgico
                  </button>
                </div>
                {!na.isLiturgical && (
                  <select
                    value={na.nonLiturgicalCategory}
                    onChange={(e) => setNa(prev => ({ ...prev, nonLiturgicalCategory: e.target.value }))}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-amber-300 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="">Categoría no litúrgica…</option>
                    {NON_LIT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Letra (con acordes [G] si aplica)</label>
                <LyricsToolbar textareaRef={naLyricsRef} value={na.lyrics} onChange={(v) => setNa(prev => ({ ...prev, lyrics: v }))} />
                <textarea
                  ref={naLyricsRef}
                  value={na.lyrics}
                  onChange={(e) => setNa(prev => ({ ...prev, lyrics: e.target.value }))}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <button onClick={handleAddSong} disabled={addingSong} className="w-full bg-gradient-to-br from-green-700 to-green-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 disabled:opacity-50">
                {addingSong ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />}
                {addingSong ? 'Agregando...' : 'Agregar al catálogo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteSong}
        title="Eliminar canto del catálogo"
        message={`¿Eliminar "${pendingDeleteSong?.title}" del catálogo? Esta acción no se puede deshacer.`}
        details={pendingDeleteSong?.author || pendingDeleteSong?.artist}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

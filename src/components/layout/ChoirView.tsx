import { registrarCapa } from '../../utils/navegacionAtras';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Send, AlertCircle, Music } from 'lucide-react';
import { toast } from 'sonner';
import { CategorySearch } from '../songs/CategorySearch';
import { Modal } from '../common/Modal';
import { PublishCantoralModal, PublishTarget } from '../cantoral/PublishCantoralModal';
import { LiturgicalSuggestions } from '../liturgy/LiturgicalSuggestions';
import { SelectInstrumentModal } from '../cantoral/SelectInstrumentModal';
import { AtrilMode } from '../atril/AtrilMode';
import { Tour } from '../tour/Tour';
import { constructorTips, hasSeenTip, markTipSeen } from '../tour/tours';
import { Song, InstrumentType, PublishedCantoral, MassType } from '../../types';
import { debePreguntarInstrumento, instrumentoPorDefecto } from '../../utils/instrument';
import { PsalmFromBook } from '../songs/PsalmFromBook';
import { MassAntiphon } from '../songs/MassAntiphon';
import { GradualeChoice } from '../songs/GradualeChoice';
import { KyrialeChoice } from '../songs/KyrialeChoice';
import { PadreNuestroYAclamaciones } from '../cantoral/PadreNuestroYAclamaciones';
import { esPadreNuestroDelCantoral } from '../../utils/padreNuestroYAclamaciones';
import { getCelebrationsForDate, getLiturgicalDateForDate, getPersistedCustomDates, setPersistedCustomDates } from '../../utils/liturgicalCalendar';
import { getSundayCycle } from '../../utils/liturgicalCycle';
import { resolvePsalm } from '../../data/psalmIndex';
import { buildPsalmSong, conSalmoDelLibro, debeReponerAntifona, esAntifonaEscritaAMano } from '../../utils/psalmSong';
import { buildAntiphonSong, conAntifonas, findAntiphonSong } from '../../utils/antiphonSong';
import { buildGradualeSong, libroDelCantoral,
         misasDelCantoral } from '../../utils/gradualeSong';
import { buildKyrialeSongs, misaDelCantoral, gloriaDelCantoral,
         buildPaterNosterSong, paterNosterDelCantoral,
         type EleccionKyriale } from '../../utils/kyrialeSong';
import { PARTES_CON_PROPIO, parteTienePropio, hayPropios, alternativasDelDia,
         LIBROS, type LibroGraduale } from '../../data/gradualeIndex';
import { resolveAntiphons, conCita } from '../../data/antiphonIndex';
import { AddSolemnityModal } from '../liturgy/AddSolemnityModal';
import { addCustomLiturgicalDate, toLiturgicalDate } from '../../services/liturgicalDates';
import { listInvitacionesRecibidas } from '../../services/choirInvitations';
import { invitacionesVigentesPara, invitacionQueMarca, type ChoirInvitation } from '../../utils/choirInvitations';
import { leerDatosDeLaMisa, guardarDatosDeLaMisa } from '../../utils/borradorMisa';
import { formatActiveParishLabel } from '../../utils/parish';
import { computeUsage, resolveAnnualTarget } from '../../utils/previousUsage';
import { getTodayLocal, formatYmdForDisplay, parseYmdLocal } from '../../utils/dateLocal';
import { massTimeTo24h, massTimeTo12h } from '../../utils/massType';
import { getGospelAcclamationName, getCurrentLiturgicalSeason, displayCategoryForDate } from '../../utils/liturgicalSeason';
import { getSpecialLiturgicalDay, getCategoriesForSpecialDay, getSpecialDayName, getSpecialDayEmoji, getBuildableCelebrations, SpecialLiturgicalDay } from '../../utils/specialLiturgicalDays';
import { useSongs } from '../../hooks/useSongs';

interface ChoirViewProps {
  preferredInstrument: InstrumentType;
  /** Voz del corista, para elegir su partitura en cantos polifonicos. */
  userVoicePart?: string;
  userInstruments?: InstrumentType[]; // Array de todos los instrumentos que el usuario puede usar
  parishName: string;
  parishes?: string[]; // Conjunto completo de parroquias del coro (para publicar a varias)
  isAdmin?: boolean;   // Admin verificado (aunque actúe como Coro): sus celebraciones son globales
  cantoral: Song[];
  onAddToCantoral: (song: Song) => void;
  onRemoveFromCantoral: (songId: string, category?: string) => void;
  /** El 2.º argumento es el instrumento con el que se toca ESTA Misa: decide qué
   *  versión del video (órgano/guitarra) se abre. */
  onPlaySong: (song: Song, instrument?: InstrumentType) => void;
  onPublishCantoral: (cantorals: PublishedCantoral[]) => Promise<void> | void;
  /** Cantorales publicados de la parroquia (para avisar cantos repetidos al armar). */
  parishCantorals?: PublishedCantoral[];
  /** Id del cantoral en edición (se excluye del cálculo de repeticiones). */
  editingCantoralId?: string | null;
  /** El cantoral que se está editando: de aquí salen su fecha, hora y tipo de Misa. */
  editingCantoral?: PublishedCantoral | null;
  /** Salir de la edición sin tocar el cantoral publicado. */
  onCancelEdit?: () => void;
  /** Fecha con la que abrir el constructor, cuando se llega desde el calendario
   *  litúrgico ("Agregar Cantoral" en una celebración). Sin esto se llegaba al
   *  constructor en blanco y había que volver a buscar la fecha a mano. */
  initialMassDate?: string;
  /** Avisa que la fecha de entrada ya se usó, para que no reviva al volver a entrar. */
  onConsumeInitialDate?: () => void;
  /** Parroquia anfitriona con la que abrir el constructor, cuando se llega desde una
   *  invitación aceptada. Llega junto con `initialMassDate`: son la fecha y el LUGAR de
   *  esa Misa. Sin esto, aceptar la invitación dejaba el constructor apuntando a la
   *  parroquia propia y el cantoral se publicaba en la casa equivocada. */
  initialParish?: string;
}

// Horarios de Misa seleccionables cada 30 min (06:00–22:00). Valor 'HH:MM' (24h).
const MASS_TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let mins = 6 * 60; mins <= 22 * 60; mins += 30) {
    out.push(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`);
  }
  return out;
})();

export function ChoirView({
  preferredInstrument,
  userVoicePart,
  userInstruments,
  parishName,
  parishes,
  isAdmin,
  cantoral,
  onAddToCantoral,
  onRemoveFromCantoral,
  onPlaySong,
  onPublishCantoral,
  parishCantorals,
  editingCantoralId,
  editingCantoral,
  onCancelEdit,
  initialMassDate,
  onConsumeInitialDate,
  initialParish,
}: ChoirViewProps) {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [selectedInstrumentForMass, setSelectedInstrumentForMass] = useState<InstrumentType>(
    () => instrumentoPorDefecto(userInstruments, preferredInstrument),
  );
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  // Un coro puede tocar hoy con guitarra aunque su perfil tenga el órgano primero:
  // el video que se abra debe ser el de la versión que se va a tocar en esta Misa.
  const playSongForThisMass = (song: Song) => onPlaySong(song, selectedInstrumentForMass);
  // Tiempo Pascual: en lugar del acto penitencial puede hacerse el rito de
  // aspersión (IGMR 51), que cambia el canto de ese momento (y omite el Kyrie).
  // 'null' = aún no se preguntó; al tocar el Kyrie en Pascua preguntamos.
  const [penitentialChoice, setPenitentialChoice] = useState<'kyrie' | 'aspersion' | null>(null);
  const [showAspersionDialog, setShowAspersionDialog] = useState(false);
  const [showAtril, setShowAtril] = useState(false);
  const [showAddSolemnity, setShowAddSolemnity] = useState(false);
  const [celebTick, setCelebTick] = useState(0);
  /**
   * Los datos de la Misa que quedaron de la última vez (fecha, hora, tipo y LUGAR).
   *
   * El constructor se desmonta cada vez que se sale a mirar otra pantalla, y hasta
   * ahora eso borraba para dónde iba el cantoral: se volvía y estaba otra vez en hoy,
   * en la parroquia propia. Con un coro invitado eso es peor que molesto — el cantoral
   * se termina publicando en la casa equivocada. Ver utils/borradorMisa.
   *
   * La fecha que llega del calendario o de una invitación MANDA: si apunta a otro día,
   * lo recordado es de otra Misa y no se mezcla.
   */
  const recordado = useMemo(() => {
    const guardado = leerDatosDeLaMisa(getTodayLocal());
    if (initialMassDate && guardado && guardado.fecha !== initialMassDate) return null;
    return guardado;
  }, []);
  // Fecha de la Misa para la que se arma el cantoral: fija la celebración/ciclo desde el
  // inicio (para cargar el salmo del libro) y pre-llena la fecha al publicar.
  const [massDate, setMassDate] = useState(initialMassDate || recordado?.fecha || getTodayLocal());
  // La fecha que llega del calendario se usa UNA vez. Si se dejara puesta, salir del
  // constructor y volver por el menú reabriría aquel domingo en vez de hoy — para eso
  // está lo recordado, que sí sabe cuándo caducar.
  useEffect(() => { if (initialMassDate) onConsumeInitialDate?.(); }, []);
  // Todo lo litúrgico (tiempo, rótulo del Aleluya, aspersión) se decide contra la
  // fecha de la MISA, no contra la de hoy: el cantoral se arma con anticipación y
  // puede cruzar de un tiempo litúrgico a otro.
  const massDateObj = useMemo(() => parseYmdLocal(massDate), [massDate]);

  /**
   * Al cambiar la fecha, reponer las antífonas del Misal — salvo lo escrito a mano,
   * que manda. Misma regla que la antífona del salmo: vaciar la caja vuelve a la del
   * Misal (así se corrige un error sin tener que recargar).
   */
  useEffect(() => {
    const celebracion = getLiturgicalDateForDate(massDate);
    const delMisal = celebracion ? resolveAntiphons(celebracion) : null;
    if (!entradaEscritaAMano.current) {
      setAntifonaEntrada(conCita(delMisal?.entrada, delMisal?.entradaCita));
    }
    if (!comunionEscritaAMano.current) {
      setAntifonaComunion(conCita(delMisal?.comunion, delMisal?.comunionCita));
    }
  }, [massDate, celebTick]);

  /**
   * Invitaciones para ESTE día: parroquias ajenas donde el coro fue invitado a cantar
   * (la fiesta patronal de la parroquia vecina). Habilitan publicar allá, y solo ese
   * día — lo mismo que exige la RLS. Ver utils/choirInvitations.
   */
  const parroquiasPropias = useMemo(
    () => (parishes?.length ? parishes : (parishName ? [parishName] : [])),
    [parishes, parishName],
  );
  /**
   * Las invitaciones tal como llegaron, SIN filtrar.
   *
   * Se guardan crudas y no ya filtradas porque de ellas salen dos respuestas distintas:
   * qué parroquias OFRECER como destino (abajo, `invitaciones`) y de QUIÉN es el cantoral
   * al publicar (`invitacionQueMarca`, en handlePublish). La segunda no puede depender de
   * la primera: al que tiene la anfitriona en su propio perfil, la lista de destinos la
   * descarta —ahí publica por derecho— y eso dejaba el cantoral sin marcar.
   */
  const [invitacionesDelDia, setInvitacionesDelDia] = useState<ChoirInvitation[]>([]);
  /** Ya se sabe qué invitaciones hay para este día (aunque no haya ninguna). */
  const [invitacionesListas, setInvitacionesListas] = useState(false);
  useEffect(() => {
    let cancelado = false;
    setInvitacionesListas(false);
    if (!massDate || parroquiasPropias.length === 0) { setInvitacionesDelDia([]); setInvitacionesListas(true); return; }
    listInvitacionesRecibidas(parroquiasPropias, massDate).then((filas) => {
      if (cancelado) return;
      setInvitacionesDelDia(filas);
      setInvitacionesListas(true);
    });
    return () => { cancelado = true; };
  }, [massDate, parroquiasPropias]);
  /** Las que se OFRECEN como destino: parroquias ajenas donde hoy se puede publicar. */
  const invitaciones = useMemo(
    () => invitacionesVigentesPara(invitacionesDelDia, parroquiasPropias, massDate),
    [invitacionesDelDia, parroquiasPropias, massDate],
  );
  const [massTime, setMassTime] = useState(recordado?.hora || '10:00');
  const [massType, setMassType] = useState<MassType>(recordado?.tipo || 'dia');

  // ── Dónde se canta ────────────────────────────────────────────────────────
  /**
   * La unidad (parroquia o capilla) donde se va a cantar esta Misa.
   *
   * Se elige AQUÍ y no recién al publicar porque es la mitad de la pregunta "¿para
   * dónde va este cantoral?" — la otra mitad es la fecha— y porque un coro invitado
   * arma el cantoral de otra parroquia: verlo escrito desde el principio es lo que
   * evita publicarlo en la casa equivocada.
   */
  const [destino, setDestino] = useState<string>(
    () => initialParish || recordado?.destino || parishName || '',
  );
  /** Dónde se puede publicar hoy: la casa, y las parroquias que invitaron a ESTE día. */
  const destinosPosibles = useMemo(() => {
    const invitadas = invitaciones.map((i) => i.hostParish).filter((h) => !parroquiasPropias.includes(h));
    const lista = [...parroquiasPropias, ...invitadas];
    // Editando un cantoral ya publicado en casa ajena, su parroquia sigue siendo un
    // destino válido aunque la invitación ya se haya retirado: guardar un cambio no
    // puede mudar el cantoral de parroquia a espaldas de nadie.
    const enEdicion = editingCantoral?.parishName;
    if (enEdicion && !lista.includes(enEdicion)) lista.push(enEdicion);
    return lista;
  }, [parroquiasPropias, invitaciones, editingCantoral?.parishName]);
  /** La invitación que habilita el destino elegido (si se canta en casa ajena). */
  const invitacionDelDestino = useMemo(
    () => invitaciones.find((i) => i.hostParish === destino),
    [invitaciones, destino],
  );
  /**
   * Si el destino recordado ya no está disponible —cambió la fecha, retiraron la
   * invitación—, se vuelve a la parroquia propia. Se espera a que las invitaciones
   * estén cargadas: si no, la primera pintada (con la lista todavía vacía) tiraría
   * abajo justamente el destino invitado que se quería recordar.
   */
  useEffect(() => {
    if (!invitacionesListas || destinosPosibles.length === 0) return;
    if (!destinosPosibles.includes(destino)) setDestino(destinosPosibles[0]);
  }, [invitacionesListas, destinosPosibles, destino]);
  /** Te invitaron a ESA Misa, no a ese día: el tipo lo fija la invitación. */
  useEffect(() => {
    if (invitacionDelDestino && massType !== invitacionDelDestino.massType) {
      setMassType(invitacionDelDestino.massType);
    }
  }, [invitacionDelDestino]);
  /**
   * Guardar lo elegido para recuperarlo al volver. Editar un cantoral ya publicado NO
   * es un borrador: sus datos salen del cantoral, y pisarlos aquí dejaría el recuerdo
   * apuntando a una Misa que ya tiene cantoral.
   */
  useEffect(() => {
    if (editingCantoral) return;
    guardarDatosDeLaMisa({ fecha: massDate, hora: massTime, tipo: massType, destino });
  }, [massDate, massTime, massType, destino, editingCantoral]);
  // Antífona del salmo (editable): por defecto la del índice de la celebración; el coro
  // puede cambiarla si no usa la misma. Viaja al cantoral publicado (y al PDF/pueblo).
  const [psalmAntiphon, setPsalmAntiphon] = useState('');

  /**
   * Antífonas propias del día (entrada y comunión). Se cargan solas del Misal al elegir
   * la fecha, se pueden corregir, y la casilla decide si viajan al cantoral y al
   * folleto. No reemplazan al canto de entrada ni al de comunión: se suman.
   */
  const [antifonaEntrada, setAntifonaEntrada] = useState('');
  const [antifonaComunion, setAntifonaComunion] = useState('');
  const [incluirEntrada, setIncluirEntrada] = useState(false);
  const [incluirComunion, setIncluirComunion] = useState(false);
  /**
   * Propio gregoriano elegido para cada parte de la Misa (o nada).
   *
   * Es un mapa por parte y no una sola opción para toda la Misa porque hay coros que
   * cantan el introito en gregoriano y el resto en castellano. Se guarda el LIBRO
   * (Romanum o Simplex); el canto concreto sale de la celebración y del ciclo.
   */
  const [libroGregoriano, setLibroGregoriano] = useState<Record<string, LibroGraduale | null>>({});
  const elegirGregoriano = (parte: string, libro: LibroGraduale | null) =>
    setLibroGregoriano((prev) => ({ ...prev, [parte]: libro }));
  /**
   * La Misa del ordinario en gregoriano, y de dónde sale su Gloria.
   *
   * Se guarda UNA Misa, no una parte por parte: el Santo y el Cordero son los de la Misa
   * del Kyrie, y lo único que puede venir de otra es el Gloria (ver utils/kyrialeSong).
   */
  const [misaGregoriana, setMisaGregoriana] = useState<EleccionKyriale | null>(null);
  const [gloriaGregoriano, setGloriaGregoriano] = useState<EleccionKyriale | null>(null);
  /** Tono del Padre Nuestro gregoriano. Va suelto: no pertenece a ninguna Misa. */
  const [paterGregoriano, setPaterGregoriano] = useState<string | null>(null);

  /**
   * Cuál de las varias Misas del día se canta, en cada libro.
   *
   * Un día no siempre tiene una sola: la Navidad trae cuatro Misas en el Romanum
   * (vigilia, noche, aurora y día) y el Simplex ofrece ocho para todo el Tiempo
   * Ordinario. Se guarda UNA por libro y no una por parte porque cada Misa del libro es
   * un juego completo; mezclar partes entre los dos libros sigue igual, que es otra cosa.
   */
  const [misaElegida, setMisaElegida] = useState<Partial<Record<LibroGraduale, string>>>({});
  const elegirMisa = (libro: LibroGraduale, clave: string | null) =>
    setMisaElegida((prev) => ({ ...prev, [libro]: clave || undefined }));
  /** Tiempo litúrgico de la fecha: decide qué Misas ofrece el Simplex. */
  const tiempoDeLaMisa = useMemo(() => getCurrentLiturgicalSeason(massDateObj), [massDateObj]);

  /** El atajo del encabezado: el mismo libro en todas las partes que lo tengan. */
  const gregorianoEnTodo = (libro: LibroGraduale | null) =>
    setLibroGregoriano(libro === null
      ? {}
      : Object.fromEntries(PARTES_CON_PROPIO.map((p) => [p, libro])));

  // Igual que con el salmo: lo escrito a mano no se pisa al cambiar la fecha.
  const entradaEscritaAMano = useRef(false);
  const comunionEscritaAMano = useRef(false);
  const cambiarAntifonaEntrada = (v: string) => { entradaEscritaAMano.current = esAntifonaEscritaAMano(v); setAntifonaEntrada(v); };
  const cambiarAntifonaComunion = (v: string) => { comunionEscritaAMano.current = esAntifonaEscritaAMano(v); setAntifonaComunion(v); };
  /**
   * ¿La antífona la escribió el coro a mano?
   *
   * Importa porque la fecha de la Misa se suele elegir DESPUÉS de escribirla, y hasta
   * ahora cada cambio de fecha la reemplazaba por la del libro sin avisar: el coro
   * escribía su antífona, ajustaba la fecha, y lo escrito desaparecía. Como la caja
   * quedaba con OTRO texto (el del libro) en vez de vacía, ni siquiera se notaba —
   * publicaba y el folleto salía con una antífona que no era la suya.
   *
   * Vaciar la caja la devuelve a "no escrita": así se puede volver a la del libro.
   */
  const antifonaEscritaAMano = useRef(false);
  const cambiarAntifona = (v: string) => {
    antifonaEscritaAMano.current = esAntifonaEscritaAMano(v);
    setPsalmAntiphon(v);
  };
  useEffect(() => {
    // Lo escrito a mano manda sobre lo que traiga el libro para la fecha nueva.
    if (!debeReponerAntifona(antifonaEscritaAMano.current)) return;
    const cel = getLiturgicalDateForDate(massDate);
    const p = cel ? resolvePsalm(getSundayCycle(massDate), cel) : null;
    setPsalmAntiphon(p?.antiphon ?? '');
  }, [massDate]);

  // Canto "Salmo" sintético: antífona (letra) + referencia a la página del libro. Viaja al
  // cantoral publicado, al PDF y al Modo Atril. `null` si no hay salmo para la fecha.
  // La regla vive en utils/psalmSong: basta con la antífona O con la página del libro.
  const psalmSong = useMemo<Song | null>(
    () => buildPsalmSong(massDate, psalmAntiphon),
    [massDate, psalmAntiphon],
  );

  /**
   * El repertorio REAL de la Misa: el borrador MÁS el salmo del libro.
   *
   * El salmo no se agrega desde el catálogo (no es un canto: sale de la fecha, con la
   * antífona que escriba el coro), así que no está en `cantoral` y hay que sumarlo
   * aparte. Vive aquí, en un único sitio, porque antes se calculaba suelto en cada
   * lugar que lo necesitaba — y en el que se olvidó, la vista previa del folleto,
   * salía un folleto SIN salmo: quien escribía la antífona a mano no la veía por
   * ninguna parte y daba por hecho que no había viajado.
   */
  const songsForPublish = useMemo<Song[]>(
    () => conAntifonas(conSalmoDelLibro(cantoral, psalmSong), [
      buildAntiphonSong(massDate, 'Entrada', antifonaEntrada, incluirEntrada),
      buildAntiphonSong(massDate, 'Comunión', antifonaComunion, incluirComunion),
      // Los propios gregorianos se colocan igual que las antífonas: cada uno dentro de
      // su parte, y la comunión la primera de la suya.
      ...PARTES_CON_PROPIO.map((parte) => {
        const libro = libroGregoriano[parte] ?? null;
        return buildGradualeSong(
          massDate, getLiturgicalDateForDate(massDate), parte, libro,
          { ciclo: getSundayCycle(massDate), tiempo: tiempoDeLaMisa,
            misaElegida: libro ? misaElegida[libro] : undefined },
        );
      }),
      // El ordinario gregoriano: las cuatro partes salen de una sola elección.
      ...buildKyrialeSongs(massDate, misaGregoriana, gloriaGregoriano),
      buildPaterNosterSong(massDate, 'romanum', paterGregoriano),
    ]),
    [cantoral, psalmSong, massDate, antifonaEntrada, antifonaComunion, incluirEntrada,
     incluirComunion, libroGregoriano, misaElegida, tiempoDeLaMisa,
     misaGregoriana, gloriaGregoriano, paterGregoriano],
  );
  /**
   * Al ENTRAR a editar un cantoral publicado, reponer su fecha, su horario y su tipo
   * de Misa.
   *
   * Antes el constructor arrancaba siempre en "hoy, 10:00, Misa del día", así que al
   * editar se perdían los tres. El coro tenía que ir a mirar la fecha al listado —
   * y salir del constructor cancelaba la edición, de modo que al volver "guardar" se
   * convertía en publicar otro cantoral, con su aviso push y todo. Se dispara solo
   * cuando cambia el cantoral en edición, para no pisar lo que el coro ajuste después.
   */
  useEffect(() => {
    if (!editingCantoral) return;
    // La antífona publicada vuelve a la caja: el salmo se saca del borrador al editar
    // (lleva la fecha en el id), así que sin esto una antífona escrita a mano se
    // perdía en cuanto se corregía cualquier otra cosa del cantoral.
    const salmoPublicado = editingCantoral.songs.find((x) => x.category === 'Salmo');
    if (salmoPublicado?.lyrics?.trim()) {
      antifonaEscritaAMano.current = true;
      setPsalmAntiphon(salmoPublicado.lyrics);
    }
    // Las antífonas publicadas vuelven a su caja, con la casilla ya marcada: si
    // estaban en el cantoral, es que el coro las quiso.
    const entradaPublicada = findAntiphonSong(editingCantoral.songs, 'Entrada');
    if (entradaPublicada?.lyrics?.trim()) {
      entradaEscritaAMano.current = true;
      setAntifonaEntrada(entradaPublicada.lyrics);
      setIncluirEntrada(true);
    }
    const comunionPublicada = findAntiphonSong(editingCantoral.songs, 'Comunión');
    if (comunionPublicada?.lyrics?.trim()) {
      comunionEscritaAMano.current = true;
      setAntifonaComunion(comunionPublicada.lyrics);
      setIncluirComunion(true);
    }
    // Y el propio gregoriano que llevara cada parte, para no perderlo al editar.
    const gregorianos: Record<string, LibroGraduale | null> = {};
    for (const parte of PARTES_CON_PROPIO) {
      const libro = libroDelCantoral(editingCantoral.songs, parte, editingCantoral.date);
      if (libro) gregorianos[parte] = libro;
    }
    setLibroGregoriano(gregorianos);
    setMisaElegida(misasDelCantoral(editingCantoral.songs, editingCantoral.date));
    // La Misa del ordinario se lee del Kyrie, que es el que manda; el Gloria puede ser
    // de otra, así que se repone por su cuenta.
    setMisaGregoriana(misaDelCantoral(editingCantoral.songs, editingCantoral.date));
    setGloriaGregoriano(gloriaDelCantoral(editingCantoral.songs, editingCantoral.date));
    setPaterGregoriano(
      paterNosterDelCantoral(editingCantoral.songs, editingCantoral.date)?.tono ?? null);
    setMassDate(editingCantoral.date);
    // Y DÓNDE se canta: un cantoral publicado en la parroquia que invitó se edita para
    // allá, no para la propia. Sin esto, guardar los cambios lo mandaba a casa.
    setDestino(editingCantoral.parishName);
    const hhmm = massTimeTo24h(editingCantoral.massTime);
    if (hhmm) setMassTime(hhmm);
    setMassType(editingCantoral.massType ?? (editingCantoral.vigil ? 'visperas_i' : 'dia'));
  }, [editingCantoral?.id]);

  // Tip contextual del constructor (F4): 1ª vez que se abre una categoría.
  const [showConstructorTip, setShowConstructorTip] = useState(false);
  // El hook se llama por su carga de cantos; la lista completa no se usa aquí.
  useSongs();
  const currentSeason = getCurrentLiturgicalSeason(massDateObj);

  // Celebraciones que se pueden armar ahora. En Cuaresma/Semana Santa surgen los
  // oficios del Triduo para prepararlos con anticipación. El constructor se
  // adapta (orden y categorías) a la celebración elegida; por defecto la de hoy.
  const celebrations = getBuildableCelebrations();
  // Por defecto, la celebración de hoy solo si está entre las ofrecidas
  // (Misa normal u oficios de Semana Santa); si no, Misa normal.
  const [selectedCelebration, setSelectedCelebration] = useState<SpecialLiturgicalDay | 'normal'>(() => {
    const todaySpecial = getSpecialLiturgicalDay();
    return todaySpecial && celebrations.some(c => c.key === todaySpecial) ? todaySpecial : 'normal';
  });
  const specialDay = selectedCelebration === 'normal' ? null : selectedCelebration;

  // Uso previo de cantos para avisar repeticiones: últimas 4 semanas + la MISMA
  // celebración anual (Cristo Rey, Navidad, oficios de Semana Santa…) en años previos.
  const previousUsage = useMemo(() => {
    const today = getTodayLocal();
    const selDate = selectedCelebration !== 'normal'
      ? celebrations.find(c => c.key === selectedCelebration)?.date
      : undefined;
    const annual = resolveAnnualTarget(today, selDate);
    return computeUsage(parishCantorals ?? [], {
      excludeId: editingCantoralId,
      todayYmd: today,
      weeks: 4,
      annualName: annual?.name ?? null,
    });
    // `celebrations` es estable durante la sesión (depende solo de hoy).
  }, [parishCantorals, editingCantoralId, selectedCelebration]);

  // La aspersión aplica en tiempo pascual; si se está preparando la Vigilia o el
  // Domingo de Resurrección, también (aunque hoy aún sea Cuaresma).
  const isEaster = currentSeason === 'Pascua'
    || selectedCelebration === 'DomingoResurreccion'
    || selectedCelebration === 'VigiliaPascual';

  // Nombre dinámico del Aleluya: "Aclamación al Evangelio" si la Misa cae en Cuaresma.
  const gospelAcclamationName = getGospelAcclamationName(massDateObj);

  // Día litúrgico especial = la celebración elegida en el constructor.
  const specialDayName = getSpecialDayName(specialDay);
  const specialDayEmoji = getSpecialDayEmoji(specialDay);
  const categoryConfig = getCategoriesForSpecialDay(specialDay);

  // ── Vigilia Pascual: número de lecturas del Antiguo Testamento ──────────────
  // El Misal prevé 7 lecturas del AT, pero por razones pastorales se pueden
  // reducir (el mínimo son 3, y siempre debe leerse la del Éxodo). El coro elige
  // cuántas se harán y el constructor muestra solo esos salmos.
  const isVigil = specialDay === 'VigiliaPascual';
  const [atReadings, setAtReadings] = useState(7);

  const visibleCategories = useMemo(() => {
    if (!isVigil) return categoryConfig.categories;
    return categoryConfig.categories.filter((cat) => {
      const m = /^Salmo AT (\d+)$/.exec(cat);
      return m ? Number(m[1]) <= atReadings : true;
    });
  }, [isVigil, categoryConfig.categories, atReadings]);

  // Al reducir el número de lecturas, sacar del cantoral los cantos de los salmos
  // que dejan de mostrarse: si se quedaran, irían al cantoral publicado sin tener
  // una tarjeta donde verlos ni editarlos.
  const handleChangeAtReadings = (n: number) => {
    const dropped = cantoral.filter((s) => {
      const m = /^Salmo AT (\d+)$/.exec(s.category);
      return m ? Number(m[1]) > n : false;
    });
    dropped.forEach((s) => onRemoveFromCantoral(s.id, s.category));
    setAtReadings(n);
    if (dropped.length > 0) {
      toast.info(
        dropped.length === 1
          ? 'Se quitó 1 canto de las lecturas eliminadas'
          : `Se quitaron ${dropped.length} cantos de las lecturas eliminadas`,
      );
    }
  };

  // Celebración y ciclo (A/B/C) derivados de la fecha de la Misa, para el salmo del libro.
  // `celebTick` fuerza recomputar tras agregar una celebración custom.
  const massCelebration = useMemo(() => getLiturgicalDateForDate(massDate), [massDate, celebTick]);
  // Lo que se celebra ADEMÁS ese día. Un domingo puede llevar encima una jornada o un
  // aniversario sin dejar de ser ese domingo: se nombran los dos.
  const celebracionesDelDia = useMemo(
    () => getCelebrationsForDate(massDate),
    [massDate, celebTick],
  );
  const tambienSeCelebra = celebracionesDelDia.ademas;
  // La del calendario que quedó desplazada por una fiesta patronal o solemnidad propia.
  // Se DICE: un domingo que desaparece sin explicación se lee como un error de la app.
  const enLugarDe = celebracionesDelDia.desplazada;
  const massCycle = getSundayCycle(massDate);

  /**
   * Preguntar con qué instrumento se toca esta Misa — SOLO si hay algo que elegir.
   *
   * Antes se preguntaba con uno o más instrumentos, y el constructor se monta cada vez
   * que se vuelve a él (se sale a mirar el calendario, se vuelve…), así que quien tiene
   * un único instrumento en su perfil se comía el mismo diálogo una y otra vez, con una
   * sola respuesta posible. Ver utils/instrument.
   */
  useEffect(() => {
    if (debePreguntarInstrumento(userInstruments) && cantoral.length === 0) {
      setShowInstrumentModal(true);
    }
  }, [userInstruments]);

  // Con un solo instrumento declarado, ese manda: si el perfil cambia, el constructor
  // se pone al día sin preguntar.
  useEffect(() => {
    if (userInstruments?.length === 1) setSelectedInstrumentForMass(userInstruments[0]);
  }, [userInstruments]);

  // Tip del constructor: la 1ª vez que el coro abre una categoría para agregar cantos.
  const anyCategoryExpanded = Object.values(expandedCategories).some(Boolean);
  useEffect(() => {
    if (anyCategoryExpanded && !hasSeenTip('constructor')) {
      setShowConstructorTip(true);
    }
  }, [anyCategoryExpanded]);

  // Actualizar instrumento cuando se selecciona
  const handleSelectInstrument = (instrument: InstrumentType) => {
    setSelectedInstrumentForMass(instrument);
    setShowInstrumentModal(false);
    // Sin toast: la tarjeta persistente "Instrumento: X" ya comunica la elección
    // (evitamos el triple aviso modal + toast + tarjeta).
  };

  // Las conversiones de horario viven en utils/massType (con sus pruebas).

  const handleToggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleCloseCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: false
    }));
  };

  // Respuesta a la pregunta de Pascua: acto penitencial (Kyrie) o rito de aspersión.
  const handleChoosePenitential = (mode: 'kyrie' | 'aspersion') => {
    setPenitentialChoice(mode);
    setShowAspersionDialog(false);
    const cat = mode === 'aspersion' ? 'Rito de Aspersión' : 'Kyrie';
    setExpandedCategories(prev => ({ ...prev, [cat]: true }));
  };

  // Genera un UUID v4 real. La policy de Storage `is_cantoral_pdf_owner` rechaza
  // nombres de objeto que no tengan forma de UUID v4, así que el PDF no se sube si
  // usamos un prefijo custom tipo `pc_${timestamp}`.
  const newCantoralId = () =>
    (crypto && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

  const handlePublish = async (targets: PublishTarget[]) => {
    // Un PublishedCantoral por destino (parroquia + fecha + horario), todos con los
    // MISMOS cantos del draft. Cada uno con su propio UUID para PDF/QR independientes.
    const now = new Date().toISOString();

    // Incluir el salmo del libro (canto "Salmo": antífona = letra + página del libro) para
    // que viaje al PDF y a la vista publicada. Solo si hay salmo y el draft no trae ya uno.
    const cantorals: PublishedCantoral[] = targets.map((t) => ({
      id: newCantoralId(),
      choirId: 'current_user',
      choirName: 'Mi Coro',
      parishName: t.parishName,
      date: t.date,
      liturgicalDate: t.liturgicalDate,
      massTime: t.massTime,
      massType: t.massType,
      vigil: t.vigil,
      createdAt: now,
      publishedBy: 'Mi Coro',
      publishedAt: now,
      songs: songsForPublish,
      status: 'published',
      garland: t.garland,
      pdfFont: t.pdfFont,
      pdfSize: t.pdfSize,
      // De quién es el cantoral. El menú de publicación ya lo resuelve cuando la
      // anfitriona vino por invitación; esto lo vuelve a resolver contra la parroquia y
      // la fecha DEFINITIVAS —la fecha se canoniza al publicar— y contra las
      // invitaciones sin filtrar, para que no se pierda la marca cuando quien publica
      // también pertenece a la parroquia anfitriona. Ver utils/choirInvitations.
      guestChoirParish: t.guestChoirParish
        ?? invitacionQueMarca(invitacionesDelDia, parroquiasPropias, t.date, t.parishName)?.guestParish,
    }));

    // Delegate to App.handlePublishCantoral which:
    //   1. Inserts into Supabase (returns error if it fails)
    //   2. Shows toast.success only after DB confirms
    //   3. Generates PDF + uploads to Storage + shows QR dialog
    //   4. Refreshes the list
    // We deliberately do NOT show a toast here to avoid double toasts and to
    // avoid the bug where the toast appeared even when publish failed.
    await onPublishCantoral(cantorals);

    // Cerrar modal solo después del flujo completo
    setShowPublishModal(false);
  };


  // El Modo Atril ocupa toda la pantalla: el botón "atrás" del teléfono debe CERRARLO,
  // no sacar de esta pantalla. Se apunta como capa mientras está abierto.
  useEffect(() => {
    if (!showAtril) return;
    return registrarCapa(() => setShowAtril(false));
  }, [showAtril]);

  return (
    <>
      <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
        {/* Encabezado compacto del constructor: el hero de bienvenida sobra en la
            pantalla de trabajo del coro (publica cada semana). Mostramos parroquia
            para dar contexto y dejamos el foco en "Datos de la Misa". */}
        <div className="pt-14 pb-1 flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-brand to-brand-strong flex items-center justify-center shadow border-2 border-brand-border">
            <Music className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-brand-ink leading-tight">
              {editingCantoral ? 'Editar cantoral' : 'Armar cantoral'}
            </h1>
            <p className="text-sm text-brand-ink-soft truncate">{parishName}</p>
          </div>
        </div>

        {/* Estás EDITANDO uno ya publicado, no armando uno nuevo. Tiene que verse: sin
            este cartel la diferencia era invisible y el coro creía estar publicando de
            nuevo. Al guardar se actualiza el mismo cantoral y NO se manda ningún aviso. */}
        {editingCantoral && (
          <div className="mt-4 bg-amber-100/80 dark:bg-amber-900/30 backdrop-blur-sm rounded-2xl p-4 border-2 border-amber-400 dark:border-amber-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0" aria-hidden>✏️</span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-amber-950 dark:text-amber-100 leading-snug">
                  Estás editando el cantoral del {formatYmdForDisplay(editingCantoral.date, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-sm text-amber-900 dark:text-amber-200 mt-0.5">
                  {editingCantoral.liturgicalDate} · {editingCantoral.massTime}. Al guardar se
                  actualiza este mismo cantoral, sin volver a avisar a la parroquia.
                </p>
                {onCancelEdit && (
                  <button
                    onClick={onCancelEdit}
                    className="mt-2 text-sm font-bold text-amber-900 dark:text-amber-200 underline underline-offset-4 active:scale-95 transition-all"
                  >
                    Cancelar la edición
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Datos de la Misa — al inicio: fecha + hora + tipo. Fijan la celebración/ciclo
            (cargan el salmo del libro) y pre-llenan el menú de publicación. */}
        <div className="mt-4 bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-blue-300/60 dark:border-blue-700/60 transition-colors">
          <h3 className="text-base font-bold text-brand-ink flex items-center gap-2 mb-3">
            <span className="text-xl flex-shrink-0">📅</span>
            <span>Datos de la Misa</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mass-date" className="text-xs font-bold text-brand-ink-soft mb-1 block">Fecha</label>
              <input
                id="mass-date"
                type="date"
                value={massDate}
                onChange={(e) => setMassDate(e.target.value || getTodayLocal())}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="mass-time" className="text-xs font-bold text-brand-ink-soft mb-1 block">Hora</label>
              <select
                id="mass-time"
                value={massTime}
                onChange={(e) => setMassTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-brand"
              >
                {MASS_TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{massTimeTo12h(t)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="mass-type" className="text-xs font-bold text-brand-ink-soft mb-1 block">Tipo de Misa</label>
            <select
              id="mass-type"
              value={massType}
              onChange={(e) => setMassType(e.target.value as MassType)}
              disabled={!!invitacionDelDestino}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-brand disabled:opacity-70"
            >
              <option value="dia">Misa del día</option>
              <option value="visperas_i">I Vísperas (sábado por la tarde)</option>
              <option value="visperas_ii">II Vísperas (domingo por la tarde)</option>
            </select>
          </div>
          {/* Dónde se canta. Se elige aquí, con la fecha, porque las dos juntas son la
              respuesta a "¿para dónde va este cantoral?" — y porque un coro invitado
              arma el cantoral de OTRA parroquia. */}
          {destinosPosibles.length > 0 && (
            <div className="mt-3">
              <label htmlFor="mass-parish" className="text-xs font-bold text-brand-ink-soft mb-1 block">Dónde se canta</label>
              <select
                id="mass-parish"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                disabled={destinosPosibles.length === 1}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-brand disabled:opacity-70"
              >
                {destinosPosibles.map((d) => (
                  <option key={d} value={d}>
                    {formatActiveParishLabel(d)}{invitaciones.some((i) => i.hostParish === d) ? ' — invitados' : ''}
                  </option>
                ))}
              </select>
              {invitacionDelDestino && (
                <p className="text-sm text-brand-ink-soft mt-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-2">
                  🤝 Van como <strong className="text-brand-ink">invitados</strong> a {formatActiveParishLabel(invitacionDelDestino.hostParish)}
                  {invitacionDelDestino.note ? ` · ${invitacionDelDestino.note}` : ''}. Este cantoral queda publicado allá
                  —para su coro y su pueblo fiel— y también en {formatActiveParishLabel(invitacionDelDestino.guestParish)}, solo para el coro.
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-brand-ink-soft mt-3">
            {massCelebration
              ? <>{formatYmdForDisplay(massDate, { weekday: 'long', day: 'numeric', month: 'long' })} · <strong className="text-brand-ink">{massCelebration}</strong> · Año {massCycle}</>
              : <>{formatYmdForDisplay(massDate, { weekday: 'long', day: 'numeric', month: 'long' })} — esta fecha no tiene una celebración en el calendario.</>}
          </p>
          {enLugarDe && (
            <p className="text-sm text-brand-ink-soft mt-1">
              En lugar de <strong className="text-brand-ink">{enLugarDe}</strong>, que este año no se celebra.
            </p>
          )}
          {tambienSeCelebra.length > 0 && (
            <p className="text-sm text-brand-ink-soft mt-1">
              También se celebra: <strong className="text-brand-ink">{tambienSeCelebra.join(' · ')}</strong>
            </p>
          )}
          {/* También cuando el día YA tiene celebración: una ordenación, una jornada o
              una fiesta patronal caen en domingo, y hasta ahora no había forma de
              anotarlas desde el constructor porque el botón solo salía en los días
              vacíos. */}
          <button
            onClick={() => setShowAddSolemnity(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-purple-800 dark:text-purple-200 active:opacity-70"
          >
            <span className="text-base">➕</span>
            {massCelebration ? 'Agregar otra celebración a este día' : 'Agregar celebración para esta fecha'}
          </button>
          {/* Atajo: hay coros que cantan TODOS los propios en gregoriano, y marcarlos
              parte por parte son cinco toques. Sólo aparece si ese día el libro trae
              algo; después se puede cambiar cualquier parte por separado. */}
          {massCelebration && hayPropios(massCelebration,
            { ciclo: massCycle, tiempo: tiempoDeLaMisa }) && (
            <div className="mt-3 pt-3 border-t border-blue-200/70 dark:border-slate-600/70">
              <p className="text-sm font-bold text-brand-ink">Propios en gregoriano</p>
              <p className="text-xs text-brand-ink-soft mb-2">
                Para toda la Misa de una vez. Cada parte se puede cambiar después.
              </p>

              {/* Cuando el libro ofrece VARIAS Misas para el mismo día, hay que elegir.
                  Pasa por dos motivos distintos y los dos se preguntan igual: la Navidad
                  tiene cuatro Misas en el Romanum, y el Simplex da ocho para todo el
                  Tiempo Ordinario porque no va por domingo sino por tiempo. */}
              {(['romanum', 'simplex'] as LibroGraduale[]).map((libro) => {
                const opciones = alternativasDelDia(libro, massCelebration, tiempoDeLaMisa);
                if (opciones.length === 0) return null;
                const esDelDia = opciones[0].clase === 'solemnidad';
                return (
                  <div key={libro} className="mb-3">
                    <label className="block text-xs font-bold text-brand-ink mb-1">
                      {esDelDia
                        ? `Misa del día · ${LIBROS[libro].corto}`
                        : `Misa del ${LIBROS[libro].corto} para ${tiempoDeLaMisa.toLowerCase()}`}
                    </label>
                    <select
                      value={misaElegida[libro] ?? ''}
                      onChange={(e) => elegirMisa(libro, e.target.value || null)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-stone-700"
                    >
                      <option value="">Elige una Misa…</option>
                      {opciones.map((m) => (
                        <option key={m.clave} value={m.clave}>
                          {m.rotuloCorto} · p. {m.pagina}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-brand-ink-soft">
                      {esDelDia
                        ? `Esta solemnidad tiene ${opciones.length} Misas con cantos distintos en el ${LIBROS[libro].nombre}.`
                        : `El ${LIBROS[libro].corto} da ${opciones.length} Misas para todo este tiempo y el coro escoge cuál canta.`}
                    </p>
                  </div>
                );
              })}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => gregorianoEnTodo('romanum')}
                  className="px-3 py-2 rounded-xl text-sm font-bold bg-stone-800 text-white border-2 border-stone-800 active:opacity-70"
                >
                  Todo el Romanum
                </button>
                <button
                  type="button"
                  onClick={() => gregorianoEnTodo('simplex')}
                  className="px-3 py-2 rounded-xl text-sm font-bold bg-stone-800 text-white border-2 border-stone-800 active:opacity-70"
                >
                  Todo el Simplex
                </button>
                <button
                  type="button"
                  onClick={() => gregorianoEnTodo(null)}
                  className="px-3 py-2 rounded-xl text-sm font-bold bg-white/70 dark:bg-white/10 text-brand-ink border-2 border-stone-300 dark:border-stone-600 active:opacity-70"
                >
                  Quitar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <KyrialeChoice
            valor={misaGregoriana}
            onChange={setMisaGregoriana}
            gloriaDe={gloriaGregoriano}
            onGloriaChange={setGloriaGregoriano}
            paterNoster={paterGregoriano}
            onPaterChange={(tono) => {
              // Un solo Padre Nuestro por Misa: el tono del Kyriale reemplaza al del Drive.
              if (tono) cantoral.filter(esPadreNuestroDelCantoral)
                .forEach((s) => onRemoveFromCantoral(s.id, s.category));
              setPaterGregoriano(tono);
            }}
          />
        </div>

        {/* Modo Atril — leer el repertorio durante la Misa */}
        {cantoral.length > 0 && (
          <button
            onClick={() => setShowAtril(true)}
            data-tour="coro-atril"
            className="w-full mt-4 bg-gradient-to-br from-slate-800 to-slate-950 text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg border-2 border-slate-700 font-bold"
          >
            <Music className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
            <span>Modo Atril</span>
          </button>
        )}

        {/* Selector de celebración — el constructor se adapta a la liturgia elegida.
            En Cuaresma/Semana Santa aparecen los oficios del Triduo para prepararlos. */}
        {celebrations.length > 1 && (
          <div data-tour="coro-celebracion" className="mt-4 bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-purple-300/60 dark:border-purple-700/60 transition-colors">
            <h3 className="text-base font-bold text-purple-950 dark:text-purple-100 mb-1 flex items-center gap-2">
              <span className="text-xl flex-shrink-0">📅</span>
              <span className="min-w-0">¿Para qué celebración armas el cantoral?</span>
            </h3>
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              El orden de la Misa y los cantos se ajustan a la liturgia que elijas.
            </p>
            <div className="flex flex-wrap gap-2">
              {celebrations.map((c) => {
                const active = c.key === selectedCelebration;
                return (
                  <button
                    key={c.key}
                    onClick={() => {
                      setSelectedCelebration(c.key);
                      setExpandedCategories({});
                      setPenitentialChoice(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                      active
                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white border-purple-800 shadow-lg'
                        : 'bg-white/70 dark:bg-white/10 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700 hover:bg-white dark:hover:bg-white/20'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Liturgical Suggestions */}
        <div className="mt-4" data-tour="coro-sugerencias">
          <LiturgicalSuggestions
            onAddToCantoral={onAddToCantoral}
            onPlaySong={playSongForThisMass}
            cantoral={cantoral}
            preferredInstrument={preferredInstrument}
          />
        </div>

        {/* Info about preferred instrument */}
        {preferredInstrument && (
          <div className="mt-6 bg-white/30 backdrop-blur-sm border-2 border-white/40 rounded-xl p-4 transition-colors">
            <div className="flex gap-3">
              <div className="text-2xl">
                {preferredInstrument === 'Guitarra' && '🎶'}
                {preferredInstrument === 'Órgano' && '🎹'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-ink mb-1">Instrumento: {preferredInstrument}</h3>
                <p className="text-base text-brand-ink-soft">
                  Solo se muestran cantos con versión de {preferredInstrument}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso de Cuaresma */}
        {gospelAcclamationName === 'Aclamación al Evangelio' && (
          <div className="mt-6 bg-purple-100/60 dark:bg-purple-900/30 backdrop-blur-sm border-2 border-purple-400/50 dark:border-purple-600/50 rounded-xl p-4 transition-colors">
            <div className="flex gap-3">
              <div className="text-2xl">📿</div>
              <div>
                <h3 className="text-lg font-bold text-purple-950 dark:text-purple-100 mb-1">Tiempo de Cuaresma</h3>
                <p className="text-base text-purple-900 dark:text-purple-200">
                  Durante la Cuaresma, el Aleluya es omitido y se canta una Aclamación al Evangelio
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso de Día Litúrgico Especial */}
        {specialDay && categoryConfig.notes.length > 0 && (
          <div className="mt-6 bg-amber-100/60 dark:bg-amber-900/30 backdrop-blur-sm border-2 border-amber-400/50 dark:border-amber-600/50 rounded-xl p-4 transition-colors">
            <div className="flex gap-3">
              <div className="text-3xl">{specialDayEmoji}</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {specialDayName}
                </h3>
                <div className="space-y-1">
                  {categoryConfig.notes.map((note, index) => (
                    <p key={index} className="text-sm text-amber-900 dark:text-amber-200">
                      • {note}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vigilia Pascual — número de lecturas del Antiguo Testamento */}
        {isVigil && (
          <div className="mt-6 bg-indigo-100/60 dark:bg-indigo-900/30 backdrop-blur-sm border-2 border-indigo-400/50 dark:border-indigo-600/50 rounded-xl p-4 transition-colors">
            <div className="flex gap-3">
              <div className="text-2xl">📖</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-indigo-950 dark:text-indigo-100 mb-1">
                  Lecturas del Antiguo Testamento
                </h3>
                <p className="text-sm text-indigo-900 dark:text-indigo-200 mb-3">
                  El Misal prevé 7 lecturas con su salmo. Por razones pastorales se pueden reducir;
                  la del Éxodo (paso del Mar Rojo) nunca se omite.
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Número de lecturas del Antiguo Testamento">
                  {[3, 4, 5, 6, 7].map((n) => {
                    const active = n === atReadings;
                    return (
                      <button
                        key={n}
                        onClick={() => handleChangeAtReadings(n)}
                        aria-pressed={active}
                        className={`min-w-[3rem] px-4 py-2.5 rounded-xl font-bold text-base border-2 transition-all active:scale-95 ${
                          active
                            ? 'bg-gradient-to-br from-brand to-brand-strong text-white border-brand-border shadow-lg'
                            : 'bg-white/70 dark:bg-white/10 text-indigo-950 dark:text-indigo-100 border-indigo-300/60 dark:border-indigo-600/40 hover:bg-white'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Searches - DINÁMICAS según el día litúrgico */}
        <div className="mt-8 space-y-6" data-tour="coro-categorias">
          {visibleCategories.map((rawCategory) => {
            // En Pascua, el Kyrie puede convertirse en el Rito de Aspersión según
            // lo que elija el coro (se le pregunta al tocar el Kyrie).
            const afterPenitential = (isEaster && rawCategory === 'Kyrie' && penitentialChoice === 'aspersion')
              ? 'Rito de Aspersión'
              : rawCategory;
            // En Cuaresma el Aleluya se omite y la tarjeta pasa a llamarse
            // "Aclamación al Evangelio". Solo cambia el rótulo: el canto sigue
            // perteneciendo al momento 'aleluya' de la BD.
            const category = displayCategoryForDate(afterPenitential, massDateObj);
            // Obtener el ícono según la categoría
            const getCategoryIcon = (cat: string): string => {
              const icons: Record<string, string> = {
                'Entrada': '⛪',
                'Kyrie': '🙏',
                'Rito de Aspersión': '💧',
                'Gloria': '✨',
                'Salmo': '📖',
                'Aleluya': '🎺',
                'Aclamación al Evangelio': '📯',
                'Post Evangelio': '📿',
                'Ofertorio': '🍇',
                'Santo': '✝️',
                'Cordero de Dios': '🐑',
                'Comunión': '🫓',
                'Salida': '⛪',
                // Categorías especiales
                'Exposición y Procesión': '🕯️',
                'Pregón Pascual': '🕯️',
                'Salmo AT 1': '📜',
                'Salmo AT 2': '📜',
                'Salmo AT 3': '📜',
                'Salmo AT 4': '📜',
                'Salmo AT 5': '📜',
                'Salmo AT 6': '📜',
                'Salmo AT 7': '📜',
                'Salmo Epistolar': '📖',
                'Aleluya Triple': '🎺',
                'Secuencia de Pascua': '🌅',
                'Secuencia de Pentecostés': '🔥',
                'Secuencia de Corpus': '🍞',
                'Kalenda Navideña': '⭐',
              };
              return icons[cat] || '🎵';
            };

            const icon = getCategoryIcon(category);

            // Al tocar el Kyrie en Pascua, preguntar primero: acto penitencial o aspersión.
            const askFirst = isEaster && rawCategory === 'Kyrie' && penitentialChoice === null;

            // El Salmo NO se elige del catálogo: viene del libro musicalizado según la
            // fecha (partitura para el coro + antífona editable). Reemplaza a la tarjeta.
            if (category === 'Salmo') {
              return (
                <div key={rawCategory}>
                  <PsalmFromBook
                    date={massDate}
                    role="Coro"
                    antiphon={psalmAntiphon}
                    onAntiphonChange={cambiarAntifona}
                    editable
                    hideScore
                  />
                </div>
              );
            }

            // Entrada y Comunión llevan, ADEMÁS de su buscador de cantos, la antífona
            // propia del día: se canta después del canto de entrada, y al empezar la
            // comunión. La casilla decide si viaja al folleto del pueblo.
            const conAntifona = category === 'Entrada' || category === 'Comunión';
            // Las cinco partes con propio en el Graduale llevan además el selector de
            // gregoriano. Son más que las dos del Misal: el gradual, el aleluya y el
            // ofertorio también tienen melodía propia en el libro.
            const conGregoriano = parteTienePropio(category);

            return (
              <div key={rawCategory} className={conAntifona || conGregoriano ? 'space-y-3' : undefined}>
              <CategorySearch
                category={category}
                icon={icon}
                isExpanded={expandedCategories[category] || false}
                onToggle={askFirst ? () => setShowAspersionDialog(true) : () => handleToggleCategory(category)}
                onClose={() => handleCloseCategory(category)}
                onAddToCantoral={onAddToCantoral}
                onRemoveFromCantoral={onRemoveFromCantoral}
                cantoral={cantoral}
                onPlaySong={playSongForThisMass}
                preferredInstrument={preferredInstrument}
                userInstrument={selectedInstrumentForMass}
                userVoicePart={userVoicePart}
                previousUsage={previousUsage}
                massDate={massDate}
              />
              {conAntifona && (
                <MassAntiphon
                  date={massDate}
                  parte={category === 'Entrada' ? 'Entrada' : 'Comunión'}
                  value={category === 'Entrada' ? antifonaEntrada : antifonaComunion}
                  onChange={category === 'Entrada' ? cambiarAntifonaEntrada : cambiarAntifonaComunion}
                  incluir={category === 'Entrada' ? incluirEntrada : incluirComunion}
                  onIncluirChange={category === 'Entrada' ? setIncluirEntrada : setIncluirComunion}
                />
              )}
              {conGregoriano && massCelebration && (
                <GradualeChoice
                  celebracion={massCelebration}
                  parte={category}
                  ciclo={massCycle}
                  tiempo={tiempoDeLaMisa}
                  misaElegida={libroGregoriano[category]
                    ? misaElegida[libroGregoriano[category]!] : undefined}
                  valor={libroGregoriano[category] ?? null}
                  onChange={(libro) => elegirGregoriano(category, libro)}
                />
              )}
              </div>
            );
          })}
        </div>

        {/* Padre Nuestro y aclamaciones: siempre a la vista, también al EDITAR un
            cantoral (el diálogo del Ofertorio solo aparece al agregarlo). */}
        <div className="mt-6">
          <PadreNuestroYAclamaciones
            cantoral={cantoral}
            onAdd={onAddToCantoral}
            onRemove={onRemoveFromCantoral}
            paterDelKyriale={paterGregoriano}
            onQuitarPaterDelKyriale={() => setPaterGregoriano(null)}
          />
        </div>

        {/* Spacer so the last category isn't covered by the sticky CTA (que en
            móvil/tablet va por encima de la BottomNav → necesita más aire). */}
        {cantoral.length > 0 && <div aria-hidden className="h-40 lg:h-28" />}
      </div>

      {/* Sticky Publish CTA — always visible at the bottom of the viewport
          while there is at least one song in the draft. Respects iOS safe area. */}
      {cantoral.length > 0 && (
        <div
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-amber-100 via-amber-100/95 to-amber-100/0 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/0 px-3 sm:px-4 pt-6 pb-3 lg:pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="max-w-md md:max-w-2xl mx-auto">
            <button
              onClick={() => setShowPublishModal(true)}
              data-tour="coro-publicar"
              className="w-full bg-gradient-to-br from-brand to-brand-strong text-white py-4 px-3 sm:px-4 rounded-2xl shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-3 border-2 border-brand-border"
            >
              <Send className="w-6 h-6 flex-shrink-0" />
              <span className="text-base sm:text-lg font-bold min-w-0 leading-tight text-center break-words">
                {editingCantoral ? 'Guardar cambios' : 'Publicar Cantoral'} · {cantoral.length} {cantoral.length === 1 ? 'canto' : 'cantos'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishCantoralModal
          cantoral={songsForPublish}
          parishName={parishName}
          parishes={parishes}
          invitations={invitaciones}
          isAdmin={isAdmin}
          initialParish={destino}
          initialDate={massDate}
          initialMassTime={massTimeTo12h(massTime)}
          initialMassType={massType}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
          userInstruments={userInstruments}
          isEditing={!!editingCantoral}
        />
      )}

      {/* Modo Atril */}
      {showAtril && (
        <AtrilMode
          songs={songsForPublish}
          userRole="Coro"
          userInstrument={selectedInstrumentForMass}
          userVoicePart={userVoicePart}
          onClose={() => setShowAtril(false)}
        />
      )}

      {/* Agregar celebración para una fecha sin celebración en el calendario */}
      {showAddSolemnity && (
        <AddSolemnityModal
          selectedDate={massDate}
          isAdmin={isAdmin}
          // Mismo respaldo que al publicar: sin lista de parroquias en el perfil, vale la
          // activa. Sin esto el coro se quedaba con el botón "Agregar celebración"
          // apagado y sin nada que elegir para encenderlo.
          parishes={parishes?.length ? parishes : (parishName ? [parishName] : [])}
          onClose={() => setShowAddSolemnity(false)}
          onAdd={async (name, date, scope, type, replacesDefault, color) => {
            setShowAddSolemnity(false);
            const r = await addCustomLiturgicalDate({ name, date, type, scope, replacesDefault, color });
            if (r.ok && r.row) {
              setPersistedCustomDates([...getPersistedCustomDates(), toLiturgicalDate(r.row)]);
              toast.success('Celebración agregada', { description: name });
              // Se guardó, pero recortada porque falta correr una migración.
              if (r.warning) toast.warning('Guardada sin color ni reemplazo', { description: r.warning, duration: 8000 });
            } else {
              toast.warning('No se pudo guardar la celebración', { description: r.error });
            }
            setCelebTick((t) => t + 1);
          }}
        />
      )}

      {/* Tip contextual del constructor (F4) */}
      {showConstructorTip && !showAtril && (
        <Tour
          steps={constructorTips}
          onClose={() => { markTipSeen('constructor'); setShowConstructorTip(false); }}
        />
      )}

      {/* Select Instrument Modal */}
      {showInstrumentModal && (
        <SelectInstrumentModal
          userInstruments={userInstruments}
          selectedInstrument={selectedInstrumentForMass}
          onClose={() => setShowInstrumentModal(false)}
          onSelect={handleSelectInstrument}
        />
      )}

      {/* Pregunta de Pascua: acto penitencial vs rito de aspersión (IGMR 51) */}
      <Modal
        open={showAspersionDialog}
        onClose={() => setShowAspersionDialog(false)}
        labelledById="aspersion-title"
        panelClassName="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-sky-700 dark:border-sky-600"
      >
        <div className="bg-gradient-to-br from-sky-600 to-blue-700 text-white p-6 border-b-4 border-sky-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl flex-shrink-0">💧</span>
            <div className="min-w-0">
              <h3 id="aspersion-title" className="text-xl font-bold leading-tight">Tiempo Pascual</h3>
              <p className="text-sm text-sky-100 mt-1">¿Cómo será el inicio de la Misa?</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-base text-blue-950 dark:text-blue-100 mb-2 leading-relaxed">
            En Pascua puede hacerse el <strong>Rito de Aspersión</strong> en lugar del acto
            penitencial. Eso cambia el canto de este momento (y se omite el Kyrie).
          </p>
          <button
            onClick={() => handleChoosePenitential('kyrie')}
            className="w-full bg-white dark:bg-slate-700 text-brand-ink p-4 rounded-2xl flex items-center gap-3 border-2 border-blue-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-600 active:scale-95 transition-all text-left"
          >
            <span className="text-2xl flex-shrink-0">🙏</span>
            <span className="min-w-0">
              <span className="block font-bold">Acto penitencial (Kyrie)</span>
              <span className="block text-sm text-blue-700 dark:text-blue-300">Señor, ten piedad</span>
            </span>
          </button>
          <button
            onClick={() => handleChoosePenitential('aspersion')}
            className="w-full bg-gradient-to-br from-sky-600 to-blue-700 text-white p-4 rounded-2xl flex items-center gap-3 border-2 border-sky-800 hover:opacity-90 active:scale-95 transition-all text-left"
          >
            <span className="text-2xl flex-shrink-0">💧</span>
            <span className="min-w-0">
              <span className="block font-bold">Rito de aspersión</span>
              <span className="block text-sm text-sky-100">Canto de aspersión (memoria del Bautismo)</span>
            </span>
          </button>
        </div>
      </Modal>
    </>
  );
}
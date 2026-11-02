import { useEffect, useState } from 'react';
import { Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '../../types';
import { ACLAMACIONES, Aclamacion } from '../../data/aclamaciones';
import { useSongs } from '../../hooks/useSongs';
import { listarPartituras } from '../../utils/ordinarySheetMusic';
import {
  PadreNuestroIdioma, construirPadreNuestro, construirAclamacion, idiomaEnElCantoral,
  aclamacionesEnElCantoral, misaDelCantoral, esPadreNuestroDelCantoral,
  obrasDeElevacion, construirElevacion,
} from '../../utils/padreNuestroYAclamaciones';
import {
  todosLosTonosDelPaterNoster, paterNosterImageUrl, clavePaterNoster, desdeClavePaterNoster,
} from '../../data/kyrialeIndex';
import { LIBROS } from '../../data/gradualeIndex';
import { CasillaPartitura } from './CasillaPartitura';
import { ELEVACION } from '../../utils/instrumental';

interface PadreNuestroYAclamacionesProps {
  cantoral: Song[];
  onAdd: (song: Song) => void;
  onRemove: (songId: string, category?: string) => void;
  /** Tono del Padre Nuestro gregoriano: «A» (Romanum) o «simplex:A», o `null`. */
  paterDelKyriale: string | null;
  /** Pone o quita ese tono. Se elige aquí y en ningún otro lado. */
  onPaterDelKyrialeChange: (tono: string | null) => void;
  /** ¿El folleto lleva la partitura del Padre Nuestro y las aclamaciones? */
  partitura: boolean;
  onPartituraChange: (incluir: boolean) => void;
}

/** Versión del Padre Nuestro: la del Drive (es / la), un tono del Kyriale, o ninguna. */
type Version = PadreNuestroIdioma | `tono:${string}` | null;

/**
 * El Padre Nuestro y las aclamaciones: el ÚNICO lugar del constructor donde se eligen.
 *
 * Antes el Padre Nuestro se decidía en tres sitios (el tono en la tarjeta del Kyriale,
 * esta tarjeta y un diálogo al agregar el Ofertorio) y se pisaban entre sí. Ahora todo
 * vive aquí, en su lugar de la Misa (antes del Cordero), igual al crear que al editar:
 * la versión, si van las demás aclamaciones, y si el folleto lleva su partitura.
 */
export function PadreNuestroYAclamaciones({
  cantoral, onAdd, onRemove, paterDelKyriale, onPaterDelKyrialeChange,
  partitura, onPartituraChange,
}: PadreNuestroYAclamacionesProps) {
  const { songs: catalogo } = useSongs();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [verTono, setVerTono] = useState(false);

  const idioma = idiomaEnElCantoral(cantoral);
  const puestas = aclamacionesEnElCantoral(cantoral);
  const tonos = todosLosTonosDelPaterNoster();
  const tonoElegido = desdeClavePaterNoster(paterDelKyriale);
  const version: Version = paterDelKyriale ? `tono:${paterDelKyriale}` : idioma;
  const gregoriano = version === 'la' || !!paterDelKyriale;

  /**
   * Los toques de elevación que hay (catálogo + carpeta «Elevación» del Drive). Se
   * cargan al abrir: el listado del Drive queda en memoria y lo usan las demás casillas.
   */
  const [obrasElevacion, setObrasElevacion] = useState<Song[] | null>(null);
  useEffect(() => {
    let vivo = true;
    listarPartituras()
      .then((files) => { if (vivo) setObrasElevacion(obrasDeElevacion(files, catalogo)); })
      .catch(() => { if (vivo) setObrasElevacion([]); });
    return () => { vivo = false; };
  }, [catalogo]);
  const elevacionPuesta = cantoral.find((s) => s.category === ELEVACION);

  const quitarPadreNuestro = () =>
    cantoral.filter(esPadreNuestroDelCantoral).forEach((s) => onRemove(s.id, s.category));

  const elegirVersion = async (nueva: Version) => {
    if (nueva === version) return;
    setOcupado('padre');
    try {
      quitarPadreNuestro();
      if (nueva?.startsWith('tono:')) {
        onPaterDelKyrialeChange(nueva.slice(5));
        return;
      }
      if (paterDelKyriale) onPaterDelKyrialeChange(null);
      if (nueva === null) return;
      const idiomaNuevo = nueva as PadreNuestroIdioma;
      const pn = construirPadreNuestro(idiomaNuevo, await listarPartituras());
      onAdd(pn);
      if (!pn.sheetMusicUrl) {
        toast.warning('Padre Nuestro agregado con su letra', {
          description: `No hallé «${idiomaNuevo === 'la' ? 'Pater noster' : 'Padre nuestro-Voz'}» en la carpeta Padre Nuestro del Drive.`,
        });
      }
    } finally {
      setOcupado(null);
    }
  };

  /** Pone el toque de elevación elegido (o lo quita con `null`). Uno solo por Misa. */
  const elegirElevacion = (obra: Song | null) => {
    cantoral.filter((s) => s.category === ELEVACION).forEach((s) => onRemove(s.id, s.category));
    if (obra) onAdd(construirElevacion(obra));
  };
  /** La obra del listado que corresponde a la que está puesta (su id es `<obra>::…`). */
  const obraPuesta = elevacionPuesta
    ? obrasElevacion?.find((o) => String(elevacionPuesta.id).startsWith(`${o.id}::`))
    : undefined;

  const alternarAclamacion = async (a: Aclamacion) => {
    setOcupado(a.id);
    try {
      const actuales = cantoral.filter((s) => s.category === a.category);
      if (actuales.length) {
        actuales.forEach((s) => onRemove(s.id, s.category));
        return;
      }
      const song = construirAclamacion(
        a, misaDelCantoral(cantoral), await listarPartituras(),
        catalogo.filter((s) => s.category === a.category),
      );
      onAdd(song);
      if (!song.sheetMusicUrl) {
        toast.info(`${a.titulo}: agregada con su letra`, { description: 'No hallé su partitura en el Drive.' });
      }
    } finally {
      setOcupado(null);
    }
  };

  const boton = (activa: boolean, rotulo: string, onClick: () => void, tono: 'azul' | 'piedra' = 'azul') => (
    <button
      key={rotulo}
      type="button"
      disabled={ocupado !== null}
      aria-pressed={activa}
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold border-2 transition-colors disabled:opacity-60
        ${activa
          ? (tono === 'azul'
            ? 'bg-brand text-white border-brand-border'
            : 'bg-stone-800 text-white border-stone-800 dark:bg-stone-200 dark:text-stone-900 dark:border-stone-200')
          : 'bg-white/70 dark:bg-white/10 text-brand-ink border-blue-200 dark:border-blue-800 hover:bg-white dark:hover:bg-white/20'}`}
    >
      {rotulo}
    </button>
  );

  const filaClase = 'flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 border-2 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-white/90 dark:hover:bg-white/10 transition-colors';

  const casilla = (a: Aclamacion) => (
    <label key={a.id} className={filaClase}>
      <input
        type="checkbox"
        checked={puestas.includes(a.id)}
        disabled={ocupado !== null}
        onChange={() => alternarAclamacion(a)}
        className="mt-1 w-5 h-5 flex-shrink-0 accent-blue-700"
      />
      <span className="text-sm text-brand-ink-soft">
        <strong className="text-brand-ink">{a.titulo}</strong>
        <br />
        <span className="text-xs">{a.resumen}</span>
      </span>
    </label>
  );

  /** La elevación no es una aclamación cantada: es un toque de bronces, solo del coro. */
  const casillaElevacion = () => {
    const obras = obrasElevacion ?? [];
    const sinObras = obrasElevacion !== null && obras.length === 0;
    return (
      <div key="elevacion" className={`${filaClase} flex-col !gap-2 ${sinObras && !elevacionPuesta ? 'opacity-70' : ''}`}>
        <label className="flex items-start gap-3 cursor-pointer w-full">
          <input
            type="checkbox"
            checked={!!elevacionPuesta}
            disabled={ocupado !== null || obrasElevacion === null || (sinObras && !elevacionPuesta)}
            onChange={() => elegirElevacion(elevacionPuesta ? null : obras[0] ?? null)}
            className="mt-1 w-5 h-5 flex-shrink-0 accent-blue-700"
          />
          <span className="text-sm text-brand-ink-soft">
            <strong className="text-brand-ink">Elevación (toque de bronces)</strong>
            <br />
            <span className="text-xs">
              {obrasElevacion === null
                ? 'Buscando los toques en el Drive…'
                : sinObras
                  ? 'Aún no hay toques: súbelos a la carpeta «Elevación» del Drive.'
                  : 'Solo para el coro: el pueblo no lo ve, ni en su vista ni en el folleto.'}
            </span>
          </span>
        </label>
        {elevacionPuesta && obras.length > 1 && (
          <select
            value={obraPuesta?.id ?? ''}
            onChange={(e) => elegirElevacion(obras.find((o) => o.id === e.target.value) ?? null)}
            aria-label="Toque de elevación"
            className="ml-8 w-[calc(100%-2rem)] px-3 py-2 rounded-lg text-sm text-gray-900 bg-white border-2 border-blue-200 focus:outline-none focus:border-blue-500"
          >
            {!obraPuesta && <option value="">{elevacionPuesta.title}</option>}
            {obras.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
        )}
      </div>
    );
  };

  return (
    <section
      aria-labelledby="pn-aclamaciones-titulo"
      className="rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-blue-950 transition-colors"
    >
      <h3 id="pn-aclamaciones-titulo" className="flex items-center gap-2 text-base sm:text-lg font-bold text-brand-ink mb-3">
        <span aria-hidden>🙏</span> Padre Nuestro y aclamaciones
        {ocupado && <Loader className="w-4 h-4 animate-spin" aria-label="Buscando partitura" />}
      </h3>

      {/* Padre Nuestro: la versión se elige una sola vez, aquí. */}
      <p className="text-sm font-semibold text-brand-ink-soft mb-2">Padre Nuestro cantado</p>
      <div className="flex flex-col sm:flex-row gap-2 mb-2" role="group" aria-label="Padre Nuestro cantado">
        {boton(version === null, 'No se canta', () => elegirVersion(null))}
        {boton(version === 'es', 'Español', () => elegirVersion('es'))}
        {boton(gregoriano, 'Gregoriano (latín)', () => { if (!gregoriano) elegirVersion('la'); })}
      </div>
      {gregoriano && tonos.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-brand-ink-soft mb-1">¿Cuál partitura del Pater noster?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Partitura del Pater noster">
            {boton(version === 'la', 'La de la parroquia (Drive)', () => elegirVersion('la'), 'piedra')}
            {tonos.map(({ libro, tono }) => {
              const clave = clavePaterNoster(libro, tono.tono);
              return boton(
                paterDelKyriale === clave, `Tono ${tono.tono} · ${LIBROS[libro].corto}`,
                () => elegirVersion(`tono:${clave}`), 'piedra',
              );
            })}
          </div>
          {tonoElegido && (
            <>
              <button
                type="button"
                onClick={() => setVerTono((v) => !v)}
                className="mt-2 flex items-center gap-1 text-xs font-bold text-stone-700 dark:text-stone-300"
              >
                {verTono ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Ver la partitura
              </button>
              {verTono && (
                <div className="mt-2 overflow-x-auto rounded-lg bg-white p-2">
                  <img
                    src={paterNosterImageUrl(tonoElegido.libro, tonoElegido.tono)}
                    alt={`Padre Nuestro, tono ${tonoElegido.tono} del ${LIBROS[tonoElegido.libro].corto}`}
                    loading="lazy"
                    className="block mx-auto w-full"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Aclamaciones: una lista para marcar las que van, en el orden de la Misa. El
          toque de la elevación va entre la oración universal y la aclamación. */}
      <p className="text-sm font-semibold text-brand-ink-soft mt-3 mb-2">¿Qué aclamaciones incluimos?</p>
      <div className="space-y-2" role="group" aria-label="Aclamaciones">
        {casilla(ACLAMACIONES[0])}
        {casillaElevacion()}
        {ACLAMACIONES.slice(1).map(casilla)}
        <p className="text-xs text-blue-700 dark:text-blue-300">
          La partitura sale del Drive (carpeta de la Misa o «Aclamaciones»); si no está, va la letra.
        </p>
      </div>

      {/* La partitura, solo cuando hay algo de esta tarjeta que cantar. */}
      {(version !== null || puestas.length > 0) && (
        <div className="mt-3">
          <CasillaPartitura
            checked={partitura}
            onChange={onPartituraChange}
            detalle="Padre Nuestro y aclamaciones: por ahora el folleto lleva solo la letra (una hoja)."
          />
        </div>
      )}
    </section>
  );
}

import { useState } from 'react';
import { Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '../../types';
import { ACLAMACIONES, Aclamacion } from '../../data/aclamaciones';
import { useSongs } from '../../hooks/useSongs';
import { listarPartituras } from '../../utils/ordinarySheetMusic';
import {
  PadreNuestroIdioma, construirPadreNuestro, construirAclamacion, idiomaEnElCantoral,
  aclamacionesEnElCantoral, misaDelCantoral, esPadreNuestroDelCantoral,
} from '../../utils/padreNuestroYAclamaciones';
import { tonosDelPaterNoster, paterNosterImageUrl } from '../../data/kyrialeIndex';
import { CasillaPartitura } from './CasillaPartitura';

interface PadreNuestroYAclamacionesProps {
  cantoral: Song[];
  onAdd: (song: Song) => void;
  onRemove: (songId: string, category?: string) => void;
  /** Tono del Padre Nuestro gregoriano del Kyriale (A, B, C), o `null`. */
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
  const tonos = tonosDelPaterNoster('romanum');
  const version: Version = paterDelKyriale ? `tono:${paterDelKyriale}` : idioma;
  const gregoriano = version === 'la' || !!paterDelKyriale;
  /** «¿Incluir las demás aclamaciones?» Queda en Sí si ya hay alguna puesta. */
  const [quiereAclamaciones, setQuiereAclamaciones] = useState(puestas.length > 0);
  const conAclamaciones = quiereAclamaciones || puestas.length > 0;

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

  /** «No» a las aclamaciones: se cierra la lista y se quitan las que hubiera. */
  const elegirAclamaciones = (si: boolean) => {
    setQuiereAclamaciones(si);
    if (si) return;
    for (const a of ACLAMACIONES) {
      cantoral.filter((s) => s.category === a.category).forEach((s) => onRemove(s.id, s.category));
    }
  };

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
            {tonos.map((t) => boton(
              paterDelKyriale === t.tono, `Tono ${t.tono} · Kyriale`,
              () => elegirVersion(`tono:${t.tono}`), 'piedra',
            ))}
          </div>
          {paterDelKyriale && (
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
                    src={paterNosterImageUrl('romanum', paterDelKyriale)}
                    alt={`Padre Nuestro, tono ${paterDelKyriale}`}
                    loading="lazy"
                    className="block mx-auto w-full"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Aclamaciones: primero si van, después cuáles. */}
      <p className="text-sm font-semibold text-brand-ink-soft mt-3 mb-2">¿Incluir las demás aclamaciones?</p>
      <div className="flex gap-2 mb-2" role="group" aria-label="Incluir las demás aclamaciones">
        {boton(!conAclamaciones, 'No', () => elegirAclamaciones(false))}
        {boton(conAclamaciones, 'Sí', () => elegirAclamaciones(true))}
      </div>
      {conAclamaciones && (
        <div className="space-y-2">
          {ACLAMACIONES.map((a) => {
            const puesta = puestas.includes(a.id);
            return (
              <label
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 border-2 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={puesta}
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
          })}
          <p className="text-xs text-blue-700 dark:text-blue-300">
            La partitura sale del Drive (carpeta de la Misa o «Aclamaciones»); si no está, va la letra.
          </p>
        </div>
      )}

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

import { useState } from 'react';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '../../types';
import { ACLAMACIONES, Aclamacion } from '../../data/aclamaciones';
import { useSongs } from '../../hooks/useSongs';
import { listarPartituras } from '../../utils/ordinarySheetMusic';
import {
  PadreNuestroIdioma, construirPadreNuestro, construirAclamacion, idiomaEnElCantoral,
  aclamacionesEnElCantoral, misaDelCantoral, esPadreNuestroDelCantoral,
} from '../../utils/padreNuestroYAclamaciones';

interface PadreNuestroYAclamacionesProps {
  cantoral: Song[];
  onAdd: (song: Song) => void;
  onRemove: (songId: string, category?: string) => void;
  /** Tono del Padre Nuestro gregoriano del Kyriale (imagen), si se eligió allá. */
  paterDelKyriale: string | null;
  /** Quita ese tono: no puede haber dos Padre Nuestro en la misma Misa. */
  onQuitarPaterDelKyriale: () => void;
}

/**
 * El Padre Nuestro y las aclamaciones, siempre a la vista en el constructor.
 *
 * Existe porque el diálogo que los ofrece solo aparece al agregar el Ofertorio: al
 * EDITAR un cantoral ya publicado no había forma de ponerlos ni de quitarlos. Aquí se
 * ve lo que el cantoral trae y se cambia de un toque, igual al crear que al editar.
 */
export function PadreNuestroYAclamaciones({
  cantoral, onAdd, onRemove, paterDelKyriale, onQuitarPaterDelKyriale,
}: PadreNuestroYAclamacionesProps) {
  const { songs: catalogo } = useSongs();
  const [ocupado, setOcupado] = useState<string | null>(null);

  const idioma = idiomaEnElCantoral(cantoral);
  const puestas = aclamacionesEnElCantoral(cantoral);

  const quitarPadreNuestro = () =>
    cantoral.filter(esPadreNuestroDelCantoral).forEach((s) => onRemove(s.id, s.category));

  const elegirPadreNuestro = async (nuevo: PadreNuestroIdioma | null) => {
    if (nuevo === idioma && !paterDelKyriale) return;
    setOcupado('padre');
    try {
      quitarPadreNuestro();
      if (paterDelKyriale) onQuitarPaterDelKyriale();
      if (nuevo === null) return;
      const pn = construirPadreNuestro(nuevo, await listarPartituras());
      onAdd(pn);
      if (!pn.sheetMusicUrl) {
        toast.warning('Padre Nuestro agregado con su letra', {
          description: `No hallé «${nuevo === 'la' ? 'Pater noster' : 'Padre nuestro-Voz'}» en la carpeta Padre Nuestro del Drive.`,
        });
      }
    } finally {
      setOcupado(null);
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

  const opcion = (valor: PadreNuestroIdioma | null, rotulo: string) => {
    const activa = paterDelKyriale ? false : idioma === valor;
    return (
      <button
        key={rotulo}
        type="button"
        disabled={ocupado !== null}
        aria-pressed={activa}
        onClick={() => elegirPadreNuestro(valor)}
        className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold border-2 transition-colors disabled:opacity-60
          ${activa
            ? 'bg-brand text-white border-brand-border'
            : 'bg-white/70 dark:bg-white/10 text-brand-ink border-blue-200 dark:border-blue-800 hover:bg-white dark:hover:bg-white/20'}`}
      >
        {rotulo}
      </button>
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

      {/* Padre Nuestro */}
      <p className="text-sm font-semibold text-brand-ink-soft mb-2">Padre Nuestro cantado</p>
      <div className="flex flex-col sm:flex-row gap-2 mb-2" role="group" aria-label="Padre Nuestro cantado">
        {opcion(null, 'No se canta')}
        {opcion('es', 'Español')}
        {opcion('la', 'Gregoriano (latín)')}
      </div>
      {paterDelKyriale && (
        <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
          Va el tono {paterDelKyriale} del Kyriale (elegido arriba). Si eliges otra opción aquí, se reemplaza.
        </p>
      )}

      {/* Aclamaciones */}
      <p className="text-sm font-semibold text-brand-ink-soft mt-3 mb-2">Aclamaciones cantadas</p>
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
      </div>
      <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
        La partitura sale del Drive (carpeta de la Misa, «Aclamaciones» o «Padre Nuestro»); si no está, va la letra.
      </p>
    </section>
  );
}

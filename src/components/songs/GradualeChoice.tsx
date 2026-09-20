import { useState } from 'react';
import { Music4, ChevronDown, ChevronUp } from 'lucide-react';
import {
  librosDisponibles, resolveGraduale, LIBROS, nombreDelPropio,
  type LibroGraduale, type CicloGraduale,
} from '../../data/gradualeIndex';

interface GradualeChoiceProps {
  celebracion: string;
  parte: string;
  ciclo?: CicloGraduale;
  /** Tiempo litúrgico de la fecha: de él salen las Misas del Simplex. */
  tiempo?: string;
  /** La Misa que el coro eligió para ese día en ESTE libro, si el día trae varias. */
  misaElegida?: string | null;
  /** Libro elegido para esta parte, o `null` si el coro no quiere gregoriano aquí. */
  valor: LibroGraduale | null;
  onChange: (libro: LibroGraduale | null) => void;
}

/**
 * Elegir el propio gregoriano de UNA parte de la Misa.
 *
 * Se elige parte por parte a propósito: hay coros que cantan el introito en gregoriano
 * y el resto en castellano, y eso tiene que poder hacerse sin pelear con la app. Los
 * dos libros se ofrecen sólo cuando de verdad traen ese canto ese día, para que no haya
 * botones que no llevan a ninguna parte.
 *
 * No reemplaza al canto de la parte ni a la antífona del Misal: se suma. Y la partitura
 * se imprime también en el folleto del pueblo, porque el gregoriano lo canta la
 * asamblea, no sólo el coro.
 */
export function GradualeChoice({
  celebracion, parte, ciclo, tiempo, misaElegida, valor, onChange,
}: GradualeChoiceProps) {
  const [abierto, setAbierto] = useState(false);
  const opciones = { ciclo, tiempo, misaElegida };
  const disponibles = librosDisponibles(celebracion, parte, opciones);
  if (disponibles.length === 0) return null;

  const elegido = valor ? resolveGraduale(valor, celebracion, parte, opciones) : null;

  return (
    <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-stone-300/70 dark:border-stone-600/70 transition-colors">
      <div className="flex items-start gap-2 mb-3">
        <Music4 className="w-5 h-5 flex-shrink-0 text-stone-700 dark:text-stone-300 mt-0.5" strokeWidth={2.5} />
        <div className="min-w-0">
          <h4 className="text-base font-bold text-brand-ink leading-tight">Propio gregoriano</h4>
          <p className="text-xs text-brand-ink-soft">
            La melodía del libro, con tetragrama. Se imprime también en el folleto del pueblo.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip activo={valor === null} onClick={() => onChange(null)} rotulo="Sin gregoriano" />
        {disponibles.map((libro) => (
          <Chip
            key={libro}
            activo={valor === libro}
            onClick={() => onChange(valor === libro ? null : libro)}
            rotulo={LIBROS[libro].corto}
          />
        ))}
      </div>

      {elegido && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-xs font-bold text-stone-800 dark:text-stone-200"
          >
            <span className="min-w-0 truncate text-left">
              {nombreDelPropio(elegido.canto, parte)} · {elegido.misa} · p. {elegido.pagina}
              {/* El año sólo se nombra donde el libro trae una melodía para cada uno.
                  No es algo que se elija: lo pone la fecha de la Misa. */}
              {elegido.año && ` · Año ${elegido.año}`}
            </span>
            {abierto
              ? <ChevronUp className="w-4 h-4 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
          </button>
          {abierto && (
            <div className="mt-2 overflow-x-auto rounded-lg bg-white p-2">
              <img
                src={elegido.imagen}
                alt={`${nombreDelPropio(elegido.canto, parte)} — ${elegido.misa}`}
                loading="lazy"
                className="block mx-auto w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ activo, onClick, rotulo }: { activo: boolean; onClick: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${
        activo
          ? 'bg-stone-800 text-white border-stone-800 dark:bg-stone-200 dark:text-stone-900 dark:border-stone-200'
          : 'bg-white/70 dark:bg-white/10 text-brand-ink border-stone-300 dark:border-stone-600'
      }`}
    >
      {rotulo}
    </button>
  );
}

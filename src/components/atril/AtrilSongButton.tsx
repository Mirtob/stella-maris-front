import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import { Song, UserRole, InstrumentType } from '../../types';
import { AtrilMode } from './AtrilMode';
import { registrarCapa } from '../../utils/navegacionAtras';

interface AtrilSongButtonProps {
  song: Song;
  userRole?: UserRole;
  userInstrument?: InstrumentType;
  /** Voz del corista (SATB, viento…), para que se abra en SU partitura. */
  userVoicePart?: string;
  /** Solo el ícono, para las filas compactas donde no cabe el rótulo. */
  iconOnly?: boolean;
  /** Estilo a medida cuando el botón vive dentro de otra botonera. */
  className?: string;
}

/**
 * Abre UN canto en Modo Atril.
 *
 * El Atril nació para leer la Misa entera, pero el ensayo se trabaja canto por canto:
 * se abre el que se está aprendiendo y ahí mismo quedan a mano el zoom, el
 * transpositor, el metrónomo, el autoscroll, los audios de ensayo y —lo que más pesa
 * en la polifonía— el selector de voz, que hace que cada corista lea SU partitura.
 * Es el mismo componente de siempre, con un repertorio de un solo canto.
 *
 * El atril se monta en <body> por su cuenta (portal dentro de AtrilMode), así que da lo
 * mismo lo anidado que esté este botón dentro de una tarjeta.
 */
export function AtrilSongButton({
  song,
  userRole = 'Coro',
  userInstrument,
  userVoicePart,
  iconOnly = false,
  className,
}: AtrilSongButtonProps) {
  const [open, setOpen] = useState(false);

  // El Atril ocupa toda la pantalla: el botón "atrás" del teléfono debe CERRARLO,
  // no sacar de esta pantalla. Se apunta como capa mientras está abierto.
  useEffect(() => {
    if (!open) return;
    return registrarCapa(() => setOpen(false));
  }, [open]);

  const estiloPorDefecto = iconOnly
    ? 'w-9 h-9 flex-shrink-0 bg-slate-800 dark:bg-slate-700 text-white rounded-lg flex items-center justify-center active:scale-95 transition-all'
    : 'w-full bg-gradient-to-br from-slate-700 to-slate-900 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold border-2 border-slate-600 hover:from-slate-800 hover:to-slate-950';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || estiloPorDefecto}
        aria-label={`Ver ${song.title} en Modo Atril`}
        title="Abrir este canto en Modo Atril (ensayo)"
      >
        <Music className={iconOnly ? 'w-4 h-4' : 'w-4 h-4 flex-shrink-0'} strokeWidth={2.5} />
        {!iconOnly && 'Ver en Modo Atril'}
      </button>

      {open && (
        <AtrilMode
          songs={[song]}
          userRole={userRole}
          userInstrument={userInstrument}
          userVoicePart={userVoicePart}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

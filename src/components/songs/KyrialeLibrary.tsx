import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Music, Eye, EyeOff } from 'lucide-react';
import { InstrumentType, Song, UserRole } from '../../types';
import { kyrialeDelBanco, type EntradaDelKyriale } from '../../utils/kyrialeSong';
import { matchesSearch } from '../../utils/textSearch';
import { GradualeScore } from './GradualeScore';
import { AtrilMode } from '../atril/AtrilMode';
import { registrarCapa } from '../../utils/navegacionAtras';

interface KyrialeLibraryProps {
  searchTerm: string;
  userRole?: UserRole;
  userInstrument?: InstrumentType;
  userVoicePart?: string;
}

/** ¿La entrada responde a la búsqueda? Por su nombre, su uso o el de sus partes. */
function coincide(e: EntradaDelKyriale, termino: string): boolean {
  if (!termino) return true;
  return matchesSearch(e.titulo, termino)
    || matchesSearch(e.detalle, termino)
    || e.cantos.some((c) => matchesSearch(c.title, termino));
}

/** Cuántas entradas del Kyriale responden a la búsqueda (para el aviso de "no hay nada"). */
export function cuantasDelKyriale(termino: string): number {
  return kyrialeDelBanco().reduce((n, g) => n + g.entradas.filter((e) => coincide(e, termino)).length, 0);
}

/**
 * El Kyriale completo en el Banco de Partituras.
 *
 * Hasta ahora el gregoriano sólo se veía al elegirlo en el constructor de cantorales;
 * aquí queda el libro entero para estudiarlo o ensayarlo: las Misas (del Romanum y del
 * Simplex) con todas sus partes, los Credos, las piezas ad libitum y el Pater noster.
 * Una Misa se abre entera en el Modo Atril, con sus partes en el orden en que se cantan.
 */
export function KyrialeLibrary({ searchTerm, userRole, userInstrument, userVoicePart }: KyrialeLibraryProps) {
  const grupos = useMemo(() => kyrialeDelBanco(), []);
  const [abierto, setAbierto] = useState(false);
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(null);
  const [partitura, setPartitura] = useState<string | null>(null);
  const [atril, setAtril] = useState<Song[] | null>(null);

  useEffect(() => {
    if (!atril) return;
    return registrarCapa(() => setAtril(null));
  }, [atril]);

  const visibles = grupos
    .map((g) => ({ ...g, entradas: g.entradas.filter((e) => coincide(e, searchTerm)) }))
    .filter((g) => g.entradas.length > 0);
  const total = visibles.reduce((n, g) => n + g.entradas.length, 0);
  if (total === 0) return null;

  // Con una búsqueda escrita se abre solo: si no, el resultado quedaría escondido.
  const expandido = abierto || !!searchTerm;

  return (
    <div className="bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-white/60 dark:border-white/20 overflow-hidden transition-all hover:shadow-xl">
      <button
        onClick={() => setAbierto(!abierto)}
        aria-expanded={expandido}
        className="w-full bg-gradient-to-br from-stone-700 to-stone-900 text-white p-5 flex items-center justify-between active:opacity-90 transition-all hover:scale-[1.01]"
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">🎼</span>
          <div className="text-left">
            <div className="text-2xl font-bold">Kyriale gregoriano</div>
            <div className="text-base opacity-90">
              {total} {total === 1 ? 'pieza' : 'piezas'} · Graduale Romanum y Simplex
            </div>
          </div>
        </div>
        {expandido ? <ChevronUp className="w-7 h-7" strokeWidth={2.5} /> : <ChevronDown className="w-7 h-7" strokeWidth={2.5} />}
      </button>

      {expandido && (
        <div className="p-4 space-y-3 bg-white/20 dark:bg-white/5">
          {visibles.map((g) => {
            const grupoExpandido = grupoAbierto === g.id || !!searchTerm;
            return (
              <div key={g.id} className="bg-white/60 dark:bg-white/15 rounded-xl overflow-hidden border-2 border-white/70 dark:border-white/25">
                <button
                  onClick={() => setGrupoAbierto(grupoAbierto === g.id ? null : g.id)}
                  aria-expanded={grupoExpandido}
                  className="w-full bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4 flex items-center justify-between active:opacity-90 transition-all"
                >
                  <div className="text-left">
                    <div className="text-lg font-bold">{g.titulo}</div>
                    <div className="text-sm opacity-90">{g.entradas.length} {g.entradas.length === 1 ? 'pieza' : 'piezas'}</div>
                  </div>
                  {grupoExpandido ? <ChevronUp className="w-6 h-6" strokeWidth={2.5} /> : <ChevronDown className="w-6 h-6" strokeWidth={2.5} />}
                </button>

                {grupoExpandido && (
                  <div className="p-3 space-y-2 bg-white/40 dark:bg-white/10">
                    {g.entradas.map((e) => {
                      const viendo = partitura === e.clave;
                      return (
                        <div key={e.clave} className="bg-white/80 dark:bg-white/20 rounded-xl p-3 border-2 border-white/90 dark:border-white/30">
                          <h4 className="text-base font-bold text-brand-ink leading-tight">{e.titulo}</h4>
                          {e.detalle && <p className="text-sm text-blue-900 dark:text-blue-200 mt-1">{e.detalle}</p>}
                          {e.cantos.length > 1 && (
                            <p className="text-xs text-brand-ink-soft mt-1">
                              {e.cantos.map((c) => c.category).join(' · ')}
                            </p>
                          )}
                          <div className="space-y-2 mt-2">
                            <button
                              onClick={() => setPartitura(viendo ? null : e.clave)}
                              aria-expanded={viendo}
                              className="w-full bg-gradient-to-br from-green-600 to-green-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold hover:from-green-700 hover:to-green-800"
                            >
                              {viendo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              {viendo ? 'Ocultar partitura' : 'Ver partitura'}
                            </button>
                            <button
                              onClick={() => setAtril(e.cantos)}
                              aria-label={`Ver ${e.titulo} en Modo Atril`}
                              className="w-full bg-gradient-to-br from-slate-700 to-slate-900 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold border-2 border-slate-600 hover:from-slate-800 hover:to-slate-950"
                            >
                              <Music className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
                              Ver en Modo Atril
                            </button>
                          </div>
                          {viendo && (
                            <div className="mt-3 space-y-4">
                              {e.cantos.map((c) => (
                                <div key={c.id}>
                                  {e.cantos.length > 1 && (
                                    <p className="text-sm font-bold text-brand-ink mb-1">{c.title}</p>
                                  )}
                                  <GradualeScore src={c.gradualeImage!} alt={c.title} fuente={c.gradualeFuente} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {atril && (
        <AtrilMode
          songs={atril}
          userRole={userRole ?? 'Coro'}
          userInstrument={userInstrument}
          userVoicePart={userVoicePart}
          onClose={() => setAtril(null)}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Music4, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import {
  misasDelKyriale, misasConGloria, misaDelKyriale, kyrialeImageUrl,
  CATEGORIA_DE_LA_PARTE, type MisaDelKyriale, type ParteKyriale,
} from '../../data/kyrialeIndex';
import { CasillaPartitura } from '../cantoral/CasillaPartitura';
import { LIBROS, type LibroGraduale } from '../../data/gradualeIndex';
import type { EleccionKyriale } from '../../utils/kyrialeSong';

interface KyrialeChoiceProps {
  /** Misa del Kyriale elegida, o `null` si el ordinario no va en gregoriano. */
  valor: EleccionKyriale | null;
  onChange: (eleccion: EleccionKyriale | null) => void;
  /** Misa de la que se toma el Gloria, si no es la misma. */
  gloriaDe: EleccionKyriale | null;
  onGloriaChange: (eleccion: EleccionKyriale | null) => void;
  /** ¿El folleto lleva el facsímil de esta Misa, o solo su texto latino? */
  partitura: boolean;
  onPartituraChange: (incluir: boolean) => void;
  /** Hay Rito de Aspersión (Pascua): el Kyrie se omite y la Misa aporta el resto. */
  sinKyrie?: boolean;
}

const VACIO = '';

function valorDe(e: EleccionKyriale | null): string {
  return e ? `${e.libro}|${e.numero}` : VACIO;
}

function desdeValor(v: string): EleccionKyriale | null {
  if (!v) return null;
  const [libro, numero] = v.split('|');
  return { libro: libro as LibroGraduale, numero };
}

/**
 * Elegir la Misa del ordinario en gregoriano.
 *
 * Se elige LA MISA, no cada parte: el Santo y el Cordero son los de la Misa del Kyrie,
 * porque cada Misa del Kyriale es una sola melodía y mezclarlas suena a dos Misas
 * pegadas. El Gloria es la excepción y lleva su propio selector, porque en la práctica
 * se cambia — hay Misas que no traen Gloria (en ferias, Adviento y Cuaresma no se canta)
 * y es costumbre tomarlo de otra.
 *
 * El candado que ven el Santo y el Cordero está ahí para que la regla se entienda sin
 * tener que descubrirla: es mejor decir por qué no se puede que dejar un menú muerto.
 *
 * El Padre Nuestro gregoriano NO se elige aquí: va en la tarjeta del Padre Nuestro, que
 * es la única donde se decide si se canta y en qué versión.
 */
export function KyrialeChoice({
  valor, onChange, gloriaDe, onGloriaChange, partitura, onPartituraChange, sinKyrie = false,
}: KyrialeChoiceProps) {
  const [abierta, setAbierta] = useState<ParteKyriale | null>(null);
  const misas = misasDelKyriale();
  const elegida = valor ? misaDelKyriale(valor.libro, valor.numero) : null;
  const paraGloria = gloriaDe ? misaDelKyriale(gloriaDe.libro, gloriaDe.numero) : elegida;

  const porLibro = (libro: LibroGraduale) => misas.filter((m) => m.libro === libro);

  return (
    <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-stone-300/70 dark:border-stone-600/70 transition-colors">
      <div className="flex items-start gap-2 mb-3">
        <Music4 className="w-5 h-5 flex-shrink-0 text-stone-700 dark:text-stone-300 mt-0.5" strokeWidth={2.5} />
        <div className="min-w-0">
          <h4 className="text-base font-bold text-brand-ink leading-tight">Ordinario en gregoriano</h4>
          <p className="text-xs text-brand-ink-soft">
            Kyrie, Gloria, Santo y Cordero de una Misa del Kyriale.
          </p>
        </div>
      </div>

      <label className="block text-xs font-bold text-brand-ink mb-1">Misa del Kyriale</label>
      <select
        value={valorDe(valor)}
        onChange={(e) => {
          onChange(desdeValor(e.target.value));
          onGloriaChange(null);        // el Gloria vuelve al de la Misa nueva
        }}
        className="w-full px-3 py-2.5 rounded-xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-stone-700"
      >
        <option value={VACIO}>Sin ordinario gregoriano</option>
        {(['romanum', 'simplex'] as LibroGraduale[]).map((libro) => (
          <optgroup key={libro} label={LIBROS[libro].nombre}>
            {porLibro(libro).map((m) => (
              <option key={`${libro}|${m.numero}`} value={`${libro}|${m.numero}`}>
                {m.rotulo}{m.uso ? ` — ${m.uso}` : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {elegida && (
        <div className="mt-3 space-y-2">
          {sinKyrie && (
            <p className="text-xs text-brand-ink-soft">
              💧 Con el Rito de Aspersión se omite el Kyrie: de esta Misa van el Gloria, el Santo y el Cordero.
            </p>
          )}
          {(['kyrie', 'gloria', 'sanctus', 'agnus'] as ParteKyriale[])
            .filter((parte) => !(sinKyrie && parte === 'kyrie'))
            .map((parte) => {
            const misa = parte === 'gloria' ? paraGloria : elegida;
            const hay = misa?.partes.includes(parte);
            return (
              <div key={parte} className="rounded-xl border border-stone-200 dark:border-stone-700 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-brand-ink min-w-0 truncate">
                    {CATEGORIA_DE_LA_PARTE[parte]}
                  </span>
                  {parte === 'gloria' ? (
                    <select
                      value={valorDe(gloriaDe)}
                      onChange={(e) => onGloriaChange(desdeValor(e.target.value))}
                      className="max-w-[60%] px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-xs font-semibold text-brand-ink"
                    >
                      <option value={VACIO}>
                        {elegida.partes.includes('gloria')
                          ? `El de la Misa ${elegida.rotulo}`
                          : `La Misa ${elegida.rotulo} no trae Gloria`}
                      </option>
                      {misasConGloria().map((m) => (
                        <option key={`${m.libro}|${m.numero}`} value={`${m.libro}|${m.numero}`}>
                          {m.rotulo}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-brand-ink-soft">
                      <Lock className="w-3 h-3" /> va con el Kyrie
                    </span>
                  )}
                </div>

                {hay && misa && (
                  <>
                    <button
                      type="button"
                      onClick={() => setAbierta(abierta === parte ? null : parte)}
                      className="mt-1 flex items-center gap-1 text-xs font-bold text-stone-700 dark:text-stone-300"
                    >
                      {abierta === parte ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      Ver la partitura
                    </button>
                    {abierta === parte && (
                      <div className="mt-2 overflow-x-auto rounded-lg bg-white p-2">
                        <img
                          src={kyrialeImageUrl(misa.libro, misa.numero, parte)}
                          alt={`${CATEGORIA_DE_LA_PARTE[parte]} — Misa ${misa.rotulo}`}
                          loading="lazy"
                          className="block mx-auto w-full"
                        />
                      </div>
                    )}
                  </>
                )}
                {!hay && parte !== 'gloria' && (
                  <p className="mt-1 text-xs text-brand-ink-soft">
                    Esta Misa no trae {CATEGORIA_DE_LA_PARTE[parte]} en el libro.
                  </p>
                )}
              </div>
            );
          })}
          <Aviso elegida={elegida} />
          {/* Se pregunta al elegir la Misa, y solo aquí: vale para sus cuatro partes. */}
          <CasillaPartitura
            checked={partitura}
            onChange={onPartituraChange}
            detalle="Sin la partitura, el folleto lleva el texto en latín."
          />
        </div>
      )}
    </div>
  );
}

/** Explica el caso que más desconcierta: la Misa sin Gloria. */
function Aviso({ elegida }: { elegida: MisaDelKyriale }) {
  if (elegida.partes.includes('gloria')) return null;
  return (
    <p className="text-xs text-brand-ink-soft">
      La Misa {elegida.rotulo} no lleva Gloria: el libro la propone para
      {elegida.uso ? ` ${elegida.uso.toLowerCase()}` : ' días'}, y ahí el Gloria no se canta.
      Si esta Misa sí lo lleva, elige de qué Misa tomarlo.
    </p>
  );
}

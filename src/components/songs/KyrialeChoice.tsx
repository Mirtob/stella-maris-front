import { useState } from 'react';
import { Music4, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import {
  misasDelKyriale, misasConGloria, misaDelKyriale, kyrialeImageUrl,
  tonosDelPaterNoster, paterNosterImageUrl,
  CATEGORIA_DE_LA_PARTE, type MisaDelKyriale, type ParteKyriale,
} from '../../data/kyrialeIndex';
import { LIBROS, type LibroGraduale } from '../../data/gradualeIndex';
import type { EleccionKyriale } from '../../utils/kyrialeSong';

interface KyrialeChoiceProps {
  /** Misa del Kyriale elegida, o `null` si el ordinario no va en gregoriano. */
  valor: EleccionKyriale | null;
  onChange: (eleccion: EleccionKyriale | null) => void;
  /** Misa de la que se toma el Gloria, si no es la misma. */
  gloriaDe: EleccionKyriale | null;
  onGloriaChange: (eleccion: EleccionKyriale | null) => void;
  /** Tono del Padre Nuestro ('A', 'B', 'C'), o `null` si no va en gregoriano. */
  paterNoster: string | null;
  onPaterChange: (tono: string | null) => void;
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
 */
export function KyrialeChoice({
  valor, onChange, gloriaDe, onGloriaChange, paterNoster, onPaterChange,
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
          {(['kyrie', 'gloria', 'sanctus', 'agnus'] as ParteKyriale[]).map((parte) => {
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
        </div>
      )}

      <PaterNoster tono={paterNoster} onChange={onPaterChange} />
    </div>
  );
}

/**
 * El Padre Nuestro, aparte.
 *
 * No entra en la regla del Santo y el Cordero porque en el libro no pertenece a ninguna
 * Misa del Kyriale: vive en el rito de comunión y sus tres tonos sirven con cualquiera.
 * Por eso también se puede cantar solo, sin ordinario gregoriano — que es justo lo que
 * hacen muchas parroquias.
 */
function PaterNoster({ tono, onChange }: { tono: string | null; onChange: (t: string | null) => void }) {
  const [ver, setVer] = useState(false);
  const tonos = tonosDelPaterNoster('romanum');
  if (tonos.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-700">
      <label className="block text-xs font-bold text-brand-ink mb-1">
        Padre Nuestro
      </label>
      <p className="text-xs text-brand-ink-soft mb-2">
        Va aparte: no pertenece a ninguna Misa del Kyriale y sirve con todas.
      </p>
      <div className="flex flex-wrap gap-2">
        <Chip activo={!tono} onClick={() => onChange(null)} rotulo="Sin gregoriano" />
        {tonos.map((t) => (
          <Chip
            key={t.tono}
            activo={tono === t.tono}
            onClick={() => onChange(tono === t.tono ? null : t.tono)}
            rotulo={`Tono ${t.tono}`}
          />
        ))}
      </div>
      {tono && (
        <>
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs font-bold text-stone-700 dark:text-stone-300"
          >
            {ver ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Ver la partitura
          </button>
          {ver && (
            <div className="mt-2 overflow-x-auto rounded-lg bg-white p-2">
              <img
                src={paterNosterImageUrl('romanum', tono)}
                alt={`Padre Nuestro, tono ${tono}`}
                loading="lazy"
                className="block mx-auto w-full"
              />
            </div>
          )}
        </>
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

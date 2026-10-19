import { useState } from 'react';
import { Music4, ChevronDown, ChevronUp } from 'lucide-react';
import {
  misasDelKyriale, misasConGloria, misaDelKyriale, kyrialeImageUrl,
  piezasAdLibitum, piezaAdLibitum, adLibitumImageUrl,
  credosDelKyriale, credoDelKyriale, credoImageUrl,
  CATEGORIA_DE_LA_PARTE, type MisaDelKyriale, type ParteKyriale,
} from '../../data/kyrialeIndex';
import { CasillaPartitura } from '../cantoral/CasillaPartitura';
import { LIBROS, type LibroGraduale } from '../../data/gradualeIndex';
import type { EleccionKyriale, EleccionCredo, PartesKyriale } from '../../utils/kyrialeSong';

interface KyrialeChoiceProps {
  /** Misa del Kyriale elegida, o `null` si el ordinario no va en gregoriano. */
  valor: EleccionKyriale | null;
  onChange: (eleccion: EleccionKyriale | null) => void;
  /** Partes reemplazadas: el Gloria de otra Misa, o una pieza ad libitum. */
  partes: PartesKyriale;
  onPartesChange: (partes: PartesKyriale) => void;
  /** Credo gregoriano, que va suelto (cualquiera sirve con cualquier Misa). */
  credo: EleccionCredo | null;
  onCredoChange: (credo: EleccionCredo | null) => void;
  /** ¿El folleto lleva el facsímil de esta Misa, o solo su texto latino? */
  partitura: boolean;
  onPartituraChange: (incluir: boolean) => void;
  /** Hay Rito de Aspersión (Pascua): el Kyrie se omite y la Misa aporta el resto. */
  sinKyrie?: boolean;
}

const VACIO = '';
const LIBROS_DEL_KYRIALE: LibroGraduale[] = ['romanum', 'simplex'];

/** «libro|numero» para una Misa o un Credo; «ad|numero» para una pieza ad libitum. */
function valorDe(e: EleccionKyriale | EleccionCredo | null | undefined): string {
  if (!e) return VACIO;
  return 'adLibitum' in e && e.adLibitum ? `ad|${e.numero}` : `${e.libro}|${e.numero}`;
}

function desdeValor(v: string): EleccionKyriale | null {
  if (!v) return null;
  const [libro, numero] = v.split('|');
  return libro === 'ad'
    ? { libro: 'romanum', numero, adLibitum: true }
    : { libro: libro as LibroGraduale, numero };
}

/** La imagen de lo que suena en esa parte: la pieza ad libitum, o la de la Misa. */
function imagenDe(parte: ParteKyriale, e: EleccionKyriale): string {
  return e.adLibitum
    ? adLibitumImageUrl(parte, e.numero)
    : kyrialeImageUrl(e.libro, e.numero, parte);
}

/** Cómo se nombra lo que suena en esa parte, para el texto alternativo. */
function rotuloDe(parte: ParteKyriale, e: EleccionKyriale): string {
  return e.adLibitum
    ? piezaAdLibitum(parte, e.numero)?.rotulo ?? ''
    : misaDelKyriale(e.libro, e.numero)?.rotulo ?? '';
}

const selectClase = 'w-full px-3 py-2.5 rounded-xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-stone-700';
const selectChico = 'max-w-[62%] px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-xs font-semibold text-brand-ink';

/**
 * Elegir la Misa del ordinario en gregoriano.
 *
 * Se elige LA MISA, no cada parte: el Santo y el Cordero son los de la Misa del Kyrie,
 * porque cada Misa del Kyriale es una sola melodía y mezclarlas suena a dos Misas
 * pegadas. El Gloria es la excepción, porque en la práctica se cambia — hay Misas que no
 * traen Gloria (en ferias, Adviento y Cuaresma no se canta) y es costumbre tomarlo de
 * otra.
 *
 * Lo que sí puede ocupar el lugar del Kyrie, el Santo o el Cordero es una pieza «ad
 * libitum»: el Romanum las trae sueltas al final del Kyriale justamente para eso, y no
 * son otra Misa. Por eso cada parte tiene su selector, pero sólo ofrece esas.
 *
 * El Credo se elige aquí también, aunque va suelto: el libro lo trae fuera de las
 * Misas y cualquiera sirve con cualquiera. El Padre Nuestro gregoriano NO: va en la
 * tarjeta del Padre Nuestro, que es la única donde se decide si se canta y cuál.
 */
export function KyrialeChoice({
  valor, onChange, partes, onPartesChange, credo, onCredoChange,
  partitura, onPartituraChange, sinKyrie = false,
}: KyrialeChoiceProps) {
  const [abierta, setAbierta] = useState<ParteKyriale | 'credo' | null>(null);
  const misas = misasDelKyriale();
  const elegida = valor ? misaDelKyriale(valor.libro, valor.numero) : null;
  const credoElegido = credo ? credoDelKyriale(credo.libro, credo.numero) : null;

  const porLibro = (libro: LibroGraduale) => misas.filter((m) => m.libro === libro);
  const cambiarParte = (parte: ParteKyriale, v: string) =>
    onPartesChange({ ...partes, [parte]: desdeValor(v) });

  const verPartitura = (clave: ParteKyriale | 'credo', src: string, alt: string) => (
    <>
      <button
        type="button"
        onClick={() => setAbierta(abierta === clave ? null : clave)}
        className="mt-1 flex items-center gap-1 text-xs font-bold text-stone-700 dark:text-stone-300"
      >
        {abierta === clave ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Ver la partitura
      </button>
      {abierta === clave && (
        <div className="mt-2 overflow-x-auto rounded-lg bg-white p-2">
          <img src={src} alt={alt} loading="lazy" className="block mx-auto w-full" />
        </div>
      )}
    </>
  );

  return (
    <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-stone-300/70 dark:border-stone-600/70 transition-colors">
      <div className="flex items-start gap-2 mb-3">
        <Music4 className="w-5 h-5 flex-shrink-0 text-stone-700 dark:text-stone-300 mt-0.5" strokeWidth={2.5} />
        <div className="min-w-0">
          <h4 className="text-base font-bold text-brand-ink leading-tight">Ordinario en gregoriano</h4>
          <p className="text-xs text-brand-ink-soft">
            Kyrie, Gloria, Santo y Cordero de una Misa del Kyriale, y el Credo.
          </p>
        </div>
      </div>

      <label htmlFor="kyriale-misa" className="block text-xs font-bold text-brand-ink mb-1">Misa del Kyriale</label>
      <select
        id="kyriale-misa"
        value={valorDe(valor)}
        onChange={(e) => {
          onChange(desdeValor(e.target.value));
          onPartesChange({});        // las partes vuelven a las de la Misa nueva
        }}
        className={selectClase}
      >
        <option value={VACIO}>Sin ordinario gregoriano</option>
        {LIBROS_DEL_KYRIALE.map((libro) => (
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
              const propia = partes[parte];
              // Lo que suena en esta parte: el reemplazo, o la de la Misa elegida.
              const suena: EleccionKyriale | null =
                propia && (parte === 'gloria' || propia.adLibitum) ? propia : valor;
              const misaDeEsta = suena && !suena.adLibitum ? misaDelKyriale(suena.libro, suena.numero) : null;
              const hay = suena?.adLibitum ? true : !!misaDeEsta?.partes.includes(parte);
              const nombre = CATEGORIA_DE_LA_PARTE[parte];
              const sueltas = piezasAdLibitum(parte);
              return (
                <div key={parte} className="rounded-xl border border-stone-200 dark:border-stone-700 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-brand-ink min-w-0 truncate">{nombre}</span>
                    <select
                      aria-label={`${nombre} gregoriano`}
                      value={valorDe(propia)}
                      onChange={(e) => cambiarParte(parte, e.target.value)}
                      className={selectChico}
                    >
                      <option value={VACIO}>
                        {elegida.partes.includes(parte)
                          ? `El de la ${elegida.rotulo}`
                          : `La ${elegida.rotulo} no trae ${nombre}`}
                      </option>
                      {parte === 'gloria' && (
                        <optgroup label="De otra Misa">
                          {misasConGloria().map((m) => (
                            <option key={`${m.libro}|${m.numero}`} value={`${m.libro}|${m.numero}`}>
                              {m.rotulo}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {sueltas.length > 0 && (
                        <optgroup label="Ad libitum (sueltos del Romanum)">
                          {sueltas.map((p) => (
                            <option key={p.numero} value={`ad|${p.numero}`}>{p.rotulo}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {hay && suena && verPartitura(parte, imagenDe(parte, suena),
                    `${nombre} — ${rotuloDe(parte, suena)}`)}
                  {!hay && (
                    <p className="mt-1 text-xs text-brand-ink-soft">
                      Esta Misa no trae {nombre} en el libro.
                      {sueltas.length > 0 ? ' Puedes elegir uno ad libitum.' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          <p className="text-xs text-brand-ink-soft">
            El Santo y el Cordero no se toman de otra Misa: cada Misa del Kyriale es una sola
            melodía. Sí pueden ir los «ad libitum» que el libro trae sueltos para eso.
          </p>
          <Aviso elegida={elegida} />
        </div>
      )}

      {/* El Credo: suelto, no depende de la Misa. Sólo domingos y solemnidades. */}
      <label htmlFor="kyriale-credo" className="block text-xs font-bold text-brand-ink mt-4 mb-1">
        Credo gregoriano <span className="font-normal text-brand-ink-soft">(domingos y solemnidades)</span>
      </label>
      <select
        id="kyriale-credo"
        value={valorDe(credo)}
        onChange={(e) => {
          const v = desdeValor(e.target.value);
          onCredoChange(v ? { libro: v.libro, numero: v.numero } : null);
        }}
        className={selectClase}
      >
        <option value={VACIO}>Sin Credo gregoriano</option>
        {LIBROS_DEL_KYRIALE.map((libro) => (
          <optgroup key={libro} label={LIBROS[libro].nombre}>
            {credosDelKyriale().filter((c) => c.libro === libro).map((c) => (
              <option key={`${libro}|${c.numero}`} value={`${libro}|${c.numero}`}>{c.rotulo}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {credoElegido && verPartitura('credo', credoImageUrl(credoElegido.libro, credoElegido.numero),
        credoElegido.rotulo)}

      {(elegida || credoElegido) && (
        <div className="mt-3">
          {/* Se pregunta una vez y vale para todo lo gregoriano de esta tarjeta. */}
          <CasillaPartitura
            checked={partitura}
            onChange={onPartituraChange}
            detalle="Por ahora el folleto lleva solo el texto en latín (una hoja)."
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
      La {elegida.rotulo} no lleva Gloria: el libro la propone para
      {elegida.uso ? ` ${elegida.uso.toLowerCase()}` : ' días'}, y ahí el Gloria no se canta.
      Si esta Misa sí lo lleva, elige de qué Misa tomarlo.
    </p>
  );
}

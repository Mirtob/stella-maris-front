import { Song, InstrumentType } from '../types';

/**
 * ¿Este canto sirve para el instrumento con el que toca el coro hoy?
 *
 * La columna `instruments` de la BD es un ARREGLO y su semántica (fijada en
 * SongManager) es: **vacío = sirve para todas las versiones**. `song.version` es
 * solo `instruments[0]`, así que comparar contra él da falsos negativos:
 *
 *   - `['Coro','Guitarra','Órgano']` → version 'Coro' → no matcheaba 'Órgano'
 *     aunque el canto sí sirve para órgano.
 *   - `[]` (= sirve para todos) → version `undefined` → no matcheaba nunca.
 *
 * Por eso la compatibilidad se decide SIEMPRE con esta función y nunca con
 * `song.version`, que se conserva solo para mostrar la etiqueta en la ficha.
 */
/**
 * Normaliza un nombre de instrumento para poder compararlo.
 *
 * La BD guarda los valores en minúscula y SIN tilde ("organo", "guitarra",
 * "coro"), mientras que `InstrumentType` los usa con mayúscula y tilde
 * ("Órgano"). Comparar en crudo da `["organo"].includes('Órgano') === false`
 * para todos los cantos, que es la razón por la que el instrumento no filtraba
 * ni ordenaba nada. SongManager ya normalizaba así al leerlos.
 */
function normalizeInstrument(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export function songMatchesInstrument(song: Song, instrument?: InstrumentType): boolean {
  if (!instrument) return true;

  // Preferir el arreglo; caer a `version` solo si el canto viene de una fuente
  // antigua que no lo trae (mocks, catálogo importado sin instrumentos).
  const list = song.instruments && song.instruments.length > 0
    ? song.instruments
    : (song.version ? [song.version] : []);

  // Sin instrumentos marcados = sirve para todos.
  if (list.length === 0) return true;

  const target = normalizeInstrument(instrument);
  return list.some((i) => normalizeInstrument(i) === target);
}

/**
 * Deja SOLO los cantos que sirven para el instrumento elegido en esta Misa.
 *
 * Es un filtro duro, a propósito: el coro que toca con guitarra no debe ver
 * versiones de órgano. Un momento puede quedar sin cantos y eso es correcto —
 * significa que aún no se ha grabado esa versión. Quien consuma esta función
 * debe distinguir en la UI "no hay para tu instrumento" de "no hay nada".
 */
export function filterByInstrument(songs: Song[], instrument?: InstrumentType): Song[] {
  if (!instrument) return songs;
  return songs.filter((s) => songMatchesInstrument(s, instrument));
}


/**
 * ¿Hay que preguntarle al coro con qué instrumento toca esta Misa?
 *
 * Solo cuando de verdad hay algo que elegir, o sea con DOS O MÁS instrumentos en el
 * perfil. Con uno solo la pregunta no aporta nada y molesta: el constructor se abre
 * muchas veces al armar un cantoral —se entra, se sale a mirar el calendario, se
 * vuelve— y cada vuelta traía el mismo diálogo con una única respuesta posible.
 */
export function debePreguntarInstrumento(instrumentos?: InstrumentType[]): boolean {
  return (instrumentos?.length ?? 0) > 1;
}

/**
 * El instrumento con el que se arranca, sin preguntar.
 *
 * Si el perfil declara uno solo, ESE manda — por encima del preferido. Un perfil que
 * dice "toco órgano" no puede acabar armando el cantoral con la guitarra porque el
 * campo `instrument` se quedó en su valor por defecto.
 */
export function instrumentoPorDefecto(
  instrumentos: InstrumentType[] | undefined,
  preferido: InstrumentType,
): InstrumentType {
  return instrumentos?.length === 1 ? instrumentos[0] : preferido;
}

/**
 * La lista de instrumentos del perfil después de elegir uno en Configuración.
 *
 * Configuración solo guardaba el campo `instrument`, pero Supabase guarda la LISTA
 * `instruments`, y de ahí sale el instrumento al volver a cargar el perfil (y, si la
 * lista trae uno solo, manda en el constructor: `instrumentoPorDefecto`). Así el cambio
 * no duraba ni se aplicaba. Reportado el 26-sep-2026.
 *
 * Quien tocaba uno solo pasa a tocar el elegido. Quien declaraba varios los conserva
 * todos, con el elegido primero, para que se le siga preguntando en cada Misa.
 */
export function instrumentosAlElegir(
  actuales: InstrumentType[] | undefined,
  elegido: InstrumentType,
): InstrumentType[] {
  const lista = actuales ?? [];
  if (lista.length <= 1) return [elegido];
  return [elegido, ...lista.filter((i) => i !== elegido)];
}

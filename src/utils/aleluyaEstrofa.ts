/**
 * La estrofa del Aleluya NO es la que está escrita en el canto.
 *
 * Reportado el 6-sep-2026: el folleto imprime la letra completa del canto, y en el
 * Aleluya eso incluye una estrofa que en el catálogo está solo COMO EJEMPLO, para
 * poder escribir los acordes y enseñar con qué música se canta. La estrofa de verdad
 * es propia de cada domingo (el versículo antes del Evangelio) y la canta el cantor.
 *
 * Imprimirla como si fuera la del día confunde al pueblo, que la lee y la canta, y al
 * coro, que no sabe si es la que toca. Ejemplo real del catálogo:
 *
 *     Aleluya, aleluya, aleluya, aleluya.      ← la aclamación: esto SÍ se canta siempre
 *     Habla Señor, que tu siervo escucha.      ← ejemplo; el domingo es otra
 *     Aleluya, aleluya, aleluya, aleluya.
 *
 * La regla es deliberadamente PRUDENTE: solo se quita la estrofa cuando se reconoce
 * la aclamación con seguridad (las líneas que dicen "aleluya"). En Cuaresma no se dice
 * Aleluya —la aclamación es otra, "Honor y gloria a ti, Señor Jesús" y parecidas— y
 * ahí no hay forma de distinguir aclamación de estrofa sin adivinar, así que la letra
 * se deja intacta. Es preferible mostrar de más que borrar lo que no se entiende.
 */

/**
 * ¿Este canto es el Aleluya?
 *
 * Se mira el MOMENTO, no el rótulo: en Cuaresma la tarjeta se llama "Aclamación al
 * Evangelio" pero el canto sigue siendo del momento `aleluya` en la base. Se acepta
 * también la categoría por los cantorales viejos, que la guardan como texto.
 */
export function esAleluyaDeCanto(canto: { massMoment?: string; category?: string }): boolean {
  if ((canto.massMoment ?? '') === 'aleluya') return true;
  const c = (canto.category ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  return c === 'aleluya' || c === 'aclamacion al evangelio';
}

/** Sin acordes [Sol], sin acentos y en minúsculas: para reconocer la palabra. */
const normalizar = (linea: string): string =>
  linea
    .replace(/\[[^\]]*\]/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** ¿Esta línea es la aclamación (dice "aleluya")? */
export function esLineaDeAclamacion(linea: string): boolean {
  return /alel[uú]?ya|allelu[ij]a/.test(normalizar(linea));
}

export interface LetraDelAleluya {
  /** La letra que debe mostrarse: solo la aclamación, si se pudo reconocer. */
  letra: string;
  /** true si se quitó una estrofa de ejemplo (y conviene decir por qué). */
  seQuitoLaEstrofa: boolean;
}

/**
 * Deja solo la aclamación de un Aleluya, quitando la estrofa de ejemplo.
 *
 * Si no se reconoce ninguna línea de aclamación, devuelve la letra tal cual: no se
 * adivina.
 */
export function soloLaAclamacion(lyrics: string): LetraDelAleluya {
  const lineas = (lyrics || '').split('\n');
  const conAclamacion = lineas.filter((l) => l.trim() && esLineaDeAclamacion(l));

  // Sin aclamación reconocible (Cuaresma, u otra forma de escribirlo): no se toca.
  if (conAclamacion.length === 0) return { letra: lyrics || '', seQuitoLaEstrofa: false };

  const sobra = lineas.some((l) => l.trim() && !esLineaDeAclamacion(l));
  if (!sobra) return { letra: lyrics, seQuitoLaEstrofa: false };

  // Se conserva UNA vez la aclamación: repetirla dos veces sin la estrofa en medio
  // solo ocupa sitio en el folleto y no aporta nada.
  const unicas: string[] = [];
  for (const l of conAclamacion) {
    const clave = normalizar(l).replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!unicas.some((u) => normalizar(u).replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim() === clave)) {
      unicas.push(l);
    }
  }
  return { letra: unicas.join('\n'), seQuitoLaEstrofa: true };
}

/**
 * Lo que se pone en lugar de la estrofa quitada.
 *
 * Dice DOS cosas, y las dos hacen falta: que la estrofa cambia cada domingo (para que
 * nadie busque la del papel) y que la canta el cantor (para que el pueblo sepa que a
 * él le toca responder la aclamación).
 */
export const AVISO_ESTROFA = 'La estrofa es propia de este domingo y la canta el cantor.';

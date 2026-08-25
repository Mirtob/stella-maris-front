/**
 * Ajustes de texto para los PDF.
 *
 * En el folleto hay dos sitios donde el nombre de la celebración puede ser largo, y
 * cada uno se resuelve distinto:
 *  - la **portada** lo parte en varias líneas (jsPDF `splitTextToSize`);
 *  - el **encabezado** de cada página es una sola línea sobre la regla, así que ahí se
 *    recorta con «…» — antes se escribía de corrido y se salía de la hoja, encima del
 *    logo.
 */

/**
 * Recorta `texto` con «…» hasta que quepa en `maxW`.
 *
 * @param medir cuánto mide un texto con la fuente y el tamaño puestos ahora mismo
 *   (en el PDF es `pdf.getTextWidth`; en las pruebas, una función cualquiera).
 */
export function recortarConElipsis(
  texto: string,
  maxW: number,
  medir: (t: string) => number,
): string {
  if (!texto) return '';
  if (medir(texto) <= maxW) return texto;
  let corto = texto;
  // `length > 1` corta el bucle aunque el ancho sea absurdamente chico.
  while (corto.length > 1 && medir(`${corto}…`) > maxW) corto = corto.slice(0, -1);
  return `${corto.trimEnd()}…`;
}

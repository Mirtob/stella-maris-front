/**
 * Recorte de texto en el PDF (src/utils/pdfText.ts).
 *
 * Reportado el 24-ago-2026: una celebración de nombre largo se escribía de corrido en
 * el folleto y se salía del borde de la hoja.
 *
 * Son dos sitios con soluciones distintas: la portada parte el nombre en varias líneas
 * (eso lo hace jsPDF con splitTextToSize) y el encabezado de cada página, que es UNA
 * línea sobre la regla, lo recorta con «…». Esto último es lo que se prueba aquí.
 */
import { recortarConElipsis } from '../../src/utils/pdfText';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

/** Medidor de prueba: cada carácter mide 1. Simple y suficiente para la regla. */
const medir = (t: string) => t.length;

const LARGO = 'Solemnidad de San Pedro y San Pablo, patronos de la Parroquia';

console.log('\n== Lo que cabe no se toca ==');
check('un nombre corto queda igual', recortarConElipsis('Pentecostés', 40, medir), 'Pentecostés');
check('justo en el límite tampoco se recorta',
  recortarConElipsis('12345', 5, medir), '12345');
check('cadena vacía', recortarConElipsis('', 10, medir), '');

console.log('\n== Lo que no cabe se recorta con puntos suspensivos ==');
const recortado = recortarConElipsis(LARGO, 20, medir);
check('termina en «…»', recortado.endsWith('…'), true);
check('cabe en el ancho pedido', medir(recortado) <= 20, true);
check('conserva el principio del nombre', recortado.startsWith('Solemnidad'), true);
check('es más corto que el original', recortado.length < LARGO.length, true);

console.log('\n== Bordes que no deben colgar la generación del PDF ==');
check('ancho ridículo: no se cuelga y devuelve algo',
  recortarConElipsis(LARGO, 1, medir), 'S…');
check('ancho cero tampoco cuelga', recortarConElipsis(LARGO, 0, medir), 'S…');
check('un solo carácter que no cabe', recortarConElipsis('X', 0, medir), 'X…');

console.log('\n== Detalles de presentación ==');
check('no deja un espacio colgando antes de los puntos',
  recortarConElipsis('Domingo de Ramos', 9, medir), 'Domingo…');
check('respeta el medidor: con letras anchas recorta más',
  recortarConElipsis('MMMMMMMMMM', 5, (t) => t.length * 2).length < 6, true);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

/**
 * El nombre con el que se guarda el cantoral (src/utils/descargarPdf.ts).
 *
 * Del reporte del 5-sep-2026: varios usuarios de Android y iPhone no podían ni imprimir
 * ni descargar el cantoral. Parte del arreglo fue dar un botón de descarga que use el
 * PDF que YA está generado, y ese archivo tiene que llegar con un nombre que se entienda
 * en la carpeta de descargas, no "documento(3).pdf".
 *
 * Lo demás de ese módulo es DOM (abrir ventanas, enlaces) y se comprueba en navegador.
 */
import { nombreDeFolleto } from '../../src/utils/descargarPdf';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== Se reconoce de un vistazo ==');
check('domingo del Tiempo Ordinario',
  nombreDeFolleto('23.º Domingo del Tiempo Ordinario', '2026-09-06'),
  'Cantoral 23 Domingo del Tiempo Ordinario 2026-09-06.pdf');

console.log('\n== Sin nada que moleste al sistema de archivos ==');
// Las barras, los dos puntos y las comillas rompen el guardado en Windows y en iPhone.
check('barras y dos puntos fuera',
  nombreDeFolleto('Misa de Acción de Gracias: 1.º/2.º año', '2026-09-05'),
  'Cantoral Misa de Accion de Gracias 1 2 ano 2026-09-05.pdf');
check('los acentos se transcriben',
  nombreDeFolleto('Solemnidad de la Asunción', '2026-08-15'),
  'Cantoral Solemnidad de la Asuncion 2026-08-15.pdf');
check('la eñe también', nombreDeFolleto('Año nuevo', '2027-01-01'), 'Cantoral Ano nuevo 2027-01-01.pdf');

console.log('\n== Casos límite ==');
check('sin celebración, un nombre útil igual',
  nombreDeFolleto('', '2026-09-06'), 'Cantoral Cantoral 2026-09-06.pdf');
// Un nombre larguísimo no puede reventar el guardado.
const largo = nombreDeFolleto('Solemnidad de los Santos Apóstoles y Mártires patronos de la parroquia y de la diócesis entera', '2026-06-29');
check('se recorta', largo.length <= 90, true);
check('y sigue terminando en .pdf', largo.endsWith('.pdf'), true);
check('sin espacios dobles', / {2}/.test(largo), false);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

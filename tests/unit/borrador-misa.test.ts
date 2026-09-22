/**
 * Los datos de la Misa que se recuerdan entre visita y visita
 * (src/utils/borradorMisa.ts).
 *
 * HU: el coro está armando el cantoral, sale a mirar el calendario (o se le cierra la
 * app, o recarga en el teléfono) y al volver la fecha, la hora y el LUGAR volvían a
 * cero. Con un coro invitado eso es peor que molesto: el cantoral de la fiesta patronal
 * de la parroquia vecina termina apuntando a la parroquia propia.
 *
 * Lo que se fija aquí: se recuerda lo que sirve, y se olvida lo que ya no —una Misa que
 * ya pasó, o cualquier cosa rara guardada en el navegador—.
 */
import { parseDatosDeLaMisa } from '../../src/utils/borradorMisa';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const HOY = '2026-10-05';
const VALDIVIA = 'Valdivia de Paine - Diócesis de San Bernardo';
const json = (o: unknown) => JSON.stringify(o);

console.log('\n== Se recuerda lo que sirve ==');
check('fecha, hora, tipo y lugar',
  parseDatosDeLaMisa(json({ fecha: '2026-10-11', hora: '19:00', tipo: 'visperas_i', destino: VALDIVIA }), HOY),
  { fecha: '2026-10-11', hora: '19:00', tipo: 'visperas_i', destino: VALDIVIA });
check('sin lugar guardado, no se inventa uno',
  parseDatosDeLaMisa(json({ fecha: '2026-10-11', hora: '10:00', tipo: 'dia' }), HOY),
  { fecha: '2026-10-11', hora: '10:00', tipo: 'dia', destino: undefined });
check('un lugar en blanco es no tener lugar',
  parseDatosDeLaMisa(json({ fecha: '2026-10-11', hora: '10:00', tipo: 'dia', destino: '   ' }), HOY)?.destino,
  undefined);
check('la Misa de hoy todavía sirve',
  parseDatosDeLaMisa(json({ fecha: HOY, hora: '10:00', tipo: 'dia' }), HOY)?.fecha, HOY);

console.log('\n== Se olvida lo que ya no ==');
// Reabrir el constructor en el domingo del mes pasado confunde más que empezar en
// blanco, y esa fecha arrastra el permiso de una invitación que ya se apagó.
check('la Misa que ya pasó',
  parseDatosDeLaMisa(json({ fecha: '2026-09-27', hora: '10:00', tipo: 'dia' }), HOY), null);
check('nada guardado', parseDatosDeLaMisa(null, HOY), null);
check('cadena vacía', parseDatosDeLaMisa('', HOY), null);
check('texto que no es JSON', parseDatosDeLaMisa('{no-json', HOY), null);
check('JSON que no es un objeto', parseDatosDeLaMisa('"2026-10-11"', HOY), null);
check('sin fecha', parseDatosDeLaMisa(json({ hora: '10:00', tipo: 'dia' }), HOY), null);
check('fecha con otro formato', parseDatosDeLaMisa(json({ fecha: '11/10/2026', hora: '10:00', tipo: 'dia' }), HOY), null);
check('hora que no es hora', parseDatosDeLaMisa(json({ fecha: '2026-10-11', hora: '7pm', tipo: 'dia' }), HOY), null);
check('tipo de Misa inventado', parseDatosDeLaMisa(json({ fecha: '2026-10-11', hora: '10:00', tipo: 'maitines' }), HOY), null);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

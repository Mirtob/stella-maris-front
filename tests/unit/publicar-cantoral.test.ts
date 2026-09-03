/**
 * El portero de "Publicar cantoral" (src/utils/publishGate.ts).
 *
 * Fallo reportado el 29-ago-2026, primera semana de lanzamiento: el coro de la parroquia
 * Santos Ángeles Custodios de Buin armó su cantoral y el botón "Publicar" estaba muerto.
 * Sin mensaje, sin explicación, sin nada que tocar.
 *
 * La causa: publicar EXIGE una celebración, y el menú abría con la celebración VACÍA. Se
 * llenaba sola al tocar el campo de fecha… pero cuando la fecha viene del constructor ese
 * campo no se muestra (se enseña un resumen). O sea: la única puerta estaba tapiada. Solo
 * se libraban los coros de varias parroquias, que llenan la celebración por otro camino
 * — por eso el fallo no apareció durante todo el desarrollo, hecho con un perfil multi.
 *
 * Estas pruebas fijan las dos mitades del arreglo:
 *   1. el menú abre YA con la celebración del día, y
 *   2. cuando de verdad falta algo, se dice cuál es.
 */
import { celebracionInicial, motivoParaNoPublicar } from '../../src/utils/publishGate';
import { getLiturgicalDateForDate } from '../../src/utils/liturgicalCalendar';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const domingo = '2026-09-06';
// Un día de semana que el calendario deja de verdad vacío (el 8 es la Natividad de
// la Virgen: hasta un martes puede tener fiesta, por eso no se elige a ojo).
const diaLibre = '2026-09-01';

console.log('\n== La celebración viene puesta desde que se abre ==');
// Esta es LA prueba del fallo de Buin: si esto vuelve a devolver '', el botón se muere.
check('un domingo trae su celebración', celebracionInicial(domingo).length > 0, true);
check('y es la del calendario', celebracionInicial(domingo), getLiturgicalDateForDate(domingo));
check('sin fecha, no revienta', typeof celebracionInicial(undefined), 'string');

console.log('\n== Una parroquia: el caso de Buin, de punta a punta ==');
const buin = { cantos: 6, publicando: false, multi: false, fecha: domingo, horario: '12:00' };
check(
  'domingo, con horario y celebración puesta → se puede publicar',
  motivoParaNoPublicar({ ...buin, celebracion: celebracionInicial(domingo) }),
  null,
);

console.log('\n== Cuando falta algo, se dice qué ==');
check('sin cantos', motivoParaNoPublicar({ ...buin, cantos: 0, celebracion: 'X' }),
  'Agrega al menos un canto antes de publicar.');
check('sin fecha', motivoParaNoPublicar({ ...buin, fecha: '', celebracion: 'X' }),
  'Falta la fecha de la Misa.');
check('sin horario', motivoParaNoPublicar({ ...buin, horario: '', celebracion: 'X' }),
  'Falta el horario de la Misa.');
check('sin celebración, se ofrece agregarla',
  motivoParaNoPublicar({ ...buin, celebracion: '' })?.includes('Agrégala aquí abajo'), true);

console.log('\n== Un día sin celebración: ahí sí se pide ==');
// No es un fallo, es la realidad del calendario. Lo que importa es que se AVISE
// y no que el botón quede gris sin motivo.
check('el día libre no está en el calendario', celebracionInicial(diaLibre), '');
check('y el portero lo explica',
  motivoParaNoPublicar({ ...buin, fecha: diaLibre, celebracion: celebracionInicial(diaLibre) })?.startsWith('Falta la celebración'), true);

console.log('\n== Varias parroquias: no se rompió lo que ya andaba ==');
const cel = celebracionInicial(domingo);
const completo = { date: domingo, liturgicalDate: cel, massTime: '11:00' };
check('ninguna marcada',
  motivoParaNoPublicar({ cantos: 6, publicando: false, multi: true, parroquiasMarcadas: [], horarioPorParroquia: {} }),
  'Marca al menos una parroquia.');
check('dos marcadas y completas',
  motivoParaNoPublicar({ cantos: 6, publicando: false, multi: true,
    parroquiasMarcadas: ['A', 'B'], horarioPorParroquia: { A: completo, B: completo } }),
  null);
check('una a medias, se la nombra',
  motivoParaNoPublicar({ cantos: 6, publicando: false, multi: true,
    parroquiasMarcadas: ['A', 'B'], horarioPorParroquia: { A: completo, B: { ...completo, massTime: '' } } }),
  'Falta la fecha, la celebración o el horario de B.');
check('marcada pero sin horario ninguno',
  motivoParaNoPublicar({ cantos: 6, publicando: false, multi: true,
    parroquiasMarcadas: ['A'], horarioPorParroquia: {} }),
  'Falta la fecha, la celebración o el horario de A.');

console.log('\n== Mientras se está publicando no se estorba ==');
// Con el envío en curso el botón ya está bloqueado por otra razón; un cartel de
// "falta algo" ahí solo confundiría.
check('sin motivo durante el envío', motivoParaNoPublicar({ ...buin, cantos: 0, publicando: true }), null);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

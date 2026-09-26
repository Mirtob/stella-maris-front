/**
 * Cambiar el instrumento en Configuración (reportado el 26-sep-2026).
 *
 * Configuración guardaba solo el campo `instrument`, pero Supabase guarda la lista
 * `instruments` y al volver a entrar el perfil sale de ahí (instruments[0]). Además, con
 * un solo instrumento en la lista, esa lista manda en el constructor. El cambio no se
 * guardaba ni se aplicaba.
 */
import { instrumentosAlElegir, instrumentoPorDefecto } from '../../src/utils/instrument';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== La lista que se guarda ==');
check('de guitarra a órgano', instrumentosAlElegir(['Guitarra'], 'Órgano'), ['Órgano']);
check('de órgano a guitarra', instrumentosAlElegir(['Órgano'], 'Guitarra'), ['Guitarra']);
check('sin lista previa', instrumentosAlElegir(undefined, 'Órgano'), ['Órgano']);
check('quien toca los dos los conserva, con el elegido primero',
  instrumentosAlElegir(['Guitarra', 'Órgano'], 'Órgano'), ['Órgano', 'Guitarra']);

console.log('\n== Lo que termina usando la app ==');
// Al volver a entrar: instrument = instruments[0].
check('al volver a entrar queda el elegido', instrumentosAlElegir(['Guitarra'], 'Órgano')[0], 'Órgano');
// En el constructor: con un solo instrumento, la lista manda sobre el preferido.
check('el constructor arranca con el elegido',
  instrumentoPorDefecto(instrumentosAlElegir(['Guitarra'], 'Órgano'), 'Órgano'), 'Órgano');
check('el bug: con la lista vieja ganaba el anterior', instrumentoPorDefecto(['Guitarra'], 'Órgano'), 'Guitarra');

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

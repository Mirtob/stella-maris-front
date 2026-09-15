/**
 * ¿Cuándo preguntar el instrumento en el constructor? (src/utils/instrument.ts)
 *
 * Reportado el 14-sep-2026: en el perfil Coro, la app preguntaba con qué instrumento
 * se toca CADA VEZ que se vuelve al constructor. El constructor se monta muchas veces
 * al armar un cantoral —se sale a mirar el calendario, se vuelve—, y quien tiene un
 * solo instrumento en su perfil se comía el mismo diálogo una y otra vez, con una
 * única respuesta posible.
 *
 * La regla: preguntar solo si hay algo que elegir (dos o más instrumentos). Con uno
 * solo, ese manda y no se pregunta nunca.
 */
import { debePreguntarInstrumento, instrumentoPorDefecto } from '../../src/utils/instrument';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== Cuándo se pregunta ==');
check('dos instrumentos: sí, hay que elegir',
  debePreguntarInstrumento(['Órgano', 'Guitarra']), true);
check('tres: también', debePreguntarInstrumento(['Órgano', 'Guitarra', 'Coro']), true);
// El caso del reporte.
check('solo órgano: NO se pregunta', debePreguntarInstrumento(['Órgano']), false);
check('solo guitarra: NO se pregunta', debePreguntarInstrumento(['Guitarra']), false);
check('perfil sin instrumentos: no se pregunta', debePreguntarInstrumento([]), false);
check('sin el dato: no se pregunta', debePreguntarInstrumento(undefined), false);

console.log('\n== Con cuál se arranca ==');
// Lo importante del reporte: el perfil dice "solo órgano", así que el constructor
// tiene que abrirse en órgano aunque el campo del instrumento preferido diga otra cosa.
check('un solo instrumento manda sobre el preferido',
  instrumentoPorDefecto(['Órgano'], 'Guitarra'), 'Órgano');
check('y al revés igual',
  instrumentoPorDefecto(['Guitarra'], 'Órgano'), 'Guitarra');
check('con dos, arranca en el preferido (y se pregunta)',
  instrumentoPorDefecto(['Órgano', 'Guitarra'], 'Guitarra'), 'Guitarra');
check('sin lista, el preferido', instrumentoPorDefecto(undefined, 'Órgano'), 'Órgano');
check('lista vacía, el preferido', instrumentoPorDefecto([], 'Órgano'), 'Órgano');

console.log('\n== Las dos reglas no se contradicen ==');
// Si no se pregunta, el valor de arranque tiene que ser el definitivo: es lo único
// que verá el coro.
for (const uno of [['Órgano'], ['Guitarra'], ['Coro']] as const) {
  const preguntan = debePreguntarInstrumento([...uno]);
  const arranque = instrumentoPorDefecto([...uno], 'Guitarra');
  check(`${uno[0]}: no se pregunta y arranca en ${uno[0]}`,
    [preguntan, arranque], [false, uno[0]]);
}

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

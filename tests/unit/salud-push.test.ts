/**
 * Detectar parroquias que publican y a las que no le llega el aviso a nadie
 * (src/utils/saludPush.ts).
 *
 * Del 6-sep-2026: se publicó un cantoral para Virgen del Rosario (Valdivia de Paine) y
 * el aviso push no llegó a nadie, ni siquiera a quien publicó. No había forma de verlo:
 * la lista de suscriptores no se puede leer desde la app y "cero destinatarios" no se
 * distinguía de "todo bien".
 *
 * Cruzando las parroquias que DE VERDAD publican con los dispositivos suscritos, el
 * hueco salta a la vista antes de que alguien se queje.
 */
import { parroquiasSinAvisos } from '../../src/utils/saludPush';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
const VALDIVIA = 'Parroquia Virgen del Rosario (Valdivia de Paine) - Diócesis de San Bernardo';
const ANGELES  = 'Parroquia Santos Angeles custodios (Plaza de Buin) - Diócesis de San Bernardo';

console.log('\n== El caso reportado ==');
check('publica pero no tiene a nadie suscrito',
  parroquiasSinAvisos({ [ANGELES]: 3 }, [VALDIVIA, ANGELES]), [VALDIVIA]);

console.log('\n== Con todos cubiertos, no se alarma ==');
check('nada que avisar',
  parroquiasSinAvisos({ [VALDIVIA]: 1, [ANGELES]: 3 }, [VALDIVIA, ANGELES]), []);
check('sin cantorales publicados, nada', parroquiasSinAvisos({ [ANGELES]: 3 }, []), []);

console.log('\n== Cero cuenta como "sin nadie" ==');
// Una parroquia listada con 0 dispositivos es exactamente el problema, no una excepción.
check('el 0 no salva', parroquiasSinAvisos({ [VALDIVIA]: 0 }, [VALDIVIA]), [VALDIVIA]);

console.log('\n== Se compara sin que la ortografía estorbe ==');
// Un espacio de más o un acento distinto no pueden inventar una alarma falsa: es el
// mismo error que dejaba fuera a los suscriptores antes de normalizar.
check('espacios de más', parroquiasSinAvisos({ ['  ' + VALDIVIA + ' ']: 2 }, [VALDIVIA]), []);
check('mayúsculas distintas', parroquiasSinAvisos({ [VALDIVIA.toUpperCase()]: 2 }, [VALDIVIA]), []);
check('sin acentos', parroquiasSinAvisos({ [VALDIVIA.replace('Diócesis', 'Diocesis')]: 2 }, [VALDIVIA]), []);

console.log('\n== Sin repetidos y en orden ==');
// La misma parroquia publica muchas veces; en la lista debe salir UNA vez.
check('una sola vez', parroquiasSinAvisos({}, [VALDIVIA, VALDIVIA, VALDIVIA]), [VALDIVIA]);
check('en orden alfabético', parroquiasSinAvisos({}, [VALDIVIA, ANGELES]), [ANGELES, VALDIVIA]);
check('los vacíos se ignoran', parroquiasSinAvisos({}, ['', VALDIVIA]), [VALDIVIA]);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

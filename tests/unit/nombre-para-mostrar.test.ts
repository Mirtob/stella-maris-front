/**
 * El nombre que se muestra de una persona (src/utils/cuentaUsuario.ts).
 *
 * Reportado el 26-sep-2026: sobre el constructor asomaba «…tellamaris.app». Era el
 * nombre de una cuenta de usuario y clave sin nombre cargado —su correo interno
 * «x@usuario.stellamaris.app»—, que en el menú lateral no se recortaba y se salía por
 * el borde aun con el menú cerrado.
 */
import { nombreParaMostrar } from '../../src/utils/cuentaUsuario';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

check('nombre cargado: ese', nombreParaMostrar('María Pérez', 'maria@usuario.stellamaris.app'), 'María Pérez');
check('sin nombre, cuenta usuario/clave: el usuario', nombreParaMostrar(null, 'coropintue@usuario.stellamaris.app'), 'coropintue');
check('el "nombre" es el correo interno: el usuario',
  nombreParaMostrar('coropintue@usuario.stellamaris.app', 'coropintue@usuario.stellamaris.app'), 'coropintue');
check('nunca asoma el dominio interno',
  nombreParaMostrar('coropintue@usuario.stellamaris.app', undefined).includes('stellamaris.app'), false);
check('cuenta de Google sin nombre: su correo', nombreParaMostrar(undefined, 'ana@gmail.com'), 'ana@gmail.com');
check('espacios sobrantes', nombreParaMostrar('  Juan  ', 'j@gmail.com'), 'Juan');

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

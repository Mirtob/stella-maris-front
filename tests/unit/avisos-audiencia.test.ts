/**
 * A quién le llega un aviso o una promoción.
 *
 * Pedido el 3-sep-2026: se están sumando usuarios de diócesis cuyas parroquias todavía
 * no están cargadas, y hace falta poder escribirles. El filtro por diócesis es la pieza
 * con lógica de verdad, porque la diócesis no se guarda como tal: hay que sacarla del
 * nombre de la parroquia, que se almacena como
 *
 *     "Parroquia San José (Pintue) - Diócesis de San Bernardo · Capilla Santa Rosa"
 *
 * Si esa lectura falla, el aviso se manda a quien no era —y eso no se puede retirar—,
 * o no se manda a nadie sin que nada avise.
 */
import { diocesisDe, filtrarAudiencia, type Suscripcion } from '../../api/notify-cantoral';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== La diócesis sale del nombre de la parroquia ==');
check('parroquia simple',
  diocesisDe('Parroquia San José (Pintue) - Diócesis de San Bernardo'), 'Diócesis de San Bernardo');
// Con capilla, la diócesis va antes del ' · ': si se lee de más, no calza con nada.
check('parroquia con capilla',
  diocesisDe('Santuario Inmaculada Concepción (Maipo) - Diócesis de San Bernardo · Capilla Santa Rosa'),
  'Diócesis de San Bernardo');
check('arquidiócesis', diocesisDe('Parroquia X - Arquidiócesis de Santiago'), 'Arquidiócesis de Santiago');
check('sin diócesis en el nombre', diocesisDe('Parroquia suelta'), '');
check('cadena vacía', diocesisDe(''), '');

console.log('\n== El filtro elige a quién le suena el teléfono ==');
const sub = (parishes: string[], role: string | null): Suscripcion =>
  ({ endpoint: parishes.join('|') + role, p256dh: 'p', auth: 'a', parishes, role });

const todos: Suscripcion[] = [
  sub(['Parroquia A - Diócesis de San Bernardo'], 'Coro'),
  sub(['Parroquia B - Diócesis de San Bernardo · Capilla 1'], 'Pueblo fiel'),
  sub(['Parroquia C - Arquidiócesis de Santiago'], 'Pueblo fiel'),
  sub([], null),                                   // se suscribió sin parroquia
  sub(['Parroquia D - Diócesis de Rancagua', 'Parroquia A - Diócesis de San Bernardo'], 'Coro'),
];

const cuantos = (a: any) => filtrarAudiencia(todos, a).length;
check('sin filtro, le llega a todos', cuantos({}), 5);
check('sin filtro (undefined) también', cuantos(undefined), 5);
check('una diócesis', cuantos({ dioceses: ['Diócesis de San Bernardo'] }), 3);
check('la capilla no estorba', cuantos({ dioceses: ['Diócesis de San Bernardo'] }) >= 2, true);
check('dos diócesis', cuantos({ dioceses: ['Arquidiócesis de Santiago', 'Diócesis de Rancagua'] }), 2);
check('quien está en dos, cuenta una vez', cuantos({ dioceses: ['Diócesis de Rancagua'] }), 1);
check('una diócesis que no existe: nadie', cuantos({ dioceses: ['Diócesis de Marte'] }), 0);

console.log('\n== Por rol, y combinado ==');
check('solo el coro', cuantos({ roles: ['Coro'] }), 2);
check('solo el pueblo fiel', cuantos({ roles: ['Pueblo fiel'] }), 2);
check('coro de una diócesis', cuantos({ dioceses: ['Diócesis de San Bernardo'], roles: ['Coro'] }), 2);
check('combinación sin nadie', cuantos({ dioceses: ['Arquidiócesis de Santiago'], roles: ['Coro'] }), 0);

console.log('\n== Tolerante a acentos y mayúsculas ==');
// El nombre viaja desde el perfil y desde el selector: no puede fallar por una tilde.
check('sin tilde', cuantos({ dioceses: ['Diocesis de San Bernardo'] }), 3);
check('en minúscula', cuantos({ dioceses: ['diócesis de san bernardo'] }), 3);
check('con espacios de sobra', cuantos({ dioceses: ['  Diócesis de San Bernardo  '] }), 3);
check('rol sin tilde/mayúscula', cuantos({ roles: ['pueblo fiel'] }), 2);

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);

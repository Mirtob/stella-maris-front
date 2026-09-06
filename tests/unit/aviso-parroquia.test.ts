/**
 * A quién le llega el aviso de "nuevo cantoral" (api/notify-cantoral.ts).
 *
 * Reportado el 6-sep-2026: se publicó un cantoral para la parroquia Virgen del Rosario
 * (Valdivia de Paine) y el aviso push NO llegó, ni siquiera a quien lo publicó.
 *
 * La causa: `push_subscriptions.parishes` es una FOTO del momento en que la persona
 * activó los avisos, y no se vuelve a tocar. Quien luego se cambia de parroquia —o
 * entra a una nueva— deja de calzar y no recibe nada. Y en silencio: "cero
 * destinatarios" no se distinguía de "nadie los tiene activados".
 *
 * La regla ahora: se une la foto con la parroquia ACTUAL del perfil. Unir solo puede
 * SUMAR destinatarios, nunca dejar a nadie fuera.
 */
import { parroquiasDelSuscriptor, type PerfilParaAviso } from '../../api/notify-cantoral';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
const VALDIVIA = 'Parroquia Virgen del Rosario (Valdivia de Paine) - Diócesis de San Bernardo';
const ANGELES  = 'Parroquia Santos Angeles custodios (Plaza de Buin) - Diócesis de San Bernardo';
const perfiles = (l: PerfilParaAviso[]) => new Map(l.map((p) => [p.id, p]));
const sub = (parishes: string[], user_id?: string) =>
  ({ endpoint: 'e', p256dh: 'p', auth: 'a', parishes, user_id });

console.log('\n== El caso reportado ==');
// Activó los avisos cuando estaba en otra parroquia; hoy su perfil dice Valdivia.
const desactualizado = sub([ANGELES], 'u1');
const hoyEnValdivia = perfiles([{ id: 'u1', parishes: [VALDIVIA], parish_name: VALDIVIA }]);
check('la foto vieja no traía Valdivia', desactualizado.parishes.includes(VALDIVIA), false);
check('pero ahora sí calza',
  parroquiasDelSuscriptor(desactualizado, hoyEnValdivia).includes(VALDIVIA), true);
check('y no pierde la de antes',
  parroquiasDelSuscriptor(desactualizado, hoyEnValdivia).includes(ANGELES), true);

console.log('\n== Unir nunca quita a nadie ==');
// Quien tiene la foto al día y el perfil vacío debe seguir recibiendo.
const sinPerfil = sub([VALDIVIA], 'u2');
check('con el perfil vacío, manda la foto',
  parroquiasDelSuscriptor(sinPerfil, perfiles([{ id: 'u2', parishes: null, parish_name: null }])),
  [VALDIVIA]);
check('con el perfil ausente, también',
  parroquiasDelSuscriptor(sinPerfil, perfiles([])), [VALDIVIA]);
check('sin user_id (suscripción vieja), la foto',
  parroquiasDelSuscriptor(sub([VALDIVIA]), hoyEnValdivia), [VALDIVIA]);

console.log('\n== Varias parroquias ==');
// Un coro que toca en dos, y el perfil trae una tercera.
const enDos = sub([ANGELES, VALDIVIA], 'u3');
const conTercera = perfiles([{ id: 'u3', parishes: ['Parroquia San José (Pintue)'], parish_name: null }]);
check('salen las tres', parroquiasDelSuscriptor(enDos, conTercera).length, 3);
check('incluida la del perfil',
  parroquiasDelSuscriptor(enDos, conTercera).includes('Parroquia San José (Pintue)'), true);

console.log('\n== Nada de valores vacíos ==');
// Una cadena vacía calzaría con cualquier cosa al normalizar: no puede colarse.
const conVacios = sub(['', VALDIVIA], 'u4');
const perfilVacio = perfiles([{ id: 'u4', parishes: [''], parish_name: '' }]);
check('se filtran los vacíos', parroquiasDelSuscriptor(conVacios, perfilVacio), [VALDIVIA]);
check('una suscripción sin nada da lista vacía',
  parroquiasDelSuscriptor(sub([], 'u5'), perfiles([{ id: 'u5', parishes: null, parish_name: null }])), []);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

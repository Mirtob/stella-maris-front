/**
 * El cantoral del coro invitado (src/utils/cantoralVisibilidad.ts).
 *
 * HU: el coro de Pirque arma el cantoral del 11 de octubre para la parroquia de
 * Valdivia de Paine, que lo invitó. Al publicarlo, ese cantoral tiene DOS casas:
 *
 *   · Valdivia de Paine — coro Y pueblo fiel: es la Misa a la que van a ir.
 *   · Pirque — SOLO el coro. El pueblo fiel de Pirque ese domingo va a su propia
 *     Misa; mostrarle el cantoral de Valdivia sería mandarlo a otra iglesia.
 *
 * Antes el cantoral se publicaba solo en Valdivia y desaparecía de Pirque: el coro que
 * lo armó no podía abrirlo desde su propia parroquia.
 *
 * Ver la migración 20260922_cantoral_coro_invitado.
 */
import {
  esDeMiParroquia, esDeMiCoroInvitado, cantoralVisiblePara, esCantoralDeSalida,
} from '../../src/utils/cantoralVisibilidad';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const PIRQUE = 'Pirque - Diócesis de San Bernardo';
const PIRQUE_CAPILLA = 'Pirque - Diócesis de San Bernardo · Capilla El Llano';
const VALDIVIA = 'Valdivia de Paine - Diócesis de San Bernardo';
const VALDIVIA_CAPILLA = 'Valdivia de Paine - Diócesis de San Bernardo · Capilla San Luis';
const BUIN = 'Buin - Diócesis de San Bernardo';

/** El cantoral de la fiesta patronal: es de Valdivia, y lo armó el coro de Pirque. */
const deSalida = { parishName: VALDIVIA, guestChoirParish: PIRQUE };
/** Un domingo cualquiera en la propia parroquia. */
const deCasa = { parishName: PIRQUE };

const coro = { esCoro: true };
const pueblo = { esCoro: false };

console.log('\n== El de casa se ve como siempre ==');
check('mi parroquia, perfil coro', cantoralVisiblePara(deCasa, { unidadActiva: PIRQUE, ...coro }), true);
check('mi parroquia, pueblo fiel', cantoralVisiblePara(deCasa, { unidadActiva: PIRQUE, ...pueblo }), true);
check('parroquia ajena, nadie', cantoralVisiblePara(deCasa, { unidadActiva: BUIN, ...coro }), false);
check('tolera espacios y mayúsculas',
  esDeMiParroquia({ parishName: '  pirque - Diócesis de San Bernardo ' }, PIRQUE), true);
check('sin parroquia activa no se ve nada', esDeMiParroquia(deCasa, ''), false);

console.log('\n== La casa anfitriona lo ve entero ==');
check('Valdivia, coro', cantoralVisiblePara(deSalida, { unidadActiva: VALDIVIA, ...coro }), true);
check('Valdivia, pueblo fiel', cantoralVisiblePara(deSalida, { unidadActiva: VALDIVIA, ...pueblo }), true);

console.log('\n== La casa del coro invitado: solo el CORO ==');
check('Pirque, coro: sí', cantoralVisiblePara(deSalida, { unidadActiva: PIRQUE, ...coro }), true);
check('Pirque, pueblo fiel: NO', cantoralVisiblePara(deSalida, { unidadActiva: PIRQUE, ...pueblo }), false);
// Se invitó a la parroquia: el coro de sus capillas es el mismo coro.
check('una capilla de Pirque, coro: sí',
  cantoralVisiblePara(deSalida, { unidadActiva: PIRQUE_CAPILLA, ...coro }), true);
check('una capilla de Pirque, pueblo fiel: NO',
  cantoralVisiblePara(deSalida, { unidadActiva: PIRQUE_CAPILLA, ...pueblo }), false);

console.log('\n== Se invitó a UNA capilla ==');
const capillaInvitada = { parishName: VALDIVIA, guestChoirParish: PIRQUE_CAPILLA };
check('la capilla invitada lo ve', esDeMiCoroInvitado(capillaInvitada, PIRQUE_CAPILLA), true);
// Misma regla que la invitación (`esParaMiCoro`, que se mira en los dos sentidos): la
// parroquia madre cubre a su capilla, así que el coro de Pirque lo encuentra igual.
check('la parroquia madre también', esDeMiCoroInvitado(capillaInvitada, PIRQUE), true);
check('una parroquia ajena no', esDeMiCoroInvitado(capillaInvitada, BUIN), false);

console.log('\n== Nadie más ==');
check('Buin no ve el cantoral de otros', cantoralVisiblePara(deSalida, { unidadActiva: BUIN, ...coro }), false);
check('una capilla de la anfitriona no es la anfitriona',
  cantoralVisiblePara(deSalida, { unidadActiva: VALDIVIA_CAPILLA, ...coro }), false);
check('sin coro invitado no hay segunda casa', esDeMiCoroInvitado(deCasa, PIRQUE), false);
check('coro invitado vacío no cuenta',
  esDeMiCoroInvitado({ parishName: VALDIVIA, guestChoirParish: '   ' }, PIRQUE), false);

console.log('\n== El aviso "se canta allá" ==');
// Solo en la casa del coro invitado: en Valdivia el cantoral es el suyo y no necesita
// aclaración; en Pirque, sin el aviso, parece un cantoral con la parroquia mal escrita.
check('en Pirque se avisa', esCantoralDeSalida(deSalida, PIRQUE), true);
check('en Valdivia no', esCantoralDeSalida(deSalida, VALDIVIA), false);
check('en el cantoral de casa tampoco', esCantoralDeSalida(deCasa, PIRQUE), false);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

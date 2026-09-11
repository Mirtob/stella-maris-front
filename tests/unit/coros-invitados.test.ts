/**
 * Coros invitados (src/utils/choirInvitations.ts).
 *
 * HU: en la fiesta patronal, una parroquia invita al coro de otra. El coro de Pirque
 * canta en Valdivia de Paine, así que tiene que poder publicar el cantoral de ESA Misa
 * en Valdivia — y solo esa celebración.
 *
 * Las cuatro reglas que se fijan aquí:
 *  · Parroquias y capillas juegan igual: una capilla invita, y puede invitar a otra.
 *  · La fecha es la de la CELEBRACIÓN; un sábado por la tarde se invita al DOMINGO
 *    con tipo I Vísperas.
 *  · Rechazada = apagada.
 *  · Retira quien invitó; rechaza el invitado. Ninguno hace lo del otro.
 *
 * Quien decide de verdad es la RLS (migración 20260910_coros_invitados). Esto fija lo
 * que la app puede ofrecer sin que el servidor lo rechace después.
 */
import {
  cubre, esParaMiCoro, parroquiasMadre, parroquiasInvitadasPara, invitacionesVigentesPara,
  estaVigente, meInvitaron, inviteYo, type ChoirInvitation,
} from '../../src/utils/choirInvitations';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const PIRQUE = 'Pirque - Diócesis de San Bernardo';
const VALDIVIA = 'Valdivia de Paine - Diócesis de San Bernardo';
const VALDIVIA_CAPILLA = 'Valdivia de Paine - Diócesis de San Bernardo · Capilla San Luis';
const PIRQUE_CAPILLA = 'Pirque - Diócesis de San Bernardo · Capilla El Llano';
const BUIN = 'Buin - Diócesis de San Bernardo';
/** Domingo. Un sábado por la tarde se invita a ESTA fecha con I Vísperas. */
const FIESTA = '2026-10-11';

const inv = (extra: Partial<ChoirInvitation> = {}): ChoirInvitation => ({
  id: 'i1', hostParish: VALDIVIA, guestParish: PIRQUE, date: FIESTA, massType: 'dia', ...extra,
});

console.log('\n== Qué cubre una parroquia ==');
check('la parroquia se cubre a sí misma', cubre(PIRQUE, PIRQUE), true);
check('la parroquia cubre a sus capillas', cubre(VALDIVIA, VALDIVIA_CAPILLA), true);
check('la capilla NO cubre a su parroquia', cubre(VALDIVIA_CAPILLA, VALDIVIA), false);
check('parroquias distintas no se cubren', cubre(PIRQUE, VALDIVIA), false);
check('un nombre que empieza igual no cuenta',
  cubre('Pirque - Diócesis de San Bernardo', 'Pirque Alto - Diócesis de San Bernardo'), false);
check('vacío no cubre nada', cubre('', VALDIVIA), false);

console.log('\n== ¿La invitación es para mi coro? (se mira en los dos sentidos) ==');
check('me invitaron como parroquia', esParaMiCoro(PIRQUE, PIRQUE), true);
check('me invitaron a mi capilla', esParaMiCoro(PIRQUE_CAPILLA, PIRQUE), true);
check('invitaron a mi parroquia y yo soy la capilla', esParaMiCoro(PIRQUE, PIRQUE_CAPILLA), true);
check('invitaron a otro coro', esParaMiCoro(BUIN, PIRQUE), false);

console.log('\n== Parroquia madre ==');
check('de una capilla se saca su parroquia', parroquiasMadre([PIRQUE_CAPILLA]), [PIRQUE]);
check('no repite', parroquiasMadre([PIRQUE, PIRQUE_CAPILLA]), [PIRQUE]);
check('descarta vacías', parroquiasMadre(['', PIRQUE]), [PIRQUE]);

console.log('\n== Dónde puedo publicar ese domingo ==');
check('invitado ese día: aparece la anfitriona',
  parroquiasInvitadasPara([inv()], [PIRQUE], FIESTA), [VALDIVIA]);
check('otro día: no aparece nada',
  parroquiasInvitadasPara([inv()], [PIRQUE], '2026-10-18'), []);
check('la invitación es a OTRO coro: no me sirve',
  parroquiasInvitadasPara([inv({ guestParish: BUIN })], [PIRQUE], FIESTA), []);
check('una capilla invita: se publica en la capilla',
  parroquiasInvitadasPara([inv({ hostParish: VALDIVIA_CAPILLA })], [PIRQUE], FIESTA), [VALDIVIA_CAPILLA]);
check('una capilla invita a otra capilla',
  parroquiasInvitadasPara([inv({ hostParish: VALDIVIA_CAPILLA, guestParish: PIRQUE_CAPILLA })], [PIRQUE], FIESTA),
  [VALDIVIA_CAPILLA]);
check('entré por mi capilla, pero el invitado es mi coro',
  parroquiasInvitadasPara([inv()], [PIRQUE_CAPILLA], FIESTA), [VALDIVIA]);
check('la propia nunca sale como invitación',
  parroquiasInvitadasPara([inv({ hostParish: PIRQUE })], [PIRQUE], FIESTA), []);
check('mi propia capilla tampoco',
  parroquiasInvitadasPara([inv({ hostParish: PIRQUE_CAPILLA })], [PIRQUE], FIESTA), []);
check('sin parroquia en el perfil no hay invitaciones que valgan',
  parroquiasInvitadasPara([inv()], [], FIESTA), []);
check('sin fecha no se ofrece nada',
  parroquiasInvitadasPara([inv()], [PIRQUE], ''), []);
check('dos anfitrionas el mismo día se ofrecen las dos',
  parroquiasInvitadasPara([inv(), inv({ id: 'i2', hostParish: BUIN })], [PIRQUE], FIESTA),
  [VALDIVIA, BUIN]);
check('la misma anfitriona dos veces no se duplica',
  parroquiasInvitadasPara([inv(), inv({ id: 'i2' })], [PIRQUE], FIESTA), [VALDIVIA]);

console.log('\n== Rechazada = apagada ==');
check('en pie', estaVigente(inv()), true);
check('rechazada', estaVigente(inv({ rejectedAt: '2026-10-01T12:00:00Z' })), false);
check('rechazada no habilita a publicar',
  parroquiasInvitadasPara([inv({ rejectedAt: '2026-10-01T12:00:00Z' })], [PIRQUE], FIESTA), []);
check('si hay otra en pie, esa sí',
  parroquiasInvitadasPara(
    [inv({ rejectedAt: '2026-10-01T12:00:00Z' }), inv({ id: 'i2', hostParish: BUIN })],
    [PIRQUE], FIESTA,
  ),
  [BUIN]);

console.log('\n== El tipo de Misa viaja en la invitación ==');
check('I Vísperas: el sábado por la tarde, para el domingo',
  invitacionesVigentesPara([inv({ massType: 'visperas_i' })], [PIRQUE], FIESTA).map(i => [i.date, i.massType]),
  [[FIESTA, 'visperas_i']]);
check('la fecha sigue siendo la de la celebración',
  invitacionesVigentesPara([inv({ massType: 'visperas_i' })], [PIRQUE], '2026-10-10'), []);

console.log('\n== Cada parte deshace su lado ==');
check('el invitado puede rechazar', meInvitaron(inv(), [PIRQUE]), true);
check('el invitado por capilla también', meInvitaron(inv({ guestParish: PIRQUE_CAPILLA }), [PIRQUE]), true);
check('el anfitrión no rechaza: no lo invitaron', meInvitaron(inv(), [VALDIVIA]), false);
check('el anfitrión puede retirar', inviteYo(inv(), [VALDIVIA]), true);
check('retirar la de su capilla también', inviteYo(inv({ hostParish: VALDIVIA_CAPILLA }), [VALDIVIA]), true);
check('el invitado no retira: no invitó él', inviteYo(inv(), [PIRQUE]), false);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

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
  estaVigente, estaPendiente, estadoInvitacion, meInvitaron, inviteYo, invitacionQueMarca,
  type ChoirInvitation,
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

/**
 * Invitación ya ACEPTADA por alguien del coro invitado. Es el estado que habilita a
 * publicar: sin aceptar, la anfitriona no se ofrece como destino.
 */
const aceptada = (extra: Partial<ChoirInvitation> = {}): ChoirInvitation =>
  inv({ acceptedAt: '2026-10-01T12:00:00Z', ...extra });

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

console.log('\n== Dónde puedo publicar ese domingo (ya aceptada) ==');
check('aceptada ese día: aparece la anfitriona',
  parroquiasInvitadasPara([aceptada()], [PIRQUE], FIESTA), [VALDIVIA]);
check('otro día: no aparece nada',
  parroquiasInvitadasPara([aceptada()], [PIRQUE], '2026-10-18'), []);
check('la invitación es a OTRO coro: no me sirve',
  parroquiasInvitadasPara([aceptada({ guestParish: BUIN })], [PIRQUE], FIESTA), []);
check('una capilla invita: se publica en la capilla',
  parroquiasInvitadasPara([aceptada({ hostParish: VALDIVIA_CAPILLA })], [PIRQUE], FIESTA), [VALDIVIA_CAPILLA]);
check('una capilla invita a otra capilla',
  parroquiasInvitadasPara([aceptada({ hostParish: VALDIVIA_CAPILLA, guestParish: PIRQUE_CAPILLA })], [PIRQUE], FIESTA),
  [VALDIVIA_CAPILLA]);
check('entré por mi capilla, pero el invitado es mi coro',
  parroquiasInvitadasPara([aceptada()], [PIRQUE_CAPILLA], FIESTA), [VALDIVIA]);
check('la propia nunca sale como invitación',
  parroquiasInvitadasPara([aceptada({ hostParish: PIRQUE })], [PIRQUE], FIESTA), []);
check('mi propia capilla tampoco',
  parroquiasInvitadasPara([aceptada({ hostParish: PIRQUE_CAPILLA })], [PIRQUE], FIESTA), []);
check('sin parroquia en el perfil no hay invitaciones que valgan',
  parroquiasInvitadasPara([aceptada()], [], FIESTA), []);
check('sin fecha no se ofrece nada',
  parroquiasInvitadasPara([aceptada()], [PIRQUE], ''), []);
check('dos anfitrionas el mismo día se ofrecen las dos',
  parroquiasInvitadasPara([aceptada(), aceptada({ id: 'i2', hostParish: BUIN })], [PIRQUE], FIESTA),
  [VALDIVIA, BUIN]);
check('la misma anfitriona dos veces no se duplica',
  parroquiasInvitadasPara([aceptada(), aceptada({ id: 'i2' })], [PIRQUE], FIESTA), [VALDIVIA]);

console.log('\n== Rechazada = apagada ==');
check('en pie', estaVigente(inv()), true);
check('rechazada', estaVigente(inv({ rejectedAt: '2026-10-01T12:00:00Z' })), false);
check('rechazada no habilita a publicar',
  parroquiasInvitadasPara([inv({ rejectedAt: '2026-10-01T12:00:00Z' })], [PIRQUE], FIESTA), []);
check('si hay otra aceptada, esa sí',
  parroquiasInvitadasPara(
    [inv({ rejectedAt: '2026-10-01T12:00:00Z' }), aceptada({ id: 'i2', hostParish: BUIN })],
    [PIRQUE], FIESTA,
  ),
  [BUIN]);

console.log('\n== El tipo de Misa viaja en la invitación ==');
check('I Vísperas: el sábado por la tarde, para el domingo',
  invitacionesVigentesPara([aceptada({ massType: 'visperas_i' })], [PIRQUE], FIESTA).map(i => [i.date, i.massType]),
  [[FIESTA, 'visperas_i']]);
check('la fecha sigue siendo la de la celebración',
  invitacionesVigentesPara([aceptada({ massType: 'visperas_i' })], [PIRQUE], '2026-10-10'), []);

console.log('\n== Cada parte deshace su lado ==');
check('el invitado puede rechazar', meInvitaron(inv(), [PIRQUE]), true);
check('el invitado por capilla también', meInvitaron(inv({ guestParish: PIRQUE_CAPILLA }), [PIRQUE]), true);
check('el anfitrión no rechaza: no lo invitaron', meInvitaron(inv(), [VALDIVIA]), false);
check('el anfitrión puede retirar', inviteYo(inv(), [VALDIVIA]), true);
check('retirar la de su capilla también', inviteYo(inv({ hostParish: VALDIVIA_CAPILLA }), [VALDIVIA]), true);
check('el invitado no retira: no invitó él', inviteYo(inv(), [PIRQUE]), false);

console.log('\n== Aceptar, rechazar, o todavía sin responder ==');
check('recién invitada: pendiente', estadoInvitacion(inv()), 'pendiente');
check('aceptada', estadoInvitacion(inv({ acceptedAt: '2026-10-01T12:00:00Z' })), 'aceptada');
check('rechazada', estadoInvitacion(inv({ rejectedAt: '2026-10-01T12:00:00Z' })), 'rechazada');
// El rechazo manda: si se aceptó y después se dijo que no, no van.
check('rechazar después de aceptar manda el rechazo',
  estadoInvitacion(inv({ acceptedAt: '2026-10-01T12:00:00Z', rejectedAt: '2026-10-02T12:00:00Z' })),
  'rechazada');
check('solo la pendiente pide respuesta', estaPendiente(inv()), true);
check('la aceptada ya no', estaPendiente(inv({ acceptedAt: '2026-10-01T12:00:00Z' })), false);
check('la aceptada sigue vigente', estaVigente(inv({ acceptedAt: '2026-10-01T12:00:00Z' })), true);

console.log('\n== Aceptar es la llave, y basta con uno del coro ==');
check('sin responder NO habilita a publicar',
  parroquiasInvitadasPara([inv()], [PIRQUE], FIESTA), []);
check('aceptada habilita',
  parroquiasInvitadasPara([aceptada()], [PIRQUE], FIESTA), [VALDIVIA]);
check('rechazada no habilita',
  parroquiasInvitadasPara([inv({ rejectedAt: '2026-10-01T12:00:00Z' })], [PIRQUE], FIESTA), []);
// La aceptación vive en la fila de la INVITACIÓN, que es del coro entero: no hay
// nada por usuario que consultar, así que a otro corista —aquí, uno que entró por la
// capilla— le aparece habilitada igual sin haber tocado "Aceptar".
check('la aceptó un compañero: al resto del coro le sirve igual',
  parroquiasInvitadasPara([aceptada()], [PIRQUE_CAPILLA], FIESTA), [VALDIVIA]);
check('aceptada y despues rechazada: se apaga',
  parroquiasInvitadasPara([aceptada({ rejectedAt: '2026-10-02T12:00:00Z' })], [PIRQUE], FIESTA), []);

console.log('\n== De quien es el cantoral al publicar (invitacionQueMarca) ==');
// Reportado el 23-sep-2026: el cantoral del 11 de octubre se publico en Valdivia de
// Paine sin marca de coro invitado, y por eso no aparecia en Pirque. La causa: quien
// publico tiene AMBAS parroquias en su perfil, e `invitacionesVigentesPara` descarta las
// anfitrionas que uno ya cubre —ahi publica por derecho—, asi que la invitacion se
// perdia antes de llegar al menu de publicacion.
const marca = (inv: ChoirInvitation[], propias: string[], fecha: string, host: string) =>
  invitacionQueMarca(inv, propias, fecha, host)?.guestParish ?? null;

check('la invitacion aceptada marca el cantoral',
  marca([aceptada()], [PIRQUE], FIESTA, VALDIVIA), PIRQUE);
check('REGRESION: marca aunque el perfil incluya TAMBIEN la anfitriona',
  marca([aceptada()], [PIRQUE, VALDIVIA], FIESTA, VALDIVIA), PIRQUE);
check('y eso que esa invitacion no se ofrece como destino',
  parroquiasInvitadasPara([aceptada()], [PIRQUE, VALDIVIA], FIESTA), []);
check('sin aceptar no marca', marca([inv()], [PIRQUE], FIESTA, VALDIVIA), null);
check('rechazada no marca',
  marca([inv({ rejectedAt: '2026-10-01T12:00:00Z' })], [PIRQUE], FIESTA, VALDIVIA), null);
check('otra fecha no marca', marca([aceptada()], [PIRQUE], '2026-10-18', VALDIVIA), null);
check('otra anfitriona no marca', marca([aceptada()], [PIRQUE], FIESTA, BUIN), null);
check('si el coro invitado no es el mio, no marca',
  marca([aceptada({ guestParish: BUIN })], [PIRQUE], FIESTA, VALDIVIA), null);
check('entre por una capilla de la parroquia invitada',
  marca([aceptada()], [PIRQUE_CAPILLA], FIESTA, VALDIVIA), PIRQUE);
check('invitaron a la capilla y la anfitriona es una capilla',
  marca([aceptada({ guestParish: PIRQUE_CAPILLA, hostParish: VALDIVIA_CAPILLA })],
        [PIRQUE], FIESTA, VALDIVIA_CAPILLA), PIRQUE_CAPILLA);
check('espacios de sobra en el nombre de la anfitriona no rompen el calce',
  marca([aceptada()], [PIRQUE], FIESTA, '  ' + VALDIVIA + ' '), PIRQUE);
check('sin anfitriona no marca', marca([aceptada()], [PIRQUE], FIESTA, ''), null);
check('sin parroquias propias no marca', marca([aceptada()], [], FIESTA, VALDIVIA), null);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

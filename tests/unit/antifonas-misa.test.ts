/**
 * Antífonas de entrada y de comunión (src/data/antiphonIndex.ts, src/utils/antiphonSong.ts).
 *
 * Pedido el 13-sep-2026: tenerlas en el constructor como caja editable con una casilla,
 * para que el coro pueda cantar la antífona de entrada DESPUÉS del canto de entrada, y
 * la de comunión cuando el sacerdote empieza a comulgar.
 *
 * Lo que se fija aquí:
 *  · Las antífonas salen del Misal por celebración (datos generados por
 *    scripts/import-antifonas.py desde los propios del año).
 *  · Se SUMAN a su parte, no la reemplazan.
 *  · Sin marcar la casilla, no viajan al cantoral.
 *  · Llevan la fecha en el id, para no arrastrar la del domingo pasado al editar.
 */
import { resolveAntiphons, conCita, antiphonsReady } from '../../src/data/antiphonIndex';
import {
  buildAntiphonSong, isAntiphonSong, findAntiphonSong, conAntifonas,
} from '../../src/utils/antiphonSong';
import { songsForBuilder } from '../../src/utils/psalmSong';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
function checkThat(name: string, cond: boolean) { check(name, cond, true); }

const FECHA = '2026-01-18';

console.log('\n== El índice del Misal ==');
checkThat('hay antífonas cargadas', antiphonsReady());

const dom2 = resolveAntiphons('2.º Domingo del Tiempo Ordinario');
checkThat('el 2.º domingo T.O. tiene entrada', !!dom2?.entrada);
checkThat('…y comunión', !!dom2?.comunion);
checkThat('la entrada trae su cita', !!dom2?.entradaCita);
checkThat('el Misal ofrece segunda opción de comunión', !!dom2?.comunionAlt);

// El texto no puede arrastrar la rúbrica: el folleto del pueblo no dice "Se dice Gloria".
const todas = ['1.º Domingo de Adviento', 'Domingo de Resurrección', 'Pentecostés',
  'Jesucristo, Rey del Universo', '1.º Domingo de Cuaresma', 'Santísima Trinidad'];
for (const c of todas) {
  const a = resolveAntiphons(c);
  checkThat(`${c}: tiene las dos antífonas`, !!a?.entrada && !!a?.comunion);
  checkThat(`${c}: sin rúbricas pegadas`, !/[Ss]e dice (Gloria|Credo)/.test(`${a?.entrada} ${a?.comunion}`));
}

console.log('\n== Emparejar la celebración ==');
checkThat('tolera acentos y mayúsculas',
  !!resolveAntiphons('2.º DOMINGO DEL TIEMPO ORDINARIO')?.entrada);
check('una celebración que no está en la fuente da null',
  resolveAntiphons('San Fulano de Tal'), null);
check('sin celebración, null', resolveAntiphons(''), null);
checkThat('la Divina Misericordia usa el 2.º de Pascua (alias)',
  !!resolveAntiphons('Domingo de la Divina Misericordia (2.º de Pascua)')?.entrada);

console.log('\n== Texto con su cita ==');
check('texto y cita', conCita('Que se postre ante ti', 'Cf. Sal 65, 4'),
  'Que se postre ante ti (Cf. Sal 65, 4)');
check('sin cita, solo el texto', conCita('Que se postre ante ti', ''), 'Que se postre ante ti');
check('sin texto, nada', conCita('', 'Cf. Sal 65, 4'), '');

console.log('\n== La casilla manda ==');
check('sin marcar no viaja', buildAntiphonSong(FECHA, 'Entrada', 'Texto', false), null);
check('marcada pero vacía tampoco', buildAntiphonSong(FECHA, 'Entrada', '   ', true), null);
const entrada = buildAntiphonSong(FECHA, 'Entrada', 'Que se postre ante ti', true)!;
checkThat('marcada y con texto, sí', !!entrada);
check('va en su parte', entrada.category, 'Entrada');
check('el texto es la letra', entrada.lyrics, 'Que se postre ante ti');
check('lleva la fecha en el id', entrada.id, `antifona-entrada-${FECHA}`);
check('se reconoce como antífona', isAntiphonSong(entrada), true);
check('un canto normal no', isAntiphonSong({ id: 'abc123' }), false);

console.log('\n== Se SUMA a su parte, no la reemplaza ==');
const cantoEntrada = { id: 'canto1', category: 'Entrada' };
const comunion = buildAntiphonSong(FECHA, 'Comunión', 'Preparas una mesa ante mí', true)!;
const final = conAntifonas([cantoEntrada as never], [entrada as never, comunion as never]);
check('quedan los tres', final.length, 3);
check('el canto de entrada sigue primero', final[0].id, 'canto1');
check('la antífona de entrada va después', final[1].id, `antifona-entrada-${FECHA}`);
check('sin antífonas, el cantoral no cambia',
  conAntifonas([cantoEntrada as never], [null, null]).length, 1);
check('no se duplica si ya estaba',
  conAntifonas([cantoEntrada as never, entrada as never], [entrada as never]).length, 2);

console.log('\n== Al editar no se arrastra la del domingo pasado ==');
const publicado = [cantoEntrada, entrada, comunion] as never[];
check('salen del borrador', songsForBuilder(publicado).map(s => s.id), ['canto1']);
check('pero se encuentran para reponer la caja',
  findAntiphonSong(publicado, 'Comunión')!.lyrics, 'Preparas una mesa ante mí');
check('y la de la otra parte no se confunde',
  findAntiphonSong(publicado, 'Entrada')!.id, `antifona-entrada-${FECHA}`);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

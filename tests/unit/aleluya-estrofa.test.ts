/**
 * La estrofa del Aleluya no se imprime (src/utils/aleluyaEstrofa.ts).
 *
 * Reportado el 6-sep-2026: el folleto imprime la letra completa, y en el Aleluya eso
 * incluye una estrofa que en el catálogo está solo COMO EJEMPLO, para poder escribir
 * los acordes. La de verdad es propia de cada domingo y la canta el cantor. Impresa
 * como si fuera la del día, confunde al pueblo —que la lee y la canta— y al coro.
 *
 * Lo que fijan estas pruebas es sobre todo la PRUDENCIA de la regla: solo se quita la
 * estrofa cuando la aclamación se reconoce con seguridad. Borrar de más sería peor.
 */
import { soloLaAclamacion, esLineaDeAclamacion } from '../../src/utils/aleluyaEstrofa';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== El caso reportado, con la letra real del catálogo ==');
// "Aleluya V - Cántico del ángel", tal como está en la base.
const conEstrofa = [
  '[Do]Alelu[Sol]ya, [Rem]alelu[Lam]ya, [Fa]aleluya, ale[Sol]l[Sol7]u[Do]ya.',
  '',
  '[Do]Habla Señor, [Fa]que [Rem]siervo es[Sol]cucha.[Sol7]',
  '',
  '[Do]Alelu[Sol]ya, [Rem]alelu[Lam]ya, [Fa]aleluya, ale[Sol]l[Sol7]u[Do]ya.',
].join('\n');
const r = soloLaAclamacion(conEstrofa);
check('se quita la estrofa', r.seQuitoLaEstrofa, true);
check('no queda rastro de la estrofa de ejemplo', /Habla Señor/.test(r.letra), false);
check('queda la aclamación', /Aleluya/i.test(r.letra), true);
check('y una sola vez, no repetida', r.letra.split('\n').filter(l => l.trim()).length, 1);
check('con sus acordes intactos', r.letra.includes('[Do]Alelu[Sol]ya'), true);

console.log('\n== Los Aleluya que son solo aclamación no se tocan ==');
// Los otros tres del catálogo: no hay nada que quitar.
const soloAclamacion = [
  '[Rem]Aleluya, ale[Fa]luya, ale[Sib]lu[Fa]ya',
  '',
  '[Rem]Aleluya, ale[Fa]luya, ale[Sib]lu[Do][Rem/Re]ya',
].join('\n');
check('no se marca como recortado', soloLaAclamacion(soloAclamacion).seQuitoLaEstrofa, false);
check('la letra queda igual', soloLaAclamacion(soloAclamacion).letra, soloAclamacion);
const gregoriano = '[Sol]Aleluya, [Re]a[Mim]leluya[Lam][Re], [Do]ale[Re7]lu[Sol]ya.';
check('el gregoriano tampoco', soloLaAclamacion(gregoriano).letra, gregoriano);

console.log('\n== Prudencia: si no se reconoce la aclamación, no se toca nada ==');
// En Cuaresma no se dice "Aleluya"; la aclamación es otra y no hay forma de separarla
// de la estrofa sin adivinar. Mostrar de más es preferible a borrar lo que no se entiende.
const cuaresma = [
  'Honor y gloria a ti, Señor Jesús.',
  '',
  'No solo de pan vive el hombre.',
].join('\n');
check('la aclamación de Cuaresma se deja entera', soloLaAclamacion(cuaresma).letra, cuaresma);
check('y no se marca nada', soloLaAclamacion(cuaresma).seQuitoLaEstrofa, false);
check('una letra vacía no rompe', soloLaAclamacion('').letra, '');

console.log('\n== Reconocer la línea de aclamación ==');
check('con acordes', esLineaDeAclamacion('[Do]Alelu[Sol]ya, ale[Fa]luya'), true);
check('sin acento', esLineaDeAclamacion('Aleluya'), true);
check('con acento', esLineaDeAclamacion('Alelúya'), true);
check('en latín', esLineaDeAclamacion('Alleluia, alleluia'), true);
check('en mayúsculas', esLineaDeAclamacion('ALELUYA, ALELUYA'), true);
check('la estrofa no lo es', esLineaDeAclamacion('Habla Señor, que tu siervo escucha'), false);
check('una línea vacía no lo es', esLineaDeAclamacion(''), false);

console.log('\n== Varias estrofas de ejemplo ==');
const varias = [
  'Aleluya, aleluya.',
  'Habla Señor, que tu siervo escucha.',
  'Aleluya, aleluya.',
  'Tus palabras, Señor, son espíritu y vida.',
  'Aleluya, aleluya.',
].join('\n');
const rv = soloLaAclamacion(varias);
check('se van todas', /Habla|palabras/.test(rv.letra), false);
check('queda solo la aclamación', rv.letra, 'Aleluya, aleluya.');

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

/**
 * La portada del folleto (src/utils/portadaFolleto.ts).
 *
 * HU (6-nov-2026): «Cantoral para la Misa de» / tipo de Misa + celebración / fecha y hora /
 * parroquia y diócesis, centrados y ocupando todo el espacio. El coro ya no va.
 */
import { conPreposicion, lugarDePortada, repartirPortada, tituloDePortada } from '../../src/utils/portadaFolleto';
import { rangoDeCelebracion } from '../../src/utils/liturgicalCalendar';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== Tipo de Misa + rango + celebración ==');
check('I Vísperas de una solemnidad',
  tituloDePortada('Jesucristo, Rey del Universo', 'visperas_i', 'solemnity'),
  'I Vísperas de la Solemnidad de Jesucristo, Rey del Universo');
check('Misa del día de una solemnidad',
  tituloDePortada('Jesucristo, Rey del Universo', 'dia', 'solemnity'),
  'Misa del día de la Solemnidad de Jesucristo, Rey del Universo');
check('II Vísperas de una fiesta',
  tituloDePortada('Sagrada Familia', 'visperas_ii', 'feast'),
  'II Vísperas de la Fiesta de la Sagrada Familia');
check('un domingo no lleva rango',
  tituloDePortada('33.º Domingo del Tiempo Ordinario', 'dia', 'sunday'),
  'Misa del día del 33.º Domingo del Tiempo Ordinario');
check('una feria',
  tituloDePortada('Jueves de la 27.ª semana del Tiempo Ordinario', 'dia', null),
  'Misa del día del Jueves de la 27.ª semana del Tiempo Ordinario');

console.log('\n== Lo que se nombra por sí mismo no repite el rango ==');
check('Domingo de Resurrección', tituloDePortada('Domingo de Resurrección', 'dia', 'solemnity'), 'Misa del día del Domingo de Resurrección');
check('octava de Pascua', tituloDePortada('Lunes de la Octava de Pascua', 'dia', 'solemnity'), 'Misa del día del Lunes de la Octava de Pascua');
check('Conmemoración', tituloDePortada('Conmemoración de Todos los Fieles Difuntos', 'dia', 'feast'), 'Misa del día de la Conmemoración de Todos los Fieles Difuntos');
check('escrita con su rango', tituloDePortada('Solemnidad de San José', 'dia', null), 'Misa del día de la Solemnidad de San José');

console.log('\n== Agregadas a mano ==');
check('sin rango inventado', tituloDePortada('Vigilia de inicio del Mes de María', 'dia', null), 'Misa del día de la Vigilia de inicio del Mes de María');
check('masculina', tituloDePortada('Encuentro diocesano de Adoradores', 'dia', null), 'Misa del día del Encuentro diocesano de Adoradores');
check('ya es una Misa', tituloDePortada('Santa Misa de Acción de Gracias por el 1° Aniversario', 'dia', null), 'Santa Misa de Acción de Gracias por el 1° Aniversario');
check('«Misiones» no es «Misa»', tituloDePortada('Misiones 2026', 'dia', null), 'Misa del día de Misiones 2026');

console.log('\n== Preposición y artículo con los nombres del calendario ==');
for (const [nombre, esperado] of [
  ['Epifanía del Señor', 'de la Epifanía del Señor'],
  ['Natividad del Señor', 'de la Natividad del Señor'],
  ['Inmaculada Concepción de la Virgen María', 'de la Inmaculada Concepción de la Virgen María'],
  ['Santísima Trinidad', 'de la Santísima Trinidad'],
  ['Sagrado Corazón de Jesús', 'del Sagrado Corazón de Jesús'],
  ['Corpus Christi', 'del Corpus Christi'],
  ['Bautismo del Señor', 'del Bautismo del Señor'],
  ['Pentecostés', 'de Pentecostés'],
  ['Todos los Santos', 'de Todos los Santos'],
  ['Santos Inocentes, Mártires', 'de los Santos Inocentes, Mártires'],
  ['Santa María, Madre de Dios', 'de Santa María, Madre de Dios'],
  ['San Andrés, Apóstol', 'de San Andrés, Apóstol'],
  ['Santiago, Apóstol', 'de Santiago, Apóstol'],
  ['Cátedra de San Pedro, Apóstol', 'de la Cátedra de San Pedro, Apóstol'],
  ['María Auxiliadora', 'de María Auxiliadora'],
  ['Día del Catequista', 'del Día del Catequista'],
  ['La Candelaria', 'de la Candelaria'],
] as const) check(nombre, conPreposicion(nombre), esperado);

console.log('\n== El rango sale del calendario, no de lo agregado a mano ==');
check('solemnidad', rangoDeCelebracion('Jesucristo, Rey del Universo', '2026-11-22'), 'solemnity');
check('fiesta', rangoDeCelebracion('San Andrés, Apóstol', '2026-11-30'), 'feast');
check('domingo', rangoDeCelebracion('33.º Domingo del Tiempo Ordinario', '2026-11-15'), 'sunday');
check('agregada a mano', rangoDeCelebracion('Vigilia de inicio del Mes de María', '2026-11-06'), null);

console.log('\n== Parroquia y diócesis ==');
check('parroquia - diócesis',
  lugarDePortada('Parroquia San José (Pintue) - Diócesis de San Bernardo'),
  { parroquia: ['Parroquia San José (Pintue)'], diocesis: 'Diócesis de San Bernardo' });
check('con capilla',
  lugarDePortada('Parroquia San José - Diócesis de San Bernardo · San Alberto'),
  { parroquia: ['Capilla San Alberto', 'Parroquia San José'], diocesis: 'Diócesis de San Bernardo' });
check('capilla que ya lo dice',
  lugarDePortada('Parroquia X - Diócesis Y · Capilla del Carmen').parroquia[0], 'Capilla del Carmen');
check('sin diócesis', lugarDePortada('Parroquia Sola'), { parroquia: ['Parroquia Sola'], diocesis: '' });

console.log('\n== El reparto llena el alto y respeta el ancho ==');
const medir = (t: string, puntos: number) => t.length * puntos * 0.18;
const negro: [number, number, number] = [0, 0, 0];
const bloques = (titulo: string) => [
  [{ texto: 'Cantoral para la Misa de', puntos: 19, color: negro }],
  [{ texto: titulo, puntos: 30, negrita: true, color: negro, parejo: true }, { texto: '', puntos: 10, color: negro }],
  [{ texto: 'domingo, 22 de noviembre de 2026', puntos: 15, color: negro }, { texto: '10:00 AM', puntos: 17, color: negro }],
  [{ texto: 'Parroquia', puntos: 14, color: negro }],
];
for (const [nombre, titulo] of [
  ['corto', 'Pentecostés'],
  ['normal', 'I Vísperas de la Solemnidad de Jesucristo, Rey del Universo'],
  ['muy largo', 'Misa del día de la Solemnidad de San Pedro y San Pablo, Apóstoles, patronos de la parroquia y de la diócesis, en el aniversario de su dedicación'],
] as const) {
  const ANCHO = 180, ALTO = 170;
  const l = repartirPortada(bloques(titulo), medir, ANCHO, ALTO);
  const primera = l[0].y, ultima = l[l.length - 1].y;
  check(`${nombre}: no se sale a lo ancho`, l.every((x) => medir(x.texto, x.puntos) <= ANCHO), true);
  check(`${nombre}: no se sale a lo alto`, primera > 0 && ultima < ALTO, true);
  check(`${nombre}: aprovecha más de la mitad del alto`, ultima - primera > ALTO * 0.5, true);
  check(`${nombre}: la línea vacía no se dibuja`, l.every((x) => x.texto !== ''), true);
}
const parejo = repartirPortada(bloques('I Vísperas de la Solemnidad de Jesucristo, Rey del Universo'), medir, 180, 170)
  .filter((x) => x.negrita);
check('sin palabra suelta en el último renglón', parejo[parejo.length - 1].texto.includes(' '), true);

console.log(`\n${pass} ok, ${fail} con fallas`);
if (fail) process.exit(1);

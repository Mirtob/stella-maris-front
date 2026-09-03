/**
 * La partitura que le toca a cada uno en un canto A DOS VOCES (src/utils/sheetParts.ts).
 *
 * Reportado el 3-sep-2026 por el organista: en el Modo Atril, los cantos a dos voces le
 * mostraban LAS DOS líneas apiladas en vez de la que necesita.
 *
 * La causa estaba en cómo se llaman las partes de verdad. El repertorio a dos voces no
 * usa SATB: 19 de los 20 cantos rotulan sus partes "Mujeres" y "Hombres". El respaldo
 * del organista apuntaba solo a "soprano", que en esos cantos NO EXISTE, así que caía al
 * full score. Y no era solo el organista: con esos rótulos ningún cantor recibía su
 * parte tampoco.
 *
 * Lo que fijan estas pruebas: en un canto a dos voces cada uno recibe SU línea, y el
 * organista la de la melodía; y nada de esto altera las obras a cuatro voces.
 */
import { sheetForPart, hasPartSheet, effectiveVoicePart, detectSheets, FULL_SCORE } from '../../src/utils/sheetParts';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
const hojas = (...partes: string[]) => partes.map((p, i) => ({ part: p, fileId: `id${i}`, fileName: `x-${p}.pdf` }));
const ve = (sheets: any[], voz?: string) => sheetForPart(sheets, voz)?.part;

// Los tres repertorios reales, tal como están hoy en Drive.
const dosVoces = hojas(FULL_SCORE, 'Hombres', 'Mujeres');
const satb = hojas(FULL_SCORE, 'Soprano', 'Alto', 'Tenor', 'Bajo');
const numeradas = hojas(FULL_SCORE, 'Voz 1', 'Voz 2');

console.log('\n== El caso reportado: el organista en un canto a dos voces ==');
check('recibe la línea de mujeres, no las dos', ve(dosVoces, 'Órgano'), 'Mujeres');
check('y no el full score', ve(dosVoces, 'Órgano') === FULL_SCORE, false);
// Quien nunca tocó Ajustes pero registró el órgano como instrumento cuenta igual.
check('aunque no haya elegido voz en su perfil',
  ve(dosVoces, effectiveVoicePart(undefined, 'organo')), 'Mujeres');
check('el pianista, lo mismo', ve(dosVoces, 'Piano'), 'Mujeres');
check('cuenta como partitura propia, no general', hasPartSheet(dosVoces, 'Órgano'), true);

console.log('\n== Y los cantores también reciben la suya ==');
check('soprano → Mujeres', ve(dosVoces, 'Soprano'), 'Mujeres');
check('alto → Mujeres', ve(dosVoces, 'Alto'), 'Mujeres');
check('contralto (mismo sinónimo) → Mujeres', ve(dosVoces, 'Contralto'), 'Mujeres');
check('tenor → Hombres', ve(dosVoces, 'Tenor'), 'Hombres');
check('bajo → Hombres', ve(dosVoces, 'Bajo'), 'Hombres');
check('barítono (sinónimo de bajo) → Hombres', ve(dosVoces, 'Barítono'), 'Hombres');

console.log('\n== Las obras a cuatro voces siguen igual que siempre ==');
// Esto es lo que no se puede romper: "Mujeres" no es sinónimo de "Soprano", porque en
// una obra SATB conviven Soprano y Alto y la equivalencia sería falsa.
check('soprano → Soprano', ve(satb, 'Soprano'), 'Soprano');
check('alto → Alto', ve(satb, 'Alto'), 'Alto');
check('tenor → Tenor', ve(satb, 'Tenor'), 'Tenor');
check('bajo → Bajo', ve(satb, 'Bajo'), 'Bajo');
check('el organista sigue leyendo la melodía', ve(satb, 'Órgano'), 'Soprano');
check('si la obra trae parte de órgano, manda esa',
  ve(hojas(FULL_SCORE, 'Soprano', 'Alto', 'Tenor', 'Bajo', 'Organo'), 'Órgano'), 'Organo');

console.log('\n== Al revés: quien tenga puesto "Mujeres" u "Hombres" ==');
check('en un canto a dos voces, su línea', ve(dosVoces, 'Mujeres'), 'Mujeres');
check('en una obra a cuatro voces, la de arriba de su cuerda', ve(satb, 'Mujeres'), 'Soprano');
check('hombres → Tenor', ve(satb, 'Hombres'), 'Tenor');

console.log('\n== "Voz 1" / "Voz 2": la de arriba es la melodía ==');
// Comprobado sobre la partitura general de "A ti oh Dios": el rótulo "Voz 1" está en el
// pentagrama superior de cada sistema (y=150 frente a y=213).
check('el organista lee la de arriba', ve(numeradas, 'Órgano'), 'Voz 1');
// A los cantores no se les reparte: en este rótulo la división no dice qué cuerda es
// cada una, y es preferible la partitura general que darles la línea equivocada.
check('a los cantores no se les adivina', ve(numeradas, 'Tenor'), FULL_SCORE);

console.log('\n== Cantos sin voces separadas: no se cambia nada ==');
const unSoloPdf = hojas(FULL_SCORE);
check('un solo PDF, todos la general', ve(unSoloPdf, 'Órgano'), FULL_SCORE);
// Ojo: aquí el full score TRAE el acompañamiento, que es justo lo que el organista
// necesita. No se le manda a la línea de canto.
check('con una única "Voz", el organista sigue en la general',
  ve(hojas(FULL_SCORE, 'Voz'), 'Órgano'), FULL_SCORE);
check('quien no tiene voz asignada, la general', ve(dosVoces, undefined), FULL_SCORE);

console.log('\n== El orden en que se listan las partes ==');
// La voz aguda primero, como se apilan los pentagramas: antes "Hombres" salía delante
// de "Mujeres" por orden alfabético.
const detectadas = detectSheets([
  { id: '1', name: 'Canto-Hombres.pdf' },
  { id: '2', name: 'Canto-Mujeres.pdf' },
  { id: '3', name: 'Canto.pdf' },
]);
check('general, mujeres, hombres', detectadas.map(d => d.part), [FULL_SCORE, 'Mujeres', 'Hombres']);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

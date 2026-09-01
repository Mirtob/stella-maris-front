/**
 * Audios de ensayo del Modo Atril (mezclador de voces).
 *
 * MuseScore deja en la carpeta de Drive de cada obra un MP3 POR VOZ, con la misma
 * convención de nombres que ya usan los PDF. Verificado sobre el Drive real el
 * 1-sep-2026: de 75 obras, 42 los tienen; cada archivo trae esa voz sola (medida la
 * energía: una voz suena ~54 % del tiempo, la mezcla 76 %), todas duran lo mismo y
 * arrancan a la vez, así que sumadas dan la obra completa.
 *
 * Lo que se fija aquí es que la deducción de voces —la misma función que las
 * partituras— siga funcionando sobre los nombres REALES de los MP3. Si alguien la
 * cambia pensando solo en los PDF, el mezclador se queda sin voces y no hay ningún
 * error que lo delate: simplemente no aparece el botón.
 */
import { detectSheets, FULL_SCORE } from '../../src/utils/sheetParts';
import { tieneMezclador, pesoTotal, formatearPeso, MEZCLA, type AudioTrack } from '../../src/services/songAudio';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

/** Archivos tal cual están hoy en Drive. */
const archivos = (nombres: string[]) => nombres.map((n, i) => ({ id: `id${i}`, name: n }));
const partes = (nombres: string[]) => detectSheets(archivos(nombres), 'mp3').map(s => s.part);

console.log('\n== Las voces salen del nombre del MP3, igual que del PDF ==');
check('SATB completo (Como al ciervo)', partes([
  'Como al ciervo que a las fuentes-Bajo.mp3',
  'Como al ciervo que a las fuentes-Tenor.mp3',
  'Como al ciervo que a las fuentes-Alto.mp3',
  'Como al ciervo que a las fuentes-Soprano.mp3',
  'Como al ciervo que a las fuentes.mp3',
]), [FULL_SCORE, 'Soprano', 'Alto', 'Tenor', 'Bajo']);

// Nombre con paréntesis y un espacio antes del guion: así está en Drive de verdad.
check('nombre con paréntesis (Panis angelicus)', partes([
  'Panis angelicus (Lambillote) -Bajo.mp3',
  'Panis angelicus (Lambillote) -Soprano.mp3',
  'Panis angelicus (Lambillote) .mp3',
]), [FULL_SCORE, 'Soprano', 'Bajo']);

check('voces que no son SATB (Hombres/Mujeres)', partes([
  'Oh Maria, madre mia-Hombres.mp3',
  'Oh Maria, madre mia-Mujeres.mp3',
]), ['Hombres', 'Mujeres']);

console.log('\n== Los PDF de la misma carpeta no se cuelan como pistas ==');
// La carpeta trae PDF, .mscz y .mp3 mezclados: filtrar por extensión es lo que separa
// las partituras de los audios.
check('solo los MP3', partes([
  'Obra.pdf', 'Obra-Soprano.pdf', 'Obra.mscz',
  'Obra-Soprano.mp3', 'Obra-Bajo.mp3',
]), ['Soprano', 'Bajo']);
check('una carpeta sin audios no da pistas', partes(['Obra.pdf', 'Obra-Soprano.pdf']), []);

console.log('\n== Cuándo se ofrece el mezclador ==');
const pista = (part: string, size = 600_000): AudioTrack =>
  ({ part, fileId: part, fileName: `${part}.mp3`, size, url: '' });
// Con una sola voz no hay nada que mezclar: el botón no debe aparecer.
check('cuatro voces: sí', tieneMezclador([pista('Soprano'), pista('Alto'), pista('Tenor'), pista('Bajo')]), true);
check('dos voces: sí', tieneMezclador([pista('Hombres'), pista('Mujeres')]), true);
check('una voz sola: no', tieneMezclador([pista('Voz')]), false);
check('solo la mezcla: no', tieneMezclador([pista(MEZCLA)]), false);
check('una voz + la mezcla: no', tieneMezclador([pista(MEZCLA), pista('Voz')]), false);
check('sin pistas: no', tieneMezclador([]), false);

console.log('\n== Decir cuánto se va a descargar ANTES de descargarlo ==');
// Es la razón de que el mezclador no cargue solo: son megas, y a menudo con datos
// móviles dentro de una iglesia.
check('suma de las pistas', pesoTotal([pista('Soprano', 591_829), pista('Bajo', 591_829)]), 1_183_658);
check('formato en MB', formatearPeso(2_959_145), '2.8 MB');
check('formato en KB si es chico', formatearPeso(305_152), '298 KB');
check('sin datos', formatearPeso(0), '—');

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);

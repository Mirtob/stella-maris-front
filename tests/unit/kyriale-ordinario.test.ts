/**
 * El ordinario en gregoriano (src/data/kyrialeIndex + utils/kyrialeSong).
 *
 * La regla que se fija aquí, y que es el motivo de que exista este módulo: al elegir una
 * Misa del Kyriale, el SANTO y el CORDERO son los de esa Misa, siempre. Cada Misa del
 * Kyriale es una sola melodía; mezclar el Santo de una con el Kyrie de otra suena a dos
 * Misas pegadas. El GLORIA es la excepción, porque en la práctica se cambia: hay Misas
 * que no lo traen (en ferias, Adviento y Cuaresma no se canta) y se toma de otra.
 *
 * Y, como el salmo y los propios, estos cantos se derivan de la fecha: llevan la fecha en
 * el id para que al editar un cantoral no se arrastre el ordinario del domingo viejo.
 */
import {
  misasDelKyriale, misasConGloria, misaDelKyriale, kyrialeImageUrl,
  parteKyrialeDe, CATEGORIAS_DEL_KYRIALE, fuenteKyriale,
} from '../../src/data/kyrialeIndex';
import {
  buildKyrialeSongs, isKyrialeSong, misaDelCantoral, gloriaDelCantoral,
  buildPaterNosterSong, paterNosterDelCantoral,
} from '../../src/utils/kyrialeSong';
import { tonosDelPaterNoster } from '../../src/data/kyrialeIndex';
import { songsForBuilder } from '../../src/utils/psalmSong';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const FECHA = '2026-09-20';
const ORBIS = { libro: 'romanum' as const, numero: 'XI' };
const ANGELIS = { libro: 'romanum' as const, numero: 'VIII' };
const FERIAS = { libro: 'romanum' as const, numero: 'XVI' };   // no lleva Gloria

// ── El catálogo ────────────────────────────────────────────────────────────
check('están las 18 del Romanum y las 5 del Simplex',
  misasDelKyriale().length, 23);
check('la XI es Orbis factor', misaDelKyriale('romanum', 'XI')?.nombre, 'Orbis factor');
check('y el libro dice para qué es',
  misaDelKyriale('romanum', 'XI')?.uso, 'Domingos del Tiempo Ordinario');
check('la VIII es De Angelis', misaDelKyriale('romanum', 'VIII')?.nombre, 'De Angelis');
check('una Misa que no existe no se inventa', misaDelKyriale('romanum', 'XXV'), null);

check('las cuatro partes del ordinario',
  CATEGORIAS_DEL_KYRIALE, ['Kyrie', 'Gloria', 'Santo', 'Cordero de Dios']);
check('el Santo de la app es el sanctus del libro', parteKyrialeDe('Santo'), 'sanctus');
check('el Cordero es el agnus', parteKyrialeDe('Cordero de Dios'), 'agnus');
check('la Entrada no es parte del ordinario', parteKyrialeDe('Entrada'), null);

check('la imagen vive donde la deja el importador',
  kyrialeImageUrl('romanum', 'XI', 'kyrie'), '/kyriale/romanum/XI/kyrie.webp');
check('el pie dice libro, Misa y página',
  fuenteKyriale(misaDelKyriale('romanum', 'XI')!),
  'Graduale Romanum · Misa XI · Orbis factor · p. 738');

// En ferias, Adviento y Cuaresma no se canta el Gloria, y el libro no lo trae.
check('la XVI no trae Gloria',
  misaDelKyriale('romanum', 'XVI')?.partes.includes('gloria'), false);
check('sí trae Kyrie, Santo y Cordero',
  misaDelKyriale('romanum', 'XVI')?.partes, ['kyrie', 'sanctus', 'agnus']);
check('las que sirven para prestar el Gloria son menos que el total',
  misasConGloria().length < misasDelKyriale().length, true);
check('y todas traen Gloria',
  misasConGloria().every((m) => m.partes.includes('gloria')), true);

// ── Los cantos que viajan al cantoral ──────────────────────────────────────
const cantos = buildKyrialeSongs(FECHA, ORBIS);
check('salen las cuatro partes de una sola elección', cantos.length, 4);
check('y cada una en su parte de la Misa',
  cantos.map((s) => s.category).sort(),
  ['Cordero de Dios', 'Gloria', 'Kyrie', 'Santo']);
check('todas de la misma Misa',
  [...new Set(cantos.map((s) => s.massName))], ['Gregoriana XI · Orbis factor']);
check('el Kyrie lleva su partitura',
  cantos.find((s) => s.category === 'Kyrie')?.gradualeImage,
  '/kyriale/romanum/XI/kyrie.webp');
check('el id lleva la fecha, para no arrastrarlo al editar',
  cantos.find((s) => s.category === 'Kyrie')?.id, 'kyriale-kyrie-2026-09-20');
check('sin Misa elegida no viaja nada', buildKyrialeSongs(FECHA, null), []);

// ── La regla: sólo el Gloria se puede cambiar ──────────────────────────────
const mezclado = buildKyrialeSongs(FECHA, ORBIS, ANGELIS);
check('el Gloria puede venir de otra Misa',
  mezclado.find((s) => s.category === 'Gloria')?.gradualeImage,
  '/kyriale/romanum/VIII/gloria.webp');
check('pero el Santo sigue siendo el de la Misa del Kyrie',
  mezclado.find((s) => s.category === 'Santo')?.gradualeImage,
  '/kyriale/romanum/XI/sanctus.webp');
check('y el Cordero también',
  mezclado.find((s) => s.category === 'Cordero de Dios')?.gradualeImage,
  '/kyriale/romanum/XI/agnus.webp');

// Una Misa sin Gloria da tres partes; con uno prestado, cuatro.
check('la XVI sola da tres partes', buildKyrialeSongs(FECHA, FERIAS).length, 3);
check('con el Gloria de otra, cuatro',
  buildKyrialeSongs(FECHA, FERIAS, ORBIS).length, 4);
check('y ese Gloria es el prestado',
  buildKyrialeSongs(FECHA, FERIAS, ORBIS).find((s) => s.category === 'Gloria')?.gradualeImage,
  '/kyriale/romanum/XI/gloria.webp');

// ── Reponerlo al editar un cantoral publicado ──────────────────────────────
check('se reconoce como canto del ordinario gregoriano', isKyrialeSong(cantos[0]), true);
check('un canto del catálogo no', isKyrialeSong({ id: '42' }), false);
check('se recupera la Misa del Kyrie', misaDelCantoral(mezclado, FECHA), ORBIS);
check('y el Gloria prestado, por su cuenta', gloriaDelCantoral(mezclado, FECHA), ANGELIS);
check('otra fecha no cuenta', misaDelCantoral(mezclado, '2026-09-27'), null);

// El ordinario se deriva de la elección, así que sale del borrador al editar: si
// viajara en la copia, el constructor publicaría el del domingo viejo.
check('no vuelve al borrador al editar',
  songsForBuilder([...cantos, { id: 'c1', category: 'Entrada' } as any]).map((s) => s.id),
  ['c1']);

// ── El Padre Nuestro, aparte ───────────────────────────────────────────────
// No pertenece a ninguna Misa del Kyriale: el libro lo pone en el rito de comunión y
// ofrece tres tonos que sirven con cualquiera. Por eso se puede cantar solo, sin
// ordinario gregoriano, que es lo que hacen muchas parroquias.
check('el libro trae tres tonos', tonosDelPaterNoster('romanum').length, 3);
const pater = buildPaterNosterSong(FECHA, 'romanum', 'B');
check('va en su parte', pater?.category, 'Padre Nuestro');
check('con su partitura', pater?.gradualeImage, '/kyriale/romanum/pater/B.webp');
check('sin tono no viaja', buildPaterNosterSong(FECHA, 'romanum', null), null);
check('un tono que no existe tampoco', buildPaterNosterSong(FECHA, 'romanum', 'Z'), null);
check('se puede cantar sin ordinario gregoriano',
  buildKyrialeSongs(FECHA, null).length === 0 && pater !== null, true);
check('se recupera el tono al editar',
  paterNosterDelCantoral([pater!], FECHA), { libro: 'romanum', tono: 'B' });
check('y sale del borrador como los demás',
  songsForBuilder([pater!, { id: 'c1', category: 'Entrada' } as any]).map((s) => s.id),
  ['c1']);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail) process.exit(1);

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
  credosDelKyriale, piezasAdLibitum, todosLosTonosDelPaterNoster,
  clavePaterNoster, desdeClavePaterNoster,
} from '../../src/data/kyrialeIndex';
import {
  buildKyrialeSongs, isKyrialeSong, misaDelCantoral, gloriaDelCantoral,
  buildPaterNosterSong, paterNosterDelCantoral, adLibitumDelCantoral,
  buildCredoSong, credoDelCantoral,
} from '../../src/utils/kyrialeSong';
import { marcarPartituras, tituloVisible } from '../../src/utils/ordinary';
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
  'Graduale Romanum · Misa XI, Orbis factor · p. 738');

// 18-oct-2026: el combo dice «Misa VIII, De Angelis», con número romano y nombre.
check('rótulo: número romano y nombre', misaDelKyriale('romanum', 'VIII')?.rotulo,
  'Misa VIII, De Angelis');
check('la I es Lux et origo', misaDelKyriale('romanum', 'I')?.rotulo, 'Misa I, Lux et origo');
check('sin nombre, sólo el número', misaDelKyriale('romanum', 'XVI')?.rotulo, 'Misa XVI');
check('las del Simplex dicen de qué libro son',
  misaDelKyriale('simplex', 'I')?.rotulo, 'Misa I del Simplex');
check('todas las Misas del Romanum, de la I a la XVIII',
  misasDelKyriale().filter((m) => m.libro === 'romanum').map((m) => m.numero),
  ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII',
   'XIV', 'XV', 'XVI', 'XVII', 'XVIII']);

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
  [...new Set(cantos.map((s) => s.massName))], ['Misa XI, Orbis factor (gregoriana)']);
check('el Kyrie lleva su partitura',
  cantos.find((s) => s.category === 'Kyrie')?.gradualeImage,
  '/kyriale/romanum/XI/kyrie.webp');
check('el id lleva la fecha, para no arrastrarlo al editar',
  cantos.find((s) => s.category === 'Kyrie')?.id, 'kyriale-kyrie-2026-09-20');
check('sin Misa elegida no viaja nada', buildKyrialeSongs(FECHA, null), []);
// 30-sep-2026: en Pascua, con el Rito de Aspersión se omite el Kyrie; la Misa gregoriana
// sigue aportando el Gloria, el Santo y el Cordero.
check('con aspersión, la Misa va sin Kyrie',
  buildKyrialeSongs(FECHA, ORBIS, null, true).map((s) => s.category).includes('Kyrie'), false);
check('con aspersión, el resto de la Misa sigue',
  buildKyrialeSongs(FECHA, ORBIS, null, true).length, cantos.length - 1);

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

// ── Kyries y demás ad libitum ──────────────────────────────────────────────
check('once Kyries ad libitum', piezasAdLibitum('kyrie').length, 11);
check('cuatro Glorias, tres Sanctus',
  [piezasAdLibitum('gloria').length, piezasAdLibitum('sanctus').length], [4, 3]);
check('rótulo del ad libitum', piezasAdLibitum('kyrie')[0].rotulo, 'Kyrie I ad libitum, Clemens rector');
const KYRIE_IV = { libro: 'romanum' as const, numero: 'IV', adLibitum: true };
const conSuelto = buildKyrialeSongs(FECHA, ANGELIS, { kyrie: KYRIE_IV });
check('el Kyrie ad libitum reemplaza al de la Misa',
  conSuelto.find((s) => s.category === 'Kyrie')?.gradualeImage,
  '/kyriale/romanum/ad-libitum/kyrie/IV.webp');
check('y el Santo sigue siendo el de la Misa',
  conSuelto.find((s) => s.category === 'Santo')?.gradualeImage,
  '/kyriale/romanum/VIII/sanctus.webp');
check('el Kyrie de OTRA Misa no se acepta (la regla sigue)',
  buildKyrialeSongs(FECHA, ANGELIS, { kyrie: ORBIS })
    .find((s) => s.category === 'Kyrie')?.gradualeImage,
  '/kyriale/romanum/VIII/kyrie.webp');
check('al editar, la Misa se lee aunque el Kyrie sea ad libitum',
  misaDelCantoral(conSuelto, FECHA), ANGELIS);
check('y el Kyrie ad libitum se repone', adLibitumDelCantoral(conSuelto, FECHA), { kyrie: KYRIE_IV });
check('un Gloria ad libitum también vale',
  buildKyrialeSongs(FECHA, FERIAS, { gloria: { libro: 'romanum', numero: 'IV', adLibitum: true } })
    .find((s) => s.category === 'Gloria')?.gradualeImage,
  '/kyriale/romanum/ad-libitum/gloria/IV.webp');

// ── El Credo ───────────────────────────────────────────────────────────────
check('seis Credos del Romanum y cuatro del Simplex', credosDelKyriale().length, 10);
const credo = buildCredoSong(FECHA, { libro: 'romanum', numero: 'III' });
check('el Credo va en su parte', credo?.category, 'Credo');
check('con su partitura', credo?.gradualeImage, '/kyriale/romanum/credo/III.webp');
check('se repone al editar', credoDelCantoral([credo!], FECHA), { libro: 'romanum', numero: 'III' });
check('un Credo que no existe no viaja',
  buildCredoSong(FECHA, { libro: 'romanum', numero: 'IX' }), null);
check('solo letra: el Credo gregoriano lleva el texto latino entero',
  marcarPartituras([credo!], { misa: false, gregoriano: false, padreNuestro: false })[0].lyrics
    ?.includes('vitam venturi saeculi'), true);
check('con partitura no se le pone letra',
  marcarPartituras([credo!], { misa: false, gregoriano: true, padreNuestro: false })[0].folletoSoloLetra,
  undefined);

// ── Los tonos del Simplex ──────────────────────────────────────────────────
check('tres tonos por libro', todosLosTonosDelPaterNoster().length, 6);
check('la clave del Romanum es la de siempre', clavePaterNoster('romanum', 'A'), 'A');
check('la del Simplex lleva el libro', clavePaterNoster('simplex', 'B'), 'simplex:B');
check('y se lee de vuelta', desdeClavePaterNoster('simplex:B'), { libro: 'simplex', tono: 'B' });
check('una clave vieja es del Romanum', desdeClavePaterNoster('C'), { libro: 'romanum', tono: 'C' });
const paterS = buildPaterNosterSong(FECHA, 'simplex', 'A');
check('el tono del Simplex tiene partitura', paterS?.gradualeImage, '/kyriale/simplex/pater/A.webp');
check('y se repone con su libro',
  paterNosterDelCantoral([paterS!], FECHA), { libro: 'simplex', tono: 'A' });

// ── El subtítulo dice de qué Misa es (19-oct-2026) ─────────────────────────
const angelis = buildKyrialeSongs(FECHA, ANGELIS);
check('«Kyrie de la Misa VIII, De Angelis», no «Kyrie gregoriano»',
  angelis.find((s) => s.category === 'Kyrie')?.title, 'Kyrie de la Misa VIII, De Angelis');
check('las partes van en latín',
  angelis.map((s) => s.title.split(' de la ')[0]).sort(), ['Agnus Dei', 'Gloria', 'Kyrie', 'Sanctus']);
check('el ad libitum dice qué pieza es', conSuelto.find((s) => s.category === 'Kyrie')?.title,
  piezasAdLibitum('kyrie').find((p) => p.numero === 'IV')?.rotulo);
check('el Credo, su número', credo?.title, 'Credo III');
const viejo = { ...angelis.find((s) => s.category === 'Santo')!, title: 'Santo gregoriano' };
check('un cantoral publicado antes muestra igual la Misa',
  tituloVisible(viejo).title, 'Sanctus de la Misa VIII, De Angelis');
check('un canto del catálogo sigue con su título',
  tituloVisible({ id: 'abc', title: 'Santo de Palazón', category: 'Santo' }).title, 'Santo de Palazón');

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail) process.exit(1);

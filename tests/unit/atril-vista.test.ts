/**
 * Selector Partitura / Acordes del Modo Atril (utils/atrilModo · vista).
 *
 * Pedido del 23-oct-2026: cambiar al vuelo entre la partitura y la letra con acordes.
 * Lo elegido manda mientras el canto tenga con qué; si no, se muestra lo otro.
 */
import { modoDelAtril, vistaPorDefecto } from '../../src/utils/atrilModo';
import type { Song } from '../../src/types';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    esperado: ${JSON.stringify(expected)}\n    obtenido: ${JSON.stringify(actual)}`}`);
}

const canto = (extra: Partial<Song>) => ({ id: 'x', title: 'Canto', category: 'Entrada', ...extra }) as Song;
const ambos = canto({ lyrics: '[Do]Alabad al Señor', sheetMusicUrl: 'https://drive.google.com/file/d/abc/view' });
const soloLetra = canto({ lyrics: '[Do]Alabad al Señor' });
const soloPartitura = canto({ sheetMusicUrl: 'https://drive.google.com/file/d/abc/view' });

const organista = { puebloFiel: false, organo: true };
const guitarrista = { puebloFiel: false, organo: false };

check('el organista abre en partitura', vistaPorDefecto(organista), 'score');
check('el guitarrista abre en acordes', vistaPorDefecto(guitarrista), 'chords');
check('quien tiene voz abre en partitura', vistaPorDefecto({ ...guitarrista, voicePart: 'Soprano' }), 'score');

check('sin elegir, todo sigue como antes (órgano)', modoDelAtril(ambos, organista), 'score');
check('sin elegir, todo sigue como antes (guitarra)', modoDelAtril(ambos, guitarrista), 'chords');

check('el organista pasa a acordes', modoDelAtril(ambos, { ...organista, vista: 'chords' }), 'chords');
check('el guitarrista pasa a partitura', modoDelAtril(ambos, { ...guitarrista, vista: 'score' }), 'score');

check('pide partitura y no hay: acordes', modoDelAtril(soloLetra, { ...guitarrista, vista: 'score' }), 'chords');
check('pide acordes y no hay letra: partitura', modoDelAtril(soloPartitura, { ...organista, vista: 'chords' }), 'score');

check('el Pueblo fiel no cambia con el selector',
  modoDelAtril(ambos, { puebloFiel: true, organo: false, vista: 'score' }), 'lyrics');

console.log(`\n${pass} ok, ${fail} con error`);
if (fail > 0) process.exit(1);

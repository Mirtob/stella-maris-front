/**
 * El Kyriale en el Banco de Partituras (utils/kyrialeSong · kyrialeDelBanco).
 *
 * Pedido del 20-oct-2026: el gregoriano sólo se veía al elegirlo en el constructor; el
 * banco ahora trae el libro entero (Misas, Credos, ad libitum y Pater noster).
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { kyrialeDelBanco } from '../../src/utils/kyrialeSong';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    esperado: ${JSON.stringify(expected)}\n    obtenido: ${JSON.stringify(actual)}`}`);
}

const grupos = kyrialeDelBanco();
const todas = grupos.flatMap((g) => g.entradas);

check('los cinco grupos del libro', grupos.map((g) => g.id), ['romanum', 'simplex', 'credos', 'ad-libitum', 'pater']);
check('ninguno vacío', grupos.every((g) => g.entradas.length > 0), true);
check('las 18 Misas del Romanum', grupos[0].entradas.length, 18);

const viii = grupos[0].entradas.find((e) => e.titulo.startsWith('Misa VIII'))!;
check('la Misa VIII va entera y en el orden en que se canta',
  viii.cantos.map((c) => c.category), ['Kyrie', 'Gloria', 'Santo', 'Cordero de Dios']);
check('con el título de su Misa', viii.cantos[0].title, 'Kyrie de la Misa VIII, De Angelis');

const ids = todas.flatMap((e) => e.cantos.map((c) => String(c.id)));
check('claves únicas', new Set(ids).size, ids.length);
const sinImagen = todas.flatMap((e) => e.cantos)
  .filter((c) => !existsSync(join('public', c.gradualeImage!))).map((c) => c.gradualeImage);
check('cada pieza tiene su imagen en public/', sinImagen, []);

console.log(`\n${pass} ok, ${fail} con error`);
if (fail > 0) process.exit(1);

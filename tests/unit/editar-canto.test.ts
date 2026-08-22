/**
 * Guardar la edición de un canto (src/utils/songUpdatePatch.ts).
 *
 * Regresión del fallo reportado el 22-ago-2026: se quitaba la partitura de un canto,
 * se guardaba, y la partitura seguía ahí. La causa era el payload: los campos vacíos
 * viajaban como `undefined`, y en `updateSong` eso significa "no toques la columna".
 * Vacío tiene que viajar como `null`.
 */
import { clearableText, songTextPatch, type ClearableSongText } from '../../src/utils/songUpdatePatch';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

/** Un canto cargado del todo: partitura, carpeta de voces, autor, tono, letra… */
const lleno: ClearableSongText = {
  author: 'Cesáreo Gabaráin',
  artist: 'Coro Stella Maris',
  driveFileId: '1AbCdEfGhIjKlMnOpQrStUvWxYz',
  driveFolderId: '1FolderXyz',
  duration: '3:45',
  originalKey: 'Sol',
  massName: 'Misa Nebreda',
  lyrics: 'Tú has venido a la orilla',
};
/** El mismo canto después de vaciar todo en el editor. */
const vacio: ClearableSongText = {
  author: '', artist: '', driveFileId: '', driveFolderId: '',
  duration: '', originalKey: '', massName: '', lyrics: '',
};

console.log('\n== Vaciar un campo lo BORRA (null), no lo deja intacto (undefined) ==');
const patch = songTextPatch(vacio);
for (const campo of Object.keys(patch) as (keyof typeof patch)[]) {
  check(`${campo} vacío → null`, patch[campo], null);
}
check('ningún campo se omite del payload',
  Object.keys(patch).sort(),
  ['artist', 'author', 'driveFileId', 'driveFolderId', 'duration', 'lyrics', 'massName', 'originalKey'].sort());
check('ninguno viaja como undefined',
  Object.values(patch).some(v => v === undefined), false);

console.log('\n== Quitar SOLO la partitura no toca lo demás ==');
const sinPartitura = songTextPatch({ ...lleno, driveFileId: '' });
check('la partitura se borra', sinPartitura.driveFileId, null);
check('la carpeta de voces sigue', sinPartitura.driveFolderId, '1FolderXyz');
check('el autor sigue', sinPartitura.author, 'Cesáreo Gabaráin');
check('la letra sigue', sinPartitura.lyrics, 'Tú has venido a la orilla');

console.log('\n== Lo que sí tiene contenido se guarda tal cual ==');
check('los valores se conservan', songTextPatch(lleno), {
  author: 'Cesáreo Gabaráin',
  artist: 'Coro Stella Maris',
  driveFileId: '1AbCdEfGhIjKlMnOpQrStUvWxYz',
  driveFolderId: '1FolderXyz',
  duration: '3:45',
  originalKey: 'Sol',
  massName: 'Misa Nebreda',
  lyrics: 'Tú has venido a la orilla',
});

console.log('\n== Espacios y saltos de línea ==');
check('un ID pegado con espacios se guarda limpio',
  clearableText('  1AbCdEf  '), '1AbCdEf');
check('solo espacios cuenta como vacío', clearableText('   '), null);
check('la letra conserva saltos y sangría',
  songTextPatch({ ...lleno, lyrics: '  Estribillo\n\n  Tú has venido\n' }).lyrics,
  '  Estribillo\n\n  Tú has venido\n');
check('una letra de puros saltos de línea se borra',
  songTextPatch({ ...lleno, lyrics: '\n\n   \n' }).lyrics, null);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

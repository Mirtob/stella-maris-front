import { Song } from '../../src/types';
import {
  pickSongVideo, pickVideoId, pickVideoUrl, hasAnyVideo, toVideoId, videoVersionLabel,
} from '../../src/utils/songVideo';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

// IDs de 11 caracteres, el formato que exige YouTube (y el CHECK de la BD).
const ORG = 'aaaaaaaaaaa';
const GTR = 'bbbbbbbbbbb';
const GEN = 'ccccccccccc';

const song = (v: Partial<Song>): Song =>
  ({ id: 'x', title: 'Canto', category: 'Entrada', duration: '', youtubeId: '', ...v }) as Song;

console.log('\n== Cada instrumento ve SU versión ==');
const ambas = song({ youtubeIdOrgano: ORG, youtubeIdGuitarra: GTR });
check('organista → video de órgano',    pickVideoId(ambas, 'Órgano'), ORG);
check('guitarrista → video de guitarra', pickVideoId(ambas, 'Guitarra'), GTR);
check('organista: no es respaldo',  pickSongVideo(ambas, 'Órgano')!.isFallback, false);
check('guitarrista: no es respaldo', pickSongVideo(ambas, 'Guitarra')!.isFallback, false);
check('versión rotulada = la del usuario', pickSongVideo(ambas, 'Guitarra')!.version, 'Guitarra');

console.log('\n== El video general manda cuando no hay versión propia ==');
// El catálogo actual: un solo video por canto en `youtube_id`. Nadie debe quedarse
// sin video por haber agregado la columna nueva.
const soloGeneral = song({ youtubeId: GEN });
check('organista → general',    pickVideoId(soloGeneral, 'Órgano'), GEN);
check('guitarrista → general',  pickVideoId(soloGeneral, 'Guitarra'), GEN);
check('sin instrumento → general', pickVideoId(soloGeneral, undefined), GEN);
check('general no se marca como respaldo', pickSongVideo(soloGeneral, 'Órgano')!.isFallback, false);

console.log('\n== La versión propia gana al general ==');
const mixto = song({ youtubeId: GEN, youtubeIdGuitarra: GTR });
check('guitarrista → su versión, no el general', pickVideoId(mixto, 'Guitarra'), GTR);
check('organista (sin la suya) → general',       pickVideoId(mixto, 'Órgano'), GEN);

console.log('\n== Falta tu versión y no hay general → la otra, avisando ==');
const soloOrgano = song({ youtubeIdOrgano: ORG });
check('guitarrista → video de órgano', pickVideoId(soloOrgano, 'Guitarra'), ORG);
check('guitarrista → marcado como respaldo', pickSongVideo(soloOrgano, 'Guitarra')!.isFallback, true);
check('rótulo dice qué versión suena', pickSongVideo(soloOrgano, 'Guitarra')!.version, 'Órgano');
check('el organista NO ve respaldo', pickSongVideo(soloOrgano, 'Órgano')!.isFallback, false);
// Sin instrumento (enlace compartido / demo) no existe "versión equivocada".
check('sin instrumento → no hay aviso', pickSongVideo(soloOrgano, undefined)!.isFallback, false);

console.log('\n== Cantos sin video ==');
const salmo = song({ youtubeId: '' }); // el salmo del libro no tiene video
check('sin video → null',   pickSongVideo(salmo, 'Órgano'), null);
check('sin video → id vacío', pickVideoId(salmo, 'Órgano'), '');
check('sin video → sin URL', pickVideoUrl(salmo, 'Órgano'), undefined);
check('hasAnyVideo(sin video)', hasAnyVideo(salmo), false);
check('hasAnyVideo(solo versión guitarra)', hasAnyVideo(song({ youtubeIdGuitarra: GTR })), true);

console.log('\n== IDs inválidos se ignoran (no rompen el player) ==');
// Un ID a medio pegar en la ficha del canto no debe dejar el iframe en blanco:
// se descarta y se usa el respaldo. Ojo con los datos de prueba: "no-es-un-id"
// tiene 11 caracteres válidos y SÍ es un ID bien formado para YouTube.
const idRoto = song({ youtubeIdGuitarra: 'corto', youtubeId: GEN });
check('id inválido → cae al general', pickVideoId(idRoto, 'Guitarra'), GEN);
check('solo id inválido → sin video', pickVideoId(song({ youtubeIdOrgano: 'xx' }), 'Órgano'), '');

console.log('\n== Pegar la URL completa (lo que hace el admin) ==');
check('watch?v=',        toVideoId('https://www.youtube.com/watch?v=aaaaaaaaaaa'), ORG);
check('watch con extras', toVideoId('https://www.youtube.com/watch?list=RD&v=aaaaaaaaaaa'), ORG);
check('youtu.be',        toVideoId('https://youtu.be/bbbbbbbbbbb'), GTR);
check('embed',           toVideoId('https://www.youtube-nocookie.com/embed/ccccccccccc'), GEN);
check('shorts',          toVideoId('https://youtube.com/shorts/aaaaaaaaaaa'), ORG);
check('ID pelado',       toVideoId(ORG), ORG);
check('con espacios',    toVideoId('  ' + GTR + '  '), GTR);
check('basura → vacío',  toVideoId('https://ejemplo.com/video'), '');
check('vacío → vacío',   toVideoId(''), '');
// El canto guarda la URL entera: pickSongVideo la normaliza igual.
check('URL guardada en la columna', pickVideoId(song({ youtubeIdOrgano: 'https://youtu.be/aaaaaaaaaaa' }), 'Órgano'), ORG);

console.log('\n== URL del enlace (PDF del coro) ==');
check('URL de la versión del coro', pickVideoUrl(ambas, 'Guitarra'), `https://www.youtube.com/watch?v=${GTR}`);

console.log('\n== Rótulos ==');
check('guitarra', videoVersionLabel('Guitarra'), '🎶 Versión Guitarra');
check('órgano',   videoVersionLabel('Órgano'),   '🎹 Versión Órgano');
check('general',  videoVersionLabel('General'),  '🎬 Versión única');

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallas\n`);

import { Song } from '../../src/types';
import {
  buildChannelInventory, instrumentCoverage, videosOutsideChannel, type ChannelVideo, type VideoLookup,
} from '../../src/utils/channelInventory';
import { pickSongVideo } from '../../src/utils/songVideo';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const ORG = 'organo00001';
const GTR = 'guitarra001';
const GEN = 'general0001';
const NUEVO = 'nuevo000001';   // subido al canal, sin canto en la app
const OCULTO = 'oculto00001';  // no listado
const BORRADO = 'borrado0001'; // YouTube no lo devuelve
const AJENO = 'ajeno000001';   // de otro canal
const CANAL = 'UCoficial';

const song = (id: string, v: Partial<Song>): Song =>
  ({ id, title: `Canto ${id}`, category: 'Entrada', duration: '', youtubeId: '', ...v }) as Song;

const songs = [
  song('ambas', { youtubeIdOrgano: ORG, youtubeIdGuitarra: GTR }),
  song('unica', { youtubeId: GEN }),
  song('soloOrgano', { youtubeIdOrgano: OCULTO }),
  song('roto', { youtubeIdGuitarra: BORRADO }),
  song('ajeno', { youtubeId: AJENO }),
  song('nada', {}),
];

console.log('\n== Una sola versión: se reproduce esa (o la única) ==');
check('solo órgano → guitarrista escucha órgano', pickSongVideo(songs[2], 'Guitarra')?.videoId, OCULTO);
check('…marcado como respaldo', pickSongVideo(songs[2], 'Guitarra')?.isFallback, true);
check('solo guitarra → organista escucha guitarra', pickSongVideo(songs[3], 'Órgano')?.videoId, BORRADO);
check('versión única → organista', pickSongVideo(songs[1], 'Órgano')?.version, 'General');
check('versión única → guitarrista', pickSongVideo(songs[1], 'Guitarra')?.version, 'General');

console.log('\n== Qué escucha cada instrumento ==');
check('organistas', instrumentCoverage(songs, 'Órgano'), { propia: 2, unica: 2, otra: 1, sinVideo: 1 });
check('guitarristas', instrumentCoverage(songs, 'Guitarra'), { propia: 2, unica: 2, otra: 1, sinVideo: 1 });

console.log('\n== Cruce canal ↔ app ==');
const canal: ChannelVideo[] = [
  { id: ORG, title: 'Entrada (órgano)', publishedAt: '2026-10-01' },
  { id: GTR, title: 'Entrada (guitarra)', publishedAt: '2026-10-02' },
  { id: GEN, title: 'Única', publishedAt: '2026-09-01' },
  { id: NUEVO, title: 'Recién subido', publishedAt: '2026-10-14' },
];
check('fuera del canal a consultar', videosOutsideChannel(songs, canal).sort(), [AJENO, BORRADO, OCULTO].sort());

const lookup = new Map<string, VideoLookup | null>([
  [OCULTO, { channelId: CANAL, privacyStatus: 'unlisted' }],
  [BORRADO, null],
  [AJENO, { channelId: 'UCotro', privacyStatus: 'public' }],
]);
const inv = buildChannelInventory(songs, canal, lookup, [CANAL]);
check('total del canal', inv.channelTotal, 4);
check('ya en la app', inv.linked.map((l) => l.video.id), [GTR, ORG, GEN]);
check('versión registrada', inv.linked.find((l) => l.video.id === ORG)?.uses[0].version, 'Órgano');
check('sin vincular', inv.unlinked.map((v) => v.id), [NUEVO]);
check('estados fuera del canal',
  inv.outside.map((o) => [o.videoId, o.status]),
  [[BORRADO, 'no-disponible'], [AJENO, 'otro-canal'], [OCULTO, 'no-listado']]);

console.log('\n== Video vinculado después de la lectura: sin verificar, no "borrado" ==');
const despues = [...songs, song('nuevoVinculo', { youtubeIdGuitarra: 'despues0001' })];
const inv2 = buildChannelInventory(despues, canal, lookup, [CANAL]);
check('queda sin verificar', inv2.outside.find((o) => o.videoId === 'despues0001')?.status, 'sin-verificar');

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail) process.exit(1);

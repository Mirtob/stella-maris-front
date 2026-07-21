import { isLent, displayCategoryForDate, isAlleluiaTitleInLent, getCurrentLiturgicalSeason } from '../../src/utils/liturgicalSeason';
import { songMatchesInstrument, filterByInstrument } from '../../src/utils/instrument';
import { categoryToMoment } from '../../src/utils/category';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
const d = (s: string) => { const [y, m, day] = s.split('-').map(Number); return new Date(y, m - 1, day); };

console.log('\n== Pascua se recalcula por año civil ==');
// Fechas de Pascua reales: 2024=31mar, 2025=20abr, 2026=5abr, 2027=28mar
// La Cuaresma termina el Viernes Santo: el Sábado Santo (Vigilia) YA NO es Cuaresma.
check('2026-04-03 (Viernes Santo) es Cuaresma', isLent(d('2026-04-03')), true);
check('2026-04-04 (Sábado Santo) NO es Cuaresma', isLent(d('2026-04-04')), false);
check('2026-04-05 (Pascua) NO es Cuaresma', isLent(d('2026-04-05')), false);
check('2025-04-18 (Viernes Santo) es Cuaresma', isLent(d('2025-04-18')), true);
check('2025-04-20 (Pascua) NO es Cuaresma', isLent(d('2025-04-20')), false);
check('2027-03-26 (Viernes Santo) es Cuaresma', isLent(d('2027-03-26')), true);
check('2027-03-28 (Pascua) NO es Cuaresma', isLent(d('2027-03-28')), false);
check('2026-02-18 (Miérc. Ceniza) es Cuaresma', isLent(d('2026-02-18')), true);
check('2026-02-17 (Martes Carnaval) NO', isLent(d('2026-02-17')), false);

console.log('\n== Rótulo de la tarjeta según la fecha de la MISA ==');
check('Cuaresma → Aclamación', displayCategoryForDate('Aleluya', d('2026-03-01')), 'Aclamación al Evangelio');
check('Hoy (21-jul, T.Ord.) → Aleluya', displayCategoryForDate('Aleluya', d('2026-07-21')), 'Aleluya');
check('Pascua → Aleluya', displayCategoryForDate('Aleluya', d('2026-04-12')), 'Aleluya');
check('Otras categorías no se tocan', displayCategoryForDate('Entrada', d('2026-03-01')), 'Entrada');

console.log('\n== El rótulo nuevo sigue apuntando al momento aleluya ==');
check("'Aclamación al Evangelio' → aleluya", categoryToMoment('Aclamación al Evangelio'), 'aleluya');
check("'Aleluya' → aleluya", categoryToMoment('Aleluya'), 'aleluya');

console.log('\n== Exclusión de Aleluyas por título en Cuaresma ==');
check('"Aleluya, Cristo vive" en Cuaresma → oculto', isAlleluiaTitleInLent('Aleluya, Cristo vive', d('2026-03-01')), true);
check('sin tilde/mayúsc "ALELUYA" → oculto', isAlleluiaTitleInLent('ALELUYA DE LA PALABRA', d('2026-03-01')), true);
check('"Alleluia" (latín) → oculto', isAlleluiaTitleInLent('Alleluia Cantate', d('2026-03-01')), true);
check('"Aleluya" FUERA de Cuaresma → visible', isAlleluiaTitleInLent('Aleluya, Cristo vive', d('2026-07-21')), false);
check('"Gloria a ti Señor" en Cuaresma → visible', isAlleluiaTitleInLent('Gloria a ti Señor', d('2026-03-01')), false);
// Clave: la Vigilia Pascual conserva su Aleluya Triple (Sábado Santo ya no es Cuaresma).
check('Aleluya Triple en la Vigilia → NO se oculta', isAlleluiaTitleInLent('Aleluya Triple', d('2026-04-04')), false);
// Red de seguridad: si el coro elige la celebración de la Vigilia pero deja una fecha
// de Cuaresma, la categoría 'Aleluya Triple' NO debe filtrarse igual. La excepción vive
// en CategorySearch (isEasterVigilAlleluia); aquí se fija la regla que la justifica.
check("'Aleluya Triple' → momento aleluya", categoryToMoment('Aleluya Triple'), 'aleluya');
check('con fecha de Cuaresma el título SÍ calificaría', isAlleluiaTitleInLent('Aleluya Triple', d('2026-03-30')), true);

console.log('\n== Instrumento: FORMATO REAL de la BD (minúscula, sin tilde) ==');
// La columna `instruments` guarda "organo"/"guitarra"/"coro"; InstrumentType usa
// "Órgano"/"Guitarra". Comparar en crudo daba 0 coincidencias en TODO el catálogo.
const sReal = (instruments: any) =>
  ({ id: 'x', title: 't', category: 'Entrada', youtubeId: '', duration: '', instruments }) as any;

check('["organo"] + Órgano → SÍ', songMatchesInstrument(sReal(['organo']), 'Órgano'), true);
check('["organo"] + Guitarra → NO', songMatchesInstrument(sReal(['organo']), 'Guitarra'), false);
check('["coro","guitarra","organo"] + Guitarra → SÍ', songMatchesInstrument(sReal(['coro', 'guitarra', 'organo']), 'Guitarra'), true);
check('["coro","guitarra","organo"] + Órgano → SÍ', songMatchesInstrument(sReal(['coro', 'guitarra', 'organo']), 'Órgano'), true);
check('["ÓRGANO"] (mayúsc. con tilde) + Órgano → SÍ', songMatchesInstrument(sReal(['ÓRGANO']), 'Órgano'), true);
check('[" Organo "] (espacios) + Órgano → SÍ', songMatchesInstrument(sReal([' Organo ']), 'Órgano'), true);

console.log('\n== Instrumento: los casos que estaban rotos ==');
const s = (id: string, title: string, instruments?: any, version?: any) =>
  ({ id, title, category: 'Entrada', youtubeId: '', duration: '', instruments, version }) as any;

check('["Coro","Guitarra","Órgano"] + Órgano → SÍ (antes NO)',
  songMatchesInstrument(s('1', 'a', ['Coro', 'Guitarra', 'Órgano']), 'Órgano'), true);
check('[] (= sirve para todos) + Órgano → SÍ (antes NO)',
  songMatchesInstrument(s('2', 'b', []), 'Órgano'), true);
check('sin campo instruments + Órgano → SÍ',
  songMatchesInstrument(s('3', 'c', undefined), 'Órgano'), true);
check('["Guitarra"] + Órgano → NO',
  songMatchesInstrument(s('4', 'd', ['Guitarra']), 'Órgano'), false);
check('["Órgano"] + Órgano → SÍ',
  songMatchesInstrument(s('5', 'e', ['Órgano']), 'Órgano'), true);
check('fallback a version cuando no hay array',
  songMatchesInstrument(s('6', 'f', undefined, 'Guitarra'), 'Órgano'), false);
check('sin instrumento elegido → todo sirve',
  songMatchesInstrument(s('7', 'g', ['Guitarra']), undefined), true);

console.log('\n== Filtro duro: solo el instrumento elegido ==');
// Valores en el formato REAL de la BD (minúscula, sin tilde).
const lista = [
  s('g1', 'Guitarra 1', ['guitarra']),
  s('o1', 'Organo 1', ['organo']),
  s('t1', 'Todos 1', []),
  s('g2', 'Ambos', ['coro', 'guitarra', 'organo']),
  s('o2', 'Coro y organo', ['coro', 'organo']),
];
check('con Guitarra', filterByInstrument(lista, 'Guitarra').map((x: any) => x.id), ['g1', 't1', 'g2']);
check('con Órgano', filterByInstrument(lista, 'Órgano').map((x: any) => x.id), ['o1', 't1', 'g2', 'o2']);
check('sin preferencia → intacto', filterByInstrument(lista, undefined).map((x: any) => x.id), ['g1', 'o1', 't1', 'g2', 'o2']);

// El catálogo tal como está hoy: los 21 cantos marcados solo ["organo"]. Un coro
// de guitarra debe ver CERO hasta que se publiquen esas versiones.
const soloOrgano = Array.from({ length: 21 }, (_, i) => s('c' + i, 'Canto ' + i, ['organo']));
check('catálogo solo-órgano + Guitarra → 0', filterByInstrument(soloOrgano, 'Guitarra').length, 0);
check('catálogo solo-órgano + Órgano → 21', filterByInstrument(soloOrgano, 'Órgano').length, 21);

console.log('\n== Tiempo litúrgico por fecha de la Misa ==');
check('2026-03-01 → Cuaresma', getCurrentLiturgicalSeason(d('2026-03-01')), 'Cuaresma');
check('2026-04-12 → Pascua', getCurrentLiturgicalSeason(d('2026-04-12')), 'Pascua');
check('2026-07-21 → Tiempo Ordinario', getCurrentLiturgicalSeason(d('2026-07-21')), 'Tiempo Ordinario');
check('2026-12-25 → Navidad', getCurrentLiturgicalSeason(d('2026-12-25')), 'Navidad');

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallas\n`);

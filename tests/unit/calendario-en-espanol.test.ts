/**
 * Los nombres del calendario litúrgico van siempre en español (pedido del 2-nov-2026).
 *
 * romcal solo trae los nombres en inglés y el generador los traduce por `key`. Una
 * celebración sin traducción salía tal cual: el cantoral de los Fieles Difuntos se
 * publicó como «All Souls», y el aviso del cron decía «Dedication of the Lateran
 * Basilica». Ahora el generador se corta, y esto revisa lo que quedó en los datos.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import generated from '../../src/data/liturgicalCalendar.generated.json';
import { getLiturgicalInfoForDate } from '../../src/utils/liturgicalCalendar';
import { resolvePsalm } from '../../src/data/psalmIndex';

// Palabras que en un nombre de celebración solo pueden venir del inglés.
const INGLES = /\b(the|of|and|Saint|Saints|Souls|Apostle|Apostles|Martyrs?|Blessed|Holy|Lord|Sunday|Birth|Chair|Heart|Religious|Deacon|Evangelist|Archangels|Visitation|Conversion|Dedication|Exaltation)\b/;

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
const checkTrue = (name: string, v: boolean) => check(name, v, true);

console.log('\n=== Calendario litúrgico en español ===\n');

check('ninguna celebración generada queda en inglés',
  (generated as { date: string; name: string }[])
    .filter((e) => INGLES.test(e.name)).map((e) => `${e.date} ${e.name}`), []);

const fuente = readFileSync(join(process.cwd(), 'api', 'cron', 'celebration-reminders.ts'), 'utf8');
const nombres = [...fuente.matchAll(/name: "([^"]*)"/g)].map((m) => m[1]);
checkTrue('el cron trae su calendario', nombres.length > 100);
check('el calendario del cron de avisos tampoco', nombres.filter((n) => INGLES.test(n)), []);

check('Fieles Difuntos en español', getLiturgicalInfoForDate('2026-11-02')?.name,
  'Conmemoración de Todos los Fieles Difuntos');
checkTrue('Fieles Difuntos encuentra su salmo', resolvePsalm('B', 'Conmemoración de Todos los Fieles Difuntos') !== null);
checkTrue('Letrán encuentra su salmo', resolvePsalm('B', 'Dedicación de la Basílica de Letrán') !== null);

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);

/**
 * Regenera el calendario INLINE de api/cron/celebration-reminders.ts.
 *
 * Por qué existe: la función del cron tiene que ser AUTOCONTENIDA (en este setup de
 * Vercel, importar un módulo hermano la revienta al cargar), así que el calendario va
 * copiado dentro del archivo. Esa copia se hizo a mano una vez y se desfasó: le
 * faltaban 23 domingos — los que caen en una FIESTA (Sagrada Familia, Bautismo del
 * Señor, Presentación, Transfiguración…), que no son "N.º Domingo de…" ni solemnidad.
 *
 * En esos domingos el coro NO recibía el recordatorio del jueves, y no había forma de
 * notarlo: el cron corría bien y no reportaba nada raro, simplemente no encontraba
 * celebración para esa fecha y se saltaba la parroquia.
 *
 * La regla es: TODO domingo (tenga el nombre que tenga) + toda solemnidad. Los domingos
 * son lo que decide si hay que publicar cantoral; las solemnidades entre semana también.
 *
 * Uso:  node scripts/genCronCelebrations.mjs        (o `npm run gen:cron-celebrations`)
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(raiz, 'src', 'data', 'liturgicalCalendar.generated.json');
const DESTINO = join(raiz, 'api', 'cron', 'celebration-reminders.ts');

const INICIO = 'const BASE_CELEBRATIONS: { date: string; name: string; solemne?: boolean }[] = [';
const FIN = '];';

const esDomingo = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0;
};

const calendario = JSON.parse(readFileSync(ORIGEN, 'utf8'));

// Una entrada por fecha: si un domingo trae varias (rarísimo), gana la primera, que es
// la que el resto de la app muestra como celebración del día.
//
// `solemne` marca las SOLEMNIDADES. Se usa para el aviso de cercanía al Pueblo fiel,
// que va solo a las solemnidades (y a las celebraciones agregadas a mano): avisar de
// cada domingo sería ruido semanal. Los domingos siguen en la lista porque el
// recordatorio al coro ("publica el cantoral") sí los necesita todos.
const porFecha = new Map();
for (const e of calendario) {
  if (!e?.date || !e?.name) continue;
  const solemne = e.type === 'SOLEMNITY';
  if (!esDomingo(e.date) && !solemne) continue;
  if (!porFecha.has(e.date)) porFecha.set(e.date, { name: e.name, solemne });
}

const filas = [...porFecha.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([date, { name, solemne }]) =>
    `  { date: ${JSON.stringify(date)}, name: ${JSON.stringify(name)}${solemne ? ', solemne: true' : ''} },`);

const fuente = readFileSync(DESTINO, 'utf8');
const i = fuente.indexOf(INICIO);
if (i === -1) throw new Error(`No encontré "${INICIO}" en ${DESTINO}`);
const j = fuente.indexOf(`\n${FIN}`, i);
if (j === -1) throw new Error('No encontré el cierre del arreglo');

const salida = `${fuente.slice(0, i + INICIO.length)}\n${filas.join('\n')}\n${fuente.slice(j + 1)}`;
writeFileSync(DESTINO, salida, 'utf8');

const domingos = [...porFecha.keys()].filter(esDomingo).length;
const solemnes = [...porFecha.values()].filter((v) => v.solemne).length;
const desde = filas.length ? porFecha.keys().next().value : '—';
const hasta = [...porFecha.keys()].sort().at(-1) ?? '—';
console.log(`OK  ${filas.length} celebraciones (${domingos} domingos, ${solemnes} solemnidades) — ${desde} → ${hasta}`);
console.log(`    escritas en ${DESTINO}`);

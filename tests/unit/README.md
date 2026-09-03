# Pruebas unitarias — reglas litúrgicas e instrumento

Prueban lógica pura (sin navegador ni base de datos): cálculo de Cuaresma, rótulo
de la tarjeta del Aleluya, exclusión de Aleluyas en Cuaresma y compatibilidad de
instrumento. Corren en segundos y no necesitan `.env`.

## Cómo correrlas

Desde la carpeta del proyecto:

```bash
npx esbuild tests/unit/liturgia-instrumento.test.ts --bundle --platform=node --format=esm --outfile=tests/output/unit.mjs
node tests/output/unit.mjs

npx esbuild tests/unit/video-por-instrumento.test.ts --bundle --platform=node --format=esm --outfile=tests/output/video-instrumento.mjs
node tests/output/video-instrumento.mjs

npx esbuild tests/unit/reporteria-cantos.test.ts --bundle --platform=node --format=esm --outfile=tests/output/reporteria.mjs
node tests/output/reporteria.mjs

npx esbuild tests/unit/etiquetas-canto.test.ts --bundle --platform=node --format=esm --outfile=tests/output/etiquetas.mjs
node tests/output/etiquetas.mjs

npx esbuild tests/unit/buscador-carpetas.test.ts --bundle --platform=node --format=esm --outfile=tests/output/buscador-carpetas.mjs
node tests/output/buscador-carpetas.mjs

npx esbuild tests/unit/editar-canto.test.ts --bundle --platform=node --format=esm --outfile=tests/output/editar-canto.mjs
node tests/output/editar-canto.mjs

npx esbuild tests/unit/fechas.test.ts --bundle --platform=node --format=esm --outfile=tests/output/fechas.mjs
node tests/output/fechas.mjs

npx esbuild tests/unit/sugerencias-temporada.test.ts --bundle --platform=node --format=esm --outfile=tests/output/sugerencias.mjs
node tests/output/sugerencias.mjs

npx esbuild tests/unit/salmo-antifona.test.ts --bundle --platform=node --format=esm --outfile=tests/output/salmo.mjs
node tests/output/salmo.mjs

npx esbuild tests/unit/publicar-cantoral.test.ts --bundle --platform=node --format=esm --outfile=tests/output/publicar.mjs
node tests/output/publicar.mjs

npx esbuild tests/unit/perfil-admin.test.ts --bundle --platform=node --format=esm --outfile=tests/output/perfil.mjs
node tests/output/perfil.mjs

npx esbuild tests/unit/cantoral-vista-completa.test.ts --bundle --platform=node --format=esm --outfile=tests/output/cantoral-vista.mjs
node tests/output/cantoral-vista.mjs

npx esbuild tests/unit/instalar-plataforma.test.ts --bundle --platform=node --format=esm --outfile=tests/output/instalar-plataforma.mjs
node tests/output/instalar-plataforma.mjs

npx esbuild tests/unit/editar-cantoral.test.ts --bundle --platform=node --format=esm --outfile=tests/output/editar-cantoral.mjs
node tests/output/editar-cantoral.mjs

# Este importa una función de api/, que trae los tipos de Vercel: van como external.
npx esbuild tests/unit/avisos-automaticos.test.ts --bundle --platform=node --format=esm --external:@vercel/node --external:web-push --outfile=tests/output/avisos.mjs
node tests/output/avisos.mjs

npx esbuild tests/unit/admin-dos-niveles.test.ts --bundle --platform=node --format=esm --outfile=tests/output/admin-niveles.mjs
node tests/output/admin-niveles.mjs

npx esbuild tests/unit/audios-ensayo.test.ts --bundle --platform=node --format=esm --outfile=tests/output/audios.mjs
node tests/output/audios.mjs

npx esbuild tests/unit/avisos-audiencia.test.ts --bundle --platform=node --format=esm --external:@vercel/node --external:web-push --outfile=tests/output/avisos-aud.mjs
node tests/output/avisos-aud.mjs

npx esbuild tests/unit/pdf-texto.test.ts --bundle --platform=node --format=esm --outfile=tests/output/pdftexto.mjs
node tests/output/pdftexto.mjs

npx esbuild tests/unit/cantoral-partes.test.ts --bundle --platform=node --format=esm --outfile=tests/output/cantoral-partes.mjs
node tests/output/cantoral-partes.mjs

npx esbuild tests/unit/visita-parroquia.test.ts --bundle --platform=node --format=esm --outfile=tests/output/visita.mjs
node tests/output/visita.mjs

npx esbuild tests/unit/folleto-columnas.test.ts --bundle --platform=node --format=esm --outfile=tests/output/columnas.mjs
node tests/output/columnas.mjs
```

Salida esperada: `45`, `37`, `109`, `33`, `51`, `19`, `27`, `38`, `19`, `16`, `12`, `23`, `25` y `18` ok, con 0 fallas. Si alguna falla, imprime el
caso con lo esperado y lo obtenido.

> Ojo al importar en una prueba: `services/supabaseClient.ts` **crea el cliente al importarse**
> y revienta sin variables de entorno. Por eso la lógica pura vive en `utils/` (p. ej.
> `utils/songTags.ts`) y las pruebas importan de ahí, nunca del `services/` equivalente.

### Validar el Excel de verdad

Los tests comprueban la estructura del `.xlsx` (firma ZIP, hojas, escapes), pero el archivo
generado conviene abrirlo con un lector real. Con el `.venv` del proyecto:

```bash
python -W error::UserWarning -c "import openpyxl; wb=openpyxl.load_workbook('archivo.xlsx'); print(wb.sheetnames)"
```

`-W error::UserWarning` es importante: openpyxl **avisa en vez de fallar** cuando al libro le
falta una pieza (por ejemplo el estilo por defecto), y ese aviso es justo lo que se quiere ver.

> Se usa `esbuild` (ya viene con Vite) porque el proyecto no tiene `tsc` instalado
> y los módulos bajo prueba son TypeScript.

## Qué cubren

| Bloque | Qué asegura |
|---|---|
| Pascua por año civil | Meeus/Jones/Butcher da la Pascua correcta en 2025, 2026 y 2027 sin mantenimiento anual |
| Rótulo del Aleluya | En Cuaresma la tarjeta pasa a "Aclamación al Evangelio"; fuera, no |
| Momento canónico | El rótulo nuevo sigue mapeando al momento `aleluya` de la BD |
| Exclusión en Cuaresma | Oculta títulos con "aleluya"/"alleluia" (sin tildes, cualquier caja) solo dentro de Cuaresma |
| **Vigilia Pascual** | El **Aleluya Triple NO se oculta**: el Sábado Santo ya no es Cuaresma |
| Instrumento — formato real | La BD guarda `"organo"`/`"guitarra"` en minúscula y sin tilde; `InstrumentType` usa `"Órgano"`. La comparación normaliza ambos lados |
| Instrumento | Los dos falsos negativos históricos (array con varios instrumentos, y arreglo vacío = "sirve para todos") |
| Filtro por instrumento | Solo se ven los cantos del instrumento elegido; un momento puede quedar en cero y es correcto |
| **Video por instrumento** (`video-por-instrumento`) | El organista ve la grabación con órgano y el guitarrista la de guitarra; el catálogo viejo (un solo `youtube_id`) no se queda sin video; si falta tu versión se usa la otra **marcada como respaldo** para que la pantalla avise; IDs a medio pegar se descartan; se acepta pegar la URL completa (watch, youtu.be, embed, shorts) |
| **Reportería del catálogo** (`reporteria-cantos`) | La regla del **par órgano+guitarra** y su **excepción gregoriana** (con un video basta); un video "único" sin instrumento NO cuenta como par completo; los **acordes** se detectan solo en tokens que son acordes de verdad (`[Lam]`, `[Fa#m7]`) y no en acotaciones (`[Estribillo]`, `[bis]`, `[Coro]`); totales y desglose por clasificación; cruce con las **carpetas de Drive** (nombres sin tilde, `Final`→`Salida`, el `.mp3` de MuseScore no cuenta); CSV con `;` entrecomillado |
| **Excel de la reportería** (`reporteria-cantos`) | El libro trae las tres hojas (Resumen / Por clasificación / Planilla) con **los mismos números que la pantalla**, los valores como número y no como texto, la cabecera en negrita; y el escritor `utils/xlsx.ts` produce un ZIP válido, escapa `&`/`<` y **renombra pestañas duplicadas** (dos con el mismo nombre invalidan el libro entero en Excel) |
| **Texto largo en el PDF** (`pdf-texto`) | Que el nombre de una celebración larga no se salga de la hoja del folleto. En la portada se parte en varias líneas y en el encabezado de página —que es una sola línea sobre la regla— se recorta con «…». Fija que lo que cabe no se toca, que lo recortado entra en el ancho y conserva el principio, que no queda un espacio colgando antes de los puntos, y que un ancho absurdo (0 o 1) no cuelga la generación del PDF |
| **Perfil y panel de admin** (`perfil-admin`) | Que un cambio de rol hecho por el admin **llegue de verdad**: al abrir la app, lo permanente (rol, nombre, parroquias, instrumento) lo pone el SERVIDOR y solo lo de la sesión (con qué rol y parroquia entro hoy) lo pone el teléfono. Antes el dispositivo usaba su copia local y encima la subía, así que el cambio no llegaba y se revertía solo. Fija además que al cambiar el rol se descarta la elección de sesión vieja (un Pueblo fiel ascendido a Coro debe poder entrar como Coro) y la detección de **fichas repetidas** de la misma persona por nombre o correo de recuperación |
| **Antífona del salmo** (`salmo-antifona`) | Que el salmo llegue al cantoral **basta con una de las dos piezas**: la antífona escrita a mano o la página del libro. Antes se exigía que la celebración estuviera en el índice, así que si el libro no la traía, el coro escribía la antífona y el salmo no viajaba igual. Cubre también que lo escrito por el coro manda sobre el índice sin perder la página, y que sin antífona ni libro no se inventa un salmo vacío |
| **Sugerencias por tiempo** (`sugerencias-temporada`) | Que el carrusel de "cantos recomendados" no ofrezca cantos de otra época — en Tiempo Ordinario salían de **Navidad**, porque filtraba por `song.tags` (campo de YouTube que el catálogo no llena) y luego **rellenaba con los primeros cantos del catálogo**. Fija que sin etiquetas el canto sirve todo el año; que "tiempo-ordinario" y "Tiempo Ordinario" son lo mismo; que los días y solemnidades caen en su tiempo (Domingo de Ramos→Cuaresma, Vigilia Pascual→Pascua, Corpus y Cristo Rey→Ordinario, Inmaculada→Adviento); y —el error contrario— que las **temáticas no atan**: un canto a la Virgen María o gregoriano se sugiere en cualquier tiempo, y una etiqueta nueva del admin no esconde el canto el año entero |
| **Fechas locales** (`fechas`) | Que la fecha que se muestra sea la de la **Misa** y no la de ayer. `new Date('2026-08-23')` se parsea como medianoche **UTC** y en Chile cae el 22: así el folleto de un domingo salía fechado el sábado. La prueba corre con `TZ=America/Santiago` —donde el error se ve— y fija el contrato de `parseYmdLocal`/`formatYmdForDisplay`: bordes de mes y de año, 29 de febrero, ida y vuelta, aritmética de días (para el "¡Hoy!"/"Mañana"), el **cambio de hora** de septiembre y el rango de la semana. Incluye dos casos que documentan el error para que nadie lo reintroduzca |
| **Editar un canto** (`editar-canto`) | Que **vaciar un campo lo borre de verdad**. En `updateSong`, `undefined` significa "no toques la columna": mandar los vacíos así hacía que la partitura quitada reapareciera al guardar. Fija que todos los campos de texto viajan siempre y que el vacío va como `null`; que quitar la partitura no se lleva por delante la carpeta de voces, el autor ni la letra; y que la **letra conserva saltos y sangría** (solo se borra si es puro espacio en blanco) |
| **Buscadores de Drive** (`buscador-carpetas`) | Los dos selectores de la ficha del canto (la **carpeta** con las voces y el **PDF** único). Con cientos de archivos, lo que se está cargando aparece arriba: **por parecido con el título** (ignorando tildes y muletillas — "Vienen con Alegría" encuentra `Vienen con Alegria`) y después **por el momento** del canto. El texto busca dentro de los **nombres de los PDF**; las carpetas **sin PDF** se esconden salvo que se pida verlas; las que **solo agrupan** otras caen al final; lo suelto en la raíz va al final del todo. Entre el archivo general y sus voces gana el **general** (`Ave Maria.pdf` antes que `Ave Maria-Soprano.pdf`), pero ese desempate **no** se aplica cuando nada coincide —ahí manda el alfabeto—. La sugerencia automática se calla ante un **empate exacto** (dos con el mismo nombre) o si la carpeta está vacía |
| **Etiquetas de canto** (`etiquetas-canto`) | La lista por defecto trae las nuevas (Domingo de Ramos, Funerales, Otros sacramentos, Fiestas patronales) **sin perder** las de antes y sin duplicados; los duplicados se detectan ignorando acentos, caja y espacios (y una etiqueta no choca consigo misma al renombrarse); y la regla de la **etiqueta principal**: la 1ª marcada manda, tocar una marcada la asciende, desmarcar la principal asciende a la siguiente, y sin ninguna el canto sirve para todas las temporadas |
| **Guardar en Drive** (`reporteria-cantos`) | El nombre en Drive es **fijo** (para que el enlace compartido no cambie) mientras que el de la descarga lleva fecha; la consulta por nombre **escapa apóstrofos y barras** (un `'` sin escapar rompe la query de Drive); y el cuerpo multipart usa **el mismo boundary que el header** — `Blob` normaliza su MIME a minúsculas, así que un boundary con mayúsculas los desalinearía y Drive respondería 400 sin explicar |

## Cuidado con los datos de prueba

La primera versión de esta suite usaba `instruments: ['Órgano']` — bien escrito,
con tilde y mayúscula. Pasaba en verde mientras en producción **ningún** canto
coincidía, porque la BD guarda `["organo"]`. Los tests validaban un formato que no
existe en la base.

Por eso hay un bloque dedicado al **formato real** (minúscula sin tilde, mayúsculas,
espacios sobrantes). Si tocas la comparación de instrumentos, contrástala además
contra el catálogo real: `select title, mass_moment, instruments from songs`.

Lo mismo con los IDs de YouTube: para probar un ID inválido **no sirve** algo como
`'no-es-un-id'` — tiene 11 caracteres del alfabeto permitido, así que es un ID
perfectamente válido. Usa algo de otro largo (`'corto'`).

## Detalle litúrgico que conviene no "corregir"

`isLent()` va del **Miércoles de Ceniza al Viernes Santo**, ambos inclusive. El
**Sábado Santo queda fuera** a propósito: la Cuaresma termina antes del Triduo. De
ahí que la Vigilia Pascual conserve su Aleluya Triple y no se le aplique el filtro
de Cuaresma. Hay tests que fijan este borde en ambos sentidos.


## El cantoral publicado tiene que mostrar lo MISMO que se seleccionó

`cantoral-vista-completa.test.ts` fija dos cosas que se rompieron el día del
lanzamiento (29-ago-2026):

1. **Todos** los cantos de cada parte, no solo el primero. La Comunión lleva dos o
   tres; la guía "Ver Ordinario" hacía `.find()` y mostraba uno.
2. El **orden** sale de `utils/ordinary` y de ningún otro lado. Cada vista tenía su
   propia lista incompleta y ordenaba con `indexOf`: una parte que no estuviera en
   ella daba -1 y se iba ARRIBA DE TODO. Si agregas un rótulo de parte nuevo,
   agrégalo a `MASS_CATEGORY_ORDER` — no a una lista local.


## El calendario del cron es GENERADO

`api/cron/celebration-reminders.ts` lleva el calendario copiado dentro (la función de
Vercel tiene que ser autocontenida). Esa copia se mantenía a mano y se desfasó: le
faltaban los **23 domingos que caen en una fiesta** — Sagrada Familia, Bautismo del
Señor, Presentación, Transfiguración, Exaltación de la Santa Cruz, Dedicación de San
Juan de Letrán. Ninguno se llama "N.º Domingo de…" ni es solemnidad, así que el filtro
manual los dejaba fuera, y esos domingos el coro **no recibía el recordatorio del
jueves**, sin ningún error a la vista.

Ahora lo regenera `npm run gen:calendar` (que encadena `gen:cron-celebrations`). La
regla es **todo domingo + toda solemnidad**. `avisos-automaticos.test.ts` recorre los
105 jueves de 2026 y 2027 y exige que cada uno apunte a un domingo que exista en el
calendario: si vuelve a faltar alguno, la prueba lo caza.


## La frontera de los dos niveles de admin

`admin-dos-niveles.test.ts` lee el SQL del repo (las dos migraciones del paquete:
`20260901_admin_solo_cantos` y `20260902_songs_borrado_solo_principal`), no la base. Vigila la regla que hace
segura la separación: **`is_admin()` significa admin PLENO**, y lo único que se le abre
al ayudante de cantos es `is_song_admin()` sobre `songs` y `song_tags` (más leer
`admins`). Está escrito así a propósito: como `is_admin()` la usan una veintena de
policies por todo el esquema, cualquier policy que se agregue mañana queda **cerrada al
ayudante por omisión**. Si alguien abre otra tabla con `is_song_admin`, o afloja
`is_admin()`, la prueba lo caza. Escribir en `admins` es solo del principal — si no, un
ayudante podría ascenderse solo.

Vigila además el **borrado**: el ayudante sube (INSERT) y transcribe (UPDATE), pero el
DELETE de `songs` y de `song_tags` es del principal. Si alguien volviera a poner una
policy `FOR ALL` sobre `songs`, el borrado entraría por la puerta de atrás — la prueba
también lo caza.

## Los audios de ensayo salen del nombre del archivo

`audios-ensayo.test.ts`. MuseScore exporta un MP3 por voz en la misma carpeta de Drive
que las partituras y con la misma convención de nombres, así que la deducción de voces
es **la misma función** (`detectSheets`, con la extensión como parámetro). Si alguien la
cambia pensando solo en los PDF, el mezclador se queda sin voces y **no hay ningún error
que lo delate**: simplemente deja de aparecer el botón. De ahí que la prueba use nombres
reales del Drive, paréntesis y espacios incluidos.

## A quién le llega un aviso

`avisos-audiencia.test.ts`. La diócesis **no se guarda como tal**: hay que sacarla del
nombre de la parroquia (`"Parroquia X - Diócesis Y · Capilla Z"`). Si esa lectura falla,
el aviso se manda a quien no era — y un push no se puede retirar — o no se manda a nadie
sin que nada lo delate. De ahí que la prueba cubra la capilla, las arquidiócesis, los
acentos y a quien pertenece a dos diócesis.

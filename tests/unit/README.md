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
```

Salida esperada: `45`, `37`, `109` y `33` ok, con 0 fallas. Si alguna falla, imprime el caso
con lo esperado y lo obtenido.

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

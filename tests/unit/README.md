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
```

Salida esperada: `TODO OK — 45 ok, 0 fallas` y `TODO OK — 37 ok, 0 fallas`. Si alguna
falla, imprime el caso con lo esperado y lo obtenido.

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

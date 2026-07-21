# Pruebas unitarias — reglas litúrgicas e instrumento

Prueban lógica pura (sin navegador ni base de datos): cálculo de Cuaresma, rótulo
de la tarjeta del Aleluya, exclusión de Aleluyas en Cuaresma y compatibilidad de
instrumento. Corren en segundos y no necesitan `.env`.

## Cómo correrlas

Desde la carpeta del proyecto:

```bash
npx esbuild tests/unit/liturgia-instrumento.test.ts --bundle --platform=node --format=esm --outfile=tests/output/unit.mjs
node tests/output/unit.mjs
```

Salida esperada: `TODO OK — 35 ok, 0 fallas`. Si alguna falla, imprime el caso con
lo esperado y lo obtenido.

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
| Orden por instrumento | Compatibles primero, orden estable, sin ocultar nada |

## Cuidado con los datos de prueba

La primera versión de esta suite usaba `instruments: ['Órgano']` — bien escrito,
con tilde y mayúscula. Pasaba en verde mientras en producción **ningún** canto
coincidía, porque la BD guarda `["organo"]`. Los tests validaban un formato que no
existe en la base.

Por eso hay un bloque dedicado al **formato real** (minúscula sin tilde, mayúsculas,
espacios sobrantes). Si tocas la comparación de instrumentos, contrástala además
contra el catálogo real: `select title, mass_moment, instruments from songs`.

## Detalle litúrgico que conviene no "corregir"

`isLent()` va del **Miércoles de Ceniza al Viernes Santo**, ambos inclusive. El
**Sábado Santo queda fuera** a propósito: la Cuaresma termina antes del Triduo. De
ahí que la Vigilia Pascual conserve su Aleluya Triple y no se le aplique el filtro
de Cuaresma. Hay tests que fijan este borde en ambos sentidos.

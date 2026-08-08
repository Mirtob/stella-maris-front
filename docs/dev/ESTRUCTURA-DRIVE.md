# Estructura de carpetas en Drive (partituras)

Cómo organizar el Drive de partituras para que la app lo lea lo mejor posible.
Escrito a partir de lo que el código realmente hace, no de una convención deseada.

Quién lee este Drive:
- `api/sheets.ts` → `walkDrive()`: recorre **todo** el árbol y devuelve cada archivo con
  su ruta relativa en `path` (p. ej. `Entrada/Entrada - Cuaresma`).
- `src/components/songs/SongManager.tsx` → arma el **selector de partitura** del editor de
  cantos, agrupado por el **primer** nivel de carpeta.
- `src/utils/ordinarySheetMusic.ts` → `pickOrdinarySheet()`: resuelve **solo** las partes
  del ordinario, usando el **último** segmento de la ruta + el nombre del archivo.

---

## Qué usa la app y qué no

Conviene tenerlo claro antes de invertir tiempo en mover carpetas.

| Nivel | ¿La app lo usa? | Para qué |
|---|---|---|
| **1.º — momento de la Misa** | **Sí** | Agrupa el selector y lo ordena en el orden de la Misa |
| **2.º — tiempo litúrgico** | Solo como etiqueta | Se muestra como prefijo: *"Entrada - Cuaresma — Perdona a tu pueblo"* |
| **Carpeta dentro de `Misas`** | **Sí** | Resuelve automáticamente la partitura de cada parte del ordinario |
| **Nombre del archivo** | **Sí** (ordinario) | Identifica de qué parte es |
| **Un PDF por voz** | **No, hoy no** | Cada canto apunta a **un** solo PDF (`sheetMusicUrl`) |

> **El tiempo litúrgico real de un canto NO sale de la carpeta**: sale del campo
> `liturgicalSeasons` del canto, que se edita en la app. La carpeta ayuda a la persona a
> encontrar el PDF, no a la app a clasificarlo. Vale la pena igual —hace el selector mucho
> más navegable— pero no reemplaza a llenar bien la ficha del canto.

---

## Estructura recomendada

```
📁 (raíz de partituras)
│
├── 📁 Entrada
│   ├── 📁 Entrada - Adviento
│   ├── 📁 Entrada - Cuaresma
│   ├── 📁 Entrada - Pascua
│   └── 📄 (cantos de cualquier tiempo, sueltos)
│
├── 📁 Rito de Aspersión
├── 📁 Salmo
├── 📁 Aleluya
├── 📁 Post Evangelio
├── 📁 Respuesta a Oración Universal
├── 📁 Ofertorio
├── 📁 Comunión
├── 📁 Salida                    ← ver aviso sobre la barra, más abajo
├── 📁 Exposición
│
└── 📁 Misas                     ← todo el ordinario
    ├── 📁 Misa Nebreda
    │   ├── 📄 Kyrie - Nebreda.pdf
    │   ├── 📄 Gloria - Nebreda.pdf
    │   ├── 📄 Santo - Nebreda.pdf
    │   └── 📄 Cordero de Dios - Nebreda.pdf
    └── 📁 Misa de Angelis
        └── …
```

### Nivel 1 — momento de la Misa (obligatorio)

Es lo único que la app usa para agrupar. Usa estos nombres, que son las etiquetas de
`MOMENT_OPTIONS`:

`Entrada` · `Rito de Aspersión` · `Salmo` · `Aleluya` · `Post Evangelio` ·
`Respuesta a Oración Universal` · `Ofertorio` · `Comunión` · `Salida` · `Exposición`

Las partes del ordinario (Kyrie, Gloria, Santo, Cordero de Dios, Padre Nuestro, Aclamación
Consagración, Amén, Tuyo es el Reino) **no** llevan carpeta propia: van dentro de `Misas`.

**Tildes y mayúsculas dan igual** — la comparación las ignora. `Comunion` funciona igual
que `Comunión`.

> ⚠️ **Nunca uses `/` en el nombre de una carpeta.** Es el separador de rutas: una carpeta
> llamada `Final / Salida` se partiría en dos niveles falsos. Por eso la carpeta se llama
> `Salida` a secas y el código la reconoce por alias.

Una carpeta con un nombre que no esté en la lista **no rompe nada**: sus archivos aparecen
igual en el selector, en un grupo propio ordenado al final.

### Nivel 2 — tiempo litúrgico (opcional, recomendado)

Dentro de cada momento, una subcarpeta `<Momento> - <Tiempo>` para los cantos **propios de
ese tiempo**. Los que sirven todo el año quedan **sueltos** en la carpeta del momento.

Usa los ocho tiempos que la app ya maneja (`LITURGICAL_SEASON_LABELS`), para que un futuro
filtrado automático por temporada no tenga que adivinar equivalencias:

`Adviento` · `Navidad` · `Tiempo Ordinario` · `Cuaresma` · `Semana Santa` · `Pascua` ·
`Pentecostés` · `Corpus Christi`

**Los temas no son tiempos.** «Virgen María», «Difuntos», «Santos» o «Eucaristía» son
categorías temáticas, no tiempos litúrgicos. Si las quieres —y son útiles— márcalas para
poder distinguirlas después:

```
📁 Comunión
├── 📁 Comunión - Cuaresma          ← tiempo litúrgico
└── 📁 Comunión - Tema Virgen María ← temática
```

Mantener el prefijo del momento (`Entrada - Cuaresma`, no solo `Cuaresma`) hace que la
etiqueta del selector se explique sola.

### Nivel 3 — canto a varias voces (opcional)

Una carpeta con el nombre del canto y dentro un PDF por voz:

```
📁 Ofertorio
└── 📁 Ave verum
    ├── 📄 Ave verum - Full Score.pdf   ← enlaza ESTE en la ficha del canto
    ├── 📄 Ave verum - Soprano.pdf
    ├── 📄 Ave verum - Contralto.pdf
    ├── 📄 Ave verum - Tenor.pdf
    └── 📄 Ave verum - Bajo.pdf
```

Como la app enlaza **un** PDF por canto, incluye siempre un **Full Score**: es el que
conviene enlazar. Los de cada voz quedan disponibles en Drive para repartir al coro.

---

## La carpeta `Misas` (ordinario)

Es la única parte donde la estructura tiene efecto **automático**: la app busca sola la
partitura de cada parte, sin que nadie la enlace a mano.

**Una carpeta por Misa, con el nombre de la Misa.** El nombre de esa carpeta es lo que se
compara con la Misa elegida en el cantoral, así que debe coincidir (sin importar tildes ni
mayúsculas). Que estén todas dentro de `Misas` no molesta: la resolución mira el **último**
segmento de la ruta.

**Un PDF por parte, con el nombre de la parte en el archivo.** El nombre debe contener la
parte; se reconocen estos sinónimos:

| Parte | Se reconoce si el archivo dice… |
|---|---|
| Kyrie | `kyrie`, `señor ten piedad`, `ten piedad` |
| Gloria | `gloria` |
| Santo | `santo`, `sanctus` |
| Cordero de Dios | `cordero`, `agnus` |
| Padre Nuestro | `padre nuestro`, `pater noster` |
| Rito de Aspersión | `aspersión`, `asperges` |

> ⚠️ **Partes sin sinónimos definidos:** `Aclamación Consagración`, `Amén (Doxología)` y
> `Tuyo es el Reino`. Para ésas, el archivo debe contener el nombre del momento **tal como
> lo escribe la app** (p. ej. `Aclamacion Consagracion - Nebreda.pdf`). Si se van a usar
> mucho, conviene agregarles sinónimos en `PART_SYNONYMS`.

Repetir el nombre de la Misa en el archivo (`Kyrie - Nebreda.pdf`) es redundante pero
recomendable: sirve de respaldo si alguna vez se mueve la carpeta.

---

## Límites y trampas

| Cosa | Detalle |
|---|---|
| **Máx. carpetas** | 200 (`MAX_FOLDERS`). Se corta **en silencio**: lo que sobra no aparece. |
| **Máx. archivos** | 3000 (`MAX_FILES`), también en silencio. |
| **Uso actual** | 15 carpetas y 30 archivos — holgura de sobra. |
| **`/` en nombres** | Prohibido: parte la ruta en niveles falsos. |
| **Tildes / mayúsculas** | Indiferentes en carpetas de momento. |
| **Carpetas vacías** | Inofensivas (hoy `Aleluya` y `Post Evangelio` lo están). |
| **Profundidad** | Sin límite propio; cada nivel extra solo alarga la etiqueta del selector. |

Con la estructura completa (≈10 momentos × ≈8 tiempos ≈ 80 carpetas, más las de Misas y
las de cantos polifónicos) se queda cómodamente bajo el tope de 200. Conviene revisarlo si
alguna vez se agregan carpetas por parroquia o por año.

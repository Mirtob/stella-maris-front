# Estructura de carpetas en Drive (partituras)

Cómo organizar el Drive de partituras para que la app lo lea lo mejor posible.
Escrito a partir de lo que el código realmente hace, no de una convención deseada.

Quién lee este Drive:
- `api/sheets.ts` → `walkDrive()`: recorre **todo** el árbol y devuelve cada archivo con
  su ruta relativa en `path` (p. ej. `Entrada/Entrada - Cuaresma`).
- `src/utils/sheetFolderSearch.ts` → la lógica de los **dos buscadores** de la ficha del
  canto: filtro por texto, filtro por momento (1.er nivel de carpeta) y sugerencia por
  parecido con el título. La usan `SheetFilePicker` (el PDF único) y `VoiceSheetPicker`
  (la carpeta con las voces), ambos en `src/components/songs/`.
- `src/utils/ordinarySheetMusic.ts` → `pickOrdinarySheet()`: resuelve **solo** las partes
  del ordinario, usando el **último** segmento de la ruta + el nombre del archivo.

---

## Qué usa la app y qué no

Conviene tenerlo claro antes de invertir tiempo en mover carpetas.

| Nivel | ¿La app lo usa? | Para qué |
|---|---|---|
| **1.º — momento de la Misa** | **Sí** | Son los chips que filtran los buscadores, en el orden de la Misa |
| **2.º — tiempo litúrgico** | Solo como etiqueta | Se muestra bajo el nombre y se puede buscar por él |
| **Carpeta dentro de `Misas`** | **Sí** | Resuelve automáticamente la partitura de cada parte del ordinario |
| **Nombre del archivo** | **Sí** (ordinario) | Identifica de qué parte es |
| **Un PDF por voz** | **Sí** | La ficha enlaza la **carpeta** y las voces se deducen del nombre de cada PDF (ver Nivel 3) |

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
igual en los buscadores, con un chip propio ordenado al final.

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

Incluye siempre un **Full Score**: es el que ve quien no tiene voz asignada, y el que la
app toma como partitura principal del canto.

En la ficha del canto se enlaza **la carpeta** (no cada PDF) desde el bloque *Partituras por
voz*, y de ahí se deducen las voces solas.

---

## Los dos buscadores de la ficha del canto

Ni *Partitura (Google Drive)* (el PDF único) ni *Partituras por voz* (la carpeta) son
listas desplegables: con cientos de archivos eso no se navega. Los dos funcionan igual:

- **Escribir el nombre** — sin acentos y en cualquier orden ("arcadelt ave" sirve). En el
  buscador de carpetas el texto también entra a los **nombres de los PDF** de adentro.
- **Chips por momento de la Misa** — con el conteo de cada uno; primero el momento del
  canto que se está cargando.
- **Solo carpetas con PDF** — tildado por defecto en el de carpetas.
- Cada fila dice lo que trae: la carpeta muestra cuántos PDF y qué voces se detectan.
- Como salida de emergencia, el de partituras acepta **pegar el ID de Drive a mano**
  (útil cuando el archivo se subió recién: la lista de Drive se cachea una hora).

> 💡 **Nombra la carpeta —y el PDF— igual que el canto.** Cuando el nombre coincide con el
> título escrito en la ficha, la app lo propone solo con un botón *"Usar esta"*; con
> cientos de partituras es la diferencia entre un clic y buscar a mano. Entre el archivo
> general y sus voces (`… - Soprano`), se propone el general.

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
| **Máx. carpetas** | 400 (`MAX_FOLDERS`). Si se alcanza, la respuesta trae `truncated: true` y la app **avisa** en vez de callarse. |
| **Máx. archivos** | 5000 (`MAX_FILES`), con el mismo aviso. |
| **Uso actual** (22-ago-2026) | 131 carpetas y 646 archivos (293 PDF). |
| **`.mscbackup`** | **No se recorren.** Son los respaldos de MuseScore: no traen PDF y eran 34 de esas 131 carpetas. |
| **`/` en nombres** | Prohibido: parte la ruta en niveles falsos. |
| **Tildes / mayúsculas** | Indiferentes en carpetas de momento. |
| **Carpetas vacías** | Inofensivas; en el buscador quedan ocultas salvo que se destilde "solo con PDF". |
| **Profundidad** | Sin límite propio; cada nivel extra solo alarga la ruta que se muestra. |

### Caché: por qué lo recién subido no aparece solo

`/api/sheets` recorre **todo** el árbol, así que la respuesta se cachea **una hora**, y
además la app se queda con la lista en memoria mientras dura la sesión. Consecuencia: una
partitura (o una subcarpeta) que acabas de subir a Drive **no aparece sola**.

Por eso los dos buscadores traen **"¿Recién la subiste? Actualizar desde Drive"**, que pide
`/api/sheets?fresh=…` con `Cache-Control: no-store` y vuelve a detectar las voces de la
carpeta enlazada. El aviso que sale al terminar dice cuántas partituras y carpetas se
leyeron.

> Si después de actualizar **sigue sin aparecer**, ya no es la caché: revisa que la carpeta
> nueva esté compartida como el resto del Drive de partituras (la app lee con una API key,
> no con tu cuenta, así que solo ve lo que es accesible con el enlace).

Con la estructura completa (≈10 momentos × ≈8 tiempos ≈ 80 carpetas, más las de Misas y
las de cantos polifónicos) se queda cómodamente bajo el tope de 200. Conviene revisarlo si
alguna vez se agregan carpetas por parroquia o por año.

# Tutorial paso a paso — Subir un canto (video + partitura)

> Cómo subir un canto al canal de **YouTube**, su partitura al **Google Drive**, y
> cómo **sacar el ID del PDF** para pegarlo en la metadata del video. Al final, el
> canto aparece en la app con su letra, acordes y partitura.

## Resumen del flujo

1. Subes el **video** a YouTube con un bloque de **metadata** en la descripción.
2. Subes el **PDF de la partitura** a la carpeta de Drive.
3. Copias el **ID del PDF** y lo pegas en la metadata del video (`partitura: <ID>`).
4. En la app, panel Admin → **Sincronizar YouTube**. Listo.

> Atajo: si nombras el PDF **igual que el título del canto**, la app lo vincula sola
> (no necesitas el ID). Y siempre puedes vincularlo después desde el editor de cantos
> (ver §7).

---

## Paso 1 — Subir el video a YouTube

1. Entra a **https://studio.youtube.com** con la cuenta del canal.
2. Botón **Crear** (arriba a la derecha) → **Subir videos**.
3. Selecciona el archivo de video y espera a que cargue.
4. **Título:** el nombre del canto (ej. *"Vienen con alegría"*).
5. **Descripción:** pega el **bloque de metadata** (ver §6). Es lo que la app lee.
6. **Visibilidad:** *Pública* o *No listada* (ambas funcionan; "Privada" NO se sincroniza).
7. **Publicar / Guardar.**

> El video debe pertenecer al **canal configurado en la app** (`VITE_YOUTUBE_CHANNEL_ID`).

---

## Paso 2 — Subir la partitura (PDF) a Google Drive

1. Entra a **https://drive.google.com** con la cuenta correspondiente.
2. Abre la **carpeta de partituras** (la compartida con la app).
3. **Nuevo → Subir archivo** (o arrastra el PDF a la carpeta).
4. Recomendado: nómbralo parecido al canto (ej. `Vienen con alegria.pdf`) para el
   auto-match.
5. **Permisos:** el archivo debe ser accesible para la app. Si no estás seguro, haz
   clic derecho → **Compartir** → en "Acceso general" elige **"Cualquiera con el enlace"**
   (lector). *(La app sirve los PDF por un proxy interno; este acceso evita problemas.)*

---

## Paso 3 — Sacar el ID del archivo de Drive (¡el dato clave!)

> El ID es del **ARCHIVO PDF**, NO de la carpeta. Es lo que más confunde.

1. En Drive, **clic derecho** sobre el **PDF** → **Compartir** → **Copiar enlace**.
2. El enlace se ve así:

   ```
   https://drive.google.com/file/d/1AbCdEf123XyZ456GhI789/view?usp=sharing
                                   └──────── ESTE es el ID ────────┘
   ```

3. El **ID** es lo que está **entre `/d/` y `/view`**. En el ejemplo:
   **`1AbCdEf123XyZ456GhI789`**.

> ⚠️ **No confundir con la carpeta.** El enlace de una **carpeta** es
> `https://drive.google.com/drive/folders/XXXX` → ese ID (después de `/folders/`)
> **NO sirve**. Necesitas el de un **archivo** (`/file/d/.../view`).
>
> Alternativa: **abre el PDF** (doble clic). La URL del navegador también tiene
> `/d/<ID>/` — copia esa parte.

---

## Paso 4 — Pegar el ID en la metadata del video

1. En **YouTube Studio** → **Contenido** → abre el video → **Editar descripción**.
2. En el bloque de metadata, completa la línea:

   ```
   partitura: 1AbCdEf123XyZ456GhI789
   ```

3. **Guardar.**

---

## Paso 5 — Sincronizar en la app

1. Entra a la app como **Administrador**.
2. Panel Admin → **Sincronizar YouTube**.
3. Al terminar, el canto aparece en el catálogo con su letra y, si el ID está bien,
   con su **partitura**.

---

## 6. Plantilla de metadata (copiar en la descripción del video)

> El bloque debe empezar con `STELLA_MARIS_META`. Solo **`categoria` es obligatorio**;
> el resto es opcional. La **letra** va después de `--- LETRA ---`.

```
STELLA_MARIS_META
categoria: Ofertorio, Comunión
autor: Alejandro Mejía
version: Guitarra
temporada: Adviento, Navidad
tonalidad: G
misa: Misa de los Ángeles
partitura: 1AbCdEf123XyZ456GhI789
liturgico: si

--- LETRA ---
[Coro]
[Sol]Vienen con ale[Do]gría, Se[Re]ñor...
[Estrofa 1]
...
```

> **Varias partes / varias temporadas desde la metadata:** tanto `categoria` como
> `temporada` admiten **varios valores separados por coma**. En `categoria`, la **primera
> es la principal** (define el orden en el cantoral/PDF) y las demás son partes adicionales
> donde el canto también aparece. En el ejemplo, el canto sirve para **Ofertorio y Comunión**,
> y se sugiere en **Adviento y Navidad**.

### Campos

| Campo | Obligatorio | Valores / ejemplo |
|---|---|---|
| `categoria` | **Sí** | Una o **varias separadas por coma** (la 1ª = principal): Entrada, Kyrie, Gloria, Salmo, Aleluya, Aclamación al Evangelio, Post Evangelio, Ofertorio, Santo, Padre Nuestro, Cordero de Dios, Comunión, Salida, Rito de Aspersión, Credo |
| `autor` | No | Nombre del autor/compositor |
| `version` | No | `Coro`, `Guitarra` u `Órgano` (default: Coro) |
| `temporada` | No | Una o **varias separadas por coma**: Adviento, Navidad, Cuaresma, Pascua, Tiempo Ordinario… (sin poner = sirve para todas) |
| `tonalidad` | No | Tono original (ej. `G`, `Re m`) |
| `misa` | No | Nombre de la Misa (agrupa Kyrie/Gloria/Santo/Cordero de la misma misa) |
| `partitura` | No | **ID del archivo PDF** en Drive (Paso 3) |
| `etiquetas` | No | Palabras clave separadas por coma |
| `liturgico` | No | `si` (default) o `no` |
| `categoria_no_liturgica` | No | Solo si `liturgico: no` — Adoración, Procesión, Mariano, Reflexión, Evangelización, Otro |

> **Acordes en la letra:** se escriben en **cifrado latino** (Do, Re, Mi, Fa, Sol, La, Si)
> entre corchetes pegados a la sílaba, ej. `[Sol]Vienen con ale[Do]gría`. En la app, el
> usuario puede ver los acordes en latino o americano (C, D, E…) y transponerlos.

> **Editar después en la app:** también puedes ajustar partes y temporadas sin tocar la
> metadata, en **Gestión de Cantos → Editar** (chips "Parte(s) de la Misa" y "Temporada
> litúrgica"; la 1ª parte marcada es la principal). Útil sobre todo para cantos **ya
> sincronizados**: al volver a sincronizar, los cantos existentes se **omiten** (no se
> re-actualizan desde YouTube), así que los cambios de metadata posteriores se aplican
> editando el canto en la app (o borrándolo y volviéndolo a sincronizar).

---

## 7. Sin el ID: dos atajos

- **Auto-match por nombre:** si el PDF se llama parecido al título del canto (≥50% de
  las palabras), la sincronización lo vincula automáticamente. No necesitas la línea
  `partitura:`.
- **Selector en la app:** Admin → **Gestión de Cantos** → **Editar** el canto → campo
  **"Partitura (Google Drive)"** → eliges el archivo de la lista (sin buscar el ID) → Guardar.

---

## 7-bis. Partes fijas de la Misa (Ordinario): **una carpeta por Misa**

Las partes fijas (Kyrie, Gloria, Santo, Cordero de Dios) van **una a una**: un video
por parte y un PDF por parte. Para que la app pueda "ir a buscar el resto de las partes
a la misma carpeta", organízalas así:

**En Drive — organiza el Ordinario por familia, y una carpeta por cada Misa:**

```
Partituras/
└── Ordinario/
    ├── Misas en español/
    │   └── Misa de los Ángeles/     ← la carpeta se llama IGUAL que la Misa
    │       ├── Kyrie.pdf
    │       ├── Gloria.pdf
    │       ├── Santo.pdf
    │       └── Cordero.pdf
    └── Misas Gregorianas/
        └── Misa de Angelis/         ← (o el nombre/autor de la Misa)
            ├── Kyrie.pdf
            ├── Gloria.pdf
            ├── Santo.pdf
            └── Cordero.pdf
```

> Lo que importa para la app es el **nombre de la carpeta de la Misa** (el último nivel):
> debe ser **igual al nombre de la Misa** (o del autor). Las carpetas intermedias
> (`Ordinario`, `Misas en español`, `Misas Gregorianas`) son solo para tu orden — la app
> busca la Misa a cualquier profundidad. Dentro, nombra cada PDF por su parte (Kyrie,
> Gloria, Santo, Cordero). **No necesitas el ID de cada PDF**: la app lo resuelve por la carpeta.

**En YouTube — un video por parte**, todos con el **mismo** campo `misa:` (idéntico al
nombre de la carpeta) y su `categoria:` correspondiente:

```
STELLA_MARIS_META
categoria: Kyrie
misa: Misa de los Ángeles      ← debe ser EXACTAMENTE el nombre de la carpeta
version: Coro
```

Repite para `categoria: Gloria`, `Santo` y `Cordero de Dios`, siempre con el mismo
`misa:`. (Si prefieres, puedes igual poner `partitura: <ID>`; tiene prioridad sobre la
carpeta.)

**Resultado en la app:** al armar el cantoral y agregar **una** parte (p. ej. el Kyrie),
la app ofrece agregar automáticamente las demás partes de **esa misma Misa** y vincula
la partitura de cada una desde **su carpeta** — sin mezclar el Santo de otra Misa.

> Clave única de enlace: el texto de `misa:` en cada video **debe coincidir** con el
> nombre de la carpeta en Drive. Si no coinciden, la app cae al match por nombre de
> archivo (menos preciso).

---

## 8. Errores comunes

| Síntoma | Causa | Solución |
|---|---|---|
| El canto no aparece tras sincronizar | Falta `STELLA_MARIS_META` o falta `categoria` | Revisa el bloque en la descripción |
| Aparece pero **sin partitura** | El ID es el de la **carpeta**, no del archivo | Usa el ID entre `/file/d/` y `/view` (Paso 3) |
| "Me manda a la carpeta de Drive" | Pegaste el link/ID de la carpeta | Copia el enlace **del PDF**, no de la carpeta |
| La partitura no abre en la app | El PDF no es accesible | Compártelo como "Cualquiera con el enlace" (Paso 2.5) |
| El video no se sincroniza | Está en **Privado** | Cámbialo a Público o No listado |

> Plantillas y metadata de **cursos** (no cantos): ver `docs/manuales/MANUAL-CANAL-Y-CONTENIDO.md`.

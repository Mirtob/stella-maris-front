# Manual del Canal y el Contenido 🎬 (encargado de subir los videos / Administrador)

Este manual es para quien **alimenta el catálogo de cantos**: sube los videos al canal de YouTube,
los etiqueta y los sincroniza con la app.

---

## 0. Lo más importante de entender

**El catálogo de cantos vive en Supabase, NO se lee del canal en vivo.** La app se alimenta del canal
**a través de una importación** que tú ejecutas. Por eso:

> ⚠️ **"Tener videos en el canal" NO basta.** Un video aparece en la app solo si:
> 1. Tiene en su **descripción** el bloque de metadatos `STELLA_MARIS_META`, **y**
> 2. Alguien **ejecuta la sincronización** (Admin → Sincronizar YouTube).
>
> Un video sin el bloque de metadatos es **ignorado** por la importación.

Flujo completo de un canto nuevo:

```
Grabar/subir video  →  Escribir metadatos en la descripción  →  (Subir partitura a Drive)
        →  En la app: Admin → Sincronizar YouTube → "Sincronizar ahora"  →  Verificar
```

---

## 1. Subir el video a YouTube

1. Sube el canto al **canal oficial** de Stella Maris.
2. **Título del video = nombre del canto** (así se llamará en la app).
3. **Visibilidad:** debe ser **Público** o **No listado** (los videos *Privados* no se reproducen en
   la app).

---

## 2. Escribir los metadatos en la descripción del video

Pega este bloque en la **descripción** del video y complétalo. La app lo lee al sincronizar.

```
STELLA_MARIS_META
categoria: Entrada
autor: Alejandro Mejía
version: Guitarra
temporada: Adviento
tonalidad: G
misa: Misa de los Ángeles
partitura: 1ABC123XYZ
liturgico: si
etiquetas: Popular, Comunidad

--- LETRA ---
[Coro]
[G]Vienen con ale[D]gría, Señor...
[Estrofa]
[Em]Por los ca[C]minos...
```

### Referencia de campos

| Campo | Obligatorio | Valores válidos / ejemplo |
|---|---|---|
| `categoria` | **Sí** | Parte de la Misa: **Entrada, Kyrie, Gloria, Salmo, Aleluya, Post Evangelio, Ofertorio, Santo, Padre Nuestro, Cordero de Dios, Comunión, Salida**. *(Para cantos NO litúrgicos, ver abajo.)* |
| `autor` | No | Nombre del autor/compositor. |
| `version` | No | **Coro**, **Guitarra** u **Órgano** (default: Coro). Indica para qué instrumento es esta versión. |
| `temporada` | No | **Adviento, Navidad, Cuaresma, Pascua, Ordinario**. Puedes poner varias separadas por coma. Si lo omites, sirve para todas las temporadas. |
| `tonalidad` | No | Tono original, ej. `G`, `Am`, `D`. |
| `misa` | No | Nombre de la misa — **solo** para Kyrie/Gloria/Santo/Cordero que pertenecen a una misma misa (ej. "Misa de los Ángeles"). |
| `partitura` | No | **ID del archivo de Drive** de la partitura (ver sección 3). |
| `liturgico` | No | `si` (default) o `no`. Pon `no` para cantos de adoración, procesiones, etc. |
| `categoria_no_liturgica` | Solo si `liturgico: no` | **Adoración, Procesión, Mariano, Reflexión, Evangelización, Otro**. |
| `etiquetas` | No | Lista separada por comas (ej. `Popular, Mariano`). |

> **Sobre el Aleluya en Cuaresma:** usa siempre `categoria: Aleluya`. La app, durante la Cuaresma, lo
> muestra automáticamente como "Aclamación al Evangelio". No necesitas una categoría aparte.

### La letra (`--- LETRA ---`)

- Todo lo que escribas **después** de la línea `--- LETRA ---` se toma como la letra.
- Acordes **entre corchetes y en línea**, justo antes de la sílaba: `[Am]Santa Ma[G]ría`.
  - El Pueblo fiel ve solo la letra; el Coro con guitarra ve la letra **con acordes**.
- Puedes marcar secciones con etiquetas como `[Coro]`, `[Estrofa]`, `[Puente]`.

---

## 3. Subir la partitura a Google Drive

La partitura (PDF o imagen) se sirve desde la carpeta de Drive de la app.

1. Sube el archivo a la **carpeta de partituras** de Drive (la configurada en la app). Estructura
   recomendada para mantener el orden (la búsqueda es **recursiva**, así que puedes anidar carpetas):

   ```
   Partituras/
   ├── 01 · Ordinario de la Misa/   (Kyrie, Gloria, Santo, Padre Nuestro, Cordero de Dios)
   ├── 02 · Propio de la Misa/      (Entrada, Salmo, Aleluya, Ofertorio, Comunión, Salida...)
   └── 03 · No litúrgicos/          (Marianos, Adoración, Procesión...)
   ```

2. **Comparte el archivo:** clic derecho → *Compartir* → **"Cualquiera con el enlace" → Lector**.
   (Si no se comparte, la partitura no cargará en la app.)
3. **Obtén el ID del archivo:** abre el archivo; en la URL
   `https://drive.google.com/file/d/`**`ESTE_ES_EL_ID`**`/view`, copia la parte del medio.
4. Pega ese ID en el campo **`partitura:`** del bloque de metadatos del video.

> **Emparejamiento automático (alternativa):** si no pones `partitura:`, la app intenta emparejar la
> partitura **por el nombre del archivo** (si coincide ≥50% con el título del canto). Es cómodo, pero
> **lo más confiable es poner el `partitura:` explícito**.
>
> Convención de nombre sugerida: `<Título> - <Instrumento>.pdf` (ej. `Vienen con alegría - Guitarra.pdf`).

---

## 4. Sincronizar el canal con la app

1. Entra a la app e inicia sesión como **Administrador**.
2. Ve a **Panel Administrativo → Sincronizar YouTube** (tarjeta roja ▶️).
3. Toca **"Sincronizar ahora"**.
4. La app lee el canal y **agrega solo los videos nuevos** que tengan metadatos. Te muestra:
   **En YouTube** (total), **Nuevas** (agregadas) y **Ya existían** (saltadas).

> Es **seguro repetir**: los cantos ya importados **no se modifican** ni se duplican.
> Si actualizas la descripción de un video ya importado, vuelve a revisarlo desde **Gestión de
> Cantos** (la re-sincronización no sobrescribe los existentes).

---

## 5. Otras herramientas del Panel Administrativo

| Sección | Para qué sirve |
|---|---|
| **Gestión de Cantos** | Revisar/editar la biblioteca musical importada. |
| **Gestión de Parroquias** | Crear **parroquias y capillas** (las capillas aparecen en la selección inicial de los usuarios; ver *Manual del Coro/Pueblo fiel*). |
| **Gestión de Usuarios** | Administrar perfiles, roles y permisos. |
| **Recuperación de Cuentas** | Buscar un perfil por email principal o de respaldo. |
| **Migrar Catálogo** | Importar el catálogo local de ejemplo a Supabase (uso puntual/inicial). |
| **Sincronizar YouTube** | Importar cantos nuevos del canal (sección 4). |

> **Solo el Administrador** ve este panel. El Coro y el Pueblo fiel no tienen acceso.

---

## 6. Seguridad del canal de YouTube 🔐

El canal es el activo más valioso. Recomendaciones:
- En **YouTube Studio → Configuración → Permisos**, mantén **un solo Propietario** (el administrador).
- **No agregues** otros editores/administradores al canal.
- Activa la **verificación en dos pasos (2FA)** en la cuenta de Google del canal.
- La app se conecta por la **API oficial** de YouTube; los permisos se gestionan en YouTube Studio y
  Google Cloud Console.

---

## 7. Solución de problemas

| Síntoma | Causa probable / solución |
|---|---|
| El canto **no aparece** tras sincronizar | La descripción no tiene `STELLA_MARIS_META` o le falta `categoria:`. Sin categoría válida, el video se ignora. Corrige la descripción y vuelve a sincronizar. |
| **Error** al sincronizar | Revisa que `VITE_YOUTUBE_API_KEY` y `VITE_YOUTUBE_CHANNEL_ID` estén configuradas en Vercel. |
| La **partitura no carga** | El archivo de Drive no está compartido como "Cualquiera con el enlace", o el ID en `partitura:` es incorrecto. |
| El **video no se reproduce** en la app | El video está en *Privado*. Cámbialo a *Público* o *No listado*. |
| Sincronicé pero **el Coro sigue sin ver cantos** | Confirma que la sincronización reportó "Nuevas > 0". Si dice "Canal ya estaba al día" y el catálogo está vacío, es que **ningún video tiene metadatos** todavía. |

---

## 8. Lista de verificación para cada canto nuevo ✅

- [ ] Video subido al canal, título = nombre del canto, visibilidad Público/No listado.
- [ ] Bloque `STELLA_MARIS_META` en la descripción con al menos `categoria:`.
- [ ] Letra después de `--- LETRA ---` (con acordes `[Am]` si aplica).
- [ ] Partitura subida a Drive, compartida "con el enlace", e ID puesto en `partitura:`.
- [ ] **Sincronizar YouTube** en la app y verificar que aparece en **Gestión de Cantos**.

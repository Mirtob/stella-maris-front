# 📖 Casos de Uso y Flujos — Stella Maris

> **Documento de producto.** Describe **cómo se usa** la app: flujos por perfil, reglas de negocio y
> casos límite. Es la contraparte narrativa de la matriz de pruebas por rol
> ([`entrega/PLAN-DE-PRUEBAS-FINAL.md`](../entrega/PLAN-DE-PRUEBAS-FINAL.md) §5–§7), de donde se
> derivan varios de estos casos.
>
> Para **qué es la app y qué módulos tiene**: [`APP-OVERVIEW.md`](APP-OVERVIEW.md).
> Para el **estado del proyecto**: [`../INFORME-FINAL.md`](../INFORME-FINAL.md).
>
> - **Última actualización:** 2026-07-21 (verificado contra el código, no solo contra el doc previo)

---

## 📋 Tabla de contenidos

1. [Perfiles y permisos](#1-perfiles-y-permisos)
2. [Casos de uso — Coro](#2-casos-de-uso--coro)
3. [Casos de uso — Pueblo fiel](#3-casos-de-uso--pueblo-fiel)
4. [Casos de uso — Admin](#4-casos-de-uso--admin)
5. [Flujo completo: un domingo en la parroquia](#5-flujo-completo-un-domingo-en-la-parroquia)
6. [Reglas de negocio](#6-reglas-de-negocio)
7. [Casos límite](#7-casos-límite)

---

## 1. Perfiles y permisos

Tres roles: **Pueblo fiel**, **Coro**, **Admin**.

Cada usuario tiene un **rol permanente** (su perfil) y un **rol de sesión** (`activeRole`): al
entrar confirma "cómo participa hoy". Un miembro del Coro puede actuar como Pueblo fiel en otra
parroquia sin perder su rol. **Solo el administrador principal cambia roles** (validado en la UI y
por trigger en base de datos).

| Capacidad | Pueblo fiel | Coro | Admin |
|---|:--:|:--:|:--:|
| Ver cantorales publicados de su parroquia | ✅ | ✅ | ✅ |
| Escuchar cantos, ver ordinario, descargar folleto | ✅ | ✅ | ✅ |
| Compartir cantoral por QR | ✅ | ✅ | ✅ |
| Mis Cantos (favoritos), Calendario, Cursos | ✅ | ✅ | ✅ |
| Armar y publicar cantorales | — | ✅ | ✅ |
| Editar / eliminar publicados **de su parroquia** | — | ✅ | ✅ |
| Historial global + clonar cantoral | — | ✅ | ✅ |
| Banco de Partituras · Full Score con acordes | — | ✅ | ✅ |
| **Modo Atril** | — | ✅ | — |
| Panel Admin (CRUD global) | — | — | ✅ |

---

## 2. Casos de uso — Coro

### CU-01 · Registro y primera configuración

1. Ingresa con **Google** o con **usuario + clave**.
2. Completa perfil: rol **Coro**, **instrumento(s)** (Guitarra / Órgano), **parroquia(s)**.
3. Confirma la sesión: rol activo + parroquia (y **capilla**, si aplica).
4. La app lanza el **tour guiado** del rol Coro (repetible desde el menú 🎓).

> Si pertenece a varias parroquias, puede conmutar **sin cerrar sesión** desde el menú lateral.

---

### CU-02 · Armar y publicar el cantoral dominical

**Precondición:** sesión como Coro con parroquia activa.

1. **Datos de la Misa primero:** fecha, hora (combobox de media hora) y **Tipo de Misa**:
   *del día* · *I Vísperas (sábado tarde → domingo)* · *II Vísperas*.
   La app resuelve **celebración**, **ciclo A/B/C** y **color litúrgico**.
   - Si la fecha no tiene celebración → **"Agregar solemnidad"** (queda **persistida**).
2. Elige el **instrumento** de esta Misa (ordena el catálogo).
3. La app presenta los **momentos** de la Misa según el tiempo litúrgico (en Cuaresma, "Aleluya"
   pasa a ser "Aclamación al Evangelio").
4. Agrega un canto por momento. Al agregar dispara diálogos asistentes (ver RN-02/03/04).
5. El **salmo del libro** se carga solo según celebración y ciclo; en el constructor se edita la
   **antífona** (la partitura aparece en Modo Atril).
6. Revisa las **sugerencias litúrgicas** de la temporada.
7. **Publicar Cantoral · N cantos** → **revisión litúrgica** (avisos no bloqueantes) → confirmar.
   - Opcional: **publicación multi-parroquia** con fecha/horario por parroquia.

**Postcondición:** cantoral visible para el Pueblo fiel · **QR** generado · **push** enviado a la
parroquia · disponible en Publicados e Historial.

---

### CU-03 · Reutilizar un cantoral anterior (clonar)

1. **Historial** → buscar por Año/Mes o por País/Diócesis/Parroquia/Capilla (archivo **global**:
   incluye otras parroquias).
2. **"Usar como base"** → los cantos se precargan en el constructor.
3. Ajustar y publicar (CU-02).

> Disponible **solo desde el Historial**: los cantorales publicados tienen vigencia corta.

---

### CU-04 · Dirigir la Misa con el Modo Atril

1. Abrir un cantoral publicado → **🎼 Modo Atril** (exclusivo del Coro).
2. Todo el repertorio se presenta como **documento continuo** (letra con acordes y/o partituras).
3. Durante la Misa: **zoom**, **transpositor por canto**, notación **latino/americano**,
   **autoscroll**, **metrónomo** (BPM ±, deslizador, tap tempo, pulso visual), **modo
   concentración** (ESC para salir), panel de **repertorio** para saltar de canto.
4. **🖨️ Imprimir** genera un PDF vertical **tal cual se ve**, conservando transposiciones y notación.

---

### CU-05 · Corregir un cantoral ya publicado

En **Cantorales Publicados**, sobre los de la **parroquia activa**: **Editar** (cambiar cantos,
fecha u horario) o **Eliminar** (con confirmación). Evita republicar y confundir a los fieles.

---

### CU-06 · Publicar la ficha de contacto del coro

Perfil Coro → **Datos de contacto del coro**: nombre, parroquia, correo, teléfono/WhatsApp y notas
(redes, horarios de ensayo). Alimenta el **directorio de coros**.

---

## 3. Casos de uso — Pueblo fiel

### CU-07 · Instalar la app y primer ingreso

1. Abrir el enlace en **Safari** (iPhone) o **Chrome** (Android) → *Agregar a pantalla de inicio* /
   *Instalar app*.
2. Ingresar con **Google** o **usuario + clave**.
3. Perfil: rol **Pueblo fiel** + **parroquia** (o **capilla**).

> Para recibir push en iPhone: **iOS ≥ 16.4** y app instalada en pantalla de inicio.

---

### CU-08 · Seguir la Misa del domingo

1. Pantalla principal → cantorales de las **próximas 2 semanas** (fecha, celebración, punto de color
   litúrgico). Las Misas vespertinas aparecen bajo el **sábado** con badge 🕯️ y la celebración del
   **domingo**.
2. Tocar la fecha → elegir **horario**.
3. Opciones del cantoral:
   - **🎧 Escuchar cantos** — modo radio, todos en orden.
   - **Ver Cantos** — letra **sin acordes**, documento continuo, con controles de **tamaño de letra y
     contraste** (persistidos).
   - **Ver Ordinario** — partes fijas + **posturas** (de pie / sentado / de rodillas) + toggle
     **Español/Latín**.
   - **Descargar Cantoral PDF** — folleto decorado en **cuadernillo carta**.
   - **Compartir (QR)**.
4. El **salmo responsorial** se muestra con su **antífona** (sin partitura — esa es del Coro).

---

### CU-09 · Enterarse de un cantoral nuevo

- **Push al dispositivo** (aunque la app esté cerrada), si lo activó en *Ajustes → Notificaciones*
  (se activa **por dispositivo**; hay envío de prueba).
- **Campana 🔔** dentro de la app, con contador de cantorales sin ver.

---

### CU-10 · Abrir un cantoral por QR

Apuntar la cámara al QR impreso o proyectado → se abre el cantoral exacto por **deep link**, sin
buscar. Existe además un **QR permanente de parroquia** que lleva siempre al cantoral vigente.

---

### CU-11 · Guardar cantos favoritos

El **corazón** junto a cualquier canto (radio, ordinario, listados) lo agrega a **"Mis Cantos"**,
lista personal accesible desde el menú y reproducible.

---

## 4. Casos de uso — Admin

### CU-12 · Alimentar el catálogo desde YouTube

Panel Admin → **Sincronizar canal**: importa los videos del canal oficial como cantos (vía proxy
`/api/youtube`; la API key nunca viaja al navegador). Luego se editan momento, tiempo litúrgico,
letra y acordes.

### CU-13 · Gestionar cantos

CRUD completo: crear, editar, **aprobar/rechazar**, borrar. El toggle **"no litúrgico"** define
`is_liturgical` y `mass_moment='no-liturgico'` de forma acoplada. Un canto puede servir en **varios
momentos** (`extra_moments`, con chips de multi-selección y ★ para el principal).

### CU-14 · Gestionar comunidad

CRUD de **Usuarios** (incluye crear cuentas usuario/clave y resetear claves), **Capillas** y
**Parroquias** (`custom_parishes`). El Admin opera **globalmente**, sin parroquia activa.

### CU-15 · Actuar como Coro o Pueblo fiel

El Admin puede tomar cualquiera de los dos roles en sesión para verificar lo que ve cada perfil.

---

## 5. Flujo completo: un domingo en la parroquia

```
JUEVES
├─ Push automático al Coro: "publica el cantoral" (cron semanal)
└─ Coro entra, elige fecha/hora/tipo de Misa

VIERNES — SÁBADO
├─ Coro arma el cantoral (o clona uno del Historial)
├─ Avisos: canto repetido la semana pasada / revisión litúrgica
├─ Publica  ─────────────► push al Pueblo fiel + QR generado
└─ Descarga el Full Score (acordes + partituras) para los músicos

SÁBADO TARDE (si hay vespertina)
└─ Publicada como "I Vísperas": aparece bajo el sábado con la celebración del domingo

DOMINGO — ANTES DE LA MISA
├─ Fieles abren la app (o escanean el QR de la entrada)
├─ Practican con "Escuchar cantos"
└─ Se imprime el folleto en cuadernillo para repartir

DOMINGO — DURANTE LA MISA
├─ Coro: Modo Atril (partituras + acordes + autoscroll + metrónomo)
├─ Fieles: "Ver Cantos" y "Ver Ordinario" con posturas
└─ Sin señal: el folleto PDF descargado y la caché offline responden

DOMINGO 23:59
└─ El cantoral deja de estar vigente → pasa a Archivo e Historial

LUNES
└─ El ciclo se repite
```

---

## 6. Reglas de negocio

### RN-01 · Vigencia del cantoral
Un cantoral está **vigente hasta las 23:59 del día de su Misa**. Después pasa al **Archivo** y al
**Historial**; el Pueblo fiel deja de verlo en su pantalla principal (solo muestra las próximas 2
semanas), pero el Coro lo consulta siempre.

### RN-02 · Kyrie arrastra el resto del ordinario
Al agregar un **Kyrie**, la app ofrece agregar el **Santo** y el **Cordero** de la **misma Misa**,
para mantener coherencia musical dentro del ordinario.

### RN-03 · Gloria es opcional y estacional
Al agregar el Kyrie se **pregunta** si se incluye el **Gloria**: no se canta en Adviento ni
Cuaresma, sí en Navidad, Pascua, domingos y solemnidades. Decide el usuario; la app no bloquea.

### RN-04 · Aleluya en Cuaresma
Del Miércoles de Ceniza al Viernes Santo, el momento "Aleluya" se presenta como **"Aclamación al
Evangelio"**. Si se publica un Aleluya en Cuaresma, la **revisión litúrgica** lo advierte sin
impedir la publicación.

### RN-05 · Aspersión pascual
En tiempo pascual la app pregunta si el rito penitencial es **Kyrie** o **Aspersión**, y cambia el
momento correspondiente.

### RN-06 · El instrumento ordena el catálogo
Los cantos que coinciden con el **instrumento preferido** de la sesión aparecen primero.

### RN-07 · Aviso de canto repetido
Al agregar un canto usado **la semana anterior**, la app advierte e indica en qué momento se usó. En
**Adviento y Cuaresma** sugiere además moverlo a otro momento. **Excluye el ordinario** (Kyrie,
Gloria, Santo, Cordero), donde repetir es lo normal. Es un aviso, no un bloqueo.

### RN-08 · Un cantoral por Misa
No se permite duplicar la combinación **parroquia + fecha + hora**.

### RN-09 · La capilla se comporta como parroquia
Una capilla tiene **cantoral y público propios**. Etiqueta canónica:
`"Parroquia - Diócesis · Capilla"`. Quien elige "Toda la parroquia" no ve los de las capillas y
viceversa.

### RN-10 · Los roles los cambia solo el administrador principal
Aplicado en la UI **y** por trigger en base de datos.

### RN-11 · Revisión litúrgica: advierte, nunca bloquea
Gloria/Aleluya en Cuaresma, canto no litúrgico en un momento de la Misa, secuencias faltantes en
Pascua/Pentecostés. Todos son **avisos**: la decisión pastoral es del coro.

### RN-12 · Cualquier momento admite varios cantos
Un momento de la Misa puede llevar **más de un canto**, no solo la Comunión. La única restricción es
no repetir **el mismo** canto dentro del cantoral (control por `id`).

**Razón:** en la práctica pastoral varios momentos admiten más de un canto (una entrada larga, una
procesión de ofrendas extensa, un final con doble canto). La restricción original —"solo Comunión"—
era una simplificación de la primera versión y **se levantó de forma intencional**.

> #### ⚠️ Reglas derogadas
> - **"Solo el momento Comunión admite varios cantos"** — derogada. Era una regla de la versión
>   inicial; hoy **cualquier momento admite varios cantos** (ver RN-12). Comportamiento actual
>   **confirmado como correcto** por el responsable del producto (21-jul-2026): no es una regresión
>   y **no debe "arreglarse"** durante el QA final.
> - **"Validación de cantos mínimos obligatorios"** — nunca se implementó como bloqueo; su rol lo
>   cumple la revisión litúrgica (RN-11).

---

## 7. Casos límite

### EC-01 · Un usuario cambia de rol
El rol permanente lo cambia el **administrador principal**. Para actuar puntualmente con otro rol
(p. ej. Coro que va a Misa a otra parroquia), se usa el **rol de sesión** al ingresar.

### EC-02 · Video de YouTube eliminado
El canto queda sin reproducción. El fiel ve el error y avisa al coro o al encargado del canal, que
resincroniza o corrige el canto en el Panel Admin.

### EC-03 · Fecha sin celebración en el calendario
El constructor ofrece **"Agregar solemnidad"**. La celebración queda **persistida**
(`custom_liturgical_dates`): global si la crea el Admin, por parroquia si la crea el Coro.

### EC-04 · Misa vespertina del sábado
Se publica como **I Vísperas**: aparece bajo el **sábado** con badge 🕯️ pero con la **celebración del
domingo**. Evita el error clásico de publicarla con la celebración del sábado.

### EC-05 · Parroquia sin cantorales
Estado vacío explícito. Causas típicas: el coro aún no publica, o el fiel eligió una
parroquia/capilla distinta a la suya.

### EC-06 · Varios coros en la misma parroquia
Comparten el mismo espacio de cantorales; se distinguen por **fecha + horario** de Misa (RN-08).
Si necesitan separación real, la vía es la **capilla** (RN-09).

### EC-07 · Sin conexión dentro del templo
Las letras de cantorales abiertos recientemente y los PDF descargados quedan disponibles vía **Cache
Storage** (`offlineCache.ts`). **No hay service worker de aplicación** — `sw.js` está desactivado a
propósito. Recomendación al usuario: descargar el folleto antes de entrar.

### EC-08 · El Full Score tarda en generarse
Es esperable: la app descarga cada partitura desde Drive para incrustarla. El folleto del Pueblo
(solo letra) es inmediato.

### EC-09 · Salmo del libro no disponible para una celebración
Se muestra "salmo del libro **pendiente**": la celebración todavía no está en el índice. Lo resuelve
el Admin agregándola.

### EC-10 · Push que no llega
Se activan **por dispositivo**. Causas: permiso del navegador denegado, o iPhone con iOS < 16.4 o sin
la app en pantalla de inicio. *Ajustes → Notificaciones* incluye **envío de prueba** para
diagnosticar.

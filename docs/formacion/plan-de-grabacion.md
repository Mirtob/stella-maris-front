# Plan de grabación — Camino de formación

Guía para repartir la grabación entre varias personas. A cada quien se le entrega el
**guion** de su cápsula (en `docs/formacion/`) y este flujo. La app **lee los videos
directamente del canal** gracias a un bloque de metadata en la descripción.

---

## 1) El flujo (de la grabación a la app)

1. **Grabar** la cápsula siguiendo su guion (5–12 min según el trimestre/año).
2. **Subir** el video al canal de YouTube oficial (cuenta `stellamarismusicacatolica@gmail.com`).
3. En la **descripción del video**, pegar el bloque de metadata (abajo) con el **id de la cápsula**.
4. El administrador entra a **Panel Admin → Sincronizar con YouTube → “Sincronizar videos de Cursos”**.
5. Listo: la app vincula cada cápsula con su video. No hay que tocar código.

> La cápsula sin video se muestra como **“Video en preparación”**; en cuanto exista el
> video con su bloque y se sincronice, aparece el botón **“Ver el video”**.

---

## 2) El bloque de metadata (obligatorio en la descripción)

Copiar **tal cual** al inicio de la descripción del video, cambiando solo el id:

```
STELLA_MARIS_CURSO
capsula: y1-t1-c1
```

- `capsula:` = el **id exacto** de la cápsula (ver tablas abajo). En minúsculas, sin espacios.
- Debajo del bloque puedes escribir libremente la descripción pública del video.
- Si el id no existe en el currículo, la sincronización lo ignora (aviso al admin).

---

## 3) Indicaciones de producción (para todos)

- **Duración**: respetar la del guion (Año 1: 7–10 min; Años 2–3: 9–12 min).
- **Imagen**: plano medio, buena luz, fondo sobrio y digno (nada distractor).
- **Audio**: micrófono de solapa; es lo más importante. Grabar en lugar silencioso.
- **En pantalla**: cuando el guion cite un documento, mostrar en un rótulo el **título + número**
  (p. ej. *Sacrosanctum Concilium 112*). Cuando pida ejemplo sonoro, insertarlo (15–25 s).
- **Tono**: cálido y formativo; hablas a un coro, no das una clase magistral.
- **Cierre**: leer el “reto” de la semana; la app muestra luego el micro-quiz.
- **Revisión**: idealmente, un asesor sacerdote revisa el contenido teológico antes de publicar.

---

## 4) Perfiles de quien graba

- **Formador teológico-litúrgico** (a rostro): cápsulas del eje **Espiritual/Litúrgico**.
  Da más autoridad si es sacerdote o un formador con sólida base litúrgica.
- **Músico** (voz/teclado/guitarra): cápsulas del eje **Musical**, que piden demostración
  (afinación, gregoriano, polifonía, acordes, dirección).
- Un mismo formador puede grabar varias cápsulas del mismo tema en una sola sesión (mismo set).

---

## 5) Plan por sesiones (agrupado para grabar en tandas)

Cada **sesión** comparte tema y set → convviene grabarla de una sentada. Marcado 🎵 =
requiere demostración musical (asignar a un músico).

### AÑO 1 — Intensivo  · guiones: `guiones-trimestre-{1..4}.md`

**Sesión A1 · Trimestre 1 — Identidad del cantor** (formador teológico)
| id | cápsula | eje |
|----|---------|-----|
| `y1-t1-c1` | Cantar es rezar dos veces | E |
| `y1-t1-c2` | Ministerio, no espectáculo | E |
| `y1-t1-c3` | Las tres marcas de la música sacra | E |
| `y1-t1-c4` | Cantar para que todos canten | L |
| `y1-t1-c5` | El deber de formarse | E |

**Sesión A2 · Trimestre 2 — La Misa por dentro** (formador litúrgico)
| id | cápsula | eje |
|----|---------|-----|
| `y1-t2-c6` | El mapa de la Misa | L |
| `y1-t2-c7` | Cada canto tiene una función | L |
| `y1-t2-c8` | Ordinario y Propio | L |
| `y1-t2-c9` | El Salmo responsorial | L |
| `y1-t2-c10` | El canto que pide el rito | L |

**Sesión A3 · Trimestre 3 — Voz e instrumento** 🎵 (músico)
| id | cápsula | eje |
|----|---------|-----|
| `y1-t3-c11` | Respiración y afinación 🎵 | M |
| `y1-t3-c12` | Que se entienda la letra 🎵 | M |
| `y1-t3-c13` | Tempo litúrgico 🎵 | M |
| `y1-t3-c14` | Acompañar sin tapar 🎵 | M |
| `y1-t3-c15` | Cantar juntos (empaste) 🎵 | M |

**Sesión A4 · Trimestre 4 — Año litúrgico y repertorio** (litúrgico; c19 🎵)
| id | cápsula | eje |
|----|---------|-----|
| `y1-t4-c16` | Adviento y Navidad | L |
| `y1-t4-c17` | Cuaresma y Pascua | L |
| `y1-t4-c18` | Elegir repertorio con criterio católico | L |
| `y1-t4-c19` | Primer encuentro con el gregoriano 🎵 | M |
| `y1-t4-c20` | Síntesis y envío | E |

### AÑO 1 — Teoría Musical (paralelo)  🎵 (músico) · guion: `guiones-teoria-musical.md`
De lo básico a intermedio; culmina en el círculo de quintas (base para el órgano). Van
en el track «Año 1 — Teoría Musical», abierto en paralelo al camino.

**Sesión T1 · Principios y sonido**: `y1-th-c1`, `y1-th-c2`
**Sesión T2 · Escritura musical**: `y1-th-c3`, `y1-th-c4`, `y1-th-c5`, `y1-th-c6`, `y1-th-c7`, `y1-th-c8`
**Sesión T3 · Solfeo** (rítmico/hablado/cantado): `y1-th-c9`, `y1-th-c10`, `y1-th-c11`
**Sesión T4 · Escalas, intervalos y acordes**: `y1-th-c12`, `y1-th-c13`, `y1-th-c14`, `y1-th-c15`, `y1-th-c16`, `y1-th-c17`
**Sesión T5 · Tonalidad y círculo de quintas**: `y1-th-c18`, `y1-th-c19`, `y1-th-c20`

### AÑO 2 — Intermedio  · guion: `guiones-ano-2.md`

**Sesión B1 · Teología litúrgica** (teológico): `y2-c1`, `y2-c2`, `y2-c3`
**Sesión B2 · Gregoriano en serio** 🎵 (músico): `y2-c4`, `y2-c5`, `y2-c6`, `y2-c7`
**Sesión B3 · Polifonía sacra** 🎵 (músico): `y2-c8`, `y2-c9`, `y2-c10`
**Sesión B4 · Dirección coral** 🎵 (director): `y2-c11`, `y2-c12`, `y2-c13`
**Sesión B5 · Salmodia y tonos** 🎵 (músico/litúrgico): `y2-c14`, `y2-c15`
**Sesión B6 · Órgano e instrumentos** 🎵 (músico): `y2-c16`, `y2-c17`, `y2-c18`

### AÑO 3 — Avanzado  · guion: `guiones-ano-3.md`

**Sesión C1 · Historia de la música sacra** (teológico): `y3-c1`…`y3-c5`
**Sesión C2 · Armonía funcional** 🎵 (músico): `y3-c6`, `y3-c7`, `y3-c8`
**Sesión C3 · Latín litúrgico** (litúrgico): `y3-c9`, `y3-c10`, `y3-c11`
**Sesión C4 · Componer y adaptar** 🎵 (músico): `y3-c12`, `y3-c13`
**Sesión C5 · Dirección avanzada** 🎵 (director): `y3-c14`, `y3-c15`
**Sesión C6 · Formar nuevos cantores** (teológico): `y3-c16`, `y3-c17`

### FORMACIÓN PERMANENTE (mensuales, sin prisa)

| serie | ids |
|-------|-----|
| Documento del mes | `perm-doc1`, `perm-doc2`, `perm-doc3` |
| Santo músico del mes | `perm-santo1`, `perm-santo2`, `perm-santo3`, `perm-santo4` |
| Error frecuente del mes | `perm-error1`, `perm-error2`, `perm-error3` |
| Pieza del mes | `perm-pieza1`, `perm-pieza2`, `perm-pieza3` |

---

## 6) Orden sugerido de producción

1. **Trimestre 1 completo** (Sesión A1) → probar el flujo end-to-end con 5 videos.
2. Activar en Vercel `COURSE_WEEKLY_ENABLED=1` → empieza el aviso semanal.
3. Resto del **Año 1** (A2, A3, A4).
4. **Permanentes** (dan contenido “siempre nuevo” mientras se produce el Año 2).
5. **Años 2 y 3** por sesiones, según disponibilidad de músicos.

> Recomendación: no publiques una cápsula hasta que su video esté listo. El orden del
> Año 1 es lineal (se desbloquea cápsula a cápsula), así que prioriza tenerlas en orden.

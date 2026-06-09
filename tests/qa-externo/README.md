# Pruebas con Usuarios Externos

Esta carpeta contiene guías escritas para personas **no técnicas** que vas a
invitar a probar Stella Maris.

## Para qué sirve

Los testers internos (vos, el equipo) conocen la app. Eso los hace **malos
detectando problemas de usabilidad** — saben dónde tocar, qué esperar y
asumen muchas cosas. Una persona externa, que nunca vio la app, encuentra
en 10 minutos los problemas que vos no notarías nunca.

## Documentos disponibles

| Archivo | A quién dárselo | Tiempo que toma |
|---|---|---|
| **`GUIA-RAPIDA.md`** | Cualquiera con poco tiempo, alguien que ayuda 5 minutos | 15 minutos |
| **`GUIA-TESTER.md`** | Familia, amigos, miembros de coro reales, voluntarios | 30-45 minutos |
| **`GUIA-ADMIN.md`** | Personas con permisos de admin (poca gente) | 20-30 minutos |

## Cómo organizar la prueba con cada tester

### Paso 1 — Antes de mandarles la guía

1. Completá los huecos `__________` con:
   - El link de la app
   - Tu email o WhatsApp para recibir el feedback
2. Si es la guía de Admin, **darles las credenciales en privado** (no por el mismo medio).

### Paso 2 — Cuando se las das

Mandales el archivo `.md` por correo, WhatsApp o como prefieras. Decíles:

> "Te paso esto. Es 30 minutos. No hay respuesta correcta. Solo entrá,
> probá, anotá lo que te parezca y mandámelo de vuelta."

### Paso 3 — Cuando devuelven el documento

Anotá en una hoja aparte:

| Tester | Rol probado | Issues encontrados | Severidad |
|---|---|---|---|
| María | Pueblo fiel | El botón de play se sale del recuadro | Visual |
| Juan | Coro | No entendí cómo agregar Misa completa | UX |

Si **3 testers diferentes** se confunden con la misma cosa, no es coincidencia
— es un problema real.

## Cuántos testers necesitás

- **Mínimo para detectar problemas obvios:** 3 testers (uno por rol)
- **Ideal para confianza estadística:** 5-7 testers en total

Si solo podés conseguir uno, dale `GUIA-TESTER.md`.

## Diferencia con los tests internos

| Documento | Para quién | Qué busca |
|---|---|---|
| `tests/INFORME.md` | Equipo técnico | Verificar que el backend cumple los requisitos |
| `tests/smoke/CHECKLIST.md` | Equipo técnico (caja negra) | Cubrir 68 casos exhaustivos |
| `tests/qa-externo/*.md` | Personas reales | Detectar fricción de UX y errores no anticipados |

Los 3 son complementarios. No reemplaza uno al otro.

## Consejos prácticos

- **No estés al lado del tester mientras prueba** — el sesgo es enorme. Si te quedás mirando, te van a preguntar "¿esto está bien?" cada 2 minutos y no van a explorar solos.
- **No expliques antes** — si necesitan que vos expliques, la app tiene un problema.
- **Pediles capturas de pantalla** de cualquier cosa rara. Una captura vale más que 10 párrafos.
- **Aceptá el feedback negativo sin defenderlo** — "es que tenían que haber hecho X" es exactamente lo que no tiene que escuchar el tester. Si no fue obvio, hay que arreglar la app, no al tester.

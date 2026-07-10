# Informe Presupuestario — Stella Maris

> Documento **actualizable**. Valoriza el proyecto en **UF**, **USD** y **CLP**: el gasto
> real incurrido, el valor de reposición a precio de mercado y el costo operativo.
>
> - **Versión:** 1.0 · **Última actualización:** 2026-07-10
> - ⚠️ **Cifras estimativas**, no una tasación formal. Actualizar los tipos de cambio con el valor del día.

## 1. Supuestos (tipos de cambio) — ACTUALIZAR con el valor del día

| Parámetro | Valor supuesto | Nota |
|---|---|---|
| 1 USD | CLP 950 | Referencial 2026; usar el observado del día |
| 1 UF | CLP 39.500 | Referencial 2026; usar la UF del día (SII/Banco Central) |
| **1 UF** | **≈ US$ 41,6** | Derivado (39.500 / 950) |

> Todas las conversiones de abajo usan estos valores. Si cambian, recalcular
> proporcionalmente.

---

## 2. Gasto real incurrido (desarrollo preliminar, ~3 meses)

Desglose del **gasto efectivamente realizado** por un solo desarrollador durante el
desarrollo preliminar (≈3 meses):

| Ítem | Detalle | USD | UF | CLP |
|---|---|---:|---:|---:|
| Desarrollo (1 dev, ~3 meses) | Honorario acordado | 2.500 | 60,1 | 2.375.000 |
| Hosting — Vercel | Plan Hobby (gratis) | 0 | 0 | 0 |
| Base de datos — Supabase | Plan Free (gratis) | 0 | 0 | 0 |
| Google Cloud (OAuth/YouTube/Drive/Gemini) | Capa gratuita | 0 | 0 | 0 |
| Correos — Resend | Capa gratuita | 0 | 0 | 0 |
| Errores — Sentry | Capa gratuita | 0 | 0 | 0 |
| Dominio | `*.vercel.app` (gratis) | 0 | 0 | 0 |
| **TOTAL GASTO REAL** | | **2.500** | **60,1** | **2.375.000** |

**Observación clave:** casi todo el costo fue **mano de obra**; la infraestructura operó
en capas gratuitas (**≈ US$0**). El honorario de **US$2.500 por 3 meses** equivale a una
tarifa efectiva muy baja (ver §3), coherente con un proyecto de servicio/ministerio y
**muy por debajo de precio de mercado**.

---

## 3. Esfuerzo del desarrollador (para dimensionar el valor)

Estimación del esfuerzo para construir la app desde cero (un solo desarrollador
full-stack). Sirve para valorizar (§4) y para entender la tarifa efectiva pagada.

| Módulo / frente | Horas estim. |
|---|---:|
| Base: infraestructura, auth (Google + usuario/clave), recuperación | 50 |
| Constructor de cantorales + publicación + QR + PDF cuadernillo | 70 |
| Catálogo de cantos + reproductor + letra/acordes + transpositor | 50 |
| Partituras (Drive + PDF.js) + Modo Atril | 45 |
| Calendario litúrgico + celebraciones + sugerencias | 45 |
| Ordinario de la Misa (variantes + latín) | 30 |
| Multi-parroquia / capillas / roles | 30 |
| Panel Admin (CRUD usuarios/cantos/parroquias/cantorales/quizzes) | 55 |
| Notificaciones push (Web Push + cron + VAPID) | 30 |
| Módulo Cursos (currículo, progreso, quizzes, video, certificado) | 60 |
| Historial + buscador global | 25 |
| PWA / offline / responsive / tour / UX | 40 |
| Integraciones (proxy YouTube, Gemini, Resend, Sentry) | 30 |
| Pruebas, QA y documentación | 40 |
| **TOTAL ESTIMADO** | **≈ 600 h** |

**Tarifa efectiva pagada:** US$2.500 ÷ ~600 h ≈ **US$4,2/h** (≈ CLP 3.960/h). Muy por
debajo del mercado, lo que confirma el carácter de precio simbólico/servicio.

---

## 4. Valor de reposición a precio de mercado (valor económico de la app)

Cuánto costaría **reconstruir hoy** una app equivalente (≈600 h), según quién la haga:

| Escenario | Tarifa | Horas | USD | UF | CLP |
|---|---:|---:|---:|---:|---:|
| Freelance Chile (nivel medio) | US$25/h | 600 | 15.000 | 361 | 14.250.000 |
| Freelance senior / internacional | US$40/h | 600 | 24.000 | 577 | 22.800.000 |
| Agencia de software (Chile) | US$65/h | 600 | 39.000 | 938 | 37.050.000 |

**Valor de reposición estimado (rango central):** **US$18.000 – US$28.000**
≈ **433 – 673 UF** ≈ **CLP 17,1M – 26,6M**.

> Es decir, la app tiene un **valor económico ~7 a 11 veces mayor** que el gasto real de
> US$2.500. La diferencia es el valor aportado por el desarrollador a precio de servicio.

---

## 5. Costo operativo (hacia adelante)

| Servicio | Plan actual | Costo actual | Si escala (pago) |
|---|---|---:|---|
| Vercel | Hobby | US$0 | Pro ≈ US$20/mes |
| Supabase | Free | US$0 | Pro ≈ US$25/mes |
| Google / Gemini | Capa gratuita | US$0 | Pago por uso |
| Resend | Free | US$0 | ≈ US$20/mes |
| Sentry | Free | US$0 | — |
| Dominio propio (opcional) | — | ≈ US$12/año | — |

- **Costo operativo actual:** ≈ **US$0/mes** (todo en capas gratuitas) + dominio opcional.
- **Costo operativo si se profesionaliza/escala:** ≈ **US$65/mes** ≈ **US$780/año**
  ≈ **19,7 UF/año** ≈ **CLP 741.000/año**.

---

## 6. Resumen ejecutivo

| Concepto | USD | UF | CLP |
|---|---:|---:|---:|
| Gasto real incurrido (3 meses) | 2.500 | 60,1 | 2.375.000 |
| Valor de reposición (central) | 18.000–28.000 | 433–673 | 17,1M–26,6M |
| Costo operativo actual | ≈ 0 / mes | ≈ 0 | ≈ 0 |
| Costo operativo si escala | ≈ 780 / año | ≈ 19,7 / año | ≈ 741.000 / año |

**Conclusión:** el proyecto se construyó con una inversión real muy baja (US$2.500 y
prácticamente US$0 de infraestructura), pero su **valor económico de mercado se estima
entre 433 y 673 UF** (US$18.000–28.000). Mantenerla operativa cuesta hoy casi nada; solo
al escalar aparecen costos mensuales moderados y acotados.

> Ver riesgos de costos en [PLAN-DE-RIESGOS](PLAN-DE-RIESGOS.md) (R-23) y estado general en
> [INFORME-FINAL](../INFORME-FINAL.md).

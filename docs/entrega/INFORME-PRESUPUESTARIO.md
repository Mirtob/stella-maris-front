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

## 6. Proyección de ingresos del canal de YouTube (reinversión en el proyecto)

El canal de YouTube (los videos de cantos y de Cursos) puede generar ingresos que, con el
tiempo, ayuden a **recuperar la inversión** y, sobre todo, a **financiar el proyecto**. La
política definida es que **toda ganancia se reinvierte** (ver §6.4).

### 6.1 Requisitos y supuestos (importante)

- **Monetización (YPP):** YouTube paga solo tras cumplir el **Programa de Socios**: ≥1.000
  suscriptores y ≥4.000 horas de reproducción en 12 meses (o 10M vistas de Shorts en 90 días).
  Hasta entonces el ingreso por anuncios es **US$0**.
- **RPM bajo de nicho:** contenido católico/musical en español para Chile/LatAm tiene un
  **RPM neto** (lo que recibe el canal por cada 1.000 visualizaciones, ya descontada la
  comisión de YouTube) típicamente de **US$0,5 – 1,5** — muy inferior a nichos como finanzas
  o tecnología en EE.UU. Solo una parte de las vistas se monetiza; eso ya está incorporado en
  el RPM usado.
- ⚠️ **Estas cifras son ilustrativas y NO garantizadas.** El crecimiento del canal depende de
  la constancia de publicación y de la audiencia.

### 6.2 Escenarios a 3 años (solo ingreso por anuncios)

> Supuestos de conversión: 1 USD = CLP 950; 1 UF ≈ US$41,6 (§1).

| Escenario | Año | Vistas/mes (fin de año) | RPM | Ingreso anual (USD) | Acumulado (USD) | Acum. (UF) |
|---|---|---:|---:|---:|---:|---:|
| **Conservador** | 1 | 10.000 | 0,7 | ~40 | 40 | 1,0 |
| | 2 | 30.000 | 0,8 | ~290 | 330 | 7,9 |
| | 3 | 60.000 | 0,9 | ~650 | ~980 | 23,6 |
| **Moderado** | 1 | 25.000 | 1,0 | ~150 | 150 | 3,6 |
| | 2 | 80.000 | 1,1 | ~1.060 | 1.210 | 29,1 |
| | 3 | 180.000 | 1,2 | ~2.590 | ~3.800 | 91,3 |
| **Optimista** | 1 | 60.000 | 1,2 | ~430 | 430 | 10,3 |
| | 2 | 200.000 | 1,3 | ~3.120 | 3.550 | 85,3 |
| | 3 | 500.000 | 1,5 | ~9.000 | ~12.550 | 301,7 |

### 6.3 ¿Cuándo se recupera la inversión real (US$2.500 ≈ 60 UF)?

| Escenario | Punto de recuperación de los US$2.500 |
|---|---|
| Conservador | Más allá de 3 años (aprox. **año 5–6**) |
| Moderado | Durante el **año 3** (el acumulado cruza los US$2.500 a mitad del año 3) |
| Optimista | Durante el **año 2** |

> Solo con anuncios, y siendo realistas, la recuperación es **lenta** (2 a 6 años). El canal
> se entiende mejor como una **fuente de financiamiento que crece de a poco**, no como retorno
> rápido.

### 6.4 Otras vías de ingreso y modelo de reinversión

- **Complementos de YouTube:** membresías del canal, "Súper Gracias"/Súper Chat, que en una
  comunidad fiel pueden superar al ingreso por anuncios.
- **Donaciones/aportes** de parroquias y fieles (fuera de YouTube).
- **Modelo de reinversión (definido):** el 100% de lo recaudado se destina a **recursos del
  proyecto** — equipos de grabación, **honorarios del desarrollador**, **honorarios de
  profesores de música**, organización de **cursos** y producción de contenido. No hay
  extracción de utilidades; el objetivo es la **sostenibilidad** de la obra.

### 6.5 Riesgo relevante

Los **derechos de autor** de cantos/partituras/audio pueden **desmonetizar** videos o
derivar el ingreso al titular de los derechos. Mitigación: usar contenido **propio, con
licencia o de dominio público** (ver R-18 en [PLAN-DE-RIESGOS](PLAN-DE-RIESGOS.md)).

---

## 7. Resumen ejecutivo

| Concepto | USD | UF | CLP |
|---|---:|---:|---:|
| Gasto real incurrido (3 meses) | 2.500 | 60,1 | 2.375.000 |
| Valor de reposición (central) | 18.000–28.000 | 433–673 | 17,1M–26,6M |
| Costo operativo actual | ≈ 0 / mes | ≈ 0 | ≈ 0 |
| Costo operativo si escala | ≈ 780 / año | ≈ 19,7 / año | ≈ 741.000 / año |
| Ingreso YouTube 3 años (moderado) | ~3.800 | ~91 | ~3,6M |
| Recuperación de los US$2.500 | año 2–6 según escenario | | |

**Conclusión:** el proyecto se construyó con una inversión real muy baja (US$2.500 y
prácticamente US$0 de infraestructura), pero su **valor económico de mercado se estima
entre 433 y 673 UF** (US$18.000–28.000). Mantenerla operativa cuesta hoy casi nada. El
**canal de YouTube** puede recuperar la inversión de US$2.500 en un plazo de **2 a 6 años**
según el escenario, y sus ingresos **se reinvierten íntegramente** en el proyecto (equipos,
honorarios de desarrollo y de profesores, cursos). El canal es, por tanto, un motor de
**sostenibilidad** más que de utilidad.

> Ver riesgos de costos en [PLAN-DE-RIESGOS](PLAN-DE-RIESGOS.md) (R-23) y estado general en
> [INFORME-FINAL](../INFORME-FINAL.md).

# Stella Maris — Cantoral Litúrgico Católico

Aplicación móvil (PWA) para coros católicos: una plataforma tipo "Spotify litúrgico"
que permite a los coros armar y publicar cantorales, y a los fieles seguir la Misa
escuchando los cantos, con partituras, calendario litúrgico y notificaciones.

**App en producción:** https://stella-maris-front.vercel.app/

Diseño original en Figma: https://www.figma.com/design/G1T7TUUDnzENKxoqhUJtzm/Aplicaci%C3%B3n-M%C3%B3vil-para-Coros

---

## Cómo correr el proyecto

```bash
npm i          # instalar dependencias
npm run dev    # servidor de desarrollo (Vite) en http://localhost:5173
npm run build  # build de producción → build/
```

Otros scripts:

```bash
npm run gen:calendar   # regenera el calendario litúrgico (scripts/genLiturgicalCalendar.mjs)
```

Stack: **React 18 + TypeScript + Vite**, **Tailwind CSS v4**, **Radix UI**, **Supabase**
(PostgreSQL + RLS + Storage), **Google OAuth / YouTube / Drive**, PDF con **pdfjs-dist**.

---

## Manuales de usuario

Guías según el rol de cada persona. Disponibles en Markdown y PDF en
[`docs/manuales/`](docs/manuales/README.md):

| Manual | Para quién | Contenido |
|---|---|---|
| [Pueblo fiel](docs/manuales/MANUAL-PUEBLO-FIEL.md) 🙏 | Fieles que siguen la Misa | Instalar la app, elegir parroquia/capilla, ver y **escuchar los cantos** (modo radio), notificaciones, QR. |
| [Coro](docs/manuales/MANUAL-CORO.md) 🎵 | Miembros del coro | **Armar y publicar cantorales**, calendario litúrgico, color y revisión litúrgica, QR + folleto PDF, publicados/historial, cursos. |
| [Canal y Contenido](docs/manuales/MANUAL-CANAL-Y-CONTENIDO.md) 🎬 | Encargado del canal / Administrador | Subir videos con metadatos, partituras en Drive, **sincronizar YouTube → app**, herramientas de administración, seguridad del canal. |

PDFs: [`docs/manuales/pdf/`](docs/manuales/pdf).

---

## Estructura del proyecto

```
.
├─ api/                     # Funciones serverless (Vercel): pdf, sheets, suggest
├─ docs/
│  ├─ manuales/             # Manuales de usuario (Pueblo fiel, Coro, Canal) + PDFs
│  ├─ dev/                  # Documentación técnica interna (arquitectura, BD, OAuth, QA…)
│  ├─ BACKUP-SETUP.md
│  ├─ RECOVERY-PROCEDURE.md
│  └─ SENTRY-SETUP.md
├─ public/                  # Estáticos, manifest PWA, íconos
├─ scripts/                 # Scripts de build (p. ej. generación del calendario litúrgico)
├─ supabase/migrations/     # Migraciones SQL (esquema, RLS, storage)
├─ tests/                   # Smoke/PWA, integración, estrés, checks SQL, QA manual
└─ src/
   ├─ App.tsx               # Raíz de la app y enrutado por estado
   ├─ main.tsx              # Entry point + Sentry
   ├─ types.ts              # Tipos compartidos
   ├─ index.css             # Estilos globales (Tailwind v4)
   ├─ components/           # Componentes de UI agrupados por dominio
   │  ├─ admin/             #   Dashboard y herramientas de administración / catálogo
   │  ├─ auth/              #   Login y callback OAuth
   │  ├─ cantoral/          #   Armado, vista previa, publicación e historial de cantorales
   │  ├─ courses/           #   Cursos (teoría e instrumentos musicales)
   │  ├─ layout/            #   Header, sidebar, home, banners y navegación
   │  ├─ liturgy/           #   Calendario, color, sugerencias y alertas litúrgicas
   │  ├─ profile/           #   Perfil, parroquias, roles y recuperación de cuenta
   │  ├─ songs/             #   Catálogo, reproductor, partituras y letras/acordes
   │  ├─ common/            #   Genéricos reutilizables (diálogos, estados, NotFound…)
   │  ├─ ui/                #   Primitivas shadcn/Radix (no tocar salvo el design system)
   │  ├─ legal/             #   Términos y política de privacidad
   │  └─ figma/             #   Helpers de assets de Figma
   ├─ services/             # IO y backend (Supabase, Google, YouTube, Drive, Sentry…)
   ├─ utils/                # Lógica pura (litúrgica, transposición, PDF, fechas, búsqueda)
   ├─ hooks/                # React hooks (useSongs, useWakeLock, useGeminiSuggestions)
   ├─ contexts/             # Contextos de React (tema)
   ├─ config/               # Configuración (endpoints/API)
   ├─ data/                 # Datos estáticos (diócesis, calendario, ordinario, mocks)
   ├─ scripts/              # Scripts del lado app (migración de catálogo)
   ├─ assets/               # Recursos importados
   └─ styles/               # Estilos adicionales
```

### Convenciones

- **Componentes por dominio:** cada feature vive en su carpeta bajo `src/components/`.
  Las primitivas de UI (`ui/`, shadcn/Radix) se mantienen aisladas de la lógica de negocio.
- **Capas separadas:** `services/` (IO) ↔ `utils/` (lógica pura) ↔ `data/` (datos estáticos).
  Los componentes consumen servicios/hooks, no hacen IO directo cuando se puede evitar.
- **Imports relativos** superficiales; no hay alias de rutas.

---

## Documentación técnica

La documentación interna de desarrollo está en [`docs/dev/`](docs/dev/) (arquitectura,
esquema de base de datos, integración OAuth/YouTube, guías de QA, etc.).

## Pruebas

Ver [`tests/COMO-CORRER.md`](tests/COMO-CORRER.md). Resumen rápido:

```bash
node tests/pwa/smoke-headless.mjs       # smoke headless contra producción
node tests/integration/run-all.mjs      # RLS / RPC / CORS (requiere .env)
```

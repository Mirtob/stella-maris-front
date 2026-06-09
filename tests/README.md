# Plan de Pruebas — Stella Maris

Pruebas integrales, de estrés y de humo para el backend de Stella Maris.

## Estructura

```
tests/
├── integration/      Scripts Node ejecutables (Supabase + Vercel)
│   └── run-all.mjs   Master runner
├── sql/              Queries para ejecutar en el SQL Editor de Supabase
│   └── checks.sql
├── stress/           Pruebas de carga controlada
│   └── rate-limit.mjs
├── smoke/            Checklist manual (browser + móvil)
│   └── CHECKLIST.md
└── INFORME.md        Template del informe — completar con los resultados
```

## Cómo correr todo

### 1. Setup

```bash
# Desde la raíz del proyecto
cp .env.local tests/.env

# Verifica que .env contenga al menos:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
#   VITE_YOUTUBE_API_KEY
#   PUBLIC_BASE_URL  (https://tu-dominio.vercel.app)
```

### 2. Pruebas integradas (10-15 min)

```bash
node tests/integration/run-all.mjs
```

Outputs `PASS`/`FAIL` por suite. Verifica:
- RLS de `published_cantorals` (no se puede modificar fila ajena)
- RLS de `songs` (lectura pública, modificación solo admin)
- RPC `search_songs` con todos los combos de filtros
- Storage policy `is_cantoral_pdf_owner` rechaza paths inválidos
- Deep link `/c/:id` rechaza UUIDs ajenos a `published`
- CORS allow-list bloquea origenes fuera de whitelist

### 3. Queries SQL (5 min)

Abrir `tests/sql/checks.sql` y ejecutar bloque por bloque en el **SQL Editor de Supabase**. Verifica:
- Tabla `admins` tiene exactamente los emails esperados
- `is_admin()` devuelve `TRUE` solo para admin
- RLS habilitada en todas las tablas críticas
- Storage bucket `cantorales-pdf` existe y es público
- Triggers de `created_by` y `updated_at` activos

### 4. Pruebas de estrés (5 min, carga baja)

```bash
node tests/stress/rate-limit.mjs
```

Dispara 35 requests en 60s a `/api/sheets` y `/api/pdf?id=...`. Verifica:
- Recibe **algunos** 429 (rate limit funcionando)
- Headers `X-RateLimit-*` presentes
- No tira al servidor

### 5. Smoke test manual (30-45 min)

Seguir `tests/smoke/CHECKLIST.md` con un teléfono real conectado al dominio de producción. Va marcando cada caso.

## Cómo armar el informe

`tests/INFORME.md` es un template. Después de correr todo:

1. Pegar el output de `run-all.mjs` en la sección **Integradas**
2. Pegar las filas devueltas por `checks.sql` en la sección **SQL**
3. Pegar las stats de `rate-limit.mjs` en **Estrés**
4. Marcar los checks del smoke en **Caja Negra**
5. Llenar la sección **Hallazgos** con cualquier FAIL observado

El informe queda listo para enviarse al inversor.

## Limitaciones honestas

- Stress es **bajo** (30 req/min) por requerimiento explícito. No simula tráfico viral.
- No probamos quota real de Google Drive/YouTube — esos endpoints están cacheados 1h.
- Tests integrados usan la `anon key`, no `service_role`. Eso es correcto: las pruebas confirman lo que un usuario normal puede o no puede hacer.
- El admin-side requiere ejecutar el SQL manualmente porque la `anon key` no tiene privilegios sobre `auth.users`.

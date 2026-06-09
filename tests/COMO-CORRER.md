# Cómo correr las pruebas — paso a paso

## Opción 1 — Con el script automático (recomendado, PowerShell)

Abre **PowerShell** en la carpeta del proyecto:

```powershell
cd "C:\Users\gusta\Downloads\Aplicación Móvil para Coros (front)"
.\tests\run-tests.ps1
```

Si te dice que no puede ejecutar el script por política de seguridad:

```powershell
powershell -ExecutionPolicy Bypass -File tests\run-tests.ps1
```

El script:
1. ✅ Verifica que Node.js esté instalado
2. ✅ Copia `.env.local` → `tests/.env` si no existe
3. ✅ Te pregunta la `PUBLIC_BASE_URL` si no está
4. ▶️ Corre las pruebas integradas
5. ❓ Te pregunta si querés correr el estrés (es opt-in)
6. 📁 Guarda los outputs en `tests/output/`
7. 📋 Te recuerda los pasos manuales pendientes

---

## Opción 2 — Manual, comando por comando

### Setup (una sola vez)

```powershell
# Copiar variables de entorno
Copy-Item .env.local tests/.env

# Agregar PUBLIC_BASE_URL al final
Add-Content tests/.env "`nPUBLIC_BASE_URL=https://tu-dominio.vercel.app"
```

### Tests integrales (5 min)

```powershell
node tests/integration/run-all.mjs
```

Output: `PASS`/`FAIL` por caso + JSON al final.
**Guardalo:** copia/pega en `tests/INFORME.md` sección 3.

### Tests de estrés (3 min)

```powershell
node tests/stress/rate-limit.mjs
```

Output: 35 requests con códigos HTTP + resumen.
**Guardalo:** copia/pega en `tests/INFORME.md` sección 5.

---

## Lo que sigue (manual)

### 3. SQL Editor de Supabase (10 min)

- Abre el archivo `tests/sql/checks.sql` en tu editor de texto
- Andá al dashboard de Supabase → SQL Editor
- Copiá cada bloque (cada uno empieza con `-- 1.`, `-- 2.`, etc.)
- Pegalo en el editor y dale "Run"
- Anotá los resultados en `tests/INFORME.md` sección 4

### 4. Smoke test mobile (45 min)

- Abre `tests/smoke/CHECKLIST.md` en tu teléfono o impreso
- Andá al dominio de producción desde tu celular real
- Marcá cada `[ ]` mientras vas probando

---

## Cuál es cuál — referencia rápida

| Archivo | Ejecutar dónde | Para qué |
|---|---|---|
| `tests/integration/run-all.mjs` | **Terminal** (Node) | RLS, RPC, CORS |
| `tests/sql/checks.sql` | **SQL Editor de Supabase** | Policies, índices, integridad |
| `tests/stress/rate-limit.mjs` | **Terminal** (Node) | Rate limit funciona |
| `tests/smoke/CHECKLIST.md` | **Celular real, manual** | UX end-to-end |
| `tests/INFORME.md` | **Editor de texto** | Reunir todos los resultados |
| `tests/run-tests.ps1` | **PowerShell** | Automatiza los 2 primeros |

---

## Problemas comunes

### `node : The term 'node' is not recognized`
Instalá Node.js desde https://nodejs.org (LTS).

### `Cannot find module '@supabase/supabase-js'`
Corré `npm install` en la raíz del proyecto.

### `ECONNREFUSED` en los tests integrados
Verificá que `VITE_SUPABASE_URL` en `tests/.env` esté bien y que tengas internet.

### El SQL Editor te tira `syntax error at "{"`
Estás intentando ejecutar el archivo `.mjs` ahí. Ese archivo es de Node, no de SQL.
Usá `tests/sql/checks.sql` para el SQL Editor.

### Los tests de `/api/...` dan timeout
La función serverless está en cold start. Esperá 30 segundos y volvé a correr.

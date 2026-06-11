# Procedimiento de Recovery de Cuenta

> Para el administrador. Aplicar SOLO cuando un usuario nos contacta porque perdió acceso a su cuenta.

## Cuándo aplicar este procedimiento

El usuario A te escribe (WhatsApp, presencial) y dice una de estas:

1. "Cambié de email y no puedo entrar a la app con el viejo."
2. "Me hackearon la cuenta de Google."
3. "Dejé el coro y le pasé el rol a otra persona pero no puede ver los cantorales."
4. "Borré la app y al instalarla otra vez no me reconoce."

## Paso 1 — Verificar identidad (FUERA de banda)

**Antes de tocar nada en la app.** No basta con el email que te diga.

- Si el usuario es un **coro**: hablar con el sacerdote o coordinador litúrgico de la parroquia y confirmar.
- Si el usuario es **pueblo fiel**: pedirle que confirme su parroquia + alguna info que solo él sabría (último cantoral que descargó, fecha aproximada).
- Si NO podés verificar identidad → **no procedas**. Mejor pecar de cuidadoso.

## Paso 2 — Encontrar el perfil viejo

En la app, como Admin:

1. **Panel Administrativo → Recuperación de Cuentas**.
2. Escribí el email que el usuario te dio. La búsqueda matchea contra:
   - `email` (su email Google original)
   - `recovery_email` (el email de respaldo que él mismo configuró en Configuración)
3. Si hay match → el badge "Respaldo:" indica si el match fue por email principal o de respaldo.

## Paso 3 — Decidir el flujo

### Flujo A — Borrar perfil viejo, usuario rehace setup

**Cuándo:** el usuario ya hizo un nuevo login con su email actual y solo necesita "limpiar" el perfil viejo que tiene rol/parroquia equivocados.

1. Tocar **Eliminar perfil viejo**.
2. Confirmar en el diálogo.
3. Avisar al usuario: "Listo, abrí la app y vas a ver el onboarding y el setup. Configurá tu rol y parroquia como siempre."

> El usuario hará setup fresh. Sus cantorales viejos (publicados con su user_id anterior) **no aparecerán** asociados a él, pero seguirán siendo visibles para el resto de la parroquia.

### Flujo B — Transferir cantorales del perfil viejo a una cuenta nueva

**Cuándo:** el usuario perdió ACCESO TOTAL (cuenta Google hackeada) y necesita ver sus cantorales antiguos desde la nueva cuenta.

> Esto NO se hace desde la UI — requiere SQL en Supabase. Hacelo solo si es realmente necesario.

#### Pre-requisitos

- El usuario ya inició sesión con su nueva cuenta Google (para que su nuevo user_id exista en `auth.users`).
- Tenés el `id` del perfil viejo (lo ves en la UI de Recovery: `🆔 xxxxxxxx…`).
- Tenés el email de la cuenta nueva.

#### Pasos en Supabase SQL Editor

```sql
-- 1. Encontrar el user_id NUEVO (con el email nuevo)
SELECT id, email FROM auth.users WHERE lower(email) = lower('email-nuevo@gmail.com');
-- Anotar el UUID que devuelve. Llamémoslo NEW_ID.

-- 2. Encontrar el user_id VIEJO (con el email original o de respaldo)
SELECT id, email FROM auth.users WHERE lower(email) = lower('email-viejo@gmail.com');
-- Anotar el UUID. Llamémoslo OLD_ID.

-- 3. ANTES de tocar nada, ver qué hay
SELECT id, choir_name, parish_name, date, liturgical_date
FROM public.published_cantorals
WHERE created_by = 'OLD_ID-aqui';

-- 4. Transferir los cantorales
UPDATE public.published_cantorals
SET created_by = 'NEW_ID-aqui'
WHERE created_by = 'OLD_ID-aqui';

-- 5. Borrar el perfil viejo (si existe)
DELETE FROM public.user_profiles WHERE id = 'OLD_ID-aqui';

-- 6. Verificar
SELECT COUNT(*) FROM public.published_cantorals WHERE created_by = 'NEW_ID-aqui';
```

> **No borres `auth.users` del email viejo** salvo que el usuario lo pida explícitamente. Si solo perdió acceso, su cuenta Google sigue existiendo del lado de Google — nuestro DELETE no afecta eso.

#### Después de la transferencia

- El usuario debe **cerrar y abrir la app** con su cuenta nueva. Va a ver el ProfileSetup vacío (lógico, no tiene perfil) y al completarlo, los cantorales viejos ya estarán asociados a su `created_by` nuevo.

## Paso 4 — Documentar

Cualquier recovery → anotar en un Google Doc compartido con el equipo:

```
Fecha: 2026-06-10
Usuario: Juan Pérez
Email viejo: juan.perez@gmail.com
Email nuevo: jperez85@outlook.com
Identidad verificada por: WhatsApp con Padre Andrés (Parroquia Stella Maris)
Flujo aplicado: B (transferencia de 14 cantorales)
Admin que ejecutó: gustavus.tobar@gmail.com
```

Es necesario para auditoría legal (Ley 19.628) y para detectar patrones sospechosos (si la misma persona pide recovery 3 veces en un mes, algo raro pasa).

## Reglas

- ❌ **NUNCA** ejecutes recovery sin verificar identidad fuera de banda.
- ❌ **NUNCA** transfieras cantorales sin que el usuario haya iniciado sesión con la nueva cuenta primero (el `auth.users` nuevo tiene que existir).
- ❌ **NUNCA** borres rows en `auth.users` desde el SQL Editor (eso lo gestiona Supabase Auth).
- ✅ **SIEMPRE** documentá el recovery en el log compartido.
- ✅ **SIEMPRE** preferí el Flujo A (más simple) al Flujo B (más invasivo) si el usuario no tiene cantorales que rescatar.

## Anti-patrones a evitar

- "El usuario me dijo que es él, le creo." → No alcanza. Verificá.
- "Le borro la cuenta vieja y listo." → Si tenía cantorales publicados, perdés el `created_by` y el RLS de UPDATE/DELETE se rompe para esos cantorales — el nuevo dueño nunca podrá editarlos.
- "Cambio el `recovery_email` por el del nuevo." → Eso no transfiere acceso, solo cambia el email de respaldo. La cuenta Google sigue siendo la vieja.

## Tiempos esperados

| Flujo | Tiempo del admin |
|---|---|
| A — Borrar perfil viejo | 2 min |
| B — Transferir cantorales (SQL) | 10 min |
| Verificación de identidad | Variable (10 min – 1 día) |

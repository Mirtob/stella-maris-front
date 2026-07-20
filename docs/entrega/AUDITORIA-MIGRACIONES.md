# Auditoría de migraciones (antes de producción)

Como las migraciones se aplicaron **a mano**, este check verifica que TODAS estén
aplicadas en la BD de producción. Una migración faltante rompe en silencio.

## Cómo usar
1. Abre **Supabase → SQL Editor** (proyecto `szoaiiipglebpewwzfgh`).
2. Pega y ejecuta el bloque **VERIFICACIÓN** de abajo.
3. Revisa la columna `estado`: todo debe decir `OK`. Cualquier **`❌ FALTA`** = aplica la
   migración correspondiente (ver la tabla de referencia) y vuelve a correr.

---

## VERIFICACIÓN (pegar en el SQL Editor)

```sql
WITH checks(tipo, objeto, ok) AS (
  -- ── Tablas ────────────────────────────────────────────────────────────────
  SELECT 'tabla','public.songs',                 to_regclass('public.songs')                 IS NOT NULL UNION ALL
  SELECT 'tabla','public.admins',                to_regclass('public.admins')                IS NOT NULL UNION ALL
  SELECT 'tabla','public.published_cantorals',   to_regclass('public.published_cantorals')   IS NOT NULL UNION ALL
  SELECT 'tabla','public.user_profiles',         to_regclass('public.user_profiles')         IS NOT NULL UNION ALL
  SELECT 'tabla','public.chapels',               to_regclass('public.chapels')               IS NOT NULL UNION ALL
  SELECT 'tabla','public.api_rate_limits',       to_regclass('public.api_rate_limits')       IS NOT NULL UNION ALL
  SELECT 'tabla','public.custom_parishes',       to_regclass('public.custom_parishes')       IS NOT NULL UNION ALL
  SELECT 'tabla','public.custom_liturgical_dates', to_regclass('public.custom_liturgical_dates') IS NOT NULL UNION ALL
  SELECT 'tabla','public.push_subscriptions',    to_regclass('public.push_subscriptions')    IS NOT NULL UNION ALL
  SELECT 'tabla','public.survey_responses',      to_regclass('public.survey_responses')      IS NOT NULL UNION ALL
  SELECT 'tabla','public.choir_contacts',        to_regclass('public.choir_contacts')        IS NOT NULL UNION ALL
  SELECT 'tabla','public.course_progress',       to_regclass('public.course_progress')       IS NOT NULL UNION ALL
  SELECT 'tabla','public.course_quizzes',        to_regclass('public.course_quizzes')        IS NOT NULL UNION ALL
  SELECT 'tabla','public.course_videos',         to_regclass('public.course_videos')         IS NOT NULL UNION ALL
  SELECT 'tabla','public.song_favorites',        to_regclass('public.song_favorites')        IS NOT NULL UNION ALL
  -- ── Esquema privado ───────────────────────────────────────────────────────
  SELECT 'esquema','private', EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name='private') UNION ALL
  -- ── Funciones ─────────────────────────────────────────────────────────────
  SELECT 'función','public.is_admin',                     EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'  AND p.proname='is_admin') UNION ALL
  SELECT 'función','public.search_songs',                 EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'  AND p.proname='search_songs') UNION ALL
  SELECT 'función','public.set_cantoral_created_by',      EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'  AND p.proname='set_cantoral_created_by') UNION ALL
  SELECT 'función','public.api_rate_limit',               EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'  AND p.proname='api_rate_limit') UNION ALL
  SELECT 'función','public.enforce_principal_admin_role_change', EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='enforce_principal_admin_role_change') UNION ALL
  SELECT 'función','private.is_cantoral_pdf_owner',       EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='private' AND p.proname='is_cantoral_pdf_owner') UNION ALL
  -- Debe estar AUSENTE (la eliminó storage_fn_private / storage_pdf_owner_fix):
  SELECT 'ausente(correcto)','public.is_cantoral_pdf_owner NO debe existir', NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='is_cantoral_pdf_owner') UNION ALL
  -- ── Columnas ──────────────────────────────────────────────────────────────
  SELECT 'columna','published_cantorals.pdf_url',   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='published_cantorals' AND column_name='pdf_url') UNION ALL
  SELECT 'columna','published_cantorals.created_by',EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='published_cantorals' AND column_name='created_by') UNION ALL
  SELECT 'columna','published_cantorals.vigil',     EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='published_cantorals' AND column_name='vigil') UNION ALL
  SELECT 'columna','published_cantorals.mass_type', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='published_cantorals' AND column_name='mass_type') UNION ALL
  SELECT 'columna','published_cantorals.garland',   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='published_cantorals' AND column_name='garland') UNION ALL
  SELECT 'columna','published_cantorals.pdf_font',  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='published_cantorals' AND column_name='pdf_font') UNION ALL
  SELECT 'columna','published_cantorals.pdf_size',  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='published_cantorals' AND column_name='pdf_size') UNION ALL
  SELECT 'columna','songs.is_liturgical',           EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='songs' AND column_name='is_liturgical') UNION ALL
  SELECT 'columna','songs.non_liturgical_category', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='songs' AND column_name='non_liturgical_category') UNION ALL
  SELECT 'columna','songs.extra_moments',           EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='songs' AND column_name='extra_moments') UNION ALL
  SELECT 'columna','user_profiles.recovery_email',  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='recovery_email') UNION ALL
  SELECT 'columna','push_subscriptions.role',       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='push_subscriptions' AND column_name='role') UNION ALL
  SELECT 'columna','push_subscriptions.parishes',   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='push_subscriptions' AND column_name='parishes') UNION ALL
  SELECT 'columna','push_subscriptions.topics',     EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='push_subscriptions' AND column_name='topics') UNION ALL
  -- ── Policies clave ────────────────────────────────────────────────────────
  -- Storage INSERT debe llamar a private.is_cantoral_pdf_owner (fix del 42883):
  SELECT 'policy','storage insert → private.is_cantoral_pdf_owner', EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='cantorales_pdf_owner_insert' AND coalesce(with_check,'') LIKE '%private.is_cantoral_pdf_owner%') UNION ALL
  SELECT 'policy','storage update owner', EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='cantorales_pdf_owner_update') UNION ALL
  SELECT 'policy','storage delete owner', EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='cantorales_pdf_owner_delete') UNION ALL
  -- Celebraciones: lectura PÚBLICA (qual = true) del cld_public_read:
  SELECT 'policy','custom_liturgical_dates.cld_select pública (true)', EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custom_liturgical_dates' AND policyname='cld_select' AND coalesce(qual,'') = 'true') UNION ALL
  SELECT 'policy','custom_liturgical_dates.cld_insert', EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custom_liturgical_dates' AND policyname='cld_insert') UNION ALL
  SELECT 'policy','published_cantorals.cantorals_select', EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='published_cantorals' AND policyname='cantorals_select') UNION ALL
  -- push_subscriptions: RLS activa y SIN policies (solo service role):
  SELECT 'rls','push_subscriptions RLS activa', coalesce((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.push_subscriptions')), false) UNION ALL
  SELECT 'rls','push_subscriptions SIN policies (solo service role)', NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='push_subscriptions') UNION ALL
  -- song_favorites / choir_contacts / course_progress: RLS activa + con policies (acceso por usuario):
  SELECT 'rls','song_favorites RLS activa',  coalesce((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.song_favorites')),  false) UNION ALL
  SELECT 'policy','song_favorites tiene policies (por auth.uid())', EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='song_favorites') UNION ALL
  SELECT 'rls','choir_contacts RLS activa',  coalesce((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.choir_contacts')),  false) UNION ALL
  SELECT 'rls','course_progress RLS activa', coalesce((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.course_progress')), false) UNION ALL
  SELECT 'admin','2º admin stellamaris en public.admins', EXISTS(SELECT 1 FROM public.admins WHERE lower(email)='stellamarismusicacatolica@gmail.com') UNION ALL
  -- ── Índices / constraints ─────────────────────────────────────────────────
  SELECT 'índice','published_cantorals_mass_uk (única)', to_regclass('public.published_cantorals_mass_uk') IS NOT NULL UNION ALL
  SELECT 'índice','custom_liturgical_dates_uniq',        to_regclass('public.custom_liturgical_dates_uniq') IS NOT NULL UNION ALL
  SELECT 'índice','push_subscriptions_role_idx',         to_regclass('public.push_subscriptions_role_idx') IS NOT NULL UNION ALL
  -- CHECK de mass_moment con los momentos nuevos (si falta, el CRUD no guarda esos momentos):
  SELECT 'check','songs.mass_moment incluye padre_nuestro + tuyo_es_el_reino', EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid=to_regclass('public.songs') AND c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%padre_nuestro%' AND pg_get_constraintdef(c.oid) ILIKE '%tuyo_es_el_reino%') UNION ALL
  -- ── Storage bucket ────────────────────────────────────────────────────────
  SELECT 'bucket','storage.buckets cantorales-pdf', EXISTS(SELECT 1 FROM storage.buckets WHERE id='cantorales-pdf') UNION ALL
  -- ── Realtime ──────────────────────────────────────────────────────────────
  SELECT 'realtime','published_cantorals en supabase_realtime', EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='published_cantorals')
)
SELECT tipo, objeto, CASE WHEN ok THEN 'OK' ELSE '❌ FALTA' END AS estado
FROM checks
ORDER BY ok ASC, tipo, objeto;
```

> Los `❌ FALTA` salen arriba. Si todo dice `OK`, la BD está al día.

---

## Tabla de referencia (migración → qué crea → qué rompe si falta)

| Migración | Crea / cambia | Si falta, rompe… |
|---|---|---|
| `20260602_songs_catalog` | tabla `songs` (+ `is_liturgical`, `non_liturgical_category`), índices, `search_songs`, `update_updated_at` | Catálogo, buscador, gestor de cantos |
| `20260603_security_rls_admins` | tabla `admins`, `is_admin()`, `created_by`, RLS `published_cantorals`, `set_cantoral_created_by` | Permisos admin, publicar cantorales |
| `20260603_cantoral_pdf_storage` | columna `pdf_url`, bucket `cantorales-pdf` | PDF compartible del cantoral |
| `20260603_storage_strict_ownership` | `is_cantoral_pdf_owner` + policies del bucket | Subir PDF solo el dueño |
| `20260609_user_profiles` | tabla `user_profiles` + RLS | Perfiles permanentes / gestión de usuarios |
| `20260610_recovery_email` | `user_profiles.recovery_email` | Recuperación de clave (usuario/clave) |
| `20260612_functions_search_path` | fija `search_path` en funciones | Endurecimiento (linter); base de `is_admin` |
| `20260612_rls_initplan_perf` | reescribe policies con `(select …)` | Rendimiento RLS. ⚠️ **No re-aplicar sola** (rompe el INSERT de storage → 42883) |
| `20260612_songs_with_labels_security_invoker` | vista `songs_with_labels` security_invoker | Etiquetas de cantos |
| `20260612_storage_fn_private` | `private.is_cantoral_pdf_owner`, mueve policies a `private`, dropea la `public` | Subida de PDF (RLS) |
| `20260613_public_cantoral_read` | `cantorals_select` (lectura pública de publicados) | Pueblo fiel anónimo ve cantorales |
| `20260614_chapels` | tabla `chapels` | Capillas |
| `20260614_realtime_cantorals` | realtime en `published_cantorals` | Actualización en vivo de cantorales |
| `20260616` / `20260627_cantoral_unique_mass(_type)` | índice único de Misa (con `mass_type`) | Evitar cantorales duplicados por Misa/horario |
| `20260617_api_rate_limit` | tabla + `api_rate_limit()` | Rate limit distribuido de `api/*` |
| `20260619_custom_parishes` | tabla `custom_parishes` | Alta de parroquias por admin |
| `20260620_cantoral_vigil` | `published_cantorals.vigil` | Misa vespertina |
| `20260622_cantoral_mass_type` | `published_cantorals.mass_type` | I/II Vísperas |
| `20260625_song_extra_moments` | `songs.extra_moments` + `search_songs` | Canto multi-parte |
| `20260626_principal_admin_role_guard` | `enforce_principal_admin_role_change()` | Solo el admin principal cambia roles |
| `20260627_mass_moment_padre_nuestro` / `20260629_mass_moments_extra_parts` | amplía el CHECK de `mass_moment` | Guardar cantos en Padre Nuestro / partes nuevas |
| `20260630_cantoral_garland` | `published_cantorals.garland` | Guirnalda del folleto PDF |
| `20260701_cantoral_pdf_style` | `pdf_font`, `pdf_size` | Fuente/tamaño del folleto |
| **`20260701_storage_pdf_owner_fix`** | recrea policies de storage → `private.is_cantoral_pdf_owner`, dropea la `public` | **Fix del 42883 al subir el PDF** |
| **`20260702_custom_liturgical_dates`** | tabla `custom_liturgical_dates` + RLS | Celebraciones persistidas |
| **`20260702_cld_public_read`** | `cld_select` = `USING (true)` | Que el Pueblo fiel anónimo vea celebraciones |
| **`20260702_push_subscriptions`** | tabla `push_subscriptions` (RLS sin policies) | Notificaciones push |
| **`20260702_push_subscription_role`** | `push_subscriptions.role` | Recordatorio "publica el cantoral" al Coro |
| `20260706_survey_responses` | tabla `survey_responses` (INSERT anónimo) | Muestra pre-lanzamiento `/demo` |
| `20260708_add_admin_stellamaris` | 2º admin en `admins` | Acceso admin de la cuenta oficial |
| `20260708_choir_contacts` | tabla `choir_contacts` + RLS | Directorio / datos de contacto del coro |
| `20260708_course_progress` | tabla `course_progress` + RLS | Progreso/racha del Camino de formación |
| `20260708_course_ranking` | tabla/vista `course_ranking` | Ranking de cursos (hoy oculto por flag) |
| `20260709_course_quizzes` | tabla `course_quizzes` | Quizzes de las cápsulas |
| `20260709_course_videos` | tabla `course_videos` | Videos embebidos de las cápsulas |
| **`20260714_song_favorites`** | tabla `song_favorites` (RLS por `auth.uid()`) | Favoritos "Mis cantos" |

## Notas de orden
- Orden = alfabético por nombre de archivo (fecha). Aplica en ese orden.
- ⚠️ `20260612_rls_initplan_perf` debe quedar aplicado **antes** de `20260612_storage_fn_private` y de `20260701_storage_pdf_owner_fix`. Si por error se re-aplica **después**, vuelve a apuntar el INSERT de storage a `public.is_cantoral_pdf_owner` (que ya no existe) → **42883**. Solución: re-correr `20260701_storage_pdf_owner_fix`.

-- =============================================================================
-- STELLA MARIS — Verificaciones SQL desde el editor de Supabase
-- =============================================================================
-- Ejecutar bloque por bloque. Cada SELECT debe coincidir con el comentario
-- "Esperado:" inmediatamente arriba. Si difiere, anotar en el informe.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 1. ADMIN TABLE — solo gustavus.tobar@gmail.com debe estar
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: 1 fila con email = 'gustavus.tobar@gmail.com'
SELECT email, added_at, added_by FROM admins;

-- Esperado: TRUE solo si la query se corre logueado como ese admin
SELECT is_admin();


-- ─────────────────────────────────────────────────────────────────────────
-- 2. RLS ACTIVA en todas las tablas críticas
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: rowsecurity = true en TODAS estas filas
SELECT
  schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('songs', 'published_cantorals', 'admins', 'user_profiles')
ORDER BY tablename;


-- ─────────────────────────────────────────────────────────────────────────
-- 3. POLICIES por tabla
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: ver policies para cada tabla
-- published_cantorals → cantorals_select, cantorals_insert, cantorals_update, cantorals_delete
-- songs → songs_public_read, songs_admin_all
-- admins → admins_select_admin, admins_modify_admin
-- user_profiles → user_profiles_self_select/insert/update, user_profiles_admin_all
SELECT
  tablename,
  policyname,
  cmd as command,
  qual::text as using_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ─────────────────────────────────────────────────────────────────────────
-- 4. STORAGE BUCKET cantorales-pdf
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: una fila, public = true
SELECT id, name, public, created_at FROM storage.buckets WHERE id = 'cantorales-pdf';

-- Esperado: cuatro policies (public_read, owner_insert, owner_update, owner_delete)
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
  AND policyname LIKE '%cantorales_pdf%'
ORDER BY policyname;


-- ─────────────────────────────────────────────────────────────────────────
-- 5. TABLA SONGS — sanity check
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: count > 0 (debería ser ~989 si se ejecutó migrateMockSongsToSupabase)
SELECT COUNT(*) AS total_cantos FROM songs;

-- Esperado: distribución por mass_moment (Entrada, Comunión, Salida, etc.)
SELECT mass_moment, COUNT(*) AS cantidad
FROM songs
WHERE approval_status = 'approved'
GROUP BY mass_moment
ORDER BY cantidad DESC;

-- Esperado: TODOS los youtube_id son únicos (UNIQUE constraint)
SELECT youtube_id, COUNT(*) AS dup
FROM songs
WHERE youtube_id IS NOT NULL
GROUP BY youtube_id
HAVING COUNT(*) > 1;
-- Si esto devuelve filas → hay duplicados, ROTO


-- ─────────────────────────────────────────────────────────────────────────
-- 6. PUBLISHED CANTORALS — integridad de columna pdf_url y created_by
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: columnas pdf_url y created_by existen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'published_cantorals'
  AND column_name IN ('pdf_url', 'created_by', 'status', 'parish_name');

-- Esperado: si hay cantorales recientes, deberían tener created_by no nulo
SELECT
  COUNT(*) FILTER (WHERE created_by IS NOT NULL) AS con_creator,
  COUNT(*) FILTER (WHERE created_by IS NULL) AS sin_creator,
  COUNT(*) FILTER (WHERE pdf_url IS NOT NULL) AS con_pdf,
  COUNT(*) AS total
FROM published_cantorals;


-- ─────────────────────────────────────────────────────────────────────────
-- 7. FUNCIÓN is_cantoral_pdf_owner — verificar formato
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: TRUE solo si el cantoral con ese UUID es del admin actual
-- Reemplazar el UUID por uno real de la tabla
SELECT is_cantoral_pdf_owner('00000000-0000-0000-0000-000000000000.pdf');

-- Esperado: FALSE — formato inválido
SELECT is_cantoral_pdf_owner('hack.pdf');
SELECT is_cantoral_pdf_owner('../etc/passwd');
SELECT is_cantoral_pdf_owner('not-a-uuid.pdf');


-- ─────────────────────────────────────────────────────────────────────────
-- 8. USER_PROFILES — ¿se están persistiendo los logins?
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: count > 0 si ya pasó algún usuario por el flujo de login
SELECT COUNT(*) AS total_perfiles FROM user_profiles;

-- Esperado: distribución por rol — debería incluir al menos un Admin
SELECT role, COUNT(*) AS cantidad
FROM user_profiles
GROUP BY role;

-- Esperado: el email admin existe como Admin
SELECT email, role, last_seen_at
FROM user_profiles
WHERE role = 'Admin'
ORDER BY last_seen_at DESC;


-- ─────────────────────────────────────────────────────────────────────────
-- 9. ÍNDICES — confirmar que están creados
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: índices GIN para liturgical_seasons e instruments + scalar moment
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'songs'
ORDER BY indexname;


-- ─────────────────────────────────────────────────────────────────────────
-- 10. TRIGGERS activos
-- ─────────────────────────────────────────────────────────────────────────

-- Esperado: triggers updated_at en songs y user_profiles + set_created_by en published_cantorals
SELECT event_object_table, trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;


-- ─────────────────────────────────────────────────────────────────────────
-- 11. PUBLICAR EXIGE SER CORO (regresión del auto-ataque del 23-ago-2026)
-- ─────────────────────────────────────────────────────────────────────────
-- Antes, `cantorals_insert` solo pedía estar autenticado: una cuenta cualquiera
-- de Pueblo fiel publicaba un cantoral visible para todos (comprobado en
-- producción). Ver migración 20260823_publish_requires_choir.
--
-- Esperado: la política de INSERT de published_cantorals y la de
-- custom_liturgical_dates mencionan is_choir_or_admin.
SELECT tablename, policyname, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN ('cantorals_insert', 'cld_insert')
ORDER BY tablename;

-- Esperado: la función existe, es SECURITY DEFINER y tiene search_path vacío.
SELECT p.proname,
       p.prosecdef                       AS security_definer,
       pg_get_function_result(p.oid)     AS devuelve,
       p.proconfig                       AS config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'is_choir_or_admin';


-- ─────────────────────────────────────────────────────────────────────────
-- 12. PUBLICAR SOLO EN LA PARROQUIA PROPIA (migración 20260824)
-- ─────────────────────────────────────────────────────────────────────────
-- Un coro de la parroquia A podía publicar un cantoral —o agregar una celebración—
-- en la parroquia B. Ver 20260824_scope_por_parroquia y
-- tests/security/parroquia-ajena.mjs.
--
-- Esperado: las tres políticas mencionan user_covers_parish.
SELECT tablename, policyname, cmd, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN ('cantorals_insert', 'cantorals_update', 'cld_insert')
ORDER BY tablename, policyname;

-- Esperado: la función existe, SECURITY DEFINER y con search_path vacío.
SELECT p.proname, p.prosecdef AS security_definer, p.proconfig AS config
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('user_covers_parish', 'is_choir_or_admin');

-- Cuántos perfiles NO declaran parroquia (a esos la política no los bloquea, a
-- propósito). Si el número es alto, conviene revisar por qué no sincronizan.
SELECT count(*) AS perfiles_sin_parroquia
FROM user_profiles
WHERE COALESCE(array_length(parishes, 1), 0) = 0
  AND COALESCE(btrim(parish_name), '') = '';

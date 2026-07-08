-- =============================================================================
-- STELLA MARIS — Ranking amistoso de coros (formación)
-- Migration: 20260708_course_ranking
--
-- Agrega por PARROQUIA cuántas cápsulas completó su coro (sin exponer datos
-- individuales). SECURITY DEFINER para poder leer el progreso de todos, pero solo
-- devuelve totales por parroquia. Cualquier usuario autenticado puede consultarlo.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.course_ranking()
RETURNS TABLE(parish TEXT, capsules BIGINT, members BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT up.parish_name AS parish,
         count(cp.capsule_id) AS capsules,
         count(DISTINCT cp.user_id) AS members
  FROM public.course_progress cp
  JOIN public.user_profiles up ON up.id = cp.user_id
  WHERE up.parish_name IS NOT NULL AND btrim(up.parish_name) <> ''
  GROUP BY up.parish_name
  ORDER BY capsules DESC, members DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.course_ranking() TO authenticated;

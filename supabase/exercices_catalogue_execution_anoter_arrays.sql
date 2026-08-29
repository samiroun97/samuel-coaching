-- ══════════════════════════════════════════════════════════════
-- Convertit execution/a_noter en tableaux de texte (au lieu d'une
-- phrase unique) pour accueillir les vraies instructions étape par
-- étape et la liste d'erreurs fréquentes du pack MoveKit, plutôt que
-- mes phrases condensées. Le contenu existant est conservé comme
-- premier élément du tableau en attendant la traduction catégorie
-- par catégorie.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.exercices_catalogue
  ALTER COLUMN execution TYPE text[] USING CASE WHEN execution IS NULL THEN NULL ELSE ARRAY[execution] END,
  ALTER COLUMN a_noter TYPE text[] USING CASE WHEN a_noter IS NULL THEN NULL ELSE ARRAY[a_noter] END;

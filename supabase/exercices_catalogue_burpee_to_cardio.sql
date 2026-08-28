-- ══════════════════════════════════════════════════════════════
-- Déplace les burpees dans la catégorie cardio (muscle_cible)
-- au lieu d'abdominaux. Le tag "cardio" était déjà présent.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_cible = 'cardio'
WHERE id = 'mk_burpee';

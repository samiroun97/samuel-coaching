-- ══════════════════════════════════════════════════════════════
-- Renomme "oiseau" en "reverse fly" (terme anglais standard en
-- salle), pour les 3 variantes haltère.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET nom = 'reverse fly à l''haltère' WHERE id = 'mk_dumbbell-rear-delt-fly';
UPDATE public.exercices_catalogue SET nom = 'reverse fly allongé à l''haltère' WHERE id = 'mk_dumbbell-laying-reverse-fly';
UPDATE public.exercices_catalogue SET nom = 'reverse fly assis à l''haltère' WHERE id = 'mk_dumbbell-seated-rear-delt-fly';

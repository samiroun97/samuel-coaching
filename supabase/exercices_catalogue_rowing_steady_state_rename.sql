-- ══════════════════════════════════════════════════════════════
-- Simplifie le nom de l'exercice rameur : "allure continue rameur"
-- → "rameur" (le "allure continue" n'apporte rien côté utilisateur).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET nom = 'rameur' WHERE id = 'mk_rowing-machine-steady-state';

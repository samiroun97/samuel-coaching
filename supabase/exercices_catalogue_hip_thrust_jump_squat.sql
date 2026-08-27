-- ══════════════════════════════════════════════════════════════
-- Ces deux termes sont plus utilisés en anglais qu'en français dans
-- le milieu sportif (demande explicite de l'utilisateur, contrairement
-- au reste de la relecture qui francise systématiquement).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET nom = 'hip thrust' WHERE id = 'mk_glute-bridge';
UPDATE public.exercices_catalogue SET nom = 'jump squat' WHERE id = 'mk_jump-squats';

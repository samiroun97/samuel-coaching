-- ══════════════════════════════════════════════════════════════
-- Reclassification des exercices vélo échauffement/retour au calme :
-- retirer le préfixe "vélo" du nom, et déplacer le retour au calme
-- (mouvement d'étirement, pas cardio) dans la catégorie étirement.
-- L'échauffement reste en cardio (choix explicite de l'utilisateur).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET nom = 'échauffement' WHERE id = 'mk_cycling-warmup';
UPDATE public.exercices_catalogue SET nom = 'retour au calme', muscle_cible = 'étirement' WHERE id = 'mk_cycling-cooldown';

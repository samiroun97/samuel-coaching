-- ══════════════════════════════════════════════════════════════
-- Renomme l'étirement abdominal au swiss ball : "variante four" ne
-- veut rien dire côté utilisateur (numérotation interne MoveKit).
-- Les 3 autres variantes ("one/two/three") gardent leur nom, non
-- concernées par cette demande.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET nom = 'étirement abdominal' WHERE id = 'mk_abdominals-stretch-variation-four';

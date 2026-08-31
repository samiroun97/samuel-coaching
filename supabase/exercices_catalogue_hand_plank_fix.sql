-- ══════════════════════════════════════════════════════════════
-- Précise la fiche "gainage position pompe" (mk_hand-plank) :
-- muscle_travaille anatomiquement précis (transverse + grand droit
-- en isométrique, deltoïde antérieur/triceps en secondaire pour le
-- maintien bras tendus), utilite et a_noter enrichis, tag
-- "abdominaux" ajouté.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Transverse de l''abdomen et grand droit en stabilisation isométrique, deltoïde antérieur et triceps en secondaire pour le maintien de la position bras tendus.',
  muscles_secondaires = ARRAY['deltoïde antérieur', 'triceps brachial']::text[],
  utilite = 'Exercice isométrique fondamental pour développer la stabilité du tronc et la co-contraction abdominale, transférable à tous les mouvements de force.',
  a_noter = 'Répartir le poids entre les mains, éviter de creuser le bas du dos (signe que le tronc n''est plus stabilisé et que la charge bascule sur les lombaires).',
  tags = ARRAY['gainage', 'abdominaux', 'poids du corps']
WHERE id = 'mk_hand-plank';

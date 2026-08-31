-- ══════════════════════════════════════════════════════════════
-- Renomme "front gainage" en "gainage front (planche sur avant-bras)"
-- (ordre mot naturel + clarification) et enrichit son contenu.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  nom = 'gainage front (planche sur avant-bras)',
  muscle_travaille = 'Transverse de l''abdomen et grand droit en stabilisation isométrique, deltoïde antérieur en secondaire pour le maintien de l''appui sur les avant-bras.',
  utilite = 'Isométrique fondamental pour le tronc, base de tout programme de gainage, développe la co-contraction abdominale sans mouvement.',
  a_noter = 'Ne pas laisser les hanches monter ou descendre, garder la ligne droite. Une position trop basse des hanches indique un relâchement abdominal, une position trop haute retire le travail au profit du confort.',
  tags = ARRAY['gainage', 'abdominaux', 'poids du corps']
WHERE id = 'mk_front-plank';

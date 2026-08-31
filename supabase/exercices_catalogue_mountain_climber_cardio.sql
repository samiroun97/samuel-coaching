-- ══════════════════════════════════════════════════════════════
-- Reclasse mountain climber en cardio (muscle_cible + equipement,
-- même traitement que les autres exercices cardio au poids du corps
-- déjà sortis de la puce équipement "poids du corps").
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue
SET muscle_cible = 'cardio', equipement = 'cardio', tags = ARRAY['cardio', 'gainage']
WHERE id = 'mk_mountain-climber';

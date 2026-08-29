-- ══════════════════════════════════════════════════════════════
-- Renomme la catégorie "étirement" en "mobilité" (muscle_cible +
-- equipement) sur les 5 exercices concernés. Les noms d'exercices
-- restent inchangés. Le tag "étirement" est retiré : fusionné avec
-- le tag "mobilité" déjà présent sur 4 des 5 (évite le doublon),
-- ajouté sur le 5e qui ne l'avait pas encore.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_cible = 'mobilité',
  equipement = 'mobilité',
  tags = ARRAY['mobilité', 'récupération', 'post-séance']::text[]
WHERE id = 'mk_cycling-cooldown';

UPDATE public.exercices_catalogue SET
  muscle_cible = 'mobilité',
  equipement = 'mobilité',
  tags = ARRAY['mobilité', 'au sol', 'post-séance']::text[]
WHERE id = 'mk_abdominals-stretch-variation-one';

UPDATE public.exercices_catalogue SET
  muscle_cible = 'mobilité',
  equipement = 'mobilité',
  tags = ARRAY['mobilité', 'debout', 'post-séance']::text[]
WHERE id = 'mk_abdominals-stretch-variation-two';

UPDATE public.exercices_catalogue SET
  muscle_cible = 'mobilité',
  equipement = 'mobilité',
  tags = ARRAY['mobilité', 'debout', 'post-séance']::text[]
WHERE id = 'mk_abdominals-stretch-variation-three';

UPDATE public.exercices_catalogue SET
  muscle_cible = 'mobilité',
  tags = ARRAY['mobilité', 'swiss ball', 'post-séance']::text[]
WHERE id = 'mk_abdominals-stretch-variation-four';

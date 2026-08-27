-- ══════════════════════════════════════════════════════════════
-- Rattrape 4 exercices oubliés lors des passes par équipement :
-- corde ondulatoire, traîneau (push/pull) et le "retour au calme"
-- vélo classé en étirement. Renomme aussi "poussée/traction de
-- traîneau" -> "poussée de traîneau" (la description ne décrit
-- qu'une poussée, "traction" est l'autre exercice séparé).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bras, tronc et hanches, système cardiovasculaire sollicité.',
  execution = 'Position athlétique, corde ancrée, on crée des vagues alternées ou simultanées avec les bras.',
  utilite = 'Maintient une intensité soutenue, bon en cardio ou en finisher.',
  a_noter = 'Garder les jambes fléchies et le dos droit tout du long.',
  tags = ARRAY['cardio', 'corps entier']
WHERE id = 'mk_battle-ropes';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Adducteurs, ischio-jambiers et mollets en étirement.',
  execution = 'Assis, jambes écartées vers l''avant, on incline le buste pour étirer l''intérieur des cuisses.',
  utilite = 'Étirement de récupération à faire après le vélo ou tout effort des jambes.',
  a_noter = 'Mouvement lent, ne pas forcer sur les adducteurs à froid.',
  tags = ARRAY['étirement', 'récupération', 'post-séance']
WHERE id = 'mk_cycling-cooldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et ischio-jambiers, bras en finition.',
  execution = 'Corde en mains, on étend fortement les hanches pour démarrer la traction, puis on termine avec les bras.',
  utilite = 'Développe la puissance des hanches et l''endurance de préhension.',
  a_noter = 'Le démarrage vient des hanches, pas des bras.',
  tags = ARRAY['cardio', 'fessiers', 'traîneau']
WHERE id = 'mk_sled-pull';

UPDATE public.exercices_catalogue SET nom = 'poussée de traîneau', description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, système cardiovasculaire sollicité.',
  execution = 'Position athlétique inclinée, on pousse le traîneau par des extensions répétées de hanches et de genoux.',
  utilite = 'Cardio et puissance des jambes sans impact sur les articulations.',
  a_noter = 'Garder le dos droit, la poussée vient des jambes, pas du haut du corps.',
  tags = ARRAY['cardio', 'jambes', 'traîneau']
WHERE id = 'mk_sled-push';

-- ══════════════════════════════════════════════════════════════
-- Corrige 2 noms de la catégorie vélo qui ne voulaient rien dire hors
-- contexte ("allure continue ride", "montée répétitions" — ne
-- mentionnaient même pas vélo), enrichit la catégorie vélo (4/4), et
-- généralise le contenu de l'échauffement cardio qui recontrait à
-- tort un nom volontairement générique sur le vélo spécifiquement.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Généralise l'échauffement cardio (nom déjà rendu générique plus tôt,
-- le contenu le renarrait à tort spécifiquement au vélo)
UPDATE public.exercices_catalogue SET
  execution = 'Debout, on lève un genou à la fois sur une amplitude complète et contrôlée.',
  utilite = 'Échauffement dynamique des hanches, à faire avant n''importe quel effort cardio ou jambes.',
  tags = ARRAY['cardio', 'échauffement', 'mobilité']
WHERE id = 'mk_cycling-warmup';

-- Catégorie vélo (4/4) : 2 noms qui ne voulaient rien dire sans contexte, corrigés
UPDATE public.exercices_catalogue SET nom = 'vélo allure continue', description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et mollets.',
  execution = 'Pédalage assis, résistance et cadence stables, maintenu sous le seuil lactique tout du long.',
  utilite = 'Développe l''endurance de base, effort long et soutenable.',
  a_noter = 'L''intensité doit rester conversationnelle, ce n''est pas un effort à fond.',
  tags = ARRAY['cardio', 'vélo', 'endurance']
WHERE id = 'mk_steady-state-ride';

UPDATE public.exercices_catalogue SET nom = 'vélo montées répétées', description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et fessiers en moteur principal.',
  execution = 'Montée assise à forte résistance et basse cadence, puis récupération avant de recommencer.',
  utilite = 'Développe la force spécifique au pédalage et la puissance en côte.',
  a_noter = 'Garder le buste stable, éviter de tirer sur le guidon pour compenser.',
  tags = ARRAY['cardio', 'vélo', 'force', 'intervalles']
WHERE id = 'mk_hill-climb-repeats';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et mollets.',
  execution = 'Répétitions d''efforts intenses assis entrecoupées de récupération, position stable tout du long.',
  utilite = 'Développe la VO2max et la capacité à répéter des efforts intenses.',
  a_noter = 'Respecter les temps de récupération pour tenir l''intensité sur toutes les répétitions.',
  tags = ARRAY['cardio', 'vélo', 'intervalles', 'haute intensité']
WHERE id = 'mk_cycling-intervals';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps en moteur principal.',
  execution = 'Efforts maximaux et courts où la puissance culmine en quelques secondes, charge portée par les quadriceps à chaque coup de pédale.',
  utilite = 'Développe la puissance maximale et la vitesse de pédalage.',
  a_noter = 'Récupération complète nécessaire entre les sprints pour garder l''intensité maximale.',
  tags = ARRAY['cardio', 'vélo', 'haute intensité']
WHERE id = 'mk_cycling-sprint';

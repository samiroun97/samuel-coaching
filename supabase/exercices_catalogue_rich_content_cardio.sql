-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi : catégorie cardio complète (15/15).
-- Renomme aussi 2 noms bancals (natation exercice de traction (natation)
-- -> natation, exercice de traction ; trail -> course en trail).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, mollets et avant-bras en soutien.',
  execution = 'Sauts continus à deux pieds, réception sur l''avant du pied, poignets qui font tourner la corde.',
  utilite = 'Cardio court et intense, idéal en échauffement ou en finisher.',
  a_noter = 'Rester sur l''avant du pied, éviter de sauter trop haut pour ménager les mollets.',
  tags = ARRAY['cardio', 'corde à sauter', 'intervalles']
WHERE id = 'mk_jump-rope';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et mollets en moteur principal.',
  execution = 'Répétitions de course rapide, bien au-dessus de l''allure tenable en continu, entrecoupées de récupération.',
  utilite = 'Développe la VO2max et la vitesse, séance cardio à haute intensité.',
  a_noter = 'Bien s''échauffer avant, respecter les temps de récupération pour tenir l''intensité sur toutes les répétitions.',
  tags = ARRAY['cardio', 'course', 'intervalles', 'haute intensité']
WHERE id = 'mk_running-intervals';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, sollicitation légère des jambes.',
  execution = 'Footing facile à allure de récupération, pour faire redescendre la fréquence cardiaque.',
  utilite = 'Retour au calme après une course intense, favorise la récupération.',
  a_noter = 'Rester volontairement lent, ce n''est pas un exercice de performance.',
  tags = ARRAY['cardio', 'course', 'récupération', 'post-séance']
WHERE id = 'mk_running-cooldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, fléchisseurs de hanche et quadriceps.',
  execution = 'Debout, on lève un genou à la fois sur une amplitude complète et contrôlée, avant une sortie vélo.',
  utilite = 'Prépare les hanches et le cardio avant l''effort à vélo.',
  a_noter = 'Amplitude contrôlée, pas besoin de vitesse à ce stade.',
  tags = ARRAY['cardio', 'échauffement', 'vélo', 'mobilité']
WHERE id = 'mk_cycling-warmup';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, mollets et épaules en soutien.',
  execution = 'Saut qui écarte les jambes et lève les bras au-dessus de la tête, puis retour à la position debout.',
  utilite = 'Cardio simple et rapide à mettre en place, bon en échauffement général.',
  a_noter = 'Réceptionner genoux légèrement fléchis pour amortir l''impact.',
  tags = ARRAY['cardio', 'échauffement', 'poids du corps']
WHERE id = 'mk_jumping-jack';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et fléchisseurs de hanche.',
  execution = 'Battements de jambes en crawl, sans les bras, planche ou bras tendus devant.',
  utilite = 'Isole la propulsion des jambes et la position du corps dans l''eau.',
  a_noter = 'Battement qui part de la hanche, pas du genou, pour rester efficace.',
  tags = ARRAY['cardio', 'natation', 'technique']
WHERE id = 'mk_swim-kick-drill';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, pectoraux et adducteurs en moteur principal.',
  execution = 'Mouvement simultané des bras en large tirage, combiné à un battement de jambes en fouet propulsé par l''intérieur des cuisses.',
  utilite = 'Nage cardio à rythme modéré, bonne option d''endurance longue.',
  a_noter = 'Synchroniser bras et jambes pour ne pas casser la glisse entre chaque cycle.',
  tags = ARRAY['cardio', 'natation', 'endurance']
WHERE id = 'mk_breaststroke-swim';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, grand dorsal et pectoraux en moteur principal.',
  execution = 'Bras alternés avec battement de jambes continu et respiration en rotation à chaque traction.',
  utilite = 'Nage cardio la plus rapide et la plus utilisée pour l''endurance.',
  a_noter = 'Respirer en tournant la tête sans la lever, pour garder le corps aligné.',
  tags = ARRAY['cardio', 'natation', 'endurance']
WHERE id = 'mk_freestyle-swim';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, grand dorsal en moteur principal.',
  execution = 'Battements alternés sur le dos, rotation du buste qui permet à chaque bras de tirer à tour de rôle.',
  utilite = 'Alternative cardio au crawl qui repose les épaules en rotation interne.',
  a_noter = 'Garder les hanches hautes pour ne pas freiner sur l''eau.',
  tags = ARRAY['cardio', 'natation', 'endurance']
WHERE id = 'mk_backstroke-swim';

UPDATE public.exercices_catalogue SET nom = 'natation, exercice de traction', description = NULL,
  muscle_travaille = 'Système cardiovasculaire, grand dorsal et pectoraux.',
  execution = 'Crawl bras uniquement, jambes immobilisées (pull buoy), pour isoler la prise d''appui et la traction sous l''eau.',
  utilite = 'Travaille spécifiquement la technique de traction sans l''apport des jambes.',
  a_noter = 'Garder une prise d''appui haute sur l''avant-bras, pas seulement la main.',
  tags = ARRAY['cardio', 'natation', 'technique']
WHERE id = 'mk_swim-pull-drill';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, pectoraux et grand dorsal, tronc très sollicité.',
  execution = 'Mouvement simultané des deux bras, calé sur un battement dauphin, corps qui ondule autour des hanches à chaque cycle.',
  utilite = 'Nage cardio la plus exigeante, développe la puissance et la coordination.',
  a_noter = 'Nage technique et fatigante, à réserver à un niveau déjà à l''aise dans l''eau.',
  tags = ARRAY['cardio', 'natation', 'haute intensité']
WHERE id = 'mk_butterfly-swim';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, grand dorsal et pectoraux en moteur principal.',
  execution = 'Répétitions courtes et maximales en crawl, avec un temps de repos fixe entre chaque.',
  utilite = 'Développe la vitesse et la VO2max en piscine.',
  a_noter = 'Respecter le repos fixe pour garder chaque répétition à intensité maximale.',
  tags = ARRAY['cardio', 'natation', 'intervalles', 'haute intensité']
WHERE id = 'mk_swim-sprint-intervals';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps, mollets et stabilisateurs de cheville.',
  execution = 'Marche en sentier, avec ou sans bâtons, où l''allure et le terrain déterminent l''intensité de l''effort.',
  utilite = 'Cardio à faible impact, bon pour le volume d''entraînement sans fatigue articulaire.',
  a_noter = 'Le terrain irrégulier sollicite les chevilles, penser à un bon chaussant.',
  tags = ARRAY['cardio', 'endurance', 'extérieur']
WHERE id = 'mk_hiking';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, épaules et tronc en rotation.',
  execution = 'Enchaînements de coups de poing dans le vide avec jeu de jambes et rotation du buste, travaillés en rounds chronométrés.',
  utilite = 'Cardio dynamique qui travaille aussi la coordination et le relâchement des épaules.',
  a_noter = 'Garder les poings relâchés entre les coups pour ne pas fatiguer les avant-bras inutilement.',
  tags = ARRAY['cardio', 'boxe', 'coordination']
WHERE id = 'mk_shadow-boxing';

UPDATE public.exercices_catalogue SET nom = 'course en trail', description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps, mollets et stabilisateurs de cheville.',
  execution = 'Course sur terrain accidenté, avec des changements de pente constants entre montée et descente.',
  utilite = 'Cardio complet qui ajoute du renforcement grâce au terrain instable et aux dénivelés.',
  a_noter = 'Adapter l''allure au terrain, le risque de chute ou d''entorse est plus élevé que sur route.',
  tags = ARRAY['cardio', 'course', 'extérieur']
WHERE id = 'mk_trail-run';

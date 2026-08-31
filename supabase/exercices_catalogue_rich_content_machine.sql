-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi : catégorie machine (67 exercices).
-- Basé sur les descriptions MoveKit d'origine + connaissances de
-- musculation, condensé au même niveau que les lots précédents.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Moyen fessier.',
  execution = 'Assis, on pousse les appuis extérieurs des cuisses vers l''extérieur puis on revient.',
  utilite = 'Isolation guidée des abducteurs de hanche.',
  a_noter = 'Régler le siège pour que l''axe de rotation corresponde à la hanche.',
  tags = ARRAY['fessiers', 'machine']
WHERE id = 'mk_machine-hip-abduction';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Adducteurs.',
  execution = 'Assis, on rapproche les appuis intérieurs des cuisses l''un de l''autre.',
  utilite = 'Isolation guidée de l''intérieur des cuisses.',
  a_noter = 'Mouvement contrôlé, ne pas claquer les appuis l''un contre l''autre.',
  tags = ARRAY['adducteurs', 'machine']
WHERE id = 'mk_machine-hip-adduction';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers.',
  execution = 'À plat ventre, hanches soutenues, on plie les genoux pour amener le rouleau vers les fessiers.',
  utilite = 'Isolation des ischio-jambiers, hanches stabilisées par le support.',
  a_noter = 'Ne pas soulever les hanches du support pendant l''effort.',
  tags = ARRAY['ischio-jambiers', 'machine']
WHERE id = 'mk_lying-leg-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, dos et jambes.',
  execution = 'Rameur à allure stable, même rythme et même cadence de coup tout du long.',
  utilite = 'Développe l''endurance de base sur une machine à faible impact.',
  a_noter = 'Garder une technique propre même quand la fatigue s''installe.',
  tags = ARRAY['cardio', 'rameur', 'endurance']
WHERE id = 'mk_rowing-machine-steady-state';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et fessiers.',
  execution = 'Foulée longue à faible impact sur la machine, inclinaison réglable selon l''accent souhaité.',
  utilite = 'Cardio à faible impact qui ménage les articulations.',
  a_noter = 'Garder une foulée fluide, ne pas se pencher sur les poignées.',
  tags = ARRAY['cardio', 'faible impact', 'machine']
WHERE id = 'mk_arc-trainer';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers.',
  execution = 'Assis, hanches fléchies, on enroule les chevilles sous le rouleau vers l''arrière.',
  utilite = 'Isolation des ischio-jambiers dans une position différente du leg curl allongé.',
  a_noter = 'Garder le dos calé contre le dossier tout du long.',
  tags = ARRAY['ischio-jambiers', 'machine']
WHERE id = 'mk_seated-leg-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Ceinture fixée aux hanches, on descend en squat, la charge tire au niveau des hanches.',
  utilite = 'Charge les jambes sans peser sur la colonne, bon en cas de gêne au dos.',
  a_noter = 'Garder le buste droit, le poids ne repose pas sur les épaules.',
  tags = ARRAY['jambes', 'machine']
WHERE id = 'mk_belt-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et mollets.',
  execution = 'Course soutenue à allure facile et régulière sur tapis.',
  utilite = 'Séance de base aérobie de tout plan d''endurance.',
  a_noter = 'L''allure doit rester conversationnelle, ce n''est pas un effort à fond.',
  tags = ARRAY['cardio', 'course', 'endurance']
WHERE id = 'mk_long-run';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et mollets.',
  execution = 'Course sur tapis motorisé à vitesse et inclinaison fixées par la machine.',
  utilite = 'Cardio contrôlé, utile pour cibler une allure précise.',
  a_noter = 'Bien régler la vitesse progressivement avant d''atteindre l''allure cible.',
  tags = ARRAY['cardio', 'course']
WHERE id = 'mk_treadmill-run';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et mollets.',
  execution = 'Course soutenue à l''allure du seuil, rapide mais tenable un moment.',
  utilite = 'Développe la capacité à tenir un rythme soutenu plus longtemps.',
  a_noter = 'L''allure doit être inconfortable mais jamais un sprint.',
  tags = ARRAY['cardio', 'course', 'seuil']
WHERE id = 'mk_tempo-run';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand droit de l''abdomen.',
  execution = 'Assis, on enroule le buste vers l''avant contre la résistance de la machine.',
  utilite = 'Version progressive et chargée du crunch au poids du corps.',
  a_noter = 'Enrouler depuis les côtes, pas seulement plier au niveau des hanches.',
  tags = ARRAY['abdominaux', 'machine']
WHERE id = 'mk_machine-crunch';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps.',
  execution = 'Bras fixé sur un appui, on plie le coude pour monter la poignée.',
  utilite = 'Amplitude stricte, sans triche possible du buste.',
  a_noter = 'Ne pas verrouiller le coude en extension complète.',
  tags = ARRAY['biceps', 'machine']
WHERE id = 'mk_machine-preacher-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps en secondaire.',
  execution = 'Assis, on pousse les poignées devant soi jusqu''à l''extension des bras.',
  utilite = 'Trajectoire guidée, adaptée aux débutants.',
  a_noter = 'Régler le siège pour que les poignées soient à hauteur de poitrine.',
  tags = ARRAY['pectoraux', 'machine']
WHERE id = 'mk_machine-chest-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas des pectoraux.',
  execution = 'Assis, trajectoire descendante guidée, on pousse les poignées vers le bas et l''avant.',
  utilite = 'Charge le bas des pectoraux sans banc décliné ni parade.',
  a_noter = 'Régler le siège pour que la trajectoire corresponde à la ligne des pectoraux.',
  tags = ARRAY['pectoraux', 'machine']
WHERE id = 'mk_decline-machine-chest-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux.',
  execution = 'Assis, trajectoire ascendante guidée, on pousse les poignées vers le haut et l''avant.',
  utilite = 'Cible le haut des pectoraux sur un arc fixe.',
  a_noter = 'Régler le siège pour aligner les poignées avec le haut des pectoraux.',
  tags = ARRAY['pectoraux', 'machine']
WHERE id = 'mk_incline-machine-chest-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes antérieurs.',
  execution = 'Assis, on pousse la charge au-dessus de la tête sur une trajectoire fixe.',
  utilite = 'Alternative stable au développé militaire à la barre debout.',
  a_noter = 'Régler le siège pour que la poignée démarre à hauteur d''épaule.',
  tags = ARRAY['épaules', 'machine']
WHERE id = 'mk_machine-front-military-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux et triceps.',
  execution = 'Assis, on pousse les poignées vers le bas, une assistance compense une partie du poids du corps.',
  utilite = 'Permet de travailler le mouvement de dips sans prérequis de force.',
  a_noter = 'Réduire l''assistance progressivement à mesure que la force augmente.',
  tags = ARRAY['pectoraux', 'triceps', 'machine']
WHERE id = 'mk_machine-dips';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux.',
  execution = 'Assis, on ramène les bras l''un vers l''autre devant la poitrine contre des appuis fixes.',
  utilite = 'Stimulus le plus pur et ciblé pour les pectoraux en salle.',
  a_noter = 'Régler le siège pour que les appuis soient à hauteur de poitrine.',
  tags = ARRAY['pectoraux', 'machine']
WHERE id = 'mk_machine-pec-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde antérieur.',
  execution = 'Debout, un disque tenu à deux mains, on le lève devant soi jusqu''à hauteur d''épaule.',
  utilite = 'Variante de l''élévation frontale avec une prise différente.',
  a_noter = 'Éviter l''élan, monter uniquement avec l''épaule.',
  tags = ARRAY['épaules', 'machine']
WHERE id = 'mk_plate-front-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde latéral.',
  execution = 'Assis, on lève les bras sur les côtés contre des appuis fixes jusqu''à hauteur d''épaule.',
  utilite = 'Isolation guidée du côté de l''épaule.',
  a_noter = 'Régler le siège pour que l''axe de rotation corresponde à l''épaule.',
  tags = ARRAY['épaules', 'machine']
WHERE id = 'mk_machine-lateral-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et fessiers.',
  execution = 'Montée continue de marches, on pousse à chaque pas.',
  utilite = 'Cardio qui combine travail cardiovasculaire et renforcement des jambes.',
  a_noter = 'Rester droit, ne pas trop s''appuyer sur les rampes.',
  tags = ARRAY['cardio', 'jambes', 'machine']
WHERE id = 'mk_stair-climber';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps.',
  execution = 'Assis, on tend les jambes contre le rouleau jusqu''à l''extension complète.',
  utilite = 'Constructeur de quadriceps le plus direct de la salle.',
  a_noter = 'Ne pas verrouiller brutalement le genou en haut du mouvement.',
  tags = ARRAY['quadriceps', 'machine']
WHERE id = 'mk_machine-leg-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps.',
  execution = 'Assis sur une machine à charge libre, on tend les jambes contre le rouleau.',
  utilite = 'Version à disques, souvent perçue comme plus lourde à sentir.',
  a_noter = 'Charger progressivement, la machine à disques a moins de progressivité qu''un sélecteur.',
  tags = ARRAY['quadriceps', 'machine']
WHERE id = 'mk_machine-plate-loaded-leg-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Érecteurs du rachis, fessiers et ischio-jambiers.',
  execution = 'Sur un banc à 45 degrés, on descend le buste puis on remonte à l''horizontale.',
  utilite = 'Renforce le bas du dos par un hip hinge propre.',
  a_noter = 'Ne pas cambrer au-delà de la ligne neutre en haut.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_machine-45-degree-back-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps.',
  execution = 'Assis, bras soutenus, on pousse les poignées vers l''avant jusqu''à l''extension complète.',
  utilite = 'Trajectoire fixe qui isole les triceps sans stabilisation à gérer.',
  a_noter = 'Garder les coudes fixes contre les appuis.',
  tags = ARRAY['triceps', 'machine']
WHERE id = 'mk_machine-tricep-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Un disque tenu contre la poitrine, on effectue une fente avant.',
  utilite = 'Charge les jambes sur un pas unilatéral, grand classique de salle.',
  a_noter = 'Garder le buste droit, le genou avant ne dépasse pas la pointe du pied.',
  tags = ARRAY['jambes', 'unilatéral', 'machine']
WHERE id = 'mk_plate-forward-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps, fessiers en secondaire.',
  execution = 'Dos calé sur un traîneau incliné, on descend en squat puis on repousse.',
  utilite = 'Charge les quadriceps sans exigence d''équilibre.',
  a_noter = 'Ne pas verrouiller brutalement les genoux en haut du mouvement.',
  tags = ARRAY['quadriceps', 'machine']
WHERE id = 'mk_machine-hack-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et ischio-jambiers.',
  execution = 'Face à la machine hack squat, on descend en squat dans l''autre sens.',
  utilite = 'Déplace le schéma du squat vers les fessiers et les ischio-jambiers.',
  a_noter = 'Garder les talons bien ancrés tout du long.',
  tags = ARRAY['fessiers', 'machine']
WHERE id = 'mk_reverse-hack-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et milieu du dos.',
  execution = 'Buste calé, bras indépendants, on tire les poignées horizontalement vers soi.',
  utilite = 'Chaque bras travaille indépendamment, bon pour corriger une asymétrie.',
  a_noter = 'Ne pas laisser un bras compenser pour l''autre.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_hammer-strength-iso-lateral-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers.',
  execution = 'Assis, appui sur les cuisses, on pousse pour étendre les hanches.',
  utilite = 'Charge l''extension de hanche avec les fessiers sous tension tout du long.',
  a_noter = 'Contraction franche en haut du mouvement.',
  tags = ARRAY['fessiers', 'machine']
WHERE id = 'mk_machine-hip-thrust';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, un côté à la fois.',
  execution = 'Debout, buste soutenu contre un appui, on pousse la jambe vers l''arrière.',
  utilite = 'Isole l''extension de hanche unilatérale avec un buste stable.',
  a_noter = 'Garder le bassin stable, ne pas cambrer pour lever la jambe plus haut.',
  tags = ARRAY['fessiers', 'unilatéral', 'machine']
WHERE id = 'mk_glute-kickback-machine';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal.',
  execution = 'Assis, on abaisse les bras depuis une position haute jusqu''aux cuisses, coudes fixes.',
  utilite = 'Le grand dorsal travaille sans flexion du coude.',
  a_noter = 'Garder les coudes légèrement fléchis mais fixes tout du long.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_machine-lat-pullover';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et fessiers.',
  execution = 'Marche sur tapis avec une pente prononcée, sans courir.',
  utilite = 'Charge plus longue et régulière sur les fessiers et quadriceps qu''une marche à plat.',
  a_noter = 'Ne pas s''appuyer sur les poignées pour garder le bénéfice de la pente.',
  tags = ARRAY['cardio', 'jambes', 'machine']
WHERE id = 'mk_incline-treadmill-walk';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Mollets.',
  execution = 'Sur une presse à cuisses horizontale, on pousse la plaque uniquement avec l''avant des pieds.',
  utilite = 'Charge lourde sur les mollets sans machine dédiée.',
  a_noter = 'Descendre en étirement complet pour profiter de toute l''amplitude.',
  tags = ARRAY['mollets', 'machine']
WHERE id = 'mk_horizontal-leg-press-calf-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Mollets (jumeau).',
  execution = 'Charge sur les épaules, genoux tendus, on monte sur la pointe des pieds.',
  utilite = 'Grand classique pour les mollets, charge lourde possible.',
  a_noter = 'Descendre en étirement complet, talons qui dépassent la plateforme.',
  tags = ARRAY['mollets', 'machine']
WHERE id = 'mk_standing-calf-raise-machine';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes postérieurs, haut du dos.',
  execution = 'Buste calé, on ouvre les bras vers l''arrière contre des appuis fixes.',
  utilite = 'Isolation guidée de l''arrière des épaules.',
  a_noter = 'Garder une légère flexion des coudes, ne pas cambrer le dos.',
  tags = ARRAY['épaules', 'machine']
WHERE id = 'mk_reverse-pec-deck';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Préhension (pince pouce-doigts).',
  execution = 'On pince une paire de disques entre le pouce et les doigts, à plat, pendant un temps donné.',
  utilite = 'Renforce la force de pince, utile pour la préhension globale.',
  a_noter = 'Charge légère au début, la prise en pince est très exigeante.',
  tags = ARRAY['préhension', 'isométrie', 'machine']
WHERE id = 'mk_plate-pinch';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Assis, on pousse la plaque en tendant les jambes puis on revient sous contrôle.',
  utilite = 'Alternative à forte charge au squat, dos soutenu.',
  a_noter = 'Ne pas verrouiller brutalement les genoux en haut.',
  tags = ARRAY['jambes', 'machine']
WHERE id = 'mk_machine-leg-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Assis, traîneau horizontal, on pousse la plaque loin d''une flexion profonde du genou.',
  utilite = 'Dos soutenu, bonne option pour une amplitude profonde en sécurité.',
  a_noter = 'Garder le bas du dos plaqué contre le support.',
  tags = ARRAY['jambes', 'machine']
WHERE id = 'mk_machine-horizontal-leg-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, un côté à la fois.',
  execution = 'Assis, buste soutenu, on pousse la plaque avec une seule jambe.',
  utilite = 'Charge les quadriceps unilatéralement avec le buste entièrement soutenu.',
  a_noter = 'Garder le genou aligné avec le pied tout du long.',
  tags = ARRAY['jambes', 'unilatéral', 'machine']
WHERE id = 'mk_single-leg-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Avant-bras (fléchisseurs et extenseurs).',
  execution = 'Rouleau tenu à bout de bras, on enroule la corde de haut en bas avec les poignets.',
  utilite = 'Renforce la préhension et l''avant-bras en résistance progressive.',
  a_noter = 'Garder les bras tendus devant soi, seul le poignet tourne.',
  tags = ARRAY['avant-bras', 'préhension', 'machine']
WHERE id = 'mk_wrist-roller';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas du grand dorsal et biceps.',
  execution = 'Buste calé, poignées en prise supination, on tire vers soi.',
  utilite = 'Sollicite fortement le bas du dos et les biceps.',
  a_noter = 'Terminer le tirage coudes bien en arrière.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_machine-underhand-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, dos et jambes.',
  execution = 'Efforts intenses répétés au rameur, séparés par des phases faciles.',
  utilite = 'Développe la VO2max et la capacité à répéter des efforts intenses.',
  a_noter = 'Garder la technique de coup propre malgré la fatigue.',
  tags = ARRAY['cardio', 'rameur', 'intervalles']
WHERE id = 'mk_rowing-intervals';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut du dos, grand dorsal en secondaire.',
  execution = 'Point d''ancrage haut, on pousse les coudes vers le bas et l''arrière.',
  utilite = 'Variante qui cible davantage le haut du dos que le rowing classique.',
  a_noter = 'Terminer coudes bien en arrière, pas seulement avec les mains.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_hammer-strength-high-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et milieu du dos.',
  execution = 'Buste calé, poignées en prise neutre, on tire horizontalement vers soi.',
  utilite = 'Facile à apprendre, difficile à tricher, bon exercice de base.',
  a_noter = 'Garder le buste stable contre l''appui tout du long.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_machine-neutral-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, dos et jambes.',
  execution = 'Effort de rameur court et maximal, cadence et poussée des jambes au maximum.',
  utilite = 'Développe la puissance et la vitesse au rameur.',
  a_noter = 'Garder la technique malgré l''intensité, ne pas casser le dos pour aller plus vite.',
  tags = ARRAY['cardio', 'rameur', 'haute intensité']
WHERE id = 'mk_rowing-sprint';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et milieu du dos.',
  execution = 'Buste penché en hip hinge, on tire la barre T chargée vers le buste.',
  utilite = 'Grand classique de la salle pour prendre de la masse au dos.',
  a_noter = 'Garder le dos plat pendant tout le hip hinge.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_machine-plate-loaded-t-bar-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et milieu du dos.',
  execution = 'Buste calé sur un support, on tire la barre T chargée vers le buste.',
  utilite = 'Le dos travaille sans hinge libre, bon en cas de gêne lombaire.',
  a_noter = 'Garder les épaules basses, ne pas les hausser en tirant.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_chest-supported-t-bar-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps (isolation stricte).',
  execution = 'Hanches en extension, on incline le buste en arrière en pliant les genoux qui avancent au-delà des orteils.',
  utilite = 'Isolation très poussée des quadriceps, exercice avancé.',
  a_noter = 'Commencer avec un appui pour l''équilibre, l''exercice est exigeant pour les genoux.',
  tags = ARRAY['quadriceps', 'avancé', 'machine']
WHERE id = 'mk_sissy-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, dos et triceps.',
  execution = 'Debout, on plie les hanches pour pousser les deux poignées vers le bas, au-delà des cuisses.',
  utilite = 'Cardio complet qui sollicite aussi le haut du corps.',
  a_noter = 'Le mouvement part des hanches, pas seulement des bras.',
  tags = ARRAY['cardio', 'machine']
WHERE id = 'mk_ski-erg';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes antérieurs, triceps en secondaire.',
  execution = 'Assis, dos calé, on pousse la barre guidée depuis la hauteur des yeux jusqu''au verrouillage.',
  utilite = 'Trajectoire fixe et sécurisée pour le développé militaire.',
  a_noter = 'Régler le banc pour que la barre démarre à hauteur des yeux.',
  tags = ARRAY['épaules', 'machine']
WHERE id = 'mk_smith-machine-seated-overhead-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Trapèzes (haut).',
  execution = 'Debout sous la barre guidée, on monte les épaules vers les oreilles.',
  utilite = 'Permet de charger lourd en sécurité grâce au rail guidé.',
  a_noter = 'Monter verticalement, éviter de faire rouler les épaules.',
  tags = ARRAY['trapèzes', 'machine']
WHERE id = 'mk_smith-machine-standing-shrugs';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps en secondaire.',
  execution = 'Allongé, la barre se déplace sur un rail vertical fixe.',
  utilite = 'Version guidée du développé couché, plus sécurisée sans parade.',
  a_noter = 'Bien régler la hauteur du banc par rapport au rail.',
  tags = ARRAY['pectoraux', 'machine']
WHERE id = 'mk_smith-machine-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux.',
  execution = 'Sur un banc incliné sous la machine Smith, on pousse la barre guidée.',
  utilite = 'Version guidée du développé incliné classique.',
  a_noter = 'Ne pas trop incliner le banc pour garder le travail sur les pectoraux.',
  tags = ARRAY['pectoraux', 'machine']
WHERE id = 'mk_smith-machine-incline-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Mollets.',
  execution = 'Sous la barre de la machine Smith, on monte sur la pointe des pieds.',
  utilite = 'Charge lourde et sécurisée pour les mollets.',
  a_noter = 'Descendre en étirement complet, talons qui dépassent la plateforme.',
  tags = ARRAY['mollets', 'machine']
WHERE id = 'mk_smith-machine-calf-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps, pectoraux en secondaire.',
  execution = 'Allongé, prise serrée sur la barre guidée, on pousse jusqu''à l''extension.',
  utilite = 'Version guidée du grand classique de volume pour les triceps.',
  a_noter = 'Garder les coudes proches du corps pendant la poussée.',
  tags = ARRAY['triceps', 'machine']
WHERE id = 'mk_smith-machine-close-grip-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et milieu du dos.',
  execution = 'Buste penché, on tire la barre guidée vers le buste.',
  utilite = 'La trajectoire fixe garde la ligne de tirage stable.',
  a_noter = 'Garder le dos plat pendant tout le hip hinge.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_smith-machine-bent-over-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Barre guidée au dos, on descend en squat puis on repousse.',
  utilite = 'Supprime l''essentiel du travail de stabilisation du squat libre.',
  a_noter = 'Bien positionner les pieds, la trajectoire fixe change la mécanique du squat.',
  tags = ARRAY['jambes', 'machine']
WHERE id = 'mk_smith-machine-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps.',
  execution = 'Barre guidée devant les épaules, on descend en squat en gardant le buste droit.',
  utilite = 'La trajectoire fixe aide à garder le buste droit.',
  a_noter = 'Garder les coudes hauts pour stabiliser la barre.',
  tags = ARRAY['jambes', 'machine']
WHERE id = 'mk_smith-machine-front-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et ischio-jambiers.',
  execution = 'Jambes très écartées sous la barre guidée, on effectue un hip hinge.',
  utilite = 'Travail de hip hinge guidé qui privilégie les fessiers et l''intérieur des ischio-jambiers.',
  a_noter = 'Garder le dos plat pendant toute la descente.',
  tags = ARRAY['fessiers', 'machine']
WHERE id = 'mk_smith-machine-sumo-romanian-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps, fessiers en secondaire.',
  execution = 'Buste soutenu, on descend en squat sur un arc contrebalancé.',
  utilite = 'Permet une amplitude profonde avec le buste soutenu.',
  a_noter = 'Contrôler la descente, l''arc contrebalancé peut accélérer le mouvement.',
  tags = ARRAY['jambes', 'machine']
WHERE id = 'mk_pendulum-squat-v-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Assis, on tire la barre vers le haut de la poitrine sur une trajectoire fixe.',
  utilite = 'Constructeur de dos universel de toute salle.',
  a_noter = 'Ne pas se pencher trop en arrière pour tirer la barre plus bas.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_machine-pulldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas du grand dorsal, biceps en secondaire.',
  execution = 'Assis, prise serrée sur la barre, on tire vers le haut de la poitrine.',
  utilite = 'Version prise serrée qui privilégie le bas du dorsal.',
  a_noter = 'Garder les coudes proches du corps pendant le tirage.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_narrow-pulldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Genoux sur un appui compensant une partie du poids, on tire le corps vers le haut.',
  utilite = 'Permet de s''entraîner sur l''amplitude complète de la traction avant d''y arriver au poids du corps.',
  a_noter = 'Réduire l''assistance progressivement à mesure que la force augmente.',
  tags = ARRAY['dos', 'machine']
WHERE id = 'mk_machine-assisted-pull-up';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, corps entier.',
  execution = 'Assis, pédales et bras mobiles travaillent ensemble, plus l''effort est intense plus la résistance augmente.',
  utilite = 'Cardio complet qui sollicite bras et jambes en même temps.',
  a_noter = 'Doser l''effort, la résistance grimpe vite si on pousse fort.',
  tags = ARRAY['cardio', 'corps entier', 'machine']
WHERE id = 'mk_assault-bike';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, jambes.',
  execution = 'Debout, pédales liées et poignées mobiles, les pieds restent sur la plateforme.',
  utilite = 'Cardio à faible impact, la pente permet de changer l''accent musculaire.',
  a_noter = 'Garder une posture droite, ne pas s''appuyer lourdement sur les poignées.',
  tags = ARRAY['cardio', 'faible impact', 'machine']
WHERE id = 'mk_elliptical';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, quadriceps et mollets.',
  execution = 'Pédalage assis sur un vélo à volant d''inertie lesté.',
  utilite = 'Cardio à faible impact, très modulable en intensité.',
  a_noter = 'Bien régler la selle avant de commencer pour préserver les genoux.',
  tags = ARRAY['cardio', 'vélo', 'machine']
WHERE id = 'mk_indoor-cycling-spin';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Système cardiovasculaire, corps entier.',
  execution = 'Montée verticale sur un rail fixe, bras et jambes en alternance.',
  utilite = 'Cardio complet à faible impact qui sollicite tout le corps.',
  a_noter = 'Garder un mouvement fluide, éviter les à-coups.',
  tags = ARRAY['cardio', 'corps entier', 'machine']
WHERE id = 'mk_versaclimber';

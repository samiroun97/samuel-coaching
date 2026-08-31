-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi : catégorie haltère (88 exercices).
-- Basé sur les descriptions MoveKit d'origine + connaissances de
-- musculation, condensé au même niveau que les lots précédents.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes postérieurs, haut du dos.',
  execution = 'Buste contre un banc incliné, on écarte les bras tendus vers l''arrière en serrant les omoplates.',
  utilite = 'Isole l''arrière des épaules sans solliciter le bas du dos.',
  a_noter = 'Charge légère, le mouvement doit venir des épaules et non d''un élan du dos.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_dumbbell-laying-reverse-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes (les trois faisceaux), triceps en secondaire.',
  execution = 'Assis, on part paumes tournées vers soi puis on pivote les poignets vers l''avant en poussant les haltères au-dessus de la tête.',
  utilite = 'Sollicite l''épaule sous plusieurs angles en un seul mouvement.',
  a_noter = 'Rotation fluide et contrôlée, ne pas forcer sur les épaules en fin de rotation.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_arnold-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes antérieurs et latéraux, triceps en secondaire.',
  execution = 'Assis, dos soutenu, on pousse les haltères au-dessus de la tête jusqu''à l''extension complète des bras.',
  utilite = 'Réponse assise au développé militaire debout, dos soutenu pour isoler les épaules.',
  a_noter = 'Ne pas cambrer le bas du dos, garder les abdos gainés.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_dumbbell-seated-overhead-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Trapèzes (haut).',
  execution = 'Assis, haltères le long du corps, on monte les épaules vers les oreilles puis on redescend.',
  utilite = 'Isole le haut des trapèzes sans élan des jambes.',
  a_noter = 'Monter les épaules verticalement, pas de rotation.',
  tags = ARRAY['trapèzes', 'haltère']
WHERE id = 'mk_dumbbell-seated-shrug';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes postérieurs, haut du dos.',
  execution = 'Assis, buste penché en avant, on écarte les bras tendus vers l''arrière.',
  utilite = 'Travaille une zone souvent négligée à l''entraînement.',
  a_noter = 'Charge légère, contrôler la descente plutôt que de la laisser tomber.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_dumbbell-seated-rear-delt-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, épaules et jambes en moteur principal.',
  execution = 'Un clean amène l''haltère du sol jusqu''à l''épaule, puis un développé le pousse au-dessus de la tête.',
  utilite = 'Conditionnement associé à de la force globale, un côté à la fois.',
  a_noter = 'Mouvement technique, apprendre le clean à charge légère avant d''augmenter.',
  tags = ARRAY['corps entier', 'haltère']
WHERE id = 'mk_dumbbell-single-arm-clean-and-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps et brachial, avant-bras en secondaire.',
  execution = 'On balaie l''haltère en diagonale devant le buste jusqu''à l''épaule opposée.',
  utilite = 'Variante qui change l''angle de travail du biceps et du brachial.',
  a_noter = 'Garder le coude fixe, le mouvement ne doit venir que de l''avant-bras.',
  tags = ARRAY['biceps', 'haltère']
WHERE id = 'mk_cross-body-hammer-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Épaules, coiffe des rotateurs en secondaire.',
  execution = 'Enchaîne un rowing menton, une rotation externe puis un développé au-dessus de la tête, en une seule répétition.',
  utilite = 'Travaille la mobilité et la stabilité de l''épaule en plus de la force.',
  a_noter = 'Charge légère, la technique prime sur le poids ici.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_cuban-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps.',
  execution = 'Debout, on plie les coudes pour monter les haltères vers les épaules, puis on redescend sous contrôle.',
  utilite = 'Exercice de bras le plus utilisé dans tous les programmes.',
  a_noter = 'Garder les coudes proches du corps, éviter de balancer le buste.',
  tags = ARRAY['biceps', 'haltère']
WHERE id = 'mk_dumbbell-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps.',
  execution = 'Assis, dos soutenu, on plie les coudes pour monter les haltères.',
  utilite = 'Supprime l''élan pour que le biceps travaille sur une amplitude stricte.',
  a_noter = 'Le dossier empêche de tricher avec le dos, garder ce point d''appui.',
  tags = ARRAY['biceps', 'haltère']
WHERE id = 'mk_seated-dumbbell-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps (portion courte surtout).',
  execution = 'À plat ventre sur un banc incliné, bras pendant librement, on plie les coudes pour monter les haltères.',
  utilite = 'Isolation stricte sans triche possible du buste.',
  a_noter = 'Descendre en extension complète pour profiter de tout l''étirement.',
  tags = ARRAY['biceps', 'haltère']
WHERE id = 'mk_spider-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps.',
  execution = 'Assis, coude calé contre l''intérieur de la cuisse, on plie le coude pour monter l''haltère.',
  utilite = 'Biceps pur, sans aucune triche du corps.',
  a_noter = 'Mouvement lent, bien sentir la contraction en haut.',
  tags = ARRAY['biceps', 'haltère']
WHERE id = 'mk_dumbbell-concentration-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Brachial et avant-bras, biceps en secondaire.',
  execution = 'Debout, paumes face à face, on plie les coudes pour monter les haltères.',
  utilite = 'Curl épaisseur qui construit le brachial et les avant-bras.',
  a_noter = 'Garder les poignets neutres tout du long, ne pas les faire tourner.',
  tags = ARRAY['biceps', 'avant-bras', 'haltère']
WHERE id = 'mk_dumbbell-hammer-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps (bas du biceps).',
  execution = 'Bras fixé contre un pupitre, on plie le coude pour monter l''haltère puis on redescend sous contrôle.',
  utilite = 'Isolation stricte qui construit le bas du biceps.',
  a_noter = 'Ne pas verrouiller le coude en extension complète, garder une légère tension.',
  tags = ARRAY['biceps', 'haltère']
WHERE id = 'mk_dumbbell-preacher-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps et avant-bras.',
  execution = 'On monte l''haltère paumes vers le haut puis on redescend paumes vers le bas.',
  utilite = 'Travaille le biceps et l''avant-bras en une seule répétition.',
  a_noter = 'Rotation du poignet en haut du mouvement, avant d''entamer la descente.',
  tags = ARRAY['biceps', 'avant-bras', 'haltère']
WHERE id = 'mk_zottman-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Brachial et avant-bras, un bras à la fois.',
  execution = 'Debout, paume face à la cuisse, on plie le coude pour monter l''haltère.',
  utilite = 'Curl qui donne des bras à l''aspect plus épais, un côté à la fois.',
  a_noter = 'Garder le coude fixe le long du corps.',
  tags = ARRAY['biceps', 'avant-bras', 'haltère']
WHERE id = 'mk_dumbbell-standing-single-arm-hammer-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps, un bras à la fois.',
  execution = 'Debout, on plie le coude pour monter l''haltère vers l''épaule, puis on redescend.',
  utilite = 'Constructeur de biceps unilatéral le plus simple de tout programme.',
  a_noter = 'Éviter de balancer le buste pour aider la montée.',
  tags = ARRAY['biceps', 'haltère']
WHERE id = 'mk_dumbbell-standing-single-arm-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas des pectoraux.',
  execution = 'Sur un banc décliné, on écarte les bras tendus puis on les ramène au-dessus de la poitrine.',
  utilite = 'Isole le bas des pectoraux sur un étirement long.',
  a_noter = 'Garder une légère flexion des coudes tout du long pour protéger les épaules.',
  tags = ARRAY['pectoraux', 'haltère']
WHERE id = 'mk_dumbbell-decline-chest-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps (longue portion).',
  execution = 'Sur un banc décliné, on plie les coudes pour descendre les haltères vers le front, puis on repousse.',
  utilite = 'Privilégie la longue portion du triceps sur une amplitude profonde.',
  a_noter = 'Garder les coudes fixes, seul l''avant-bras bouge.',
  tags = ARRAY['triceps', 'haltère']
WHERE id = 'mk_dumbbell-decline-skullcrusher';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps en secondaire.',
  execution = 'Allongé au sol, on pousse les haltères vers le haut, les bras s''arrêtant au niveau du sol.',
  utilite = 'Amplitude raccourcie qui préserve les épaules.',
  a_noter = 'Bonne option en cas de gêne à l''épaule sur le développé couché classique.',
  tags = ARRAY['pectoraux', 'haltère']
WHERE id = 'mk_floor-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps et avant des épaules.',
  execution = 'Allongé sur un banc, on pousse les haltères au-dessus de la poitrine puis on redescend sous contrôle.',
  utilite = 'Constructeur de pectoraux à grande amplitude, plus doux pour les épaules qu''une barre.',
  a_noter = 'Garder les haltères alignés au-dessus des coudes, pas au-dessus du visage.',
  tags = ARRAY['pectoraux', 'haltère']
WHERE id = 'mk_dumbbell-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps en secondaire.',
  execution = 'Développé à plat, paumes face à face, coudes serrés.',
  utilite = 'Version plus douce pour les épaules que la prise pronation.',
  a_noter = 'Garder les poignets neutres tout du long.',
  tags = ARRAY['pectoraux', 'haltère']
WHERE id = 'mk_neutral-grip-dumbbell-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, gainage anti-rotation en secondaire.',
  execution = 'Un seul haltère poussé au-dessus de la poitrine pendant que le tronc résiste à la rotation.',
  utilite = 'Exercice de poussée qui devient aussi du gainage.',
  a_noter = 'Garder le bassin stable, ne pas laisser le buste tourner.',
  tags = ARRAY['pectoraux', 'gainage', 'haltère']
WHERE id = 'mk_dumbbell-single-arm-chest-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas des pectoraux, triceps en secondaire.',
  execution = 'Sur un banc décliné, on pousse les haltères au-dessus de la poitrine.',
  utilite = 'Privilégie le bas des pectoraux.',
  a_noter = 'S''assurer que le banc est stable et sécurisé avant de charger.',
  tags = ARRAY['pectoraux', 'haltère']
WHERE id = 'mk_dumbbell-decline-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux, avant des épaules et triceps.',
  execution = 'Sur un banc incliné, on pousse les haltères au-dessus de la poitrine.',
  utilite = 'Mouvement de référence pour le haut des pectoraux.',
  a_noter = 'Un banc trop incliné déplace le travail vers les épaules plutôt que les pectoraux.',
  tags = ARRAY['pectoraux', 'haltère']
WHERE id = 'mk_dumbbell-incline-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes, gainage anti-flexion latérale.',
  execution = 'Debout, un seul haltère poussé au-dessus de la tête pendant que le tronc résiste à la flexion latérale.',
  utilite = 'Chaque épaule travaille seule, bon test d''asymétrie.',
  a_noter = 'Garder le tronc gainé pour ne pas basculer sur le côté.',
  tags = ARRAY['épaules', 'gainage', 'haltère']
WHERE id = 'mk_single-arm-dumbbell-overhead-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux.',
  execution = 'Allongé sur un banc, on écarte les bras tendus en grand arc puis on les ramène au-dessus de la poitrine.',
  utilite = 'Isole les pectoraux sur un étirement long et une contraction franche.',
  a_noter = 'Garder une légère flexion des coudes pour protéger les épaules.',
  tags = ARRAY['pectoraux', 'haltère']
WHERE id = 'mk_dumbbell-chest-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde antérieur.',
  execution = 'Debout, on lève les haltères tendus devant soi jusqu''à hauteur d''épaule, puis on redescend.',
  utilite = 'Isole l''avant des épaules dans un arc propre et contrôlé.',
  a_noter = 'Éviter l''élan, monter uniquement avec l''épaule.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_dumbbell-front-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde latéral.',
  execution = 'Debout, on lève les haltères tendus sur les côtés jusqu''à hauteur d''épaule.',
  utilite = 'Isolation fondamentale pour la largeur des épaules.',
  a_noter = 'Légère flexion des coudes, ne pas monter au-delà de l''épaule.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_dumbbell-lateral-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Extenseurs de l''avant-bras.',
  execution = 'Assis, avant-bras posé, paume vers le bas, on lève l''haltère en pliant le poignet vers le haut.',
  utilite = 'Complément qui équilibre le travail des fléchisseurs du poignet.',
  a_noter = 'Charge légère, l''avant-bras est une petite articulation à ne pas surcharger.',
  tags = ARRAY['avant-bras', 'haltère']
WHERE id = 'mk_dumbbell-wrist-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Érecteurs du rachis, fessiers et ischio-jambiers.',
  execution = 'Sur un banc à 45 degrés, haltère tenu contre la poitrine, on descend puis on remonte à l''horizontale.',
  utilite = 'Ajoute de la résistance au hip hinge du bas du dos.',
  a_noter = 'Ne pas cambrer au-delà de la ligne neutre en haut.',
  tags = ARRAY['dos', 'haltère']
WHERE id = 'mk_dumbbell-back-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps (longue portion).',
  execution = 'Assis, on descend un haltère derrière la tête à deux mains puis on le repousse en extension complète.',
  utilite = 'Place la longue portion du triceps en étirement complet.',
  a_noter = 'Garder les coudes proches de la tête, pas écartés.',
  tags = ARRAY['triceps', 'haltère']
WHERE id = 'mk_dumbbell-seated-overhead-tricep-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps, un bras à la fois.',
  execution = 'Assis ou debout, on descend l''haltère derrière la tête à un bras puis on le repousse jusqu''au verrouillage.',
  utilite = 'Isolation unilatérale incontournable des jours de bras.',
  a_noter = 'Garder le coude fixe et proche de la tête tout du long.',
  tags = ARRAY['triceps', 'haltère']
WHERE id = 'mk_single-arm-tricep-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Haltères le long du corps, fentes avant enchaînées en alternant les jambes.',
  utilite = 'Travaille les quadriceps, les fessiers et l''équilibre d''un côté à la fois.',
  a_noter = 'Garder le buste droit, le genou avant ne dépasse pas la pointe du pied.',
  tags = ARRAY['jambes', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-alternating-forward-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Haltère tenu contre la poitrine, on effectue une fente avant en marchant.',
  utilite = 'Travaille les quadriceps, les fessiers et la mécanique de foulée en un seul mouvement.',
  a_noter = 'Garder l''haltère bien serré contre le buste pour ne pas se déséquilibrer.',
  tags = ARRAY['jambes', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-goblet-forward-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, jambe avant en moteur principal.',
  execution = 'Pied arrière surélevé sur un banc, haltères en mains, on descend en fente puis on repousse.',
  utilite = 'L''un des exercices unilatéraux les plus rentables pour les jambes.',
  a_noter = 'Buste droit, le genou avant guide le mouvement.',
  tags = ARRAY['jambes', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-bulgarian-split-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, jambe avant en moteur principal.',
  execution = 'Pied arrière surélevé, haltère tenu contre la poitrine, on descend en fente puis on repousse.',
  utilite = 'Constructeur unilatéral de référence pour les quadriceps, les fessiers et l''équilibre.',
  a_noter = 'Garder l''haltère proche du corps pour ne pas perdre l''équilibre.',
  tags = ARRAY['jambes', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-goblet-bulgarian-split-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, adducteurs en secondaire.',
  execution = 'Haltère en position goblet, on croise une jambe derrière l''autre en fente, puis on alterne les côtés.',
  utilite = 'Travaille les fessiers sous un angle croisé, différent de la fente classique.',
  a_noter = 'Garder le buste droit, ne pas se pencher vers l''avant en descendant.',
  tags = ARRAY['fessiers', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-goblet-alternating-curtsy-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et quadriceps.',
  execution = 'Haltère tenu contre la poitrine, on effectue une fente en pas arrière puis on revient.',
  utilite = 'Plus douce pour les genoux et plus axée fessiers que la version avant.',
  a_noter = 'Poser le pied arrière sur la pointe, garder le poids sur la jambe avant.',
  tags = ARRAY['jambes', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-goblet-reverse-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, adducteurs et quadriceps.',
  execution = 'Un haltère dans chaque main, on fait un grand pas sur le côté en pliant la jambe qui reçoit le poids.',
  utilite = 'Charge une hanche à la fois tout en ouvrant l''intérieur des cuisses.',
  a_noter = 'Garder le pied qui pousse bien à plat, le genou suit la direction du pied.',
  tags = ARRAY['jambes', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-lateral-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, un côté à la fois.',
  execution = 'Hip thrust avec la jambe libre croisée en position figure-4, talons surélevés, haltère sur les hanches.',
  utilite = 'Isole un fessier sur une amplitude profonde.',
  a_noter = 'Garder le bassin droit malgré la position asymétrique de la jambe.',
  tags = ARRAY['fessiers', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-figure-four-heels-elevated-hip-thrust';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fléchisseurs de l''avant-bras.',
  execution = 'Assis, avant-bras posé, paume vers le haut, on plie le poignet pour lever l''haltère.',
  utilite = 'Renforce le poignet et donne du volume à l''avant-bras.',
  a_noter = 'Charge légère, mouvement de faible amplitude au niveau du poignet.',
  tags = ARRAY['avant-bras', 'haltère']
WHERE id = 'mk_dumbbell-wrist-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Obliques, carré des lombes.',
  execution = 'Debout, un haltère dans une main, on incline le buste sur le côté puis on revient.',
  utilite = 'Mouvement simple et ciblé pour le côté du tronc.',
  a_noter = 'Incliner depuis la taille, pas depuis les hanches.',
  tags = ARRAY['obliques', 'haltère']
WHERE id = 'mk_dumbbell-side-bend';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers.',
  execution = 'À plat ventre, haltère tenu entre les pieds, on plie les genoux pour ramener les talons vers les fessiers.',
  utilite = 'Isole les ischio-jambiers sans machine dédiée.',
  a_noter = 'Mouvement lent, surtout à la descente pour bien contrôler la charge.',
  tags = ARRAY['ischio-jambiers', 'haltère']
WHERE id = 'mk_hamstring-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Trapèzes (haut).',
  execution = 'Debout, haltères le long du corps, on monte les épaules vers les oreilles puis on redescend.',
  utilite = 'Exercice de trapèzes le plus accessible, incontournable des jours de tirage.',
  a_noter = 'Monter verticalement, éviter de faire rouler les épaules.',
  tags = ARRAY['trapèzes', 'haltère']
WHERE id = 'mk_dumbbell-shrug';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, un côté à la fois.',
  execution = 'Appuyé sur un banc, haltère au pli des hanches, on monte les hanches en poussant sur une seule jambe.',
  utilite = 'Travaille un fessier sur une amplitude profonde.',
  a_noter = 'Garder le bassin droit, ne pas le laisser tourner vers la jambe levée.',
  tags = ARRAY['fessiers', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-single-leg-hip-thrust';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps (longue portion).',
  execution = 'Assis sur un banc incliné, bras pendant derrière le buste, on plie les coudes pour monter les haltères.',
  utilite = 'Étire la longue portion du biceps avant chaque répétition, bon pour le pic du biceps.',
  a_noter = 'Ne pas avancer les épaules pendant la montée, rester calé contre le banc.',
  tags = ARRAY['biceps', 'haltère']
WHERE id = 'mk_dumbbell-incline-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Brachial et avant-bras, biceps en secondaire.',
  execution = 'Assis sur un banc incliné, paumes face à face, on plie les coudes pour monter les haltères.',
  utilite = 'Combine la prise marteau à un étirement profond du biceps.',
  a_noter = 'Rester calé contre le banc, ne pas tricher avec les épaules.',
  tags = ARRAY['biceps', 'avant-bras', 'haltère']
WHERE id = 'mk_dumbbell-incline-hammer-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux.',
  execution = 'Sur un banc incliné, on écarte les bras tendus puis on les ramène au-dessus de la poitrine.',
  utilite = 'Isole le haut des pectoraux sur un étirement profond.',
  a_noter = 'Garder une légère flexion des coudes pour protéger les épaules.',
  tags = ARRAY['pectoraux', 'haltère']
WHERE id = 'mk_dumbbell-incline-chest-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde antérieur.',
  execution = 'Buste contre un banc incliné, on lève les haltères tendus devant soi.',
  utilite = 'Isole l''avant des épaules sur une amplitude plus complète que la version debout.',
  a_noter = 'Le banc empêche de tricher avec un élan du buste.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_dumbbell-incline-front-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Colonne vertébrale, ischio-jambiers en étirement.',
  execution = 'Debout, haltère en mains, on enroule la colonne vertèbre par vertèbre vers l''avant, lentement.',
  utilite = 'Développe la mobilité des ischio-jambiers et du bas du dos.',
  a_noter = 'Charge légère, mouvement lent, à éviter en cas de douleur lombaire active.',
  tags = ARRAY['mobilité', 'dos', 'haltère']
WHERE id = 'mk_dumbbell-spinal-jefferson-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps.',
  execution = 'Buste penché en avant, coude fixé à l''horizontale, on tend le bras vers l''arrière puis on revient.',
  utilite = 'Finition classique des jours de bras.',
  a_noter = 'Garder le coude fixe, seul l''avant-bras bouge.',
  tags = ARRAY['triceps', 'haltère']
WHERE id = 'mk_dumbbell-tricep-kickback';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers.',
  execution = 'À plat ventre, haltère serré entre les pieds, on plie les genoux pour ramener les talons vers les fessiers.',
  utilite = 'Isolation des ischio-jambiers qui ne nécessite aucune machine.',
  a_noter = 'Mouvement contrôlé, surtout à la descente.',
  tags = ARRAY['ischio-jambiers', 'haltère']
WHERE id = 'mk_dumbbell-leg-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, système cardiovasculaire sollicité.',
  execution = 'Enchaîne une pompe, deux rowings en renegade, un squat clean et un développé au-dessus de la tête.',
  utilite = 'Conditionnement complet qui combine force et cardio en une seule répétition.',
  a_noter = 'Mouvement technique et exigeant, réduire la charge pour garder une bonne exécution.',
  tags = ARRAY['corps entier', 'cardio', 'haltère']
WHERE id = 'mk_man-maker';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Mollets (soléaire).',
  execution = 'Assis, haltère posé sur les cuisses près des genoux, on monte sur la pointe des pieds puis on redescend.',
  utilite = 'Genou fléchi qui privilégie le soléaire plutôt que le jumeau.',
  a_noter = 'Descendre en étirement complet pour profiter de toute l''amplitude.',
  tags = ARRAY['mollets', 'haltère']
WHERE id = 'mk_seated-calf-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Mollets, un côté à la fois.',
  execution = 'Debout sur une jambe, haltère en main, on monte sur la pointe du pied puis on redescend.',
  utilite = 'Façon la plus simple de charger fortement chaque mollet sans machine.',
  a_noter = 'S''aider d''un appui pour l''équilibre si besoin.',
  tags = ARRAY['mollets', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-single-leg-calf-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes postérieurs, haut du dos.',
  execution = 'Buste penché en avant, on écarte les bras tendus vers l''arrière en serrant les omoplates.',
  utilite = 'Isolation classique de l''arrière des épaules dans tout programme épaules.',
  a_noter = 'Charge légère, contrôler le mouvement plutôt que de tricher avec le dos.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_dumbbell-rear-delt-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, ischio-jambiers en secondaire.',
  execution = 'Pieds surélevés sur un banc, haltère sur les hanches, on monte le bassin puis on redescend.',
  utilite = 'Plus grande amplitude qui sollicite davantage les fessiers qu''un pont classique.',
  a_noter = 'Garder le bassin stable, contraction franche en haut.',
  tags = ARRAY['fessiers', 'haltère']
WHERE id = 'mk_dumbbell-feet-elevated-glute-bridge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes, jambes en moteur d''appoint.',
  execution = 'Une courte flexion des jambes aide à lancer les haltères au-dessus de la tête.',
  utilite = 'Permet de développer une charge plus lourde que le développé militaire strict.',
  a_noter = 'La flexion de jambes doit rester courte, ce n''est pas un squat.',
  tags = ARRAY['épaules', 'haltère']
WHERE id = 'mk_dumbbell-push-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand droit de l''abdomen, fléchisseurs de hanche.',
  execution = 'Allongé sur le dos, haltère sur la poitrine, on redresse le buste jusqu''à s''asseoir puis on redescend.',
  utilite = 'Façon simple d''ajouter de la résistance au redressement assis classique.',
  a_noter = 'Garder l''haltère bien calé contre la poitrine pendant tout le mouvement.',
  tags = ARRAY['abdominaux', 'haltère']
WHERE id = 'mk_dumbbell-situp';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, milieu du dos et biceps.',
  execution = 'Allongé face contre un banc incliné, on tire les haltères vers les hanches puis on redescend.',
  utilite = 'Le banc supprime le hinge pour que le dos travaille sans charger le bas du dos.',
  a_noter = 'Bonne option en cas de gêne au bas du dos sur le rowing buste penché classique.',
  tags = ARRAY['dos', 'haltère']
WHERE id = 'mk_chest-supported-dumbbell-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, milieu du dos et biceps.',
  execution = 'Buste penché en avant, dos plat, on tire les deux haltères vers les hanches puis on redescend.',
  utilite = 'Constructeur de référence pour l''épaisseur du dos.',
  a_noter = 'Garder le dos plat, le mouvement part des omoplates.',
  tags = ARRAY['dos', 'haltère']
WHERE id = 'mk_dumbbell-row-bilateral';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes latéraux, trapèzes en secondaire.',
  execution = 'Debout, on tire les haltères verticalement le long du corps jusqu''à hauteur de poitrine.',
  utilite = 'Travaille les épaules latérales et le haut des trapèzes en un seul exercice.',
  a_noter = 'Ne pas monter les coudes au-dessus des épaules pour éviter de gêner l''épaule.',
  tags = ARRAY['épaules', 'trapèzes', 'haltère']
WHERE id = 'mk_dumbbell-upright-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, milieu du dos et biceps, un côté à la fois.',
  execution = 'Buste calé sur un banc, un genou et une main en appui, on tire l''haltère vers la hanche.',
  utilite = 'Constructeur classique pour l''épaisseur du dos, un côté à la fois.',
  a_noter = 'Éviter de tourner le buste pour tirer plus haut, le mouvement reste dans le plan du dos.',
  tags = ARRAY['dos', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-row-unilateral';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut du dos, grand dorsal et biceps.',
  execution = 'Buste calé sur un banc, on tire l''haltère vers la hanche d''un côté à la fois.',
  utilite = 'Incontournable des jours de tirage, un côté à la fois.',
  a_noter = 'Garder le buste stable, éviter de tourner pour tirer plus haut.',
  tags = ARRAY['dos', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-single-arm-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Obliques et abdominaux.',
  execution = 'Assis, buste légèrement penché en arrière, haltère en mains, on tourne le buste d''un côté à l''autre.',
  utilite = 'Ajoute de la charge à la torsion du tronc.',
  a_noter = 'Tourner depuis le tronc, pas seulement les bras.',
  tags = ARRAY['abdominaux', 'obliques', 'haltère']
WHERE id = 'mk_dumbbell-russian-twist';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps.',
  execution = 'Allongé, on plie les coudes pour descendre les haltères vers le front, puis on repousse.',
  utilite = 'Exercice de volume le plus programmé pour l''arrière des bras.',
  a_noter = 'Garder les coudes fixes, seul l''avant-bras bouge.',
  tags = ARRAY['triceps', 'haltère']
WHERE id = 'mk_dumbbell-skullcrusher';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers et bas du dos.',
  execution = 'Un haltère dans chaque main le long des jambes, on descend en poussant les hanches en arrière, dos plat, puis on remonte.',
  utilite = 'Version accessible du soulevé de terre, sans barre.',
  a_noter = 'Garder les haltères proches des jambes tout du long.',
  tags = ARRAY['ischio-jambiers', 'dos', 'haltère']
WHERE id = 'mk_dumbbell-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers et fessiers, jambe avant en moteur principal.',
  execution = 'Orteil arrière posé au sol pour l''équilibre, la jambe avant porte l''essentiel de la charge en hip hinge.',
  utilite = 'Version semi-unilatérale, plus stable qu''un RDL à une jambe complète.',
  a_noter = 'Le pied arrière sert d''appui léger, pas de porter du poids.',
  tags = ARRAY['ischio-jambiers', 'haltère']
WHERE id = 'mk_kickstand-dumbbell-romanian-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et ischio-jambiers, un côté à la fois.',
  execution = 'L''haltère se déplace devant le corps vers le pied opposé pendant le hip hinge sur une jambe.',
  utilite = 'Privilégie le fessier et l''ischio-jambier de la jambe de travail sur un long hinge.',
  a_noter = 'Garder les hanches à niveau malgré le mouvement diagonal du bras.',
  tags = ARRAY['ischio-jambiers', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-cross-body-romanian-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers en secondaire.',
  execution = 'Depuis une plateforme surélevée, hip hinge classique pour une amplitude plus longue.',
  utilite = 'Travaille les ischio-jambiers sur une plus grande amplitude qu''au sol.',
  a_noter = 'Ne pas forcer l''amplitude au détriment d''un dos plat.',
  tags = ARRAY['ischio-jambiers', 'haltère']
WHERE id = 'mk_deficit-dumbbell-romanian-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers en secondaire.',
  execution = 'Hip hinge jusqu''à l''étirement des ischio-jambiers, puis retour explosif des hanches.',
  utilite = 'Travaille la vitesse et la puissance du hip hinge, pas seulement la force.',
  a_noter = 'Garder le dos plat même à vitesse plus rapide, ne pas sacrifier la technique.',
  tags = ARRAY['ischio-jambiers', 'puissance', 'haltère']
WHERE id = 'mk_hip-hinge-speed-romanian-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers et fessiers, un côté à la fois.',
  execution = 'Sur une jambe, haltère en main, on incline le buste vers l''avant en tendant l''autre jambe en arrière.',
  utilite = 'Charge un ischio-jambier et un fessier tout en travaillant l''équilibre.',
  a_noter = 'Garder les hanches à niveau, ne pas les laisser tourner.',
  tags = ARRAY['ischio-jambiers', 'unilatéral', 'haltère']
WHERE id = 'mk_single-leg-dumbbell-romanian-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers et fessiers, un côté à la fois.',
  execution = 'Depuis une plateforme surélevée, hip hinge sur une jambe avec un kettlebell, pour plus d''amplitude en bas.',
  utilite = 'Ajoute de l''amplitude en bas du hinge sous charge, version avancée du RDL unilatéral.',
  a_noter = 'Demande déjà une bonne maîtrise du RDL unilatéral au sol avant de descendre en déficit.',
  tags = ARRAY['ischio-jambiers', 'unilatéral', 'haltère']
WHERE id = 'mk_single-leg-kettlebell-romanian-deadlift-deficit';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps, fessiers en secondaire.',
  execution = 'Squat avant avec une descente délibérément lente et un tempo imposé.',
  utilite = 'Renforce le contrôle et la force dans la partie basse du squat.',
  a_noter = 'Respecter le tempo même si ça oblige à réduire la charge.',
  tags = ARRAY['jambes', 'haltère']
WHERE id = 'mk_dumbbell-front-squat-tempo';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps, fessiers en secondaire.',
  execution = 'Un haltère à chaque épaule, on descend en squat en gardant le buste droit.',
  utilite = 'Charge le corps à l''avant, ce qui aide à garder une posture droite.',
  a_noter = 'Garder les coudes hauts pour stabiliser les haltères sur les épaules.',
  tags = ARRAY['jambes', 'haltère']
WHERE id = 'mk_dumbbell-front-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Adducteurs, quadriceps et fessiers.',
  execution = 'Jambes très écartées, haltère contre la poitrine, on descend sur une jambe en pliant le genou.',
  utilite = 'Contrepoids qui aide l''équilibre dans ce squat latéral profond.',
  a_noter = 'Garder le pied de la jambe tendue bien à plat au sol.',
  tags = ARRAY['jambes', 'mobilité', 'haltère']
WHERE id = 'mk_dumbbell-cossack-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Position de fente statique, les deux pieds ancrés au sol, haltère tenu contre la poitrine.',
  utilite = 'Exercice unilatéral d''entrée pour les quadriceps et les fessiers.',
  a_noter = 'Garder le buste droit, l''haltère bien calé contre le corps.',
  tags = ARRAY['jambes', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-goblet-split-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps, fessiers en secondaire.',
  execution = 'Pied avant sur une petite surélévation, on descend en fente pour approfondir l''amplitude de la jambe avant.',
  utilite = 'Approfondit l''amplitude par rapport à un squat fendu classique.',
  a_noter = 'Garder le buste droit malgré l''amplitude plus grande.',
  tags = ARRAY['jambes', 'unilatéral', 'haltère']
WHERE id = 'mk_front-foot-elevated-split-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Haltère tenu contre la poitrine, on descend en squat en gardant le buste droit.',
  utilite = 'Façon la plus simple d''enseigner le schéma du squat.',
  a_noter = 'Garder les coudes à l''intérieur des genoux en bas du mouvement.',
  tags = ARRAY['jambes', 'débutant', 'haltère']
WHERE id = 'mk_dumbbell-goblet-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, stabilité des épaules.',
  execution = 'Haltères bras tendus au-dessus de la tête, on descend en squat complet.',
  utilite = 'Exige une bonne stabilité des épaules en plus de la force des jambes.',
  a_noter = 'Charge légère au début, la stabilité prime avant la charge.',
  tags = ARRAY['jambes', 'épaules', 'haltère']
WHERE id = 'mk_dumbbell-overhead-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, un côté à la fois.',
  execution = 'Haltère dans chaque main, on monte sur une box basse en propulsant avec la jambe du dessus.',
  utilite = 'Version accessible du step-up, box basse pour limiter l''amplitude.',
  a_noter = 'Pousser avec la jambe du dessus, ne pas s''aider de la jambe au sol.',
  tags = ARRAY['jambes', 'unilatéral', 'haltère']
WHERE id = 'mk_dumbbell-step-up-low';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et adducteurs.',
  execution = 'Jambes très écartées, pointes de pieds vers l''extérieur, haltère suspendu entre les jambes, on descend en squat.',
  utilite = 'Privilégie les fessiers et l''intérieur des cuisses plus qu''un squat classique.',
  a_noter = 'Garder les genoux alignés avec les pointes de pieds.',
  tags = ARRAY['jambes', 'haltère']
WHERE id = 'mk_dumbbell-sumo-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas du dos, fessiers et chaîne postérieure.',
  execution = 'À plat ventre, haltère en main, on lève la poitrine, les bras et les jambes ensemble.',
  utilite = 'Version chargée du superman pour renforcer davantage le bas du dos.',
  a_noter = 'Mouvement contrôlé, pas besoin de monter très haut.',
  tags = ARRAY['dos', 'haltère']
WHERE id = 'mk_dumbbell-superman';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers.',
  execution = 'Talons surélevés sur une petite plateforme, haltère sur les hanches, on monte le bassin.',
  utilite = 'Allonge l''amplitude de travail et privilégie les fessiers.',
  a_noter = 'Contraction franche en haut, ne pas cambrer excessivement le bas du dos.',
  tags = ARRAY['fessiers', 'haltère']
WHERE id = 'mk_dumbbell-heels-elevated-hip-thrust';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps.',
  execution = 'Allongé, coudes écartés, on abaisse les extrémités des haltères vers la poitrine puis on repousse.',
  utilite = 'Variante d''extension triceps qui change l''angle de travail.',
  a_noter = 'Garder les coudes fixes sur le côté, ne pas les laisser descendre.',
  tags = ARRAY['triceps', 'haltère']
WHERE id = 'mk_tate-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, quadriceps et épaules en moteur principal.',
  execution = 'Un squat avant enchaîné directement sur un développé au-dessus de la tête, en un seul mouvement.',
  utilite = 'Mouvement le plus exigeant pour le conditionnement et le travail global du corps.',
  a_noter = 'Utiliser l''élan du squat pour lancer le développé, pas seulement les bras.',
  tags = ARRAY['corps entier', 'cardio', 'haltère']
WHERE id = 'mk_dumbbell-thruster';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes, gainage du tronc.',
  execution = 'Assis au sol, jambes tendues, on pousse les haltères au-dessus de la tête sans aucun soutien du dos.',
  utilite = 'Le tronc ne bénéficie d''aucun soutien, exige beaucoup de stabilité.',
  a_noter = 'Garder le dos droit, éviter de se pencher en arrière pour aider la poussée.',
  tags = ARRAY['épaules', 'gainage', 'haltère']
WHERE id = 'mk_z-press';

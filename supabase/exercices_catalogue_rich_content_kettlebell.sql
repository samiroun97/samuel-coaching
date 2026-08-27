-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi : catégorie kettlebell (25 exercices).
-- Basé sur les descriptions MoveKit d'origine + connaissances de
-- musculation, condensé au même niveau que les lots précédents.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes antérieurs et latéraux, triceps en secondaire.',
  execution = 'Assis, on pousse les kettlebells au-dessus de la tête jusqu''à l''extension complète.',
  utilite = 'Isole les épaules sans élan des jambes.',
  a_noter = 'Garder le tronc gainé, ne pas cambrer le bas du dos.',
  tags = ARRAY['épaules', 'kettlebell']
WHERE id = 'mk_kettlebell-seated-overhead-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps, avant-bras en secondaire.',
  execution = 'Debout, on plie les coudes pour monter le kettlebell vers l''épaule.',
  utilite = 'La charge décentrée ajoute un travail de préhension au curl classique.',
  a_noter = 'Garder le poignet stable, la prise du kettlebell est moins naturelle qu''un haltère.',
  tags = ARRAY['biceps', 'kettlebell']
WHERE id = 'mk_kettlebell-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps.',
  execution = 'Kettlebell tenu à deux mains par les cornes, on plie les coudes pour le monter.',
  utilite = 'Travaille le biceps directement avec un seul kettlebell.',
  a_noter = 'Garder les coudes fixes le long du corps.',
  tags = ARRAY['biceps', 'kettlebell']
WHERE id = 'mk_kettlebell-goblet-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps et stabilité des épaules.',
  execution = 'Allongé, on pousse les kettlebells au-dessus de la poitrine.',
  utilite = 'La charge décentrée met à l''épreuve la stabilité des épaules en plus des pectoraux.',
  a_noter = 'Garder les poignets stables, la prise est moins naturelle qu''un haltère.',
  tags = ARRAY['pectoraux', 'kettlebell']
WHERE id = 'mk_kettlebell-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux, avant des épaules et triceps.',
  execution = 'Sur un banc incliné, on pousse les kettlebells au-dessus de la poitrine.',
  utilite = 'Trajectoire profonde et respectueuse des articulations.',
  a_noter = 'Ne pas trop incliner le banc pour garder le travail sur les pectoraux.',
  tags = ARRAY['pectoraux', 'kettlebell']
WHERE id = 'mk_kettlebell-incline-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde antérieur.',
  execution = 'Debout, on lève le kettlebell tendu devant soi jusqu''à hauteur d''épaule.',
  utilite = 'Isolation directe pour les blocs complémentaires de jour d''épaules.',
  a_noter = 'Éviter l''élan, monter uniquement avec l''épaule.',
  tags = ARRAY['épaules', 'kettlebell']
WHERE id = 'mk_kettlebell-front-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Préhension, trapèzes et gainage.',
  execution = 'Un kettlebell dans chaque main, on marche en gardant le buste droit.',
  utilite = 'Renforcement complet du corps déguisé en simple marche.',
  a_noter = 'Garder les épaules basses et le buste droit tout du long.',
  tags = ARRAY['préhension', 'gainage', 'kettlebell']
WHERE id = 'mk_kettlebell-farmers-carry';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, jambe avant en moteur principal.',
  execution = 'Pied arrière surélevé, kettlebell tenu comme contrepoids, on descend en fente puis on repousse.',
  utilite = 'Le contrepoids facilite l''équilibre et permet une amplitude plus profonde.',
  a_noter = 'Garder le kettlebell proche du corps pour l''effet de contrepoids.',
  tags = ARRAY['jambes', 'unilatéral', 'kettlebell']
WHERE id = 'mk_kettlebell-assisted-bulgarian-split-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Moyen fessier, stabilisateurs de l''intérieur de la jambe.',
  execution = 'Kettlebell tenu contre la poitrine, on croise une jambe derrière l''autre en fente, en alternant les côtés.',
  utilite = 'Outil précis pour les programmes axés fessiers.',
  a_noter = 'Garder le buste droit, ne pas se pencher vers l''avant en descendant.',
  tags = ARRAY['fessiers', 'unilatéral', 'kettlebell']
WHERE id = 'mk_kettlebell-alternating-curtsy-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et biceps.',
  execution = 'Jambes écartées, deux kettlebells au sol, on tire alternativement chaque kettlebell vers la hanche.',
  utilite = 'Tension constante sur le dos grâce à l''alternance sans temps de repos.',
  a_noter = 'Garder le dos plat pendant tout le mouvement.',
  tags = ARRAY['dos', 'kettlebell']
WHERE id = 'mk_kettlebell-gorilla-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Trapèzes (haut).',
  execution = 'Debout, kettlebells le long du corps, on monte les épaules vers les oreilles.',
  utilite = 'Élévation verticale propre pour isoler le haut des trapèzes.',
  a_noter = 'Monter verticalement, éviter de faire rouler les épaules.',
  tags = ARRAY['trapèzes', 'kettlebell']
WHERE id = 'mk_kettlebell-shrug';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers.',
  execution = 'Appuyé sur un banc, kettlebell sur les hanches, on pousse jusqu''à l''extension complète.',
  utilite = 'Réponse pratique à la maison à la version barre.',
  a_noter = 'Utiliser une serviette sous le kettlebell pour le confort des hanches.',
  tags = ARRAY['fessiers', 'kettlebell']
WHERE id = 'mk_kettlebell-hip-thrust';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Colonne vertébrale, ischio-jambiers en étirement.',
  execution = 'Debout, kettlebell léger en mains, on enroule la colonne vertèbre par vertèbre.',
  utilite = 'Développe la mobilité chargée en fin d''amplitude du dos.',
  a_noter = 'Charge très légère, mouvement lent, à éviter en cas de douleur lombaire active.',
  tags = ARRAY['mobilité', 'dos', 'kettlebell']
WHERE id = 'mk_kettlebell-spinal-jefferson-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Mollets.',
  execution = 'Debout, kettlebell en main, on monte sur la pointe des pieds puis on redescend.',
  utilite = 'Isolation directe des mollets pour tout bloc de finition de jour de jambes.',
  a_noter = 'Descendre en étirement complet pour profiter de toute l''amplitude.',
  tags = ARRAY['mollets', 'kettlebell']
WHERE id = 'mk_kettlebell-calf-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Obliques, stabilité de l''épaule et mobilité de hanche.',
  execution = 'Kettlebell tenu au-dessus de la tête, on incline le buste vers le pied opposé en gardant le bras tendu.',
  utilite = 'Combine force des obliques, stabilité d''épaule et mobilité de hanche en un mouvement.',
  a_noter = 'Mouvement technique, commencer sans charge pour apprendre le schéma.',
  tags = ARRAY['obliques', 'mobilité', 'kettlebell']
WHERE id = 'mk_kettlebell-windmill';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes, jambes en moteur d''appoint.',
  execution = 'Kettlebell calé à l''épaule, une courte flexion des jambes aide à le pousser au-dessus de la tête.',
  utilite = 'Permet de développer une puissance athlétique au-delà du développé strict.',
  a_noter = 'La flexion de jambes doit rester courte, ce n''est pas un squat.',
  tags = ARRAY['épaules', 'kettlebell']
WHERE id = 'mk_kettlebell-push-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et biceps.',
  execution = 'Buste penché en avant, deux kettlebells en mains, on tire vers les hanches.',
  utilite = 'Construit le dos dans un schéma de tirage horizontal.',
  a_noter = 'Garder le dos plat pendant tout le hip hinge.',
  tags = ARRAY['dos', 'kettlebell']
WHERE id = 'mk_kettlebell-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Milieu du dos, grand dorsal et biceps.',
  execution = 'Position décalée, un kettlebell en main, on tire vers la hanche.',
  utilite = 'Charge le dos d''un côté à la fois avec une base stable.',
  a_noter = 'Garder le buste stable, ne pas tourner pour tirer plus loin.',
  tags = ARRAY['dos', 'unilatéral', 'kettlebell']
WHERE id = 'mk_kettlebell-row-single';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et biceps, un côté à la fois.',
  execution = 'Buste calé sur un banc, on tire le kettlebell vers la hanche d''un côté à la fois.',
  utilite = 'Isole le dos sur une amplitude complète et propre.',
  a_noter = 'Éviter de tourner le buste pour tirer plus haut.',
  tags = ARRAY['dos', 'unilatéral', 'kettlebell']
WHERE id = 'mk_kettlebell-single-arm-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers et bas du dos.',
  execution = 'Kettlebell en mains, genoux à peine fléchis, on descend en hip hinge puis on remonte.',
  utilite = 'Charge la chaîne postérieure sur un étirement lent et contrôlé.',
  a_noter = 'Le dos reste plat, le mouvement part des hanches.',
  tags = ARRAY['ischio-jambiers', 'kettlebell']
WHERE id = 'mk_kettlebell-romanian-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Kettlebell tenu par les cornes à hauteur de poitrine, on descend en squat.',
  utilite = 'Garde le buste droit sur toute la profondeur du squat.',
  a_noter = 'Garder les coudes à l''intérieur des genoux en bas du mouvement.',
  tags = ARRAY['jambes', 'débutant', 'kettlebell']
WHERE id = 'mk_kettlebell-goblet-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, quadriceps et bas du dos.',
  execution = 'Jambes très écartées, kettlebell entre les jambes, on tire en gardant le buste haut et droit.',
  utilite = 'Charge les fessiers et les quadriceps avec une posture plus verticale qu''un soulevé classique.',
  a_noter = 'Garder les genoux alignés avec les pointes de pieds.',
  tags = ARRAY['jambes', 'dos', 'kettlebell']
WHERE id = 'mk_kettlebell-sumo-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et ischio-jambiers, système cardiovasculaire sollicité.',
  execution = 'Hip hinge explosif qui projette le kettlebell jusqu''à hauteur de poitrine.',
  utilite = 'Exercice emblématique du kettlebell pour la puissance et le conditionnement.',
  a_noter = 'Le mouvement part des hanches, pas des bras ni des épaules.',
  tags = ARRAY['fessiers', 'cardio', 'kettlebell']
WHERE id = 'mk_kettlebell-swing';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, quadriceps et épaules en moteur principal.',
  execution = 'Squat avant à deux kettlebells enchaîné directement sur un développé au-dessus de la tête.',
  utilite = 'Travaille jambes, épaules et cardio en un seul mouvement combiné.',
  a_noter = 'Utiliser l''élan du squat pour lancer le développé.',
  tags = ARRAY['corps entier', 'cardio', 'kettlebell']
WHERE id = 'mk_kettlebell-thruster';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, gainage et stabilité des épaules.',
  execution = 'Séquence complète du sol jusqu''à debout puis retour, kettlebell tenu bras tendu au-dessus de la tête.',
  utilite = 'Développe la stabilité, la mobilité et le contrôle du corps entier.',
  a_noter = 'Mouvement très technique, apprendre chaque étape séparément avant charge.',
  tags = ARRAY['corps entier', 'mobilité', 'kettlebell']
WHERE id = 'mk_kettlebell-turkish-get-up';

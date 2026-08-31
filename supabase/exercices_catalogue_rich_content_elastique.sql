-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi : catégorie élastique (18 exercices),
-- dernière catégorie du catalogue complet MoveKit (412/412).
-- Corrige aussi "rotation du tronc à la poulie à l'élastique" qui
-- mentionnait la mauvaise machine.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Moyen fessier.',
  execution = 'Debout, élastique aux chevilles, on écarte une jambe tendue sur le côté.',
  utilite = 'Prépare les hanches au squat, au soulevé de terre et à la course.',
  a_noter = 'Garder le buste stable, ne pas se pencher pour aider le mouvement.',
  tags = ARRAY['fessiers', 'élastique']
WHERE id = 'mk_band-hip-abduction';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps.',
  execution = 'Debout, élastique sous les pieds, on plie les coudes pour monter les mains vers les épaules.',
  utilite = 'Même mouvement qu''un curl haltère, tension progressive tout au long.',
  a_noter = 'Garder les coudes fixes le long du corps.',
  tags = ARRAY['biceps', 'élastique']
WHERE id = 'mk_band-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes antérieurs et latéraux.',
  execution = 'Élastique ancré sous les pieds, on pousse les mains au-dessus de la tête.',
  utilite = 'Tension qui augmente vers le verrouillage, contrairement à une charge libre.',
  a_noter = 'Garder le tronc gainé, ne pas cambrer pour aider la poussée.',
  tags = ARRAY['épaules', 'élastique']
WHERE id = 'mk_band-overhead-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde latéral.',
  execution = 'Élastique sous les pieds, on lève les bras tendus sur les côtés jusqu''à hauteur d''épaule.',
  utilite = 'Construit des épaules plus larges sans haltères.',
  a_noter = 'Légère flexion des coudes, ne pas monter au-delà de l''épaule.',
  tags = ARRAY['épaules', 'élastique']
WHERE id = 'mk_band-lateral-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde latéral, un côté à la fois.',
  execution = 'Élastique sous un pied, on lève un bras tendu sur le côté.',
  utilite = 'Corrige les déséquilibres entre les côtés.',
  a_noter = 'Légère flexion du coude, ne pas monter au-delà de l''épaule.',
  tags = ARRAY['épaules', 'unilatéral', 'élastique']
WHERE id = 'mk_band-single-arm-lateral-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes postérieurs, haut du dos.',
  execution = 'Élastique ancré en hauteur, on tire vers le visage, coudes hauts et écartés.',
  utilite = 'Équilibre le travail de poussée lourde en renforçant l''arrière des épaules.',
  a_noter = 'Tirer les coudes vers l''arrière, pas seulement vers le visage.',
  tags = ARRAY['épaules', 'dos', 'élastique']
WHERE id = 'mk_band-high-face-pull';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Trapèzes (haut).',
  execution = 'Debout, élastique sous les pieds, on monte les épaules vers les oreilles.',
  utilite = 'Manière douce de renforcer la nuque et le haut du dos.',
  a_noter = 'Monter verticalement, éviter de faire rouler les épaules.',
  tags = ARRAY['trapèzes', 'élastique']
WHERE id = 'mk_band-shrug';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers.',
  execution = 'À plat ventre, élastique en boucle à la cheville, on plie le genou pour ramener le talon vers la fesse.',
  utilite = 'Isole les ischio-jambiers sans machine dédiée.',
  a_noter = 'Garder le bassin plaqué au sol, ne pas le laisser se soulever.',
  tags = ARRAY['ischio-jambiers', 'élastique']
WHERE id = 'mk_band-leg-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, moyen fessier en secondaire.',
  execution = 'Allongé sur le dos, bande au-dessus des genoux, on monte le bassin en poussant les genoux vers l''extérieur.',
  utilite = 'Ajoute une composante d''abduction à l''extension de hanche classique.',
  a_noter = 'Garder la tension sur la bande tout du long, ne pas laisser les genoux se refermer.',
  tags = ARRAY['fessiers', 'élastique']
WHERE id = 'mk_band-glute-bridge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal.',
  execution = 'Élastique ancré en hauteur, on abaisse les bras tendus depuis au-dessus de la tête jusqu''aux cuisses.',
  utilite = 'Excellente finition pour le dos sur toute son amplitude étirée.',
  a_noter = 'Garder les bras tendus tout du long, le mouvement vient des épaules.',
  tags = ARRAY['dos', 'élastique']
WHERE id = 'mk_band-pullover';

UPDATE public.exercices_catalogue SET nom = 'rotation du tronc à l''élastique', description = NULL,
  muscle_travaille = 'Obliques, tronc en rotation.',
  execution = 'Élastique ancré haut ou bas, on tire en diagonale d''un côté à l''autre du corps.',
  utilite = 'Travaille la puissance rotative des obliques et de tout le tronc, utile pour le sport.',
  a_noter = 'Faire pivoter les hanches avec le mouvement, pas seulement les bras.',
  tags = ARRAY['obliques', 'élastique']
WHERE id = 'mk_band-wood-chopper';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Coiffe des rotateurs.',
  execution = 'Coude collé aux côtes à 90 degrés, on tourne l''avant-bras vers l''extérieur contre l''élastique.',
  utilite = 'Isole les rotateurs externes, utile en prévention d''épaule.',
  a_noter = 'Charge légère, le coude reste fixe tout du long.',
  tags = ARRAY['épaules', 'prévention', 'élastique']
WHERE id = 'mk_band-external-rotation';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, milieu du dos et biceps.',
  execution = 'Élastique ancré devant soi, on tire les mains vers les hanches.',
  utilite = 'Alternative maison au rowing à la poulie.',
  a_noter = 'Garder le dos plat, le mouvement part des omoplates.',
  tags = ARRAY['dos', 'élastique']
WHERE id = 'mk_band-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers en secondaire.',
  execution = 'Élastique sous les pieds, genoux à peine fléchis, on descend en hip hinge.',
  utilite = 'Travaille les ischio-jambiers et les fessiers sans barre ni haltères.',
  a_noter = 'Le dos reste plat, le mouvement part des hanches.',
  tags = ARRAY['ischio-jambiers', 'élastique']
WHERE id = 'mk_band-romanian-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Bande au-dessus des genoux, on descend en squat en poussant les genoux vers l''extérieur.',
  utilite = 'Maintient la tension sur les quadriceps et les fessiers tout au long du mouvement.',
  a_noter = 'Ne pas laisser les genoux se refermer vers l''intérieur.',
  tags = ARRAY['jambes', 'élastique']
WHERE id = 'mk_band-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'À genoux, élastique ancré en hauteur, on tire les mains vers le buste.',
  utilite = 'Alternative pratique à la maison au tirage vertical à la poulie.',
  a_noter = 'Garder le buste droit, ne pas se pencher en arrière pour tirer.',
  tags = ARRAY['dos', 'élastique']
WHERE id = 'mk_band-kneeling-pulldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Assis, élastique ancré en hauteur, on tire les mains vers le buste.',
  utilite = 'Façon stable et contrôlée de travailler le dos depuis le sol.',
  a_noter = 'Garder le buste droit tout du long.',
  tags = ARRAY['dos', 'élastique']
WHERE id = 'mk_band-seated-pulldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Genou ou pied posé dans une boucle élastique fixée à la barre, on tire le corps vers le haut.',
  utilite = 'Compense une partie du poids du corps pour s''entraîner sur l''amplitude complète.',
  a_noter = 'Utiliser un élastique moins épais à mesure que la force augmente.',
  tags = ARRAY['dos', 'élastique']
WHERE id = 'mk_band-assisted-pull-up';

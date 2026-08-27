-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi : catégorie poids du corps (68 exercices).
-- Basé sur les descriptions MoveKit d'origine (déjà précises sur le
-- mouvement réel) + connaissances de musculation, condensé au même
-- niveau que les lots précédents.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Moyen fessier, stabilité de la hanche.',
  execution = 'Allongé sur le côté, on lève la jambe du dessus tendue, sans balancer le buste.',
  utilite = 'Petit exercice essentiel pour la stabilité et le galbe des hanches.',
  a_noter = 'Mouvement lent et contrôlé, pas d''élan pour lever la jambe plus haut.',
  tags = ARRAY['fessiers', 'stabilité', 'poids du corps']
WHERE id = 'mk_bodyweight-hip-abduction';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Érecteurs du rachis, fessiers en secondaire.',
  execution = 'Extension du dos en position décalée (b-stance), une hanche plus chargée que l''autre, dos qui garde une ligne neutre.',
  utilite = 'Renforce le bas du dos en isolant davantage un côté.',
  a_noter = 'Garder le dos neutre, ne pas cambrer en fin de mouvement.',
  tags = ARRAY['dos', 'unilatéral', 'poids du corps']
WHERE id = 'mk_single-leg-back-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, jambe arrière en moteur principal.',
  execution = 'Hip thrust avec un pied avancé en appui léger (comme une béquille), la jambe arrière porte l''essentiel de la charge.',
  utilite = 'Isole un fessier tout en gardant un appui de sécurité, bonne transition vers le hip thrust unilatéral complet.',
  a_noter = 'Le pied avancé sert d''équilibre, pas à pousser dessus.',
  tags = ARRAY['fessiers', 'unilatéral', 'poids du corps']
WHERE id = 'mk_b-stance-hip-thrust';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps, pectoraux et épaules en secondaire.',
  execution = 'Mains sur un banc derrière soi, jambes tendues devant, on descend en pliant les coudes puis on repousse.',
  utilite = 'Exercice bras incontournable à la maison ou en voyage, sans matériel.',
  a_noter = 'Garder les coudes proches du corps pour ménager les épaules.',
  tags = ARRAY['triceps', 'poids du corps', 'maison']
WHERE id = 'mk_bench-dips';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Gainage anti-rotation, fessiers et épaules en secondaire.',
  execution = 'À quatre pattes, on tend un bras et la jambe opposée en même temps, sans laisser le bassin tourner.',
  utilite = 'Travaille la stabilité du tronc et la coordination, bon en échauffement ou en rééducation.',
  a_noter = 'Le mouvement doit rester lent, le bassin ne doit pas bouger.',
  tags = ARRAY['gainage', 'stabilité', 'poids du corps']
WHERE id = 'mk_bird-dog';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps, fessiers et mollets, puissance explosive.',
  execution = 'Saut explosif du sol vers une box, réception genoux fléchis, on redescend en marchant.',
  utilite = 'Travaille la puissance du bas du corps sans le fort impact d''une réception au sol.',
  a_noter = 'Choisir une hauteur de box raisonnable, la sécurité prime sur la hauteur.',
  tags = ARRAY['pliométrie', 'puissance', 'poids du corps']
WHERE id = 'mk_box-jump';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Squat jusqu''à toucher légèrement un banc ou une box, puis on repousse vers le haut.',
  utilite = 'Façon simple d''enseigner la profondeur du squat et la mécanique hanches-dos aux débutants.',
  a_noter = 'Toucher la box sans s''asseoir dessus, garder la tension dans les jambes.',
  tags = ARRAY['squat', 'débutant', 'poids du corps']
WHERE id = 'mk_bodyweight-box-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, système cardiovasculaire sollicité.',
  execution = 'Squat-thrust enchaîné avec une pompe puis un saut vertical, répété sans pause.',
  utilite = 'Mouvement de conditionnement complet, sollicite tout le corps en une répétition.',
  a_noter = 'Garder le dos neutre en position de planche, ne pas laisser les hanches s''affaisser.',
  tags = ARRAY['cardio', 'corps entier', 'poids du corps']
WHERE id = 'mk_burpee';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps, endurance isométrique.',
  execution = 'Dos contre un mur, cuisses parallèles au sol comme assis sur une chaise, on tient la position.',
  utilite = 'Développe l''endurance des quadriceps et la ténacité mentale, sans matériel.',
  a_noter = 'Genoux alignés avec les chevilles, ne pas dépasser la pointe des pieds.',
  tags = ARRAY['quadriceps', 'isométrie', 'poids du corps']
WHERE id = 'mk_wall-sit';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Abdominaux, fléchisseurs de hanche.',
  execution = 'En appui sur les avant-bras sur une chaise romaine, on enroule le bassin pour monter les genoux vers la poitrine.',
  utilite = 'Charge directement les abdominaux sans solliciter le bas du dos.',
  a_noter = 'Enrouler le bassin plutôt que de simplement plier les hanches, pour bien cibler les abdos.',
  tags = ARRAY['abdominaux', 'poids du corps']
WHERE id = 'mk_captains-chair-knee-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand droit de l''abdomen, fléchisseurs de hanche en secondaire.',
  execution = 'Sur un banc décliné, redressement complet du buste jusqu''à amener la poitrine vers les cuisses.',
  utilite = 'Version amplitude complète pour surcharger davantage les abdos que le crunch classique.',
  a_noter = 'Plus exigeant pour le bas du dos, à réserver à un niveau déjà à l''aise avec le crunch.',
  tags = ARRAY['abdominaux', 'banc décliné', 'poids du corps']
WHERE id = 'mk_decline-sit-up';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand droit de l''abdomen.',
  execution = 'Sur un banc décliné, enroulement partiel du tronc en gardant le bas du dos au sol.',
  utilite = 'Charge les abdominaux contre la gravité sans solliciter les fléchisseurs de hanche.',
  a_noter = 'Amplitude courte et contrôlée, pas besoin de monter haut.',
  tags = ARRAY['abdominaux', 'banc décliné', 'poids du corps']
WHERE id = 'mk_decline-crunch';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Gainage anti-extension, transverse de l''abdomen.',
  execution = 'Allongé sur le dos, on abaisse un bras et la jambe opposée vers le sol, bas du dos plaqué au sol.',
  utilite = 'Exercice de gainage doux pour apprendre à stabiliser le tronc sans bouger le bassin.',
  a_noter = 'Arrêter le mouvement dès que le bas du dos décolle du sol.',
  tags = ARRAY['gainage', 'abdominaux', 'poids du corps']
WHERE id = 'mk_dead-bug';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux, avant des épaules et triceps.',
  execution = 'Pieds surélevés sur un banc ou une marche, pompe classique en gardant le corps aligné.',
  utilite = 'Variante qui déplace la charge vers le haut des pectoraux et les épaules, sans matériel.',
  a_noter = 'Plus dur pour les épaules que la pompe classique, adapter la hauteur si besoin.',
  tags = ARRAY['pectoraux', 'poids du corps']
WHERE id = 'mk_decline-push-up';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux et triceps.',
  execution = 'Sur des barres parallèles, on descend en pliant les coudes buste penché en avant, puis on repousse.',
  utilite = 'L''un des mouvements du haut du corps au poids du corps les plus exigeants.',
  a_noter = 'Ne pas descendre trop bas si les épaules tirent, l''amplitude complète n''est pas obligatoire au début.',
  tags = ARRAY['pectoraux', 'triceps', 'poids du corps']
WHERE id = 'mk_parralel-bar-dips';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Mollets (jumeau).',
  execution = 'Buste penché en avant en appui, on monte sur la pointe des pieds puis on redescend en étirement profond.',
  utilite = 'Grand classique pour les mollets, sans machine.',
  a_noter = 'Descendre en étirement complet pour profiter de toute l''amplitude.',
  tags = ARRAY['mollets', 'poids du corps']
WHERE id = 'mk_bodyweight-donkey-calf-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Obliques, gainage latéral.',
  execution = 'Appui sur un avant-bras et le côté du pied, corps aligné de la tête aux pieds, on tient la position.',
  utilite = 'La base de toutes les progressions de gainage latéral.',
  a_noter = 'Ne pas laisser les hanches tomber vers le sol, garder la ligne droite.',
  tags = ARRAY['gainage', 'obliques', 'poids du corps']
WHERE id = 'mk_elbow-side-plank';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Érecteurs du rachis, fessiers et ischio-jambiers.',
  execution = 'Sur un banc à 45 degrés, on descend le buste puis on remonte jusqu''à l''horizontale.',
  utilite = 'Renforce le bas du dos sans charge additionnelle.',
  a_noter = 'Ne pas cambrer au-delà de la ligne neutre en haut du mouvement.',
  tags = ARRAY['dos', 'fessiers', 'poids du corps']
WHERE id = 'mk_back-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et quadriceps.',
  execution = 'Un grand pas en avant, on descend jusqu''à ce que le genou arrière frôle le sol, puis on repousse pour revenir.',
  utilite = 'Point d''entrée du travail unilatéral des jambes.',
  a_noter = 'Le genou avant ne doit pas dépasser la pointe du pied.',
  tags = ARRAY['jambes', 'unilatéral', 'poids du corps']
WHERE id = 'mk_forward-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, jambe avant en moteur principal.',
  execution = 'Pied arrière surélevé sur un banc, on descend en fente sur la jambe avant puis on repousse.',
  utilite = 'L''exercice unilatéral le plus efficace pour les jambes.',
  a_noter = 'Le buste reste droit, le genou avant guide le mouvement sans partir vers l''intérieur.',
  tags = ARRAY['jambes', 'unilatéral', 'poids du corps']
WHERE id = 'mk_bulgarian-split-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, endurance isométrique.',
  execution = 'Maintien statique en position de fente, proche du bas du mouvement, genou arrière juste au-dessus du sol.',
  utilite = 'Développe l''endurance musculaire et la stabilité en position de fente.',
  a_noter = 'Garder le buste droit tout du long, ne pas relâcher la tension.',
  tags = ARRAY['jambes', 'isométrie', 'poids du corps']
WHERE id = 'mk_split-squat-isometric-hold';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et quadriceps.',
  execution = 'Un grand pas en arrière, on descend jusqu''à ce que le genou arrière frôle le sol, puis on revient.',
  utilite = 'Version plus douce pour le genou avant que la fente avant.',
  a_noter = 'Poser le pied arrière sur la pointe, garder le poids sur la jambe avant.',
  tags = ARRAY['jambes', 'unilatéral', 'poids du corps']
WHERE id = 'mk_bodyweight-reverse-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et quadriceps.',
  execution = 'Fentes arrière enchaînées en alternant les jambes à chaque répétition.',
  utilite = 'Version enchaînée de la fente inversée, bon travail cardio-musculaire des jambes.',
  a_noter = 'Garder un rythme contrôlé, ne pas perdre l''équilibre entre les changements de jambe.',
  tags = ARRAY['jambes', 'unilatéral', 'poids du corps']
WHERE id = 'mk_bodyweight-alternating-reverse-lunges';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, quadriceps et adducteurs.',
  execution = 'Un grand pas sur le côté, on plie la jambe qui reçoit le poids en gardant l''autre tendue, puis on revient.',
  utilite = 'Renforce les jambes tout en ouvrant l''intérieur des cuisses et des hanches.',
  a_noter = 'Garder le pied qui pousse bien à plat, ne pas laisser le genou partir vers l''intérieur.',
  tags = ARRAY['jambes', 'unilatéral', 'poids du corps']
WHERE id = 'mk_bodyweight-alternating-lateral-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et quadriceps.',
  execution = 'Fentes enchaînées en avançant, un pas après l''autre, sans revenir à la position de départ entre chaque.',
  utilite = 'Construit les jambes tout en travaillant l''équilibre et la mécanique de foulée.',
  a_noter = 'Prendre des pas suffisamment grands pour ne pas déséquilibrer le genou avant.',
  tags = ARRAY['jambes', 'unilatéral', 'poids du corps']
WHERE id = 'mk_lunge-walking';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, rotateurs externes de hanche.',
  execution = 'Allongé sur le dos, plantes des pieds jointes et genoux écartés, on monte le bassin puis on redescend.',
  utilite = 'Oriente l''extension de hanche vers les fessiers plutôt que les ischio-jambiers.',
  a_noter = 'Petite amplitude mais contraction franche en haut du mouvement.',
  tags = ARRAY['fessiers', 'poids du corps']
WHERE id = 'mk_frog-pump';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Gainage global (abdominaux, épaules).',
  execution = 'Appui sur les avant-bras et la pointe des pieds, ligne droite de la tête aux talons, on tient la position.',
  utilite = 'Isométrique fondamental pour le tronc, base de tout programme de gainage.',
  a_noter = 'Ne pas laisser les hanches monter ou descendre, garder la ligne droite.',
  tags = ARRAY['gainage', 'poids du corps']
WHERE id = 'mk_front-plank';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Gainage global, épaules en secondaire.',
  execution = 'Planche haute tenue bras tendus, mains sous les épaules, corps aligné.',
  utilite = 'Isométrique fondamental pour les abdominaux, les épaules et le gainage global.',
  a_noter = 'Répartir le poids entre les mains, éviter de creuser le bas du dos.',
  tags = ARRAY['gainage', 'poids du corps']
WHERE id = 'mk_hand-plank';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers et bas du dos.',
  execution = 'Debout, mains derrière la tête ou croisées sur la poitrine, on incline le buste vers l''avant en gardant le dos plat, puis on revient.',
  utilite = 'Exercice d''apprentissage propre pour le schéma de hip hinge.',
  a_noter = 'Genoux légèrement fléchis, le mouvement part des hanches et non du dos.',
  tags = ARRAY['ischio-jambiers', 'dos', 'poids du corps']
WHERE id = 'mk_good-mornings';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Abdominaux, fléchisseurs de hanche.',
  execution = 'Suspendu à une barre, on monte les genoux vers la poitrine puis on redescend sous contrôle.',
  utilite = 'Point d''entrée du gainage suspendu.',
  a_noter = 'Éviter de se balancer, le mouvement doit venir des abdos, pas de l''élan.',
  tags = ARRAY['abdominaux', 'poids du corps']
WHERE id = 'mk_hanging-knee-raises';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, ischio-jambiers en secondaire.',
  execution = 'Allongé sur le dos, genoux pliés, on monte les hanches jusqu''à une ligne droite des genoux aux épaules.',
  utilite = 'Exercice de base pour construire les fessiers, sans matériel.',
  a_noter = 'Contracter les fessiers en haut, éviter de cambrer excessivement le bas du dos.',
  tags = ARRAY['fessiers', 'poids du corps']
WHERE id = 'mk_glute-bridge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, un côté à la fois.',
  execution = 'Appuyé sur un banc, une jambe tendue en l''air, on monte les hanches en poussant sur la jambe au sol.',
  utilite = 'Travaille un fessier sur une amplitude plus longue qu''un pont au sol.',
  a_noter = 'Garder le bassin droit, ne pas le laisser tourner vers la jambe levée.',
  tags = ARRAY['fessiers', 'unilatéral', 'poids du corps']
WHERE id = 'mk_single-leg-hip-thrust';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et ischio-jambiers, bas du dos en secondaire.',
  execution = 'À plat ventre au bord d''un banc, on lève les jambes tendues derrière le corps puis on redescend.',
  utilite = 'Travaille la chaîne postérieure sans mettre de charge de compression sur le bas du dos.',
  a_noter = 'Mouvement contrôlé, éviter l''élan pour lever les jambes plus haut.',
  tags = ARRAY['fessiers', 'dos', 'poids du corps']
WHERE id = 'mk_reverse-hyperextension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Colonne vertébrale, ischio-jambiers en étirement.',
  execution = 'Debout, on enroule la colonne vertèbre par vertèbre vers l''avant, lentement, puis on déroule pour remonter.',
  utilite = 'Exercice de mobilité classique en gymnastique pour les dos raides.',
  a_noter = 'Mouvement lent et contrôlé, à éviter en cas de douleur lombaire active.',
  tags = ARRAY['mobilité', 'dos', 'poids du corps']
WHERE id = 'mk_bodyweight-spinal-jefferson-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, puissance explosive.',
  execution = 'Squat qui enchaîne directement sur un saut vertical, réception souple en pliant les genoux.',
  utilite = 'Exercice pliométrique incontournable en HIIT et en conditionnement.',
  a_noter = 'Réceptionner genoux fléchis pour amortir l''impact, éviter les articulations tendues.',
  tags = ARRAY['pliométrie', 'puissance', 'poids du corps']
WHERE id = 'mk_jump-squats';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers en secondaire.',
  execution = 'Allongé sur le dos, talons sur un swiss ball, on roule le ballon vers les hanches en gardant le bassin levé.',
  utilite = 'Travaille les ischio-jambiers en flexion sans machine.',
  a_noter = 'Garder les hanches hautes tout du long, ne pas les laisser retomber entre les répétitions.',
  tags = ARRAY['ischio-jambiers', 'swiss ball', 'poids du corps']
WHERE id = 'mk_stability-ball-leg-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Mollets.',
  execution = 'Debout sur une jambe, on monte sur la pointe du pied puis on redescend sous contrôle.',
  utilite = 'Isole un mollet à la fois pour corriger un déséquilibre entre les deux jambes.',
  a_noter = 'Descendre en étirement complet, s''aider d''un appui pour l''équilibre si besoin.',
  tags = ARRAY['mollets', 'unilatéral', 'poids du corps']
WHERE id = 'mk_single-leg-standing-calf-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Gainage, fléchisseurs de hanche, système cardiovasculaire.',
  execution = 'En position de planche, on ramène rapidement les genoux vers la poitrine en alternant les jambes.',
  utilite = 'Finition HIIT universelle qui combine gainage et cardio.',
  a_noter = 'Garder le bassin bas et stable, ne pas le laisser monter en piquant vers le haut.',
  tags = ARRAY['cardio', 'gainage', 'poids du corps']
WHERE id = 'mk_mountain-climber';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fléchisseurs du cou.',
  execution = 'Allongé sur le dos, on lève la tête contre la gravité sur une petite amplitude, puis on redescend.',
  utilite = 'Renforce l''avant du cou, utile en prévention pour les sports de contact.',
  a_noter = 'Mouvement de faible amplitude, ne pas forcer sur la nuque.',
  tags = ARRAY['cou', 'poids du corps']
WHERE id = 'mk_neck-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Extenseurs du cou.',
  execution = 'À plat ventre au bord d''un banc, on lève la tête contre la gravité puis on redescend.',
  utilite = 'Renforce l''arrière du cou en complément du neck curl.',
  a_noter = 'Mouvement contrôlé et de faible amplitude, jamais de à-coups.',
  tags = ARRAY['cou', 'poids du corps']
WHERE id = 'mk_neck-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers.',
  execution = 'À genoux, chevilles bloquées, on se laisse descendre vers l''avant en résistant avec les ischio-jambiers, sous contrôle excentrique.',
  utilite = 'Exercice de référence pour la force excentrique des ischio-jambiers et la prévention des blessures.',
  a_noter = 'Très exigeant, commencer avec une petite amplitude et un support pour les chevilles.',
  tags = ARRAY['ischio-jambiers', 'excentrique', 'poids du corps']
WHERE id = 'mk_nordic-hamstring-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps et avant des épaules.',
  execution = 'Mains au sol sous les épaules, corps aligné, on descend en pliant les coudes puis on repousse.',
  utilite = 'Mouvement de poussée le plus fondamental au poids du corps, modulable à volonté.',
  a_noter = 'Garder le corps aligné de la tête aux talons, ne pas laisser le bassin tomber.',
  tags = ARRAY['pectoraux', 'poids du corps']
WHERE id = 'mk_push-up';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps, pectoraux en secondaire.',
  execution = 'Pompe avec les mains rapprochées, pouces et index formant un losange sous la poitrine.',
  utilite = 'Transforme le mouvement de pompe en constructeur de triceps.',
  a_noter = 'Plus exigeant pour les poignets et les coudes, à introduire progressivement.',
  tags = ARRAY['triceps', 'poids du corps']
WHERE id = 'mk_diamond-push-ups';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps en secondaire.',
  execution = 'Mains surélevées sur un banc ou une box, pompe classique avec le corps incliné.',
  utilite = 'Porte d''entrée plus facile vers la pompe complète au sol.',
  a_noter = 'Plus la surélévation est haute, plus le mouvement est facile.',
  tags = ARRAY['pectoraux', 'débutant', 'poids du corps']
WHERE id = 'mk_incline-push-up';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps en secondaire.',
  execution = 'Pompe réalisée genoux au sol, buste et cuisses alignés, pour réduire la charge.',
  utilite = 'Première régression qui permet aux débutants de vraiment travailler le mouvement de poussée.',
  a_noter = 'Garder le buste et les hanches alignés, ne pas casser au niveau des hanches.',
  tags = ARRAY['pectoraux', 'débutant', 'poids du corps']
WHERE id = 'mk_bodyweight-knee-push-ups';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps en secondaire.',
  execution = 'Mains surélevées sur un banc ou une box, pompe classique pour réduire la difficulté.',
  utilite = 'Régression idéale pour débuter les pompes.',
  a_noter = 'Réduire la hauteur progressivement à mesure que la force augmente.',
  tags = ARRAY['pectoraux', 'débutant', 'poids du corps']
WHERE id = 'mk_bodyweight-elevated-push-up';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, un côté à la fois.',
  execution = 'Allongé sur le dos, une jambe tendue en l''air, on monte les hanches en poussant sur la jambe au sol.',
  utilite = 'Isole un fessier à la fois pour corriger un déséquilibre entre les deux côtés.',
  a_noter = 'Garder le bassin droit, ne pas le laisser tourner vers la jambe levée.',
  tags = ARRAY['fessiers', 'unilatéral', 'poids du corps']
WHERE id = 'mk_single-leg-glute-bridge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Obliques.',
  execution = 'Assis, buste légèrement penché en arrière, pieds au sol ou levés, on tourne le buste d''un côté à l''autre.',
  utilite = 'Mouvement le plus reconnaissable pour construire les obliques.',
  a_noter = 'Tourner depuis le tronc, pas seulement les bras, pour vraiment cibler les obliques.',
  tags = ARRAY['abdominaux', 'obliques', 'poids du corps']
WHERE id = 'mk_bodyweight-russian-twist';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers et bas du dos.',
  execution = 'Debout, on incline le buste vers l''avant en poussant les hanches en arrière, dos plat, puis on revient en poussant sur les talons.',
  utilite = 'Façon la plus sûre d''apprendre à se pencher, gainer et se relever.',
  a_noter = 'Le dos reste plat tout du long, le mouvement part des hanches.',
  tags = ARRAY['ischio-jambiers', 'dos', 'poids du corps']
WHERE id = 'mk_bodyweight-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers.',
  execution = 'Hip hinge debout avec un balayage des bras vers l''avant puis vers l''arrière à chaque répétition.',
  utilite = 'Travaille les ischio-jambiers sur toute leur amplitude, bon échauffement dynamique.',
  a_noter = 'Garder les jambes presque tendues, le mouvement vient des hanches.',
  tags = ARRAY['ischio-jambiers', 'échauffement', 'poids du corps']
WHERE id = 'mk_romanian-deadlift-hamstring-sweeps';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers et fessiers, un côté à la fois.',
  execution = 'Sur une jambe, on incline le buste vers l''avant en tendant l''autre jambe en arrière, dos plat, puis on revient.',
  utilite = 'Réponse unilatérale au RDL, travaille aussi l''équilibre.',
  a_noter = 'Garder les hanches à niveau, ne pas les laisser tourner pendant la descente.',
  tags = ARRAY['ischio-jambiers', 'unilatéral', 'poids du corps']
WHERE id = 'mk_single-legged-romanian-deadlifts';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Debout, on descend en pliant les hanches et les genoux jusqu''à ce que les cuisses soient parallèles au sol, puis on repousse.',
  utilite = 'Premier exercice de jambes dans tout programme, test d''une mécanique propre.',
  a_noter = 'Genoux qui suivent la direction des pieds, poids réparti sur tout le pied.',
  tags = ARRAY['jambes', 'poids du corps']
WHERE id = 'mk_bodyweight-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Squat classique maintenu immobile quelques secondes en bas avant de repousser.',
  utilite = 'Supprime le rebond pour repartir d''un arrêt complet, renforce la force au point faible.',
  a_noter = 'Garder la tension musculaire pendant la pause, ne pas se relâcher complètement.',
  tags = ARRAY['jambes', 'isométrie', 'poids du corps']
WHERE id = 'mk_pause-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Adducteurs, quadriceps et fessiers.',
  execution = 'Debout jambes très écartées, on descend sur une jambe en pliant le genou, l''autre jambe restant tendue sur le côté.',
  utilite = 'Travaille les jambes dans le plan frontal, complète les squats classiques.',
  a_noter = 'Garder le pied de la jambe tendue bien à plat au sol.',
  tags = ARRAY['jambes', 'mobilité', 'poids du corps']
WHERE id = 'mk_cossack-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, un côté à la fois.',
  execution = 'Debout sur une box, on descend en contrôlant la descente jusqu''à toucher le sol avec le pied libre, puis on repousse.',
  utilite = 'Travaille la force et le contrôle du genou en excentrique, utile en prévention.',
  a_noter = 'Descente lente et contrôlée, le genou ne doit pas partir vers l''intérieur.',
  tags = ARRAY['jambes', 'unilatéral', 'poids du corps']
WHERE id = 'mk_single-leg-step-down';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas du dos, fessiers et chaîne postérieure.',
  execution = 'À plat ventre, on lève simultanément les bras, la poitrine et les jambes, puis on redescend.',
  utilite = 'Exercice de bas du dos par excellence au sol, sans matériel.',
  a_noter = 'Mouvement contrôlé, pas besoin de monter très haut pour être efficace.',
  tags = ARRAY['dos', 'fessiers', 'poids du corps']
WHERE id = 'mk_supermans';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Préhension, fléchisseurs de l''avant-bras.',
  execution = 'Suspendu à une barre au-dessus de la tête, bras tendus, on tient la position.',
  utilite = 'Charge la préhension et décompresse le haut du corps.',
  a_noter = 'S''arrêter dès que la prise commence à lâcher, pas besoin de forcer jusqu''à l''échec total.',
  tags = ARRAY['préhension', 'isométrie', 'poids du corps']
WHERE id = 'mk_dead-hang';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Tibial antérieur.',
  execution = 'Dos contre un mur, talons légèrement décollés, on lève les orteils vers le tibia puis on redescend.',
  utilite = 'Renforce l''avant du tibia, utile en prévention pour la course et le saut.',
  a_noter = 'Mouvement de petite amplitude, la sensation de brûlure vient vite.',
  tags = ARRAY['mollets', 'prévention', 'poids du corps']
WHERE id = 'mk_tibialis-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Abdominaux, fléchisseurs de hanche.',
  execution = 'Suspendu à une barre, on lève les jambes tendues jusqu''à toucher la barre avec les orteils, puis on redescend.',
  utilite = 'Version avancée du gainage suspendu, très exigeante.',
  a_noter = 'Demande de la mobilité des ischio-jambiers, à réserver à un niveau déjà solide en relevés de genoux.',
  tags = ARRAY['abdominaux', 'avancé', 'poids du corps']
WHERE id = 'mk_toes-to-bar';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers en secondaire.',
  execution = 'Allongé sur le dos, talons sur des serviettes glissantes, on ramène les talons vers les hanches puis on les repousse sous contrôle.',
  utilite = 'Alternative au swiss ball pour travailler les ischio-jambiers sans matériel spécifique.',
  a_noter = 'Garder les hanches hautes tout du long, mouvement lent à la remontée.',
  tags = ARRAY['ischio-jambiers', 'poids du corps']
WHERE id = 'mk_towel-slide-leg-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Sous une barre fixe, corps incliné et tendu, on tire la poitrine vers la barre puis on redescend.',
  utilite = 'Tirage fondamental de tout programme de dos, accessible sans tractions complètes.',
  a_noter = 'Plus le corps est horizontal, plus l''exercice est difficile — ajuster l''angle selon le niveau.',
  tags = ARRAY['dos', 'poids du corps']
WHERE id = 'mk_inverted-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Traction classique avec un poids additionnel fixé à une ceinture de dips.',
  utilite = 'Ajoute de la résistance une fois les tractions au poids du corps devenues faciles.',
  a_noter = 'Ajouter la charge progressivement, garder une amplitude complète malgré le poids.',
  tags = ARRAY['dos', 'poids du corps']
WHERE id = 'mk_weighted-pull-ups';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Mains bien au-delà de la largeur des épaules, on tire le corps jusqu''à amener le menton au-dessus de la barre.',
  utilite = 'Variante qui insiste davantage sur la largeur du dos.',
  a_noter = 'Prise large qui réduit l''amplitude, ne pas chercher à descendre plus bas que ce que permettent les épaules.',
  tags = ARRAY['dos', 'poids du corps']
WHERE id = 'mk_wide-grip-pull-up';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Sur des poignées parallèles, paumes face à face, on tire le corps vers le haut.',
  utilite = 'Version plus douce pour les épaules que la prise pronation classique.',
  a_noter = 'Bonne option en cas de gêne à l''épaule sur les tractions classiques.',
  tags = ARRAY['dos', 'poids du corps']
WHERE id = 'mk_neutral-grip-pull-up';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps et haut du dos.',
  execution = 'Suspendu à une barre, prise pronation, on tire le corps jusqu''à amener le menton au-dessus de la barre.',
  utilite = 'Référence pour la force de tirage du haut du corps.',
  a_noter = 'Éviter de se balancer, le mouvement doit venir du dos et des bras.',
  tags = ARRAY['dos', 'poids du corps']
WHERE id = 'mk_pull-ups';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps et préhension.',
  execution = 'Suspendu à une barre, paumes tournées vers soi, on tire le corps vers le haut.',
  utilite = 'L''un des tests de force de tirage les plus honnêtes, sollicite bien les biceps.',
  a_noter = 'Prise plus étroite que la traction classique, plus accessible pour débuter.',
  tags = ARRAY['dos', 'poids du corps']
WHERE id = 'mk_chin-ups';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Abdominaux (grand droit), fléchisseurs de hanche.',
  execution = 'Allongé sur le dos, on lève simultanément le buste et les jambes tendues pour former un V, puis on redescend.',
  utilite = 'Exercice de gainage dynamique qui cible l''ensemble de la sangle abdominale.',
  a_noter = 'Garder les jambes aussi tendues que possible, quitte à réduire l''amplitude au début.',
  tags = ARRAY['abdominaux', 'poids du corps']
WHERE id = 'mk_v-up';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, épaules en secondaire.',
  execution = 'Squat avant enchaîné avec un lancer explosif au-dessus de la tête contre un mur, rattrapé au rebond.',
  utilite = 'Mouvement de conditionnement complet qui combine force des jambes et puissance du haut du corps.',
  a_noter = 'Garder le dos droit pendant le squat, ne pas cambrer pour lancer la charge.',
  tags = ARRAY['conditionnement', 'jambes', 'poids du corps']
WHERE id = 'mk_wall-ball';

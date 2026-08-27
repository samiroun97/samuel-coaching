-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi : catégorie poulie (53 exercices).
-- Basé sur les descriptions MoveKit d'origine + connaissances de
-- musculation, condensé au même niveau que les lots précédents.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Moyen fessier.',
  execution = 'Debout de côté à la poulie basse, manchon à la cheville, on écarte la jambe tendue sur le côté.',
  utilite = 'Isole les abducteurs de la hanche avec une tension constante.',
  a_noter = 'Garder le buste stable, ne pas se pencher pour aider le mouvement.',
  tags = ARRAY['fessiers', 'poulie']
WHERE id = 'mk_cable-hip-abduction';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Moyen fessier.',
  execution = 'Debout face à une poulie basse, on écarte la jambe tendue sur le côté contre la résistance.',
  utilite = 'Variante debout de l''abduction de hanche pour la stabilité et le galbe.',
  a_noter = 'Mouvement lent, pas d''élan pour écarter la jambe plus haut.',
  tags = ARRAY['fessiers', 'poulie']
WHERE id = 'mk_standing-cable-hip-abduction';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps (longue portion en étirement).',
  execution = 'À la poulie basse, un bras, coude maintenu derrière le buste, on plie le coude pour monter la poignée.',
  utilite = 'Garde le biceps sous tension même en position étirée, technique avancée.',
  a_noter = 'Rester légèrement penché en avant pour garder la tension en bas du mouvement.',
  tags = ARRAY['biceps', 'poulie']
WHERE id = 'mk_bayesian-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand droit de l''abdomen.',
  execution = 'À genoux face à une poulie haute, corde tenue près du visage, on enroule le buste vers le bas.',
  utilite = 'Charge les abdominaux dans un crunch contrôlé avec résistance progressive.',
  a_noter = 'Enrouler depuis les côtes, pas depuis les hanches.',
  tags = ARRAY['abdominaux', 'poulie']
WHERE id = 'mk_kneeling-cable-crunch';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps.',
  execution = 'Debout à la poulie basse, barre droite en mains, on plie les coudes pour monter la barre.',
  utilite = 'Tension constante du bas jusqu''en haut du mouvement.',
  a_noter = 'Garder les coudes fixes le long du corps.',
  tags = ARRAY['biceps', 'poulie']
WHERE id = 'mk_cable-bar-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Brachial et avant-bras, biceps en secondaire.',
  execution = 'Debout à la poulie basse, corde en prise neutre, on plie les coudes pour monter la corde.',
  utilite = 'Charge ensemble les biceps, le brachial et les avant-bras.',
  a_noter = 'Garder les poignets neutres tout du long.',
  tags = ARRAY['biceps', 'avant-bras', 'poulie']
WHERE id = 'mk_cable-rope-hammer-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps et avant des épaules.',
  execution = 'Debout face à la poulie, on pousse les poignées devant soi en mouvement horizontal.',
  utilite = 'Tension constante du début à la fin de la poussée.',
  a_noter = 'Garder un léger déséquilibre avant, un pied devant l''autre pour la stabilité.',
  tags = ARRAY['pectoraux', 'poulie']
WHERE id = 'mk_cable-chest-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux et triceps.',
  execution = 'Allongé sur un banc entre deux poulies basses, on pousse les poignées au-dessus de la poitrine.',
  utilite = 'Tension fluide et constante sur toute la poussée, contrairement à une barre.',
  a_noter = 'Garder le banc bien centré entre les deux poulies.',
  tags = ARRAY['pectoraux', 'poulie']
WHERE id = 'mk_cable-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, un côté à la fois.',
  execution = 'Debout, un bras à la fois, on pousse la poignée devant soi en mouvement horizontal.',
  utilite = 'Révèle les écarts de force entre les côtés.',
  a_noter = 'Garder le tronc stable, ne pas laisser le buste tourner.',
  tags = ARRAY['pectoraux', 'unilatéral', 'poulie']
WHERE id = 'mk_cable-standing-single-arm-chest-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas des pectoraux.',
  execution = 'Sur un banc décliné entre deux poulies hautes, on pousse les poignées au-dessus de la poitrine.',
  utilite = 'Cible le bas des pectoraux avec une tension fluide et constante.',
  a_noter = 'Bien sécuriser le banc décliné avant de charger.',
  tags = ARRAY['pectoraux', 'poulie']
WHERE id = 'mk_cable-decline-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux et triceps.',
  execution = 'Sur un banc incliné entre deux poulies basses, on pousse les poignées au-dessus de la poitrine.',
  utilite = 'Tension constante à chaque centimètre du mouvement.',
  a_noter = 'Ne pas trop incliner le banc pour garder le travail sur les pectoraux.',
  tags = ARRAY['pectoraux', 'poulie']
WHERE id = 'mk_cable-incline-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes antérieurs et latéraux.',
  execution = 'Debout entre deux poulies basses, on pousse les poignées au-dessus de la tête.',
  utilite = 'Tension fluide et constante du début à la fin, contrairement à une barre.',
  a_noter = 'Garder le tronc gainé, ne pas cambrer pour aider la poussée.',
  tags = ARRAY['épaules', 'poulie']
WHERE id = 'mk_cable-overhead-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux.',
  execution = 'Debout entre deux poulies, on ramène les poignées devant soi en arc, bras légèrement fléchis.',
  utilite = 'Tension constante, de l''étirement profond à la contraction franche.',
  a_noter = 'Garder une légère flexion des coudes tout du long.',
  tags = ARRAY['pectoraux', 'poulie']
WHERE id = 'mk_cable-pec-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux.',
  execution = 'Poulies basses, on remonte les poignées vers l''intérieur et vers le haut.',
  utilite = 'Cible spécifiquement le haut des pectoraux.',
  a_noter = 'Le mouvement part des épaules, pas des poignets.',
  tags = ARRAY['pectoraux', 'poulie']
WHERE id = 'mk_cable-low-to-high-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas des pectoraux.',
  execution = 'Poulies hautes, on ramène les poignées vers le bas et l''une vers l''autre.',
  utilite = 'Cible spécifiquement le bas des pectoraux.',
  a_noter = 'Garder une légère flexion des coudes, contraction franche en bas.',
  tags = ARRAY['pectoraux', 'poulie']
WHERE id = 'mk_cable-high-to-low-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux.',
  execution = 'Allongé sur un banc entre deux poulies basses, on ramène les poignées au-dessus de la poitrine en arc.',
  utilite = 'Étirement profond des pectoraux avec tension constante.',
  a_noter = 'Garder une légère flexion des coudes pour protéger les épaules.',
  tags = ARRAY['pectoraux', 'poulie']
WHERE id = 'mk_cable-bench-chest-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, gainage anti-rotation.',
  execution = 'Debout, un bras à la fois, on ramène la poignée devant soi pendant que le tronc résiste à la torsion.',
  utilite = 'Ajoute un travail de gainage à l''isolation des pectoraux.',
  a_noter = 'Garder le bassin face à la poulie, ne pas tourner pour aider le mouvement.',
  tags = ARRAY['pectoraux', 'unilatéral', 'poulie']
WHERE id = 'mk_single-arm-cable-fly';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde antérieur.',
  execution = 'Câble passant entre les jambes, on lève la poignée à deux mains devant soi jusqu''à hauteur d''épaule.',
  utilite = 'Tension constante du bas jusqu''en haut, contrairement à un haltère.',
  a_noter = 'Éviter l''élan, monter uniquement avec l''épaule.',
  tags = ARRAY['épaules', 'poulie']
WHERE id = 'mk_cable-front-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde latéral.',
  execution = 'En appui penché en arrière de la machine, un bras à la fois, on lève la poignée sur le côté.',
  utilite = 'L''inclinaison allonge le deltoïde en position basse pour plus de tension.',
  a_noter = 'Bien s''accrocher au poteau de la machine pour garder l''inclinaison stable.',
  tags = ARRAY['épaules', 'unilatéral', 'poulie']
WHERE id = 'mk_leaning-cable-lateral-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïde latéral.',
  execution = 'Depuis une poulie basse, le câble croise le corps, on lève la poignée sur le côté.',
  utilite = 'Angle différent qui charge le deltoïde dès le début du mouvement.',
  a_noter = 'Légère flexion du coude, ne pas monter au-delà de l''épaule.',
  tags = ARRAY['épaules', 'unilatéral', 'poulie']
WHERE id = 'mk_cable-low-single-arm-lateral-raise';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps.',
  execution = 'Debout à la poulie haute, barre droite en mains, on pousse vers le bas jusqu''à l''extension complète.',
  utilite = 'Façon la plus efficace d''isoler les triceps à la poulie.',
  a_noter = 'Garder les coudes fixes le long du corps.',
  tags = ARRAY['triceps', 'poulie']
WHERE id = 'mk_cable-bar-pushdown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps.',
  execution = 'Debout à la poulie haute, corde en mains, on pousse vers le bas en écartant les mains en fin de mouvement.',
  utilite = 'L''écartement des mains permet une contraction plus profonde des triceps.',
  a_noter = 'Garder les coudes fixes, seul l''avant-bras bouge.',
  tags = ARRAY['triceps', 'poulie']
WHERE id = 'mk_cable-rope-pushdown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps (les trois chefs).',
  execution = 'Debout à la poulie haute, barre en V, on pousse vers le bas jusqu''à l''extension complète.',
  utilite = 'Isole les trois chefs du triceps par une extension propre.',
  a_noter = 'Garder les coudes fixes le long du corps.',
  tags = ARRAY['triceps', 'poulie']
WHERE id = 'mk_machine-cable-v-bar-push-downs';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps.',
  execution = 'Debout à la poulie haute, barre tenue paumes vers le haut, coudes serrés, on pousse vers le bas.',
  utilite = 'Travaille les triceps sur une longue amplitude avec un angle différent.',
  a_noter = 'Garder les coudes serrés contre le corps tout du long.',
  tags = ARRAY['triceps', 'poulie']
WHERE id = 'mk_reverse-grip-tricep-pushdown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps (longue portion).',
  execution = 'Dos à la poulie basse, corde au-dessus de la tête, on étend les bras devant soi.',
  utilite = 'Étire la longue portion du triceps avant chaque extension.',
  a_noter = 'Garder les coudes fixes proches de la tête.',
  tags = ARRAY['triceps', 'poulie']
WHERE id = 'mk_cable-rope-overhead-tricep-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps, un côté à la fois.',
  execution = 'Debout à la poulie haute, corde à un bras, on pousse vers le bas.',
  utilite = 'Isole chaque triceps indépendamment pour plus de symétrie.',
  a_noter = 'Garder le coude fixe le long du corps.',
  tags = ARRAY['triceps', 'unilatéral', 'poulie']
WHERE id = 'mk_cable-single-arm-rope-pushdown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps (longue portion), un côté à la fois.',
  execution = 'Debout, poignée tenue au-dessus de la tête à un bras, on étend le coude contre la tension de la poulie.',
  utilite = 'Isolation unilatérale avec tension constante.',
  a_noter = 'Garder le coude fixe et proche de la tête tout du long.',
  tags = ARRAY['triceps', 'unilatéral', 'poulie']
WHERE id = 'mk_single-arm-overhead-cable-extension';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes postérieurs, haut du dos.',
  execution = 'Poulie haute, barre droite tirée vers le visage, coudes hauts et écartés.',
  utilite = 'Cible l''arrière des épaules et les muscles posturaux du haut du dos.',
  a_noter = 'Tirer les coudes vers l''arrière, pas seulement vers le visage.',
  tags = ARRAY['épaules', 'dos', 'poulie']
WHERE id = 'mk_cable-bar-face-pull';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes postérieurs, haut du dos.',
  execution = 'Poulie haute, corde tirée vers le visage, coudes hauts et écartés.',
  utilite = 'Solution de référence contre les épaules enroulées vers l''avant.',
  a_noter = 'Tirer les coudes vers l''arrière et vers le haut, pas juste vers soi.',
  tags = ARRAY['épaules', 'dos', 'poulie']
WHERE id = 'mk_machine-face-pulls';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes postérieurs, milieu du dos.',
  execution = 'À genoux face à une poulie haute, corde tirée vers le visage, coudes hauts.',
  utilite = 'La position à genoux élimine la triche du corps.',
  a_noter = 'Garder le buste droit, ne pas se pencher en arrière pour tirer.',
  tags = ARRAY['épaules', 'dos', 'poulie']
WHERE id = 'mk_cable-rope-kneeling-face-pull';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes postérieurs, haut du dos.',
  execution = 'Assis face à une poulie haute, corde tirée vers le visage, coudes hauts.',
  utilite = 'La position assise élimine la triche du corps.',
  a_noter = 'Tirer les coudes vers l''arrière, pas juste ramener les mains au visage.',
  tags = ARRAY['épaules', 'dos', 'poulie']
WHERE id = 'mk_cable-seated-rope-face-pull';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fléchisseurs de l''avant-bras.',
  execution = 'Assis, avant-bras calés, on plie le poignet pour lever la barre.',
  utilite = 'Isole la flexion du poignet et renforce la préhension.',
  a_noter = 'Charge légère, mouvement de faible amplitude au niveau du poignet.',
  tags = ARRAY['avant-bras', 'poulie']
WHERE id = 'mk_cable-wrist-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Obliques.',
  execution = 'Debout de côté à la poulie basse, on incline le buste en s''éloignant de la poulie puis on revient.',
  utilite = 'Tension constante pour une taille plus marquée et définie.',
  a_noter = 'Incliner depuis la taille, pas depuis les hanches.',
  tags = ARRAY['obliques', 'poulie']
WHERE id = 'mk_cable-side-bend';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Trapèzes (haut).',
  execution = 'Debout légèrement penché vers la poulie, on monte les épaules dans l''axe des fibres des trapèzes.',
  utilite = 'Variante plus intelligente du shrug classique, angle plus naturel.',
  a_noter = 'Monter dans l''axe à 30 degrés, pas verticalement.',
  tags = ARRAY['trapèzes', 'poulie']
WHERE id = 'mk_cable-30-degree-shrug';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, un côté à la fois.',
  execution = 'Debout face à une poulie basse, manchon à la cheville, on pousse la jambe tendue vers l''arrière.',
  utilite = 'Isole les fessiers sur une amplitude contrôlée.',
  a_noter = 'Garder le bassin stable, ne pas cambrer pour lever la jambe plus haut.',
  tags = ARRAY['fessiers', 'unilatéral', 'poulie']
WHERE id = 'mk_cable-kickback';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers, un côté à la fois.',
  execution = 'Appuyé sur un banc, manchon à la cheville, on pousse la jambe tendue vers l''arrière contre la poulie.',
  utilite = 'Isole les fessiers avec un appui stable sur le banc.',
  a_noter = 'Garder la jambe tendue tout du long, le mouvement vient de la hanche.',
  tags = ARRAY['fessiers', 'unilatéral', 'poulie']
WHERE id = 'mk_cable-bench-straight-leg-kickback';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, un côté à la fois.',
  execution = 'À plat ventre, manchon à la cheville sur une poulie basse, on plie le genou pour ramener le talon vers la fesse.',
  utilite = 'Isole un ischio-jambier à la fois avec une charge progressive.',
  a_noter = 'Garder le bassin plaqué au sol, ne pas le laisser se soulever.',
  tags = ARRAY['ischio-jambiers', 'unilatéral', 'poulie']
WHERE id = 'mk_cable-single-leg-laying-leg-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Gainage anti-rotation, obliques.',
  execution = 'Debout de côté à la poulie, câble tenu à hauteur de poitrine, on le pousse devant soi sans laisser le buste tourner.',
  utilite = 'Exercice de gainage anti-rotation de référence.',
  a_noter = 'Le tronc ne doit pas bouger, tout le travail est dans la résistance à la rotation.',
  tags = ARRAY['gainage', 'poulie']
WHERE id = 'mk_pallof-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et ischio-jambiers.',
  execution = 'Dos à la poulie basse, corde entre les jambes, on effectue un hip hinge puis on tire la corde en se redressant.',
  utilite = 'Sollicite les fessiers avec peu de charge sur la colonne.',
  a_noter = 'Le mouvement part des hanches, pas du dos.',
  tags = ARRAY['fessiers', 'poulie']
WHERE id = 'mk_cable-pull-through';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal.',
  execution = 'Debout ou à genoux, poulie haute, corde tirée bras tendus jusqu''aux hanches.',
  utilite = 'Sollicite le grand dorsal sur une longue amplitude.',
  a_noter = 'Garder les bras tendus tout du long, le mouvement vient des épaules.',
  tags = ARRAY['dos', 'poulie']
WHERE id = 'mk_cable-rope-pullover';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Obliques, tronc en rotation.',
  execution = 'Poulie haute, on tire la poignée en diagonale d''un côté à l''autre du corps.',
  utilite = 'Entraîne les obliques à générer de la force en rotation.',
  a_noter = 'Faire pivoter les hanches avec le mouvement, pas seulement les bras.',
  tags = ARRAY['obliques', 'poulie']
WHERE id = 'mk_cable-wood-chopper';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Obliques, tronc en rotation.',
  execution = 'Poulie basse, on tire la poignée en diagonale du bas vers le haut du corps.',
  utilite = 'Construit la puissance rotative des obliques et de tout le tronc.',
  a_noter = 'Le mouvement part des hanches et se transmet jusqu''aux bras.',
  tags = ARRAY['obliques', 'poulie']
WHERE id = 'mk_cable-standing-low-to-high-wood-chopper';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Coiffe des rotateurs.',
  execution = 'Coude fixé contre les côtes à 90 degrés, on tourne l''avant-bras vers l''extérieur contre la poulie.',
  utilite = 'Renforce la coiffe des rotateurs, utile en prévention d''épaule.',
  a_noter = 'Charge légère, le coude reste fixe tout du long.',
  tags = ARRAY['épaules', 'prévention', 'poulie']
WHERE id = 'mk_cable-external-rotation';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et biceps.',
  execution = 'Assis, on tire la poignée vers soi en tournant les paumes vers le haut en fin de mouvement.',
  utilite = 'Charge le dos et les biceps dans le même tirage.',
  a_noter = 'Terminer le tirage coudes bien en arrière, pas seulement avec les mains.',
  tags = ARRAY['dos', 'poulie']
WHERE id = 'mk_cable-supinating-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, milieu du dos et biceps.',
  execution = 'Assis, jambes légèrement fléchies, on tire la poignée vers l''abdomen en gardant le dos droit.',
  utilite = 'Référence en matière de rowing dans toute salle.',
  a_noter = 'Ne pas se pencher en arrière pour tirer plus loin, garder le buste stable.',
  tags = ARRAY['dos', 'poulie']
WHERE id = 'mk_machine-seated-cable-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut du dos, deltoïdes postérieurs en secondaire.',
  execution = 'Assis, barre large en mains, on tire vers le haut de l''abdomen coudes écartés.',
  utilite = 'Variante qui insiste sur la largeur et le haut du dos.',
  a_noter = 'Garder les coudes écartés des côtes tout du long.',
  tags = ARRAY['dos', 'poulie']
WHERE id = 'mk_wide-grip-seated-cable-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, milieu du dos et biceps.',
  execution = 'Debout face à la poulie, barre droite en mains, on tire vers l''abdomen.',
  utilite = 'Construit le dos en position debout, sans support de buste.',
  a_noter = 'Garder le dos droit, ne pas se pencher en arrière pour tirer.',
  tags = ARRAY['dos', 'poulie']
WHERE id = 'mk_cable-row-bar-standing-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et biceps, un côté à la fois.',
  execution = 'Assis ou debout, poignée en prise neutre, on tire vers la hanche d''un côté à la fois.',
  utilite = 'Construit le dos et les biceps d''un côté à la fois.',
  a_noter = 'Éviter de tourner le buste pour tirer plus loin.',
  tags = ARRAY['dos', 'unilatéral', 'poulie']
WHERE id = 'mk_cable-single-arm-neutral-grip-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et biceps, un côté à la fois.',
  execution = 'Poignée en prise supination, on tire vers la hanche d''un côté à la fois.',
  utilite = 'Engagement plus profond des biceps que la prise neutre.',
  a_noter = 'Garder le buste stable, ne pas tourner pour tirer plus loin.',
  tags = ARRAY['dos', 'unilatéral', 'poulie']
WHERE id = 'mk_cable-single-arm-underhand-grip-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Assis, barre tirée vers le haut de la poitrine, coudes qui descendent vers les hanches.',
  utilite = 'Tirage vertical complet, base de tout programme de dos.',
  a_noter = 'Ne pas se pencher trop en arrière pour tirer la barre plus bas.',
  tags = ARRAY['dos', 'poulie']
WHERE id = 'mk_lat-pulldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, un côté à la fois.',
  execution = 'Assis, une poignée à la fois, on tire vers la hanche en laissant l''omoplate se déplacer.',
  utilite = 'Charge un seul grand dorsal sur toute son amplitude.',
  a_noter = 'Garder le buste stable, ne pas tourner pour tirer plus loin.',
  tags = ARRAY['dos', 'unilatéral', 'poulie']
WHERE id = 'mk_single-arm-lat-pulldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal.',
  execution = 'Debout, bras quasiment tendus, on tire la barre vers le bas jusqu''aux cuisses.',
  utilite = 'Isole l''extension de l''épaule en gardant le dorsal sous tension.',
  a_noter = 'Garder les bras tendus tout du long, seul le mouvement de l''épaule compte.',
  tags = ARRAY['dos', 'poulie']
WHERE id = 'mk_straight-arm-lat-pulldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal (largeur).',
  execution = 'Assis, prise plus large que les épaules, on tire la barre vers la poitrine.',
  utilite = 'Insiste sur la largeur du dos.',
  a_noter = 'Prise large qui réduit l''amplitude, ne pas forcer la descente.',
  tags = ARRAY['dos', 'poulie']
WHERE id = 'mk_wide-grip-lat-pulldown';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, biceps en secondaire.',
  execution = 'Assis, barre en V paumes face à face, on tire vers la poitrine.',
  utilite = 'Garde les épaules et les poignets en position neutre.',
  a_noter = 'Bonne option en cas de gêne à l''épaule sur la prise pronation.',
  tags = ARRAY['dos', 'poulie']
WHERE id = 'mk_neutral-grip-lat-pulldown';

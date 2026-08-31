-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi : catégorie barre (64 exercices).
-- Basé sur les descriptions MoveKit d'origine + connaissances de
-- musculation, condensé au même niveau que les lots précédents.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Squat arrière classique avec des élastiques fixés à la barre, ajoutant de la résistance en haut du mouvement.',
  utilite = 'Renforce le verrouillage en accentuant la charge là où on est le plus fort.',
  a_noter = 'Bien fixer les élastiques avant de charger, ils ajoutent une tension variable.',
  tags = ARRAY['jambes', 'barre']
WHERE id = 'mk_barbell-banded-back-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, épaules et jambes en moteur principal.',
  execution = 'Un clean amène la barre du sol aux épaules, puis un développé la pousse au-dessus de la tête.',
  utilite = 'Puissance, posture et force de poussée en une seule répétition.',
  a_noter = 'Mouvement technique, apprendre chaque phase séparément avant de les enchaîner.',
  tags = ARRAY['corps entier', 'barre']
WHERE id = 'mk_barbell-clean-and-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps.',
  execution = 'Debout, on plie les coudes pour monter la barre vers les épaules.',
  utilite = 'Grand classique du biceps, charge lourd les deux bras.',
  a_noter = 'Garder les coudes fixes, éviter de balancer le buste.',
  tags = ARRAY['biceps', 'barre']
WHERE id = 'mk_barbell-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Avant-bras, biceps en secondaire.',
  execution = 'Curl debout, paumes vers le bas.',
  utilite = 'Déplace le travail des biceps vers les avant-bras.',
  a_noter = 'Charge plus légère que le curl classique, le poignet est sollicité différemment.',
  tags = ARRAY['avant-bras', 'biceps', 'barre']
WHERE id = 'mk_reverse-grip-barbell-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps (portion interne).',
  execution = 'Curl debout, mains plus écartées que les épaules.',
  utilite = 'Déplace l''accent vers l''intérieur du biceps.',
  a_noter = 'Garder les coudes fixes le long du corps.',
  tags = ARRAY['biceps', 'barre']
WHERE id = 'mk_wide-grip-barbell-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps (portion externe).',
  execution = 'Curl debout, mains resserrées à l''intérieur de la largeur des épaules.',
  utilite = 'Déplace l''accent vers l''extérieur des biceps.',
  a_noter = 'Garder les coudes fixes le long du corps.',
  tags = ARRAY['biceps', 'barre']
WHERE id = 'mk_close-grip-barbell-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps (bas du biceps).',
  execution = 'Bras fixé sur un pupitre, on plie les coudes pour monter la barre EZ.',
  utilite = 'Isolation pure pour le bas du biceps.',
  a_noter = 'Ne pas verrouiller les coudes en extension complète.',
  tags = ARRAY['biceps', 'barre']
WHERE id = 'mk_ez-bar-preacher-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Brachial et avant-bras, biceps en secondaire.',
  execution = 'Bras fixé sur un pupitre, prise pronation sur la barre EZ.',
  utilite = 'Sollicite ensemble le brachial, les avant-bras et le biceps.',
  a_noter = 'Charge plus légère que la version classique, prise moins naturelle.',
  tags = ARRAY['avant-bras', 'biceps', 'barre']
WHERE id = 'mk_ez-bar-reverse-preacher-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Biceps (longue portion).',
  execution = 'La barre remonte en frôlant le buste, les coudes reculent en montant.',
  utilite = 'Cible la longue portion du biceps différemment du curl classique.',
  a_noter = 'Garder la barre proche du corps tout du long.',
  tags = ARRAY['biceps', 'barre']
WHERE id = 'mk_barbell-drag-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps en secondaire.',
  execution = 'Allongé au sol, on pousse la barre, les coudes s''arrêtant au niveau du sol.',
  utilite = 'Amplitude réduite qui charge le verrouillage et préserve les épaules.',
  a_noter = 'Bonne option en cas de gêne à l''épaule sur le développé couché classique.',
  tags = ARRAY['pectoraux', 'barre']
WHERE id = 'mk_barbell-floor-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux, triceps et avant des épaules.',
  execution = 'Allongé sur un banc, on pousse la barre au-dessus de la poitrine.',
  utilite = 'Base de toute séance de poussée.',
  a_noter = 'Garder les omoplates serrées et les pieds ancrés au sol.',
  tags = ARRAY['pectoraux', 'barre']
WHERE id = 'mk_barbell-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux.',
  execution = 'Développé couché en prise supination.',
  utilite = 'Déplace l''accent de la poussée vers le haut des pectoraux.',
  a_noter = 'Prise moins naturelle, charger progressivement.',
  tags = ARRAY['pectoraux', 'barre']
WHERE id = 'mk_reverse-grip-barbell-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Pectoraux.',
  execution = 'Développé couché, prise bien au-delà de la largeur des épaules.',
  utilite = 'Réduit l''amplitude et charge fortement les pectoraux.',
  a_noter = 'Prise large qui sollicite davantage les épaules, à surveiller.',
  tags = ARRAY['pectoraux', 'barre']
WHERE id = 'mk_wide-grip-barbell-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps, pectoraux en secondaire.',
  execution = 'Développé couché, mains resserrées.',
  utilite = 'Mouvement triceps le plus lourd de la salle.',
  a_noter = 'Garder les coudes proches du corps pendant la poussée.',
  tags = ARRAY['triceps', 'barre']
WHERE id = 'mk_barbell-close-grip-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas des pectoraux.',
  execution = 'Tête vers le bas sur un banc décliné, on pousse depuis le sternum jusqu''à l''extension.',
  utilite = 'Cible le bas des pectoraux.',
  a_noter = 'Bien sécuriser les pieds et le banc avant de charger.',
  tags = ARRAY['pectoraux', 'barre']
WHERE id = 'mk_decline-barbell-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux, avant des épaules et triceps.',
  execution = 'Sur un banc incliné entre 30 et 45 degrés, on pousse la barre au-dessus de la poitrine.',
  utilite = 'Deuxième pilier de toute séance de poussée.',
  a_noter = 'Ne pas trop incliner le banc pour garder le travail sur les pectoraux.',
  tags = ARRAY['pectoraux', 'barre']
WHERE id = 'mk_barbell-incline-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Haut des pectoraux et avant des épaules.',
  execution = 'Sur un banc incliné à environ 60 degrés, on pousse la barre au-dessus de la poitrine.',
  utilite = 'Oriente l''essentiel de la charge vers le haut des pectoraux et les épaules.',
  a_noter = 'Plus l''angle est haut, plus le travail se rapproche du développé militaire.',
  tags = ARRAY['pectoraux', 'barre']
WHERE id = 'mk_barbell-high-incline-bench-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes antérieurs et latéraux, triceps en secondaire.',
  execution = 'Debout, on pousse la barre depuis les épaules jusqu''au-dessus de la tête.',
  utilite = 'Test de référence de la force pure des épaules et du gainage.',
  a_noter = 'Garder le tronc gainé, ne pas cambrer pour aider la poussée.',
  tags = ARRAY['épaules', 'barre']
WHERE id = 'mk_barbell-overhead-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes, mobilité des épaules sollicitée.',
  execution = 'Développé militaire avec la barre posée derrière la nuque.',
  utilite = 'Variante qui demande une grande mobilité des épaules et du haut du dos.',
  a_noter = 'Réservé à ceux qui ont déjà une bonne mobilité d''épaule, sinon risque de gêne.',
  tags = ARRAY['épaules', 'barre']
WHERE id = 'mk_behind-the-neck-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et quadriceps.',
  execution = 'Barre sur les trapèzes, on effectue une fente en pas arrière.',
  utilite = 'Charge la jambe avant pendant que la jambe arrière guide l''équilibre.',
  a_noter = 'Garder le buste droit, le genou avant ne dépasse pas la pointe du pied.',
  tags = ARRAY['jambes', 'unilatéral', 'barre']
WHERE id = 'mk_barbell-reverse-lunge';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fléchisseurs de l''avant-bras.',
  execution = 'Assis, avant-bras posés, on plie les poignets pour lever la barre.',
  utilite = 'Finition classique pour la force de préhension et le volume de l''avant-bras.',
  a_noter = 'Charge légère, mouvement de faible amplitude au niveau du poignet.',
  tags = ARRAY['avant-bras', 'barre']
WHERE id = 'mk_barbell-wrist-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, puissance explosive.',
  execution = 'Tirage explosif depuis la position hang, barre calée sur l''avant des épaules.',
  utilite = 'Développe la puissance et la vitesse de tirage.',
  a_noter = 'Mouvement technique, à apprendre à charge légère avant d''augmenter.',
  tags = ARRAY['corps entier', 'haltérophilie', 'barre']
WHERE id = 'mk_hang-clean';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, puissance explosive.',
  execution = 'Hang clean réceptionné en squat partiel, sans descendre jusqu''à la parallèle.',
  utilite = 'Développe la puissance sans exiger la mobilité d''un clean complet.',
  a_noter = 'Réception rapide et stable, les genoux ne partent pas vers l''intérieur.',
  tags = ARRAY['corps entier', 'haltérophilie', 'barre']
WHERE id = 'mk_hang-power-clean';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, puissance explosive.',
  execution = 'Arraché prise large débuté depuis la position hang, réceptionné au-dessus de la tête.',
  utilite = 'Mouvement d''apprentissage du snatch complet.',
  a_noter = 'Mouvement très technique, encadrement recommandé pour débuter.',
  tags = ARRAY['corps entier', 'haltérophilie', 'barre']
WHERE id = 'mk_hang-snatch';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Bas des trapèzes, deltoïdes postérieurs en secondaire.',
  execution = 'Barre tenue derrière le corps, buste incliné à 30 degrés, on monte les épaules.',
  utilite = 'Cible le bas des trapèzes et l''arrière des épaules, zone souvent négligée.',
  a_noter = 'Garder le buste incliné tout du long pour bien cibler l''angle.',
  tags = ARRAY['trapèzes', 'barre']
WHERE id = 'mk_barbell-behind-the-back-30-degree-shrug';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Trapèzes (haut).',
  execution = 'Debout, barre en mains, on monte les épaules vers les oreilles.',
  utilite = 'Mouvement classique pour épaissir les trapèzes.',
  a_noter = 'Monter verticalement, éviter de faire rouler les épaules.',
  tags = ARRAY['trapèzes', 'barre']
WHERE id = 'mk_barbell-shrug';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Trapèzes (haut).',
  execution = 'Debout à l''intérieur d''une barre hexagonale, prise neutre, on monte les épaules.',
  utilite = 'Élévation scapulaire pure grâce à la prise neutre.',
  a_noter = 'Monter verticalement, éviter de faire rouler les épaules.',
  tags = ARRAY['trapèzes', 'barre']
WHERE id = 'mk_trap-bar-shrug';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers.',
  execution = 'Appuyé sur un banc, barre sur les hanches, on pousse jusqu''à l''extension complète.',
  utilite = 'Charge lourde possible pour construire les fessiers.',
  a_noter = 'Utiliser un coussin de barre pour le confort des hanches.',
  tags = ARRAY['fessiers', 'barre']
WHERE id = 'mk_barbell-hip-thrust';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Colonne vertébrale, ischio-jambiers en étirement.',
  execution = 'Debout, barre légère en mains, on enroule la colonne vertèbre par vertèbre.',
  utilite = 'Renforce le dos sur toute l''amplitude de flexion avant.',
  a_noter = 'Charge très légère, mouvement lent, à éviter en cas de douleur lombaire active.',
  tags = ARRAY['mobilité', 'dos', 'barre']
WHERE id = 'mk_barbell-spinal-jefferson-curl';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Triceps, pectoraux en secondaire.',
  execution = 'Croise le développé prise serrée et le skullcrusher, coudes qui descendent vers le visage.',
  utilite = 'Charge les triceps au verrouillage avec une charge plus lourde qu''un skullcrusher classique.',
  a_noter = 'Mouvement technique, trouver l''angle de coude qui convient avant de charger lourd.',
  tags = ARRAY['triceps', 'barre']
WHERE id = 'mk_jm-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes antérieurs, triceps en secondaire.',
  execution = 'Debout, on pousse une barre ancrée à une extrémité vers le haut et l''avant.',
  utilite = 'Arc de mouvement plus doux pour les épaules qu''un développé militaire strict.',
  a_noter = 'Garder le tronc gainé pendant la poussée.',
  tags = ARRAY['épaules', 'barre']
WHERE id = 'mk_landmine-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes antérieurs, gainage en secondaire.',
  execution = 'Un bras à la fois depuis l''épaule, on suit l''arc de la barre landmine.',
  utilite = 'Ajoute un travail de gainage anti-rotation à la poussée d''épaule.',
  a_noter = 'Garder le bassin stable, ne pas laisser le buste tourner.',
  tags = ARRAY['épaules', 'unilatéral', 'barre']
WHERE id = 'mk_single-arm-landmine-press';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, un côté à la fois.',
  execution = 'De côté par rapport à une barre landmine, en position décalée, on tire un côté du dos.',
  utilite = 'Variante unilatérale qui isole bien le grand dorsal.',
  a_noter = 'Garder le buste stable, ne pas tourner pour tirer plus loin.',
  tags = ARRAY['dos', 'unilatéral', 'barre']
WHERE id = 'mk_meadows-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Épaules et dos, force explosive.',
  execution = 'La barre monte du sol jusqu''au-dessus de la tête sans passer sous la barre.',
  utilite = 'Mouvement d''apprentissage en force stricte pour le snatch.',
  a_noter = 'Charge légère, la technique prime sur le poids.',
  tags = ARRAY['épaules', 'haltérophilie', 'barre']
WHERE id = 'mk_barbell-muscle-snatch';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et milieu du dos.',
  execution = 'La barre repose au sol à chaque répétition, tirée explosivement jusqu''à l''abdomen.',
  utilite = 'Développe la puissance de tirage en plus de la force du dos.',
  a_noter = 'Garder le dos plat, chaque répétition démarre d''un arrêt complet.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_pendlay-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, puissance explosive.',
  execution = 'Tirage explosif du sol jusqu''à une réception en prise avant sur les épaules.',
  utilite = 'Développe la puissance globale sans développé au-dessus de la tête.',
  a_noter = 'Mouvement technique, apprendre le tirage avant d''augmenter la charge.',
  tags = ARRAY['corps entier', 'haltérophilie', 'barre']
WHERE id = 'mk_power-clean';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, puissance explosive.',
  execution = 'Tirage explosif du sol jusqu''au-dessus de la tête, réceptionné en quart de squat.',
  utilite = 'Puissance globale sans la profondeur d''un snatch complet.',
  a_noter = 'Mouvement très technique, encadrement recommandé pour débuter.',
  tags = ARRAY['corps entier', 'haltérophilie', 'barre']
WHERE id = 'mk_barbell-power-snatch';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, pectoraux en secondaire.',
  execution = 'Allongé sur un banc, on descend la barre en arc au-dessus de la tête puis on remonte.',
  utilite = 'Étire et charge le grand dorsal, exercice complémentaire pour le dos et la cage thoracique.',
  a_noter = 'Garder une légère flexion des coudes tout du long.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_barbell-pullover';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Épaules et jambes, puissance explosive.',
  execution = 'Une courte flexion de jambes propulse la barre au-dessus de la tête, réceptionnée en squat partiel.',
  utilite = 'Permet de développer une charge plus lourde qu''un développé militaire strict.',
  a_noter = 'La flexion de jambes doit rester courte, la réception stable.',
  tags = ARRAY['épaules', 'haltérophilie', 'barre']
WHERE id = 'mk_push-jerk';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Dos, fessiers et ischio-jambiers.',
  execution = 'Soulevé de terre partiel tiré depuis des supports surélevés.',
  utilite = 'Charge lourde pour le dos sans l''exigence d''un tirage complet depuis le sol.',
  a_noter = 'Garder le dos plat, ne pas se pencher davantage pour compenser la hauteur.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_barbell-rack-pull';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et biceps.',
  execution = 'Rowing buste penché, prise supination, coudes resserrés.',
  utilite = 'Privilégie le grand dorsal davantage que la prise pronation.',
  a_noter = 'Garder le dos plat pendant tout le hip hinge.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_underhand-barbell-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal, milieu du dos et biceps.',
  execution = 'Buste penché en avant, dos plat, on tire la barre vers l''abdomen.',
  utilite = 'L''un des mouvements les plus efficaces pour construire le dos.',
  a_noter = 'Garder le dos plat, le mouvement part des omoplates.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_barbell-bent-over-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et milieu du dos.',
  execution = 'Rowing buste penché, prise pronation, barre tirée vers le nombril.',
  utilite = 'Charge le dos et le milieu du dos ensemble.',
  a_noter = 'Garder le dos plat pendant tout le hip hinge.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_barbell-bent-over-row-overhand';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Deltoïdes latéraux, trapèzes en secondaire.',
  execution = 'Debout, on tire la barre verticalement des hanches jusqu''à la poitrine.',
  utilite = 'Mouvement classique pour élargir les épaules.',
  a_noter = 'Ne pas monter les coudes trop haut pour éviter de gêner l''épaule.',
  tags = ARRAY['épaules', 'trapèzes', 'barre']
WHERE id = 'mk_barbell-upright-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et milieu du dos.',
  execution = 'Buste calé, on tire une barre landmine chargée horizontalement vers soi.',
  utilite = 'Tirage lourd et contrôlé pour construire le dos.',
  a_noter = 'Garder le buste stable contre l''appui tout du long.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_landmine-t-bar-rows';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et milieu du dos.',
  execution = 'À plat ventre sur un banc surélevé, on tire la barre vers le buste.',
  utilite = 'Élimine toute triche du corps, les hanches et le bas du dos restent hors du mouvement.',
  a_noter = 'Le banc doit être assez haut pour laisser les bras pendre librement.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_seal-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, puissance explosive.',
  execution = 'La barre part du sol et va au-dessus de la tête en un seul tirage, réceptionnée en squat profond.',
  utilite = 'Mouvement olympique complet, développe puissance et mobilité.',
  a_noter = 'Mouvement très technique, encadrement fortement recommandé.',
  tags = ARRAY['corps entier', 'haltérophilie', 'barre']
WHERE id = 'mk_barbell-snatch';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Dos, fessiers et ischio-jambiers.',
  execution = 'Barre au sol, on tire en poussant sur les jambes et en gardant le dos plat.',
  utilite = 'Référence absolue pour charger le dos, les fessiers et les ischio-jambiers.',
  a_noter = 'Garder la barre proche des jambes tout du long.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_barbell-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Fessiers et ischio-jambiers, dos en secondaire.',
  execution = 'Debout à l''intérieur de la barre hexagonale, poignées neutres, on tire en se relevant.',
  utilite = 'Version plus accessible du soulevé de terre grâce aux poignées neutres.',
  a_noter = 'Garder le dos plat, le mouvement part des hanches.',
  tags = ARRAY['jambes', 'dos', 'barre']
WHERE id = 'mk_trap-bar-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Dos, fessiers et ischio-jambiers.',
  execution = 'Soulevé de terre conventionnel tiré depuis une plateforme surélevée.',
  utilite = 'Ajoute de l''amplitude en bas du mouvement.',
  a_noter = 'Ne pas forcer l''amplitude au détriment d''un dos plat.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_deficit-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Dos, fessiers et ischio-jambiers.',
  execution = 'Soulevé de terre avec une prise très large façon snatch.',
  utilite = 'Abaisse la position de départ et charge fortement le haut du dos.',
  a_noter = 'Prise très large qui demande plus de mobilité d''épaule.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_snatch-grip-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers, fessiers en secondaire.',
  execution = 'Genoux à peine fléchis, on descend la barre le long des cuisses en hip hinge.',
  utilite = 'Excellent constructeur de la chaîne postérieure.',
  a_noter = 'Le dos reste plat, le mouvement part des hanches.',
  tags = ARRAY['ischio-jambiers', 'barre']
WHERE id = 'mk_barbell-romanian-deadlift';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Ischio-jambiers et fessiers.',
  execution = 'Jambes quasi tendues, on descend la barre depuis le sol en hip hinge.',
  utilite = 'Étirement profond des ischio-jambiers, excellent constructeur de la chaîne postérieure.',
  a_noter = 'Garder le dos plat, ne pas arrondir pour aller plus bas.',
  tags = ARRAY['ischio-jambiers', 'barre']
WHERE id = 'mk_barbell-stiff-leg-deadlifts';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Épaules et jambes, puissance explosive.',
  execution = 'Une flexion de jambes puis une poussée envoient la barre au-dessus de la tête, pieds qui se fendent pour réceptionner.',
  utilite = 'Permet de développer une charge plus lourde qu''un développé militaire strict.',
  a_noter = 'Mouvement technique, la stabilité de la réception prime sur la charge.',
  tags = ARRAY['épaules', 'haltérophilie', 'barre']
WHERE id = 'mk_split-jerk';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Barre sur le dos, on descend en squat jusqu''aux cuisses parallèles puis on repousse.',
  utilite = 'Référence pour mesurer la puissance des jambes.',
  a_noter = 'Genoux qui suivent la direction des pieds, poids réparti sur tout le pied.',
  tags = ARRAY['jambes', 'barre']
WHERE id = 'mk_barbell-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps.',
  execution = 'Barre posée sur l''avant des épaules, on descend en squat en gardant le buste droit.',
  utilite = 'Force un buste droit et une descente à dominante quadriceps.',
  a_noter = 'Garder les coudes hauts pour stabiliser la barre.',
  tags = ARRAY['jambes', 'barre']
WHERE id = 'mk_front-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers.',
  execution = 'Barre sur le dos, position de fente statique, on descend puis on repousse.',
  utilite = 'Étape intermédiaire entre le squat classique et la fente bulgare.',
  a_noter = 'Garder le buste droit tout du long.',
  tags = ARRAY['jambes', 'unilatéral', 'barre']
WHERE id = 'mk_barbell-split-squat';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, un côté à la fois.',
  execution = 'Barre en prise avant, on monte sur une box avec une montée de genou explosive en haut.',
  utilite = 'Force, puissance des fessiers et équilibre sous charge.',
  a_noter = 'Pousser avec la jambe du dessus, ne pas s''aider de la jambe au sol.',
  tags = ARRAY['jambes', 'unilatéral', 'barre']
WHERE id = 'mk_barbell-front-rack-step-up-knee-drive';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, un côté à la fois.',
  execution = 'Barre au dos, on monte sur une box avec une montée de genou explosive en haut.',
  utilite = 'Force unilatérale avec une poussée de hanche explosive intégrée.',
  a_noter = 'Pousser avec la jambe du dessus, garder le buste droit.',
  tags = ARRAY['jambes', 'unilatéral', 'barre']
WHERE id = 'mk_barbell-step-up-knee-drive';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Corps entier, quadriceps et épaules en moteur principal.',
  execution = 'Un squat avant enchaîné directement sur un développé au-dessus de la tête.',
  utilite = 'Sollicite jambes, épaules et cardio en même temps.',
  a_noter = 'Utiliser l''élan du squat pour lancer le développé.',
  tags = ARRAY['corps entier', 'cardio', 'barre']
WHERE id = 'mk_barbell-thruster';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Trapèzes et dos, puissance explosive.',
  execution = 'Tirage prise large qui se termine par un haussement d''épaules énergique, coudes hauts.',
  utilite = 'Construit la puissance de tirage avec une prise large.',
  a_noter = 'Terminer coudes hauts et vers l''extérieur, pas seulement avec les mains.',
  tags = ARRAY['dos', 'haltérophilie', 'barre']
WHERE id = 'mk_snatch-grip-high-pull';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Dos et trapèzes, puissance explosive.',
  execution = 'Tirage prise large travaillé lourd, sans réception.',
  utilite = 'Construit l''extension et la trajectoire de barre du snatch.',
  a_noter = 'Garder la barre proche du corps tout du long du tirage.',
  tags = ARRAY['dos', 'haltérophilie', 'barre']
WHERE id = 'mk_snatch-pull';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Grand dorsal et biceps.',
  execution = 'Rowing barre en prise supination, buste maintenu juste au-delà de 45 degrés.',
  utilite = 'Permet de charger plus lourd qu''un rowing buste très penché.',
  a_noter = 'Garder le buste stable à l''angle choisi, ne pas se redresser pour tricher.',
  tags = ARRAY['dos', 'barre']
WHERE id = 'mk_yates-row';

UPDATE public.exercices_catalogue SET description = NULL,
  muscle_travaille = 'Quadriceps et fessiers, gainage du tronc.',
  execution = 'Barre nichée dans le pli des coudes, on descend en squat.',
  utilite = 'Force un buste très droit sous charge.',
  a_noter = 'Utiliser un protège-barre ou une serviette, la barre presse fort sur les coudes.',
  tags = ARRAY['jambes', 'gainage', 'barre']
WHERE id = 'mk_zercher-squat';

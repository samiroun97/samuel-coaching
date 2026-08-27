-- ══════════════════════════════════════════════════════════════
-- Audit complet des 412 exercices MoveKit : corrige l'ordre anglais
-- gardé tel quel par le script d'import (accessoire/modificateur avant
-- le mouvement), les mentions d'équipement en double, les mots répétés,
-- et uniformise la place de "unilatéral(e)" (toujours après le
-- mouvement). Les termes anglais courants en salle (hip thrust, jump
-- squat, goblet, cross body, curtsy, burpees...) sont conservés tels
-- quels, décision explicite de l'utilisateur.
--
-- Deux vraies confusions trouvées en vérifiant les descriptions :
--  - "fente bulgare" (pied arrière surélevé) était utilisé pour des
--    squats fendus qui ne le sont pas (mk_barbell-split-squat,
--    mk_dumbbell-goblet-split-squat, mk_front-foot-elevated-split-squat)
--    -> renommés "squat fendu" (le vrai terme bulgare est gardé pour
--    les exercices réellement pied arrière surélevé).
--  - mk_cable-chest-press / mk_cable-bench-press et mk_kettlebell-row /
--    mk_kettlebell-row-single / mk_kettlebell-single-arm-row portaient
--    des noms identiques ou ambigus alors que ce sont des mouvements
--    différents (debout/sur banc, position décalée/buste appuyé).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Barre
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre en déficit' WHERE id = 'mk_deficit-deadlift';
UPDATE public.exercices_catalogue SET nom = 'curl pupitre à la barre ez' WHERE id = 'mk_ez-bar-preacher-curl';
UPDATE public.exercices_catalogue SET nom = 'curl pupitre à la barre ez, prise inversée' WHERE id = 'mk_ez-bar-reverse-preacher-curl';
UPDATE public.exercices_catalogue SET nom = 'développé incliné haut à la barre' WHERE id = 'mk_barbell-high-incline-bench-press';
UPDATE public.exercices_catalogue SET nom = 'step-up avec montée de genou à la barre, prise devant' WHERE id = 'mk_barbell-front-rack-step-up-knee-drive';
UPDATE public.exercices_catalogue SET nom = 'développé couché à la barre, prise serrée' WHERE id = 'mk_barbell-close-grip-bench-press';
UPDATE public.exercices_catalogue SET nom = 'rowing buste penché à la barre, prise pronation' WHERE id = 'mk_barbell-bent-over-row-overhand';
UPDATE public.exercices_catalogue SET nom = 'landmine press unilatéral' WHERE id = 'mk_single-arm-landmine-press';
UPDATE public.exercices_catalogue SET nom = 'haussement d''épaules à la barre hexagonale' WHERE id = 'mk_trap-bar-shrug';
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre à la barre hexagonale' WHERE id = 'mk_trap-bar-deadlift';
UPDATE public.exercices_catalogue SET nom = 'fente inversée à la barre' WHERE id = 'mk_barbell-reverse-lunge';
UPDATE public.exercices_catalogue SET nom = 'squat fendu à la barre' WHERE id = 'mk_barbell-split-squat';

-- Élastique
UPDATE public.exercices_catalogue SET nom = 'tirage vertical à l''élastique, à genoux' WHERE id = 'mk_band-kneeling-pulldown';
UPDATE public.exercices_catalogue SET nom = 'tirage vertical à l''élastique, assis' WHERE id = 'mk_band-seated-pulldown';
UPDATE public.exercices_catalogue SET nom = 'traction assistée à l''élastique' WHERE id = 'mk_band-assisted-pull-up';
UPDATE public.exercices_catalogue SET nom = 'rotation externe à l''élastique' WHERE id = 'mk_band-external-rotation';
UPDATE public.exercices_catalogue SET nom = 'face pull haut à l''élastique' WHERE id = 'mk_band-high-face-pull';
UPDATE public.exercices_catalogue SET nom = 'élévation latérale unilatérale à l''élastique' WHERE id = 'mk_band-single-arm-lateral-raise';

-- Haltère
UPDATE public.exercices_catalogue SET nom = 'debout curl unilatéral à l''haltère' WHERE id = 'mk_dumbbell-standing-single-arm-curl';
UPDATE public.exercices_catalogue SET nom = 'debout curl marteau unilatéral à l''haltère' WHERE id = 'mk_dumbbell-standing-single-arm-hammer-curl';
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre roumain cross body à l''haltère' WHERE id = 'mk_dumbbell-cross-body-romanian-deadlift';
UPDATE public.exercices_catalogue SET nom = 'fente avant en alternance à l''haltère' WHERE id = 'mk_dumbbell-alternating-forward-lunge';
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre roumain en déficit à l''haltère' WHERE id = 'mk_deficit-dumbbell-romanian-deadlift';
UPDATE public.exercices_catalogue SET nom = 'fente avant goblet à l''haltère' WHERE id = 'mk_dumbbell-goblet-forward-lunge';
UPDATE public.exercices_catalogue SET nom = 'fente bulgare à l''haltère' WHERE id = 'mk_dumbbell-bulgarian-split-squat';
UPDATE public.exercices_catalogue SET nom = 'fente bulgare goblet à l''haltère' WHERE id = 'mk_dumbbell-goblet-bulgarian-split-squat';
UPDATE public.exercices_catalogue SET nom = 'fente curtsy goblet en alternance à l''haltère' WHERE id = 'mk_dumbbell-goblet-alternating-curtsy-lunge';
UPDATE public.exercices_catalogue SET nom = 'squat fendu goblet à l''haltère' WHERE id = 'mk_dumbbell-goblet-split-squat';
UPDATE public.exercices_catalogue SET nom = 'fente inversée goblet à l''haltère' WHERE id = 'mk_dumbbell-goblet-reverse-lunge';
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre roumain rapide, charnière de hanche, à l''haltère' WHERE id = 'mk_hip-hinge-speed-romanian-deadlift';
UPDATE public.exercices_catalogue SET nom = 'clean and press unilatéral à l''haltère' WHERE id = 'mk_dumbbell-single-arm-clean-and-press';
UPDATE public.exercices_catalogue SET nom = 'extension triceps unilatérale à l''haltère' WHERE id = 'mk_single-arm-tricep-extension';
UPDATE public.exercices_catalogue SET nom = 'hip thrust unilatéral à l''haltère' WHERE id = 'mk_dumbbell-single-leg-hip-thrust';
UPDATE public.exercices_catalogue SET nom = 'mollets debout unilatéral à l''haltère' WHERE id = 'mk_dumbbell-single-leg-calf-raise';
UPDATE public.exercices_catalogue SET nom = 'rowing unilatéral à l''haltère' WHERE id = 'mk_dumbbell-single-arm-row';
UPDATE public.exercices_catalogue SET nom = 'mollets assis' WHERE id = 'mk_seated-calf-raise';
UPDATE public.exercices_catalogue SET nom = 'fente latérale à l''haltère' WHERE id = 'mk_dumbbell-lateral-lunge';
UPDATE public.exercices_catalogue SET nom = 'squat fendu, pied avant surélevé, à l''haltère' WHERE id = 'mk_front-foot-elevated-split-squat';

-- Kettlebell
UPDATE public.exercices_catalogue SET nom = 'fente bulgare assistée au kettlebell' WHERE id = 'mk_kettlebell-assisted-bulgarian-split-squat';
UPDATE public.exercices_catalogue SET nom = 'fente curtsy en alternance au kettlebell' WHERE id = 'mk_kettlebell-alternating-curtsy-lunge';
UPDATE public.exercices_catalogue SET nom = 'curl goblet au kettlebell' WHERE id = 'mk_kettlebell-goblet-curl';
UPDATE public.exercices_catalogue SET nom = 'rowing au kettlebell, position décalée' WHERE id = 'mk_kettlebell-row-single';
UPDATE public.exercices_catalogue SET nom = 'rowing unilatéral au kettlebell, buste appuyé' WHERE id = 'mk_kettlebell-single-arm-row';

-- Machine
UPDATE public.exercices_catalogue SET nom = 'traction assistée à la machine' WHERE id = 'mk_machine-assisted-pull-up';
UPDATE public.exercices_catalogue SET nom = 'fente avant au disque' WHERE id = 'mk_plate-forward-lunge';
UPDATE public.exercices_catalogue SET nom = 'extension des jambes à la machine à disques' WHERE id = 'mk_machine-plate-loaded-leg-extension';
UPDATE public.exercices_catalogue SET nom = 'développé militaire avant à la machine à disques' WHERE id = 'mk_machine-front-military-press';
UPDATE public.exercices_catalogue SET nom = 'rowing t-bar à la machine à disques' WHERE id = 'mk_machine-plate-loaded-t-bar-row';
UPDATE public.exercices_catalogue SET nom = 'rowing haut hammer strength' WHERE id = 'mk_hammer-strength-high-row';
UPDATE public.exercices_catalogue SET nom = 'presse à cuisses horizontale à la machine' WHERE id = 'mk_machine-horizontal-leg-press';
UPDATE public.exercices_catalogue SET nom = 'marche sur tapis de course incliné' WHERE id = 'mk_incline-treadmill-walk';
UPDATE public.exercices_catalogue SET nom = 'hack squat inversé' WHERE id = 'mk_reverse-hack-squat';
UPDATE public.exercices_catalogue SET nom = 'pec deck inversé' WHERE id = 'mk_reverse-pec-deck';
UPDATE public.exercices_catalogue SET nom = 'rowing prise neutre à la machine' WHERE id = 'mk_machine-neutral-row';
UPDATE public.exercices_catalogue SET nom = 'rowing à la machine, prise supination' WHERE id = 'mk_machine-underhand-row';
UPDATE public.exercices_catalogue SET nom = 'tirage vertical, prise serrée' WHERE id = 'mk_narrow-pulldown';
UPDATE public.exercices_catalogue SET nom = 'presse à cuisses unilatérale à la machine' WHERE id = 'mk_single-leg-press';

-- Poids du corps
UPDATE public.exercices_catalogue SET nom = 'fente inversée' WHERE id = 'mk_bodyweight-reverse-lunge';
UPDATE public.exercices_catalogue SET nom = 'fente inversée en alternance' WHERE id = 'mk_bodyweight-alternating-reverse-lunges';
UPDATE public.exercices_catalogue SET nom = 'abduction de hanche' WHERE id = 'mk_bodyweight-hip-abduction';
UPDATE public.exercices_catalogue SET nom = 'box squat' WHERE id = 'mk_bodyweight-box-squat';
UPDATE public.exercices_catalogue SET nom = 'donkey mollets debout' WHERE id = 'mk_bodyweight-donkey-calf-raise';
UPDATE public.exercices_catalogue SET nom = 'jefferson curl' WHERE id = 'mk_bodyweight-spinal-jefferson-curl';
UPDATE public.exercices_catalogue SET nom = 'mollets debout unilatéral' WHERE id = 'mk_single-leg-standing-calf-raise';
UPDATE public.exercices_catalogue SET nom = 'hip thrust unilatéral' WHERE id = 'mk_single-leg-hip-thrust';
UPDATE public.exercices_catalogue SET nom = 'pont fessier unilatéral' WHERE id = 'mk_single-leg-glute-bridge';
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre roumain unilatéral' WHERE id = 'mk_single-legged-romanian-deadlifts';
UPDATE public.exercices_catalogue SET nom = 'step-down unilatéral' WHERE id = 'mk_single-leg-step-down';

-- Poulie
UPDATE public.exercices_catalogue SET nom = 'face pull à la corde, à la poulie, assis' WHERE id = 'mk_cable-seated-rope-face-pull';
UPDATE public.exercices_catalogue SET nom = 'rowing assis à la poulie' WHERE id = 'mk_machine-seated-cable-row';
UPDATE public.exercices_catalogue SET nom = 'curl à la barre, à la poulie' WHERE id = 'mk_cable-bar-curl';
UPDATE public.exercices_catalogue SET nom = 'face pull à la barre, à la poulie' WHERE id = 'mk_cable-bar-face-pull';
UPDATE public.exercices_catalogue SET nom = 'écarté couché à la poulie, sur banc' WHERE id = 'mk_cable-bench-chest-fly';
UPDATE public.exercices_catalogue SET nom = 'kickback jambe tendue à la poulie, sur banc' WHERE id = 'mk_cable-bench-straight-leg-kickback';
UPDATE public.exercices_catalogue SET nom = 'face pull à la corde, à la poulie, à genoux' WHERE id = 'mk_cable-rope-kneeling-face-pull';
UPDATE public.exercices_catalogue SET nom = 'curl marteau à la corde, à la poulie' WHERE id = 'mk_cable-rope-hammer-curl';
UPDATE public.exercices_catalogue SET nom = 'face pull à la corde, à la poulie' WHERE id = 'mk_machine-face-pulls';
UPDATE public.exercices_catalogue SET nom = 'pull-over à la corde, à la poulie' WHERE id = 'mk_cable-rope-pullover';
UPDATE public.exercices_catalogue SET nom = 'développé couché à la poulie, sur banc' WHERE id = 'mk_cable-bench-press';
UPDATE public.exercices_catalogue SET nom = 'développé couché à la poulie, debout' WHERE id = 'mk_cable-chest-press';
UPDATE public.exercices_catalogue SET nom = 'écarté à la poulie' WHERE id = 'mk_cable-pec-fly';
UPDATE public.exercices_catalogue SET nom = 'écarté unilatéral à la poulie' WHERE id = 'mk_single-arm-cable-fly';
UPDATE public.exercices_catalogue SET nom = 'rowing à la poulie, prise supination' WHERE id = 'mk_cable-supinating-row';
UPDATE public.exercices_catalogue SET nom = 'rotation externe à la poulie' WHERE id = 'mk_cable-external-rotation';
UPDATE public.exercices_catalogue SET nom = 'écarté à la poulie, de haut en bas' WHERE id = 'mk_cable-high-to-low-fly';
UPDATE public.exercices_catalogue SET nom = 'élévation latérale unilatérale à la poulie, en bas' WHERE id = 'mk_cable-low-single-arm-lateral-raise';
UPDATE public.exercices_catalogue SET nom = 'écarté à la poulie, de bas en haut' WHERE id = 'mk_cable-low-to-high-fly';
UPDATE public.exercices_catalogue SET nom = 'extension triceps à la poulie, prise inversée' WHERE id = 'mk_reverse-grip-tricep-pushdown';
UPDATE public.exercices_catalogue SET nom = 'tirage vertical, prise large' WHERE id = 'mk_wide-grip-lat-pulldown';
UPDATE public.exercices_catalogue SET nom = 'tirage vertical, prise neutre' WHERE id = 'mk_neutral-grip-lat-pulldown';
UPDATE public.exercices_catalogue SET nom = 'rowing debout à la barre, à la poulie' WHERE id = 'mk_cable-row-bar-standing-row';
UPDATE public.exercices_catalogue SET nom = 'tirage vertical, bras tendu' WHERE id = 'mk_straight-arm-lat-pulldown';
UPDATE public.exercices_catalogue SET nom = 'leg curl allongé unilatéral à la poulie' WHERE id = 'mk_cable-single-leg-laying-leg-curl';
UPDATE public.exercices_catalogue SET nom = 'rowing unilatéral à la poulie, prise neutre' WHERE id = 'mk_cable-single-arm-neutral-grip-row';
UPDATE public.exercices_catalogue SET nom = 'rowing unilatéral à la poulie, prise supination' WHERE id = 'mk_cable-single-arm-underhand-grip-row';
UPDATE public.exercices_catalogue SET nom = 'tirage vertical unilatéral' WHERE id = 'mk_single-arm-lat-pulldown';

-- Collision révélée après coup : mk_dumbbell-row-unilateral et mk_dumbbell-single-arm-row
-- sont deux entrées MoveKit distinctes (vidéos différentes) mais quasi identiques une
-- fois "unilatéral" replacé après le mouvement. Différenciées par leur muscle_cible réel
-- (trapèzes vs haut du dos) plutôt que d'inventer une nuance.
UPDATE public.exercices_catalogue SET nom = 'rowing unilatéral à l''haltère (haut du dos)' WHERE id = 'mk_dumbbell-single-arm-row';

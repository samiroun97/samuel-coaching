-- ══════════════════════════════════════════════════════════════
-- Migration : corrige les noms mal traduits par le script d'import
-- automatique MoveKit (voir supabase/exercices_catalogue_movekit_migration.sql)
-- Relecture complete des 412 noms. Deux categories de bugs :
--  1) Bug systematique : le script joignait "à l'" + equipement avec un
--     espace en trop ("à l' haltère" au lieu de "à l'haltère") — corrige
--     ici en une seule passe sur toute la table.
--  2) ~35 noms individuellement mal ordonnes ou avec un terme non
--     traduit ("chest press", "overhead", "glute", degres non traduits,
--     poulie/machine dupliquee, prises de main placees avant le nom du
--     mouvement) — corriges un par un ci-dessous.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1) Espace en trop apres l'apostrophe ("à l' haltère" -> "à l'haltère")
UPDATE public.exercices_catalogue SET nom = replace(nom, 'l'' ', 'l''') WHERE nom LIKE '%l'' %';

-- 2) Corrections individuelles
UPDATE public.exercices_catalogue SET nom = 'haussement d''épaules à 30 degrés à la poulie' WHERE id = 'mk_cable-30-degree-shrug';
UPDATE public.exercices_catalogue SET nom = 'extension du dos à 45 degrés à la machine' WHERE id = 'mk_machine-45-degree-back-extension';
UPDATE public.exercices_catalogue SET nom = 'haussement d''épaules à 30 degrés derrière le dos à la barre' WHERE id = 'mk_barbell-behind-the-back-30-degree-shrug';
UPDATE public.exercices_catalogue SET nom = 'développé nuque' WHERE id = 'mk_behind-the-neck-press';
UPDATE public.exercices_catalogue SET nom = 'power clean' WHERE id = 'mk_power-clean';
UPDATE public.exercices_catalogue SET nom = 'farmer''s walk au kettlebell' WHERE id = 'mk_kettlebell-farmers-carry';
UPDATE public.exercices_catalogue SET nom = 'course sur tapis' WHERE id = 'mk_treadmill-run';
UPDATE public.exercices_catalogue SET nom = 'extension à la poulie avec barre' WHERE id = 'mk_cable-bar-pushdown';
UPDATE public.exercices_catalogue SET nom = 'extension à la poulie avec corde' WHERE id = 'mk_cable-rope-pushdown';
UPDATE public.exercices_catalogue SET nom = 'rotation du tronc à la poulie, de bas en haut, debout' WHERE id = 'mk_cable-standing-low-to-high-wood-chopper';
UPDATE public.exercices_catalogue SET nom = 'extension à la poulie barre en V à la machine' WHERE id = 'mk_machine-cable-v-bar-push-downs';
UPDATE public.exercices_catalogue SET nom = 'rotation du tronc à la poulie' WHERE id = 'mk_cable-wood-chopper';
UPDATE public.exercices_catalogue SET nom = 'extension unilatérale à la poulie avec corde' WHERE id = 'mk_cable-single-arm-rope-pushdown';
UPDATE public.exercices_catalogue SET nom = 'écarté à la machine' WHERE id = 'mk_machine-pec-fly';

UPDATE public.exercices_catalogue SET nom = 'crunch à la poulie, à genoux' WHERE id = 'mk_kneeling-cable-crunch';
UPDATE public.exercices_catalogue SET nom = 'curl à l''haltère, assis' WHERE id = 'mk_seated-dumbbell-curl';
UPDATE public.exercices_catalogue SET nom = 'rowing à l''haltère, buste appuyé' WHERE id = 'mk_chest-supported-dumbbell-row';
UPDATE public.exercices_catalogue SET nom = 'rowing t-bar, buste appuyé' WHERE id = 'mk_chest-supported-t-bar-row';
UPDATE public.exercices_catalogue SET nom = 'mollets debout à la machine' WHERE id = 'mk_standing-calf-raise-machine';
UPDATE public.exercices_catalogue SET nom = 'abduction de hanche à la poulie, debout' WHERE id = 'mk_standing-cable-hip-abduction';
UPDATE public.exercices_catalogue SET nom = 'développé couché décliné à la barre' WHERE id = 'mk_decline-barbell-bench-press';
UPDATE public.exercices_catalogue SET nom = 'développé couché décliné à la machine' WHERE id = 'mk_decline-machine-chest-press';
UPDATE public.exercices_catalogue SET nom = 'développé couché incliné à la machine' WHERE id = 'mk_incline-machine-chest-press';
UPDATE public.exercices_catalogue SET nom = 'développé couché à la machine' WHERE id = 'mk_machine-chest-press';
UPDATE public.exercices_catalogue SET nom = 'développé couché à la poulie' WHERE id = 'mk_cable-chest-press';
UPDATE public.exercices_catalogue SET nom = 'développé couché unilatéral à la poulie, debout' WHERE id = 'mk_cable-standing-single-arm-chest-press';
UPDATE public.exercices_catalogue SET nom = 'développé couché unilatéral à l''haltère' WHERE id = 'mk_dumbbell-single-arm-chest-press';
UPDATE public.exercices_catalogue SET nom = 'kickback fessier à la machine' WHERE id = 'mk_glute-kickback-machine';
UPDATE public.exercices_catalogue SET nom = 'vélo en salle (spin bike)' WHERE id = 'mk_indoor-cycling-spin';
UPDATE public.exercices_catalogue SET nom = 'rowing t-bar au landmine' WHERE id = 'mk_landmine-t-bar-rows';
UPDATE public.exercices_catalogue SET nom = 'élévation latérale à la poulie, en appui penché' WHERE id = 'mk_leaning-cable-lateral-raise';
UPDATE public.exercices_catalogue SET nom = 'dips aux barres parallèles' WHERE id = 'mk_parralel-bar-dips';
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre roumain à l''haltère, position kickstand' WHERE id = 'mk_kickstand-dumbbell-romanian-deadlift';
UPDATE public.exercices_catalogue SET nom = 'curl à la barre, prise inversée' WHERE id = 'mk_reverse-grip-barbell-curl';
UPDATE public.exercices_catalogue SET nom = 'développé couché à la barre, prise inversée' WHERE id = 'mk_reverse-grip-barbell-bench-press';
UPDATE public.exercices_catalogue SET nom = 'rowing assis à la poulie, prise large' WHERE id = 'mk_wide-grip-seated-cable-row';
UPDATE public.exercices_catalogue SET nom = 'curl à la barre, prise large' WHERE id = 'mk_wide-grip-barbell-curl';
UPDATE public.exercices_catalogue SET nom = 'développé couché à la barre, prise large' WHERE id = 'mk_wide-grip-barbell-bench-press';
UPDATE public.exercices_catalogue SET nom = 'développé couché à l''haltère, prise neutre' WHERE id = 'mk_neutral-grip-dumbbell-bench-press';
UPDATE public.exercices_catalogue SET nom = 'curl à la barre, prise serrée' WHERE id = 'mk_close-grip-barbell-curl';
UPDATE public.exercices_catalogue SET nom = 'rowing à la barre, prise supination' WHERE id = 'mk_underhand-barbell-row';
UPDATE public.exercices_catalogue SET nom = 'développé militaire unilatéral à l''haltère' WHERE id = 'mk_single-arm-dumbbell-overhead-press';
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre roumain unilatéral à l''haltère' WHERE id = 'mk_single-leg-dumbbell-romanian-deadlift';
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre roumain unilatéral au kettlebell (en déficit)' WHERE id = 'mk_single-leg-kettlebell-romanian-deadlift-deficit';
UPDATE public.exercices_catalogue SET nom = 'extension unilatérale à la poulie, au-dessus de la tête' WHERE id = 'mk_single-arm-overhead-cable-extension';
UPDATE public.exercices_catalogue SET nom = 'écarté à la poulie, unilatéral' WHERE id = 'mk_single-arm-cable-fly';
UPDATE public.exercices_catalogue SET nom = 'extension triceps au-dessus de la tête, assis, à l''haltère' WHERE id = 'mk_dumbbell-seated-overhead-tricep-extension';
UPDATE public.exercices_catalogue SET nom = 'extension triceps au-dessus de la tête à la poulie (corde)' WHERE id = 'mk_cable-rope-overhead-tricep-extension';

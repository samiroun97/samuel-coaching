-- ══════════════════════════════════════════════════════════════
-- Précise l'anatomie des 41 exercices "épaules" : muscle_cible
-- reste "deltoïdes" partout (filtre + silhouette react-body-highlighter,
-- pas de région distincte antérieur/latéral/postérieur côté librairie).
-- La précision (deltoïde antérieur/latéral/postérieur, sus-épineux,
-- infra-épineux, petit rond, trapèze supérieur/moyen, rhomboïdes...)
-- va dans muscle_travaille (texte affiché dans la fiche exercice) et
-- muscles_secondaires (tableau).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue AS e SET
  muscle_travaille = v.travaille,
  muscles_secondaires = v.secondaires
FROM (VALUES
  ('mk_arnold-press', 'Deltoïde antérieur et deltoïde latéral (rotation en fin de mouvement), avec le triceps brachial.', ARRAY['deltoïde latéral','triceps brachial']::text[]),
  ('mk_cuban-press', 'Deltoïde latéral, avec les rotateurs externes de l''épaule (infra-épineux, petit rond) et le deltoïde antérieur.', ARRAY['infra-épineux','petit rond','deltoïde antérieur']::text[]),
  ('mk_band-overhead-press', 'Deltoïde antérieur, avec le deltoïde latéral et le triceps brachial.', ARRAY['deltoïde latéral','triceps brachial']::text[]),
  ('mk_dumbbell-seated-overhead-press', 'Deltoïde antérieur, avec le deltoïde latéral et le triceps brachial, dos soutenu.', ARRAY['deltoïde latéral','triceps brachial']::text[]),
  ('mk_barbell-overhead-press', 'Deltoïde antérieur, avec le deltoïde latéral, le triceps brachial et les trapèzes (stabilisation debout).', ARRAY['deltoïde latéral','triceps brachial','trapèzes']::text[]),
  ('mk_cable-overhead-press', 'Deltoïde antérieur, avec le deltoïde latéral et le triceps brachial.', ARRAY['deltoïde latéral','triceps brachial']::text[]),
  ('mk_kettlebell-seated-overhead-press', 'Deltoïde antérieur, avec le deltoïde latéral et le triceps brachial, dos soutenu.', ARRAY['deltoïde latéral','triceps brachial']::text[]),
  ('mk_machine-front-military-press', 'Deltoïde antérieur, avec le triceps brachial, trajectoire guidée.', ARRAY['triceps brachial','deltoïde latéral']::text[]),
  ('mk_single-arm-dumbbell-overhead-press', 'Deltoïde antérieur, avec le triceps brachial et les abdominaux (anti-flexion latérale), un côté à la fois.', ARRAY['triceps brachial','abdominaux']::text[]),
  ('mk_behind-the-neck-press', 'Deltoïde antérieur et deltoïde latéral, avec le triceps brachial.', ARRAY['deltoïde latéral','triceps brachial']::text[]),
  ('mk_dumbbell-front-raise', 'Deltoïde antérieur, avec le grand pectoral (faisceau claviculaire).', ARRAY['grand pectoral']::text[]),
  ('mk_cable-front-raise', 'Deltoïde antérieur, avec le grand pectoral (faisceau claviculaire).', ARRAY['grand pectoral']::text[]),
  ('mk_plate-front-raise', 'Deltoïde antérieur, avec le grand pectoral (faisceau claviculaire).', ARRAY['grand pectoral']::text[]),
  ('mk_kettlebell-front-raise', 'Deltoïde antérieur, avec le grand pectoral (faisceau claviculaire).', ARRAY['grand pectoral']::text[]),
  ('mk_dumbbell-incline-front-raise', 'Deltoïde antérieur, isolation renforcée par l''appui du buste, avec le grand pectoral.', ARRAY['grand pectoral']::text[]),
  ('mk_band-lateral-raise', 'Deltoïde latéral, avec le trapèze supérieur et le sus-épineux (initiation du mouvement).', ARRAY['trapèze supérieur','sus-épineux']::text[]),
  ('mk_dumbbell-lateral-raise', 'Deltoïde latéral, avec le trapèze supérieur et le sus-épineux (initiation du mouvement).', ARRAY['trapèze supérieur','sus-épineux']::text[]),
  ('mk_machine-lateral-raise', 'Deltoïde latéral, avec le trapèze supérieur, trajectoire guidée.', ARRAY['trapèze supérieur']::text[]),
  ('mk_leaning-cable-lateral-raise', 'Deltoïde latéral, tension maintenue sur toute l''amplitude grâce à l''appui penché, avec le trapèze supérieur.', ARRAY['trapèze supérieur']::text[]),
  ('mk_band-single-arm-lateral-raise', 'Deltoïde latéral, avec le trapèze supérieur, un côté à la fois.', ARRAY['trapèze supérieur']::text[]),
  ('mk_cable-low-single-arm-lateral-raise', 'Deltoïde latéral, avec le trapèze supérieur, un côté à la fois.', ARRAY['trapèze supérieur']::text[]),
  ('mk_cable-bar-face-pull', 'Deltoïde postérieur, avec le trapèze moyen, les rhomboïdes et les rotateurs externes de l''épaule (infra-épineux, petit rond).', ARRAY['trapèze moyen','rhomboïdes','infra-épineux','petit rond']::text[]),
  ('mk_machine-face-pulls', 'Deltoïde postérieur, avec le trapèze moyen, les rhomboïdes et les rotateurs externes de l''épaule.', ARRAY['trapèze moyen','rhomboïdes','infra-épineux','petit rond']::text[]),
  ('mk_cable-rope-kneeling-face-pull', 'Deltoïde postérieur, avec le trapèze moyen, les rhomboïdes et les rotateurs externes de l''épaule.', ARRAY['trapèze moyen','rhomboïdes','infra-épineux','petit rond']::text[]),
  ('mk_cable-seated-rope-face-pull', 'Deltoïde postérieur, avec le trapèze moyen, les rhomboïdes et les rotateurs externes de l''épaule.', ARRAY['trapèze moyen','rhomboïdes','infra-épineux','petit rond']::text[]),
  ('mk_band-high-face-pull', 'Deltoïde postérieur, avec le trapèze moyen, les rhomboïdes et les rotateurs externes de l''épaule.', ARRAY['trapèze moyen','rhomboïdes','infra-épineux','petit rond']::text[]),
  ('mk_landmine-press', 'Deltoïde antérieur, avec le triceps brachial et le grand pectoral (haut).', ARRAY['triceps brachial','grand pectoral']::text[]),
  ('mk_single-arm-landmine-press', 'Deltoïde antérieur, avec le triceps brachial et les abdominaux (anti-rotation), un côté à la fois.', ARRAY['triceps brachial','abdominaux']::text[]),
  ('mk_reverse-pec-deck', 'Deltoïde postérieur, avec le trapèze moyen et les rhomboïdes, trajectoire guidée.', ARRAY['trapèze moyen','rhomboïdes']::text[]),
  ('mk_push-jerk', 'Deltoïde antérieur et triceps brachial, avec les quadriceps et les fessiers (impulsion des jambes).', ARRAY['triceps brachial','quadriceps','fessiers']::text[]),
  ('mk_dumbbell-push-press', 'Deltoïde antérieur et triceps brachial, avec les quadriceps et les fessiers (impulsion des jambes).', ARRAY['triceps brachial','quadriceps','fessiers']::text[]),
  ('mk_kettlebell-push-press', 'Deltoïde antérieur et triceps brachial, avec les quadriceps et les fessiers (impulsion des jambes).', ARRAY['triceps brachial','quadriceps','fessiers']::text[]),
  ('mk_dumbbell-rear-delt-fly', 'Deltoïde postérieur, avec le trapèze moyen et les rhomboïdes.', ARRAY['trapèze moyen','rhomboïdes']::text[]),
  ('mk_dumbbell-laying-reverse-fly', 'Deltoïde postérieur, avec le trapèze moyen et les rhomboïdes, buste appuyé.', ARRAY['trapèze moyen','rhomboïdes']::text[]),
  ('mk_dumbbell-seated-rear-delt-fly', 'Deltoïde postérieur, avec le trapèze moyen et les rhomboïdes.', ARRAY['trapèze moyen','rhomboïdes']::text[]),
  ('mk_band-external-rotation', 'Infra-épineux et petit rond (rotateurs externes), avec le deltoïde postérieur.', ARRAY['petit rond','deltoïde postérieur']::text[]),
  ('mk_cable-external-rotation', 'Infra-épineux et petit rond (rotateurs externes), avec le deltoïde postérieur.', ARRAY['petit rond','deltoïde postérieur']::text[]),
  ('mk_dumbbell-upright-row', 'Deltoïde latéral et trapèze supérieur, avec le biceps brachial.', ARRAY['trapèze supérieur','biceps brachial']::text[]),
  ('mk_barbell-upright-row', 'Deltoïde latéral et trapèze supérieur, avec le biceps brachial.', ARRAY['trapèze supérieur','biceps brachial']::text[]),
  ('mk_smith-machine-seated-overhead-press', 'Deltoïde antérieur, avec le triceps brachial, trajectoire guidée.', ARRAY['triceps brachial','deltoïde latéral']::text[]),
  ('mk_z-press', 'Deltoïde antérieur, avec le triceps brachial et les abdominaux, aucune aide du bas du corps (assis au sol jambes tendues).', ARRAY['triceps brachial','abdominaux']::text[])
) AS v(id, travaille, secondaires)
WHERE e.id = v.id;

-- ══════════════════════════════════════════════════════════════
-- Précise l'anatomie des 67 exercices "dos" : muscle_cible
-- N'EST PAS TOUCHÉ (il alimente les puces de filtre + la silhouette
-- react-body-highlighter via CIBLE_TO_LIB dans
-- components/ExerciceLibraryBrowser.tsx — "haut du dos" et "grand
-- dorsal" restent deux régions distinctes légitimes de la silhouette).
-- La précision (grand dorsal, trapèze moyen/supérieur/inférieur,
-- rhomboïdes, grand rond, dentelé antérieur, biceps brachial,
-- érecteurs du rachis...) va dans muscle_travaille (texte affiché
-- dans la fiche exercice) et muscles_secondaires (tableau).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue AS e SET
  muscle_travaille = v.travaille,
  muscles_secondaires = v.secondaires
FROM (VALUES
  ('mk_single-leg-back-extension', 'Érecteurs du rachis, avec les fessiers et les ischio-jambiers (dominante côté hanche chargée).', ARRAY['fessiers','ischio-jambiers']::text[]),
  ('mk_back-extension', 'Érecteurs du rachis, fessiers et ischio-jambiers.', ARRAY['fessiers','ischio-jambiers']::text[]),
  ('mk_dumbbell-back-extension', 'Érecteurs du rachis, fessiers et ischio-jambiers, charge additionnelle à la poitrine.', ARRAY['fessiers','ischio-jambiers']::text[]),
  ('mk_kettlebell-gorilla-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial, un côté à la fois.', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_hammer-strength-iso-lateral-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial et les rhomboïdes.', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_cable-30-degree-shrug', 'Trapèze supérieur.', ARRAY['trapèze moyen']::text[]),
  ('mk_barbell-behind-the-back-30-degree-shrug', 'Trapèze inférieur et moyen, avec le deltoïde postérieur.', ARRAY['deltoïde postérieur','trapèze moyen']::text[]),
  ('mk_band-shrug', 'Trapèze supérieur.', ARRAY[]::text[]),
  ('mk_dumbbell-shrug', 'Trapèze supérieur.', ARRAY[]::text[]),
  ('mk_dumbbell-seated-shrug', 'Trapèze supérieur.', ARRAY[]::text[]),
  ('mk_barbell-shrug', 'Trapèze supérieur.', ARRAY[]::text[]),
  ('mk_trap-bar-shrug', 'Trapèze supérieur.', ARRAY[]::text[]),
  ('mk_kettlebell-shrug', 'Trapèze supérieur.', ARRAY[]::text[]),
  ('mk_machine-lat-pullover', 'Grand dorsal, avec le grand rond et le dentelé antérieur.', ARRAY['grand rond','dentelé antérieur']::text[]),
  ('mk_meadows-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial, un côté à la fois.', ARRAY['biceps brachial','trapèze moyen']::text[]),
  ('mk_neck-extension', 'Extenseurs profonds du cou (splénius, semi-épineux), avec le trapèze supérieur.', ARRAY['trapèze supérieur']::text[]),
  ('mk_pendlay-row', 'Grand dorsal et trapèze moyen, avec les rhomboïdes et le biceps brachial, traction explosive depuis le sol.', ARRAY['trapèze moyen','rhomboïdes','biceps brachial']::text[]),
  ('mk_band-pullover', 'Grand dorsal, avec le grand pectoral et le dentelé antérieur.', ARRAY['grand pectoral','dentelé antérieur']::text[]),
  ('mk_barbell-pullover', 'Grand dorsal et grand pectoral, avec le dentelé antérieur et le triceps brachial (bras tendus).', ARRAY['grand pectoral','dentelé antérieur','triceps brachial']::text[]),
  ('mk_cable-rope-pullover', 'Grand dorsal, avec le grand pectoral et le dentelé antérieur.', ARRAY['grand pectoral','dentelé antérieur']::text[]),
  ('mk_barbell-rack-pull', 'Trapèzes et érecteurs du rachis, avec les fessiers, les ischio-jambiers et le grand dorsal (maintien isométrique).', ARRAY['érecteurs du rachis','fessiers','ischio-jambiers','grand dorsal']::text[]),
  ('mk_band-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial.', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_chest-supported-dumbbell-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial et les rhomboïdes, sans sollicitation du bas du dos (buste calé).', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_underhand-barbell-row', 'Grand dorsal (partie basse) et biceps brachial, avec le trapèze moyen.', ARRAY['biceps brachial','trapèze moyen']::text[]),
  ('mk_cable-supinating-row', 'Grand dorsal et biceps brachial, avec le trapèze moyen.', ARRAY['biceps brachial','trapèze moyen']::text[]),
  ('mk_machine-seated-cable-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial et les rhomboïdes.', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_wide-grip-seated-cable-row', 'Trapèze moyen, rhomboïdes et deltoïde postérieur, avec le grand dorsal.', ARRAY['grand dorsal','deltoïde postérieur']::text[]),
  ('mk_kettlebell-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial.', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_kettlebell-row-single', 'Grand dorsal et trapèze moyen, avec le biceps brachial, un côté à la fois.', ARRAY['biceps brachial','trapèze moyen']::text[]),
  ('mk_dumbbell-row-bilateral', 'Grand dorsal et trapèze moyen, avec le biceps brachial et les rhomboïdes.', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_barbell-bent-over-row', 'Grand dorsal et trapèze moyen, avec les rhomboïdes et le biceps brachial.', ARRAY['trapèze moyen','rhomboïdes','biceps brachial']::text[]),
  ('mk_barbell-bent-over-row-overhand', 'Grand dorsal, trapèze moyen et rhomboïdes, biceps brachial moins sollicité qu''en prise supination.', ARRAY['trapèze moyen','rhomboïdes','biceps brachial']::text[]),
  ('mk_cable-row-bar-standing-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial.', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_hammer-strength-high-row', 'Trapèze moyen et rhomboïdes, avec le grand dorsal.', ARRAY['grand dorsal','biceps brachial']::text[]),
  ('mk_machine-neutral-row', 'Grand dorsal et trapèze moyen, avec le brachial et les rhomboïdes.', ARRAY['brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_machine-plate-loaded-t-bar-row', 'Grand dorsal et trapèze moyen, avec les rhomboïdes et le biceps brachial.', ARRAY['trapèze moyen','rhomboïdes','biceps brachial']::text[]),
  ('mk_landmine-t-bar-rows', 'Grand dorsal et trapèze moyen, avec les rhomboïdes et le biceps brachial.', ARRAY['trapèze moyen','rhomboïdes','biceps brachial']::text[]),
  ('mk_chest-supported-t-bar-row', 'Grand dorsal et trapèze moyen, avec les rhomboïdes et le biceps brachial, sans sollicitation du bas du dos.', ARRAY['trapèze moyen','rhomboïdes','biceps brachial']::text[]),
  ('mk_dumbbell-row-unilateral', 'Grand dorsal et trapèze moyen, avec le biceps brachial, un côté à la fois.', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_dumbbell-single-arm-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial, un côté à la fois.', ARRAY['biceps brachial','trapèze moyen','rhomboïdes']::text[]),
  ('mk_cable-single-arm-neutral-grip-row', 'Grand dorsal et brachial, avec le trapèze moyen, un côté à la fois.', ARRAY['brachial','trapèze moyen']::text[]),
  ('mk_cable-single-arm-underhand-grip-row', 'Grand dorsal et biceps brachial, avec le trapèze moyen, un côté à la fois.', ARRAY['biceps brachial','trapèze moyen']::text[]),
  ('mk_kettlebell-single-arm-row', 'Grand dorsal et trapèze moyen, avec le biceps brachial, un côté à la fois.', ARRAY['biceps brachial','trapèze moyen']::text[]),
  ('mk_seal-row', 'Grand dorsal et trapèze moyen, avec les rhomboïdes et le biceps brachial, sans triche possible (buste totalement calé).', ARRAY['trapèze moyen','rhomboïdes','biceps brachial']::text[]),
  ('mk_smith-machine-standing-shrugs', 'Trapèze supérieur.', ARRAY[]::text[]),
  ('mk_smith-machine-bent-over-row', 'Grand dorsal et trapèze moyen, avec les rhomboïdes et le biceps brachial.', ARRAY['trapèze moyen','rhomboïdes','biceps brachial']::text[]),
  ('mk_barbell-deadlift', 'Érecteurs du rachis, fessiers et ischio-jambiers, avec les trapèzes et le grand dorsal (maintien isométrique) et les avant-bras (préhension).', ARRAY['fessiers','ischio-jambiers','trapèzes','grand dorsal','avant-bras']::text[]),
  ('mk_snatch-grip-high-pull', 'Trapèzes, avec les fessiers, les ischio-jambiers et le grand dorsal, extension explosive de la hanche.', ARRAY['fessiers','ischio-jambiers','grand dorsal']::text[]),
  ('mk_snatch-pull', 'Trapèzes, fessiers et ischio-jambiers, avec le grand dorsal, extension explosive de la hanche.', ARRAY['fessiers','ischio-jambiers','grand dorsal']::text[]),
  ('mk_lat-pulldown', 'Grand dorsal, avec le biceps brachial et le grand rond.', ARRAY['biceps brachial','grand rond']::text[]),
  ('mk_band-kneeling-pulldown', 'Grand dorsal, avec le biceps brachial.', ARRAY['biceps brachial']::text[]),
  ('mk_band-seated-pulldown', 'Grand dorsal, avec le biceps brachial.', ARRAY['biceps brachial']::text[]),
  ('mk_machine-pulldown', 'Grand dorsal, avec le biceps brachial et le grand rond.', ARRAY['biceps brachial','grand rond']::text[]),
  ('mk_single-arm-lat-pulldown', 'Grand dorsal, un côté à la fois, avec le biceps brachial.', ARRAY['biceps brachial']::text[]),
  ('mk_straight-arm-lat-pulldown', 'Grand dorsal, avec le dentelé antérieur, sans travail du biceps (bras tendus).', ARRAY['dentelé antérieur']::text[]),
  ('mk_wide-grip-lat-pulldown', 'Grand dorsal (largeur), avec le grand rond, biceps brachial moins sollicité qu''en prise resserrée.', ARRAY['grand rond','biceps brachial']::text[]),
  ('mk_neutral-grip-lat-pulldown', 'Grand dorsal, avec le brachial et le grand rond.', ARRAY['brachial','grand rond']::text[]),
  ('mk_narrow-pulldown', 'Grand dorsal (partie basse), avec le biceps brachial, davantage sollicité qu''en prise large.', ARRAY['biceps brachial']::text[]),
  ('mk_band-assisted-pull-up', 'Grand dorsal, avec le biceps brachial et le grand rond, assistance élastique réduisant la charge.', ARRAY['biceps brachial','grand rond']::text[]),
  ('mk_machine-assisted-pull-up', 'Grand dorsal, avec le biceps brachial et le grand rond, assistance réduisant la charge.', ARRAY['biceps brachial','grand rond']::text[]),
  ('mk_inverted-row', 'Grand dorsal et trapèze moyen, avec les rhomboïdes et le biceps brachial.', ARRAY['trapèze moyen','rhomboïdes','biceps brachial']::text[]),
  ('mk_weighted-pull-ups', 'Grand dorsal, avec le biceps brachial et le grand rond, charge additionnelle.', ARRAY['biceps brachial','grand rond']::text[]),
  ('mk_wide-grip-pull-up', 'Grand dorsal (largeur), avec le grand rond, biceps brachial moins sollicité qu''en prise resserrée.', ARRAY['grand rond','biceps brachial']::text[]),
  ('mk_neutral-grip-pull-up', 'Grand dorsal, avec le brachial et le grand rond.', ARRAY['brachial','grand rond']::text[]),
  ('mk_pull-ups', 'Grand dorsal, avec le biceps brachial, le grand rond et le trapèze moyen.', ARRAY['biceps brachial','grand rond','trapèze moyen']::text[]),
  ('mk_chin-ups', 'Grand dorsal et biceps brachial, avec le grand rond.', ARRAY['biceps brachial','grand rond']::text[]),
  ('mk_yates-row', 'Grand dorsal (partie basse) et biceps brachial, avec le trapèze moyen.', ARRAY['biceps brachial','trapèze moyen']::text[])
) AS v(id, travaille, secondaires)
WHERE e.id = v.id;

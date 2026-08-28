-- ══════════════════════════════════════════════════════════════
-- Annule la segmentation "haut des pecs" / "bas des pecs" sur
-- muscle_cible : ce champ alimente les puces de filtre ET la
-- silhouette corporelle (react-body-highlighter, voir
-- components/ExerciceLibraryBrowser.tsx > CIBLE_TO_LIB) — un
-- mapping fixe de ~19 valeurs qui ne connaît qu'une seule région
-- "chest". Segmenter ce champ cassait donc l'affichage sur le
-- buste. muscle_cible redevient "pectoraux" pour tous ces exercices.
--
-- La précision anatomique demandée (grand pectoral, deltoïde
-- antérieur, dentelé antérieur, petit pectoral...) va à la place
-- dans muscle_travaille (texte affiché en clair dans la fiche
-- exercice, "💪 Muscle travaillé") et muscles_secondaires (tableau
-- structuré). Portion ciblée (claviculaire/haut vs sternal/bas)
-- précisée entre parenthèses dans le texte plutôt que dans une
-- catégorie de filtre séparée.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue AS e SET
  muscle_cible = 'pectoraux',
  muscle_travaille = v.travaille,
  muscles_secondaires = v.secondaires
FROM (VALUES
  ('mk_floor-press', 'Grand pectoral, deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_barbell-floor-press', 'Grand pectoral, deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_dumbbell-bench-press', 'Grand pectoral, deltoïde antérieur, triceps brachial et dentelé antérieur (stabilisation de l''omoplate).', ARRAY['deltoïde antérieur','triceps brachial','dentelé antérieur']::text[]),
  ('mk_neutral-grip-dumbbell-bench-press', 'Grand pectoral, deltoïde antérieur, triceps brachial et dentelé antérieur.', ARRAY['deltoïde antérieur','triceps brachial','dentelé antérieur']::text[]),
  ('mk_barbell-bench-press', 'Grand pectoral, deltoïde antérieur, triceps brachial et dentelé antérieur.', ARRAY['deltoïde antérieur','triceps brachial','dentelé antérieur']::text[]),
  ('mk_reverse-grip-barbell-bench-press', 'Grand pectoral (faisceau claviculaire davantage sollicité), deltoïde antérieur, triceps brachial et biceps brachial (rôle stabilisateur lié à la prise en supination).', ARRAY['deltoïde antérieur','triceps brachial','biceps brachial']::text[]),
  ('mk_wide-grip-barbell-bench-press', 'Grand pectoral (accent sur l''amplitude), deltoïde antérieur et triceps brachial, moins sollicité qu''en prise resserrée.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_machine-chest-press', 'Grand pectoral, deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_cable-chest-press', 'Grand pectoral, deltoïde antérieur, triceps brachial et gainage pour la stabilité debout.', ARRAY['deltoïde antérieur','triceps brachial','abdominaux']::text[]),
  ('mk_cable-bench-press', 'Grand pectoral, deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_kettlebell-bench-press', 'Grand pectoral, deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_decline-barbell-bench-press', 'Grand pectoral (faisceau sternal, bas des pecs), deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_decline-machine-chest-press', 'Grand pectoral (faisceau sternal, bas des pecs), deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_incline-machine-chest-press', 'Grand pectoral (faisceau claviculaire, haut des pecs), deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_dumbbell-single-arm-chest-press', 'Grand pectoral, deltoïde antérieur, triceps brachial et abdominaux (anti-rotation en unilatéral).', ARRAY['deltoïde antérieur','triceps brachial','abdominaux']::text[]),
  ('mk_cable-standing-single-arm-chest-press', 'Grand pectoral, deltoïde antérieur, triceps brachial et abdominaux (anti-rotation).', ARRAY['deltoïde antérieur','triceps brachial','abdominaux']::text[]),
  ('mk_dumbbell-decline-bench-press', 'Grand pectoral (faisceau sternal, bas des pecs), deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_cable-decline-bench-press', 'Grand pectoral (faisceau sternal, bas des pecs), deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_dumbbell-incline-bench-press', 'Grand pectoral (faisceau claviculaire, haut des pecs), deltoïde antérieur, triceps brachial et dentelé antérieur.', ARRAY['deltoïde antérieur','triceps brachial','dentelé antérieur']::text[]),
  ('mk_barbell-incline-bench-press', 'Grand pectoral (faisceau claviculaire, haut des pecs), deltoïde antérieur, triceps brachial et dentelé antérieur.', ARRAY['deltoïde antérieur','triceps brachial','dentelé antérieur']::text[]),
  ('mk_cable-incline-bench-press', 'Grand pectoral (faisceau claviculaire, haut des pecs), deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_kettlebell-incline-bench-press', 'Grand pectoral (faisceau claviculaire, haut des pecs), deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_barbell-high-incline-bench-press', 'Grand pectoral (faisceau claviculaire) et surtout deltoïde antérieur, très sollicité à cette inclinaison prononcée, avec le triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial','dentelé antérieur']::text[]),
  ('mk_parralel-bar-dips', 'Grand pectoral (faisceau sternal, bas des pecs) buste penché en avant, petit pectoral, triceps brachial et deltoïde antérieur.', ARRAY['triceps brachial','deltoïde antérieur','petit pectoral']::text[]),
  ('mk_machine-dips', 'Grand pectoral (faisceau sternal), petit pectoral, triceps brachial et deltoïde antérieur.', ARRAY['triceps brachial','deltoïde antérieur','petit pectoral']::text[]),
  ('mk_machine-pec-fly', 'Grand pectoral et deltoïde antérieur — adduction horizontale, coudes fixes, sans travail du triceps.', ARRAY['deltoïde antérieur']::text[]),
  ('mk_cable-pec-fly', 'Grand pectoral et deltoïde antérieur.', ARRAY['deltoïde antérieur']::text[]),
  ('mk_cable-low-to-high-fly', 'Grand pectoral (faisceau claviculaire, haut des pecs) et deltoïde antérieur.', ARRAY['deltoïde antérieur']::text[]),
  ('mk_cable-high-to-low-fly', 'Grand pectoral (faisceau sternal, bas des pecs) et deltoïde antérieur.', ARRAY['deltoïde antérieur']::text[]),
  ('mk_dumbbell-chest-fly', 'Grand pectoral et deltoïde antérieur.', ARRAY['deltoïde antérieur']::text[]),
  ('mk_cable-bench-chest-fly', 'Grand pectoral et deltoïde antérieur.', ARRAY['deltoïde antérieur']::text[]),
  ('mk_dumbbell-decline-chest-fly', 'Grand pectoral (faisceau sternal, bas des pecs) et deltoïde antérieur.', ARRAY['deltoïde antérieur']::text[]),
  ('mk_dumbbell-incline-chest-fly', 'Grand pectoral (faisceau claviculaire, haut des pecs) et deltoïde antérieur.', ARRAY['deltoïde antérieur']::text[]),
  ('mk_single-arm-cable-fly', 'Grand pectoral, deltoïde antérieur et abdominaux (anti-rotation en unilatéral).', ARRAY['deltoïde antérieur','abdominaux']::text[]),
  ('mk_push-up', 'Grand pectoral, deltoïde antérieur, triceps brachial et dentelé antérieur, très sollicité pour stabiliser l''omoplate.', ARRAY['deltoïde antérieur','triceps brachial','dentelé antérieur']::text[]),
  ('mk_decline-push-up', 'Grand pectoral (davantage le faisceau claviculaire à cette inclinaison), deltoïde antérieur, triceps brachial et dentelé antérieur.', ARRAY['deltoïde antérieur','triceps brachial','dentelé antérieur']::text[]),
  ('mk_incline-push-up', 'Grand pectoral, deltoïde antérieur et triceps brachial — version allégée, moins exigeante que la pompe classique.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_bodyweight-knee-push-ups', 'Grand pectoral, deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_bodyweight-elevated-push-up', 'Grand pectoral, deltoïde antérieur et triceps brachial — version allégée, mains surélevées.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_smith-machine-bench-press', 'Grand pectoral, deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[]),
  ('mk_smith-machine-incline-bench-press', 'Grand pectoral (faisceau claviculaire, haut des pecs), deltoïde antérieur et triceps brachial.', ARRAY['deltoïde antérieur','triceps brachial']::text[])
) AS v(id, travaille, secondaires)
WHERE e.id = v.id;

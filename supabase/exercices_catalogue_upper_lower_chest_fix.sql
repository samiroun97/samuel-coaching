-- ══════════════════════════════════════════════════════════════
-- Corrige le muscle ciblé des développés/écartés inclinés et
-- déclinés : ils étaient tous génériquement tagués "pectoraux",
-- rendant impossible de cibler spécifiquement le haut ou le bas
-- des pecs dans un programme.
--
-- Convention (cohérente avec "haut du dos" déjà utilisé ailleurs) :
-- - incliné / poulie bas→haut  → haut des pecs (faisceau claviculaire)
-- - décliné / poulie haut→bas  → bas des pecs (faisceau sternal)
--
-- Les pompes inclinées/déclinées ne sont PAS touchées ici : la
-- littérature fitness est contradictoire sur le sens de leur effet
-- (mains vs pieds surélevés), donc on les laisse en "pectoraux"
-- plutôt que d'affirmer quelque chose d'incertain.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET muscle_cible = 'haut des pecs' WHERE id IN (
  'mk_incline-machine-chest-press',
  'mk_dumbbell-incline-bench-press',
  'mk_barbell-incline-bench-press',
  'mk_cable-incline-bench-press',
  'mk_kettlebell-incline-bench-press',
  'mk_barbell-high-incline-bench-press',
  'mk_dumbbell-incline-chest-fly',
  'mk_smith-machine-incline-bench-press',
  'mk_cable-low-to-high-fly'
);

UPDATE public.exercices_catalogue SET muscle_cible = 'bas des pecs' WHERE id IN (
  'mk_decline-machine-chest-press',
  'mk_dumbbell-decline-bench-press',
  'mk_decline-barbell-bench-press',
  'mk_cable-decline-bench-press',
  'mk_dumbbell-decline-chest-fly',
  'mk_cable-high-to-low-fly'
);

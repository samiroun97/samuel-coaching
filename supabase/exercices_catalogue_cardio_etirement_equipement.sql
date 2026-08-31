-- ══════════════════════════════════════════════════════════════
-- Sort les exercices cardio/étirement classés equipement = "poids du corps"
-- de la puce équipement "poids du corps" : ils restent trouvables via la
-- puce dédiée Cardio/Étirement (basée sur muscle_cible), mais ne doivent
-- plus apparaître quand on filtre par équipement "poids du corps" —
-- même traitement déjà appliqué à corde ondulatoire/traîneau/vélo.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET equipement = 'cardio'
WHERE equipement = 'poids du corps' AND id IN (
  'mk_jump-rope', 'mk_running-intervals', 'mk_running-cooldown', 'mk_cycling-warmup',
  'mk_jumping-jack', 'mk_swim-kick-drill', 'mk_breaststroke-swim', 'mk_freestyle-swim',
  'mk_backstroke-swim', 'mk_swim-pull-drill', 'mk_butterfly-swim', 'mk_swim-sprint-intervals',
  'mk_hiking', 'mk_shadow-boxing', 'mk_trail-run'
);

UPDATE public.exercices_catalogue SET equipement = 'étirement'
WHERE equipement = 'poids du corps' AND id IN (
  'mk_abdominals-stretch-variation-one', 'mk_abdominals-stretch-variation-two',
  'mk_abdominals-stretch-variation-three', 'mk_cycling-cooldown'
);

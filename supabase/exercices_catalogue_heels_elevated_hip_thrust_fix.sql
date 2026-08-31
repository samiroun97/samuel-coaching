-- ══════════════════════════════════════════════════════════════
-- Précise la fiche "talons surélevés hip thrust à l'haltère"
-- (mk_dumbbell-heels-elevated-hip-thrust) : muscle travaillé
-- (grand fessier moteur principal, ischio-jambiers en secondaire),
-- utilite expliquant le mécanisme (flexion du genou accrue en bas,
-- ischio-jambiers moins impliqués), a_noter enrichi (pause en haut,
-- poussée depuis les hanches et non une extension lombaire).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Grand fessier en moteur principal, ischio-jambiers en secondaire.',
  muscles_secondaires = ARRAY['ischio-jambiers']::text[],
  utilite = 'Surélever les talons augmente la flexion du genou en position basse, ce qui réduit l''implication des ischio-jambiers et concentre davantage le travail sur le fessier par rapport à un hip thrust classique.',
  a_noter = 'Contraction franche en haut avec une pause d''une seconde pour maximiser le recrutement du fessier, ne pas cambrer excessivement le bas du dos, la poussée doit venir des hanches et non d''une extension lombaire.'
WHERE id = 'mk_dumbbell-heels-elevated-hip-thrust';

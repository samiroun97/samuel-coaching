-- ══════════════════════════════════════════════════════════════
-- Corrige les fiches Jefferson Curl :
-- 1) "Colonne vertébrale" n'est pas un muscle (c'est la structure
--    osseuse/articulaire) — remplacé par "Érecteurs du rachis",
--    le muscle réellement travaillé en contrôle excentrique.
--    Bug partagé identique sur les 4 variantes (bodyweight,
--    barre, haltère, kettlebell).
-- 2) Variante bodyweight : utilite et a_noter enrichis (flexion
--    segmentaire, hernie discale, mise en garde sur la charge
--    additionnelle sans maîtrise technique).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Érecteurs du rachis en contrôle excentrique tout au long du mouvement, ischio-jambiers en étirement.',
  utilite = 'Exercice de mobilité classique en gymnastique pour les dos raides, développe aussi le contrôle en flexion segmentaire de la colonne.',
  a_noter = 'Mouvement lent et contrôlé, à éviter en cas de douleur lombaire active ou de hernie discale. Ne jamais charger ce mouvement (avec poids additionnel) sans une maîtrise technique solide, le risque sur les disques intervertébraux augmente vite avec la charge.'
WHERE id = 'mk_bodyweight-spinal-jefferson-curl';

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Érecteurs du rachis en contrôle excentrique, ischio-jambiers en étirement.'
WHERE id IN (
  'mk_barbell-spinal-jefferson-curl',
  'mk_dumbbell-spinal-jefferson-curl',
  'mk_kettlebell-spinal-jefferson-curl'
);

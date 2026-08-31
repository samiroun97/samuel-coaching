-- ══════════════════════════════════════════════════════════════
-- Supprime les tirets cadratins (—) des fiches exercices,
-- reformulés en ponctuation standard pour garder des phrases
-- correctes.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Grand pectoral, deltoïde antérieur et triceps brachial, version allégée, mains surélevées.'
WHERE id = 'mk_bodyweight-elevated-push-up';

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Grand pectoral, deltoïde antérieur et triceps brachial, version allégée, moins exigeante que la pompe classique.'
WHERE id = 'mk_incline-push-up';

UPDATE public.exercices_catalogue SET
  a_noter = 'Plus le corps est horizontal, plus l''exercice est difficile. Ajuster l''angle selon le niveau.'
WHERE id = 'mk_inverted-row';

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Grand pectoral et deltoïde antérieur, adduction horizontale, coudes fixes, sans travail du triceps.'
WHERE id = 'mk_machine-pec-fly';

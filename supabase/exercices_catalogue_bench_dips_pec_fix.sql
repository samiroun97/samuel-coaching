-- ══════════════════════════════════════════════════════════════
-- Corrige mk_bench-dips : le grand pectoral n'intervient que
-- marginalement (stabilisation), ce n'est pas un exercice de pec.
-- Le lister au même niveau que triceps/deltoïde antérieur induisait
-- l'utilisateur en erreur sur l'objectif de l'exercice.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Triceps brachial, avec le deltoïde antérieur en soutien.',
  muscles_secondaires = ARRAY['deltoïde antérieur']::text[]
WHERE id = 'mk_bench-dips';

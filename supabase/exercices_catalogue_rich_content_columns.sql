-- ══════════════════════════════════════════════════════════════
-- Ajoute les colonnes de fiche détaillée structurée (muscle travaillé,
-- exécution, utilité, à noter, tags) pour la passe de contenu exercice
-- par exercice. `description` reste utilisée en repli pour les
-- exercices pas encore enrichis.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.exercices_catalogue
  ADD COLUMN IF NOT EXISTS muscle_travaille text,
  ADD COLUMN IF NOT EXISTS execution text,
  ADD COLUMN IF NOT EXISTS utilite text,
  ADD COLUMN IF NOT EXISTS a_noter text,
  ADD COLUMN IF NOT EXISTS tags text[];

UPDATE public.exercices_catalogue
SET description = NULL,
    muscle_travaille = 'Grand droit de l''abdomen, avec les obliques et les fléchisseurs de hanche en secondaire. Mobilise aussi la colonne en extension.',
    execution = 'Bassin posé sur le ballon, dos qui part en extension dessus, pieds au sol un peu plus larges que les hanches. Bras au-dessus de la tête ou croisés sur le torse. On laisse le poids du corps faire le travail, pas de poussée active. Respiration ample en position basse.',
    utilite = 'Détend les abdos après une séance de gainage ou de flexions répétées, redonne de l''amplitude à la colonne.',
    a_noter = 'Extension lombaire sous charge du corps, à éviter en cas de lombalgie ou hernie discale. Si ça compresse plutôt que d''étirer, réduire l''amplitude.',
    tags = ARRAY['étirement', 'mobilité', 'swiss ball', 'post-séance']
WHERE id = 'mk_abdominals-stretch-variation-four';

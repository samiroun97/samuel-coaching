-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi, exercice par exercice (nom + description
-- détaillée fournie par l'utilisateur, fusionnée en un paragraphe
-- puisque description est un champ texte simple sans mise en forme).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Étirement abdominaux, variante sur swiss ball
UPDATE public.exercices_catalogue
SET nom = 'étirement abdominaux, variante sur swiss ball',
    muscles_secondaires = ARRAY['obliques', 'fléchisseurs de hanche'],
    description = 'Étire le grand droit de l''abdomen, avec les obliques et les fléchisseurs de hanche en secondaire, en mobilisant aussi la colonne en extension. Bassin posé sur le ballon, dos qui part en extension dessus, pieds au sol un peu plus larges que les hanches, bras au-dessus de la tête ou croisés sur le torse : on laisse le poids du corps faire le travail, sans poussée active, avec une respiration ample en position basse. Utile pour détendre les abdos après une séance de gainage ou de flexions répétées, et redonner de l''amplitude à la colonne. Attention : extension lombaire sous charge du corps, à éviter en cas de lombalgie ou hernie discale — si ça compresse plutôt que d''étirer, réduire l''amplitude.'
WHERE id = 'mk_abdominals-stretch-variation-four';

-- ══════════════════════════════════════════════════════════════
-- Condense le texte descriptif de l'étirement abdominaux au swiss ball :
-- les 4 sections empilées forçaient un long scroll dans la fiche.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue
SET muscle_travaille = 'Grand droit de l''abdomen, avec obliques et fléchisseurs de hanche en secondaire.',
    execution = 'Bassin sur le ballon, dos en extension, pieds un peu plus larges que les hanches, bras au-dessus de la tête. Le poids du corps fait le travail, sans forcer.',
    utilite = 'Détend les abdos après gainage ou flexions répétées, redonne de l''amplitude à la colonne.',
    a_noter = 'À éviter en cas de lombalgie ou hernie discale. Réduire l''amplitude si ça compresse plutôt que d''étirer.'
WHERE id = 'mk_abdominals-stretch-variation-four';

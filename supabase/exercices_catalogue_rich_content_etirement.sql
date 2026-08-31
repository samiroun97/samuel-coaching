-- ══════════════════════════════════════════════════════════════
-- Passe de contenu enrichi : catégorie étirement complète (4/4).
-- Noms harmonisés sur le style "étirement abdominaux, [descripteur]"
-- établi avec la variante swiss ball. Vérifié contre la description
-- MoveKit d'origine (mouvement déjà décrit avec précision) plutôt que
-- la vidéo — voir note dans la conversation sur l'absence d'outil
-- d'extraction de frame vidéo.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue
SET nom = 'étirement abdominaux, extension cobra au sol',
    description = NULL,
    muscle_travaille = 'Grand droit de l''abdomen, avec les fléchisseurs de hanche en secondaire.',
    execution = 'Allongé sur le ventre, appui sur les avant-bras puis montée vers une extension façon cobra, poitrine qui s''ouvre. Bassin proche du sol, respiration ample en haut du mouvement.',
    utilite = 'Détend les abdos après du gainage ou des crunchs répétés, redonne de l''amplitude à la colonne.',
    a_noter = 'À éviter en cas de lombalgie ou hernie discale. Rester sur les avant-bras si l''extension est inconfortable.',
    tags = ARRAY['étirement', 'mobilité', 'au sol', 'post-séance']
WHERE id = 'mk_abdominals-stretch-variation-one';

UPDATE public.exercices_catalogue
SET nom = 'étirement abdominaux, extension debout bras levés',
    description = NULL,
    muscle_travaille = 'Grand droit de l''abdomen, avec les intercostaux en secondaire.',
    execution = 'Debout, les deux bras montent tendus au-dessus de la tête en cambrant légèrement pour ouvrir l''avant du tronc. Respiration ample en position haute.',
    utilite = 'Étirement rapide et debout pour décompresser l''avant du corps entre deux exercices ou en fin de séance.',
    a_noter = 'Garder l''extension légère en cas de gêne lombaire, pas une cambrure forcée.',
    tags = ARRAY['étirement', 'mobilité', 'debout', 'post-séance']
WHERE id = 'mk_abdominals-stretch-variation-two';

UPDATE public.exercices_catalogue
SET nom = 'étirement abdominaux, flexion latérale debout',
    description = NULL,
    muscle_travaille = 'Obliques, avec le grand dorsal et le carré des lombes en secondaire.',
    execution = 'Debout, un bras tendu au-dessus de la tête, on incline le buste du côté opposé pour étirer la ligne du tronc. Quelques secondes puis on change de côté.',
    utilite = 'Étire les obliques après du gainage latéral ou des rotations du tronc, utile aussi en échauffement.',
    a_noter = 'Incliner depuis la taille, pas depuis les hanches, pour bien cibler les obliques.',
    tags = ARRAY['étirement', 'mobilité', 'debout', 'post-séance']
WHERE id = 'mk_abdominals-stretch-variation-three';

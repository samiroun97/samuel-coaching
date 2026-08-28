-- ══════════════════════════════════════════════════════════════
-- Remplace "bas du dos" (région, pas un muscle) par "érecteurs du
-- rachis" (le vrai nom du muscle) dans muscle_travaille, partout où
-- ça apparaît dans le catalogue.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET muscle_travaille = 'Ischio-jambiers, fessiers et érecteurs du rachis.'
WHERE id = 'mk_bodyweight-deadlift';

UPDATE public.exercices_catalogue SET muscle_travaille = 'Grand dorsal et trapèze moyen, avec le biceps brachial et les rhomboïdes, sans sollicitation des érecteurs du rachis (buste calé).'
WHERE id = 'mk_chest-supported-dumbbell-row';

UPDATE public.exercices_catalogue SET muscle_travaille = 'Grand dorsal et trapèze moyen, avec les rhomboïdes et le biceps brachial, sans sollicitation des érecteurs du rachis.'
WHERE id = 'mk_chest-supported-t-bar-row';

UPDATE public.exercices_catalogue SET muscle_travaille = 'Ischio-jambiers, fessiers et érecteurs du rachis.'
WHERE id = 'mk_dumbbell-deadlift';

UPDATE public.exercices_catalogue SET muscle_travaille = 'Érecteurs du rachis, fessiers et chaîne postérieure.'
WHERE id = 'mk_dumbbell-superman';

UPDATE public.exercices_catalogue SET muscle_travaille = 'Ischio-jambiers, fessiers et érecteurs du rachis.'
WHERE id = 'mk_good-mornings';

UPDATE public.exercices_catalogue SET muscle_travaille = 'Ischio-jambiers, fessiers et érecteurs du rachis.'
WHERE id = 'mk_kettlebell-romanian-deadlift';

UPDATE public.exercices_catalogue SET muscle_travaille = 'Fessiers, quadriceps et érecteurs du rachis.'
WHERE id = 'mk_kettlebell-sumo-deadlift';

UPDATE public.exercices_catalogue SET muscle_travaille = 'Fessiers et ischio-jambiers en moteur principal, érecteurs du rachis en secondaire.'
WHERE id = 'mk_reverse-hyperextension';

UPDATE public.exercices_catalogue SET muscle_travaille = 'Érecteurs du rachis, fessiers et chaîne postérieure.'
WHERE id = 'mk_supermans';

-- Bug repéré au passage : muscle_cible = "abdominaux" ne correspondait pas au contenu
-- (bas du dos/érecteurs du rachis) sur ces deux exercices. "grand dorsal" est déjà la
-- catégorie utilisée pour les autres exercices de bas du dos (back extension...) et
-- correspond à la zone "lower-back" de l'écorché (voir CIBLE_TO_LIB).
UPDATE public.exercices_catalogue SET muscle_cible = 'grand dorsal' WHERE id IN ('mk_dumbbell-superman', 'mk_supermans');

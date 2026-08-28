-- ══════════════════════════════════════════════════════════════
-- Remplace la terminologie "préhension" par "grip" dans les fiches
-- exercices (muscle_travaille, utilite, tags).
-- Accord grammatical : "grip" est masculin en usage fitness FR
-- ("le grip", pas "la grip") — les articles/adjectifs associés
-- sont ajustés en conséquence.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Érecteurs du rachis, fessiers et ischio-jambiers, avec les trapèzes et le grand dorsal (maintien isométrique) et les avant-bras (grip).'
WHERE id = 'mk_barbell-deadlift';

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Grip, trapèzes et gainage.',
  tags = ARRAY['grip', 'gainage', 'kettlebell']
WHERE id = 'mk_kettlebell-farmers-carry';

UPDATE public.exercices_catalogue SET
  utilite = 'La charge décentrée ajoute un travail de grip au curl classique.'
WHERE id = 'mk_kettlebell-curl';

UPDATE public.exercices_catalogue SET
  utilite = 'Finition classique pour la force de grip et le volume de l''avant-bras.'
WHERE id = 'mk_barbell-wrist-curl';

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Grip, fléchisseurs de l''avant-bras.',
  utilite = 'Charge le grip et décompresse le haut du corps.',
  tags = ARRAY['grip', 'isométrie', 'poids du corps']
WHERE id = 'mk_dead-hang';

UPDATE public.exercices_catalogue SET
  utilite = 'Isole la flexion du poignet et renforce le grip.'
WHERE id = 'mk_cable-wrist-curl';

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Grip (pince pouce-doigts).',
  utilite = 'Renforce la force de pince, utile pour le grip global.',
  tags = ARRAY['grip', 'isométrie', 'machine']
WHERE id = 'mk_plate-pinch';

UPDATE public.exercices_catalogue SET
  utilite = 'Développe la puissance des hanches et l''endurance de grip.'
WHERE id = 'mk_sled-pull';

UPDATE public.exercices_catalogue SET
  utilite = 'Renforce le grip et l''avant-bras en résistance progressive.',
  tags = ARRAY['avant-bras', 'grip', 'machine']
WHERE id = 'mk_wrist-roller';

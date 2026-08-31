-- ══════════════════════════════════════════════════════════════
-- Corrige/enrichit le contenu de wall ball (précisions demandées par
-- l'utilisateur : muscle secondaire du lancer, gainage continu, et un
-- vrai "à noter" sur le risque de fatigue en fin de série).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Quadriceps et fessiers en moteur principal pour la phase de squat, deltoïde antérieur et triceps en secondaire pour la phase de lancer. Gainage sollicité en continu pour la stabilité du tronc pendant l''enchaînement.',
  execution = 'Squat avant enchaîné avec un lancer explosif au-dessus de la tête contre un mur, rattrapé au rebond.',
  utilite = 'Mouvement de conditionnement complet qui combine force des jambes et puissance du haut du corps.',
  a_noter = 'Exercice à haute exigence cardio-respiratoire, la fatigue dégrade rapidement la technique de réception, ce qui augmente le risque sur les lombaires et les genoux en fin de série.',
  tags = ARRAY['quadriceps', 'poids du corps', 'conditionnement']
WHERE id = 'mk_wall-ball';

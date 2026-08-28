-- ══════════════════════════════════════════════════════════════
-- Précise le muscle travaillé (érecteurs du rachis nommés) et le à
-- noter (pourquoi éviter l'élan) de hyperextension inversée.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Fessiers et ischio-jambiers en moteur principal, bas du dos (érecteurs du rachis) en secondaire.',
  a_noter = 'Mouvement contrôlé, éviter l''élan pour lever les jambes plus haut, ça retire le travail musculaire au profit de la vitesse et augmente le risque sur les lombaires.'
WHERE id = 'mk_reverse-hyperextension';

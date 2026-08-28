-- ══════════════════════════════════════════════════════════════
-- Précise le muscle travaillé (gastrocnémien vs soléaire) et enrichit
-- utilité/à noter de donkey mollets debout.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  muscle_travaille = 'Gastrocnémien (jumeau) en moteur principal, soléaire en secondaire.',
  utilite = 'Grand classique pour les mollets, sans machine, la position penchée permet un étirement plus profond qu''un mollet debout classique.',
  a_noter = 'Descendre en étirement complet pour profiter de toute l''amplitude, ne pas rebondir en bas du mouvement pour éviter de solliciter le tendon d''Achille par à-coups.'
WHERE id = 'mk_bodyweight-donkey-calf-raise';

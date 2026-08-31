-- ══════════════════════════════════════════════════════════════
-- Corrige les noms mal traduits/mal ordonnés des exercices poids du
-- corps (relecture manuelle demandée par l'utilisateur).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET nom = 'fente avant' WHERE id = 'mk_forward-lunge';
UPDATE public.exercices_catalogue SET nom = 'fente bulgare' WHERE id = 'mk_bulgarian-split-squat';
UPDATE public.exercices_catalogue SET nom = 'burpees' WHERE id = 'mk_burpee';
UPDATE public.exercices_catalogue SET nom = 'crunch sur banc décliné' WHERE id = 'mk_decline-crunch';
UPDATE public.exercices_catalogue SET nom = 'crunch avec redressement sur banc décliné' WHERE id = 'mk_decline-sit-up';
UPDATE public.exercices_catalogue SET nom = 'pompe diamant' WHERE id = 'mk_diamond-push-ups';
UPDATE public.exercices_catalogue SET nom = 'dips à la barre' WHERE id = 'mk_parralel-bar-dips';
UPDATE public.exercices_catalogue SET nom = 'fente en isométrie' WHERE id = 'mk_split-squat-isometric-hold';
UPDATE public.exercices_catalogue SET nom = 'front gainage' WHERE id = 'mk_front-plank';
UPDATE public.exercices_catalogue SET nom = 'gainage position pompe' WHERE id = 'mk_hand-plank';
UPDATE public.exercices_catalogue SET nom = 'pompe inclinée' WHERE id = 'mk_incline-push-up';
UPDATE public.exercices_catalogue SET nom = 'hyperextension inversée' WHERE id = 'mk_reverse-hyperextension';
UPDATE public.exercices_catalogue SET nom = 'fente marchée' WHERE id = 'mk_lunge-walking';
UPDATE public.exercices_catalogue SET nom = 'squat avec phase isométrique' WHERE id = 'mk_pause-squat';
UPDATE public.exercices_catalogue SET nom = 'fente inversée' WHERE id = 'mk_bodyweight-alternating-reverse-lunges';
UPDATE public.exercices_catalogue SET nom = 'fente latérale' WHERE id = 'mk_bodyweight-alternating-lateral-lunge';
UPDATE public.exercices_catalogue SET nom = 'pompes sur les genoux' WHERE id = 'mk_bodyweight-knee-push-ups';
UPDATE public.exercices_catalogue SET nom = 'russian twist' WHERE id = 'mk_bodyweight-russian-twist';
UPDATE public.exercices_catalogue SET nom = 'soulevé de terre' WHERE id = 'mk_bodyweight-deadlift';
UPDATE public.exercices_catalogue SET nom = 'squat' WHERE id = 'mk_bodyweight-squat';
UPDATE public.exercices_catalogue SET nom = 'pompes surélevées avec box' WHERE id = 'mk_bodyweight-elevated-push-up';
UPDATE public.exercices_catalogue SET nom = 'traction prise large' WHERE id = 'mk_wide-grip-pull-up';
UPDATE public.exercices_catalogue SET nom = 'traction prise neutre' WHERE id = 'mk_neutral-grip-pull-up';
UPDATE public.exercices_catalogue SET nom = 'traction australienne' WHERE id = 'mk_inverted-row';
UPDATE public.exercices_catalogue SET nom = 'suspension en isométrie' WHERE id = 'mk_dead-hang';
UPDATE public.exercices_catalogue SET nom = 'traction lestée' WHERE id = 'mk_weighted-pull-ups';

-- ══════════════════════════════════════════════════════════════
-- Corrige les noms qui commencent par un mot de position/angle
-- (assis, debout, allongé, incliné, décliné) placu00e9 en pru00e9fixe --
-- ordre anglais que le franu00e7ais francophone met normalement en
-- suffixe apru00e8s le mouvement (16 exercices, haltère/kettlebell/
-- machine/poids du corps).
-- u00c0 coller et exu00e9cuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Assis/debout/allongé en préfixe -> déplacé en suffixe
UPDATE public.exercices_catalogue SET nom = 'développé militaire à l''haltère, assis' WHERE id = 'mk_dumbbell-seated-overhead-press';
UPDATE public.exercices_catalogue SET nom = 'développé militaire au kettlebell, assis' WHERE id = 'mk_kettlebell-seated-overhead-press';
UPDATE public.exercices_catalogue SET nom = 'haussement d''épaules à l''haltère, assis' WHERE id = 'mk_dumbbell-seated-shrug';
UPDATE public.exercices_catalogue SET nom = 'leg curl assis' WHERE id = 'mk_seated-leg-curl';
UPDATE public.exercices_catalogue SET nom = 'leg curl allongé' WHERE id = 'mk_lying-leg-curl';
UPDATE public.exercices_catalogue SET nom = 'curl marteau unilatéral à l''haltère, debout' WHERE id = 'mk_dumbbell-standing-single-arm-hammer-curl';
UPDATE public.exercices_catalogue SET nom = 'curl unilatéral à l''haltère, debout' WHERE id = 'mk_dumbbell-standing-single-arm-curl';
UPDATE public.exercices_catalogue SET nom = 'smith développé militaire à la machine, assis' WHERE id = 'mk_smith-machine-seated-overhead-press';
UPDATE public.exercices_catalogue SET nom = 'smith haussements d''épaules à la machine, debout' WHERE id = 'mk_smith-machine-standing-shrugs';

-- Incliné/décliné en préfixe -> déplacé en suffixe (avec accord de genre)
UPDATE public.exercices_catalogue SET nom = 'curl incliné à l''haltère' WHERE id = 'mk_dumbbell-incline-curl';
UPDATE public.exercices_catalogue SET nom = 'curl marteau incliné à l''haltère' WHERE id = 'mk_dumbbell-incline-hammer-curl';
UPDATE public.exercices_catalogue SET nom = 'écarté couché incliné à l''haltère' WHERE id = 'mk_dumbbell-incline-chest-fly';
UPDATE public.exercices_catalogue SET nom = 'élévation frontale inclinée à l''haltère' WHERE id = 'mk_dumbbell-incline-front-raise';
UPDATE public.exercices_catalogue SET nom = 'écarté couché décliné à l''haltère' WHERE id = 'mk_dumbbell-decline-chest-fly';
UPDATE public.exercices_catalogue SET nom = 'skullcrusher décliné à l''haltère' WHERE id = 'mk_dumbbell-decline-skullcrusher';
UPDATE public.exercices_catalogue SET nom = 'pompe déclinée' WHERE id = 'mk_decline-push-up';

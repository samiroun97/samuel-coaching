-- ══════════════════════════════════════════════════════════════
-- Remplace execution/a_noter par les vraies instructions étape par
-- étape et erreurs fréquentes du pack MoveKit (traduites), catégorie
-- étirement. La variante swiss ball (variation-four) garde le contenu
-- dicté directement par l'utilisateur, non touchée ici.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  execution = ARRAY[
    'Allongé sur le ventre, jambes tendues, avant-bras au sol et coudes sous les épaules, paumes posées.',
    'Pousser sur les mains et commencer à lever la poitrine en éloignant les coudes du sol.',
    'Continuer à tendre les bras vers une position cobra confortable, en gardant les hanches et les cuisses au sol.',
    'Relâcher les épaules loin des oreilles et respirer lentement dans l''étirement de l''abdomen.',
    'Plier les coudes pour redescendre avec contrôle jusqu''à ce que les avant-bras touchent à nouveau le sol.',
    'Répéter le même trajet fluide entre appui sur avant-bras et bras tendus, sans forcer la hauteur.'
  ],
  a_noter = ARRAY[
    'Forcer la cambrure avec les épaules plutôt que de laisser la poitrine guider le mouvement — ça sollicite le bas du dos sans étirer les abdos.',
    'Bloquer sa respiration pendant l''étirement, ce qui contracte le tronc et va à l''encontre de l''allongement recherché.',
    'Entrer et sortir de la position trop vite plutôt que d''y aller progressivement — l''étirement a besoin de temps sous tension pour se relâcher.',
    'Laisser tomber la tête trop loin en arrière, ce qui met une pression inutile sur la nuque plutôt que sur la paroi abdominale.'
  ]
WHERE id = 'mk_abdominals-stretch-variation-one';

UPDATE public.exercices_catalogue SET
  execution = ARRAY[
    'Debout, pieds écartés à largeur de hanches, les deux bras relâchés le long du corps.',
    'Balayer les deux bras vers l''avant puis vers le haut ensemble jusqu''à ce qu''ils soient au-dessus de la tête.',
    'En montant les bras, lever la poitrine et amener le buste dans une légère extension arrière sans forcer sur le bas du dos.',
    'Tendre les deux mains vers le haut et respirer calmement en gardant les pieds ancrés et les hanches stables.',
    'Ramener le buste en position neutre en redescendant les deux bras le long du corps.',
    'Répéter ce balayage bilatéral au-dessus de la tête avec fluidité, sur une amplitude d''extension confortable.'
  ],
  a_noter = ARRAY[
    'Cambrer brusquement le bas du dos au lieu de lever à partir de la poitrine.',
    'Laisser un bras partir devant l''autre, ce qui rend le mouvement inégal.',
    'Plier les genoux ou avancer les hanches pour forcer davantage l''extension.',
    'Hausser les deux épaules vers les oreilles en haut du mouvement.'
  ]
WHERE id = 'mk_abdominals-stretch-variation-two';

UPDATE public.exercices_catalogue SET
  execution = ARRAY[
    'Debout, pieds écartés à largeur d''épaules, tendre un bras droit au-dessus de la tête.',
    'Incliner doucement le buste à l''opposé du bras levé, ce bras passant au-dessus de la tête.',
    'Garder les hanches et la poitrine face à l''avant pour que le mouvement reste une flexion latérale et non une rotation.',
    'Tenir la position 15 à 30 secondes, en respirant lentement et en allongeant le bras levé.',
    'Revenir à la verticale avec contrôle puis redescendre le bras avant de changer de côté.',
    'Répéter avec l''autre bras levé, en augmentant progressivement l''inclinaison à mesure que les obliques s''échauffent.'
  ],
  a_noter = ARRAY[
    'Laisser les hanches partir sur le côté en s''inclinant — ça annule l''étirement des obliques et reporte la charge sur le bas du dos.',
    'Tourner le buste vers l''avant ou l''arrière plutôt que de fléchir purement sur le côté, ce qui atténue l''allongement du flanc.',
    'Forcer la profondeur dès les premières secondes plutôt que de laisser la respiration approfondir l''étirement avec le temps.',
    'Crisper l''épaule du bras levé — le bras doit s''allonger tout en restant relâché au niveau du trapèze.'
  ]
WHERE id = 'mk_abdominals-stretch-variation-three';

-- ══════════════════════════════════════════════════════════════
-- Corrige une inversion de catégories sur les exercices "dos" (~49 lignes).
--
-- Bug : le script d'import MoveKit (scripts/movekit-import.mjs) mappait la cible
-- générique "Back" de MoveKit vers muscle_cible = "haut du dos", et "Lower Back"
-- vers muscle_cible = "grand dorsal" — l'inverse de leur vrai sens anatomique :
--   - "Back" chez MoveKit couvre en réalité les tirages/tractions (rowing, tirage
--     vertical, tractions...), qui ciblent le grand dorsal (les dorsaux), pas le
--     "haut du dos" (zone trapèzes/rhomboïdes, déjà couverte par la catégorie
--     "trapèzes" à part pour les shrugs).
--   - "Lower Back" couvre les extensions lombaires (back extension, superman...),
--     qui ciblent les érecteurs du rachis (bas du dos), et n'ont rien à voir avec
--     le grand dorsal malgré le nom de la catégorie qui portait à confusion.
--
-- Résultat : la puce "Haut du dos" de la bibliothèque n'affichait que des
-- rowings/tractions (grand dorsal), ce qui ne voulait rien dire pour l'utilisateur.
--
-- Renomme uniquement muscle_cible (le filtre/la puce) — muscle_travaille et
-- muscles_secondaires étaient déjà corrects (voir exercices_catalogue_dos_muscle_precision.sql
-- et exercices_catalogue_bas_du_dos_fix.sql) et ne sont pas touchés ici.
-- À exécuter dans cet ordre pour ne jamais faire se chevaucher les deux groupes.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1) Les extensions lombaires actuellement mal nommées "grand dorsal" → "lombaires".
UPDATE public.exercices_catalogue SET muscle_cible = 'lombaires'
WHERE muscle_cible = 'grand dorsal';

-- 2) Les rowings/tirages/tractions actuellement mal nommés "haut du dos" → "grand dorsal".
UPDATE public.exercices_catalogue SET muscle_cible = 'grand dorsal'
WHERE muscle_cible = 'haut du dos';

-- 3) Le nom de cet exercice portait la catégorie en suffixe pour le distinguer d'un
-- doublon presque identique (voir exercices_catalogue_full_audit_name_fixes.sql) —
-- à mettre à jour pour rester cohérent avec sa nouvelle catégorie.
UPDATE public.exercices_catalogue SET nom = 'rowing unilatéral à l''haltère (grand dorsal)'
WHERE id = 'mk_dumbbell-single-arm-row';

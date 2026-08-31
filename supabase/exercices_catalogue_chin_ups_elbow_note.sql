-- ══════════════════════════════════════════════════════════════
-- Ajoute un avertissement sur mk_chin-ups (tractions en supination) :
-- la forte implication du biceps peut provoquer des douleurs au
-- coude (tendinite du biceps ou épicondylite) chez certaines
-- personnes.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue SET
  a_noter = 'Prise plus étroite que la traction classique, plus accessible pour débuter. La forte implication du biceps peut provoquer des douleurs au coude (tendinite du biceps ou épicondylite) chez certaines personnes, à surveiller en cas de gêne persistante.'
WHERE id = 'mk_chin-ups';

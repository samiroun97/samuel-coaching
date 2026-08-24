-- ══════════════════════════════════════════════════════════════
-- Migration : séances libres créées par le client lui-même
-- Les policies RLS existantes (coach_all_seances, authenticated_read_catalogue)
-- permettent déjà à un client d'insérer sa propre séance et de lire le
-- catalogue d'exercices — seule manque une façon de distinguer, dans les
-- vues client et coach, une séance que le client a composée lui-même
-- d'une séance assignée par le coach.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.programme_seances ADD COLUMN IF NOT EXISTS created_by_client boolean NOT NULL DEFAULT false;

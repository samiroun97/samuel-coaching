-- ══════════════════════════════════════════════════════════════
-- Migration : persiste échauffement/dégressif dans seance_logs (jusqu'ici locaux à la
-- séance en cours, jamais sauvegardés — signalé par le user : quitter la page en cours de
-- séance faisait disparaître les paliers d'échauffement/dégressifs déjà saisis).
-- Colonnes additives, nullable/valeur par défaut : rétrocompatible avec toutes les lignes
-- existantes (repli implicite "reps normales, pas d'échauffement, aucun palier").
-- Appliquée directement via l'outil MCP Supabase (apply_migration) le 2026-09-19 ; conservée
-- ici pour l'historique du repo, même convention que les autres migrations de ce dossier.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.seance_logs
  ADD COLUMN IF NOT EXISTS warmup boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS drops jsonb,
  ADD COLUMN IF NOT EXISTS warmup_steps jsonb;

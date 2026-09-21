-- ══════════════════════════════════════════════════════════════
-- Migration : préférences de notification par type de rappel. Jusqu'ici un
-- seul interrupteur ("Rappels repas") pilotait tout ou rien côté navigateur
-- (push_subscriptions) — ces deux colonnes permettent de couper juste le
-- rappel déjeuner ou juste le dîner sans se désabonner complètement.
-- Défaut à true : un abonné existant continue de tout recevoir comme avant,
-- rétrocompatible avec les abonnements déjà en place.
-- Appliquée directement via l'outil MCP Supabase (apply_migration), conservée
-- ici pour l'historique du repo, même convention que les autres migrations.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notif_dejeuner boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_diner boolean NOT NULL DEFAULT true;

-- ══════════════════════════════════════════════════════════════
-- Migration : snapshot du budget calorique/macros du jour sur daily_summaries
-- Alimente le calendrier de régularité (vert/rouge/bleu) — additive uniquement.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS goal_calories integer;
ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS goal_proteines integer;
ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS goal_glucides integer;
ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS goal_lipides integer;

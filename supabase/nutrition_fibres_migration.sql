-- ══════════════════════════════════════════════════════════════
-- Migration : ajout des fibres au suivi nutritionnel
-- À coller et exécuter dans Supabase > SQL Editor
-- Additive uniquement.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.daily_summaries ADD COLUMN IF NOT EXISTS fibres integer DEFAULT 0;

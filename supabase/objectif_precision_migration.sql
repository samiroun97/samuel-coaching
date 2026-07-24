-- ══════════════════════════════════════════════════════════════
-- Migration : questionnaire de précision d'objectif (coach → client)
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS objectif_echeance text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS objectif_pending boolean NOT NULL DEFAULT false;

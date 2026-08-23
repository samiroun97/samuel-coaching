-- ══════════════════════════════════════════════════════════════
-- Migration : type d'objectif structuré (perte de gras / prise de
-- muscle / recomposition / maintien), en complément du texte libre
-- "objectifs" déjà existant.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS objectif_type text;

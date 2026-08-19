-- ══════════════════════════════════════════════════════════════
-- Migration : code d'invitation par coach
-- À coller et exécuter dans Supabase > SQL Editor
--
-- Additive uniquement. Chaque coach obtient un code court unique
-- (généré automatiquement pour les lignes existantes, et par défaut
-- pour toute nouvelle ligne insérée dans coaches).
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS code text UNIQUE;

ALTER TABLE public.coaches
  ALTER COLUMN code SET DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

UPDATE public.coaches
SET code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
WHERE code IS NULL;

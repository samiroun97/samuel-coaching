-- ══════════════════════════════════════════════════════════════
-- Migration : corrections coach pour calibrer l'IA d'estimation body fat
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.bodyfat_ai_corrections (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id        uuid        REFERENCES public.messages(id) ON DELETE SET NULL,
  original_estimate numeric,
  corrected_estimate numeric,
  client_comment    text,
  coach_comment     text        NOT NULL,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.bodyfat_ai_corrections ENABLE ROW LEVEL SECURITY;

-- Table interne au coach uniquement — les clients n'y ont jamais accès.
-- Lue côté serveur (route /api/suivi/bodyfat) via la clé service_role,
-- qui contourne RLS, donc pas besoin de policy pour les clients ici.
DROP POLICY IF EXISTS "coach_full_access_bf_corrections" ON public.bodyfat_ai_corrections;
CREATE POLICY "coach_full_access_bf_corrections" ON public.bodyfat_ai_corrections
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com');

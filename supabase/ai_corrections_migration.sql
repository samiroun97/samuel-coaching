-- ══════════════════════════════════════════════════════════════
-- Migration : corrections coach pour calibrer l'IA (nutrition, programme, activité)
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_corrections (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category          text        NOT NULL CHECK (category IN ('nutrition','programme','activite')),
  message_id        uuid        REFERENCES public.messages(id) ON DELETE SET NULL,
  original_data     jsonb,
  corrected_data    jsonb,
  client_comment    text,
  coach_comment     text        NOT NULL,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_corrections_category_idx ON public.ai_corrections (category, created_at DESC);

ALTER TABLE public.ai_corrections ENABLE ROW LEVEL SECURITY;

-- Table interne au coach uniquement — les clients n'y ont jamais accès.
-- Lue côté serveur (routes /api/nutrition/analyze, /api/programme/generate,
-- /api/programme/calories) via la clé service_role, qui contourne RLS, donc
-- pas besoin de policy pour les clients ici.
DROP POLICY IF EXISTS "coach_full_access_ai_corrections" ON public.ai_corrections;
CREATE POLICY "coach_full_access_ai_corrections" ON public.ai_corrections
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com');

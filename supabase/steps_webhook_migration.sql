-- ══════════════════════════════════════════════════════════════
-- Migration : synchro des pas via Raccourci iPhone (jeton webhook)
-- À coller et exécuter dans Supabase > SQL Editor
-- Additive uniquement.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS steps_webhook_token text UNIQUE;

CREATE TABLE IF NOT EXISTS public.steps_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date        NOT NULL,
  steps      integer     NOT NULL DEFAULT 0,
  source     text        NOT NULL DEFAULT 'manuel',
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.steps_log ENABLE ROW LEVEL SECURITY;

-- Le client gère ses propres pas ; l'ingestion via le Raccourci se fait côté serveur
-- avec la clé service_role (route /api/programme/steps-webhook), qui contourne RLS
-- puisque cette requête n'a pas de session Supabase (juste un jeton personnel).
DROP POLICY IF EXISTS "users_own_steps_log" ON public.steps_log;
CREATE POLICY "users_own_steps_log" ON public.steps_log
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

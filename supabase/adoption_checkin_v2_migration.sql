-- ══════════════════════════════════════════════════════════════
-- Migration : notifications réparées + check-in v2
-- Appliquée le 28.09.2026 (via MCP Supabase)
-- ══════════════════════════════════════════════════════════════

-- 1) push_subscriptions : la table en prod datait d'une ancienne version
--    (user_id, endpoint, subscription jsonb NOT NULL, PK user_id+endpoint) ;
--    push_notifications_migration.sql (CREATE TABLE IF NOT EXISTS) n'avait donc
--    jamais rien changé. Le code écrit p256dh/auth et upsert sur "endpoint" →
--    chaque abonnement échouait (500) et aucun rappel ne partait.
--    Mise au format attendu par le code, sans rien supprimer.
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS id     uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS p256dh text,
  ADD COLUMN IF NOT EXISTS auth   text;
ALTER TABLE public.push_subscriptions ALTER COLUMN subscription DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_key ON public.push_subscriptions (endpoint);
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_id_key       ON public.push_subscriptions (id);

-- 2) Check-in v2 : ressenti (sommeil, stress, faim) + mensurations en cm.
ALTER TABLE public.weekly_checkins
  ADD COLUMN IF NOT EXISTS sleep  integer CHECK (sleep  BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS stress integer CHECK (stress BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS hunger integer CHECK (hunger BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS waist  numeric CHECK (waist  > 0 AND waist  < 300),
  ADD COLUMN IF NOT EXISTS hips   numeric CHECK (hips   > 0 AND hips   < 300),
  ADD COLUMN IF NOT EXISTS chest  numeric CHECK (chest  > 0 AND chest  < 300),
  ADD COLUMN IF NOT EXISTS arm    numeric CHECK (arm    > 0 AND arm    < 150),
  ADD COLUMN IF NOT EXISTS thigh  numeric CHECK (thigh  > 0 AND thigh  < 200);

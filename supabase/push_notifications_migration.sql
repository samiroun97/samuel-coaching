-- ══════════════════════════════════════════════════════════════
-- Migration : abonnements aux notifications push (rappels repas)
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   text        NOT NULL UNIQUE,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur gère uniquement ses propres abonnements (s'inscrire/se
-- désinscrire depuis son profil). L'envoi des rappels se fait côté serveur
-- via la clé service_role (route /api/push/send-reminders), qui contourne
-- RLS pour lire tous les abonnements — pas besoin de policy coach ici.
DROP POLICY IF EXISTS "users_own_push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "users_own_push_subscriptions" ON public.push_subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

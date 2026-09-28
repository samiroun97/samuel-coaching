-- ══════════════════════════════════════════════════════════════
-- Migration : sécurité des rôles + table des abonnements (formules)
-- Appliquée le 28.09.2026 (via MCP Supabase)
-- ══════════════════════════════════════════════════════════════

-- 1) FAILLE : update_own_profile laissait un utilisateur modifier TOUTES les colonnes de
--    son profil, y compris is_platform_admin / is_coach (→ accès opérateur) et les champs
--    gérés par le coach (abonnement, statut, étape). Ces colonnes ne changent désormais que
--    côté serveur (service_role) ou par le coach du client — une auto-modification est
--    ignorée en silence (valeur précédente conservée) pour ne casser aucun formulaire.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW; -- service_role / éditeur SQL : pas de restriction
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_coach := false;
    NEW.is_platform_admin := false;
    NEW.subscription_end := NULL;
    NEW.status := NULL;
    NEW.pipeline_stage := 'onboarding';
    RETURN NEW;
  END IF;
  NEW.is_coach := OLD.is_coach;
  NEW.is_platform_admin := OLD.is_platform_admin;
  IF NEW.id = auth.uid() THEN
    NEW.subscription_end := OLD.subscription_end;
    NEW.status := OLD.status;
    NEW.pipeline_stage := OLD.pipeline_stage;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 2) FAILLE : coach_manages_own_coach_row / coach_manages_own_clients (FOR ALL) laissaient
--    n'importe qui se créer une ligne coaches puis s'ajouter n'importe quel utilisateur
--    comme client → is_coach_of(victime) → lecture/modification/suppression de ses données.
--    L'app ne fait que LIRE ces tables côté navigateur ; toutes les écritures passent par
--    les routes serveur (service_role) : /api/coach/register, /api/coach/join,
--    /api/crm/delete-client, /api/operateur/toggle-coach. Lecture seule côté client.
DROP POLICY IF EXISTS "coach_manages_own_coach_row" ON public.coaches;
CREATE POLICY "coach_reads_own_coach_row" ON public.coaches
  FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "coach_manages_own_clients" ON public.coach_clients;
CREATE POLICY "coach_reads_own_clients" ON public.coach_clients
  FOR SELECT USING (coach_id IN (SELECT id FROM public.coaches WHERE profile_id = auth.uid()));

-- 3) Abonnements (formules Solo/Coach × Base/Premium). Table séparée de profiles pour
--    qu'aucun utilisateur ne puisse s'attribuer une formule : lecture de sa propre ligne
--    seulement, écritures réservées au serveur (essai, et plus tard webhook Stripe).
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                   text NOT NULL CHECK (plan IN ('solo_base', 'solo_premium', 'coach_base', 'coach_premium')),
  status                 text NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at          timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  stripe_customer_id     text UNIQUE,
  stripe_subscription_id text UNIQUE,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_subscription" ON public.subscriptions;
CREATE POLICY "users_read_own_subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Fenêtre des quotas IA : index pour le comptage par utilisateur/route/date.
CREATE INDEX IF NOT EXISTS ai_usage_user_route_created ON public.ai_usage (user_id, route, created_at);

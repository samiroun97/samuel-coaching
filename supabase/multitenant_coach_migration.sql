-- ══════════════════════════════════════════════════════════════
-- Migration : passage multi-coachs (SaaS)
-- À coller et exécuter dans Supabase > SQL Editor
--
-- Additive uniquement : aucune colonne ni policy existante n'est
-- supprimée avant que la nouvelle la remplace explicitement plus
-- bas. Peut être exécutée sur la prod sans interruption de service.
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. Nouvelles tables : is_coach, coaches, coach_clients
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_coach boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.coaches (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_manages_own_coach_row" ON public.coaches;
CREATE POLICY "coach_manages_own_coach_row" ON public.coaches
  FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.coach_clients (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id         uuid        NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pipeline_stage   text,
  status           text,
  subscription_end date,
  objectif_echeance text,
  objectif_pending boolean     NOT NULL DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (coach_id, client_id)
);

ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_manages_own_clients" ON public.coach_clients;
CREATE POLICY "coach_manages_own_clients" ON public.coach_clients
  FOR ALL
  USING (coach_id IN (SELECT id FROM public.coaches WHERE profile_id = auth.uid()))
  WITH CHECK (coach_id IN (SELECT id FROM public.coaches WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "client_reads_own_coach_link" ON public.coach_clients;
CREATE POLICY "client_reads_own_coach_link" ON public.coach_clients
  FOR SELECT
  USING (client_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 2. coach_id sur les tables "bibliothèque" et logs IA du coach
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.exercice_bibliotheque   ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.coaches(id) ON DELETE CASCADE;
ALTER TABLE public.programme_templates     ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.coaches(id) ON DELETE CASCADE;
ALTER TABLE public.ai_corrections          ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.coaches(id) ON DELETE CASCADE;
ALTER TABLE public.bodyfat_ai_corrections  ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.coaches(id) ON DELETE CASCADE;

-- ──────────────────────────────────────────────────────────────
-- 3. Backfill : Samuel devient le coach #1, ses clients existants
--    sont rattachés dans coach_clients avec leurs données actuelles
-- ──────────────────────────────────────────────────────────────

INSERT INTO public.coaches (profile_id, business_name)
SELECT id, 'Samuel Coaching' FROM public.profiles WHERE email = 'sam97waelti@gmail.com'
ON CONFLICT (profile_id) DO NOTHING;

UPDATE public.profiles SET is_coach = true WHERE email = 'sam97waelti@gmail.com';

INSERT INTO public.coach_clients (coach_id, client_id, pipeline_stage, status, subscription_end, objectif_echeance, objectif_pending)
SELECT c.id, p.id, p.pipeline_stage, p.status, p.subscription_end, p.objectif_echeance, p.objectif_pending
FROM public.profiles p
CROSS JOIN public.coaches c
WHERE p.email <> 'sam97waelti@gmail.com'
  AND c.profile_id = (SELECT id FROM public.profiles WHERE email = 'sam97waelti@gmail.com')
ON CONFLICT (coach_id, client_id) DO NOTHING;

UPDATE public.exercice_bibliotheque  SET coach_id = (SELECT id FROM public.coaches LIMIT 1) WHERE coach_id IS NULL;
UPDATE public.programme_templates    SET coach_id = (SELECT id FROM public.coaches LIMIT 1) WHERE coach_id IS NULL;
UPDATE public.ai_corrections         SET coach_id = (SELECT id FROM public.coaches LIMIT 1) WHERE coach_id IS NULL;
UPDATE public.bodyfat_ai_corrections SET coach_id = (SELECT id FROM public.coaches LIMIT 1) WHERE coach_id IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 4. Fonctions utilitaires pour les policies (security definer :
--    évite la récursion RLS quand on interroge coaches/coach_clients
--    depuis la policy d'une autre table)
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_is_coach()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE((SELECT is_coach FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_coach_of(target_client_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_clients cc
    JOIN public.coaches c ON c.id = cc.coach_id
    WHERE cc.client_id = target_client_id
      AND c.profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.current_coach_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.coaches WHERE profile_id = auth.uid();
$$;

-- ──────────────────────────────────────────────────────────────
-- 5. Remplacement des policies codées en dur sur l'email de Samuel
--    par les fonctions ci-dessus. Comportement identique pour lui
--    aujourd'hui (seul coach), mais applicable à n'importe quel coach.
-- ──────────────────────────────────────────────────────────────

-- profiles
DROP POLICY IF EXISTS "Coach reads all profiles" ON public.profiles;
CREATE POLICY "coach_reads_own_clients_profiles" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_coach_of(id));

DROP POLICY IF EXISTS "coach_deletes_profiles" ON public.profiles;
CREATE POLICY "coach_deletes_own_clients_profiles" ON public.profiles
  FOR DELETE
  USING (public.is_coach_of(id));

-- activity_events
DROP POLICY IF EXISTS "activity_events_coach_only" ON public.activity_events;
CREATE POLICY "coach_manages_client_activity_events" ON public.activity_events
  FOR ALL
  USING (public.is_coach_of(client_id))
  WITH CHECK (public.is_coach_of(client_id));

-- ai_corrections (scope direct par coach_id, pas de client_id sur cette table)
DROP POLICY IF EXISTS "coach_full_access_ai_corrections" ON public.ai_corrections;
CREATE POLICY "coach_full_access_ai_corrections" ON public.ai_corrections
  FOR ALL
  USING (coach_id = public.current_coach_id())
  WITH CHECK (coach_id = public.current_coach_id());

-- bodyfat_ai_corrections
DROP POLICY IF EXISTS "coach_full_access_bf_corrections" ON public.bodyfat_ai_corrections;
CREATE POLICY "coach_full_access_bf_corrections" ON public.bodyfat_ai_corrections
  FOR ALL
  USING (coach_id = public.current_coach_id())
  WITH CHECK (coach_id = public.current_coach_id());

-- body_fat_entries
DROP POLICY IF EXISTS "coach_sees_shared_bf" ON public.body_fat_entries;
CREATE POLICY "coach_sees_shared_bf" ON public.body_fat_entries
  FOR SELECT
  USING (shared = true AND public.is_coach_of(user_id));

-- body_photos
DROP POLICY IF EXISTS "coach_sees_shared" ON public.body_photos;
CREATE POLICY "coach_sees_shared_photos" ON public.body_photos
  FOR SELECT
  USING (shared_with_coach = true AND public.is_coach_of(user_id));

-- coach_notes
DROP POLICY IF EXISTS "Coach all notes" ON public.coach_notes;
CREATE POLICY "coach_all_notes" ON public.coach_notes
  FOR ALL
  USING (public.is_coach_of(client_id) OR auth.uid() = client_id)
  WITH CHECK (public.is_coach_of(client_id) OR auth.uid() = client_id);

-- daily_summaries
DROP POLICY IF EXISTS "Samuel reads all summaries" ON public.daily_summaries;
CREATE POLICY "coach_reads_client_summaries" ON public.daily_summaries
  FOR SELECT
  USING (public.is_coach_of(user_id));

DROP POLICY IF EXISTS "coach_deletes_daily_summaries" ON public.daily_summaries;
CREATE POLICY "coach_deletes_client_summaries" ON public.daily_summaries
  FOR DELETE
  USING (public.is_coach_of(user_id));

-- exercice_bibliotheque (bibliothèque privée du coach, scope direct par coach_id)
DROP POLICY IF EXISTS "coach_full_access_bibliotheque" ON public.exercice_bibliotheque;
CREATE POLICY "coach_full_access_bibliotheque" ON public.exercice_bibliotheque
  FOR ALL
  USING (coach_id = public.current_coach_id())
  WITH CHECK (coach_id = public.current_coach_id());

-- feedback
DROP POLICY IF EXISTS "Coach reads all feedback" ON public.feedback;
CREATE POLICY "coach_reads_client_feedback" ON public.feedback
  FOR ALL
  USING (public.is_coach_of(client_id) OR auth.uid() = client_id)
  WITH CHECK (public.is_coach_of(client_id) OR auth.uid() = client_id);

-- meal_plan_items
DROP POLICY IF EXISTS "Coach all meal_plan_items" ON public.meal_plan_items;
CREATE POLICY "coach_all_meal_plan_items" ON public.meal_plan_items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.meal_plans mp WHERE mp.id = meal_plan_items.plan_id AND public.is_coach_of(mp.client_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meal_plans mp WHERE mp.id = meal_plan_items.plan_id AND public.is_coach_of(mp.client_id)));

-- meal_plans (fusion des 3 anciennes policies coach redondantes en une seule)
DROP POLICY IF EXISTS "Coach all meal_plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Samuel manages meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "coach_deletes_meal_plans" ON public.meal_plans;
CREATE POLICY "coach_all_meal_plans" ON public.meal_plans
  FOR ALL
  USING (public.is_coach_of(client_id) OR auth.uid() = client_id)
  WITH CHECK (public.is_coach_of(client_id) OR auth.uid() = client_id);

-- messages (les policies d'accès par email restent : chacun ne voit que ses propres messages,
-- ce qui isole déjà correctement les coachs entre eux ; seule la suppression était réservée à Samuel)
DROP POLICY IF EXISTS "coach_deletes_messages" ON public.messages;
CREATE POLICY "coach_deletes_own_conversations" ON public.messages
  FOR DELETE
  USING (public.current_is_coach() AND ((auth.jwt() ->> 'email') = from_email OR (auth.jwt() ->> 'email') = to_email));

-- programme_seances
DROP POLICY IF EXISTS "Coach all seances" ON public.programme_seances;
CREATE POLICY "coach_all_seances" ON public.programme_seances
  FOR ALL
  USING (public.is_coach_of(client_id) OR auth.uid() = client_id)
  WITH CHECK (public.is_coach_of(client_id) OR auth.uid() = client_id);

-- programme_templates (bibliothèque privée du coach, scope direct par coach_id)
DROP POLICY IF EXISTS "coach_full_access_templates" ON public.programme_templates;
CREATE POLICY "coach_full_access_templates" ON public.programme_templates
  FOR ALL
  USING (coach_id = public.current_coach_id())
  WITH CHECK (coach_id = public.current_coach_id());

-- weekly_checkins
DROP POLICY IF EXISTS "Coach all checkins" ON public.weekly_checkins;
CREATE POLICY "coach_all_checkins" ON public.weekly_checkins
  FOR ALL
  USING (public.is_coach_of(client_id) OR auth.uid() = client_id)
  WITH CHECK (public.is_coach_of(client_id) OR auth.uid() = client_id);

-- push_subscriptions et user_state : déjà scopées sur auth.uid() = user_id,
-- aucun changement nécessaire, elles fonctionnent telles quelles en multi-coach.

-- Deux policies supplémentaires découvertes après coup (absentes de l'inventaire initial) :
DROP POLICY IF EXISTS "Coach updates all profiles" ON public.profiles;
CREATE POLICY "coach_updates_own_clients_profiles" ON public.profiles
  FOR UPDATE
  USING (public.is_coach_of(id) OR auth.uid() = id);

DROP POLICY IF EXISTS "Samuel manages meal plan items" ON public.meal_plan_items;
-- (redondante avec coach_all_meal_plan_items créée plus haut, pas de remplacement nécessaire)

-- ══════════════════════════════════════════════════════════════
-- Migration : autoriser le coach à supprimer un client depuis le CRM
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "coach_deletes_profiles" ON public.profiles;
CREATE POLICY "coach_deletes_profiles" ON public.profiles
  FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com');

DROP POLICY IF EXISTS "coach_deletes_meal_plans" ON public.meal_plans;
CREATE POLICY "coach_deletes_meal_plans" ON public.meal_plans
  FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com');

DROP POLICY IF EXISTS "coach_deletes_daily_summaries" ON public.daily_summaries;
CREATE POLICY "coach_deletes_daily_summaries" ON public.daily_summaries
  FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com');

DROP POLICY IF EXISTS "coach_deletes_messages" ON public.messages;
CREATE POLICY "coach_deletes_messages" ON public.messages
  FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com');

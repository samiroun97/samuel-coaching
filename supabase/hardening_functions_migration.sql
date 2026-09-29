-- ══════════════════════════════════════════════════════════════
-- Durcissement (alertes Supabase Advisors du 29.09.2026)
-- ══════════════════════════════════════════════════════════════

-- 1) search_path figé sur les fonctions SECURITY DEFINER qui ne l'avaient pas.
ALTER FUNCTION public.current_coach_id()   SET search_path = public;
ALTER FUNCTION public.current_is_coach()   SET search_path = public;
ALTER FUNCTION public.is_coach_of(uuid)    SET search_path = public;
ALTER FUNCTION public.set_profile_email()  SET search_path = public;

-- 2) Aucune de ces fonctions n'a à être appelée par un visiteur non connecté.
--    Les fonctions utilisées dans les règles RLS / l'app restent exécutables par
--    les utilisateurs connectés ; les fonctions de trigger ne sont appelables par personne.
REVOKE EXECUTE ON FUNCTION public.current_coach_id()     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_is_coach()     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_coach_of(uuid)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_coach_id()          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.next_invoice_number()  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_pending_signups()  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.current_coach_id()     TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.current_is_coach()     TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.is_coach_of(uuid)      TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.my_coach_id()          TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.next_invoice_number()  TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.get_pending_signups()  TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_profile_email()                  FROM PUBLIC, anon, authenticated;

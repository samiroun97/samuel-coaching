-- Compteur d'appels aux routes IA (plafond par utilisateur / route / 24 h, voir lib/aiQuota.ts).
-- Écrit et lu uniquement côté serveur avec la clé service_role : RLS activée sans aucune
-- politique = aucun accès depuis le navigateur.
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_user_route_time_idx ON public.ai_usage (user_id, route, created_at DESC);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Photos corporelles partagées : lisibles par LE coach du client (is_coach_of), au lieu
-- d'une adresse e-mail écrite en dur (qui excluait tout autre coach de la plateforme).
DROP POLICY IF EXISTS "coach_reads_shared" ON storage.objects;
CREATE POLICY "coach_reads_shared" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'body-photos'
    AND EXISTS (
      SELECT 1 FROM public.body_photos bp
      WHERE bp.photo_path = objects.name
        AND bp.shared_with_coach = true
        AND public.is_coach_of(bp.user_id)
    )
  );

-- Inscriptions en attente : réservées à l'administrateur de la plateforme (profiles.is_platform_admin)
-- au lieu d'une adresse e-mail écrite en dur.
CREATE OR REPLACE FUNCTION public.get_pending_signups()
 RETURNS TABLE(id uuid, email text, full_name text, created_at timestamp with time zone, email_confirmed_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select u.id, u.email, u.raw_user_meta_data->>'full_name' as full_name, u.created_at, u.email_confirmed_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  where p.id is null
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.is_platform_admin)
  order by u.created_at desc;
$function$;

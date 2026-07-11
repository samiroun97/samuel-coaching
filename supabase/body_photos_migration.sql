-- ══════════════════════════════════════════════════════════════
-- Migration : stockage sécurisé des photos corporelles
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Table body_photos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.body_photos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_path       text        NOT NULL,   -- chemin dans le bucket : {user_id}/{session_id}/{angle}.jpg
  session_id       text        NOT NULL,   -- identifiant de la session d'estimation (= id de l'entrée BF)
  created_at       timestamptz DEFAULT now(),
  shared_with_coach boolean    DEFAULT false
);

ALTER TABLE public.body_photos ENABLE ROW LEVEL SECURITY;

-- Chaque client ne voit que ses propres lignes
DROP POLICY IF EXISTS "users_own_photos" ON public.body_photos;
CREATE POLICY "users_own_photos" ON public.body_photos
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Le coach (sam97waelti@gmail.com) voit uniquement les photos partagées
DROP POLICY IF EXISTS "coach_sees_shared" ON public.body_photos;
CREATE POLICY "coach_sees_shared" ON public.body_photos
  FOR SELECT
  USING (
    shared_with_coach = true
    AND (auth.jwt() ->> 'email') = 'sam97waelti@gmail.com'
  );


-- 2. Bucket Storage privé
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('body-photos', 'body-photos', false, 5242880)   -- 5 MB max par fichier
ON CONFLICT (id) DO NOTHING;


-- 3. Policies Storage
-- ─────────────────────────────────────────────────────────────
-- Le client peut uploader dans son propre dossier
DROP POLICY IF EXISTS "users_upload_own" ON storage.objects;
CREATE POLICY "users_upload_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'body-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Le client peut lire ses propres fichiers
DROP POLICY IF EXISTS "users_read_own" ON storage.objects;
CREATE POLICY "users_read_own" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'body-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Le client peut supprimer ses propres fichiers
DROP POLICY IF EXISTS "users_delete_own" ON storage.objects;
CREATE POLICY "users_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'body-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Le coach peut lire uniquement les fichiers marqués shared_with_coach = true
DROP POLICY IF EXISTS "coach_reads_shared" ON storage.objects;
CREATE POLICY "coach_reads_shared" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'body-photos'
    AND (auth.jwt() ->> 'email') = 'sam97waelti@gmail.com'
    AND EXISTS (
      SELECT 1 FROM public.body_photos bp
      WHERE bp.photo_path = name
        AND bp.shared_with_coach = true
    )
  );

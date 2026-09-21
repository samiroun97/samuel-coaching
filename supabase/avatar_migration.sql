-- ══════════════════════════════════════════════════════════════
-- Migration : photo de profil du compte — colonne avatar_url sur profiles +
-- bucket de stockage dédié. Public, même traitement que custom-exercise-photos
-- (photo de profil = pas une donnée sensible comme les photos corporelles,
-- voir body_photos_migration.sql, bucket privé).
-- Appliquée directement via l'outil MCP Supabase (apply_migration), conservée
-- ici pour l'historique du repo, même convention que les autres migrations.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 3145728)   -- 3 Mo max par fichier
ON CONFLICT (id) DO NOTHING;

-- Chaque utilisateur ne peut uploader/remplacer que dans son propre dossier ({user_id}/...)
DROP POLICY IF EXISTS "users_upload_own_avatar" ON storage.objects;
CREATE POLICY "users_upload_own_avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Chaque utilisateur peut supprimer ses propres fichiers (remplacement de photo, suppression de compte)
DROP POLICY IF EXISTS "users_delete_own_avatar" ON storage.objects;
CREATE POLICY "users_delete_own_avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "anyone_reads_avatars" ON storage.objects;
CREATE POLICY "anyone_reads_avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

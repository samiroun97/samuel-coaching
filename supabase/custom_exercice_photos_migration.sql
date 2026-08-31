-- ══════════════════════════════════════════════════════════════
-- Migration : bucket de stockage pour les photos d'exercices "libres"
-- ajoutées par un client (exercice sans équivalent illustré dans le
-- catalogue). Bucket public — même traitement que les photos du
-- catalogue officiel (bucket exercise-media) : ce sont des photos
-- d'exercices de sport, pas des données personnelles sensibles comme
-- les photos corporelles (voir body_photos_migration.sql, bucket privé).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('custom-exercise-photos', 'custom-exercise-photos', true, 3145728)   -- 3 Mo max par fichier
ON CONFLICT (id) DO NOTHING;

-- Chaque utilisateur ne peut uploader que dans son propre dossier ({user_id}/...)
DROP POLICY IF EXISTS "users_upload_own_exercise_photo" ON storage.objects;
CREATE POLICY "users_upload_own_exercise_photo" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'custom-exercise-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Chaque utilisateur peut supprimer ses propres fichiers
DROP POLICY IF EXISTS "users_delete_own_exercise_photo" ON storage.objects;
CREATE POLICY "users_delete_own_exercise_photo" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'custom-exercise-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Lecture publique : le bucket est public, ces photos sont servies via l'URL publique
-- (/storage/v1/object/public/...) qui ne passe pas par ces policies — inutile d'ajouter
-- une policy SELECT pour ça. On en ajoute une quand même pour l'API authentifiée
-- (list/download), au cas où un client interne l'utiliserait plus tard.
DROP POLICY IF EXISTS "anyone_reads_exercise_photos" ON storage.objects;
CREATE POLICY "anyone_reads_exercise_photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'custom-exercise-photos');

-- ══════════════════════════════════════════════════════════════
-- Migration : photos d'exercices (sous-ensemble curé, wger.de)
-- Images hébergées et servies directement par wger.de (pas copiées ici) —
-- licence CC-BY-SA par image, attribution obligatoire (auteur + lien wger),
-- voir https://wger.de/api/v2/license/. Sous-ensemble choisi à la main
-- (mouvement + équipement vérifiés) plutôt qu'un rapprochement automatique
-- par nom sur tout le catalogue, pour éviter d'associer la mauvaise image
-- à un exercice.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.exercices_catalogue ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.exercices_catalogue ADD COLUMN IF NOT EXISTS image_license text;
ALTER TABLE public.exercices_catalogue ADD COLUMN IF NOT EXISTS image_license_author text;

UPDATE public.exercices_catalogue SET
  image_url = v.url, image_license = v.license, image_license_author = v.author
FROM (VALUES
  ('0025', 'https://wger.de/media/exercise-images/192/Bench-press-1.png', 'CC-BY-SA 3.0', 'Everkinetic'),
  ('0032', 'https://wger.de/media/exercise-images/184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg', 'CC-BY-SA 4.0', 'philip'),
  ('0042', 'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png', 'CC-BY-SA 3.0', 'Everkinetic'),
  ('0586', 'https://wger.de/media/exercise-images/364/b318dde9-f5f2-489f-940a-cd864affb9e3.png', 'CC-BY-SA 4.0', 'Franpol'),
  ('0585', 'https://wger.de/media/exercise-images/369/4d621b17-f6cb-4107-97c0-9f44e9a2dbc6.webp', 'CC-BY-SA 4.0', 'wger.de'),
  ('0334', 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png', 'CC-BY-SA 3.0', 'Everkinetic'),
  ('0652', 'https://wger.de/media/exercise-images/475/b0554016-16fd-4dbe-be47-a2a17d16ae0e.jpg', 'CC-BY-SA 4.0', 'Imobard'),
  ('0662', 'https://wger.de/media/exercise-images/1551/a6a9e561-3965-45c6-9f2b-ee671e1a3a45.png', 'CC-BY-SA 4.0', 'Settebello'),
  ('0274', 'https://wger.de/media/exercise-images/91/Crunches-1.png', 'CC-BY-SA 3.0', 'wger.de'),
  ('0308', 'https://wger.de/media/exercise-images/238/2fc242d3-5bdd-4f97-99bd-678adb8c96fc.png', 'CC-BY-SA 4.0', 'cshep442'),
  ('0095', 'https://wger.de/media/exercise-images/150/Barbell-shrugs-1.png', 'CC-BY-SA 3.0', 'Everkinetic'),
  ('0406', 'https://wger.de/media/exercise-images/572/9e730259-1dcd-4b5e-b4cc-9ebc0cfda75c.webp', 'CC-BY-SA 4.0', 'AlucardEvil40'),
  ('0044', 'https://wger.de/media/exercise-images/1392/a02c9c7d-f42d-43e0-9946-1b99b014daee.png', 'CC-BY-SA 3.0', 'Everkinetic'),
  ('0687', 'https://wger.de/media/exercise-images/1193/70ca5d80-3847-4a8c-8882-c6e9e485e29e.png', 'CC-BY-SA 4.0', 'lion'),
  ('0120', 'https://wger.de/media/exercise-images/691/297d4ce1-7e9e-4adb-8f5c-7d54054be885.jpg', 'CC-BY-SA 4.0', 'anto.kreegyr'),
  ('0310', 'https://wger.de/media/exercise-images/256/b7def5bc-2352-499b-b9e5-fff741003831.png', 'CC-BY-SA 4.0', 'philip'),
  ('0027', 'https://wger.de/media/exercise-images/109/Barbell-rear-delt-row-1.png', 'CC-BY-SA 3.0', 'Everkinetic'),
  ('0861', 'https://wger.de/media/exercise-images/1117/e74255c0-67a0-4309-b78d-2d79e6ff8c11.png', 'CC-BY-SA 4.0', 'Franpol'),
  ('0117', 'https://wger.de/media/exercise-images/630/b0f0c7d8-5878-4d9e-b820-21acc013741d.webp', 'CC-BY-SA 4.0', 'wger.de')
) AS v(id, url, license, author)
WHERE public.exercices_catalogue.id = v.id;

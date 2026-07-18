-- ══════════════════════════════════════════════════════════════
-- Migration : créateur de programme v2 (semaines, bibliothèque, modèles)
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.programme_seances ADD COLUMN IF NOT EXISTS semaine integer;

CREATE TABLE IF NOT EXISTS public.exercice_bibliotheque (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          text        NOT NULL,
  type         text,
  note_default text,
  video_url    text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.exercice_bibliotheque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_full_access_bibliotheque" ON public.exercice_bibliotheque;
CREATE POLICY "coach_full_access_bibliotheque" ON public.exercice_bibliotheque
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com');

CREATE TABLE IF NOT EXISTS public.programme_templates (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          text        NOT NULL,
  objectif     text,
  type_seance  text,
  description  text,
  exercices    text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.programme_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_full_access_templates" ON public.programme_templates;
CREATE POLICY "coach_full_access_templates" ON public.programme_templates
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'sam97waelti@gmail.com');

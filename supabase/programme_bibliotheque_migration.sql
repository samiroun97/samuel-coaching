-- Bibliothèque de programmes multi-semaines (CRM > Programmes) : un programme réutilisable
-- = N semaines de séances positionnées par (semaine, jour), assignable à un ou plusieurs
-- clients avec une date de départ. Complète programme_templates (modèle d'UNE séance).
-- Les séances sont stockées en jsonb dans le programme : elles ne vivent que comme gabarit,
-- l'assignation les copie dans programme_seances (le client ne lit jamais cette table).

CREATE TABLE IF NOT EXISTS public.programme_bibliotheque (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     uuid        NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  nom          text        NOT NULL,
  objectif     text,
  nb_semaines  int         NOT NULL CHECK (nb_semaines BETWEEN 1 AND 52),
  -- [{ semaine: 0.., jour: 0..6 (lundi = 0), titre, type_seance, description, exercices, notes_libres }]
  seances      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS programme_bibliotheque_coach_idx ON public.programme_bibliotheque (coach_id);

ALTER TABLE public.programme_bibliotheque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_full_access_programmes" ON public.programme_bibliotheque;
CREATE POLICY "coach_full_access_programmes" ON public.programme_bibliotheque
  FOR ALL
  USING (coach_id = public.current_coach_id())
  WITH CHECK (coach_id = public.current_coach_id());

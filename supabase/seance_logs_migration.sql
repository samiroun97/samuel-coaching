-- ══════════════════════════════════════════════════════════════
-- Migration : logging réel des séries pendant une séance (poids/reps/RIR
-- effectivement soulevés par le client), séparé de la cible écrite par le coach
-- dans programme_seances.exercices. Base du calcul de 1RM estimé et de PR.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.seance_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  seance_id       uuid        NOT NULL REFERENCES public.programme_seances(id) ON DELETE CASCADE,
  client_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercice_index  integer     NOT NULL, -- position dans le tableau exercices[] de la séance
  exercice_nom    text        NOT NULL, -- dénormalisé : l'historique/1RM survit même si le plan est réécrit plus tard
  set_index       integer     NOT NULL,
  poids_reel      numeric,
  reps_reel       numeric,
  rir_reel        numeric,    -- reps en réserve, échelle interne (0 = échec)
  logged_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seance_id, exercice_index, set_index)
);

CREATE INDEX IF NOT EXISTS seance_logs_client_exercice_idx ON public.seance_logs (client_id, exercice_nom);

ALTER TABLE public.seance_logs ENABLE ROW LEVEL SECURITY;

-- Le client gère ses propres logs
DROP POLICY IF EXISTS "client_own_seance_logs" ON public.seance_logs;
CREATE POLICY "client_own_seance_logs" ON public.seance_logs
  FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Le coach lit les logs de ses clients (même fonction que le reste du multi-coach)
DROP POLICY IF EXISTS "coach_reads_client_seance_logs" ON public.seance_logs;
CREATE POLICY "coach_reads_client_seance_logs" ON public.seance_logs
  FOR SELECT
  USING (public.is_coach_of(client_id));

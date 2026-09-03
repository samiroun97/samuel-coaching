-- ══════════════════════════════════════════════════════════════
-- Migration : mésocycles (blocs de périodisation nommés, avec objectif et plage de
-- dates) — un client n'en a jamais qu'un seul actif à la fois en pratique. Une séance
-- envoyée pendant qu'un mésocycle est actif est taguée automatiquement (voir
-- programme_seances.mesocycle_id ci-dessous et app/crm/programmes/page.tsx).
-- Exécutée initialement en direct via l'éditeur SQL Supabase — ce fichier documente
-- l'état réel de la base pour que RLS survive à une restauration depuis les migrations.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.mesocycles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid        NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nom         text        NOT NULL,
  objectif    text,
  date_debut  date        NOT NULL,
  date_fin    date        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.mesocycles ENABLE ROW LEVEL SECURITY;

-- Le coach gère les mésocycles de ses propres clients ; le client peut aussi les lire
-- (affiché dans son espace perso, cf. components/MesocycleCard.tsx côté client).
DROP POLICY IF EXISTS "coach_manages_client_mesocycles" ON public.mesocycles;
CREATE POLICY "coach_manages_client_mesocycles" ON public.mesocycles
  FOR ALL
  USING (public.is_coach_of(client_id) OR auth.uid() = client_id)
  WITH CHECK (public.is_coach_of(client_id) OR auth.uid() = client_id);

-- Tag automatique : une séance envoyée pendant qu'un mésocycle est actif y est rattachée.
ALTER TABLE public.programme_seances
  ADD COLUMN IF NOT EXISTS mesocycle_id uuid REFERENCES public.mesocycles(id) ON DELETE SET NULL;

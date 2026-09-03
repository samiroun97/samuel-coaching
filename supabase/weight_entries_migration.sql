-- ══════════════════════════════════════════════════════════════
-- Migration : historique du poids partagé entre appareils (jusqu'ici
-- seulement en localStorage, donc invisible du coach et perdu en cas de
-- changement d'appareil) — même schéma que body_fat_entries.
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.weight_entries (
  id          text        PRIMARY KEY,
  client_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL,
  poids       numeric     NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (client_id, date)
);

CREATE INDEX IF NOT EXISTS weight_entries_client_idx ON public.weight_entries (client_id, date);

ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

-- Le client gère ses propres pesées
DROP POLICY IF EXISTS "client_own_weight_entries" ON public.weight_entries;
CREATE POLICY "client_own_weight_entries" ON public.weight_entries
  FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Le coach lit les pesées de ses clients (même fonction que le reste du multi-coach)
DROP POLICY IF EXISTS "coach_reads_client_weight_entries" ON public.weight_entries;
CREATE POLICY "coach_reads_client_weight_entries" ON public.weight_entries
  FOR SELECT
  USING (public.is_coach_of(client_id));

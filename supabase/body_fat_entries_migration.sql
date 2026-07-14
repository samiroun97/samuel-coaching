-- ══════════════════════════════════════════════════════════════
-- Migration : historique body fat partagé entre appareils
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.body_fat_entries (
  id             text        PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           timestamptz NOT NULL,
  body_fat       numeric     NOT NULL,
  note           text,
  points_forts   text,
  points_faibles text,
  conseils       text,
  shared         boolean     DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.body_fat_entries ENABLE ROW LEVEL SECURITY;

-- Chaque client ne voit / modifie que ses propres entrées
DROP POLICY IF EXISTS "users_own_bf_entries" ON public.body_fat_entries;
CREATE POLICY "users_own_bf_entries" ON public.body_fat_entries
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Le coach (sam97waelti@gmail.com) voit uniquement les entrées partagées
DROP POLICY IF EXISTS "coach_sees_shared_bf" ON public.body_fat_entries;
CREATE POLICY "coach_sees_shared_bf" ON public.body_fat_entries
  FOR SELECT
  USING (
    shared = true
    AND (auth.jwt() ->> 'email') = 'sam97waelti@gmail.com'
  );

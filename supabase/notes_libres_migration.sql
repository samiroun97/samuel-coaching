-- ══════════════════════════════════════════════════════════════
-- Migration : notes libres sur une séance (points en texte libre,
-- pas forcément des exercices — ex: "bien s'hydrater", "focus respiration"…)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.programme_seances ADD COLUMN IF NOT EXISTS notes_libres text;

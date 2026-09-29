-- ══════════════════════════════════════════════════════════════
-- Index sur les recherches les plus fréquentes de l'app (alertes Supabase
-- « unindexed foreign keys », 29.09.2026). Sans effet visible à 10 utilisateurs,
-- évite le ralentissement quand la plateforme grandit.
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS seance_logs_client_exercice ON public.seance_logs (client_id, exercice_nom, logged_at DESC);
CREATE INDEX IF NOT EXISTS seance_logs_seance ON public.seance_logs (seance_id);
CREATE INDEX IF NOT EXISTS programme_seances_client ON public.programme_seances (client_id, date_prevue);
CREATE INDEX IF NOT EXISTS programme_seances_mesocycle ON public.programme_seances (mesocycle_id);
CREATE INDEX IF NOT EXISTS coach_clients_client ON public.coach_clients (client_id);
CREATE INDEX IF NOT EXISTS coach_clients_coach ON public.coach_clients (coach_id);
CREATE INDEX IF NOT EXISTS messages_to_email ON public.messages (to_email, created_at);
CREATE INDEX IF NOT EXISTS messages_from_email ON public.messages (from_email, created_at);
CREATE INDEX IF NOT EXISTS body_photos_user ON public.body_photos (user_id);
CREATE INDEX IF NOT EXISTS body_fat_entries_user ON public.body_fat_entries (user_id, date);
CREATE INDEX IF NOT EXISTS coach_notes_client ON public.coach_notes (client_id);
CREATE INDEX IF NOT EXISTS mesocycles_client ON public.mesocycles (client_id, date_fin);
CREATE INDEX IF NOT EXISTS invoices_coach ON public.invoices (coach_id, issue_date);
CREATE INDEX IF NOT EXISTS client_packs_coach ON public.client_packs (coach_id);

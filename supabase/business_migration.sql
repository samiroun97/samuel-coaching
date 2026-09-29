-- ══════════════════════════════════════════════════════════════
-- Migration : espace Business du coach (phase 1, sans paiement en ligne)
-- Offres, packs de séances, carnet de séances, factures (QR-facture), paiements.
-- ══════════════════════════════════════════════════════════════

-- Coach propriétaire de la ligne = le coach de l'utilisateur connecté.
CREATE OR REPLACE FUNCTION public.my_coach_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.coaches WHERE profile_id = auth.uid() LIMIT 1
$$;

-- Réglages de facturation (coordonnées imprimées sur les factures et la QR-facture).
CREATE TABLE IF NOT EXISTS public.coach_billing_settings (
  coach_id            uuid PRIMARY KEY REFERENCES public.coaches(id) ON DELETE CASCADE,
  legal_name          text,
  street              text,
  building_number     text,
  zip                 text,
  city                text,
  country             text NOT NULL DEFAULT 'CH',
  iban                text,
  email               text,
  phone               text,
  vat_number          text,             -- NULL = non assujetti à la TVA
  vat_rate            numeric,          -- en %, ex. 8.1
  invoice_prefix      text NOT NULL DEFAULT 'F',
  next_invoice_number integer NOT NULL DEFAULT 1,
  payment_terms_days  integer NOT NULL DEFAULT 30,
  footer_note         text,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Catalogue d'offres du coach.
CREATE TABLE IF NOT EXISTS public.coach_offers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id       uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  name           text NOT NULL,
  kind           text NOT NULL CHECK (kind IN ('seance', 'pack', 'mensuel', 'programme', 'autre')),
  price_chf      numeric NOT NULL CHECK (price_chf >= 0),
  sessions_count integer CHECK (sessions_count > 0),     -- pour un pack
  validity_days  integer CHECK (validity_days > 0),      -- validité d'un pack
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Packs vendus à un client (crédit de séances).
CREATE TABLE IF NOT EXISTS public.client_packs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id       uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offer_id       uuid REFERENCES public.coach_offers(id) ON DELETE SET NULL,
  label          text NOT NULL,
  sessions_total integer NOT NULL CHECK (sessions_total > 0),
  price_chf      numeric NOT NULL DEFAULT 0,
  purchased_at   date NOT NULL DEFAULT current_date,
  expires_at     date,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Carnet de séances (présentiel / visio). Une séance "effectuee" ou "absent" (non excusé)
-- décompte le pack auquel elle est rattachée ; "annulee" ne décompte pas.
CREATE TABLE IF NOT EXISTS public.coach_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id      uuid REFERENCES public.client_packs(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 60,
  status       text NOT NULL DEFAULT 'planifiee' CHECK (status IN ('planifiee', 'effectuee', 'absent', 'annulee')),
  price_chf    numeric,          -- séance à l'unité (hors pack)
  location     text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Factures. Coordonnées vendeur/acheteur figées à l'émission (seller/buyer) : une facture
-- doit rester identique et être conservée 10 ans, même si le client supprime son compte.
CREATE TABLE IF NOT EXISTS public.invoices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  number      text NOT NULL,
  issue_date  date NOT NULL DEFAULT current_date,
  due_date    date,
  status      text NOT NULL DEFAULT 'emise' CHECK (status IN ('emise', 'payee', 'annulee')),
  items       jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ label, qty, unit_price }]
  total_chf   numeric NOT NULL DEFAULT 0,
  vat_rate    numeric,
  seller      jsonb NOT NULL DEFAULT '{}'::jsonb,
  buyer       jsonb NOT NULL DEFAULT '{}'::jsonb,
  reference   text,
  notes       text,
  pack_id     uuid REFERENCES public.client_packs(id) ON DELETE SET NULL,
  paid_at     date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, number)
);

-- Paiements encaissés (manuels en phase 1 : espèces, TWINT, virement…).
CREATE TABLE IF NOT EXISTS public.coach_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invoice_id  uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount_chf  numeric NOT NULL CHECK (amount_chf > 0),
  method      text NOT NULL CHECK (method IN ('especes', 'twint', 'virement', 'carte', 'autre')),
  paid_at     date NOT NULL DEFAULT current_date,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_sessions_coach_date ON public.coach_sessions (coach_id, scheduled_at);
CREATE INDEX IF NOT EXISTS coach_sessions_pack ON public.coach_sessions (pack_id);
CREATE INDEX IF NOT EXISTS client_packs_client ON public.client_packs (client_id);
CREATE INDEX IF NOT EXISTS invoices_client ON public.invoices (client_id);
CREATE INDEX IF NOT EXISTS coach_payments_coach_date ON public.coach_payments (coach_id, paid_at);

-- ── RLS : le coach gère ses lignes (et ne peut viser que SES clients) ; le client lit les siennes.
ALTER TABLE public.coach_billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_offers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_packs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_payments         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_own_billing_settings" ON public.coach_billing_settings FOR ALL
  USING (coach_id = public.my_coach_id()) WITH CHECK (coach_id = public.my_coach_id());

CREATE POLICY "coach_own_offers" ON public.coach_offers FOR ALL
  USING (coach_id = public.my_coach_id()) WITH CHECK (coach_id = public.my_coach_id());

CREATE POLICY "coach_own_packs" ON public.client_packs FOR ALL
  USING (coach_id = public.my_coach_id())
  WITH CHECK (coach_id = public.my_coach_id() AND public.is_coach_of(client_id));
CREATE POLICY "client_reads_own_packs" ON public.client_packs FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "coach_own_sessions" ON public.coach_sessions FOR ALL
  USING (coach_id = public.my_coach_id())
  WITH CHECK (coach_id = public.my_coach_id() AND public.is_coach_of(client_id));
CREATE POLICY "client_reads_own_sessions" ON public.coach_sessions FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "coach_own_invoices" ON public.invoices FOR ALL
  USING (coach_id = public.my_coach_id())
  WITH CHECK (coach_id = public.my_coach_id() AND (client_id IS NULL OR public.is_coach_of(client_id)));
CREATE POLICY "client_reads_own_invoices" ON public.invoices FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "coach_own_payments" ON public.coach_payments FOR ALL
  USING (coach_id = public.my_coach_id())
  WITH CHECK (coach_id = public.my_coach_id() AND (client_id IS NULL OR public.is_coach_of(client_id)));
CREATE POLICY "client_reads_own_payments" ON public.coach_payments FOR SELECT
  USING (client_id = auth.uid());

-- Numéro de facture suivant, attribué de façon atomique (pas de doublon si deux factures
-- sont créées en même temps). Format : PREFIXE-AAAA-0001.
CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_coach uuid := public.my_coach_id();
  v_prefix text;
  v_n integer;
BEGIN
  IF v_coach IS NULL THEN RAISE EXCEPTION 'Réservé aux coachs'; END IF;
  INSERT INTO public.coach_billing_settings (coach_id) VALUES (v_coach) ON CONFLICT (coach_id) DO NOTHING;
  UPDATE public.coach_billing_settings
     SET next_invoice_number = next_invoice_number + 1
   WHERE coach_id = v_coach
  RETURNING invoice_prefix, next_invoice_number - 1 INTO v_prefix, v_n;
  RETURN v_prefix || '-' || to_char(current_date, 'YYYY') || '-' || lpad(v_n::text, 4, '0');
END $$;

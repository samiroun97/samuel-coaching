"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import type { BillingSettings, ClientPack, CoachSession, Invoice, Offer, Payment } from "@/lib/business";
import type { Entitlement } from "@/lib/plans";

export type BizClient = { id: string; prenom: string; nom: string; email: string };

export type BusinessData = {
  coachId: string;
  clients: BizClient[];
  offers: Offer[];
  packs: ClientPack[];
  sessions: CoachSession[];
  invoices: Invoice[];
  payments: Payment[];
  settings: BillingSettings | null;
  entitlement: Entitlement | null;
};

// Chargement de tout l'espace Business du coach connecté (RLS : uniquement ses lignes).
export function useBusinessData() {
  const [data, setData] = useState<BusinessData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: coach } = await supabase.from("coaches").select("id").eq("profile_id", user.id).maybeSingle();
    if (!coach) { setError("Espace réservé aux coachs."); return; }

    const [links, offers, packs, sessions, invoices, payments, settings, me] = await Promise.all([
      supabase.from("coach_clients").select("client_id").eq("coach_id", coach.id),
      supabase.from("coach_offers").select("*").order("created_at"),
      supabase.from("client_packs").select("*").order("purchased_at", { ascending: false }),
      supabase.from("coach_sessions").select("*").order("scheduled_at", { ascending: false }),
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("coach_payments").select("*").order("paid_at", { ascending: false }),
      supabase.from("coach_billing_settings").select("*").eq("coach_id", coach.id).maybeSingle(),
      apiPost("/api/billing/me", {}).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    const firstError = [offers, packs, sessions, invoices, payments].find(r => r.error)?.error;
    if (firstError) { setError(firstError.message); return; }

    const ids = (links.data ?? []).map(l => l.client_id);
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id,prenom,nom,email").in("id", ids)
      : { data: [] as BizClient[] };

    setData({
      coachId: coach.id,
      clients: ((profiles ?? []) as BizClient[]).sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)),
      offers: (offers.data ?? []) as Offer[],
      packs: (packs.data ?? []) as ClientPack[],
      sessions: (sessions.data ?? []) as CoachSession[],
      invoices: (invoices.data ?? []) as Invoice[],
      payments: (payments.data ?? []) as Payment[],
      settings: (settings.data ?? null) as BillingSettings | null,
      entitlement: me?.entitlement ?? null,
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial asynchrone
    load().catch(e => setError(e instanceof Error ? e.message : "Erreur de chargement"));
  }, [load]);

  return { data, error, reload: load };
}

export const clientName = (clients: BizClient[], id: string | null) => {
  if (!id) return "Client supprimé";
  const c = clients.find(x => x.id === id);
  return c ? `${c.prenom} ${c.nom}`.trim() || c.email : "Client";
};

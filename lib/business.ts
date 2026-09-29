// Espace Business du coach (phase 1) : types des tables business_migration.sql et petits
// calculs partagés (solde d'un pack, totaux, formats). Paiement en ligne = phase 2 (Stripe).

export type OfferKind = "seance" | "pack" | "mensuel" | "programme" | "autre";
export type SessionStatus = "planifiee" | "effectuee" | "absent" | "annulee";
export type InvoiceStatus = "emise" | "payee" | "annulee";
export type PaymentMethod = "especes" | "twint" | "virement" | "carte" | "autre";

export type BillingSettings = {
  coach_id: string; legal_name: string | null; street: string | null; building_number: string | null;
  zip: string | null; city: string | null; country: string; iban: string | null; email: string | null;
  phone: string | null; vat_number: string | null; vat_rate: number | null; invoice_prefix: string;
  next_invoice_number: number; payment_terms_days: number; footer_note: string | null;
};
export type Offer = {
  id: string; coach_id: string; name: string; kind: OfferKind; price_chf: number;
  sessions_count: number | null; validity_days: number | null; active: boolean; created_at: string;
};
export type ClientPack = {
  id: string; coach_id: string; client_id: string; offer_id: string | null; label: string;
  sessions_total: number; price_chf: number; purchased_at: string; expires_at: string | null; created_at: string;
};
export type CoachSession = {
  id: string; coach_id: string; client_id: string; pack_id: string | null; scheduled_at: string;
  duration_min: number; status: SessionStatus; price_chf: number | null; location: string | null;
  notes: string | null; created_at: string;
};
export type InvoiceItem = { label: string; qty: number; unit_price: number };
export type Party = { name: string; street?: string; building_number?: string; zip?: string; city?: string; country?: string; email?: string; iban?: string; vat_number?: string; phone?: string };
export type Invoice = {
  id: string; coach_id: string; client_id: string | null; number: string; issue_date: string;
  due_date: string | null; status: InvoiceStatus; items: InvoiceItem[]; total_chf: number;
  vat_rate: number | null; seller: Party; buyer: Party; reference: string | null; notes: string | null;
  pack_id: string | null; paid_at: string | null; created_at: string;
};
export type Payment = {
  id: string; coach_id: string; client_id: string | null; invoice_id: string | null; amount_chf: number;
  method: PaymentMethod; paid_at: string; note: string | null; created_at: string;
};

export const OFFER_KIND_LABEL: Record<OfferKind, string> = {
  seance: "Séance à l'unité", pack: "Pack de séances", mensuel: "Suivi mensuel", programme: "Programme", autre: "Autre",
};
export const SESSION_STATUS_CFG: Record<SessionStatus, { label: string; color: string }> = {
  planifiee: { label: "Planifiée", color: "#8fa8d8" },
  effectuee: { label: "Effectuée", color: "#7eb8a0" },
  absent:    { label: "Absent",    color: "#e0a070" },
  annulee:   { label: "Annulée",   color: "#9a9a9a" },
};
export const INVOICE_STATUS_CFG: Record<InvoiceStatus, { label: string; color: string }> = {
  emise:   { label: "À payer", color: "#c9a84c" },
  payee:   { label: "Payée",   color: "#7eb8a0" },
  annulee: { label: "Annulée", color: "#9a9a9a" },
};
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  especes: "Espèces", twint: "TWINT", virement: "Virement", carte: "Carte", autre: "Autre",
};

// Une séance effectuée ou manquée sans excuse ("absent") décompte le pack ; annulée, non.
export const CONSUMES_PACK: SessionStatus[] = ["effectuee", "absent"];

export function packUsage(pack: ClientPack, sessions: CoachSession[]) {
  const used = sessions.filter(s => s.pack_id === pack.id && CONSUMES_PACK.includes(s.status)).length;
  const planned = sessions.filter(s => s.pack_id === pack.id && s.status === "planifiee").length;
  const expired = !!pack.expires_at && pack.expires_at < todayISO();
  return { used, planned, remaining: Math.max(0, pack.sessions_total - used), expired };
}

export const invoiceTotal = (items: InvoiceItem[]) =>
  Math.round(items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unit_price) || 0), 0) * 100) / 100;

export const isOverdue = (inv: Invoice) => inv.status === "emise" && !!inv.due_date && inv.due_date < todayISO();

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDaysISO(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const chf = (n: number) =>
  `${(Math.round(n * 100) / 100).toLocaleString("fr-CH", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} CHF`;
export const fmtDay = (iso: string) =>
  new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-CH", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Export CSV (séparateur ; — ouvert tel quel par Excel en Suisse romande).
export function toCsv(rows: (string | number | null)[][]) {
  return "﻿" + rows.map(r => r.map(v => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(";")).join("\n");
}
export function downloadFile(name: string, content: string | Blob, type = "text/csv;charset=utf-8") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

"use client";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import { addDaysISO, downloadFile, invoiceTotal, todayISO, type Invoice, type InvoiceItem, type Party, type PaymentMethod } from "@/lib/business";
import type { BusinessData } from "@/components/business/useBusinessData";

// Crée une facture numérotée (numéro attribué côté base, sans doublon) avec les coordonnées
// du coach et du client figées au moment de l'émission.
export async function createInvoice(data: BusinessData, p: {
  clientId: string; items: InvoiceItem[]; buyer: Party; issueDate?: string; dueDate?: string | null;
  notes?: string | null; packId?: string | null;
}): Promise<Invoice> {
  const { data: number, error: numErr } = await supabase.rpc("next_invoice_number");
  if (numErr || !number) throw new Error(numErr?.message ?? "Numéro de facture indisponible");
  const s = data.settings;
  const issue = p.issueDate ?? todayISO();
  const seller: Party = {
    name: s?.legal_name ?? "", street: s?.street ?? "", building_number: s?.building_number ?? "",
    zip: s?.zip ?? "", city: s?.city ?? "", country: s?.country ?? "CH", email: s?.email ?? "",
    phone: s?.phone ?? "", iban: s?.iban ?? "", vat_number: s?.vat_number ?? "",
  };
  const notes = [p.notes, s?.footer_note].filter(Boolean).join("\n\n") || null;
  const { data: inv, error } = await supabase.from("invoices").insert({
    coach_id: data.coachId, client_id: p.clientId, number, issue_date: issue,
    due_date: p.dueDate === undefined ? addDaysISO(issue, s?.payment_terms_days ?? 30) : p.dueDate,
    status: "emise", items: p.items, total_chf: invoiceTotal(p.items),
    vat_rate: s?.vat_number ? s?.vat_rate ?? null : null,
    seller, buyer: p.buyer, notes, pack_id: p.packId ?? null,
  }).select().single();
  if (error) throw new Error(error.message);
  return inv as Invoice;
}

// Encaissement : enregistre le paiement et, s'il couvre la facture, la marque payée.
export async function recordPayment(data: BusinessData, p: {
  clientId: string | null; amount: number; method: PaymentMethod; paidAt: string; invoice?: Invoice | null; note?: string | null;
}) {
  const { error } = await supabase.from("coach_payments").insert({
    coach_id: data.coachId, client_id: p.clientId, invoice_id: p.invoice?.id ?? null,
    amount_chf: p.amount, method: p.method, paid_at: p.paidAt, note: p.note ?? null,
  });
  if (error) throw new Error(error.message);
  if (p.invoice) {
    const paidSoFar = data.payments.filter(x => x.invoice_id === p.invoice!.id).reduce((s, x) => s + Number(x.amount_chf), 0) + p.amount;
    if (paidSoFar + 0.005 >= Number(p.invoice.total_chf)) {
      const { error: e2 } = await supabase.from("invoices").update({ status: "payee", paid_at: p.paidAt }).eq("id", p.invoice.id);
      if (e2) throw new Error(e2.message);
    }
  }
}

export async function downloadInvoicePdf(inv: Pick<Invoice, "id" | "number">) {
  const res = await apiPost("/api/business/invoice-pdf", { invoiceId: inv.id }, 60000);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "PDF indisponible");
  downloadFile(`facture-${inv.number}.pdf`, await res.blob());
}

// Dernière adresse de facturation connue pour ce client (pré-remplissage).
export function lastBuyerFor(data: BusinessData, clientId: string): Party | null {
  const inv = data.invoices.find(i => i.client_id === clientId);
  return inv?.buyer ?? null;
}

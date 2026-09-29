"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  INVOICE_STATUS_CFG, PAYMENT_METHOD_LABEL, chf, fmtDay, invoiceTotal, isOverdue, todayISO,
  type Invoice, type InvoiceItem, type Party, type PaymentMethod,
} from "@/lib/business";
import { createInvoice, downloadInvoicePdf, lastBuyerFor, recordPayment } from "@/components/business/actions";
import { clientName, type BusinessData } from "@/components/business/useBusinessData";
import { ClientSelect, Empty, Modal, Pill, Section, btnGhost, btnGold, inp, lbl } from "@/components/business/ui";

type Props = { data: BusinessData; reload: () => Promise<void>; onOpenSettings: () => void };

export function InvoicesTab({ data, reload, onOpenSettings }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<"all" | "emise" | "payee">("all");

  const s = data.settings;
  const settingsIncomplete = !s?.legal_name || !s?.street || !s?.zip || !s?.city || !s?.iban;
  const list = data.invoices.filter(i => filter === "all" || i.status === filter);

  const pdf = async (inv: Invoice) => {
    setBusy(inv.id); setErr("");
    try { await downloadInvoicePdf(inv); } catch (e) { setErr(e instanceof Error ? e.message : "PDF indisponible"); }
    setBusy(null);
  };
  const cancel = async (inv: Invoice) => {
    if (!window.confirm(`Annuler la facture ${inv.number} ? Elle reste archivée (obligation de conservation) avec la mention « annulée ».`)) return;
    await supabase.from("invoices").update({ status: "annulee" }).eq("id", inv.id);
    await reload();
  };

  return (
    <div className="flex flex-col gap-5">
      {settingsIncomplete && (
        <div className="rounded-2xl border border-[#e0a070]/40 bg-[#e0a070]/8 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-[0.78rem] text-[var(--t-text-70)]">Complète tes coordonnées et ton IBAN pour que tes factures affichent la QR-facture.</p>
          <button onClick={onOpenSettings} className={btnGhost}>Réglages</button>
        </div>
      )}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <button onClick={() => setShowNew(true)} className={btnGold} disabled={!data.clients.length}>+ Facture</button>
        <div className="flex rounded-xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] p-1">
          {([["all", "Toutes"], ["emise", "À payer"], ["payee", "Payées"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-[0.66rem] font-semibold ${filter === k ? "bg-[#c9a84c]/15 text-[#a8893a]" : "text-[var(--t-text-40)]"}`}>{l}</button>
          ))}
        </div>
      </div>
      {err && <p className="text-xs text-[#e07070]">{err}</p>}

      <Section title="Factures">
        {list.length === 0 ? <Empty text="Aucune facture."/> : list.map(inv => {
          const overdue = isOverdue(inv);
          return (
            <div key={inv.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b border-[var(--t-border-soft)] last:border-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[var(--t-text)]">{inv.number}</p>
                  <Pill {...(overdue ? { label: "En retard", color: "#e07070" } : INVOICE_STATUS_CFG[inv.status])}/>
                </div>
                <p className="text-[0.72rem] text-[var(--t-text-50)] truncate">
                  {clientName(data.clients, inv.client_id) === "Client" ? inv.buyer?.name : clientName(data.clients, inv.client_id)} · {fmtDay(inv.issue_date)}
                  {inv.status === "emise" && inv.due_date ? ` · échéance ${fmtDay(inv.due_date)}` : ""}
                  {inv.status === "payee" && inv.paid_at ? ` · payée le ${fmtDay(inv.paid_at)}` : ""}
                </p>
              </div>
              <p className="text-sm font-bold text-[var(--t-text)] shrink-0">{chf(Number(inv.total_chf))}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => pdf(inv)} disabled={busy === inv.id} className={btnGhost}>{busy === inv.id ? "…" : "PDF"}</button>
                {inv.status === "emise" && <button onClick={() => setPaying(inv)} className={btnGhost}>Encaisser</button>}
                {inv.status === "emise" && <button onClick={() => cancel(inv)} className="px-2 text-[0.68rem] text-[var(--t-text-30)] hover:text-[#e07070]">Annuler</button>}
              </div>
            </div>
          );
        })}
      </Section>

      {showNew && <NewInvoiceModal data={data} onClose={() => setShowNew(false)} onSaved={reload}/>}
      {paying && <PayInvoiceModal data={data} invoice={paying} onClose={() => setPaying(null)} onSaved={reload}/>}
    </div>
  );
}

function NewInvoiceModal({ data, onClose, onSaved }: { data: BusinessData; onClose: () => void; onSaved: () => Promise<void> }) {
  const [clientId, setClientId] = useState("");
  const [buyer, setBuyer] = useState<Party>({ name: "" });
  const [items, setItems] = useState<InvoiceItem[]>([{ label: "", qty: 1, unit_price: 0 }]);
  const [issueDate, setIssueDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Séances à l'unité effectuées de ce client, à ajouter en un clic.
  const unitSessions = data.sessions.filter(s => s.client_id === clientId && !s.pack_id && s.status === "effectuee" && s.price_chf != null);

  const pickClient = (id: string) => {
    setClientId(id);
    const c = data.clients.find(x => x.id === id);
    setBuyer(lastBuyerFor(data, id) ?? { name: `${c?.prenom ?? ""} ${c?.nom ?? ""}`.trim(), email: c?.email ?? "" });
  };
  const setItem = (i: number, patch: Partial<InvoiceItem>) => setItems(prev => prev.map((it, j) => j === i ? { ...it, ...patch } : it));
  const addOffer = (offerId: string) => {
    const o = data.offers.find(x => x.id === offerId);
    if (!o) return;
    setItems(prev => [...prev.filter(it => it.label || it.unit_price), { label: o.name, qty: 1, unit_price: Number(o.price_chf) }]);
  };
  const addUnitSessions = () => {
    const lines = unitSessions.map(s => ({ label: `Séance du ${fmtDay(s.scheduled_at.slice(0, 10))}`, qty: 1, unit_price: Number(s.price_chf) }));
    setItems(prev => [...prev.filter(it => it.label || it.unit_price), ...lines]);
  };

  const save = async () => {
    if (!clientId) { setErr("Choisis un client."); return; }
    const clean = items.filter(it => it.label.trim() && Number(it.qty) > 0);
    if (!clean.length) { setErr("Ajoute au moins une prestation."); return; }
    if (!buyer.name?.trim()) { setErr("Nom du destinataire manquant."); return; }
    setSaving(true); setErr("");
    try {
      await createInvoice(data, { clientId, items: clean.map(it => ({ ...it, qty: Number(it.qty), unit_price: Number(it.unit_price) })), buyer, issueDate, notes: notes || null });
      await onSaved(); onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    setSaving(false);
  };

  return (
    <Modal title="Nouvelle facture" onClose={onClose}>
      <div><label className={lbl}>Client</label><ClientSelect clients={data.clients} value={clientId} onChange={pickClient}/></div>
      {clientId && (
        <>
          <div>
            <label className={lbl}>Adresse de facturation (pour la QR-facture)</label>
            <div className="grid grid-cols-4 gap-2">
              <input className={`${inp} col-span-4`} placeholder="Nom" value={buyer.name ?? ""} onChange={e => setBuyer(b => ({ ...b, name: e.target.value }))}/>
              <input className={`${inp} col-span-3`} placeholder="Rue" value={buyer.street ?? ""} onChange={e => setBuyer(b => ({ ...b, street: e.target.value }))}/>
              <input className={inp} placeholder="N°" value={buyer.building_number ?? ""} onChange={e => setBuyer(b => ({ ...b, building_number: e.target.value }))}/>
              <input className={inp} placeholder="NPA" value={buyer.zip ?? ""} onChange={e => setBuyer(b => ({ ...b, zip: e.target.value }))}/>
              <input className={`${inp} col-span-3`} placeholder="Localité" value={buyer.city ?? ""} onChange={e => setBuyer(b => ({ ...b, city: e.target.value }))}/>
            </div>
          </div>

          <div>
            <label className={lbl}>Prestations</label>
            <div className="flex flex-col gap-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_3.5rem_5.5rem_1.5rem] gap-2 items-center">
                  <input className={inp} placeholder="Prestation" value={it.label} onChange={e => setItem(i, { label: e.target.value })}/>
                  <input type="number" className={inp} value={it.qty} onChange={e => setItem(i, { qty: Number(e.target.value) })}/>
                  <input inputMode="decimal" className={inp} placeholder="Prix" value={it.unit_price || ""} onChange={e => setItem(i, { unit_price: Number(e.target.value.replace(",", ".")) || 0 })}/>
                  <button onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} aria-label="Retirer" className="text-[var(--t-text-30)] hover:text-[#e07070] text-sm">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              <button onClick={() => setItems(prev => [...prev, { label: "", qty: 1, unit_price: 0 }])} className={btnGhost}>+ Ligne</button>
              {data.offers.filter(o => o.active).length > 0 && (
                <select className={`${btnGhost} bg-transparent`} value="" onChange={e => addOffer(e.target.value)}>
                  <option value="">+ Depuis une offre…</option>
                  {data.offers.filter(o => o.active).map(o => <option key={o.id} value={o.id}>{o.name} — {chf(Number(o.price_chf))}</option>)}
                </select>
              )}
              {unitSessions.length > 0 && <button onClick={addUnitSessions} className={btnGhost}>+ {unitSessions.length} séance{unitSessions.length > 1 ? "s" : ""} à l&apos;unité</button>}
            </div>
            <p className="text-right text-sm font-bold text-[var(--t-text)] mt-3">Total : {chf(invoiceTotal(items))}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Date</label><input type="date" className={inp} value={issueDate} onChange={e => setIssueDate(e.target.value)}/></div>
            <div><label className={lbl}>Échéance</label><p className="text-[0.8rem] text-[var(--t-text-60)] py-2.5">{data.settings?.payment_terms_days ?? 30} jours</p></div>
          </div>
          <div><label className={lbl}>Message (optionnel)</label><textarea rows={2} className={`${inp} resize-none`} value={notes} onChange={e => setNotes(e.target.value)}/></div>
        </>
      )}
      {err && <p className="text-xs text-[#e07070]">{err}</p>}
      <button onClick={save} disabled={saving || !clientId} className={btnGold}>{saving ? "…" : "Créer la facture"}</button>
    </Modal>
  );
}

export function PayInvoiceModal({ data, invoice, onClose, onSaved }: { data: BusinessData; invoice: Invoice | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const alreadyPaid = invoice ? data.payments.filter(p => p.invoice_id === invoice.id).reduce((s, p) => s + Number(p.amount_chf), 0) : 0;
  const [clientId, setClientId] = useState(invoice?.client_id ?? "");
  const [amount, setAmount] = useState(invoice ? String(Math.max(0, Number(invoice.total_chf) - alreadyPaid)) : "");
  const [method, setMethod] = useState<PaymentMethod>("twint");
  const [paidAt, setPaidAt] = useState(todayISO());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    const a = parseFloat(amount.replace(",", "."));
    if (!a || a <= 0) { setErr("Montant invalide."); return; }
    setSaving(true); setErr("");
    try {
      await recordPayment(data, { clientId: clientId || null, amount: a, method, paidAt, invoice, note: note || null });
      await onSaved(); onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    setSaving(false);
  };

  return (
    <Modal title={invoice ? `Encaisser ${invoice.number}` : "Enregistrer un paiement"} onClose={onClose}>
      {!invoice && <div><label className={lbl}>Client</label><ClientSelect clients={data.clients} value={clientId} onChange={setClientId}/></div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Montant (CHF)</label><input inputMode="decimal" className={inp} value={amount} onChange={e => setAmount(e.target.value)}/></div>
        <div><label className={lbl}>Date</label><input type="date" className={inp} value={paidAt} onChange={e => setPaidAt(e.target.value)}/></div>
      </div>
      <div>
        <label className={lbl}>Moyen de paiement</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map(m => (
            <button key={m} onClick={() => setMethod(m)}
              className={`px-3 py-1.5 rounded-lg border text-[0.72rem] font-semibold ${method === m ? "border-[#c9a84c] bg-[#c9a84c]/12 text-[#a8893a]" : "border-[var(--t-border)] text-[var(--t-text-50)]"}`}>
              {PAYMENT_METHOD_LABEL[m]}
            </button>
          ))}
        </div>
      </div>
      <div><label className={lbl}>Note (optionnel)</label><input className={inp} value={note} onChange={e => setNote(e.target.value)}/></div>
      {err && <p className="text-xs text-[#e07070]">{err}</p>}
      <button onClick={save} disabled={saving} className={btnGold}>{saving ? "…" : "Enregistrer le paiement"}</button>
    </Modal>
  );
}

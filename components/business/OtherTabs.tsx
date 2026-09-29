"use client";
import { useState } from "react";
import { isIBANValid } from "swissqrbill/utils";
import { supabase } from "@/lib/supabase";
import { OFFER_KIND_LABEL, PAYMENT_METHOD_LABEL, chf, fmtDay, type BillingSettings, type Offer, type OfferKind } from "@/lib/business";
import { clientName, type BusinessData } from "@/components/business/useBusinessData";
import { PayInvoiceModal } from "@/components/business/InvoicesTab";
import { Empty, Modal, Pill, Section, btnGhost, btnGold, card, inp, lbl } from "@/components/business/ui";

type Props = { data: BusinessData; reload: () => Promise<void> };

// ── Offres ──────────────────────────────────────────────────────────────────────────────
export function OffersTab({ data, reload }: Props) {
  const [editing, setEditing] = useState<Offer | "new" | null>(null);
  const toggle = async (o: Offer) => { await supabase.from("coach_offers").update({ active: !o.active }).eq("id", o.id); await reload(); };

  return (
    <div className="flex flex-col gap-5">
      <div><button onClick={() => setEditing("new")} className={btnGold}>Offre</button></div>
      <Section title="Mes offres">
        {data.offers.length === 0 ? <Empty text="Aucune offre. Crée par exemple « Séance à l'unité », « Pack 10 séances », « Suivi mensuel »."/> :
          data.offers.map(o => (
            <div key={o.id} className={`px-4 py-3 flex items-center gap-3 border-b border-[var(--t-border-soft)] last:border-0 ${o.active ? "" : "opacity-50"}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[var(--t-text)]">{o.name}</p>
                  <Pill label={OFFER_KIND_LABEL[o.kind]} color="#8fa8d8"/>
                  {!o.active && <Pill label="Archivée" color="#9a9a9a"/>}
                </div>
                <p className="text-[0.72rem] text-[var(--t-text-50)]">
                  {chf(Number(o.price_chf))}{o.kind === "mensuel" ? " / mois" : ""}
                  {o.sessions_count ? ` · ${o.sessions_count} séances` : ""}{o.validity_days ? ` · valable ${o.validity_days} jours` : ""}
                </p>
              </div>
              <button onClick={() => setEditing(o)} className={btnGhost}>Modifier</button>
              <button onClick={() => toggle(o)} className="px-2 text-[0.68rem] text-[var(--t-text-40)] hover:text-[var(--t-text)]">{o.active ? "Archiver" : "Réactiver"}</button>
            </div>
          ))}
      </Section>
      {editing && <OfferModal data={data} offer={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={reload}/>}
    </div>
  );
}

function OfferModal({ data, offer, onClose, onSaved }: { data: BusinessData; offer: Offer | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(offer?.name ?? "");
  const [kind, setKind] = useState<OfferKind>(offer?.kind ?? "pack");
  const [price, setPrice] = useState(offer ? String(offer.price_chf) : "");
  const [count, setCount] = useState(offer?.sessions_count ? String(offer.sessions_count) : "10");
  const [validity, setValidity] = useState(offer?.validity_days ? String(offer.validity_days) : "120");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const p = parseFloat(price.replace(",", "."));
    if (!name.trim() || !(p >= 0)) { setErr("Nom et prix requis."); return; }
    setSaving(true); setErr("");
    const row = {
      coach_id: data.coachId, name: name.trim(), kind, price_chf: p,
      sessions_count: kind === "pack" ? parseInt(count) || null : null,
      validity_days: kind === "pack" ? parseInt(validity) || null : null,
    };
    const { error } = offer
      ? await supabase.from("coach_offers").update(row).eq("id", offer.id)
      : await supabase.from("coach_offers").insert(row);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    await onSaved(); onClose();
  };

  return (
    <Modal title={offer ? "Modifier l'offre" : "Nouvelle offre"} onClose={onClose}>
      <div><label className={lbl}>Nom</label><input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Pack 10 séances"/></div>
      <div>
        <label className={lbl}>Type</label>
        <select className={inp} value={kind} onChange={e => setKind(e.target.value as OfferKind)}>
          {(Object.keys(OFFER_KIND_LABEL) as OfferKind[]).map(k => <option key={k} value={k}>{OFFER_KIND_LABEL[k]}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>Prix (CHF)</label><input inputMode="decimal" className={inp} value={price} onChange={e => setPrice(e.target.value)}/></div>
        {kind === "pack" && <div><label className={lbl}>Séances</label><input type="number" className={inp} value={count} onChange={e => setCount(e.target.value)}/></div>}
        {kind === "pack" && <div><label className={lbl}>Validité (j)</label><input type="number" className={inp} value={validity} onChange={e => setValidity(e.target.value)}/></div>}
      </div>
      {err && <p className="text-xs text-[#e07070]">{err}</p>}
      <button onClick={save} disabled={saving} className={btnGold}>{saving ? "…" : "Enregistrer"}</button>
    </Modal>
  );
}

// ── Paiements ───────────────────────────────────────────────────────────────────────────
export function PaymentsTab({ data, reload }: Props) {
  const [adding, setAdding] = useState(false);
  const remove = async (id: string) => {
    if (!window.confirm("Supprimer ce paiement ? (la facture liée n'est pas modifiée)")) return;
    await supabase.from("coach_payments").delete().eq("id", id);
    await reload();
  };
  return (
    <div className="flex flex-col gap-5">
      <div><button onClick={() => setAdding(true)} className={btnGold} disabled={!data.clients.length}>Paiement</button></div>
      <Section title="Paiements encaissés">
        {data.payments.length === 0 ? <Empty text="Aucun paiement enregistré."/> : data.payments.map(p => {
          const inv = p.invoice_id ? data.invoices.find(i => i.id === p.invoice_id) : null;
          return (
            <div key={p.id} className="px-4 py-3 flex items-center gap-3 border-b border-[var(--t-border-soft)] last:border-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--t-text)] truncate">{clientName(data.clients, p.client_id)}</p>
                <p className="text-[0.72rem] text-[var(--t-text-50)] truncate">
                  {fmtDay(p.paid_at)} · {PAYMENT_METHOD_LABEL[p.method]}{inv ? ` · ${inv.number}` : ""}{p.note ? ` · ${p.note}` : ""}
                </p>
              </div>
              <p className="text-sm font-bold text-[#4f9a7c] shrink-0">+{chf(Number(p.amount_chf))}</p>
              <button onClick={() => remove(p.id)} className="px-2 text-[0.68rem] text-[var(--t-text-30)] hover:text-[#e07070]">Suppr.</button>
            </div>
          );
        })}
      </Section>
      {adding && <PayInvoiceModal data={data} invoice={null} onClose={() => setAdding(false)} onSaved={reload}/>}
    </div>
  );
}

// ── Réglages de facturation ─────────────────────────────────────────────────────────────
export function SettingsTab({ data, reload }: Props) {
  const s = data.settings;
  const [f, setF] = useState<Partial<BillingSettings>>({
    legal_name: s?.legal_name ?? "", street: s?.street ?? "", building_number: s?.building_number ?? "",
    zip: s?.zip ?? "", city: s?.city ?? "", country: s?.country ?? "CH", iban: s?.iban ?? "",
    email: s?.email ?? "", phone: s?.phone ?? "", vat_number: s?.vat_number ?? "",
    vat_rate: s?.vat_rate ?? 8.1, invoice_prefix: s?.invoice_prefix ?? "F",
    payment_terms_days: s?.payment_terms_days ?? 30, footer_note: s?.footer_note ?? "",
  });
  const [vat, setVat] = useState(!!s?.vat_number);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: keyof BillingSettings, v: string | number) => setF(prev => ({ ...prev, [k]: v }));

  const iban = (f.iban ?? "").replace(/\s/g, "");
  const ibanOk = !iban || isIBANValid(iban);

  const save = async () => {
    if (!ibanOk) { setMsg("IBAN invalide."); return; }
    setSaving(true); setMsg("");
    const { error } = await supabase.from("coach_billing_settings").upsert({
      coach_id: data.coachId, ...f, iban: iban || null,
      vat_number: vat ? (f.vat_number || null) : null, vat_rate: vat ? Number(f.vat_rate) || null : null,
      payment_terms_days: Number(f.payment_terms_days) || 30, updated_at: new Date().toISOString(),
    }, { onConflict: "coach_id" });
    setSaving(false);
    setMsg(error ? error.message : "Enregistré ✓");
    if (!error) await reload();
  };

  const field = (k: keyof BillingSettings, label: string, placeholder = "", cls = "") => (
    <div className={cls}><label className={lbl}>{label}</label>
      <input className={inp} value={String(f[k] ?? "")} placeholder={placeholder} onChange={e => set(k, e.target.value)}/></div>
  );

  return (
    <div className={`${card} px-5 py-5 max-w-2xl flex flex-col gap-4`}>
      <p className="text-[0.8rem] text-[var(--t-text-50)]">Ces coordonnées sont imprimées sur tes factures et sur la QR-facture (bulletin de paiement suisse).</p>
      <div className="grid grid-cols-4 gap-3">
        {field("legal_name", "Nom / raison sociale", "Samuel Coaching", "col-span-4")}
        {field("street", "Rue", "", "col-span-3")}
        {field("building_number", "N°")}
        {field("zip", "NPA")}
        {field("city", "Localité", "", "col-span-3")}
        {field("email", "E-mail", "", "col-span-2")}
        {field("phone", "Téléphone", "", "col-span-2")}
      </div>
      <div>
        <label className={lbl}>IBAN (compte qui reçoit les paiements)</label>
        <input className={`${inp} ${ibanOk ? "" : "border-[#e07070]"}`} value={f.iban ?? ""} placeholder="CH00 0000 0000 0000 0000 0" onChange={e => set("iban", e.target.value)}/>
        {!ibanOk && <p className="text-[0.7rem] text-[#e07070] mt-1">IBAN invalide.</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field("invoice_prefix", "Préfixe des factures", "F")}
        <div><label className={lbl}>Délai de paiement (jours)</label>
          <input type="number" className={inp} value={String(f.payment_terms_days ?? 30)} onChange={e => set("payment_terms_days", e.target.value)}/></div>
      </div>
      <label className="flex items-center gap-2 text-[0.8rem] text-[var(--t-text-70)]">
        <input type="checkbox" checked={vat} onChange={e => setVat(e.target.checked)} className="accent-[#c9a84c]"/>
        Assujetti à la TVA
      </label>
      {vat && <div className="grid grid-cols-2 gap-3">{field("vat_number", "N° TVA", "CHE-123.456.789 TVA")}{field("vat_rate", "Taux (%)", "8.1")}</div>}
      <div><label className={lbl}>Mention en bas de facture (optionnel)</label>
        <textarea rows={2} className={`${inp} resize-none`} value={f.footer_note ?? ""} onChange={e => set("footer_note", e.target.value)} placeholder="Merci pour ta confiance !"/></div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className={btnGold}>{saving ? "…" : "Enregistrer"}</button>
        {msg && <p className={`text-xs ${msg.includes("✓") ? "text-[#4f9a7c]" : "text-[#e07070]"}`}>{msg}</p>}
      </div>
    </div>
  );
}

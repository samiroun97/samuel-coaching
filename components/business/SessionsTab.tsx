"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  SESSION_STATUS_CFG, addDaysISO, chf, fmtDateTime, fmtDay, packUsage, todayISO,
  type ClientPack, type SessionStatus,
} from "@/lib/business";
import { createInvoice, lastBuyerFor } from "@/components/business/actions";
import { clientName, type BusinessData } from "@/components/business/useBusinessData";
import { ClientSelect, Empty, Modal, Pill, Section, btnGhost, btnGold, inp, lbl } from "@/components/business/ui";

type Props = { data: BusinessData; reload: () => Promise<void> };

export function SessionsTab({ data, reload }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [showPack, setShowPack] = useState(false);
  const [err, setErr] = useState("");

  const now = new Date().toISOString();
  const upcoming = data.sessions.filter(s => s.scheduled_at >= now && s.status === "planifiee").sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const toClose = data.sessions.filter(s => s.scheduled_at < now && s.status === "planifiee").sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  const history = data.sessions.filter(s => s.status !== "planifiee").slice(0, 30);

  const setStatus = async (id: string, status: SessionStatus) => {
    setErr("");
    const { error } = await supabase.from("coach_sessions").update({ status }).eq("id", id);
    if (error) setErr(error.message);
    await reload();
  };
  const remove = async (id: string) => {
    if (!window.confirm("Supprimer cette séance ?")) return;
    await supabase.from("coach_sessions").delete().eq("id", id);
    await reload();
  };

  const activePacks = data.packs.filter(p => { const u = packUsage(p, data.sessions); return u.remaining > 0 && !u.expired; });

  const SessionRow = ({ s }: { s: BusinessData["sessions"][number] }) => {
    const pack = s.pack_id ? data.packs.find(p => p.id === s.pack_id) : null;
    return (
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b border-[var(--t-border-soft)] last:border-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[var(--t-text)]">{clientName(data.clients, s.client_id)}</p>
            <Pill {...SESSION_STATUS_CFG[s.status]}/>
          </div>
          <p className="text-[0.72rem] text-[var(--t-text-50)]">
            {fmtDateTime(s.scheduled_at)} · {s.duration_min} min{s.location ? ` · ${s.location}` : ""}
            {" · "}{pack ? pack.label : s.price_chf != null ? `à l'unité ${chf(Number(s.price_chf))}` : "hors pack"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["effectuee", "absent", "annulee"] as SessionStatus[]).filter(st => st !== s.status).map(st => (
            <button key={st} onClick={() => setStatus(s.id, st)} className={btnGhost}>{SESSION_STATUS_CFG[st].label}</button>
          ))}
          {s.status !== "planifiee" && <button onClick={() => setStatus(s.id, "planifiee")} className={btnGhost}>Replanifier</button>}
          <button onClick={() => remove(s.id)} className="px-2 text-[0.68rem] text-[var(--t-text-30)] hover:text-[#e07070]">Suppr.</button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setShowNew(true)} className={btnGold} disabled={!data.clients.length}>+ Séance</button>
        <button onClick={() => setShowPack(true)} className={btnGhost} disabled={!data.clients.length}>+ Vendre un pack</button>
      </div>
      {err && <p className="text-xs text-[#e07070]">{err}</p>}

      <Section title="Soldes des packs">
        {activePacks.length === 0 ? <Empty text="Aucun pack actif. Vends un pack pour suivre le solde de séances de tes clients."/> :
          activePacks.map(p => {
            const u = packUsage(p, data.sessions);
            const low = u.remaining <= 2;
            return (
              <div key={p.id} className="px-4 py-3 border-b border-[var(--t-border-soft)] last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--t-text)] truncate">{clientName(data.clients, p.client_id)}</p>
                    <p className="text-[0.72rem] text-[var(--t-text-50)] truncate">{p.label}{p.expires_at ? ` · valable jusqu'au ${fmtDay(p.expires_at)}` : ""}</p>
                  </div>
                  <p className={`text-sm font-bold shrink-0 ${low ? "text-[#e0a070]" : "text-[var(--t-text)]"}`}>
                    {u.remaining} / {p.sessions_total} <span className="text-[0.66rem] font-normal text-[var(--t-text-40)]">restantes</span>
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--t-border-soft)] mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(u.used / p.sessions_total) * 100}%`, backgroundColor: low ? "#e0a070" : "#c9a84c" }}/>
                </div>
              </div>
            );
          })}
      </Section>

      {toClose.length > 0 && (
        <Section title={`À clôturer (${toClose.length})`}>
          <p className="px-4 pt-3 text-[0.72rem] text-[var(--t-text-50)]">Séances passées encore « planifiées » : indique si elles ont eu lieu pour mettre les packs à jour.</p>
          {toClose.map(s => <SessionRow key={s.id} s={s}/>)}
        </Section>
      )}

      <Section title="À venir">
        {upcoming.length === 0 ? <Empty text="Aucune séance planifiée."/> : upcoming.map(s => <SessionRow key={s.id} s={s}/>)}
      </Section>

      <Section title="Historique récent">
        {history.length === 0 ? <Empty text="Aucune séance passée."/> : history.map(s => <SessionRow key={s.id} s={s}/>)}
      </Section>

      {showNew && <NewSessionModal data={data} onClose={() => setShowNew(false)} onSaved={reload}/>}
      {showPack && <SellPackModal data={data} onClose={() => setShowPack(false)} onSaved={reload}/>}
    </div>
  );
}

function NewSessionModal({ data, onClose, onSaved }: { data: BusinessData; onClose: () => void; onSaved: () => Promise<void> }) {
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState("60");
  const [packId, setPackId] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const clientPacks = data.packs.filter(p => p.client_id === clientId && packUsage(p, data.sessions).remaining > 0);
  const unitOffer = data.offers.find(o => o.kind === "seance" && o.active);

  const pickClient = (id: string) => {
    setClientId(id);
    const first = data.packs.find(p => p.client_id === id && packUsage(p, data.sessions).remaining > 0);
    setPackId(first?.id ?? "");
    if (!first && unitOffer) setPrice(String(unitOffer.price_chf));
  };

  const save = async () => {
    if (!clientId) { setErr("Choisis un client."); return; }
    setSaving(true); setErr("");
    const { error } = await supabase.from("coach_sessions").insert({
      coach_id: data.coachId, client_id: clientId, pack_id: packId || null,
      scheduled_at: new Date(`${date}T${time}:00`).toISOString(),
      duration_min: parseInt(duration) || 60,
      price_chf: packId ? null : (parseFloat(price.replace(",", ".")) || null),
      location: location || null, notes: notes || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    await onSaved(); onClose();
  };

  return (
    <Modal title="Nouvelle séance" onClose={onClose}>
      <div><label className={lbl}>Client</label><ClientSelect clients={data.clients} value={clientId} onChange={pickClient}/></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1"><label className={lbl}>Date</label><input type="date" className={inp} value={date} onChange={e => setDate(e.target.value)}/></div>
        <div><label className={lbl}>Heure</label><input type="time" className={inp} value={time} onChange={e => setTime(e.target.value)}/></div>
        <div><label className={lbl}>Durée (min)</label><input type="number" className={inp} value={duration} onChange={e => setDuration(e.target.value)}/></div>
      </div>
      <div>
        <label className={lbl}>Décompter de</label>
        <select className={inp} value={packId} onChange={e => setPackId(e.target.value)}>
          <option value="">Séance à l&apos;unité (hors pack)</option>
          {clientPacks.map(p => <option key={p.id} value={p.id}>{p.label} — {packUsage(p, data.sessions).remaining} restantes</option>)}
        </select>
      </div>
      {!packId && <div><label className={lbl}>Prix (CHF)</label><input inputMode="decimal" className={inp} value={price} onChange={e => setPrice(e.target.value)} placeholder="100"/></div>}
      <div><label className={lbl}>Lieu (optionnel)</label><input className={inp} value={location} onChange={e => setLocation(e.target.value)} placeholder="Salle, extérieur, visio…"/></div>
      <div><label className={lbl}>Notes (optionnel)</label><textarea rows={2} className={`${inp} resize-none`} value={notes} onChange={e => setNotes(e.target.value)}/></div>
      {err && <p className="text-xs text-[#e07070]">{err}</p>}
      <button onClick={save} disabled={saving} className={btnGold}>{saving ? "…" : "Planifier la séance"}</button>
    </Modal>
  );
}

function SellPackModal({ data, onClose, onSaved }: { data: BusinessData; onClose: () => void; onSaved: () => Promise<void> }) {
  const packOffers = data.offers.filter(o => o.kind === "pack" && o.active);
  const [clientId, setClientId] = useState("");
  const [offerId, setOfferId] = useState(packOffers[0]?.id ?? "");
  const first = packOffers[0];
  const [label, setLabel] = useState(first?.name ?? "Pack 10 séances");
  const [count, setCount] = useState(String(first?.sessions_count ?? 10));
  const [price, setPrice] = useState(String(first?.price_chf ?? ""));
  const [validity, setValidity] = useState(first?.validity_days ? String(first.validity_days) : "120");
  const [withInvoice, setWithInvoice] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const pickOffer = (id: string) => {
    setOfferId(id);
    const o = data.offers.find(x => x.id === id);
    if (o) { setLabel(o.name); setCount(String(o.sessions_count ?? 10)); setPrice(String(o.price_chf)); setValidity(o.validity_days ? String(o.validity_days) : ""); }
  };

  const save = async () => {
    if (!clientId) { setErr("Choisis un client."); return; }
    const n = parseInt(count);
    if (!n || n < 1) { setErr("Nombre de séances invalide."); return; }
    const p = parseFloat(price.replace(",", ".")) || 0;
    setSaving(true); setErr("");
    const today = todayISO();
    const { data: pack, error } = await supabase.from("client_packs").insert({
      coach_id: data.coachId, client_id: clientId, offer_id: offerId || null, label: label || `Pack ${n} séances`,
      sessions_total: n, price_chf: p, purchased_at: today,
      expires_at: parseInt(validity) > 0 ? addDaysISO(today, parseInt(validity)) : null,
    }).select().single();
    if (error) { setSaving(false); setErr(error.message); return; }
    if (withInvoice && p > 0) {
      const c = data.clients.find(x => x.id === clientId);
      const buyer = lastBuyerFor(data, clientId) ?? { name: `${c?.prenom ?? ""} ${c?.nom ?? ""}`.trim(), email: c?.email };
      try {
        await createInvoice(data, { clientId, items: [{ label: (pack as ClientPack).label, qty: 1, unit_price: p }], buyer, packId: (pack as ClientPack).id });
      } catch (e) { setErr(`Pack créé, mais facture impossible : ${e instanceof Error ? e.message : ""}`); setSaving(false); await onSaved(); return; }
    }
    setSaving(false);
    await onSaved(); onClose();
  };

  return (
    <Modal title="Vendre un pack" onClose={onClose}>
      <div><label className={lbl}>Client</label><ClientSelect clients={data.clients} value={clientId} onChange={setClientId}/></div>
      {packOffers.length > 0 && (
        <div>
          <label className={lbl}>Offre</label>
          <select className={inp} value={offerId} onChange={e => pickOffer(e.target.value)}>
            {packOffers.map(o => <option key={o.id} value={o.id}>{o.name} — {chf(Number(o.price_chf))}</option>)}
            <option value="">Pack personnalisé</option>
          </select>
        </div>
      )}
      <div><label className={lbl}>Libellé</label><input className={inp} value={label} onChange={e => setLabel(e.target.value)}/></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>Séances</label><input type="number" className={inp} value={count} onChange={e => setCount(e.target.value)}/></div>
        <div><label className={lbl}>Prix (CHF)</label><input inputMode="decimal" className={inp} value={price} onChange={e => setPrice(e.target.value)}/></div>
        <div><label className={lbl}>Validité (j)</label><input type="number" className={inp} value={validity} onChange={e => setValidity(e.target.value)} placeholder="∞"/></div>
      </div>
      <label className="flex items-center gap-2 text-[0.8rem] text-[var(--t-text-70)]">
        <input type="checkbox" checked={withInvoice} onChange={e => setWithInvoice(e.target.checked)} className="accent-[#c9a84c]"/>
        Créer la facture correspondante
      </label>
      {err && <p className="text-xs text-[#e07070]">{err}</p>}
      <button onClick={save} disabled={saving} className={btnGold}>{saving ? "…" : "Enregistrer le pack"}</button>
    </Modal>
  );
}

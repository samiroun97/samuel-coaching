"use client";
import { useState } from "react";
import {
  CONSUMES_PACK, PAYMENT_METHOD_LABEL, INVOICE_STATUS_CFG, chf, fmtDay, isOverdue, packUsage, toCsv, downloadFile,
} from "@/lib/business";
import { clientName, type BusinessData } from "@/components/business/useBusinessData";
import { Empty, Section, Stat, btnGhost } from "@/components/business/ui";

type Props = { data: BusinessData; goTo: (tab: "seances" | "factures" | "reglages") => void };

const monthKey = (iso: string) => iso.slice(0, 7);

export function DashboardTab({ data, goTo }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const cashed = (m: string) => data.payments.filter(p => monthKey(p.paid_at) === m).reduce((s, p) => s + Number(p.amount_chf), 0);
  const open = data.invoices.filter(i => i.status === "emise");
  const overdue = open.filter(isOverdue);
  const toCollect = open.reduce((s, i) => s + Number(i.total_chf), 0);
  const doneThisMonth = data.sessions.filter(s => CONSUMES_PACK.includes(s.status) && monthKey(s.scheduled_at) === thisMonth).length;
  const in7 = new Date(now.getTime() + 7 * 86400000).toISOString();
  const nowIso = now.toISOString();
  const next7 = data.sessions.filter(s => s.status === "planifiee" && s.scheduled_at >= nowIso && s.scheduled_at <= in7).length;
  const toClose = data.sessions.filter(s => s.status === "planifiee" && s.scheduled_at < nowIso).length;
  const lowPacks = data.packs.map(p => ({ p, u: packUsage(p, data.sessions) })).filter(({ u }) => !u.expired && u.remaining <= 2 && u.remaining >= 0 && u.used > 0);
  const s = data.settings;
  const settingsIncomplete = !s?.legal_name || !s?.iban || !s?.street || !s?.zip || !s?.city;

  // 6 derniers mois encaissés.
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { k, label: d.toLocaleDateString("fr-CH", { month: "short" }), v: cashed(k) };
  });
  const max = Math.max(1, ...months.map(m => m.v));

  const premium = data.entitlement?.kind === "owner" || data.entitlement?.tier === "premium";

  const exportYear = () => {
    const y = String(year);
    const inv = data.invoices.filter(i => i.issue_date.startsWith(y));
    const pay = data.payments.filter(p => p.paid_at.startsWith(y));
    downloadFile(`factures-${y}.csv`, toCsv([
      ["Numéro", "Date", "Échéance", "Client", "Total CHF", "Statut", "Payée le"],
      ...inv.map(i => [i.number, i.issue_date, i.due_date, i.buyer?.name ?? clientName(data.clients, i.client_id), Number(i.total_chf), INVOICE_STATUS_CFG[i.status].label, i.paid_at]),
    ]));
    downloadFile(`paiements-${y}.csv`, toCsv([
      ["Date", "Client", "Montant CHF", "Moyen", "Facture", "Note"],
      ...pay.map(p => [p.paid_at, clientName(data.clients, p.client_id), Number(p.amount_chf), PAYMENT_METHOD_LABEL[p.method], data.invoices.find(i => i.id === p.invoice_id)?.number ?? "", p.note]),
    ]));
  };

  const alerts: { text: string; action?: () => void; color: string }[] = [
    ...(settingsIncomplete ? [{ text: "Complète tes réglages de facturation (adresse, IBAN) pour la QR-facture.", action: () => goTo("reglages"), color: "#e0a070" }] : []),
    ...overdue.map(i => ({ text: `Facture ${i.number} en retard — ${i.buyer?.name ?? ""} · ${chf(Number(i.total_chf))} (échéance ${fmtDay(i.due_date!)})`, action: () => goTo("factures"), color: "#e07070" })),
    ...lowPacks.map(({ p, u }) => ({ text: `${clientName(data.clients, p.client_id)} — plus que ${u.remaining} séance${u.remaining > 1 ? "s" : ""} sur son pack (${p.label})`, action: () => goTo("seances"), color: "#c9a84c" })),
    ...(toClose ? [{ text: `${toClose} séance${toClose > 1 ? "s" : ""} passée${toClose > 1 ? "s" : ""} à clôturer (effectuée, absent ou annulée)`, action: () => goTo("seances"), color: "#8fa8d8" }] : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Encaissé ce mois" value={chf(cashed(thisMonth))} sub={`${chf(cashed(lastMonth))} le mois dernier`}/>
        <Stat label="À encaisser" value={chf(toCollect)} sub={`${open.length} facture${open.length > 1 ? "s" : ""}${overdue.length ? ` · ${overdue.length} en retard` : ""}`} accent={overdue.length ? "#e07070" : undefined}/>
        <Stat label="Séances ce mois" value={doneThisMonth} sub={`${next7} dans les 7 prochains jours`}/>
        <Stat label="Packs presque épuisés" value={lowPacks.length} sub="2 séances ou moins" accent={lowPacks.length ? "#c9a84c" : undefined}/>
      </div>

      <Section title="À faire">
        {alerts.length === 0 ? <Empty text="Tout est à jour."/> : alerts.map((a, i) => (
          <button key={i} onClick={a.action} className="w-full text-left px-4 py-3 flex items-center gap-3 border-b border-[var(--t-border-soft)] last:border-0 hover:bg-[var(--t-glass-bg)]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }}/>
            <span className="text-[0.8rem] text-[var(--t-text-70)] flex-1">{a.text}</span>

          </button>
        ))}
      </Section>

      <Section title="Encaissé sur 6 mois">
        <div className="px-4 py-4 grid grid-cols-6 gap-3 items-end h-40">
          {months.map(m => (
            <div key={m.k} className="flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[0.62rem] text-[var(--t-text-50)] whitespace-nowrap">{m.v ? Math.round(m.v) : ""}</span>
              <div className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-[#c9a84c] to-[#e2c97e]" style={{ height: `${Math.max(2, (m.v / max) * 100)}%`, opacity: m.v ? 1 : 0.25 }}/>
              <span className="text-[0.62rem] text-[var(--t-text-40)] uppercase">{m.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Export pour la comptabilité" action={!premium ? <span className="text-[0.62rem] font-semibold text-[#a8893a] uppercase tracking-wider">Coach Premium</span> : undefined}>
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
          <p className="text-[0.78rem] text-[var(--t-text-60)] flex-1 min-w-[12rem]">Factures et paiements de l&apos;année en CSV (Excel), à transmettre à ta fiduciaire.</p>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={`${btnGhost} bg-transparent`}>
            {[0, 1, 2].map(d => now.getFullYear() - d).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportYear} disabled={!premium} className={btnGhost}>{premium ? "Exporter" : "Réservé au Premium"}</button>
        </div>
      </Section>
    </div>
  );
}

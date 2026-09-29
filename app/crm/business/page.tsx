"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useBusinessData } from "@/components/business/useBusinessData";
import { DashboardTab } from "@/components/business/DashboardTab";
import { SessionsTab } from "@/components/business/SessionsTab";
import { InvoicesTab } from "@/components/business/InvoicesTab";
import { OffersTab, PaymentsTab, SettingsTab } from "@/components/business/OtherTabs";

type Tab = "apercu" | "seances" | "factures" | "paiements" | "offres" | "reglages";
const TABS: { key: Tab; label: string }[] = [
  { key: "apercu", label: "Aperçu" }, { key: "seances", label: "Séances & packs" }, { key: "factures", label: "Factures" },
  { key: "paiements", label: "Paiements" }, { key: "offres", label: "Offres" }, { key: "reglages", label: "Réglages" },
];

// Espace Business du coach : séances et packs, factures avec QR-facture, paiements encaissés,
// catalogue d'offres et coordonnées de facturation. Phase 1 : encaissements saisis à la main
// (espèces, TWINT, virement) — le paiement en ligne (Stripe Connect) viendra en phase 2.
export default function BusinessPage() {
  const { data, error, reload } = useBusinessData();
  const [tab, setTab] = useState<Tab>("apercu");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 md:px-8 py-5 md:py-7 max-w-5xl flex flex-col gap-5">
        <div>
          <p className="text-[0.5rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">Plateforme coaching</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl md:text-5xl text-[var(--t-text)] tracking-wide leading-none">BUSINESS</h1>
        </div>

        <div className="flex rounded-xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] p-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-[0.66rem] font-semibold tracking-[0.06em] uppercase transition-colors ${
                tab === t.key ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-40)] hover:text-[var(--t-text-70)]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-[#e07070] rounded-xl border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{error}</p>}
        {!data && !error && <p className="text-sm text-[var(--t-text-40)]">Chargement…</p>}

        {data && tab === "apercu" && <DashboardTab data={data} goTo={setTab}/>}
        {data && tab === "seances" && <SessionsTab data={data} reload={reload}/>}
        {data && tab === "factures" && <InvoicesTab data={data} reload={reload} onOpenSettings={() => setTab("reglages")}/>}
        {data && tab === "paiements" && <PaymentsTab data={data} reload={reload}/>}
        {data && tab === "offres" && <OffersTab data={data} reload={reload}/>}
        {data && tab === "reglages" && <SettingsTab data={data} reload={reload}/>}
      </div>
    </div>
  );
}

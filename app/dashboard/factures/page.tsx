"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  INVOICE_STATUS_CFG, SESSION_STATUS_CFG, chf, fmtDateTime, fmtDay, isOverdue, packUsage,
  type ClientPack, type CoachSession, type Invoice,
} from "@/lib/business";
import { downloadInvoicePdf } from "@/components/business/actions";
import { Empty, Pill, Section, btnGhost } from "@/components/business/ui";
import { SplashScreen } from "@/components/Loader";

// Côté client : solde de ses packs, prochaines séances et factures de son coach (lecture
// seule, RLS client_reads_own_*). Téléchargement du PDF avec QR-facture pour payer.
export default function MesFacturesPage() {
  const [packs, setPacks] = useState<ClientPack[]>([]);
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [p, s, i] = await Promise.all([
        supabase.from("client_packs").select("*").eq("client_id", user.id).order("purchased_at", { ascending: false }),
        supabase.from("coach_sessions").select("*").eq("client_id", user.id).order("scheduled_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("client_id", user.id).order("issue_date", { ascending: false }),
      ]);
      setPacks((p.data ?? []) as ClientPack[]);
      setSessions((s.data ?? []) as CoachSession[]);
      setInvoices(((i.data ?? []) as Invoice[]).filter(x => x.status !== "annulee"));
      setLoading(false);
    })();
  }, []);

  const pdf = async (inv: Invoice) => {
    setBusy(inv.id); setErr("");
    try { await downloadInvoicePdf(inv); } catch (e) { setErr(e instanceof Error ? e.message : "PDF indisponible"); }
    setBusy(null);
  };

  const nowIso = new Date().toISOString();
  const upcoming = sessions.filter(s => s.status === "planifiee" && s.scheduled_at >= nowIso).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const active = packs.map(p => ({ p, u: packUsage(p, sessions) })).filter(({ u }) => !u.expired && u.remaining > 0);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl flex flex-col gap-5">
      <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-5xl text-[var(--t-text)] tracking-wide leading-none">SÉANCES & FACTURES</h1>
      {loading ? <div className="flex justify-center py-16"><SplashScreen/></div> : (
        <>
          <Section title="Mes packs">
            {active.length === 0 ? <Empty text="Aucun pack de séances en cours."/> : active.map(({ p, u }) => (
              <div key={p.id} className="px-4 py-3 border-b border-[var(--t-border-soft)] last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--t-text)] truncate">{p.label}</p>
                    {p.expires_at && <p className="text-[0.72rem] text-[var(--t-text-50)]">Valable jusqu&apos;au {fmtDay(p.expires_at)}</p>}
                  </div>
                  <p className="text-sm font-bold text-[var(--t-text)] shrink-0">{u.remaining} <span className="text-[0.7rem] font-normal text-[var(--t-text-40)]">séance{u.remaining > 1 ? "s" : ""} restante{u.remaining > 1 ? "s" : ""}</span></p>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--t-border-soft)] mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-[#c9a84c]" style={{ width: `${(u.used / p.sessions_total) * 100}%` }}/>
                </div>
              </div>
            ))}
          </Section>

          <Section title="Prochaines séances">
            {upcoming.length === 0 ? <Empty text="Aucune séance planifiée."/> : upcoming.map(s => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3 border-b border-[var(--t-border-soft)] last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--t-text)]">{fmtDateTime(s.scheduled_at)}</p>
                  <p className="text-[0.72rem] text-[var(--t-text-50)]">{s.duration_min} min{s.location ? ` · ${s.location}` : ""}</p>
                </div>
                <Pill {...SESSION_STATUS_CFG[s.status]}/>
              </div>
            ))}
          </Section>

          <Section title="Mes factures">
            {invoices.length === 0 ? <Empty text="Aucune facture."/> : invoices.map(inv => {
              const late = isOverdue(inv);
              return (
                <div key={inv.id} className="px-4 py-3 flex items-center gap-3 border-b border-[var(--t-border-soft)] last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--t-text)]">{inv.number}</p>
                      <Pill {...(late ? { label: "En retard", color: "#e07070" } : INVOICE_STATUS_CFG[inv.status])}/>
                    </div>
                    <p className="text-[0.72rem] text-[var(--t-text-50)]">
                      {fmtDay(inv.issue_date)}{inv.status === "emise" && inv.due_date ? ` · à payer d'ici au ${fmtDay(inv.due_date)}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[var(--t-text)] shrink-0">{chf(Number(inv.total_chf))}</p>
                  <button onClick={() => pdf(inv)} disabled={busy === inv.id} className={btnGhost}>{busy === inv.id ? "…" : inv.status === "emise" ? "Payer (PDF)" : "PDF"}</button>
                </div>
              );
            })}
          </Section>
          {err && <p className="text-xs text-[#e07070]">{err}</p>}
        </>
      )}
    </div>
  );
}

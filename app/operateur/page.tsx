"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import { isPlatformAdmin } from "@/lib/coach";
import { OperateurIaCorrections } from "@/components/OperateurIaCorrections";
import { Icon } from "@/components/Icon";
import { ChevronLeft } from "@/lib/solarIcons";

type CoachRow = {
  id: string; businessName: string | null; email: string; prenom: string; nom: string;
  code: string | null; createdAt: string; isActive: boolean; clientCount: number;
};
type OperateurData = { coaches: CoachRow[]; totalCoaches: number; totalClients: number; totalSeances: number; totalMessages: number };

function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl px-4 py-3 md:px-5 md:py-4 flex flex-col gap-1">
      <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl md:text-4xl text-[var(--t-text)] tracking-wide leading-none">{value}</p>
      <p className="text-[0.48rem] tracking-[0.2em] uppercase text-[var(--t-text-30)]">{label}</p>
    </div>
  );
}

// Espace réservé à l'opérateur de la plateforme (profiles.is_platform_admin) — vue transverse
// sur tous les coachs inscrits, distincte du CRM (/crm) où chaque coach ne voit que ses propres
// clients. Garde d'accès faite ici même plutôt que dans un layout partagé : cette route ne doit
// jamais être atteignable par un coach normal, même en tapant l'URL directement.
export default function OperateurPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed,  setAllowed]  = useState(false);
  const [data,     setData]     = useState<OperateurData | null>(null);
  const [error,    setError]    = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [section, setSection] = useState<"coachs" | "ia">("coachs");

  const load = async () => {
    const res = await apiPost("/api/operateur/data", {});
    if (!res.ok) { setError("Impossible de charger les données."); return; }
    setData(await res.json());
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const admin = await isPlatformAdmin(user.id);
      setAllowed(admin);
      setChecking(false);
      if (!admin) { router.push("/crm/clients"); return; }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCoach = async (coachId: string, nextActive: boolean) => {
    setTogglingId(coachId);
    const res = await apiPost("/api/operateur/toggle-coach", { coachId, isActive: nextActive });
    if (res.ok) await load();
    setTogglingId(null);
  };

  if (checking || (!allowed)) return (
    <div className="min-h-screen bg-[var(--t-bg2)] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--t-bg2)] p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8 flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] tracking-[0.35em] text-[#c9a84c] uppercase mb-1">CRM — Vue plateforme</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl md:text-5xl text-[var(--t-text)] tracking-wide">{section === "coachs" ? "COACHS" : "CORRECTIONS IA"}</h1>
        </div>
        <button onClick={() => router.push("/crm/clients")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--t-border)] text-[var(--t-text-50)] text-[0.6rem] tracking-[0.15em] uppercase hover:border-[#c9a84c]/40 hover:text-[var(--t-text-80)] transition-all shrink-0">
          <Icon icon={ChevronLeft} size={12} strokeWidth={2}/>
          Plateforme coaching
        </button>
      </div>

      <div className="flex border border-[var(--t-border)] mb-6 rounded-xl overflow-hidden">
        {([{ key: "coachs", label: "Coachs" }, { key: "ia", label: "Corrections IA" }] as const).map(t => (
          <button key={t.key} onClick={() => setSection(t.key)}
            className={`flex-1 py-3 text-[0.68rem] tracking-[0.15em] uppercase transition-colors ${
              section === t.key ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black font-bold" : "text-[var(--t-text-40)] hover:text-[var(--t-text-70)] hover:bg-[var(--t-glass-bg)]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-[#e07070] rounded-xl border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2 mb-4">{error}</p>}

      {section === "ia" && <OperateurIaCorrections/>}

      {section === "coachs" && data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-8">
            <KPI label="Coachs inscrits" value={data.totalCoaches}/>
            <KPI label="Clients au total" value={data.totalClients}/>
            <KPI label="Séances envoyées" value={data.totalSeances}/>
            <KPI label="Messages échangés" value={data.totalMessages}/>
          </div>

          <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[0.5rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] border-b border-[var(--t-border-soft)]">
                    <th className="px-4 py-3 font-medium">Activité</th>
                    <th className="px-4 py-3 font-medium">Coach</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium text-center">Clients</th>
                    <th className="px-4 py-3 font-medium">Inscrit le</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.coaches.map(c => (
                    <tr key={c.id} className="border-b border-[var(--t-border-soft)] last:border-0">
                      <td className="px-4 py-3 text-sm text-[var(--t-text-70)]">{c.businessName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-[var(--t-text-40)]">
                        <p>{c.prenom} {c.nom}</p>
                        <p className="text-[var(--t-text-20)]">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--t-text-40)] tracking-wider">{c.code ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-[var(--t-text-60)] text-center">{c.clientCount}</td>
                      <td className="px-4 py-3 text-xs text-[var(--t-text-30)]">
                        {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[0.55rem] tracking-wider uppercase px-2 py-1 rounded-full border ${
                          c.isActive ? "border-[#7eb8a0]/30 text-[#7eb8a0] bg-[#7eb8a0]/5" : "border-[#e07070]/30 text-[#e07070] bg-[#e07070]/5"
                        }`}>
                          {c.isActive ? "Actif" : "Suspendu"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleCoach(c.id, !c.isActive)} disabled={togglingId === c.id}
                          className="text-[0.55rem] tracking-[0.1em] uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-60)] transition-colors disabled:opacity-40 whitespace-nowrap">
                          {togglingId === c.id ? "…" : c.isActive ? "Suspendre" : "Réactiver"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.coaches.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-[var(--t-text-20)]">Aucun coach inscrit</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

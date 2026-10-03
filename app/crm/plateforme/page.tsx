"use client";
export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import { isPlatformAdmin } from "@/lib/coach";
import { OperateurIaCorrections } from "@/components/OperateurIaCorrections";
import { PLANS, type Plan } from "@/lib/plans";
import { SplashScreen } from "@/components/Loader";
import { SectionIcon } from "@/components/SectionIcon";

type Kind = "operateur" | "coach" | "client" | "solo";
type SubInfo = { plan: string | null; planLabel: string | null; subStatus: string | null; trialEndsAt: string | null; active: boolean | null };
type CoachRow = SubInfo & {
  id: string; profileId: string; businessName: string | null; email: string; prenom: string; nom: string;
  code: string | null; createdAt: string; isActive: boolean; isOperator: boolean; clientCount: number; maxClients: number | null;
};
type UserRow = SubInfo & {
  id: string; email: string; prenom: string; nom: string; objectifs: string;
  createdAt: string | null; lastSeenAt: string | null; kind: Kind;
  coachId: string | null; coachName: string | null; onboarded: boolean;
};
type Totals = {
  users: number; newThisWeek: number; unlinked: number; coaches: number; clients: number;
  trialing: number; paying: number; mrr: number; seances: number; messages: number;
};
type PlanStat = { plan: Plan; trialing: number; paying: number; inactive: number; mrr: number };
type OperateurData = { coaches: CoachRow[]; users: UserRow[]; totals: Totals; billingReady: boolean; planBreakdown: PlanStat[] };

const KIND_CFG: Record<Kind, { label: string; color: string }> = {
  operateur: { label: "Opérateur",     color: "#c9a84c" },
  coach:     { label: "Coach",         color: "#8fa8d8" },
  client:    { label: "Client",        color: "#7eb8a0" },
  solo:      { label: "Non rattaché",  color: "#e0a070" },
};

const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" }) : "—";
function ago(iso: string | null) {
  if (!iso) return "jamais";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "aujourd'hui" : d === 1 ? "hier" : `il y a ${d} j`;
}

const card = "rounded-2xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] shadow-[0_2px_14px_-8px_rgba(0,0,0,0.15)]";

function KPI({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className={`${card} px-4 py-3`}>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--t-text-50)]">{label}</p>
      <p style={{ fontFamily: "var(--font-bebas)", color: accent }} className="text-3xl text-[var(--t-text)] tracking-wide leading-none mt-1">{value}</p>
      {sub && <p className="text-[0.66rem] text-[var(--t-text-40)] mt-1">{sub}</p>}
    </div>
  );
}

function Badge({ kind }: { kind: Kind }) {
  const c = KIND_CFG[kind];
  return (
    <span className="text-[0.58rem] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ color: c.color, borderColor: `${c.color}55`, backgroundColor: `${c.color}12` }}>{c.label}</span>
  );
}

function PlanCell({ u, billingReady }: { u: SubInfo; billingReady: boolean }) {
  if (!billingReady) return <span className="text-[var(--t-text-30)]">—</span>;
  if (!u.plan) return <span className="text-[var(--t-text-30)]">Aucune</span>;
  const trial = u.subStatus === "trialing";
  return (
    <span className={u.active ? "text-[var(--t-text-70)]" : "text-[#e07070]"}>
      {u.planLabel}{trial ? ` · essai${u.trialEndsAt && u.active ? ` jusqu'au ${fmtDate(u.trialEndsAt)}` : " terminé"}` : u.active ? "" : " · inactif"}
    </span>
  );
}

// CRM opérateur (profiles.is_platform_admin) — vue globale de la plateforme, distincte du CRM
// coach (/crm, scopé aux clients de CE coach) : tous les inscrits, dont ceux arrivés sans code
// d'invitation (rattachables à un coach d'ici), tous les coachs et leur formule. Garde d'accès
// faite ici même : la route ne doit jamais être atteignable par un coach normal.
export default function OperateurPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed,  setAllowed]  = useState(false);
  const [data,     setData]     = useState<OperateurData | null>(null);
  const [error,    setError]    = useState("");
  const [busyId,   setBusyId]   = useState<string | null>(null);
  const [section,  setSection]  = useState<"apercu" | "utilisateurs" | "coachs" | "ia">("apercu");
  const [filter,   setFilter]   = useState<"all" | Kind>("all");
  const [search,   setSearch]   = useState("");

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

  const myCoach = data?.coaches.find(c => c.isOperator) ?? null;

  const assign = async (clientId: string, coachId: string | null) => {
    setBusyId(clientId); setError("");
    const res = await apiPost("/api/operateur/assign-client", { clientId, coachId });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Rattachement impossible.");
    await load();
    setBusyId(null);
  };

  const toggleCoach = async (coachId: string, nextActive: boolean) => {
    setBusyId(coachId);
    const res = await apiPost("/api/operateur/toggle-coach", { coachId, isActive: nextActive });
    if (res.ok) await load();
    setBusyId(null);
  };

  const users = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.users.filter(u =>
      (filter === "all" || u.kind === filter) &&
      (!q || `${u.prenom} ${u.nom} ${u.email} ${u.coachName ?? ""}`.toLowerCase().includes(q)));
  }, [data, filter, search]);

  if (checking || !allowed) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <SplashScreen/>
    </div>
  );

  const unlinked = data?.users.filter(u => u.kind === "solo") ?? [];

  const AssignControl = ({ u }: { u: UserRow }) => {
    if (u.kind === "coach" || u.kind === "operateur" || !data) return null;
    // Pas encore de profil (questionnaire non terminé) : rattachement impossible (coach_clients
    // référence profiles) — il se fera tout seul avec son code d'invitation à la fin du questionnaire.
    if (!u.onboarded) return <span className="text-[0.66rem] text-[var(--t-text-40)] whitespace-nowrap">Questionnaire non terminé</span>;
    return (
      <div className="flex items-center gap-2">
        {u.kind === "solo" && myCoach && (
          <button onClick={() => assign(u.id, myCoach.id)} disabled={busyId === u.id}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.62rem] font-bold tracking-wider uppercase whitespace-nowrap disabled:opacity-50">
            {busyId === u.id ? "…" : "Prendre en charge"}
          </button>
        )}
        <select value={u.coachId ?? ""} disabled={busyId === u.id}
          onChange={e => assign(u.id, e.target.value || null)}
          aria-label="Coach"
          className="bg-[var(--t-bg)] border border-[var(--t-border)] rounded-lg text-[0.7rem] text-[var(--t-text-70)] px-2 py-1.5 max-w-[11rem] focus:outline-none focus:border-[#c9a84c]/40">
          <option value="">Sans coach</option>
          {data.coaches.map(c => <option key={c.id} value={c.id}>{c.businessName || `${c.prenom} ${c.nom}`}</option>)}
        </select>
      </div>
    );
  };

  const UserLine = ({ u }: { u: UserRow }) => (
    <div className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border-b border-[var(--t-border-soft)] last:border-0">
      <div className="min-w-0 md:w-[30%]">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[var(--t-text)] truncate">{u.prenom || u.nom ? `${u.prenom} ${u.nom}`.trim() : "Sans nom"}</p>
          <Badge kind={u.kind}/>
          {!u.onboarded && <span className="text-[0.58rem] text-[#e0a070]">questionnaire non terminé</span>}
        </div>
        <p className="text-[0.7rem] text-[var(--t-text-40)] truncate">{u.email}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-[0.7rem] md:flex-1">
        <div><p className="text-[var(--t-text-30)] uppercase tracking-wider text-[0.55rem]">Coach</p><p className="text-[var(--t-text-70)] truncate">{u.coachName ?? "—"}</p></div>
        <div><p className="text-[var(--t-text-30)] uppercase tracking-wider text-[0.55rem]">Formule</p><p className="truncate"><PlanCell u={u} billingReady={!!data?.billingReady}/></p></div>
        <div><p className="text-[var(--t-text-30)] uppercase tracking-wider text-[0.55rem]">Inscrit · vu</p><p className="text-[var(--t-text-70)] truncate">{fmtDate(u.createdAt)} · {ago(u.lastSeenAt)}</p></div>
      </div>
      <div className="md:w-auto shrink-0"><AssignControl u={u}/></div>
    </div>
  );

  return (
    // Dans le cadre du CRM (menu latéral, fond, marges) comme les autres pages — l'ancienne
    // page /operateur autonome, centrée à max-w-6xl, laissait des bandes sombres sur les côtés.
    <div className="flex-1 overflow-y-auto">
    <div className="px-4 md:px-8 py-5 md:py-7 max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <SectionIcon name="plateforme"/>
        <div>
          <p className="text-[0.5rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">Vue opérateur</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl md:text-5xl text-[var(--t-text)] tracking-wide leading-none">PLATEFORME</h1>
        </div>
      </div>

      <div className="flex rounded-xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] p-1 mb-6 overflow-x-auto no-scrollbar">
        {([
          { key: "apercu", label: "Vue d'ensemble" },
          { key: "utilisateurs", label: `Utilisateurs${data ? ` (${data.totals.users})` : ""}` },
          { key: "coachs", label: `Coachs${data ? ` (${data.totals.coaches})` : ""}` },
          { key: "ia", label: "Corrections IA" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setSection(t.key)}
            className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-[0.68rem] font-semibold tracking-[0.08em] uppercase transition-colors ${
              section === t.key ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold" : "text-[var(--t-text-40)] hover:text-[var(--t-text-70)]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-[#e07070] rounded-xl border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2 mb-4">{error}</p>}

      {section === "ia" && <OperateurIaCorrections/>}

      {section === "apercu" && data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Utilisateurs" value={data.totals.users} sub={`+${data.totals.newThisWeek} cette semaine`}/>
            <KPI label="Non rattachés" value={data.totals.unlinked} sub="inscrits sans coach" accent={data.totals.unlinked ? "#e0a070" : undefined}/>
            <KPI label="Coachs" value={data.totals.coaches} sub={`${data.totals.clients} clients rattachés`}/>
            <KPI label="Revenu mensuel" value={data.billingReady ? `${data.totals.mrr} CHF` : "—"}
              sub={data.billingReady ? `${data.totals.paying} payant${data.totals.paying > 1 ? "s" : ""} · ${data.totals.trialing} en essai` : "formules pas encore activées"}/>
          </div>

          <div className={card}>
            <div className="px-4 py-3 border-b border-[var(--t-border-soft)] flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.9rem] font-semibold text-[var(--t-text)]">Formules</p>
                <p className="text-[0.7rem] text-[var(--t-text-40)]">
                  {data.billingReady ? "Qui est sur quelle formule, et ce que chacune rapporte par mois." : "Les compteurs s'activeront avec la migration des abonnements."}
                </p>
              </div>
              <Link href="/crm/abonnement" className="text-[0.66rem] text-[#c9a84c] whitespace-nowrap hover:underline">Voir les formules</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4">
              {(data.planBreakdown ?? (Object.keys(PLANS) as Plan[]).map(plan => ({ plan, trialing: 0, paying: 0, inactive: 0, mrr: 0 }))).map(s => {
                const cfg = PLANS[s.plan];
                return (
                  <div key={s.plan} className="px-4 py-3 border-b md:border-b-0 md:border-r last:border-r-0 border-[var(--t-border-soft)]">
                    <p className="text-[0.8rem] font-semibold text-[var(--t-text)]">{cfg.label}</p>
                    <p className="text-[0.7rem] text-[var(--t-text-40)]">{cfg.monthlyChf} CHF/mois{cfg.maxClients ? ` · ${cfg.maxClients} clients` : ""}</p>
                    <div className="flex gap-3 mt-2 text-[0.7rem]">
                      <span><span className="font-bold text-[var(--t-text)]">{data.billingReady ? s.paying : "—"}</span> <span className="text-[var(--t-text-40)]">payants</span></span>
                      <span><span className="font-bold text-[var(--t-text)]">{data.billingReady ? s.trialing : "—"}</span> <span className="text-[var(--t-text-40)]">en essai</span></span>
                    </div>
                    <p className="text-[0.68rem] text-[var(--t-text-40)] mt-1">
                      {data.billingReady ? `${s.mrr} CHF/mois · ${s.inactive} inactif${s.inactive > 1 ? "s" : ""}` : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={card}>
            <div className="px-4 py-3 border-b border-[var(--t-border-soft)] flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.9rem] font-semibold text-[var(--t-text)]">Inscrits sans coach</p>
                <p className="text-[0.7rem] text-[var(--t-text-40)]">Arrivés sans code d&apos;invitation : invisibles dans ton CRM coach tant qu&apos;ils ne sont pas pris en charge.</p>
              </div>
              {unlinked.length > 0 && (
                <button onClick={() => { setFilter("solo"); setSection("utilisateurs"); }} className="text-[0.66rem] text-[#c9a84c] whitespace-nowrap hover:underline">Tout voir</button>
              )}
            </div>
            {unlinked.length === 0
              ? <p className="px-4 py-6 text-center text-xs text-[var(--t-text-30)]">Aucun inscrit sans coach.</p>
              : unlinked.slice(0, 8).map(u => <UserLine key={u.id} u={u}/>)}
          </div>

          <div className={card}>
            <div className="px-4 py-3 border-b border-[var(--t-border-soft)]">
              <p className="text-[0.9rem] font-semibold text-[var(--t-text)]">Derniers inscrits</p>
            </div>
            {data.users.slice(0, 8).map(u => <UserLine key={u.id} u={u}/>)}
          </div>
        </div>
      )}

      {section === "utilisateurs" && data && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un nom, un e-mail, un coach…"
              className="flex-1 bg-[var(--t-surface)] border border-[var(--t-border-soft)] rounded-xl text-sm text-[var(--t-text)] px-3.5 py-2.5 focus:outline-none focus:border-[#c9a84c]/40"/>
            <div className="flex rounded-xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] p-1 overflow-x-auto no-scrollbar">
              {(["all", "solo", "client", "coach"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[0.66rem] font-semibold whitespace-nowrap transition-colors ${filter === f ? "bg-[#c9a84c]/15 text-[#a8893a]" : "text-[var(--t-text-40)]"}`}>
                  {f === "all" ? "Tous" : KIND_CFG[f].label}
                </button>
              ))}
            </div>
          </div>
          <div className={card}>
            {users.length === 0
              ? <p className="px-4 py-6 text-center text-xs text-[var(--t-text-30)]">Aucun utilisateur.</p>
              : users.map(u => <UserLine key={u.id} u={u}/>)}
          </div>
        </div>
      )}

      {section === "coachs" && data && (
        <div className={card}>
          {data.coaches.map(c => (
            <div key={c.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border-b border-[var(--t-border-soft)] last:border-0">
              <div className="min-w-0 md:w-[30%]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[var(--t-text)] truncate">{c.businessName || "—"}</p>
                  {c.isOperator && <Badge kind="operateur"/>}
                </div>
                <p className="text-[0.7rem] text-[var(--t-text-40)] truncate">{c.prenom} {c.nom} · {c.email}</p>
              </div>
              <div className="grid grid-cols-4 gap-3 text-[0.7rem] md:flex-1">
                <div><p className="text-[var(--t-text-30)] uppercase tracking-wider text-[0.55rem]">Code</p><p className="text-[var(--t-text-70)] tracking-wider">{c.code ?? "—"}</p></div>
                <div><p className="text-[var(--t-text-30)] uppercase tracking-wider text-[0.55rem]">Clients</p><p className="text-[var(--t-text-70)]">{c.clientCount}{c.maxClients !== null ? ` / ${c.maxClients}` : ""}</p></div>
                <div><p className="text-[var(--t-text-30)] uppercase tracking-wider text-[0.55rem]">Formule</p><p className="truncate">{c.isOperator ? <span className="text-[var(--t-text-70)]">Opérateur</span> : <PlanCell u={c} billingReady={data.billingReady}/>}</p></div>
                <div><p className="text-[var(--t-text-30)] uppercase tracking-wider text-[0.55rem]">Inscrit</p><p className="text-[var(--t-text-70)]">{fmtDate(c.createdAt)}</p></div>
              </div>
              {!c.isOperator && (
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[0.58rem] tracking-wider uppercase px-2 py-0.5 rounded-full border ${c.isActive ? "border-[#7eb8a0]/30 text-[#7eb8a0]" : "border-[#e07070]/30 text-[#e07070]"}`}>
                    {c.isActive ? "Actif" : "Suspendu"}
                  </span>
                  <button onClick={() => toggleCoach(c.id, !c.isActive)} disabled={busyId === c.id}
                    className="text-[0.62rem] tracking-[0.08em] uppercase text-[var(--t-text-40)] hover:text-[var(--t-text-70)] disabled:opacity-40">
                    {busyId === c.id ? "…" : c.isActive ? "Suspendre" : "Réactiver"}
                  </button>
                </div>
              )}
            </div>
          ))}
          {data.coaches.length === 0 && <p className="px-4 py-6 text-center text-xs text-[var(--t-text-30)]">Aucun coach inscrit</p>}
        </div>
      )}
    </div>
    </div>
  );
}

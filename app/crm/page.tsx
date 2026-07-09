"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";
const STAGE_LABEL: Record<string, string> = { prospect: "Prospect", onboarding: "Onboarding", actif: "Actif", en_risque: "En risque", churne: "Churné", reactive: "Réactivé" };
const STAGE_COLOR: Record<string, string> = { prospect: "#888", onboarding: "#c9a84c", actif: "#7eb8a0", en_risque: "#e09070", churne: "#e07070", reactive: "#a08ec9" };

type Client = { id: string; email: string; prenom: string; nom: string; status: string | null; subscription_end: string | null; pipeline_stage: string | null; updated_at: string };
type Msg    = { from_email: string; to_email: string; content: string; created_at: string };
type Ck     = { client_id: string; week_date: string; weight: number | null; compliance: number | null; created_at: string; profiles?: { prenom: string; nom: string } };

function KPI({ label, value, color, href }: { label: string; value: number | string; color?: string; href?: string }) {
  const inner = (
    <div className={`border bg-[#0f0f0f] px-4 py-3 md:px-5 md:py-4 flex flex-col gap-1 ${href ? "hover:border-white/15 transition-colors cursor-pointer" : ""}`}
      style={{ borderColor: color ? `${color}25` : "rgba(255,255,255,0.07)" }}>
      <p style={{ fontFamily: "var(--font-bebas)", color: color ?? "white" }} className="text-3xl md:text-4xl tracking-wide leading-none">{value}</p>
      <p className="text-[0.48rem] tracking-[0.2em] uppercase text-white/30">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function CRMDashboard() {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [msgs,     setMsgs]     = useState<Msg[]>([]);
  const [checkins, setCheckins] = useState<Ck[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: m }, { data: ck }] = await Promise.all([
        supabase.from("profiles").select("id,email,prenom,nom,status,subscription_end,pipeline_stage,updated_at").order("updated_at", { ascending: false }),
        supabase.from("messages").select("from_email,to_email,content,created_at").order("created_at", { ascending: true }),
        supabase.from("weekly_checkins").select("client_id,week_date,weight,compliance,created_at").order("created_at", { ascending: false }).limit(20),
      ]);
      setClients((c ?? []) as Client[]);
      setMsgs((m ?? []) as Msg[]);
      setCheckins((ck ?? []) as Ck[]);
      setLoading(false);
    })();
  }, []);

  // ── Compute KPIs ──
  const actifs    = clients.filter(c => (c.status ?? "actif") === "actif").length;
  const enRisque  = clients.filter(c => (c.pipeline_stage ?? "actif") === "en_risque").length;
  const churne    = clients.filter(c => (c.pipeline_stage ?? "actif") === "churne").length;
  const now       = Date.now();
  const in14      = clients.filter(c => { if (!c.subscription_end) return false; const d = new Date(c.subscription_end).getTime(); return d > now && d < now + 14 * 86400000; }).length;

  // Unread convs: last message from client (not Samuel)
  const convLastFrom = new Map<string, Msg>();
  for (const m of msgs) {
    const client = m.from_email === SAMUEL_EMAIL ? m.to_email : m.from_email;
    if (client !== SAMUEL_EMAIL) convLastFrom.set(client, m);
  }
  const nonRepondus = [...convLastFrom.values()].filter(m => m.from_email !== SAMUEL_EMAIL).length;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const ckThisWeek = checkins.filter(c => c.week_date >= weekAgo).length;

  // ── Alerts ──
  type Alert = { type: "message" | "risque" | "abonnement" | "churn"; label: string; sub: string; href: string; color: string };
  const alerts: Alert[] = [];

  for (const [email, m] of convLastFrom) {
    if (m.from_email !== SAMUEL_EMAIL) {
      const profile = clients.find(c => c.email === email);
      const name = profile ? `${profile.prenom} ${profile.nom}` : email;
      const ago = Math.floor((now - new Date(m.created_at).getTime()) / 3600000);
      alerts.push({ type: "message", label: `Message de ${name}`, sub: ago < 1 ? "À l'instant" : `Il y a ${ago}h`, href: "/crm/inbox", color: "#e07070" });
    }
  }
  clients.filter(c => c.subscription_end).forEach(c => {
    const d = new Date(c.subscription_end!).getTime();
    const daysLeft = Math.ceil((d - now) / 86400000);
    if (daysLeft > 0 && daysLeft <= 14) {
      alerts.push({ type: "abonnement", label: `${c.prenom} ${c.nom} — abonnement`, sub: `Expire dans ${daysLeft}j`, href: `/crm/clients`, color: daysLeft <= 3 ? "#e07070" : "#c9a84c" });
    }
  });
  clients.filter(c => (c.pipeline_stage ?? "actif") === "en_risque").forEach(c => {
    alerts.push({ type: "risque", label: `${c.prenom} ${c.nom} — en risque`, sub: "Stage : En risque", href: "/crm/pipeline", color: "#e09070" });
  });

  // Recent check-ins enriched with client name
  const recentCks = checkins.slice(0, 6).map(ck => {
    const p = clients.find(c => c.id === ck.client_id);
    return { ...ck, name: p ? `${p.prenom} ${p.nom}` : "—" };
  });

  // Recent messages (last per conv, from client)
  const recentMsgs = [...convLastFrom.values()]
    .filter(m => m.from_email !== SAMUEL_EMAIL)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(m => {
      const p = clients.find(c => c.email === m.from_email);
      return { ...m, name: p ? `${p.prenom} ${p.nom}` : m.from_email };
    });

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-[0.65rem] tracking-[0.35em] text-[#c9a84c] uppercase mb-1">CRM — Vue globale</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl md:text-5xl text-white tracking-wide">DASHBOARD</h1>
        <p className="text-white/30 text-xs mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-6 md:mb-8">
        <KPI label="Clients actifs"    value={actifs}       color="#7eb8a0" href="/crm/clients"/>
        <KPI label="En risque"         value={enRisque}     color="#e09070" href="/crm/pipeline"/>
        <KPI label="Churné"            value={churne}       color="#e07070" href="/crm/pipeline"/>
        <KPI label="Exp. < 14j"        value={in14}         color="#c9a84c" href="/crm/clients"/>
        <KPI label="Non répondus"      value={nonRepondus}  color="#a08ec9" href="/crm/inbox"/>
        <KPI label="Check-ins / 7j"    value={ckThisWeek}  />
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <p className="text-[0.65rem] tracking-[0.25em] uppercase text-white/25 mb-3">Alertes ({alerts.length})</p>
          <div className="flex flex-col gap-2">
            {alerts.slice(0, 8).map((a, i) => (
              <Link key={i} href={a.href}
                className="flex items-center justify-between gap-2 border px-3 md:px-4 py-3 hover:bg-white/[0.02] transition-colors"
                style={{ borderColor: `${a.color}25`, backgroundColor: `${a.color}07` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1 h-5 shrink-0" style={{ backgroundColor: a.color }}/>
                  <p className="text-xs text-white/70 truncate">{a.label}</p>
                </div>
                <span className="text-[0.48rem] tracking-wider text-white/30 shrink-0">{a.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent check-ins */}
        <div className="border border-white/7 bg-[#0f0f0f] p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#c9a84c]">Derniers check-ins</p>
            <Link href="/crm/clients" className="text-[0.45rem] tracking-wider uppercase text-white/20 hover:text-white/50 transition-colors">Voir tout →</Link>
          </div>
          {recentCks.length === 0 ? (
            <p className="text-white/20 text-xs">Aucun check-in</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentCks.map((ck, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-xs text-white/65">{ck.name}</p>
                    <p className="text-[0.45rem] text-white/25">
                      {new Date(ck.week_date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    {ck.weight && <span className="text-sm text-white/60 font-medium">{ck.weight} kg</span>}
                    {ck.compliance && (
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <div key={n} className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: n <= ck.compliance! ? "#c9a84c" : "rgba(255,255,255,0.07)" }}/>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="border border-white/7 bg-[#0f0f0f] p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#c9a84c]">Messages en attente</p>
            <Link href="/crm/inbox" className="text-[0.45rem] tracking-wider uppercase text-white/20 hover:text-white/50 transition-colors">Inbox →</Link>
          </div>
          {recentMsgs.length === 0 ? (
            <p className="text-white/20 text-xs">Tout est répondu ✓</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentMsgs.map((m, i) => (
                <Link key={i} href={`/crm/inbox?client=${encodeURIComponent(m.from_email)}`}
                  className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0 hover:opacity-80 transition-opacity">
                  <div className="w-6 h-6 border border-[#e07070]/30 bg-[#e07070]/5 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[0.65rem] text-[#e07070] font-bold">{m.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white/70 truncate">{m.name}</p>
                    <p className="text-[0.65rem] text-white/30 truncate mt-0.5">{m.content}</p>
                  </div>
                  <span className="text-[0.42rem] text-white/20 shrink-0 mt-0.5">
                    {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Pipeline snapshot */}
      <div className="mt-6 border border-white/7 bg-[#0f0f0f] p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#c9a84c]">Répartition pipeline</p>
          <Link href="/crm/pipeline" className="text-[0.45rem] tracking-wider uppercase text-white/20 hover:text-white/50 transition-colors">Vue complète →</Link>
        </div>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(STAGE_LABEL).map(([key, label]) => {
            const count = clients.filter(c => (c.pipeline_stage ?? "actif") === key).length;
            return (
              <div key={key} className="flex items-center gap-2 border px-3 py-2"
                style={{ borderColor: `${STAGE_COLOR[key]}30` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STAGE_COLOR[key] }}/>
                <p className="text-[0.65rem] tracking-wider uppercase" style={{ color: STAGE_COLOR[key] }}>{label}</p>
                <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-white/70 tracking-wide leading-none">{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

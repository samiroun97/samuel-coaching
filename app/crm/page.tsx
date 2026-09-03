"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const STAGE_LABEL: Record<string, string> = { prospect: "Prospect", onboarding: "Onboarding", actif: "Actif", en_risque: "En risque", churne: "Churné", reactive: "Réactivé" };
const STAGE_COLOR: Record<string, string> = { prospect: "#888", onboarding: "#c9a84c", actif: "#7eb8a0", en_risque: "#e09070", churne: "#e07070", reactive: "#6ea8d9" };

type Client = { id: string; email: string; prenom: string; nom: string; status: string | null; subscription_end: string | null; pipeline_stage: string | null; updated_at: string };
type Msg    = { from_email: string; to_email: string; content: string; created_at: string };
type Ck     = { client_id: string; week_date: string; weight: number | null; compliance: number | null; created_at: string; profiles?: { prenom: string; nom: string } };
type MesoEnding = { client_id: string; nom: string; date_fin: string };

function KPI({ label, value, color, href }: { label: string; value: number | string; color?: string; href?: string }) {
  const inner = (
    <div className={`border bg-[var(--t-surface-2)] rounded-xl px-4 py-3 md:px-5 md:py-4 flex flex-col gap-1 ${href ? "hover:border-[var(--t-border-15)] transition-colors cursor-pointer" : ""}`}
      style={{ borderColor: color ? `${color}25` : "var(--t-text-7)" }}>
      <p style={{ fontFamily: "var(--font-bebas)", color: color ?? "var(--t-text)" }} className="text-3xl md:text-4xl tracking-wide leading-none">{value}</p>
      <p className="text-[0.48rem] tracking-[0.2em] uppercase text-[var(--t-text-30)]">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function CRMDashboard() {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [msgs,     setMsgs]     = useState<Msg[]>([]);
  const [checkins, setCheckins] = useState<Ck[]>([]);
  const [seanceCounts, setSeanceCounts] = useState<Map<string, number>>(new Map());
  const [mesosEnding, setMesosEnding]   = useState<MesoEnding[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [treated,  setTreated]  = useState<Set<string>>(new Set());
  const [myEmail,  setMyEmail]  = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied,     setCopied]     = useState<"code" | "link" | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMyEmail(user?.email ?? "");
      if (user) {
        const { data: coach } = await supabase.from("coaches").select("code").eq("profile_id", user.id).single();
        if (coach?.code) setInviteCode(coach.code);
      }
      const todayISO = new Date().toISOString().split("T")[0];
      const in7ISO   = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      const [{ data: c }, { data: m }, { data: ck }, { data: s }, { data: mesos }] = await Promise.all([
        supabase.from("profiles").select("id,email,prenom,nom,status,subscription_end,pipeline_stage,updated_at").order("updated_at", { ascending: false }),
        supabase.from("messages").select("from_email,to_email,content,created_at").order("created_at", { ascending: true }),
        supabase.from("weekly_checkins").select("client_id,week_date,weight,compliance,created_at").order("created_at", { ascending: false }).limit(20),
        supabase.from("programme_seances").select("assigned_to_email"),
        supabase.from("mesocycles").select("client_id,nom,date_fin").gte("date_fin", todayISO).lte("date_fin", in7ISO),
      ]);
      setClients((c ?? []) as Client[]);
      setMsgs((m ?? []) as Msg[]);
      setCheckins((ck ?? []) as Ck[]);
      const counts = new Map<string, number>();
      for (const row of s ?? []) {
        const email = (row as { assigned_to_email: string | null }).assigned_to_email;
        if (email) counts.set(email, (counts.get(email) ?? 0) + 1);
      }
      setSeanceCounts(counts);
      setMesosEnding((mesos ?? []) as MesoEnding[]);
      setLoading(false);
    })();

    // Lire l'état "traité" de l'inbox (localStorage)
    try {
      const raw = localStorage.getItem("crm_treated_convs");
      if (raw) setTreated(new Set(JSON.parse(raw)));
    } catch {}

    // Realtime : nouveaux messages + mise à jour du treated
    window.addEventListener("storage", () => {
      try {
        const raw = localStorage.getItem("crm_treated_convs");
        setTreated(raw ? new Set(JSON.parse(raw)) : new Set());
      } catch {}
    });

    const ch = supabase.channel("crm_dashboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, p => {
        setMsgs(prev => [...prev, p.new as Msg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Compute KPIs ──
  const actifs    = clients.filter(c => (c.status ?? "actif") === "actif").length;
  const enRisque  = clients.filter(c => (c.pipeline_stage ?? "actif") === "en_risque").length;
  const churne    = clients.filter(c => (c.pipeline_stage ?? "actif") === "churne").length;
  const now       = Date.now();
  const in14      = clients.filter(c => { if (!c.subscription_end) return false; const d = new Date(c.subscription_end).getTime(); return d > now && d < now + 14 * 86400000; }).length;
  // Onboarding/actif sans aucune séance envoyée : un prospect n'a pas encore de programme à
  // recevoir, ça ne compte donc pas comme un oubli à corriger.
  const sansProgramme = clients.filter(c => ["onboarding", "actif"].includes(c.pipeline_stage ?? "actif") && !(seanceCounts.get(c.email) ?? 0));

  // Unread convs: last message from client (pas moi)
  const convLastFrom = new Map<string, Msg>();
  for (const m of msgs) {
    const client = m.from_email === myEmail ? m.to_email : m.from_email;
    if (client !== myEmail) convLastFrom.set(client, m);
  }
  const nonRepondus = [...convLastFrom.entries()].filter(([email, m]) => m.from_email !== myEmail && !treated.has(email)).length;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const ckThisWeek = checkins.filter(c => c.week_date >= weekAgo).length;

  // ── Alerts ──
  type Alert = { type: "message" | "risque" | "abonnement" | "churn" | "sans_programme" | "mesocycle"; label: string; sub: string; href: string; color: string };
  const alerts: Alert[] = [];

  for (const [email, m] of convLastFrom) {
    if (m.from_email !== myEmail && !treated.has(email)) {
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
  sansProgramme.forEach(c => {
    alerts.push({ type: "sans_programme", label: `${c.prenom} ${c.nom} — sans programme`, sub: "Aucune séance envoyée", href: `/crm/programmes?client=${encodeURIComponent(c.email)}`, color: "#c9a84c" });
  });
  mesosEnding.forEach(me => {
    const p = clients.find(c => c.id === me.client_id);
    const name = p ? `${p.prenom} ${p.nom}` : "Client";
    const daysLeft = Math.ceil((new Date(me.date_fin).getTime() - now) / 86400000);
    alerts.push({ type: "mesocycle", label: `${name} — mésocycle "${me.nom}"`, sub: daysLeft <= 0 ? "Se termine aujourd'hui" : `Se termine dans ${daysLeft}j`, href: p ? `/crm/programmes?client=${encodeURIComponent(p.email)}` : "/crm/clients", color: "#c9a84c" });
  });

  // Recent check-ins enriched with client name
  const recentCks = checkins.slice(0, 6).map(ck => {
    const p = clients.find(c => c.id === ck.client_id);
    return { ...ck, name: p ? `${p.prenom} ${p.nom}` : "—" };
  });

  // Recent messages (last per conv, from client, non traités)
  const recentMsgs = [...convLastFrom.entries()]
    .filter(([email, m]) => m.from_email !== myEmail && !treated.has(email))
    .map(([, m]) => m)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(m => {
      const p = clients.find(c => c.email === m.from_email);
      return { ...m, name: p ? `${p.prenom} ${p.nom}` : m.from_email };
    });

  const inviteLink = inviteCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/login?mode=register&invite=${inviteCode}` : "";
  const copy = (text: string, what: "code" | "link") => {
    navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1800);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-[0.65rem] tracking-[0.35em] text-[#c9a84c] uppercase mb-1">Plateforme coaching</p>
        <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl md:text-5xl text-[var(--t-text)] tracking-wide">DASHBOARD</h1>
        <p className="text-[var(--t-text-30)] text-xs mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Inviter un client */}
      {inviteCode && (
        <div className="border border-[#c9a84c]/20 bg-[#c9a84c]/5 rounded-xl p-4 md:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#c9a84c] mb-1">Inviter un client</p>
            <p className="text-xs text-[var(--t-text-40)]">Code coach : <span style={{ fontFamily: "var(--font-bebas)" }} className="text-[var(--t-text)] tracking-[0.2em] text-sm">{inviteCode}</span></p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => copy(inviteCode, "code")}
              className="px-3 py-2 border border-[var(--t-border)] text-[var(--t-text-50)] text-[0.6rem] tracking-[0.1em] uppercase hover:border-[var(--t-text-25)] hover:text-[var(--t-text-80)] transition-colors rounded-xl">
              {copied === "code" ? "Copié ✓" : "Copier le code"}
            </button>
            <button onClick={() => copy(inviteLink, "link")}
              className="px-3 py-2 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.1em] uppercase shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl">
              {copied === "link" ? "Copié ✓" : "Copier le lien"}
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-6 md:mb-8">
        <KPI label="Clients actifs"    value={actifs}       color="#7eb8a0" href="/crm/clients"/>
        <KPI label="En risque"         value={enRisque}     color="#e09070" href="/crm/pipeline"/>
        <KPI label="Churné"            value={churne}       color="#e07070" href="/crm/pipeline"/>
        <KPI label="Exp. < 14j"        value={in14}         color="#c9a84c" href="/crm/clients"/>
        <KPI label="Non répondus"      value={nonRepondus}  color="#c9a84c" href="/crm/inbox"/>
        <KPI label="Sans programme"    value={sansProgramme.length} color="#c9a84c" href="/crm/programmes"/>
        <KPI label="Check-ins / 7j"    value={ckThisWeek}  />
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <p className="text-[0.65rem] tracking-[0.25em] uppercase text-[var(--t-text-25)] mb-3">Alertes ({alerts.length})</p>
          <div className="flex flex-col gap-2">
            {alerts.slice(0, 8).map((a, i) => (
              <Link key={i} href={a.href}
                className="flex items-center justify-between gap-2 rounded-xl border px-3 md:px-4 py-3 hover:bg-[var(--t-glass-bg)] transition-colors"
                style={{ borderColor: `${a.color}25`, backgroundColor: `${a.color}07` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1 h-5 shrink-0" style={{ backgroundColor: a.color }}/>
                  <p className="text-xs text-[var(--t-text-70)] truncate">{a.label}</p>
                </div>
                <span className="text-[0.48rem] tracking-wider text-[var(--t-text-30)] shrink-0">{a.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent check-ins */}
        <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#c9a84c]">Derniers check-ins</p>
            <Link href="/crm/clients" className="text-[0.45rem] tracking-wider uppercase text-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">Voir tout →</Link>
          </div>
          {recentCks.length === 0 ? (
            <p className="text-[var(--t-text-20)] text-xs">Aucun check-in</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentCks.map((ck, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--t-border-soft)] last:border-0">
                  <div>
                    <p className="text-xs text-[var(--t-text-65)]">{ck.name}</p>
                    <p className="text-[0.45rem] text-[var(--t-text-25)]">
                      {new Date(ck.week_date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    {ck.weight && <span className="text-sm text-[var(--t-text-60)] font-medium">{ck.weight} kg</span>}
                    {ck.compliance && (
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <div key={n} className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: n <= ck.compliance! ? "#c9a84c" : "var(--t-text-7)" }}/>
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
        <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#c9a84c]">Messages en attente</p>
            <Link href="/crm/inbox" className="text-[0.45rem] tracking-wider uppercase text-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">Inbox →</Link>
          </div>
          {recentMsgs.length === 0 ? (
            <p className="text-[var(--t-text-20)] text-xs">Tout est répondu ✓</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentMsgs.map((m, i) => (
                <Link key={i} href={`/crm/inbox?client=${encodeURIComponent(m.from_email)}`}
                  className="flex items-start gap-3 py-2 border-b border-[var(--t-border-soft)] last:border-0 hover:opacity-80 transition-opacity">
                  <div className="w-6 h-6 rounded-full border border-[#e07070]/30 bg-[#e07070]/5 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[0.65rem] text-[#e07070] font-bold">{m.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--t-text-70)] truncate">{m.name}</p>
                    <p className="text-[0.65rem] text-[var(--t-text-30)] truncate mt-0.5">{m.content}</p>
                  </div>
                  <span className="text-[0.42rem] text-[var(--t-text-20)] shrink-0 mt-0.5">
                    {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Pipeline snapshot */}
      <div className="mt-6 border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#c9a84c]">Répartition pipeline</p>
          <Link href="/crm/pipeline" className="text-[0.45rem] tracking-wider uppercase text-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">Vue complète →</Link>
        </div>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(STAGE_LABEL).map(([key, label]) => {
            const count = clients.filter(c => (c.pipeline_stage ?? "actif") === key).length;
            return (
              <div key={key} className="flex items-center gap-2 rounded-full border px-3 py-2"
                style={{ borderColor: `${STAGE_COLOR[key]}30` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STAGE_COLOR[key] }}/>
                <p className="text-[0.65rem] tracking-wider uppercase" style={{ color: STAGE_COLOR[key] }}>{label}</p>
                <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg text-[var(--t-text-70)] tracking-wide leading-none">{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

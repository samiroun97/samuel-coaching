"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadClientStatuses, statusFor, STATUS_LEVEL_COLOR, type ClientStatus } from "@/lib/clientStatus";
import { Icon } from "@/components/Icon";
import { MoreHorizontal, Clock, MessageCircle } from "@/lib/solarIcons";

// Board kanban façon CRM open source (Twenty, Plane, Attio) : une colonne par étape du
// pipeline, une carte par client, glisser-déposer pour changer d'étape. Sur mobile (pas de
// drag HTML5 au toucher), le bouton "…" de chaque carte ouvre la liste des étapes.
// Partagé entre /crm/pipeline (variant "page" : grand titre + board) et le dashboard coach
// (variant "section" : répartition seule + lien vers la vue complète).
const STAGES = [
  { key: "prospect",   label: "Prospect",   color: "#8a8a8a", hint: "Premier contact" },
  { key: "onboarding", label: "Onboarding", color: "#c9a84c", hint: "Mise en route" },
  { key: "actif",      label: "Actif",      color: "#7eb8a0", hint: "Suivi en cours" },
  { key: "en_risque",  label: "En risque",  color: "#e09070", hint: "À relancer" },
  { key: "churne",     label: "Churné",     color: "#e07070", hint: "Parti" },
  { key: "reactive",   label: "Réactivé",   color: "#6ea8d9", hint: "De retour" },
] as const;
type StageKey = typeof STAGES[number]["key"];

type Client = { id: string; email: string; prenom: string; nom: string; avatar_url: string | null; pipeline_stage: StageKey | null; subscription_end: string | null; is_coach: boolean | null };

const stageOf = (c: Client): StageKey => c.pipeline_stage ?? "actif";

function Avatar({ c, color }: { c: Client; color: string }) {
  const initials = `${c.prenom?.[0] ?? ""}${c.nom?.[0] ?? ""}`.toUpperCase() || "?";
  if (c.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" style={{ boxShadow: `0 0 0 2px ${color}40` }}/>;
  }
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[0.7rem] font-bold"
      style={{ background: `linear-gradient(145deg, ${color}35, ${color}12)`, color, boxShadow: `inset 0 0 0 1px ${color}30` }}>
      {initials}
    </div>
  );
}

function activityText(s: ClientStatus): string {
  if (s.pendingMessageDays !== null) return `Message en attente · ${s.pendingMessageDays}j`;
  return s.daysSinceSeance === null ? "Aucune séance" : `Séance il y a ${s.daysSinceSeance}j`;
}

export function PipelineBoard({ variant = "page" }: { variant?: "page" | "section" }) {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [statuses, setStatuses] = useState<Map<string, ClientStatus>>(new Map());
  const [loading,  setLoading]  = useState(true);
  const [dragId,   setDragId]   = useState<string | null>(null);
  const [overCol,  setOverCol]  = useState<StageKey | null>(null);
  const [menuFor,  setMenuFor]  = useState<string | null>(null);
  const [error,    setError]    = useState("");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles")
        .select("id,email,prenom,nom,avatar_url,pipeline_stage,subscription_end,is_coach")
        .order("updated_at", { ascending: false });
      setClients(((data ?? []) as Client[]).filter(c => !c.is_coach && c.id !== user?.id));
      setLoading(false);
      if (user?.email) loadClientStatuses(user.email).then(setStatuses).catch(() => {});
    })();
  }, []);

  // Mise à jour optimiste : la carte change de colonne tout de suite, et revient à sa place
  // si l'écriture Supabase échoue.
  const moveTo = async (id: string, stage: StageKey) => {
    const prev = clients.find(c => c.id === id);
    if (!prev || stageOf(prev) === stage) return;
    setClients(cs => cs.map(c => c.id === id ? { ...c, pipeline_stage: stage } : c));
    setMenuFor(null);
    const { error: err } = await supabase.from("profiles").update({ pipeline_stage: stage }).eq("id", id);
    if (err) {
      setClients(cs => cs.map(c => c.id === id ? { ...c, pipeline_stage: prev.pipeline_stage } : c));
      setError("Impossible de déplacer ce client, réessaie.");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) return (
    <div className={`flex items-center justify-center ${variant === "page" ? "h-full min-h-screen" : "py-12"}`}>
      <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const total = clients.length;
  const byStage = new Map<StageKey, Client[]>(STAGES.map(s => [s.key, clients.filter(c => stageOf(c) === s.key)]));

  return (
    <div className={variant === "page" ? "p-4 md:p-8" : ""} onClick={() => setMenuFor(null)}>
      {/* Header */}
      {variant === "page" ? (
        <div className="mb-6 md:mb-8 max-w-6xl">
          <p className="text-[0.65rem] tracking-[0.35em] text-[#c9a84c] uppercase mb-1">Suivi clients</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl md:text-5xl text-[var(--t-text)] tracking-wide">PIPELINE</h1>
          <p className="text-[var(--t-text-30)] text-xs mt-1">
            {total} client{total > 1 ? "s" : ""} · glisse une carte pour changer d&apos;étape
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4 max-w-6xl">
          <div>
            <p className="text-[0.65rem] tracking-[0.22em] uppercase text-[#c9a84c]">Pipeline</p>
            <p className="text-[0.6rem] text-[var(--t-text-25)] mt-0.5">{total} client{total > 1 ? "s" : ""}</p>
          </div>
          <Link href="/crm/pipeline" className="text-[0.45rem] tracking-wider uppercase text-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">Vue complète →</Link>
        </div>
      )}

      {/* Répartition — barre segmentée + légende */}
      <div className={`${variant === "page" ? "mb-8" : "max-w-6xl"} border border-[var(--t-text-7)] bg-[var(--t-surface)] shadow-[0_2px_12px_-8px_rgba(0,0,0,0.18)] rounded-2xl p-4 md:p-5`}>
        <div className="flex h-3 rounded-full overflow-hidden bg-[var(--t-track)] gap-[2px]">
          {STAGES.map(s => {
            const n = byStage.get(s.key)!.length;
            if (!n) return null;
            return <div key={s.key} title={`${s.label} : ${n}`} className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(n / total) * 100}%`, background: `linear-gradient(180deg, ${s.color}, ${s.color}bb)` }}/>;
          })}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          {STAGES.map(s => {
            const n = byStage.get(s.key)!.length;
            const pct = total ? Math.round((n / total) * 100) : 0;
            return (
              <div key={s.key} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}/>
                  <span className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--t-text-40)]">{s.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span style={{ fontFamily: "var(--font-bebas)", color: n ? s.color : "var(--t-text-20)" }} className="text-2xl tracking-wide leading-none">{n}</span>
                  <span className="text-[0.6rem] text-[var(--t-text-25)]">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mb-4 rounded-xl border border-[#e07070]/30 bg-[#e07070]/10 px-4 py-2.5 text-xs text-[#e07070]">{error}</div>
      )}

      {/* Board — uniquement sur la page Pipeline ; le dashboard n'affiche que la répartition. */}
      {variant === "page" && (
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory lg:grid lg:grid-cols-6 lg:gap-2.5 lg:overflow-visible lg:snap-none">
        {STAGES.map(s => {
          const cards = byStage.get(s.key)!;
          const isOver = overCol === s.key && dragId !== null;
          return (
            <div key={s.key}
              onDragOver={e => { e.preventDefault(); if (overCol !== s.key) setOverCol(s.key); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null); }}
              onDrop={e => { e.preventDefault(); if (dragId) moveTo(dragId, s.key); setDragId(null); setOverCol(null); }}
              className="snap-start shrink-0 w-[78vw] sm:w-64 lg:w-auto lg:min-w-0 rounded-2xl border flex flex-col transition-all duration-200"
              style={{
                borderColor: isOver ? `${s.color}80` : "var(--t-text-7)",
                background: isOver ? `${s.color}12` : `linear-gradient(180deg, ${s.color}0d, transparent 140px), var(--t-surface)`,
                boxShadow: isOver ? `0 0 0 3px ${s.color}20` : undefined,
              }}>
              {/* En-tête de colonne */}
              <div className="px-4 lg:px-3 pt-3.5 pb-3">
                <div className="h-1 w-10 rounded-full mb-3" style={{ backgroundColor: s.color }}/>
                <div className="flex items-center justify-between">
                  <p className="text-[0.7rem] font-bold tracking-[0.18em] uppercase" style={{ color: s.color }}>{s.label}</p>
                  <span className="min-w-6 h-6 px-2 rounded-full flex items-center justify-center text-[0.65rem] font-bold"
                    style={{ backgroundColor: `${s.color}1f`, color: s.color }}>{cards.length}</span>
                </div>
                <p className="text-[0.6rem] text-[var(--t-text-25)] mt-0.5">{s.hint}</p>
              </div>

              {/* Cartes */}
              <div className="flex flex-col gap-2 px-2.5 lg:px-2 pb-3 min-h-[120px] flex-1">
                {cards.length === 0 && (
                  <div className="flex-1 rounded-xl border border-dashed flex items-center justify-center text-[0.6rem] tracking-wider uppercase text-[var(--t-text-20)] py-6"
                    style={{ borderColor: isOver ? `${s.color}80` : "var(--t-border)" }}>
                    {isOver ? "Déposer ici" : "Aucun client"}
                  </div>
                )}
                {cards.map(c => {
                  const st = statusFor(statuses, c.email);
                  const daysLeft = c.subscription_end ? Math.ceil((new Date(c.subscription_end).getTime() - now) / 86400000) : null;
                  const expiring = daysLeft !== null && daysLeft > 0 && daysLeft <= 14;
                  return (
                    <div key={c.id} draggable
                      onDragStart={e => { setDragId(c.id); e.dataTransfer.effectAllowed = "move"; }}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      className={`group relative rounded-xl border bg-[var(--t-surface)] p-3 lg:p-2.5 cursor-grab active:cursor-grabbing transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)] ${dragId === c.id ? "opacity-40 scale-[0.98]" : ""}`}
                      style={{ borderColor: "var(--t-border-soft)", boxShadow: `inset 3px 0 0 ${s.color}` }}>
                      <div className="flex items-center gap-2.5 lg:gap-2">
                        <Avatar c={c} color={s.color}/>
                        <Link href={`/crm/clients?client=${c.id}`} className="min-w-0 flex-1" draggable={false}>
                          <p className="text-sm text-[var(--t-text-80)] font-medium truncate group-hover:text-[var(--t-text)]">{c.prenom} {c.nom}</p>
                          <p className="text-[0.6rem] text-[var(--t-text-30)] truncate">{c.email}</p>
                        </Link>
                        <button onClick={e => { e.stopPropagation(); setMenuFor(menuFor === c.id ? null : c.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--t-text-30)] hover:bg-[var(--t-glass-bg)] hover:text-[var(--t-text-70)] transition-colors shrink-0"
                          aria-label="Changer d'étape">
                          <Icon icon={MoreHorizontal} size={16}/>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.58rem]"
                          style={{ backgroundColor: `${STATUS_LEVEL_COLOR[st.level]}14`, color: STATUS_LEVEL_COLOR[st.level] }}>
                          <Icon icon={st.pendingMessageDays !== null ? MessageCircle : Clock} size={10}/>
                          {activityText(st)}
                        </span>
                        {expiring && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.58rem] bg-[#c9a84c]/12 text-[#c9a84c]">
                            Exp. {daysLeft}j
                          </span>
                        )}
                      </div>

                      {menuFor === c.id && (
                        <div onClick={e => e.stopPropagation()}
                          className="absolute right-2 top-11 z-20 w-44 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)] p-1.5">
                          <p className="text-[0.5rem] tracking-[0.2em] uppercase text-[var(--t-text-25)] px-2 py-1">Déplacer vers</p>
                          {STAGES.map(t => (
                            <button key={t.key} onClick={() => moveTo(c.id, t.key)} disabled={t.key === s.key}
                              className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-left text-[var(--t-text-70)] hover:bg-[var(--t-glass-bg)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}/>{t.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";

type Msg    = { id: string; from_email: string; to_email: string; content: string; created_at: string };

const FEEDBACK_RE = /^\[FEEDBACK:(bug|suggestion|idee)\]\n([\s\S]*)/;
const FEEDBACK_CFG: Record<string, { label: string; color: string; emoji: string }> = {
  bug:        { label: "Bug",        color: "#e07070", emoji: "🐛" },
  suggestion: { label: "Suggestion", color: "#c9a84c", emoji: "💡" },
  idee:       { label: "Idée",       color: "#a08ec9", emoji: "✨" },
};
function parseFeedback(content: string) {
  const m = content.match(FEEDBACK_RE);
  if (!m) return null;
  return { type: m[1] as keyof typeof FEEDBACK_CFG, text: m[2] };
}

const BODYFAT_RE = /^\[BODYFAT_CHECK:(\{[\s\S]*\})\]$/;
type BFCheck = { bf: number; date: string; note: string; points_forts: string; points_faibles: string; conseils: string };
function parseBFCheck(content: string): BFCheck | null {
  const m = content.match(BODYFAT_RE);
  if (!m) return null;
  try { return JSON.parse(m[1]) as BFCheck; } catch { return null; }
}
type Client = { id: string; email: string; prenom: string; nom: string; poids: number; pipeline_stage: string | null; subscription_end: string | null; objectifs: string };

const STAGE_CFG: Record<string, { label: string; color: string }> = {
  prospect:   { label: "Prospect",   color: "#888" },
  onboarding: { label: "Onboarding", color: "#c9a84c" },
  actif:      { label: "Actif",      color: "#7eb8a0" },
  en_risque:  { label: "En risque",  color: "#e09070" },
  churne:     { label: "Churné",     color: "#e07070" },
  reactive:   { label: "Réactivé",   color: "#a08ec9" },
};

const TEMPLATES = [
  { label: "Bienvenue",         text: "Bonjour ! Bienvenue dans l'espace Samuel Coaching. Je suis disponible ici pour répondre à toutes tes questions. N'hésite pas !" },
  { label: "Rappel suivi",      text: "Bonjour ! Je voulais juste faire un point avec toi — comment ça se passe cette semaine côté nutrition et entraînements ?" },
  { label: "Relance inactivité",text: "Salut ! Je n'ai pas eu de tes nouvelles depuis quelques jours. Tout va bien ? Je suis là si tu as des questions ou besoin d'ajustements." },
  { label: "Félicitations",     text: "Excellent travail cette semaine ! Tes efforts paient vraiment, continue comme ça 💪" },
];

export default function InboxPage() {
  const searchParams  = useSearchParams();
  const [clients,     setClients]     = useState<Client[]>([]);
  const [msgs,        setMsgs]        = useState<Msg[]>([]);
  const [activeEmail, setActiveEmail] = useState<string | null>(searchParams.get("client"));
  const [input,       setInput]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [showTpls,    setShowTpls]    = useState(false);
  const [treated,     setTreated]     = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("crm_treated_convs");
    if (raw) { try { setTreated(new Set(JSON.parse(raw))); } catch {} }
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: m }] = await Promise.all([
        supabase.from("profiles").select("id,email,prenom,nom,poids,pipeline_stage,subscription_end,objectifs").order("updated_at", { ascending: false }),
        supabase.from("messages").select("*").order("created_at", { ascending: true }),
      ]);
      setClients((c ?? []) as Client[]);
      setMsgs((m ?? []) as Msg[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const ch = supabase.channel("crm_inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, p => {
        const m = p.new as Msg;
        setMsgs(prev => [...prev, m]);
        if (m.from_email !== SAMUEL_EMAIL) {
          setTreated(prev => {
            const next = new Set(prev);
            next.delete(m.from_email);
            localStorage.setItem("crm_treated_convs", JSON.stringify([...next]));
            return next;
          });
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, activeEmail]);

  // Auto-traiter quand on ouvre une conversation
  useEffect(() => {
    if (!activeEmail) return;
    setTreated(prev => {
      if (prev.has(activeEmail)) return prev;
      const next = new Set(prev);
      next.add(activeEmail);
      localStorage.setItem("crm_treated_convs", JSON.stringify([...next]));
      return next;
    });
  }, [activeEmail]);

  // Group conversations
  type Conv = { email: string; name: string; msgs: Msg[]; lastMsg: Msg; unread: boolean };
  const convs: Conv[] = (() => {
    const map = new Map<string, Msg[]>();
    for (const m of msgs) {
      const key = m.from_email === SAMUEL_EMAIL ? m.to_email : m.from_email;
      if (key === SAMUEL_EMAIL) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()].map(([email, ms]) => {
      const p = clients.find(c => c.email === email);
      const last = ms[ms.length - 1];
      return { email, name: p ? `${p.prenom} ${p.nom}` : email, msgs: ms, lastMsg: last, unread: last.from_email !== SAMUEL_EMAIL && !treated.has(email) };
    }).sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime();
    });
  })();

  const activeConv  = convs.find(c => c.email === activeEmail);
  const activeClient = clients.find(c => c.email === activeEmail);
  const stage = activeClient ? (STAGE_CFG[activeClient.pipeline_stage ?? "actif"] ?? STAGE_CFG.actif) : null;

  const toggleTreated = (email: string) => {
    setTreated(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email); else next.add(email);
      localStorage.setItem("crm_treated_convs", JSON.stringify([...next]));
      return next;
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !activeEmail) return;
    setSending(true); setInput(""); setShowTpls(false);
    await supabase.from("messages").insert({ from_email: SAMUEL_EMAIL, to_email: activeEmail, content: text });
    setTreated(prev => {
      const next = new Set(prev);
      next.add(activeEmail);
      localStorage.setItem("crm_treated_convs", JSON.stringify([...next]));
      return next;
    });
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="flex h-[calc(100dvh-50px-env(safe-area-inset-bottom))] md:h-screen overflow-hidden">

      {/* ── Left: conversation list (plein écran sur mobile quand aucune conv ouverte) ── */}
      <div className={`${activeConv ? "hidden md:flex" : "flex"} w-full md:w-72 shrink-0 border-r border-white/5 flex-col bg-[#0a0a0a]`}>
        <div className="px-4 md:px-5 pt-5 md:pt-6 pb-4 border-b border-white/5">
          <p className="text-[0.65rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">CRM</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide">INBOX</h1>
          <p className="text-white/30 text-xs mt-1">
            {convs.filter(c => c.unread).length} non répondu{convs.filter(c => c.unread).length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {convs.length === 0 ? (
            <div className="p-8 text-center"><p className="text-white/20 text-xs">Aucune conversation</p></div>
          ) : convs.map(conv => {
            const isActive = activeEmail === conv.email;
            return (
              <button key={conv.email} onClick={() => setActiveEmail(conv.email)}
                className={`w-full text-left px-4 py-3.5 mb-1 border transition-all ${isActive ? "border-[#c9a84c]/30 bg-[#c9a84c]/5 rounded-lg" : conv.unread ? "border-[#e07070]/15 bg-[#e07070]/3 rounded-lg" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02] rounded-lg"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {conv.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#e07070] shrink-0"/>}
                    <p className={`text-sm font-medium truncate ${conv.unread ? "text-white" : isActive ? "text-white" : "text-white/60"}`}>{conv.name}</p>
                  </div>
                  <span className="text-[0.4rem] text-white/20 shrink-0">
                    {new Date(conv.lastMsg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="text-[0.48rem] text-white/30 truncate">
                  {conv.lastMsg.from_email === SAMUEL_EMAIL ? "Vous : " : ""}
                  {(() => {
                    const fb = parseFeedback(conv.lastMsg.content);
                    if (fb) return `${FEEDBACK_CFG[fb.type].emoji} ${FEEDBACK_CFG[fb.type].label} — ${fb.text}`;
                    return conv.lastMsg.content;
                  })()}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: conversation ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Conv header + client mini-profile */}
          <div className="border-b border-white/5 px-4 md:px-8 pt-4 md:pt-5 pb-4 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <button onClick={() => setActiveEmail(null)} className="md:hidden text-white/40 hover:text-white/70 transition-colors mt-1 shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="min-w-0">
                  <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl md:text-3xl text-white tracking-wide truncate">{activeConv.name}</h2>
                  <p className="text-[0.48rem] text-white/25 tracking-wider mt-0.5 truncate">{activeEmail}</p>
                </div>
              </div>
              {activeEmail && (() => {
                const isTreated = treated.has(activeEmail);
                return (
                  <button onClick={() => toggleTreated(activeEmail)}
                    className={`flex items-center gap-1.5 text-[0.5rem] tracking-[0.12em] uppercase px-3 py-1.5 border rounded-full transition-all ${
                      isTreated
                        ? "border-[#7eb8a0]/40 text-[#7eb8a0] bg-[#7eb8a0]/8 hover:opacity-70"
                        : "border-white/10 text-white/30 hover:border-[#7eb8a0]/40 hover:text-[#7eb8a0]/70"
                    }`}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isTreated ? 2.5 : 1.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {isTreated ? "Traité" : "Marquer traité"}
                  </button>
                );
              })()}
              {/* Mini profile */}
              {activeClient && (
                <div className="hidden md:flex items-center gap-4 text-right">
                  {activeClient.poids && (
                    <div>
                      <p className="text-[0.42rem] tracking-wider text-white/20 uppercase mb-0.5">Poids</p>
                      <p className="text-sm text-white/60 font-medium">{activeClient.poids} kg</p>
                    </div>
                  )}
                  {activeClient.pipeline_stage && (
                    <div>
                      <p className="text-[0.42rem] tracking-wider text-white/20 uppercase mb-0.5">Stage</p>
                      <span className="text-[0.45rem] tracking-wider uppercase px-1.5 py-0.5 border rounded-full" style={{ color: stage!.color, borderColor: `${stage!.color}35` }}>{stage!.label}</span>
                    </div>
                  )}
                  {activeClient.subscription_end && (
                    <div>
                      <p className="text-[0.42rem] tracking-wider text-white/20 uppercase mb-0.5">Fin abo.</p>
                      <p className="text-[0.65rem] text-white/40">{new Date(activeClient.subscription_end + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {activeClient?.objectifs && (
              <p className="text-[0.48rem] text-white/20 mt-2 line-clamp-1">🎯 {activeClient.objectifs}</p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 md:px-8 py-4 md:py-6 flex flex-col gap-3">
            {activeConv.msgs.map(m => {
              const isMe = m.from_email === SAMUEL_EMAIL;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-7 h-7 border border-white/10 rounded-full flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                      <span className="text-[0.55rem] text-white/40 font-bold">{activeConv.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="max-w-[85%] md:max-w-md">
                    {(() => {
                      // Body fat check-in partagé
                      const bfc = !isMe ? parseBFCheck(m.content) : null;
                      if (bfc) {
                        return (
                          <div className="overflow-hidden border-l-2"
                            style={{ borderLeftColor: "#7eb8a0", borderTop: "1px solid #7eb8a025", borderRight: "1px solid #7eb8a025", borderBottom: "1px solid #7eb8a025", boxShadow: "0 0 16px #7eb8a015" }}>
                            <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: "#7eb8a015" }}>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">📊</span>
                                <span className="text-[0.48rem] tracking-[0.2em] uppercase font-bold text-[#7eb8a0]">Bilan Body Fat</span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide leading-none">{bfc.bf}</span>
                                <span className="text-[0.45rem] text-white/40">%</span>
                              </div>
                            </div>
                            <div className="px-4 py-3 bg-[#0d0d0d] flex flex-col gap-2">
                              {bfc.note && <p className="text-[0.65rem] text-white/40 italic">{bfc.note}</p>}
                              {bfc.points_forts   && <div className="flex gap-2"><span className="text-[0.45rem] text-[#7eb8a0] uppercase tracking-wider shrink-0 w-16 pt-px">Points forts</span><p className="text-[0.65rem] text-white/50 leading-relaxed">{bfc.points_forts}</p></div>}
                              {bfc.points_faibles && <div className="flex gap-2"><span className="text-[0.45rem] text-[#e07070] uppercase tracking-wider shrink-0 w-16 pt-px">À travailler</span><p className="text-[0.65rem] text-white/50 leading-relaxed">{bfc.points_faibles}</p></div>}
                              {bfc.conseils       && <div className="flex gap-2"><span className="text-[0.45rem] text-[#c9a84c] uppercase tracking-wider shrink-0 w-16 pt-px">Conseils</span><p className="text-[0.65rem] text-white/50 leading-relaxed">{bfc.conseils}</p></div>}
                            </div>
                          </div>
                        );
                      }
                      // Feedback
                      const fb = !isMe ? parseFeedback(m.content) : null;
                      if (fb) {
                        const cfg = FEEDBACK_CFG[fb.type];
                        return (
                          <div className="overflow-hidden border-l-2"
                            style={{ borderLeftColor: cfg.color, borderTop: `1px solid ${cfg.color}35`, borderRight: `1px solid ${cfg.color}35`, borderBottom: `1px solid ${cfg.color}35`, boxShadow: `0 0 16px ${cfg.color}20` }}>
                            <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: `${cfg.color}20` }}>
                              <span className="text-sm">{cfg.emoji}</span>
                              <span className="text-[0.48rem] tracking-[0.2em] uppercase font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                            </div>
                            <div className="px-4 py-3 text-xs leading-relaxed whitespace-pre-line text-white/75 bg-[#0d0d0d]">{fb.text}</div>
                          </div>
                        );
                      }
                      return (
                        <div className={`px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${isMe ? "bg-[#c9a84c] text-black rounded-lg" : "bg-[#111] border border-white/8 text-white/60 rounded-lg"}`}>
                          {m.content}
                        </div>
                      );
                    })()}
                    <p className={`text-[0.38rem] text-white/15 mt-1 tracking-wider ${isMe ? "text-right" : ""}`}>
                      {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef}/>
          </div>

          {/* Templates + Reply */}
          <div className="border-t border-white/5 px-3 md:px-8 py-3 md:py-4 shrink-0">
            {showTpls && (
              <div className="mb-3 flex flex-wrap gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => { setInput(t.text); setShowTpls(false); }}
                    className="text-[0.48rem] tracking-wider uppercase px-3 py-1.5 border border-[#c9a84c]/25 rounded-lg text-[#c9a84c]/70 hover:border-[#c9a84c]/50 hover:text-[#c9a84c] transition-colors">
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 md:gap-3">
              <button onClick={() => setShowTpls(v => !v)}
                className={`shrink-0 px-2.5 md:px-3 py-3 border rounded-lg text-[0.48rem] tracking-wider uppercase transition-colors ${showTpls ? "border-[#c9a84c]/40 text-[#c9a84c]/70 bg-[#c9a84c]/5" : "border-white/10 text-white/25 hover:border-white/20"}`}>
                Templates
              </button>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Répondre à ${activeConv.name}…`} disabled={sending}
                className="flex-1 min-w-0 bg-[#111] border border-white/10 rounded-lg text-white placeholder-white/20 text-sm px-3 md:px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors disabled:opacity-50"/>
              <button onClick={send} disabled={!input.trim() || sending}
                className="bg-[#c9a84c] text-black px-4 md:px-6 py-3 text-[0.58rem] font-bold tracking-[0.15em] uppercase hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <p className="text-white/15 text-sm">Sélectionne une conversation</p>
        </div>
      )}
    </div>
  );
}

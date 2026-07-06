"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";
const SEANCE_TYPES = ["Haut du corps", "Bas du corps", "Full body", "Cardio", "Boxe", "Natation", "CrossFit", "Yoga", "Autre"];

type Client = {
  id: string; email: string; prenom: string; nom: string;
  age: number; poids: number; taille: number; sexe: string;
  niveau_activite: string; experience: string; seances_par_semaine: number;
  lieu_entrainement: string; blessures: string; alimentation: string;
  sommeil_stress: string; objectifs: string; updated_at: string;
};
type Seance = { id: string; titre: string; type_seance: string | null; date_prevue: string | null; description: string | null; exercices: string | null; assigned_to_email: string };
type DirectMsg = { id: string; from_email: string; to_email: string; content: string; created_at: string };

const imc = (p: number, t: number) => (p / ((t / 100) ** 2)).toFixed(1);

export default function AdminPage() {
  const router = useRouter();
  const [page,     setPage]     = useState<"clients" | "messages">("clients");
  const [clients,  setClients]  = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [seances,  setSeances]  = useState<Seance[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"profil" | "programme">("profil");

  const [form,    setForm]    = useState({ titre: "", type_seance: "", date_prevue: "", description: "", exercices: "" });
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  // Messages
  const [allMsgs,       setAllMsgs]       = useState<DirectMsg[]>([]);
  const [msgClient,     setMsgClient]     = useState<string | null>(null);
  const [replyInput,    setReplyInput]    = useState("");
  const [replySending,  setReplySending]  = useState(false);
  const msgBottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== SAMUEL_EMAIL) { router.push("/dashboard"); return; }

      const { data, error } = await supabase.from("profiles").select("*").order("updated_at", { ascending: false });
      if (!error && data) setClients(data as Client[]);

      const { data: msgs } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
      setAllMsgs((msgs ?? []) as DirectMsg[]);
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    const channel = supabase.channel("admin_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
        setAllMsgs(prev => [...prev, payload.new as DirectMsg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { msgBottom.current?.scrollIntoView({ behavior: "smooth" }); }, [allMsgs, msgClient]);

  const selectClient = async (c: Client) => {
    setSelected(c); setTab("profil"); setForm({ titre: "", type_seance: "", date_prevue: "", description: "", exercices: "" }); setSaveErr("");
    const { data } = await supabase.from("programme_seances").select("*").eq("assigned_to_email", c.email).order("created_at", { ascending: false });
    setSeances((data ?? []) as Seance[]);
  };

  const sendSeance = async () => {
    if (!selected || !form.titre) { setSaveErr("Le titre est requis"); return; }
    setSaving(true); setSaveErr("");
    const { error } = await supabase.from("programme_seances").insert({
      assigned_to_email: selected.email,
      titre: form.titre,
      type_seance: form.type_seance || null,
      date_prevue: form.date_prevue || null,
      description: form.description || null,
      exercices: form.exercices || null,
    });
    if (error) { setSaveErr(error.message); setSaving(false); return; }
    const { data } = await supabase.from("programme_seances").select("*").eq("assigned_to_email", selected.email).order("created_at", { ascending: false });
    setSeances((data ?? []) as Seance[]);
    setForm({ titre: "", type_seance: "", date_prevue: "", description: "", exercices: "" });
    setSaving(false);
  };

  const deleteSeance = async (id: string) => {
    await supabase.from("programme_seances").delete().eq("id", id);
    setSeances(s => s.filter(x => x.id !== id));
  };

  // Conversations groupées par client
  const conversations = (() => {
    const map = new Map<string, { msgs: DirectMsg[]; clientName: string }>();
    for (const m of allMsgs) {
      const clientEmail = m.from_email === SAMUEL_EMAIL ? m.to_email : m.from_email;
      if (clientEmail === SAMUEL_EMAIL) continue;
      if (!map.has(clientEmail)) {
        const profile = clients.find(c => c.email === clientEmail);
        map.set(clientEmail, { msgs: [], clientName: profile ? `${profile.prenom} ${profile.nom}` : clientEmail });
      }
      map.get(clientEmail)!.msgs.push(m);
    }
    return [...map.entries()]
      .map(([email, { msgs, clientName }]) => ({ email, msgs, clientName, lastMsg: msgs[msgs.length - 1] }))
      .sort((a, b) => new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime());
  })();

  const activeConv = msgClient ? conversations.find(c => c.email === msgClient) : null;

  const sendReply = async () => {
    const text = replyInput.trim();
    if (!text || replySending || !msgClient) return;
    setReplySending(true);
    setReplyInput("");
    await supabase.from("messages").insert({ from_email: SAMUEL_EMAIL, to_email: msgClient, content: text });
    setReplySending(false);
  };

  const inputCls = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const labelCls = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left panel ── */}
      <div className={`flex flex-col border-r border-white/5 bg-[#0a0a0a] transition-all ${(selected || msgClient) ? "w-72 shrink-0" : "flex-1"}`}>
        <div className="px-6 pt-8 pb-5 border-b border-white/5">
          <p className="text-[0.55rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Administration</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide">
            {page === "clients" ? "CLIENTS" : "MESSAGES"}
          </h1>
          <p className="text-white/30 text-xs mt-1">
            {page === "clients"
              ? `${clients.length} client${clients.length > 1 ? "s" : ""} inscrit${clients.length > 1 ? "s" : ""}`
              : `${conversations.length} conversation${conversations.length > 1 ? "s" : ""}`}
          </p>
          {/* Page switcher */}
          <div className="flex mt-4 border border-white/10">
            {(["clients", "messages"] as const).map(p => (
              <button key={p} onClick={() => { setPage(p); setSelected(null); setMsgClient(null); }}
                className={`flex-1 py-2 text-[0.55rem] tracking-[0.12em] uppercase transition-colors ${page === p ? "bg-[#c9a84c] text-black font-bold" : "text-white/30 hover:text-white/60"}`}>
                {p === "messages" && conversations.length > 0 ? `Messages (${conversations.length})` : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3">
          {/* ── Liste clients ── */}
          {page === "clients" && (clients.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/20 text-xs">Aucun client inscrit</p>
            </div>
          ) : clients.map(c => {
            const isSelected = selected?.id === c.id;
            return (
              <button key={c.id} onClick={() => selectClient(c)}
                className={`w-full text-left px-4 py-3.5 mb-1.5 border transition-all ${isSelected ? "border-[#c9a84c]/30 bg-[#c9a84c]/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-white/70"}`}>{c.prenom} {c.nom}</p>
                    <p className="text-[0.55rem] text-white/30 mt-0.5">{c.age} ans · {c.poids} kg · {c.sexe}</p>
                    {!selected && c.objectifs && (
                      <p className="text-[0.55rem] text-white/20 mt-1 line-clamp-2 leading-relaxed">{c.objectifs}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[0.5rem] text-[#c9a84c] tracking-wider">{c.experience}</p>
                    <p className="text-[0.45rem] text-white/20 mt-0.5">{c.seances_par_semaine}×/sem</p>
                  </div>
                </div>
              </button>
            );
          }))}

          {/* ── Liste conversations ── */}
          {page === "messages" && (conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/20 text-xs">Aucun message reçu</p>
            </div>
          ) : conversations.map(conv => {
            const isActive = msgClient === conv.email;
            return (
              <button key={conv.email} onClick={() => setMsgClient(conv.email)}
                className={`w-full text-left px-4 py-3.5 mb-1.5 border transition-all ${isActive ? "border-[#c9a84c]/30 bg-[#c9a84c]/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-white/70"}`}>{conv.clientName}</p>
                  <span className="text-[0.42rem] text-white/20 shrink-0">
                    {new Date(conv.lastMsg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="text-[0.5rem] text-white/25 truncate leading-relaxed">
                  {conv.lastMsg.from_email === SAMUEL_EMAIL ? "Vous : " : ""}{conv.lastMsg.content}
                </p>
              </button>
            );
          }))}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="px-8 pt-8 pb-5 border-b border-white/5 flex items-start justify-between">
            <div>
              <p className="text-[0.5rem] tracking-[0.2em] text-white/25 uppercase mb-1">{selected.email}</p>
              <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide">{selected.prenom} {selected.nom}</h2>
              <p className="text-white/30 text-xs mt-1">
                {selected.age} ans · {selected.sexe} · {selected.poids} kg · {selected.taille} cm · IMC {imc(selected.poids, selected.taille)}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/50 transition-colors mt-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 px-8">
            {(["profil", "programme"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`py-3 mr-6 text-[0.6rem] tracking-[0.15em] uppercase border-b-2 transition-colors ${tab === t ? "border-[#c9a84c] text-[#c9a84c]" : "border-transparent text-white/30 hover:text-white/50"}`}>
                {t === "programme" ? `Programme (${seances.length})` : "Profil"}
              </button>
            ))}
          </div>

          <div className="px-8 py-6">

            {/* ── PROFIL TAB ── */}
            {tab === "profil" && (
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                {[
                  { label: "Niveau d'activité",     val: selected.niveau_activite },
                  { label: "Expérience",             val: selected.experience },
                  { label: "Séances / semaine",      val: `${selected.seances_par_semaine} séances` },
                  { label: "Lieu d'entraînement",    val: selected.lieu_entrainement },
                  { label: "Sommeil & stress",       val: selected.sommeil_stress },
                  { label: "Alimentation",           val: selected.alimentation },
                ].map(row => (
                  <div key={row.label} className="border border-white/5 bg-[#111] px-4 py-3">
                    <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">{row.label}</p>
                    <p className="text-xs text-white/60">{row.val || "—"}</p>
                  </div>
                ))}
                <div className="col-span-2 border border-white/5 bg-[#111] px-4 py-3">
                  <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Blessures / douleurs</p>
                  <p className="text-xs text-white/60 leading-relaxed">{selected.blessures || "—"}</p>
                </div>
                <div className="col-span-2 border border-[#c9a84c]/10 bg-[#0f0d07] px-4 py-3">
                  <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Objectifs</p>
                  <p className="text-xs text-white/60 leading-relaxed">{selected.objectifs || "—"}</p>
                </div>
                <div className="col-span-2 mt-2">
                  <button onClick={() => setTab("programme")}
                    className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase px-6 py-3 hover:bg-[#e2c97e] transition-colors">
                    Envoyer un programme →
                  </button>
                </div>
              </div>
            )}

            {/* ── PROGRAMME TAB ── */}
            {tab === "programme" && (
              <div className="max-w-2xl flex flex-col gap-6">

                {/* Create form */}
                <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-5">
                  <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Nouvelle séance pour {selected.prenom}</p>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Titre *</label>
                        <input className={inputCls} placeholder="Séance haut du corps" value={form.titre}
                          onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}/>
                      </div>
                      <div>
                        <label className={labelCls}>Type</label>
                        <select className={`${inputCls} cursor-pointer`} value={form.type_seance}
                          onChange={e => setForm(f => ({ ...f, type_seance: e.target.value }))}>
                          <option value="">Choisir…</option>
                          {SEANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Date prévue</label>
                      <input className={inputCls} type="date" value={form.date_prevue}
                        onChange={e => setForm(f => ({ ...f, date_prevue: e.target.value }))}/>
                    </div>
                    <div>
                      <label className={labelCls}>Description / consignes</label>
                      <textarea className={`${inputCls} resize-none`} rows={2}
                        placeholder="Objectif de la séance, intensité, conseils…" value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
                    </div>
                    <div>
                      <label className={labelCls}>Exercices (un par ligne)</label>
                      <textarea className={`${inputCls} resize-none`} rows={7}
                        placeholder={"Développé couché 4×8 @ 80kg\nTirage poulie haute 3×12\nDumbbell curl 3×15\nGainage 3×45s\n…"} value={form.exercices}
                        onChange={e => setForm(f => ({ ...f, exercices: e.target.value }))}/>
                    </div>
                    {saveErr && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{saveErr}</p>}
                    <button onClick={sendSeance} disabled={saving}
                      className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Envoi…</> : `Envoyer à ${selected.prenom} →`}
                    </button>
                  </div>
                </div>

                {/* Sent seances */}
                {seances.length > 0 && (
                  <div>
                    <p className="text-[0.55rem] tracking-[0.2em] uppercase text-white/25 mb-3">Séances envoyées ({seances.length})</p>
                    <div className="flex flex-col gap-2">
                      {seances.map(s => (
                        <div key={s.id} className="border border-white/10 bg-[#111] px-4 py-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {s.type_seance && <span className="text-[0.45rem] tracking-wider uppercase text-[#c9a84c] border border-[#c9a84c]/20 px-1.5 py-0.5">{s.type_seance}</span>}
                              <p className="text-xs text-white/70">{s.titre}</p>
                            </div>
                            {s.date_prevue && (
                              <p className="text-[0.5rem] text-white/25">
                                {new Date(s.date_prevue + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                              </p>
                            )}
                            {s.exercices && <p className="text-[0.5rem] text-white/20 mt-1 line-clamp-1">{s.exercices.split("\n")[0]}…</p>}
                          </div>
                          <button onClick={() => deleteSeance(s.id)} className="shrink-0 text-white/15 hover:text-[#e07070] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Panneau conversation ── */}
      {page === "messages" && msgClient && activeConv && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header conv */}
          <div className="px-8 pt-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <div>
              <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide">{activeConv.clientName}</h2>
              <p className="text-[0.5rem] text-white/25 tracking-wider mt-0.5">{msgClient}</p>
            </div>
            <button onClick={() => setMsgClient(null)} className="text-white/20 hover:text-white/50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-3">
            {activeConv.msgs.map(m => {
              const isMe = m.from_email === SAMUEL_EMAIL;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-6 h-6 border border-white/10 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                      <span className="text-[0.5rem] text-white/40 font-bold">
                        {activeConv.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="max-w-sm">
                    <div className={`px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                      isMe ? "bg-[#c9a84c] text-black" : "bg-[#111] border border-white/10 text-white/60"
                    }`}>
                      {m.content}
                    </div>
                    <p className={`text-[0.4rem] text-white/15 mt-1 tracking-wider ${isMe ? "text-right" : ""}`}>
                      {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={msgBottom}/>
          </div>

          {/* Reply input */}
          <div className="border-t border-white/5 px-8 py-4 flex gap-3 shrink-0">
            <input
              value={replyInput}
              onChange={e => setReplyInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              placeholder={`Répondre à ${activeConv.clientName}…`}
              disabled={replySending}
              className="flex-1 bg-[#111] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors disabled:opacity-50"
            />
            <button onClick={sendReply} disabled={!replyInput.trim() || replySending}
              className="bg-[#c9a84c] text-black px-6 py-3 text-[0.6rem] font-bold tracking-[0.15em] uppercase hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Envoyer
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {page === "clients" && !selected && clients.length > 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/10 text-sm">Sélectionne un client</p>
        </div>
      )}
      {page === "messages" && !msgClient && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/10 text-sm">Sélectionne une conversation</p>
        </div>
      )}
    </div>
  );
}

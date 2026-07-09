"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";
const SEANCE_TYPES = ["Haut du corps", "Bas du corps", "Full body", "Cardio", "Boxe", "Natation", "CrossFit", "Yoga", "Autre"];
const STATUS_CONFIG = {
  actif:   { label: "Actif",   color: "#7eb8a0" },
  essai:   { label: "Essai",   color: "#c9a84c" },
  pause:   { label: "Pause",   color: "#e09070" },
  inactif: { label: "Inactif", color: "#666666" },
} as const;
type StatusKey = keyof typeof STATUS_CONFIG;

type Client = {
  id: string; email: string; prenom: string; nom: string;
  age: number; poids: number; taille: number; sexe: string;
  niveau_activite: string; experience: string; seances_par_semaine: number;
  lieu_entrainement: string; blessures: string; alimentation: string;
  sommeil_stress: string; objectifs: string; updated_at: string;
  status: StatusKey | null; subscription_end: string | null;
};
type Seance      = { id: string; titre: string; type_seance: string | null; date_prevue: string | null; description: string | null; exercices: string | null; assigned_to_email: string };
type DirectMsg   = { id: string; from_email: string; to_email: string; content: string; created_at: string };
type DailySummary= { date: string; calories: number; proteines: number; glucides: number; lipides: number; workouts_count: number; steps: number };
type MealPlan    = { id: string; name: string; notes: string | null; is_active: boolean };
type MealPlanItem= { id: string; plan_id: string; meal_type: string; name: string; calories: number; proteines: number; glucides: number; lipides: number };
type CoachNote   = { id: string; client_id: string; content: string; created_at: string };
type WeeklyCheckin = { id: string; client_id: string; week_date: string; weight: number | null; body_fat: number | null; compliance: number | null; notes: string | null };

const imc     = (p: number, t: number) => (p / ((t / 100) ** 2)).toFixed(1);
const todayStr = () => new Date().toISOString().split("T")[0];

export default function AdminPage() {
  const router = useRouter();
  const [page,     setPage]     = useState<"clients" | "messages">("clients");
  const [clients,  setClients]  = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [seances,  setSeances]  = useState<Seance[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"profil" | "programme" | "repas" | "notes" | "checkin">("profil");

  const [form,    setForm]    = useState({ titre: "", type_seance: "", date_prevue: "", description: "", exercices: "" });
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const [clientStats,   setClientStats]   = useState<DailySummary[]>([]);
  const [mealPlans,     setMealPlans]     = useState<MealPlan[]>([]);
  const [mealItems,     setMealItems]     = useState<MealPlanItem[]>([]);
  const [activePlanId,  setActivePlanId]  = useState<string | null>(null);
  const [planName,      setPlanName]      = useState("");
  const [planNotes,     setPlanNotes]     = useState("");
  const [itemForm,      setItemForm]      = useState({ meal_type: "Petit-déjeuner", name: "", calories: "", proteines: "", glucides: "", lipides: "" });
  const [planSaving,    setPlanSaving]    = useState(false);

  const [coachNotes,    setCoachNotes]    = useState<CoachNote[]>([]);
  const [noteInput,     setNoteInput]     = useState("");
  const [noteSaving,    setNoteSaving]    = useState(false);

  const [checkins,      setCheckins]      = useState<WeeklyCheckin[]>([]);
  const [checkinForm,   setCheckinForm]   = useState({ week_date: todayStr(), weight: "", body_fat: "", compliance: 0, notes: "" });
  const [checkinSaving, setCheckinSaving] = useState(false);

  const [statusSaving,  setStatusSaving]  = useState(false);

  const [allMsgs,      setAllMsgs]      = useState<DirectMsg[]>([]);
  const [msgClient,    setMsgClient]    = useState<string | null>(null);
  const [replyInput,   setReplyInput]   = useState("");
  const [replySending, setReplySending] = useState(false);
  const [treated,      setTreated]      = useState<Set<string>>(new Set());
  const msgBottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("admin_treated_convs");
    if (raw) { try { setTreated(new Set(JSON.parse(raw))); } catch {} }
  }, []);

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
        const m = payload.new as DirectMsg;
        setAllMsgs(prev => [...prev, m]);
        if (m.from_email !== SAMUEL_EMAIL) {
          setTreated(prev => {
            const next = new Set(prev);
            next.delete(m.from_email);
            localStorage.setItem("admin_treated_convs", JSON.stringify([...next]));
            return next;
          });
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { msgBottom.current?.scrollIntoView({ behavior: "smooth" }); }, [allMsgs, msgClient]);

  const loadMealPlans = async (clientId: string) => {
    const { data: plans } = await supabase.from("meal_plans").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    const planList = (plans ?? []) as MealPlan[];
    setMealPlans(planList);
    const active = planList.find(p => p.is_active);
    setActivePlanId(active?.id ?? null);
    if (active) {
      const { data: items } = await supabase.from("meal_plan_items").select("*").eq("plan_id", active.id);
      setMealItems((items ?? []) as MealPlanItem[]);
    } else { setMealItems([]); }
  };

  const selectClient = async (c: Client) => {
    setSelected(c); setTab("profil");
    setForm({ titre: "", type_seance: "", date_prevue: "", description: "", exercices: "" }); setSaveErr("");
    setClientStats([]); setMealPlans([]); setMealItems([]); setActivePlanId(null);
    setCoachNotes([]); setCheckins([]);
    setNoteInput(""); setCheckinForm({ week_date: todayStr(), weight: "", body_fat: "", compliance: 0, notes: "" });

    const { data: s } = await supabase.from("programme_seances").select("*").eq("assigned_to_email", c.email).order("created_at", { ascending: false });
    setSeances((s ?? []) as Seance[]);

    const since = new Date(); since.setDate(since.getDate() - 6);
    const { data: stats } = await supabase.from("daily_summaries")
      .select("date,calories,proteines,glucides,lipides,workouts_count,steps")
      .eq("user_id", c.id).gte("date", since.toISOString().split("T")[0]).order("date", { ascending: false });
    setClientStats((stats ?? []) as DailySummary[]);

    const { data: notes } = await supabase.from("coach_notes").select("*").eq("client_id", c.id).order("created_at", { ascending: false });
    setCoachNotes((notes ?? []) as CoachNote[]);

    const { data: cks } = await supabase.from("weekly_checkins").select("*").eq("client_id", c.id).order("week_date", { ascending: false });
    setCheckins((cks ?? []) as WeeklyCheckin[]);

    await loadMealPlans(c.id);
  };

  const sendSeance = async () => {
    if (!selected || !form.titre) { setSaveErr("Le titre est requis"); return; }
    setSaving(true); setSaveErr("");
    const { error } = await supabase.from("programme_seances").insert({
      assigned_to_email: selected.email, titre: form.titre,
      type_seance: form.type_seance || null, date_prevue: form.date_prevue || null,
      description: form.description || null, exercices: form.exercices || null,
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

  const createPlan = async () => {
    if (!selected || !planName.trim()) return;
    setPlanSaving(true);
    await supabase.from("meal_plans").update({ is_active: false }).eq("client_id", selected.id);
    const { data } = await supabase.from("meal_plans").insert({ client_id: selected.id, name: planName.trim(), notes: planNotes || null, is_active: true }).select().single();
    if (data) { setPlanName(""); setPlanNotes(""); await loadMealPlans(selected.id); }
    setPlanSaving(false);
  };

  const addPlanItem = async () => {
    if (!activePlanId || !itemForm.name.trim()) return;
    setPlanSaving(true);
    const { data } = await supabase.from("meal_plan_items").insert({
      plan_id: activePlanId, meal_type: itemForm.meal_type, name: itemForm.name.trim(),
      calories: parseInt(itemForm.calories) || 0, proteines: parseInt(itemForm.proteines) || 0,
      glucides: parseInt(itemForm.glucides) || 0, lipides: parseInt(itemForm.lipides) || 0,
    }).select().single();
    if (data) { setMealItems(prev => [...prev, data as MealPlanItem]); setItemForm(f => ({ ...f, name: "", calories: "", proteines: "", glucides: "", lipides: "" })); }
    setPlanSaving(false);
  };

  const deletePlanItem = async (id: string) => {
    await supabase.from("meal_plan_items").delete().eq("id", id);
    setMealItems(prev => prev.filter(i => i.id !== id));
  };

  const addNote = async () => {
    if (!selected || !noteInput.trim()) return;
    setNoteSaving(true);
    const { data } = await supabase.from("coach_notes").insert({ client_id: selected.id, content: noteInput.trim() }).select().single();
    if (data) { setCoachNotes(prev => [data as CoachNote, ...prev]); setNoteInput(""); }
    setNoteSaving(false);
  };

  const deleteNote = async (id: string) => {
    await supabase.from("coach_notes").delete().eq("id", id);
    setCoachNotes(prev => prev.filter(n => n.id !== id));
  };

  const addCheckin = async () => {
    if (!selected || !checkinForm.week_date) return;
    setCheckinSaving(true);
    const { data } = await supabase.from("weekly_checkins").insert({
      client_id: selected.id, week_date: checkinForm.week_date,
      weight: checkinForm.weight ? parseFloat(checkinForm.weight) : null,
      body_fat: checkinForm.body_fat ? parseFloat(checkinForm.body_fat) : null,
      compliance: checkinForm.compliance || null,
      notes: checkinForm.notes || null,
    }).select().single();
    if (data) {
      setCheckins(prev => [data as WeeklyCheckin, ...prev].sort((a, b) => b.week_date.localeCompare(a.week_date)));
      setCheckinForm({ week_date: todayStr(), weight: "", body_fat: "", compliance: 0, notes: "" });
    }
    setCheckinSaving(false);
  };

  const deleteCheckin = async (id: string) => {
    await supabase.from("weekly_checkins").delete().eq("id", id);
    setCheckins(prev => prev.filter(c => c.id !== id));
  };

  const updateStatus = async (newStatus: StatusKey, subEnd?: string) => {
    if (!selected) return;
    setStatusSaving(true);
    const updates: Record<string, string | null> = { status: newStatus };
    if (subEnd !== undefined) updates.subscription_end = subEnd || null;
    await supabase.from("profiles").update(updates).eq("id", selected.id);
    const updated = { ...selected, status: newStatus, subscription_end: subEnd ?? selected.subscription_end };
    setSelected(updated);
    setClients(prev => prev.map(c => c.id === selected.id ? updated : c));
    setStatusSaving(false);
  };

  const hasUnread = (clientEmail: string) => {
    if (treated.has(clientEmail)) return false;
    const msgs = allMsgs.filter(m => m.from_email === clientEmail || m.to_email === clientEmail);
    if (!msgs.length) return false;
    return msgs[msgs.length - 1].from_email !== SAMUEL_EMAIL;
  };

  const toggleTreated = (email: string) => {
    setTreated(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email); else next.add(email);
      localStorage.setItem("admin_treated_convs", JSON.stringify([...next]));
      return next;
    });
  };

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
    setReplySending(true); setReplyInput("");
    await supabase.from("messages").insert({ from_email: SAMUEL_EMAIL, to_email: msgClient, content: text });
    // une réponse = conversation traitée
    setTreated(prev => {
      const next = new Set(prev);
      next.add(msgClient);
      localStorage.setItem("admin_treated_convs", JSON.stringify([...next]));
      return next;
    });
    setReplySending(false);
  };

  const openConversation = (email: string) => { setPage("messages"); setSelected(null); setMsgClient(email); };

  const inp = "w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const lbl = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">

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
            <div className="p-8 text-center"><p className="text-white/20 text-xs">Aucun client inscrit</p></div>
          ) : clients.map(c => {
            const isSelected = selected?.id === c.id;
            const status = (c.status ?? "actif") as StatusKey;
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.actif;
            const unread = hasUnread(c.email);
            const subEnd = c.subscription_end ? new Date(c.subscription_end + "T00:00:00") : null;
            const subSoon = subEnd && subEnd.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
            return (
              <button key={c.id} onClick={() => selectClient(c)}
                className={`w-full text-left px-4 py-3.5 mb-1.5 border transition-all ${isSelected ? "border-[#c9a84c]/30 bg-[#c9a84c]/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-white/70"}`}>{c.prenom} {c.nom}</p>
                    {unread && <span className="w-1.5 h-1.5 rounded-full bg-[#e07070] shrink-0"/>}
                  </div>
                  <span className="text-[0.42rem] tracking-wider uppercase shrink-0 px-1.5 py-0.5 border"
                    style={{ color: cfg.color, borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}12` }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-[0.55rem] text-white/30">{c.age} ans · {c.poids} kg · {c.sexe}</p>
                {subEnd && (
                  <p className={`text-[0.45rem] mt-0.5 ${subSoon ? "text-[#e09070]" : "text-white/20"}`}>
                    Abo. {subEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}{subSoon ? " ⚠" : ""}
                  </p>
                )}
              </button>
            );
          }))}

          {/* ── Liste conversations ── */}
          {page === "messages" && (conversations.length === 0 ? (
            <div className="p-8 text-center"><p className="text-white/20 text-xs">Aucun message reçu</p></div>
          ) : conversations.map(conv => {
            const isActive = msgClient === conv.email;
            const unread = hasUnread(conv.email);
            return (
              <button key={conv.email} onClick={() => setMsgClient(conv.email)}
                className={`w-full text-left px-4 py-3.5 mb-1.5 border transition-all ${isActive ? "border-[#c9a84c]/30 bg-[#c9a84c]/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-white/70"}`}>{conv.clientName}</p>
                    {unread && <span className="w-1.5 h-1.5 rounded-full bg-[#e07070] shrink-0"/>}
                  </div>
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
          <div className="px-8 pt-8 pb-5 border-b border-white/5">
            <div className="flex items-start justify-between mb-3">
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

            {/* Status + abonnement + message */}
            <div className="flex flex-wrap items-center gap-2">
              {(["actif", "essai", "pause", "inactif"] as StatusKey[]).map(s => {
                const cfg = STATUS_CONFIG[s];
                const isActive = (selected.status ?? "actif") === s;
                return (
                  <button key={s} onClick={() => updateStatus(s)} disabled={statusSaving}
                    className="text-[0.5rem] tracking-wider uppercase px-2.5 py-1 border transition-all"
                    style={{ color: isActive ? "#0a0a0a" : cfg.color, borderColor: cfg.color, backgroundColor: isActive ? cfg.color : "transparent" }}>
                    {cfg.label}
                  </button>
                );
              })}
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-[0.45rem] text-white/25 uppercase tracking-wider">Fin abo.</span>
                <input type="date" value={selected.subscription_end ?? ""}
                  onChange={e => updateStatus((selected.status ?? "actif") as StatusKey, e.target.value)}
                  className="bg-transparent border border-white/10 text-white/40 text-[0.5rem] px-2 py-1 focus:outline-none focus:border-[#c9a84c]/40"/>
              </div>
              <button onClick={() => openConversation(selected.email)}
                className="ml-auto flex items-center gap-1.5 text-[0.5rem] tracking-wider uppercase text-white/30 hover:text-[#c9a84c] border border-white/10 hover:border-[#c9a84c]/30 px-2.5 py-1.5 transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Message
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 px-8 overflow-x-auto">
            {([
              { key: "profil",    label: "Profil" },
              { key: "programme", label: `Programme (${seances.length})` },
              { key: "repas",     label: `Plan repas${activePlanId ? " ✓" : ""}` },
              { key: "notes",     label: `Notes (${coachNotes.length})` },
              { key: "checkin",   label: `Check-ins (${checkins.length})` },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`py-3 mr-6 text-[0.6rem] tracking-[0.15em] uppercase border-b-2 transition-colors whitespace-nowrap ${tab === key ? "border-[#c9a84c] text-[#c9a84c]" : "border-transparent text-white/30 hover:text-white/50"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="px-8 py-6">

            {/* ── PROFIL ── */}
            {tab === "profil" && (
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                {[
                  { label: "Niveau d'activité",  val: selected.niveau_activite },
                  { label: "Expérience",          val: selected.experience },
                  { label: "Séances / semaine",   val: `${selected.seances_par_semaine} séances` },
                  { label: "Lieu d'entraînement", val: selected.lieu_entrainement },
                  { label: "Sommeil & stress",    val: selected.sommeil_stress },
                  { label: "Alimentation",        val: selected.alimentation },
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
                <div className="col-span-2 flex gap-3">
                  <button onClick={() => setTab("programme")}
                    className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase px-6 py-3 hover:bg-[#e2c97e] transition-colors">
                    Envoyer un programme →
                  </button>
                  <button onClick={() => setTab("repas")}
                    className="border border-[#c9a84c]/30 text-[#c9a84c] text-[0.6rem] tracking-[0.2em] uppercase px-6 py-3 hover:bg-[#c9a84c]/10 transition-colors">
                    Plan repas →
                  </button>
                </div>

                {clientStats.length > 0 && (
                  <div className="col-span-2 border border-white/5 bg-[#111] p-4">
                    <p className="text-[0.5rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-3">Résumé — 7 derniers jours</p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { label: "Moy. calories", val: Math.round(clientStats.reduce((s,d)=>s+d.calories,0)/clientStats.length) + " kcal" },
                        { label: "Séances total", val: clientStats.reduce((s,d)=>s+d.workouts_count,0) },
                        { label: "Moy. pas",      val: Math.round(clientStats.reduce((s,d)=>s+d.steps,0)/clientStats.length).toLocaleString("fr-FR") },
                      ].map(stat => (
                        <div key={stat.label} className="text-center bg-[#0a0a0a] border border-white/5 py-3">
                          <p style={{ fontFamily:"var(--font-bebas)" }} className="text-xl text-white tracking-wide">{stat.val}</p>
                          <p className="text-[0.45rem] tracking-wider text-white/25 uppercase mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      {clientStats.map(d => (
                        <div key={d.date} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                          <span className="text-[0.5rem] text-white/30 capitalize">
                            {new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          <div className="flex gap-4">
                            <span className="text-[0.5rem] text-white/50">{d.calories} kcal</span>
                            <span className="text-[0.5rem] text-[#c9a84c]/60">P {d.proteines}g</span>
                            <span className="text-[0.5rem] text-white/25">{d.workouts_count} séance{d.workouts_count>1?"s":""}</span>
                            <span className="text-[0.5rem] text-white/20">{d.steps.toLocaleString("fr-FR")} pas</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {clientStats.length === 0 && (
                  <div className="col-span-2 border border-white/5 bg-[#111] px-4 py-3">
                    <p className="text-[0.5rem] text-white/20">Aucune donnée de suivi (le client n&apos;a pas encore synchronisé)</p>
                  </div>
                )}
              </div>
            )}

            {/* ── NOTES ── */}
            {tab === "notes" && (
              <div className="max-w-2xl flex flex-col gap-5">
                <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-5">
                  <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Nouvelle note — {selected.prenom}</p>
                  <textarea
                    className={`${inp} resize-none mb-3`} rows={4}
                    placeholder="Observations, points à retravailler, comportement, résultats…"
                    value={noteInput} onChange={e => setNoteInput(e.target.value)}/>
                  <button onClick={addNote} disabled={noteSaving || !noteInput.trim()}
                    className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3 px-6 hover:bg-[#e2c97e] transition-colors disabled:opacity-40">
                    {noteSaving ? "Enregistrement…" : "Ajouter la note →"}
                  </button>
                </div>

                {coachNotes.length === 0 ? (
                  <p className="text-white/20 text-xs text-center py-4">Aucune note pour ce client</p>
                ) : coachNotes.map(note => (
                  <div key={note.id} className="border border-white/10 bg-[#111] p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-[0.5rem] tracking-wider text-white/25">
                        {new Date(note.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <button onClick={() => deleteNote(note.id)} className="text-white/15 hover:text-[#e07070] transition-colors shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed whitespace-pre-line">{note.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── CHECK-IN ── */}
            {tab === "checkin" && (
              <div className="max-w-2xl flex flex-col gap-5">
                <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-5">
                  <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Check-in hebdomadaire — {selected.prenom}</p>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className={lbl}>Date</label>
                      <input type="date" className={inp} value={checkinForm.week_date}
                        onChange={e => setCheckinForm(f => ({ ...f, week_date: e.target.value }))}/>
                    </div>
                    <div>
                      <label className={lbl}>Poids (kg)</label>
                      <input type="number" step="0.1" className={inp} placeholder="78.5"
                        value={checkinForm.weight} onChange={e => setCheckinForm(f => ({ ...f, weight: e.target.value }))}/>
                    </div>
                    <div>
                      <label className={lbl}>Body fat (%)</label>
                      <input type="number" step="0.1" className={inp} placeholder="18.2"
                        value={checkinForm.body_fat} onChange={e => setCheckinForm(f => ({ ...f, body_fat: e.target.value }))}/>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className={lbl}>Compliance — 1 mauvaise · 5 parfaite</label>
                    <div className="flex gap-2 mt-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setCheckinForm(f => ({ ...f, compliance: n }))}
                          className={`w-9 h-9 border text-sm font-bold transition-all ${checkinForm.compliance >= n ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-white/15 text-white/25 hover:border-white/30"}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className={lbl}>Notes</label>
                    <textarea className={`${inp} resize-none`} rows={3}
                      placeholder="Énergie, motivation, douleurs, progrès observés…"
                      value={checkinForm.notes} onChange={e => setCheckinForm(f => ({ ...f, notes: e.target.value }))}/>
                  </div>
                  <button onClick={addCheckin} disabled={checkinSaving || !checkinForm.week_date}
                    className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3 px-6 hover:bg-[#e2c97e] transition-colors disabled:opacity-40">
                    {checkinSaving ? "Enregistrement…" : "Enregistrer le check-in →"}
                  </button>
                </div>

                {checkins.length === 0 ? (
                  <p className="text-white/20 text-xs text-center py-4">Aucun check-in enregistré</p>
                ) : checkins.map(ck => (
                  <div key={ck.id} className="border border-white/10 bg-[#111] px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-[0.55rem] tracking-wider text-white/40">
                          {new Date(ck.week_date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        {ck.compliance && (
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <div key={n} className="w-2.5 h-2.5 border"
                                style={{ backgroundColor: n <= ck.compliance! ? "#c9a84c" : "transparent", borderColor: n <= ck.compliance! ? "#c9a84c" : "rgba(255,255,255,0.1)" }}/>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-5 mb-1.5">
                        {ck.weight   && <span className="text-sm text-white/70 font-medium">{ck.weight} kg</span>}
                        {ck.body_fat && <span className="text-sm text-[#7eb8a0]">{ck.body_fat}% BF</span>}
                      </div>
                      {ck.notes && <p className="text-xs text-white/40 leading-relaxed">{ck.notes}</p>}
                    </div>
                    <button onClick={() => deleteCheckin(ck.id)} className="text-white/15 hover:text-[#e07070] transition-colors shrink-0 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── REPAS ── */}
            {tab === "repas" && (
              <div className="max-w-2xl flex flex-col gap-6">
                <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-5">
                  <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">
                    {activePlanId ? "Plan actif" : `Créer un plan pour ${selected.prenom}`}
                  </p>
                  {!activePlanId ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className={lbl}>Nom du plan</label>
                        <input className={inp} placeholder="Ex : Plan prise de masse — Semaine 1" value={planName} onChange={e => setPlanName(e.target.value)}/>
                      </div>
                      <div>
                        <label className={lbl}>Notes (optionnel)</label>
                        <textarea className={`${inp} resize-none`} rows={2} placeholder="Conseils, timing…" value={planNotes} onChange={e => setPlanNotes(e.target.value)}/>
                      </div>
                      <button onClick={createPlan} disabled={planSaving || !planName.trim()}
                        className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3 hover:bg-[#e2c97e] transition-colors disabled:opacity-40">
                        Créer le plan →
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/60">{mealPlans.find(p=>p.id===activePlanId)?.name}</p>
                      <button onClick={async () => {
                        await supabase.from("meal_plans").update({ is_active: false }).eq("id", activePlanId);
                        setActivePlanId(null); setMealItems([]); setMealPlans(p => p.map(x => x.id===activePlanId?{...x,is_active:false}:x));
                      }} className="text-[0.55rem] tracking-wider uppercase text-[#e07070]/60 hover:text-[#e07070] transition-colors">
                        Désactiver
                      </button>
                    </div>
                  )}
                </div>

                {activePlanId && (
                  <div className="border border-white/10 bg-[#111] p-5 flex flex-col gap-4">
                    <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c]">Ajouter un repas au plan</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Type de repas</label>
                        <select className={`${inp} cursor-pointer`} value={itemForm.meal_type} onChange={e => setItemForm(f => ({ ...f, meal_type: e.target.value }))}>
                          {["Petit-déjeuner","Déjeuner","Dîner","Collation"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Nom du repas *</label>
                        <input className={inp} placeholder="Riz + poulet grillé" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}/>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { key: "calories",  label: "Calories", color: "text-white/40" },
                        { key: "proteines", label: "Prot (g)", color: "text-[#c9a84c]" },
                        { key: "glucides",  label: "Gluc (g)", color: "text-[#7eb8a0]" },
                        { key: "lipides",   label: "Lip (g)",  color: "text-[#e07070]" },
                      ].map(({ key, label, color }) => (
                        <div key={key}>
                          <label className={`text-[0.5rem] tracking-wider uppercase block mb-1 ${color}`}>{label}</label>
                          <input type="number" className={inp} value={itemForm[key as keyof typeof itemForm]}
                            onChange={e => setItemForm(f => ({ ...f, [key]: e.target.value }))}/>
                        </div>
                      ))}
                    </div>
                    <button onClick={addPlanItem} disabled={planSaving || !itemForm.name.trim()}
                      className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-2.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-40">
                      Ajouter au plan →
                    </button>
                  </div>
                )}

                {mealItems.length > 0 && (
                  <div>
                    <p className="text-[0.55rem] tracking-[0.2em] uppercase text-white/25 mb-3">Repas du plan ({mealItems.length})</p>
                    {["Petit-déjeuner","Déjeuner","Dîner","Collation"].map(type => {
                      const typeItems = mealItems.filter(i => i.meal_type === type);
                      if (!typeItems.length) return null;
                      return (
                        <div key={type} className="mb-4">
                          <p className="text-[0.5rem] tracking-wider uppercase text-[#c9a84c]/50 mb-1.5">{type}</p>
                          <div className="flex flex-col gap-1">
                            {typeItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between border border-white/10 bg-[#111] px-4 py-2.5">
                                <div>
                                  <p className="text-xs text-white/65">{item.name}</p>
                                  <div className="flex gap-2 mt-0.5">
                                    <span className="text-[0.45rem] text-white/30">{item.calories} kcal</span>
                                    <span className="text-[0.45rem] text-[#c9a84c]/60">P {item.proteines}g</span>
                                    <span className="text-[0.45rem] text-[#7eb8a0]/60">G {item.glucides}g</span>
                                    <span className="text-[0.45rem] text-[#e07070]/60">L {item.lipides}g</span>
                                  </div>
                                </div>
                                <button onClick={() => deletePlanItem(item.id)} className="text-white/15 hover:text-[#e07070] transition-colors">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── PROGRAMME ── */}
            {tab === "programme" && (
              <div className="max-w-2xl flex flex-col gap-6">
                <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-5">
                  <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Nouvelle séance pour {selected.prenom}</p>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Titre *</label>
                        <input className={inp} placeholder="Séance haut du corps" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}/>
                      </div>
                      <div>
                        <label className={lbl}>Type</label>
                        <select className={`${inp} cursor-pointer`} value={form.type_seance} onChange={e => setForm(f => ({ ...f, type_seance: e.target.value }))}>
                          <option value="">Choisir…</option>
                          {SEANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Date prévue</label>
                      <input className={inp} type="date" value={form.date_prevue} onChange={e => setForm(f => ({ ...f, date_prevue: e.target.value }))}/>
                    </div>
                    <div>
                      <label className={lbl}>Description / consignes</label>
                      <textarea className={`${inp} resize-none`} rows={2} placeholder="Objectif de la séance, intensité, conseils…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
                    </div>
                    <div>
                      <label className={lbl}>Exercices (un par ligne)</label>
                      <textarea className={`${inp} resize-none`} rows={7}
                        placeholder={"Développé couché 4×8 @ 80kg\nTirage poulie haute 3×12\nDumbbell curl 3×15\nGainage 3×45s\n…"}
                        value={form.exercices} onChange={e => setForm(f => ({ ...f, exercices: e.target.value }))}/>
                    </div>
                    {saveErr && <p className="text-xs text-[#e07070] border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{saveErr}</p>}
                    <button onClick={sendSeance} disabled={saving}
                      className="bg-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Envoi…</> : `Envoyer à ${selected.prenom} →`}
                    </button>
                  </div>
                </div>

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
          <div className="px-8 pt-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <div>
              <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-white tracking-wide">{activeConv.clientName}</h2>
              <p className="text-[0.5rem] text-white/25 tracking-wider mt-0.5">{msgClient}</p>
            </div>
            <div className="flex items-center gap-3">
              {msgClient && (() => {
                const isTreated = treated.has(msgClient);
                return (
                  <button onClick={() => toggleTreated(msgClient)}
                    className={`flex items-center gap-1.5 text-[0.5rem] tracking-[0.12em] uppercase px-3 py-1.5 border transition-all ${
                      isTreated
                        ? "border-[#7eb8a0]/40 text-[#7eb8a0] bg-[#7eb8a0]/8 hover:bg-[#7eb8a0]/5"
                        : "border-white/10 text-white/30 hover:border-[#7eb8a0]/40 hover:text-[#7eb8a0]/70"
                    }`}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isTreated ? 2.5 : 1.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {isTreated ? "Traité" : "Marquer traité"}
                  </button>
                );
              })()}
              <button onClick={() => setMsgClient(null)} className="text-white/20 hover:text-white/50 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-3">
            {activeConv.msgs.map(m => {
              const isMe = m.from_email === SAMUEL_EMAIL;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-6 h-6 border border-white/10 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                      <span className="text-[0.5rem] text-white/40 font-bold">{activeConv.clientName.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="max-w-sm">
                    <div className={`px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${isMe ? "bg-[#c9a84c] text-black" : "bg-[#111] border border-white/10 text-white/60"}`}>
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
          <div className="border-t border-white/5 px-8 py-4 flex gap-3 shrink-0">
            <input value={replyInput} onChange={e => setReplyInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              placeholder={`Répondre à ${activeConv.clientName}…`} disabled={replySending}
              className="flex-1 bg-[#111] border border-white/10 text-white placeholder-white/20 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/40 transition-colors disabled:opacity-50"/>
            <button onClick={sendReply} disabled={!replyInput.trim() || replySending}
              className="bg-[#c9a84c] text-black px-6 py-3 text-[0.6rem] font-bold tracking-[0.15em] uppercase hover:bg-[#e2c97e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Envoyer
            </button>
          </div>
        </div>
      )}

      {/* ── Empty states ── */}
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

"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { type ExerciceItem, serializeExercices } from "@/lib/exercices";
import ExerciceEditor from "@/components/ExerciceEditor";

const SAMUEL_EMAIL = "sam97waelti@gmail.com";
const SEANCE_TYPES = ["Haut du corps","Bas du corps","Full body","Cardio","Boxe","Natation","CrossFit","Yoga","Autre"];

const STATUS_CFG = {
  actif:   { label: "Actif",   color: "#7eb8a0" },
  essai:   { label: "Essai",   color: "#c9a84c" },
  pause:   { label: "Pause",   color: "#e09070" },
  inactif: { label: "Inactif", color: "#666" },
} as const;
const STAGE_CFG = {
  prospect:   { label: "Prospect",   color: "#888" },
  onboarding: { label: "Onboarding", color: "#c9a84c" },
  actif:      { label: "Actif",      color: "#7eb8a0" },
  en_risque:  { label: "En risque",  color: "#e09070" },
  churne:     { label: "Churné",     color: "#e07070" },
  reactive:   { label: "Réactivé",   color: "#a08ec9" },
} as const;
type StatusKey = keyof typeof STATUS_CFG;
type StageKey  = keyof typeof STAGE_CFG;

type Client   = { id: string; email: string; prenom: string; nom: string; age: number; poids: number; taille: number; sexe: string; niveau_activite: string; experience: string; seances_par_semaine: number; lieu_entrainement: string; blessures: string; alimentation: string; sommeil_stress: string; objectifs: string; updated_at: string; status: StatusKey | null; subscription_end: string | null; pipeline_stage: StageKey | null };
type PendingSignup = { id: string; email: string; full_name: string | null; created_at: string; email_confirmed_at: string | null };
type Seance   = { id: string; titre: string; type_seance: string | null; date_prevue: string | null; description: string | null; exercices: string | null; completed_at: string | null };
type Note     = { id: string; client_id: string; content: string; created_at: string };
type Checkin  = { id: string; client_id: string; week_date: string; weight: number | null; body_fat: number | null; compliance: number | null; energy: number | null; notes: string | null };
type FoodItem = { name: string; calories: number; proteines: number; glucides: number; lipides: number; repas?: string | null };
type DaySummary = { date: string; calories: number; proteines: number; glucides: number; lipides: number; foods: FoodItem[] | null };
type MealPlan = { id: string; name: string; notes: string | null; is_active: boolean };
type MealItem = { id: string; plan_id: string; meal_type: string; name: string; calories: number; proteines: number; glucides: number; lipides: number };

const imc = (p: number, t: number) => (p / ((t / 100) ** 2)).toFixed(1);
const todayStr = () => new Date().toISOString().split("T")[0];

export default function ClientsPage() {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [search,   setSearch]   = useState("");
  const [filterStage,  setFilterStage]  = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Client | null>(null);
  const [tab,      setTab]      = useState<"profil"|"notes"|"checkin"|"programme"|"repas"|"journal">("profil");
  const [loading,  setLoading]  = useState(true);
  const [pendingSignups, setPendingSignups] = useState<PendingSignup[]>([]);

  // Detail data
  const [seances,      setSeances]      = useState<Seance[]>([]);
  const [notes,        setNotes]        = useState<Note[]>([]);
  const [checkins,     setCheckins]     = useState<Checkin[]>([]);
  const [mealPlans,    setMealPlans]    = useState<MealPlan[]>([]);
  const [mealItems,    setMealItems]    = useState<MealItem[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [journal,      setJournal]      = useState<DaySummary[]>([]);

  // Forms
  const [noteInput,    setNoteInput]    = useState("");
  const [noteSaving,   setNoteSaving]   = useState(false);
  const [ckForm,       setCkForm]       = useState({ week_date: todayStr(), weight: "", body_fat: "", compliance: 0, notes: "" });
  const [ckSaving,     setCkSaving]     = useState(false);
  const [seanceForm,   setSeanceForm]   = useState<{ titre: string; type_seance: string; date_prevue: string; description: string; exercices: ExerciceItem[] }>({ titre: "", type_seance: "", date_prevue: "", description: "", exercices: [] });
  const [seanceSaving, setSeanceSaving] = useState(false);
  const [seanceErr,    setSeanceErr]    = useState("");
  const [planName,     setPlanName]     = useState("");
  const [planNotes,    setPlanNotes]    = useState("");
  const [planSaving,   setPlanSaving]   = useState(false);
  const [itemForm,     setItemForm]     = useState({ meal_type: "Petit-déjeuner", name: "", calories: "", proteines: "", glucides: "", lipides: "" });
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").order("updated_at", { ascending: false })
      .then(({ data }) => { setClients((data ?? []) as Client[]); setLoading(false); });
    supabase.rpc("get_pending_signups")
      .then(({ data }) => setPendingSignups((data ?? []) as PendingSignup[]));
  }, []);

  const loadMealPlans = async (id: string) => {
    const { data: plans } = await supabase.from("meal_plans").select("*").eq("client_id", id).order("created_at", { ascending: false });
    const list = (plans ?? []) as MealPlan[];
    setMealPlans(list);
    const active = list.find(p => p.is_active);
    setActivePlanId(active?.id ?? null);
    if (active) { const { data } = await supabase.from("meal_plan_items").select("*").eq("plan_id", active.id); setMealItems((data ?? []) as MealItem[]); }
    else setMealItems([]);
  };

  const selectClient = async (c: Client) => {
    setSelected(c); setTab("profil");
    setNoteInput(""); setCkForm({ week_date: todayStr(), weight: "", body_fat: "", compliance: 0, notes: "" }); setSeanceErr("");
    setSeanceForm({ titre: "", type_seance: "", date_prevue: "", description: "", exercices: [] });
    const [{ data: s }, { data: n }, { data: ck }, { data: js }] = await Promise.all([
      supabase.from("programme_seances").select("*").eq("assigned_to_email", c.email).order("created_at", { ascending: false }),
      supabase.from("coach_notes").select("*").eq("client_id", c.id).order("created_at", { ascending: false }),
      supabase.from("weekly_checkins").select("*").eq("client_id", c.id).order("week_date", { ascending: false }),
      supabase.from("daily_summaries").select("date,calories,proteines,glucides,lipides,foods").eq("user_id", c.id).order("date", { ascending: false }).limit(14),
    ]);
    setSeances((s ?? []) as Seance[]); setNotes((n ?? []) as Note[]); setCheckins((ck ?? []) as Checkin[]);
    setJournal((js ?? []) as DaySummary[]);
    await loadMealPlans(c.id);
  };

  const updateField = async (fields: Record<string, string | null>) => {
    if (!selected) return;
    setStatusSaving(true);
    await supabase.from("profiles").update(fields).eq("id", selected.id);
    const updated = { ...selected, ...fields } as Client;
    setSelected(updated);
    setClients(prev => prev.map(c => c.id === selected.id ? updated : c));
    setStatusSaving(false);
  };

  const addNote = async () => {
    if (!selected || !noteInput.trim()) return;
    setNoteSaving(true);
    const { data } = await supabase.from("coach_notes").insert({ client_id: selected.id, content: noteInput.trim() }).select().single();
    if (data) { setNotes(prev => [data as Note, ...prev]); setNoteInput(""); }
    setNoteSaving(false);
  };

  const addCheckin = async () => {
    if (!selected) return;
    setCkSaving(true);
    const { data } = await supabase.from("weekly_checkins").insert({
      client_id: selected.id, week_date: ckForm.week_date,
      weight: ckForm.weight ? parseFloat(ckForm.weight) : null,
      body_fat: ckForm.body_fat ? parseFloat(ckForm.body_fat) : null,
      compliance: ckForm.compliance || null, notes: ckForm.notes || null,
    }).select().single();
    if (data) { setCheckins(prev => [data as Checkin, ...prev].sort((a, b) => b.week_date.localeCompare(a.week_date))); setCkForm({ week_date: todayStr(), weight: "", body_fat: "", compliance: 0, notes: "" }); }
    setCkSaving(false);
  };

  const sendSeance = async () => {
    if (!selected || !seanceForm.titre) { setSeanceErr("Titre requis"); return; }
    setSeanceSaving(true); setSeanceErr("");
    const { error } = await supabase.from("programme_seances").insert({ assigned_to_email: selected.email, titre: seanceForm.titre, type_seance: seanceForm.type_seance || null, date_prevue: seanceForm.date_prevue || null, description: seanceForm.description || null, exercices: serializeExercices(seanceForm.exercices) });
    if (error) { setSeanceErr(error.message); setSeanceSaving(false); return; }
    const { data } = await supabase.from("programme_seances").select("*").eq("assigned_to_email", selected.email).order("created_at", { ascending: false });
    setSeances((data ?? []) as Seance[]);
    setSeanceForm({ titre: "", type_seance: "", date_prevue: "", description: "", exercices: [] });
    setSeanceSaving(false);
  };

  const createPlan = async () => {
    if (!selected || !planName.trim()) return;
    setPlanSaving(true);
    await supabase.from("meal_plans").update({ is_active: false }).eq("client_id", selected.id);
    const { data } = await supabase.from("meal_plans").insert({ client_id: selected.id, name: planName.trim(), notes: planNotes || null, is_active: true }).select().single();
    if (data) { setPlanName(""); setPlanNotes(""); await loadMealPlans(selected.id); }
    setPlanSaving(false);
  };

  const addItem = async () => {
    if (!activePlanId || !itemForm.name.trim()) return;
    setPlanSaving(true);
    const { data } = await supabase.from("meal_plan_items").insert({ plan_id: activePlanId, meal_type: itemForm.meal_type, name: itemForm.name.trim(), calories: parseInt(itemForm.calories)||0, proteines: parseInt(itemForm.proteines)||0, glucides: parseInt(itemForm.glucides)||0, lipides: parseInt(itemForm.lipides)||0 }).select().single();
    if (data) { setMealItems(prev => [...prev, data as MealItem]); setItemForm(f => ({ ...f, name: "", calories: "", proteines: "", glucides: "", lipides: "" })); }
    setPlanSaving(false);
  };

  const inp = "w-full bg-[#060606] border border-white/10 text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const lbl = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${c.prenom} ${c.nom} ${c.email}`.toLowerCase().includes(q);
    const matchStage  = filterStage  === "all" || (c.pipeline_stage ?? "actif") === filterStage;
    const matchStatus = filterStatus === "all" || (c.status ?? "actif") === filterStatus;
    return matchSearch && matchStage && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="flex h-[calc(100dvh-50px-env(safe-area-inset-bottom))] md:h-screen overflow-hidden">

      {/* ── Left: list (plein écran sur mobile quand aucun client sélectionné) ── */}
      <div className={`flex-col border-r border-white/5 bg-[#0a0a0a] ${selected ? "hidden md:flex w-72 shrink-0" : "flex flex-1"}`}>
        <div className="px-4 md:px-5 pt-5 md:pt-6 pb-4 border-b border-white/5">
          <p className="text-[0.5rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">CRM</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-white tracking-wide mb-3">CLIENTS</h1>
          <input className={`${inp} mb-3`} placeholder="Rechercher un client…" value={search} onChange={e => setSearch(e.target.value)}/>
          <div className="flex gap-2 flex-wrap">
            <select className="bg-[#060606] border border-white/10 text-white/50 text-[0.5rem] px-2 py-1.5 focus:outline-none cursor-pointer"
              value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="all">Tous stages</option>
              {Object.entries(STAGE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="bg-[#060606] border border-white/10 text-white/50 text-[0.5rem] px-2 py-1.5 focus:outline-none cursor-pointer"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tous statuts</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <p className="text-[0.45rem] text-white/20 mt-2">{filtered.length} client{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {pendingSignups.length > 0 && (
          <div className="border-b border-[#c9a84c]/10 bg-[#0f0d07] px-4 md:px-5 py-3 shrink-0">
            <p className="text-[0.5rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-2">
              Inscriptions en attente ({pendingSignups.length})
            </p>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {pendingSignups.map(p => (
                <div key={p.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] text-white/70 truncate">{p.full_name || "Sans nom"}</p>
                    <p className="text-[0.5rem] text-white/30 truncate">{p.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className={`text-[0.4rem] tracking-wider uppercase px-1.5 py-0.5 border whitespace-nowrap ${p.email_confirmed_at ? "text-[#7eb8a0] border-[#7eb8a0]/30" : "text-[#e09070] border-[#e09070]/30"}`}>
                      {p.email_confirmed_at ? "Email confirmé" : "Confirmation en attente"}
                    </span>
                    <span className="text-[0.42rem] text-white/20">{new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {filtered.map(c => {
            const stage = (c.pipeline_stage ?? "actif") as StageKey;
            const stageCfg = STAGE_CFG[stage] ?? STAGE_CFG.actif;
            const subEnd = c.subscription_end ? new Date(c.subscription_end + "T00:00:00") : null;
            const subSoon = subEnd && subEnd.getTime() - Date.now() < 7 * 86400000;
            const isSelected = selected?.id === c.id;
            return (
              <button key={c.id} onClick={() => selectClient(c)}
                className={`w-full text-left px-4 py-3 mb-1 border transition-all ${isSelected ? "border-[#c9a84c]/30 bg-[#c9a84c]/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"}`}>
                <div className="flex items-start justify-between mb-0.5">
                  <p className={`text-sm font-medium ${isSelected ? "text-white" : "text-white/70"}`}>{c.prenom} {c.nom}</p>
                  <span className="text-[0.42rem] tracking-wider uppercase px-1.5 py-0.5 border shrink-0 ml-2"
                    style={{ color: stageCfg.color, borderColor: `${stageCfg.color}35`, backgroundColor: `${stageCfg.color}10` }}>
                    {stageCfg.label}
                  </span>
                </div>
                <p className="text-[0.48rem] text-white/30">{c.age} ans · {c.poids} kg · {c.sexe}</p>
                {subEnd && <p className={`text-[0.45rem] mt-0.5 ${subSoon ? "text-[#e09070]" : "text-white/20"}`}>Abo. {subEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}{subSoon ? " ⚠" : ""}</p>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: detail ── */}
      {selected && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-4 md:px-8 pt-5 md:pt-6 pb-4 border-b border-white/5 shrink-0">
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <button onClick={() => setSelected(null)} className="md:hidden text-white/40 hover:text-white/70 transition-colors mt-1.5 shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="min-w-0">
                <p className="text-[0.45rem] tracking-[0.2em] text-white/25 uppercase truncate">{selected.email}</p>
                <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl md:text-4xl text-white tracking-wide">{selected.prenom} {selected.nom}</h2>
                <p className="text-white/30 text-xs mt-0.5">{selected.age} ans · {selected.sexe} · {selected.poids} kg · {selected.taille} cm · IMC {imc(selected.poids, selected.taille)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/crm/inbox?client=${encodeURIComponent(selected.email)}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-white/30 hover:text-white/70 hover:border-white/25 transition-all text-[0.45rem] tracking-[0.15em] uppercase">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Inbox
                </Link>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/50 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Stage */}
              <select disabled={statusSaving} value={selected.pipeline_stage ?? "actif"}
                onChange={e => updateField({ pipeline_stage: e.target.value })}
                className="bg-transparent border border-white/15 text-white/50 text-[0.5rem] tracking-wider uppercase px-2 py-1.5 focus:outline-none cursor-pointer">
                {Object.entries(STAGE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              {/* Status pills */}
              {(Object.keys(STATUS_CFG) as StatusKey[]).map(s => {
                const cfg = STATUS_CFG[s];
                const active = (selected.status ?? "actif") === s;
                return (
                  <button key={s} disabled={statusSaving} onClick={() => updateField({ status: s })}
                    className="text-[0.48rem] tracking-wider uppercase px-2 py-1 border transition-all"
                    style={{ color: active ? "#0a0a0a" : cfg.color, borderColor: cfg.color, backgroundColor: active ? cfg.color : "transparent" }}>
                    {cfg.label}
                  </button>
                );
              })}
              {/* Fin abonnement */}
              <div className="flex items-center gap-1.5">
                <span className="text-[0.42rem] text-white/25 uppercase tracking-wider">Fin abo.</span>
                <input type="date" value={selected.subscription_end ?? ""}
                  onChange={e => updateField({ subscription_end: e.target.value || null })}
                  className="bg-transparent border border-white/10 text-white/40 text-[0.48rem] px-2 py-1 focus:outline-none focus:border-[#c9a84c]/40"/>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 px-4 md:px-8 shrink-0 overflow-x-auto">
            {([
              { key: "profil",     label: "Profil" },
              { key: "notes",      label: `Notes (${notes.length})` },
              { key: "checkin",    label: `Check-ins (${checkins.length})` },
              { key: "programme",  label: `Programme (${seances.length})` },
              { key: "repas",      label: `Plan repas${activePlanId ? " ✓" : ""}` },
              { key: "journal",    label: `Journal (${journal.length})` },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`py-3 mr-5 text-[0.58rem] tracking-[0.12em] uppercase border-b-2 transition-colors whitespace-nowrap ${tab === key ? "border-[#c9a84c] text-[#c9a84c]" : "border-transparent text-white/30 hover:text-white/50"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6">

            {/* PROFIL */}
            {tab === "profil" && (
              <div className="max-w-2xl grid grid-cols-2 gap-3">
                {[
                  { label: "Niveau",         val: selected.niveau_activite },
                  { label: "Expérience",     val: selected.experience },
                  { label: "Séances/sem.",   val: `${selected.seances_par_semaine}×` },
                  { label: "Lieu",           val: selected.lieu_entrainement },
                  { label: "Sommeil/stress", val: selected.sommeil_stress },
                  { label: "Alimentation",   val: selected.alimentation },
                ].map(r => (
                  <div key={r.label} className="border border-white/7 bg-[#111] px-4 py-3">
                    <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">{r.label}</p>
                    <p className="text-xs text-white/55">{r.val || "—"}</p>
                  </div>
                ))}
                <div className="col-span-2 border border-white/7 bg-[#111] px-4 py-3">
                  <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Blessures</p>
                  <p className="text-xs text-white/55 leading-relaxed">{selected.blessures || "—"}</p>
                </div>
                <div className="col-span-2 border border-[#c9a84c]/10 bg-[#0f0d07] px-4 py-3">
                  <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Objectifs</p>
                  <p className="text-xs text-white/55 leading-relaxed">{selected.objectifs || "—"}</p>
                </div>
              </div>
            )}

            {/* NOTES */}
            {tab === "notes" && (
              <div className="max-w-2xl flex flex-col gap-4">
                <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-5">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Nouvelle note</p>
                  <textarea className={`${inp} resize-none mb-3`} rows={4} placeholder="Observations, ajustements, retours séance…" value={noteInput} onChange={e => setNoteInput(e.target.value)}/>
                  <button onClick={addNote} disabled={noteSaving || !noteInput.trim()} className="bg-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-2.5 px-5 hover:bg-[#e2c97e] transition-colors disabled:opacity-40">
                    {noteSaving ? "Enregistrement…" : "Ajouter →"}
                  </button>
                </div>
                {notes.length === 0 ? <p className="text-white/20 text-xs text-center py-4">Aucune note</p>
                  : notes.map(n => (
                    <div key={n.id} className="border border-white/8 bg-[#111] p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[0.48rem] tracking-wider text-white/25">
                          {new Date(n.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <button onClick={async () => { await supabase.from("coach_notes").delete().eq("id", n.id); setNotes(prev => prev.filter(x => x.id !== n.id)); }}
                          className="text-white/15 hover:text-[#e07070] transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{n.content}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* CHECK-INS */}
            {tab === "checkin" && (
              <div className="max-w-2xl flex flex-col gap-4">
                <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-5">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Check-in hebdomadaire</p>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div><label className={lbl}>Date</label><input type="date" className={inp} value={ckForm.week_date} onChange={e => setCkForm(f => ({ ...f, week_date: e.target.value }))}/></div>
                    <div><label className={lbl}>Poids (kg)</label><input type="number" step="0.1" className={inp} placeholder="78.5" value={ckForm.weight} onChange={e => setCkForm(f => ({ ...f, weight: e.target.value }))}/></div>
                    <div><label className={lbl}>Body fat (%)</label><input type="number" step="0.1" className={inp} placeholder="18.0" value={ckForm.body_fat} onChange={e => setCkForm(f => ({ ...f, body_fat: e.target.value }))}/></div>
                  </div>
                  <div className="mb-3">
                    <label className={lbl}>Compliance — 1 mauvaise · 5 parfaite</label>
                    <div className="flex gap-2 mt-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setCkForm(f => ({ ...f, compliance: n }))}
                          className={`w-9 h-9 border text-sm font-bold transition-all ${ckForm.compliance >= n ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-white/15 text-white/25"}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4"><label className={lbl}>Notes</label><textarea className={`${inp} resize-none`} rows={3} placeholder="Énergie, motivation, douleurs, progrès…" value={ckForm.notes} onChange={e => setCkForm(f => ({ ...f, notes: e.target.value }))}/></div>
                  <button onClick={addCheckin} disabled={ckSaving} className="bg-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-2.5 px-5 hover:bg-[#e2c97e] transition-colors disabled:opacity-40">
                    {ckSaving ? "Enregistrement…" : "Enregistrer →"}
                  </button>
                </div>
                {checkins.length === 0 ? <p className="text-white/20 text-xs text-center py-4">Aucun check-in</p>
                  : checkins.map(ck => (
                    <div key={ck.id} className="border border-white/8 bg-[#111] px-5 py-4 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-1.5">
                          <span className="text-[0.65rem] tracking-wider text-white/35">
                            {new Date(ck.week_date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          {ck.compliance && <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <div key={n} className="w-2.5 h-2.5 border" style={{ backgroundColor: n <= ck.compliance! ? "#c9a84c" : "transparent", borderColor: n <= ck.compliance! ? "#c9a84c" : "rgba(255,255,255,0.1)" }}/>)}</div>}
                        </div>
                        <div className="flex gap-5 mb-1 items-center flex-wrap">
                          {ck.weight && <span className="text-sm text-white/70 font-medium">{ck.weight} kg</span>}
                          {ck.body_fat && <span className="text-sm text-[#7eb8a0]">{ck.body_fat}% BF</span>}
                          {ck.energy && <span className="text-[0.6rem] tracking-wider uppercase text-[#7eb8a0]/70">Énergie {ck.energy}/5</span>}
                        </div>
                        {ck.notes && <p className="text-xs text-white/35 leading-relaxed">{ck.notes}</p>}
                      </div>
                      <button onClick={async () => { await supabase.from("weekly_checkins").delete().eq("id", ck.id); setCheckins(prev => prev.filter(x => x.id !== ck.id)); }}
                        className="text-white/15 hover:text-[#e07070] transition-colors shrink-0">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* PROGRAMME */}
            {tab === "programme" && (
              <div className="max-w-2xl flex flex-col gap-5">
                <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-5">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Nouvelle séance — {selected.prenom}</p>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>Titre *</label><input className={inp} placeholder="Séance haut du corps" value={seanceForm.titre} onChange={e => setSeanceForm(f => ({ ...f, titre: e.target.value }))}/></div>
                      <div><label className={lbl}>Type</label>
                        <select className={`${inp} cursor-pointer`} value={seanceForm.type_seance} onChange={e => setSeanceForm(f => ({ ...f, type_seance: e.target.value }))}>
                          <option value="">Choisir…</option>{SEANCE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label className={lbl}>Date prévue</label><input className={inp} type="date" value={seanceForm.date_prevue} onChange={e => setSeanceForm(f => ({ ...f, date_prevue: e.target.value }))}/></div>
                    <div><label className={lbl}>Description</label><textarea className={`${inp} resize-none`} rows={2} placeholder="Objectif, intensité, conseils…" value={seanceForm.description} onChange={e => setSeanceForm(f => ({ ...f, description: e.target.value }))}/></div>
                    <div>
                      <label className={lbl}>Exercices</label>
                      <ExerciceEditor items={seanceForm.exercices} onChange={items => setSeanceForm(f => ({ ...f, exercices: items }))}/>
                    </div>
                    {seanceErr && <p className="text-xs text-[#e07070] px-3 py-2 border border-[#e07070]/20 bg-[#e07070]/5">{seanceErr}</p>}
                    <button onClick={sendSeance} disabled={seanceSaving} className="bg-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-3 hover:bg-[#e2c97e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {seanceSaving ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Envoi…</> : `Envoyer à ${selected.prenom} →`}
                    </button>
                  </div>
                </div>
                {seances.length > 0 && (
                  <div>
                    <p className="text-[0.5rem] tracking-[0.2em] uppercase text-white/25 mb-3">
                      Séances envoyées ({seances.length}) · {seances.filter(s => s.completed_at).length} terminée{seances.filter(s => s.completed_at).length > 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-col gap-2">
                      {seances.map(s => (
                        <div key={s.id} className={`border px-4 py-3 flex items-start justify-between gap-3 ${s.completed_at ? "border-[#7eb8a0]/25 bg-[#7eb8a0]/5" : "border-white/8 bg-[#111]"}`}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {s.completed_at && <span className="text-[0.65rem] text-[#7eb8a0] shrink-0">✓</span>}
                              {s.type_seance && <span className="text-[0.55rem] tracking-wider uppercase text-[#c9a84c] border border-[#c9a84c]/20 px-1.5 py-0.5">{s.type_seance}</span>}
                              <p className={`text-xs ${s.completed_at ? "text-white/45" : "text-white/65"}`}>{s.titre}</p>
                            </div>
                            {s.completed_at
                              ? <p className="text-[0.6rem] text-[#7eb8a0]/70">Terminée le {new Date(s.completed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                              : s.date_prevue && <p className="text-[0.6rem] text-white/25">Prévue {new Date(s.date_prevue + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</p>}
                          </div>
                          <button onClick={async () => { await supabase.from("programme_seances").delete().eq("id", s.id); setSeances(prev => prev.filter(x => x.id !== s.id)); }}
                            className="shrink-0 text-white/15 hover:text-[#e07070] transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* REPAS */}
            {tab === "repas" && (
              <div className="max-w-2xl flex flex-col gap-5">
                <div className="border border-[#c9a84c]/20 bg-[#0f0d07] p-5">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">{activePlanId ? "Plan actif" : `Créer un plan — ${selected.prenom}`}</p>
                  {!activePlanId ? (
                    <div className="flex flex-col gap-3">
                      <div><label className={lbl}>Nom du plan</label><input className={inp} placeholder="Plan prise de masse — Semaine 1" value={planName} onChange={e => setPlanName(e.target.value)}/></div>
                      <div><label className={lbl}>Notes</label><textarea className={`${inp} resize-none`} rows={2} placeholder="Conseils, timing…" value={planNotes} onChange={e => setPlanNotes(e.target.value)}/></div>
                      <button onClick={createPlan} disabled={planSaving || !planName.trim()} className="bg-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-3 hover:bg-[#e2c97e] transition-colors disabled:opacity-40">Créer le plan →</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/60">{mealPlans.find(p => p.id === activePlanId)?.name}</p>
                      <button onClick={async () => { await supabase.from("meal_plans").update({ is_active: false }).eq("id", activePlanId); setActivePlanId(null); setMealItems([]); }} className="text-[0.65rem] tracking-wider uppercase text-[#e07070]/60 hover:text-[#e07070] transition-colors">Désactiver</button>
                    </div>
                  )}
                </div>
                {activePlanId && (
                  <div className="border border-white/8 bg-[#111] p-5 flex flex-col gap-4">
                    <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Ajouter un repas</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>Type</label><select className={`${inp} cursor-pointer`} value={itemForm.meal_type} onChange={e => setItemForm(f => ({ ...f, meal_type: e.target.value }))}>{["Petit-déjeuner","Déjeuner","Dîner","Collation"].map(t => <option key={t}>{t}</option>)}</select></div>
                      <div><label className={lbl}>Nom *</label><input className={inp} placeholder="Riz + poulet grillé" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}/></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[{k:"calories",l:"Kcal",c:"text-white/40"},{k:"proteines",l:"Prot",c:"text-[#c9a84c]"},{k:"glucides",l:"Gluc",c:"text-[#7eb8a0]"},{k:"lipides",l:"Lip",c:"text-[#e07070]"}].map(({k,l,c}) => (
                        <div key={k}><label className={`text-[0.48rem] tracking-wider uppercase block mb-1 ${c}`}>{l}</label><input type="number" className={inp} value={itemForm[k as keyof typeof itemForm]} onChange={e => setItemForm(f => ({ ...f, [k]: e.target.value }))}/></div>
                      ))}
                    </div>
                    <button onClick={addItem} disabled={planSaving || !itemForm.name.trim()} className="bg-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-2.5 hover:bg-[#e2c97e] transition-colors disabled:opacity-40">Ajouter →</button>
                  </div>
                )}
                {mealItems.length > 0 && (
                  <div>
                    {["Petit-déjeuner","Déjeuner","Dîner","Collation"].map(type => {
                      const items = mealItems.filter(i => i.meal_type === type);
                      if (!items.length) return null;
                      return (
                        <div key={type} className="mb-4">
                          <p className="text-[0.48rem] tracking-wider uppercase text-[#c9a84c]/50 mb-1.5">{type}</p>
                          {items.map(item => (
                            <div key={item.id} className="flex items-center justify-between border border-white/8 bg-[#111] px-4 py-2.5 mb-1">
                              <div><p className="text-xs text-white/60">{item.name}</p><div className="flex gap-2 mt-0.5"><span className="text-[0.42rem] text-white/25">{item.calories} kcal</span><span className="text-[0.42rem] text-[#c9a84c]/55">P {item.proteines}g</span><span className="text-[0.42rem] text-[#7eb8a0]/55">G {item.glucides}g</span><span className="text-[0.42rem] text-[#e07070]/55">L {item.lipides}g</span></div></div>
                              <button onClick={async () => { await supabase.from("meal_plan_items").delete().eq("id", item.id); setMealItems(prev => prev.filter(x => x.id !== item.id)); }} className="text-white/15 hover:text-[#e07070] transition-colors"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* JOURNAL ALIMENTAIRE (lecture seule — ce que le client a loggé) */}
            {tab === "journal" && (
              <div className="max-w-2xl flex flex-col gap-3">
                {journal.length === 0 ? (
                  <p className="text-white/20 text-xs text-center py-8">Aucun repas loggé par ce client</p>
                ) : journal.map(d => (
                  <div key={d.date} className="border border-white/8 bg-[#111]">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                      <p className="text-xs text-white/70 capitalize">{new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                      <div className="flex items-center gap-3 text-[0.6rem]">
                        <span className="text-white/50">{Math.round(d.calories)} kcal</span>
                        <span className="text-[#c9a84c]/70">P {Math.round(d.proteines)}</span>
                        <span className="text-[#7eb8a0]/70">G {Math.round(d.glucides)}</span>
                        <span className="text-[#e07070]/70">L {Math.round(d.lipides)}</span>
                      </div>
                    </div>
                    {d.foods && d.foods.length > 0 ? (
                      <div className="px-4 py-2 flex flex-col gap-1.5">
                        {d.foods.map((f, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <p className="text-[0.7rem] text-white/55">{f.name}</p>
                            <p className="text-[0.6rem] text-white/30 shrink-0 ml-3">{Math.round(f.calories)} kcal · P{Math.round(f.proteines)} G{Math.round(f.glucides)} L{Math.round(f.lipides)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-2 text-[0.6rem] text-white/20">Détail des aliments non disponible (totaux seulement)</p>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {!selected && (
        <div className="flex-1 hidden md:flex items-center justify-center">
          <p className="text-white/10 text-sm">Sélectionne un client</p>
        </div>
      )}
    </div>
  );
}

"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import { CalendarPicker } from "@/components/CalendarPicker";
import { Select } from "@/components/Select";
import { ClientStatusDot } from "@/components/ClientStatusDot";
import { loadClientStatuses, statusFor, STATUS_LEVEL_COLOR, type ClientStatus } from "@/lib/clientStatus";
import { Icon } from "@/components/Icon";
import { X, ChevronLeft, MessageSquare, Trash2, ExternalLink } from "@/lib/solarIcons";
import { ConsistencyStrip } from "@/components/ConsistencyStrip";
import { loadDayStatuses, type DayStatus } from "@/lib/consistency";
import { MuscleVolumeChart } from "@/components/MuscleVolumeChart";
import { loadMuscleVolume } from "@/lib/muscleVolume";
import { type Mesocycle, loadActiveMesocycle } from "@/lib/mesocycles";
import { MesocycleCard } from "@/components/MesocycleCard";
import { loadPersonalRecords, type PRCard } from "@/lib/personalRecords";
import { Sparkline } from "@/components/Sparkline";
import { hasBlessure } from "@/lib/blessures";

const LEVEL_RANK: Record<ClientStatus["level"], number> = { risque: 0, attention: 1, ok: 2 };

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
  reactive:   { label: "Réactivé",   color: "#6ea8d9" },
} as const;
type StatusKey = keyof typeof STATUS_CFG;
type StageKey  = keyof typeof STAGE_CFG;

type Client   = { id: string; email: string; prenom: string; nom: string; age: number; poids: number; taille: number; sexe: string; niveau_activite: string; experience: string; seances_par_semaine: number; lieu_entrainement: string; blessures: string; alimentation: string; sommeil_stress: string; objectifs: string; objectif_echeance: string | null; objectif_pending: boolean; objectif_type: string | null; updated_at: string; status: StatusKey | null; subscription_end: string | null; pipeline_stage: StageKey | null; avatar_url: string | null; is_coach: boolean | null };
type PendingSignup = { id: string; email: string; full_name: string | null; created_at: string; email_confirmed_at: string | null };
type Seance   = { id: string; titre: string; type_seance: string | null; date_prevue: string | null; semaine: number | null; description: string | null; exercices: string | null; completed_at: string | null };
type Note     = { id: string; client_id: string; content: string; created_at: string };
type Checkin  = { id: string; client_id: string; week_date: string; weight: number | null; body_fat: number | null; compliance: number | null; energy: number | null; notes: string | null };
type FoodItem = { name: string; calories: number; proteines: number; glucides: number; lipides: number; repas?: string | null };
type DaySummary = { date: string; calories: number; proteines: number; glucides: number; lipides: number; foods: FoodItem[] | null; goal_calories?: number | null; goal_proteines?: number | null };
type LastMsg  = { from_email: string; content: string; created_at: string };
type MealPlan = { id: string; name: string; notes: string | null; is_active: boolean };
type MealItem = { id: string; plan_id: string; meal_type: string; name: string; calories: number; proteines: number; glucides: number; lipides: number };

const todayStr = () => new Date().toISOString().split("T")[0];

// Colonnes de la liste en mode tableau (aucun client ouvert) : en-tête et lignes partagent la grille.
const ROW_COLS = "grid-cols-[minmax(0,1fr)_90px_60px]";

function ClientAvatar({ c, color, size = 36 }: { c: Pick<Client, "prenom" | "nom" | "avatar_url">; color: string; size?: number }) {
  if (c.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.avatar_url} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size, boxShadow: `0 0 0 2px ${color}40` }}/>;
  }
  const initials = `${c.prenom?.[0] ?? ""}${c.nom?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-bold"
      style={{ width: size, height: size, fontSize: size * 0.32, color, background: `linear-gradient(145deg, ${color}35, ${color}12)`, boxShadow: `inset 0 0 0 1px ${color}30` }}>
      {initials}
    </div>
  );
}

function activityLabel(s: ClientStatus): string {
  if (s.pendingMessageDays !== null) return `Message en attente · ${s.pendingMessageDays}j`;
  return s.daysSinceSeance === null ? "Aucune séance" : `Séance il y a ${s.daysSinceSeance}j`;
}

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const [clients,  setClients]  = useState<Client[]>([]);
  const [search,   setSearch]   = useState("");
  const [filterStage,  setFilterStage]  = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Arrivée depuis un lien "En risque" / "Churné" / une étape du pipeline (aperçu CRM ou
  // ancienne page /crm/pipeline, jamais construite) : ?stage=en_risque préfiltre direct la
  // liste plutôt que de renvoyer vers une vue dédiée qui n'existe pas.
  useEffect(() => {
    const stage = searchParams.get("stage");
    if (stage) setFilterStage(stage);
  }, [searchParams]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [tab,      setTab]      = useState<"apercu"|"profil"|"notes"|"checkin"|"repas"|"journal">("apercu");
  const [loading,  setLoading]  = useState(true);
  const [pendingSignups, setPendingSignups] = useState<PendingSignup[]>([]);
  const [statuses, setStatuses] = useState<Map<string, ClientStatus>>(new Map());
  const [sortByStatus, setSortByStatus] = useState(false);
  // Horodatage figé au montage : calculs "il y a Xj" / "expire dans Xj" sans appel impur au rendu.
  const [nowTs] = useState(() => Date.now());

  // Detail data
  const [seances,      setSeances]      = useState<Seance[]>([]);
  const [notes,        setNotes]        = useState<Note[]>([]);
  const [checkins,     setCheckins]     = useState<Checkin[]>([]);
  const [mealPlans,    setMealPlans]    = useState<MealPlan[]>([]);
  const [mealItems,    setMealItems]    = useState<MealItem[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [journal,      setJournal]      = useState<DaySummary[]>([]);
  const [bodyFat,      setBodyFat]      = useState<number | null>(null);
  const [lastMsg,      setLastMsg]      = useState<LastMsg | null>(null);
  // Vue d'ensemble : mêmes sources que côté client (régularité, records, volume,
  // mésocycle), jamais montrées au coach jusqu'ici — d'où la navigation éclatée
  // entre cette page (nutrition/poids) et /crm/programmes (séances) pour tout voir.
  const [dayStatuses,  setDayStatuses]  = useState<Record<string, DayStatus>>({});
  const [records,      setRecords]      = useState<PRCard[]>([]);
  const [muscleVolume, setMuscleVolume] = useState<Record<string, number[]>>({});
  const [activeMeso,   setActiveMeso]   = useState<Mesocycle | null>(null);

  // Forms
  const [noteInput,    setNoteInput]    = useState("");
  const [noteSaving,   setNoteSaving]   = useState(false);
  const [ckForm,       setCkForm]       = useState({ week_date: todayStr(), weight: "", body_fat: "", compliance: 0, notes: "" });
  const [ckSaving,     setCkSaving]     = useState(false);
  const [planName,     setPlanName]     = useState("");
  const [planNotes,    setPlanNotes]    = useState("");
  const [planSaving,   setPlanSaving]   = useState(false);
  const [itemForm,     setItemForm]     = useState({ meal_type: "Petit-déjeuner", name: "", calories: "", proteines: "", glucides: "", lipides: "" });
  const [statusSaving, setStatusSaving] = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [showSubEndPicker, setShowSubEndPicker] = useState(false);
  const [showCkDatePicker, setShowCkDatePicker] = useState(false);
  const [deletingPendingId, setDeletingPendingId] = useState<string | null>(null);

  useEffect(() => {
    // Le coach lui-même (et tout autre compte coach visible via RLS) n'a rien à faire dans son
    // propre roster — même filtre que le board /crm/pipeline.
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const { data } = await supabase.from("profiles").select("*").order("updated_at", { ascending: false });
      setClients(((data ?? []) as Client[]).filter(c => !c.is_coach && c.id !== user?.id));
      setLoading(false);
      if (user?.email) loadClientStatuses(user.email).then(setStatuses).catch(() => {});
    });
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
    setSelected(c); setTab("apercu"); setBodyFat(null);
    setNoteInput(""); setCkForm({ week_date: todayStr(), weight: "", body_fat: "", compliance: 0, notes: "" });
    setDayStatuses({}); setRecords([]); setMuscleVolume({}); setActiveMeso(null); setLastMsg(null);
    // Dernier message échangé avec ce client (RLS : uniquement mes conversations) — aperçu
    // dans la vue d'ensemble, en tâche de fond pour ne pas retarder la fiche.
    supabase.from("messages").select("from_email,content,created_at")
      .or(`from_email.eq."${c.email}",to_email.eq."${c.email}"`)
      .order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => setLastMsg((data?.[0] as LastMsg | undefined) ?? null));
    const [{ data: s }, { data: n }, { data: ck }, { data: js }, { data: bf }] = await Promise.all([
      supabase.from("programme_seances").select("*").eq("assigned_to_email", c.email).order("created_at", { ascending: false }),
      supabase.from("coach_notes").select("*").eq("client_id", c.id).order("created_at", { ascending: false }),
      supabase.from("weekly_checkins").select("*").eq("client_id", c.id).order("week_date", { ascending: false }),
      supabase.from("daily_summaries").select("date,calories,proteines,glucides,lipides,foods,goal_calories,goal_proteines").eq("user_id", c.id).order("date", { ascending: false }).limit(14),
      supabase.from("body_fat_entries").select("body_fat").eq("user_id", c.id).order("date", { ascending: false }).limit(1),
    ]);
    setSeances((s ?? []) as Seance[]); setNotes((n ?? []) as Note[]); setCheckins((ck ?? []) as Checkin[]);
    setJournal((js ?? []) as DaySummary[]);
    setBodyFat(bf?.[0]?.body_fat ?? null);
    await loadMealPlans(c.id);

    // Best-effort, en tâche de fond : la vue d'ensemble ne doit jamais bloquer le
    // reste de la fiche client si une de ces sources échoue.
    loadDayStatuses(c.id, c.objectif_type).then(setDayStatuses).catch(() => {});
    loadPersonalRecords(c.id).then(r => setRecords(r.slice(0, 6))).catch(() => {});
    loadMuscleVolume(c.id).then(setMuscleVolume).catch(() => {});
    loadActiveMesocycle(c.id).then(setActiveMeso).catch(() => {});
  };

  // Arrivée depuis une carte du board /crm/pipeline : ?client=<id> ouvre directement la fiche.
  const clientParam = searchParams.get("client");
  useEffect(() => {
    if (!clientParam || loading || selected?.id === clientParam) return;
    const c = clients.find(x => x.id === clientParam);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ouverture ponctuelle depuis l'URL
    if (c) selectClient(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientParam, loading, clients]);

  const updateField = async (fields: Record<string, string | boolean | null>) => {
    if (!selected) return;
    setStatusSaving(true);
    await supabase.from("profiles").update(fields).eq("id", selected.id);
    const updated = { ...selected, ...fields } as Client;
    setSelected(updated);
    setClients(prev => prev.map(c => c.id === selected.id ? updated : c));
    setStatusSaving(false);
  };

  // Supprime un compte entièrement (connexion + tout son historique coaching) via la
  // route serveur /api/crm/delete-client — un compte auth ne peut être supprimé qu'avec
  // la clé service_role, jamais depuis le navigateur.
  const deleteAccount = async (id: string, email: string) => {
    const res = await apiPost("/api/crm/delete-client", { id, email });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { alert(`Erreur lors de la suppression : ${body.error ?? res.statusText}`); return false; }
    setClients(prev => prev.filter(c => c.id !== id));
    setPendingSignups(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const deleteClient = async () => {
    if (!selected) return;
    if (!window.confirm(`Supprimer définitivement ${selected.prenom} ${selected.nom} (compte + tout son historique) ? Cette action est irréversible.`)) return;
    setDeleting(true);
    if (await deleteAccount(selected.id, selected.email)) setSelected(null);
    setDeleting(false);
  };

  const deletePendingSignup = async (p: PendingSignup) => {
    if (!window.confirm(`Supprimer définitivement le compte ${p.full_name || p.email} ? Cette action est irréversible.`)) return;
    setDeletingPendingId(p.id);
    await deleteAccount(p.id, p.email);
    setDeletingPendingId(null);
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

  const inp = "w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const lbl = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${c.prenom} ${c.nom} ${c.email}`.toLowerCase().includes(q);
    const matchStage  = filterStage  === "all" || (c.pipeline_stage ?? "actif") === filterStage;
    const matchStatus = filterStatus === "all" || (c.status ?? "actif") === filterStatus;
    return matchSearch && matchStage && matchStatus;
  });
  if (sortByStatus) {
    filtered.sort((a, b) => LEVEL_RANK[statusFor(statuses, a.email).level] - LEVEL_RANK[statusFor(statuses, b.email).level]);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="flex h-[calc(100dvh-50px-env(safe-area-inset-bottom))] md:h-screen overflow-hidden">

      {/* ── Left: list (plein écran sur mobile quand aucun client sélectionné) ── */}
      <div className={`flex-col border-r border-[var(--t-border-soft)] bg-[var(--t-bg)] ${selected ? "hidden md:flex w-72 shrink-0" : "flex flex-1"}`}>
        <div className="px-4 md:px-5 pt-5 md:pt-6 pb-4 border-b border-[var(--t-border-soft)]">
          <p className="text-[0.5rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">Plateforme coaching</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-[var(--t-text)] tracking-wide mb-3">CLIENTS</h1>
          <input className={`${inp} mb-3 md:max-w-md`} placeholder="Rechercher un client…" value={search} onChange={e => setSearch(e.target.value)}/>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterStage} onChange={setFilterStage}
              options={[{ value: "all", label: "Tous stages" }, ...Object.entries(STAGE_CFG).map(([k, v]) => ({ value: k, label: v.label }))]}
              triggerClassName="bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text-50)] text-[0.5rem] px-2 py-1.5"/>
            <Select value={filterStatus} onChange={setFilterStatus}
              options={[{ value: "all", label: "Tous statuts" }, ...Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label }))]}
              triggerClassName="bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text-50)] text-[0.5rem] px-2 py-1.5"/>
            <button onClick={() => setSortByStatus(v => !v)}
              className={`text-[0.5rem] tracking-[0.08em] uppercase px-2 py-1.5 rounded-xl border transition-colors ${sortByStatus ? "border-[#e07070]/40 text-[#e07070] bg-[#e07070]/5" : "border-[var(--t-border)] text-[var(--t-text-40)] hover:border-[var(--t-text-25)]"}`}>
              ⚠ Priorité
            </button>
          </div>
          <p className="text-[0.45rem] text-[var(--t-text-20)] mt-2">{filtered.length} client{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {pendingSignups.length > 0 && (
          <div className="border-b border-[#c9a84c]/10 bg-[var(--t-surface-gold)] rounded-xl px-4 md:px-5 py-3 shrink-0">
            <p className="text-[0.5rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-2">
              Inscriptions en attente ({pendingSignups.length})
            </p>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {pendingSignups.map(p => (
                <div key={p.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] text-[var(--t-text-70)] truncate">{p.full_name || "Sans nom"}</p>
                    <p className="text-[0.5rem] text-[var(--t-text-30)] truncate">{p.email}</p>
                  </div>
                  <div className="flex items-start gap-2 shrink-0">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-[0.4rem] tracking-wider uppercase px-1.5 py-0.5 rounded-full border whitespace-nowrap ${p.email_confirmed_at ? "text-[#7eb8a0] border-[#7eb8a0]/30" : "text-[#e09070] border-[#e09070]/30"}`}>
                        {p.email_confirmed_at ? "Email confirmé" : "Confirmation en attente"}
                      </span>
                      <span className="text-[0.42rem] text-[var(--t-text-20)]">{new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                    </div>
                    <button onClick={() => deletePendingSignup(p)} disabled={deletingPendingId === p.id}
                      title="Supprimer ce compte" aria-label="Supprimer ce compte" className="text-[var(--t-text-15)] hover:text-[#e07070] transition-colors disabled:opacity-40 mt-px">
                      <Icon icon={X} size={11} strokeWidth={2}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste en lignes compactes : étape et activité sur la ligne du nom. Sans client ouvert,
            deux colonnes en plus (abonnement, poids), dans une largeur contenue plutôt qu'étalée. */}
        {!selected && (
          <div className={`hidden md:grid ${ROW_COLS} gap-4 px-5 pt-3 pb-1.5 max-w-3xl text-[0.48rem] tracking-[0.18em] uppercase text-[var(--t-text-25)]`}>
            <span>Client</span><span>Abonnement</span><span className="text-right">Poids</span>
          </div>
        )}
        <div className={`flex-1 overflow-y-auto py-1 px-2 ${selected ? "" : "md:max-w-3xl"}`}>
          {filtered.map(c => {
            const stage = (c.pipeline_stage ?? "actif") as StageKey;
            const stageCfg = STAGE_CFG[stage] ?? STAGE_CFG.actif;
            const st = statusFor(statuses, c.email);
            const subEnd = c.subscription_end ? new Date(c.subscription_end + "T00:00:00") : null;
            const subDays = subEnd ? Math.ceil((subEnd.getTime() - nowTs) / 86400000) : null;
            const subSoon = subDays !== null && subDays <= 14;
            const isSelected = selected?.id === c.id;
            const activity = stage !== "prospect" ? (
              <span className="inline-flex items-center gap-1 text-[0.58rem] min-w-0" style={{ color: STATUS_LEVEL_COLOR[st.level] }}>
                <ClientStatusDot status={st}/><span className="truncate">{activityLabel(st)}</span>
              </span>
            ) : <span className="text-[0.58rem] text-[var(--t-text-20)]">—</span>;
            const stageBadge = (
              <span className="text-[0.45rem] tracking-wider uppercase px-1.5 py-0.5 rounded-full shrink-0"
                style={{ color: stageCfg.color, backgroundColor: `${stageCfg.color}14` }}>
                {stageCfg.label}
              </span>
            );
            return (
              <button key={c.id} onClick={() => selectClient(c)}
                className={`w-full text-left px-3 py-2 border-b border-[var(--t-border-soft)] last:border-0 rounded-lg transition-colors ${isSelected ? "bg-[#c9a84c]/10" : "hover:bg-[var(--t-glass-bg)]"} ${selected ? "" : `md:grid ${ROW_COLS} md:gap-4 md:items-center`}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <ClientAvatar c={c} color={stageCfg.color} size={28}/>
                  <div className="min-w-0 flex-1">
                    <div className={`flex items-center gap-2 min-w-0 ${selected ? "justify-between" : "justify-between md:justify-start"}`}>
                      <p className={`text-[0.8rem] font-medium truncate ${isSelected ? "text-[var(--t-text)]" : "text-[var(--t-text-75)]"}`}>{c.prenom} {c.nom}</p>
                      {stageBadge}
                      {!selected && <span className="hidden md:inline-flex min-w-0">{activity}</span>}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-0.5 min-w-0 ${selected ? "" : "md:hidden"}`}>
                      {activity}
                      {subSoon && <span className="text-[0.52rem] text-[#e09070] shrink-0">· {subDays! <= 0 ? "Abo. expiré" : `Abo. ${subDays}j`}</span>}
                    </div>
                  </div>
                </div>
                {!selected && (
                  <>
                    <span className={`hidden md:block text-[0.6rem] ${subSoon ? "text-[#e09070]" : "text-[var(--t-text-35)]"}`}>
                      {subEnd ? (subDays! <= 0 ? "Expiré" : subEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })) : "—"}
                    </span>
                    <span className="hidden md:block text-[0.65rem] text-[var(--t-text-40)] text-right">{c.poids ? `${c.poids} kg` : "—"}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: detail ── */}
      {selected && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-4 md:px-8 pt-5 md:pt-6 pb-4 border-b border-[var(--t-border-soft)] shrink-0">
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <button onClick={() => setSelected(null)} aria-label="Retour à la liste des clients" className="md:hidden text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors mt-1.5 shrink-0">
                  <Icon icon={ChevronLeft} size={18}/>
                </button>
                <ClientAvatar c={selected} color={(STAGE_CFG[(selected.pipeline_stage ?? "actif") as StageKey] ?? STAGE_CFG.actif).color} size={56}/>
                <div className="min-w-0">
                <p className="text-[0.45rem] tracking-[0.2em] text-[var(--t-text-25)] uppercase truncate">{selected.email}</p>
                <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl md:text-4xl text-[var(--t-text)] tracking-wide leading-none mt-0.5">{selected.prenom} {selected.nom}</h2>
                <p className="text-[var(--t-text-30)] text-xs mt-1">{selected.age} ans · {selected.sexe} · {selected.poids} kg · {selected.taille} cm{bodyFat !== null && ` · Body fat ${bodyFat}%`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/crm/inbox?client=${encodeURIComponent(selected.email)}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-70)] hover:border-[var(--t-text-25)] transition-all text-[0.45rem] tracking-[0.15em] uppercase">
                  <Icon icon={MessageSquare} size={11}/>
                  Inbox
                </Link>
                <button onClick={deleteClient} disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e07070]/20 text-[#e07070]/50 hover:text-[#e07070] hover:border-[#e07070]/40 transition-all text-[0.45rem] tracking-[0.15em] uppercase disabled:opacity-40">
                  <Icon icon={Trash2} size={11}/>
                  {deleting ? "Suppression…" : "Supprimer"}
                </button>
                <button onClick={() => setSelected(null)} aria-label="Fermer la fiche client" className="text-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">
                  <Icon icon={X} size={16}/>
                </button>
              </div>
            </div>

            {/* Controls row */}
            {/* Étape (pipeline, décision du coach) et statut (abonnement) : deux notions distinctes,
                chacune dans un menu nommé plutôt qu'un menu + 4 pastilles qui répétaient "Actif". */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.42rem] text-[var(--t-text-25)] uppercase tracking-wider">Étape</span>
                <Select disabled={statusSaving} value={selected.pipeline_stage ?? "actif"}
                  onChange={v => updateField({ pipeline_stage: v })}
                  options={Object.entries(STAGE_CFG).map(([k, v]) => ({ value: k, label: v.label }))}
                  triggerClassName="bg-transparent border rounded-xl text-[0.5rem] tracking-wider uppercase px-2 py-1.5"
                  triggerStyle={{ color: (STAGE_CFG[(selected.pipeline_stage ?? "actif") as StageKey] ?? STAGE_CFG.actif).color, borderColor: `${(STAGE_CFG[(selected.pipeline_stage ?? "actif") as StageKey] ?? STAGE_CFG.actif).color}50` }}/>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[0.42rem] text-[var(--t-text-25)] uppercase tracking-wider">Statut</span>
                <Select disabled={statusSaving} value={selected.status ?? "actif"}
                  onChange={v => updateField({ status: v })}
                  options={(Object.keys(STATUS_CFG) as StatusKey[]).map(k => ({ value: k, label: STATUS_CFG[k].label }))}
                  triggerClassName="bg-transparent border rounded-xl text-[0.5rem] tracking-wider uppercase px-2 py-1.5"
                  triggerStyle={{ color: STATUS_CFG[(selected.status ?? "actif") as StatusKey].color, borderColor: `${STATUS_CFG[(selected.status ?? "actif") as StatusKey].color}50` }}/>
              </div>
              {/* Fin abonnement */}
              <div className="relative flex items-center gap-1.5">
                <span className="text-[0.42rem] text-[var(--t-text-25)] uppercase tracking-wider">Fin abo.</span>
                <button type="button" onClick={() => setShowSubEndPicker(o => !o)}
                  className="bg-transparent border border-[var(--t-border)] text-[var(--t-text-40)] rounded-xl text-[0.48rem] px-2 py-1 hover:border-[#c9a84c]/40 transition-colors">
                  {selected.subscription_end
                    ? new Date(selected.subscription_end + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </button>
                {showSubEndPicker && (
                  <CalendarPicker value={selected.subscription_end ?? null}
                    onChange={val => updateField({ subscription_end: val })}
                    onClose={() => setShowSubEndPicker(false)}
                    className="top-full right-0 mt-2"/>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--t-border-soft)] px-4 md:px-8 shrink-0 overflow-x-auto">
            {([
              { key: "apercu",     label: "Vue d'ensemble" },
              { key: "profil",     label: "Profil" },
              { key: "notes",      label: `Notes (${notes.length})` },
              { key: "checkin",    label: `Check-ins (${checkins.length})` },
              { key: "repas",      label: `Plan repas${activePlanId ? " ✓" : ""}` },
              { key: "journal",    label: `Journal (${journal.length})` },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`py-3 mr-5 text-[0.58rem] tracking-[0.12em] uppercase border-b-2 transition-colors whitespace-nowrap ${tab === key ? "border-[#c9a84c] text-[#c9a84c]" : "border-transparent text-[var(--t-text-30)] hover:text-[var(--t-text-50)]"}`}>
                {label}
              </button>
            ))}
            {/* Renvoie vers la même section Programmes (bibliothèque + modèles + IA) que le menu
                CRM, pré-sélectionnée sur ce client — plus de formulaire de séance dupliqué ici. */}
            <Link href={`/crm/programmes?client=${encodeURIComponent(selected.email)}`}
              className="py-3 mr-5 text-[0.58rem] tracking-[0.12em] uppercase border-b-2 border-transparent text-[var(--t-text-30)] hover:text-[var(--t-text-50)] transition-colors whitespace-nowrap flex items-center gap-1">
              Programme ({seances.length})
              <Icon icon={ExternalLink} size={9} strokeWidth={2}/>
            </Link>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6">

            {/* VUE D'ENSEMBLE — régularité, records, volume, mésocycle, poids : tout ce qui
                était éclaté entre cette page et /crm/programmes, réuni en un seul écran. */}
            {tab === "apercu" && (
              <div className="flex flex-col gap-6 max-w-3xl">
                {/* Chiffres clés — ce qu'un coach veut savoir en 2 secondes en ouvrant une fiche. */}
                {(() => {
                  const st = statusFor(statuses, selected.email);
                  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toLocaleDateString("sv-SE"); });
                  const done7 = last7.filter(iso => dayStatuses[iso] === "ok" || dayStatuses[iso] === "exemplary").length;
                  const weightPoints = [...checkins].reverse().map(c => c.weight).filter((w): w is number => w != null);
                  const lastWeight = weightPoints.length ? weightPoints[weightPoints.length - 1] : selected.poids;
                  const weightDelta = weightPoints.length > 1 ? +(weightPoints[weightPoints.length - 1] - weightPoints[0]).toFixed(1) : null;
                  const lastCk = checkins[0];
                  const ckDays = lastCk ? Math.floor((nowTs - new Date(lastCk.week_date + "T12:00:00").getTime()) / 86400000) : null;
                  const subDays = selected.subscription_end ? Math.ceil((new Date(selected.subscription_end + "T12:00:00").getTime() - nowTs) / 86400000) : null;
                  const tiles: { label: string; value: string; sub: string; color: string }[] = [
                    { label: "Dernière séance", value: st.daysSinceSeance === null ? "—" : st.daysSinceSeance === 0 ? "Auj." : `${st.daysSinceSeance}j`,
                      sub: st.daysSinceSeance === null ? "Aucune séance" : "depuis la dernière", color: STATUS_LEVEL_COLOR[st.daysSinceSeance === null || st.daysSinceSeance >= 14 ? "risque" : st.daysSinceSeance >= 7 ? "attention" : "ok"] },
                    { label: "Régularité 7j", value: `${done7}/7`, sub: "jours réussis", color: done7 >= 5 ? "#7eb8a0" : done7 >= 3 ? "#c9a84c" : "#e07070" },
                    { label: "Poids", value: lastWeight ? `${lastWeight}` : "—", sub: weightDelta === null ? "kg" : `kg · ${weightDelta > 0 ? "+" : ""}${weightDelta} depuis début`, color: "var(--t-text)" },
                    { label: "Dernier check-in", value: ckDays === null ? "—" : ckDays === 0 ? "Auj." : `${ckDays}j`, sub: ckDays === null ? "Aucun check-in" : "depuis le dernier", color: ckDays === null || ckDays > 10 ? "#e09070" : "var(--t-text)" },
                    { label: "Abonnement", value: subDays === null ? "—" : subDays <= 0 ? "Expiré" : `${subDays}j`, sub: subDays === null ? "Pas de date de fin" : subDays <= 0 ? "à renouveler" : "restants", color: subDays !== null && subDays <= 14 ? "#e09070" : "var(--t-text)" },
                  ];
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {tiles.map(t => (
                        <div key={t.label} className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl px-3.5 py-3">
                          <p className="text-[0.48rem] tracking-[0.18em] uppercase text-[var(--t-text-30)]">{t.label}</p>
                          <p style={{ fontFamily: "var(--font-bebas)", color: t.color }} className="text-3xl tracking-wide leading-none mt-1.5">{t.value}</p>
                          <p className="text-[0.55rem] text-[var(--t-text-25)] mt-1 truncate">{t.sub}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Aucun programme envoyé : l'action à faire, pas une grille vide. */}
                {seances.length === 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#c9a84c]/25 bg-[#c9a84c]/[0.06] px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-[var(--t-text-80)]">Aucun programme envoyé</p>
                      <p className="text-[0.65rem] text-[var(--t-text-40)] mt-0.5">{selected.prenom} n&apos;a encore reçu aucune séance.</p>
                    </div>
                    <Link href={`/crm/programmes?client=${encodeURIComponent(selected.email)}`}
                      className="shrink-0 text-center px-4 py-2 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.1em] uppercase rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:-translate-y-0.5 transition-all">
                      Envoyer un programme
                    </Link>
                  </div>
                )}

                {/* 1 · Résumé client — l'essentiel du Profil, utile à chaque préparation de programme. */}
                <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Résumé</p>
                    <button onClick={() => setTab("profil")} className="text-[0.45rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">Profil complet →</button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div className="sm:col-span-2">
                      <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-0.5">Objectif{selected.objectif_echeance && ` · échéance ${selected.objectif_echeance}`}</p>
                      <p className="text-xs text-[var(--t-text-70)] leading-relaxed line-clamp-2">{selected.objectifs || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-0.5">Blessures / contraintes</p>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${hasBlessure(selected.blessures) ? "text-[#e09070]" : "text-[var(--t-text-40)]"}`}>{hasBlessure(selected.blessures) ? selected.blessures : "Aucune signalée"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-0.5">Fréquence</p>
                        <p className="text-xs text-[var(--t-text-70)]">{selected.seances_par_semaine ? `${selected.seances_par_semaine}× / sem.` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-0.5">Lieu</p>
                        <p className="text-xs text-[var(--t-text-70)] truncate">{selected.lieu_entrainement || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2 · Dernière note coach + dernier message — reprendre le fil sans changer d'onglet. */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Dernière note</p>
                      <button onClick={() => setTab("notes")} className="text-[0.45rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">
                        {notes.length ? `Toutes (${notes.length}) →` : "Ajouter →"}
                      </button>
                    </div>
                    {notes[0] ? (
                      <>
                        <p className="text-xs text-[var(--t-text-65)] leading-relaxed line-clamp-3">{notes[0].content}</p>
                        <p className="text-[0.5rem] text-[var(--t-text-25)] mt-auto pt-2">{new Date(notes[0].created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                      </>
                    ) : <p className="text-xs text-[var(--t-text-25)]">Aucune note pour l&apos;instant.</p>}
                  </div>
                  <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Dernier message</p>
                      <Link href={`/crm/inbox?client=${encodeURIComponent(selected.email)}`} className="text-[0.45rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">Inbox →</Link>
                    </div>
                    {lastMsg ? (
                      <>
                        <p className="text-xs text-[var(--t-text-65)] leading-relaxed line-clamp-3">
                          <span className="text-[var(--t-text-35)]">{lastMsg.from_email === selected.email ? `${selected.prenom} : ` : "Toi : "}</span>{lastMsg.content}
                        </p>
                        <p className="text-[0.5rem] text-[var(--t-text-25)] mt-auto pt-2">{new Date(lastMsg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                      </>
                    ) : <p className="text-xs text-[var(--t-text-25)]">Aucun échange pour l&apos;instant.</p>}
                  </div>
                </div>

                {/* 3 · Programme en cours — prochaine séance, semaine en cours vs fréquence visée. */}
                {seances.length > 0 && (() => {
                  const todayISO = new Date(nowTs).toLocaleDateString("sv-SE");
                  const weekStart = new Date(nowTs); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
                  const doneThisWeek = seances.filter(s => s.completed_at && new Date(s.completed_at) >= weekStart).length;
                  const target = selected.seances_par_semaine || 0;
                  const next = seances.filter(s => !s.completed_at && s.date_prevue && s.date_prevue >= todayISO)
                    .sort((a, b) => a.date_prevue!.localeCompare(b.date_prevue!))[0]
                    ?? seances.find(s => !s.completed_at);
                  const lastDone = seances.filter(s => s.completed_at).sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))[0];
                  const pending = seances.filter(s => !s.completed_at).length;
                  return (
                    <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Programme en cours</p>
                        <Link href={`/crm/programmes?client=${encodeURIComponent(selected.email)}`} className="text-[0.45rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">Gérer →</Link>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-1">Cette semaine</p>
                          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl leading-none text-[var(--t-text)] tracking-wide">
                            {doneThisWeek}{target ? <span className="text-[var(--t-text-30)]"> / {target}</span> : null}
                          </p>
                          {target > 0 && (
                            <div className="flex gap-1 mt-2">
                              {Array.from({ length: target }, (_, i) => (
                                <div key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i < doneThisWeek ? "#7eb8a0" : "var(--t-track)" }}/>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-1">Prochaine séance</p>
                          <p className="text-xs text-[var(--t-text-75)] truncate">{next ? next.titre : "—"}</p>
                          <p className="text-[0.55rem] text-[var(--t-text-30)] mt-0.5">
                            {next?.date_prevue ? new Date(next.date_prevue + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : next ? "Sans date" : "Rien de prévu"}
                            {pending > 1 && ` · ${pending} à faire`}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mb-1">Dernière terminée</p>
                          <p className="text-xs text-[var(--t-text-75)] truncate">{lastDone ? lastDone.titre : "—"}</p>
                          <p className="text-[0.55rem] text-[var(--t-text-30)] mt-0.5">
                            {lastDone ? new Date(lastDone.completed_at!).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : "Aucune pour l'instant"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 4 · Nutrition 7 jours — moyennes vs objectif (snapshot du jour dans daily_summaries). */}
                {(() => {
                  const since = new Date(nowTs); since.setDate(since.getDate() - 6);
                  const sinceISO = since.toLocaleDateString("sv-SE");
                  const days = journal.filter(d => d.date >= sinceISO && d.calories > 0);
                  if (days.length === 0) return (
                    <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl px-4 py-3 flex items-center justify-between">
                      <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Nutrition · 7 jours</p>
                      <p className="text-xs text-[var(--t-text-25)]">Rien de loggé cette semaine</p>
                    </div>
                  );
                  const avg = (f: (d: DaySummary) => number) => Math.round(days.reduce((a, d) => a + f(d), 0) / days.length);
                  const withGoal = days.filter(d => d.goal_calories);
                  const goalKcal = withGoal.length ? Math.round(withGoal.reduce((a, d) => a + (d.goal_calories ?? 0), 0) / withGoal.length) : null;
                  const withPGoal = days.filter(d => d.goal_proteines);
                  const goalProt = withPGoal.length ? Math.round(withPGoal.reduce((a, d) => a + (d.goal_proteines ?? 0), 0) / withPGoal.length) : null;
                  const rows = [
                    { label: "Calories", value: avg(d => d.calories), goal: goalKcal, unit: "kcal" },
                    { label: "Protéines", value: avg(d => d.proteines), goal: goalProt, unit: "g" },
                  ];
                  return (
                    <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Nutrition · 7 jours</p>
                        <button onClick={() => setTab("journal")} className="text-[0.45rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">{days.length}/7 jours loggés · Journal →</button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {rows.map(r => {
                          const pct = r.goal ? Math.round((r.value / r.goal) * 100) : null;
                          const color = pct === null ? "#c9a84c" : pct >= 90 && pct <= 110 ? "#7eb8a0" : pct >= 75 && pct <= 125 ? "#c9a84c" : "#e07070";
                          return (
                            <div key={r.label}>
                              <div className="flex items-baseline justify-between mb-1.5">
                                <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[var(--t-text-30)]">{r.label} / jour</p>
                                <p className="text-xs text-[var(--t-text-70)]">
                                  <span className="font-medium" style={{ color }}>{r.value}</span>
                                  <span className="text-[var(--t-text-30)]">{r.goal ? ` / ${r.goal}` : ""} {r.unit}</span>
                                </p>
                              </div>
                              <div className="h-1.5 rounded-full bg-[var(--t-track)] overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct ?? 100, 100)}%`, backgroundColor: color }}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4">
                  <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Régularité · 16 semaines</p>
                  <ConsistencyStrip statuses={dayStatuses}/>
                </div>

                {(() => {
                  const weightPoints = [...checkins].reverse().map(c => c.weight).filter((w): w is number => w != null);
                  return weightPoints.length > 1 ? (
                    <div className="border border-[var(--t-text-7)] bg-[var(--t-surface-2)] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Poids</p>
                        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-[var(--t-text)] tracking-wide">{weightPoints[weightPoints.length - 1]} kg</p>
                      </div>
                      <Sparkline points={weightPoints} color="#c9a84c"/>
                    </div>
                  ) : null;
                })()}

                {activeMeso && <MesocycleCard meso={activeMeso}/>}

                {Object.keys(muscleVolume).length > 0 && (
                  <div className="border border-[var(--t-text-8)] bg-[var(--t-surface-2)] rounded-xl p-4">
                    <MuscleVolumeChart byMuscle={muscleVolume}/>
                  </div>
                )}

                {records.length > 0 && (
                  <div>
                    <p className="text-[0.62rem] tracking-[0.2em] uppercase text-[var(--t-text-30)] mb-3">Records personnels</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {records.map(r => (
                        <div key={r.nom} className="border border-[var(--t-text-8)] bg-[var(--t-surface-2)] rounded-2xl p-3.5 flex flex-col gap-2">
                          <p className="text-[0.68rem] text-[var(--t-text-60)] font-medium capitalize truncate">{r.nom}</p>
                          <div className="flex items-baseline gap-1">
                            <span style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{r.currentKg}</span>
                            <span className="text-[0.62rem] text-[var(--t-text-30)]">kg</span>
                          </div>
                          <Sparkline points={r.points} color="#c9a84c"/>
                          <p className="text-[0.58rem] text-[var(--t-text-20)] tracking-wide">
                            {new Date(r.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {seances.length > 0 && !activeMeso && Object.keys(muscleVolume).length === 0 && records.length === 0 && (
                  <p className="text-[var(--t-text-20)] text-xs">Aucune séance loguée par ce client pour l&apos;instant.</p>
                )}

                <Link href={`/crm/programmes?client=${encodeURIComponent(selected.email)}`}
                  className="flex items-center gap-1.5 text-[0.62rem] tracking-wider uppercase text-[#c9a84c] hover:text-[var(--t-text-70)] transition-colors">
                  Gérer le programme et les séances <Icon icon={ExternalLink} size={10} strokeWidth={2}/>
                </Link>
              </div>
            )}

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
                  <div key={r.label} className="border border-[var(--t-text-7)] bg-[var(--t-surface)] rounded-xl px-4 py-3">
                    <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">{r.label}</p>
                    <p className="text-xs text-[var(--t-text-55)]">{r.val || "—"}</p>
                  </div>
                ))}
                <div className="col-span-2 border border-[var(--t-text-7)] bg-[var(--t-surface)] rounded-xl px-4 py-3">
                  <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[#c9a84c] mb-1">Blessures</p>
                  <p className="text-xs text-[var(--t-text-55)] leading-relaxed">{selected.blessures || "—"}</p>
                </div>
                <div className="col-span-2 border border-[#c9a84c]/10 bg-[var(--t-surface-gold)] rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-[0.48rem] tracking-[0.15em] uppercase text-[#c9a84c]">Objectifs{selected.objectif_echeance && ` · Échéance : ${selected.objectif_echeance}`}</p>
                    {selected.objectif_pending ? (
                      <button disabled={statusSaving} onClick={() => updateField({ objectif_pending: false })}
                        className="shrink-0 text-[0.48rem] tracking-wider uppercase text-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors whitespace-nowrap">
                        En attente de réponse · Annuler
                      </button>
                    ) : (
                      <button disabled={statusSaving} onClick={() => updateField({ objectif_pending: true })}
                        className="shrink-0 text-[0.48rem] tracking-wider uppercase text-[var(--t-text-30)] hover:text-[#c9a84c] transition-colors whitespace-nowrap border border-[var(--t-border)] hover:border-[#c9a84c]/40 rounded-xl px-2 py-1">
                        Demander précision →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[var(--t-text-55)] leading-relaxed">{selected.objectifs || "—"}</p>
                </div>
              </div>
            )}

            {/* NOTES */}
            {tab === "notes" && (
              <div className="max-w-2xl flex flex-col gap-4">
                <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-xl p-5">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-3">Nouvelle note</p>
                  <textarea className={`${inp} resize-none mb-3`} rows={4} placeholder="Observations, ajustements, retours séance…" value={noteInput} onChange={e => setNoteInput(e.target.value)}/>
                  <button onClick={addNote} disabled={noteSaving || !noteInput.trim()} className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-2.5 px-5 rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40">
                    {noteSaving ? "Enregistrement…" : "Ajouter →"}
                  </button>
                </div>
                {notes.length === 0 ? <p className="text-[var(--t-text-20)] text-xs text-center py-4">Aucune note</p>
                  : notes.map(n => (
                    <div key={n.id} className="border border-[var(--t-text-8)] bg-[var(--t-surface)] rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[0.48rem] tracking-wider text-[var(--t-text-25)]">
                          {new Date(n.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <button onClick={async () => { await supabase.from("coach_notes").delete().eq("id", n.id); setNotes(prev => prev.filter(x => x.id !== n.id)); }}
                          aria-label="Supprimer cette note" className="text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
                          <Icon icon={X} size={11} strokeWidth={2}/>
                        </button>
                      </div>
                      <p className="text-sm text-[var(--t-text-60)] leading-relaxed whitespace-pre-line">{n.content}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* CHECK-INS */}
            {tab === "checkin" && (
              <div className="max-w-2xl flex flex-col gap-4">
                <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-xl p-5">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">Check-in hebdomadaire</p>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="relative">
                      <label className={lbl}>Date</label>
                      <button type="button" onClick={() => setShowCkDatePicker(o => !o)} className={`${inp} text-left`}>
                        {new Date(ckForm.week_date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </button>
                      {showCkDatePicker && (
                        <CalendarPicker value={ckForm.week_date}
                          onChange={val => setCkForm(f => ({ ...f, week_date: val }))}
                          onClose={() => setShowCkDatePicker(false)}
                          className="top-full left-0 mt-2"/>
                      )}
                    </div>
                    <div><label className={lbl}>Poids (kg)</label><input type="number" step="0.1" className={inp} placeholder="78.5" value={ckForm.weight} onChange={e => setCkForm(f => ({ ...f, weight: e.target.value }))}/></div>
                    <div><label className={lbl}>Body fat (%)</label><input type="number" step="0.1" className={inp} placeholder="18.0" value={ckForm.body_fat} onChange={e => setCkForm(f => ({ ...f, body_fat: e.target.value }))}/></div>
                  </div>
                  <div className="mb-3">
                    <label className={lbl}>Compliance — 1 mauvaise · 5 parfaite</label>
                    <div className="flex gap-2 mt-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setCkForm(f => ({ ...f, compliance: n }))}
                          className={`w-9 h-9 rounded-xl border text-sm font-bold transition-all ${ckForm.compliance >= n ? "bg-[#c9a84c] border-[#c9a84c] text-black" : "border-[var(--t-border-15)] text-[var(--t-text-25)]"}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4"><label className={lbl}>Notes</label><textarea className={`${inp} resize-none`} rows={3} placeholder="Énergie, motivation, douleurs, progrès…" value={ckForm.notes} onChange={e => setCkForm(f => ({ ...f, notes: e.target.value }))}/></div>
                  <button onClick={addCheckin} disabled={ckSaving} className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-2.5 px-5 rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40">
                    {ckSaving ? "Enregistrement…" : "Enregistrer →"}
                  </button>
                </div>
                {checkins.length === 0 ? <p className="text-[var(--t-text-20)] text-xs text-center py-4">Aucun check-in</p>
                  : checkins.map(ck => (
                    <div key={ck.id} className="border border-[var(--t-text-8)] bg-[var(--t-surface)] rounded-xl px-5 py-4 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-1.5">
                          <span className="text-[0.65rem] tracking-wider text-[var(--t-text-35)]">
                            {new Date(ck.week_date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          {ck.compliance && <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <div key={n} className="w-2.5 h-2.5 rounded-sm border" style={{ backgroundColor: n <= ck.compliance! ? "#c9a84c" : "transparent", borderColor: n <= ck.compliance! ? "#c9a84c" : "var(--t-border)" }}/>)}</div>}
                        </div>
                        <div className="flex gap-5 mb-1 items-center flex-wrap">
                          {ck.weight && <span className="text-sm text-[var(--t-text-70)] font-medium">{ck.weight} kg</span>}
                          {ck.body_fat && <span className="text-sm text-[#7eb8a0]">{ck.body_fat}% BF</span>}
                          {ck.energy && <span className="text-[0.6rem] tracking-wider uppercase text-[#7eb8a0]/70">Énergie {ck.energy}/5</span>}
                        </div>
                        {ck.notes && <p className="text-xs text-[var(--t-text-35)] leading-relaxed">{ck.notes}</p>}
                      </div>
                      <button onClick={async () => { await supabase.from("weekly_checkins").delete().eq("id", ck.id); setCheckins(prev => prev.filter(x => x.id !== ck.id)); }}
                        aria-label="Supprimer ce check-in" className="text-[var(--t-text-15)] hover:text-[#e07070] transition-colors shrink-0">
                        <Icon icon={X} size={11} strokeWidth={2}/>
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* REPAS */}
            {tab === "repas" && (
              <div className="max-w-2xl flex flex-col gap-5">
                <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-xl p-5">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c] mb-4">{activePlanId ? "Plan actif" : `Créer un plan — ${selected.prenom}`}</p>
                  {!activePlanId ? (
                    <div className="flex flex-col gap-3">
                      <div><label className={lbl}>Nom du plan</label><input className={inp} placeholder="Plan prise de masse — Semaine 1" value={planName} onChange={e => setPlanName(e.target.value)}/></div>
                      <div><label className={lbl}>Notes</label><textarea className={`${inp} resize-none`} rows={2} placeholder="Conseils, timing…" value={planNotes} onChange={e => setPlanNotes(e.target.value)}/></div>
                      <button onClick={createPlan} disabled={planSaving || !planName.trim()} className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-3 rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40">Créer le plan →</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--t-text-60)]">{mealPlans.find(p => p.id === activePlanId)?.name}</p>
                      <button onClick={async () => { await supabase.from("meal_plans").update({ is_active: false }).eq("id", activePlanId); setActivePlanId(null); setMealItems([]); }} className="text-[0.65rem] tracking-wider uppercase text-[#e07070]/60 hover:text-[#e07070] transition-colors">Désactiver</button>
                    </div>
                  )}
                </div>
                {activePlanId && (
                  <div className="border border-[var(--t-text-8)] bg-[var(--t-surface)] rounded-xl p-5 flex flex-col gap-4">
                    <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Ajouter un repas</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>Type</label><Select value={itemForm.meal_type} onChange={v => setItemForm(f => ({ ...f, meal_type: v }))}
                        options={["Petit-déjeuner","Déjeuner","Dîner","Collation"].map(t => ({ value: t, label: t }))} triggerClassName={inp}/></div>
                      <div><label className={lbl}>Nom *</label><input className={inp} placeholder="Riz + poulet grillé" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}/></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[{k:"calories",l:"Kcal",c:"text-[var(--t-text-40)]"},{k:"proteines",l:"Prot",c:"text-[#c9a84c]"},{k:"glucides",l:"Gluc",c:"text-[#7eb8a0]"},{k:"lipides",l:"Lip",c:"text-[#e07070]"}].map(({k,l,c}) => (
                        <div key={k}><label className={`text-[0.48rem] tracking-wider uppercase block mb-1 ${c}`}>{l}</label><input type="number" className={inp} value={itemForm[k as keyof typeof itemForm]} onChange={e => setItemForm(f => ({ ...f, [k]: e.target.value }))}/></div>
                      ))}
                    </div>
                    <button onClick={addItem} disabled={planSaving || !itemForm.name.trim()} className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-2.5 rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40">Ajouter →</button>
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
                            <div key={item.id} className="flex items-center justify-between border border-[var(--t-text-8)] bg-[var(--t-surface)] rounded-xl px-4 py-2.5 mb-1">
                              <div><p className="text-xs text-[var(--t-text-60)]">{item.name}</p><div className="flex gap-2 mt-0.5"><span className="text-[0.42rem] text-[var(--t-text-25)]">{item.calories} kcal</span><span className="text-[0.42rem] text-[#c9a84c]/55">P {item.proteines}g</span><span className="text-[0.42rem] text-[#7eb8a0]/55">G {item.glucides}g</span><span className="text-[0.42rem] text-[#e07070]/55">L {item.lipides}g</span></div></div>
                              <button onClick={async () => { await supabase.from("meal_plan_items").delete().eq("id", item.id); setMealItems(prev => prev.filter(x => x.id !== item.id)); }} aria-label="Supprimer cet aliment" className="text-[var(--t-text-15)] hover:text-[#e07070] transition-colors"><Icon icon={X} size={11} strokeWidth={2}/></button>
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
                  <p className="text-[var(--t-text-20)] text-xs text-center py-8">Aucun repas loggé par ce client</p>
                ) : journal.map(d => (
                  <div key={d.date} className="border border-[var(--t-text-8)] bg-[var(--t-surface)] rounded-xl">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--t-border-soft)]">
                      <p className="text-xs text-[var(--t-text-70)] capitalize">{new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                      <div className="flex items-center gap-3 text-[0.6rem]">
                        <span className="text-[var(--t-text-50)]">{Math.round(d.calories)} kcal</span>
                        <span className="text-[#c9a84c]/70">P {Math.round(d.proteines)}</span>
                        <span className="text-[#7eb8a0]/70">G {Math.round(d.glucides)}</span>
                        <span className="text-[#e07070]/70">L {Math.round(d.lipides)}</span>
                      </div>
                    </div>
                    {d.foods && d.foods.length > 0 ? (
                      <div className="px-4 py-2 flex flex-col gap-1.5">
                        {d.foods.map((f, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <p className="text-[0.7rem] text-[var(--t-text-55)]">{f.name}</p>
                            <p className="text-[0.6rem] text-[var(--t-text-30)] shrink-0 ml-3">{Math.round(f.calories)} kcal · P{Math.round(f.proteines)} G{Math.round(f.glucides)} L{Math.round(f.lipides)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-2 text-[0.6rem] text-[var(--t-text-20)]">Détail des aliments non disponible (totaux seulement)</p>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import { type ExerciceItem, serializeExercices, normalizeExercice } from "@/lib/exercices";
import { serializeNotesLibres } from "@/lib/notesLibres";
import ExerciceEditor from "@/components/ExerciceEditor";
import { SeanceBody } from "@/components/SeancePreview";
import { SeanceLoggedSummary } from "@/components/SeanceLoggedSummary";
import { Select } from "@/components/Select";
import { ProgressionSuggestions } from "@/components/ProgressionSuggestions";
import { type LibraryEntry, listLibrary } from "@/lib/exerciceLibrary";
import { type CatalogueEntry, loadCatalogue } from "@/lib/exercicesCatalogue";
import { type ProgrammeTemplate, listTemplates, saveTemplate, deleteTemplate, templateToExercices } from "@/lib/programmeTemplates";
import { getMyCoachId } from "@/lib/coach";
import { WeekPlanning } from "@/components/WeekPlanning";
import Link from "next/link";
import { type Mesocycle, loadActiveMesocycle, createMesocycle, deleteMesocycle } from "@/lib/mesocycles";
import { MesocycleCard } from "@/components/MesocycleCard";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronDown, ChevronUp, Trash2, X, Copy, FileText } from "@/lib/solarIcons";

const SEANCE_TYPES = ["Haut du corps","Bas du corps","Full body","Cardio","Boxe","Natation","CrossFit","Yoga","Autre"];

const STAGE_CFG: Record<string, { label: string; color: string }> = {
  prospect:   { label: "Prospect",   color: "#888" },
  onboarding: { label: "Onboarding", color: "#c9a84c" },
  actif:      { label: "Actif",      color: "#7eb8a0" },
  en_risque:  { label: "En risque",  color: "#e09070" },
  churne:     { label: "Churné",     color: "#e07070" },
  reactive:   { label: "Réactivé",   color: "#6ea8d9" },
};

type Client = { id: string; email: string; prenom: string; nom: string; age: number; poids: number; taille: number; sexe: string; niveau_activite: string; experience: string; seances_par_semaine: number; duree_seance: string; lieu_entrainement: string; blessures: string; objectifs: string; objectif_type: string | null; pipeline_stage: string | null; is_coach: boolean | null };
type SeanceDraft = { titre: string; type_seance: string; date_prevue: string; semaine: string; description: string; exercices: ExerciceItem[]; notesLibres: string[] };
type SentSeance = { id: string; titre: string; type_seance: string | null; date_prevue: string | null; semaine: number | null; description: string | null; exercices: string | null; notes_libres: string | null; completed_at: string | null; created_by_client?: boolean };

// Regroupe les séances envoyées par semaine (lundi de la date prévue, ou de la date de fin
// pour une séance libre sans date), la plus récente en haut, les séances sans date à la fin.
function groupByWeek(seances: SentSeance[]): { key: string; label: string; items: SentSeance[] }[] {
  const groups = new Map<string, SentSeance[]>();
  for (const s of seances) {
    const ref = s.date_prevue ? new Date(s.date_prevue + "T12:00:00") : s.completed_at ? new Date(s.completed_at) : null;
    let key = "sans-date";
    if (ref) {
      const monday = new Date(ref);
      monday.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
      key = monday.toLocaleDateString("sv-SE");
    }
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a === "sans-date" ? 1 : b === "sans-date" ? -1 : b.localeCompare(a))
    .map(([key, items]) => ({
      key,
      label: key === "sans-date" ? "Sans date"
        : `Semaine du ${new Date(key + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
      items: items.sort((a, b) => (a.date_prevue ?? "").localeCompare(b.date_prevue ?? "")),
    }));
}

const emptySeance = (): SeanceDraft => ({ titre: "", type_seance: "", date_prevue: "", semaine: "", description: "", exercices: [], notesLibres: [] });

export default function ProgrammesPage() {
  const searchParams   = useSearchParams();
  const preselectEmail = searchParams.get("client");
  const [clients,     setClients]     = useState<Client[]>([]);
  const [seanceCount, setSeanceCount] = useState<Map<string, number>>(new Map());
  const [filter,      setFilter]      = useState<"sans" | "avec">("sans");
  const [selected,    setSelected]    = useState<Client | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [drafts,      setDrafts]      = useState<SeanceDraft[]>([]);
  const [generating,  setGenerating]  = useState(false);
  const [genError,    setGenError]    = useState("");
  const [genDescription, setGenDescription] = useState("");
  const [sending,     setSending]     = useState(false);
  const [sentTo,      setSentTo]      = useState<string | null>(null);
  // Bibliothèque perso : plus de formulaire dans le parcours de création (doublon du catalogue),
  // mais les entrées existantes restent proposées dans la recherche d'exercices.
  const [library,      setLibrary]      = useState<LibraryEntry[]>([]);
  const [templates,    setTemplates]    = useState<ProgrammeTemplate[]>([]);
  const [templateDraft, setTemplateDraft] = useState<{ index: number; nom: string } | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [sentSeances,  setSentSeances]  = useState<SentSeance[]>([]);
  const [openSentId,   setOpenSentId]   = useState<string | null>(null);
  const [sentView,     setSentView]     = useState<"liste" | "semaine">("liste");
  const [activeMeso,   setActiveMeso]   = useState<Mesocycle | null>(null);
  const [showMesoForm, setShowMesoForm] = useState(false);
  const [mesoForm, setMesoForm] = useState({ nom: "", objectif: "", dateDebut: "", dateFin: "" });
  const [mesoSaving,   setMesoSaving]   = useState(false);
  const [myCoachId,    setMyCoachId]    = useState<string | null>(null);
  const [catalogue,    setCatalogue]    = useState<CatalogueEntry[]>([]);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  // Séances déjà envoyées à ce client — pour que le coach ait un aperçu visuel de
  // ce qui a été effectivement reçu, pas juste un message "envoyé ✓".
  const loadSentSeances = async (email: string) => {
    const { data } = await supabase.from("programme_seances").select("*")
      .eq("assigned_to_email", email).order("created_at", { ascending: false });
    setSentSeances((data ?? []) as SentSeance[]);
  };

  const deleteSeance = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette séance ?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("programme_seances").delete().eq("id", id);
    setDeletingId(null);
    if (error) { setGenError(error.message); return; }
    setSentSeances(prev => prev.filter(s => s.id !== id));
    if (openSentId === id) setOpenSentId(null);
    await load();
  };

  const loadLibrary = async () => { try { setLibrary(await listLibrary()); } catch { /* table pas encore créée */ } };
  const loadTemplates = async () => { try { setTemplates(await listTemplates()); } catch { /* table pas encore créée */ } };
  useEffect(() => {
    loadLibrary(); loadTemplates();
    loadCatalogue().then(setCatalogue).catch(() => {});
    supabase.auth.getUser().then(({ data }) => { if (data.user) getMyCoachId(data.user.id).then(setMyCoachId); });
  }, []);

  const applyTemplate = (t: ProgrammeTemplate) => {
    setDrafts(prev => [...prev, { ...emptySeance(), titre: t.nom, type_seance: t.type_seance || "", description: t.description || "", exercices: templateToExercices(t) }]);
    setShowTemplates(false);
  };
  const removeTemplate = async (id: string) => {
    try { await deleteTemplate(id); setTemplates(prev => prev.filter(t => t.id !== id)); } catch { /* ignore */ }
  };
  // Nommage du modèle dans une petite fenêtre de l'app (au lieu de window.prompt).
  const saveAsTemplate = async () => {
    if (!templateDraft || !templateDraft.nom.trim() || !myCoachId || templateSaving) return;
    const d = drafts[templateDraft.index];
    if (!d) return;
    setTemplateSaving(true);
    try {
      const t = await saveTemplate({ nom: templateDraft.nom.trim(), objectif: selected?.objectifs ?? "", type_seance: d.type_seance, description: d.description, exercices: d.exercices }, myCoachId);
      setTemplates(prev => [t, ...prev]);
      setTemplateDraft(null);
    } catch (e: unknown) { setGenError(e instanceof Error ? e.message : "Erreur modèle"); }
    setTemplateSaving(false);
  };
  const duplicateDraft = (i: number) => {
    const clone: SeanceDraft = { ...structuredClone(drafts[i]), date_prevue: "" };
    setDrafts(prev => [...prev.slice(0, i + 1), clone, ...prev.slice(i + 1)]);
  };

  const load = async () => {
    const [{ data: { user } }, { data: c, error: cErr }, { data: s }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("*").order("updated_at", { ascending: false }),
      supabase.from("programme_seances").select("assigned_to_email"),
    ]);
    if (cErr) setGenError(cErr.message);
    // Même filtre que Clients / Pipeline : le coach n'est pas son propre client.
    setClients(((c ?? []) as Client[]).filter(cl => !cl.is_coach && cl.id !== user?.id));
    const counts = new Map<string, number>();
    for (const row of s ?? []) counts.set(row.assigned_to_email, (counts.get(row.assigned_to_email) ?? 0) + 1);
    setSeanceCount(counts);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const sans = clients.filter(c => !(seanceCount.get(c.email) ?? 0));
  const avec = clients.filter(c => (seanceCount.get(c.email) ?? 0) > 0);
  const list = filter === "sans" ? sans : avec;

  const selectClient = (c: Client) => {
    setSelected(c); setDrafts([]); setGenError(""); setSentTo(null); setGenDescription(""); setOpenSentId(null);
    loadSentSeances(c.email);
    setActiveMeso(null); setShowMesoForm(false); setTemplateDraft(null);
    loadActiveMesocycle(c.id).then(setActiveMeso).catch(() => {});
  };

  const submitMeso = async () => {
    if (!selected || !myCoachId || !mesoForm.nom.trim() || !mesoForm.dateDebut || !mesoForm.dateFin || mesoSaving) return;
    setMesoSaving(true);
    const created = await createMesocycle({
      coachId: myCoachId, clientId: selected.id, nom: mesoForm.nom.trim(),
      objectif: mesoForm.objectif.trim(), dateDebut: mesoForm.dateDebut, dateFin: mesoForm.dateFin,
    });
    setMesoSaving(false);
    if (created) { setActiveMeso(created); setShowMesoForm(false); setMesoForm({ nom: "", objectif: "", dateDebut: "", dateFin: "" }); }
  };

  const removeMeso = async () => {
    if (!activeMeso || !window.confirm("Supprimer ce mésocycle ? Les séances déjà envoyées restent intactes.")) return;
    if (await deleteMesocycle(activeMeso.id)) setActiveMeso(null);
  };

  // Arrivée depuis la fiche client (CRM > Clients > Programme) avec ?client=email
  useEffect(() => {
    if (!preselectEmail || selected) return;
    const c = clients.find(cl => cl.email === preselectEmail);
    if (c) selectClient(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectEmail, clients]);

  const generate = async () => {
    if (!selected || generating) return;
    setGenerating(true); setGenError("");
    try {
      const res = await apiPost("/api/programme/generate", { profile: selected, description: genDescription });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur génération");
      type RawSeance = { titre: string; type_seance: string; description: string; exercices: Partial<ExerciceItem>[] };
      setDrafts((data.seances as RawSeance[]).map(s => ({ ...emptySeance(), ...s, exercices: s.exercices.map(normalizeExercice) })));
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "Erreur génération");
    }
    setGenerating(false);
  };

  const setDraft = (i: number, patch: Partial<SeanceDraft>) =>
    setDrafts(prev => prev.map((d, j) => j === i ? { ...d, ...patch } : d));

  // Notes libres d'une séance : des points en texte libre qui ne sont pas des exercices
  // (ex: "bien s'hydrater avant", "focus respiration"…). Chaque note est sa propre carte,
  // réordonnable comme les exercices (monter/descendre), et peut elle-même contenir
  // plusieurs lignes/puces.
  const addNoteLibre = (i: number) => setDraft(i, { notesLibres: [...drafts[i].notesLibres, ""] });
  const setNoteLibre = (i: number, ni: number, value: string) =>
    setDraft(i, { notesLibres: drafts[i].notesLibres.map((n, j) => j === ni ? value : n) });
  const removeNoteLibre = (i: number, ni: number) =>
    setDraft(i, { notesLibres: drafts[i].notesLibres.filter((_, j) => j !== ni) });
  const moveNoteLibre = (i: number, ni: number, dir: -1 | 1) => {
    const notes = drafts[i].notesLibres;
    const target = ni + dir;
    if (target < 0 || target >= notes.length) return;
    const next = [...notes];
    [next[ni], next[target]] = [next[target], next[ni]];
    setDraft(i, { notesLibres: next });
  };

  const sendAll = async () => {
    if (!selected || sending) return;
    const valid = drafts.filter(d => d.titre.trim());
    if (!valid.length) return;
    setSending(true);
    const { data: inserted, error } = await supabase.from("programme_seances").insert(valid.map(d => ({
      client_id: selected.id,
      assigned_to_email: selected.email,
      mesocycle_id: activeMeso?.id ?? null,
      titre: d.titre.trim(),
      type_seance: d.type_seance || null,
      date_prevue: d.date_prevue || null,
      semaine: d.semaine ? parseInt(d.semaine) || null : null,
      description: d.description || null,
      exercices: serializeExercices(d.exercices),
      notes_libres: serializeNotesLibres(d.notesLibres),
    }))).select();
    setSending(false);
    if (error) { setGenError(error.message); return; }
    setSentTo(selected.email); setDrafts([]); setGenDescription("");
    // Ouvre directement l'aperçu de ce qui vient d'être envoyé, au lieu de laisser
    // le coach avec un simple message "envoyé ✓" sans visuel dessus.
    if (inserted && inserted[0]) setOpenSentId(inserted[0].id as string);
    await load();
    await loadSentSeances(selected.email);
  };

  const inp = "w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const lbl = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="flex h-[calc(100dvh-50px-env(safe-area-inset-bottom))] md:h-screen overflow-hidden">

      {/* ── Left: list (plein écran sur mobile quand aucun client sélectionné) ── */}
      <div className={`flex-col border-r border-[var(--t-border-soft)] bg-[var(--t-bg)] ${selected ? "hidden md:flex w-80 shrink-0" : "flex flex-1"}`}>
        <div className="px-4 md:px-5 pt-5 md:pt-6 pb-4 border-b border-[var(--t-border-soft)]">
          <p className="text-[0.5rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-1">Plateforme coaching</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl md:text-4xl text-[var(--t-text)] tracking-wide mb-3">PROGRAMMES</h1>
          <div className="flex gap-2">
            <button onClick={() => setFilter("sans")}
              className={`flex-1 py-2 rounded-xl text-[0.5rem] tracking-[0.12em] uppercase border transition-all ${filter === "sans" ? "border-[#e09070] text-[#e09070] bg-[#e09070]/5" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[var(--t-text-20)]"}`}>
              Sans programme ({sans.length})
            </button>
            <button onClick={() => setFilter("avec")}
              className={`flex-1 py-2 rounded-xl text-[0.5rem] tracking-[0.12em] uppercase border transition-all ${filter === "avec" ? "border-[#7eb8a0] text-[#7eb8a0] bg-[#7eb8a0]/5" : "border-[var(--t-border)] text-[var(--t-text-30)] hover:border-[var(--t-text-20)]"}`}>
              Avec ({avec.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {genError && !selected && <p className="text-xs text-[#e07070] px-3 py-2">{genError}</p>}
          {list.length === 0 ? (
            <p className="text-[var(--t-text-20)] text-xs text-center py-8">
              {filter === "sans" ? "Tous les clients ont un programme ✓" : "Aucun client avec programme"}
            </p>
          ) : list.map(c => {
            const stage = STAGE_CFG[c.pipeline_stage ?? "actif"] ?? STAGE_CFG.actif;
            const isSel = selected?.id === c.id;
            const count = seanceCount.get(c.email) ?? 0;
            return (
              <button key={c.id} onClick={() => selectClient(c)}
                className={`w-full text-left px-4 py-3 mb-1 rounded-xl border transition-all ${isSel ? "border-[#c9a84c]/30 bg-[#c9a84c]/5" : "border-[var(--t-border-soft)] hover:border-[var(--t-border)] hover:bg-[var(--t-glass-bg)]"}`}>
                <div className="flex items-start justify-between mb-1 gap-2">
                  <p className={`text-sm font-medium ${isSel ? "text-[var(--t-text)]" : "text-[var(--t-text-70)]"}`}>{c.prenom} {c.nom}</p>
                  <span className="text-[0.42rem] tracking-wider uppercase px-1.5 py-0.5 rounded-full border shrink-0"
                    style={{ color: stage.color, borderColor: `${stage.color}35`, backgroundColor: `${stage.color}10` }}>
                    {stage.label}
                  </span>
                </div>
                <p className="text-[0.55rem] text-[var(--t-text-40)] line-clamp-2 leading-relaxed">🎯 {c.objectifs || "Objectif non renseigné"}</p>
                <p className="text-[0.45rem] text-[var(--t-text-20)] mt-1">
                  {c.experience || "—"} · {c.seances_par_semaine ? `${c.seances_par_semaine}×/sem` : "—"}
                  {count > 0 && <span className="text-[#7eb8a0]"> · {count} séance{count > 1 ? "s" : ""}</span>}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: detail ── */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-4 md:px-8 pt-5 md:pt-6 pb-4 border-b border-[var(--t-border-soft)] shrink-0">
            <div className="flex items-start gap-2">
              <button onClick={() => setSelected(null)} aria-label="Retour à la liste des clients" className="md:hidden text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors mt-1.5 shrink-0">
                <Icon icon={ChevronLeft} size={18}/>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[0.45rem] tracking-[0.2em] text-[var(--t-text-25)] uppercase truncate">{selected.email}</p>
                <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl md:text-4xl text-[var(--t-text)] tracking-wide">{selected.prenom} {selected.nom}</h2>
                <p className="text-[var(--t-text-30)] text-xs mt-0.5">{selected.age} ans · {selected.sexe} · {selected.poids} kg · {selected.experience || "expérience —"} · {selected.seances_par_semaine ? `${selected.seances_par_semaine}×/sem` : "—"}{selected.duree_seance ? ` · ${selected.duree_seance}` : ""}</p>
              </div>
              {/* Régularité, volume, poids… vivent sur la fiche client : cette page ne sert qu'à programmer. */}
              <Link href={`/crm/clients?client=${selected.id}`}
                className="shrink-0 mt-1 px-3 py-1.5 rounded-xl border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] hover:border-[var(--t-text-25)] transition-all text-[0.5rem] tracking-[0.15em] uppercase">
                Voir la fiche →
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6">
            <div className="max-w-2xl flex flex-col gap-4">

              {/* Contraintes à garder en tête en programmant — une ligne, pas une carte. */}
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[0.65rem] text-[var(--t-text-50)] leading-relaxed">
                <span><span className="text-[0.48rem] tracking-[0.15em] uppercase text-[#c9a84c] mr-1.5">Objectif</span>{selected.objectifs || "Non renseigné"}</span>
                {selected.blessures && <span className="text-[#e09070]">⚠ {selected.blessures}</span>}
                <span className="text-[var(--t-text-30)]">📍 {selected.lieu_entrainement || "Lieu —"}</span>
              </div>

              {/* ── Création d'abord : c'est la raison d'être de cette page ── */}
              {drafts.length === 0 && !showTemplates && (
                <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-xl p-4 md:p-5 flex flex-col gap-4">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Nouveau programme</p>

                  <div className="flex flex-col gap-2">
                    <textarea rows={2} className={`${inp} resize-none`}
                      placeholder={`Précisions pour l'IA (optionnel) — ex : reprise après blessure au genou, priorité haut du corps…`}
                      value={genDescription} onChange={e => setGenDescription(e.target.value)}/>
                    <button onClick={generate} disabled={generating}
                      className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.58rem] font-bold tracking-[0.18em] uppercase py-3 rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                      {generating ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Génération en cours…</> : `Générer ${Math.min(Math.max(selected.seances_par_semaine || 3, 2), 6)} séances avec l'IA →`}
                    </button>
                    <p className="text-[0.55rem] text-[var(--t-text-25)]">Basé sur l&apos;objectif, le niveau, le lieu et les blessures de {selected.prenom}. Tout reste modifiable avant l&apos;envoi.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowTemplates(true)} disabled={templates.length === 0}
                      title={templates.length === 0 ? "Enregistre une séance comme modèle (bouton « Modèle ») pour la réutiliser ici" : undefined}
                      className="border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text-50)] text-[0.55rem] tracking-[0.12em] uppercase py-2.5 rounded-xl hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors disabled:opacity-40 disabled:hover:border-[var(--t-border)] disabled:hover:text-[var(--t-text-50)]">
                      Partir d&apos;un modèle ({templates.length})
                    </button>
                    <button onClick={() => setDrafts([emptySeance()])}
                      className="border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text-50)] text-[0.55rem] tracking-[0.12em] uppercase py-2.5 rounded-xl hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
                      Créer manuellement
                    </button>
                  </div>
                </div>
              )}

              {drafts.length === 0 && showTemplates && (
                <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-xl p-4 md:p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a84c]">Modèles enregistrés</p>
                    <button onClick={() => setShowTemplates(false)} className="text-[0.5rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[var(--t-text-50)] transition-colors">Retour</button>
                  </div>
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-2 border border-[var(--t-text-8)] bg-[var(--t-surface)] rounded-xl px-3 py-2.5">
                      <button onClick={() => applyTemplate(t)} className="text-left min-w-0 flex-1">
                        <p className="text-xs text-[var(--t-text-70)] truncate">{t.nom}</p>
                        <p className="text-[0.55rem] text-[var(--t-text-25)] truncate">{t.objectif || t.type_seance || "—"}</p>
                      </button>
                      <button onClick={() => removeTemplate(t.id)} aria-label={`Supprimer le modèle ${t.nom}`} className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
                        <Icon icon={X} size={11} strokeWidth={2}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {genError && <p className="text-xs text-[#e07070] rounded-xl border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{genError}</p>}

              {/* Séances éditables */}
              {drafts.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[0.5rem] tracking-[0.2em] uppercase text-[var(--t-text-25)]">{drafts.length} séance{drafts.length > 1 ? "s" : ""} — modifiable{drafts.length > 1 ? "s" : ""}</p>
                    <button onClick={() => { setDrafts([]); setGenError(""); }} className="text-[0.5rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[#e07070] transition-colors">Tout effacer</button>
                  </div>

                  {drafts.map((d, i) => (
                    <div key={i} className="border border-[var(--t-text-8)] bg-[var(--t-surface)] rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[0.5rem] tracking-[0.2em] uppercase text-[#c9a84c]">Séance {i + 1}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setTemplateDraft({ index: i, nom: d.titre })} disabled={!d.titre.trim()} title="Enregistrer comme modèle"
                            className="text-[0.48rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[#c9a84c] transition-colors disabled:opacity-30">
                            Modèle
                          </button>
                          <button onClick={() => duplicateDraft(i)} title="Dupliquer cette séance" aria-label="Dupliquer cette séance" className="text-[var(--t-text-25)] hover:text-[#c9a84c] transition-colors">
                            <Icon icon={Copy} size={12} strokeWidth={2}/>
                          </button>
                          <button onClick={() => setDrafts(prev => prev.filter((_, j) => j !== i))} aria-label={`Supprimer la séance ${i + 1}`} className="text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
                            <Icon icon={X} size={12} strokeWidth={2}/>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label className={lbl}>Titre *</label><input className={inp} value={d.titre} onChange={e => setDraft(i, { titre: e.target.value })}/></div>
                        <div><label className={lbl}>Type</label>
                          <Select value={d.type_seance} onChange={v => setDraft(i, { type_seance: v })} placeholder="Choisir…"
                            options={SEANCE_TYPES.map(t => ({ value: t, label: t }))} triggerClassName={inp}/>
                        </div>
                      </div>
                      <div><label className={lbl}>Description</label><textarea className={`${inp} resize-none`} rows={2} value={d.description} onChange={e => setDraft(i, { description: e.target.value })}/></div>
                      <div>
                        <label className={lbl}>Exercices</label>
                        <ExerciceEditor items={d.exercices} onChange={items => setDraft(i, { exercices: items })} library={library} catalogue={catalogue}/>
                      </div>
                      <div>
                        <label className={lbl}>Notes libres (optionnel)</label>
                        <p className="text-[0.55rem] text-[var(--t-text-20)] mb-2 -mt-1">Pas forcément des exercices : consignes, rappels, précisions… Chaque note = un point affiché avec une puce, réordonnable comme les exercices.</p>
                        <div className="flex flex-col gap-2">
                          {d.notesLibres.map((n, ni) => (
                            <div key={ni} className="border border-[var(--t-text-8)] bg-[var(--t-bg)] rounded-xl p-2.5 flex items-start gap-2">
                              <div className="shrink-0 flex flex-col border border-[var(--t-border)] rounded-md overflow-hidden mt-0.5">
                                <button type="button" onClick={() => moveNoteLibre(i, ni, -1)} disabled={ni === 0} title="Monter" aria-label="Monter cette note"
                                  className="w-5 h-4 flex items-center justify-center text-[var(--t-text-30)] hover:text-[#c9a84c] hover:bg-[var(--t-track)] transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[var(--t-text-30)] border-b border-[var(--t-border)]">
                                  <Icon icon={ChevronUp} size={10} strokeWidth={2.5}/>
                                </button>
                                <button type="button" onClick={() => moveNoteLibre(i, ni, 1)} disabled={ni === d.notesLibres.length - 1} title="Descendre" aria-label="Descendre cette note"
                                  className="w-5 h-4 flex items-center justify-center text-[var(--t-text-30)] hover:text-[#c9a84c] hover:bg-[var(--t-track)] transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[var(--t-text-30)]">
                                  <Icon icon={ChevronDown} size={10} strokeWidth={2.5}/>
                                </button>
                              </div>
                              <textarea className={`${inp} resize-none`} rows={2} placeholder="Ex : arriver 10 min en avance pour l'échauffement…"
                                value={n} onChange={e => setNoteLibre(i, ni, e.target.value)}/>
                              <button type="button" onClick={() => removeNoteLibre(i, ni)} aria-label="Supprimer cette note" className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors mt-2">
                                <Icon icon={X} size={12} strokeWidth={2}/>
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addNoteLibre(i)}
                            className="border border-[var(--t-border)] text-[var(--t-text-30)] text-[0.55rem] tracking-[0.12em] uppercase py-2 rounded-xl hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">
                            + Ajouter une note libre
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={() => setDrafts(prev => [...prev, emptySeance()])}
                    className="border border-[var(--t-border)] text-[var(--t-text-30)] text-[0.55rem] tracking-[0.12em] uppercase py-2.5 rounded-xl hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">
                    + Ajouter une séance
                  </button>

                  <button onClick={sendAll} disabled={sending || !drafts.some(d => d.titre.trim())}
                    className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.6rem] font-bold tracking-[0.2em] uppercase py-3.5 rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_26px_-4px_rgba(201,168,76,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2">
                    {sending ? <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Envoi…</> : `Envoyer le programme à ${selected.prenom} →`}
                  </button>
                </>
              )}

              {/* Mésocycle — bloc d'entraînement nommé avec un objectif et des dates. Les
                  séances envoyées pendant qu'il est actif y sont automatiquement rattachées. */}
              {activeMeso ? (
                <MesocycleCard meso={activeMeso} onDelete={removeMeso}/>
              ) : showMesoForm ? (
                <div className="border border-[#c9a84c]/25 bg-[#c9a84c]/5 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c]">Nouveau mésocycle</p>
                  <input className={inp} placeholder="Nom (ex : Prise de masse — bloc 1)" value={mesoForm.nom}
                    onChange={e => setMesoForm(f => ({ ...f, nom: e.target.value }))}/>
                  <input className={inp} placeholder="Objectif (optionnel)" value={mesoForm.objectif}
                    onChange={e => setMesoForm(f => ({ ...f, objectif: e.target.value }))}/>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={lbl}>Début</label>
                      <input type="date" className={inp} value={mesoForm.dateDebut}
                        onChange={e => setMesoForm(f => ({ ...f, dateDebut: e.target.value }))}/>
                    </div>
                    <div>
                      <label className={lbl}>Fin</label>
                      <input type="date" className={inp} value={mesoForm.dateFin}
                        onChange={e => setMesoForm(f => ({ ...f, dateFin: e.target.value }))}/>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowMesoForm(false)}
                      className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] text-[0.6rem] tracking-wider uppercase py-2.5 rounded-xl hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
                      Annuler
                    </button>
                    <button onClick={submitMeso} disabled={mesoSaving || !mesoForm.nom.trim() || !mesoForm.dateDebut || !mesoForm.dateFin}
                      className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.6rem] font-bold tracking-wider uppercase py-2.5 rounded-xl disabled:opacity-40 transition-all">
                      {mesoSaving ? "…" : "Créer →"}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowMesoForm(true)}
                  className="border border-dashed border-[var(--t-border)] text-[var(--t-text-25)] text-[0.6rem] tracking-wider uppercase py-2.5 rounded-xl hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
                  + Démarrer un mésocycle
                </button>
              )}

              {/* Confirmation d'envoi */}
              {sentTo === selected.email && (
                <div className="border border-[#7eb8a0]/25 bg-[#7eb8a0]/5 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-[#7eb8a0]">Programme envoyé à {selected.prenom} ✓ — aperçu ci-dessous</p>
                </div>
              )}

              <ProgressionSuggestions clientId={selected.id} />

              {/* Séances déjà envoyées — aperçu visuel identique à ce que le client voit */}
              {sentSeances.length > 0 && (
                <div className="border border-[var(--t-text-8)] bg-[var(--t-bg)] rounded-xl">
                  <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
                    <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[var(--t-text-40)]">
                      Séances envoyées à {selected.prenom} ({sentSeances.length})
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setSentView("liste")}
                        className={`text-[0.55rem] tracking-wider uppercase px-2 py-1 rounded-lg transition-colors ${sentView === "liste" ? "bg-[#c9a84c]/15 text-[#c9a84c]" : "text-[var(--t-text-25)] hover:text-[var(--t-text-50)]"}`}>
                        Liste
                      </button>
                      <button onClick={() => setSentView("semaine")}
                        className={`text-[0.55rem] tracking-wider uppercase px-2 py-1 rounded-lg transition-colors ${sentView === "semaine" ? "bg-[#c9a84c]/15 text-[#c9a84c]" : "text-[var(--t-text-25)] hover:text-[var(--t-text-50)]"}`}>
                        Semaine
                      </button>
                    </div>
                  </div>

                  {sentView === "semaine" && (
                    <div className="px-4 pb-4 border-t border-[var(--t-border-soft)] pt-3">
                      <WeekPlanning seances={sentSeances} onOpen={id => { setSentView("liste"); setOpenSentId(id); }}/>
                    </div>
                  )}

                  {sentView === "liste" && groupByWeek(sentSeances).map(g => (
                    <div key={g.key}>
                      <div className="flex items-center justify-between px-4 pt-3 pb-1.5 border-t border-[var(--t-border-soft)] bg-[var(--t-surface-2)]/60">
                        <p className="text-[0.52rem] tracking-[0.18em] uppercase text-[var(--t-text-40)]">{g.label}</p>
                        <p className="text-[0.52rem] text-[var(--t-text-30)]">
                          <span className="text-[#7eb8a0]">{g.items.filter(s => s.completed_at).length}</span> / {g.items.length} faite{g.items.length > 1 ? "s" : ""}
                        </p>
                      </div>
                  {g.items.map(s => {
                    const open = openSentId === s.id;
                    return (
                      <div key={s.id} className="border-t border-[var(--t-border-soft)]">
                        <div className="w-full flex items-center gap-2">
                          <button onClick={() => setOpenSentId(open ? null : s.id)}
                            className="flex-1 min-w-0 text-left px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-[var(--t-glass-bg)] transition-colors">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {s.completed_at && <span className="text-[0.7rem] text-[#7eb8a0] shrink-0">✓</span>}
                                {s.created_by_client && <span className="text-[0.62rem] tracking-wider uppercase text-[#6ea8d9] rounded-full border border-[#6ea8d9]/25 px-1.5 py-0.5 shrink-0">Séance libre du client</span>}
                                {s.type_seance && <span className="text-[0.62rem] tracking-wider uppercase text-[#c9a84c] rounded-full border border-[#c9a84c]/20 px-1.5 py-0.5 shrink-0">{s.type_seance}</span>}
                                {s.semaine && <span className="text-[0.62rem] tracking-wider uppercase text-[var(--t-text-30)] rounded-full border border-[var(--t-border)] px-1.5 py-0.5 shrink-0">Sem. {s.semaine}</span>}
                                <p className="text-xs text-[var(--t-text-70)] truncate">{s.titre}</p>
                              </div>
                              {s.date_prevue && <p className="text-[0.65rem] text-[var(--t-text-25)] mt-0.5">{new Date(s.date_prevue + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>}
                            </div>
                            <Icon icon={ChevronDown} size={10}
                              className={`text-[var(--t-text-25)] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}/>
                          </button>
                          <button onClick={() => deleteSeance(s.id)} disabled={deletingId === s.id} title="Supprimer cette séance" aria-label="Supprimer cette séance"
                            className="shrink-0 mr-3 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors disabled:opacity-30">
                            <Icon icon={Trash2} size={13} strokeWidth={1.8}/>
                          </button>
                        </div>
                        {open && (
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            <SeanceBody s={s} />
                            <SeanceLoggedSummary seanceId={s.id} clientId={selected.id} exercicesRaw={s.exercices}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                    </div>
                  ))}
                </div>
              )}


            </div>
          </div>
        </div>
      ) : null}

      {/* Nommer un modèle — fenêtre de l'app plutôt que le prompt natif du navigateur. */}
      {templateDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setTemplateDraft(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] p-5 flex flex-col gap-3">
            <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Enregistrer comme modèle</p>
            <p className="text-[0.65rem] text-[var(--t-text-40)]">Tu pourras le réutiliser pour n&apos;importe quel client via « Partir d&apos;un modèle ».</p>
            <input autoFocus className={inp} placeholder="Nom du modèle" value={templateDraft.nom}
              onChange={e => setTemplateDraft(t => t && { ...t, nom: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") saveAsTemplate(); if (e.key === "Escape") setTemplateDraft(null); }}/>
            <div className="flex gap-2">
              <button onClick={() => setTemplateDraft(null)}
                className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] text-[0.6rem] tracking-wider uppercase py-2.5 rounded-xl hover:text-[var(--t-text-60)] transition-colors">
                Annuler
              </button>
              <button onClick={saveAsTemplate} disabled={!templateDraft.nom.trim() || templateSaving}
                className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.6rem] font-bold tracking-wider uppercase py-2.5 rounded-xl disabled:opacity-40 transition-all">
                {templateSaving ? "…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!selected && (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-3">
          <Icon icon={FileText} size={36} strokeWidth={1} className="text-[var(--t-border)]"/>
          <p className="text-[var(--t-text-15)] text-sm">Sélectionne un client pour lui créer un programme</p>
        </div>
      )}
    </div>
  );
}

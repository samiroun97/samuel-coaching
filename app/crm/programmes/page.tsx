"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiPost } from "@/lib/apiClient";
import { type ExerciceItem, serializeExercices, normalizeExercice } from "@/lib/exercices";
import { serializeNotesLibres } from "@/lib/notesLibres";
import { SeanceBody } from "@/components/SeancePreview";
import { SeanceLoggedSummary } from "@/components/SeanceLoggedSummary";
import { Select } from "@/components/Select";
import { SeanceForm, type SeanceDraft, emptySeance, draftFromSeance } from "@/components/SeanceForm";
import { ProgrammeCalendar, mesoWeekNum, addDays } from "@/components/ProgrammeCalendar";
import { type ProgrammeBiblio, listProgrammes, saveProgramme, deleteProgramme, seancesToProgramme, dateFor, mondayISO } from "@/lib/programmeBibliotheque";
import { ProgressionSuggestions } from "@/components/ProgressionSuggestions";
import { type LibraryEntry, listLibrary } from "@/lib/exerciceLibrary";
import { type CatalogueEntry, loadCatalogue } from "@/lib/exercicesCatalogue";
import { type ProgrammeTemplate, listTemplates, saveTemplate, deleteTemplate, templateToExercices } from "@/lib/programmeTemplates";
import { getMyCoachId } from "@/lib/coach";
import Link from "next/link";
import { hasBlessure } from "@/lib/blessures";
import { type Mesocycle, loadActiveMesocycle, createMesocycle, deleteMesocycle } from "@/lib/mesocycles";
import { MesocycleCard } from "@/components/MesocycleCard";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronDown, Trash2, X, Copy, FileText } from "@/lib/solarIcons";

const STAGE_CFG: Record<string, { label: string; color: string }> = {
  prospect:   { label: "Prospect",   color: "#888" },
  onboarding: { label: "Onboarding", color: "#c9a84c" },
  actif:      { label: "Actif",      color: "#7eb8a0" },
  en_risque:  { label: "En risque",  color: "#e09070" },
  churne:     { label: "Churné",     color: "#e07070" },
  reactive:   { label: "Réactivé",   color: "#6ea8d9" },
};

type Client = { id: string; email: string; prenom: string; nom: string; age: number; poids: number; taille: number; sexe: string; niveau_activite: string; experience: string; seances_par_semaine: number; duree_seance: string; lieu_entrainement: string; blessures: string; objectifs: string; objectif_type: string | null; pipeline_stage: string | null; is_coach: boolean | null };
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
  const [sentView,     setSentView]     = useState<"calendrier" | "liste">("calendrier");
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

  // Rattachement au mésocycle actif + numéro de semaine calculés depuis la date : une séance
  // datée hors du mésocycle n'y est pas rattachée, une séance sans date l'est (comportement historique).
  const planningFields = (date: string | null) => {
    const week = date ? mesoWeekNum(activeMeso, date) : null;
    return {
      date_prevue: date || null,
      semaine: week,
      mesocycle_id: activeMeso && (!date || week !== null) ? activeMeso.id : null,
    };
  };
  const rowFromDraft = (d: SeanceDraft) => ({
    titre: d.titre.trim(),
    type_seance: d.type_seance || null,
    description: d.description || null,
    exercices: serializeExercices(d.exercices),
    notes_libres: serializeNotesLibres(d.notesLibres),
    ...planningFields(d.date_prevue || null),
  });

  // ── Calendrier de planification ──
  // editing.id = null → nouvelle séance (clic sur un jour vide), sinon modification d'une séance envoyée.
  const [editing, setEditing] = useState<{ id: string | null; draft: SeanceDraft; readOnly: boolean } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [busyWeek, setBusyWeek] = useState<string | null>(null);
  const [calMsg, setCalMsg] = useState("");
  const flash = (m: string) => { setCalMsg(m); setTimeout(() => setCalMsg(""), 3500); };

  const openCreate = (date: string) => setEditing({ id: null, draft: emptySeance(date), readOnly: false });
  const openEdit = (id: string) => {
    const s = sentSeances.find(x => x.id === id);
    // Séance déjà faite ou créée par le client : consultation seulement (le log du client en dépend).
    if (s) setEditing({ id, draft: draftFromSeance(s), readOnly: !!s.completed_at || !!s.created_by_client });
  };

  const saveEdit = async () => {
    if (!selected || !editing || !editing.draft.titre.trim() || editSaving) return;
    setEditSaving(true);
    const row = rowFromDraft(editing.draft);
    const { error } = editing.id
      ? await supabase.from("programme_seances").update(row).eq("id", editing.id)
      : await supabase.from("programme_seances").insert({ ...row, client_id: selected.id, assigned_to_email: selected.email });
    setEditSaving(false);
    if (error) { setGenError(error.message); return; }
    flash(editing.id ? "Séance modifiée ✓" : `Séance ajoutée au programme de ${selected.prenom} ✓`);
    setEditing(null);
    await loadSentSeances(selected.email);
    if (!editing.id) await load();
  };

  const deleteFromEdit = async () => {
    if (!editing?.id) return;
    await deleteSeance(editing.id);
    setEditing(null);
  };

  // Glisser-déposer : mise à jour optimiste, retour en arrière si l'écriture échoue.
  const moveSeance = async (id: string, date: string) => {
    const prev = sentSeances.find(s => s.id === id);
    if (!prev || prev.date_prevue === date || prev.completed_at) return;
    const fields = planningFields(date);
    setSentSeances(list => list.map(s => s.id === id ? { ...s, date_prevue: date, semaine: fields.semaine } : s));
    const { error } = await supabase.from("programme_seances").update(fields).eq("id", id);
    if (error) {
      setSentSeances(list => list.map(s => s.id === id ? prev : s));
      setGenError(error.message);
    }
  };

  // Copie les séances (du coach) d'une semaine sur la semaine suivante, à J+7, non faites.
  const duplicateWeek = async (monday: string) => {
    if (!selected || busyWeek) return;
    const sunday = addDays(monday, 6);
    const source = sentSeances.filter(s => !s.created_by_client && s.date_prevue && s.date_prevue >= monday && s.date_prevue <= sunday);
    if (!source.length) return;
    setBusyWeek(monday);
    const { error } = await supabase.from("programme_seances").insert(source.map(s => ({
      client_id: selected.id,
      assigned_to_email: selected.email,
      titre: s.titre,
      type_seance: s.type_seance,
      description: s.description,
      exercices: s.exercices,
      notes_libres: s.notes_libres,
      ...planningFields(addDays(s.date_prevue!, 7)),
    })));
    setBusyWeek(null);
    if (error) { setGenError(error.message); return; }
    flash(`${source.length} séance${source.length > 1 ? "s" : ""} copiée${source.length > 1 ? "s" : ""} sur la semaine suivante ✓`);
    await loadSentSeances(selected.email);
  };

  // ── Programmes réutilisables (bibliothèque multi-semaines) ──
  const [programmes, setProgrammes] = useState<ProgrammeBiblio[]>([]);
  const [saveProg, setSaveProg] = useState<{ nom: string; objectif: string; start: string; weeks: number } | null>(null);
  const [assign, setAssign] = useState<{ programmeId: string | null; start: string; clientIds: string[] } | null>(null);
  const [progBusy, setProgBusy] = useState(false);
  useEffect(() => { listProgrammes().then(setProgrammes).catch(() => { /* table absente : fonction masquée */ }); }, []);

  const coachDated = sentSeances.filter(s => !s.created_by_client && s.date_prevue);

  const openSaveProgramme = () => {
    if (!selected || !coachDated.length) return;
    const dates = coachDated.map(s => s.date_prevue!).sort();
    const start = activeMeso ? mondayISO(activeMeso.date_debut) : mondayISO(dates[0]);
    const lastMonday = mondayISO(dates[dates.length - 1]);
    const weeks = Math.min(12, Math.max(1, Math.round((new Date(lastMonday + "T12:00:00").getTime() - new Date(start + "T12:00:00").getTime()) / (7 * 86400000)) + 1));
    setSaveProg({ nom: activeMeso?.nom ?? `Programme ${selected.prenom}`, objectif: selected.objectifs ?? "", start, weeks });
  };
  const saveProgPreview = saveProg ? seancesToProgramme(sentSeances, mondayISO(saveProg.start), saveProg.weeks) : [];

  const confirmSaveProgramme = async () => {
    if (!saveProg || !myCoachId || !saveProg.nom.trim() || !saveProgPreview.length || progBusy) return;
    setProgBusy(true);
    try {
      const p = await saveProgramme({ nom: saveProg.nom, objectif: saveProg.objectif, nb_semaines: saveProg.weeks, seances: saveProgPreview }, myCoachId);
      setProgrammes(prev => [p, ...prev]);
      setSaveProg(null);
      flash(`Programme « ${p.nom} » enregistré ✓ — réutilisable via « Appliquer un programme »`);
    } catch (e: unknown) { setGenError(e instanceof Error ? e.message : "Erreur programme"); }
    setProgBusy(false);
  };

  const openAssign = () => {
    if (!selected) return;
    // Départ par défaut : lundi prochain (ou aujourd'hui si on est lundi).
    const today = new Date().toLocaleDateString("sv-SE");
    const m = mondayISO(today);
    setAssign({ programmeId: programmes[0]?.id ?? null, start: m === today ? m : addDays(m, 7), clientIds: [selected.id] });
  };

  const confirmAssign = async () => {
    const p = programmes.find(x => x.id === assign?.programmeId);
    if (!assign || !p || !assign.clientIds.length || !selected || progBusy) return;
    setProgBusy(true);
    const start = mondayISO(assign.start);
    const targets = clients.filter(c => assign.clientIds.includes(c.id));
    const rows = targets.flatMap(c => p.seances.map(s => {
      const date = dateFor(start, s);
      // Mésocycle/semaine : on connaît le mésocycle actif du client ouvert ; pour les autres,
      // numéro de semaine du programme et pas de rattachement.
      const own = c.id === selected.id ? planningFields(date) : null;
      return {
        client_id: c.id, assigned_to_email: c.email,
        titre: s.titre, type_seance: s.type_seance, description: s.description,
        exercices: s.exercices, notes_libres: s.notes_libres,
        date_prevue: date,
        semaine: own?.semaine ?? s.semaine + 1,
        mesocycle_id: own?.mesocycle_id ?? null,
      };
    }));
    const { error } = await supabase.from("programme_seances").insert(rows);
    setProgBusy(false);
    if (error) { setGenError(error.message); return; }
    setAssign(null);
    setSentView("calendrier");
    flash(`« ${p.nom} » appliqué à ${targets.length} client${targets.length > 1 ? "s" : ""} (${rows.length} séances) ✓`);
    await load();
    await loadSentSeances(selected.email);
  };

  const removeProgramme = async (id: string) => {
    const p = programmes.find(x => x.id === id);
    if (!p || !window.confirm(`Supprimer le programme « ${p.nom} » de ta bibliothèque ? Les séances déjà envoyées restent intactes.`)) return;
    try {
      await deleteProgramme(id);
      setProgrammes(prev => prev.filter(x => x.id !== id));
      setAssign(a => a && a.programmeId === id ? { ...a, programmeId: null } : a);
    } catch (e: unknown) { setGenError(e instanceof Error ? e.message : "Erreur programme"); }
  };

  const sendAll = async () => {
    if (!selected || sending) return;
    const valid = drafts.filter(d => d.titre.trim());
    if (!valid.length) return;
    setSending(true);
    const { data: inserted, error } = await supabase.from("programme_seances").insert(valid.map(d => ({
      client_id: selected.id,
      assigned_to_email: selected.email,
      ...rowFromDraft(d),
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
                {hasBlessure(selected.blessures) && <span className="text-[#e09070]">⚠ {selected.blessures}</span>}
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button onClick={openAssign} disabled={programmes.length === 0}
                      title={programmes.length === 0 ? "Enregistre un planning comme programme (depuis le calendrier) pour le réappliquer ici" : undefined}
                      className="border border-[#c9a84c]/40 bg-[var(--t-surface)] text-[#c9a84c] text-[0.55rem] tracking-[0.12em] uppercase py-2.5 rounded-xl hover:bg-[#c9a84c]/10 transition-colors disabled:opacity-40 disabled:border-[var(--t-border)] disabled:text-[var(--t-text-50)] disabled:hover:bg-[var(--t-surface)]">
                      Appliquer un programme ({programmes.length})
                    </button>
                    <button onClick={() => setShowTemplates(true)} disabled={templates.length === 0}
                      title={templates.length === 0 ? "Enregistre une séance comme modèle (bouton « Modèle ») pour la réutiliser ici" : undefined}
                      className="border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text-50)] text-[0.55rem] tracking-[0.12em] uppercase py-2.5 rounded-xl hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors disabled:opacity-40 disabled:hover:border-[var(--t-border)] disabled:hover:text-[var(--t-text-50)]">
                      Modèle de séance ({templates.length})
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
                      <SeanceForm draft={d} onChange={patch => setDraft(i, patch)} library={library} catalogue={catalogue}/>
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

              {/* Planning du client : calendrier (créer / déplacer / dupliquer / modifier) ou liste détaillée */}
              <div className="border border-[var(--t-text-8)] bg-[var(--t-bg)] rounded-xl">
                  <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
                    <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[var(--t-text-40)]">
                      Planning de {selected.prenom} ({sentSeances.length} séance{sentSeances.length > 1 ? "s" : ""})
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {(["calendrier", "liste"] as const).map(v => (
                        <button key={v} onClick={() => setSentView(v)}
                          className={`text-[0.55rem] tracking-wider uppercase px-2 py-1 rounded-lg transition-colors ${sentView === v ? "bg-[#c9a84c]/15 text-[#c9a84c]" : "text-[var(--t-text-25)] hover:text-[var(--t-text-50)]"}`}>
                          {v === "calendrier" ? "Calendrier" : "Liste"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {coachDated.length > 0 && (
                    <div className="px-4 pb-2 -mt-1">
                      <button onClick={openSaveProgramme}
                        className="text-[0.52rem] tracking-[0.12em] uppercase text-[var(--t-text-35)] hover:text-[#c9a84c] transition-colors">
                        ⤓ Enregistrer ce planning comme programme réutilisable
                      </button>
                    </div>
                  )}

                  {calMsg && <p className="mx-4 mb-2 rounded-lg bg-[#7eb8a0]/10 text-[#7eb8a0] text-[0.65rem] px-3 py-1.5">{calMsg}</p>}

                  {sentView === "calendrier" && (
                    <div className="px-4 pb-4 border-t border-[var(--t-border-soft)] pt-3">
                      <ProgrammeCalendar seances={sentSeances} meso={activeMeso} weeklyTarget={selected.seances_par_semaine || 0}
                        onCreate={openCreate} onOpen={openEdit} onMove={moveSeance} onDuplicateWeek={duplicateWeek} busyWeek={busyWeek}/>
                    </div>
                  )}

                  {sentView === "liste" && sentSeances.length === 0 && (
                    <p className="px-4 pb-4 pt-3 border-t border-[var(--t-border-soft)] text-xs text-[var(--t-text-25)]">Aucune séance pour l&apos;instant.</p>
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

            </div>
          </div>
        </div>
      ) : null}

      {/* Enregistrer le planning du client comme programme multi-semaines réutilisable. */}
      {saveProg && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSaveProg(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] p-5 flex flex-col gap-3">
            <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Enregistrer comme programme</p>
            <p className="text-[0.65rem] text-[var(--t-text-40)] -mt-1">Les séances du planning de {selected.prenom} deviennent un gabarit (semaine, jour) que tu pourras appliquer à n&apos;importe quel client.</p>
            <input autoFocus className={inp} placeholder="Nom du programme (ex : Sèche débutant 4 semaines)" value={saveProg.nom}
              onChange={e => setSaveProg(p => p && { ...p, nom: e.target.value })}/>
            <input className={inp} placeholder="Objectif (optionnel)" value={saveProg.objectif}
              onChange={e => setSaveProg(p => p && { ...p, objectif: e.target.value })}/>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>À partir de la semaine du</label>
                <input type="date" className={inp} value={saveProg.start} onChange={e => e.target.value && setSaveProg(p => p && { ...p, start: mondayISO(e.target.value) })}/>
              </div>
              <div>
                <label className={lbl}>Durée</label>
                <Select value={String(saveProg.weeks)} onChange={v => setSaveProg(p => p && { ...p, weeks: Number(v) })}
                  options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} semaine${i ? "s" : ""}` }))} triggerClassName={inp}/>
              </div>
            </div>
            <div className="rounded-xl bg-[var(--t-surface-2)] px-3 py-2.5 max-h-40 overflow-y-auto">
              {saveProgPreview.length === 0 ? (
                <p className="text-[0.65rem] text-[#e09070]">Aucune séance datée dans cette période.</p>
              ) : (
                <>
                  <p className="text-[0.55rem] tracking-wider uppercase text-[var(--t-text-35)] mb-1.5">{saveProgPreview.length} séance{saveProgPreview.length > 1 ? "s" : ""} sur {saveProg.weeks} semaine{saveProg.weeks > 1 ? "s" : ""}</p>
                  {saveProgPreview.map((s, i) => (
                    <p key={i} className="text-[0.65rem] text-[var(--t-text-60)] truncate">
                      <span className="text-[var(--t-text-30)]">S{s.semaine + 1} · {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][s.jour]}</span> — {s.titre}
                    </p>
                  ))}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSaveProg(null)}
                className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] text-[0.6rem] tracking-wider uppercase py-2.5 rounded-xl hover:text-[var(--t-text-60)] transition-colors">
                Annuler
              </button>
              <button onClick={confirmSaveProgramme} disabled={!saveProg.nom.trim() || !saveProgPreview.length || progBusy}
                className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.6rem] font-bold tracking-wider uppercase py-2.5 rounded-xl disabled:opacity-40 transition-all">
                {progBusy ? "…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appliquer un programme de la bibliothèque à un ou plusieurs clients. */}
      {assign && selected && (() => {
        const p = programmes.find(x => x.id === assign.programmeId);
        const start = mondayISO(assign.start);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setAssign(null)}>
            <div onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] p-5 flex flex-col gap-4 max-h-[92dvh] overflow-y-auto">
              <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Appliquer un programme</p>

              <div>
                <label className={lbl}>Programme</label>
                <div className="flex flex-col gap-1.5">
                  {programmes.map(x => (
                    <div key={x.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${assign.programmeId === x.id ? "border-[#c9a84c]/50 bg-[#c9a84c]/8" : "border-[var(--t-border-soft)] hover:border-[var(--t-border)]"}`}>
                      <button onClick={() => setAssign(a => a && { ...a, programmeId: x.id })} className="flex-1 min-w-0 text-left">
                        <p className="text-xs text-[var(--t-text-75)] truncate">{x.nom}</p>
                        <p className="text-[0.55rem] text-[var(--t-text-30)] truncate">{x.nb_semaines} sem. · {x.seances.length} séances{x.objectif ? ` · ${x.objectif}` : ""}</p>
                      </button>
                      <button onClick={() => removeProgramme(x.id)} aria-label={`Supprimer le programme ${x.nom}`} className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
                        <Icon icon={Trash2} size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={lbl}>Début (lundi)</label>
                <input type="date" className={inp} value={start} onChange={e => e.target.value && setAssign(a => a && { ...a, start: mondayISO(e.target.value) })}/>
                {p && (
                  <p className="text-[0.58rem] text-[var(--t-text-30)] mt-1">
                    Du {new Date(start + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} au {new Date(addDays(start, p.nb_semaines * 7 - 1) + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {p.seances.length} séances par client
                  </p>
                )}
              </div>

              <div>
                <label className={lbl}>Clients ({assign.clientIds.length})</label>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {[selected, ...clients.filter(c => c.id !== selected.id)].map(c => {
                    const on = assign.clientIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[var(--t-glass-bg)] cursor-pointer">
                        <input type="checkbox" checked={on} className="accent-[#c9a84c]"
                          onChange={() => setAssign(a => a && { ...a, clientIds: on ? a.clientIds.filter(id => id !== c.id) : [...a.clientIds, c.id] })}/>
                        <span className="text-xs text-[var(--t-text-70)]">{c.prenom} {c.nom}</span>
                        {c.id === selected.id && <span className="text-[0.5rem] tracking-wider uppercase text-[#c9a84c]">client ouvert</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setAssign(null)}
                  className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] text-[0.6rem] tracking-wider uppercase py-2.5 rounded-xl hover:text-[var(--t-text-60)] transition-colors">
                  Annuler
                </button>
                <button onClick={confirmAssign} disabled={!p || !assign.clientIds.length || progBusy}
                  className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.6rem] font-bold tracking-wider uppercase py-2.5 rounded-xl disabled:opacity-40 transition-all">
                  {progBusy ? "…" : `Envoyer à ${assign.clientIds.length} client${assign.clientIds.length > 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Séance du calendrier : création sur un jour, modification d'une séance envoyée,
          ou consultation seule si déjà faite / créée par le client. */}
      {editing && selected && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/40 backdrop-blur-sm p-3 md:p-6 overflow-y-auto" onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl my-auto rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] flex flex-col max-h-[92dvh]">
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[var(--t-border-soft)]">
              <div>
                <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c]">
                  {editing.id ? (editing.readOnly ? "Séance" : "Modifier la séance") : "Nouvelle séance"}
                </p>
                <p className="text-[0.62rem] text-[var(--t-text-35)] mt-0.5">
                  {editing.draft.date_prevue
                    ? new Date(editing.draft.date_prevue + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
                    : "Sans date"}
                  {(() => { const w = editing.draft.date_prevue ? mesoWeekNum(activeMeso, editing.draft.date_prevue) : null; return w ? ` · ${activeMeso!.nom} S${w}` : ""; })()}
                </p>
              </div>
              <button onClick={() => setEditing(null)} aria-label="Fermer" className="text-[var(--t-text-25)] hover:text-[var(--t-text-60)] transition-colors">
                <Icon icon={X} size={16}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {editing.readOnly ? (() => {
                const s = sentSeances.find(x => x.id === editing.id);
                return s ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-[0.62rem] text-[var(--t-text-40)]">
                      {s.completed_at ? "Séance déjà faite par le client : elle n'est plus modifiable, voici ce qu'il a enregistré." : "Séance libre créée par le client."}
                    </p>
                    <SeanceBody s={s}/>
                    <SeanceLoggedSummary seanceId={s.id} clientId={selected.id} exercicesRaw={s.exercices}/>
                  </div>
                ) : null;
              })() : (
                <SeanceForm draft={editing.draft} onChange={patch => setEditing(e => e && { ...e, draft: { ...e.draft, ...patch } })}
                  library={library} catalogue={catalogue}/>
              )}
            </div>

            <div className="flex items-center gap-2 px-5 py-3 border-t border-[var(--t-border-soft)]">
              {editing.id && (
                <button onClick={deleteFromEdit} disabled={deletingId === editing.id}
                  className="flex items-center gap-1.5 text-[0.55rem] tracking-wider uppercase text-[#e07070]/70 hover:text-[#e07070] transition-colors disabled:opacity-40 mr-auto">
                  <Icon icon={Trash2} size={12}/> Supprimer
                </button>
              )}
              <button onClick={() => setEditing(null)}
                className={`${editing.id ? "" : "ml-auto"} px-4 py-2.5 border border-[var(--t-border)] text-[var(--t-text-40)] text-[0.58rem] tracking-wider uppercase rounded-xl hover:text-[var(--t-text-60)] transition-colors`}>
                {editing.readOnly ? "Fermer" : "Annuler"}
              </button>
              {!editing.readOnly && (
                <button onClick={saveEdit} disabled={!editing.draft.titre.trim() || editSaving}
                  className="px-5 py-2.5 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.58rem] font-bold tracking-wider uppercase rounded-xl disabled:opacity-40 transition-all">
                  {editSaving ? "…" : editing.id ? "Enregistrer" : `Envoyer à ${selected.prenom}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

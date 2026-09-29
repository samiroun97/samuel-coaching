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
import { ProgrammeWeekView } from "@/components/ProgrammeWeekView";
import { mesoWeekNum, addDays, mondayISOOf } from "@/lib/planning";
import { RichIcon } from "@/components/RichIcon";
import { type ProgressionRule, NO_PROGRESSION, applyProgression } from "@/lib/surchargeProgressive";
import { ProgressionTable } from "@/components/ProgressionTable";
import { type ProgrammeBiblio, listProgrammes, saveProgramme, deleteProgramme, seancesToProgramme, dateFor, mondayISO } from "@/lib/programmeBibliotheque";
import { ProgressionSuggestions } from "@/components/ProgressionSuggestions";
import { type LibraryEntry, listLibrary } from "@/lib/exerciceLibrary";
import { type CatalogueEntry, loadCatalogue } from "@/lib/exercicesCatalogue";
import { type ProgrammeTemplate, listTemplates, saveTemplate, deleteTemplate, templateToExercices } from "@/lib/programmeTemplates";
import { getMyCoachId } from "@/lib/coach";
import Link from "next/link";
import { hasBlessure } from "@/lib/blessures";
import { type Mesocycle, loadActiveMesocycle, createMesocycle, deleteMesocycle, mesocycleProgress } from "@/lib/mesocycles";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronDown, Trash2, X, Copy, Plus } from "@/lib/solarIcons";
import { Loader } from "@/components/Loader";

const STAGE_CFG: Record<string, { label: string; color: string }> = {
  prospect:   { label: "Prospect",   color: "#888" },
  onboarding: { label: "Onboarding", color: "#c9a84c" },
  actif:      { label: "Actif",      color: "#7eb8a0" },
  en_risque:  { label: "En risque",  color: "#e09070" },
  churne:     { label: "Churné",     color: "#e07070" },
  reactive:   { label: "Réactivé",   color: "#6ea8d9" },
};

type Client = { id: string; email: string; prenom: string; nom: string; age: number; poids: number; taille: number; sexe: string; niveau_activite: string; experience: string; seances_par_semaine: number; duree_seance: string; lieu_entrainement: string; blessures: string; objectifs: string; objectif_type: string | null; pipeline_stage: string | null; is_coach: boolean | null; avatar_url: string | null };
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
  const [nextByEmail, setNextByEmail] = useState<Map<string, string>>(new Map());
  // Panneau latéral "Nouveau programme" (IA, modèles, brouillons) : garde le calendrier visible.
  const [composer, setComposer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [sentView,     setSentView]     = useState<"calendrier" | "progression" | "liste">("calendrier");
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
      supabase.from("programme_seances").select("assigned_to_email,date_prevue,completed_at,created_by_client"),
    ]);
    // Prochaine séance à faire par client (pour la liste de gauche).
    const todayISO = new Date().toLocaleDateString("sv-SE");
    const next = new Map<string, string>();
    for (const r of (s ?? []) as { assigned_to_email: string; date_prevue: string | null; completed_at: string | null; created_by_client: boolean | null }[]) {
      if (r.completed_at || r.created_by_client || !r.date_prevue || r.date_prevue < todayISO) continue;
      const cur = next.get(r.assigned_to_email);
      if (!cur || r.date_prevue < cur) next.set(r.assigned_to_email, r.date_prevue);
    }
    setNextByEmail(next);
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
    setSelected(c); setDrafts([]); setComposer(false); setGenError(""); setSentTo(null); setGenDescription(""); setOpenSentId(null);
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

  // Copie les séances (du coach) d'une semaine sur la semaine suivante, à J+7, non faites,
  // avec en option une surcharge progressive (+kg, +%, +reps) appliquée aux exercices.
  const [dup, setDup] = useState<{ monday: string; rule: ProgressionRule } | null>(null);
  const duplicateWeek = async (monday: string, rule: ProgressionRule = NO_PROGRESSION) => {
    if (!selected || busyWeek) return;
    setDup(null);
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
      exercices: applyProgression(s.exercices, rule),
      notes_libres: s.notes_libres,
      ...planningFields(addDays(s.date_prevue!, 7)),
    })));
    setBusyWeek(null);
    if (error) { setGenError(error.message); return; }
    const prog = [rule.kg && `+${rule.kg} kg`, rule.pct && `+${rule.pct} %`, rule.reps && `+${rule.reps} rep`].filter(Boolean).join(", ");
    flash(`${source.length} séance${source.length > 1 ? "s" : ""} copiée${source.length > 1 ? "s" : ""} sur la semaine suivante${prog ? ` (${prog})` : ""} ✓`);
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
    setSentTo(selected.email); setDrafts([]); setGenDescription(""); setComposer(false); setSentView("calendrier");
    // Ouvre directement l'aperçu de ce qui vient d'être envoyé, au lieu de laisser
    // le coach avec un simple message "envoyé ✓" sans visuel dessus.
    if (inserted && inserted[0]) setOpenSentId(inserted[0].id as string);
    await load();
    await loadSentSeances(selected.email);
  };

  const inp = "w-full bg-[var(--t-surface)] shadow-[0_2px_12px_-8px_rgba(0,0,0,0.18)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
  const lbl = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader size={96}/></div>;

  const initials = (c: Pick<Client, "prenom" | "nom">) => `${c.prenom?.[0] ?? ""}${c.nom?.[0] ?? ""}`.toUpperCase() || "?";
  const Avatar = ({ c, size, color }: { c: Client; size: number; color: string }) => c.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.avatar_url} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size, boxShadow: `0 0 0 2px ${color}40` }}/>
  ) : (
    <div className="rounded-full flex items-center justify-center shrink-0 font-bold"
      style={{ width: size, height: size, fontSize: size * 0.34, color, background: `linear-gradient(145deg, ${color}35, ${color}12)`, boxShadow: `inset 0 0 0 1px ${color}30` }}>
      {initials(c)}
    </div>
  );
  const fmtDay = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const toolBtn = "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text-70)] text-[0.78rem] font-medium hover:border-[#c9a84c]/50 hover:text-[#c9a84c] transition-colors";
  const menuItem = "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[var(--t-glass-bg)] transition-colors";

  return (
    <div className="flex h-[calc(100dvh-50px-env(safe-area-inset-bottom))] md:h-screen overflow-hidden">

      {/* ── Liste clients : lisible, statut programme en un coup d'œil ── */}
      <div className={`flex-col border-r border-[var(--t-border-soft)] bg-[var(--t-bg)] ${selected ? "hidden md:flex w-[280px] shrink-0" : "flex flex-1 md:max-w-md"}`}>
        <div className="px-4 md:px-5 pt-5 md:pt-6 pb-4 border-b border-[var(--t-border-soft)]">
          <p className="text-[0.62rem] font-semibold tracking-[0.25em] text-[#c9a84c] uppercase mb-1">Plateforme coaching</p>
          <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-[var(--t-text)] tracking-wide mb-3 leading-none">PROGRAMMES</h1>
          <div className="flex p-1 rounded-xl bg-[var(--t-surface)] shadow-[0_2px_12px_-8px_rgba(0,0,0,0.18)] border border-[var(--t-border-soft)]">
            {([["sans", "À programmer", sans.length, "#e09070"], ["avec", "En cours", avec.length, "#7eb8a0"]] as const).map(([k, label, n, color]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`flex-1 py-2 rounded-lg text-[0.75rem] font-medium transition-all flex items-center justify-center gap-1.5 ${filter === k ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold shadow-[0_4px_12px_-6px_rgba(201,168,76,0.7)]" : "text-[var(--t-text-50)] hover:text-[var(--t-text-80)]"}`}>
                {label}
                <span className="min-w-5 h-5 px-1.5 rounded-full text-[0.65rem] font-bold flex items-center justify-center" style={{ color, backgroundColor: `${color}1f` }}>{n}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {genError && !selected && <p className="text-sm text-[#e07070] px-3 py-2">{genError}</p>}
          {list.length === 0 ? (
            <p className="text-[var(--t-text-40)] text-sm text-center py-10">
              {filter === "sans" ? "Tous les clients ont un programme ✓" : "Aucun client avec programme pour l'instant"}
            </p>
          ) : list.map(c => {
            const stage = STAGE_CFG[c.pipeline_stage ?? "actif"] ?? STAGE_CFG.actif;
            const isSel = selected?.id === c.id;
            const count = seanceCount.get(c.email) ?? 0;
            const next = nextByEmail.get(c.email);
            return (
              <button key={c.id} onClick={() => selectClient(c)}
                className={`w-full text-left px-3 py-2.5 mb-1 rounded-2xl flex items-center gap-3 transition-all ${isSel ? "bg-[var(--t-surface)] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.12)] ring-1 ring-[#c9a84c]/30" : "hover:bg-[var(--t-glass-bg)]"}`}>
                <Avatar c={c} size={38} color={stage.color}/>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.88rem] font-semibold text-[var(--t-text)] truncate">{c.prenom} {c.nom}</p>
                  <p className={`text-[0.72rem] truncate mt-0.5 ${count === 0 ? "text-[#e09070]" : next ? "text-[var(--t-text-50)]" : "text-[#c9a84c]"}`}>
                    {count === 0 ? "Aucun programme" : next ? <>Prochaine · <span className="capitalize">{fmtDay(next)}</span></> : "Rien de prévu — à planifier"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Espace de programmation du client ── */}
      {selected ? (() => {
        const stage = STAGE_CFG[selected.pipeline_stage ?? "actif"] ?? STAGE_CFG.actif;
        const prog = activeMeso ? mesocycleProgress(activeMeso) : null;
        // Résumé : assiduité sur 4 semaines, semaine en cours, prochaine séance.
        const today = new Date().toLocaleDateString("sv-SE");
        const monday = mondayISOOf(today);
        const since = addDays(today, -28);
        const coach = sentSeances.filter(s => !s.created_by_client && s.date_prevue);
        const past = coach.filter(s => s.date_prevue! >= since && s.date_prevue! < today);
        const assiduite = past.length ? Math.round((past.filter(s => s.completed_at).length / past.length) * 100) : null;
        const thisWeek = coach.filter(s => s.date_prevue! >= monday && s.date_prevue! <= addDays(monday, 6));
        const weekDone = thisWeek.filter(s => s.completed_at).length;
        const weekTarget = selected.seances_par_semaine || thisWeek.length;
        const nextS = coach.filter(s => !s.completed_at && s.date_prevue! >= today).sort((a, b) => a.date_prevue!.localeCompare(b.date_prevue!))[0];
        const empty = sentSeances.length === 0;
        const assColor = assiduite === null ? "var(--t-text-40)" : assiduite >= 80 ? "#7eb8a0" : assiduite >= 50 ? "#c9a84c" : "#e07070";

        const kpi = (icon: Parameters<typeof RichIcon>[0]["name"], label: string, value: React.ReactNode, sub: React.ReactNode, onClick?: () => void) => (
          <button onClick={onClick} disabled={!onClick}
            className="group/kpi text-left rounded-2xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] px-4 py-2 flex items-center gap-3 shadow-[0_2px_14px_-8px_rgba(0,0,0,0.15),0_0_22px_-6px_rgba(201,168,76,0.22)] enabled:hover:border-[#c9a84c]/40 enabled:hover:-translate-y-0.5 transition-all">
            {/* Hauteur fixée à 52px : l'icône de 66px déborde dans le padding de la carte
                plutôt que de l'agrandir. */}
            <div className="relative w-[66px] h-[52px] flex items-center justify-center shrink-0">
              <div className="absolute inset-2 rounded-full blur-lg bg-[#c9a84c] opacity-15"/>
              <RichIcon name={icon} size={66} className="relative drop-shadow-[0_6px_10px_rgba(0,0,0,0.14)]"/>
            </div>
            <div className="min-w-0">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--t-text-50)]">{label}</p>
              <div className="text-[1.05rem] font-bold text-[var(--t-text)] leading-tight mt-0.5 truncate">{value}</div>
              <div className="text-[0.7rem] text-[var(--t-text-50)] truncate">{sub}</div>
            </div>
          </button>
        );

        return (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl px-4 md:px-8 py-5 md:py-7 flex flex-col gap-6">

              {/* En-tête : identité + actions principales + menu */}
              <header className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <button onClick={() => setSelected(null)} aria-label="Retour à la liste des clients" className="md:hidden text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors mt-4 shrink-0">
                    <Icon icon={ChevronLeft} size={20}/>
                  </button>
                  <Avatar c={selected} size={60} color={stage.color}/>
                  <div className="min-w-0 flex-1">
                    <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-[2.6rem] text-[var(--t-text)] tracking-wide leading-none">{selected.prenom} {selected.nom}</h2>
                    <p className="text-[0.85rem] text-[var(--t-text-60)] mt-1.5 leading-relaxed">
                      <span className="text-[var(--t-text-80)] font-medium">{selected.objectifs || "Objectif non renseigné"}</span>
                    </p>
                    <p className="text-[0.75rem] text-[var(--t-text-50)] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {[selected.experience, selected.seances_par_semaine ? `${selected.seances_par_semaine} séances / sem.` : null, selected.duree_seance, selected.lieu_entrainement].filter(Boolean).map(t => <span key={t!}>{t}</span>)}
                      {hasBlessure(selected.blessures) && <span className="text-[#e09070] font-medium">⚠ {selected.blessures}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setComposer(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.78rem] font-bold shadow-[0_6px_20px_-8px_rgba(201,168,76,0.7)] hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-8px_rgba(201,168,76,0.8)] transition-all">
                    ✦ Générer avec l&apos;IA
                  </button>
                  <button onClick={() => openCreate(today)} className={toolBtn}>
                    Nouvelle séance
                  </button>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(o => !o)} className={toolBtn} aria-label="Plus d'actions">
                      Plus <Icon icon={ChevronDown} size={12} strokeWidth={2.2} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}/>
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)}/>
                        <div className="absolute left-0 top-full mt-2 z-40 w-80 rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] p-1.5">
                          <button className={menuItem} onClick={() => { setMenuOpen(false); if (programmes.length) openAssign(); else flash("Aucun programme enregistré : planifie des séances puis « Enregistrer comme programme »."); }}>
                            <RichIcon name="library" size={28}/>
                            <span><span className="block text-[0.82rem] font-semibold text-[var(--t-text)]">Appliquer un programme</span>
                              <span className="block text-[0.7rem] text-[var(--t-text-50)]">{programmes.length ? `${programmes.length} dans ta bibliothèque · 1 ou plusieurs clients` : "Aucun pour l'instant — enregistre un planning d'abord"}</span></span>
                          </button>
                          <button className={menuItem} onClick={() => { setMenuOpen(false); if (coachDated.length) openSaveProgramme(); else flash("Planifie d'abord des séances datées pour pouvoir les enregistrer comme programme."); }}>
                            <RichIcon name="download" size={28}/>
                            <span><span className="block text-[0.82rem] font-semibold text-[var(--t-text)]">Enregistrer comme programme</span>
                              <span className="block text-[0.7rem] text-[var(--t-text-50)]">Réutiliser ce planning pour d&apos;autres clients</span></span>
                          </button>
                          <button className={menuItem} onClick={() => { setMenuOpen(false); setShowTemplates(true); setComposer(true); }}>
                            <RichIcon name="notebookPen" size={28}/>
                            <span><span className="block text-[0.82rem] font-semibold text-[var(--t-text)]">Modèles de séance</span>
                              <span className="block text-[0.7rem] text-[var(--t-text-50)]">{templates.length ? `${templates.length} modèle${templates.length > 1 ? "s" : ""} enregistré${templates.length > 1 ? "s" : ""}` : "Aucun — bouton « Modèle » sur un brouillon"}</span></span>
                          </button>
                          <button className={menuItem} onClick={() => { setMenuOpen(false); if (activeMeso) removeMeso(); else setShowMesoForm(true); }}>
                            <RichIcon name="hourglass" size={28}/>
                            <span><span className="block text-[0.82rem] font-semibold text-[var(--t-text)]">{activeMeso ? "Supprimer le mésocycle" : "Démarrer un mésocycle"}</span>
                              <span className="block text-[0.7rem] text-[var(--t-text-50)]">{activeMeso ? activeMeso.nom : "Bloc nommé avec dates : semaines S1, S2…"}</span></span>
                          </button>
                          <div className="h-px bg-[var(--t-border-soft)] my-1"/>
                          <Link href={`/crm/clients?client=${selected.id}`} className={menuItem} onClick={() => setMenuOpen(false)}>
                            <span className="w-7 text-center text-lg leading-7">👤</span>
                            <span><span className="block text-[0.82rem] font-semibold text-[var(--t-text)]">Voir la fiche client</span>
                              <span className="block text-[0.7rem] text-[var(--t-text-50)]">Régularité, poids, nutrition, notes</span></span>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </header>

              {/* Messages */}
              {genError && <p className="text-sm text-[#e07070] rounded-xl border border-[#e07070]/25 bg-[#e07070]/5 px-4 py-2.5">{genError}</p>}
              {sentTo === selected.email && <p className="text-sm text-[#5f9a82] rounded-xl border border-[#7eb8a0]/30 bg-[#7eb8a0]/8 px-4 py-2.5">Programme envoyé à {selected.prenom} ✓</p>}
              {calMsg && <p className="text-sm text-[#5f9a82] rounded-xl border border-[#7eb8a0]/30 bg-[#7eb8a0]/8 px-4 py-2.5">{calMsg}</p>}
              {drafts.length > 0 && !composer && (
                <button onClick={() => setComposer(true)}
                  className="flex items-center justify-between rounded-xl border border-[#c9a84c]/40 bg-[#c9a84c]/[0.08] px-4 py-3 text-left hover:bg-[#c9a84c]/12 transition-colors">
                  <span className="text-sm text-[var(--t-text-80)]"><b>{drafts.length} séance{drafts.length > 1 ? "s" : ""}</b> en brouillon, pas encore envoyée{drafts.length > 1 ? "s" : ""}</span>
                  <span className="text-[0.78rem] font-semibold text-[#c9a84c]">Reprendre</span>
                </button>
              )}

              {/* Résumé */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {kpi("targetGoal", "Assiduité · 4 sem.",
                  <span style={{ color: assColor }}>{assiduite === null ? "—" : `${assiduite} %`}</span>,
                  assiduite === null ? "Pas encore de séance passée" : `${past.filter(s => s.completed_at).length} faite${past.filter(s => s.completed_at).length > 1 ? "s" : ""} sur ${past.length}`)}
                {kpi("checkin", "Cette semaine",
                  <>{weekDone}<span className="text-[var(--t-text-40)] font-medium"> / {weekTarget || 0}</span></>,
                  weekTarget ? (
                    <span className="flex gap-1 mt-1">{Array.from({ length: Math.min(weekTarget, 7) }, (_, i) => <span key={i} className="w-4 h-1.5 rounded-full" style={{ backgroundColor: i < weekDone ? "#7eb8a0" : "var(--t-track)" }}/>)}</span>
                  ) : "Aucune séance prévue")}
                {kpi("nextSession", "Prochaine séance",
                  nextS ? <span className="capitalize">{fmtDay(nextS.date_prevue!)}</span> : "—",
                  nextS ? nextS.titre : "Rien de planifié",
                  nextS ? () => openEdit(nextS.id) : () => openCreate(today))}
                {kpi("bloc", "Bloc en cours",
                  prog && activeMeso ? <>S{prog.weekNum}<span className="text-[var(--t-text-40)] font-medium"> / {prog.totalWeeks}</span></> : "Aucun",
                  prog && activeMeso ? (
                    <span className="flex items-center gap-1.5 mt-1"><span className="w-16 h-1.5 rounded-full bg-[var(--t-track)] overflow-hidden inline-block"><span className="block h-full rounded-full bg-[#c9a84c]" style={{ width: `${prog.pct}%` }}/></span><span className="truncate">{activeMeso.nom}</span></span>
                  ) : "Démarrer un mésocycle",
                  activeMeso ? undefined : () => setShowMesoForm(true))}
              </div>

              {/* Accueil quand le client n'a encore rien : les 3 façons de démarrer */}
              {empty && (
                <div className="rounded-3xl border border-[#c9a84c]/25 bg-gradient-to-br from-[var(--t-surface-gold)] to-[var(--t-surface)] p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5 shadow-[0_10px_40px_-20px_rgba(201,168,76,0.5)]">
                  <div className="flex items-center gap-4 md:w-72 shrink-0">
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <div className="absolute inset-2 rounded-full blur-lg bg-[#c9a84c] opacity-25"/>
                      <RichIcon name="clipboardCheck" size={64} className="relative animate-levitate drop-shadow-[0_8px_12px_rgba(0,0,0,0.15)]"/>
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl leading-none tracking-wide text-[var(--t-text)]">Premier programme</p>
                      <p className="text-[0.78rem] text-[var(--t-text-60)] mt-1">{selected.prenom} n&apos;a encore aucune séance. Choisis comment démarrer.</p>
                    </div>
                  </div>
                  <div className="flex-1 grid sm:grid-cols-3 gap-2.5">
                    <button onClick={() => setComposer(true)} className="rounded-2xl bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold p-3.5 text-left shadow-[0_6px_20px_-8px_rgba(201,168,76,0.7)] hover:-translate-y-0.5 transition-all">
                      <p className="text-[0.85rem] font-bold">✦ Générer avec l&apos;IA</p>
                      <p className="text-[0.7rem] opacity-70 mt-0.5">{Math.min(Math.max(selected.seances_par_semaine || 3, 2), 6)} séances adaptées au profil</p>
                    </button>
                    <button onClick={() => programmes.length ? openAssign() : flash("Aucun programme enregistré pour l'instant.")} className="rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] p-3.5 text-left hover:border-[#c9a84c]/50 hover:-translate-y-0.5 transition-all">
                      <p className="text-[0.85rem] font-semibold text-[var(--t-text)]">Appliquer un programme</p>
                      <p className="text-[0.7rem] text-[var(--t-text-50)] mt-0.5">{programmes.length ? `${programmes.length} dans ta bibliothèque` : "Aucun enregistré pour l'instant"}</p>
                    </button>
                    <button onClick={() => openCreate(today)} className="rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] p-3.5 text-left hover:border-[#c9a84c]/50 hover:-translate-y-0.5 transition-all">
                      <p className="text-[0.85rem] font-semibold text-[var(--t-text)]">Créer une séance</p>
                      <p className="text-[0.7rem] text-[var(--t-text-50)] mt-0.5">Ou clique sur un jour ci-dessous</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Planning : Semaine (principal) · Progression · Liste */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex p-1 rounded-xl bg-[var(--t-surface)] shadow-[0_2px_12px_-8px_rgba(0,0,0,0.18)] border border-[var(--t-border-soft)]">
                  {(["calendrier", "progression", "liste"] as const).map(v => (
                    <button key={v} onClick={() => setSentView(v)}
                      className={`px-4 py-1.5 rounded-lg text-[0.78rem] font-medium transition-all ${sentView === v ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold shadow-[0_4px_12px_-6px_rgba(201,168,76,0.7)]" : "text-[var(--t-text-50)] hover:text-[var(--t-text-80)]"}`}>
                      {v === "calendrier" ? "Semaine" : v === "progression" ? "Progression" : "Liste"}
                    </button>
                  ))}
                </div>
                <span className="text-[0.75rem] text-[var(--t-text-50)] hidden sm:block">{sentSeances.length} séance{sentSeances.length > 1 ? "s" : ""} au total · {sentSeances.filter(s => s.completed_at).length} faite{sentSeances.filter(s => s.completed_at).length > 1 ? "s" : ""}</span>
              </div>

              {sentView === "calendrier" && (
                <ProgrammeWeekView seances={sentSeances} meso={activeMeso} weeklyTarget={selected.seances_par_semaine || 0}
                  onCreate={openCreate} onOpen={openEdit} onMove={moveSeance} onDuplicateWeek={m => setDup({ monday: m, rule: NO_PROGRESSION })} busyWeek={busyWeek}/>
              )}

              {sentView === "progression" && (
                <div className="rounded-2xl border border-[var(--t-border-soft)] bg-[var(--t-surface)] p-4">
                  <ProgressionTable seances={sentSeances} meso={activeMeso} onOpen={openEdit}/>
                </div>
              )}

              {sentView === "liste" && (
                <div className="flex flex-col gap-4">
                  {sentSeances.length === 0 && <p className="text-sm text-[var(--t-text-50)]">Aucune séance pour l&apos;instant.</p>}
                  {groupByWeek(sentSeances).map(g => (
                    <div key={g.key}>
                      <div className="flex items-center justify-between px-1 pb-2">
                        <p className="text-[0.78rem] font-semibold text-[var(--t-text-80)]">{g.label}</p>
                        <p className="text-[0.72rem] text-[var(--t-text-50)]"><span className="text-[#7eb8a0] font-semibold">{g.items.filter(s => s.completed_at).length}</span> / {g.items.length} faite{g.items.length > 1 ? "s" : ""}</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--t-border-soft)] overflow-hidden bg-[var(--t-surface)]">
                        {g.items.map(s => {
                          const open = openSentId === s.id;
                          return (
                            <div key={s.id} className="border-t border-[var(--t-border-soft)] first:border-t-0">
                              <div className="w-full flex items-center gap-2">
                                <button onClick={() => setOpenSentId(open ? null : s.id)}
                                  className="flex-1 min-w-0 text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--t-glass-bg)] transition-colors">
                                  <div className="min-w-0 flex items-center gap-2.5">
                                    {s.completed_at ? <span className="text-sm text-[#7eb8a0] shrink-0">✓</span> : <span className="w-2 h-2 rounded-full bg-[var(--t-text-20)] shrink-0"/>}
                                    <p className="text-[0.85rem] font-medium text-[var(--t-text-80)] truncate">{s.titre}</p>
                                    {s.type_seance && <span className="text-[0.68rem] font-medium text-[#b8973f] rounded-full bg-[#c9a84c]/12 px-2 py-0.5 shrink-0">{s.type_seance}</span>}
                                    {s.created_by_client && <span className="text-[0.68rem] font-medium text-[#6ea8d9] rounded-full bg-[#6ea8d9]/12 px-2 py-0.5 shrink-0">Séance libre</span>}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {s.date_prevue && <span className="text-[0.75rem] text-[var(--t-text-50)] capitalize">{fmtDay(s.date_prevue)}</span>}
                                    <Icon icon={ChevronDown} size={12} className={`text-[var(--t-text-40)] transition-transform ${open ? "rotate-180" : ""}`}/>
                                  </div>
                                </button>
                                <button onClick={() => deleteSeance(s.id)} disabled={deletingId === s.id} title="Supprimer cette séance" aria-label="Supprimer cette séance"
                                  className="shrink-0 mr-3 text-[var(--t-text-25)] hover:text-[#e07070] transition-colors disabled:opacity-30">
                                  <Icon icon={Trash2} size={14} strokeWidth={1.8}/>
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
                    </div>
                  ))}
                </div>
              )}

              <ProgressionSuggestions clientId={selected.id} />
            </div>
          </div>
        </div>
        );
      })() : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-4 p-8">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-3 rounded-full blur-xl bg-[#c9a84c] opacity-20"/>
            <RichIcon name="clipboardCheck" size={88} className="relative animate-levitate drop-shadow-[0_10px_16px_rgba(0,0,0,0.15)]"/>
          </div>
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl tracking-wide text-[var(--t-text)]">Choisis un client</p>
          <p className="text-sm text-[var(--t-text-50)] text-center max-w-xs">
            {sans.length ? `${sans.length} client${sans.length > 1 ? "s" : ""} attend${sans.length > 1 ? "ent" : ""} encore un programme.` : "Tous tes clients ont un programme."}
          </p>
        </div>
      )}

      {/* ── Panneau latéral "Nouveau programme" : IA, modèles, brouillons — le calendrier reste visible ── */}
      {composer && selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-[2px]" onClick={() => setComposer(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl h-full bg-[var(--t-bg)] border-l border-[var(--t-border)] shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.35)] flex flex-col animate-[slideIn_.2s_ease-out]">
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-[var(--t-border-soft)]">
              <div>
                <p className="text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c]">Nouveau programme</p>
                <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none mt-0.5">{selected.prenom} {selected.nom}</p>
              </div>
              <button onClick={() => setComposer(false)} aria-label="Fermer" className="text-[var(--t-text-25)] hover:text-[var(--t-text-60)] transition-colors">
                <Icon icon={X} size={16}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {drafts.length === 0 && !showTemplates && (
                <>
                  <div className="rounded-2xl border border-[#c9a84c]/25 bg-[var(--t-surface)] shadow-[0_2px_12px_-8px_rgba(0,0,0,0.18)] p-4 flex flex-col gap-2.5">
                    <p className="text-[0.6rem] tracking-[0.18em] uppercase text-[#c9a84c]">✦ Générer avec l&apos;IA</p>
                    <textarea rows={3} autoFocus className={`${inp} resize-none`}
                      placeholder="Précisions (optionnel) — ex : reprise après blessure au genou, priorité haut du corps…"
                      value={genDescription} onChange={e => setGenDescription(e.target.value)}/>
                    <button data-loading={generating || undefined} onClick={generate} disabled={generating}
                      className="bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.58rem] font-bold tracking-[0.18em] uppercase py-2 rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {generating ? <>Génération en cours…</> : `Générer ${Math.min(Math.max(selected.seances_par_semaine || 3, 2), 6)} séances`}
                    </button>
{generating && <div className="flex justify-center pt-3"><Loader size={80}/></div>}
                    <p className="text-[0.55rem] text-[var(--t-text-30)]">Basé sur l&apos;objectif, le niveau, le lieu et les blessures de {selected.prenom}. Tout reste modifiable avant l&apos;envoi.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowTemplates(true)} disabled={templates.length === 0} className={`${toolBtn} justify-center py-2.5`}>Partir d&apos;un modèle · {templates.length}</button>
                    <button onClick={() => setDrafts([emptySeance()])} className={`${toolBtn} justify-center py-2.5`}>Créer manuellement</button>
                  </div>
                </>
              )}

              {drafts.length === 0 && showTemplates && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.6rem] tracking-[0.18em] uppercase text-[#c9a84c]">Modèles de séance</p>
                    <button onClick={() => setShowTemplates(false)} className="text-[0.5rem] tracking-wider uppercase text-[var(--t-text-30)] hover:text-[var(--t-text-60)] transition-colors">← Retour</button>
                  </div>
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-2 border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-xl px-3 py-2.5 hover:border-[#c9a84c]/40 transition-colors">
                      <button onClick={() => applyTemplate(t)} className="text-left min-w-0 flex-1">
                        <p className="text-xs text-[var(--t-text-75)] truncate">{t.nom}</p>
                        <p className="text-[0.55rem] text-[var(--t-text-30)] truncate">{t.objectif || t.type_seance || "—"}</p>
                      </button>
                      <button onClick={() => removeTemplate(t.id)} aria-label={`Supprimer le modèle ${t.nom}`} className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
                        <Icon icon={X} size={11} strokeWidth={2}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {drafts.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[0.55rem] tracking-[0.18em] uppercase text-[var(--t-text-35)]">{drafts.length} séance{drafts.length > 1 ? "s" : ""} en brouillon</p>
                    <button onClick={() => { setDrafts([]); setGenError(""); }} className="text-[0.5rem] tracking-wider uppercase text-[var(--t-text-30)] hover:text-[#e07070] transition-colors">Tout effacer</button>
                  </div>
                  {drafts.map((d, i) => (
                    <div key={i} className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[0.52rem] tracking-[0.2em] uppercase text-[#c9a84c]">Séance {i + 1}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setTemplateDraft({ index: i, nom: d.titre })} disabled={!d.titre.trim()} title="Enregistrer comme modèle"
                            className="text-[0.5rem] tracking-wider uppercase text-[var(--t-text-30)] hover:text-[#c9a84c] transition-colors disabled:opacity-30">
                            Modèle
                          </button>
                          <button onClick={() => duplicateDraft(i)} title="Dupliquer cette séance" aria-label="Dupliquer cette séance" className="text-[var(--t-text-30)] hover:text-[#c9a84c] transition-colors">
                            <Icon icon={Copy} size={12} strokeWidth={2}/>
                          </button>
                          <button onClick={() => setDrafts(prev => prev.filter((_, j) => j !== i))} aria-label={`Supprimer la séance ${i + 1}`} className="text-[var(--t-text-20)] hover:text-[#e07070] transition-colors">
                            <Icon icon={X} size={12} strokeWidth={2}/>
                          </button>
                        </div>
                      </div>
                      <SeanceForm draft={d} onChange={patch => setDraft(i, patch)} library={library} catalogue={catalogue}/>
                    </div>
                  ))}
                  <button onClick={() => setDrafts(prev => [...prev, emptySeance()])} className={`${toolBtn} justify-center py-2.5`}>
                    Ajouter une séance
                  </button>
                </>
              )}
              {genError && <p className="text-xs text-[#e07070] rounded-xl border border-[#e07070]/20 bg-[#e07070]/5 px-3 py-2">{genError}</p>}
            </div>

            {drafts.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--t-border-soft)] flex items-center gap-3">
                <p className="text-[0.55rem] text-[var(--t-text-30)] flex-1">Les séances sans date arrivent dans « Sans date » : glisse-les ensuite sur un jour.</p>
                {sending && <Loader size={48} className="-my-3"/>}
<button data-loading={sending || undefined} onClick={sendAll} disabled={sending || !drafts.some(d => d.titre.trim())}
                  className="px-5 py-2 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.58rem] font-bold tracking-[0.15em] uppercase rounded-xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] disabled:opacity-40 flex items-center gap-2 shrink-0">
                  {sending ? <>Envoi…</> : `Envoyer à ${selected.prenom}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nouveau mésocycle — petite fenêtre plutôt qu'une carte dans la page */}
      {showMesoForm && selected && !activeMeso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowMesoForm(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] p-5 flex flex-col gap-3">
            <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Nouveau mésocycle</p>
            <p className="text-[0.65rem] text-[var(--t-text-40)] -mt-1">Un bloc d&apos;entraînement nommé avec des dates : le calendrier se cale dessus (S1, S2…) et les séances y sont rattachées.</p>
            <input autoFocus className={inp} placeholder="Nom (ex : Prise de masse — bloc 1)" value={mesoForm.nom}
              onChange={e => setMesoForm(f => ({ ...f, nom: e.target.value }))}/>
            <input className={inp} placeholder="Objectif (optionnel)" value={mesoForm.objectif}
              onChange={e => setMesoForm(f => ({ ...f, objectif: e.target.value }))}/>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Début</label>
                <input type="date" className={inp} value={mesoForm.dateDebut} onChange={e => setMesoForm(f => ({ ...f, dateDebut: e.target.value }))}/>
              </div>
              <div>
                <label className={lbl}>Fin</label>
                <input type="date" className={inp} value={mesoForm.dateFin} onChange={e => setMesoForm(f => ({ ...f, dateFin: e.target.value }))}/>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowMesoForm(false)}
                className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] text-[0.6rem] tracking-wider uppercase py-2.5 rounded-xl hover:text-[var(--t-text-60)] transition-colors">
                Annuler
              </button>
              <button onClick={submitMeso} disabled={mesoSaving || !mesoForm.nom.trim() || !mesoForm.dateDebut || !mesoForm.dateFin}
                className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.6rem] font-bold tracking-wider uppercase py-2 rounded-xl disabled:opacity-40 transition-all">
                {mesoSaving ? "…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dupliquer une semaine sur la suivante, avec surcharge progressive optionnelle. */}
      {dup && selected && (() => {
        const sunday = addDays(dup.monday, 6);
        const n = sentSeances.filter(s => !s.created_by_client && s.date_prevue && s.date_prevue >= dup.monday && s.date_prevue <= sunday).length;
        const setRule = (patch: Partial<ProgressionRule>) => setDup(d => d && { ...d, rule: { ...d.rule, ...patch } });
        const chip = (active: boolean, label: string, onClick: () => void) => (
          <button key={label} onClick={onClick}
            className={`px-3 py-1.5 rounded-lg border text-[0.6rem] transition-colors ${active ? "border-[#c9a84c] bg-[#c9a84c]/12 text-[#c9a84c]" : "border-[var(--t-border)] text-[var(--t-text-50)] hover:border-[var(--t-text-25)]"}`}>
            {label}
          </button>
        );
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDup(null)}>
            <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] p-5 flex flex-col gap-4">
              <div>
                <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[#c9a84c]">Dupliquer la semaine</p>
                <p className="text-[0.65rem] text-[var(--t-text-40)] mt-1">
                  {n} séance{n > 1 ? "s" : ""} du {new Date(dup.monday + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} copiée{n > 1 ? "s" : ""} sur la semaine suivante.
                </p>
              </div>
              <div>
                <p className={lbl}>Charge</p>
                <div className="flex flex-wrap gap-1.5">
                  {chip(!dup.rule.kg && !dup.rule.pct, "Identique", () => setRule({ kg: 0, pct: 0 }))}
                  {[1, 2.5, 5].map(k => chip(dup.rule.kg === k, `+${String(k).replace(".", ",")} kg`, () => setRule({ kg: k, pct: 0 })))}
                  {[2.5, 5].map(p => chip(dup.rule.pct === p, `+${String(p).replace(".", ",")} %`, () => setRule({ pct: p, kg: 0 })))}
                </div>
              </div>
              <div>
                <p className={lbl}>Répétitions</p>
                <div className="flex flex-wrap gap-1.5">
                  {chip(!dup.rule.reps, "Identiques", () => setRule({ reps: 0 }))}
                  {[1, 2].map(r => chip(dup.rule.reps === r, `+${r} rep${r > 1 ? "s" : ""}`, () => setRule({ reps: r })))}
                </div>
              </div>
              <p className="text-[0.55rem] text-[var(--t-text-25)] -mt-1">Appliqué aux charges et reps chiffrées (ex. « 60 », « 8-10 ») ; le reste (« max », texte libre, exercices au temps) est copié tel quel. Tout reste modifiable ensuite.</p>
              <div className="flex gap-2">
                <button onClick={() => setDup(null)}
                  className="flex-1 border border-[var(--t-border)] text-[var(--t-text-40)] text-[0.6rem] tracking-wider uppercase py-2.5 rounded-xl hover:text-[var(--t-text-60)] transition-colors">
                  Annuler
                </button>
                <button onClick={() => duplicateWeek(dup.monday, dup.rule)} disabled={!n || !!busyWeek}
                  className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.6rem] font-bold tracking-wider uppercase py-2 rounded-xl disabled:opacity-40 transition-all">
                  Dupliquer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
            <div className="rounded-xl bg-[var(--t-surface)] shadow-[0_2px_12px_-8px_rgba(0,0,0,0.18)] px-3 py-2.5 max-h-40 overflow-y-auto">
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
                className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.6rem] font-bold tracking-wider uppercase py-2 rounded-xl disabled:opacity-40 transition-all">
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
                  className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.6rem] font-bold tracking-wider uppercase py-2 rounded-xl disabled:opacity-40 transition-all">
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px]" onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl h-full bg-[var(--t-surface)] border-l border-[var(--t-border)] shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.35)] flex flex-col animate-[slideIn_.2s_ease-out]">
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
                  className="px-5 py-2 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.58rem] font-bold tracking-wider uppercase rounded-xl disabled:opacity-40 transition-all">
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
                className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-on-gold text-[0.6rem] font-bold tracking-wider uppercase py-2 rounded-xl disabled:opacity-40 transition-all">
                {templateSaving ? "…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

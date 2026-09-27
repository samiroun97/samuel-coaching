"use client";
import { type ExerciceItem, parseExercices } from "@/lib/exercices";
import { parseNotesLibres } from "@/lib/notesLibres";
import { type LibraryEntry } from "@/lib/exerciceLibrary";
import { type CatalogueEntry } from "@/lib/exercicesCatalogue";
import ExerciceEditor from "@/components/ExerciceEditor";
import { Select } from "@/components/Select";
import { Icon } from "@/components/Icon";
import { ChevronDown, ChevronUp, X } from "@/lib/solarIcons";

// Formulaire d'une séance (titre, type, date, description, exercices, notes libres), partagé
// entre les brouillons de "Nouveau programme" et la modification d'une séance déjà envoyée
// depuis le calendrier de planification (/crm/programmes).
export const SEANCE_TYPES = ["Haut du corps", "Bas du corps", "Full body", "Cardio", "Boxe", "Natation", "CrossFit", "Yoga", "Autre"];

export type SeanceDraft = { titre: string; type_seance: string; date_prevue: string; semaine: string; description: string; exercices: ExerciceItem[]; notesLibres: string[] };

export const emptySeance = (date = ""): SeanceDraft => ({ titre: "", type_seance: "", date_prevue: date, semaine: "", description: "", exercices: [], notesLibres: [] });

export function draftFromSeance(s: { titre: string; type_seance: string | null; date_prevue: string | null; semaine: number | null; description: string | null; exercices: string | null; notes_libres: string | null }): SeanceDraft {
  return {
    titre: s.titre, type_seance: s.type_seance ?? "", date_prevue: s.date_prevue ?? "", semaine: s.semaine ? String(s.semaine) : "",
    description: s.description ?? "", exercices: parseExercices(s.exercices), notesLibres: parseNotesLibres(s.notes_libres),
  };
}

const inp = "w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const lbl = "text-[0.55rem] tracking-[0.2em] uppercase text-[#c9a84c] block mb-1.5";

export function SeanceForm({ draft, onChange, library, catalogue }: {
  draft: SeanceDraft;
  onChange: (patch: Partial<SeanceDraft>) => void;
  library: LibraryEntry[];
  catalogue: CatalogueEntry[];
}) {
  // Notes libres : des points en texte libre qui ne sont pas des exercices (ex : "bien
  // s'hydrater avant"), chacune sa carte, réordonnable comme les exercices.
  const notes = draft.notesLibres;
  const setNote = (ni: number, value: string) => onChange({ notesLibres: notes.map((n, j) => j === ni ? value : n) });
  const removeNote = (ni: number) => onChange({ notesLibres: notes.filter((_, j) => j !== ni) });
  const moveNote = (ni: number, dir: -1 | 1) => {
    const target = ni + dir;
    if (target < 0 || target >= notes.length) return;
    const next = [...notes];
    [next[ni], next[target]] = [next[target], next[ni]];
    onChange({ notesLibres: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px_150px] gap-3">
        <div><label className={lbl}>Titre *</label><input className={inp} value={draft.titre} onChange={e => onChange({ titre: e.target.value })}/></div>
        <div><label className={lbl}>Type</label>
          <Select value={draft.type_seance} onChange={v => onChange({ type_seance: v })} placeholder="Choisir…"
            options={SEANCE_TYPES.map(t => ({ value: t, label: t }))} triggerClassName={inp}/>
        </div>
        <div><label className={lbl}>Date prévue</label>
          <input type="date" className={inp} value={draft.date_prevue} onChange={e => onChange({ date_prevue: e.target.value })}/>
        </div>
      </div>
      <div><label className={lbl}>Description</label><textarea className={`${inp} resize-none`} rows={2} value={draft.description} onChange={e => onChange({ description: e.target.value })}/></div>
      <div>
        <label className={lbl}>Exercices</label>
        <ExerciceEditor items={draft.exercices} onChange={items => onChange({ exercices: items })} library={library} catalogue={catalogue}/>
      </div>
      <div>
        <label className={lbl}>Notes libres (optionnel)</label>
        <p className="text-[0.55rem] text-[var(--t-text-20)] mb-2 -mt-1">Consignes, rappels, précisions… Chaque note = un point affiché avec une puce.</p>
        <div className="flex flex-col gap-2">
          {notes.map((n, ni) => (
            <div key={ni} className="border border-[var(--t-text-8)] bg-[var(--t-bg)] rounded-xl p-2.5 flex items-start gap-2">
              <div className="shrink-0 flex flex-col border border-[var(--t-border)] rounded-md overflow-hidden mt-0.5">
                <button type="button" onClick={() => moveNote(ni, -1)} disabled={ni === 0} title="Monter" aria-label="Monter cette note"
                  className="w-5 h-4 flex items-center justify-center text-[var(--t-text-30)] hover:text-[#c9a84c] hover:bg-[var(--t-track)] transition-colors disabled:opacity-20 border-b border-[var(--t-border)]">
                  <Icon icon={ChevronUp} size={10} strokeWidth={2.5}/>
                </button>
                <button type="button" onClick={() => moveNote(ni, 1)} disabled={ni === notes.length - 1} title="Descendre" aria-label="Descendre cette note"
                  className="w-5 h-4 flex items-center justify-center text-[var(--t-text-30)] hover:text-[#c9a84c] hover:bg-[var(--t-track)] transition-colors disabled:opacity-20">
                  <Icon icon={ChevronDown} size={10} strokeWidth={2.5}/>
                </button>
              </div>
              <textarea className={`${inp} resize-none`} rows={2} placeholder="Ex : arriver 10 min en avance pour l'échauffement…"
                value={n} onChange={e => setNote(ni, e.target.value)}/>
              <button type="button" onClick={() => removeNote(ni)} aria-label="Supprimer cette note" className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors mt-2">
                <Icon icon={X} size={12} strokeWidth={2}/>
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ notesLibres: [...notes, ""] })}
            className="border border-[var(--t-border)] text-[var(--t-text-30)] text-[0.55rem] tracking-[0.12em] uppercase py-2 rounded-xl hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">
            + Ajouter une note libre
          </button>
        </div>
      </div>
    </div>
  );
}

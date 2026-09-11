"use client";
import { useEffect, useRef, useState } from "react";
import {
  type ExerciceItem, type SetDetail, emptyAdvancedExercice, emptySet, REST_PRESETS, REST_LABELS,
} from "@/lib/exercices";
import { type CatalogueEntry, findCatalogueEntry } from "@/lib/exercicesCatalogue";
import { uploadCustomExerciceImage } from "@/lib/customExerciceImage";
import { ExercicePicker } from "@/components/ExercicePicker";
import { SetInputCell } from "@/components/SetInputCell";
import { Icon } from "@/components/Icon";
import type { LucideIcon } from "@/lib/solarIcons";
import { Plus, X, MoreHorizontal, FileText, Camera, Dumbbell, ChevronUp, ChevronDown, Trash2 } from "@/lib/solarIcons";

// Refonte complète de la construction d'une séance côté client (ex "Créer ma séance"),
// après plusieurs échecs à faire fonctionner ça en patchant ExerciceEditor (conçu pour le
// CRM coach). Écrit directement mode:"avance" — la table de séries correspond 1:1 aux
// `sets`, targetSetsFor()/SeanceLive gèrent déjà ce mode, aucune migration nécessaire.
// Pas de supersets en v1 (groupId reste toujours null) : le mode simplifié de
// ExerciceEditor ne les gérait déjà que dans un cas étroit, et c'est le principal foyer
// de complexité qu'on retire en construisant un composant dédié plutôt que partagé.

// Remonte les séries précédentes pour trouver la dernière valeur saisie sur ce champ —
// sert de placeholder "fantôme" (jamais copié dans `sets`, donc rien à effacer si la
// nouvelle série diffère de la précédente).
function prevGhost(ex: ExerciceItem, ri: number, key: "poids" | "reps"): string {
  for (let k = ri; k >= 0; k--) if (ex.sets[k]?.[key]) return ex.sets[k][key];
  return key === "poids" ? "kg" : "reps";
}

const GRID = "grid grid-cols-[2.25rem_1fr_1fr_2.75rem] gap-2 items-center";

function MenuItem({ icon, danger, disabled, onClick, children }: {
  icon: LucideIcon; danger?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors disabled:opacity-30 disabled:pointer-events-none ${
        danger ? "text-[#e07070] hover:bg-[#e07070]/10" : "text-[var(--t-text-60)] hover:bg-[var(--t-glass-bg)]"}`}>
      <Icon icon={icon} size={14} strokeWidth={2}/>
      {children}
    </button>
  );
}

// Popover ancré (même recette que FilterDropdown dans ExerciceLibraryBrowser) plutôt
// qu'un bottom-sheet (aucune primitive de ce type dans le repo) ou un expand inline (qui
// décalerait la liste sous le pouce en cours d'interaction) — sort les actions secondaires
// de la zone de frappe, pour qu'un tap raté n'ait jamais de conséquence destructive.
function OverflowMenu({ ex, onToggleNote, onUploadPhoto, onToggleBodyweight, onMoveUp, onMoveDown, onDelete, onClose }: {
  ex: ExerciceItem; onToggleNote: () => void; onUploadPhoto: () => void; onToggleBodyweight: () => void;
  onMoveUp?: () => void; onMoveDown?: () => void; onDelete: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const run = (fn: () => void) => () => { fn(); onClose(); };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-20 min-w-[12rem] py-1 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)]">
      <MenuItem icon={FileText} onClick={run(onToggleNote)}>{ex.note ? "Modifier la note" : "Ajouter une note"}</MenuItem>
      <MenuItem icon={Camera} onClick={run(onUploadPhoto)}>Photo perso…</MenuItem>
      <MenuItem icon={Dumbbell} onClick={run(onToggleBodyweight)}>Poids du corps {ex.bodyweight ? "✓" : ""}</MenuItem>
      <div className="h-px bg-[var(--t-border-soft)] my-1"/>
      <MenuItem icon={ChevronUp} disabled={!onMoveUp} onClick={run(() => onMoveUp?.())}>Monter</MenuItem>
      <MenuItem icon={ChevronDown} disabled={!onMoveDown} onClick={run(() => onMoveDown?.())}>Descendre</MenuItem>
      <div className="h-px bg-[var(--t-border-soft)] my-1"/>
      <MenuItem icon={Trash2} danger onClick={run(onDelete)}>Supprimer l&apos;exercice</MenuItem>
    </div>
  );
}

export default function SeanceBuilder({ items, onChange, catalogue }: {
  items: ExerciceItem[]; onChange: (items: ExerciceItem[]) => void; catalogue: CatalogueEntry[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [noteFor, setNoteFor] = useState<Set<number>>(new Set());
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<{ index: number; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadIndex = useRef<number | null>(null);

  const update = (i: number, patch: Partial<ExerciceItem>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  };

  const addExercise = (nom: string) => {
    onChange([...items, emptyAdvancedExercice(nom)]);
    setPickerOpen(false);
  };

  const setRow = (i: number, ri: number, patch: Partial<SetDetail>) =>
    update(i, { sets: items[i].sets.map((s, j) => (j === ri ? { ...s, ...patch } : s)) });
  const addRow = (i: number) => update(i, { sets: [...items[i].sets, { ...emptySet(), repos: items[i].repos }] });
  const removeRow = (i: number, ri: number) => update(i, { sets: items[i].sets.filter((_, j) => j !== ri) });
  // Le repos est réglé une fois par exercice mais lu à deux endroits en aval
  // (targetSetsFor via sets[].repos, et le fallback target.repos || ex.repos de
  // SeanceLive) — on écrit donc les deux plutôt qu'un seul pour ne jamais désynchroniser.
  const setRest = (i: number, label: string) => update(i, { repos: label, sets: items[i].sets.map(s => ({ ...s, repos: label })) });

  const toggleBodyweight = (i: number) => update(i, { bodyweight: !items[i].bodyweight });
  const toggleNote = (i: number) => setNoteFor(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; });

  const triggerPhotoUpload = (i: number) => { pendingUploadIndex.current = i; fileInputRef.current?.click(); };
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const i = pendingUploadIndex.current;
    if (!file || i == null) return;
    setUploadError(null);
    setUploading(i);
    const result = await uploadCustomExerciceImage(file);
    setUploading(null);
    if ("error" in result) { setUploadError({ index: i, msg: result.error }); return; }
    update(i, { imageUrl: result.url });
  };

  return (
    <div className="flex flex-col gap-3">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange}/>

      {items.map((ex, i) => {
        const thumbUrl = (ex.nom.trim() && findCatalogueEntry(catalogue, ex.nom)?.image_url) || ex.imageUrl || null;
        return (
          <div key={i} className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-2xl p-4 flex flex-col gap-3.5 shadow-[0_2px_14px_-6px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-[var(--t-surface-2)] border border-[var(--t-border-soft)] flex items-center justify-center">
                {thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbUrl} alt="" className="w-full h-full object-cover"/>
                ) : (
                  <Icon icon={Dumbbell} size={18} strokeWidth={1.6} className="text-[var(--t-text-15)]"/>
                )}
                {uploading === i && (
                  <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                  </span>
                )}
              </div>
              <input value={ex.nom} onChange={e => update(i, { nom: e.target.value })}
                placeholder="Nom de l'exercice" style={{ fontFamily: "var(--font-bebas)" }}
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-xl tracking-wide text-[var(--t-text)] placeholder-[var(--t-text-20)]"/>
              {ex.bodyweight && (
                <span className="shrink-0 text-[0.55rem] tracking-[0.1em] uppercase text-[#c9a84c] border border-[#c9a84c]/40 bg-[#c9a84c]/10 rounded-full px-1.5 py-0.5">PDC</span>
              )}
              <div className="relative shrink-0">
                <button type="button" onClick={() => setMenuFor(v => (v === i ? null : i))}
                  className="w-9 h-9 -mr-1 flex items-center justify-center rounded-full text-[var(--t-text-30)] hover:text-[var(--t-text)] hover:bg-[var(--t-track)] transition-colors">
                  <Icon icon={MoreHorizontal} size={18} strokeWidth={2}/>
                </button>
                {menuFor === i && (
                  <OverflowMenu ex={ex}
                    onToggleNote={() => toggleNote(i)}
                    onUploadPhoto={() => triggerPhotoUpload(i)}
                    onToggleBodyweight={() => toggleBodyweight(i)}
                    onMoveUp={i > 0 ? () => move(i, -1) : undefined}
                    onMoveDown={i < items.length - 1 ? () => move(i, 1) : undefined}
                    onDelete={() => remove(i)}
                    onClose={() => setMenuFor(null)}/>
                )}
              </div>
            </div>

            {uploadError?.index === i && <p className="text-[0.65rem] text-[#e07070] -mt-2">{uploadError.msg}</p>}

            <div className="flex flex-col gap-2">
              <div className={`${GRID} px-0.5 text-[0.55rem] tracking-[0.14em] uppercase text-[var(--t-text-25)]`}>
                <span className="text-center">Série</span><span className="text-center">Kg</span>
                <span className="text-center">Reps</span><span/>
              </div>
              {ex.sets.map((s, ri) => (
                <div key={ri} className={GRID}>
                  <span className="text-center text-sm font-bold text-[var(--t-text-35)]" style={{ fontFamily: "var(--font-bebas)" }}>{ri + 1}</span>
                  <SetInputCell kind="kg" value={s.poids} placeholder={prevGhost(ex, ri - 1, "poids")} onChange={v => setRow(i, ri, { poids: v })} accent/>
                  <SetInputCell kind="reps" value={s.reps} placeholder={prevGhost(ex, ri - 1, "reps")} onChange={v => setRow(i, ri, { reps: v })}/>
                  <button type="button" onClick={() => removeRow(i, ri)} aria-label={`Supprimer la série ${ri + 1}`}
                    className="w-11 h-11 mx-auto flex items-center justify-center rounded-lg text-[var(--t-text-15)] hover:text-[#e07070] hover:bg-[#e07070]/10 transition-colors">
                    <Icon icon={X} size={13} strokeWidth={2}/>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addRow(i)}
                className="mt-0.5 border border-dashed border-[var(--t-border)] text-[var(--t-text-30)] text-[0.62rem] tracking-[0.1em] uppercase py-2.5 rounded-xl hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
                + Ajouter une série
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {REST_PRESETS.map(v => {
                const active = ex.repos === v;
                return (
                  <button key={v || "off"} type="button" onClick={() => setRest(i, v)}
                    className={`text-[0.62rem] tracking-[0.06em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
                      active ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-35)] hover:border-[#c9a84c]/40"}`}>
                    {REST_LABELS[v]}
                  </button>
                );
              })}
            </div>

            {noteFor.has(i) && (
              <textarea rows={2} value={ex.note} onChange={e => update(i, { note: e.target.value })}
                placeholder="Note (optionnel) : ressenti, variante…"
                className="w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-xs px-3 py-2.5 resize-none focus:outline-none focus:border-[#c9a84c]/40 transition-colors"/>
            )}
          </div>
        );
      })}

      <button type="button" onClick={() => setPickerOpen(true)}
        className="flex items-center justify-center gap-2 border border-dashed border-[var(--t-border-15)] text-[var(--t-text-30)] text-sm font-bold tracking-[0.06em] uppercase py-4 rounded-2xl hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
        <Icon icon={Plus} size={16} strokeWidth={2.5}/> Ajouter un exercice
      </button>

      {pickerOpen && <ExercicePicker catalogue={catalogue} onPick={addExercise} onClose={() => setPickerOpen(false)}/>}
    </div>
  );
}

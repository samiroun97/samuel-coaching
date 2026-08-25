"use client";
import { useState } from "react";
import { type ExerciceItem, type ExerciceMode, type SetDetail, type SimpleField, type ExerciceRun, EXERCICE_TYPES, emptyExercice, emptySet, groupExerciceRuns } from "@/lib/exercices";
import { type LibraryEntry } from "@/lib/exerciceLibrary";
import { type CatalogueEntry } from "@/lib/exercicesCatalogue";
import { ExerciceLibraryBrowser } from "@/components/ExerciceLibraryBrowser";
import { Select } from "@/components/Select";

const inp = "w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const inpSm = "w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] text-[var(--t-text)] placeholder-[var(--t-text-20)] text-xs px-2.5 py-2 text-center focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const inpXs = "w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] text-[var(--t-text)] placeholder-[var(--t-text-20)] text-[0.65rem] px-2 py-1.5 text-center focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const lblSm = "flex items-center justify-center gap-1 text-[0.42rem] tracking-[0.18em] uppercase text-[var(--t-text-30)] mb-1";

const IconSeries = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 2v4M7 2v4M3 10h18M5 22h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>;
const IconReps = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg>;
const IconPoids = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6.5 6.5h11a2 2 0 012 2v7a2 2 0 01-2 2h-11a2 2 0 01-2-2v-7a2 2 0 012-2zM2 9v6M22 9v6"/></svg>;
const IconRepos = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;
const IconUp = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
const IconLibrary = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
const IconDown = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;

const MODES: { key: ExerciceMode; label: string }[] = [
  { key: "simple", label: "Simple" },
  { key: "avance", label: "Avancé" },
  { key: "libre", label: "Texte libre" },
];

// Presets courants pour un groupe d'exercices enchaînés sans repos : biset (2 exercices),
// triset (3), circuit (4+), ou superset générique. Choisis dans une liste plutôt que tapés
// à la main pour rester cohérent d'une séance à l'autre.
const GROUP_LABELS = ["Superset", "Biset", "Triset", "Circuit"];

const SIMPLE_FIELDS: { key: SimpleField; label: string; icon: () => React.ReactNode; placeholder: string }[] = [
  { key: "series",      label: "Séries", icon: IconSeries, placeholder: "4" },
  { key: "repetitions", label: "Reps",   icon: IconReps,   placeholder: "12" },
  { key: "poids",       label: "Poids",  icon: IconPoids,  placeholder: "20 kg" },
  { key: "repos",       label: "Repos",  icon: IconRepos,  placeholder: "90 sec" },
];

const genId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);

const DATALIST_ID = "exercice-bibliotheque-list";

export default function ExerciceEditor({ items, onChange, library = [], catalogue = [] }: { items: ExerciceItem[]; onChange: (items: ExerciceItem[]) => void; library?: LibraryEntry[]; catalogue?: CatalogueEntry[] }) {
  const [showLibraryBrowser, setShowLibraryBrowser] = useState(false);
  const update = (i: number, patch: Partial<ExerciceItem>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, emptyExercice()]);
  const addFromCatalogue = (entry: CatalogueEntry) => {
    onChange([...items, { ...emptyExercice(), nom: entry.nom }]);
    setShowLibraryBrowser(false);
  };

  // Retire un champ (Séries/Reps/Poids/Repos) de cet exercice précis — ex: "Poids"
  // n'a pas de sens pour de la corde à sauter dans une séance de boxe. On vide aussi
  // sa valeur pour qu'il n'apparaisse pas non plus dans la vue lecture seule du client.
  const hideField = (i: number, field: SimpleField) =>
    update(i, { [field]: "", hiddenFields: [...items[i].hiddenFields, field] });
  const showField = (i: number, field: SimpleField) =>
    update(i, { hiddenFields: items[i].hiddenFields.filter(f => f !== field) });

  const applyFromLibrary = (i: number, nom: string) => {
    const found = library.find(l => l.nom.trim().toLowerCase() === nom.trim().toLowerCase());
    if (!found) return;
    const patch: Partial<ExerciceItem> = {};
    if (!items[i].type && found.type) patch.type = found.type;
    if (!items[i].note && found.note_default) patch.note = found.note_default;
    if (!items[i].videoUrl && found.video_url) patch.videoUrl = found.video_url;
    if (Object.keys(patch).length) update(i, patch);
  };

  const setMode = (i: number, mode: ExerciceMode) => {
    const it = items[i];
    let patch: Partial<ExerciceItem> = { mode };
    if (mode === "avance" && it.sets.length === 0 && (it.series || it.repetitions || it.poids || it.repos)) {
      const count = Math.min(Math.max(parseInt(it.series) || 1, 1), 12);
      const base: SetDetail = { reps: it.repetitions, poids: it.poids, repos: it.repos, rpe: "", tempo: "" };
      patch.sets = Array.from({ length: count }, () => ({ ...base }));
    }
    if (mode === "simple" && !it.series && !it.repetitions && it.sets.length > 0) {
      const first = it.sets[0];
      patch = { ...patch, series: it.sets.length.toString(), repetitions: first.reps, poids: it.poids || first.poids, repos: it.repos || first.repos };
    }
    update(i, patch);
  };

  const updateSet = (i: number, si: number, patch: Partial<SetDetail>) =>
    update(i, { sets: items[i].sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) });
  const addSet = (i: number) => update(i, { sets: [...items[i].sets, emptySet()] });
  const duplicateSet = (i: number, si: number) =>
    update(i, { sets: [...items[i].sets.slice(0, si + 1), { ...items[i].sets[si] }, ...items[i].sets.slice(si + 1)] });
  const removeSet = (i: number, si: number) => update(i, { sets: items[i].sets.filter((_, j) => j !== si) });

  const linkWithPrevious = (i: number) => {
    if (i === 0) return;
    const prev = items[i - 1];
    const gid = prev.groupId ?? genId();
    const label = prev.groupLabel || "Superset";
    let next = items;
    if (!prev.groupId) next = next.map((it, j) => (j === i - 1 ? { ...it, groupId: gid, groupLabel: label } : it));
    next = next.map((it, j) => (j === i ? { ...it, groupId: gid, groupLabel: label } : it));
    onChange(next);
  };

  const unlinkGroup = (groupId: string) =>
    onChange(items.map(it => (it.groupId === groupId ? { ...it, groupId: null, groupLabel: "" } : it)));

  const renameGroup = (groupId: string, label: string) =>
    onChange(items.map(it => (it.groupId === groupId ? { ...it, groupLabel: label } : it)));

  // Réordonnancement — pensé pour le tactile (boutons monter/descendre plutôt que
  // du drag & drop) : on déplace des "runs" entiers (un exercice seul, ou un groupe
  // en bloc) pour ne jamais casser la contiguïté d'un superset/biset/triset.
  const runs = groupExerciceRuns(items);
  const flattenRuns = (rs: ExerciceRun[]): ExerciceItem[] => rs.flatMap(r => r.indices.map(idx => items[idx]));

  const moveRun = (runPos: number, dir: -1 | 1) => {
    const target = runPos + dir;
    if (target < 0 || target >= runs.length) return;
    const next = [...runs];
    [next[runPos], next[target]] = [next[target], next[runPos]];
    onChange(flattenRuns(next));
  };

  // Réordonne un exercice à l'intérieur de son propre groupe (sans en sortir).
  const moveWithinGroup = (run: ExerciceRun, pos: number, dir: -1 | 1) => {
    const target = pos + dir;
    if (target < 0 || target >= run.indices.length) return;
    const newIndices = [...run.indices];
    [newIndices[pos], newIndices[target]] = [newIndices[target], newIndices[pos]];
    onChange(flattenRuns(runs.map(r => (r === run ? { ...r, indices: newIndices } : r))));
  };

  const renderExercice = (i: number, isGrouped: boolean, onMoveUp?: () => void, onMoveDown?: () => void) => {
    const ex = items[i];
    return (
      <div key={i} className="border border-[var(--t-text-8)] bg-[var(--t-bg)] rounded-xl p-3.5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="shrink-0 w-6 h-6 flex items-center justify-center text-[0.6rem] font-bold text-[#c9a84c] border border-[#c9a84c]/25 bg-[#c9a84c]/5 rounded-md">{i + 1}</span>
          <div className="shrink-0 flex flex-col border border-[var(--t-border)] rounded-md overflow-hidden">
            <button type="button" onClick={onMoveUp} disabled={!onMoveUp} title="Monter"
              className="w-5 h-4 flex items-center justify-center text-[var(--t-text-30)] hover:text-[#c9a84c] hover:bg-[var(--t-track)] transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[var(--t-text-30)] border-b border-[var(--t-border)]">
              <IconUp/>
            </button>
            <button type="button" onClick={onMoveDown} disabled={!onMoveDown} title="Descendre"
              className="w-5 h-4 flex items-center justify-center text-[var(--t-text-30)] hover:text-[#c9a84c] hover:bg-[var(--t-track)] transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[var(--t-text-30)]">
              <IconDown/>
            </button>
          </div>
          <input className={inp} list={DATALIST_ID} placeholder="Nom de l'exercice" value={ex.nom}
            onChange={e => update(i, { nom: e.target.value })} onBlur={e => applyFromLibrary(i, e.target.value)} />
          <button type="button" onClick={() => remove(i)} className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="pl-8 flex flex-wrap items-center gap-2">
          <Select value={ex.type} onChange={v => update(i, { type: v })} placeholder="Type d'exercice…"
            options={EXERCICE_TYPES.map(t => ({ value: t, label: t }))}
            triggerClassName={`${inpSm} w-auto text-left`}/>
          <div className="flex border border-[var(--t-border)] rounded-xl overflow-hidden">
            {MODES.map(m => (
              <button key={m.key} type="button" onClick={() => setMode(i, m.key)}
                className={`px-2.5 py-2 text-[0.55rem] tracking-[0.1em] uppercase transition-colors ${ex.mode === m.key ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-35)] hover:text-[var(--t-text-60)]"}`}>
                {m.label}
              </button>
            ))}
          </div>
          {i > 0 && !isGrouped && (
            <button type="button" onClick={() => linkWithPrevious(i)}
              className="text-[0.5rem] tracking-[0.1em] uppercase text-[var(--t-text-25)] rounded-xl border border-[var(--t-border)] px-2 py-2 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
              Lier au précédent
            </button>
          )}
        </div>

        {ex.mode === "simple" && (
          <div className="flex flex-wrap items-end gap-2 pl-8">
            {SIMPLE_FIELDS.filter(f => !ex.hiddenFields.includes(f.key)).map(f => (
              <div key={f.key} className="w-24">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="flex items-center gap-1 text-[0.42rem] tracking-[0.18em] uppercase text-[var(--t-text-30)] whitespace-nowrap">
                    <f.icon />{f.label}
                  </span>
                  <button type="button" onClick={() => hideField(i, f.key)} title={`Retirer le champ ${f.label}`}
                    className="text-[var(--t-text-25)] hover:text-[#e07070] transition-colors p-1.5 -m-1.5">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <input className={inpSm} placeholder={f.placeholder} value={ex[f.key]} onChange={e => update(i, { [f.key]: e.target.value })} />
              </div>
            ))}
            {SIMPLE_FIELDS.filter(f => ex.hiddenFields.includes(f.key)).map(f => (
              <button key={f.key} type="button" onClick={() => showField(i, f.key)}
                className="flex items-center gap-1 text-[0.5rem] tracking-[0.1em] uppercase text-[var(--t-text-25)] border border-dashed border-[var(--t-border-15)] rounded-xl px-2 py-1.5 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
                + {f.label}
              </button>
            ))}
          </div>
        )}

        {ex.mode === "avance" && (
          <div className="pl-8 flex flex-col gap-2">
            {ex.sets.length > 0 && (
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-1.5 text-[0.4rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] px-0.5">
                <span>Reps</span><span>Poids</span><span>Repos</span><span>RPE</span><span>Tempo</span><span></span>
              </div>
            )}
            {ex.sets.map((s, si) => (
              <div key={si} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-1.5 items-center">
                <input className={inpXs} placeholder="12" value={s.reps} onChange={e => updateSet(i, si, { reps: e.target.value })} />
                <input className={inpXs} placeholder="20 kg" value={s.poids} onChange={e => updateSet(i, si, { poids: e.target.value })} />
                <input className={inpXs} placeholder="90 sec" value={s.repos} onChange={e => updateSet(i, si, { repos: e.target.value })} />
                <input className={inpXs} placeholder="8" value={s.rpe} onChange={e => updateSet(i, si, { rpe: e.target.value })} />
                <input className={inpXs} placeholder="3-1-2-0" value={s.tempo} onChange={e => updateSet(i, si, { tempo: e.target.value })} />
                <div className="flex gap-1">
                  <button type="button" onClick={() => duplicateSet(i, si)} title="Dupliquer cette série" className="text-[var(--t-text-20)] hover:text-[#c9a84c] transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </button>
                  <button type="button" onClick={() => removeSet(i, si)} title="Supprimer cette série" className="text-[var(--t-text-20)] hover:text-[#e07070] transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addSet(i)}
              className="border border-[var(--t-border)] text-[var(--t-text-30)] text-[0.5rem] tracking-[0.12em] uppercase py-2 rounded-xl hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">
              + Ajouter une série
            </button>
          </div>
        )}

        {ex.mode === "libre" && (
          <div className="pl-8">
            <textarea className={`${inp} resize-none`} rows={4} placeholder="Décris librement cet exercice : consignes, variantes, protocole spécifique…"
              value={ex.texteLibre} onChange={e => update(i, { texteLibre: e.target.value })} />
          </div>
        )}

        <div className="pl-8 flex flex-col gap-2">
          <textarea className={`${inpSm} text-left resize-none`} rows={2} placeholder="Note libre sur cet exercice (optionnel) : consigne, précision, variante…"
            value={ex.note} onChange={e => update(i, { note: e.target.value })} />
          <input className={`${inpSm} text-left`} placeholder="Lien vidéo (optionnel)" value={ex.videoUrl} onChange={e => update(i, { videoUrl: e.target.value })} />
        </div>
      </div>
    );
  };

  const nodes: React.ReactNode[] = runs.map((run, runPos) =>
    run.groupId ? (
      <div key={`group-${run.indices[0]}`} className="border border-[#c9a84c]/25 bg-[#c9a84c]/[0.03] rounded-xl p-2.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1 gap-2">
          <Select value={run.groupLabel || "Superset"} onChange={v => renameGroup(run.groupId!, v)}
            options={GROUP_LABELS.map(l => ({ value: l, label: l }))}
            triggerClassName="bg-[#0c0a05] border border-[#c9a84c]/40 rounded-md text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[#c9a84c] pl-2.5 pr-2 py-1.5"/>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex border border-[var(--t-border)] rounded-md overflow-hidden">
              <button type="button" onClick={() => moveRun(runPos, -1)} disabled={runPos === 0} title="Monter le groupe"
                className="w-5 h-5 flex items-center justify-center text-[var(--t-text-30)] hover:text-[#c9a84c] hover:bg-[var(--t-track)] transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[var(--t-text-30)] border-r border-[var(--t-border)]">
                <IconUp/>
              </button>
              <button type="button" onClick={() => moveRun(runPos, 1)} disabled={runPos === runs.length - 1} title="Descendre le groupe"
                className="w-5 h-5 flex items-center justify-center text-[var(--t-text-30)] hover:text-[#c9a84c] hover:bg-[var(--t-track)] transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[var(--t-text-30)]">
                <IconDown/>
              </button>
            </div>
            <button type="button" onClick={() => unlinkGroup(run.groupId!)} className="text-[0.48rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[#e07070] transition-colors">
              Délier
            </button>
          </div>
        </div>
        {run.indices.map((k, pos) => renderExercice(k, true,
          pos > 0 ? () => moveWithinGroup(run, pos, -1) : undefined,
          pos < run.indices.length - 1 ? () => moveWithinGroup(run, pos, 1) : undefined,
        ))}
      </div>
    ) : (
      renderExercice(run.indices[0], false,
        runPos > 0 ? () => moveRun(runPos, -1) : undefined,
        runPos < runs.length - 1 ? () => moveRun(runPos, 1) : undefined,
      )
    )
  );

  return (
    <div className="flex flex-col gap-2.5">
      <datalist id={DATALIST_ID}>
        {library.map(l => <option key={`lib-${l.id}`} value={l.nom} />)}
        {catalogue.map(c => <option key={`cat-${c.id}`} value={c.nom} />)}
      </datalist>
      {nodes}
      <div className="flex flex-col gap-2">
        {catalogue.length > 0 && (
          <button type="button" onClick={() => setShowLibraryBrowser(true)}
            className="group flex items-center gap-3 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black px-4 py-3.5 rounded-2xl shadow-[0_4px_20px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_8px_30px_-4px_rgba(201,168,76,0.85)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center">
              <IconLibrary/>
            </span>
            <span className="flex-1 text-left">
              <span className="block text-[0.68rem] font-bold tracking-[0.1em] uppercase leading-tight">Choisir dans la bibliothèque</span>
              <span className="block text-[0.58rem] font-medium opacity-70 tracking-wide leading-tight mt-0.5">{catalogue.length} exercices classés par muscle</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        )}
        <button type="button" onClick={add} className="border border-[var(--t-border)] text-[var(--t-text-25)] text-[0.5rem] tracking-[0.1em] uppercase py-2 rounded-xl hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">
          + Ajouter un exercice vide
        </button>
      </div>
      {showLibraryBrowser && (
        <ExerciceLibraryBrowser catalogue={catalogue} onPick={addFromCatalogue} onClose={() => setShowLibraryBrowser(false)}/>
      )}
    </div>
  );
}

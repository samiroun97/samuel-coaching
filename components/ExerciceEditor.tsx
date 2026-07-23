"use client";
import { type ExerciceItem, type ExerciceMode, type SetDetail, type SimpleField, EXERCICE_TYPES, emptyExercice, emptySet, groupExerciceRuns } from "@/lib/exercices";
import { type LibraryEntry } from "@/lib/exerciceLibrary";

const inp = "w-full bg-[#060606] border border-white/10 rounded-lg text-white placeholder-white/20 text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const inpSm = "w-full bg-[#060606] border border-white/10 text-white placeholder-white/20 text-xs px-2.5 py-2 text-center focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const inpXs = "w-full bg-[#060606] border border-white/10 text-white placeholder-white/20 text-[0.65rem] px-2 py-1.5 text-center focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const lblSm = "flex items-center justify-center gap-1 text-[0.42rem] tracking-[0.18em] uppercase text-white/30 mb-1";

const IconSeries = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 2v4M7 2v4M3 10h18M5 22h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>;
const IconReps = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg>;
const IconPoids = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6.5 6.5h11a2 2 0 012 2v7a2 2 0 01-2 2h-11a2 2 0 01-2-2v-7a2 2 0 012-2zM2 9v6M22 9v6"/></svg>;
const IconRepos = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;

const MODES: { key: ExerciceMode; label: string }[] = [
  { key: "simple", label: "Simple" },
  { key: "avance", label: "Avancé" },
  { key: "libre", label: "Texte libre" },
];

const SIMPLE_FIELDS: { key: SimpleField; label: string; icon: () => React.ReactNode; placeholder: string }[] = [
  { key: "series",      label: "Séries", icon: IconSeries, placeholder: "4" },
  { key: "repetitions", label: "Reps",   icon: IconReps,   placeholder: "12" },
  { key: "poids",       label: "Poids",  icon: IconPoids,  placeholder: "20 kg" },
  { key: "repos",       label: "Repos",  icon: IconRepos,  placeholder: "90 sec" },
];

const genId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);

const DATALIST_ID = "exercice-bibliotheque-list";

export default function ExerciceEditor({ items, onChange, library = [] }: { items: ExerciceItem[]; onChange: (items: ExerciceItem[]) => void; library?: LibraryEntry[] }) {
  const update = (i: number, patch: Partial<ExerciceItem>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, emptyExercice()]);

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

  const renderExercice = (i: number, isGrouped: boolean) => {
    const ex = items[i];
    return (
      <div key={i} className="border border-white/8 bg-[#0a0a0a] rounded-lg p-3.5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="shrink-0 w-6 h-6 flex items-center justify-center text-[0.6rem] font-bold text-[#c9a84c] border border-[#c9a84c]/25 bg-[#c9a84c]/5 rounded-md">{i + 1}</span>
          <input className={inp} list={DATALIST_ID} placeholder="Nom de l'exercice" value={ex.nom}
            onChange={e => update(i, { nom: e.target.value })} onBlur={e => applyFromLibrary(i, e.target.value)} />
          <button type="button" onClick={() => remove(i)} className="shrink-0 text-white/15 hover:text-[#e07070] transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="pl-8 flex flex-wrap items-center gap-2">
          <select className={`${inpSm} w-auto cursor-pointer text-left`} value={ex.type} onChange={e => update(i, { type: e.target.value })}>
            <option value="">Type d&apos;exercice…</option>
            {EXERCICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            {MODES.map(m => (
              <button key={m.key} type="button" onClick={() => setMode(i, m.key)}
                className={`px-2.5 py-2 text-[0.55rem] tracking-[0.1em] uppercase transition-colors ${ex.mode === m.key ? "bg-[#c9a84c] text-black" : "text-white/35 hover:text-white/60"}`}>
                {m.label}
              </button>
            ))}
          </div>
          {i > 0 && !isGrouped && (
            <button type="button" onClick={() => linkWithPrevious(i)}
              className="text-[0.5rem] tracking-[0.1em] uppercase text-white/25 border border-white/10 px-2 py-2 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
              Lier au précédent
            </button>
          )}
        </div>

        {ex.mode === "simple" && (
          <div className="flex flex-wrap items-end gap-2 pl-8">
            {SIMPLE_FIELDS.filter(f => !ex.hiddenFields.includes(f.key)).map(f => (
              <div key={f.key} className="w-24">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="flex items-center gap-1 text-[0.42rem] tracking-[0.18em] uppercase text-white/30 whitespace-nowrap">
                    <f.icon />{f.label}
                  </span>
                  <button type="button" onClick={() => hideField(i, f.key)} title={`Retirer le champ ${f.label}`}
                    className="text-white/25 hover:text-[#e07070] transition-colors p-1.5 -m-1.5">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <input className={inpSm} placeholder={f.placeholder} value={ex[f.key]} onChange={e => update(i, { [f.key]: e.target.value })} />
              </div>
            ))}
            {SIMPLE_FIELDS.filter(f => ex.hiddenFields.includes(f.key)).map(f => (
              <button key={f.key} type="button" onClick={() => showField(i, f.key)}
                className="flex items-center gap-1 text-[0.5rem] tracking-[0.1em] uppercase text-white/25 border border-dashed border-white/15 rounded-lg px-2 py-1.5 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
                + {f.label}
              </button>
            ))}
          </div>
        )}

        {ex.mode === "avance" && (
          <div className="pl-8 flex flex-col gap-2">
            {ex.sets.length > 0 && (
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-1.5 text-[0.4rem] tracking-[0.15em] uppercase text-white/25 px-0.5">
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
                  <button type="button" onClick={() => duplicateSet(i, si)} title="Dupliquer cette série" className="text-white/20 hover:text-[#c9a84c] transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </button>
                  <button type="button" onClick={() => removeSet(i, si)} title="Supprimer cette série" className="text-white/20 hover:text-[#e07070] transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addSet(i)}
              className="border border-white/10 text-white/30 text-[0.5rem] tracking-[0.12em] uppercase py-2 rounded-lg hover:border-white/20 hover:text-white/50 transition-colors">
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

        <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className={`${inpSm} text-left`} placeholder="Note technique (optionnel)" value={ex.note} onChange={e => update(i, { note: e.target.value })} />
          <input className={`${inpSm} text-left`} placeholder="Lien vidéo (optionnel)" value={ex.videoUrl} onChange={e => update(i, { videoUrl: e.target.value })} />
        </div>
      </div>
    );
  };

  const nodes: React.ReactNode[] = groupExerciceRuns(items).map(run =>
    run.groupId ? (
      <div key={`group-${run.indices[0]}`} className="border border-[#c9a84c]/25 bg-[#c9a84c]/[0.03] rounded-lg p-2.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <input className="bg-transparent text-[0.55rem] tracking-[0.18em] uppercase text-[#c9a84c] focus:outline-none w-40"
            value={run.groupLabel} onChange={e => renameGroup(run.groupId!, e.target.value)} placeholder="Superset" />
          <button type="button" onClick={() => unlinkGroup(run.groupId!)} className="text-[0.48rem] tracking-wider uppercase text-white/25 hover:text-[#e07070] transition-colors">
            Délier
          </button>
        </div>
        {run.indices.map(k => renderExercice(k, true))}
      </div>
    ) : (
      renderExercice(run.indices[0], false)
    )
  );

  return (
    <div className="flex flex-col gap-2.5">
      <datalist id={DATALIST_ID}>
        {library.map(l => <option key={l.id} value={l.nom} />)}
      </datalist>
      {nodes}
      <button type="button" onClick={add} className="border border-white/10 text-white/30 text-[0.55rem] tracking-[0.12em] uppercase py-2.5 rounded-lg hover:border-white/20 hover:text-white/50 transition-colors">
        + Ajouter un exercice
      </button>
    </div>
  );
}

"use client";
import { useState } from "react";
import { type ExerciceItem, type ExerciceMode, type SetDetail, type SimpleField, type ExerciceRun, EXERCICE_TYPES, emptyExercice, emptySet, groupExerciceRuns } from "@/lib/exercices";
import { type LibraryEntry } from "@/lib/exerciceLibrary";
import { type CatalogueEntry, findCatalogueEntry } from "@/lib/exercicesCatalogue";
import { ExerciceLibraryBrowser } from "@/components/ExerciceLibraryBrowser";
import { Select } from "@/components/Select";

const inp = "w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2.5 focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const inpSm = "w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-xs px-2.5 py-2 text-center focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const inpXs = "w-full bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-lg text-[var(--t-text)] placeholder-[var(--t-text-20)] text-xs px-2 py-2 text-center focus:outline-none focus:border-[#c9a84c]/40 transition-colors";
const lblSm = "flex items-center justify-center gap-1 text-[0.42rem] tracking-[0.18em] uppercase text-[var(--t-text-30)] mb-1";

const IconSeries = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 2v4M7 2v4M3 10h18M5 22h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>;
const IconReps = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg>;
const IconPoids = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6.5 6.5h11a2 2 0 012 2v7a2 2 0 01-2 2h-11a2 2 0 01-2-2v-7a2 2 0 012-2zM2 9v6M22 9v6"/></svg>;
const IconRepos = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;
const IconUp = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
const IconDown = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;

// Vignette sans photo (exercice libre, ou catalogue pas encore illustré pour cet exercice) —
// jamais de case vide/cassée dans la carte.
const IconDumbbellLg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11a2 2 0 012 2v7a2 2 0 01-2 2h-11a2 2 0 01-2-2v-7a2 2 0 012-2zM2 9v6M22 9v6"/>
  </svg>
);

function ExerciceThumb({ catalogue, nom }: { catalogue: CatalogueEntry[]; nom: string }) {
  const entry = nom.trim() ? findCatalogueEntry(catalogue, nom) : undefined;
  return (
    <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-[var(--t-surface-2)] border border-[var(--t-border-soft)] flex items-center justify-center mt-0.5">
      {entry?.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.image_url} alt="" className="w-full h-full object-cover"/>
      ) : (
        <span className="text-[var(--t-text-15)]"><IconDumbbellLg/></span>
      )}
    </div>
  );
}

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

// Repos entre séries en mode Avancé : réglage unique par exercice (pastilles) plutôt qu'un
// champ texte répété à chaque ligne — le repos change rarement d'une série à l'autre, ça
// évite de le retaper N fois et ça libère de la place dans le tableau des séries.
const REST_PRESETS = ["", "60 sec", "90 sec", "120 sec", "180 sec"];
const REST_LABELS: Record<string, string> = { "": "Off", "60 sec": "60s", "90 sec": "90s", "120 sec": "120s", "180 sec": "180s" };

const DATALIST_ID = "exercice-bibliotheque-list";

// simplified : vue allégée pour un client qui compose sa propre séance libre (page
// /dashboard/programme/creer-ma-seance) — masque les réglages pensés pour le coach
// (mode Avancé/Texte libre, type d'exercice, supersets, lien vidéo) pour ne garder
// que l'essentiel (séries/reps/poids/repos) ; l'éditeur CRM du coach reste inchangé.
export default function ExerciceEditor({ items, onChange, library = [], catalogue = [], simplified = false }: { items: ExerciceItem[]; onChange: (items: ExerciceItem[]) => void; library?: LibraryEntry[]; catalogue?: CatalogueEntry[]; simplified?: boolean }) {
  const [showLibraryBrowser, setShowLibraryBrowser] = useState(false);
  const [customRepos, setCustomRepos] = useState<Record<number, boolean>>({});
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
  const exerciceRepos = (i: number) => items[i].sets[0]?.repos ?? "";
  const setRepos = (i: number, value: string) => {
    setCustomRepos(p => ({ ...p, [i]: false }));
    update(i, { sets: items[i].sets.map(s => ({ ...s, repos: value })) });
  };
  const addSet = (i: number) => update(i, { sets: [...items[i].sets, { ...emptySet(), repos: exerciceRepos(i) }] });
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
      <div key={i} className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-[0_2px_14px_-6px_rgba(0,0,0,0.18)]">
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
            <span className="text-[0.62rem] font-bold text-[var(--t-text-25)]">{i + 1}</span>
            {(onMoveUp || onMoveDown) && (
              <div className="flex flex-col">
                <button type="button" onClick={onMoveUp} disabled={!onMoveUp} title="Monter"
                  className="w-7 h-6 flex items-center justify-center text-[var(--t-text-20)] hover:text-[#c9a84c] transition-colors disabled:opacity-20 disabled:hover:text-[var(--t-text-20)]">
                  <IconUp/>
                </button>
                <button type="button" onClick={onMoveDown} disabled={!onMoveDown} title="Descendre"
                  className="w-7 h-6 flex items-center justify-center text-[var(--t-text-20)] hover:text-[#c9a84c] transition-colors disabled:opacity-20 disabled:hover:text-[var(--t-text-20)]">
                  <IconDown/>
                </button>
              </div>
            )}
          </div>

          <ExerciceThumb catalogue={catalogue} nom={ex.nom}/>

          <div className="flex-1 min-w-0">
            <input list={DATALIST_ID} placeholder="Nom de l'exercice" value={ex.nom}
              onChange={e => update(i, { nom: e.target.value })} onBlur={e => applyFromLibrary(i, e.target.value)}
              style={{ fontFamily: "var(--font-bebas)" }}
              className="w-full bg-transparent border-0 border-b border-[var(--t-border-soft)] focus:border-[#c9a84c]/50 outline-none text-lg tracking-wide text-[var(--t-text)] placeholder-[var(--t-text-20)] pb-1.5 transition-colors"/>

            {!simplified && (
              <div className="flex items-center gap-2 mt-2.5">
                <div className="inline-flex bg-[var(--t-surface-2)] rounded-full p-0.5">
                  {MODES.map(m => (
                    <button key={m.key} type="button" onClick={() => setMode(i, m.key)}
                      className={`px-2.5 py-1 rounded-full text-[0.56rem] tracking-[0.08em] uppercase transition-colors ${ex.mode === m.key ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-35)] hover:text-[var(--t-text-60)]"}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!simplified && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
                <Select value={ex.type} onChange={v => update(i, { type: v })} placeholder="Type d'exercice…"
                  options={EXERCICE_TYPES.map(t => ({ value: t, label: t }))} align="right"
                  triggerClassName="text-[0.62rem] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] transition-colors"/>
                {i > 0 && !isGrouped && (
                  <button type="button" onClick={() => linkWithPrevious(i)}
                    className="text-[0.58rem] tracking-[0.05em] text-[var(--t-text-25)] hover:text-[#c9a84c] transition-colors">
                    + Lier au précédent
                  </button>
                )}
              </div>
            )}
          </div>

          <button type="button" onClick={() => remove(i)} className="shrink-0 text-[var(--t-text-15)] hover:text-[#e07070] transition-colors p-2 -m-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {ex.mode === "simple" && (
          <div className="flex flex-wrap gap-2">
            {SIMPLE_FIELDS.filter(f => !ex.hiddenFields.includes(f.key)).map(f => (
              <div key={f.key} className="relative flex-1 min-w-[5.5rem]">
                <div className="bg-[var(--t-surface-2)] border border-[var(--t-border)] rounded-2xl px-3 py-2.5 text-center focus-within:border-[#c9a84c]/40 transition-colors">
                  <p className="text-[0.5rem] tracking-[0.14em] uppercase text-[var(--t-text-25)] mb-1">{f.label}</p>
                  <input className="w-full bg-transparent text-center text-[0.85rem] text-[var(--t-text)] placeholder-[var(--t-text-15)] outline-none"
                    placeholder={f.placeholder} value={ex[f.key]} onChange={e => update(i, { [f.key]: e.target.value })} />
                </div>
                <button type="button" onClick={() => hideField(i, f.key)} title={`Retirer le champ ${f.label}`}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--t-surface)] border border-[var(--t-border)] flex items-center justify-center text-[var(--t-text-25)] hover:text-[#e07070] hover:border-[#e07070]/40 transition-colors">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
            {SIMPLE_FIELDS.filter(f => ex.hiddenFields.includes(f.key)).map(f => (
              <button key={f.key} type="button" onClick={() => showField(i, f.key)}
                className="flex items-center gap-1 text-[0.5rem] tracking-[0.1em] uppercase text-[var(--t-text-25)] border border-dashed border-[var(--t-border-15)] rounded-2xl px-2.5 py-1.5 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
                + {f.label}
              </button>
            ))}
          </div>
        )}

        {ex.mode === "avance" && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-[0.42rem] tracking-[0.18em] uppercase text-[var(--t-text-25)]">Repos entre séries</p>
              <div className="flex flex-wrap gap-1.5">
                {REST_PRESETS.map(v => {
                  const active = !customRepos[i] && exerciceRepos(i) === v;
                  return (
                    <button key={v || "off"} type="button" onClick={() => setRepos(i, v)}
                      className={`text-[0.56rem] tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border transition-colors ${active ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-35)] hover:border-[#c9a84c]/40"}`}>
                      {REST_LABELS[v]}
                    </button>
                  );
                })}
                <button type="button" onClick={() => setCustomRepos(p => ({ ...p, [i]: true }))}
                  className={`text-[0.56rem] tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border transition-colors ${customRepos[i] || !REST_PRESETS.includes(exerciceRepos(i)) ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black border-transparent" : "border-[var(--t-border)] text-[var(--t-text-35)] hover:border-[#c9a84c]/40"}`}>
                  Perso
                </button>
              </div>
              {(customRepos[i] || !REST_PRESETS.includes(exerciceRepos(i))) && (
                <input className={`${inpXs} !text-left max-w-[8rem]`} placeholder="ex : 45 sec" value={exerciceRepos(i)} onChange={e => setRepos(i, e.target.value)} />
              )}
            </div>
            {ex.sets.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-1.5 text-[0.4rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] px-0.5">
                <span>Reps</span><span>Poids</span><span>RPE</span><span>Tempo</span><span></span>
              </div>
            )}
            {ex.sets.map((s, si) => (
              <div key={si} className="grid grid-cols-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-1.5 items-center pb-2 sm:pb-0 border-b border-[var(--t-border-soft)] sm:border-0 last:border-0">
                <input className={inpXs} placeholder="12" value={s.reps} onChange={e => updateSet(i, si, { reps: e.target.value })} />
                <input className={inpXs} placeholder="20 kg" value={s.poids} onChange={e => updateSet(i, si, { poids: e.target.value })} />
                <input className={inpXs} placeholder="8" value={s.rpe} onChange={e => updateSet(i, si, { rpe: e.target.value })} />
                <input className={inpXs} placeholder="3-1-2-0" value={s.tempo} onChange={e => updateSet(i, si, { tempo: e.target.value })} />
                <div className="flex items-center justify-center gap-3 sm:gap-1">
                  <button type="button" onClick={() => duplicateSet(i, si)} title="Dupliquer cette série" className="p-1.5 -m-1.5 text-[var(--t-text-20)] hover:text-[#c9a84c] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </button>
                  <button type="button" onClick={() => removeSet(i, si)} title="Supprimer cette série" className="p-1.5 -m-1.5 text-[var(--t-text-20)] hover:text-[#e07070] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addSet(i)}
              className="border border-[var(--t-border)] text-[var(--t-text-30)] text-[0.5rem] tracking-[0.12em] uppercase py-2 rounded-2xl hover:border-[var(--t-text-20)] hover:text-[var(--t-text-50)] transition-colors">
              + Ajouter une série
            </button>
          </div>
        )}

        {ex.mode === "libre" && (
          <textarea className={`${inp} resize-none`} rows={4} placeholder="Décris librement cet exercice : consignes, variantes, protocole spécifique…"
            value={ex.texteLibre} onChange={e => update(i, { texteLibre: e.target.value })} />
        )}

        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--t-border-soft)]">
          <textarea className={`${inpSm} text-left resize-none mt-2`} rows={2}
            placeholder={simplified ? "Note personnelle (optionnel) : ressenti, variante…" : "Note libre sur cet exercice (optionnel) : consigne, précision, variante…"}
            value={ex.note} onChange={e => update(i, { note: e.target.value })} />
          {!simplified && (
            <input className={`${inpSm} text-left`} placeholder="Lien vidéo (optionnel)" value={ex.videoUrl} onChange={e => update(i, { videoUrl: e.target.value })} />
          )}
        </div>
      </div>
    );
  };

  const nodes: React.ReactNode[] = runs.map((run, runPos) =>
    run.groupId ? (
      <div key={`group-${run.indices[0]}`} className="border border-[#c9a84c]/25 bg-[#c9a84c]/[0.03] rounded-2xl p-2.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1 gap-2">
          <Select value={run.groupLabel || "Superset"} onChange={v => renameGroup(run.groupId!, v)}
            options={GROUP_LABELS.map(l => ({ value: l, label: l }))}
            triggerClassName="bg-[#0c0a05] border border-[#c9a84c]/40 rounded-lg text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[#c9a84c] pl-2.5 pr-2 py-1.5"/>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex border border-[var(--t-border)] rounded-lg overflow-hidden">
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

  const bigAddButtons = (
    <div className="flex flex-col gap-3">
      {catalogue.length > 0 && (
        <button type="button" onClick={() => setShowLibraryBrowser(true)}
          className="group flex items-center gap-4 border border-[#c9a84c]/25 bg-[#c9a84c]/[0.04] px-5 py-4 rounded-2xl shadow-[0_4px_16px_-10px_rgba(0,0,0,0.4)] hover:border-[#c9a84c]/50 hover:bg-[#c9a84c]/[0.08] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
          <span className="shrink-0 w-14 h-14 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/library.svg" alt="" width={32} height={32} className="w-8 h-8 object-contain"/>
          </span>
          <span className="flex-1 text-left min-w-0">
            <span className="block text-sm font-bold tracking-[0.06em] uppercase leading-tight text-[var(--t-text)]">Choisir dans la bibliothèque</span>
            <span className="block text-[0.65rem] font-medium text-[var(--t-text-35)] tracking-wide leading-tight mt-1">{catalogue.length} exercices classés par muscle</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#c9a84c] transition-transform group-hover:translate-x-1"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      )}
      <button type="button" onClick={add}
        className="group flex items-center gap-4 border border-[var(--t-border)] bg-[var(--t-surface)] px-5 py-4 rounded-2xl hover:border-[var(--t-border-15)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
        <span className="shrink-0 w-14 h-14 rounded-2xl bg-[var(--t-surface-2)] flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/entrainement-libre.svg" alt="" width={32} height={32} className="w-8 h-8 object-contain"/>
        </span>
        <span className="flex-1 text-left min-w-0">
          <span className="block text-sm font-bold tracking-[0.06em] uppercase leading-tight text-[var(--t-text)]">Exercice libre</span>
          <span className="block text-[0.65rem] font-medium text-[var(--t-text-30)] tracking-wide leading-tight mt-1">Ajoute un exercice vierge à compléter toi-même</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--t-text-20)] transition-transform group-hover:translate-x-1"><path d="M9 6l6 6-6 6"/></svg>
      </button>
    </div>
  );

  // En mode simplifié, une fois la séance amorcée, les deux grandes cartes cèdent la
  // place à une rangée compacte "+ ajouter" — l'espace revient à la liste d'exercices,
  // qui est ce que le client regarde le plus une fois la séance en cours de construction.
  const compactAddButtons = (
    <div className="flex gap-2">
      {catalogue.length > 0 && (
        <button type="button" onClick={() => setShowLibraryBrowser(true)}
          className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-[var(--t-border-15)] text-[var(--t-text-30)] text-[0.62rem] font-bold tracking-[0.08em] uppercase py-3 rounded-xl hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Bibliothèque
        </button>
      )}
      <button type="button" onClick={add}
        className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-[var(--t-border-15)] text-[var(--t-text-30)] text-[0.62rem] font-bold tracking-[0.08em] uppercase py-3 rounded-xl hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Exercice libre
      </button>
    </div>
  );

  const showBigCards = !simplified || items.length === 0;
  const totalExercices = items.filter(it => it.nom.trim()).length;
  const totalSeries = items.reduce((sum, it) => sum + (it.mode === "avance" ? it.sets.length : parseInt(it.series) || 0), 0);
  // Le panneau s'ouvre juste sous le bouton qui l'a déclenché (grande carte en haut,
  // ou rangée compacte en bas une fois des exercices ajoutés) plutôt qu'en popup —
  // il reste ainsi intégré au flux de la page, avec son propre défilement interne.
  const libraryBrowser = (
    <ExerciceLibraryBrowser catalogue={catalogue} onPick={addFromCatalogue} onClose={() => setShowLibraryBrowser(false)}/>
  );

  return (
    <div className="flex flex-col gap-2.5">
      <datalist id={DATALIST_ID}>
        {library.map(l => <option key={`lib-${l.id}`} value={l.nom} />)}
        {catalogue.map(c => <option key={`cat-${c.id}`} value={c.nom} />)}
      </datalist>
      {totalExercices > 0 && (
        <div className="flex items-center justify-around bg-[#c9a84c]/[0.06] border border-[#c9a84c]/20 rounded-xl py-2.5">
          <div className="text-center">
            <p className="text-sm font-bold text-[#c9a84c]" style={{ fontFamily: "var(--font-bebas)" }}>{totalExercices}</p>
            <p className="text-[0.48rem] tracking-[0.12em] uppercase text-[var(--t-text-30)]">Exercice{totalExercices > 1 ? "s" : ""}</p>
          </div>
          <div className="w-px h-6 bg-[var(--t-border-soft)]"/>
          <div className="text-center">
            <p className="text-sm font-bold text-[#c9a84c]" style={{ fontFamily: "var(--font-bebas)" }}>{totalSeries}</p>
            <p className="text-[0.48rem] tracking-[0.12em] uppercase text-[var(--t-text-30)]">Série{totalSeries > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
      {showBigCards && !showLibraryBrowser && bigAddButtons}
      {showLibraryBrowser && showBigCards && libraryBrowser}
      {nodes}
      {simplified && items.length > 0 && !showLibraryBrowser && compactAddButtons}
      {showLibraryBrowser && !showBigCards && libraryBrowser}
    </div>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { supabase } from "@/lib/supabase";
import { type ExerciceItem, type SetDetail, parseExercices, serializeExercices, emptyExercice, groupExerciceRuns, targetSetsFor, effectiveLoad } from "@/lib/exercices";
import { useWakeLock } from "@/lib/useWakeLock";
import { Select } from "@/components/Select";
import { getMyCoachEmail } from "@/lib/coach";
import {
  estimate1RM, isNewRecord, parseRestSeconds,
  loadSeanceLogs, saveSetLog, deleteSetLog, loadExerciceHistory, type LastPerformance,
} from "@/lib/workoutLog";
import { loadExerciceSessionOutcomes, suggestProgression, type ProgressionSuggestion } from "@/lib/progression";
import { loadCatalogue, type CatalogueEntry } from "@/lib/exercicesCatalogue";
import { ExerciceLibraryBrowser } from "@/components/ExerciceLibraryBrowser";
import { NumberStepper, numOr } from "@/components/NumberStepper";
import { Icon } from "@/components/Icon";
import { Check, X, ChevronLeft, ChevronRight, Dumbbell, NotebookPen } from "@/lib/solarIcons";

type LiveSeance = { id: string; titre: string; exercices: string | null };
type SetLogState = { poids: string; reps: string; rir: string; done: boolean };

const genId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const fmtDuration = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};

const fmtPrev = (p: { poids: number | null; reps: number | null } | undefined) => {
  if (!p || (p.poids == null && p.reps == null)) return "—";
  return `${p.poids ?? "–"}×${p.reps ?? "–"}`;
};

// Une séance planifiée fixe un nombre de séries par exercice, mais le client peut vouloir en
// faire une de plus un bon jour — displaySets ajoute des slots "libres" (sans cible écrite par
// le coach) après les séries prévues, comptés localement tant qu'ils ne sont pas loggués.
function displaySetsFor(ex: ExerciceItem, extra: number): { target: SetDetail; isExtra: boolean }[] {
  const base = targetSetsFor(ex).map(target => ({ target, isExtra: false }));
  const lastRepos = base.length ? base[base.length - 1].target.repos : "";
  const extras = Array.from({ length: extra }, () => ({ target: { reps: "", poids: "", repos: lastRepos, rpe: "", tempo: "" }, isExtra: true }));
  return [...base, ...extras];
}

function SetRow({ target, idx, log, prev, isExtra, bodyweight, onToggle, onChange, onCopyPrev }: {
  target: SetDetail; idx: number; log: SetLogState | undefined; prev: { poids: number | null; reps: number | null } | undefined;
  isExtra: boolean; bodyweight?: boolean; onToggle: () => void; onChange: (field: "poids" | "reps" | "rir", val: string) => void; onCopyPrev: () => void;
}) {
  const hasPrev = prev && (prev.poids != null || prev.reps != null);
  return (
    <div className={`grid grid-cols-[28px_60px_1fr_1fr_52px_36px] items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${log?.done ? "bg-[#7eb8a0]/12" : isExtra ? "bg-[#c9a84c]/[0.05]" : ""}`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.68rem] font-bold shrink-0 ${log?.done ? "bg-[#7eb8a0] text-black" : "bg-[var(--t-track)] text-[var(--t-text-40)]"}`}>{idx + 1}</span>
      {hasPrev && !log?.done ? (
        <button onClick={onCopyPrev} className="text-[0.7rem] text-[var(--t-text-30)] truncate text-left hover:text-[#c9a84c] transition-colors underline decoration-dotted decoration-[var(--t-text-15)]">
          {fmtPrev(prev)}
        </button>
      ) : (
        <span className="text-[0.7rem] text-[var(--t-text-15)] truncate">{hasPrev ? fmtPrev(prev) : "—"}</span>
      )}
      <NumberStepper value={log?.poids ?? ""} placeholder={bodyweight ? (target.poids || "+kg") : (target.poids || "kg")} step={2.5} onChange={v => onChange("poids", v)} accent/>
      <NumberStepper value={log?.reps ?? ""} placeholder={target.reps || "reps"} step={1} onChange={v => onChange("reps", v)}/>
      <Select value={log?.rir ?? ""} onChange={v => onChange("rir", v)} placeholder="RIR"
        options={[0, 1, 2, 3, 4].map(n => ({ value: String(n), label: `${n}${n === 4 ? "+" : ""}` }))}
        triggerClassName="bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[0.65rem] text-[var(--t-text-40)] px-1 py-2 w-full justify-center"
        panelClassName="w-16"/>
      <button onClick={onToggle}
        className={`w-8 h-8 rounded-full border-2 shrink-0 flex items-center justify-center transition-all mx-auto active:scale-90 ${log?.done ? "bg-[#7eb8a0] border-[#7eb8a0] text-black" : "border-[var(--t-border)] text-transparent hover:border-[#7eb8a0]/50"}`}>
        <Icon icon={Check} size={15} strokeWidth={3}/>
      </button>
    </div>
  );
}

function ExerciceLiveBlock({ ex, exIdx, logs, history, prBadge, extra, onToggle, onChange, onAddSet }: {
  ex: ExerciceItem; exIdx: number; logs: Record<string, SetLogState>; history: LastPerformance; prBadge: boolean; extra: number;
  onToggle: (exIdx: number, setIdx: number, target: SetDetail) => void;
  onChange: (exIdx: number, setIdx: number, field: "poids" | "reps" | "rir", val: string) => void;
  onAddSet: (exIdx: number) => void;
}) {
  const rows = displaySetsFor(ex, extra);
  const doneCount = rows.filter((_, i) => logs[`${exIdx}-${i}`]?.done).length;
  const pct = rows.length ? Math.round((doneCount / rows.length) * 100) : 0;
  const complete = rows.length > 0 && doneCount === rows.length;
  return (
    <div className={`border rounded-2xl p-4 flex flex-col gap-3 transition-colors ${complete ? "border-[#7eb8a0]/30 bg-[#7eb8a0]/[0.04]" : "border-[var(--t-border-soft)] bg-[var(--t-surface)]"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--t-text)] truncate">{ex.nom}</p>
            {ex.bodyweight && <span className="text-[0.58rem] text-[var(--t-text-30)] shrink-0" title="Charge = poids de corps + lest">🏋️ PDC</span>}
            {prBadge && <span className="text-[0.62rem] text-[#c9a84c] shrink-0">🏆 Record</span>}
          </div>
          {rows.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="h-1.5 w-24 bg-[var(--t-track)] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${complete ? "bg-[#7eb8a0]" : "bg-[#c9a84c]"}`} style={{ width: `${pct}%` }}/>
              </div>
              <span className={`text-[0.65rem] tracking-wider shrink-0 font-medium ${complete ? "text-[#7eb8a0]" : "text-[var(--t-text-30)]"}`}>{doneCount}/{rows.length}</span>
            </div>
          )}
        </div>
        {complete && <span className="text-[#7eb8a0] shrink-0 text-lg">✓</span>}
      </div>

      {rows.length > 0 ? (
        <>
          <div className="grid grid-cols-[28px_60px_1fr_1fr_52px_36px] items-center gap-2 px-2">
            <span className="text-[0.58rem] tracking-[0.1em] uppercase text-[var(--t-text-20)] text-center">Série</span>
            <span className="text-[0.58rem] tracking-[0.1em] uppercase text-[var(--t-text-20)]">Préc.</span>
            <span className="text-[0.58rem] tracking-[0.1em] uppercase text-[var(--t-text-20)] text-center">Kg</span>
            <span className="text-[0.58rem] tracking-[0.1em] uppercase text-[var(--t-text-20)] text-center">Reps</span>
            <span className="text-[0.58rem] tracking-[0.1em] uppercase text-[var(--t-text-20)] text-center">Rir</span>
            <span/>
          </div>
          <div className="flex flex-col gap-1">
            {rows.map((row, setIdx) => (
              <SetRow key={setIdx} target={row.target} idx={setIdx} isExtra={row.isExtra} bodyweight={ex.bodyweight}
                log={logs[`${exIdx}-${setIdx}`]} prev={history[setIdx]}
                onToggle={() => onToggle(exIdx, setIdx, row.target)}
                onChange={(field, val) => onChange(exIdx, setIdx, field, val)}
                onCopyPrev={() => { const p = history[setIdx]; if (p?.poids != null) onChange(exIdx, setIdx, "poids", String(p.poids)); if (p?.reps != null) onChange(exIdx, setIdx, "reps", String(p.reps)); }}/>
            ))}
          </div>
          <button onClick={() => onAddSet(exIdx)}
            className="text-[0.65rem] tracking-wider uppercase text-[var(--t-text-25)] hover:text-[#c9a84c] transition-colors text-left px-2 py-1.5 font-medium">
            + Ajouter une série
          </button>
        </>
      ) : ex.texteLibre ? (
        <p className="text-[0.72rem] text-[var(--t-text-50)] leading-relaxed whitespace-pre-wrap">{ex.texteLibre}</p>
      ) : null}
      {ex.note && <p className="text-[0.68rem] text-[var(--t-text-35)] italic">{ex.note}</p>}
    </div>
  );
}

export function SeanceLive({ seance, clientId, clientBodyweight = null, onFinish, onClose }: {
  seance: LiveSeance; clientId: string; clientBodyweight?: number | null; onFinish: () => void; onClose: () => void;
}) {
  // Séance mutable en mémoire : on part de la liste planifiée, mais le client peut vouloir
  // ajouter un exercice non prévu en cours de séance (improvisation, machine libre trouvée
  // sur place…) — géré comme un état local plutôt qu'un simple useMemo dérivé de la prop.
  const [exercices, setExercices] = useState<ExerciceItem[]>(() => parseExercices(seance.exercices));
  const runs = useMemo(() => groupExerciceRuns(exercices), [exercices]);

  // Un exercice (ou superset) à la fois, avec flèches/points pour naviguer — plutôt qu'une
  // longue liste à faire défiler, façon Liftoff/Hevy : on sait toujours où on en est.
  const [runIdx, setRunIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const [addingExercice, setAddingExercice] = useState(false);
  const [newExerciceNom, setNewExerciceNom] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  useEffect(() => { loadCatalogue().then(setCatalogue).catch(() => {}); }, []);
  // Lier le prochain exercice ajouté à celui actuellement affiché — même mécanisme que
  // "superset/biset/triset/circuit" en préparation (ExerciceEditor), mais construit à la
  // volée en direct plutôt qu'en éditant une liste complète.
  const [linkSuperset, setLinkSuperset] = useState(false);

  const [logs, setLogs] = useState<Record<string, SetLogState>>({});
  const [historyByNom, setHistoryByNom] = useState<Record<string, LastPerformance>>({});
  const [prByNom, setPrByNom] = useState<Record<string, boolean>>({});
  const [extraSets, setExtraSets] = useState<Record<number, number>>({});
  const [rest, setRest] = useState<{ left: number; total: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState<{ duration: string; volume: number; sets: number; prs: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [suggestions, setSuggestions] = useState<{ nom: string; suggestion: ProgressionSuggestion }[] | null>(null);
  const [suggestionStatus, setSuggestionStatus] = useState<Record<string, "accepted" | "dismissed">>({});
  const [sendingNom, setSendingNom] = useState<string | null>(null);
  // Meilleur 1RM historique par exercice, pour détecter un record en direct sans re-render —
  // n'affecte que prByNom (affiché), donc une simple ref suffit.
  const bestRef = useRef<Record<string, number | null>>({});

  useWakeLock(!summary);

  // Horodatage de début persisté en localStorage : survit à un rafraîchissement accidentel
  // de page en cours de séance, sans avoir besoin d'une colonne dédiée en base.
  useEffect(() => {
    const key = `seance_start_${seance.id}`;
    let start = parseInt(localStorage.getItem(key) || "", 10);
    if (!Number.isFinite(start)) { start = Date.now(); localStorage.setItem(key, String(start)); }
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [seance.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await loadSeanceLogs(seance.id);
        if (cancelled) return;
        const map: Record<string, SetLogState> = {};
        const maxSetIdxByEx: Record<number, number> = {};
        for (const l of existing) {
          map[`${l.exercice_index}-${l.set_index}`] = {
            poids: l.poids_reel != null ? String(l.poids_reel) : "",
            reps: l.reps_reel != null ? String(l.reps_reel) : "",
            rir: l.rir_reel != null ? String(l.rir_reel) : "",
            done: true,
          };
          maxSetIdxByEx[l.exercice_index] = Math.max(maxSetIdxByEx[l.exercice_index] ?? -1, l.set_index);
        }
        setLogs(map);

        const extras: Record<number, number> = {};
        exercices.forEach((ex, exIdx) => {
          const targetLen = targetSetsFor(ex).length;
          const maxIdx = maxSetIdxByEx[exIdx];
          if (maxIdx != null && maxIdx >= targetLen) extras[exIdx] = maxIdx - targetLen + 1;
        });
        setExtraSets(extras);

        const noms = [...new Set(exercices.map(e => e.nom).filter(Boolean))];
        const histories = await Promise.all(noms.map(nom => loadExerciceHistory(clientId, nom, seance.id)));
        if (cancelled) return;
        const byNom: Record<string, LastPerformance> = {};
        const bestByNom: Record<string, number | null> = {};
        noms.forEach((nom, i) => { byNom[nom] = histories[i].lastPerformance; bestByNom[nom] = histories[i].best1RM; });
        setHistoryByNom(byNom);
        bestRef.current = bestByNom;
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seance.id, clientId]);

  useEffect(() => {
    if (!rest || rest.left <= 0) return;
    const t = setTimeout(() => setRest(r => (r && r.left > 1 ? { ...r, left: r.left - 1 } : null)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const flatSets = useMemo(() => {
    const list: { exIdx: number; setIdx: number }[] = [];
    exercices.forEach((ex, exIdx) => {
      const n = displaySetsFor(ex, extraSets[exIdx] ?? 0).length;
      for (let setIdx = 0; setIdx < n; setIdx++) list.push({ exIdx, setIdx });
    });
    return list;
  }, [exercices, extraSets]);
  const lastKey = flatSets.length ? `${flatSets[flatSets.length - 1].exIdx}-${flatSets[flatSets.length - 1].setIdx}` : null;

  const totalSets = flatSets.length;
  const doneEntries = Object.entries(logs).filter(([, l]) => l.done);
  const doneSets = doneEntries.length;
  // Le volume compte la charge réelle : pour un exercice au poids du corps, "poids" n'est que
  // le lest additionnel loggué — effectiveLoad y ajoute la fraction de poids de corps configurée
  // pour ne pas sous-évaluer le travail réel d'une série de tractions ou de dips.
  const volume = doneEntries.reduce((s, [k, l]) => {
    const exIdx = parseInt(k.split("-")[0], 10);
    const load = effectiveLoad(exercices[exIdx], numOr(l.poids), clientBodyweight);
    return s + (load ?? 0) * (numOr(l.reps) ?? 0);
  }, 0);

  const runIsComplete = (run: { indices: number[] }) => run.indices.every(exIdx => {
    const rows = displaySetsFor(exercices[exIdx], extraSets[exIdx] ?? 0);
    return rows.length === 0 || rows.every((_, i) => logs[`${exIdx}-${i}`]?.done);
  });
  const clampRun = (i: number) => Math.max(0, Math.min(runs.length - 1, i));
  const goPrev = () => setRunIdx(i => clampRun(i - 1));
  const goNext = () => setRunIdx(i => clampRun(i + 1));
  const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 60) return;
    if (dx < 0) goNext(); else goPrev();
  };

  const onChange = (exIdx: number, setIdx: number, field: "poids" | "reps" | "rir", val: string) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base: SetLogState = prev[k] ?? { poids: "", reps: "", rir: "", done: false };
      return { ...prev, [k]: { ...base, [field]: val } };
    });
  };

  const onAddSet = (exIdx: number) => setExtraSets(prev => ({ ...prev, [exIdx]: (prev[exIdx] ?? 0) + 1 }));

  // Exercice ajouté en cours de séance (non prévu par le coach) — series: "1" pour qu'il ait
  // tout de suite une ligne de série loggable (un exercice sans cible ni texte libre ne
  // s'afficherait sinon pas du tout, cf. ExerciceLiveBlock). Persisté immédiatement en base
  // pour survivre à un rafraîchissement, en best-effort : un échec réseau ne doit pas bloquer
  // l'ajout local, la séance reste utilisable et le prochain toggle de série retentera l'écriture.
  //
  // Si linkSuperset est actif, le nouvel exercice rejoint le run actuellement affiché
  // (groupId partagé) au lieu d'être ajouté isolé en fin de liste — même mécanisme que
  // "superset/biset/triset/circuit" en préparation, construit à la volée : rappeler cette
  // fonction plusieurs fois sur le même run l'étend en triset, quadset, etc.
  const pushExercice = async (nom: string) => {
    const newItem = { ...emptyExercice(), nom, series: "1" };
    const targetRun = linkSuperset ? runs[runIdx] : null;
    let next: ExerciceItem[];
    let insertAt: number;

    if (targetRun) {
      const gid = targetRun.groupId ?? genId();
      const label = targetRun.groupLabel || "Superset";
      insertAt = targetRun.indices[targetRun.indices.length - 1] + 1;
      const relabeled = exercices.map((it, j) => targetRun.indices.includes(j) ? { ...it, groupId: gid, groupLabel: label } : it);
      next = [...relabeled.slice(0, insertAt), { ...newItem, groupId: gid, groupLabel: label }, ...relabeled.slice(insertAt)];
    } else {
      insertAt = exercices.length;
      next = [...exercices, newItem];
    }

    setExercices(next);
    setLinkSuperset(false);
    const newRuns = groupExerciceRuns(next);
    const landingRunIdx = newRuns.findIndex(r => r.indices.includes(insertAt));
    setRunIdx(landingRunIdx >= 0 ? landingRunIdx : newRuns.length - 1);
    await supabase.from("programme_seances").update({ exercices: serializeExercices(next) }).eq("id", seance.id);
  };

  const addExercice = async () => {
    const nom = newExerciceNom.trim();
    if (!nom) return;
    setNewExerciceNom("");
    setAddingExercice(false);
    await pushExercice(nom);
  };

  const addFromCatalogue = async (entry: CatalogueEntry) => {
    setShowLibrary(false);
    await pushExercice(entry.nom);
  };

  const onToggle = async (exIdx: number, setIdx: number, target: SetDetail) => {
    const k = `${exIdx}-${setIdx}`;
    const ex = exercices[exIdx];
    const current = logs[k] ?? { poids: target.poids, reps: target.reps, rir: "", done: false };
    const next = { ...current, done: !current.done };
    setLogs(prev => ({ ...prev, [k]: next }));

    if (!next.done) {
      await deleteSetLog(seance.id, exIdx, setIdx);
      return;
    }

    const poidsNum = numOr(next.poids);
    const repsNum = numOr(next.reps);
    const rirNum = numOr(next.rir);
    await saveSetLog({
      seanceId: seance.id, clientId, exerciceIndex: exIdx, exerciceNom: ex.nom,
      setIndex: setIdx, poids: poidsNum, reps: repsNum, rir: rirNum,
    });

    // La détection de record historique (bestRef) vient de seance_logs, qui ne stocke que le
    // lest additionnel loggué — sans savoir quelle fraction de poids de corps s'y ajoutait à
    // l'époque. Comparer un 1RM "poids de corps inclus" à cet historique brut donnerait de
    // faux records à chaque série ; on désactive donc juste ce badge pour les exos au poids
    // du corps plutôt que d'afficher un résultat trompeur.
    if (!ex.bodyweight) {
      const est = estimate1RM(poidsNum, repsNum);
      if (isNewRecord(est, bestRef.current[ex.nom] ?? null)) {
        setPrByNom(prev => ({ ...prev, [ex.nom]: true }));
        bestRef.current[ex.nom] = est;
      }
    }

    if (k !== lastKey) {
      const secs = parseRestSeconds(target.repos || ex.repos);
      setRest({ left: secs, total: secs });
    }
  };

  const finish = async () => {
    setFinishing(true);
    await supabase.from("programme_seances").update({ completed_at: new Date().toISOString() }).eq("id", seance.id);
    localStorage.removeItem(`seance_start_${seance.id}`);
    setFinishing(false);
    setSummary({
      duration: fmtDuration(elapsed), volume: Math.round(volume), sets: doneSets,
      prs: Object.values(prByNom).filter(Boolean).length,
    });

    // Suggestions de charge pour la prochaine fois, sur les exercices réellement loggués
    // aujourd'hui — le client les accepte ou les ignore, une acceptation prévient juste
    // Samuel par message pour qu'il en tienne compte en écrivant la prochaine séance (les
    // séances restent rédigées par le coach, rien n'est appliqué automatiquement).
    const noms = [...new Set(doneEntries.map(([k]) => exercices[parseInt(k.split("-")[0], 10)].nom).filter(Boolean))];
    if (noms.length) {
      const results = await Promise.all(noms.map(async nom => {
        const history = await loadExerciceSessionOutcomes(clientId, nom);
        return { nom, suggestion: suggestProgression(history) };
      }));
      setSuggestions(results.filter(r => r.suggestion.action === "increase" || r.suggestion.action === "deload"));
    } else {
      setSuggestions([]);
    }
  };

  const acceptSuggestion = async (nom: string, suggestion: ProgressionSuggestion) => {
    setSendingNom(nom);
    const [{ data: { user } }, coachEmail] = await Promise.all([supabase.auth.getUser(), getMyCoachEmail(clientId)]);
    if (user?.email && coachEmail) {
      const payload = JSON.stringify({
        nom, action: suggestion.action, suggestedWeight: suggestion.suggestedWeight, basis: suggestion.basis,
      });
      await supabase.from("messages").insert({ from_email: user.email, to_email: coachEmail, content: `[PROGRESSION_ACCEPTED:${payload}]` });
    }
    setSendingNom(null);
    setSuggestionStatus(prev => ({ ...prev, [nom]: "accepted" }));
  };

  if (summary) {
    return (
      <div className="fixed inset-0 bg-[var(--t-bg)] z-50 flex flex-col overflow-y-auto">
        <div className="flex-1 px-6 py-10 max-w-md mx-auto w-full flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#7eb8a0]/10 border border-[#7eb8a0]/30 flex items-center justify-center">
            <Icon icon={Check} size={28} strokeWidth={2.5} className="text-[#7eb8a0]"/>
          </div>
          <div>
            <p className="text-[0.7rem] tracking-[0.3em] text-[#c9a84c] uppercase mb-2">Séance terminée</p>
            <h2 style={{ fontFamily: "var(--font-bebas)" }} className="text-3xl text-[var(--t-text)] tracking-wide">{seance.titre}</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-xl py-4 px-2">
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{summary.duration}</p>
              <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">Durée</p>
            </div>
            <div className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-xl py-4 px-2">
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[#c9a84c] tracking-wide leading-none">{summary.volume.toLocaleString("fr-FR")}</p>
              <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">Volume (kg)</p>
            </div>
            <div className="border border-[var(--t-border-soft)] bg-[var(--t-surface)] rounded-xl py-4 px-2">
              <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{summary.sets}</p>
              <p className="text-[0.58rem] tracking-[0.15em] uppercase text-[var(--t-text-30)] mt-1.5">Séries</p>
            </div>
          </div>

          {summary.prs > 0 && (
            <div className="border border-[#c9a84c]/25 bg-[#c9a84c]/5 rounded-xl px-4 py-3 w-full">
              <p className="text-xs text-[#c9a84c] font-medium">🏆 {summary.prs} nouveau{summary.prs > 1 ? "x" : ""} record{summary.prs > 1 ? "s" : ""} personnel{summary.prs > 1 ? "s" : ""} !</p>
            </div>
          )}

          {suggestions && suggestions.length > 0 && (
            <div className="w-full flex flex-col gap-2 text-left">
              <p className="text-[0.62rem] tracking-[0.2em] uppercase text-[var(--t-text-30)] text-center">Pour la prochaine fois</p>
              {suggestions.map(({ nom, suggestion }) => {
                const status = suggestionStatus[nom];
                const isDeload = suggestion.action === "deload";
                return (
                  <div key={nom} className={`border rounded-xl px-3.5 py-3 ${isDeload ? "border-[#e09070]/25 bg-[#e09070]/5" : "border-[#7eb8a0]/25 bg-[#7eb8a0]/5"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--t-text-70)] truncate">{nom}</p>
                        <p className="text-[0.6rem] text-[var(--t-text-30)] mt-0.5 leading-relaxed">{suggestion.basis}</p>
                      </div>
                      {suggestion.suggestedWeight != null && (
                        <p style={{ fontFamily: "var(--font-bebas)" }} className={`text-lg tracking-wide leading-none shrink-0 ${isDeload ? "text-[#e09070]" : "text-[#7eb8a0]"}`}>
                          {suggestion.suggestedWeight} <span className="text-[0.55rem] text-[var(--t-text-25)]">kg</span>
                        </p>
                      )}
                    </div>
                    {status === "accepted" ? (
                      <p className="text-[0.6rem] text-[#7eb8a0] mt-2">✓ Envoyé à Samuel</p>
                    ) : status === "dismissed" ? (
                      <p className="text-[0.6rem] text-[var(--t-text-20)] mt-2">Ignoré</p>
                    ) : (
                      <div className="flex gap-2 mt-2.5">
                        <button onClick={() => setSuggestionStatus(prev => ({ ...prev, [nom]: "dismissed" }))}
                          className="flex-1 border border-[var(--t-border)] text-[var(--t-text-30)] text-[0.58rem] tracking-wider uppercase py-1.5 rounded-lg hover:border-[var(--t-text-20)] hover:text-[var(--t-text-60)] transition-colors">
                          Ignorer
                        </button>
                        <button onClick={() => acceptSuggestion(nom, suggestion)} disabled={sendingNom === nom}
                          className="flex-1 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black text-[0.58rem] font-bold tracking-wider uppercase py-1.5 rounded-lg disabled:opacity-50 transition-all">
                          {sendingNom === nom ? "…" : "Accepter"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={onFinish}
            className="w-full py-3 rounded-xl text-xs font-bold tracking-[0.15em] uppercase bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black shadow-[0_4px_16px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_20px_-4px_rgba(201,168,76,0.8)] transition-all mt-2">
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const overallPct = totalSets ? Math.min((doneSets / totalSets) * 100, 100) : 0;

  return (
    <div className="fixed inset-0 bg-[var(--t-bg)] z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 shrink-0 gap-3 max-w-lg mx-auto w-full">
        <button onClick={onClose} className="text-[var(--t-text-30)] hover:text-[var(--t-text)] transition-colors shrink-0 w-8 h-8 flex items-center justify-center -ml-1.5">
          <Icon icon={X} size={19} strokeWidth={2}/>
        </button>
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-[var(--t-text)] truncate flex-1 text-center">{seance.titre}</p>
        <button onClick={finish} disabled={finishing}
          className="shrink-0 rounded-full text-[0.65rem] font-bold tracking-[0.12em] uppercase px-4 py-2.5 bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black shadow-[0_3px_12px_-4px_rgba(201,168,76,0.6)] transition-all disabled:opacity-50">
          {finishing ? "…" : "Terminer"}
        </button>
      </div>

      <div className="h-1 bg-[var(--t-track)] shrink-0">
        <div className="h-full bg-gradient-to-r from-[#e2c97e] to-[#c9a84c] transition-all duration-500 max-w-lg mx-auto" style={{ width: `${overallPct}%` }}/>
      </div>

      <div className="border-b border-[var(--t-border-soft)] shrink-0">
        <div className="grid grid-cols-3 max-w-lg mx-auto">
          <div className="text-center py-3.5 border-r border-[var(--t-border-soft)]">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{fmtDuration(elapsed)}</p>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] mt-1.5">Durée</p>
          </div>
          <div className="text-center py-3.5 border-r border-[var(--t-border-soft)]">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[#c9a84c] tracking-wide leading-none">{Math.round(volume).toLocaleString("fr-FR")}</p>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] mt-1.5">Volume kg</p>
          </div>
          <div className="text-center py-3.5">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{doneSets}/{totalSets}</p>
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-25)] mt-1.5">Séries</p>
          </div>
        </div>
      </div>

      {loaded && runs.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 shrink-0 max-w-lg mx-auto w-full">
          <button onClick={goPrev} disabled={runIdx === 0}
            className="w-9 h-9 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all disabled:opacity-20 flex items-center justify-center shrink-0">
            <Icon icon={ChevronLeft} size={16} strokeWidth={2}/>
          </button>
          <div className="flex flex-col items-center gap-1.5 min-w-0">
            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-[var(--t-text-30)]">Exercice {runIdx + 1}/{runs.length}</p>
            <div className="flex items-center gap-1.5">
              {runs.map((run, i) => (
                <button key={i} onClick={() => setRunIdx(i)} aria-label={`Exercice ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === runIdx ? "w-5 bg-[#c9a84c]" : runIsComplete(run) ? "w-1.5 bg-[#7eb8a0]" : "w-1.5 bg-[var(--t-track)]"}`}/>
              ))}
            </div>
          </div>
          <button onClick={goNext} disabled={runIdx === runs.length - 1}
            className="w-9 h-9 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all disabled:opacity-20 flex items-center justify-center shrink-0">
            <Icon icon={ChevronRight} size={16} strokeWidth={2}/>
          </button>
        </div>
      )}

      {/* Ajouter un exercice non prévu, à tout moment de la séance (improvisation, machine
          libre trouvée sur place…) — pas seulement des séries à un exercice déjà planifié. */}
      {loaded && (
        <div className="px-4 pb-2 shrink-0 max-w-lg mx-auto w-full flex flex-col gap-2">
          {runs.length > 0 && (
            <button type="button" onClick={() => setLinkSuperset(v => !v)}
              className="w-full flex items-center gap-2 text-left px-1 py-1">
              <span className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-colors ${linkSuperset ? "bg-[#c9a84c] border-[#c9a84c]" : "border-[var(--t-border)]"}`}>
                {linkSuperset && <Icon icon={Check} size={10} strokeWidth={3} className="text-black"/>}
              </span>
              <span className={`text-[0.62rem] tracking-wide transition-colors ${linkSuperset ? "text-[#c9a84c]" : "text-[var(--t-text-25)]"}`}>
                En superset avec &laquo; {exercices[runs[runIdx].indices[0]]?.nom || "cet exercice"} &raquo;{runs[runIdx].indices.length > 1 ? " (déjà groupé)" : ""}
              </span>
            </button>
          )}
          {addingExercice ? (
            <div className="flex items-center gap-2">
              <input autoFocus value={newExerciceNom} onChange={e => setNewExerciceNom(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addExercice(); if (e.key === "Escape") { setAddingExercice(false); setNewExerciceNom(""); } }}
                placeholder="Nom de l'exercice"
                className="flex-1 min-w-0 bg-[var(--t-surface)] border border-[#c9a84c]/40 rounded-xl text-[var(--t-text)] placeholder-[var(--t-text-20)] text-sm px-3 py-2 focus:outline-none"/>
              <button onClick={addExercice} disabled={!newExerciceNom.trim()}
                className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black flex items-center justify-center disabled:opacity-40 transition-opacity">
                <Icon icon={Check} size={15} strokeWidth={2.5}/>
              </button>
              <button onClick={() => { setAddingExercice(false); setNewExerciceNom(""); }}
                className="shrink-0 w-9 h-9 rounded-xl border border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] flex items-center justify-center transition-colors">
                <Icon icon={X} size={14} strokeWidth={2}/>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLibrary(true)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-[var(--t-border)] rounded-xl text-[0.65rem] tracking-wider uppercase text-[var(--t-text-30)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors py-2 font-medium">
                <Icon icon={Dumbbell} size={12} strokeWidth={2}/> Bibliothèque
              </button>
              <button onClick={() => setAddingExercice(true)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-[var(--t-border)] rounded-xl text-[0.65rem] tracking-wider uppercase text-[var(--t-text-30)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors py-2 font-medium">
                <Icon icon={NotebookPen} size={12} strokeWidth={2}/> Nom libre
              </button>
            </div>
          )}
        </div>
      )}

      {showLibrary && (
        <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center px-4" onClick={() => setShowLibrary(false)}>
          <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <ExerciceLibraryBrowser catalogue={catalogue} onPick={addFromCatalogue} onClose={() => setShowLibrary(false)}/>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-28 max-w-lg mx-auto w-full" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {!loaded ? (
          <p className="text-xs text-[var(--t-text-30)] text-center py-8">Chargement…</p>
        ) : (() => {
          const run = runs[runIdx];
          if (!run) return null;
          const complete = runIsComplete(run);
          return (
            <div className="flex flex-col gap-3">
              {run.groupId ? (
                <div className="border border-[#c9a84c]/25 bg-[#c9a84c]/[0.03] rounded-2xl p-3 flex flex-col gap-3">
                  <p className="text-[0.62rem] tracking-[0.15em] uppercase text-[#c9a84c] font-medium px-1">{run.groupLabel || "Superset"}</p>
                  {run.indices.map(exIdx => (
                    <ExerciceLiveBlock key={exIdx} ex={exercices[exIdx]} exIdx={exIdx} logs={logs}
                      history={historyByNom[exercices[exIdx].nom] ?? {}} prBadge={!!prByNom[exercices[exIdx].nom]}
                      extra={extraSets[exIdx] ?? 0} onToggle={onToggle} onChange={onChange} onAddSet={onAddSet}/>
                  ))}
                </div>
              ) : (
                <ExerciceLiveBlock ex={exercices[run.indices[0]]} exIdx={run.indices[0]} logs={logs}
                  history={historyByNom[exercices[run.indices[0]].nom] ?? {}} prBadge={!!prByNom[exercices[run.indices[0]].nom]}
                  extra={extraSets[run.indices[0]] ?? 0} onToggle={onToggle} onChange={onChange} onAddSet={onAddSet}/>
              )}

              {runIdx < runs.length - 1 ? (
                <button onClick={goNext}
                  className={`w-full py-3.5 rounded-2xl text-[0.7rem] font-bold tracking-[0.15em] uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                    complete ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black shadow-[0_4px_16px_-6px_rgba(201,168,76,0.6)] hover:-translate-y-0.5"
                             : "border border-[var(--t-border)] text-[var(--t-text-30)] hover:text-[var(--t-text-60)] hover:border-[var(--t-text-20)]"}`}>
                  Exercice suivant <span aria-hidden>→</span>
                </button>
              ) : complete ? (
                <p className="text-center text-[0.68rem] text-[#7eb8a0] tracking-wide py-1">Dernier exercice terminé — tu peux finir la séance ✓</p>
              ) : null}
            </div>
          );
        })()}
      </div>

      {rest && rest.left > 0 && (
        <div className="absolute left-0 right-0 bottom-0 px-4 pb-4 shrink-0 pointer-events-none">
          <div className="pointer-events-auto max-w-sm mx-auto border border-[#c9a84c]/30 bg-[var(--t-surface)] rounded-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="h-1.5 bg-[var(--t-track)]">
              <div className="h-full bg-gradient-to-r from-[#e2c97e] to-[#c9a84c] transition-all duration-1000 linear" style={{ width: `${Math.min((rest.left / rest.total) * 100, 100)}%` }}/>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex flex-col items-start">
                <span className="text-[0.62rem] tracking-[0.2em] uppercase text-[var(--t-text-30)]">Repos</span>
                <span style={{ fontFamily: "var(--font-bebas)" }} className="text-4xl text-[#c9a84c] tracking-wide leading-none mt-0.5">{fmtClock(rest.left)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setRest(r => r ? { ...r, left: Math.max(0, r.left - 15) } : r)}
                  className="w-9 h-9 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all text-sm font-medium">−15</button>
                <button onClick={() => setRest(r => r ? { left: r.left + 15, total: Math.max(r.total, r.left + 15) } : r)}
                  className="w-9 h-9 rounded-full border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] active:scale-90 transition-all text-sm font-medium">+15</button>
                <button onClick={() => setRest(null)}
                  className="text-[0.62rem] uppercase tracking-wider font-medium text-[var(--t-text-30)] hover:text-[var(--t-text-60)] transition-colors ml-1.5">Passer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

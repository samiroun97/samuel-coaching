"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { type ExerciceItem, type SetDetail, parseExercices, groupExerciceRuns, targetSetsFor } from "@/lib/exercices";
import { useWakeLock } from "@/lib/useWakeLock";
import { Select } from "@/components/Select";
import {
  estimate1RM, isNewRecord, parseRestSeconds,
  loadSeanceLogs, saveSetLog, deleteSetLog, loadExerciceHistory, type LastPerformance,
} from "@/lib/workoutLog";

type LiveSeance = { id: string; titre: string; exercices: string | null };
type SetLogState = { poids: string; reps: string; rir: string; done: boolean };

const numOr = (s: string): number | null => {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

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

// Stepper numérique tactile (Liftoff/Hevy-style) : +/- pour ajuster vite au poker/à la
// série suivante sans ouvrir le clavier, tap sur le nombre pour saisir une valeur précise.
function NumberStepper({ value, placeholder, step, onChange, accent }: {
  value: string; placeholder: string; step: number; onChange: (v: string) => void; accent?: boolean;
}) {
  const bump = (dir: 1 | -1) => {
    const n = numOr(value) ?? numOr(placeholder) ?? 0;
    const next = Math.max(0, Math.round((n + dir * step) * 100) / 100);
    onChange(String(next));
  };
  return (
    <div className={`flex items-center rounded-xl border overflow-hidden ${accent && value ? "border-[#c9a84c]/40 bg-[#c9a84c]/[0.06]" : "border-[var(--t-border)] bg-[var(--t-bg)]"}`}>
      <button type="button" onClick={() => bump(-1)} tabIndex={-1}
        className="w-7 h-9 shrink-0 flex items-center justify-center text-[var(--t-text-30)] hover:text-[var(--t-text-60)] active:bg-[var(--t-track)] transition-colors text-base leading-none">−</button>
      <input type="number" inputMode="decimal" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-center text-sm font-semibold py-2 text-[var(--t-text)] placeholder-[var(--t-text-20)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
      <button type="button" onClick={() => bump(1)} tabIndex={-1}
        className="w-7 h-9 shrink-0 flex items-center justify-center text-[var(--t-text-30)] hover:text-[var(--t-text-60)] active:bg-[var(--t-track)] transition-colors text-base leading-none">+</button>
    </div>
  );
}

function SetRow({ target, idx, log, prev, isExtra, onToggle, onChange, onCopyPrev }: {
  target: SetDetail; idx: number; log: SetLogState | undefined; prev: { poids: number | null; reps: number | null } | undefined;
  isExtra: boolean; onToggle: () => void; onChange: (field: "poids" | "reps" | "rir", val: string) => void; onCopyPrev: () => void;
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
      <NumberStepper value={log?.poids ?? ""} placeholder={target.poids || "kg"} step={2.5} onChange={v => onChange("poids", v)} accent/>
      <NumberStepper value={log?.reps ?? ""} placeholder={target.reps || "reps"} step={1} onChange={v => onChange("reps", v)}/>
      <Select value={log?.rir ?? ""} onChange={v => onChange("rir", v)} placeholder="RIR"
        options={[0, 1, 2, 3, 4].map(n => ({ value: String(n), label: `${n}${n === 4 ? "+" : ""}` }))}
        triggerClassName="bg-[var(--t-bg)] border border-[var(--t-border)] rounded-xl text-[0.65rem] text-[var(--t-text-40)] px-1 py-2 w-full justify-center"
        panelClassName="w-16"/>
      <button onClick={onToggle}
        className={`w-8 h-8 rounded-full border-2 shrink-0 flex items-center justify-center transition-all mx-auto active:scale-90 ${log?.done ? "bg-[#7eb8a0] border-[#7eb8a0] text-black" : "border-[var(--t-border)] text-transparent hover:border-[#7eb8a0]/50"}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
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
              <SetRow key={setIdx} target={row.target} idx={setIdx} isExtra={row.isExtra}
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

export function SeanceLive({ seance, clientId, onFinish, onClose }: {
  seance: LiveSeance; clientId: string; onFinish: () => void; onClose: () => void;
}) {
  const exercices = useMemo(() => parseExercices(seance.exercices), [seance.exercices]);
  const runs = useMemo(() => groupExerciceRuns(exercices), [exercices]);

  const [logs, setLogs] = useState<Record<string, SetLogState>>({});
  const [historyByNom, setHistoryByNom] = useState<Record<string, LastPerformance>>({});
  const [prByNom, setPrByNom] = useState<Record<string, boolean>>({});
  const [extraSets, setExtraSets] = useState<Record<number, number>>({});
  const [rest, setRest] = useState<{ left: number; total: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState<{ duration: string; volume: number; sets: number; prs: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
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
  const doneLogs = Object.values(logs).filter(l => l.done);
  const doneSets = doneLogs.length;
  const volume = doneLogs.reduce((s, l) => s + (numOr(l.poids) ?? 0) * (numOr(l.reps) ?? 0), 0);

  const onChange = (exIdx: number, setIdx: number, field: "poids" | "reps" | "rir", val: string) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base: SetLogState = prev[k] ?? { poids: "", reps: "", rir: "", done: false };
      return { ...prev, [k]: { ...base, [field]: val } };
    });
  };

  const onAddSet = (exIdx: number) => setExtraSets(prev => ({ ...prev, [exIdx]: (prev[exIdx] ?? 0) + 1 }));

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

    const est = estimate1RM(poidsNum, repsNum);
    if (isNewRecord(est, bestRef.current[ex.nom] ?? null)) {
      setPrByNom(prev => ({ ...prev, [ex.nom]: true }));
      bestRef.current[ex.nom] = est;
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
  };

  if (summary) {
    return (
      <div className="fixed inset-0 bg-[var(--t-bg)] z-50 flex flex-col overflow-y-auto">
        <div className="flex-1 px-6 py-10 max-w-md mx-auto w-full flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#7eb8a0]/10 border border-[#7eb8a0]/30 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7eb8a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
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
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 pb-28 max-w-lg mx-auto w-full">
        {!loaded ? (
          <p className="text-xs text-[var(--t-text-30)] text-center py-8">Chargement…</p>
        ) : runs.map(run =>
          run.groupId ? (
            <div key={`g-${run.indices[0]}`} className="border border-[#c9a84c]/25 bg-[#c9a84c]/[0.03] rounded-2xl p-3 flex flex-col gap-3">
              <p className="text-[0.62rem] tracking-[0.15em] uppercase text-[#c9a84c] font-medium px-1">{run.groupLabel || "Superset"}</p>
              {run.indices.map(exIdx => (
                <ExerciceLiveBlock key={exIdx} ex={exercices[exIdx]} exIdx={exIdx} logs={logs}
                  history={historyByNom[exercices[exIdx].nom] ?? {}} prBadge={!!prByNom[exercices[exIdx].nom]}
                  extra={extraSets[exIdx] ?? 0} onToggle={onToggle} onChange={onChange} onAddSet={onAddSet}/>
              ))}
            </div>
          ) : (
            <ExerciceLiveBlock key={run.indices[0]} ex={exercices[run.indices[0]]} exIdx={run.indices[0]} logs={logs}
              history={historyByNom[exercices[run.indices[0]].nom] ?? {}} prBadge={!!prByNom[exercices[run.indices[0]].nom]}
              extra={extraSets[run.indices[0]] ?? 0} onToggle={onToggle} onChange={onChange} onAddSet={onAddSet}/>
          )
        )}
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

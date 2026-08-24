"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { type ExerciceItem, type SetDetail, parseExercices, groupExerciceRuns, targetSetsFor } from "@/lib/exercices";
import { useWakeLock } from "@/lib/useWakeLock";
import { Select } from "@/components/Select";
import {
  estimate1RM, isNewRecord, parseRestSeconds,
  loadSeanceLogs, saveSetLog, deleteSetLog, loadBest1RM,
} from "@/lib/workoutLog";

type LiveSeance = { id: string; titre: string; exercices: string | null };
type SetLogState = { poids: string; reps: string; rir: string; done: boolean };

const numOr = (s: string): number | null => {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function SetRow({ target, idx, log, onToggle, onChange }: {
  target: SetDetail; idx: number; log: SetLogState | undefined;
  onToggle: () => void; onChange: (field: "poids" | "reps" | "rir", val: string) => void;
}) {
  const targetText = [target.reps, target.poids, target.repos ? `repos ${target.repos}` : "", target.rpe ? `RPE ${target.rpe}` : ""].filter(Boolean).join(" · ");
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${log?.done ? "border-[#7eb8a0]/40 bg-[#7eb8a0]/5" : "border-[var(--t-border)]"}`}>
      <button onClick={onToggle}
        className={`w-6 h-6 rounded-full border shrink-0 flex items-center justify-center transition-colors ${log?.done ? "bg-[#7eb8a0] border-[#7eb8a0] text-black" : "border-[var(--t-text-25)] text-transparent"}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
      </button>
      <span className="text-[0.6rem] text-[#c9a84c] font-bold shrink-0 w-5">S{idx + 1}</span>
      <input type="number" inputMode="decimal" placeholder={target.poids || "kg"} value={log?.poids ?? ""}
        onChange={e => onChange("poids", e.target.value)}
        className="w-16 bg-[var(--t-bg)] border border-[var(--t-border)] rounded-lg text-center text-xs py-1 text-[var(--t-text)] placeholder-[var(--t-text-20)] focus:outline-none focus:border-[#c9a84c]/40"/>
      <span className="text-[0.6rem] text-[var(--t-text-20)] shrink-0">×</span>
      <input type="number" inputMode="numeric" placeholder={target.reps || "reps"} value={log?.reps ?? ""}
        onChange={e => onChange("reps", e.target.value)}
        className="w-14 bg-[var(--t-bg)] border border-[var(--t-border)] rounded-lg text-center text-xs py-1 text-[var(--t-text)] placeholder-[var(--t-text-20)] focus:outline-none focus:border-[#c9a84c]/40"/>
      <Select value={log?.rir ?? ""} onChange={v => onChange("rir", v)} placeholder="RIR"
        options={[0, 1, 2, 3, 4].map(n => ({ value: String(n), label: `${n}${n === 4 ? "+" : ""}` }))}
        triggerClassName="bg-[var(--t-bg)] border border-[var(--t-border)] rounded-lg text-[0.6rem] text-[var(--t-text-40)] px-1.5 py-1.5 shrink-0 w-14"
        panelClassName="w-20"/>
      {targetText && <span className="text-[0.55rem] text-[var(--t-text-20)] truncate flex-1 text-right hidden sm:block">{targetText}</span>}
    </div>
  );
}

function ExerciceLiveBlock({ ex, exIdx, logs, prBadge, onToggle, onChange }: {
  ex: ExerciceItem; exIdx: number; logs: Record<string, SetLogState>; prBadge: boolean;
  onToggle: (exIdx: number, setIdx: number, target: SetDetail) => void;
  onChange: (exIdx: number, setIdx: number, field: "poids" | "reps" | "rir", val: string) => void;
}) {
  const sets = targetSetsFor(ex);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 px-1">
        <p className="text-xs text-[var(--t-text-70)] font-medium">{ex.nom}</p>
        {prBadge && <span className="text-[0.6rem] text-[#c9a84c]">🏆 Record</span>}
      </div>
      {sets.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {sets.map((target, setIdx) => (
            <SetRow key={setIdx} target={target} idx={setIdx} log={logs[`${exIdx}-${setIdx}`]}
              onToggle={() => onToggle(exIdx, setIdx, target)}
              onChange={(field, val) => onChange(exIdx, setIdx, field, val)}/>
          ))}
        </div>
      ) : ex.texteLibre ? (
        <p className="text-[0.68rem] text-[var(--t-text-50)] leading-relaxed whitespace-pre-wrap px-1">{ex.texteLibre}</p>
      ) : null}
      {ex.note && <p className="text-[0.65rem] text-[var(--t-text-35)] italic px-1">{ex.note}</p>}
    </div>
  );
}

export function SeanceLive({ seance, clientId, onFinish, onClose }: {
  seance: LiveSeance; clientId: string; onFinish: () => void; onClose: () => void;
}) {
  const exercices = useMemo(() => parseExercices(seance.exercices), [seance.exercices]);
  const runs = useMemo(() => groupExerciceRuns(exercices), [exercices]);

  const [logs, setLogs] = useState<Record<string, SetLogState>>({});
  const [bestByNom, setBestByNom] = useState<Record<string, number | null>>({});
  const [prByNom, setPrByNom] = useState<Record<string, boolean>>({});
  const [rest, setRest] = useState<{ left: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useWakeLock(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await loadSeanceLogs(seance.id);
      if (cancelled) return;
      const map: Record<string, SetLogState> = {};
      for (const l of existing) {
        map[`${l.exercice_index}-${l.set_index}`] = {
          poids: l.poids_reel != null ? String(l.poids_reel) : "",
          reps: l.reps_reel != null ? String(l.reps_reel) : "",
          rir: l.rir_reel != null ? String(l.rir_reel) : "",
          done: true,
        };
      }
      setLogs(map);

      const noms = [...new Set(exercices.map(e => e.nom).filter(Boolean))];
      const bests = await Promise.all(noms.map(nom => loadBest1RM(clientId, nom, seance.id)));
      if (cancelled) return;
      const byNom: Record<string, number | null> = {};
      noms.forEach((nom, i) => { byNom[nom] = bests[i]; });
      setBestByNom(byNom);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seance.id, clientId]);

  useEffect(() => {
    if (!rest || rest.left <= 0) return;
    const t = setTimeout(() => setRest(r => (r && r.left > 1 ? { left: r.left - 1 } : null)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const flatSets = useMemo(() => {
    const list: { exIdx: number; setIdx: number }[] = [];
    exercices.forEach((ex, exIdx) => targetSetsFor(ex).forEach((_, setIdx) => list.push({ exIdx, setIdx })));
    return list;
  }, [exercices]);
  const lastKey = flatSets.length ? `${flatSets[flatSets.length - 1].exIdx}-${flatSets[flatSets.length - 1].setIdx}` : null;

  const totalSets = flatSets.length;
  const doneSets = Object.values(logs).filter(l => l.done).length;

  const onChange = (exIdx: number, setIdx: number, field: "poids" | "reps" | "rir", val: string) => {
    const k = `${exIdx}-${setIdx}`;
    setLogs(prev => {
      const base: SetLogState = prev[k] ?? { poids: "", reps: "", rir: "", done: false };
      return { ...prev, [k]: { ...base, [field]: val } };
    });
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

    const est = estimate1RM(poidsNum, repsNum);
    if (isNewRecord(est, bestByNom[ex.nom] ?? null)) {
      setPrByNom(prev => ({ ...prev, [ex.nom]: true }));
      setBestByNom(prev => ({ ...prev, [ex.nom]: est }));
    }

    if (k !== lastKey) setRest({ left: parseRestSeconds(target.repos || ex.repos) });
  };

  const finish = async () => {
    setFinishing(true);
    await supabase.from("programme_seances").update({ completed_at: new Date().toISOString() }).eq("id", seance.id);
    setFinishing(false);
    onFinish();
  };

  return (
    <div className="fixed inset-0 bg-[var(--t-bg)] z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--t-border-soft)] shrink-0">
        <div className="min-w-0">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-lg tracking-wider text-[var(--t-text)] truncate">{seance.titre}</p>
          <p className="text-[0.65rem] text-[var(--t-text-30)] tracking-wider">{doneSets}/{totalSets} séries</p>
        </div>
        <button onClick={onClose} className="text-[var(--t-text-30)] hover:text-[var(--t-text)] transition-colors shrink-0 ml-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {rest && rest.left > 0 && (
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#c9a84c]/20 bg-[#c9a84c]/10 shrink-0">
          <span className="text-xs text-[#c9a84c] font-bold tracking-wider">Repos — {fmtClock(rest.left)}</span>
          <button onClick={() => setRest(null)} className="text-[0.6rem] uppercase tracking-wider text-[var(--t-text-30)] hover:text-[var(--t-text-60)] transition-colors">Passer →</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {!loaded ? (
          <p className="text-xs text-[var(--t-text-30)] text-center py-8">Chargement…</p>
        ) : runs.map(run =>
          run.groupId ? (
            <div key={`g-${run.indices[0]}`} className="border border-[#c9a84c]/25 bg-[#c9a84c]/[0.03] rounded-xl p-2.5 flex flex-col gap-3">
              <p className="text-[0.55rem] tracking-[0.15em] uppercase text-[#c9a84c] px-1">{run.groupLabel || "Superset"}</p>
              {run.indices.map(exIdx => (
                <ExerciceLiveBlock key={exIdx} ex={exercices[exIdx]} exIdx={exIdx} logs={logs}
                  prBadge={!!prByNom[exercices[exIdx].nom]} onToggle={onToggle} onChange={onChange}/>
              ))}
            </div>
          ) : (
            <ExerciceLiveBlock key={run.indices[0]} ex={exercices[run.indices[0]]} exIdx={run.indices[0]} logs={logs}
              prBadge={!!prByNom[exercices[run.indices[0]].nom]} onToggle={onToggle} onChange={onChange}/>
          )
        )}
      </div>

      <div className="px-5 py-4 border-t border-[var(--t-border-soft)] shrink-0">
        <button onClick={finish} disabled={finishing}
          className="w-full py-3 rounded-xl text-xs font-bold tracking-[0.15em] uppercase bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black shadow-[0_4px_16px_-6px_rgba(201,168,76,0.6)] hover:shadow-[0_6px_20px_-4px_rgba(201,168,76,0.8)] transition-all disabled:opacity-50">
          {finishing ? "…" : "Terminer la séance →"}
        </button>
      </div>
    </div>
  );
}

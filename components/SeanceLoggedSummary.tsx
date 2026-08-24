"use client";
import { useEffect, useState } from "react";
import { type ExerciceItem, parseExercices, groupExerciceRuns, targetSetsFor } from "@/lib/exercices";
import {
  type SeanceLogRow, loadSeanceLogs, computeExercicePRs, evaluateSet,
} from "@/lib/workoutLog";

const OUTCOME_STYLE: Record<string, string> = {
  hit: "text-[#7eb8a0]",
  under: "text-[#d99a58]",
  unlogged: "text-[var(--t-text-20)]",
};

function LoggedSetLine({ target, log, outcome }: {
  target: { reps: string; poids: string }; log: SeanceLogRow | undefined; outcome: string;
}) {
  const targetText = [target.reps, target.poids].filter(Boolean).join(" · ");
  return (
    <div className="flex items-center gap-2 text-[0.65rem]">
      <span className="text-[var(--t-text-20)] w-24 shrink-0 truncate">{targetText || "—"}</span>
      <span className={`${OUTCOME_STYLE[outcome]} font-medium`}>
        {log
          ? [log.reps_reel != null ? `${log.reps_reel} reps` : null, log.poids_reel != null ? `${log.poids_reel} kg` : null, log.rir_reel != null ? `RIR ${log.rir_reel}` : null]
              .filter(Boolean).join(" · ") || "coché"
          : "non loggué"}
      </span>
    </div>
  );
}

function ExerciceLoggedBlock({ ex, exIdx, logsByKey, pr }: {
  ex: ExerciceItem; exIdx: number; logsByKey: Map<string, SeanceLogRow>;
  pr: { sessionBest1RM: number | null; isPR: boolean } | undefined;
}) {
  const sets = targetSetsFor(ex);
  if (sets.length === 0) return null;
  return (
    <div className="rounded-xl border border-[var(--t-border-soft)] bg-[var(--t-bg)] px-3 py-2.5 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <p className="text-xs text-[var(--t-text-70)] font-medium">{ex.nom}</p>
        {pr?.isPR && <span className="text-[0.6rem] text-[#c9a84c]">🏆 Record — {pr.sessionBest1RM?.toFixed(1)} kg 1RM est.</span>}
      </div>
      {sets.map((target, setIdx) => {
        const log = logsByKey.get(`${exIdx}-${setIdx}`);
        return <LoggedSetLine key={setIdx} target={target} log={log} outcome={evaluateSet(target.reps, log)}/>;
      })}
    </div>
  );
}

// Ce que le client a réellement soulevé pendant une séance, en regard de la cible écrite par
// le coach — jusqu'ici invisible côté CRM une fois la séance cochée "terminée". Lecture seule.
export function SeanceLoggedSummary({ seanceId, clientId, exercicesRaw }: {
  seanceId: string; clientId: string; exercicesRaw: string | null;
}) {
  const [logs, setLogs]     = useState<SeanceLogRow[] | null>(null);
  const [prs, setPrs]       = useState<Record<string, { sessionBest1RM: number | null; isPR: boolean }>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await loadSeanceLogs(seanceId);
      if (cancelled) return;
      setLogs(rows);
      if (rows.length > 0) {
        const map = await computeExercicePRs(clientId, seanceId, rows);
        if (!cancelled) setPrs(map);
      }
    })();
    return () => { cancelled = true; };
  }, [seanceId, clientId]);

  if (logs === null) return <p className="text-[0.65rem] text-[var(--t-text-20)]">Chargement du réalisé…</p>;
  if (logs.length === 0) return <p className="text-[0.65rem] text-[var(--t-text-20)] italic">Le client n&apos;a rien loggué série par série pour cette séance.</p>;

  const exercices = parseExercices(exercicesRaw);
  const runs = groupExerciceRuns(exercices);
  const logsByKey = new Map(logs.map(l => [`${l.exercice_index}-${l.set_index}`, l]));
  const totalSets = exercices.reduce((n, ex) => n + targetSetsFor(ex).length, 0);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.55rem] tracking-[0.15em] uppercase text-[var(--t-text-30)]">Réalisé par le client — {logs.length}/{totalSets} séries</p>
      {runs.map(run =>
        run.groupId ? (
          <div key={`g-${run.indices[0]}`} className="flex flex-col gap-1.5">
            {run.indices.map(exIdx => (
              <ExerciceLoggedBlock key={exIdx} ex={exercices[exIdx]} exIdx={exIdx} logsByKey={logsByKey} pr={prs[exercices[exIdx].nom]}/>
            ))}
          </div>
        ) : (
          <ExerciceLoggedBlock key={run.indices[0]} ex={exercices[run.indices[0]]} exIdx={run.indices[0]} logsByKey={logsByKey} pr={prs[exercices[run.indices[0]].nom]}/>
        )
      )}
    </div>
  );
}

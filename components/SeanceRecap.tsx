"use client";
// Bilan d'une séance terminée — remplace SeanceBody/ExerciceCard (pensés pour prévisualiser
// une séance PLANIFIÉE) dans la liste "Mon programme" une fois la séance loguée : les
// exercices ajoutés en direct restent en mode "simple" avec juste series:"1", SeanceBody
// n'avait donc rien de réel à montrer pour eux. Ici on lit directement seance_logs (ce qui
// a été réellement fait) plutôt que la cible planifiée dans `exercices`.
import { useEffect, useState } from "react";
import { type RepKind, REP_KIND_SUFFIX, parseExercices, groupExerciceRuns } from "@/lib/exercices";
import { loadSeanceLogs, computeExercicePRs } from "@/lib/workoutLog";
import { analyzeSeance, type SeanceAnalysis } from "@/lib/seanceAnalysis";
import { SeanceBody, type PreviewSeance } from "@/components/SeancePreview";

function fmtSet(poids: number | null, reps: number | null, rir: number | null, repKind: RepKind) {
  const parts: string[] = [];
  if (repKind === "reps") {
    if (poids != null) parts.push(`${poids}kg`);
    if (reps != null) parts.push(`× ${reps}`);
  } else {
    if (reps != null) parts.push(`${reps}${REP_KIND_SUFFIX[repKind]}`);
    if (poids) parts.push(`${poids}kg`);
  }
  if (rir != null) parts.push(`RIR ${rir}`);
  return parts.length ? parts.join(" · ") : "—";
}

export function SeanceRecap({ seance, clientId, clientBodyweight }: {
  seance: PreviewSeance & { id: string }; clientId: string; clientBodyweight: number | null;
}) {
  const [analysis, setAnalysis] = useState<SeanceAnalysis | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const logs = await loadSeanceLogs(seance.id);
      if (cancelled) return;
      // "Marquer comme terminée sans logger" -> aucune ligne seance_logs : rien à
      // analyser, on retombe sur l'ancien rendu plutôt qu'un bloc vide qui a l'air cassé.
      if (!logs.length) { setLoaded(true); return; }
      const exercices = parseExercices(seance.exercices);
      const prs = await computeExercicePRs(clientId, seance.id, logs);
      if (cancelled) return;
      const prCountByNom: Record<string, boolean> = {};
      for (const [nom, v] of Object.entries(prs)) prCountByNom[nom] = v.isPR;
      setAnalysis(analyzeSeance(exercices, logs, clientBodyweight, prCountByNom));
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [seance.id, seance.exercices, clientId, clientBodyweight]);

  if (!loaded) return <p className="text-xs text-[var(--t-text-30)] text-center py-6">Chargement…</p>;
  if (!analysis) return <SeanceBody s={seance}/>;

  const runs = groupExerciceRuns(parseExercices(seance.exercices));
  const byIdx = new Map(analysis.perExercice.map(pe => [pe.exIdx, pe]));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="border border-[var(--t-border-soft)] bg-[var(--t-bg)] rounded-xl py-3.5 px-2 text-center">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[#c9a84c] tracking-wide leading-none">{Math.round(analysis.volume).toLocaleString("fr-FR")}</p>
          <p className="text-[0.58rem] tracking-[0.12em] uppercase text-[var(--t-text-30)] mt-1.5">Volume kg</p>
        </div>
        <div className="border border-[var(--t-border-soft)] bg-[var(--t-bg)] rounded-xl py-3.5 px-2 text-center">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">
            {analysis.totalLogged}{analysis.totalPlanned > analysis.totalLogged ? `/${analysis.totalPlanned}` : ""}
          </p>
          <p className="text-[0.58rem] tracking-[0.12em] uppercase text-[var(--t-text-30)] mt-1.5">Séries</p>
        </div>
        <div className="border border-[var(--t-border-soft)] bg-[var(--t-bg)] rounded-xl py-3.5 px-2 text-center">
          <p style={{ fontFamily: "var(--font-bebas)" }} className="text-2xl text-[var(--t-text)] tracking-wide leading-none">{analysis.avgRir != null ? analysis.avgRir.toFixed(1) : "—"}</p>
          <p className="text-[0.58rem] tracking-[0.12em] uppercase text-[var(--t-text-30)] mt-1.5">RIR moyen</p>
        </div>
      </div>

      {(analysis.points.forts.length > 0 || analysis.points.aAmeliorer.length > 0) && (
        <div className="flex flex-col gap-2">
          {analysis.points.forts.map((p, i) => (
            <p key={`f${i}`} className="text-[0.72rem] text-[var(--t-text-60)] leading-relaxed flex items-start gap-2">
              <span className="text-[#c9a84c] shrink-0 font-bold">✓</span>{p}
            </p>
          ))}
          {analysis.points.aAmeliorer.map((p, i) => (
            <p key={`a${i}`} className="text-[0.72rem] text-[var(--t-text-60)] leading-relaxed flex items-start gap-2">
              <span className="text-[#e0834a] shrink-0 font-bold">⚠</span>{p}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {runs.map(run => {
          const entries = run.indices.map(i => byIdx.get(i)).filter((pe): pe is NonNullable<typeof pe> => !!pe);
          if (!entries.length) return null;
          const body = entries.map(pe => (
            <div key={pe.exIdx} className="border border-[var(--t-border-soft)] bg-[var(--t-glass-bg)] rounded-xl px-3 py-2.5">
              <p className="text-xs text-[var(--t-text-70)] font-medium flex items-center gap-1.5">
                {pe.nom}{pe.isPR && <span className="text-[#c9a84c]" title="Nouveau record">🏆</span>}
              </p>
              <div className="flex flex-col gap-0.5 mt-1.5">
                {pe.sets.map(s => (
                  <p key={s.setIdx} className="text-[0.68rem] text-[var(--t-text-40)]">
                    <span className="text-[#c9a84c] font-bold">Série {s.setIdx + 1}</span> — {fmtSet(s.poids, s.reps, s.rir, pe.repKind)}
                  </p>
                ))}
              </div>
            </div>
          ));
          return run.groupId ? (
            <div key={`g-${run.indices[0]}`} className="border border-[#c9a84c]/25 bg-[#c9a84c]/[0.03] rounded-xl p-2 flex flex-col gap-2">
              <p className="text-[0.55rem] tracking-[0.15em] uppercase text-[#c9a84c] px-1">{run.groupLabel || "Superset"}</p>
              {body}
            </div>
          ) : body[0];
        })}
      </div>
    </div>
  );
}

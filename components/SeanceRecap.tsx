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
import { RichIcon } from "@/components/RichIcon";
import { Icon } from "@/components/Icon";
import { Star } from "@/lib/solarIcons";

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

function PointRow({ kind, text }: { kind: "fort" | "aAmeliorer"; text: string }) {
  const fort = kind === "fort";
  return (
    <div className="flex items-start gap-2.5">
      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold mt-0.5 ${
        fort ? "bg-[#c9a84c]/15 text-[#c9a84c]" : "bg-[#e0834a]/15 text-[#e0834a]"}`}>
        {fort ? "✓" : "!"}
      </span>
      <p className="text-[0.72rem] text-[var(--t-text-60)] leading-relaxed pt-0.5">{text}</p>
    </div>
  );
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
  const pct = analysis.totalPlanned > 0 ? Math.min(100, Math.round((analysis.totalLogged / analysis.totalPlanned) * 100)) : null;
  const ringColor = pct === 100 ? "#7eb8a0" : "#c9a84c";
  const r = 42, circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-[#c9a84c]/20 bg-[var(--t-surface-gold)] rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3.5">
          {pct != null ? (
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r={r} fill="none" stroke="var(--t-track)" strokeWidth="10"/>
                <circle cx="50" cy="50" r={r} fill="none" stroke={ringColor} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .6s ease" }}/>
              </svg>
              <span style={{ fontFamily: "var(--font-bebas)", color: ringColor }} className="text-lg tracking-wide leading-none">{pct}%</span>
            </div>
          ) : (
            <RichIcon name="clipboardCheck" size={52} className="shrink-0 drop-shadow-[0_4px_10px_rgba(201,168,76,0.3)]"/>
          )}
          <div className="min-w-0">
            <p className="text-[0.62rem] tracking-[0.2em] uppercase text-[#c9a84c]">Bilan de séance</p>
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-[var(--t-text)] tracking-wide leading-tight mt-0.5">
              {pct != null ? `${analysis.totalLogged}/${analysis.totalPlanned} séries complétées` : "Séance loguée"}
            </p>
          </div>
        </div>

        <div className="flex divide-x divide-[#c9a84c]/15 border-t border-[#c9a84c]/15 pt-3.5">
          <div className="flex-1 text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-[#c9a84c] tracking-wide leading-none">{Math.round(analysis.volume).toLocaleString("fr-FR")}</p>
            <p className="text-[0.56rem] tracking-[0.1em] uppercase text-[var(--t-text-30)] mt-1">Volume kg</p>
          </div>
          <div className="flex-1 text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-[var(--t-text)] tracking-wide leading-none">{analysis.totalLogged}</p>
            <p className="text-[0.56rem] tracking-[0.1em] uppercase text-[var(--t-text-30)] mt-1">Séries</p>
          </div>
          <div className="flex-1 text-center">
            <p style={{ fontFamily: "var(--font-bebas)" }} className="text-xl text-[var(--t-text)] tracking-wide leading-none">{analysis.avgRir != null ? analysis.avgRir.toFixed(1) : "—"}</p>
            <p className="text-[0.56rem] tracking-[0.1em] uppercase text-[var(--t-text-30)] mt-1">RIR moyen</p>
          </div>
        </div>

        {(analysis.points.forts.length > 0 || analysis.points.aAmeliorer.length > 0) && (
          <div className="flex flex-col gap-2 border-t border-[#c9a84c]/15 pt-3.5">
            {analysis.points.forts.map((p, i) => <PointRow key={`f${i}`} kind="fort" text={p}/>)}
            {analysis.points.aAmeliorer.map((p, i) => <PointRow key={`a${i}`} kind="aAmeliorer" text={p}/>)}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {runs.map(run => {
          const entries = run.indices.map(i => byIdx.get(i)).filter((pe): pe is NonNullable<typeof pe> => !!pe);
          if (!entries.length) return null;
          const body = entries.map(pe => (
            <div key={pe.exIdx} className="border border-[var(--t-border-soft)] bg-[var(--t-glass-bg)] rounded-xl px-3 py-2.5">
              <p className="text-xs text-[var(--t-text-70)] font-medium flex items-center gap-1.5">
                {pe.nom}{pe.isPR && (
                  <span className="shrink-0 w-4 h-4 rounded-full bg-[#c9a84c]/15 text-[#c9a84c] flex items-center justify-center" title="Nouveau record">
                    <Icon icon={Star} size={9}/>
                  </span>
                )}
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

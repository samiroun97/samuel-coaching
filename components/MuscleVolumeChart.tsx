import { Sparkline } from "@/components/Sparkline";
import { MUSCLE_VOLUME_WEEKS } from "@/lib/muscleVolume";

// Barres horizontales du volume total par groupe musculaire sur les dernières semaines —
// pour repérer un déséquilibre (ex: push sur-travaillé vs pull sous-travaillé) d'un coup d'œil,
// plus une mini-courbe et une tendance semaine vs semaine (les deux dérivées du même tableau
// hebdomadaire déjà calculé par lib/muscleVolume.ts, qui était jusque-là réduit à un simple total).
const PALETTE = ["#c9a84c", "#7eb8a0", "#d98c6b", "#6ea8d9", "#c97ea0", "#a8c97e", "#e0b070", "#8ec9c0", "#c98ea0", "#e2c97e"];

const muscleLabel = (m: string) => m.charAt(0).toUpperCase() + m.slice(1);

function TrendBadge({ weekly }: { weekly: number[] }) {
  const last = weekly[weekly.length - 1] ?? 0;
  const prev = weekly[weekly.length - 2] ?? 0;
  if (prev <= 0) return null;
  const pct = Math.round(((last - prev) / prev) * 100);
  if (Math.abs(pct) < 5) return <span className="text-[0.58rem] text-[var(--t-text-20)] tabular-nums">→ stable</span>;
  const up = pct > 0;
  return (
    <span className={`text-[0.58rem] tabular-nums ${up ? "text-[#7eb8a0]" : "text-[#e07070]"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% vs sem. dern.
    </span>
  );
}

export function MuscleVolumeChart({ byMuscle, weeks = MUSCLE_VOLUME_WEEKS }: { byMuscle: Record<string, number[]>; weeks?: number }) {
  const totals = Object.entries(byMuscle)
    .map(([muscle, w]) => ({ muscle, weekly: w, total: w.reduce((s, v) => s + v, 0) }))
    .filter(t => t.total > 0)
    .sort((a, b) => b.total - a.total);

  if (totals.length === 0) return null;
  const max = totals[0].total;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-30)]">Volume par muscle</p>
        <p className="text-[0.58rem] text-[var(--t-text-25)]">{weeks} dern. sem.</p>
      </div>
      <div className="flex flex-col gap-3">
        {totals.map((t, i) => (
          <div key={t.muscle} className="flex items-center gap-2">
            <span className="w-[5.5rem] shrink-0 text-[0.6rem] text-[var(--t-text-50)] truncate">{muscleLabel(t.muscle)}</span>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <div className="h-2.5 bg-[var(--t-track)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, (t.total / max) * 100)}%`, backgroundColor: PALETTE[i % PALETTE.length] }}/>
              </div>
              <TrendBadge weekly={t.weekly}/>
            </div>
            <div className="w-14 h-6 shrink-0">
              <Sparkline points={t.weekly} color={PALETTE[i % PALETTE.length]}/>
            </div>
            <span className="w-16 shrink-0 text-right text-[0.58rem] text-[var(--t-text-30)] tabular-nums">
              {Math.round(t.total).toLocaleString("fr-FR")} kg
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

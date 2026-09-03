"use client";
import type { DayStatus } from "@/lib/consistency";
import { Icon } from "@/components/Icon";
import { Flame } from "@/lib/solarIcons";

// Calendrier de régularité façon GitHub contributions : une colonne par semaine, une ligne par
// jour. Croise nutrition (calories/macros vs objectif du jour) et entraînement — voir
// lib/consistency.ts pour la logique de statut. Purement visuel/motivant, aucune interaction
// requise.
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const STATUS_COLOR: Record<DayStatus, string> = {
  empty:     "bg-[var(--t-track)]",
  off:       "bg-[#e07070]",
  ok:        "bg-[#7eb8a0]",
  exemplary: "bg-[#6ea8d9]",
};
const STATUS_LABEL: Record<DayStatus, string> = {
  empty:     "Rien loggé",
  off:       "Objectif non respecté",
  ok:        "Objectif atteint",
  exemplary: "Séance + objectif atteints",
};
const LEGEND: { status: DayStatus; label: string }[] = [
  { status: "ok",        label: "Atteint" },
  { status: "off",       label: "Non respecté" },
  { status: "empty",     label: "Rien loggé" },
  { status: "exemplary", label: "Exemplaire" },
];

const toISO = (d: Date) => d.toISOString().split("T")[0];
const mondayOf = (d: Date) => { const n = new Date(d); const day = (n.getDay() + 6) % 7; n.setDate(n.getDate() - day); n.setHours(0, 0, 0, 0); return n; };

function FlameIcon({ className }: { className?: string }) {
  return <Icon icon={Flame} fill="currentColor" stroke="none" className={className}/>;
}

export function ConsistencyHeatmap({ statuses, weeks = 12 }: { statuses: Record<string, DayStatus>; weeks?: number }) {
  const todayISO = toISO(new Date());
  const firstMonday = mondayOf(new Date());
  firstMonday.setDate(firstMonday.getDate() - (weeks - 1) * 7);

  const cols = Array.from({ length: weeks }, (_, w) => {
    const weekStart = new Date(firstMonday);
    weekStart.setDate(weekStart.getDate() + w * 7);
    return Array.from({ length: 7 }, (_, d) => { const day = new Date(weekStart); day.setDate(day.getDate() + d); return day; });
  });

  // Étiquette de mois au-dessus de la première colonne où le mois change, pour se repérer
  // sans devoir survoler chaque case.
  let lastMonth = -1;
  const monthLabels = cols.map(col => {
    const m = col[0].getMonth();
    if (m === lastMonth) return "";
    lastMonth = m;
    return col[0].toLocaleDateString("fr-FR", { month: "short" });
  });

  const successCount = Object.values(statuses).filter(s => s === "ok" || s === "exemplary").length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-30)]">Régularité</p>
        <p className="text-[0.58rem] text-[var(--t-text-25)]">{successCount} jour{successCount > 1 ? "s" : ""} réussi{successCount > 1 ? "s" : ""} · {weeks} sem.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] shrink-0 pt-3.5">
          {DAY_LABELS.map((l, i) => (
            <span key={i} className="w-[14px] h-[14px] text-[0.4rem] leading-[14px] text-[var(--t-text-15)]">{i % 2 === 1 ? l : ""}</span>
          ))}
        </div>
        {cols.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-[3px] shrink-0">
            <span className="text-[0.4rem] text-[var(--t-text-20)] tracking-wide h-3 block whitespace-nowrap">{monthLabels[wi]}</span>
            {col.map((day, di) => {
              const iso = toISO(day);
              const status = statuses[iso] ?? "empty";
              const isFuture = iso > todayISO;
              return (
                <div key={di}
                  title={`${day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${isFuture ? "" : ` — ${STATUS_LABEL[status]}`}`}
                  className={`relative w-[14px] h-[14px] rounded-[3px] ${isFuture ? "opacity-0" : STATUS_COLOR[status]}`}>
                  {!isFuture && status === "exemplary" && (
                    <FlameIcon className="absolute inset-0 w-[9px] h-[9px] m-auto text-white"/>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
        {LEGEND.map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`relative w-[10px] h-[10px] rounded-[2px] shrink-0 ${STATUS_COLOR[status]}`}>
              {status === "exemplary" && <FlameIcon className="absolute inset-0 w-[7px] h-[7px] m-auto text-white"/>}
            </div>
            <span className="text-[0.55rem] text-[var(--t-text-30)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

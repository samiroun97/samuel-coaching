"use client";
// Heatmap de régularité façon GitHub contributions (vu chez Lyftr) : une colonne par semaine,
// une ligne par jour, coloré si une séance a été terminée ce jour-là. Purement visuel/motivant,
// aucune interaction requise — les données viennent de lib/consistency.ts.
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const toISO = (d: Date) => d.toISOString().split("T")[0];
const mondayOf = (d: Date) => { const n = new Date(d); const day = (n.getDay() + 6) % 7; n.setDate(n.getDate() - day); n.setHours(0, 0, 0, 0); return n; };

export function ConsistencyHeatmap({ dates, weeks = 12 }: { dates: Set<string>; weeks?: number }) {
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

  const trainedCount = [...dates].filter(d => d >= toISO(firstMonday)).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-30)]">Régularité</p>
        <p className="text-[0.58rem] text-[var(--t-text-25)]">{trainedCount} séance{trainedCount > 1 ? "s" : ""} · {weeks} sem.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] shrink-0 pt-3.5">
          {DAY_LABELS.map((l, i) => (
            <span key={i} className="w-[10px] h-[10px] text-[0.4rem] leading-[10px] text-[var(--t-text-15)]">{i % 2 === 1 ? l : ""}</span>
          ))}
        </div>
        {cols.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-[3px] shrink-0">
            <span className="text-[0.4rem] text-[var(--t-text-20)] tracking-wide h-3 block whitespace-nowrap">{monthLabels[wi]}</span>
            {col.map((day, di) => {
              const iso = toISO(day);
              const trained = dates.has(iso);
              const isFuture = iso > todayISO;
              return (
                <div key={di} title={`${day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${trained ? " — séance ✓" : ""}`}
                  className={`w-[10px] h-[10px] rounded-[2px] ${isFuture ? "opacity-0" : trained ? "bg-[#7eb8a0]" : "bg-[var(--t-track)]"}`}/>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

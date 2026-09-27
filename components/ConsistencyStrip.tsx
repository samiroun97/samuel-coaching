"use client";
import { STATUS_COLOR, STATUS_LABEL, STATUS_LEGEND, type DayStatus } from "@/lib/consistency";

// Frise de régularité compacte façon "contributions GitHub" : une colonne par semaine
// (lundi en haut), les N dernières semaines jusqu'à aujourd'hui. Remplace le grand
// calendrier mensuel dans la vue d'ensemble client du CRM, où il prenait tout l'écran —
// ConsistencyHeatmap reste disponible pour une vue mois détaillée.
const WEEKDAYS = ["L", "", "M", "", "V", "", "D"];

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function ConsistencyStrip({ statuses, weeks = 16 }: { statuses: Record<string, DayStatus>; weeks?: number }) {
  const today = new Date();
  const todayISO = toISO(today);
  // Lundi de la semaine courante, puis on recule de (weeks - 1) semaines.
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (weeks - 1) * 7);

  const columns: Date[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      col.push(day);
    }
    columns.push(col);
  }

  // Libellé de mois au-dessus de la première semaine qui le contient.
  const monthLabels = columns.map((col, i) => {
    const m = col[0].getMonth();
    return i === 0 || columns[i - 1][0].getMonth() !== m
      ? col[0].toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")
      : "";
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] pt-4 pr-1 shrink-0">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="h-3.5 text-[0.5rem] leading-[0.875rem] text-[var(--t-text-25)]">{w}</div>
          ))}
        </div>
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px] shrink-0">
            <div className="h-4 text-[0.5rem] text-[var(--t-text-30)] capitalize whitespace-nowrap">{monthLabels[i]}</div>
            {col.map(d => {
              const iso = toISO(d);
              const isFuture = iso > todayISO;
              const status = statuses[iso] ?? "empty";
              return (
                <div key={iso}
                  title={isFuture ? "" : `${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} — ${STATUS_LABEL[status]}`}
                  className={`w-3.5 h-3.5 rounded-[3px] ${isFuture ? "opacity-0" : STATUS_COLOR[status]} ${iso === todayISO ? "ring-1 ring-[#c9a84c] ring-offset-1 ring-offset-[var(--t-bg)]" : ""}`}/>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {STATUS_LEGEND.map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-[2px] ${STATUS_COLOR[status]}`}/>
            <span className="text-[0.55rem] text-[var(--t-text-30)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";

type PlanningSeance = { id: string; titre: string; type_seance: string | null; date_prevue: string | null; completed_at: string | null };

const TYPE_COLOR: Record<string, string> = {
  "Haut du corps": "#c9a84c",
  "Bas du corps": "#7eb8a0",
  "Full body": "#e0834a",
  "Cardio": "#6fa8d8",
  "Boxe": "#e07070",
  "Natation": "#4fb8c4",
  "CrossFit": "#a08ec9",
  "Yoga": "#7eb8a0",
};
const DEFAULT_COLOR = "#9a9a9a";
const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const mondayOf = (d: Date) => { const n = new Date(d); const day = (n.getDay() + 6) % 7; n.setDate(n.getDate() - day); n.setHours(0, 0, 0, 0); return n; };
const toISO = (d: Date) => d.toISOString().split("T")[0];

// Vue semaine (façon Wingfit) : les séances planifiées de la semaine en cours, une colonne
// par jour, blocs colorés par type_seance — complément visuel à la liste, qui reste la vue
// par défaut. N'affiche que les séances avec une date_prevue ; celles sans date restent
// consultables uniquement dans la liste.
export function WeekPlanning({ seances, onOpen }: { seances: PlanningSeance[]; onOpen: (id: string) => void }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const byDay = new Map<string, PlanningSeance[]>();
  for (const s of seances) {
    if (!s.date_prevue) continue;
    (byDay.get(s.date_prevue) ?? byDay.set(s.date_prevue, []).get(s.date_prevue)!).push(s);
  }
  const todayISO = toISO(new Date());

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
          className="w-7 h-7 rounded-lg border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors flex items-center justify-center">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <p className="text-[0.62rem] tracking-[0.1em] uppercase text-[var(--t-text-40)]">
          {days[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — {days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </p>
        <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
          className="w-7 h-7 rounded-lg border border-[var(--t-border)] text-[var(--t-text-40)] hover:text-[var(--t-text-70)] transition-colors flex items-center justify-center">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const dayItems = byDay.get(iso) ?? [];
          return (
            <div key={iso} className="flex flex-col gap-1 min-w-0">
              <p className={`text-[0.55rem] tracking-wider uppercase text-center ${isToday ? "text-[#c9a84c] font-bold" : "text-[var(--t-text-25)]"}`}>
                {DAY_LABELS[i]} {d.getDate()}
              </p>
              <div className="flex flex-col gap-1 min-h-[2rem]">
                {dayItems.map(s => {
                  const color = TYPE_COLOR[s.type_seance ?? ""] ?? DEFAULT_COLOR;
                  return (
                    <button key={s.id} onClick={() => onOpen(s.id)} title={s.titre}
                      className="rounded-md px-1 py-1 text-left transition-transform hover:-translate-y-0.5"
                      style={{ backgroundColor: `${color}20`, borderLeft: `2px solid ${color}` }}>
                      <p className="text-[0.52rem] leading-tight truncate" style={{ color }}>
                        {s.completed_at && "✓ "}{s.titre}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

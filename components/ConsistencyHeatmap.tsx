"use client";
import { useState } from "react";
import type { DayStatus } from "@/lib/consistency";
import { Icon } from "@/components/Icon";
import { Flame, ChevronLeft, ChevronRight } from "@/lib/solarIcons";

// Calendrier de régularité en vue mois classique (façon CalendarPicker) — cases grandes,
// numéro du jour affiché, navigable mois par mois. Croise nutrition (calories/macros vs
// objectif du jour) et entraînement — voir lib/consistency.ts pour la logique de statut.
const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const STATUS_COLOR: Record<DayStatus, string> = {
  empty:     "bg-[var(--t-track)]",
  off:       "bg-[#e07070]",
  ok:        "bg-[#7eb8a0]",
  exemplary: "bg-[#6ea8d9]",
};
const STATUS_TEXT: Record<DayStatus, string> = {
  empty:     "text-[var(--t-text-50)]",
  off:       "text-white",
  ok:        "text-white",
  exemplary: "text-white",
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

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function FlameIcon({ className }: { className?: string }) {
  return <Icon icon={Flame} fill="currentColor" stroke="none" className={className}/>;
}

export function ConsistencyHeatmap({ statuses }: { statuses: Record<string, DayStatus> }) {
  const today = new Date();
  const todayISO = toISO(today);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const go = (delta: number) => {
    let m = viewMonth + delta, y = viewYear;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    if (y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth())) return;
    setViewMonth(m); setViewYear(y);
  };

  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = (first.getDay() + 6) % 7; // lundi = colonne 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  const monthCount = cells.reduce((acc, d) => {
    if (!d) return acc;
    const s = statuses[toISO(d)];
    return acc + (s === "ok" || s === "exemplary" ? 1 : 0);
  }, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--t-text-30)]">Régularité</p>
        <p className="text-[0.58rem] text-[var(--t-text-25)]">{monthCount} jour{monthCount > 1 ? "s" : ""} réussi{monthCount > 1 ? "s" : ""} ce mois</p>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => go(-1)}
          className="w-8 h-8 rounded-full border border-[var(--t-border)] flex items-center justify-center text-[var(--t-text-50)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors">
          <Icon icon={ChevronLeft} size={13} strokeWidth={2}/>
        </button>
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-base tracking-[0.15em] uppercase text-[var(--t-text)]">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button type="button" onClick={() => go(1)} disabled={isCurrentMonth}
          className="w-8 h-8 rounded-full border border-[var(--t-border)] flex items-center justify-center text-[var(--t-text-50)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors disabled:opacity-20 disabled:pointer-events-none">
          <Icon icon={ChevronRight} size={13} strokeWidth={2}/>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-[0.6rem] tracking-wider uppercase text-[var(--t-text-25)] text-center py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i}/>;
          const iso = toISO(d);
          const status = statuses[iso] ?? "empty";
          const isFuture = iso > todayISO;
          const isToday = iso === todayISO;
          return (
            <div key={i}
              title={`${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${isFuture ? "" : ` — ${STATUS_LABEL[status]}`}`}
              className={`relative aspect-square rounded-xl flex items-center justify-center transition-colors ${isFuture ? "bg-[var(--t-track)]/30" : STATUS_COLOR[status]} ${isToday ? "ring-2 ring-[#c9a84c] ring-offset-2 ring-offset-[var(--t-surface)]" : ""}`}>
              <span className={`text-sm sm:text-base font-medium ${isFuture ? "text-[var(--t-text-20)]" : STATUS_TEXT[status]}`}>{d.getDate()}</span>
              {!isFuture && status === "exemplary" && (
                <FlameIcon className="absolute top-1 right-1 w-3 h-3 text-white/90"/>
              )}
            </div>
          );
        })}
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

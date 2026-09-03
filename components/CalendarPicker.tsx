"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronRight, Flame } from "@/lib/solarIcons";
import { STATUS_COLOR, STATUS_LABEL, STATUS_LEGEND, type DayStatus } from "@/lib/consistency";

function FlameIcon({ className }: { className?: string }) {
  return <Icon icon={Flame} fill="currentColor" stroke="none" className={className}/>;
}

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Mini calendrier dans la DA de l'app — remplace le picker natif du navigateur
// (non stylisable) pour les sélecteurs de date. À placer dans un conteneur
// `relative`, se ferme au clic extérieur / Échap / sélection.
export function CalendarPicker({
  value, onChange, onClose, min, max, statuses, className = "",
}: {
  value?: string | null;
  onChange: (iso: string) => void;
  onClose: () => void;
  min?: string;
  max?: string;
  // Statut de régularité (nutrition + entraînement) par jour — quand fourni, colore chaque
  // case du calendrier au lieu d'un tableau de régularité séparé. Voir lib/consistency.ts.
  statuses?: Record<string, DayStatus>;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const initial = value ? parseISO(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const minD = min ? parseISO(min) : null;
  const maxD = max ? parseISO(max) : null;
  const disabled = (d: Date) => !!((minD && d < minD) || (maxD && d > maxD));

  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = (first.getDay() + 6) % 7; // lundi = colonne 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  const today = new Date();
  const todayISO = toISO(today);
  const selISO = value || null;

  const go = (delta: number) => {
    let m = viewMonth + delta, y = viewYear;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setViewMonth(m); setViewYear(y);
  };

  // Calendrier agrandi quand il porte les couleurs de régularité (plus d'infos à lire) —
  // les autres usages (naissance, pesée…) gardent le format compact d'origine.
  const big = !!statuses;

  return (
    <div ref={ref}
      style={{ backgroundColor: "var(--t-surface)" }}
      className={`absolute z-[100] border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] ${big ? "p-5 w-[340px] sm:w-[380px]" : "p-4 w-[280px]"} ${className}`}>
      <div className={`flex items-center justify-between ${big ? "mb-4" : "mb-3"}`}>
        <button type="button" onClick={() => go(-1)} className={`${big ? "w-9 h-9" : "w-8 h-8"} rounded-full border border-[var(--t-border)] flex items-center justify-center text-[var(--t-text-50)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors`}>
          <Icon icon={ChevronLeft} size={big ? 15 : 13} strokeWidth={2}/>
        </button>
        <p style={{ fontFamily: "var(--font-bebas)" }} className={`${big ? "text-base" : "text-sm"} tracking-[0.15em] uppercase text-[var(--t-text)]`}>
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button type="button" onClick={() => go(1)} className={`${big ? "w-9 h-9" : "w-8 h-8"} rounded-full border border-[var(--t-border)] flex items-center justify-center text-[var(--t-text-50)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors`}>
          <Icon icon={ChevronRight} size={big ? 15 : 13} strokeWidth={2}/>
        </button>
      </div>

      <div className={`grid grid-cols-7 ${big ? "gap-1.5 mb-1.5" : "gap-1 mb-1"}`}>
        {WEEKDAYS.map(w => (
          <div key={w} className={`${big ? "text-[0.62rem]" : "text-[0.55rem]"} tracking-wider uppercase text-[var(--t-text-25)] text-center py-1`}>{w}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${big ? "gap-1.5" : "gap-1"}`}>
        {cells.map((d, i) => {
          if (!d) return <div key={i}/>;
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const isSel = iso === selISO;
          const isDisabled = disabled(d);
          const status = statuses && !isDisabled ? (statuses[iso] ?? "empty") : null;
          return (
            <button key={i} type="button" disabled={isDisabled}
              title={status ? STATUS_LABEL[status] : undefined}
              onClick={() => { onChange(iso); onClose(); }}
              className={`relative ${big ? "w-11 h-11 sm:w-12 sm:h-12 text-sm rounded-xl" : "w-9 h-9 text-xs rounded-full"} transition-colors flex items-center justify-center ${
                isDisabled ? "text-[var(--t-text-15)] cursor-not-allowed"
                : status ? `${STATUS_COLOR[status]} ${status === "empty" ? "text-[var(--t-text-50)]" : "text-white"} ${isSel ? "font-bold ring-2 ring-[#c9a84c]" : isToday ? "ring-2 ring-[var(--t-text)]/70" : ""}`
                : isSel ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black font-bold"
                : isToday ? "text-[#c9a84c] border border-[#c9a84c]/40 hover:bg-[#c9a84c]/10"
                : "text-[var(--t-text-70)] hover:bg-[var(--t-glass-bg)]"
              }`}>
              {d.getDate()}
              {status === "exemplary" && (
                <FlameIcon className={`absolute ${big ? "top-1 right-1 w-2.5 h-2.5" : "top-0.5 right-0.5 w-2 h-2"} text-white/90`}/>
              )}
            </button>
          );
        })}
      </div>

      {statuses && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-4 mt-1 border-t border-[var(--t-border-soft)]">
          {STATUS_LEGEND.map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`relative w-[11px] h-[11px] rounded-full shrink-0 ${STATUS_COLOR[status]}`}>
                {status === "exemplary" && <FlameIcon className="absolute inset-0 w-[7px] h-[7px] m-auto text-white"/>}
              </div>
              <span className="text-[0.62rem] text-[var(--t-text-30)]">{label}</span>
            </div>
          ))}
        </div>
      )}

      {!disabled(today) && (
        <button type="button" onClick={() => { onChange(todayISO); onClose(); }}
          className="mt-3 w-full text-center text-[0.6rem] tracking-[0.15em] uppercase text-[#c9a84c]/70 hover:text-[#c9a84c] transition-colors py-1.5 border-t border-[var(--t-border-soft)]">
          Aujourd&apos;hui
        </button>
      )}
    </div>
  );
}

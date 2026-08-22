"use client";
import { useEffect, useRef, useState } from "react";

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
  value, onChange, onClose, min, max, className = "",
}: {
  value?: string | null;
  onChange: (iso: string) => void;
  onClose: () => void;
  min?: string;
  max?: string;
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

  return (
    <div ref={ref}
      style={{ backgroundColor: "var(--t-surface)" }}
      className={`absolute z-[100] border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] p-4 w-[280px] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => go(-1)} className="w-8 h-8 rounded-full border border-[var(--t-border)] flex items-center justify-center text-[var(--t-text-50)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <p style={{ fontFamily: "var(--font-bebas)" }} className="text-sm tracking-[0.15em] uppercase text-[var(--t-text)]">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button type="button" onClick={() => go(1)} className="w-8 h-8 rounded-full border border-[var(--t-border)] flex items-center justify-center text-[var(--t-text-50)] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-[0.55rem] tracking-wider uppercase text-[var(--t-text-25)] text-center py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i}/>;
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const isSel = iso === selISO;
          const isDisabled = disabled(d);
          return (
            <button key={i} type="button" disabled={isDisabled}
              onClick={() => { onChange(iso); onClose(); }}
              className={`w-9 h-9 text-xs rounded-full transition-colors flex items-center justify-center ${
                isSel ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black font-bold"
                : isDisabled ? "text-[var(--t-text-15)] cursor-not-allowed"
                : isToday ? "text-[#c9a84c] border border-[#c9a84c]/40 hover:bg-[#c9a84c]/10"
                : "text-[var(--t-text-70)] hover:bg-[var(--t-glass-bg)]"
              }`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {!disabled(today) && (
        <button type="button" onClick={() => { onChange(todayISO); onClose(); }}
          className="mt-3 w-full text-center text-[0.6rem] tracking-[0.15em] uppercase text-[#c9a84c]/70 hover:text-[#c9a84c] transition-colors py-1.5 border-t border-[var(--t-border-soft)]">
          Aujourd'hui
        </button>
      )}
    </div>
  );
}

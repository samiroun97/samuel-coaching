"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronRight, Flame } from "@/lib/solarIcons";
import { STATUS_LABEL, STATUS_LEGEND, type DayStatus } from "@/lib/consistency";

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
      className={`absolute z-[100] border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] ${big ? "p-6 w-[390px] sm:w-[440px]" : "p-4 w-[280px]"} ${className}`}>
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

      <div className={`grid grid-cols-7 ${big ? "gap-3 mb-2" : "gap-1 mb-1"}`}>
        {WEEKDAYS.map(w => (
          <div key={w} className={`${big ? "text-[0.62rem]" : "text-[0.55rem]"} tracking-wider uppercase text-[var(--t-text-25)] text-center py-1`}>{w}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${big ? "gap-3" : "gap-1"}`}>
        {cells.map((d, i) => {
          if (!d) return <div key={i}/>;
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const isSel = iso === selISO;
          const isDisabled = disabled(d);
          const status = statuses && !isDisabled ? (statuses[iso] ?? "empty") : null;

          // Vue "flamme" façon Duolingo : bordure fine + numéro en coin, une flamme allumée
          // (orange/or) pour les jours réussis, éteinte (grise) sinon — plus lisible qu'une
          // case de couleur unie ou une simple coche.
          if (big) {
            return (
              <button key={i} type="button" disabled={isDisabled}
                title={status ? STATUS_LABEL[status] : undefined}
                onClick={() => { onChange(iso); onClose(); }}
                className={`relative w-full aspect-square rounded-lg border flex items-center justify-center transition-colors ${
                  isDisabled ? "border-[var(--t-border-soft)] cursor-not-allowed"
                  : isSel ? "border-[#c9a84c] bg-[#c9a84c]/10"
                  : isToday ? "border-[#c9a84c]/50"
                  : status === "off" ? "border-[#e07070]/30 hover:border-[#e07070]/50"
                  : "border-[var(--t-border)] hover:border-[var(--t-text-20)]"
                }`}>
                <span className={`absolute top-1.5 left-2 text-[0.62rem] leading-none ${isDisabled ? "text-[var(--t-text-15)]" : "text-[var(--t-text-30)]"}`}>
                  {d.getDate()}
                </span>
                {!isDisabled && status && (
                  <FlameIcon className={
                    status === "exemplary" ? "w-[22px] h-[22px] text-[#6ea8d9]"
                    : status === "ok" ? "w-5 h-5 text-[#e8a13c]"
                    : "w-5 h-5 text-[var(--t-text-15)]"
                  }/>
                )}
              </button>
            );
          }

          return (
            <button key={i} type="button" disabled={isDisabled}
              onClick={() => { onChange(iso); onClose(); }}
              className={`w-9 h-9 text-xs rounded-full transition-colors flex items-center justify-center ${
                isDisabled ? "text-[var(--t-text-15)] cursor-not-allowed"
                : isSel ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black font-bold"
                : isToday ? "text-[#c9a84c] border border-[#c9a84c]/40 hover:bg-[#c9a84c]/10"
                : "text-[var(--t-text-70)] hover:bg-[var(--t-glass-bg)]"
              }`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {statuses && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-4 mt-1 border-t border-[var(--t-border-soft)]">
          {STATUS_LEGEND.map(({ status, label }) => (
            <div key={status} className={`flex items-center gap-1.5 ${status === "off" ? "rounded border border-[#e07070]/30 px-1" : ""}`}>
              <FlameIcon className={
                status === "exemplary" ? "w-[13px] h-[13px] text-[#6ea8d9]"
                : status === "ok" ? "w-[11px] h-[11px] text-[#e8a13c]"
                : "w-[11px] h-[11px] text-[var(--t-text-15)]"
              }/>
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

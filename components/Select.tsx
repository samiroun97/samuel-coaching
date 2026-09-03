"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ChevronDown } from "@/lib/solarIcons";

export type SelectOption = { value: string; label: string };

// Remplace le <select> natif du navigateur : le champ lui-même peut être stylisé dans
// la DA de l'app, mais la liste déroulante qu'il ouvre reste imposée par l'OS/le
// navigateur (fond blanc, police système) — même limitation que CalendarPicker pour
// les dates. Se ferme au clic extérieur / Échap / sélection.
export function Select({
  value, onChange, options, placeholder, triggerClassName = "", panelClassName = "", align = "left", disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  triggerClassName?: string;
  panelClassName?: string;
  align?: "left" | "right";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const current = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName}`}>
        <span className={`truncate ${current ? "" : "text-[var(--t-text-20)]"}`}>{current?.label ?? placeholder ?? "—"}</span>
        <Icon icon={ChevronDown} size={10} strokeWidth={2}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>
      {open && (
        <div className={`absolute z-[100] mt-1 border border-[var(--t-border)] bg-[var(--t-surface)] rounded-xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6)] py-1 max-h-64 overflow-y-auto ${align === "right" ? "right-0" : "left-0"} ${panelClassName || "min-w-full"}`}>
          {placeholder && (
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-[var(--t-text-25)] hover:bg-[var(--t-glass-bg)] transition-colors whitespace-nowrap cursor-pointer">
              {placeholder}
            </button>
          )}
          {options.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors whitespace-nowrap cursor-pointer ${o.value === value ? "text-[#c9a84c] bg-[#c9a84c]/10" : "text-[var(--t-text-60)] hover:bg-[var(--t-glass-bg)]"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

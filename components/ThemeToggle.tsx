"use client";
import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

// Bascule sombre/clair pour l'app (dashboard + CRM) — persisté en local,
// appliqué via data-theme sur <html> (voir app/globals.css et lib/theme.ts).
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => { setTheme(getStoredTheme()); }, []);

  const choose = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };

  return (
    <div className="flex border border-[var(--t-border)] rounded-xl overflow-hidden">
      {([["dark", "Sombre"], ["light", "Clair"]] as const).map(([key, label]) => (
        <button key={key} type="button" onClick={() => choose(key)}
          className={`px-4 py-2 text-[0.65rem] tracking-[0.12em] uppercase transition-colors ${
            theme === key ? "bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] text-black" : "text-[var(--t-text-40)] hover:text-[var(--t-text-70)]"
          }`}>
          {label}
        </button>
      ))}
    </div>
  );
}

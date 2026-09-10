"use client";
import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Sun, Moon } from "@/lib/solarIcons";

// Bascule sombre/clair pour l'app (dashboard + CRM) — persisté en local, appliqué via
// data-theme sur <html> (voir app/globals.css et lib/theme.ts). Switch à curseur coulissant
// (soleil/lune) façon shadcn/ui plutôt que l'ancien segmented control texte "Sombre/Clair" :
// plus compact, et l'état se lit d'un coup d'oeil sans avoir à lire un mot.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  // Désactive la transition du curseur le temps du tout premier rendu (état par défaut avant
  // hydratation) — sans ça le curseur "saute" visiblement d'un bord à l'autre au chargement
  // si le thème stocké est "light".
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTheme(getStoredTheme()); setMounted(true); }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const isLight = theme === "light";

  return (
    <button type="button" onClick={toggle} aria-label={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
      className="relative w-[68px] h-9 rounded-full border border-[var(--t-border)] bg-[var(--t-surface-2)] shrink-0">
      <span className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
        <Icon icon={Moon} size={14} className="opacity-25 text-[var(--t-text-50)]"/>
        <Icon icon={Sun} size={14} className="opacity-25 text-[var(--t-text-50)]"/>
      </span>
      <span
        className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.5)] flex items-center justify-center ${mounted ? "transition-transform duration-300 ease-out" : ""}`}
        style={{ transform: isLight ? "translateX(32px)" : "translateX(0)" }}>
        <Icon icon={isLight ? Sun : Moon} size={15} className="text-black"/>
      </span>
    </button>
  );
}

"use client";
import { useRef, useState, useEffect } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Sun, Moon } from "@/lib/solarIcons";

// Distance parcourue par le curseur entre ses deux positions (px) — dérivée des classes du
// rail/curseur ci-dessous (rail 68px, curseur 28px, marge 4px de chaque côté : 68-4-4-28=32).
const TRAVEL = 32;
// En dessous de ce déplacement, un pointerdown/pointerup vaut un simple tap (géré par le
// onClick natif, cf. plus bas) plutôt qu'un vrai glissé.
const TAP_THRESHOLD = 6;

// Bascule sombre/clair pour l'app (dashboard + CRM) — persisté en local, appliqué via
// data-theme sur <html> (voir app/globals.css et lib/theme.ts). Switch à curseur coulissant
// (soleil/lune) façon shadcn/ui, glissable au doigt ou à la souris comme un vrai interrupteur
// plutôt qu'un simple bouton qui ne réagirait qu'au clic/tap.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  // Désactive la transition du curseur le temps du tout premier rendu (état par défaut avant
  // hydratation) — sans ça le curseur "saute" visiblement d'un bord à l'autre au chargement
  // si le thème stocké est "light".
  const [mounted, setMounted] = useState(false);
  // Position du curseur pendant un glissé en cours (px depuis le bord gauche) — null hors
  // glissé, auquel cas la position suit simplement l'état théme actuel.
  const [dragX, setDragX] = useState<number | null>(null);
  const dragInfo = useRef<{ startX: number; startPos: number; moved: boolean } | null>(null);
  // Empêche le "click" natif qui suit un pointerup de re-basculer ce qu'un vrai glissé
  // vient déjà de trancher (sinon : une bascule dans onPointerUp, une seconde dans onClick).
  const justDragged = useRef(false);

  useEffect(() => { setTheme(getStoredTheme()); setMounted(true); }, []);

  const commit = (next: Theme) => {
    setTheme(prev => {
      if (next !== prev) applyTheme(next);
      return next;
    });
  };
  const toggle = () => commit(theme === "dark" ? "light" : "dark");

  const onPointerMove = (e: PointerEvent) => {
    const info = dragInfo.current;
    if (!info) return;
    const delta = e.clientX - info.startX;
    if (Math.abs(delta) > TAP_THRESHOLD) info.moved = true;
    setDragX(Math.max(0, Math.min(TRAVEL, info.startPos + delta)));
  };
  const onPointerUp = (e: PointerEvent) => {
    const info = dragInfo.current;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    dragInfo.current = null;
    setDragX(null);
    if (!info) return;
    // Un simple tap (pas de déplacement significatif) est laissé au onClick natif ci-dessous —
    // sinon on double-bascule. Un vrai glissé se résout ici selon le bord le plus proche au
    // relâchement, calculé depuis la position de relâchement plutôt que depuis un état React
    // potentiellement pas encore à jour dans cette closure.
    if (info.moved) {
      justDragged.current = true;
      const finalPos = Math.max(0, Math.min(TRAVEL, info.startPos + (e.clientX - info.startX)));
      commit(finalPos > TRAVEL / 2 ? "light" : "dark");
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    justDragged.current = false;
    const startPos = theme === "light" ? TRAVEL : 0;
    dragInfo.current = { startX: e.clientX, startPos, moved: false };
    setDragX(startPos);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };
  const onClick = () => {
    if (justDragged.current) { justDragged.current = false; return; }
    toggle();
  };

  const isLight = theme === "light";
  const knobX = dragX ?? (isLight ? TRAVEL : 0);

  return (
    <button type="button" onPointerDown={onPointerDown} onClick={onClick}
      aria-label={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
      className="relative w-[68px] h-9 rounded-full border border-[var(--t-border)] bg-[var(--t-surface-2)] shrink-0 touch-none select-none">
      <span className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
        <Icon icon={Moon} size={14} className="opacity-25 text-[var(--t-text-50)]"/>
        <Icon icon={Sun} size={14} className="opacity-25 text-[var(--t-text-50)]"/>
      </span>
      <span
        className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-gradient-to-b from-[#e2c97e] to-[#c9a84c] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none ${mounted && dragX == null ? "transition-transform duration-300 ease-out" : ""}`}
        style={{ transform: `translateX(${knobX}px)` }}>
        <Icon icon={isLight ? Sun : Moon} size={15} className="text-black"/>
      </span>
    </button>
  );
}

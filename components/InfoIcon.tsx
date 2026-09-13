"use client";
import { useState } from "react";

// Icône "information" fournie par Samuel — un SVG statique (voir AddExerciceIcon.tsx pour
// l'historique). Même rebond au clic que le bouton "ajouter" (.animate-drop-pop, définie
// dans app/globals.css), pour une réaction cohérente entre les deux icônes.
export function InfoIcon({ size = 44 }: { size?: number }) {
  const [popping, setPopping] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons-rich/info-exercice.svg" alt="" width={size} height={size}
      onClick={() => setPopping(true)}
      onAnimationEnd={() => setPopping(false)}
      className={popping ? "animate-drop-pop" : ""}
      style={{ width: size, height: size }}/>
  );
}

"use client";
import { useState } from "react";

// Icône "ajouter" fournie par Samuel — un SVG statique (voir components/InfoIcon.tsx pour
// l'historique : un lecteur d'animation par ligne dans une liste de plusieurs dizaines
// d'exercices était trop lourd à charger). Le rebond au clic est fait en CSS pur
// (.animate-drop-pop, déjà définie dans app/globals.css) plutôt qu'en rejouant une
// animation Lottie — même effet perçu, sans le coût d'un moteur d'animation par icône.
// Le clic reste géré par le <button> englobant (cf. ExercicePicker.tsx) : cet onClick-ci
// ne fait que déclencher le rebond visuel, il ne bloque jamais la propagation.
export function AddExerciceIcon({ size = 44 }: { size?: number }) {
  const [popping, setPopping] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons-rich/add-exercice.svg" alt="" width={size} height={size}
      onClick={() => setPopping(true)}
      onAnimationEnd={() => setPopping(false)}
      className={popping ? "animate-drop-pop" : ""}
      style={{ width: size, height: size }}/>
  );
}

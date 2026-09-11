"use client";
import { Lottie } from "lottie-react";

// Rendu générique d'une icône Lottie figée sur une fenêtre de frames "posée" (animation
// d'entrée terminée, pas d'animation de sortie commencée) plutôt que jouée en boucle —
// utilisé pour les icônes fournies par Samuel (ajouter, information) dans des listes où
// en jouer des dizaines en boucle serait bruyant visuellement et coûteux sur mobile.
// `segment` est un prop de chargement (pas un lottieRef.seek() après coup) : un seek
// imperatif après montage ne s'applique pas de façon fiable et laisse l'icône bloquée sur
// sa toute première frame — cf. components/AddExerciceIcon.tsx.
export function LottieIcon({ src, segment, size = 44 }: { src: string; segment: [number, number]; size?: number }) {
  return (
    <Lottie
      src={src}
      autoplay
      loop={false}
      segment={segment}
      style={{ width: size, height: size, pointerEvents: "none" }}
    />
  );
}

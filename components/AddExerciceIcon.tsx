"use client";
import { LottieIcon } from "@/components/LottieIcon";

// Icône "ajouter" fournie par Samuel (animation Lottie : rond doré + croix blanche qui se
// dessine). Frame choisie à partir des keyframes du fichier
// (public/lottie/bouton-ajouter.json) : croix, cercle blanc et fond doré tiennent tous les
// trois à l'échelle 100% simultanément entre la frame 20 et la frame 27.
const REST_FRAME: [number, number] = [22, 25];

export function AddExerciceIcon({ size = 44 }: { size?: number }) {
  return <LottieIcon src="/lottie/bouton-ajouter.json" segment={REST_FRAME} size={size}/>;
}

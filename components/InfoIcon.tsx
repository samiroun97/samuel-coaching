"use client";
import { LottieIcon } from "@/components/LottieIcon";

// Icône "information" fournie par Samuel (animation Lottie : lettre "i" qui se dessine
// dans un cercle). D'après les keyframes du fichier
// (public/lottie/bouton-information.json), le dernier élément à finir de se dessiner
// (la lettre "i" elle-même) atteint son échelle finale à la frame 45, sans aucune
// animation de sortie dans la fenêtre visible de la composition (0-84 frames, 60 im/s) —
// la frame 60 tient donc une large marge de sécurité, bien après que tout soit posé.
const REST_FRAME: [number, number] = [58, 62];

export function InfoIcon({ size = 44 }: { size?: number }) {
  return <LottieIcon src="/lottie/bouton-information.json" segment={REST_FRAME} size={size}/>;
}

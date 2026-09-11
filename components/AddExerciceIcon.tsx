"use client";
import { useRef } from "react";
import { Lottie, type LottieHandle } from "lottie-react";

// Icône "ajouter" fournie par Samuel (animation Lottie : rond doré + croix blanche qui se
// dessine). Dans une liste de dizaines d'exercices, la jouer en boucle serait bruyant
// visuellement et coûteux sur mobile — on la fige donc sur sa frame la plus "posée" (le
// pop d'entrée est terminé, le pop de sortie n'a pas commencé) pour qu'elle serve
// d'icône statique plutôt que d'animation. Frame choisie à partir des keyframes du
// fichier (public/lottie/bouton-ajouter.json) : croix et fond doré tiennent tous les deux
// à l'échelle 100% entre ~frame 20 et ~frame 27.
const REST_FRAME = 23;

export function AddExerciceIcon({ size = 44 }: { size?: number }) {
  const lottieRef = useRef<LottieHandle>(null);
  return (
    <Lottie
      src="/lottie/bouton-ajouter.json"
      autoplay={false}
      loop={false}
      subscriptions={{ ready: () => lottieRef.current?.seek({ frame: REST_FRAME }) }}
      lottieRef={lottieRef}
      style={{ width: size, height: size, pointerEvents: "none" }}
    />
  );
}
